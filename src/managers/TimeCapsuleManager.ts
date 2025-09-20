import { App, TFile, Notice } from 'obsidian';

// 时间胶囊配置接口
export interface TimeCapsuleConfig {
	enabled: boolean;
	defaultDuration: number; // 分钟
	autoCollectClipboard: boolean;
	showNotifications: boolean;
	maxCapsules: number;
	enableAutoCleanup: boolean;
	cleanupInterval: number; // 毫秒
	enableEncryption: boolean;
	storageLocation: string;
}

// 时间胶囊数据接口
export interface TimeCapsuleData {
	id: string;
	title: string;
	content: string;
	type: 'text' | 'file' | 'clipboard' | 'selection';
	createdAt: number;
	expiresAt: number;
	isExpired: boolean;
	isOpened: boolean;
	openedAt?: number;
	metadata?: {
		sourceFile?: string;
		sourcePosition?: any;
		tags?: string[];
		[key: string]: any;
	};
}

// 时间胶囊事件接口
export interface TimeCapsuleEvent {
	type: 'created' | 'opened' | 'expired' | 'deleted';
	capsule: TimeCapsuleData;
	timestamp: number;
}

// 时间胶囊操作结果接口
export interface TimeCapsuleResult {
	success: boolean;
	capsule?: TimeCapsuleData;
	error?: string;
	timestamp: number;
}

// 时间胶囊策略接口
export interface TimeCapsuleStrategy {
	name: string;
	canHandle(type: string): boolean;
	createCapsule(data: Partial<TimeCapsuleData>): TimeCapsuleData;
	openCapsule(capsule: TimeCapsuleData): Promise<void>;
	validateCapsule(capsule: TimeCapsuleData): boolean;
}

// 文本时间胶囊策略
export class TextTimeCapsuleStrategy implements TimeCapsuleStrategy {
	name = 'text';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(type: string): boolean {
		return type === 'text' || type === 'clipboard' || type === 'selection';
	}

	createCapsule(data: Partial<TimeCapsuleData>): TimeCapsuleData {
		const now = Date.now();
		const duration = data.metadata?.duration || 60; // 默认60分钟
		
		return {
			id: this.generateId(),
			title: data.title || '文本时间胶囊',
			content: data.content || '',
			type: data.type || 'text',
			createdAt: now,
			expiresAt: now + (duration * 60 * 1000),
			isExpired: false,
			isOpened: false,
			metadata: {
				...data.metadata,
				wordCount: data.content?.length || 0,
				createdBy: 'TextTimeCapsuleStrategy'
			}
		};
	}

	async openCapsule(capsule: TimeCapsuleData): Promise<void> {
		// 创建临时文件显示内容
		const tempFileName = `时间胶囊-${capsule.title}-${new Date().toISOString().slice(0, 10)}.md`;
		const tempContent = `# ${capsule.title}\n\n创建时间: ${new Date(capsule.createdAt).toLocaleString()}\n到期时间: ${new Date(capsule.expiresAt).toLocaleString()}\n\n---\n\n${capsule.content}`;
		
		try {
			const tempFile = await this.app.vault.create(tempFileName, tempContent);
			// 打开文件
			const leaf = this.app.workspace.getUnpinnedLeaf();
			await leaf.openFile(tempFile);
			
			new Notice(`时间胶囊"${capsule.title}"已打开`);
		} catch (error) {
			console.error('Failed to open text capsule:', error);
			new Notice('打开时间胶囊失败');
		}
	}

	validateCapsule(capsule: TimeCapsuleData): boolean {
		return (
			typeof capsule.content === 'string' &&
			capsule.content.length > 0 &&
			capsule.content.length < 1000000 // 1MB限制
		);
	}

