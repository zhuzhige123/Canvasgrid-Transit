import { App, TFile, Notice } from 'obsidian';

// Canvas API配置接口
export interface CanvasAPIConfig {
	enableAutoSave: boolean;
	autoSaveInterval: number; // 毫秒
	enableVersionControl: boolean;
	maxBackupVersions: number;
	enableConflictResolution: boolean;
	syncMode: 'manual' | 'auto' | 'realtime';
}

// Canvas数据接口
export interface CanvasData {
	nodes: CanvasNode[];
	edges: CanvasEdge[];
	metadata?: {
		version: string;
		created: string;
		modified: string;
		author?: string;
		[key: string]: any;
	};
}

// Canvas节点接口
export interface CanvasNode {
	id: string;
	type: 'text' | 'file' | 'link' | 'group';
	x: number;
	y: number;
	width: number;
	height: number;
	color?: string;
	text?: string;
	file?: string;
	url?: string;
	subpath?: string;
}

// Canvas边接口
export interface CanvasEdge {
	id: string;
	fromNode: string;
	fromSide: 'top' | 'right' | 'bottom' | 'left';
	toNode: string;
	toSide: 'top' | 'right' | 'bottom' | 'left';
	color?: string;
	label?: string;
}

// Canvas操作结果接口
export interface CanvasOperationResult {
	success: boolean;
	data?: any;
	error?: string;
	timestamp: number;
}

// Canvas版本信息接口
export interface CanvasVersion {
	version: string;
	timestamp: number;
	author?: string;
	changes: string[];
	data: CanvasData;
}

// Canvas API策略接口
export interface CanvasAPIStrategy {
	name: string;
	loadCanvas(file: TFile): Promise<CanvasData>;
	saveCanvas(file: TFile, data: CanvasData): Promise<boolean>;
	validateCanvas(data: any): boolean;
	migrateCanvas?(data: any, fromVersion: string, toVersion: string): CanvasData;
}

