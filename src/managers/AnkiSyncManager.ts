import { App, Notice, TFile } from 'obsidian';
import { AnkiConnectManager, AnkiConnectConfig, SyncResult } from './AnkiConnectManager';
import { AnkiFieldMapper } from './AnkiFieldMapper';
import { AnkiModelManager } from './AnkiModelManager';
import { GroupAnalysisManager } from './GroupAnalysisManager';
import { SyncProgress, SyncStatus, SyncOptions, SyncHistory, SyncedNodeInfo, AnkiNote } from '../types/AnkiTypes';
import { CanvasNode } from '../types/CanvasTypes';
import { GroupMemberFilterOptions } from '../types/GroupTypes';

/**
 * Anki同步管理器
 * 负责协调同步逻辑、进度管理、错误恢复
 */
export class AnkiSyncManager {
	private app: App;
	private ankiConnectManager: AnkiConnectManager;
	private ankiModelManager: AnkiModelManager;
	private ankiFieldMapper: AnkiFieldMapper;
	private groupAnalysisManager: GroupAnalysisManager;
	private config: AnkiConnectConfig;
	private syncHistory: SyncHistory;
	private currentSyncProgress: SyncProgress | null = null;
	private syncInProgress: boolean = false;
	private abortController: AbortController | null = null;

	// 事件回调
	private onProgressUpdate?: (progress: SyncProgress) => void;
	private onSyncComplete?: (result: SyncResult) => void;
	private onSyncError?: (error: string) => void;

	constructor(
		app: App,
		config: AnkiConnectConfig,
		syncHistory: SyncHistory,
		callbacks?: {
			onProgressUpdate?: (progress: SyncProgress) => void;
			onSyncComplete?: (result: SyncResult) => void;
			onSyncError?: (error: string) => void;
		}
	) {
		this.app = app;
		this.config = config;
		this.syncHistory = syncHistory;
		this.ankiConnectManager = new AnkiConnectManager(app, config);
		this.ankiModelManager = new AnkiModelManager(app, this.ankiConnectManager, config);
		this.ankiFieldMapper = new AnkiFieldMapper(app, config);
		this.groupAnalysisManager = new GroupAnalysisManager(app);

		// 设置回调函数
		if (callbacks) {
			this.onProgressUpdate = callbacks.onProgressUpdate;
			this.onSyncComplete = callbacks.onSyncComplete;
			this.onSyncError = callbacks.onSyncError;
		}
	}

	/**
	 * 同步选中的卡片
	 */
	async syncSelectedCards(nodeIds: string[], canvasNodes: CanvasNode[], canvasFile?: TFile): Promise<SyncResult> {
		const selectedNodes = canvasNodes.filter(node => nodeIds.includes(node.id));
		return this.performSync(selectedNodes, { nodeIds }, canvasFile);
	}

	/**
	 * 同步特定颜色的卡片
	 */
	async syncColorFilteredCards(colors: string[], canvasNodes: CanvasNode[], canvasFile?: TFile): Promise<SyncResult> {
		console.log(`AnkiSync: 开始颜色筛选同步，目标颜色: [${colors.join(', ')}]`);
		console.log(`AnkiSync: 总节点数: ${canvasNodes.length}`);

		// 现有的直接节点筛选（排除分组节点）
		const directNodes = canvasNodes.filter(node =>
			node.color && colors.includes(node.color) && node.type !== 'group'
		);

		// 新增：分组成员节点筛选
		const groupMemberNodes = this.getGroupMemberNodesWithColors(canvasNodes, colors);

		// 合并并去重所有符合条件的节点
		const allEligibleNodes = this.deduplicateNodes([...directNodes, ...groupMemberNodes]);

		console.log(`AnkiSync: 直接节点: ${directNodes.length}, 分组成员节点: ${groupMemberNodes.length}, 总计: ${allEligibleNodes.length}`);

		// 统计节点类型
		const nodeTypeStats = allEligibleNodes.reduce((stats, node) => {
			stats[node.type] = (stats[node.type] || 0) + 1;
			return stats;
		}, {} as Record<string, number>);

		console.log('AnkiSync: 节点类型统计:', nodeTypeStats);

		return this.performSync(allEligibleNodes, { colors }, canvasFile);
	}

