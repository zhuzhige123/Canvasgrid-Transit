import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, TFile, Notice, Modal, EventRef, MarkdownView } from 'obsidian';

// 插件设置接口
interface CanvasGridSettings {
	cardWidth: number;
	cardHeight: number;
	cardSpacing: number;
	enableAutoLayout: boolean;
	colorFilterColors: string[]; // 颜色筛选器显示的颜色列表
	language: 'zh' | 'en'; // 界面语言
}

// 链接预览数据接口
interface LinkPreview {
	title?: string;
	description?: string;
	image?: string;
	siteName?: string;
	favicon?: string;
	url: string;
	isLoading?: boolean;
	error?: string;
}

// 默认设置
const DEFAULT_SETTINGS: CanvasGridSettings = {
	cardWidth: 300,
	cardHeight: 200,
	cardSpacing: 20,
	enableAutoLayout: true,
	colorFilterColors: ['1', '2', '4', '6', '7'], // 默认显示红、橙、绿、蓝、紫
	language: 'zh' // 默认中文
}

// 视图类型常量
export const CANVAS_GRID_VIEW_TYPE = "canvas-grid-view";

// 国际化文本
interface I18nTexts {
	// 通用
	search: string;
	refresh: string;
	settings: string;
	cancel: string;
	confirm: string;
	delete: string;
	edit: string;
	save: string;

	// 网格视图
	gridView: string;
	switchToGridView: string;
	canvasGridView: string;
	noCanvasData: string;
	loadingCanvas: string;

	// 菜单
	refreshData: string;
	syncCanvas: string;
	newCanvasFile: string;
	sortBy: string;
	filterConditions: string;
	returnToCanvas: string;

	// 排序
	sortByCreated: string;
	sortByModified: string;
	sortByTitle: string;
	ascending: string;
	descending: string;

	// 筛选
	filterByColor: string;
	allColors: string;

	// 分组
	groupView: string;
	returnToMainView: string;
	groupMembers: string;

	// 设置
	gridLayoutSettings: string;
	cardMinWidth: string;
	cardMinHeight: string;
	cardSpacing: string;
	enableAutoLayout: string;
	interfaceLanguage: string;
	colorFilterSettings: string;
	aboutPlugin: string;

	// 关于
	mainFeatures: string;
	quickStart: string;
	thanks: string;
	feedback: string;
	contact: string;
	buyCoffee: string;
	projectLinks: string;
}

const I18N_TEXTS: Record<'zh' | 'en', I18nTexts> = {
	zh: {
		// 通用
		search: '搜索',
		refresh: '刷新',
		settings: '设置',
		cancel: '取消',
		confirm: '确认',
		delete: '删除',
		edit: '编辑',
		save: '保存',

		// 网格视图
		gridView: '网格视图',
		switchToGridView: '切换到网格视图',
		canvasGridView: 'Canvas网格视图',
		noCanvasData: '没有Canvas数据',
		loadingCanvas: '加载Canvas中...',

		// 菜单
		refreshData: '刷新数据',
		syncCanvas: '同步Canvas',
		newCanvasFile: '新建Canvas文件',
		sortBy: '排序方式',
		filterConditions: '筛选条件',
		returnToCanvas: '返回Canvas白板',

		// 排序
		sortByCreated: '创建时间',
		sortByModified: '修改时间',
		sortByTitle: '标题',
		ascending: '升序',
		descending: '降序',

		// 筛选
		filterByColor: '按颜色筛选',
		allColors: '所有颜色',

		// 分组
		groupView: '分组视图',
		returnToMainView: '返回主视图',
		groupMembers: '成员',

		// 设置
		gridLayoutSettings: '网格布局设置',
		cardMinWidth: '卡片最小宽度',
		cardMinHeight: '卡片最小高度',
		cardSpacing: '卡片间距',
		enableAutoLayout: '启用自动布局',
		interfaceLanguage: '界面语言',
		colorFilterSettings: '颜色筛选器设置',
		aboutPlugin: '关于插件',

		// 关于
		mainFeatures: '主要功能',
		quickStart: '快速开始',
		thanks: '感谢使用',
		feedback: '反馈建议',
		contact: '联系作者',
		buyCoffee: '请喝咖啡',
		projectLinks: '项目链接'
	},
	en: {
		// 通用
		search: 'Search',
		refresh: 'Refresh',
		settings: 'Settings',
		cancel: 'Cancel',
		confirm: 'Confirm',
		delete: 'Delete',
		edit: 'Edit',
		save: 'Save',

		// 网格视图
		gridView: 'Grid View',
		switchToGridView: 'Switch to Grid View',
		canvasGridView: 'Canvas Grid View',
		noCanvasData: 'No Canvas Data',
		loadingCanvas: 'Loading Canvas...',

		// 菜单
		refreshData: 'Refresh Data',
		syncCanvas: 'Sync Canvas',
		newCanvasFile: 'New Canvas File',
		sortBy: 'Sort By',
		filterConditions: 'Filter Conditions',
		returnToCanvas: 'Return to Canvas',

		// 排序
		sortByCreated: 'Created Time',
		sortByModified: 'Modified Time',
		sortByTitle: 'Title',
		ascending: 'Ascending',
		descending: 'Descending',

		// 筛选
		filterByColor: 'Filter by Color',
		allColors: 'All Colors',

		// 分组
		groupView: 'Group View',
		returnToMainView: 'Return to Main View',
		groupMembers: 'Members',

		// 设置
		gridLayoutSettings: 'Grid Layout Settings',
		cardMinWidth: 'Card Min Width',
		cardMinHeight: 'Card Min Height',
		cardSpacing: 'Card Spacing',
		enableAutoLayout: 'Enable Auto Layout',
		interfaceLanguage: 'Interface Language',
		colorFilterSettings: 'Color Filter Settings',
		aboutPlugin: 'About Plugin',

		// 关于
		mainFeatures: 'Main Features',
		quickStart: 'Quick Start',
		thanks: 'Thanks for Using',
		feedback: 'Feedback',
		contact: 'Contact',
		buyCoffee: 'Buy Me a Coffee',
		projectLinks: 'Project Links'
	}
};

// 国际化管理器
class I18nManager {
	private language: 'zh' | 'en' = 'zh';

	setLanguage(lang: 'zh' | 'en') {
		this.language = lang;
	}

	t(key: keyof I18nTexts): string {
		return I18N_TEXTS[this.language][key] || key;
	}
}

// 全局国际化实例
const i18n = new I18nManager();

// Canvas节点接口（基于JSON Canvas规范）
interface CanvasNode {
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
	label?: string;
	flag?: number; // 旗帜级别：0=无，1=低，2=中，3=高
}

// Canvas边接口
interface CanvasEdge {
	id: string;
	fromNode: string;
	fromSide: 'top' | 'right' | 'bottom' | 'left';
	toNode: string;
	toSide: 'top' | 'right' | 'bottom' | 'left';
	color?: string;
	label?: string;
}

// Canvas数据接口
interface CanvasData {
	nodes: CanvasNode[];
	edges: CanvasEdge[];
}

// Canvas节点视图接口
interface CanvasNodeView {
	id: string;
	node: CanvasNode;
	element: HTMLElement;
	bbox: BoundingBox;
}

// Canvas API接口
interface CanvasAPI {
	zoomToBbox(bbox: BoundingBox): void;
	selectNode(nodeId: string): void;
	deselectAll(): void;
	getNode(nodeId: string): CanvasNodeView | null;
	panTo(x: number, y: number): void;
	setZoom(zoom: number): void;
}

// 边界框接口
interface BoundingBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

// 拖拽数据接口
interface DragData {
	text: string;
	source: 'editor' | 'external';
	timestamp: number;
}

// 内容类型接口
interface TextContent {
	text: string;
}

interface LinkContent {
	url: string;
}

interface FileContent {
	file: string;
}

type NodeContent = TextContent | LinkContent | FileContent;

// 内容分析结果接口
interface ContentAnalysis {
	type: 'text' | 'link' | 'file';
	content: NodeContent;
	width: number;
	height: number;
}

// 分组信息接口
interface GroupInfo {
	group: CanvasNode; // 分组节点本身
	members: CanvasNode[]; // 分组内的成员节点
	memberCount: number; // 成员数量
	bounds: BoundingBox; // 分组的边界框
}

// 类型守卫函数
function isTextContent(content: NodeContent): content is TextContent {
	return 'text' in content;
}

function isLinkContent(content: NodeContent): content is LinkContent {
	return 'url' in content;
}

function isFileContent(content: NodeContent): content is FileContent {
	return 'file' in content;
}

function isHTMLElement(element: Element | null): element is HTMLElement {
	return element !== null && element instanceof HTMLElement;
}

function hasProperty<T extends object, K extends string>(
	obj: T,
	prop: K
): obj is T & Record<K, unknown> {
	return prop in obj;
}

// 关联标签页管理器
class LinkedTabManager {
	private app: App;
	private linkedCanvasFile: TFile | null = null;
	private gridView: CanvasGridView | null = null;
	private fileWatcherRefs: EventRef[] = [];

	constructor(app: App) {
		this.app = app;
	}

	// 建立关联
	linkCanvasFile(canvasFile: TFile, gridView: CanvasGridView): void {
		this.unlinkCanvas(); // 先解除之前的关联

		this.linkedCanvasFile = canvasFile;
		this.gridView = gridView;

		// 移除官方API关联 - 改为简单关联

		this.registerFileWatcher();
		this.updateGridViewHeader();

		console.log(`Linked canvas file: ${canvasFile.path}`);
	}

	// 移除官方API关联方法 - 改为简单关联

	// 查找Canvas文件对应的leaf
	findCanvasLeaf(canvasFile: TFile): WorkspaceLeaf | null {
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
		return canvasLeaves.find(leaf => {
			const view = leaf.view as any;
			return view.file?.path === canvasFile.path;
		}) || null;
	}

	// 查找网格视图对应的leaf
	findGridViewLeaf(gridView: CanvasGridView): WorkspaceLeaf | null {
		const gridLeaves = this.app.workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE);
		return gridLeaves.find(leaf => leaf.view === gridView) || null;
	}

	// 解除关联
	unlinkCanvas(): void {
		this.linkedCanvasFile = null;
		this.gridView = null;
		this.unregisterFileWatcher();
		console.log('Canvas link removed');
	}

	// 获取关联的Canvas文件
	getLinkedCanvasFile(): TFile | null {
		return this.linkedCanvasFile;
	}

	// 检查关联是否有效
	isLinked(): boolean {
		return this.linkedCanvasFile !== null &&
			   this.app.vault.getAbstractFileByPath(this.linkedCanvasFile.path) !== null;
	}

	// 注册文件监听器
	private registerFileWatcher(): void {
		if (!this.linkedCanvasFile) return;

		console.log('Registering file watchers for:', this.linkedCanvasFile.path);

		// 监听文件修改
		const modifyRef = this.app.vault.on('modify', (file) => {
			if (file.path === this.linkedCanvasFile?.path && this.gridView && file instanceof TFile) {
				this.gridView.onLinkedFileModified(file as TFile);
			}
		});

		// 监听文件删除
		const deleteRef = this.app.vault.on('delete', (file) => {
			if (file.path === this.linkedCanvasFile?.path && this.gridView) {
				this.gridView.onLinkedFileDeleted();
				this.unlinkCanvas();
			}
		});

		// 监听文件重命名
		const renameRef = this.app.vault.on('rename', (file, oldPath) => {
			if (oldPath === this.linkedCanvasFile?.path && this.gridView) {
				this.linkedCanvasFile = file as TFile;
				this.gridView.onLinkedFileRenamed(file as TFile);
			}
		});

		this.fileWatcherRefs = [modifyRef, deleteRef, renameRef];
	}

	// 注销文件监听器
	private unregisterFileWatcher(): void {
		this.fileWatcherRefs.forEach(ref => {
			this.app.vault.offref(ref);
		});
		this.fileWatcherRefs = [];
		console.log('File watchers unregistered');
	}

	// 更新网格视图头部
	private updateGridViewHeader(): void {
		if (this.gridView && this.linkedCanvasFile) {
			this.gridView.updateLinkedCanvasDisplay(this.linkedCanvasFile);
		}
	}
}

// Canvas文件选择对话框
class CanvasSelectionModal extends Modal {
	private gridView: CanvasGridView;
	private onSelect: (file: TFile) => void;

	constructor(app: App, gridView: CanvasGridView, onSelect: (file: TFile) => void) {
		super(app);
		this.gridView = gridView;
		this.onSelect = onSelect;
	}

	onOpen(): void {
		this.titleEl.setText('选择要关联的Canvas文件');
		this.createContent();
	}

	private createContent(): void {
		const canvasFiles = this.app.vault.getFiles()
			.filter(file => file.extension === 'canvas');

		if (canvasFiles.length === 0) {
			this.createEmptyState();
		} else {
			this.createFileList(canvasFiles);
		}

		this.createActions();
	}

	private createEmptyState(): void {
		const emptyEl = this.contentEl.createDiv("canvas-selection-empty");
		emptyEl.innerHTML = `
			<div class="empty-icon">📄</div>
			<div class="empty-title">没有找到Canvas文件</div>
			<div class="empty-desc">请先创建一个Canvas文件，然后再进行关联</div>
		`;
	}

	private createFileList(files: TFile[]): void {
		const listEl = this.contentEl.createDiv("canvas-file-list");

		files.forEach(file => {
			const itemEl = listEl.createDiv("canvas-file-item");

			itemEl.innerHTML = `
				<div class="file-icon">🎨</div>
				<div class="file-info">
					<div class="file-name">${file.basename}</div>
					<div class="file-path">${file.path}</div>
				</div>
				<div class="file-action">
					<button class="select-btn">选择</button>
				</div>
			`;

			const selectBtn = itemEl.querySelector('.select-btn') as HTMLButtonElement;
			selectBtn.onclick = () => {
				this.onSelect(file);
				this.close();
			};
		});
	}

	private createActions(): void {
		const actionsEl = this.contentEl.createDiv("canvas-selection-actions");

		// 创建新Canvas按钮
		const createBtn = actionsEl.createEl("button", {
			cls: "mod-cta",
			text: "创建新Canvas文件"
		});
		createBtn.onclick = () => this.createNewCanvas();

		// 取消按钮
		const cancelBtn = actionsEl.createEl("button", {
			text: "取消"
		});
		cancelBtn.onclick = () => this.close();
	}

	private async createNewCanvas(): Promise<void> {
		const fileName = `新建Canvas-${Date.now()}.canvas`;
		const initialData: CanvasData = { nodes: [], edges: [] };

		try {
			const newFile = await this.app.vault.create(
				fileName,
				JSON.stringify(initialData, null, 2)
			);

			this.onSelect(newFile);
			this.close();

			new Notice(`已创建新Canvas文件: ${newFile.basename}`);
		} catch (error) {
			new Notice('创建Canvas文件失败');
			console.error('Failed to create canvas file:', error);
		}
	}
}

// 网格视图类
export class CanvasGridView extends ItemView {
	settings: CanvasGridSettings;
	canvasData: CanvasData | null = null;
	gridContainer: HTMLElement;

	// 拖拽相关属性
	private isDragging = false;
	private dragData: DragData | null = null;
	private dropIndicator: HTMLElement | null = null;

	// 关联标签页相关属性
	private linkedTabManager: LinkedTabManager;
	private linkedCanvasFile: TFile | null = null;
	private linkedIndicatorEl: HTMLElement | null = null;
	private updateTimeout: NodeJS.Timeout | null = null;

	// 搜索和排序相关属性
	private searchQuery: string = '';
	private sortBy: 'created' | 'title' | 'modified' = 'created';
	private sortOrder: 'asc' | 'desc' = 'desc';
	private filteredNodes: CanvasNode[] = [];
	private searchInputEl: HTMLInputElement | null = null;
	private statusElements: {
		count: HTMLElement;
		filter: HTMLElement;
	} | null = null;

	// 颜色筛选相关属性
	private activeColorFilter: string | null = null; // 当前激活的颜色筛选器
	private colorFilterContainer: HTMLElement | null = null;

	// 宽度控制相关属性
	private resizeObserver: ResizeObserver | null = null;
	private minWidth: number = 300; // 最小宽度（一张卡片的宽度）
	private isWidthLimited: boolean = false;

	// 链接预览缓存 - 使用LRU缓存策略
	private linkPreviewCache: Map<string, { data: LinkPreview; timestamp: number; accessCount: number }> = new Map();
	private previewLoadingUrls: Set<string> = new Set();
	private readonly MAX_CACHE_SIZE = 100; // 限制缓存大小
	private readonly CACHE_TTL = 30 * 60 * 1000; // 缓存30分钟过期

	// 文件监听器控制
	private fileWatcherDisabled: boolean = false;

	// 事件监听器清理追踪
	private globalEventListeners: Array<{
		element: Element | Document,
		event: string,
		handler: EventListener,
		options?: boolean | AddEventListenerOptions
	}> = [];

	// 定时器清理追踪
	private activeTimeouts: Set<NodeJS.Timeout> = new Set();
	private activeIntervals: Set<NodeJS.Timeout> = new Set();
	private cacheCleanupInterval: NodeJS.Timeout | null = null;

	// 渲染缓存 - 提升性能
	private renderCache: Map<string, HTMLElement> = new Map();
	private readonly MAX_RENDER_CACHE_SIZE = 50; // 限制缓存大小
	private renderCacheAccessCount: Map<string, number> = new Map();

	// 编辑状态管理
	private currentEditingCard: HTMLElement | null = null;
	private currentEditingNode: CanvasNode | null = null;
	private autoSaveEnabled: boolean = true;

	// 分组功能相关
	private groupAnalysis: Map<string, GroupInfo> = new Map();
	private currentGroupView: string | null = null; // 当前查看的分组ID

	constructor(leaf: WorkspaceLeaf, settings: CanvasGridSettings) {
		super(leaf);
		this.settings = settings;
		// 初始化国际化
		i18n.setLanguage(settings.language);
		this.linkedTabManager = new LinkedTabManager(this.app);
	}

	// 安全的事件监听器添加方法
	private addGlobalEventListener(
		element: Element | Document,
		event: string,
		handler: EventListener,
		options?: boolean | AddEventListenerOptions
	): void {
		element.addEventListener(event, handler, options);
		this.globalEventListeners.push({ element, event, handler, options });
	}

	// 安全的定时器管理方法
	private safeSetTimeout(callback: () => void, delay: number): NodeJS.Timeout {
		const timeoutId = setTimeout(() => {
			this.activeTimeouts.delete(timeoutId);
			callback();
		}, delay);
		this.activeTimeouts.add(timeoutId);
		return timeoutId;
	}

	private safeSetInterval(callback: () => void, delay: number): NodeJS.Timeout {
		const intervalId = setInterval(callback, delay);
		this.activeIntervals.add(intervalId);
		return intervalId;
	}

	// 清理单个定时器
	private safeClearTimeout(timeoutId: NodeJS.Timeout): void {
		clearTimeout(timeoutId);
		this.activeTimeouts.delete(timeoutId);
	}

	private safeClearInterval(intervalId: NodeJS.Timeout): void {
		clearInterval(intervalId);
		this.activeIntervals.delete(intervalId);
	}

	// 智能缓存管理方法
	private manageCacheSize(): void {
		const now = Date.now();

		// 首先清理过期的缓存项
		for (const [key, value] of this.linkPreviewCache.entries()) {
			if (now - value.timestamp > this.CACHE_TTL) {
				this.linkPreviewCache.delete(key);
			}
		}

		// 如果仍然超过大小限制，使用LRU策略删除最少使用的项
		if (this.linkPreviewCache.size > this.MAX_CACHE_SIZE) {
			const entries = Array.from(this.linkPreviewCache.entries());
			// 按访问次数和时间戳排序，删除最少使用的项
			entries.sort((a, b) => {
				const scoreA = a[1].accessCount * 0.7 + (now - a[1].timestamp) * 0.3;
				const scoreB = b[1].accessCount * 0.7 + (now - b[1].timestamp) * 0.3;
				return scoreA - scoreB;
			});

			const itemsToDelete = entries.slice(0, this.linkPreviewCache.size - this.MAX_CACHE_SIZE);
			itemsToDelete.forEach(([key]) => this.linkPreviewCache.delete(key));
		}
	}

	// 清理过期的加载状态
	private cleanupLoadingUrls(): void {
		// 清理可能卡住的加载状态
		this.previewLoadingUrls.clear();
	}

	// 获取缓存项并更新访问统计
	private getCacheItem(url: string): LinkPreview | null {
		const item = this.linkPreviewCache.get(url);
		if (item) {
			// 更新访问统计
			item.accessCount++;
			item.timestamp = Date.now();
			return item.data;
		}
		return null;
	}

	// 设置缓存项
	private setCacheItem(url: string, data: LinkPreview): void {
		this.linkPreviewCache.set(url, {
			data,
			timestamp: Date.now(),
			accessCount: 1
		});
		this.manageCacheSize();
	}

	getViewType() {
		return CANVAS_GRID_VIEW_TYPE;
	}

	getDisplayText() {
		return "Canvas Grid View";
	}

	getIcon() {
		return "grid" as any;
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		if (!container) {
			console.error('Canvas Grid View: Container element not found');
			return;
		}
		container.empty();

		// 创建工具栏
		this.createToolbar(container);

		// 创建颜色筛选器
		this.createColorFilter(container);

		// 创建网格容器
		this.gridContainer = container.createDiv("canvas-grid-container");
		this.setupGridStyles();
		this.setupEventDelegation();

		// 尝试加载当前活动的Canvas文件
		await this.loadActiveCanvas();

		// 初始化拖拽功能
		this.setupDragDropHandlers();

		// 初始化搜索和排序
		this.initializeSearchAndSort();

		// 初始化宽度控制
		this.initializeWidthControl();

		// 启动定期缓存清理（每10分钟清理一次）
		this.cacheCleanupInterval = this.safeSetInterval(() => {
			this.manageCacheSize();
			this.cleanupLoadingUrls();
		}, 10 * 60 * 1000);
	}

	// 初始化搜索和排序功能
	private initializeSearchAndSort(): void {
		// 初始化筛选节点数组
		this.filteredNodes = this.canvasData?.nodes || [];

		// 应用默认排序
		this.applySortAndFilter();
	}

	// 创建工具栏
	createToolbar(container: Element) {
		const toolbar = container.createDiv("canvas-grid-toolbar");

		// 左侧：主菜单按钮
		const leftSection = toolbar.createDiv("canvas-grid-toolbar-left");
		this.createMainMenuButton(leftSection);

		// 中间：搜索功能
		const middleSection = toolbar.createDiv("canvas-grid-toolbar-middle");
		this.createSearchBox(middleSection);

		// 右侧：预留空间（移除状态显示）
		const rightSection = toolbar.createDiv("canvas-grid-toolbar-right");
	}