// 标准Canvas API策略
export class StandardCanvasAPIStrategy implements CanvasAPIStrategy {
	name = 'standard';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async loadCanvas(file: TFile): Promise<CanvasData> {
		try {
			const content = await this.app.vault.read(file);
			const rawData = JSON.parse(content);
			
			if (!this.validateCanvas(rawData)) {
				throw new Error('Invalid canvas format');
			}

			return this.normalizeCanvasData(rawData);
		} catch (error) {
			throw new Error(`Failed to load canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async saveCanvas(file: TFile, data: CanvasData): Promise<boolean> {
		try {
			// 添加元数据
			const dataWithMetadata = {
				...data,
				metadata: {
					...data.metadata,
					modified: new Date().toISOString(),
					version: '1.0'
				}
			};

			const content = JSON.stringify(dataWithMetadata, null, 2);
			await this.app.vault.modify(file, content);
			return true;
		} catch (error) {
			console.error('Failed to save canvas:', error);
			return false;
		}
	}

	validateCanvas(data: any): boolean {
		if (!data || typeof data !== 'object') {
			return false;
		}

		// 检查必需的字段
		if (!Array.isArray(data.nodes)) {
			return false;
		}

		if (!Array.isArray(data.edges)) {
			return false;
		}

		// 验证节点格式
		for (const node of data.nodes) {
			if (!this.validateNode(node)) {
				return false;
			}
		}

		// 验证边格式
		for (const edge of data.edges) {
			if (!this.validateEdge(edge)) {
				return false;
			}
		}

		return true;
	}

	private validateNode(node: any): boolean {
		return (
			typeof node.id === 'string' &&
			typeof node.type === 'string' &&
			typeof node.x === 'number' &&
			typeof node.y === 'number' &&
			typeof node.width === 'number' &&
			typeof node.height === 'number'
		);
	}

	private validateEdge(edge: any): boolean {
		return (
			typeof edge.id === 'string' &&
			typeof edge.fromNode === 'string' &&
			typeof edge.toNode === 'string' &&
			typeof edge.fromSide === 'string' &&
			typeof edge.toSide === 'string'
		);
	}

	private normalizeCanvasData(rawData: any): CanvasData {
		return {
			nodes: rawData.nodes || [],
			edges: rawData.edges || [],
			metadata: {
				version: rawData.metadata?.version || '1.0',
				created: rawData.metadata?.created || new Date().toISOString(),
				modified: rawData.metadata?.modified || new Date().toISOString(),
				...rawData.metadata
			}
		};
	}
}

// 增强Canvas API策略（支持更多功能）
export class EnhancedCanvasAPIStrategy implements CanvasAPIStrategy {
	name = 'enhanced';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async loadCanvas(file: TFile): Promise<CanvasData> {
		try {
			const content = await this.app.vault.read(file);
			const rawData = JSON.parse(content);
			
			if (!this.validateCanvas(rawData)) {
				throw new Error('Invalid canvas format');
			}

			// 增强处理：自动修复和优化
			return this.enhanceCanvasData(rawData);
		} catch (error) {
			throw new Error(`Failed to load canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async saveCanvas(file: TFile, data: CanvasData): Promise<boolean> {
		try {
			// 增强保存：压缩和优化
			const optimizedData = this.optimizeCanvasData(data);
			
			const dataWithMetadata = {
				...optimizedData,
				metadata: {
					...optimizedData.metadata,
					modified: new Date().toISOString(),
					version: '2.0',
					optimized: true
				}
			};

			const content = JSON.stringify(dataWithMetadata, null, 2);
			await this.app.vault.modify(file, content);
			return true;
		} catch (error) {
			console.error('Failed to save canvas:', error);
			return false;
		}
	}

	validateCanvas(data: any): boolean {
		// 使用标准验证逻辑
		const standardStrategy = new StandardCanvasAPIStrategy(this.app);
		return standardStrategy.validateCanvas(data);
	}

	migrateCanvas(data: any, fromVersion: string, toVersion: string): CanvasData {
		// 版本迁移逻辑
		let migratedData = { ...data };

		if (fromVersion === '1.0' && toVersion === '2.0') {
			// 添加新的元数据字段
			migratedData.metadata = {
				...migratedData.metadata,
				migrated: true,
				migratedFrom: fromVersion,
				migratedAt: new Date().toISOString()
			};

			// 优化节点数据
			migratedData.nodes = migratedData.nodes.map((node: any) => ({
				...node,
				optimized: true
			}));
		}

		return migratedData;
	}

	private enhanceCanvasData(rawData: any): CanvasData {
		// 自动修复缺失的ID
		const nodes = rawData.nodes.map((node: any) => ({
			...node,
			id: node.id || this.generateId()
		}));

		const edges = rawData.edges.map((edge: any) => ({
			...edge,
			id: edge.id || this.generateId()
		}));

		return {
			nodes,
			edges,
			metadata: {
				version: rawData.metadata?.version || '2.0',
				created: rawData.metadata?.created || new Date().toISOString(),
				modified: rawData.metadata?.modified || new Date().toISOString(),
				enhanced: true,
				...rawData.metadata
			}
		};
	}

	private optimizeCanvasData(data: CanvasData): CanvasData {
		// 移除重复的节点
		const uniqueNodes = data.nodes.filter((node, index, array) => 
			array.findIndex(n => n.id === node.id) === index
		);

		// 移除无效的边（指向不存在节点的边）
		const nodeIds = new Set(uniqueNodes.map(node => node.id));
		const validEdges = data.edges.filter(edge => 
			nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode)
		);

		return {
			nodes: uniqueNodes,
			edges: validEdges,
			metadata: {
				version: data.metadata?.version || '2.0',
				created: data.metadata?.created || new Date().toISOString(),
				modified: data.metadata?.modified || new Date().toISOString(),
				...data.metadata,
				optimized: true,
				optimizedAt: new Date().toISOString()
			}
		};
	}

	private generateId(): string {
		return Math.random().toString(36).substring(2, 15) + 
			   Math.random().toString(36).substring(2, 15);
	}
}

// Canvas API管理器主类
export class CanvasAPIManager {
	private app: App;
	private config: CanvasAPIConfig;
	private strategies: Map<string, CanvasAPIStrategy> = new Map();
	private currentStrategy: CanvasAPIStrategy;
	private versionHistory: Map<string, CanvasVersion[]> = new Map();
	private autoSaveTimer: NodeJS.Timeout | null = null;

	constructor(app: App, config: CanvasAPIConfig) {
		this.app = app;
		this.config = config;
		
		// 初始化策略
		this.initializeStrategies();
		this.currentStrategy = this.strategies.get('enhanced')!;
		
		// 设置自动保存
		if (config.enableAutoSave) {
			this.setupAutoSave();
		}
	}

	/**
	 * 初始化Canvas API策略
	 */
	private initializeStrategies(): void {
		this.strategies.set('standard', new StandardCanvasAPIStrategy(this.app));
		this.strategies.set('enhanced', new EnhancedCanvasAPIStrategy(this.app));
	}

	/**
	 * 加载Canvas文件
	 */
	async loadCanvas(file: TFile): Promise<CanvasOperationResult> {
		const startTime = Date.now();
		
		try {
			const data = await this.currentStrategy.loadCanvas(file);
			
			// 保存版本历史
			if (this.config.enableVersionControl) {
				this.saveVersion(file.path, data);
			}
			
			return {
				success: true,
				data,
				timestamp: startTime
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: startTime
			};
		}
	}

	/**
	 * 保存Canvas文件
	 */
	async saveCanvas(file: TFile, data: CanvasData): Promise<CanvasOperationResult> {
		const startTime = Date.now();
		
		try {
			const success = await this.currentStrategy.saveCanvas(file, data);
			
			if (success && this.config.enableVersionControl) {
				this.saveVersion(file.path, data);
			}
			
			return {
				success,
				data: success ? data : undefined,
				timestamp: startTime
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: startTime
			};
		}
	}

	/**
	 * 验证Canvas数据
	 */
	validateCanvas(data: any): boolean {
		return this.currentStrategy.validateCanvas(data);
	}

	/**
	 * 切换API策略
	 */
	setStrategy(strategyName: string): boolean {
		const strategy = this.strategies.get(strategyName);
		if (strategy) {
			this.currentStrategy = strategy;
			return true;
		}
		return false;
	}

	/**
	 * 获取当前策略名称
	 */
	getCurrentStrategy(): string {
		return this.currentStrategy.name;
	}

	/**
	 * 获取可用策略
	 */
	getAvailableStrategies(): string[] {
		return Array.from(this.strategies.keys());
	}

	/**
	 * 保存版本历史
	 */
	private saveVersion(filePath: string, data: CanvasData): void {
		if (!this.versionHistory.has(filePath)) {
			this.versionHistory.set(filePath, []);
		}
		
		const versions = this.versionHistory.get(filePath)!;
		const version: CanvasVersion = {
			version: `v${versions.length + 1}`,
			timestamp: Date.now(),
			changes: ['Auto-saved version'],
			data: JSON.parse(JSON.stringify(data)) // 深拷贝
		};
		
		versions.push(version);
		
		// 限制版本数量
		if (versions.length > this.config.maxBackupVersions) {
			versions.shift();
		}
	}

	/**
	 * 获取版本历史
	 */
	getVersionHistory(filePath: string): CanvasVersion[] {
		return this.versionHistory.get(filePath) || [];
	}

	/**
	 * 恢复到指定版本
	 */
	async restoreVersion(file: TFile, version: string): Promise<CanvasOperationResult> {
		const versions = this.versionHistory.get(file.path);
		if (!versions) {
			return {
				success: false,
				error: 'No version history found',
				timestamp: Date.now()
			};
		}
		
		const targetVersion = versions.find(v => v.version === version);
		if (!targetVersion) {
			return {
				success: false,
				error: `Version ${version} not found`,
				timestamp: Date.now()
			};
		}
		
		return this.saveCanvas(file, targetVersion.data);
	}

	/**
	 * 设置自动保存
	 */
	private setupAutoSave(): void {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer);
		}
		
		this.autoSaveTimer = setInterval(() => {
			// 自动保存逻辑将在需要时实现
			console.log('Auto-save triggered');
		}, this.config.autoSaveInterval);
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<CanvasAPIConfig>): void {
		this.config = { ...this.config, ...config };
		
		if (config.enableAutoSave !== undefined) {
			if (config.enableAutoSave) {
				this.setupAutoSave();
			} else if (this.autoSaveTimer) {
				clearInterval(this.autoSaveTimer);
				this.autoSaveTimer = null;
			}
		}
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer);
			this.autoSaveTimer = null;
		}
		
		this.versionHistory.clear();
		this.strategies.clear();
	}
}