	/**
	 * 执行增量同步
	 */
	async performIncrementalSync(canvasNodes: CanvasNode[], canvasFile?: TFile): Promise<SyncResult> {
		if (!this.config.enableIncrementalSync) {
			// 如果未启用增量同步，同步所有符合颜色条件的节点
			return this.syncColorFilteredCards(this.config.syncColors, canvasNodes, canvasFile);
		}

		// 筛选需要同步的节点（新增或修改的）
		const nodesToSync = this.filterNodesForIncrementalSync(canvasNodes);
		return this.performSync(nodesToSync, { forceUpdate: false }, canvasFile);
	}

	/**
	 * 验证同步数据
	 */
	validateSyncData(nodes: CanvasNode[]): boolean {
		if (!nodes || nodes.length === 0) {
			console.warn('AnkiSync: 没有节点数据需要同步');
			return false;
		}

		// 检查每个节点是否有必要的数据
		const validNodes = nodes.filter(node => this.isValidNode(node));

		if (validNodes.length === 0) {
			console.warn('AnkiSync: 没有有效的节点可以同步');
			console.log('AnkiSync: 节点验证详情:', nodes.map(node => ({
				id: node.id,
				type: node.type,
				hasContent: this.hasNodeContent(node),
				hasPosition: typeof node.x === 'number' && typeof node.y === 'number'
			})));
			return false;
		}

		if (validNodes.length < nodes.length) {
			console.warn(`AnkiSync: ${nodes.length - validNodes.length} 个节点验证失败，将同步 ${validNodes.length} 个有效节点`);
		}

		return true;
	}

	/**
	 * 验证单个节点是否有效
	 */
	private isValidNode(node: CanvasNode): boolean {
		// 首要检查：排除分组节点
		if (node.type === 'group') {
			return false;
		}

		// 检查基础字段
		if (!node.id || !node.type) {
			return false;
		}

		// 检查位置信息
		if (typeof node.x !== 'number' || typeof node.y !== 'number') {
			return false;
		}

		// 检查是否有内容
		return this.hasNodeContent(node);
	}

	/**
	 * 检查节点是否有内容
	 */
	private hasNodeContent(node: CanvasNode): boolean {
		switch (node.type) {
			case 'text':
				return !!(node.text && node.text.trim());
			case 'file':
				return !!(node.file && node.file.trim());
			case 'link':
				return !!(node.url && node.url.trim());
			case 'group':
				return !!(node.label && node.label.trim());
			default:
				// 对于未知类型，检查是否有任何内容
				return !!(node.text || node.file || node.url || node.label);
		}
	}

	/**
	 * 取消当前同步操作
	 */
	cancelSync(): void {
		if (this.syncInProgress && this.abortController) {
			this.abortController.abort();
			this.updateSyncProgress({
				status: SyncStatus.CANCELLED,
				current: 0,
				total: 0,
				message: '同步已取消',
				errors: []
			});
			this.syncInProgress = false;
		}
	}

	/**
	 * 获取当前同步进度
	 */
	getCurrentProgress(): SyncProgress | null {
		return this.currentSyncProgress;
	}

	/**
	 * 检查是否正在同步
	 */
	isSyncInProgress(): boolean {
		return this.syncInProgress;
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: AnkiConnectConfig): void {
		this.config = config;
		this.ankiConnectManager.updateConfig(config);
	}

	/**
	 * 更新同步历史
	 */
	updateSyncHistory(syncHistory: SyncHistory): void {
		this.syncHistory = syncHistory;
	}