	// 创建主菜单按钮
	private createMainMenuButton(container: Element): void {
		const menuContainer = container.createDiv("canvas-grid-main-menu");

		// 主菜单按钮 - 纯图标模式
		const mainBtn = menuContainer.createEl("button", {
			cls: "canvas-grid-main-btn canvas-grid-icon-only",
			title: "网格视图菜单"
		});

		// 按钮内容：只包含图标和下拉箭头
		const btnContent = mainBtn.createDiv("canvas-grid-main-btn-content");

		// 图标
		const iconEl = btnContent.createDiv("canvas-grid-main-icon");
		iconEl.innerHTML = `
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="7" height="7"/>
				<rect x="14" y="3" width="7" height="7"/>
				<rect x="3" y="14" width="7" height="7"/>
				<rect x="14" y="14" width="7" height="7"/>
			</svg>
		`;

		// 下拉箭头（小一点）
		const arrowEl = btnContent.createDiv("canvas-grid-main-arrow");
		arrowEl.innerHTML = `
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="6,9 12,15 18,9"/>
			</svg>
		`;

		// 关联状态指示器（隐藏的，但保留用于功能）
		this.linkedIndicatorEl = document.createElement('div');
		this.linkedIndicatorEl.className = 'canvas-grid-linked-indicator-hidden';
		this.linkedIndicatorEl.style.display = 'none';
		btnContent.appendChild(this.linkedIndicatorEl);
		this.updateLinkedCanvasDisplay(null);

		// 主下拉菜单
		const mainDropdown = menuContainer.createDiv("canvas-grid-main-dropdown");
		mainDropdown.style.display = 'none';

		// 创建菜单内容
		this.createMainMenuContent(mainDropdown);

		// 菜单按钮点击事件
		mainBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const isVisible = mainDropdown.style.display !== 'none';

			// 隐藏所有其他下拉菜单
			this.hideAllDropdowns();

			if (!isVisible) {
				mainDropdown.style.display = 'block';
				mainBtn.classList.add('active');
			}
		});

		// 点击外部关闭菜单
		document.addEventListener('click', () => {
			mainDropdown.style.display = 'none';
			mainBtn.classList.remove('active');
		});

		// 阻止菜单内部点击冒泡
		mainDropdown.addEventListener('click', (e) => {
			e.stopPropagation();
		});
	}

	// 创建主菜单内容
	private createMainMenuContent(container: Element): void {
		// 关联管理部分
		this.createLinkManagementSection(container);

		// 数据操作部分
		this.createDataOperationsSection(container);

		// 排序和筛选部分
		this.createSortFilterSection(container);

		// 导航部分
		this.createNavigationSection(container);
	}

	// 创建关联管理部分
	private createLinkManagementSection(container: Element): void {
		const section = container.createDiv("canvas-grid-menu-section");

		// 自动关联当前Canvas文件
		const autoLinkItem = section.createDiv("canvas-grid-menu-item");
		autoLinkItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
			</svg>
			<span class="menu-text">自动关联当前Canvas</span>
		`;
		autoLinkItem.addEventListener('click', () => {
			this.autoLinkCurrentCanvas();
			this.hideAllDropdowns();
		});

		// 选择关联Canvas文件
		const customLinkItem = section.createDiv("canvas-grid-menu-item");
		customLinkItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
				<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
			</svg>
			<span class="menu-text">选择关联Canvas文件</span>
		`;
		customLinkItem.addEventListener('click', () => {
			this.showCanvasSelectionDialog();
			this.hideAllDropdowns();
		});

		// 解除关联选项
		const unlinkItem = section.createDiv("canvas-grid-menu-item");
		unlinkItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12"/>
			</svg>
			<span class="menu-text">解除关联</span>
		`;
		unlinkItem.addEventListener('click', () => {
			this.unlinkCanvas();
			this.hideAllDropdowns();
		});
	}

	// 视图设置部分已移除，功能简化

	// 创建数据操作部分
	private createDataOperationsSection(container: Element): void {
		const section = container.createDiv("canvas-grid-menu-section");

		// 同步数据选项（合并刷新和同步功能）
		const syncItem = section.createDiv("canvas-grid-menu-item");
		syncItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="23,4 23,10 17,10"/>
				<polyline points="1,20 1,14 7,14"/>
				<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
			</svg>
			<span class="menu-text">同步数据</span>
		`;
		syncItem.addEventListener('click', () => {
			this.syncCanvasData();
			this.hideAllDropdowns();
		});

		// 创建新Canvas选项
		const createItem = section.createDiv("canvas-grid-menu-item");
		createItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
				<polyline points="14,2 14,8 20,8"/>
				<line x1="12" y1="18" x2="12" y2="12"/>
				<line x1="9" y1="15" x2="15" y2="15"/>
			</svg>
			<span class="menu-text">新建Canvas文件</span>
		`;
		createItem.addEventListener('click', () => {
			this.createNewCanvasFile();
			this.hideAllDropdowns();
		});
	}

	// 创建排序和筛选部分
	private createSortFilterSection(container: Element): void {
		const section = container.createDiv("canvas-grid-menu-section");

		// 排序选项（合并排序方式和顺序）
		const sortItem = section.createDiv("canvas-grid-menu-item canvas-grid-submenu-item");
		sortItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 6h18"/>
				<path d="M7 12h10"/>
				<path d="M10 18h4"/>
			</svg>
			<span class="menu-text">排序方式</span>
			<svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="9,18 15,12 9,6"/>
			</svg>
		`;

		// 筛选条件子菜单
		const filterItem = section.createDiv("canvas-grid-menu-item canvas-grid-submenu-item");
		filterItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
			</svg>
			<span class="menu-text">筛选条件</span>
			<svg class="menu-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="9,18 15,12 9,6"/>
			</svg>
		`;

		// 添加子菜单事件
		this.addSubmenuEvents(sortItem, 'sort');
		this.addSubmenuEvents(filterItem, 'filter');
	}

	// 添加子菜单事件
	private addSubmenuEvents(menuItem: Element, type: string): void {
		menuItem.addEventListener('click', (e) => {
			e.stopPropagation();

			// 检查是否已经有相同类型的子菜单打开
			const existingSubmenu = document.querySelector(`.canvas-grid-submenu[data-submenu-type="${type}"]`);

			if (existingSubmenu) {
				// 如果已经打开，则关闭
				this.closeAllSubmenus();
			} else {
				// 如果没有打开，则显示
				this.showSubmenu(menuItem, type);
			}
		});
	}

	// 显示子菜单
	private showSubmenu(parentItem: Element, type: string): void {
		// 先关闭所有已存在的子菜单
		this.closeAllSubmenus();

		// 创建子菜单容器
		const submenu = document.createElement('div');
		submenu.className = 'canvas-grid-submenu';
		submenu.dataset.submenuType = type; // 添加类型标识

		// 根据类型创建不同的子菜单内容
		switch (type) {
			case 'sort':
				this.createSortSubmenu(submenu);
				break;
			case 'filter':
				this.createFilterSubmenu(submenu);
				break;
		}

		// 定位子菜单
		const rect = parentItem.getBoundingClientRect();
		submenu.style.position = 'fixed';
		submenu.style.left = `${rect.right + 8}px`;
		submenu.style.top = `${rect.top}px`;
		submenu.style.zIndex = '1001';

		// 添加到页面
		document.body.appendChild(submenu);

		// 点击外部关闭子菜单
		const closeSubmenu = (e: Event) => {
			if (!submenu.contains(e.target as Node) && !parentItem.contains(e.target as Node)) {
				submenu.remove();
				// 安全移除事件监听器
				document.removeEventListener('click', closeSubmenu);
				// 从追踪列表中移除
				const index = this.globalEventListeners.findIndex(
					listener => listener.element === document &&
					listener.event === 'click' &&
					listener.handler === closeSubmenu
				);
				if (index > -1) {
					this.globalEventListeners.splice(index, 1);
				}
			}
		};
		this.safeSetTimeout(() => {
			this.addGlobalEventListener(document, 'click', closeSubmenu);
		}, 0);
	}

	// 关闭所有子菜单
	private closeAllSubmenus(): void {
		const existingSubmenus = document.querySelectorAll('.canvas-grid-submenu');
		existingSubmenus.forEach(submenu => {
			submenu.remove();
		});
	}

	// 创建合并排序子菜单（排序方式+顺序）
	private createSortSubmenu(container: Element): void {
		const sortOptions = [
			{ key: 'created', label: '创建时间' },
			{ key: 'modified', label: '修改时间' },
			{ key: 'title', label: '标题' }
		];

		sortOptions.forEach(option => {
			const item = container.createDiv("canvas-grid-menu-item");
			const isActive = this.sortBy === option.key;
			const isAsc = this.sortOrder === 'asc';

			// 显示当前排序状态
			let statusIcon = '';
			if (isActive) {
				statusIcon = isAsc ? '↑' : '↓';
			}

			item.innerHTML = `
				<span class="menu-text">${option.label}</span>
				<span class="menu-status">${statusIcon}</span>
			`;

			item.addEventListener('click', () => {
				if (this.sortBy === option.key) {
					// 如果是当前排序字段，切换升序/降序
					this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
				} else {
					// 如果是新的排序字段，默认使用升序
					this.sortBy = option.key as any;
					this.sortOrder = 'asc';
				}
				this.applySortAndFilter();
				this.hideAllDropdowns();
				container.parentElement?.remove();
			});
		});
	}

	// 创建筛选子菜单
	private createFilterSubmenu(container: Element): void {
		const filterOptions = [
			{ key: 'all', label: '显示全部' },
			{ key: 'text', label: '仅文本卡片' },
			{ key: 'file', label: '仅文件卡片' },
			{ key: 'link', label: '仅链接卡片' }
		];

		filterOptions.forEach(option => {
			const item = container.createDiv("canvas-grid-menu-item");
			item.innerHTML = `<span class="menu-text">${option.label}</span>`;

			item.addEventListener('click', () => {
				this.applyTypeFilter(option.key);
				this.hideAllDropdowns();
				container.parentElement?.remove();
			});
		});
	}

	// 创建导航部分
	private createNavigationSection(container: Element): void {
		const section = container.createDiv("canvas-grid-menu-section");

		// 返回Canvas白板选项
		const backItem = section.createDiv("canvas-grid-menu-item canvas-grid-menu-back");
		backItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="19" y1="12" x2="5" y2="12"/>
				<polyline points="12,19 5,12 12,5"/>
			</svg>
			<span class="menu-text">返回Canvas白板</span>
		`;
		backItem.addEventListener('click', () => {
			this.returnToCanvas();
			this.hideAllDropdowns();
		});
	}

	// 卡片大小相关方法已移除

	// 创建新Canvas文件
	private async createNewCanvasFile(): Promise<void> {
		try {
			const fileName = `Canvas-${Date.now()}.canvas`;
			const newFile = await this.app.vault.create(fileName, JSON.stringify({
				nodes: [],
				edges: []
			}));

			await this.setLinkedCanvas(newFile);
			new Notice(`已创建并关联新Canvas文件: ${newFile.basename}`);
		} catch (error) {
			console.error('Failed to create new canvas file:', error);
			new Notice('创建Canvas文件失败');
		}
	}

	// 同步Canvas数据（合并刷新和同步功能）
	private async syncCanvasData(): Promise<void> {
		try {
			if (this.linkedCanvasFile) {
				// 有关联文件时，重新加载关联文件数据
				await this.loadCanvasDataFromFile(this.linkedCanvasFile);
				this.notifyCanvasViewRefresh();
				new Notice('Canvas数据已同步');
			} else {
				// 没有关联文件时，加载当前活动的Canvas
				await this.loadActiveCanvas();
				new Notice('Canvas数据已刷新');
			}
		} catch (error) {
			console.error('Failed to sync canvas data:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			new Notice(`同步数据失败: ${errorMessage}`);
			this.showErrorState(`同步失败: ${errorMessage}`);
		}
	}

	// 导出网格数据
	private async exportGridData(): Promise<void> {
		if (!this.canvasData) {
			new Notice('没有可导出的数据');
			return;
		}

		try {
			const exportData = {
				timestamp: Date.now(),
				source: this.linkedCanvasFile?.path || 'unknown',
				nodes: this.canvasData.nodes,
				edges: this.canvasData.edges
			};

			const fileName = `grid-export-${Date.now()}.json`;
			await this.app.vault.create(fileName, JSON.stringify(exportData, null, 2));
			new Notice(`数据已导出到: ${fileName}`);
		} catch (error) {
			console.error('Failed to export data:', error);
			new Notice('导出数据失败');
		}
	}

	// 返回Canvas白板
	private returnToCanvas(): void {
		if (this.linkedCanvasFile) {
			// 打开关联的Canvas文件
			this.app.workspace.openLinkText(this.linkedCanvasFile.path, '', false);
		} else {
			// 查找当前打开的Canvas文件
			const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
			if (canvasLeaves.length > 0) {
				this.app.workspace.setActiveLeaf(canvasLeaves[0]);
			} else {
				new Notice('没有找到可返回的Canvas文件');
			}
		}
	}

	// 创建操作按钮 (已整合到主菜单，保留以防兼容性问题)
	private createActionButtons(container: Element): void {
		// 功能已整合到主菜单中，此方法保留但不执行
		return;
		const actionsEl = container.createDiv("canvas-grid-toolbar-actions");

		// 官方关联标签页按钮
		const officialLinkBtn = actionsEl.createEl("button", {
			cls: "canvas-grid-action-btn canvas-grid-official-link-btn",
			title: "使用官方关联标签页功能"
		});
		officialLinkBtn.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 12l2 2 4-4"/>
				<path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
				<path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
				<path d="M13 12h3"/>
				<path d="M8 12h3"/>
			</svg>
		`;
		officialLinkBtn.onclick = () => this.useOfficialTabLink();

		// 自定义关联按钮
		const linkBtn = actionsEl.createEl("button", {
			cls: "canvas-grid-action-btn",
			title: "自定义关联Canvas文件"
		});
		linkBtn.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
				<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
			</svg>
		`;
		linkBtn.onclick = () => this.showCanvasSelectionDialog();

		// 解除关联按钮
		const unlinkBtn = actionsEl.createEl("button", {
			cls: "canvas-grid-action-btn canvas-grid-unlink-btn",
			title: "解除关联"
		});
		unlinkBtn.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 6L6 18M6 6l12 12"/>
			</svg>
		`;
		unlinkBtn.onclick = () => this.unlinkCanvas();

		// 根据关联状态显示/隐藏按钮
		this.updateActionButtonsVisibility();
	}

	// 创建搜索框
	private createSearchBox(container: Element): void {
		const searchContainer = container.createDiv("canvas-grid-search-container");

		// 搜索输入框
		this.searchInputEl = searchContainer.createEl("input", {
			cls: "canvas-grid-search-input",
			type: "text",
			placeholder: this.settings.language === 'zh' ? "搜索卡片内容..." : "Search card content..."
		});

		// 清空按钮
		const clearBtn = searchContainer.createDiv("canvas-grid-search-clear");
		clearBtn.innerHTML = `
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="18" y1="6" x2="6" y2="18"/>
				<line x1="6" y1="6" x2="18" y2="18"/>
			</svg>
		`;
		clearBtn.style.display = 'none';

		// 搜索事件处理
		this.searchInputEl.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			this.searchQuery = target.value.trim();

			// 显示/隐藏清空按钮
			if (this.searchQuery) {
				clearBtn.style.display = 'flex';
			} else {
				clearBtn.style.display = 'none';
			}

			// 执行搜索
			this.performSearch();
		});

		// 清空按钮事件
		clearBtn.addEventListener('click', () => {
			this.searchInputEl!.value = '';
			this.searchQuery = '';
			clearBtn.style.display = 'none';
			this.performSearch();
			this.searchInputEl!.focus();
		});

		// 键盘事件
		this.searchInputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.searchInputEl!.blur();
			}
		});
	}

	// 创建颜色筛选器
	private createColorFilter(container: Element): void {
		this.colorFilterContainer = container.createDiv("canvas-grid-color-filter");

		// 添加"全部"按钮 - 使用混合色设计
		const allBtn = this.colorFilterContainer.createDiv("canvas-grid-color-dot all-colors");
		allBtn.title = "显示全部颜色";
		allBtn.classList.add('active'); // 默认激活

		// 设置混合色渐变背景，不显示文字
		allBtn.style.background = 'conic-gradient(from 0deg, #ff6b6b 0deg 51.4deg, #ffa726 51.4deg 102.8deg, #ffeb3b 102.8deg 154.2deg, #66bb6a 154.2deg 205.6deg, #26c6da 205.6deg 257deg, #42a5f5 257deg 308.4deg, #ab47bc 308.4deg 360deg)';

		allBtn.addEventListener('click', () => {
			this.setColorFilter(null);
		});

		// 根据设置创建颜色圆点
		this.settings.colorFilterColors.forEach(colorValue => {
			const colorDot = this.colorFilterContainer!.createDiv("canvas-grid-color-dot");
			colorDot.dataset.color = colorValue;

			// 设置纯色样式
			const colorMap = {
				'1': '#ff6b6b', // 红色
				'2': '#ffa726', // 橙色
				'3': '#ffeb3b', // 黄色
				'4': '#66bb6a', // 绿色
				'5': '#26c6da', // 青色
				'6': '#42a5f5', // 蓝色
				'7': '#ab47bc'  // 紫色
			};

			const color = colorMap[colorValue as keyof typeof colorMap];
			if (color) {
				colorDot.style.backgroundColor = color;
				colorDot.style.borderColor = color;
			}

			// 添加颜色名称和提示
			const colorNames = ['红', '橙', '黄', '绿', '青', '蓝', '紫'];
			const index = parseInt(colorValue) - 1;
			if (index >= 0 && index < colorNames.length) {
				colorDot.title = `筛选${colorNames[index]}色卡片`;
			}

			// 点击事件
			colorDot.addEventListener('click', () => {
				this.setColorFilter(colorValue);
			});
		});
	}

	// 设置颜色筛选器（互斥选择）
	private setColorFilter(color: string | null): void {
		console.log('设置颜色筛选器:', color);

		// 如果点击的是当前已激活的颜色，则取消筛选（回到全部）
		if (this.activeColorFilter === color) {
			this.activeColorFilter = null;
			color = null;
			console.log('取消当前颜色筛选，回到显示全部');
		} else {
			this.activeColorFilter = color;
		}

		// 更新UI状态 - 确保只有一个圆点处于激活状态
		if (this.colorFilterContainer) {
			const dots = this.colorFilterContainer.querySelectorAll('.canvas-grid-color-dot');
			console.log('找到颜色圆点数量:', dots.length);

			// 先移除所有激活状态
			dots.forEach(dot => {
				dot.classList.remove('active');
			});

			// 然后只激活选中的圆点
			if (color === null) {
				// 激活"全部"按钮
				const allBtn = this.colorFilterContainer.querySelector('.all-colors');
				if (allBtn) {
					allBtn.classList.add('active');
					console.log('激活"全部"按钮');
				}
			} else {
				// 激活对应颜色的圆点
				const targetDot = this.colorFilterContainer.querySelector(`[data-color="${color}"]`);
				if (targetDot) {
					targetDot.classList.add('active');
					console.log('激活颜色圆点:', color);
				}
			}
		}

		// 重新执行搜索和筛选
		console.log('执行颜色筛选，当前筛选颜色:', this.activeColorFilter);
		this.performSearch();
	}

	// 更新颜色筛选器（公共方法）
	updateColorFilter(): void {
		if (this.colorFilterContainer) {
			this.colorFilterContainer.remove();
			this.colorFilterContainer = null;
		}
		// 在工具栏和网格容器之间重新创建
		const container = this.containerEl.children[1] as HTMLElement;
		if (!container) {
			console.error('Canvas Grid View: Container element not found');
			return;
		}
		const toolbar = container.querySelector('.canvas-grid-toolbar');
		const gridContainer = container.querySelector('.canvas-grid-container');
		if (toolbar && gridContainer) {
			this.createColorFilter(container);
		}
	}





	// 视图选项方法已移除，功能已整合到主菜单

	// ==================== 搜索和排序功能实现 ====================

	// 执行搜索（优化版本，减少不必要的重新渲染）
	private performSearch(): void {
		if (!this.canvasData) {
			this.filteredNodes = [];
			this.renderGrid();
			return;
		}

		// 缓存之前的结果以避免不必要的重新渲染
		const previousFilteredNodes = [...this.filteredNodes];

		// 首先进行文本搜索
		let searchResults: CanvasNode[];
		if (!this.searchQuery) {
			searchResults = [...this.canvasData.nodes];
		} else {
			const query = this.searchQuery.toLowerCase();
			searchResults = this.canvasData.nodes.filter(node => {
				// 搜索文本内容
				if (node.text && node.text.toLowerCase().includes(query)) {
					return true;
				}

				// 搜索文件名
				if (node.file && node.file.toLowerCase().includes(query)) {
					return true;
				}

				// 搜索URL
				if (node.url && node.url.toLowerCase().includes(query)) {
					return true;
				}

				return false;
			});
		}

		// 然后应用颜色筛选
		console.log('应用颜色筛选，当前筛选颜色:', this.activeColorFilter);
		console.log('搜索结果数量:', searchResults.length);

		if (this.activeColorFilter) {
			this.filteredNodes = searchResults.filter(node => {
				console.log('检查节点颜色:', node.id, 'node.color:', node.color, '筛选颜色:', this.activeColorFilter);

				// 直接比较颜色值
				const matches = node.color === this.activeColorFilter;
				console.log('颜色匹配结果:', matches);
				return matches;
			});
			console.log('颜色筛选后节点数量:', this.filteredNodes.length);
		} else {
			this.filteredNodes = searchResults;
			console.log('无颜色筛选，使用所有搜索结果');
		}

		// 只有在结果真正改变时才重新渲染
		if (!this.arraysEqual(previousFilteredNodes, this.filteredNodes)) {
			// 应用排序
			this.applySortAndFilter();
		}
	}

	// 比较两个数组是否相等（基于节点ID）
	private arraysEqual(arr1: CanvasNode[], arr2: CanvasNode[]): boolean {
		if (arr1.length !== arr2.length) return false;

		const ids1 = arr1.map(node => node.id).sort();
		const ids2 = arr2.map(node => node.id).sort();

		return ids1.every((id, index) => id === ids2[index]);
	}

	// 应用排序和筛选
	private applySortAndFilter(): void {
		if (!this.filteredNodes.length) {
			this.renderGrid();
			return;
		}

		// 排序逻辑
		this.filteredNodes.sort((a, b) => {
			let comparison = 0;

			switch (this.sortBy) {
				case 'created':
					// 按创建时间排序（使用节点ID中的时间戳）
					const timeA = this.extractTimestamp(a.id);
					const timeB = this.extractTimestamp(b.id);
					comparison = timeA - timeB;
					break;

				case 'modified':
					// 按修改时间排序（如果有的话）
					const modA = (a as any).modified || this.extractTimestamp(a.id);
					const modB = (b as any).modified || this.extractTimestamp(b.id);
					comparison = modA - modB;
					break;

				case 'title':
					// 按标题排序
					const titleA = this.getNodeTitle(a).toLowerCase();
					const titleB = this.getNodeTitle(b).toLowerCase();
					comparison = titleA.localeCompare(titleB);
					break;
			}

			return this.sortOrder === 'asc' ? comparison : -comparison;
		});

		this.renderGrid();
	}

	// 提取时间戳
	private extractTimestamp(nodeId: string): number {
		// 尝试从节点ID中提取时间戳
		const match = nodeId.match(/(\d{13})/);
		return match ? parseInt(match[1]) : 0;
	}

	// 获取节点标题
	private getNodeTitle(node: CanvasNode): string {
		if (node.text) {
			// 获取文本的第一行作为标题
			return node.text.split('\n')[0].substring(0, 50);
		}
		if (node.file) {
			return node.file;
		}
		if (node.url) {
			return node.url;
		}
		return 'Untitled';
	}



	// 应用类型筛选
	private applyTypeFilter(filterType: string): void {
		if (!this.canvasData) return;

		if (filterType === 'all') {
			this.filteredNodes = [...this.canvasData.nodes];
		} else {
			this.filteredNodes = this.canvasData.nodes.filter(node => {
				return node.type === filterType;
			});
		}

		// 重新应用搜索
		if (this.searchQuery) {
			this.performSearch();
		} else {
			this.applySortAndFilter();
		}
	}

	// 卡片大小调整方法已移除



	// 隐藏所有下拉菜单
	private hideAllDropdowns(): void {
		// 隐藏主下拉菜单
		const mainDropdowns = this.containerEl.querySelectorAll('.canvas-grid-main-dropdown');
		mainDropdowns.forEach(dropdown => {
			(dropdown as HTMLElement).style.display = 'none';
		});

		// 移除按钮激活状态
		const buttons = this.containerEl.querySelectorAll('.canvas-grid-main-btn');
		buttons.forEach(btn => {
			btn.classList.remove('active');
		});

		// 关闭所有子菜单
		this.closeAllSubmenus();
	}

	// 隐藏下拉菜单
	private hideDropdownMenu(dropdownMenu: HTMLElement): void {
		dropdownMenu.style.display = 'none';
	}

	// 切换下拉菜单
	private toggleDropdownMenu(dropdownMenu: HTMLElement): void {
		const isVisible = dropdownMenu.style.display !== 'none';
		if (isVisible) {
			dropdownMenu.style.display = 'none';
		} else {
			dropdownMenu.style.display = 'block';
		}
	}

	// 显示空状态
	private showEmptyState(): void {
		const emptyEl = this.gridContainer.createDiv("canvas-grid-empty-state");
		emptyEl.innerHTML = `
			<div class="empty-icon">📄</div>
			<div class="empty-title">没有Canvas节点</div>
			<div class="empty-desc">当前Canvas文件中没有节点，请先在Canvas中添加一些内容</div>
		`;
	}

	// 创建菜单区域 (已整合到主菜单，保留以防兼容性问题)
	private createMenuSection(container: Element): void {
		// 功能已整合到主菜单中，此方法保留但不执行
		return;
		const menuSection = container.createDiv("canvas-grid-toolbar-menu");
		const menuBtn = menuSection.createDiv("canvas-grid-menu-btn");
		menuBtn.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="1"/>
				<circle cx="12" cy="5" r="1"/>
				<circle cx="12" cy="19" r="1"/>
			</svg>
		`;
		menuBtn.title = "更多选项";

		// 创建下拉菜单
		const dropdownMenu = menuSection.createDiv("canvas-grid-dropdown-menu");
		dropdownMenu.style.display = 'none';

		// 返回Canvas菜单项
		const backMenuItem = dropdownMenu.createDiv("canvas-grid-menu-item");
		backMenuItem.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="m12 19-7-7 7-7"/>
				<path d="m19 12H5"/>
			</svg>
			<span>返回Canvas</span>
		`;
		backMenuItem.onclick = () => {
			this.switchToCanvasView();
			this.hideDropdownMenu(dropdownMenu);
		};

		// 刷新菜单项
		const refreshMenuItem = dropdownMenu.createDiv("canvas-grid-menu-item");
		refreshMenuItem.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
				<path d="M21 3v5h-5"/>
				<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
				<path d="M3 21v-5h5"/>
			</svg>
			<span>刷新</span>
		`;
		refreshMenuItem.onclick = () => {
			this.refreshCanvasData();
			this.hideDropdownMenu(dropdownMenu);
		};

		// 设置菜单项
		const settingsMenuItem = dropdownMenu.createDiv("canvas-grid-menu-item");
		settingsMenuItem.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="3"/>
				<path d="m12 1 1.27 2.22 2.22 1.27-1.27 2.22L12 8.5l-1.27-2.22L8.5 5.23l1.27-2.22L12 1"/>
				<path d="m12 15.5 1.27 2.22 2.22 1.27-1.27 2.22L12 22.5l-1.27-2.22L8.5 18.77l1.27-2.22L12 15.5"/>
			</svg>
			<span>网格设置</span>
		`;
		settingsMenuItem.onclick = () => {
			this.openGridSettings();
			this.hideDropdownMenu(dropdownMenu);
		};

		// 菜单按钮点击事件
		menuBtn.onclick = (e) => {
			e.stopPropagation();
			this.toggleDropdownMenu(dropdownMenu);
		};

		// 点击其他地方关闭菜单
		document.addEventListener('click', () => {
			this.hideDropdownMenu(dropdownMenu);
		});
	}



	// 设置网格样式 - 使用CSS Grid自动布局
	setupGridStyles() {
		// 设置CSS变量，让CSS Grid自动处理列数
		this.gridContainer.style.setProperty('--grid-card-spacing', `${this.settings.cardSpacing}px`);
		this.gridContainer.style.setProperty('--grid-card-min-width', `${this.settings.cardWidth}px`);
		this.gridContainer.style.setProperty('--grid-card-height', `${this.settings.cardHeight}px`);

		// 移除手动设置的grid-template-columns，让CSS自动处理
		this.gridContainer.style.removeProperty('grid-template-columns');
	}

	// 设置事件委托，提升性能
	setupEventDelegation() {
		// 使用事件委托处理所有点击事件（包括卡片和工具栏按钮）
		this.gridContainer.addEventListener('click', this.handleGridClick);

		// 使用事件委托处理卡片双击
		this.gridContainer.addEventListener('dblclick', this.handleCardDoubleClick);

		// 使用事件委托处理右键菜单
		this.gridContainer.addEventListener('contextmenu', this.handleCardContextMenu);

		// 处理键盘事件
		this.gridContainer.addEventListener('keydown', this.handleKeyDown);

		// 点击其他地方关闭右键菜单
		document.addEventListener('click', this.handleDocumentClick);

		// 使用CSS处理悬停效果，移除JavaScript事件监听器
	}

	// 加载当前活动的Canvas文件 - 优化版本
	async loadActiveCanvas() {
		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile || activeFile.extension !== 'canvas') {
			this.showMessage("请先打开一个Canvas文件");
			return;
		}

		// 显示加载状态
		this.showLoadingState();

		try {
			const content = await this.app.vault.read(activeFile);

			// 验证JSON格式
			let parsedData;
			try {
				parsedData = JSON.parse(content);
			} catch (parseError) {
				throw new Error("Canvas文件格式无效");
			}

			// 验证Canvas数据结构
			if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
				throw new Error("Canvas文件缺少有效的节点数据");
			}

			this.canvasData = parsedData;
			this.renderGrid();
		} catch (error) {
			console.error("Canvas加载错误:", error);
			this.showErrorState(error.message);
		}
	}

	// 渲染网格视图 - 优化版本（支持批量渲染和分组显示）
	renderGrid() {
		if (!this.gridContainer) return;

		this.gridContainer.empty();

		// 如果在分组视图中，只渲染分组成员
		if (this.currentGroupView) {
			this.renderGroupMembers();
			return;
		}

		// 主视图：分析分组并渲染
		this.analyzeGroups();

		// 使用筛选后的节点或原始节点
		const nodesToRender = (this.searchQuery || this.activeColorFilter) ?
			this.filteredNodes :
			(this.canvasData?.nodes || []);

		console.log('渲染节点决策:', {
			searchQuery: this.searchQuery,
			activeColorFilter: this.activeColorFilter,
			filteredNodesLength: this.filteredNodes.length,
			nodesToRenderLength: nodesToRender.length,
			groupCount: this.groupAnalysis.size
		});

		if (nodesToRender.length === 0) {
			if (this.searchQuery) {
				this.showNoSearchResults();
			} else {
				this.showEmptyState();
			}
			return;
		}

		// 分离分组节点和普通节点
		const groupNodes = nodesToRender.filter(node => node.type === 'group');
		const regularNodes = nodesToRender.filter(node => node.type !== 'group');

		// 创建要渲染的项目列表（分组卡片 + 未分组的普通节点）
		const itemsToRender: Array<{type: 'group' | 'node', data: CanvasNode | GroupInfo}> = [];

		// 添加分组卡片
		groupNodes.forEach(groupNode => {
			const groupInfo = this.groupAnalysis.get(groupNode.id);
			if (groupInfo) {
				itemsToRender.push({type: 'group', data: groupInfo});
			}
		});

		// 添加未分组的节点
		const ungroupedNodes = this.getUngroupedNodes(regularNodes);
		ungroupedNodes.forEach(node => {
			itemsToRender.push({type: 'node', data: node});
		});

		// 渲染所有项目
		this.renderGridItems(itemsToRender);
	}

	// 立即渲染（小量数据）
	private renderGridImmediate(nodes: CanvasNode[]): void {
		// 使用DocumentFragment批量添加DOM元素，提升性能
		const fragment = document.createDocumentFragment();
		nodes.forEach(node => {
			const card = this.createCard(node);
			// 如果有搜索查询，高亮匹配的内容
			if (this.searchQuery) {
				this.highlightSearchResults(card, this.searchQuery);
			}
			fragment.appendChild(card);
		});

		// 一次性添加所有卡片到DOM
		this.gridContainer.appendChild(fragment);
	}

	// 批量渲染（大量数据）
	private async renderGridBatched(nodes: CanvasNode[]): Promise<void> {
		const batchSize = 20; // 每批处理20个节点
		let currentIndex = 0;

		// 显示加载状态
		this.showLoadingState();

		const renderBatch = () => {
			const fragment = document.createDocumentFragment();
			const endIndex = Math.min(currentIndex + batchSize, nodes.length);

			for (let i = currentIndex; i < endIndex; i++) {
				const node = nodes[i];
				const card = this.createCard(node);

				// 如果有搜索查询，高亮匹配的内容
				if (this.searchQuery) {
					this.highlightSearchResults(card, this.searchQuery);
				}
				fragment.appendChild(card);
			}

			// 添加当前批次到DOM
			this.gridContainer.appendChild(fragment);
			currentIndex = endIndex;

			// 如果还有更多节点，继续下一批
			if (currentIndex < nodes.length) {
				// 使用requestAnimationFrame确保不阻塞UI
				requestAnimationFrame(renderBatch);
			} else {
				// 渲染完成，隐藏加载状态
				this.hideLoadingState();
			}
		};

		// 开始渲染
		requestAnimationFrame(renderBatch);
	}

	// 显示无搜索结果状态
	private showNoSearchResults(): void {
		const emptyEl = this.gridContainer.createDiv("canvas-grid-empty-state");
		emptyEl.innerHTML = `
			<div class="empty-icon">🔍</div>
			<div class="empty-title">未找到匹配的卡片</div>
			<div class="empty-desc">尝试使用不同的关键词搜索</div>
			<button class="empty-action" onclick="this.closest('.canvas-grid-view').querySelector('.canvas-grid-search-input').value = ''; this.closest('.canvas-grid-view').querySelector('.canvas-grid-search-input').dispatchEvent(new Event('input'));">清空搜索</button>
		`;
	}

	// 高亮搜索结果
	private highlightSearchResults(cardEl: HTMLElement, query: string): void {
		const textElements = cardEl.querySelectorAll('.canvas-grid-card-content, .canvas-grid-card-title');
		const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

		textElements.forEach(el => {
			const element = el as HTMLElement;
			if (element.textContent) {
				element.innerHTML = element.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
			}
		});
	}



	// 保存设置
	private async saveSettings(): Promise<void> {
		// 这里应该调用插件的保存设置方法
		// 由于我们在视图类中，需要通过某种方式访问插件实例
		console.log('Settings saved:', this.settings);
	}

	// 创建单个卡片 - 响应式版本（带缓存优化）
	createCard(node: CanvasNode): HTMLElement {
		// 生成缓存键，包含影响渲染的所有属性
		const cacheKey = this.generateCardCacheKey(node);

		// 检查缓存
		const cachedCard = this.getRenderCacheItem(cacheKey);
		if (cachedCard) {
			// 克隆缓存的元素并更新必要的属性
			const clonedCard = cachedCard.cloneNode(true) as HTMLElement;
			this.updateCardEventHandlers(clonedCard, node);
			return clonedCard;
		}

		// 创建新卡片
		const card = this.createCardInternal(node);

		// 缓存卡片（克隆一份用于缓存）
		this.setRenderCacheItem(cacheKey, card.cloneNode(true) as HTMLElement);

		return card;
	}

	// 内部创建卡片方法
	private createCardInternal(node: CanvasNode): HTMLElement {
		const card = document.createElement('div');
		card.className = 'canvas-grid-card';

		// 移除固定宽度，让CSS Grid自动处理
		// 只设置最小高度
		card.style.minHeight = `${this.settings.cardHeight}px`;

		// 设置数据属性用于事件委托
		card.dataset.nodeId = node.id;
		card.dataset.nodeType = node.type;

		// 设置节点颜色 - 设置背景色、文字色和边框色
		if (node.color) {
			// 标准化颜色值，确保颜色一致性
			const normalizedColor = this.normalizeColorValue(node.color);
			if (normalizedColor) {
				const colorStyles = this.getColorStyles(normalizedColor);
				card.dataset.color = normalizedColor;

				// 设置背景色
				card.style.backgroundColor = colorStyles.backgroundColor;
				// 设置边框色
				card.style.borderColor = colorStyles.borderColor;
				card.style.borderWidth = '2px';
			}
		}

		// 设置旗帜级别（如果有）
		if (node.flag) {
			card.dataset.flag = node.flag.toString();
		}

		// 添加无障碍访问支持
		card.setAttribute('role', 'button');
		card.setAttribute('tabindex', '0');
		card.setAttribute('aria-label', `${node.type}节点`);

		// 根据节点类型渲染内容
		this.renderCardContent(card, node);

		// 创建卡片工具栏
		this.createCardToolbar(card, node);

		return card;
	}

	// 生成卡片缓存键
	private generateCardCacheKey(node: CanvasNode): string {
		// 包含影响渲染的所有关键属性
		const keyData = {
			id: node.id,
			type: node.type,
			color: node.color,
			flag: node.flag,
			// 对于文本节点，包含文本内容的哈希
			textHash: node.text ? this.simpleHash(node.text) : null,
			// 对于文件节点，包含文件路径
			file: node.file,
			// 对于链接节点，包含URL
			url: node.url,
			// 设置相关
			cardHeight: this.settings.cardHeight
		};
		return JSON.stringify(keyData);
	}

	// 简单哈希函数
	private simpleHash(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // 转换为32位整数
		}
		return hash;
	}

	// 获取渲染缓存项
	private getRenderCacheItem(key: string): HTMLElement | null {
		const item = this.renderCache.get(key);
		if (item) {
			// 更新访问计数
			const currentCount = this.renderCacheAccessCount.get(key) || 0;
			this.renderCacheAccessCount.set(key, currentCount + 1);
			return item;
		}
		return null;
	}

	// 设置渲染缓存项
	private setRenderCacheItem(key: string, element: HTMLElement): void {
		// 如果缓存已满，清理最少使用的项
		if (this.renderCache.size >= this.MAX_RENDER_CACHE_SIZE) {
			this.cleanupRenderCache();
		}

		this.renderCache.set(key, element);
		this.renderCacheAccessCount.set(key, 1);
	}

	// 清理渲染缓存
	private cleanupRenderCache(): void {
		// 找到访问次数最少的项并删除
		let minAccess = Infinity;
		let keyToDelete = '';

		for (const [key, count] of this.renderCacheAccessCount.entries()) {
			if (count < minAccess) {
				minAccess = count;
				keyToDelete = key;
			}
		}

		if (keyToDelete) {
			this.renderCache.delete(keyToDelete);
			this.renderCacheAccessCount.delete(keyToDelete);
		}
	}

	// 更新卡片事件处理器（用于缓存的卡片）
	private updateCardEventHandlers(card: HTMLElement, node: CanvasNode): void {
		// 重新设置数据属性（确保正确）
		card.dataset.nodeId = node.id;
		card.dataset.nodeType = node.type;

		// 事件处理器通过事件委托处理，不需要重新绑定
	}

	// 清空渲染缓存
	private clearRenderCache(): void {
		this.renderCache.clear();
		this.renderCacheAccessCount.clear();
	}

	// 创建卡片工具栏
	createCardToolbar(card: HTMLElement, node: CanvasNode) {
		const toolbar = document.createElement('div');
		toolbar.className = 'canvas-card-toolbar';

		// 删除按钮（事件通过委托处理）
		const deleteBtn = this.createToolbarButton('delete', '删除');

		// 颜色设置按钮（事件通过委托处理）
		const colorBtn = this.createToolbarButton('color', '设置颜色');

		toolbar.appendChild(deleteBtn);
		toolbar.appendChild(colorBtn);

		card.appendChild(toolbar);
	}

	// 创建工具栏按钮（使用事件委托，不直接绑定onclick）
	createToolbarButton(type: string, title: string, onClick?: () => void): HTMLElement {
		const button = document.createElement('div');
		button.className = `canvas-card-toolbar-btn canvas-card-toolbar-${type}`;
		button.title = title;

		// 添加可访问性属性
		button.setAttribute('role', 'button');
		button.setAttribute('tabindex', '0');
		button.setAttribute('aria-label', title);

		// 不再直接绑定onclick，完全依赖事件委托
		// 这样可以避免事件冲突，并且提高性能

		// 添加图标
		const icon = document.createElement('div');
		icon.className = `canvas-card-toolbar-icon canvas-card-toolbar-icon-${type}`;
		button.appendChild(icon);

		return button;
	}

	// 从工具栏删除卡片
	async deleteCardFromToolbar(card: HTMLElement) {
		const nodeId = card.dataset.nodeId;
		if (!nodeId) return;

		// 确认删除
		const confirmed = confirm('确定要删除这个节点吗？');
		if (!confirmed) return;

		try {
			// 从Canvas数据中删除节点
			await this.deleteNodeFromCanvas(nodeId);

			// 从视图中移除卡片
			card.remove();



			console.log('卡片删除完成，UI已更新');

		} catch (error) {
			console.error('删除卡片失败:', error);
			new Notice('删除卡片失败');
		}
	}

	// 显示颜色选择器
	showColorPicker(card: HTMLElement, node: CanvasNode) {
		// 创建颜色选择器弹窗
		const colorPicker = document.createElement('div');
		colorPicker.className = 'canvas-color-picker';

		// 定义可用颜色 - 使用实际的背景色
		const colors = [
			{ name: '默认', value: '', bgColor: 'var(--background-primary)', textColor: 'var(--text-normal)' },
			{ name: '红色', value: '1' },
			{ name: '橙色', value: '2' },
			{ name: '黄色', value: '3' },
			{ name: '绿色', value: '4' },
			{ name: '青色', value: '5' },
			{ name: '蓝色', value: '6' },
			{ name: '紫色', value: '7' }
		];

		colors.forEach(colorOption => {
			const colorItem = document.createElement('div');
			colorItem.className = 'canvas-color-item';

			if (colorOption.value) {
				// 使用纯色显示，参考Obsidian Canvas的颜色映射
				const pureColorMap: { [key: string]: string } = {
					'1': '#ff6b6b', // 红色
					'2': '#ffa726', // 橙色
					'3': '#ffeb3b', // 黄色
					'4': '#66bb6a', // 绿色
					'5': '#26c6da', // 青色
					'6': '#42a5f5', // 蓝色
					'7': '#ab47bc'  // 紫色
				};

				const pureColor = pureColorMap[colorOption.value];
				colorItem.style.backgroundColor = pureColor;
				colorItem.style.border = `2px solid ${pureColor}`;
			} else {
				// 默认颜色 - 显示为灰色圆点
				colorItem.style.backgroundColor = 'var(--background-secondary)';
				colorItem.style.border = '2px solid var(--background-modifier-border)';
			}

			// 设置为圆形，不显示文字
			colorItem.style.borderRadius = '50%';
			colorItem.style.width = '24px';
			colorItem.style.height = '24px';
			colorItem.style.cursor = 'pointer';
			colorItem.style.transition = 'all 0.2s ease';

			// 悬停效果
			colorItem.addEventListener('mouseenter', () => {
				colorItem.style.transform = 'scale(1.1)';
				colorItem.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
			});

			colorItem.addEventListener('mouseleave', () => {
				colorItem.style.transform = 'scale(1)';
				colorItem.style.boxShadow = 'none';
			});

			// 设置提示文字
			colorItem.title = colorOption.name;

			// 选中状态显示
			if (node.color === colorOption.value || (!node.color && !colorOption.value)) {
				colorItem.classList.add('selected');
				colorItem.style.boxShadow = '0 0 0 2px var(--interactive-accent)';
			}

			colorItem.onclick = () => {
				this.setCardColor(card, node, colorOption.value);
				colorPicker.remove();
			};

			colorPicker.appendChild(colorItem);
		});

		// 定位颜色选择器
		const rect = card.getBoundingClientRect();
		colorPicker.style.position = 'fixed';
		colorPicker.style.top = `${rect.top - 40}px`;
		colorPicker.style.left = `${rect.left}px`;
		colorPicker.style.zIndex = '10000';

		document.body.appendChild(colorPicker);

		// 点击其他地方关闭
		const closeHandler = (e: MouseEvent) => {
			if (!colorPicker.contains(e.target as Node)) {
				colorPicker.remove();
				// 安全移除事件监听器
				document.removeEventListener('click', closeHandler);
				// 从追踪列表中移除
				const index = this.globalEventListeners.findIndex(
					listener => listener.element === document &&
					listener.event === 'click' &&
					listener.handler === closeHandler
				);
				if (index > -1) {
					this.globalEventListeners.splice(index, 1);
				}
			}
		};
		this.safeSetTimeout(() => {
			this.addGlobalEventListener(document, 'click', closeHandler);
		}, 0);
	}

	// 设置卡片颜色 - 设置背景色、文字色和边框色
	async setCardColor(card: HTMLElement, node: CanvasNode, color: string) {
		// 标准化颜色值
		const normalizedColor = color ? this.normalizeColorValue(color) : null;

		// 更新节点数据 - 使用标准化的颜色值
		node.color = normalizedColor || undefined;

		// 更新卡片样式 - 设置背景色、文字色和边框色
		if (normalizedColor) {
			const colorStyles = this.getColorStyles(normalizedColor);
			card.dataset.color = normalizedColor;

			// 设置背景色
			card.style.backgroundColor = colorStyles.backgroundColor;
			// 设置边框色
			card.style.borderColor = colorStyles.borderColor;
			card.style.borderWidth = '2px';

			// 设置文字色（应用到内容区域）
			const contentDiv = card.querySelector('.card-content') as HTMLElement;
			if (contentDiv) {
				contentDiv.style.color = colorStyles.textColor;
			}
		} else {
			// 重置为默认样式
			delete card.dataset.color;
			card.style.backgroundColor = '';
			card.style.borderColor = '';
			card.style.borderWidth = '';

			// 重置文字色
			const contentDiv = card.querySelector('.card-content') as HTMLElement;
			if (contentDiv) {
				contentDiv.style.color = '';
			}
		}

		// 保存到Canvas文件
		await this.saveNodeToCanvas(node);
	}



	// 渲染卡片内容
	renderCardContent(card: HTMLElement, node: CanvasNode) {
		// 根据节点类型渲染内容
		switch (node.type) {
			case 'text':
				this.renderTextNode(card, node);
				break;
			case 'file':
				this.renderFileNode(card, node);
				break;
			case 'link':
				this.renderLinkNode(card, node);
				break;
			default:
				card.createDiv().textContent = `未支持的节点类型: ${node.type}`;
		}

		// 应用颜色样式到内容区域
		if (node.color) {
			// 标准化颜色值，确保颜色一致性
			const normalizedColor = this.normalizeColorValue(node.color);
			if (normalizedColor) {
				const colorStyles = this.getColorStyles(normalizedColor);
				const contentDiv = card.querySelector('.card-content') as HTMLElement;
				if (contentDiv) {
					contentDiv.style.color = colorStyles.textColor;
				}
			}
		}
	}

	// 渲染文本节点
	renderTextNode(card: HTMLElement, node: CanvasNode) {
		const content = card.createDiv("card-content");
		content.style.lineHeight = '1.5';

		this.renderTextNodeContent(content, node);
	}

	// 渲染文件节点
	renderFileNode(card: HTMLElement, node: CanvasNode) {
		const content = card.createDiv("card-content");
		
		if (node.file) {
			const fileName = node.file.split('/').pop() || node.file;
			const fileIcon = content.createSpan("file-icon");
			fileIcon.textContent = "📄 ";
			content.createSpan().textContent = fileName;
			
			// 如果有子路径，显示它
			if (node.file.includes('#')) {
				const subpath = node.file.split('#')[1];
				const subpathEl = content.createDiv("file-subpath");
				subpathEl.textContent = `#${subpath}`;
				subpathEl.style.color = 'var(--text-muted)';
				subpathEl.style.fontSize = '12px';
				subpathEl.style.marginTop = '4px';
			}
		} else {
			content.textContent = "无效的文件引用";
			content.style.color = 'var(--text-error)';
		}
	}

	// 渲染链接节点
	renderLinkNode(card: HTMLElement, node: CanvasNode) {
		const content = card.createDiv("card-content link-card-content");

		// 异步加载链接预览
		this.renderLinkNodeWithPreview(content, node);
	}

	// 简单的Markdown渲染
	simpleMarkdownRender(text: string): string {
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/`(.*?)`/g, '<code>$1</code>')
			.replace(/\n/g, '<br>');
	}

	// 获取节点颜色
	getNodeColor(color: string): string {
		const colorMap: { [key: string]: string } = {
			'1': '#ff6b6b', // red
			'2': '#ffa726', // orange
			'3': '#ffeb3b', // yellow
			'4': '#66bb6a', // green
			'5': '#26c6da', // cyan
			'6': '#42a5f5', // blue
			'7': '#ab47bc'  // purple
		};

		return colorMap[color] || color;
	}

	// 获取颜色的背景色和文字色（考虑对比度）
	getColorStyles(color: string): { backgroundColor: string; textColor: string; borderColor: string } {
		const colorMap: { [key: string]: { backgroundColor: string; textColor: string; borderColor: string } } = {
			'1': { backgroundColor: '#ffebee', textColor: '#c62828', borderColor: '#ff6b6b' }, // red - 浅红背景，深红文字
			'2': { backgroundColor: '#fff3e0', textColor: '#e65100', borderColor: '#ffa726' }, // orange - 浅橙背景，深橙文字
			'3': { backgroundColor: '#fffde7', textColor: '#f57f17', borderColor: '#ffeb3b' }, // yellow - 浅黄背景，深黄文字
			'4': { backgroundColor: '#e8f5e8', textColor: '#2e7d32', borderColor: '#66bb6a' }, // green - 浅绿背景，深绿文字
			'5': { backgroundColor: '#e0f2f1', textColor: '#00695c', borderColor: '#26c6da' }, // cyan - 浅青背景，深青文字
			'6': { backgroundColor: '#e3f2fd', textColor: '#1565c0', borderColor: '#42a5f5' }, // blue - 浅蓝背景，深蓝文字
			'7': { backgroundColor: '#f3e5f5', textColor: '#7b1fa2', borderColor: '#ab47bc' }  // purple - 浅紫背景，深紫文字
		};

		// 检查当前主题是否为深色
		const isDarkTheme = document.body.classList.contains('theme-dark');

		if (isDarkTheme) {
			// 深色主题：使用较深的背景色和较亮的文字色
			const darkColorMap: { [key: string]: { backgroundColor: string; textColor: string; borderColor: string } } = {
				'1': { backgroundColor: '#4a1a1a', textColor: '#ff8a80', borderColor: '#ff6b6b' }, // red
				'2': { backgroundColor: '#4a2c1a', textColor: '#ffcc80', borderColor: '#ffa726' }, // orange
				'3': { backgroundColor: '#4a4a1a', textColor: '#fff176', borderColor: '#ffeb3b' }, // yellow
				'4': { backgroundColor: '#1a4a1a', textColor: '#a5d6a7', borderColor: '#66bb6a' }, // green
				'5': { backgroundColor: '#1a3a3a', textColor: '#80deea', borderColor: '#26c6da' }, // cyan
				'6': { backgroundColor: '#1a2a4a', textColor: '#90caf9', borderColor: '#42a5f5' }, // blue
				'7': { backgroundColor: '#3a1a4a', textColor: '#ce93d8', borderColor: '#ab47bc' }  // purple
			};
			return darkColorMap[color] || { backgroundColor: '', textColor: '', borderColor: '' };
		}

		return colorMap[color] || { backgroundColor: '', textColor: '', borderColor: '' };
	}

	// 标准化颜色值 - 处理不同的颜色值格式
	private normalizeColorValue(color: string | undefined): string | null {
		if (!color) return null;

		// 如果已经是数字字符串，直接返回
		if (/^[1-7]$/.test(color)) {
			return color;
		}

		// 处理Obsidian Canvas的颜色名称格式
		const colorNameMap: { [key: string]: string } = {
			'red': '1',
			'orange': '2',
			'yellow': '3',
			'green': '4',
			'cyan': '5',
			'blue': '6',
			'purple': '7'
		};

		// 转换为小写并查找映射
		const normalizedName = color.toLowerCase();
		return colorNameMap[normalizedName] || null;
	}

	// 卡片点击事件
	onCardClick(node: CanvasNode, cardElement?: HTMLElement) {
		// 如果当前有卡片在编辑状态，且点击的不是当前编辑的卡片，则退出编辑并保存
		if (this.currentEditingCard && this.currentEditingNode) {
			const clickedCard = cardElement || this.gridContainer.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;

			if (clickedCard !== this.currentEditingCard) {
				console.log('点击其他卡片，退出编辑状态并保存');
				this.exitCurrentEditingState(true); // 保存当前编辑
			}
		}

		console.log('Card clicked:', node);
	}

	// 卡片双击事件 - 进入编辑模式
	onCardDoubleClick(node: CanvasNode, cardElement: HTMLElement) {
		if (node.type === 'text') {
			this.startTextEditing(node, cardElement);
		} else if (node.type === 'link') {
			this.startLinkEditing(node, cardElement);
		}
		// 文件节点暂时不支持编辑
	}

	// 开始文本编辑
	startTextEditing(node: CanvasNode, cardElement: HTMLElement) {
		// 如果已有其他卡片在编辑，先退出编辑状态
		if (this.currentEditingCard && this.currentEditingCard !== cardElement) {
			this.exitCurrentEditingState(true); // 保存当前编辑
		}

		const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 设置当前编辑状态
		this.currentEditingCard = cardElement;
		this.currentEditingNode = node;
		this.autoSaveEnabled = false; // 禁用自动保存

		// 保存原始内容
		const originalContent = contentDiv.innerHTML;
		const originalText = node.text || '';

		// 创建简单文本编辑器（禁用自动保存）
		const editor = this.createTextEditor(originalText, (newText: string) => {
			// 手动保存回调
			this.saveTextNode(node, newText);
			this.exitEditMode(cardElement, contentDiv, newText);
			this.clearEditingState();
		}, () => {
			// 取消编辑回调
			this.exitEditMode(cardElement, contentDiv, originalText);
			this.clearEditingState();
		}, false); // 禁用自动保存

		// 进入编辑模式
		this.enterEditMode(cardElement, contentDiv, editor);
	}

	// 创建文本编辑器 - 使用卡片边框尺寸
	createTextEditor(text: string, onSave: (text: string) => void, onCancel: () => void, enableAutoSave: boolean = true): HTMLElement {
		const editorContainer = document.createElement('div');
		editorContainer.className = 'card-editor-container';

		// 创建文本区域
		const textarea = document.createElement('textarea');
		textarea.className = 'card-editor-textarea';
		textarea.value = text;

		// 使用卡片边框显示尺寸 - 移除内边距和边框，让编辑器填满整个卡片
		textarea.style.width = '100%';
		textarea.style.height = '100%';
		textarea.style.minHeight = 'calc(100% - 8px)'; // 减去一点空间避免溢出
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.resize = 'none'; // 禁用调整大小，使用卡片尺寸
		textarea.style.padding = '12px';
		textarea.style.margin = '0';
		textarea.style.boxSizing = 'border-box';
		textarea.style.fontFamily = 'var(--font-text)';
		textarea.style.fontSize = 'var(--font-text-size)';
		textarea.style.lineHeight = '1.5';
		textarea.style.background = 'transparent';
		textarea.style.color = 'var(--text-normal)';
		textarea.style.borderRadius = 'inherit'; // 继承卡片的圆角

		// 自动保存逻辑（可选）
		let autoSaveTimeout: NodeJS.Timeout | null = null;
		const autoSave = () => {
			if (!enableAutoSave) return; // 如果禁用自动保存，直接返回

			if (autoSaveTimeout) {
				this.safeClearTimeout(autoSaveTimeout);
			}
			autoSaveTimeout = this.safeSetTimeout(() => {
				onSave(textarea.value);
				autoSaveTimeout = null;
			}, 1000); // 1秒后自动保存
		};

		// 监听输入变化，实现自动保存（如果启用）
		if (enableAutoSave) {
			textarea.addEventListener('input', autoSave);
		}

		// 键盘快捷键
		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				// Escape键立即保存并退出
				if (autoSaveTimeout) {
					this.safeClearTimeout(autoSaveTimeout);
					autoSaveTimeout = null;
				}
				onSave(textarea.value);
			} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				// Ctrl+Enter立即保存并退出
				if (autoSaveTimeout) {
					this.safeClearTimeout(autoSaveTimeout);
					autoSaveTimeout = null;
				}
				onSave(textarea.value);
			}
		});

		// 失去焦点时的处理（根据自动保存设置决定）
		textarea.addEventListener('blur', () => {
			if (enableAutoSave) {
				// 如果启用自动保存，失去焦点时立即保存
				if (autoSaveTimeout) {
					this.safeClearTimeout(autoSaveTimeout);
					autoSaveTimeout = null;
				}
				onSave(textarea.value);
			}
			// 如果禁用自动保存，失去焦点时不保存，等待用户点击其他卡片
		});

		editorContainer.appendChild(textarea);

		// 自动聚焦和选择
		this.safeSetTimeout(() => {
			textarea.focus();
			textarea.select();
		}, 0);

		return editorContainer;
	}

	// 清除编辑状态
	private clearEditingState() {
		this.currentEditingCard = null;
		this.currentEditingNode = null;
		this.autoSaveEnabled = true;
	}

	// 退出当前编辑状态
	private exitCurrentEditingState(save: boolean = false) {
		if (!this.currentEditingCard || !this.currentEditingNode) return;

		const contentDiv = this.currentEditingCard.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 查找编辑器
		const editorContainer = this.currentEditingCard.querySelector('.card-editor-container') as HTMLElement;
		if (!editorContainer) return;

		if (save) {
			// 保存当前编辑内容
			const textarea = editorContainer.querySelector('textarea') as HTMLTextAreaElement;
			const input = editorContainer.querySelector('input') as HTMLInputElement;

			if (textarea && this.currentEditingNode.type === 'text') {
				this.saveTextNode(this.currentEditingNode, textarea.value);
				this.exitEditMode(this.currentEditingCard, contentDiv, textarea.value);
			} else if (input && this.currentEditingNode.type === 'link') {
				this.saveLinkNodeAndRefresh(this.currentEditingNode, input.value, this.currentEditingCard, contentDiv);
			}
		} else {
			// 取消编辑，恢复原始内容
			if (this.currentEditingNode.type === 'text') {
				this.exitEditMode(this.currentEditingCard, contentDiv, this.currentEditingNode.text || '');
			} else if (this.currentEditingNode.type === 'link') {
				this.exitEditModeAndRefresh(this.currentEditingCard, contentDiv, this.currentEditingNode);
			}
		}

		this.clearEditingState();
	}

	// ==================== 分组功能相关方法 ====================

	// 分析Canvas中的分组和成员关系
	private analyzeGroups(): void {
		if (!this.canvasData) return;

		this.groupAnalysis.clear();

		// 找出所有分组节点
		const groupNodes = this.canvasData.nodes.filter(node => node.type === 'group');

		// 为每个分组分析其成员
		groupNodes.forEach(group => {
			const members = this.findGroupMembers(group);
			const groupInfo: GroupInfo = {
				group: group,
				members: members,
				memberCount: members.length,
				bounds: this.calculateGroupBounds(group)
			};
			this.groupAnalysis.set(group.id, groupInfo);
		});

		console.log('分组分析完成:', this.groupAnalysis);
	}

	// 查找分组内的成员节点
	private findGroupMembers(group: CanvasNode): CanvasNode[] {
		if (!this.canvasData) return [];

		const groupBounds = this.calculateGroupBounds(group);
		const members: CanvasNode[] = [];

		// 检查每个非分组节点是否在当前分组内
		this.canvasData.nodes.forEach(node => {
			if (node.type !== 'group' && node.id !== group.id) {
				if (this.isNodeInsideGroup(node, groupBounds)) {
					members.push(node);
				}
			}
		});

		return members;
	}

	// 计算分组的边界框
	private calculateGroupBounds(group: CanvasNode): BoundingBox {
		return {
			minX: group.x,
			minY: group.y,
			maxX: group.x + group.width,
			maxY: group.y + group.height
		};
	}

	// 判断节点是否在分组内
	private isNodeInsideGroup(node: CanvasNode, groupBounds: BoundingBox): boolean {
		const nodeCenter = {
			x: node.x + node.width / 2,
			y: node.y + node.height / 2
		};

		return nodeCenter.x >= groupBounds.minX &&
			   nodeCenter.x <= groupBounds.maxX &&
			   nodeCenter.y >= groupBounds.minY &&
			   nodeCenter.y <= groupBounds.maxY;
	}

	// 获取所有分组信息
	private getGroupsForGridView(): GroupInfo[] {
		return Array.from(this.groupAnalysis.values());
	}

	// 进入分组视图
	private enterGroupView(groupId: string): void {
		const groupInfo = this.groupAnalysis.get(groupId);
		if (!groupInfo) return;

		this.currentGroupView = groupId;

		// 只显示该分组的成员节点
		this.filteredNodes = groupInfo.members;

		// 重新渲染网格
		this.renderGrid();

		// 更新工具栏显示分组信息
		this.updateToolbarForGroupView(groupInfo);
	}

	// 退出分组视图，返回主视图
	private exitGroupView(): void {
		this.currentGroupView = null;

		// 恢复显示所有节点（除了分组节点）
		if (this.canvasData) {
			this.filteredNodes = this.canvasData.nodes.filter(node => node.type !== 'group');
		}

		// 重新渲染网格
		this.renderGrid();

		// 恢复工具栏
		this.updateToolbarForMainView();
	}

	// 更新工具栏显示分组视图信息
	private updateToolbarForGroupView(groupInfo: GroupInfo): void {
		// 在搜索框右侧添加返回按钮
		this.addGroupViewBackButtonToToolbar();
	}

	// 在工具栏搜索框右侧添加返回按钮
	private addGroupViewBackButtonToToolbar(): void {
		const toolbar = this.containerEl.querySelector('.canvas-grid-toolbar');
		if (!toolbar) return;

		// 查找搜索框容器
		const searchContainer = toolbar.querySelector('.canvas-grid-search-container');
		if (!searchContainer) return;

		// 移除现有的返回按钮（如果有）
		const existingBackButton = toolbar.querySelector('.group-back-button-toolbar');
		if (existingBackButton) {
			existingBackButton.remove();
		}

		// 创建返回按钮
		const backButton = document.createElement('button');
		backButton.className = 'group-back-button-toolbar';
		backButton.title = '返回主视图';
		backButton.setAttribute('aria-label', '返回主视图');

		// 返回图标
		backButton.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="15,18 9,12 15,6"/>
			</svg>
		`;

		// 点击事件
		backButton.onclick = () => this.exitGroupView();

		// 插入到搜索框右侧
		searchContainer.parentElement?.insertBefore(backButton, searchContainer.nextSibling);
	}

	// 恢复主视图工具栏
	private updateToolbarForMainView(): void {
		const toolbar = this.containerEl.querySelector('.canvas-grid-toolbar');
		if (!toolbar) return;

		// 移除工具栏中的返回按钮
		const existingBackButton = toolbar.querySelector('.group-back-button-toolbar');
		if (existingBackButton) {
			existingBackButton.remove();
		}
	}

	// 渲染分组成员（在分组视图中）
	private renderGroupMembers(): void {
		if (!this.currentGroupView) return;

		const groupInfo = this.groupAnalysis.get(this.currentGroupView);
		if (!groupInfo) return;

		// 使用现有的渲染逻辑渲染成员节点
		if (groupInfo.members.length > 50) {
			this.renderGridBatched(groupInfo.members);
		} else {
			this.renderGridImmediate(groupInfo.members);
		}


	}

	// 获取未分组的节点
	private getUngroupedNodes(nodes: CanvasNode[]): CanvasNode[] {
		const ungroupedNodes: CanvasNode[] = [];

		nodes.forEach(node => {
			let isInGroup = false;

			// 检查节点是否在任何分组中
			for (const groupInfo of this.groupAnalysis.values()) {
				if (groupInfo.members.some(member => member.id === node.id)) {
					isInGroup = true;
					break;
				}
			}

			if (!isInGroup) {
				ungroupedNodes.push(node);
			}
		});

		return ungroupedNodes;
	}

	// 渲染网格项目（分组卡片和普通节点）
	private renderGridItems(items: Array<{type: 'group' | 'node', data: CanvasNode | GroupInfo}>): void {
		const fragment = document.createDocumentFragment();

		items.forEach(item => {
			let card: HTMLElement;

			if (item.type === 'group') {
				// 创建分组卡片
				card = this.createGroupCard(item.data as GroupInfo);
			} else {
				// 创建普通节点卡片
				card = this.createCard(item.data as CanvasNode);

				// 如果有搜索查询，高亮匹配的内容
				if (this.searchQuery) {
					this.highlightSearchResults(card, this.searchQuery);
				}
			}

			fragment.appendChild(card);
		});

		// 一次性添加所有卡片到DOM
		this.gridContainer.appendChild(fragment);
	}

	// 创建分组卡片
	private createGroupCard(groupInfo: GroupInfo): HTMLElement {
		const card = document.createElement('div');
		card.className = 'canvas-grid-card group-card';
		card.dataset.nodeId = groupInfo.group.id;
		card.dataset.nodeType = 'group';

		// 设置卡片尺寸
		card.style.minHeight = `${this.settings.cardHeight}px`;

		// 应用分组颜色（如果有）
		if (groupInfo.group.color) {
			// 标准化颜色值，确保颜色一致性
			const normalizedColor = this.normalizeColorValue(groupInfo.group.color);
			if (normalizedColor) {
				const colorStyles = this.getColorStyles(normalizedColor);
				card.style.backgroundColor = colorStyles.backgroundColor;
				card.style.borderColor = colorStyles.borderColor;
				card.style.color = colorStyles.textColor;
			}
		}

		// 创建分组内容容器
		const contentDiv = card.createDiv('group-card-content');

		// 分组图标
		const iconDiv = contentDiv.createDiv('group-icon');
		iconDiv.innerHTML = `
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
				<path d="M9 9h6v6H9z"/>
			</svg>
		`;

		// 分组标题
		const titleDiv = contentDiv.createDiv('group-title');
		titleDiv.textContent = groupInfo.group.label || '未命名分组';

		// 成员数量
		const countDiv = contentDiv.createDiv('group-member-count');
		countDiv.textContent = `${groupInfo.memberCount} 个项目`;

		// 成员预览（显示前几个成员的类型图标）
		if (groupInfo.members.length > 0) {
			const previewDiv = contentDiv.createDiv('group-members-preview');
			const maxPreview = Math.min(4, groupInfo.members.length);

			for (let i = 0; i < maxPreview; i++) {
				const member = groupInfo.members[i];
				const memberIcon = previewDiv.createDiv('member-icon');
				memberIcon.className = `member-icon ${member.type}-icon`;

				// 根据成员类型显示不同图标
				switch (member.type) {
					case 'text':
						memberIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
						break;
					case 'file':
						memberIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`;
						break;
					case 'link':
						memberIcon.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
						break;
				}
			}

			// 如果有更多成员，显示省略号
			if (groupInfo.members.length > maxPreview) {
				const moreIcon = previewDiv.createDiv('member-icon more-icon');
				moreIcon.textContent = `+${groupInfo.members.length - maxPreview}`;
			}
		}

		// 进入分组按钮
		const enterButton = contentDiv.createDiv('group-enter-button');
		enterButton.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="9,18 15,12 9,6"/>
			</svg>
		`;
		enterButton.title = '查看分组内容';

		// 点击事件
		card.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.enterGroupView(groupInfo.group.id);
		});

		// 悬停效果
		card.addEventListener('mouseenter', () => {
			card.style.transform = 'translateY(-2px)';
			card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
		});

		card.addEventListener('mouseleave', () => {
			card.style.transform = 'translateY(0)';
			card.style.boxShadow = '';
		});

		return card;
	}



	// 开始链接编辑
	startLinkEditing(node: CanvasNode, cardElement: HTMLElement) {
		// 如果已有其他卡片在编辑，先退出编辑状态
		if (this.currentEditingCard && this.currentEditingCard !== cardElement) {
			this.exitCurrentEditingState(true); // 保存当前编辑
		}

		const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 设置当前编辑状态
		this.currentEditingCard = cardElement;
		this.currentEditingNode = node;
		this.autoSaveEnabled = false; // 禁用自动保存

		// 保存原始URL
		const originalUrl = node.url || '';

		// 创建链接编辑器（禁用自动保存）
		const editor = this.createLinkEditor(originalUrl, (newUrl: string) => {
			// 手动保存回调
			this.saveLinkNodeAndRefresh(node, newUrl, cardElement, contentDiv);
			this.clearEditingState();
		}, () => {
			// 取消回调 - 恢复原始显示
			this.exitEditModeAndRefresh(cardElement, contentDiv, node);
			this.clearEditingState();
		}, false); // 禁用自动保存

		// 进入编辑模式
		this.enterEditMode(cardElement, contentDiv, editor);
	}

	// 保存链接节点并刷新显示
	private async saveLinkNodeAndRefresh(node: CanvasNode, newUrl: string, cardElement: HTMLElement, contentDiv: HTMLElement) {
		// 更新节点数据
		node.url = newUrl;

		// 保存到文件
		await this.saveCanvasData();

		// 退出编辑模式并重新渲染内容
		this.exitEditModeAndRefresh(cardElement, contentDiv, node);
	}

	// 退出编辑模式并刷新内容
	private exitEditModeAndRefresh(cardElement: HTMLElement, contentDiv: HTMLElement, node: CanvasNode) {
		// 移除编辑模式样式
		cardElement.classList.remove('editing');
		cardElement.style.zIndex = '';
		cardElement.style.boxShadow = '';

		// 清空缓存以强制重新获取预览
		if (node.url) {
			this.linkPreviewCache.delete(node.url);
		}

		// 清空内容并重新渲染完整预览
		contentDiv.empty();
		contentDiv.removeClass('link-card-content');
		contentDiv.addClass('link-card-content');
		this.renderLinkNodeWithPreview(contentDiv, node);
	}

	// 创建链接编辑器
	createLinkEditor(url: string, onSave: (url: string) => void, onCancel: () => void, enableAutoSave: boolean = true): HTMLElement {
		const editorContainer = document.createElement('div');
		editorContainer.className = 'card-editor-container';

		// 创建输入框
		const input = document.createElement('input');
		input.type = 'url';
		input.className = 'card-editor-input';
		input.value = url;
		input.placeholder = '输入URL地址...';
		input.style.width = '100%';
		input.style.padding = '8px';
		input.style.border = '1px solid var(--background-modifier-border)';
		input.style.borderRadius = '4px';
		input.style.background = 'var(--background-primary)';
		input.style.color = 'var(--text-normal)';
		input.style.fontSize = 'var(--font-text-size)';

		// 自动保存逻辑（可选）
		let saveTimeout: NodeJS.Timeout | null = null;
		const autoSave = () => {
			if (!enableAutoSave) return; // 如果禁用自动保存，直接返回

			if (saveTimeout) {
				this.safeClearTimeout(saveTimeout);
			}
			saveTimeout = this.safeSetTimeout(() => {
				onSave(input.value);
				saveTimeout = null;
			}, 500); // 500ms延迟自动保存
		};

		// 事件处理
		if (enableAutoSave) {
			input.addEventListener('input', autoSave);
			input.addEventListener('blur', () => {
				// 失去焦点时立即保存
				if (saveTimeout) {
					this.safeClearTimeout(saveTimeout);
					saveTimeout = null;
				}
				onSave(input.value);
			});
		}

		// 键盘快捷键
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onCancel();
			} else if (e.key === 'Enter') {
				e.preventDefault();
				// 立即保存并退出
				if (saveTimeout) {
					this.safeClearTimeout(saveTimeout);
					saveTimeout = null;
				}
				onSave(input.value);
			}
		});

		editorContainer.appendChild(input);

		// 自动聚焦和选择
		this.safeSetTimeout(() => {
			input.focus();
			input.select();
		}, 0);

		return editorContainer;
	}

	// 进入编辑模式
	enterEditMode(cardElement: HTMLElement, contentDiv: HTMLElement, editor: HTMLElement) {
		// 添加编辑模式样式
		cardElement.classList.add('editing');
		cardElement.style.zIndex = '1000';
		cardElement.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
		cardElement.style.position = 'relative'; // 确保定位上下文

		// 隐藏原内容
		contentDiv.style.display = 'none';

		// 让编辑器容器填满整个卡片
		const editorContainer = editor.querySelector('.card-editor-container') as HTMLElement;
		if (editorContainer) {
			editorContainer.style.position = 'absolute';
			editorContainer.style.top = '0';
			editorContainer.style.left = '0';
			editorContainer.style.right = '0';
			editorContainer.style.bottom = '0';
			editorContainer.style.width = '100%';
			editorContainer.style.height = '100%';
			editorContainer.style.borderRadius = 'inherit';
			editorContainer.style.overflow = 'hidden';
		}

		// 将编辑器添加到卡片中，而不是内容区域的父元素
		cardElement.appendChild(editor);
	}

	// 退出编辑模式
	exitEditMode(cardElement: HTMLElement, contentDiv: HTMLElement, newContent: string) {
		// 移除编辑模式样式
		cardElement.classList.remove('editing');
		cardElement.style.zIndex = '';
		cardElement.style.boxShadow = '';
		cardElement.style.position = ''; // 重置定位

		// 移除编辑器
		const editor = cardElement.querySelector('.card-editor-container');
		if (editor) {
			editor.remove();
		}

		// 更新内容显示
		if (newContent !== undefined) {
			contentDiv.innerHTML = this.formatTextContent(newContent);
		}
		contentDiv.style.display = '';
	}

	// 格式化文本内容
	private formatTextContent(text: string): string {
		// 简单的文本格式化，保持换行
		return text.replace(/\n/g, '<br>');
	}

	// 保存文本节点
	async saveTextNode(node: CanvasNode, newText: string) {
		if (!this.canvasData) return;

		// 更新节点数据
		node.text = newText;

		// 保存到文件
		await this.saveCanvasData();

		// 重新渲染该卡片
		this.refreshCard(node);

		// 显示保存成功提示
		new Notice('文本已保存');
	}

	// 保存链接节点
	async saveLinkNode(node: CanvasNode, newUrl: string) {
		if (!this.canvasData) return;

		// 更新节点数据
		node.url = newUrl;

		// 保存到文件
		await this.saveCanvasData();

		// 重新渲染该卡片
		this.refreshCard(node);

		// 显示保存成功提示
		new Notice('链接已保存');
	}



	// 刷新单个卡片
	refreshCard(node: CanvasNode) {
		const cardElement = this.gridContainer.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
		if (!cardElement) return;

		// 找到内容区域
		const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 重新渲染内容
		contentDiv.innerHTML = '';
		if (node.type === 'text') {
			this.renderTextNodeContent(contentDiv, node);
		} else if (node.type === 'link') {
			this.renderLinkNodeContent(contentDiv, node);
		}
	}

	// 渲染文本节点内容（提取的方法）
	renderTextNodeContent(contentDiv: HTMLElement, node: CanvasNode) {
		if (node.text) {
			const rendered = this.simpleMarkdownRender(node.text);
			contentDiv.innerHTML = rendered;
		} else {
			contentDiv.textContent = "空文本节点";
			contentDiv.style.color = 'var(--text-muted)';
			contentDiv.style.fontStyle = 'italic';
		}
	}

	// 渲染带预览的链接节点
	private async renderLinkNodeWithPreview(contentDiv: HTMLElement, node: CanvasNode) {
		if (!node.url) {
			contentDiv.textContent = "无效的链接";
			contentDiv.style.color = 'var(--text-error)';
			contentDiv.style.fontStyle = 'italic';
			return;
		}

		// 先显示加载状态
		this.renderLinkLoadingState(contentDiv, node.url);

		try {
			// 获取链接预览数据
			const preview = await this.fetchLinkPreview(node.url);

			// 清空内容并渲染预览
			contentDiv.empty();
			this.renderLinkPreview(contentDiv, preview);
		} catch (error) {
			console.error('Failed to render link preview:', error);
			// 如果预览失败，回退到简单显示
			contentDiv.empty();
			this.renderSimpleLinkFallback(contentDiv, node.url);
		}
	}

	// 渲染链接加载状态
	private renderLinkLoadingState(contentDiv: HTMLElement, url: string) {
		contentDiv.empty();
		contentDiv.addClass('link-preview-loading');

		// 创建加载骨架
		const skeleton = contentDiv.createDiv('link-preview-skeleton');

		// 标题骨架
		const titleSkeleton = skeleton.createDiv('skeleton-title');

		// 描述骨架
		const descSkeleton = skeleton.createDiv('skeleton-description');

		// URL显示
		const urlDiv = skeleton.createDiv('skeleton-url');
		urlDiv.textContent = this.formatUrlForDisplay(url);
	}

	// 渲染链接预览
	private renderLinkPreview(contentDiv: HTMLElement, preview: LinkPreview) {
		contentDiv.addClass('link-bookmark-card');

		// 创建书签容器
		const bookmarkContainer = contentDiv.createDiv('link-bookmark-container');

		// 左侧内容区域
		const contentArea = bookmarkContainer.createDiv('link-bookmark-content');

		// 标题
		const titleEl = contentArea.createDiv('link-bookmark-title');
		titleEl.textContent = preview.title || this.extractDomainFromUrl(preview.url);

		// 描述（限制显示行数）
		if (preview.description) {
			const descEl = contentArea.createDiv('link-bookmark-description');
			descEl.textContent = preview.description;
		}

		// 底部信息：网站信息
		const footerEl = contentArea.createDiv('link-bookmark-footer');

		// 网站图标和名称
		const siteInfo = footerEl.createDiv('link-bookmark-site-info');

		// 网站图标
		if (preview.favicon) {
			const faviconEl = siteInfo.createEl('img', {
				cls: 'link-bookmark-favicon',
				attr: {
					src: preview.favicon,
					alt: 'Site icon'
				}
			});

			// 图标加载错误处理
			faviconEl.addEventListener('error', () => {
				faviconEl.style.display = 'none';
			});
		}

		// 网站名称
		const siteNameEl = siteInfo.createSpan('link-bookmark-site-name');
		siteNameEl.textContent = preview.siteName || this.extractDomainFromUrl(preview.url);

		// URL显示
		const urlEl = footerEl.createDiv('link-bookmark-url');
		urlEl.textContent = this.formatUrlForDisplay(preview.url);

		// 右侧缩略图（如果有的话）
		if (preview.image) {
			const imageContainer = bookmarkContainer.createDiv('link-bookmark-image-container');
			const img = imageContainer.createEl('img', {
				cls: 'link-bookmark-image',
				attr: {
					src: preview.image,
					alt: preview.title || 'Link preview image'
				}
			});

			// 图片加载错误处理
			img.addEventListener('error', () => {
				imageContainer.style.display = 'none';
				bookmarkContainer.classList.add('no-image');
			});
		} else {
			bookmarkContainer.classList.add('no-image');
		}

		// 点击事件 - 在新标签页打开链接
		bookmarkContainer.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			window.open(preview.url, '_blank');
		});

		// 悬停效果
		bookmarkContainer.style.cursor = 'pointer';
		bookmarkContainer.title = `打开链接: ${preview.url}`;
	}

	// 简单链接回退显示
	private renderSimpleLinkFallback(contentDiv: HTMLElement, url: string) {
		const linkElement = contentDiv.createEl('a', {
			cls: 'external-link simple-link',
			href: url
		});

		// 显示域名
		const displayText = this.extractDomainFromUrl(url);
		linkElement.textContent = displayText;

		// 添加外部链接图标
		const linkIcon = linkElement.createSpan('external-link-icon');
		linkIcon.innerHTML = `
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
				<polyline points="15,3 21,3 21,9"/>
				<line x1="10" y1="14" x2="21" y2="3"/>
			</svg>
		`;

		// 添加点击事件
		linkElement.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			window.open(url, '_blank');
		});
	}

	// 渲染链接节点内容（编辑时使用的简化版本）
	renderLinkNodeContent(contentDiv: HTMLElement, node: CanvasNode) {
		if (node.url) {
			this.renderSimpleLinkFallback(contentDiv, node.url);
		} else {
			contentDiv.textContent = "无效的链接";
			contentDiv.style.color = 'var(--text-error)';
			contentDiv.style.fontStyle = 'italic';
		}
	}

	// 格式化URL用于显示
	private formatUrlForDisplay(url: string): string {
		try {
			const urlObj = new URL(url);
			const domain = urlObj.hostname;
			const path = urlObj.pathname;

			// 如果URL太长，进行截断
			if (url.length > 50) {
				if (path.length > 20) {
					return `${domain}${path.substring(0, 15)}...`;
				} else {
					return `${domain}${path}`;
				}
			}

			return url;
		} catch {
			// 如果不是有效的URL，直接返回原始字符串（截断处理）
			return url.length > 50 ? url.substring(0, 47) + '...' : url;
		}
	}

	// 获取链接预览数据
	private async fetchLinkPreview(url: string): Promise<LinkPreview> {
		// 检查缓存
		const cachedItem = this.getCacheItem(url);
		if (cachedItem) {
			return cachedItem;
		}

		// 检查是否正在加载
		if (this.previewLoadingUrls.has(url)) {
			return { url, isLoading: true };
		}

		// 标记为正在加载
		this.previewLoadingUrls.add(url);

		try {
			// 使用CORS代理或直接获取（这里使用一个简单的实现）
			const preview = await this.extractLinkMetadata(url);

			// 缓存结果
			this.setCacheItem(url, preview);
			this.previewLoadingUrls.delete(url);

			return preview;
		} catch (error) {
			console.error('Failed to fetch link preview:', error);
			const errorPreview: LinkPreview = {
				url,
				error: 'Failed to load preview',
				title: this.extractDomainFromUrl(url)
			};

			this.setCacheItem(url, errorPreview);
			this.previewLoadingUrls.delete(url);

			return errorPreview;
		}
	}

	// 提取链接元数据（带重试机制）
	private async extractLinkMetadata(url: string, retryCount = 0): Promise<LinkPreview> {
		const maxRetries = 2;
		const retryDelay = 1000; // 1秒

		try {
			// 验证URL格式
			new URL(url); // 这会抛出错误如果URL无效

			// 由于CORS限制，我们使用一个公共的元数据提取服务
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

			try {
				const response = await fetch(
					`https://api.microlink.io/?url=${encodeURIComponent(url)}`,
					{
						signal: controller.signal,
						headers: {
							'Accept': 'application/json',
							'User-Agent': 'Obsidian Canvas Grid Plugin'
						}
					}
				);

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const data = await response.json();

				if (data.status === 'success' && data.data) {
					return {
						url,
						title: data.data.title || this.extractDomainFromUrl(url),
						description: data.data.description || '',
						image: data.data.image?.url || '',
						siteName: data.data.publisher || this.extractDomainFromUrl(url),
						favicon: data.data.logo?.url || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`
					};
				} else {
					throw new Error(`API返回错误状态: ${data.status || 'unknown'}`);
				}
			} catch (fetchError) {
				clearTimeout(timeoutId);
				throw fetchError;
			}
		} catch (error) {
			console.warn(`链接预览获取失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, error);

			// 如果还有重试次数，则重试
			if (retryCount < maxRetries) {
				console.log(`等待 ${retryDelay}ms 后重试...`);
				await new Promise(resolve => setTimeout(resolve, retryDelay));
				return this.extractLinkMetadata(url, retryCount + 1);
			}

			// 所有重试都失败，返回基本信息
			try {
				const urlObj = new URL(url);
				return {
					url,
					title: this.extractDomainFromUrl(url),
					siteName: this.extractDomainFromUrl(url),
					favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`,
					error: error instanceof Error ? error.message : '获取预览失败'
				};
			} catch (urlError) {
				// URL格式无效的回退
				return {
					url,
					title: '无效链接',
					siteName: '未知',
					error: 'URL格式无效'
				};
			}
		}
	}

	// 从URL提取域名
	private extractDomainFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace('www.', '');
		} catch {
			return url;
		}
	}

	// 显示消息
	showMessage(message: string) {
		this.gridContainer.empty();
		const messageEl = this.gridContainer.createDiv("grid-message");
		messageEl.textContent = message;
		messageEl.style.textAlign = 'center';
		messageEl.style.color = 'var(--text-muted)';
		messageEl.style.marginTop = '50px';
	}

	// 显示加载状态
	showLoadingState() {
		this.gridContainer.empty();
		const loadingEl = this.gridContainer.createDiv("canvas-grid-loading");
		loadingEl.textContent = "正在加载Canvas数据...";
	}

	// 隐藏加载状态
	hideLoadingState() {
		const loadingEl = this.gridContainer.querySelector('.canvas-grid-loading');
		if (loadingEl) {
			loadingEl.remove();
		}
	}

	// 显示错误状态
	showErrorState(errorMessage: string) {
		this.gridContainer.empty();
		const errorEl = this.gridContainer.createDiv("canvas-grid-error");

		const titleEl = errorEl.createEl("h3");
		titleEl.textContent = "加载失败";
		titleEl.style.color = 'var(--text-error)';

		const messageEl = errorEl.createEl("p");
		messageEl.textContent = errorMessage;
		messageEl.style.color = 'var(--text-muted)';

		const retryBtn = errorEl.createEl("button", {
			text: "重试",
			cls: "mod-cta"
		});
		retryBtn.onclick = () => this.loadActiveCanvas();

		errorEl.style.textAlign = 'center';
		errorEl.style.marginTop = '50px';
	}

	// 打开网格设置
	openGridSettings() {
		// TODO: 实现设置对话框
		console.log('Open grid settings');
	}

	// 切换到Canvas视图
	async switchToCanvasView() {
		// 首先尝试使用当前活动文件
		let targetFile = this.app.workspace.getActiveFile();

		// 如果当前文件不是Canvas文件，尝试使用关联的Canvas文件
		if (!targetFile || targetFile.extension !== 'canvas') {
			if (this.linkedCanvasFile) {
				targetFile = this.linkedCanvasFile;
				console.log('Using linked canvas file:', targetFile.path);
			} else {
				new Notice('没有关联的Canvas文件，请先关联一个Canvas文件');
				return;
			}
		}

		// 查找现有的Canvas视图（只在主工作区查找）
		const targetLeaf = this.findExistingCanvasLeaf(targetFile);

		if (targetLeaf) {
			// 如果找到现有的Canvas视图，激活它
			this.app.workspace.setActiveLeaf(targetLeaf);
			console.log('Activated existing canvas view');
		} else {
			// 如果没有找到，在主工作区创建新的标签页
			try {
				await this.openCanvasInMainWorkspace(targetFile);
			} catch (error) {
				console.error('Failed to open canvas file:', error);
				new Notice('无法打开Canvas文件');
			}
		}
	}

	// 查找现有的Canvas叶子（避免重复打开）
	private findExistingCanvasLeaf(targetFile: TFile): WorkspaceLeaf | null {
		// 获取所有Canvas类型的叶子
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');

		for (const leaf of canvasLeaves) {
			const view = leaf.view as any;
			if (view && view.file && view.file.path === targetFile.path) {
				// 检查叶子是否在主工作区（不在侧边栏）
				if (this.isLeafInMainWorkspace(leaf)) {
					console.log('Found existing canvas leaf in main workspace');
					return leaf;
				}
			}
		}

		return null;
	}

	// 检查叶子是否在主工作区
	private isLeafInMainWorkspace(leaf: WorkspaceLeaf): boolean {
		// 检查叶子的父容器，确保不在侧边栏
		let parent = leaf.parent;
		while (parent) {
			// 如果父容器是左侧或右侧边栏，则不在主工作区
			if (parent === this.app.workspace.leftSplit || parent === this.app.workspace.rightSplit) {
				return false;
			}
			parent = parent.parent;
		}
		return true;
	}

	// 在主工作区打开Canvas文件
	private async openCanvasInMainWorkspace(targetFile: TFile): Promise<void> {
		try {
			// 方法1：尝试在主工作区创建新标签页
			const newLeaf = this.app.workspace.getLeaf('tab');

			if (newLeaf && this.isLeafInMainWorkspace(newLeaf)) {
				await newLeaf.openFile(targetFile);
				this.app.workspace.setActiveLeaf(newLeaf);
				console.log('Opened canvas file in new tab in main workspace');
				return;
			}

			// 方法2：回退到使用根分割创建新叶子
			const rootLeaf = this.app.workspace.getLeaf(true);
			if (rootLeaf) {
				await rootLeaf.openFile(targetFile);
				this.app.workspace.setActiveLeaf(rootLeaf);
				console.log('Opened canvas file in new leaf in main workspace');
				return;
			}

			throw new Error('无法创建新的工作区叶子');
		} catch (error) {
			console.error('Failed to open canvas in main workspace:', error);
			throw error;
		}
	}

	async onClose() {
		// 清理资源，防止内存泄漏
		if (this.gridContainer) {
			// 移除事件监听器
			this.gridContainer.removeEventListener('click', this.handleCardClick);
			this.gridContainer.removeEventListener('dblclick', this.handleCardDoubleClick);
			this.gridContainer.removeEventListener('contextmenu', this.handleCardContextMenu);
			this.gridContainer.removeEventListener('keydown', this.handleKeyDown);
		}

		// 移除文档点击监听器
		document.removeEventListener('click', this.handleDocumentClick);

		// 清理所有全局事件监听器
		this.globalEventListeners.forEach(({ element, event, handler, options }) => {
			try {
				element.removeEventListener(event, handler, options);
			} catch (error) {
				console.warn('Failed to remove event listener:', error);
			}
		});
		this.globalEventListeners.length = 0;

		// 清理所有定时器
		this.activeTimeouts.forEach(timeoutId => {
			try {
				clearTimeout(timeoutId);
			} catch (error) {
				console.warn('Failed to clear timeout:', error);
			}
		});
		this.activeTimeouts.clear();

		this.activeIntervals.forEach(intervalId => {
			try {
				clearInterval(intervalId);
			} catch (error) {
				console.warn('Failed to clear interval:', error);
			}
		});
		this.activeIntervals.clear();

		// 清理定时器（如果有的话）
		if (this.refreshTimer) {
			this.safeClearInterval(this.refreshTimer);
			this.refreshTimer = null;
		}

		// 清理缓存清理定时器
		if (this.cacheCleanupInterval) {
			this.safeClearInterval(this.cacheCleanupInterval);
			this.cacheCleanupInterval = null;
		}

		// 清理右键菜单
		this.hideContextMenu();

		// 清理缓存
		this.linkPreviewCache.clear();
		this.previewLoadingUrls.clear();
		this.clearRenderCache();

		// 清理DOM引用
		this.gridContainer = null;
		this.canvasData = null;
		this.searchInputEl = null;
		this.colorFilterContainer = null;
		this.dropIndicator = null;

		// 清理宽度控制
		this.cleanupWidthControl();

		// 清理关联的Canvas文件引用
		this.linkedCanvasFile = null;
		if (this.linkedTabManager) {
			// LinkedTabManager没有cleanup方法，只需要清空引用
			this.linkedTabManager = null;
		}
	}

	// 事件处理器引用，用于清理
	private refreshTimer: NodeJS.Timeout | null = null;

	// 统一处理网格中的所有点击事件
	private handleGridClick = (e: Event) => {
		const target = e.target as HTMLElement;
		console.log('网格点击事件:', target.className, target.tagName);

		// 检查是否点击了工具栏按钮
		const toolbarBtn = target.closest('.canvas-card-toolbar-btn') as HTMLElement;
		if (toolbarBtn) {
			console.log('检测到工具栏按钮点击');
			e.stopPropagation();
			this.handleToolbarButtonClick(toolbarBtn, e);
			return;
		}

		// 检查是否点击了卡片
		const card = target.closest('.canvas-grid-card') as HTMLElement;
		if (card && card.dataset.nodeId) {
			console.log('检测到卡片点击');
			const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
			if (node) {
				this.onCardClick(node, card);
			}
		}
	};

	// 处理工具栏按钮点击
	private handleToolbarButtonClick = (button: HTMLElement, e: Event) => {
		console.log('工具栏按钮被点击:', button.className);

		const card = button.closest('.canvas-grid-card') as HTMLElement;
		if (!card || !card.dataset.nodeId) {
			console.log('未找到卡片或节点ID');
			return;
		}

		const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
		if (!node) {
			console.log('未找到对应的节点数据');
			return;
		}

		console.log('执行工具栏操作，节点:', node.id);

		// 根据按钮类型执行相应操作
		if (button.classList.contains('canvas-card-toolbar-delete')) {
			console.log('执行删除操作');
			this.deleteCardFromToolbar(card);
		} else if (button.classList.contains('canvas-card-toolbar-color')) {
			console.log('执行颜色设置操作');
			this.showColorPicker(card, node);
		} else {
			console.log('未识别的按钮类型:', button.className);
		}
	};

	// 保留原有的卡片点击处理方法（用于向后兼容）
	private handleCardClick = (e: Event) => {
		const card = (e.target as HTMLElement).closest('.canvas-grid-card') as HTMLElement;
		if (card && card.dataset.nodeId) {
			const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
			if (node) {
				this.onCardClick(node, card);
			}
		}
	};

	private handleCardDoubleClick = (e: Event) => {
		const card = (e.target as HTMLElement).closest('.canvas-grid-card') as HTMLElement;
		if (card && card.dataset.nodeId && !card.classList.contains('editing')) {
			const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
			if (node) {
				e.preventDefault();
				e.stopPropagation();
				this.onCardDoubleClick(node, card);
			}
		}
	};

	private handleKeyDown = (e: KeyboardEvent) => {
		const target = e.target as HTMLElement;

		// 处理工具栏按钮的键盘事件
		if (target.classList.contains('canvas-card-toolbar-btn') && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			e.stopPropagation();
			// 触发按钮点击
			this.handleToolbarButtonClick(target, e);
			return;
		}

		// 处理卡片的键盘事件
		const card = target;
		if (card.classList.contains('canvas-grid-card') && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			// Enter键触发双击编辑
			if (e.key === 'Enter') {
				const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
				if (node && !card.classList.contains('editing')) {
					this.onCardDoubleClick(node, card);
				}
			} else {
				card.click();
			}
		}
	};

	// 处理右键菜单
	private handleCardContextMenu = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		const card = target.closest('.canvas-grid-card') as HTMLElement;

		if (card) {
			e.preventDefault();
			this.showContextMenu(card, e.clientX, e.clientY);
		}
	};

	// 处理文档点击，关闭右键菜单和退出编辑状态
	private handleDocumentClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement;

		// 关闭右键菜单
		if (!target.closest('.canvas-grid-context-menu')) {
			this.hideContextMenu();
		}

		// 处理编辑状态退出
		if (this.currentEditingCard && this.currentEditingNode) {
			// 检查点击是否在当前编辑的卡片内
			const clickedInCurrentCard = target.closest('.canvas-grid-card') === this.currentEditingCard;
			// 检查点击是否在编辑器内
			const clickedInEditor = target.closest('.card-editor-container');
			// 检查点击是否在网格容器内
			const clickedInGrid = target.closest('.canvas-grid-container');

			// 如果点击在网格外，或者点击在其他卡片上，则退出编辑状态并保存
			if (!clickedInGrid || (!clickedInCurrentCard && !clickedInEditor && clickedInGrid)) {
				console.log('点击网格外或其他区域，退出编辑状态并保存');
				this.exitCurrentEditingState(true); // 保存当前编辑
			}
		}
	};

	// 显示右键菜单
	private showContextMenu(card: HTMLElement, x: number, y: number) {
		// 移除现有菜单
		this.hideContextMenu();

		const nodeId = card.dataset.nodeId;
		if (!nodeId) return;

		// 创建菜单容器
		const menu = document.createElement('div');
		menu.className = 'canvas-grid-context-menu';

		// 创建菜单项
		const focusItem = this.createMenuItem('聚焦节点', 'lucide-target', () => {
			this.focusNodeInCanvas(nodeId);
			this.hideContextMenu();
		});

		const editItem = this.createMenuItem('编辑', 'lucide-edit', () => {
			this.editCard(card);
			this.hideContextMenu();
		});

		const deleteItem = this.createMenuItem('删除', 'lucide-trash-2', () => {
			this.deleteCard(card);
			this.hideContextMenu();
		});

		menu.appendChild(focusItem);
		menu.appendChild(editItem);
		menu.appendChild(deleteItem);

		// 设置菜单位置
		menu.style.left = `${x}px`;
		menu.style.top = `${y}px`;

		// 添加到页面
		document.body.appendChild(menu);

		// 调整位置避免超出屏幕
		this.adjustMenuPosition(menu, x, y);
	}

	// 创建菜单项
	private createMenuItem(text: string, iconClass: string, onClick: () => void): HTMLElement {
		const item = document.createElement('div');
		item.className = 'canvas-grid-context-menu-item';

		const icon = document.createElement('div');
		icon.className = `canvas-grid-context-menu-icon ${iconClass}`;

		const label = document.createElement('span');
		label.textContent = text;

		item.appendChild(icon);
		item.appendChild(label);

		item.addEventListener('click', onClick);

		return item;
	}

	// 调整菜单位置
	private adjustMenuPosition(menu: HTMLElement, x: number, y: number) {
		const rect = menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let adjustedX = x;
		let adjustedY = y;

		// 避免超出右边界
		if (x + rect.width > viewportWidth) {
			adjustedX = viewportWidth - rect.width - 10;
		}

		// 避免超出下边界
		if (y + rect.height > viewportHeight) {
			adjustedY = viewportHeight - rect.height - 10;
		}

		menu.style.left = `${adjustedX}px`;
		menu.style.top = `${adjustedY}px`;
	}

	// 隐藏右键菜单
	private hideContextMenu() {
		const existingMenu = document.querySelector('.canvas-grid-context-menu');
		if (existingMenu) {
			existingMenu.remove();
		}
	}

	// 编辑卡片
	private editCard(card: HTMLElement) {
		const nodeId = card.dataset.nodeId;
		if (!nodeId) return;

		const node = this.canvasData?.nodes.find(n => n.id === nodeId);
		if (node && !card.classList.contains('editing')) {
			this.onCardDoubleClick(node, card);
		}
	}

	// 删除卡片
	private async deleteCard(card: HTMLElement) {
		const nodeId = card.dataset.nodeId;
		if (!nodeId) return;

		// 确认删除
		const confirmed = confirm('确定要删除这个节点吗？');
		if (!confirmed) return;

		try {
			// 从Canvas数据中删除节点
			await this.deleteNodeFromCanvas(nodeId);

			// 从视图中移除卡片
			card.remove();



			console.log('卡片删除完成，UI已更新');

		} catch (error) {
			console.error('删除卡片失败:', error);
			new Notice('删除卡片失败');
		}
	}

	// 从Canvas数据中删除节点
	private async deleteNodeFromCanvas(nodeId: string) {
		// 确定要操作的Canvas文件
		let targetFile: TFile | null = null;

		if (this.linkedCanvasFile) {
			// 如果有关联文件，使用关联文件
			targetFile = this.linkedCanvasFile;
		} else {
			// 否则使用当前活动文件
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile && activeFile.extension === 'canvas') {
				targetFile = activeFile;
			}
		}

		if (!targetFile) {
			console.error('无法确定目标Canvas文件');
			new Notice('删除失败：无法确定目标Canvas文件');
			return;
		}

		try {
			// 临时禁用文件监听，避免循环更新
			this.disableFileWatcher();

			const content = await this.app.vault.read(targetFile);
			const canvasData = JSON.parse(content);

			// 检查节点是否存在
			const nodeExists = canvasData.nodes.some((node: any) => node.id === nodeId);
			if (!nodeExists) {
				console.warn('节点不存在，可能已被删除:', nodeId);
				return;
			}

			// 删除节点
			canvasData.nodes = canvasData.nodes.filter((node: any) => node.id !== nodeId);

			// 删除相关的边
			canvasData.edges = canvasData.edges.filter((edge: any) =>
				edge.fromNode !== nodeId && edge.toNode !== nodeId
			);

			// 保存文件
			await this.app.vault.modify(targetFile, JSON.stringify(canvasData, null, 2));

			// 更新本地数据
			this.canvasData = canvasData;

			// 重要：同时更新筛选结果，移除已删除的节点
			this.filteredNodes = this.filteredNodes.filter(node => node.id !== nodeId);

			console.log('节点删除完成，更新筛选结果:', {
				deletedNodeId: nodeId,
				remainingFilteredNodes: this.filteredNodes.length
			});

			// 重新启用文件监听
			this.safeSetTimeout(() => {
				this.enableFileWatcher();
			}, 1000);

			console.log('节点删除成功:', nodeId);
			new Notice('节点删除成功');

		} catch (error) {
			console.error('删除节点失败:', error);
			new Notice('删除节点失败');
			// 确保重新启用文件监听
			this.enableFileWatcher();
		}
	}

	// 禁用文件监听器
	private disableFileWatcher() {
		this.fileWatcherDisabled = true;
	}

	// 启用文件监听器
	private enableFileWatcher() {
		this.fileWatcherDisabled = false;
	}

	// 保存单个节点到Canvas文件
	async saveNodeToCanvas(node: CanvasNode): Promise<void> {
		if (!node || !node.id) {
			throw new Error('节点数据无效');
		}

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'canvas') {
			throw new Error('当前没有打开Canvas文件');
		}

		try {
			console.log('Saving node to canvas:', node.id);

			const content = await this.app.vault.read(activeFile);

			let canvasData: CanvasData;
			try {
				canvasData = JSON.parse(content);
			} catch (parseError) {
				throw new Error('Canvas文件格式无效');
			}

			// 验证Canvas数据结构
			if (!Array.isArray(canvasData.nodes)) {
				throw new Error('Canvas文件缺少有效的节点数据');
			}

			// 找到并更新节点
			const nodeIndex = canvasData.nodes.findIndex((n: CanvasNode) => n.id === node.id);
			if (nodeIndex === -1) {
				throw new Error(`节点不存在: ${node.id}`);
			}

			// 合并节点数据，保留原有属性
			canvasData.nodes[nodeIndex] = { ...canvasData.nodes[nodeIndex], ...node };

			// 验证更新后的数据
			const updatedNode = canvasData.nodes[nodeIndex];
			if (!updatedNode.id || !updatedNode.type) {
				throw new Error('更新后的节点数据无效');
			}

			// 保存文件
			const jsonContent = JSON.stringify(canvasData, null, 2);
			await this.app.vault.modify(activeFile, jsonContent);

			console.log('Node saved successfully:', node.id);
		} catch (error) {
			console.error('保存节点失败:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			throw new Error(`保存节点失败: ${errorMessage}`);
		}
	}

	// ==================== 聚焦功能实现 ====================

	// 聚焦到Canvas中的指定节点
	async focusNodeInCanvas(nodeId: string): Promise<boolean> {
		try {
			console.log('=== Starting focus operation for node:', nodeId);
			new Notice('正在定位节点...', 2000);

			// 1. 确保切换到Canvas视图
			await this.ensureCanvasView();

			// 2. 等待Canvas视图完全加载
			await this.waitForCanvasLoad();

			// 3. 获取Canvas视图和API
			const canvasView = this.getActiveCanvasView();
			if (!canvasView) {
				new Notice('无法获取Canvas视图');
				return false;
			}

			console.log('Canvas view obtained, detecting API...');
			const canvasAPI = this.detectCanvasAPI(canvasView);
			if (!canvasAPI) {
				console.log('Canvas API not available, falling back to simulation');
				// 回退到模拟操作
				return this.focusNodeBySimulation(nodeId);
			}

			// 4. 获取节点数据
			const nodeData = this.canvasData?.nodes.find(n => n.id === nodeId);
			if (!nodeData) {
				new Notice('找不到目标节点');
				return false;
			}

			console.log('Node data found:', nodeData);

			// 5. 执行聚焦
			console.log('Executing focus operations...');
			const success = await this.executeCanvasFocus(canvasAPI, nodeId, nodeData);

			if (success) {
				new Notice('已聚焦到目标节点', 3000);
				return true;
			} else {
				console.log('Canvas API focus failed, falling back to simulation');
				return this.focusNodeBySimulation(nodeId);
			}

		} catch (error) {
			console.error('聚焦节点失败:', error);
			new Notice('聚焦失败，请手动定位');
			return false;
		}
	}

	// 确保切换到Canvas视图
	private async ensureCanvasView(): Promise<void> {
		console.log('Ensuring canvas view...');

		// 首先检查是否有关联的Canvas文件
		if (!this.linkedCanvasFile) {
			new Notice('没有关联的Canvas文件，请先关联一个Canvas文件');
			throw new Error('No linked canvas file');
		}

		// 查找现有的Canvas视图（显示关联文件的）
		const targetLeaf = this.findExistingCanvasLeaf(this.linkedCanvasFile);

		if (targetLeaf) {
			// 如果找到现有的Canvas视图，激活它
			console.log('Found existing canvas view, activating...');
			this.app.workspace.setActiveLeaf(targetLeaf);

			// 等待视图激活完成
			await new Promise(resolve => {
				this.safeSetTimeout(() => resolve(undefined), 300);
			});
			return;
		}

		// 检查当前是否已经是正确的Canvas视图
		const activeLeaf = this.app.workspace.activeLeaf;
		if (activeLeaf && activeLeaf.view.getViewType() === 'canvas') {
			const canvasView = activeLeaf.view as any;
			if (canvasView && canvasView.file && canvasView.file.path === this.linkedCanvasFile.path) {
				console.log('Already in correct canvas view');
				return;
			}
		}

		// 如果没有找到现有视图，创建新的Canvas视图
		console.log('Creating new canvas view...');
		await this.openCanvasInMainWorkspace(this.linkedCanvasFile);

		// 等待视图切换完成
		await new Promise(resolve => {
			this.safeSetTimeout(() => resolve(undefined), 800);
		});

		// 验证切换是否成功
		const newActiveLeaf = this.app.workspace.activeLeaf;
		if (newActiveLeaf && newActiveLeaf.view.getViewType() === 'canvas') {
			console.log('Successfully switched to canvas view');
		} else {
			console.warn('Failed to switch to canvas view');
			throw new Error('无法切换到Canvas视图');
		}
	}

	// 探测Canvas视图的可用API
	private detectCanvasAPI(canvasView: unknown): CanvasAPI | null {
		try {
			console.log('Canvas view object:', canvasView);

			if (!canvasView || typeof canvasView !== 'object') {
				console.warn('Invalid canvas view object');
				return null;
			}

			console.log('Canvas view properties:', Object.keys(canvasView));

			if (!hasProperty(canvasView, 'canvas')) {
				console.warn('Canvas view does not have canvas property');
				return null;
			}

			const canvas = canvasView.canvas;
			console.log('Canvas object:', canvas);

			if (!canvas) {
				console.warn('Canvas object not found in view');
				return null;
			}

			console.log('Canvas properties:', Object.keys(canvas));
			console.log('Canvas methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(canvas)));

			// 探索所有可用方法
			this.exploreCanvasAPI(canvas);

			// 尝试查找实际可用的方法
			const apiMethods = this.findCanvasAPIMethods(canvas);

			if (!apiMethods) {
				console.log('No suitable Canvas API methods found');
				return null;
			}

			console.log('Found Canvas API methods:', apiMethods);
			return apiMethods;

		} catch (error) {
			console.error('Failed to detect Canvas API:', error);
			return null;
		}
	}

	// 查找Canvas API的实际方法
	private findCanvasAPIMethods(canvas: unknown): CanvasAPI | null {
		// 获取所有方法
		const allMethods = this.getAllMethods(canvas);
		console.log('All canvas methods:', allMethods);

		// 查找缩放相关方法
		const zoomMethods = allMethods.filter(method =>
			method.toLowerCase().includes('zoom') ||
			method.toLowerCase().includes('scale') ||
			method.toLowerCase().includes('fit')
		);
		console.log('Zoom methods:', zoomMethods);

		// 查找选择相关方法
		const selectMethods = allMethods.filter(method =>
			method.toLowerCase().includes('select') ||
			method.toLowerCase().includes('focus') ||
			method.toLowerCase().includes('highlight')
		);
		console.log('Select methods:', selectMethods);

		// 查找节点相关方法
		const nodeMethods = allMethods.filter(method =>
			method.toLowerCase().includes('node') ||
			method.toLowerCase().includes('element') ||
			method.toLowerCase().includes('item')
		);
		console.log('Node methods:', nodeMethods);

		// 查找平移相关方法
		const panMethods = allMethods.filter(method =>
			method.toLowerCase().includes('pan') ||
			method.toLowerCase().includes('move') ||
			method.toLowerCase().includes('translate')
		);
		console.log('Pan methods:', panMethods);

		// 尝试构建API对象
		const api: any = {};

		// 查找zoomToBbox或类似方法
		const zoomToBboxMethod = this.findMethod(canvas, [
			'zoomToBbox', 'zoomToRect', 'zoomToArea', 'fitToRect', 'focusRect'
		]);
		if (zoomToBboxMethod) {
			api.zoomToBbox = zoomToBboxMethod;
		}

		// 查找选择方法
		const selectMethod = this.findMethod(canvas, [
			'selectNode', 'selectElement', 'select', 'setSelection', 'addSelection'
		]);
		if (selectMethod) {
			api.selectNode = selectMethod;
		}

		// 查找取消选择方法
		const deselectMethod = this.findMethod(canvas, [
			'deselectAll', 'clearSelection', 'deselect', 'unselectAll'
		]);
		if (deselectMethod) {
			api.deselectAll = deselectMethod;
		}

		// 查找获取节点方法
		const getNodeMethod = this.findMethod(canvas, [
			'getNode', 'getElement', 'getElementById', 'findNode'
		]);
		if (getNodeMethod) {
			api.getNode = getNodeMethod;
		}

		// 查找平移方法
		const panMethod = this.findMethod(canvas, [
			'panTo', 'moveTo', 'translateTo', 'setViewport'
		]);
		if (panMethod) {
			api.panTo = panMethod;
		}

		// 检查是否有足够的方法来实现聚焦
		if (api.zoomToBbox || (api.selectNode && api.panMethod)) {
			return api;
		}

		return null;
	}

	// 查找指定名称的方法
	private findMethod(obj: unknown, methodNames: string[]): Function | null {
		if (!obj || typeof obj !== 'object') {
			return null;
		}

		for (const name of methodNames) {
			if (hasProperty(obj, name) && typeof obj[name] === 'function') {
				console.log(`Found method: ${name}`);
				return (obj[name] as Function).bind(obj);
			}
		}
		return null;
	}

	// 获取对象的所有方法
	private getAllMethods(obj: any): string[] {
		const methods = new Set<string>();
		let current = obj;

		while (current && current !== Object.prototype) {
			Object.getOwnPropertyNames(current).forEach(name => {
				if (typeof obj[name] === 'function') {
					methods.add(name);
				}
			});
			current = Object.getPrototypeOf(current);
		}

		return Array.from(methods);
	}

	// 执行Canvas聚焦操作
	private async executeCanvasFocus(canvasAPI: any, nodeId: string, nodeData: CanvasNode): Promise<boolean> {
		try {
			// 1. 清除现有选择
			if (canvasAPI.deselectAll) {
				console.log('Clearing selection...');
				canvasAPI.deselectAll();
			}

			// 2. 选择目标节点
			if (canvasAPI.selectNode) {
				console.log('Selecting node:', nodeId);
				try {
					canvasAPI.selectNode(nodeId);
				} catch (error) {
					console.warn('selectNode failed:', error);
				}
			}

			// 3. 聚焦到节点
			if (canvasAPI.zoomToBbox) {
				console.log('Zooming to bbox...');
				const bbox = this.calculateOptimalBbox(nodeData);
				console.log('Calculated bbox:', bbox);
				try {
					canvasAPI.zoomToBbox(bbox);
					return true;
				} catch (error) {
					console.warn('zoomToBbox failed:', error);
				}
			}

			// 4. 备选方案：使用平移
			if (canvasAPI.panTo) {
				console.log('Using panTo as fallback...');
				const centerX = nodeData.x + nodeData.width / 2;
				const centerY = nodeData.y + nodeData.height / 2;
				try {
					canvasAPI.panTo(centerX, centerY);
					return true;
				} catch (error) {
					console.warn('panTo failed:', error);
				}
			}

			return false;
		} catch (error) {
			console.error('executeCanvasFocus failed:', error);
			return false;
		}
	}

	// 探索Canvas API的可用方法
	private exploreCanvasAPI(canvas: any) {
		console.log('=== Canvas API Exploration ===');

		// 获取所有属性和方法
		const allProps = [];
		let obj = canvas;
		while (obj && obj !== Object.prototype) {
			allProps.push(...Object.getOwnPropertyNames(obj));
			obj = Object.getPrototypeOf(obj);
		}

		const uniqueProps = [...new Set(allProps)];
		const methods = uniqueProps.filter(prop => {
			try {
				return typeof canvas[prop] === 'function';
			} catch {
				return false;
			}
		});

		console.log('All available methods:', methods);

		// 查找可能的聚焦相关方法
		const focusMethods = methods.filter(method =>
			method.toLowerCase().includes('zoom') ||
			method.toLowerCase().includes('focus') ||
			method.toLowerCase().includes('select') ||
			method.toLowerCase().includes('center') ||
			method.toLowerCase().includes('pan')
		);

		console.log('Potential focus-related methods:', focusMethods);
	}

	// 获取当前活动的Canvas视图
	private getActiveCanvasView(): any {
		console.log('=== Getting Canvas View ===');

		const activeLeaf = this.app.workspace.activeLeaf;
		console.log('Active leaf:', activeLeaf);
		console.log('Active leaf view type:', activeLeaf?.view?.getViewType());

		if (activeLeaf && activeLeaf.view.getViewType() === 'canvas') {
			console.log('Found active canvas view');
			return activeLeaf.view;
		}

		// 查找Canvas视图
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
		console.log('Canvas leaves found:', canvasLeaves.length);

		const activeFile = this.app.workspace.getActiveFile();
		console.log('Active file:', activeFile?.path);

		for (const leaf of canvasLeaves) {
			const view = leaf.view as any;
			console.log('Checking canvas leaf:', view?.file?.path);
			if (view && view.file && activeFile && view.file.path === activeFile.path) {
				console.log('Found matching canvas view');
				return view;
			}
		}

		console.log('No canvas view found');
		return null;
	}

	// 等待Canvas视图加载完成
	private async waitForCanvasLoad(): Promise<void> {
		return new Promise((resolve) => {
			// 简单的延迟，确保Canvas视图完全加载
			this.safeSetTimeout(() => resolve(undefined), 300);
		});
	}

	// 计算最佳聚焦边界框
	private calculateOptimalBbox(node: CanvasNode): BoundingBox {
		const padding = 100; // 周围留白

		return {
			minX: node.x - padding,
			minY: node.y - padding,
			maxX: node.x + node.width + padding,
			maxY: node.y + node.height + padding
		};
	}

	// 模拟操作聚焦节点（回退方案）
	private async focusNodeBySimulation(nodeId: string): Promise<boolean> {
		try {
			console.log('=== Starting simulation focus ===');

			// 获取节点数据
			const nodeData = this.canvasData?.nodes.find(n => n.id === nodeId);
			if (!nodeData) {
				new Notice('找不到目标节点');
				return false;
			}

			console.log('Node data for simulation:', nodeData);

			// 获取Canvas视图
			const canvasView = this.getActiveCanvasView();
			if (!canvasView || !canvasView.containerEl) {
				console.log('Canvas view or container not found');
				return false;
			}

			// 尝试多种方式查找Canvas元素
			const canvasSelectors = [
				'.canvas-wrapper',
				'.canvas-container',
				'.canvas-viewport',
				'.canvas',
				'[data-type="canvas"]',
				'.workspace-leaf-content[data-type="canvas"]'
			];

			let canvasElement = null;
			for (const selector of canvasSelectors) {
				canvasElement = canvasView.containerEl.querySelector(selector);
				if (canvasElement) {
					console.log(`Found canvas element with selector: ${selector}`);
					break;
				}
			}

			if (!canvasElement) {
				console.log('Canvas element not found, trying direct approach');
				// 尝试直接使用容器
				canvasElement = canvasView.containerEl;
			}

			// 尝试通过Canvas内部API直接操作
			if (canvasView.canvas) {
				console.log('Trying direct canvas manipulation...');
				const success = await this.tryDirectCanvasManipulation(canvasView.canvas, nodeId, nodeData);
				if (success) {
					new Notice('已聚焦到目标节点（直接操作）', 3000);
					return true;
				}
			}

			// 尝试查找并点击实际的节点元素
			const nodeElement = this.findNodeElement(canvasView.containerEl, nodeId);
			if (nodeElement) {
				console.log('Found node element, simulating click...');
				nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				nodeElement.click();
				new Notice('已聚焦到目标节点（元素点击）', 3000);
				return true;
			}

			new Notice('聚焦功能暂不可用，请手动定位', 3000);
			return false;

		} catch (error) {
			console.error('模拟聚焦失败:', error);
			new Notice('聚焦失败，请手动定位');
			return false;
		}
	}

	// 尝试直接操作Canvas对象
	private async tryDirectCanvasManipulation(canvas: any, nodeId: string, nodeData: CanvasNode): Promise<boolean> {
		try {
			console.log('Trying direct canvas manipulation...');
			console.log('Canvas object:', canvas);

			// 尝试查找节点相关的属性
			if (canvas.nodes && canvas.nodes.has && canvas.nodes.has(nodeId)) {
				console.log('Found node in canvas.nodes');
				const node = canvas.nodes.get(nodeId);
				console.log('Canvas node object:', node);

				// 尝试选择节点
				if (canvas.selection) {
					console.log('Setting canvas selection...');
					canvas.selection.clear();
					canvas.selection.add(node);
				}
			}

			// 尝试设置视图位置
			if (canvas.viewport || canvas.view) {
				const viewport = canvas.viewport || canvas.view;
				console.log('Found viewport:', viewport);

				const centerX = nodeData.x + nodeData.width / 2;
				const centerY = nodeData.y + nodeData.height / 2;

				// 尝试不同的视图设置方法
				if (viewport.setCenter) {
					viewport.setCenter(centerX, centerY);
					return true;
				} else if (viewport.panTo) {
					viewport.panTo(centerX, centerY);
					return true;
				} else if (viewport.x !== undefined && viewport.y !== undefined) {
					viewport.x = -centerX + viewport.width / 2;
					viewport.y = -centerY + viewport.height / 2;
					return true;
				}
			}

			return false;
		} catch (error) {
			console.error('Direct canvas manipulation failed:', error);
			return false;
		}
	}

	// 查找节点对应的DOM元素
	private findNodeElement(container: HTMLElement, nodeId: string): HTMLElement | null {
		// 尝试多种选择器查找节点元素
		const selectors = [
			`[data-node-id="${nodeId}"]`,
			`[data-id="${nodeId}"]`,
			`#${nodeId}`,
			`.canvas-node[data-id="${nodeId}"]`,
			`.canvas-card[data-id="${nodeId}"]`
		];

		for (const selector of selectors) {
			const element = container.querySelector(selector) as HTMLElement;
			if (element) {
				console.log(`Found node element with selector: ${selector}`);
				return element;
			}
		}

		console.log('Node element not found');
		return null;
	}

	// ==================== 拖拽功能实现 ====================

	// 设置拖拽处理器
	private setupDragDropHandlers() {
		console.log('Setting up drag and drop handlers...');

		// 1. 设置编辑器拖拽源监听
		this.setupEditorDragSource();

		// 2. 设置网格视图拖拽目标
		this.setupGridDropTarget();
	}

	// 设置编辑器拖拽源
	private setupEditorDragSource() {
		// 监听全局拖拽开始事件
		this.registerDomEvent(document, 'dragstart', (e: DragEvent) => {
			const target = e.target as HTMLElement;

			// 检查是否在编辑器中
			if (this.isInEditor(target)) {
				const selectedText = this.getSelectedText();
				if (selectedText && selectedText.trim()) {
					this.handleEditorDragStart(e, selectedText);
				}
			}
		});

		// 监听拖拽结束事件
		this.registerDomEvent(document, 'dragend', (e: DragEvent) => {
			this.resetDragState();
		});
	}

	// 检查是否在编辑器中
	private isInEditor(element: HTMLElement): boolean {
		return element.closest('.cm-editor') !== null ||
			   element.closest('.markdown-source-view') !== null ||
			   element.closest('.markdown-preview-view') !== null;
	}

	// 获取选中文本（使用Obsidian API）
	private getSelectedText(): string | null {
		try {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) return null;

			const editor = activeView.editor;
			const selection = editor.getSelection();

			return selection.trim() || null;
		} catch (error) {
			console.error('Failed to get selected text:', error);
			return null;
		}
	}

	// 处理编辑器拖拽开始
	private handleEditorDragStart(e: DragEvent, selectedText: string) {
		if (!e.dataTransfer) return;

		console.log('Drag started from editor:', selectedText);

		// 设置拖拽数据
		e.dataTransfer.setData('text/plain', selectedText);
		e.dataTransfer.setData('application/obsidian-text', selectedText);
		e.dataTransfer.effectAllowed = 'copy';

		// 保存拖拽状态
		this.isDragging = true;
		this.dragData = {
			text: selectedText,
			source: 'editor',
			timestamp: Date.now()
		};

		// 设置拖拽预览
		this.setDragPreview(e, selectedText);
	}

	// 设置拖拽预览
	private setDragPreview(e: DragEvent, text: string) {
		try {
			// 创建预览元素
			const preview = document.createElement('div');
			preview.style.cssText = `
				position: absolute;
				top: -1000px;
				left: -1000px;
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				padding: 8px 12px;
				font-size: 12px;
				color: var(--text-normal);
				max-width: 200px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
			`;
			preview.textContent = text.length > 50 ? text.substring(0, 50) + '...' : text;

			document.body.appendChild(preview);

			// 设置为拖拽图像
			if (e.dataTransfer) {
				e.dataTransfer.setDragImage(preview, 10, 10);
			}

			// 清理预览元素
			this.safeSetTimeout(() => {
				if (document.body.contains(preview)) {
					document.body.removeChild(preview);
				}
			}, 0);
		} catch (error) {
			console.error('Failed to set drag preview:', error);
		}
	}

	// 设置网格视图拖拽目标
	private setupGridDropTarget() {
		if (!this.gridContainer) return;

		console.log('Setting up grid drop target...');

		// 拖拽悬停
		this.registerDomEvent(this.gridContainer, 'dragover', (e: DragEvent) => {
			e.preventDefault();
			if (this.isDragging && this.dragData) {
				e.dataTransfer!.dropEffect = 'copy';
				this.showDropIndicator(e);
			}
		});

		// 拖拽进入
		this.registerDomEvent(this.gridContainer, 'dragenter', (e: DragEvent) => {
			e.preventDefault();
			if (this.isDragging) {
				this.gridContainer.classList.add('drag-over');
				console.log('Drag entered grid container');
			}
		});

		// 拖拽离开
		this.registerDomEvent(this.gridContainer, 'dragleave', (e: DragEvent) => {
			// 检查是否真的离开了容器
			if (!this.gridContainer.contains(e.relatedTarget as Node)) {
				this.gridContainer.classList.remove('drag-over');
				this.hideDropIndicator();
				console.log('Drag left grid container');
			}
		});

		// 拖拽放下
		this.registerDomEvent(this.gridContainer, 'drop', (e: DragEvent) => {
			e.preventDefault();
			console.log('Drop event received');
			this.handleGridDrop(e);
		});
	}

	// 显示拖拽指示器
	private showDropIndicator(e: DragEvent) {
		if (!this.dropIndicator) {
			this.dropIndicator = document.createElement('div');
			this.dropIndicator.className = 'drop-indicator';
			this.gridContainer.appendChild(this.dropIndicator);
		}

		// 计算指示器位置
		const rect = this.gridContainer.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// 计算网格位置
		const cols = Math.floor(this.gridContainer.clientWidth / (this.settings.cardWidth + this.settings.cardSpacing));
		const col = Math.floor(x / (this.settings.cardWidth + this.settings.cardSpacing));
		const row = Math.floor(y / (this.settings.cardHeight + this.settings.cardSpacing));

		// 设置指示器位置和大小
		this.dropIndicator.style.left = `${col * (this.settings.cardWidth + this.settings.cardSpacing)}px`;
		this.dropIndicator.style.top = `${row * (this.settings.cardHeight + this.settings.cardSpacing)}px`;
		this.dropIndicator.style.width = `${this.settings.cardWidth}px`;
		this.dropIndicator.style.height = `${this.settings.cardHeight}px`;
		this.dropIndicator.style.display = 'block';
	}

	// 隐藏拖拽指示器
	private hideDropIndicator() {
		if (this.dropIndicator) {
			this.dropIndicator.style.display = 'none';
		}
	}

	// 重置拖拽状态
	private resetDragState() {
		this.isDragging = false;
		this.dragData = null;
		this.gridContainer?.classList.remove('drag-over');
		this.hideDropIndicator();
		console.log('Drag state reset');
	}

	// 处理网格拖拽放下
	private async handleGridDrop(e: DragEvent) {
		try {
			// 清除拖拽状态
			this.gridContainer.classList.remove('drag-over');
			this.hideDropIndicator();

			// 获取拖拽数据
			const droppedText = e.dataTransfer?.getData('application/obsidian-text') ||
							   e.dataTransfer?.getData('text/plain');

			if (!droppedText || !droppedText.trim()) {
				new Notice('没有检测到有效的文本内容');
				return;
			}

			// 检查是否有关联的Canvas文件
			if (!this.linkedCanvasFile) {
				new Notice('请先关联一个Canvas文件');
				this.showCanvasSelectionDialog();
				return;
			}

			console.log('Processing drop with linked canvas:', this.linkedCanvasFile.path);
			new Notice('正在创建新卡片...', 2000);

			// 临时禁用文件监听，避免重复创建
			this.disableFileWatcher();

			// 创建新卡片
			const newNode = await this.createNodeFromText(droppedText, e);

			if (newNode) {
				// 保存到关联的Canvas文件
				await this.saveCanvasDataToLinkedFile();

				// 手动更新本地数据，避免重新加载
				if (this.canvasData) {
					this.canvasData.nodes.push(newNode);
				}

				// 重新渲染网格（不重新加载文件）
				this.renderGrid();

				// 通知Canvas视图刷新（如果打开）
				this.notifyCanvasViewRefresh();

				// 滚动到新创建的卡片
				this.scrollToNewCard(newNode.id);

				new Notice('新卡片创建成功！', 3000);
			}

			// 延迟重新启用文件监听
			this.safeSetTimeout(() => {
				this.enableFileWatcher();
			}, 1000);

		} catch (error) {
			console.error('拖拽创建卡片失败:', error);
			new Notice('创建卡片失败，请重试');
			// 确保重新启用文件监听
			this.enableFileWatcher();
		} finally {
			// 重置拖拽状态
			this.resetDragState();
		}
	}

	// 从文本创建Canvas节点
	private async createNodeFromText(text: string, dropEvent: DragEvent): Promise<CanvasNode | null> {
		try {
			// 分析文本内容类型
			const contentType = this.analyzeTextContent(text);

			// 计算放置位置
			const position = this.calculateDropPosition(dropEvent);

			// 生成唯一ID
			const nodeId = this.generateNodeId();

			// 创建节点数据
			const newNode: CanvasNode = {
				id: nodeId,
				type: contentType.type,
				x: position.x,
				y: position.y,
				width: contentType.width,
				height: contentType.height,
				...contentType.content
			};

			console.log('Creating new node:', newNode);

			// 添加到Canvas数据
			if (!this.canvasData) {
				this.canvasData = { nodes: [], edges: [] };
			}
			this.canvasData.nodes.push(newNode);

			// 保存到Canvas文件
			await this.saveCanvasData();

			return newNode;

		} catch (error) {
			console.error('创建节点失败:', error);
			return null;
		}
	}

	// 分析文本内容类型
	private analyzeTextContent(text: string): ContentAnalysis {
		const trimmedText = text.trim();

		// 检测是否为链接
		if (this.isURL(trimmedText)) {
			return {
				type: 'link',
				content: { url: trimmedText },
				width: 300,
				height: 100
			};
		}

		// 检测是否为文件链接
		if (this.isFileLink(trimmedText)) {
			return {
				type: 'file',
				content: { file: trimmedText },
				width: 300,
				height: 200
			};
		}

		// 默认为文本节点
		const lines = trimmedText.split('\n').length;
		const estimatedWidth = Math.min(400, Math.max(200, trimmedText.length * 8));
		const estimatedHeight = Math.min(300, Math.max(100, lines * 25 + 40));

		return {
			type: 'text',
			content: { text: trimmedText },
			width: estimatedWidth,
			height: estimatedHeight
		};
	}

	// 检测是否为URL
	private isURL(text: string): boolean {
		try {
			new URL(text);
			return true;
		} catch {
			return /^https?:\/\//.test(text);
		}
	}

	// 检测是否为文件链接
	private isFileLink(text: string): boolean {
		return /^\[\[.*\]\]$/.test(text) || text.includes('.md') || text.includes('.pdf');
	}

	// 计算拖拽放置位置
	private calculateDropPosition(dropEvent: DragEvent): { x: number, y: number } {
		const rect = this.gridContainer.getBoundingClientRect();
		const x = dropEvent.clientX - rect.left;
		const y = dropEvent.clientY - rect.top;

		// 计算网格位置
		const cols = Math.floor(this.gridContainer.clientWidth / (this.settings.cardWidth + this.settings.cardSpacing));
		const col = Math.floor(x / (this.settings.cardWidth + this.settings.cardSpacing));
		const row = Math.floor(y / (this.settings.cardHeight + this.settings.cardSpacing));

		// 转换为Canvas坐标（需要考虑现有节点的位置）
		const canvasX = col * (this.settings.cardWidth + this.settings.cardSpacing);
		const canvasY = row * (this.settings.cardHeight + this.settings.cardSpacing);

		// 如果有现有节点，找一个合适的位置
		if (this.canvasData && this.canvasData.nodes.length > 0) {
			const maxX = Math.max(...this.canvasData.nodes.map(n => n.x + n.width));
			const maxY = Math.max(...this.canvasData.nodes.map(n => n.y + n.height));

			return {
				x: Math.max(canvasX, maxX + this.settings.cardSpacing),
				y: Math.max(canvasY, maxY + this.settings.cardSpacing)
			};
		}

		return { x: canvasX, y: canvasY };
	}

	// 生成唯一节点ID
	private generateNodeId(): string {
		return 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
	}

	// 保存Canvas数据
	private async saveCanvasData(): Promise<void> {
		if (!this.canvasData) return;

		// 优先使用关联文件
		if (this.linkedCanvasFile) {
			await this.saveCanvasDataToLinkedFile();
			return;
		}

		// 回退到活动文件
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'canvas') {
			throw new Error('没有活动的Canvas文件或关联文件');
		}

		try {
			const canvasContent = JSON.stringify(this.canvasData, null, 2);
			await this.app.vault.modify(activeFile, canvasContent);
			console.log('Canvas data saved to active file successfully');
		} catch (error) {
			console.error('Failed to save canvas data:', error);
			throw error;
		}
	}

	// 滚动到新创建的卡片
	private scrollToNewCard(nodeId: string): void {
		this.safeSetTimeout(() => {
			const cardElement = this.gridContainer?.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
			if (cardElement) {
				cardElement.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});

				// 添加高亮效果
				cardElement.classList.add('newly-created');
				this.safeSetTimeout(() => {
					if (cardElement.classList.contains('newly-created')) {
						cardElement.classList.remove('newly-created');
					}
				}, 2000);
			}
		}, 100);
	}

	// ==================== 关联标签页功能实现 ====================

	// 设置关联Canvas文件
	async setLinkedCanvas(canvasFile: TFile): Promise<void> {
		try {
			this.linkedCanvasFile = canvasFile;
			this.linkedTabManager.linkCanvasFile(canvasFile, this);

			// 加载关联文件的数据
			await this.loadCanvasDataFromFile(canvasFile);

			// 更新UI显示
			this.updateLinkedCanvasDisplay(canvasFile);
			this.updateActionButtonsVisibility();

			new Notice(`已关联Canvas文件: ${canvasFile.basename}`, 3000);
			console.log('Canvas file linked:', canvasFile.path);
		} catch (error) {
			console.error('Failed to link canvas file:', error);
			new Notice('关联Canvas文件失败');
		}
	}

	// 获取关联的Canvas文件
	getLinkedCanvas(): TFile | null {
		return this.linkedCanvasFile;
	}

	// 解除关联
	unlinkCanvas(): void {
		if (this.linkedCanvasFile) {
			const fileName = this.linkedCanvasFile.basename;
			this.linkedCanvasFile = null;
			this.linkedTabManager.unlinkCanvas();

			// 清空数据
			this.canvasData = null;
			this.renderGrid();

			// 更新UI
			this.updateLinkedCanvasDisplay(null);
			this.updateActionButtonsVisibility();

			new Notice(`已解除与 ${fileName} 的关联`, 3000);
			console.log('Canvas link removed');
		}
	}

	// 从指定文件加载Canvas数据
	private async loadCanvasDataFromFile(file: TFile): Promise<void> {
		if (!file) {
			throw new Error('文件参数无效');
		}

		// 检查文件是否存在
		const fileExists = this.app.vault.getAbstractFileByPath(file.path);
		if (!fileExists) {
			throw new Error(`文件不存在: ${file.path}`);
		}

		try {
			console.log('Loading canvas data from file:', file.path);
			const content = await this.app.vault.read(file);

			if (!content || content.trim() === '') {
				throw new Error('文件内容为空');
			}

			// 验证JSON格式
			let parsedData: CanvasData;
			try {
				parsedData = JSON.parse(content);
			} catch (parseError) {
				throw new Error(`JSON格式无效: ${parseError instanceof Error ? parseError.message : '解析错误'}`);
			}

			// 验证Canvas数据结构
			if (!parsedData || typeof parsedData !== 'object') {
				throw new Error('Canvas数据格式无效');
			}

			if (!Array.isArray(parsedData.nodes)) {
				throw new Error('Canvas文件缺少有效的节点数据');
			}

			if (!Array.isArray(parsedData.edges)) {
				parsedData.edges = []; // 兼容旧版本
			}

			this.canvasData = parsedData;

			// 调试：检查节点的颜色值
			console.log('Canvas数据加载成功，节点数量:', parsedData.nodes.length);
			parsedData.nodes.forEach(node => {
				if (node.color) {
					console.log('节点颜色值:', node.id, 'color:', node.color, 'type:', typeof node.color);
				}
			});

			this.renderGrid();
			console.log('Canvas data loaded successfully from file:', file.path);
		} catch (error) {
			console.error('Failed to load canvas data from file:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			throw new Error(`加载Canvas文件失败: ${errorMessage}`);
		}
	}

	// 保存到关联的Canvas文件
	private async saveCanvasDataToLinkedFile(): Promise<void> {
		if (!this.canvasData) {
			throw new Error('没有Canvas数据可保存');
		}

		if (!this.linkedCanvasFile) {
			throw new Error('没有关联的Canvas文件');
		}

		// 检查文件是否仍然存在
		const fileExists = this.app.vault.getAbstractFileByPath(this.linkedCanvasFile.path);
		if (!fileExists) {
			throw new Error(`关联的Canvas文件不存在: ${this.linkedCanvasFile.path}`);
		}

		try {
			// 验证数据完整性
			if (!Array.isArray(this.canvasData.nodes)) {
				throw new Error('Canvas节点数据无效');
			}

			if (!Array.isArray(this.canvasData.edges)) {
				this.canvasData.edges = []; // 确保edges存在
			}

			console.log('Saving canvas data to linked file:', this.linkedCanvasFile.path);

			// 创建备份数据
			const backupData = JSON.parse(JSON.stringify(this.canvasData));

			// 格式化JSON内容
			const canvasContent = JSON.stringify(this.canvasData, null, 2);

			// 验证生成的JSON是否有效
			try {
				JSON.parse(canvasContent);
			} catch (jsonError) {
				throw new Error('生成的JSON格式无效');
			}

			// 保存文件
			await this.app.vault.modify(this.linkedCanvasFile, canvasContent);
			console.log('Canvas data saved successfully to linked file:', this.linkedCanvasFile.path);
		} catch (error) {
			console.error('Failed to save to linked canvas file:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			throw new Error(`保存Canvas文件失败: ${errorMessage}`);
		}
	}

	// 显示Canvas文件选择对话框
	showCanvasSelectionDialog(): void {
		const modal = new CanvasSelectionModal(
			this.app,
			this,
			(file: TFile) => {
				this.setLinkedCanvas(file);
			}
		);
		modal.open();
	}

	// 更新关联Canvas显示
	updateLinkedCanvasDisplay(file: TFile | null): void {
		if (!this.linkedIndicatorEl) return;

		// 更新隐藏的指示器元素（保持功能兼容性）
		if (file) {
			this.linkedIndicatorEl.textContent = file.basename;
			this.linkedIndicatorEl.removeClass('not-linked');
			this.linkedIndicatorEl.title = `关联文件: ${file.path}`;
		} else {
			this.linkedIndicatorEl.textContent = '未关联';
			this.linkedIndicatorEl.addClass('not-linked');
			this.linkedIndicatorEl.title = '点击关联Canvas文件';
		}

		// 更新主按钮的tooltip，显示关联状态
		const mainBtn = this.containerEl.querySelector('.canvas-grid-main-btn') as HTMLElement;
		if (mainBtn) {
			if (file) {
				mainBtn.title = `网格视图菜单 - 已关联: ${file.basename}`;
			} else {
				mainBtn.title = '网格视图菜单 - 未关联Canvas文件';
			}
		}
	}

	// 更新操作按钮可见性
	private updateActionButtonsVisibility(): void {
		const linkBtn = this.containerEl.querySelector('.canvas-grid-action-btn:not(.canvas-grid-unlink-btn)') as HTMLElement;
		const unlinkBtn = this.containerEl.querySelector('.canvas-grid-unlink-btn') as HTMLElement;

		if (linkBtn && unlinkBtn) {
			if (this.linkedCanvasFile) {
				linkBtn.style.display = 'none';
				unlinkBtn.style.display = 'flex';
			} else {
				linkBtn.style.display = 'flex';
				unlinkBtn.style.display = 'none';
			}
		}
	}

	// 刷新Canvas数据
	private async refreshCanvasData(): Promise<void> {
		if (this.linkedCanvasFile) {
			await this.loadCanvasDataFromFile(this.linkedCanvasFile);
			new Notice('Canvas数据已刷新', 2000);
		} else {
			await this.loadActiveCanvas();
		}
	}

	// 自动关联当前Canvas文件
	async autoLinkCurrentCanvas(): Promise<void> {
		try {
			// 获取当前活动的Canvas文件
			const activeFile = this.app.workspace.getActiveFile();

			if (!activeFile || activeFile.extension !== 'canvas') {
				new Notice('请先打开一个Canvas文件');
				return;
			}

			// 设置关联
			await this.setLinkedCanvas(activeFile);
			new Notice(`已自动关联Canvas文件: ${activeFile.basename}`, 3000);
			console.log('Auto-linked canvas file:', activeFile.path);
		} catch (error) {
			console.error('Failed to auto-link canvas file:', error);
			new Notice('自动关联Canvas文件失败');
		}
	}

	// ==================== 文件监听事件处理 ====================

	// 关联文件被修改
	onLinkedFileModified(file: TFile): void {
		console.log('Linked canvas file modified:', file.path);

		// 如果文件监听器被禁用，跳过处理
		if (this.fileWatcherDisabled) {
			console.log('File watcher disabled, skipping update');
			return;
		}

		// 防抖处理，避免频繁更新
		if (this.updateTimeout) {
			this.safeClearTimeout(this.updateTimeout);
		}

		this.updateTimeout = this.safeSetTimeout(async () => {
			try {
				// 再次检查是否被禁用
				if (this.fileWatcherDisabled) {
					console.log('File watcher disabled during timeout, skipping update');
					return;
				}

				await this.loadCanvasDataFromFile(file);
				new Notice('Canvas数据已同步更新', 2000);
			} catch (error) {
				console.error('Failed to sync canvas data:', error);
				new Notice('同步Canvas数据失败');
			}
		}, 500);
	}

	// 关联文件被删除
	onLinkedFileDeleted(): void {
		console.log('Linked canvas file deleted');

		this.linkedCanvasFile = null;
		this.canvasData = null;
		this.renderGrid();

		this.showMessage('关联的Canvas文件已被删除，请重新关联');
		this.updateLinkedCanvasDisplay(null);
		this.updateActionButtonsVisibility();
	}

	// 关联文件被重命名
	onLinkedFileRenamed(file: TFile): void {
		console.log('Linked canvas file renamed:', file.path);

		this.linkedCanvasFile = file;
		this.updateLinkedCanvasDisplay(file);

		new Notice(`关联文件已重命名为: ${file.basename}`, 3000);
	}

	// 通知Canvas视图刷新
	private notifyCanvasViewRefresh(): void {
		if (!this.linkedCanvasFile) return;

		// 查找打开的Canvas视图
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
		const targetLeaf = canvasLeaves.find(leaf => {
			const view = leaf.view as any;
			return view.file?.path === this.linkedCanvasFile?.path;
		});

		if (targetLeaf) {
			console.log('Notifying canvas view to refresh');

			// 触发Canvas视图刷新
			const canvasView = targetLeaf.view as any;

			// 尝试多种刷新方法
			if (canvasView.requestSave) {
				canvasView.requestSave();
			}

			if (canvasView.requestParse) {
				canvasView.requestParse();
			}

			// 强制重新加载
			if (canvasView.load && this.linkedCanvasFile) {
				canvasView.load(this.linkedCanvasFile);
			}
		}
	}

	// ==================== 宽度控制功能 ====================

		// 初始化宽度控制
		private initializeWidthControl(): void {
			// 获取侧边栏容器
			const sidebarContainer = this.containerEl.closest('.workspace-leaf');
			if (!sidebarContainer) return;

			// 创建ResizeObserver监听宽度变化
			this.resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					this.handleWidthChange(entry.contentRect.width);
				}
			});

			// 开始观察侧边栏容器
			this.resizeObserver.observe(sidebarContainer);

			// 初始检查当前宽度
			const currentWidth = sidebarContainer.getBoundingClientRect().width;
			this.handleWidthChange(currentWidth);
		}

		// 处理宽度变化
		private handleWidthChange(width: number): void {
			const sidebarContainer = this.containerEl.closest('.workspace-leaf');
			if (!sidebarContainer) return;

			// 移除了自动隐藏功能，现在只是调整布局以适应小宽度
			// 不再强制隐藏侧边栏，让用户自己决定是否需要隐藏

			// 如果宽度小于最小宽度，允许内容自适应
			if (width < this.minWidth) {
				if (!this.isWidthLimited) {
					// 设置容器为小宽度模式，但不强制固定宽度
					this.setCompactMode(sidebarContainer as HTMLElement);
					this.isWidthLimited = true;
				}
			} else {
				// 宽度足够，移除紧凑模式
				if (this.isWidthLimited) {
					this.removeCompactMode(sidebarContainer as HTMLElement);
					this.isWidthLimited = false;
				}
			}
		}

		// 设置紧凑模式（不强制固定宽度）
		private setCompactMode(container: HTMLElement): void {
			// 添加紧凑模式样式类，让CSS处理布局调整
			container.classList.add('canvas-grid-compact-mode');

			// 不再强制设置固定宽度，让内容自适应
			// 这样即使在很窄的宽度下，用户仍然可以看到内容
		}

		// 移除紧凑模式
		private removeCompactMode(container: HTMLElement): void {
			container.classList.remove('canvas-grid-compact-mode');
		}

		// 移除了自动隐藏侧边栏的功能
		// 现在让用户自己决定是否需要隐藏侧边栏

		// 清理宽度控制
		private cleanupWidthControl(): void {
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}

			// 移除紧凑模式
			const sidebarContainer = this.containerEl.closest('.workspace-leaf');
			if (sidebarContainer) {
				this.removeCompactMode(sidebarContainer as HTMLElement);
			}

			this.isWidthLimited = false;
		}
	}