	private generateId(): string {
		return `text-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	}
}

// 文件时间胶囊策略
export class FileTimeCapsuleStrategy implements TimeCapsuleStrategy {
	name = 'file';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(type: string): boolean {
		return type === 'file';
	}

	createCapsule(data: Partial<TimeCapsuleData>): TimeCapsuleData {
		const now = Date.now();
		const duration = data.metadata?.duration || 60;
		
		return {
			id: this.generateId(),
			title: data.title || '文件时间胶囊',
			content: data.content || '',
			type: 'file',
			createdAt: now,
			expiresAt: now + (duration * 60 * 1000),
			isExpired: false,
			isOpened: false,
			metadata: {
				...data.metadata,
				fileSize: data.content?.length || 0,
				createdBy: 'FileTimeCapsuleStrategy'
			}
		};
	}

	async openCapsule(capsule: TimeCapsuleData): Promise<void> {
		try {
			// 如果是文件路径，尝试打开原文件
			if (capsule.metadata?.sourceFile) {
				const file = this.app.vault.getAbstractFileByPath(capsule.metadata.sourceFile);
				if (file instanceof TFile) {
					const leaf = this.app.workspace.getUnpinnedLeaf();
					await leaf.openFile(file);
					new Notice(`时间胶囊"${capsule.title}"已打开原文件`);
					return;
				}
			}
			
			// 否则创建临时文件
			const tempFileName = `时间胶囊-${capsule.title}-${new Date().toISOString().slice(0, 10)}.md`;
			const tempFile = await this.app.vault.create(tempFileName, capsule.content);
			const leaf = this.app.workspace.getUnpinnedLeaf();
			await leaf.openFile(tempFile);
			
			new Notice(`时间胶囊"${capsule.title}"已打开`);
		} catch (error) {
			console.error('Failed to open file capsule:', error);
			new Notice('打开时间胶囊失败');
		}
	}

	validateCapsule(capsule: TimeCapsuleData): boolean {
		return (
			typeof capsule.content === 'string' &&
			capsule.content.length > 0
		);
	}

	private generateId(): string {
		return `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	}
}

// 时间胶囊管理器主类
export class TimeCapsuleManager {
	private app: App;
	private config: TimeCapsuleConfig;
	private strategies: Map<string, TimeCapsuleStrategy> = new Map();
	private capsules: Map<string, TimeCapsuleData> = new Map();
	private cleanupTimer: NodeJS.Timeout | null = null;
	private clipboardWatcher: NodeJS.Timeout | null = null;
	private eventListeners: ((event: TimeCapsuleEvent) => void)[] = [];

	constructor(app: App, config: TimeCapsuleConfig) {
		this.app = app;
		this.config = config;
		
		this.initializeStrategies();
		this.setupCleanupTimer();
		this.setupClipboardWatcher();
		this.loadCapsules();
	}

	/**
	 * 初始化时间胶囊策略
	 */
	private initializeStrategies(): void {
		this.strategies.set('text', new TextTimeCapsuleStrategy(this.app));
		this.strategies.set('file', new FileTimeCapsuleStrategy(this.app));
	}