	/**
	 * 执行同步的核心方法
	 */
	private async performSync(nodes: CanvasNode[], options: SyncOptions = {}, canvasFile?: TFile): Promise<SyncResult> {
		if (this.syncInProgress) {
			throw new Error('同步正在进行中，请等待完成');
		}

		// 验证数据
		if (!this.validateSyncData(nodes)) {
			throw new Error('同步数据验证失败：没有有效的节点可以同步');
		}

		// 过滤出有效节点
		const validNodes = nodes.filter(node => this.isValidNode(node));
		console.log(`AnkiSync: 原始节点数量: ${nodes.length}, 有效节点数量: ${validNodes.length}`);

		if (validNodes.length === 0) {
			throw new Error('同步数据验证失败：所有节点都无效');
		}

		// 检查连接
		const isConnected = await this.ankiConnectManager.testConnection();
		if (!isConnected) {
			throw new Error('无法连接到Anki Connect，请检查Anki是否运行');
		}

		// 确保插件专属模型存在
		console.log('AnkiSync: 检查插件专属模型');
		const modelReady = await this.ankiModelManager.ensurePluginModelExists();
		if (!modelReady) {
			throw new Error('无法创建或更新插件专属模型');
		}

		// 确保目标牌组存在
		console.log(`AnkiSync: 检查牌组 "${this.config.defaultDeck}" 是否存在`);
		const deckExists = await this.ankiConnectManager.ensureDeckExists(this.config.defaultDeck);
		if (!deckExists) {
			throw new Error(`无法创建或访问牌组 "${this.config.defaultDeck}"`);
		}

		this.syncInProgress = true;
		this.abortController = new AbortController();
		const startTime = Date.now();

		const result: SyncResult = {
			success: false,
			created: 0,
			updated: 0,
			skipped: 0,
			errors: [],
			totalProcessed: 0,
			duration: 0
		};

		try {
			// 初始化进度
			this.updateSyncProgress({
				status: SyncStatus.CONNECTING,
				current: 0,
				total: validNodes.length,
				message: '连接到Anki...',
				errors: []
			});

			// 开始同步
			this.updateSyncProgress({
				status: SyncStatus.SYNCING,
				current: 0,
				total: validNodes.length,
				message: `开始同步 ${validNodes.length} 个卡片...`,
				errors: []
			});

			// 分批处理有效节点
			const batchSize = options.batchSize || this.config.batchSize;
			const batches = this.createBatches(validNodes, batchSize);

			for (let i = 0; i < batches.length; i++) {
				// 检查是否被取消
				if (this.abortController.signal.aborted) {
					throw new Error('同步被用户取消');
				}

				const batch = batches[i];
				const batchResult = await this.processBatch(batch, i + 1, batches.length, canvasFile);

				// 更新结果
				result.created += batchResult.created;
				result.updated += batchResult.updated;
				result.skipped += batchResult.skipped;
				result.errors.push(...batchResult.errors);
				result.totalProcessed += batchResult.totalProcessed;

				// 更新进度
				const processedCount = (i + 1) * batchSize;
				this.updateSyncProgress({
					status: SyncStatus.SYNCING,
					current: Math.min(processedCount, nodes.length),
					total: nodes.length,
					message: `正在同步第 ${i + 1}/${batches.length} 批...`,
					errors: result.errors
				});
			}

			// 同步完成
			result.success = result.errors.length === 0 || result.created > 0 || result.updated > 0;
			result.duration = Date.now() - startTime;

			// 更新同步历史
			this.updateSyncHistoryAfterSync(nodes, result);

			// 完成进度更新
			this.updateSyncProgress({
				status: SyncStatus.COMPLETED,
				current: nodes.length,
				total: nodes.length,
				message: `同步完成！创建 ${result.created} 个，更新 ${result.updated} 个，跳过 ${result.skipped} 个`,
				errors: result.errors
			});

			// 触发完成回调
			if (this.onSyncComplete) {
				this.onSyncComplete(result);
			}

			return result;

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			result.errors.push(errorMessage);
			result.duration = Date.now() - startTime;

			// 更新错误状态
			this.updateSyncProgress({
				status: SyncStatus.ERROR,
				current: 0,
				total: nodes.length,
				message: `同步失败: ${errorMessage}`,
				errors: result.errors
			});

			// 触发错误回调
			if (this.onSyncError) {
				this.onSyncError(errorMessage);
			}

			throw error;
		} finally {
			this.syncInProgress = false;
			this.abortController = null;
		}
	}

	/**
	 * 筛选需要增量同步的节点
	 */
	private filterNodesForIncrementalSync(nodes: CanvasNode[]): CanvasNode[] {
		return nodes.filter(node => {
			// 首要检查：排除分组节点
			if (node.type === 'group') {
				return false;
			}

			// 检查颜色筛选
			if (!node.color || !this.config.syncColors.includes(node.color)) {
				return false;
			}

			// 检查是否需要同步
			const syncedInfo = this.syncHistory.syncedNodes[node.id];
			if (!syncedInfo) {
				// 新节点，需要同步
				return true;
			}

			// 检查是否有修改
			const nodeModified = this.getNodeLastModified(node);
			return nodeModified > syncedInfo.lastModified;
		});
	}

	/**
	 * 获取节点最后修改时间
	 */
	private getNodeLastModified(node: CanvasNode): number {
		// 这里可以根据实际情况实现节点修改时间的获取
		// 暂时使用当前时间作为默认值
		return Date.now();
	}