// 主插件类
export default class CanvasGridPlugin extends Plugin {
	settings: CanvasGridSettings;
	private canvasViewButtons: Map<HTMLElement, HTMLElement> = new Map();

	async onload() {
		await this.loadSettings();

		// 初始化国际化
		i18n.setLanguage(this.settings.language);

		// 注册视图
		this.registerView(
			CANVAS_GRID_VIEW_TYPE,
			(leaf) => new CanvasGridView(leaf, this.settings)
		);

		// 添加侧边栏图标 - 尝试多个可能的图标名称
		let ribbonIconEl;
		try {
			// 尝试使用Obsidian内置图标
			ribbonIconEl = this.addRibbonIcon('grid', 'Canvas网格视图', (evt: MouseEvent) => {
				this.activateView();
			});
		} catch (error) {
			try {
				// 备选方案1
				ribbonIconEl = this.addRibbonIcon('layout', 'Canvas网格视图', (evt: MouseEvent) => {
					this.activateView();
				});
			} catch (error2) {
				try {
					// 备选方案2
					ribbonIconEl = this.addRibbonIcon('table', 'Canvas网格视图', (evt: MouseEvent) => {
						this.activateView();
					});
				} catch (error3) {
					// 最后备选方案：使用自定义SVG
					ribbonIconEl = this.addRibbonIcon('', 'Canvas网格视图', (evt: MouseEvent) => {
						this.activateView();
					});

					// 设置自定义SVG图标
					ribbonIconEl.innerHTML = `
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="3" width="7" height="7"/>
							<rect x="14" y="3" width="7" height="7"/>
							<rect x="3" y="14" width="7" height="7"/>
							<rect x="14" y="14" width="7" height="7"/>
						</svg>
					`;
				}
			}
		}

		// 添加命令：打开网格视图
		this.addCommand({
			id: 'open-canvas-grid-view',
			name: '打开Canvas网格视图',
			callback: () => {
				this.activateView();
			}
		});

		// 添加设置选项卡
		this.addSettingTab(new CanvasGridSettingTab(this.app, this));

		// 监听工作区变化，为Canvas视图添加切换按钮
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.addCanvasViewButtons();
			})
		);

		// 监听活动叶子变化
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.addCanvasViewButtons();
			})
		);

		// 初始添加按钮
		this.addCanvasViewButtons();

		console.log('🎨 Canvas Grid View Plugin loaded - 热重载测试成功!');
	}

	onunload() {
		// 清理Canvas视图按钮
		this.removeAllCanvasViewButtons();
	}

	// 获取活动的网格视图
	getActiveGridView(): CanvasGridView | null {
		const leaves = this.app.workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE);
		if (leaves.length > 0) {
			return leaves[0].view as CanvasGridView;
		}
		return null;
	}

	// 为所有Canvas视图添加切换按钮
	addCanvasViewButtons() {
		const leaves = this.app.workspace.getLeavesOfType('canvas');

		leaves.forEach(leaf => {
			const canvasView = leaf.view as any;
			if (canvasView && canvasView.canvas && canvasView.containerEl) {
				this.addButtonToCanvasView(canvasView);
			}
		});
	}

	// 为单个Canvas视图添加按钮
	addButtonToCanvasView(canvasView: any) {
		const containerEl = canvasView.containerEl;

		// 检查是否已经添加过按钮
		if (this.canvasViewButtons.has(containerEl)) {
			return;
		}

		console.log('Adding button to Canvas view');
		console.log('Container element:', containerEl);

		// 分析Canvas视图的DOM结构
		this.analyzeCanvasDOM(containerEl);

		// 尝试找到Canvas的右上角菜单容器
		const menuContainer = this.findCanvasMenuContainer(containerEl);

		if (menuContainer) {
			console.log('Found Canvas menu container:', menuContainer);
			this.addButtonToCanvasMenu(menuContainer, containerEl);
		} else {
			console.log('Canvas menu container not found, using fallback');
			this.addButtonToCanvasViewFallback(canvasView);
		}
	}

	// 分析Canvas DOM结构
	private analyzeCanvasDOM(containerEl: HTMLElement) {
		console.log('=== Canvas DOM Structure Analysis ===');

		// 查找Canvas右侧工具栏相关的选择器
		const toolbarSelectors = [
			'.canvas-controls',           // Canvas控制区域
			'.canvas-toolbar',           // Canvas工具栏
			'.canvas-menu',              // Canvas菜单
			'.canvas-control-bar',       // Canvas控制栏
			'.canvas-actions',           // Canvas操作区域
			'.canvas-buttons',           // Canvas按钮区域
			'.canvas-tools',             // Canvas工具区域
			'.canvas-ui',                // Canvas UI区域
			'.canvas-interface',         // Canvas界面区域
			'[class*="canvas"][class*="control"]',  // 包含canvas和control的类
			'[class*="canvas"][class*="toolbar"]',  // 包含canvas和toolbar的类
			'[class*="canvas"][class*="menu"]',     // 包含canvas和menu的类
		];

		toolbarSelectors.forEach(selector => {
			const elements = containerEl.querySelectorAll(selector);
			if (elements.length > 0) {
				console.log(`Found ${elements.length} elements with selector: ${selector}`);
				elements.forEach((el, index) => {
					console.log(`  [${index}]:`, el.className, el.getAttribute('aria-label'));
					// 查看子元素
					const children = el.children;
					console.log(`    Children count: ${children.length}`);
					for (let i = 0; i < Math.min(children.length, 5); i++) {
						console.log(`    Child[${i}]:`, children[i].className, children[i].getAttribute('aria-label'));
					}
				});
			}
		});

		// 查找所有可点击图标，特别是问号按钮
		const iconElements = containerEl.querySelectorAll('.clickable-icon, [class*="icon"], [aria-label*="help"], [aria-label*="Help"], [aria-label*="帮助"]');
		console.log(`Found ${iconElements.length} icon elements:`);
		iconElements.forEach((el, index) => {
			console.log(`  Icon[${index}]:`, el.className, el.getAttribute('aria-label'), el.parentElement?.className);
		});

		// 查找Canvas特有的元素
		const canvasSelectors = [
			'.canvas-wrapper',
			'.canvas-container',
			'.canvas-viewport'
		];

		canvasSelectors.forEach(selector => {
			const element = containerEl.querySelector(selector);
			if (element) {
				console.log(`Found Canvas element: ${selector}`, element);
			}
		});
	}

	// 查找Canvas菜单容器
	private findCanvasMenuContainer(containerEl: HTMLElement): HTMLElement | null {
		// 专门查找Canvas右侧垂直工具栏
		const toolbarSelectors = [
			'.canvas-controls',                 // Canvas控制区域
			'.canvas-toolbar',                 // Canvas工具栏
			'.canvas-menu',                    // Canvas菜单
			'.canvas-control-bar',             // Canvas控制栏
			'.canvas-actions',                 // Canvas操作区域
			'[class*="canvas"][class*="control"]', // 包含canvas和control的类
			'[class*="canvas"][class*="toolbar"]', // 包含canvas和toolbar的类
		];

		// 首先尝试找到Canvas特有的工具栏
		for (const selector of toolbarSelectors) {
			const toolbar = containerEl.querySelector(selector) as HTMLElement;
			if (toolbar) {
				console.log(`Found Canvas toolbar with selector: ${selector}`);
				return toolbar;
			}
		}

		// 如果没找到Canvas特有工具栏，查找包含问号按钮的容器
		const helpButtons = containerEl.querySelectorAll('[aria-label*="help"], [aria-label*="Help"], [aria-label*="帮助"], [title*="help"], [title*="Help"], [title*="帮助"]');
		for (let i = 0; i < helpButtons.length; i++) {
			const helpButton = helpButtons[i];
			const parent = helpButton.parentElement;
			if (parent && this.isValidToolbarContainer(parent)) {
				console.log('Found toolbar container via help button:', parent);
				return parent as HTMLElement;
			}
		}

		// 回退到通用的视图操作区域
		const fallbackSelectors = [
			'.view-actions',
			'.view-header-nav-buttons',
			'.workspace-leaf-header .view-actions',
			'.view-header'
		];

		for (const selector of fallbackSelectors) {
			const container = containerEl.querySelector(selector) as HTMLElement;
			if (container) {
				console.log(`Found fallback menu container with selector: ${selector}`);
				return container;
			}
		}

		return null;
	}

	// 验证是否为有效的工具栏容器
	private isValidToolbarContainer(element: HTMLElement): boolean {
		// 检查容器是否包含多个可点击图标
		const icons = element.querySelectorAll('.clickable-icon, [class*="icon"]');
		return icons.length >= 2; // 至少包含2个图标才认为是工具栏
	}

	// 将按钮添加到Canvas原生菜单中
	private addButtonToCanvasMenu(menuContainer: HTMLElement, containerEl: HTMLElement) {
		// 查找问号按钮（帮助按钮）
		const helpButton = this.findHelpButton(menuContainer);

		// 创建网格视图切换按钮，完全使用Obsidian原生样式
		const gridButton = document.createElement('div');

		// 使用Obsidian原生CSS类名，避免样式泄露
		gridButton.className = 'clickable-icon';
		gridButton.setAttribute('aria-label', '切换到网格视图');
		gridButton.setAttribute('data-tooltip-position', 'left');

		// 添加底框样式，确保始终显示
		gridButton.style.cssText = `
			border: 1px solid var(--background-modifier-border) !important;
			background: var(--background-secondary) !important;
			border-radius: 4px !important;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
		`;

		gridButton.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="7" height="7"/>
				<rect x="14" y="3" width="7" height="7"/>
				<rect x="3" y="14" width="7" height="7"/>
				<rect x="14" y="14" width="7" height="7"/>
			</svg>
		`;

		gridButton.onclick = () => {
			console.log('Grid button clicked from Canvas toolbar');
			this.activateViewWithAutoLink(containerEl);
		};

		// 将按钮插入到正确位置（问号按钮下方）
		if (helpButton && helpButton.parentElement === menuContainer) {
			// 在问号按钮后面插入
			const nextSibling = helpButton.nextSibling;
			if (nextSibling) {
				menuContainer.insertBefore(gridButton, nextSibling);
			} else {
				menuContainer.appendChild(gridButton);
			}
			console.log('Button inserted after help button');
		} else {
			// 如果没找到问号按钮，就添加到末尾
			menuContainer.appendChild(gridButton);
			console.log('Button appended to toolbar end');
		}

		console.log('Button added to Canvas toolbar successfully');

		// 记录按钮，用于清理
		this.canvasViewButtons.set(containerEl, gridButton);
	}

	// 查找帮助按钮
	private findHelpButton(container: HTMLElement): HTMLElement | null {
		const helpSelectors = [
			'[aria-label*="help"]',
			'[aria-label*="Help"]',
			'[aria-label*="帮助"]',
			'[title*="help"]',
			'[title*="Help"]',
			'[title*="帮助"]'
		];

		for (const selector of helpSelectors) {
			const helpButton = container.querySelector(selector) as HTMLElement;
			if (helpButton) {
				console.log('Found help button:', helpButton);
				return helpButton;
			}
		}

		return null;
	}

	// 判断是否为垂直工具栏
	private isVerticalToolbar(container: HTMLElement): boolean {
		const rect = container.getBoundingClientRect();
		return rect.height > rect.width; // 高度大于宽度认为是垂直工具栏
	}

	// 回退方案：添加到右上角独立位置
	addButtonToCanvasViewFallback(canvasView: any) {
		const containerEl = canvasView.containerEl;

		// 查找Canvas容器
		const canvasContainer = containerEl.querySelector('.canvas-wrapper') ||
							   containerEl.querySelector('.canvas-container') ||
							   containerEl.querySelector('.view-content') ||
							   containerEl;

		if (!canvasContainer) {
			console.log('Canvas container not found for fallback');
			return;
		}

		// 创建按钮容器 - 使用最小化的定位样式
		const buttonContainer = document.createElement('div');
		buttonContainer.style.cssText = `
			position: absolute;
			top: 10px;
			right: 10px;
			z-index: 1000;
		`;

		// 创建网格视图切换按钮 - 完全使用Obsidian原生样式
		const gridButton = document.createElement('div');
		gridButton.className = 'clickable-icon';
		gridButton.setAttribute('aria-label', '切换到网格视图');
		gridButton.setAttribute('data-tooltip-position', 'left');

		// 添加底框样式，确保始终显示
		gridButton.style.cssText = `
			background: var(--background-secondary) !important;
			border: 1px solid var(--background-modifier-border) !important;
			border-radius: 4px !important;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
		`;

		gridButton.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="7" height="7"/>
				<rect x="14" y="3" width="7" height="7"/>
				<rect x="3" y="14" width="7" height="7"/>
				<rect x="14" y="14" width="7" height="7"/>
			</svg>
		`;

		gridButton.onclick = () => {
			console.log('Grid button clicked from fallback position');
			this.activateViewWithAutoLink(containerEl);
		};

		buttonContainer.appendChild(gridButton);
		canvasContainer.appendChild(buttonContainer);

		console.log('Fallback button added successfully');

		// 记录按钮，用于清理
		this.canvasViewButtons.set(containerEl, buttonContainer);
	}

	// 移除所有Canvas视图按钮
	removeAllCanvasViewButtons() {
		this.canvasViewButtons.forEach((button, container) => {
			if (button.parentNode) {
				button.parentNode.removeChild(button);
			}
		});
		this.canvasViewButtons.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		// 获取当前活动的Canvas文件
		const activeFile = workspace.getActiveFile();

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE);

		if (leaves.length > 0) {
			// 如果视图已存在，激活它
			leaf = leaves[0];
		} else {
			// 创建新的视图
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: CANVAS_GRID_VIEW_TYPE, active: true });
			}
		}

		// 激活视图
		if (leaf) {
			workspace.revealLeaf(leaf);

			// 自动关联当前Canvas文件
			if (activeFile && activeFile.extension === 'canvas') {
				const gridView = leaf.view as CanvasGridView;
				if (gridView && gridView.setLinkedCanvas) {
					try {
						await gridView.setLinkedCanvas(activeFile);
						console.log('Auto-linked canvas file:', activeFile.path);
					} catch (error) {
						console.error('Failed to auto-link canvas file:', error);
					}
				}
			}
		}
	}

	// 激活视图并自动关联Canvas文件
	async activateViewWithAutoLink(canvasContainer: HTMLElement) {
		const { workspace } = this.app;

		// 获取当前活动的Canvas文件
		let canvasFile: TFile | null = null;

		// 首先尝试获取当前活动文件
		const activeFile = workspace.getActiveFile();
		if (activeFile && activeFile.extension === 'canvas') {
			canvasFile = activeFile;
		}

		// 如果没有活动的Canvas文件，尝试从Canvas视图中获取
		if (!canvasFile) {
			const canvasLeaves = workspace.getLeavesOfType('canvas');
			for (const leaf of canvasLeaves) {
				const canvasView = leaf.view as any;
				if (canvasView && canvasView.file) {
					canvasFile = canvasView.file;
					break;
				}
			}
		}

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE);

		if (leaves.length > 0) {
			// 如果视图已存在，激活它
			leaf = leaves[0];
		} else {
			// 创建新的视图
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: CANVAS_GRID_VIEW_TYPE, active: true });
			}
		}

		// 激活视图并自动关联
		if (leaf) {
			workspace.revealLeaf(leaf);

			if (canvasFile) {
				const gridView = leaf.view as CanvasGridView;
				if (gridView && gridView.setLinkedCanvas) {
					try {
						await gridView.setLinkedCanvas(canvasFile);
						console.log('Auto-linked canvas file from button:', canvasFile.path);
					} catch (error) {
						console.error('Failed to auto-link canvas file from button:', error);
					}
				}
			}
		}
	}
}

