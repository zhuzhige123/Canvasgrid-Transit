import { App, TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';

// 导航配置接口
export interface NavigationConfig {
	enableBreadcrumbs: boolean;
	enableBackForward: boolean;
	enableQuickJump: boolean;
	maxHistorySize: number;
	enableKeyboardShortcuts: boolean;
	shortcuts: NavigationShortcuts;
	enableContextMenu: boolean;
	enableMinimap: boolean;
}

// 导航快捷键配置
export interface NavigationShortcuts {
	back: string;
	forward: string;
	home: string;
	search: string;
	jumpToFile: string;
	jumpToLine: string;
}

// 导航历史项接口
export interface NavigationHistoryItem {
	id: string;
	file: string;
	position?: {
		line: number;
		ch: number;
	};
	timestamp: number;
	title: string;
	type: 'canvas' | 'markdown' | 'grid';
}

// 导航结果接口
export interface NavigationResult {
	success: boolean;
	destination?: string;
	error?: string;
	timestamp: number;
}

// 导航策略接口
export interface NavigationStrategy {
	name: string;
	canHandle(destination: string): boolean;
	navigate(destination: string, options?: NavigationOptions): Promise<NavigationResult>;
	getDisplayName(destination: string): string;
}

// 导航选项接口
export interface NavigationOptions {
	newTab?: boolean;
	split?: 'horizontal' | 'vertical';
	focus?: boolean;
	position?: {
		line: number;
		ch: number;
	};
}

// 文件导航策略
export class FileNavigationStrategy implements NavigationStrategy {
	name = 'file';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(destination: string): boolean {
		return destination.endsWith('.md') || destination.endsWith('.canvas') || 
			   this.app.vault.getAbstractFileByPath(destination) !== null;
	}

	async navigate(destination: string, options: NavigationOptions = {}): Promise<NavigationResult> {
		const startTime = Date.now();
		
		try {
			const file = this.app.vault.getAbstractFileByPath(destination);
			if (!file || !(file instanceof TFile)) {
				return {
					success: false,
					error: `文件不存在: ${destination}`,
					timestamp: startTime
				};
			}

			let leaf: WorkspaceLeaf;
			
			if (options.newTab) {
				leaf = this.app.workspace.getLeaf('tab');
			} else if (options.split) {
				leaf = this.app.workspace.getLeaf('split', options.split === 'horizontal' ? 'horizontal' : 'vertical');
			} else {
				leaf = this.app.workspace.getUnpinnedLeaf();
			}

			await leaf.openFile(file);

			// 如果指定了位置，跳转到该位置
			if (options.position && leaf.view instanceof MarkdownView) {
				const editor = leaf.view.editor;
				editor.setCursor(options.position);
				editor.scrollIntoView({
					from: options.position,
					to: options.position
				}, true);
			}

			if (options.focus !== false) {
				this.app.workspace.setActiveLeaf(leaf);
			}

			return {
				success: true,
				destination: file.path,
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

	getDisplayName(destination: string): string {
		const file = this.app.vault.getAbstractFileByPath(destination);
		return file ? file.name.replace(/\.[^/.]+$/, '') : destination;
	}
}

// URL导航策略
export class URLNavigationStrategy implements NavigationStrategy {
	name = 'url';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(destination: string): boolean {
		return destination.startsWith('http://') || destination.startsWith('https://') ||
			   destination.startsWith('obsidian://');
	}

	async navigate(destination: string, options: NavigationOptions = {}): Promise<NavigationResult> {
		const startTime = Date.now();
		
		try {
			if (destination.startsWith('obsidian://')) {
				// 处理Obsidian内部链接
				window.open(destination);
			} else {
				// 处理外部URL
				window.open(destination, options.newTab ? '_blank' : '_self');
			}

			return {
				success: true,
				destination,
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

	getDisplayName(destination: string): string {
		try {
			const url = new URL(destination);
			return url.hostname;
		} catch {
			return destination;
		}
	}
}

// 块引用导航策略
export class BlockReferenceNavigationStrategy implements NavigationStrategy {
	name = 'block';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(destination: string): boolean {
		return destination.includes('#^') || Boolean(destination.match(/\[\[.*#\^.*\]\]/));
	}

	async navigate(destination: string, options: NavigationOptions = {}): Promise<NavigationResult> {
		const startTime = Date.now();
		
		try {
			// 解析块引用
			const match = destination.match(/\[\[(.*?)#\^(.*?)\]\]/) || 
						  destination.match(/(.*?)#\^(.*)/);
			
			if (!match) {
				return {
					success: false,
					error: '无效的块引用格式',
					timestamp: startTime
				};
			}

			const [, filePath, blockId] = match;
			const file = this.app.vault.getAbstractFileByPath(filePath + '.md') ||
						 this.app.vault.getAbstractFileByPath(filePath);

			if (!file || !(file instanceof TFile)) {
				return {
					success: false,
					error: `文件不存在: ${filePath}`,
					timestamp: startTime
				};
			}

			// 打开文件
			const leaf = options.newTab ? 
				this.app.workspace.getLeaf('tab') : 
				this.app.workspace.getUnpinnedLeaf();
			
			await leaf.openFile(file);

			// 查找块引用位置
			if (leaf.view instanceof MarkdownView) {
				const content = await this.app.vault.read(file);
				const lines = content.split('\n');
				
				for (let i = 0; i < lines.length; i++) {
					if (lines[i].includes(`^${blockId}`)) {
						const editor = leaf.view.editor;
						const position = { line: i, ch: 0 };
						editor.setCursor(position);
						editor.scrollIntoView({
							from: position,
							to: position
						}, true);
						break;
					}
				}
			}

			if (options.focus !== false) {
				this.app.workspace.setActiveLeaf(leaf);
			}

			return {
				success: true,
				destination: `${file.path}#^${blockId}`,
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

	getDisplayName(destination: string): string {
		const match = destination.match(/\[\[(.*?)#\^(.*?)\]\]/) || 
					  destination.match(/(.*?)#\^(.*)/);
		
		if (match) {
			const [, filePath, blockId] = match;
			return `${filePath}#^${blockId.substring(0, 8)}...`;
		}
		
		return destination;
	}
}

// 导航管理器主类
export class NavigationManager {
	private app: App;
	private config: NavigationConfig;
	private strategies: Map<string, NavigationStrategy> = new Map();
	private history: NavigationHistoryItem[] = [];
	private currentIndex: number = -1;
	private breadcrumbs: NavigationHistoryItem[] = [];

	constructor(app: App, config: NavigationConfig) {
		this.app = app;
		this.config = config;
		
		this.initializeStrategies();
		this.setupKeyboardShortcuts();
		this.loadHistory();
	}

	/**
	 * 初始化导航策略
	 */
	private initializeStrategies(): void {
		this.strategies.set('file', new FileNavigationStrategy(this.app));
		this.strategies.set('url', new URLNavigationStrategy(this.app));
		this.strategies.set('block', new BlockReferenceNavigationStrategy(this.app));
	}

	/**
	 * 导航到指定目标
	 */
	async navigateTo(destination: string, options: NavigationOptions = {}): Promise<NavigationResult> {
		const strategy = this.findStrategy(destination);
		if (!strategy) {
			return {
				success: false,
				error: `不支持的导航目标: ${destination}`,
				timestamp: Date.now()
			};
		}

		const result = await strategy.navigate(destination, options);
		
		if (result.success) {
			this.addToHistory({
				id: this.generateId(),
				file: destination,
				position: options.position,
				timestamp: result.timestamp,
				title: strategy.getDisplayName(destination),
				type: this.getNavigationType(destination)
			});
		}

		return result;
	}

	/**
	 * 后退导航
	 */
	async goBack(): Promise<NavigationResult> {
		if (!this.canGoBack()) {
			return {
				success: false,
				error: '没有可后退的历史记录',
				timestamp: Date.now()
			};
		}

		this.currentIndex--;
		const item = this.history[this.currentIndex];
		return await this.navigateTo(item.file, { position: item.position });
	}

	/**
	 * 前进导航
	 */
	async goForward(): Promise<NavigationResult> {
		if (!this.canGoForward()) {
			return {
				success: false,
				error: '没有可前进的历史记录',
				timestamp: Date.now()
			};
		}

		this.currentIndex++;
		const item = this.history[this.currentIndex];
		return await this.navigateTo(item.file, { position: item.position });
	}

	/**
	 * 检查是否可以后退
	 */
	canGoBack(): boolean {
		return this.currentIndex > 0;
	}

	/**
	 * 检查是否可以前进
	 */
	canGoForward(): boolean {
		return this.currentIndex < this.history.length - 1;
	}

	/**
	 * 获取导航历史
	 */
	getHistory(): NavigationHistoryItem[] {
		return [...this.history];
	}

	/**
	 * 获取面包屑导航
	 */
	getBreadcrumbs(): NavigationHistoryItem[] {
		return [...this.breadcrumbs];
	}

	/**
	 * 清空导航历史
	 */
	clearHistory(): void {
		this.history = [];
		this.currentIndex = -1;
		this.breadcrumbs = [];
		this.saveHistory();
	}

	/**
	 * 查找导航策略
	 */
	private findStrategy(destination: string): NavigationStrategy | null {
		for (const strategy of this.strategies.values()) {
			if (strategy.canHandle(destination)) {
				return strategy;
			}
		}
		return null;
	}

	/**
	 * 添加到历史记录
	 */
	private addToHistory(item: NavigationHistoryItem): void {
		// 移除当前位置之后的历史记录
		this.history = this.history.slice(0, this.currentIndex + 1);
		
		// 添加新项目
		this.history.push(item);
		this.currentIndex = this.history.length - 1;
		
		// 限制历史记录大小
		if (this.history.length > this.config.maxHistorySize) {
			this.history = this.history.slice(-this.config.maxHistorySize);
			this.currentIndex = this.history.length - 1;
		}
		
		// 更新面包屑
		this.updateBreadcrumbs(item);
		
		// 保存历史记录
		this.saveHistory();
	}

	/**
	 * 更新面包屑导航
	 */
	private updateBreadcrumbs(item: NavigationHistoryItem): void {
		if (!this.config.enableBreadcrumbs) {
			return;
		}

		// 移除重复项
		this.breadcrumbs = this.breadcrumbs.filter(b => b.file !== item.file);
		
		// 添加到末尾
		this.breadcrumbs.push(item);
		
		// 限制面包屑数量
		const maxBreadcrumbs = 5;
		if (this.breadcrumbs.length > maxBreadcrumbs) {
			this.breadcrumbs = this.breadcrumbs.slice(-maxBreadcrumbs);
		}
	}

	/**
	 * 获取导航类型
	 */
	private getNavigationType(destination: string): 'canvas' | 'markdown' | 'grid' {
		if (destination.endsWith('.canvas')) {
			return 'canvas';
		} else if (destination.endsWith('.md')) {
			return 'markdown';
		} else {
			return 'grid';
		}
	}

	/**
	 * 生成唯一ID
	 */
	private generateId(): string {
		return `nav-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	}

	/**
	 * 设置键盘快捷键
	 */
	private setupKeyboardShortcuts(): void {
		if (!this.config.enableKeyboardShortcuts) {
			return;
		}

		// 这里可以添加键盘快捷键监听
		// 由于Obsidian的快捷键系统，这部分通常在插件主类中处理
	}

	/**
	 * 保存历史记录
	 */
	private async saveHistory(): Promise<void> {
		try {
			const data = {
				history: this.history,
				currentIndex: this.currentIndex,
				breadcrumbs: this.breadcrumbs
			};
			
			localStorage.setItem('canvas-grid-navigation-history', JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save navigation history:', error);
		}
	}

	/**
	 * 加载历史记录
	 */
	private loadHistory(): void {
		try {
			const data = localStorage.getItem('canvas-grid-navigation-history');
			if (data) {
				const parsed = JSON.parse(data);
				this.history = parsed.history || [];
				this.currentIndex = parsed.currentIndex || -1;
				this.breadcrumbs = parsed.breadcrumbs || [];
			}
		} catch (error) {
			console.error('Failed to load navigation history:', error);
		}
	}

	/**
	 * 注册导航策略
	 */
	registerStrategy(strategy: NavigationStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<NavigationConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		this.saveHistory();
		this.strategies.clear();
		this.history = [];
		this.breadcrumbs = [];
		this.currentIndex = -1;
	}
}