	/**
	 * 创建批次
	 */
	private createBatches<T>(items: T[], batchSize: number): T[][] {
		const batches: T[][] = [];
		for (let i = 0; i < items.length; i += batchSize) {
			batches.push(items.slice(i, i + batchSize));
		}
		return batches;
	}

	/**
	 * 处理单个批次
	 */
	private async processBatch(nodes: CanvasNode[], batchIndex: number, totalBatches: number, canvasFile?: TFile): Promise<SyncResult> {
		const startTime = Date.now();
		const result: SyncResult = {
			success: true,
			created: 0,
			updated: 0,
			skipped: 0,
			errors: [],
			totalProcessed: 0,
			duration: 0
		};

		console.log(`AnkiSync: 处理第 ${batchIndex}/${totalBatches} 批，节点数量: ${nodes.length}`);

		// 处理每个节点
		for (const node of nodes) {
			try {
				// 检查是否被取消
				if (this.abortController && this.abortController.signal.aborted) {
					throw new Error('同步被用户取消');
				}

				// 转换节点为Anki卡片（使用插件专属模型）
				const conversionResult = this.ankiFieldMapper.mapNodeToAnkiNote(node, canvasFile, this.config.contentDivider);

				if (!conversionResult.success) {
					console.warn(`AnkiSync: 节点转换失败 ${node.id}:`, conversionResult.error);
					result.errors.push(`节点 ${node.id} 转换失败: ${conversionResult.error}`);
					result.skipped++;
					continue;
				}

				const ankiNote = conversionResult.ankiNote!;
				console.log(`AnkiSync: 准备同步节点 ${node.id}, 类型: ${node.type}`);
				console.log(`AnkiSync: ObsidianLink字段值:`, ankiNote.fields['ObsidianLink'] || '(空)');

				// 检查是否需要增量同步
				if (this.config.enableIncrementalSync && !this.config.forceSync) {
					const existingSync = this.syncHistory.syncedNodes[node.id];
					if (existingSync) {
						const currentHash = this.generateContentHash(node);
						console.log(`AnkiSync: 节点 ${node.id} 内容哈希对比 - 当前: ${currentHash}, 历史: ${existingSync.contentHash}`);

						if (currentHash === existingSync.contentHash) {
							console.log(`AnkiSync: 节点 ${node.id} 内容未变化，跳过同步`);
							result.skipped++;
							continue;
						} else {
							console.log(`AnkiSync: 节点 ${node.id} 内容已变化，需要更新`);
						}
					} else {
						console.log(`AnkiSync: 节点 ${node.id} 是新节点，需要创建`);
					}
				} else if (this.config.forceSync) {
					console.log(`AnkiSync: 强制同步模式，节点 ${node.id} 将被强制同步`);
				}

				// 检查是否需要更新现有卡片
				const existingSync = this.syncHistory.syncedNodes[node.id];
				let noteId: number | null = null;
				let isUpdate = false;

				if (existingSync && existingSync.ankiNoteId) {
					// 尝试更新现有卡片
					console.log(`AnkiSync: 尝试更新现有卡片 ${existingSync.ankiNoteId} for 节点 ${node.id}`);

					// 检查卡片是否仍然存在
					const noteExists = await this.ankiConnectManager.noteExists(existingSync.ankiNoteId);

					if (noteExists) {
						// 更新现有卡片
						const updateSuccess = await this.ankiConnectManager.updateNote(existingSync.ankiNoteId, ankiNote);
						if (updateSuccess) {
							noteId = existingSync.ankiNoteId;
							isUpdate = true;
							console.log(`AnkiSync: 成功更新卡片 ${noteId} for 节点 ${node.id}`);
							result.updated++;
						} else {
							console.warn(`AnkiSync: 更新卡片失败，尝试创建新卡片 for 节点 ${node.id}`);
							// 更新失败，创建新卡片
							noteId = await this.ankiConnectManager.addNote(ankiNote);
							if (noteId) {
								console.log(`AnkiSync: 成功创建新卡片 ${noteId} for 节点 ${node.id}`);
								result.created++;
							}
						}
					} else {
						console.log(`AnkiSync: 原卡片不存在，创建新卡片 for 节点 ${node.id}`);
						// 原卡片不存在，创建新卡片
						noteId = await this.ankiConnectManager.addNote(ankiNote);
						if (noteId) {
							console.log(`AnkiSync: 成功创建新卡片 ${noteId} for 节点 ${node.id}`);
							result.created++;
						}
					}
				} else {
					// 创建新卡片
					console.log(`AnkiSync: 创建新卡片 for 节点 ${node.id}`);
					noteId = await this.ankiConnectManager.addNote(ankiNote);
					if (noteId) {
						console.log(`AnkiSync: 成功创建卡片 ${noteId} for 节点 ${node.id}`);
						result.created++;
					}
				}

				if (noteId) {
					// 更新同步历史
					this.syncHistory.syncedNodes[node.id] = {
						nodeId: node.id,
						ankiNoteId: noteId,
						lastModified: this.getNodeLastModified(node),
						contentHash: this.generateContentHash(node),
						syncTime: Date.now()
					};
				} else {
					console.warn(`AnkiSync: ${isUpdate ? '更新' : '创建'}卡片失败 for 节点 ${node.id}`);
					result.errors.push(`节点 ${node.id} ${isUpdate ? '更新' : '创建'}卡片失败`);
					result.skipped++;
				}

				result.totalProcessed++;

			} catch (error) {
				console.error(`AnkiSync: 处理节点 ${node.id} 时出错:`, error);
				result.errors.push(`节点 ${node.id} 处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
				result.skipped++;
			}
		}

		result.duration = Date.now() - startTime;
		result.success = result.errors.length === 0 || result.created > 0;

		console.log(`AnkiSync: 批次 ${batchIndex} 完成 - 创建: ${result.created}, 跳过: ${result.skipped}, 错误: ${result.errors.length}`);

		return result;
	}

	/**
	 * 更新同步进度
	 */
	private updateSyncProgress(progress: SyncProgress): void {
		this.currentSyncProgress = progress;
		if (this.onProgressUpdate) {
			this.onProgressUpdate(progress);
		}
	}

	/**
	 * 同步完成后更新历史记录
	 */
	private updateSyncHistoryAfterSync(nodes: CanvasNode[], result: SyncResult): void {
		const now = Date.now();
		this.syncHistory.lastSyncTime = now;
		this.syncHistory.lastSyncResult = result;

		// 更新成功同步的节点记录
		nodes.forEach(node => {
			if (!result.errors.some(error => error.includes(node.id))) {
				this.syncHistory.syncedNodes[node.id] = {
					nodeId: node.id,
					ankiNoteId: 0, // 这里需要从实际同步结果中获取
					lastModified: this.getNodeLastModified(node),
					contentHash: this.generateContentHash(node),
					syncTime: now
				};
			}
		});

		// 清理失败节点列表中已成功的节点
		this.syncHistory.failedNodes = this.syncHistory.failedNodes.filter(nodeId => 
			!nodes.some(node => node.id === nodeId) || 
			result.errors.some(error => error.includes(nodeId))
		);
	}

	/**
	 * 获取分组成员节点（按颜色筛选）
	 */
	private getGroupMemberNodesWithColors(canvasNodes: CanvasNode[], colors: string[]): CanvasNode[] {
		const filterOptions: GroupMemberFilterOptions = {
			includeColors: colors,
			excludeTypes: ['group'], // 确保不包含分组节点本身
			includeNestedMembers: true // 包含嵌套分组的成员
		};

		const groupMemberNodes = this.groupAnalysisManager.getAllGroupMemberNodes(canvasNodes, filterOptions);

		console.log(`AnkiSync: 分组分析完成，找到 ${groupMemberNodes.length} 个符合颜色条件的分组成员节点`);

		return groupMemberNodes;
	}

	/**
	 * 去重节点数组（基于节点ID）
	 */
	private deduplicateNodes(nodes: CanvasNode[]): CanvasNode[] {
		const seen = new Set<string>();
		const uniqueNodes: CanvasNode[] = [];

		for (const node of nodes) {
			if (!seen.has(node.id)) {
				seen.add(node.id);
				uniqueNodes.push(node);
			}
		}

		if (nodes.length !== uniqueNodes.length) {
			console.log(`AnkiSync: 去重完成，原始: ${nodes.length}, 去重后: ${uniqueNodes.length}`);
		}

		return uniqueNodes;
	}

	/**
	 * 生成节点内容哈希
	 */
	private generateContentHash(node: CanvasNode): string {
		const content = JSON.stringify({
			type: node.type,
			text: node.text,
			file: node.file,
			url: node.url,
			color: node.color
		});

		// 简单哈希函数
		let hash = 0;
		for (let i = 0; i < content.length; i++) {
			const char = content.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // 转换为32位整数
		}
		return hash.toString();
	}
}