// 设置选项卡
class CanvasGridSettingTab extends PluginSettingTab {
	plugin: CanvasGridPlugin;

	constructor(app: App, plugin: CanvasGridPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// 更新国际化语言
		i18n.setLanguage(this.plugin.settings.language);

		containerEl.createEl('h3', { text: i18n.t('gridLayoutSettings') });
		containerEl.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '网格列数现在会根据屏幕宽度和卡片最小宽度自动调整，无需手动设置。'
				: 'Grid columns are now automatically adjusted based on screen width and card minimum width, no manual setting required.',
			cls: 'setting-item-description'
		});

		new Setting(containerEl)
			.setName(i18n.t('cardMinWidth'))
			.setDesc(this.plugin.settings.language === 'zh'
				? '设置卡片的最小宽度（像素），影响自动列数计算'
				: 'Set the minimum width of cards (pixels), affects automatic column calculation')
			.addSlider(slider => slider
				.setLimits(200, 500, 10)
				.setValue(this.plugin.settings.cardWidth)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.cardWidth = value;
					await this.plugin.saveSettings();
					// 更新所有网格视图的样式
					this.updateAllGridViews();
				}));

		new Setting(containerEl)
			.setName(i18n.t('cardMinHeight'))
			.setDesc(this.plugin.settings.language === 'zh'
				? '设置卡片的最小高度（像素）'
				: 'Set the minimum height of cards (pixels)')
			.addSlider(slider => slider
				.setLimits(150, 400, 10)
				.setValue(this.plugin.settings.cardHeight)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.cardHeight = value;
					await this.plugin.saveSettings();
					this.updateAllGridViews();
				}));

		new Setting(containerEl)
			.setName(i18n.t('cardSpacing'))
			.setDesc(this.plugin.settings.language === 'zh'
				? '设置卡片之间的间距（像素）'
				: 'Set the spacing between cards (pixels)')
			.addSlider(slider => slider
				.setLimits(5, 50, 5)
				.setValue(this.plugin.settings.cardSpacing)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.cardSpacing = value;
					await this.plugin.saveSettings();
					this.updateAllGridViews();
				}));

		new Setting(containerEl)
			.setName(i18n.t('enableAutoLayout'))
			.setDesc(this.plugin.settings.language === 'zh'
				? '自动调整卡片布局以适应屏幕（推荐开启）'
				: 'Automatically adjust card layout to fit screen (recommended)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAutoLayout)
				.onChange(async (value) => {
					this.plugin.settings.enableAutoLayout = value;
					await this.plugin.saveSettings();
				}));

		// 界面语言设置
		containerEl.createEl('h3', { text: '🌐 ' + i18n.t('interfaceLanguage') });
		new Setting(containerEl)
			.setName(i18n.t('interfaceLanguage'))
			.setDesc(this.plugin.settings.language === 'zh'
				? '选择插件界面显示语言'
				: 'Select plugin interface display language')
			.addDropdown(dropdown => dropdown
				.addOption('zh', '中文 (简体)')
				.addOption('en', 'English')
				.setValue(this.plugin.settings.language)
				.onChange(async (value) => {
					this.plugin.settings.language = value as 'zh' | 'en';
					await this.plugin.saveSettings();
					// 重新渲染设置界面以应用新语言
					this.display();
					// 更新所有网格视图
					this.updateAllGridViews();
				}));

		// 颜色筛选器设置
		this.createColorFilterSection(containerEl);

		// 关于插件部分（移动到末尾）
		this.createAboutSection(containerEl);
	}

	// 创建颜色筛选器设置部分
	private createColorFilterSection(containerEl: HTMLElement): void {
		// 标题和描述
		containerEl.createEl('h3', { text: '🎨 ' + i18n.t('colorFilterSettings') });

		const descContainer = containerEl.createDiv('color-filter-desc');
		descContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 6px;
			padding: 12px;
			margin-bottom: 20px;
			border-left: 3px solid var(--interactive-accent);
		`;

		const descText = descContainer.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '选择要在颜色筛选器中显示的颜色（最多5个）。这些颜色将显示为搜索框下方的筛选圆点。'
				: 'Select colors to display in the color filter (up to 5). These colors will appear as filter dots below the search box.',
			cls: 'setting-item-description'
		});
		descText.style.cssText = `
			margin: 0;
			color: var(--text-muted);
			font-size: 13px;
			line-height: 1.4;
		`;

		// 颜色选择网格
		const colorGridContainer = containerEl.createDiv('color-filter-grid-container');
		colorGridContainer.style.cssText = `
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 16px;
		`;

		const gridTitle = colorGridContainer.createEl('h4', {
			text: this.plugin.settings.language === 'zh' ? '可选颜色' : 'Available Colors',
			cls: 'color-grid-title'
		});
		gridTitle.style.cssText = `
			margin: 0 0 16px 0;
			color: var(--text-normal);
			font-size: 14px;
			font-weight: 600;
		`;

		const colorGrid = colorGridContainer.createDiv('color-filter-grid');
		colorGrid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
			gap: 12px;
		`;

		// 可用颜色选项
		const availableColors = [
			{ value: '1', name: this.plugin.settings.language === 'zh' ? '红色' : 'Red', color: '#ff6b6b', emoji: '🔴' },
			{ value: '2', name: this.plugin.settings.language === 'zh' ? '橙色' : 'Orange', color: '#ffa726', emoji: '🟠' },
			{ value: '3', name: this.plugin.settings.language === 'zh' ? '黄色' : 'Yellow', color: '#ffeb3b', emoji: '🟡' },
			{ value: '4', name: this.plugin.settings.language === 'zh' ? '绿色' : 'Green', color: '#66bb6a', emoji: '🟢' },
			{ value: '5', name: this.plugin.settings.language === 'zh' ? '青色' : 'Cyan', color: '#26c6da', emoji: '🔵' },
			{ value: '6', name: this.plugin.settings.language === 'zh' ? '蓝色' : 'Blue', color: '#42a5f5', emoji: '🔵' },
			{ value: '7', name: this.plugin.settings.language === 'zh' ? '紫色' : 'Purple', color: '#ab47bc', emoji: '🟣' }
		];

		availableColors.forEach(colorOption => {
			const colorCard = colorGrid.createDiv('color-filter-card');
			const isSelected = this.plugin.settings.colorFilterColors.includes(colorOption.value);

			colorCard.style.cssText = `
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 12px;
				border: 2px solid ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
				border-radius: 8px;
				cursor: pointer;
				transition: all 0.2s ease;
				background: ${isSelected ? colorOption.color + '10' : 'var(--background-secondary)'};
				position: relative;
			`;

			// 颜色预览圆点
			const colorPreview = colorCard.createDiv('color-preview-large');
			colorPreview.style.cssText = `
				width: 32px;
				height: 32px;
				border-radius: 50%;
				background: ${colorOption.color};
				margin-bottom: 8px;
				box-shadow: 0 2px 8px ${colorOption.color}40;
				border: 2px solid white;
			`;

			// 颜色名称
			const colorName = colorCard.createEl('span', {
				text: colorOption.name,
				cls: 'color-card-name'
			});
			colorName.style.cssText = `
				font-size: 12px;
				font-weight: 500;
				color: var(--text-normal);
				text-align: center;
			`;

			// 选中状态指示器
			if (isSelected) {
				const checkmark = colorCard.createDiv('color-card-checkmark');
				checkmark.innerHTML = '✓';
				checkmark.style.cssText = `
					position: absolute;
					top: 4px;
					right: 4px;
					width: 16px;
					height: 16px;
					background: ${colorOption.color};
					color: white;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 10px;
					font-weight: bold;
				`;
			}

			// 点击事件
			colorCard.addEventListener('click', async () => {
				const currentColors = [...this.plugin.settings.colorFilterColors];
				const isCurrentlySelected = currentColors.includes(colorOption.value);

				if (isCurrentlySelected) {
					// 移除颜色
					const index = currentColors.indexOf(colorOption.value);
					if (index > -1) {
						currentColors.splice(index, 1);
					}
				} else {
					// 添加颜色，但限制最多5个
					if (currentColors.length < 5) {
						currentColors.push(colorOption.value);
					} else {
						new Notice(this.plugin.settings.language === 'zh' ? '最多只能选择5个颜色' : 'Maximum 5 colors can be selected');
						return;
					}
				}

				this.plugin.settings.colorFilterColors = currentColors;
				await this.plugin.saveSettings();
				this.updateAllGridViews();

				// 重新渲染颜色筛选器设置
				this.display();
			});

			// 悬停效果
			colorCard.addEventListener('mouseenter', () => {
				if (!isSelected) {
					colorCard.style.borderColor = colorOption.color;
					colorCard.style.background = colorOption.color + '08';
				}
			});

			colorCard.addEventListener('mouseleave', () => {
				if (!isSelected) {
					colorCard.style.borderColor = 'var(--background-modifier-border)';
					colorCard.style.background = 'var(--background-secondary)';
				}
			});
		});

		// 当前选择状态
		const statusContainer = containerEl.createDiv('color-filter-status');
		statusContainer.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 16px;
			background: var(--background-secondary);
			border-radius: 6px;
			margin-bottom: 20px;
		`;

		const statusText = statusContainer.createEl('span', {
			text: this.plugin.settings.language === 'zh'
				? `已选择 ${this.plugin.settings.colorFilterColors.length}/5 个颜色`
				: `Selected ${this.plugin.settings.colorFilterColors.length}/5 colors`,
			cls: 'color-filter-status-text'
		});
		statusText.style.cssText = `
			color: var(--text-muted);
			font-size: 13px;
		`;

		// 预览当前选择的颜色
		const previewContainer = statusContainer.createDiv('color-filter-preview');
		previewContainer.style.cssText = `
			display: flex;
			gap: 4px;
		`;

		this.plugin.settings.colorFilterColors.forEach(colorValue => {
			const colorMap: { [key: string]: string } = {
				'1': '#ff6b6b', '2': '#ffa726', '3': '#ffeb3b', '4': '#66bb6a',
				'5': '#26c6da', '6': '#42a5f5', '7': '#ab47bc'
			};

			const previewDot = previewContainer.createDiv('color-preview-dot');
			previewDot.style.cssText = `
				width: 16px;
				height: 16px;
				border-radius: 50%;
				background: ${colorMap[colorValue]};
				border: 1px solid var(--background-modifier-border);
			`;
		});
	}

	// 创建关于插件部分
	private createAboutSection(containerEl: HTMLElement): void {
		// 分隔线
		const separator = containerEl.createEl('hr');
		separator.style.cssText = `
			border: none;
			border-top: 1px solid var(--background-modifier-border);
			margin: 32px 0 24px 0;
		`;
		// 主标题
		const titleEl = containerEl.createEl('h2', {
			text: this.plugin.settings.language === 'zh'
				? '🎨 关于 Canvas Grid View'
				: '🎨 About Canvas Grid View',
			cls: 'plugin-intro-title'
		});
		titleEl.style.cssText = `
			color: var(--interactive-accent);
			margin-bottom: 8px;
			font-size: 24px;
			font-weight: 600;
		`;

		// 版本信息
		const versionEl = containerEl.createEl('div', {
			text: 'v1.3.1',
			cls: 'plugin-intro-version'
		});
		versionEl.style.cssText = `
			color: var(--text-muted);
			font-size: 12px;
			margin-bottom: 16px;
			font-weight: 500;
		`;

		// 插件描述
		const descEl = containerEl.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '将Obsidian Canvas转换为美观的网格卡片视图，支持搜索、筛选、分组和编辑功能。'
				: 'Transform Obsidian Canvas into beautiful grid card views with search, filter, grouping and editing features.',
			cls: 'plugin-intro-desc'
		});
		descEl.style.cssText = `
			color: var(--text-normal);
			font-size: 14px;
			line-height: 1.5;
			margin-bottom: 20px;
		`;

		// 功能特性
		const featuresContainer = containerEl.createDiv('plugin-intro-features');
		featuresContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 24px;
			border: 1px solid var(--background-modifier-border);
		`;

		const featuresTitle = featuresContainer.createEl('h4', {
			text: '✨ ' + i18n.t('mainFeatures'),
			cls: 'plugin-intro-features-title'
		});
		featuresTitle.style.cssText = `
			color: var(--text-normal);
			margin-bottom: 12px;
			font-size: 14px;
			font-weight: 600;
		`;

		const featuresList = this.plugin.settings.language === 'zh' ? [
			'🔍 智能搜索和颜色筛选',
			'📱 响应式网格布局',
			'🎨 支持Canvas分组显示',
			'✏️ 直接编辑卡片内容',
			'🔗 网络链接书签预览',
			'🎯 一键聚焦Canvas节点',
			'⚡ 实时同步Canvas数据'
		] : [
			'🔍 Smart search and color filtering',
			'📱 Responsive grid layout',
			'🎨 Canvas grouping support',
			'✏️ Direct card content editing',
			'🔗 Web link bookmark preview',
			'🎯 One-click Canvas node focus',
			'⚡ Real-time Canvas data sync'
		];

		featuresList.forEach(feature => {
			const featureItem = featuresContainer.createEl('div', {
				text: feature,
				cls: 'plugin-intro-feature-item'
			});
			featureItem.style.cssText = `
				color: var(--text-muted);
				font-size: 13px;
				margin-bottom: 6px;
				padding-left: 8px;
			`;
		});

		// 使用指南
		const guideContainer = containerEl.createDiv('plugin-intro-guide');
		guideContainer.style.cssText = `
			background: var(--background-primary);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 24px;
			border-left: 4px solid var(--interactive-accent);
		`;

		const guideTitle = guideContainer.createEl('h4', {
			text: '🚀 ' + i18n.t('quickStart'),
			cls: 'plugin-intro-guide-title'
		});
		guideTitle.style.cssText = `
			color: var(--text-normal);
			margin-bottom: 12px;
			font-size: 14px;
			font-weight: 600;
		`;

		const guideSteps = this.plugin.settings.language === 'zh' ? [
			'1. 打开任意Canvas文件',
			'2. 点击Canvas工具栏中的网格视图按钮',
			'3. 或使用侧边栏的网格图标启动插件',
			'4. 在网格视图中搜索、筛选和编辑卡片'
		] : [
			'1. Open any Canvas file',
			'2. Click the grid view button in Canvas toolbar',
			'3. Or use the grid icon in the sidebar to launch plugin',
			'4. Search, filter and edit cards in grid view'
		];

		guideSteps.forEach(step => {
			const stepItem = guideContainer.createEl('div', {
				text: step,
				cls: 'plugin-intro-guide-step'
			});
			stepItem.style.cssText = `
				color: var(--text-muted);
				font-size: 13px;
				margin-bottom: 6px;
				padding-left: 8px;
			`;
		});

		// 感谢和支持部分
		this.createSupportSection(containerEl);
	}

	// 创建感谢和支持部分
	private createSupportSection(containerEl: HTMLElement): void {
		// 感谢部分
		const thanksContainer = containerEl.createDiv('plugin-thanks-section');
		thanksContainer.style.cssText = `
			background: linear-gradient(135deg, var(--interactive-accent)20, var(--interactive-accent)10);
			border-radius: 12px;
			padding: 20px;
			margin-bottom: 20px;
			border: 1px solid var(--interactive-accent)40;
		`;

		const thanksTitle = thanksContainer.createEl('h4', {
			text: '💝 ' + i18n.t('thanks'),
			cls: 'plugin-thanks-title'
		});
		thanksTitle.style.cssText = `
			color: var(--interactive-accent);
			margin-bottom: 12px;
			font-size: 16px;
			font-weight: 600;
		`;

		const thanksText = thanksContainer.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '感谢您使用 Canvas Grid View 插件！您的支持是我们持续改进的动力。'
				: 'Thank you for using Canvas Grid View plugin! Your support is our motivation for continuous improvement.',
			cls: 'plugin-thanks-text'
		});
		thanksText.style.cssText = `
			color: var(--text-normal);
			font-size: 14px;
			line-height: 1.5;
			margin-bottom: 16px;
		`;

		// 支持按钮组
		const supportButtons = thanksContainer.createDiv('plugin-support-buttons');
		supportButtons.style.cssText = `
			display: flex;
			gap: 12px;
			flex-wrap: wrap;
		`;

		// 反馈按钮
		const feedbackBtn = supportButtons.createEl('button', {
			text: '💬 ' + i18n.t('feedback'),
			cls: 'plugin-support-btn'
		});
		feedbackBtn.style.cssText = `
			background: var(--interactive-accent);
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		`;
		feedbackBtn.onmouseover = () => {
			feedbackBtn.style.background = 'var(--interactive-accent-hover)';
			feedbackBtn.style.transform = 'translateY(-1px)';
		};
		feedbackBtn.onmouseout = () => {
			feedbackBtn.style.background = 'var(--interactive-accent)';
			feedbackBtn.style.transform = 'translateY(0)';
		};
		feedbackBtn.onclick = () => {
			window.open('https://github.com/canvas-grid-plugin/feedback', '_blank');
		};

		// 联系按钮
		const contactBtn = supportButtons.createEl('button', {
			text: '📧 ' + i18n.t('contact'),
			cls: 'plugin-support-btn'
		});
		contactBtn.style.cssText = `
			background: var(--background-modifier-border);
			color: var(--text-normal);
			border: 1px solid var(--background-modifier-border);
			padding: 8px 16px;
			border-radius: 6px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		`;
		contactBtn.onmouseover = () => {
			contactBtn.style.background = 'var(--background-modifier-hover)';
			contactBtn.style.transform = 'translateY(-1px)';
		};
		contactBtn.onmouseout = () => {
			contactBtn.style.background = 'var(--background-modifier-border)';
			contactBtn.style.transform = 'translateY(0)';
		};
		contactBtn.onclick = () => {
			window.open('mailto:canvas-grid@example.com', '_blank');
		};

		// 请喝咖啡按钮
		const coffeeBtn = supportButtons.createEl('button', {
			text: '☕ ' + i18n.t('buyCoffee'),
			cls: 'plugin-support-btn'
		});
		coffeeBtn.style.cssText = `
			background: linear-gradient(135deg, #ff6b6b, #ffa726);
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		`;
		coffeeBtn.onmouseover = () => {
			coffeeBtn.style.transform = 'translateY(-1px) scale(1.05)';
			coffeeBtn.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
		};
		coffeeBtn.onmouseout = () => {
			coffeeBtn.style.transform = 'translateY(0) scale(1)';
			coffeeBtn.style.boxShadow = 'none';
		};
		coffeeBtn.onclick = () => {
			window.open('https://buymeacoffee.com/canvasgrid', '_blank');
		};

		// 项目信息
		const projectInfo = containerEl.createDiv('plugin-project-info');
		projectInfo.style.cssText = `
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 20px;
			border: 1px solid var(--background-modifier-border);
		`;

		const projectTitle = projectInfo.createEl('h4', {
			text: '🔗 ' + i18n.t('projectLinks'),
			cls: 'plugin-project-title'
		});
		projectTitle.style.cssText = `
			color: var(--text-normal);
			margin-bottom: 12px;
			font-size: 14px;
			font-weight: 600;
		`;

		const projectLinks = this.plugin.settings.language === 'zh' ? [
			{ text: '📚 使用文档', url: 'https://github.com/canvas-grid-plugin/docs' },
			{ text: '🐛 问题报告', url: 'https://github.com/canvas-grid-plugin/issues' },
			{ text: '⭐ GitHub 仓库', url: 'https://github.com/canvas-grid-plugin' },
			{ text: '🎨 更新日志', url: 'https://github.com/canvas-grid-plugin/releases' }
		] : [
			{ text: '📚 Documentation', url: 'https://github.com/canvas-grid-plugin/docs' },
			{ text: '🐛 Bug Reports', url: 'https://github.com/canvas-grid-plugin/issues' },
			{ text: '⭐ GitHub Repository', url: 'https://github.com/canvas-grid-plugin' },
			{ text: '🎨 Changelog', url: 'https://github.com/canvas-grid-plugin/releases' }
		];

		projectLinks.forEach(link => {
			const linkItem = projectInfo.createEl('div', {
				cls: 'plugin-project-link'
			});
			linkItem.style.cssText = `
				display: flex;
				align-items: center;
				padding: 6px 0;
				cursor: pointer;
				transition: color 0.2s ease;
				color: var(--text-muted);
				font-size: 13px;
			`;

			linkItem.textContent = link.text;
			linkItem.onmouseover = () => {
				linkItem.style.color = 'var(--interactive-accent)';
			};
			linkItem.onmouseout = () => {
				linkItem.style.color = 'var(--text-muted)';
			};
			linkItem.onclick = () => {
				window.open(link.url, '_blank');
			};
		});

		// 版权信息
		const copyrightEl = containerEl.createEl('div', {
			text: this.plugin.settings.language === 'zh'
				? '© 2025 Canvas Grid View Plugin. 用 ❤️ 为 Obsidian 社区制作。'
				: '© 2025 Canvas Grid View Plugin. Made with ❤️ for Obsidian community.',
			cls: 'plugin-copyright'
		});
		copyrightEl.style.cssText = `
			text-align: center;
			color: var(--text-muted);
			font-size: 12px;
			margin-top: 20px;
			padding-top: 16px;
			border-top: 1px solid var(--background-modifier-border);
		`;
	}

	// 更新所有网格视图的样式
	updateAllGridViews() {
		const gridLeaves = this.plugin.app.workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE);
		gridLeaves.forEach(leaf => {
			const view = leaf.view as CanvasGridView;
			if (view) {
				// 更新样式
				if (view.setupGridStyles) {
					view.setupGridStyles();
				}
				// 重新创建颜色筛选器
				view.updateColorFilter();
			}
		});
	}
}