	/**
	 * 创建时间胶囊
	 */
	async createCapsule(data: Partial<TimeCapsuleData>): Promise<TimeCapsuleResult> {
		const startTime = Date.now();
		
		try {
			if (!this.config.enabled) {
				return {
					success: false,
					error: '时间胶囊功能未启用',
					timestamp: startTime
				};
			}

			// 检查胶囊数量限制
			if (this.capsules.size >= this.config.maxCapsules) {
				return {
					success: false,
					error: `时间胶囊数量已达上限 (${this.config.maxCapsules})`,
					timestamp: startTime
				};
			}

			// 查找合适的策略
			const strategy = this.findStrategy(data.type || 'text');
			if (!strategy) {
				return {
					success: false,
					error: `不支持的时间胶囊类型: ${data.type}`,
					timestamp: startTime
				};
			}

			// 创建胶囊
			const capsule = strategy.createCapsule(data);
			
			// 验证胶囊
			if (!strategy.validateCapsule(capsule)) {
				return {
					success: false,
					error: '时间胶囊数据验证失败',
					timestamp: startTime
				};
			}

			// 保存胶囊
			this.capsules.set(capsule.id, capsule);
			await this.saveCapsules();

			// 触发事件
			this.emitEvent({
				type: 'created',
				capsule,
				timestamp: Date.now()
			});

			if (this.config.showNotifications) {
				new Notice(`时间胶囊"${capsule.title}"已创建，将在${Math.round((capsule.expiresAt - capsule.createdAt) / 60000)}分钟后到期`);
			}

			return {
				success: true,
				capsule,
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
	 * 打开时间胶囊
	 */
	async openCapsule(capsuleId: string): Promise<TimeCapsuleResult> {
		const startTime = Date.now();
		
		try {
			const capsule = this.capsules.get(capsuleId);
			if (!capsule) {
				return {
					success: false,
					error: '时间胶囊不存在',
					timestamp: startTime
				};
			}

			// 检查是否已过期
			if (!capsule.isExpired && Date.now() < capsule.expiresAt) {
				return {
					success: false,
					error: '时间胶囊尚未到期',
					timestamp: startTime
				};
			}

			// 查找策略
			const strategy = this.findStrategy(capsule.type);
			if (!strategy) {
				return {
					success: false,
					error: `不支持的时间胶囊类型: ${capsule.type}`,
					timestamp: startTime
				};
			}

			// 打开胶囊
			await strategy.openCapsule(capsule);

			// 更新状态
			capsule.isOpened = true;
			capsule.openedAt = Date.now();
			await this.saveCapsules();

			// 触发事件
			this.emitEvent({
				type: 'opened',
				capsule,
				timestamp: Date.now()
			});

			return {
				success: true,
				capsule,
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
	 * 删除时间胶囊
	 */
	async deleteCapsule(capsuleId: string): Promise<TimeCapsuleResult> {
		const startTime = Date.now();
		
		try {
			const capsule = this.capsules.get(capsuleId);
			if (!capsule) {
				return {
					success: false,
					error: '时间胶囊不存在',
					timestamp: startTime
				};
			}

			this.capsules.delete(capsuleId);
			await this.saveCapsules();

			// 触发事件
			this.emitEvent({
				type: 'deleted',
				capsule,
				timestamp: Date.now()
			});

			if (this.config.showNotifications) {
				new Notice(`时间胶囊"${capsule.title}"已删除`);
			}

			return {
				success: true,
				capsule,
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
	 * 获取所有时间胶囊
	 */
	getAllCapsules(): TimeCapsuleData[] {
		return Array.from(this.capsules.values());
	}

	/**
	 * 获取已过期的时间胶囊
	 */
	getExpiredCapsules(): TimeCapsuleData[] {
		const now = Date.now();
		return this.getAllCapsules().filter(capsule => 
			!capsule.isOpened && (capsule.isExpired || now >= capsule.expiresAt)
		);
	}

	/**
	 * 获取活跃的时间胶囊
	 */
	getActiveCapsules(): TimeCapsuleData[] {
		const now = Date.now();
		return this.getAllCapsules().filter(capsule => 
			!capsule.isOpened && !capsule.isExpired && now < capsule.expiresAt
		);
	}

	/**
	 * 查找时间胶囊策略
	 */
	private findStrategy(type: string): TimeCapsuleStrategy | null {
		for (const strategy of this.strategies.values()) {
			if (strategy.canHandle(type)) {
				return strategy;
			}
		}
		return null;
	}

	/**
	 * 设置清理定时器
	 */
	private setupCleanupTimer(): void {
		if (!this.config.enableAutoCleanup) {
			return;
		}

		this.cleanupTimer = setInterval(() => {
			this.performCleanup();
		}, this.config.cleanupInterval);
	}

	/**
	 * 执行清理
	 */
	private async performCleanup(): Promise<void> {
		const now = Date.now();
		let cleanedCount = 0;

		for (const [id, capsule] of this.capsules.entries()) {
			// 标记过期的胶囊
			if (!capsule.isExpired && now >= capsule.expiresAt) {
				capsule.isExpired = true;
				
				// 触发过期事件
				this.emitEvent({
					type: 'expired',
					capsule,
					timestamp: now
				});

				if (this.config.showNotifications) {
					new Notice(`时间胶囊"${capsule.title}"已到期`);
				}
			}

			// 清理已打开且过期很久的胶囊
			if (capsule.isOpened && capsule.openedAt && 
				now - capsule.openedAt > 7 * 24 * 60 * 60 * 1000) { // 7天
				this.capsules.delete(id);
				cleanedCount++;
			}
		}

		if (cleanedCount > 0) {
			await this.saveCapsules();
			console.log(`Cleaned up ${cleanedCount} old time capsules`);
		}
	}

	/**
	 * 设置剪贴板监听器
	 */
	private setupClipboardWatcher(): void {
		if (!this.config.autoCollectClipboard) {
			return;
		}

		// 简单的剪贴板监听实现
		this.clipboardWatcher = setInterval(async () => {
			try {
				const clipboardText = await navigator.clipboard.readText();
				if (clipboardText && clipboardText.length > 10) {
					// 检查是否是新内容
					const lastClipboard = localStorage.getItem('canvas-grid-last-clipboard');
					if (clipboardText !== lastClipboard) {
						localStorage.setItem('canvas-grid-last-clipboard', clipboardText);
						
						// 自动创建剪贴板时间胶囊
						await this.createCapsule({
							title: '自动收集的剪贴板内容',
							content: clipboardText,
							type: 'clipboard',
							metadata: {
								duration: this.config.defaultDuration,
								autoCollected: true
							}
						});
					}
				}
			} catch (error) {
				// 忽略剪贴板访问错误
			}
		}, 5000); // 每5秒检查一次
	}

	/**
	 * 保存时间胶囊数据
	 */
	private async saveCapsules(): Promise<void> {
		try {
			const data = Array.from(this.capsules.values());
			const content = JSON.stringify(data, null, 2);
			
			const storageFile = this.config.storageLocation || 'time-capsules.json';
			const file = this.app.vault.getAbstractFileByPath(storageFile);
			
			if (file instanceof TFile) {
				await this.app.vault.modify(file, content);
			} else {
				await this.app.vault.create(storageFile, content);
			}
		} catch (error) {
			console.error('Failed to save time capsules:', error);
		}
	}

	/**
	 * 加载时间胶囊数据
	 */
	private async loadCapsules(): Promise<void> {
		try {
			const storageFile = this.config.storageLocation || 'time-capsules.json';
			const file = this.app.vault.getAbstractFileByPath(storageFile);
			
			if (file instanceof TFile) {
				const content = await this.app.vault.read(file);
				const data: TimeCapsuleData[] = JSON.parse(content);
				
				this.capsules.clear();
				data.forEach(capsule => {
					this.capsules.set(capsule.id, capsule);
				});
			}
		} catch (error) {
			console.log('No existing time capsules found or failed to load');
		}
	}

	/**
	 * 添加事件监听器
	 */
	addEventListener(listener: (event: TimeCapsuleEvent) => void): void {
		this.eventListeners.push(listener);
	}

	/**
	 * 移除事件监听器
	 */
	removeEventListener(listener: (event: TimeCapsuleEvent) => void): void {
		const index = this.eventListeners.indexOf(listener);
		if (index > -1) {
			this.eventListeners.splice(index, 1);
		}
	}

	/**
	 * 触发事件
	 */
	private emitEvent(event: TimeCapsuleEvent): void {
		this.eventListeners.forEach(listener => {
			try {
				listener(event);
			} catch (error) {
				console.error('Error in time capsule event listener:', error);
			}
		});
	}

	/**
	 * 注册时间胶囊策略
	 */
	registerStrategy(strategy: TimeCapsuleStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<TimeCapsuleConfig>): void {
		this.config = { ...this.config, ...config };
		
		// 重新设置定时器
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		if (this.clipboardWatcher) {
			clearInterval(this.clipboardWatcher);
			this.clipboardWatcher = null;
		}
		
		this.setupCleanupTimer();
		this.setupClipboardWatcher();
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		// 清理定时器
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		
		if (this.clipboardWatcher) {
			clearInterval(this.clipboardWatcher);
			this.clipboardWatcher = null;
		}
		
		// 清理数据
		this.capsules.clear();
		this.strategies.clear();
		this.eventListeners.length = 0;
	}
}
