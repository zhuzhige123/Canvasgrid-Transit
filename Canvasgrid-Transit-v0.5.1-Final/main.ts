import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, TFile, Notice, Modal, EventRef, MarkdownView } from 'obsidian';

// 插件设置接口
interface CanvasGridSettings {
	enableAutoLayout: boolean;
	colorFilterColors: string[]; // 颜色筛选器显示的颜色列表
	language: 'zh' | 'en'; // 界面语言
	colorCategories: ColorCategory[]; // 颜色分类配置
	enableColorCategories: boolean; // 是否启用颜色分类
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
	isBasic?: boolean; // 标记是否为基础信息（快速显示）
	error?: string;
}

// 默认设置
const DEFAULT_SETTINGS: CanvasGridSettings = {
	enableAutoLayout: true,
	colorFilterColors: ['1', '2', '4', '6', '7'], // 默认显示红、橙、绿、蓝、紫
	language: 'zh', // 默认中文
	enableColorCategories: true, // 启用颜色分类
	colorCategories: [
		{ id: 'important', name: '重要', description: '重要内容和紧急事项', color: '1' }, // 红色
		{ id: 'todo', name: '待办', description: '待办事项和任务', color: '2' }, // 橙色
		{ id: 'note', name: '记事', description: '一般笔记和记录', color: '6' }, // 蓝色
		{ id: 'inspiration', name: '灵感', description: '创意想法和灵感', color: '7' }, // 紫色
		{ id: 'collection', name: '收集', description: '时间胶囊收集的内容', color: '5' } // 青色
	]
}

// 固定的卡片尺寸常量
const CARD_CONSTANTS = {
	width: 300,
	height: 200,
	spacing: 20
};

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
	alipaySupport: string;
	githubSponsor: string;
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
		canvasGridView: 'Canvasgrid Transit',
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
		alipaySupport: '支付宝支持',
		githubSponsor: 'GitHub赞助',
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
		canvasGridView: 'Canvasgrid Transit',
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
		alipaySupport: 'Alipay Support',
		githubSponsor: 'GitHub Sponsor',
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
	// 回链信息
	sourceFile?: TFile | null;
	sourcePath?: string;
	sourcePosition?: {
		line: number;
		ch: number;
		selection?: any;
	} | null;
	sourceContext?: string;
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

// 拖拽目标分析结果接口
interface DropTargetAnalysis {
	type: 'existing-group' | 'new-group';
	groupId?: string;
	position: { x: number, y: number };
}

// 时间胶囊相关类型
interface TimeCapsuleState {
	isActive: boolean;
	startTime: number;
	duration: number; // 毫秒
	remainingTime: number;
	groupId: string | null;
	collectedItems: string[];
	groupName: string;
}

interface TimeCapsuleSettings {
	defaultDuration: number; // 默认时长（分钟）
	autoCollectClipboard: boolean; // 自动收集剪贴板
	showNotifications: boolean; // 显示通知
	collectShortcut: string; // 收集快捷键
}

// 颜色分类系统
interface ColorCategory {
	id: string;
	name: string;
	description: string;
	color: string; // Canvas颜色ID
}

interface ColorCategorySettings {
	categories: ColorCategory[];
	enabled: boolean;
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

// 分组重命名对话框
class GroupRenameModal extends Modal {
	private currentName: string;
	private onRename: (newName: string) => void;
	private inputEl: HTMLInputElement | null = null;

	constructor(app: App, currentName: string, onRename: (newName: string) => void) {
		super(app);
		this.currentName = currentName;
		this.onRename = onRename;
	}

	onOpen(): void {
		this.titleEl.setText('重命名分组');
		this.createContent();
	}

	private createContent(): void {
		const content = this.contentEl;
		content.empty();

		// 创建输入框容器
		const inputContainer = content.createDiv("group-rename-input-container");

		// 标签
		const label = inputContainer.createEl("label", {
			text: "分组名称:",
			cls: "group-rename-label"
		});

		// 输入框
		this.inputEl = inputContainer.createEl("input", {
			type: "text",
			value: this.currentName,
			cls: "group-rename-input"
		});

		// 设置输入框焦点并选中文本
		this.inputEl.focus();
		this.inputEl.select();

		// 按钮容器
		const buttonContainer = content.createDiv("group-rename-buttons");

		// 确认按钮
		const confirmBtn = buttonContainer.createEl("button", {
			text: "确认",
			cls: "mod-cta"
		});
		confirmBtn.onclick = () => this.handleConfirm();

		// 取消按钮
		const cancelBtn = buttonContainer.createEl("button", {
			text: "取消"
		});
		cancelBtn.onclick = () => this.close();

		// 键盘事件
		this.inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				this.handleConfirm();
			} else if (e.key === 'Escape') {
				this.close();
			}
		});
	}

	private handleConfirm(): void {
		if (!this.inputEl) return;

		const newName = this.inputEl.value.trim();
		if (!newName) {
			new Notice('分组名称不能为空');
			return;
		}

		if (newName === this.currentName) {
			this.close();
			return;
		}

		this.onRename(newName);
		this.close();
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
	settings!: CanvasGridSettings;
	plugin!: CanvasGridPlugin;
	canvasData: CanvasData | null = null;
	gridContainer!: HTMLElement;

	// 拖拽相关属性
	private isDragging = false;
	private dragData: DragData | null = null;
	private dropIndicator: HTMLElement | null = null;

	// 长按拖拽相关属性
	private longPressTimer: NodeJS.Timeout | null = null;
	private longPressStartTime = 0;
	private longPressThreshold = 500; // 500ms长按阈值
	private isDragFromGrid = false;
	private dragStartPosition = { x: 0, y: 0 };
	private currentDragCard: HTMLElement | null = null;

	// 拖拽预览相关属性
	private dragPreviewElement: HTMLElement | null = null;

	// 🔧 修复：文件修改保护机制
	private fileModificationLocks = new Set<string>();

	// 关联标签页相关属性
	private linkedTabManager!: LinkedTabManager;
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

	// 时间胶囊相关属性
	private timeCapsuleState: TimeCapsuleState = {
		isActive: false,
		startTime: 0,
		duration: 15 * 60 * 1000, // 默认15分钟
		remainingTime: 0,
		groupId: null,
		collectedItems: [],
		groupName: ''
	};
	private timeCapsuleButton: HTMLElement | null = null;
	private timeCapsuleTimer: NodeJS.Timeout | null = null;
	private timeCapsuleUpdateInterval: NodeJS.Timeout | null = null;

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

	constructor(leaf: WorkspaceLeaf, plugin: CanvasGridPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.settings = plugin.settings;
		// 初始化国际化
		i18n.setLanguage(plugin.settings.language);
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
		return "Canvasgrid Transit";
	}

	getIcon() {
		return "grid" as any;
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		if (!container) {
			console.error('Canvasgrid Transit: Container element not found');
			return;
		}
		container.empty();

		// 先创建网格容器（临时的，用于避免错误）
		this.gridContainer = container.createDiv("canvas-grid-container");

		// 创建统一工具栏（包含颜色筛选器）
		this.createToolbar(container);

		// 重新创建网格容器，确保它在工具栏之后
		this.gridContainer.remove();
		this.gridContainer = container.createDiv("canvas-grid-container");

		// 确保初始状态正确
		this.gridContainer.classList.remove('toolbar-hidden');
		this.gridContainer.style.removeProperty('margin-top');
		this.gridContainer.style.removeProperty('height');

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
		console.log('🔧 Initializing search and sort functionality');

		// 初始化筛选节点数组
		this.filteredNodes = this.canvasData?.nodes || [];

		// 重置搜索状态
		this.searchQuery = '';
		this.activeColorFilter = null;

		console.log(`📊 Initialized with ${this.filteredNodes.length} nodes`);
		console.log(`🔄 Default sort: ${this.sortBy} (${this.sortOrder})`);

		// 应用默认排序
		this.applySortAndFilter();
	}

	// 创建新的工具栏布局
	createToolbar(container: Element) {
		const toolbar = container.createDiv("canvas-grid-toolbar");

		// 第一行：功能键 + 搜索框 + 沙漏倒计时
		const mainRow = toolbar.createDiv("canvas-grid-toolbar-main-row");

		// 左侧功能键
		const leftSection = mainRow.createDiv("canvas-grid-toolbar-left");
		this.createMainMenuButton(leftSection);

		// 中间搜索框
		const middleSection = mainRow.createDiv("canvas-grid-toolbar-middle");
		this.createSearchBox(middleSection);

		// 右侧时间胶囊
		const rightSection = mainRow.createDiv("canvas-grid-toolbar-right");
		this.createTimeCapsuleButton(rightSection);

		// 第二行：彩色筛选器（在搜索框下方）
		const colorRow = toolbar.createDiv("canvas-grid-toolbar-color-row");
		this.createColorFilter(colorRow);
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
		i18n.setLanguage(this.settings.language);
		const sortItem = section.createDiv("canvas-grid-menu-item canvas-grid-submenu-item");
		sortItem.innerHTML = `
			<svg class="menu-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 6h18"/>
				<path d="M7 12h10"/>
				<path d="M10 18h4"/>
			</svg>
			<span class="menu-text">${i18n.t('sortBy')}</span>
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
		i18n.setLanguage(this.settings.language);

		const sortOptions = [
			{ key: 'created', label: i18n.t('sortByCreated') },
			{ key: 'modified', label: i18n.t('sortByModified') },
			{ key: 'title', label: i18n.t('sortByTitle') }
		];

		console.log(`🎛️ Creating sort submenu with current sort: ${this.sortBy} (${this.sortOrder})`);

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

			// 如果是当前激活的排序选项，添加高亮样式
			if (isActive) {
				item.style.backgroundColor = 'var(--background-modifier-hover)';
				item.style.fontWeight = '600';
			}

			item.addEventListener('click', () => {
				console.log(`🔄 Sort option clicked: ${option.key} (current: ${this.sortBy})`);

				if (this.sortBy === option.key) {
					// 如果是当前排序字段，切换升序/降序
					this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
					console.log(`🔄 Toggled sort order to: ${this.sortOrder}`);
				} else {
					// 如果是新的排序字段，默认使用降序（最新的在前）
					this.sortBy = option.key as any;
					this.sortOrder = 'desc';
					console.log(`🔄 Changed sort to: ${this.sortBy} (${this.sortOrder})`);
				}

				// 立即应用排序
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
		officialLinkBtn.onclick = () => {
			// 官方关联功能已移除，显示提示
			new Notice('官方关联功能已整合到自动关联中');
		};

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

	// 创建时间胶囊按钮
	private createTimeCapsuleButton(container: Element): void {
		const buttonContainer = container.createDiv("canvas-grid-time-capsule-container");

		this.timeCapsuleButton = buttonContainer.createEl("button", {
			cls: "canvas-grid-time-capsule-btn",
			title: "时间胶囊 - 点击开始收集"
		});

		// 更新按钮显示
		this.updateTimeCapsuleButton();

		// 点击事件
		this.timeCapsuleButton.addEventListener('click', () => {
			this.toggleTimeCapsuleInternal();
		});

		// 长按显示时长选择菜单
		let longPressTimer: NodeJS.Timeout | null = null;
		this.timeCapsuleButton.addEventListener('mousedown', () => {
			longPressTimer = setTimeout(() => {
				this.showDurationMenu();
			}, 800);
		});

		this.timeCapsuleButton.addEventListener('mouseup', () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}
		});

		this.timeCapsuleButton.addEventListener('mouseleave', () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
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

			// 添加颜色分类名称和提示
			const colorCategory = this.settings.colorCategories.find(cat => cat.color === colorValue);
			if (colorCategory) {
				// 使用颜色分类的名称
				colorDot.title = this.settings.language === 'zh'
					? `筛选${colorCategory.name}卡片`
					: `Filter ${colorCategory.name} cards`;
			} else {
				// 回退到默认颜色名称
				const colorNames = this.settings.language === 'zh'
					? ['红', '橙', '黄', '绿', '青', '蓝', '紫']
					: ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Purple'];
				const index = parseInt(colorValue) - 1;
				if (index >= 0 && index < colorNames.length) {
					colorDot.title = this.settings.language === 'zh'
						? `筛选${colorNames[index]}色卡片`
						: `Filter ${colorNames[index]} cards`;
				}
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

	// ==================== 时间胶囊功能方法 ====================

	// 更新时间胶囊按钮显示
	private updateTimeCapsuleButton(): void {
		if (!this.timeCapsuleButton) return;

		const state = this.timeCapsuleState;

		if (state.isActive) {
			// 激活状态：显示倒计时
			const minutes = Math.floor(state.remainingTime / 60000);
			const seconds = Math.floor((state.remainingTime % 60000) / 1000);
			const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

			// 根据剩余时间设置颜色
			let colorClass = 'active';
			if (state.remainingTime < 60000) { // 最后1分钟
				colorClass = 'warning';
			}

			this.timeCapsuleButton.className = `canvas-grid-time-capsule-btn ${colorClass}`;
			this.timeCapsuleButton.innerHTML = `
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 2v6h.01L6 8.01 10 12l-4 4-.01.01V22h12v-5.99-.01L18 16l-4-4 4-3.99.01-.01V2H6z"/>
				</svg>
				<span class="time-display">${timeText}</span>
			`;
			this.timeCapsuleButton.title = `时间胶囊收集中 - 剩余 ${timeText}`;
		} else {
			// 未激活状态：显示普通沙漏
			this.timeCapsuleButton.className = 'canvas-grid-time-capsule-btn';
			this.timeCapsuleButton.innerHTML = `
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 2v6h.01L6 8.01 10 12l-4 4-.01.01V22h12v-5.99-.01L18 16l-4-4 4-3.99.01-.01V2H6z"/>
				</svg>
			`;
			this.timeCapsuleButton.title = "时间胶囊 - 点击开始收集";
		}
	}

	// 切换时间胶囊状态（私有方法，供按钮点击使用）
	private toggleTimeCapsuleInternal(): void {
		if (this.timeCapsuleState.isActive) {
			this.stopTimeCapsule();
		} else {
			this.startTimeCapsule();
		}
	}

	// 开始时间胶囊
	private startTimeCapsule(): void {
		const duration = this.timeCapsuleState.duration;
		const now = Date.now();

		// 创建时间胶囊分组
		const groupName = `时间胶囊 ${new Date().toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})}`;

		this.timeCapsuleState = {
			isActive: true,
			startTime: now,
			duration: duration,
			remainingTime: duration,
			groupId: null, // 稍后创建分组时设置
			collectedItems: [],
			groupName: groupName
		};

		// 创建分组
		this.createTimeCapsuleGroup();

		// 开始倒计时
		this.startTimeCapsuleTimer();

		// 立即刷新网格视图以显示新的时间胶囊分组并置顶
		this.renderGrid();

		// 显示通知
		new Notice(`时间胶囊已启动！收集时长：${Math.floor(duration / 60000)}分钟`);

		console.log('时间胶囊已启动，网格视图已刷新:', this.timeCapsuleState);
	}

	// 停止时间胶囊
	private stopTimeCapsule(): void {
		// 清理定时器
		if (this.timeCapsuleTimer) {
			clearTimeout(this.timeCapsuleTimer);
			this.timeCapsuleTimer = null;
		}
		if (this.timeCapsuleUpdateInterval) {
			clearInterval(this.timeCapsuleUpdateInterval);
			this.timeCapsuleUpdateInterval = null;
		}

		const collectedCount = this.timeCapsuleState.collectedItems.length;

		// 重置状态
		this.timeCapsuleState = {
			isActive: false,
			startTime: 0,
			duration: 15 * 60 * 1000,
			remainingTime: 0,
			groupId: null,
			collectedItems: [],
			groupName: ''
		};

		// 更新按钮显示
		this.updateTimeCapsuleButton();

		// 立即刷新网格视图以更新分组状态
		this.renderGrid();

		// 显示完成通知
		new Notice(`时间胶囊已结束！共收集了 ${collectedCount} 个项目`);

		console.log('时间胶囊已停止，网格视图已刷新');
	}

	// 开始倒计时定时器
	private startTimeCapsuleTimer(): void {
		// 设置结束定时器
		this.timeCapsuleTimer = setTimeout(() => {
			this.stopTimeCapsule();
		}, this.timeCapsuleState.duration);

		// 设置更新间隔（每秒更新一次显示）
		this.timeCapsuleUpdateInterval = setInterval(() => {
			const elapsed = Date.now() - this.timeCapsuleState.startTime;
			this.timeCapsuleState.remainingTime = Math.max(0, this.timeCapsuleState.duration - elapsed);

			this.updateTimeCapsuleButton();
			this.updateTimeCapsuleGroupDisplay(); // 更新分组卡片显示

			// 如果时间到了，停止
			if (this.timeCapsuleState.remainingTime <= 0) {
				this.stopTimeCapsule();
			}
		}, 1000);
	}

	// 创建时间胶囊分组
	private createTimeCapsuleGroup(): void {
		if (!this.canvasData) {
			console.warn('无法创建时间胶囊分组：Canvas数据不存在');
			return;
		}

		// 生成唯一ID
		const groupId = `time-capsule-${Date.now()}`;

		// 智能计算分组位置，避免与现有分组重叠
		const timeCapsuleSize = { width: 400, height: 300 };
		const position = this.findSafePositionForTimeCapsule(timeCapsuleSize);

		console.log(`🎯 时间胶囊分组位置计算完成: (${position.x}, ${position.y})`);

		// 创建分组节点
		const groupNode: CanvasNode = {
			id: groupId,
			type: 'group',
			x: position.x,
			y: position.y,
			width: timeCapsuleSize.width,
			height: timeCapsuleSize.height,
			color: '5', // 青色 - 时间胶囊主题色
			label: this.timeCapsuleState.groupName
		};

		// 添加到Canvas数据
		this.canvasData.nodes.push(groupNode);

		// 更新时间胶囊状态
		this.timeCapsuleState.groupId = groupId;

		// 保存Canvas文件
		this.saveCanvasData();

		console.log('时间胶囊分组已创建:', groupId, '位置:', position);
	}

	// 为时间胶囊分组寻找安全位置，避免与现有分组重叠
	private findSafePositionForTimeCapsule(size: { width: number, height: number }): { x: number, y: number } {
		if (!this.canvasData) {
			return { x: 100, y: 100 }; // 默认位置
		}

		// 获取所有现有分组的边界
		const existingGroups = this.canvasData.nodes.filter(node => node.type === 'group');

		console.log(`📊 检测到 ${existingGroups.length} 个现有分组`);

		// 定义候选位置（优先级从高到低）
		const candidatePositions = [
			{ x: 50, y: 50 },     // 左上角
			{ x: 500, y: 50 },    // 右上角
			{ x: 50, y: 400 },    // 左下角
			{ x: 500, y: 400 },   // 右下角
			{ x: 250, y: 50 },    // 顶部中央
			{ x: 50, y: 225 },    // 左侧中央
			{ x: 500, y: 225 },   // 右侧中央
			{ x: 250, y: 400 },   // 底部中央
			{ x: 800, y: 50 },    // 更右上角
			{ x: 800, y: 400 },   // 更右下角
		];

		// 检查每个候选位置是否安全
		for (const candidate of candidatePositions) {
			if (this.isPositionSafe(candidate, size, existingGroups)) {
				console.log(`✅ 找到安全位置: (${candidate.x}, ${candidate.y})`);
				return candidate;
			}
		}

		// 如果所有预设位置都不安全，尝试动态寻找空白区域
		const dynamicPosition = this.findDynamicSafePosition(size, existingGroups);
		if (dynamicPosition) {
			console.log(`🔍 动态找到安全位置: (${dynamicPosition.x}, ${dynamicPosition.y})`);
			return dynamicPosition;
		}

		// 最后的备用方案：在画布边缘创建
		const fallbackPosition = { x: 1000, y: 50 };
		console.log(`⚠️ 使用备用位置: (${fallbackPosition.x}, ${fallbackPosition.y})`);
		return fallbackPosition;
	}

	// 检查指定位置是否安全（不与现有分组重叠）
	private isPositionSafe(
		position: { x: number, y: number },
		size: { width: number, height: number },
		existingGroups: CanvasNode[]
	): boolean {
		const newGroupBounds = {
			left: position.x,
			top: position.y,
			right: position.x + size.width,
			bottom: position.y + size.height
		};

		// 检查是否与任何现有分组重叠
		for (const group of existingGroups) {
			const groupBounds = {
				left: group.x,
				top: group.y,
				right: group.x + (group.width || 200),
				bottom: group.y + (group.height || 200)
			};

			// 检查边界重叠
			const isOverlapping = !(
				newGroupBounds.right < groupBounds.left ||
				newGroupBounds.left > groupBounds.right ||
				newGroupBounds.bottom < groupBounds.top ||
				newGroupBounds.top > groupBounds.bottom
			);

			if (isOverlapping) {
				console.log(`❌ 位置 (${position.x}, ${position.y}) 与分组 ${group.id} 重叠`);
				return false;
			}
		}

		return true;
	}

	// 动态寻找安全位置
	private findDynamicSafePosition(
		size: { width: number, height: number },
		existingGroups: CanvasNode[]
	): { x: number, y: number } | null {
		// 计算Canvas的使用范围
		const canvasBounds = this.calculateCanvasBounds(existingGroups);

		// 在Canvas右侧寻找空白区域
		const rightSideX = canvasBounds.maxX + 100; // 在最右侧分组右边100px处
		const testPosition = { x: rightSideX, y: 50 };

		if (this.isPositionSafe(testPosition, size, existingGroups)) {
			return testPosition;
		}

		// 在Canvas下方寻找空白区域
		const bottomY = canvasBounds.maxY + 100; // 在最下方分组下面100px处
		const bottomPosition = { x: 50, y: bottomY };

		if (this.isPositionSafe(bottomPosition, size, existingGroups)) {
			return bottomPosition;
		}

		// 网格搜索：在Canvas区域内寻找空白位置
		const gridStep = 50;
		for (let x = 50; x <= 1200; x += gridStep) {
			for (let y = 50; y <= 800; y += gridStep) {
				const gridPosition = { x, y };
				if (this.isPositionSafe(gridPosition, size, existingGroups)) {
					return gridPosition;
				}
			}
		}

		return null; // 没有找到安全位置
	}

	// 计算Canvas的使用边界
	private calculateCanvasBounds(existingGroups: CanvasNode[]): {
		minX: number, minY: number, maxX: number, maxY: number
	} {
		if (existingGroups.length === 0) {
			return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
		}

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

		existingGroups.forEach(group => {
			const left = group.x;
			const top = group.y;
			const right = group.x + (group.width || 200);
			const bottom = group.y + (group.height || 200);

			minX = Math.min(minX, left);
			minY = Math.min(minY, top);
			maxX = Math.max(maxX, right);
			maxY = Math.max(maxY, bottom);
		});

		console.log(`📐 Canvas使用边界: (${minX}, ${minY}) 到 (${maxX}, ${maxY})`);
		return { minX, minY, maxX, maxY };
	}

	// 更新时间胶囊分组显示
	private updateTimeCapsuleGroupDisplay(): void {
		if (!this.timeCapsuleState.isActive || !this.timeCapsuleState.groupId) return;

		// 查找时间胶囊分组卡片
		const groupCard = this.gridContainer.querySelector(`[data-node-id="${this.timeCapsuleState.groupId}"]`) as HTMLElement;
		if (!groupCard) return;

		// 更新倒计时显示
		const countDiv = groupCard.querySelector('.group-member-count');
		if (countDiv) {
			const minutes = Math.floor(this.timeCapsuleState.remainingTime / 60000);
			const seconds = Math.floor((this.timeCapsuleState.remainingTime % 60000) / 1000);
			const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

			// 获取当前收集的项目数量
			const collectedCount = this.timeCapsuleState.collectedItems.length;

			countDiv.innerHTML = `
				<div class="time-capsule-status">
					<span class="collecting-text">收集中</span>
					<span class="countdown-text">${timeText}</span>
				</div>
				<div class="member-count">${collectedCount} 个项目</div>
			`;
		}

		// 根据剩余时间调整动画速度
		if (this.timeCapsuleState.remainingTime < 60000) { // 最后1分钟
			groupCard.classList.add('time-capsule-urgent');
		}
	}

	// 获取时间胶囊最大收集数量（基于时长）
	private getMaxCollectionCount(): number {
		const durationMinutes = Math.floor(this.timeCapsuleState.duration / 60000);
		return Math.max(10, durationMinutes * 2); // 每分钟最多收集2个项目
	}

	// 显示时长选择菜单
	private showDurationMenu(): void {
		// 创建菜单
		const menu = document.createElement('div');
		menu.className = 'canvas-grid-duration-menu';

		const durations = [
			{ label: '5分钟', value: 5 * 60 * 1000 },
			{ label: '15分钟', value: 15 * 60 * 1000 },
			{ label: '30分钟', value: 30 * 60 * 1000 },
			{ label: '1小时', value: 60 * 60 * 1000 }
		];

		durations.forEach(duration => {
			const item = menu.createDiv('duration-menu-item');
			item.textContent = duration.label;
			item.onclick = () => {
				this.timeCapsuleState.duration = duration.value;
				menu.remove();
				new Notice(`时间胶囊时长设置为：${duration.label}`);
			};
		});

		// 定位菜单
		const buttonRect = this.timeCapsuleButton!.getBoundingClientRect();
		menu.style.position = 'fixed';
		menu.style.top = `${buttonRect.bottom + 5}px`;
		menu.style.left = `${buttonRect.left}px`;
		menu.style.zIndex = '1000';

		document.body.appendChild(menu);

		// 点击外部关闭菜单
		const closeMenu = (e: MouseEvent) => {
			if (!menu.contains(e.target as Node)) {
				menu.remove();
				document.removeEventListener('click', closeMenu);
			}
		};
		setTimeout(() => document.addEventListener('click', closeMenu), 100);
	}

	// 检查时间胶囊是否激活
	isTimeCapsuleActive(): boolean {
		return this.timeCapsuleState.isActive;
	}

	// 收集内容到时间胶囊
	collectToTimeCapsule(content: string, sourceInfo: {
		sourceFile: TFile | null;
		sourcePath: string;
		sourcePosition: { line: number; ch: number } | null;
	}): void {
		if (!this.timeCapsuleState.isActive || !this.timeCapsuleState.groupId) {
			console.warn('时间胶囊未激活或分组不存在');
			return;
		}

		// 创建新的文本节点
		const nodeId = `collected-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
		const timestamp = new Date().toLocaleTimeString();

		// 构建节点内容，包含源信息
		let nodeText = content;
		if (sourceInfo.sourcePath && sourceInfo.sourcePath !== '剪贴板') {
			// 使用Obsidian标准链接格式
			const fileName = sourceInfo.sourcePath.split('/').pop()?.replace('.md', '') || sourceInfo.sourcePath;
			nodeText += `\n\n---\n📍 来源: [[${fileName}]]`;
			if (sourceInfo.sourcePosition) {
				nodeText += ` (行 ${sourceInfo.sourcePosition.line + 1})`;
			}
		}
		nodeText += `\n⏰ 收集时间: ${timestamp}`;

		// 计算节点位置（在分组内部）
		const groupNode = this.canvasData?.nodes.find(n => n.id === this.timeCapsuleState.groupId);
		if (!groupNode) {
			console.warn('找不到时间胶囊分组');
			return;
		}

		// 计算新节点的位置（在分组内部排列）
		const itemIndex = this.timeCapsuleState.collectedItems.length;
		const nodeX = groupNode.x + 20 + (itemIndex % 2) * 180;
		const nodeY = groupNode.y + 50 + Math.floor(itemIndex / 2) * 120;

		// 创建新节点
		const newNode: CanvasNode = {
			id: nodeId,
			type: 'text',
			x: nodeX,
			y: nodeY,
			width: 160,
			height: 100,
			color: '5', // 青色标记为收集的内容
			text: nodeText
		};

		// 添加到Canvas数据
		if (this.canvasData) {
			this.canvasData.nodes.push(newNode);
			this.timeCapsuleState.collectedItems.push(nodeId);

			// 保存Canvas文件
			this.saveCanvasData();

			// 刷新显示
			this.renderGrid();

			// 立即更新时间胶囊分组显示
			this.updateTimeCapsuleGroupDisplay();

			// 显示收集成功的通知
			new Notice(`已收集到时间胶囊 (${this.timeCapsuleState.collectedItems.length}/${this.getMaxCollectionCount()})`);

			console.log('内容已收集到时间胶囊:', nodeId);
		}
	}

	// 公开切换时间胶囊方法
	public toggleTimeCapsule(): void {
		if (this.timeCapsuleState.isActive) {
			this.stopTimeCapsule();
		} else {
			this.startTimeCapsule();
		}
	}

	// 更新颜色筛选器（公共方法）
	updateColorFilter(): void {
		if (this.colorFilterContainer) {
			this.colorFilterContainer.remove();
			this.colorFilterContainer = null;
		}
		// 在正确的颜色行中重新创建颜色筛选器
		const container = this.containerEl.children[1] as HTMLElement;
		if (!container) {
			console.error('Canvasgrid Transit: Container element not found');
			return;
		}
		const colorRow = container.querySelector('.canvas-grid-toolbar-color-row');
		if (colorRow) {
			this.createColorFilter(colorRow);
		} else {
			console.warn('Canvasgrid Transit: Color row not found, recreating toolbar');
			// 如果颜色行不存在，重新创建整个工具栏
			const toolbar = container.querySelector('.canvas-grid-toolbar');
			if (toolbar) {
				toolbar.remove();
			}
			this.createToolbar(container);
		}
	}





	// 视图选项方法已移除，功能已整合到主菜单

	// ==================== 搜索和排序功能实现 ====================

	// 执行搜索（优化版本，减少不必要的重新渲染）
	private performSearch(): void {
		if (!this.canvasData) {
			this.filteredNodes = [];
			this.applySortAndFilter();
			return;
		}

		console.log(`🔍 Performing search with query: "${this.searchQuery}"`);

		// 缓存之前的结果以避免不必要的重新渲染
		const previousFilteredNodes = [...this.filteredNodes];

		// 首先进行文本搜索
		let searchResults: CanvasNode[];
		if (!this.searchQuery || this.searchQuery.trim() === '') {
			searchResults = [...this.canvasData.nodes];
			console.log('无搜索查询，使用所有节点:', searchResults.length);
		} else {
			const query = this.searchQuery.toLowerCase().trim();
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
			console.log(`搜索 "${query}" 找到 ${searchResults.length} 个结果`);
		}

		// 然后应用颜色筛选
		console.log('应用颜色筛选，当前筛选颜色:', this.activeColorFilter);

		if (this.activeColorFilter && this.activeColorFilter !== 'all') {
			this.filteredNodes = searchResults.filter(node => {
				// 直接比较颜色值
				const matches = node.color === this.activeColorFilter;
				return matches;
			});
			console.log('颜色筛选后节点数量:', this.filteredNodes.length);
		} else {
			this.filteredNodes = searchResults;
			console.log('无颜色筛选，使用所有搜索结果:', this.filteredNodes.length);
		}

		// 总是应用排序，即使结果相同（可能排序设置已更改）
		console.log(`📊 Final filtered nodes: ${this.filteredNodes.length}, applying sort...`);
		this.applySortAndFilter();
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
		// 如果没有数据，直接渲染空网格
		if (!this.filteredNodes || this.filteredNodes.length === 0) {
			this.renderGrid();
			return;
		}

		console.log(`🔄 Applying sort: ${this.sortBy} (${this.sortOrder}) to ${this.filteredNodes.length} nodes`);

		// 排序逻辑
		this.filteredNodes.sort((a, b) => {
			let comparison = 0;

			try {
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

					default:
						// 默认按创建时间排序
						const defaultTimeA = this.extractTimestamp(a.id);
						const defaultTimeB = this.extractTimestamp(b.id);
						comparison = defaultTimeA - defaultTimeB;
						break;
				}
			} catch (error) {
				console.error('排序过程中出错:', error);
				// 出错时按ID排序作为备用方案
				comparison = a.id.localeCompare(b.id);
			}

			const result = this.sortOrder === 'asc' ? comparison : -comparison;
			return result;
		});

		console.log(`✅ Sort completed. First node: ${this.getNodeTitle(this.filteredNodes[0])}`);
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

	// 强制刷新排序（用于数据更新后）
	private refreshSort(): void {
		console.log('🔄 Refreshing sort...');
		if (!this.canvasData) {
			return;
		}

		// 重新初始化数据
		this.filteredNodes = [...this.canvasData.nodes];

		// 重新应用搜索和排序
		this.performSearch();
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
		this.gridContainer.style.setProperty('--grid-card-spacing', `${CARD_CONSTANTS.spacing}px`);
		this.gridContainer.style.setProperty('--grid-card-min-width', `${CARD_CONSTANTS.width}px`);
		this.gridContainer.style.setProperty('--grid-card-height', `${CARD_CONSTANTS.height}px`);

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

		// 设置滚动监听，实现功能栏自动隐藏/显示
		this.setupScrollListener();

		// 设置网格卡片拖拽事件
		this.setupGridCardDragEvents();

		// 使用CSS处理悬停效果，移除JavaScript事件监听器
	}

	// 设置网格卡片拖拽事件 - 使用HTML5 Drag & Drop API
	private setupGridCardDragEvents() {
		// 为所有卡片设置可拖拽属性
		this.setupCardDragAttributes();

		// 监听拖拽开始事件
		this.registerDomEvent(this.gridContainer, 'dragstart', this.handleCardDragStart.bind(this));

		// 监听拖拽结束事件
		this.registerDomEvent(this.gridContainer, 'dragend', this.handleCardDragEnd.bind(this));
	}

	// 为卡片设置拖拽属性
	private setupCardDragAttributes() {
		const cards = this.gridContainer.querySelectorAll('.canvas-grid-card');
		cards.forEach(card => {
			// 默认不可拖拽，需要长按激活
			(card as HTMLElement).draggable = false;
			(card as HTMLElement).style.cursor = 'grab';

			// 添加长按检测
			this.setupCardLongPress(card as HTMLElement);
		});
	}

	// 设置卡片长按检测
	private setupCardLongPress(cardElement: HTMLElement) {
		let longPressTimer: NodeJS.Timeout | null = null;
		let longPressStartTime = 0;

		// 鼠标按下开始长按检测
		const handleMouseDown = (e: MouseEvent) => {
			// 忽略工具栏按钮
			if ((e.target as HTMLElement).closest('.canvas-card-toolbar')) {
				return;
			}

			longPressStartTime = Date.now();
			longPressTimer = setTimeout(() => {
				// 长按500ms后激活拖拽
				cardElement.draggable = true;
				cardElement.style.cursor = 'grabbing';
				console.log('🔥 Long press detected, drag enabled');

				// 添加视觉反馈
				cardElement.classList.add('long-press-active');
			}, 500);
		};

		// 鼠标抬起清理长按检测
		const handleMouseUp = () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}

			// 短时间后重置拖拽状态
			setTimeout(() => {
				cardElement.draggable = false;
				cardElement.style.cursor = 'grab';
				cardElement.classList.remove('long-press-active');
			}, 100);
		};

		// 鼠标离开清理长按检测
		const handleMouseLeave = () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				longPressTimer = null;
			}
		};

		// 绑定事件
		cardElement.addEventListener('mousedown', handleMouseDown);
		cardElement.addEventListener('mouseup', handleMouseUp);
		cardElement.addEventListener('mouseleave', handleMouseLeave);
	}

	// 设置滚动监听，实现功能栏自动隐藏/显示
	private setupScrollListener(): void {
		let lastScrollTop = 0;
		let isToolbarHidden = false;
		let scrollTimeout: NodeJS.Timeout | null = null;

		// 获取主容器和工具栏元素
		const getContainer = (): HTMLElement | null => {
			return this.containerEl.children[1] as HTMLElement;
		};

		const getToolbar = (): HTMLElement | null => {
			const container = getContainer();
			return container?.querySelector('.canvas-grid-toolbar') as HTMLElement;
		};

		// 显示工具栏
		const showToolbar = () => {
			const toolbar = getToolbar();
			const container = getContainer();
			if (toolbar && container && isToolbarHidden) {
				// 恢复工具栏位置
				toolbar.style.position = 'relative';
				toolbar.style.transform = 'translateY(0)';
				toolbar.style.opacity = '1';
				toolbar.style.zIndex = '100';

				// 移除隐藏状态的CSS类
				this.gridContainer.classList.remove('toolbar-hidden');

				// 移除父容器的隐藏状态类
				const viewContent = this.containerEl.querySelector('.view-content');
				if (viewContent) {
					viewContent.classList.remove('toolbar-hidden-parent');
				}

				// 清除内联样式，让CSS类控制
				this.gridContainer.style.removeProperty('margin-top');
				this.gridContainer.style.removeProperty('height');

				isToolbarHidden = false;
			}
		};

		// 隐藏工具栏
		const hideToolbar = () => {
			const toolbar = getToolbar();
			const container = getContainer();
			if (toolbar && container && !isToolbarHidden) {
				// 获取工具栏高度
				const toolbarHeight = toolbar.offsetHeight;

				// 将工具栏设为固定定位并移出视图
				toolbar.style.position = 'fixed';
				toolbar.style.top = '0';
				toolbar.style.left = '0';
				toolbar.style.right = '0';
				toolbar.style.transform = 'translateY(-100%)';
				toolbar.style.opacity = '0';
				toolbar.style.zIndex = '100';

				// 添加隐藏状态的CSS类
				this.gridContainer.classList.add('toolbar-hidden');

				// 为父容器添加隐藏状态类（兼容性处理）
				const viewContent = this.containerEl.querySelector('.view-content');
				if (viewContent) {
					viewContent.classList.add('toolbar-hidden-parent');
				}

				// 设置负边距来补偿工具栏空间
				this.gridContainer.style.marginTop = `-${toolbarHeight}px`;

				isToolbarHidden = true;
			}
		};

		// 滚动事件处理
		const handleScroll = () => {
			const currentScrollTop = this.gridContainer.scrollTop;
			const scrollDelta = currentScrollTop - lastScrollTop;

			// 清除之前的超时
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}

			// 如果滚动距离很小，忽略
			if (Math.abs(scrollDelta) < 5) {
				return;
			}

			// 如果在顶部附近，始终显示工具栏
			if (currentScrollTop < 50) {
				showToolbar();
			} else {
				// 向下滚动隐藏，向上滚动显示
				if (scrollDelta > 0 && !isToolbarHidden) {
					// 向下滚动，隐藏工具栏
					hideToolbar();
				} else if (scrollDelta < 0 && isToolbarHidden) {
					// 向上滚动，显示工具栏
					showToolbar();
				}
			}

			// 停止滚动后一段时间自动显示工具栏
			scrollTimeout = setTimeout(() => {
				showToolbar();
			}, 2000); // 2秒后自动显示

			lastScrollTop = currentScrollTop;
		};

		// 添加滚动监听
		this.gridContainer.addEventListener('scroll', handleScroll, { passive: true });

		// 初始化工具栏样式
		const toolbar = getToolbar();
		if (toolbar) {
			toolbar.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
			toolbar.style.zIndex = '100';
		}
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

			// 重新初始化搜索和排序
			this.initializeSearchAndSort();

			console.log('✅ Canvas loaded and sort applied');
		} catch (error) {
			console.error("Canvas加载错误:", error);
			this.showErrorState(error instanceof Error ? error.message : '未知错误');
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

		// 添加分组卡片 - 使用排序后的分组列表确保时间胶囊置顶
		const sortedGroups = this.getGroupsForGridView();
		sortedGroups.forEach(groupInfo => {
			// 只添加在当前节点列表中存在的分组
			if (groupNodes.some(node => node.id === groupInfo.group.id)) {
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

		// 设置卡片拖拽属性
		this.setupCardDragAttributes();
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
		card.style.minHeight = `${CARD_CONSTANTS.height}px`;

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
			cardHeight: CARD_CONSTANTS.height
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
		const closeHandler = (e: Event) => {
			const mouseEvent = e as MouseEvent;
			if (!colorPicker.contains(mouseEvent.target as Node)) {
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

	// 获取所有分组信息 - 支持时间胶囊分组置顶
	private getGroupsForGridView(): GroupInfo[] {
		const groups = Array.from(this.groupAnalysis.values());

		// 对分组进行排序：激活的时间胶囊 > 历史时间胶囊 > 普通分组
		const sortedGroups = groups.sort((a, b) => {
			const aIsActive = this.isActiveTimeCapsuleGroup(a.group.id);
			const bIsActive = this.isActiveTimeCapsuleGroup(b.group.id);
			const aIsHistorical = this.isHistoricalTimeCapsuleGroup(a.group.id);
			const bIsHistorical = this.isHistoricalTimeCapsuleGroup(b.group.id);

			// 激活的时间胶囊最优先
			if (aIsActive && !bIsActive) return -1;
			if (!aIsActive && bIsActive) return 1;

			// 历史时间胶囊次优先
			if (aIsHistorical && !bIsHistorical && !bIsActive) return -1;
			if (!aIsHistorical && bIsHistorical && !aIsActive) return 1;

			// 同类型分组按创建时间排序（较新的在前）
			return b.group.id.localeCompare(a.group.id);
		});

		// 调试信息：输出排序结果
		console.log('🔄 Group sorting result:');
		sortedGroups.forEach((group, index) => {
			const isActive = this.isActiveTimeCapsuleGroup(group.group.id);
			const isHistorical = this.isHistoricalTimeCapsuleGroup(group.group.id);
			const type = isActive ? 'ACTIVE' : isHistorical ? 'HISTORICAL' : 'NORMAL';
			console.log(`  ${index + 1}. [${type}] ${group.group.id}`);
		});

		return sortedGroups;
	}

	// 判断是否为时间胶囊分组（包括历史时间胶囊）
	private isTimeCapsuleGroup(groupId: string): boolean {
		return groupId.startsWith('time-capsule-');
	}

	// 判断是否为当前激活的时间胶囊分组
	private isActiveTimeCapsuleGroup(groupId: string): boolean {
		return this.timeCapsuleState.isActive &&
			   groupId === this.timeCapsuleState.groupId;
	}

	// 判断是否为历史时间胶囊分组
	private isHistoricalTimeCapsuleGroup(groupId: string): boolean {
		return this.isTimeCapsuleGroup(groupId) &&
			   !this.isActiveTimeCapsuleGroup(groupId);
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
		// 在颜色行中添加返回按钮
		this.addGroupViewBackButtonToColorRow();
	}

	// 在颜色行中添加返回按钮
	private addGroupViewBackButtonToColorRow(): void {
		const toolbar = this.containerEl.querySelector('.canvas-grid-toolbar');
		if (!toolbar) return;

		// 查找颜色行容器
		const colorRow = toolbar.querySelector('.canvas-grid-toolbar-color-row');
		if (!colorRow) return;

		// 移除现有的返回按钮（如果有）
		const existingBackButton = toolbar.querySelector('.group-back-button-toolbar');
		if (existingBackButton) {
			existingBackButton.remove();
		}

		// 创建返回按钮
		const backButton = document.createElement('button');
		backButton.className = 'group-back-button-toolbar';
		backButton.title = this.settings.language === 'zh' ? '返回主视图' : 'Back to main view';
		backButton.setAttribute('aria-label', this.settings.language === 'zh' ? '返回主视图' : 'Back to main view');

		// 返回图标
		backButton.innerHTML = `
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="15,18 9,12 15,6"/>
			</svg>
		`;

		// 点击事件
		backButton.onclick = () => this.exitGroupView();

		// 插入到颜色行的开头（颜色圆点之前）
		const colorFilter = colorRow.querySelector('.canvas-grid-color-filter');
		if (colorFilter) {
			colorRow.insertBefore(backButton, colorFilter);
		} else {
			colorRow.appendChild(backButton);
		}
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

		// 为分组详情界面的卡片设置拖拽属性和事件
		this.setupCardDragAttributes();

		console.log(`✅ Group members rendered with drag support: ${groupInfo.members.length} cards`);
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
		const isTimeCapsule = this.isTimeCapsuleGroup(groupInfo.group.id);
		const isActiveTimeCapsule = this.isActiveTimeCapsuleGroup(groupInfo.group.id);
		const isHistoricalTimeCapsule = this.isHistoricalTimeCapsuleGroup(groupInfo.group.id);

		// 设置基础样式类
		if (isActiveTimeCapsule) {
			card.className = 'canvas-grid-card group-card time-capsule-group time-capsule-collecting';
		} else if (isHistoricalTimeCapsule) {
			card.className = 'canvas-grid-card group-card time-capsule-group time-capsule-historical';
		} else {
			card.className = 'canvas-grid-card group-card';
		}

		card.dataset.nodeId = groupInfo.group.id;
		card.dataset.nodeType = 'group';

		// 设置卡片尺寸
		card.style.minHeight = `${CARD_CONSTANTS.height}px`;

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

		// 分组图标 - 根据时间胶囊状态显示不同图标
		const iconDiv = contentDiv.createDiv('group-icon');
		if (isActiveTimeCapsule) {
			// 激活的时间胶囊图标（带旋转动画）
			iconDiv.innerHTML = `
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 2v6h.01L6 8.01 10 12l-4 4-.01.01V22h12v-5.99-.01L18 16l-4-4 4-3.99.01-.01V2H6z"/>
				</svg>
			`;
			iconDiv.classList.add('time-capsule-icon', 'time-capsule-active');
		} else if (isHistoricalTimeCapsule) {
			// 历史时间胶囊图标（静态）
			iconDiv.innerHTML = `
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 2v6h.01L6 8.01 10 12l-4 4-.01.01V22h12v-5.99-.01L18 16l-4-4 4-3.99.01-.01V2H6z"/>
				</svg>
			`;
			iconDiv.classList.add('time-capsule-icon', 'time-capsule-historical');
		} else {
			// 普通分组图标
			iconDiv.innerHTML = `
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
					<path d="M9 9h6v6H9z"/>
				</svg>
			`;
		}

		// 分组标题
		const titleDiv = contentDiv.createDiv('group-title');
		titleDiv.textContent = groupInfo.group.label || '未命名分组';

		// 成员数量和时间胶囊状态
		const countDiv = contentDiv.createDiv('group-member-count');
		if (isActiveTimeCapsule) {
			// 激活的时间胶囊：显示倒计时和收集状态
			const minutes = Math.floor(this.timeCapsuleState.remainingTime / 60000);
			const seconds = Math.floor((this.timeCapsuleState.remainingTime % 60000) / 1000);
			const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
			countDiv.innerHTML = `
				<div class="time-capsule-status">
					<span class="collecting-text">收集中</span>
					<span class="countdown-text">${timeText}</span>
				</div>
				<div class="member-count">${groupInfo.memberCount} 个项目</div>
			`;
		} else if (isHistoricalTimeCapsule) {
			// 历史时间胶囊：显示完成状态
			countDiv.innerHTML = `
				<div class="time-capsule-status">
					<span class="completed-text">已完成</span>
				</div>
				<div class="member-count">${groupInfo.memberCount} 个项目</div>
			`;
		} else {
			// 普通分组：只显示项目数量
			countDiv.textContent = `${groupInfo.memberCount} 个项目`;
		}

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

		// 添加URL数据属性，用于后续更新
		contentDiv.dataset.nodeUrl = preview.url;

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

	// 提取链接元数据（优化版本 - 快速书签解析）
	private async extractLinkMetadata(url: string): Promise<LinkPreview> {
		try {
			// 验证URL格式
			const urlObj = new URL(url);

			// 立即返回基础书签信息，然后异步获取详细信息
			const basicPreview: LinkPreview = {
				url,
				title: this.extractTitleFromUrl(url),
				siteName: this.extractDomainFromUrl(url),
				favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`,
				isBasic: true // 标记为基础信息
			};

			// 异步获取详细信息（不阻塞UI）
			this.fetchDetailedMetadata(url, basicPreview);

			return basicPreview;
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

	// 从URL提取智能标题
	private extractTitleFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			const domain = urlObj.hostname;
			const path = urlObj.pathname;

			// 尝试从路径中提取有意义的标题
			if (path && path !== '/') {
				const pathParts = path.split('/').filter(part => part.length > 0);
				if (pathParts.length > 0) {
					const lastPart = pathParts[pathParts.length - 1];
					// 移除文件扩展名和常见的URL参数
					const cleanTitle = lastPart
						.replace(/\.(html|htm|php|asp|jsp)$/i, '')
						.replace(/[-_]/g, ' ')
						.replace(/\b\w/g, l => l.toUpperCase());

					if (cleanTitle.length > 3) {
						return cleanTitle;
					}
				}
			}

			// 回退到域名
			return this.extractDomainFromUrl(url);
		} catch {
			return this.extractDomainFromUrl(url);
		}
	}

	// 异步获取详细元数据（不阻塞UI）
	private async fetchDetailedMetadata(url: string, basicPreview: LinkPreview): Promise<void> {
		try {
			// 使用更快的超时时间
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

			// 尝试多个快速API服务
			const apiServices = [
				`https://api.microlink.io/?url=${encodeURIComponent(url)}&timeout=2000`,
				`https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`,
			];

			let detailedData = null;

			// 并行请求多个服务，使用第一个成功的响应
			for (const apiUrl of apiServices) {
				try {
					const response = await Promise.race([
						fetch(apiUrl, {
							signal: controller.signal,
							headers: {
								'Accept': 'application/json',
								'User-Agent': 'Obsidian Canvasgrid Transit Plugin'
							}
						}),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error('Service timeout')), 2000)
						)
					]) as Response;

					if (response.ok) {
						const data = await response.json();
						if (this.isValidMetadata(data)) {
							detailedData = data;
							break;
						}
					}
				} catch (serviceError) {
					console.log(`API service failed: ${apiUrl}`, serviceError);
					continue;
				}
			}

			clearTimeout(timeoutId);

			// 如果获取到详细信息，更新缓存和UI
			if (detailedData) {
				const enhancedPreview = this.parseMetadataResponse(url, detailedData);
				this.setCacheItem(url, enhancedPreview);
				this.updateBookmarkCard(url, enhancedPreview);
			}

		} catch (error) {
			console.log('详细元数据获取失败，使用基础信息:', error);
			// 失败时不做任何操作，保持基础预览
		}
	}

	// 验证元数据响应是否有效
	private isValidMetadata(data: any): boolean {
		if (!data) return false;

		// 检查 microlink.io 格式
		if (data.status === 'success' && data.data) {
			return true;
		}

		// 检查 jsonlink.io 格式
		if (data.title || data.description) {
			return true;
		}

		return false;
	}

	// 解析不同API服务的响应格式
	private parseMetadataResponse(url: string, data: any): LinkPreview {
		let title = '';
		let description = '';
		let image = '';
		let siteName = '';
		let favicon = '';

		// 解析 microlink.io 格式
		if (data.status === 'success' && data.data) {
			title = data.data.title || '';
			description = data.data.description || '';
			image = data.data.image?.url || '';
			siteName = data.data.publisher || '';
			favicon = data.data.logo?.url || '';
		}
		// 解析 jsonlink.io 格式
		else if (data.title || data.description) {
			title = data.title || '';
			description = data.description || '';
			image = data.image || '';
			siteName = data.site_name || '';
			favicon = data.favicon || '';
		}

		// 生成默认favicon（如果没有获取到）
		if (!favicon) {
			try {
				const urlObj = new URL(url);
				favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`;
			} catch {
				favicon = '';
			}
		}

		return {
			url,
			title: title || this.extractTitleFromUrl(url),
			description: description || '',
			image: image || '',
			siteName: siteName || this.extractDomainFromUrl(url),
			favicon: favicon
		};
	}

	// 更新书签卡片显示（当获取到详细信息时）
	private updateBookmarkCard(url: string, enhancedPreview: LinkPreview): void {
		// 查找所有显示该URL的卡片
		const cards = this.gridContainer.querySelectorAll(`[data-node-url="${url}"]`);

		cards.forEach(card => {
			const bookmarkContainer = card.querySelector('.link-bookmark-container');
			if (bookmarkContainer) {
				// 更新标题
				const titleEl = bookmarkContainer.querySelector('.link-bookmark-title');
				if (titleEl && enhancedPreview.title) {
					titleEl.textContent = enhancedPreview.title;
				}

				// 更新或添加描述
				let descEl = bookmarkContainer.querySelector('.link-bookmark-description');
				if (enhancedPreview.description) {
					if (!descEl) {
						const contentArea = bookmarkContainer.querySelector('.link-bookmark-content');
						if (contentArea) {
							descEl = contentArea.createDiv('link-bookmark-description');
						}
					}
					if (descEl) {
						descEl.textContent = enhancedPreview.description;
					}
				}

				// 更新图片
				const imageArea = bookmarkContainer.querySelector('.link-bookmark-image');
				if (imageArea && enhancedPreview.image) {
					const img = imageArea.querySelector('img') as HTMLImageElement;
					if (img) {
						img.src = enhancedPreview.image;
					}
				}

				// 更新favicon
				const faviconEl = bookmarkContainer.querySelector('.link-bookmark-favicon');
				if (faviconEl && enhancedPreview.favicon) {
					const img = faviconEl.querySelector('img') as HTMLImageElement;
					if (img) {
						img.src = enhancedPreview.favicon;
					}
				}
			}
		});
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

		// 清理拖拽相关的全局事件监听器
		this.removeGlobalMouseListeners();

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
		this.canvasData = null;
		this.searchInputEl = null;
		this.colorFilterContainer = null;
		this.dropIndicator = null;

		// 清理宽度控制
		this.cleanupWidthControl();

		// 清理关联的Canvas文件引用
		this.linkedCanvasFile = null;
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
		const nodeType = card.dataset.nodeType;
		if (!nodeId) return;

		// 创建菜单容器
		const menu = document.createElement('div');
		menu.className = 'canvas-grid-context-menu';

		// 根据节点类型创建不同的菜单项
		if (nodeType === 'group') {
			// 分组卡片的菜单项
			const renameItem = this.createMenuItem('重命名分组', 'lucide-edit-3', () => {
				this.renameGroup(nodeId);
				this.hideContextMenu();
			});

			const focusItem = this.createMenuItem('聚焦分组', 'lucide-target', () => {
				this.focusNodeInCanvas(nodeId);
				this.hideContextMenu();
			});

			const deleteItem = this.createMenuItem('删除分组', 'lucide-trash-2', () => {
				this.deleteCard(card);
				this.hideContextMenu();
			});

			menu.appendChild(renameItem);
			menu.appendChild(focusItem);
			menu.appendChild(deleteItem);
		} else {
			// 普通节点的菜单项
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

			// 添加基本菜单项
			menu.appendChild(focusItem);
			menu.appendChild(editItem);

			// 始终添加回链功能键（不依赖于回链检测）
			const node = this.canvasData?.nodes.find(n => n.id === nodeId);
			if (node) {
				const backlinkItem = this.createMenuItem('回链', 'lucide-arrow-left', () => {
					this.handleBacklinkNavigation(node);
					this.hideContextMenu();
				});
				menu.appendChild(backlinkItem);
				console.log('Added backlink menu item for node:', nodeId);
			}

			menu.appendChild(deleteItem);
		}

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

	// 处理回链功能（旧版本，保留兼容性）
	private async handleBacklink(nodeId: string): Promise<void> {
		try {
			console.log('Handling backlink for node:', nodeId);

			// 这里是回链功能的占位符实现
			// 目前先显示一个通知，表示功能已被触发
			new Notice(`回链功能已触发，节点ID: ${nodeId}`);

			// TODO: 实现具体的回链逻辑
			// 1. 查找与该节点相关的源文件
			// 2. 打开源文件并定位到相关位置
			// 3. 高亮显示相关内容

		} catch (error) {
			console.error('Failed to handle backlink:', error);
			new Notice('回链功能执行失败');
		}
	}

	// 智能处理回链导航（新版本）
	private async handleBacklinkNavigation(node: CanvasNode): Promise<void> {
		try {
			console.log('=== Backlink Navigation ===');
			console.log('Node:', node);

			// 首先检查节点是否包含回链
			if (this.hasBacklink(node)) {
				console.log('✅ Found backlink in node, using navigateToBacklink');
				await this.navigateToBacklink(node);
			} else {
				console.log('❌ No backlink found, showing alternative options');

				// 如果没有回链，提供其他选项
				await this.showBacklinkAlternatives(node);
			}

		} catch (error) {
			console.error('Failed to handle backlink navigation:', error);
			new Notice('回链导航失败');
		}
	}

	// 显示回链替代选项
	private async showBacklinkAlternatives(node: CanvasNode): Promise<void> {
		// 创建一个简单的选择对话框
		const modal = new Modal(this.app);
		modal.titleEl.setText('回链选项');

		const content = modal.contentEl;
		content.empty();

		content.createEl('p', { text: '该节点没有检测到回链信息，请选择操作：' });

		const buttonContainer = content.createDiv('backlink-options-container');
		buttonContainer.style.cssText = `
			display: flex;
			gap: 10px;
			margin-top: 20px;
			justify-content: center;
		`;

		// 选项1：手动查找源文件
		const searchButton = buttonContainer.createEl('button', { text: '查找源文件' });
		searchButton.onclick = () => {
			modal.close();
			this.searchForSourceFile(node);
		};

		// 选项2：显示节点信息
		const infoButton = buttonContainer.createEl('button', { text: '节点信息' });
		infoButton.onclick = () => {
			modal.close();
			this.showNodeInfo(node);
		};

		// 选项3：取消
		const cancelButton = buttonContainer.createEl('button', { text: '取消' });
		cancelButton.onclick = () => {
			modal.close();
		};

		modal.open();
	}

	// 搜索可能的源文件
	private async searchForSourceFile(node: CanvasNode): Promise<void> {
		if (node.type !== 'text' || !node.text) {
			new Notice('只能为文本节点搜索源文件');
			return;
		}

		// 提取节点文本的前几个词作为搜索关键词
		const searchText = node.text.split('\n')[0].substring(0, 50);

		new Notice(`正在搜索包含 "${searchText}" 的文件...`);

		// 使用Obsidian的搜索功能
		try {
			// 尝试打开全局搜索
			(this.app as any).internalPlugins?.getPluginById('global-search')?.instance?.openGlobalSearch?.(searchText);
		} catch (error) {
			console.log('Global search not available, showing manual search notice');
			new Notice(`请手动搜索: "${searchText}"`);
		}
	}

	// 显示节点详细信息
	private showNodeInfo(node: CanvasNode): Promise<void> {
		const info = [
			`节点ID: ${node.id}`,
			`节点类型: ${node.type}`,
			`位置: (${node.x}, ${node.y})`,
			`尺寸: ${node.width} × ${node.height}`,
			node.text ? `文本长度: ${node.text.length} 字符` : '无文本内容'
		];

		new Notice(info.join('\n'), 5000);
		console.log('Node Info:', node);

		return Promise.resolve();
	}

	// 重命名分组
	private async renameGroup(groupId: string): Promise<void> {
		if (!this.canvasData) return;

		// 找到分组节点
		const groupNode = this.canvasData.nodes.find(n => n.id === groupId && n.type === 'group');
		if (!groupNode) {
			new Notice('未找到分组节点');
			return;
		}

		// 获取当前分组名称
		const currentName = groupNode.label || '未命名分组';

		// 创建重命名对话框
		const modal = new GroupRenameModal(this.app, currentName, async (newName: string) => {
			try {
				// 更新分组节点的label
				groupNode.label = newName;

				// 保存到Canvas文件
				await this.saveCanvasData();

				// 更新分组分析数据
				const groupInfo = this.groupAnalysis.get(groupId);
				if (groupInfo) {
					groupInfo.group.label = newName;
				}

				// 重新渲染网格以显示新名称
				this.renderGrid();

				// 通知Canvas视图刷新
				this.notifyCanvasViewRefresh();

				new Notice(`分组已重命名为: ${newName}`);
				console.log(`Group ${groupId} renamed to: ${newName}`);
			} catch (error) {
				console.error('Failed to rename group:', error);
				new Notice('重命名分组失败');
			}
		});

		modal.open();
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

		// 使用关联的Canvas文件，而不是当前活动文件
		const canvasFile = this.linkedCanvasFile;
		if (!canvasFile) {
			throw new Error('没有关联的Canvas文件');
		}

		try {
			console.log('Saving node to canvas:', node.id);

			const content = await this.app.vault.read(canvasFile);

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
			await this.app.vault.modify(canvasFile, jsonContent);

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

		// 3. 设置Canvas拖拽目标（用于接收网格卡片）
		this.setupCanvasDropTarget();
	}

	// ==================== 网格卡片拖拽到Canvas功能 (HTML5 Drag & Drop API) ====================

	/*
	 * 旧的鼠标事件处理代码已被HTML5 Drag & Drop API替代
	 * 保留注释以防需要回退
	 */

	// 处理卡片拖拽开始事件
	private handleCardDragStart(e: DragEvent) {
		const cardElement = (e.target as HTMLElement).closest('.canvas-grid-card') as HTMLElement;
		if (!cardElement || !cardElement.dataset.nodeId) {
			e.preventDefault();
			return;
		}

		// 忽略工具栏按钮拖拽
		if ((e.target as HTMLElement).closest('.canvas-card-toolbar')) {
			e.preventDefault();
			return;
		}

		const nodeId = cardElement.dataset.nodeId;
		const node = this.canvasData?.nodes.find(n => n.id === nodeId);
		if (!node) {
			e.preventDefault();
			return;
		}

		console.log('🚀 Starting card drag with HTML5 API:', node);

		// 设置拖拽数据 - 使用Obsidian Canvas兼容的格式
		if (e.dataTransfer) {
			// 设置拖拽数据
			e.dataTransfer.setData('text/plain', node.text || '');
			e.dataTransfer.setData('application/json', JSON.stringify({
				type: 'canvas-node',
				nodeData: node,
				source: 'canvas-grid-view',
				isCtrlDrag: e.ctrlKey  // 记录是否按住Ctrl键
			}));
			// 修正操作逻辑：Ctrl+拖拽=复制，普通拖拽=移动
			e.dataTransfer.effectAllowed = e.ctrlKey ? 'copy' : 'move';

			// 设置拖拽预览
			this.setCardDragPreview(e, cardElement);
		}

		// 添加拖拽样式
		cardElement.classList.add('dragging-from-grid');
		cardElement.style.cursor = 'grabbing';

		// 保存拖拽状态
		this.isDragFromGrid = true;
		this.currentDragCard = cardElement;

		console.log('✅ Card drag started successfully');
	}

	// 处理卡片拖拽结束事件
	private handleCardDragEnd(e: DragEvent) {
		console.log('🏁 Card drag ended');

		// 清理拖拽样式
		if (this.currentDragCard) {
			this.currentDragCard.classList.remove('dragging-from-grid');
			this.currentDragCard.style.cursor = 'grab';
		}

		// 重置拖拽状态
		this.isDragFromGrid = false;
		this.currentDragCard = null;

		console.log('✅ Card drag cleanup completed');
	}

	// 设置卡片拖拽预览
	private setCardDragPreview(e: DragEvent, cardElement: HTMLElement) {
		try {
			// 创建预览元素
			const preview = cardElement.cloneNode(true) as HTMLElement;
			preview.style.cssText = `
				position: absolute;
				top: -1000px;
				left: -1000px;
				width: ${cardElement.offsetWidth}px;
				height: ${cardElement.offsetHeight}px;
				opacity: 0.8;
				transform: rotate(3deg);
				box-shadow: 0 5px 15px rgba(0,0,0,0.3);
				pointer-events: none;
				z-index: 10000;
			`;

			document.body.appendChild(preview);

			// 设置为拖拽图像
			if (e.dataTransfer) {
				e.dataTransfer.setDragImage(preview, cardElement.offsetWidth / 2, cardElement.offsetHeight / 2);
			}

			// 清理预览元素
			setTimeout(() => {
				if (document.body.contains(preview)) {
					document.body.removeChild(preview);
				}
			}, 0);
		} catch (error) {
			console.error('Failed to set card drag preview:', error);
		}
	}

	// 设置Canvas拖拽目标
	private setupCanvasDropTarget() {
		console.log('Setting up Canvas drop target for grid cards...');

		// 监听全局拖拽事件，检测Canvas区域
		this.registerDomEvent(document, 'dragover', (e: DragEvent) => {
			// 检查是否是从网格拖拽的卡片
			if (this.isDragFromGrid && e.dataTransfer?.types.includes('application/json')) {
				const canvasElement = this.findCanvasElementUnderCursor(e);
				if (canvasElement) {
					e.preventDefault();
					// 修正操作逻辑：Ctrl+拖拽=复制，普通拖拽=移动
					e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
				}
			}
		});

		this.registerDomEvent(document, 'drop', (e: DragEvent) => {
			// 检查是否是从网格拖拽的卡片
			if (this.isDragFromGrid && e.dataTransfer?.types.includes('application/json')) {
				const canvasView = this.findCanvasViewUnderCursor(e);
				if (canvasView) {
					e.preventDefault();
					this.handleCanvasDropFromGrid(e, canvasView);
				}
			}
		});
	}

	// 查找鼠标下的Canvas元素
	private findCanvasElementUnderCursor(e: DragEvent): HTMLElement | null {
		const element = document.elementFromPoint(e.clientX, e.clientY);
		if (!element) return null;

		// 检查是否在Canvas容器内
		const canvasContainer = element.closest('.workspace-leaf-content[data-type="canvas"]');
		return canvasContainer as HTMLElement;
	}

	// 处理Canvas接收网格卡片的拖拽
	private async handleCanvasDropFromGrid(e: DragEvent, canvasView: any) {
		try {
			console.log('🎯 Handling Canvas drop from grid...');

			// 获取拖拽数据
			const dragDataStr = e.dataTransfer?.getData('application/json');
			if (!dragDataStr) {
				console.error('No drag data found');
				return;
			}

			const dragData = JSON.parse(dragDataStr);
			if (dragData.type !== 'canvas-node' || dragData.source !== 'canvas-grid-view') {
				console.log('Not a grid card drag, ignoring');
				return;
			}

			const node = dragData.nodeData;
			const isCtrlDrag = dragData.isCtrlDrag || e.ctrlKey; // 使用拖拽开始时的Ctrl状态
			console.log('Processing grid card drop:', node, 'Ctrl pressed:', isCtrlDrag);

			// 使用Obsidian内置的Canvas坐标转换
			const canvasCoords = this.getCanvasCoordinatesFromDrop(e, canvasView);
			console.log('Canvas coordinates:', canvasCoords);

			// 创建新节点
			const newNode = this.createCanvasNodeFromGridCard(node, canvasCoords);

			// 添加到Canvas
			await this.addNodeToCanvas(newNode, canvasView);

			// 修正操作逻辑：遵循Obsidian官方白板逻辑
			if (isCtrlDrag) {
				// Ctrl+拖拽：复制（保持原卡片）
				new Notice('卡片已复制到Canvas');
				console.log('✅ Card copied to Canvas (Ctrl+drag)');
			} else {
				// 普通拖拽：移动（删除原卡片）
				await this.removeNodeFromGrid(node.id);
				new Notice('卡片已移动到Canvas');
				console.log('✅ Card moved to Canvas (normal drag)');
			}

			console.log('✅ Canvas drop completed successfully');

		} catch (error) {
			console.error('Failed to handle Canvas drop:', error);
			new Notice('拖拽到Canvas失败');
		}
	}

	// 从拖拽事件获取Canvas坐标 - 使用Obsidian内置方法
	private getCanvasCoordinatesFromDrop(e: DragEvent, canvasView: any): { x: number, y: number } {
		console.log('🎯 Getting Canvas coordinates from drop event...');

		try {
			// 尝试使用Obsidian Canvas的内置坐标转换方法
			if (canvasView.canvas && typeof canvasView.canvas.posFromEvt === 'function') {
				const pos = canvasView.canvas.posFromEvt(e);
				console.log('✅ Using Canvas.posFromEvt:', pos);
				return { x: pos.x, y: pos.y };
			}

			// 备用方法：手动计算坐标
			console.log('⚠️ Canvas.posFromEvt not available, using manual calculation');
			return this.getCanvasCoordinatesManual(e, canvasView);

		} catch (error) {
			console.error('Error getting Canvas coordinates:', error);
			// 最后的备用方法
			return { x: e.clientX, y: e.clientY };
		}
	}

	// 手动计算Canvas坐标（备用方法）
	private getCanvasCoordinatesManual(e: DragEvent, canvasView: any): { x: number, y: number } {
		const canvasContainer = canvasView.containerEl.querySelector('.canvas-wrapper') ||
								canvasView.containerEl.querySelector('.canvas-container') ||
								canvasView.containerEl;

		if (!canvasContainer) {
			console.warn('Canvas container not found, using event coordinates');
			return { x: e.clientX, y: e.clientY };
		}

		const rect = canvasContainer.getBoundingClientRect();
		const relativeX = e.clientX - rect.left;
		const relativeY = e.clientY - rect.top;

		// 应用Canvas变换
		const canvas = canvasView.canvas;
		if (canvas && canvas.tx !== undefined && canvas.ty !== undefined && canvas.tZoom !== undefined) {
			return {
				x: (relativeX - canvas.tx) / canvas.tZoom,
				y: (relativeY - canvas.ty) / canvas.tZoom
			};
		}

		return { x: relativeX, y: relativeY };
	}

	// 处理卡片鼠标按下事件 (已废弃 - 使用HTML5 Drag & Drop API)
	private handleCardMouseDown_DEPRECATED(e: MouseEvent) {
		const cardElement = (e.target as HTMLElement).closest('.canvas-grid-card') as HTMLElement;
		if (!cardElement || !cardElement.dataset.nodeId) return;

		// 忽略工具栏按钮点击
		if ((e.target as HTMLElement).closest('.canvas-card-toolbar')) return;

		this.longPressStartTime = Date.now();
		this.dragStartPosition = { x: e.clientX, y: e.clientY };
		this.currentDragCard = cardElement;

		// 添加全局鼠标事件监听器
		this.addGlobalMouseListeners();

		// 设置长按定时器
		this.longPressTimer = setTimeout(() => {
			this.startCardDrag(cardElement, e);
		}, this.longPressThreshold);

		// 阻止默认行为，避免文本选择
		e.preventDefault();
	}

	// 处理卡片鼠标移动事件 (已废弃 - 使用HTML5 Drag & Drop API)
	private handleCardMouseMove_DEPRECATED(e: MouseEvent) {
		// 如果还在长按等待阶段
		if (!this.isDragFromGrid && this.longPressTimer) {
			// 计算移动距离
			const deltaX = Math.abs(e.clientX - this.dragStartPosition.x);
			const deltaY = Math.abs(e.clientY - this.dragStartPosition.y);
			const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			// 如果移动距离超过阈值，取消长按
			if (moveDistance > 10) {
				this.clearLongPressTimer();
			}
		}

		// 如果已经在拖拽中，更新拖拽预览位置
		if (this.isDragFromGrid && this.dragPreviewElement) {
			this.dragPreviewElement.style.top = `${e.clientY - 20}px`;
			this.dragPreviewElement.style.left = `${e.clientX - 20}px`;
		}
	}

	// 处理卡片鼠标抬起事件 (已废弃 - 使用HTML5 Drag & Drop API)
	private handleCardMouseUp_DEPRECATED(e: MouseEvent) {
		this.clearLongPressTimer();

		// 如果正在拖拽，处理拖拽结束
		if (this.isDragFromGrid) {
			this.endCardDrag(e);
		} else {
			// 如果没有在拖拽，只需要重置状态
			this.resetCardDragState();
		}
	}

	// 处理鼠标离开网格容器事件
	private handleCardMouseLeave(e: MouseEvent) {
		// 清理长按定时器（防止在边界触发长按）
		this.clearLongPressTimer();

		// 只有在没有进行拖拽时才重置状态
		// 如果正在拖拽，允许继续拖拽到其他区域
		if (!this.isDragFromGrid) {
			this.resetCardDragState();
		}
	}

	// 清理长按定时器
	private clearLongPressTimer() {
		if (this.longPressTimer) {
			clearTimeout(this.longPressTimer);
			this.longPressTimer = null;
		}
	}

	// 重置卡片拖拽状态
	private resetCardDragState() {
		console.log('Resetting card drag state...');

		// 清理拖拽预览
		this.forceCleanupDragPreview();

		// 清理拖拽提示
		this.hideDragHint();

		// 移除拖拽样式
		if (this.currentDragCard) {
			this.currentDragCard.classList.remove('dragging-from-grid');
		}

		// 重置状态变量
		this.currentDragCard = null;
		this.isDragFromGrid = false;
		this.longPressStartTime = 0;
		this.dragStartPosition = { x: 0, y: 0 };

		// 移除全局事件监听器
		this.removeGlobalMouseListeners();

		console.log('Card drag state reset complete');
	}

	// 全局鼠标事件监听器引用
	private globalMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
	private globalMouseUpHandler: ((e: MouseEvent) => void) | null = null;

	// 添加全局鼠标事件监听器
	private addGlobalMouseListeners() {
		// 如果已经添加过，先移除
		this.removeGlobalMouseListeners();

		console.log('Adding global mouse listeners...');

		// 创建事件处理器 (已废弃 - 使用HTML5 Drag & Drop API)
		this.globalMouseMoveHandler = (e: MouseEvent) => {
			this.handleCardMouseMove_DEPRECATED(e);
		};

		this.globalMouseUpHandler = (e: MouseEvent) => {
			this.handleCardMouseUp_DEPRECATED(e);
		};

		// 添加到document
		document.addEventListener('mousemove', this.globalMouseMoveHandler, { passive: true });
		document.addEventListener('mouseup', this.globalMouseUpHandler);

		// 添加ESC键取消拖拽
		document.addEventListener('keydown', this.handleDragEscape);

		// 添加窗口失焦时的清理（延迟添加，避免在拖拽开始时立即触发）
		setTimeout(() => {
			if (this.isDragFromGrid) {
				window.addEventListener('blur', this.handleWindowBlur);
			}
		}, 200);

		console.log('Global mouse listeners added');
	}

	// 窗口失焦处理器
	private handleWindowBlur = () => {
		// 延迟检查，因为在Obsidian内部切换视图时也会触发blur
		setTimeout(() => {
			// 只有在真正失去焦点且仍在拖拽时才取消
			if (this.isDragFromGrid && !document.hasFocus()) {
				console.log('Window lost focus, canceling drag...');
				this.cancelDrag();
			}
		}, 100);
	};

	// ESC键取消拖拽处理器
	private handleDragEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && this.isDragFromGrid) {
			console.log('ESC pressed, canceling drag...');
			this.cancelDrag();
		}
	};

	// 取消拖拽操作
	private cancelDrag() {
		console.log('Canceling drag operation...');
		this.resetCardDragState();
	}

	// 移除全局鼠标事件监听器
	private removeGlobalMouseListeners() {
		console.log('Removing global mouse listeners...');

		if (this.globalMouseMoveHandler) {
			document.removeEventListener('mousemove', this.globalMouseMoveHandler);
			this.globalMouseMoveHandler = null;
		}

		if (this.globalMouseUpHandler) {
			document.removeEventListener('mouseup', this.globalMouseUpHandler);
			this.globalMouseUpHandler = null;
		}

		// 移除窗口失焦监听器
		window.removeEventListener('blur', this.handleWindowBlur);

		// 移除ESC键监听器
		document.removeEventListener('keydown', this.handleDragEscape);

		console.log('Global mouse listeners removed');
	}

	// 开始卡片拖拽
	private startCardDrag(cardElement: HTMLElement, e: MouseEvent) {
		const nodeId = cardElement.dataset.nodeId;
		if (!nodeId || !this.canvasData) return;

		// 查找对应的节点数据
		const node = this.canvasData.nodes.find(n => n.id === nodeId);
		if (!node) return;

		console.log('Starting card drag from grid:', node);

		this.isDragFromGrid = true;

		// 创建拖拽预览
		this.createDragPreview(cardElement, e);

		// 添加拖拽样式
		cardElement.classList.add('dragging-from-grid');

		// 显示拖拽提示
		this.showDragHint(e.ctrlKey);
	}

	// 结束卡片拖拽
	private endCardDrag(e: MouseEvent) {
		console.log('🏁 Ending card drag at:', e.clientX, e.clientY);

		if (!this.currentDragCard || !this.isDragFromGrid) {
			console.log('❌ Invalid drag state - currentDragCard:', !!this.currentDragCard, 'isDragFromGrid:', this.isDragFromGrid);
			return;
		}

		const nodeId = this.currentDragCard.dataset.nodeId;
		if (!nodeId || !this.canvasData) {
			console.log('❌ Missing nodeId or canvasData - nodeId:', nodeId, 'canvasData:', !!this.canvasData);
			return;
		}

		// 查找对应的节点数据
		const node = this.canvasData.nodes.find(n => n.id === nodeId);
		if (!node) {
			console.log('❌ Node not found for nodeId:', nodeId);
			return;
		}

		console.log('✅ Found node for drag:', node);

		// 检查是否拖拽到Canvas视图
		const canvasView = this.findCanvasViewUnderCursor(e);
		if (canvasView) {
			console.log('🎯 Canvas view found, handling drop...');
			this.handleDropToCanvas(node, e, canvasView);
		} else {
			console.log('❌ No Canvas view found under cursor');
			new Notice('请拖拽到Canvas区域');
		}

		// 清理拖拽状态 - 使用完整的状态重置
		console.log('🧹 Cleaning up drag state...');
		this.resetCardDragState();
	}

	// 创建拖拽预览
	private createDragPreview(cardElement: HTMLElement, e: MouseEvent) {
		// 先清理任何现有的预览
		this.forceCleanupDragPreview();

		console.log('Creating drag preview...');

		// 创建预览元素
		this.dragPreviewElement = cardElement.cloneNode(true) as HTMLElement;
		this.dragPreviewElement.classList.add('drag-preview');
		this.dragPreviewElement.style.cssText = `
			position: fixed !important;
			top: ${e.clientY - 20}px !important;
			left: ${e.clientX - 20}px !important;
			width: ${cardElement.offsetWidth}px !important;
			height: ${cardElement.offsetHeight}px !important;
			opacity: 0.8 !important;
			pointer-events: none !important;
			z-index: 10000 !important;
			transform: rotate(5deg) !important;
			box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
		`;

		document.body.appendChild(this.dragPreviewElement);

		// 不再在这里添加独立的移动监听器，而是通过全局的handleCardMouseMove来处理
		console.log('Drag preview created and attached');
	}

	// 强制清理拖拽预览
	private forceCleanupDragPreview() {
		console.log('Force cleaning up drag preview...');

		// 移除预览元素
		if (this.dragPreviewElement) {
			try {
				if (this.dragPreviewElement.parentNode) {
					this.dragPreviewElement.parentNode.removeChild(this.dragPreviewElement);
				}
			} catch (error) {
				console.warn('Error removing drag preview element:', error);
			}
			this.dragPreviewElement = null;
		}

		// 清理旧的动态函数（向后兼容）
		this.cleanupDragPreview = () => {};

		console.log('Drag preview cleanup complete');
	}

	// 清理拖拽预览的函数（会被动态赋值，保持向后兼容）
	private cleanupDragPreview = () => {
		this.forceCleanupDragPreview();
	};

	// 显示拖拽提示
	private showDragHint(isCtrlPressed: boolean) {
		const hint = document.createElement('div');
		hint.className = 'drag-hint';
		hint.textContent = isCtrlPressed ? '移动到Canvas（删除原卡片）' : '复制到Canvas（保持原卡片）';
		hint.style.cssText = `
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			padding: 8px 16px;
			font-size: 12px;
			color: var(--text-normal);
			z-index: 10001;
			box-shadow: 0 2px 8px rgba(0,0,0,0.15);
		`;

		document.body.appendChild(hint);

		// 保存引用以便清理
		this.dragHintElement = hint;
	}

	// 隐藏拖拽提示
	private hideDragHint() {
		if (this.dragHintElement) {
			this.dragHintElement.remove();
			this.dragHintElement = null;
		}
	}

	// 拖拽提示元素
	private dragHintElement: HTMLElement | null = null;

	// 查找鼠标位置下的Canvas视图
	private findCanvasViewUnderCursor(e: MouseEvent): any {
		console.log('🔍 Finding Canvas view under cursor at:', e.clientX, e.clientY);

		// 临时隐藏拖拽预览，避免阻挡检测
		const originalDisplay = this.dragPreviewElement?.style.display;
		if (this.dragPreviewElement) {
			this.dragPreviewElement.style.display = 'none';
		}

		const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
		console.log('🎯 Element under cursor:', elementUnderCursor);

		// 恢复拖拽预览
		if (this.dragPreviewElement && originalDisplay !== undefined) {
			this.dragPreviewElement.style.display = originalDisplay;
		}

		if (!elementUnderCursor) {
			console.log('❌ No element found under cursor');
			return null;
		}

		// 尝试多种Canvas容器选择器
		const canvasSelectors = [
			'.workspace-leaf-content[data-type="canvas"]',
			'[data-type="canvas"]',
			'.canvas-wrapper',
			'.canvas-container',
			'.view-content[data-type="canvas"]'
		];

		let canvasContainer = null;
		for (const selector of canvasSelectors) {
			canvasContainer = elementUnderCursor.closest(selector);
			if (canvasContainer) {
				console.log('✅ Found Canvas container with selector:', selector, canvasContainer);
				break;
			}
		}

		if (!canvasContainer) {
			console.log('❌ No Canvas container found. Element classes:', elementUnderCursor.className);
			console.log('❌ Element parents:', this.getElementPath(elementUnderCursor));
			return null;
		}

		// 获取所有Canvas视图
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
		console.log('📋 Available Canvas leaves:', canvasLeaves.length);

		// 查找匹配的Canvas视图实例
		const leaf = canvasLeaves.find(leaf => {
			const containerEl = leaf.view?.containerEl;
			if (containerEl && containerEl.contains(canvasContainer)) {
				console.log('✅ Found matching Canvas leaf:', leaf);
				return true;
			}
			return false;
		});

		if (!leaf) {
			console.log('❌ No matching Canvas leaf found');
			return null;
		}

		console.log('🎉 Successfully found Canvas view:', leaf.view);
		return leaf.view;
	}

	// 获取元素路径用于调试
	private getElementPath(element: Element): string {
		const path = [];
		let current = element;
		for (let i = 0; i < 5 && current; i++) {
			const tag = current.tagName.toLowerCase();
			const className = current.className ? `.${current.className.split(' ').join('.')}` : '';
			const id = current.id ? `#${current.id}` : '';
			path.push(`${tag}${id}${className}`);
			current = current.parentElement as Element;
		}
		return path.join(' > ');
	}

	// 处理拖拽到Canvas的操作
	private async handleDropToCanvas(node: CanvasNode, e: MouseEvent, canvasView: any) {
		try {
			console.log('Dropping card to Canvas:', node);

			// 获取Canvas坐标并进行校准
			const rawCoords = this.getCanvasCoordinates(e, canvasView);
			const canvasCoords = this.calibrateCanvasCoordinates(rawCoords, canvasView);

			// 显示坐标调试信息（开发模式）
			this.showCoordinateDebugInfo(e, canvasView, canvasCoords);

			// 创建新节点数据
			const newNode = this.createCanvasNodeFromGridCard(node, canvasCoords);

			// 添加到Canvas
			await this.addNodeToCanvas(newNode, canvasView);

			// 根据是否按住Ctrl决定是复制还是移动
			if (e.ctrlKey) {
				// Ctrl+拖拽：移动（删除原卡片）
				await this.removeNodeFromGrid(node.id);
				new Notice('卡片已移动到Canvas');
			} else {
				// 长按拖拽：复制（保持原卡片）
				new Notice('卡片已复制到Canvas');
			}

		} catch (error) {
			console.error('Failed to drop card to Canvas:', error);
			new Notice('拖拽到Canvas失败');
		}
	}

	// 获取Canvas坐标 - 改进版本，支持多种坐标转换方法
	private getCanvasCoordinates(e: MouseEvent, canvasView: any): { x: number, y: number } {
		console.log('🎯 Converting mouse coordinates to Canvas coordinates...');
		console.log('Mouse position:', { x: e.clientX, y: e.clientY });

		// 尝试多种Canvas容器选择器
		const containerSelectors = [
			'.canvas-wrapper',
			'.canvas-container',
			'.canvas-viewport',
			'.view-content'
		];

		let canvasContainer = null;
		for (const selector of containerSelectors) {
			canvasContainer = canvasView.containerEl.querySelector(selector);
			if (canvasContainer) {
				console.log('✅ Found Canvas container with selector:', selector);
				break;
			}
		}

		if (!canvasContainer) {
			console.log('❌ No Canvas container found, using containerEl directly');
			canvasContainer = canvasView.containerEl;
		}

		const rect = canvasContainer.getBoundingClientRect();
		console.log('Canvas container rect:', {
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height
		});

		// 计算相对于容器的坐标
		const relativeX = e.clientX - rect.left;
		const relativeY = e.clientY - rect.top;
		console.log('Relative coordinates:', { x: relativeX, y: relativeY });

		// 获取Canvas变换信息
		const canvas = canvasView.canvas;
		console.log('Canvas transform info:', {
			tx: canvas?.tx,
			ty: canvas?.ty,
			tZoom: canvas?.tZoom
		});

		// 转换为Canvas坐标系（考虑缩放和平移）
		if (canvas && canvas.tx !== undefined && canvas.ty !== undefined && canvas.tZoom !== undefined) {
			// 标准Canvas坐标转换公式
			// 屏幕坐标 -> Canvas坐标: (screen - translate) / zoom
			const canvasX = (relativeX - canvas.tx) / canvas.tZoom;
			const canvasY = (relativeY - canvas.ty) / canvas.tZoom;

			console.log('✅ Canvas coordinates calculated:', { x: canvasX, y: canvasY });

			// 添加偏移补正（根据实际测试调整）
			const adjustedX = canvasX - 10; // 向左偏移10px补正
			const adjustedY = canvasY - 10; // 向上偏移10px补正

			console.log('🔧 Adjusted coordinates:', { x: adjustedX, y: adjustedY });
			return { x: adjustedX, y: adjustedY };
		}

		// 如果没有变换信息，尝试使用更精确的方法
		console.log('⚠️ No transform info, trying alternative method...');

		// 尝试获取Canvas的实际渲染区域
		const canvasElement = canvasContainer.querySelector('canvas');
		if (canvasElement) {
			const canvasRect = canvasElement.getBoundingClientRect();
			const canvasRelativeX = e.clientX - canvasRect.left;
			const canvasRelativeY = e.clientY - canvasRect.top;

			console.log('Canvas element coordinates:', { x: canvasRelativeX, y: canvasRelativeY });
			return { x: canvasRelativeX, y: canvasRelativeY };
		}

		console.log('📍 Using relative coordinates as final fallback:', { x: relativeX, y: relativeY });
		return { x: relativeX, y: relativeY };
	}

	// 坐标校准方法 - 根据Canvas状态进行精确校准
	private calibrateCanvasCoordinates(coords: { x: number, y: number }, canvasView: any): { x: number, y: number } {
		const canvas = canvasView.canvas;

		// 基础偏移校准
		let offsetX = 0;
		let offsetY = 0;

		// 根据缩放级别调整偏移
		if (canvas?.tZoom) {
			if (canvas.tZoom < 0.5) {
				// 缩小状态下的偏移校准
				offsetX = -20;
				offsetY = -20;
			} else if (canvas.tZoom > 1.5) {
				// 放大状态下的偏移校准
				offsetX = -5;
				offsetY = -5;
			} else {
				// 正常缩放下的偏移校准
				offsetX = -10;
				offsetY = -10;
			}
		}

		// 动态检测Canvas工具栏和边距
		const toolbarElement = canvasView.containerEl.querySelector('.canvas-controls');
		const toolbarHeight = toolbarElement ? toolbarElement.offsetHeight : 0;

		// 检测是否有侧边栏影响
		const sidebarWidth = 0; // 通常Canvas没有左侧边栏

		const calibratedX = coords.x + offsetX - sidebarWidth;
		const calibratedY = coords.y + offsetY - toolbarHeight;

		console.log('🎯 Coordinate calibration:', {
			original: coords,
			offset: { x: offsetX, y: offsetY },
			toolbar: toolbarHeight,
			calibrated: { x: calibratedX, y: calibratedY }
		});

		return { x: calibratedX, y: calibratedY };
	}

	// 实时坐标测试 - 在Canvas上显示坐标信息（调试用）
	private showCoordinateDebugInfo(e: MouseEvent, canvasView: any, coords: { x: number, y: number }) {
		// 创建调试信息元素
		let debugElement = document.getElementById('canvas-coord-debug');
		if (!debugElement) {
			debugElement = document.createElement('div');
			debugElement.id = 'canvas-coord-debug';
			debugElement.style.cssText = `
				position: fixed;
				top: 10px;
				right: 10px;
				background: rgba(0, 0, 0, 0.8);
				color: white;
				padding: 10px;
				border-radius: 5px;
				font-family: monospace;
				font-size: 12px;
				z-index: 10001;
				pointer-events: none;
			`;
			document.body.appendChild(debugElement);
		}

		// 更新调试信息
		const canvas = canvasView.canvas;
		debugElement.innerHTML = `
			<div><strong>坐标调试信息</strong></div>
			<div>鼠标位置: ${e.clientX}, ${e.clientY}</div>
			<div>Canvas坐标: ${coords.x.toFixed(1)}, ${coords.y.toFixed(1)}</div>
			<div>缩放: ${canvas?.tZoom?.toFixed(2) || 'N/A'}</div>
			<div>平移: ${canvas?.tx?.toFixed(1) || 'N/A'}, ${canvas?.ty?.toFixed(1) || 'N/A'}</div>
		`;

		// 3秒后自动移除
		setTimeout(() => {
			if (debugElement && debugElement.parentNode) {
				debugElement.parentNode.removeChild(debugElement);
			}
		}, 3000);
	}

	// 从网格卡片创建Canvas节点
	private createCanvasNodeFromGridCard(gridNode: CanvasNode, coords: { x: number, y: number }): CanvasNode {
		const timestamp = Date.now();

		return {
			...gridNode,
			id: `node-${timestamp}-from-grid`,
			x: coords.x,
			y: coords.y,
			// 保持原有的宽高，或使用默认值
			width: gridNode.width || 250,
			height: gridNode.height || 100
		};
	}

	// 添加节点到Canvas
	private async addNodeToCanvas(node: CanvasNode, canvasView: any) {
		if (!canvasView.canvas || !canvasView.file) {
			throw new Error('Canvas view not available');
		}

		// 读取Canvas文件内容
		const content = await this.app.vault.read(canvasView.file);
		const canvasData = JSON.parse(content);

		// 添加新节点
		canvasData.nodes.push(node);

		// 保存Canvas文件
		await this.app.vault.modify(canvasView.file, JSON.stringify(canvasData, null, 2));

		// 刷新Canvas视图
		if (canvasView.canvas.requestSave) {
			canvasView.canvas.requestSave();
		}
	}

	// 从网格中移除节点
	private async removeNodeFromGrid(nodeId: string) {
		if (!this.canvasData || !this.linkedCanvasFile) return;

		console.log(`🗑️ Removing node from grid: ${nodeId}`);

		// 从数据中移除节点
		this.canvasData.nodes = this.canvasData.nodes.filter(node => node.id !== nodeId);

		// 保存到文件
		await this.saveCanvasData();

		// 如果在分组视图中，需要特殊处理
		if (this.currentGroupView) {
			// 重新分析分组以更新成员列表
			this.analyzeGroups();

			// 检查当前分组是否还存在成员
			const groupInfo = this.groupAnalysis.get(this.currentGroupView);
			if (!groupInfo || groupInfo.members.length === 0) {
				// 如果分组为空，返回主视图
				console.log('📤 Group is empty, returning to main view');
				this.exitGroupView();
				new Notice('分组已空，已返回主视图');
				return;
			} else {
				// 更新分组视图的筛选节点
				this.filteredNodes = groupInfo.members;
				console.log(`📊 Group view updated, ${groupInfo.members.length} members remaining`);
			}
		}

		// 刷新网格视图
		this.renderGrid();

		console.log('✅ Node removed and view refreshed');
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
	private isInEditor(element: HTMLElement | null): boolean {
		if (!element || typeof element.closest !== 'function') {
			return false;
		}

		try {
			return element.closest('.cm-editor') !== null ||
				   element.closest('.markdown-source-view') !== null ||
				   element.closest('.markdown-preview-view') !== null;
		} catch (error) {
			console.error('Error checking if element is in editor:', error);
			return false;
		}
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

	// 获取源文件信息（用于创建回链）
	private getSourceFileInfo(): { file: TFile | null; path: string; position: { line: number; ch: number; selection?: any } | null; context: string } {
		try {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				return { file: null, path: '', position: null, context: '' };
			}

			const file = activeView.file;
			const editor = activeView.editor;

			// 获取选中文本的位置信息
			const selections = editor.listSelections();
			const cursor = editor.getCursor();

			// 获取上下文（当前行的内容）
			const currentLine = editor.getLine(cursor.line);

			// 确定位置信息
			let position = {
				line: cursor.line,
				ch: cursor.ch,
				selection: selections.length > 0 ? selections[0] : null
			};

			// 如果有选中文本，使用选中文本的起始位置
			if (selections.length > 0 && selections[0]) {
				position.line = selections[0].anchor.line;
				position.ch = selections[0].anchor.ch;
			}

			return {
				file: file,
				path: file ? file.path : '',
				position: position,
				context: currentLine
			};
		} catch (error) {
			console.error('Failed to get source file info:', error);
			return { file: null, path: '', position: null, context: '' };
		}
	}



	// 处理编辑器拖拽开始
	private handleEditorDragStart(e: DragEvent, selectedText: string) {
		if (!e.dataTransfer) return;

		console.log('Drag started from editor:', selectedText);

		// 获取源文件信息
		const sourceInfo = this.getSourceFileInfo();

		// 设置拖拽数据
		e.dataTransfer.setData('text/plain', selectedText);
		e.dataTransfer.setData('application/obsidian-text', selectedText);
		e.dataTransfer.effectAllowed = 'copy';

		// 保存拖拽状态（包含回链信息）
		this.isDragging = true;
		this.dragData = {
			text: selectedText,
			source: 'editor',
			timestamp: Date.now(),
			sourceFile: sourceInfo.file,
			sourcePath: sourceInfo.path,
			sourcePosition: sourceInfo.position,
			sourceContext: sourceInfo.context
		};

		console.log('Drag data with backlink info:', this.dragData);

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
		const cols = Math.floor(this.gridContainer.clientWidth / (CARD_CONSTANTS.width + CARD_CONSTANTS.spacing));
		const col = Math.floor(x / (CARD_CONSTANTS.width + CARD_CONSTANTS.spacing));
		const row = Math.floor(y / (CARD_CONSTANTS.height + CARD_CONSTANTS.spacing));

		// 设置指示器位置和大小
		this.dropIndicator.style.left = `${col * (CARD_CONSTANTS.width + CARD_CONSTANTS.spacing)}px`;
		this.dropIndicator.style.top = `${row * (CARD_CONSTANTS.height + CARD_CONSTANTS.spacing)}px`;
		this.dropIndicator.style.width = `${CARD_CONSTANTS.width}px`;
		this.dropIndicator.style.height = `${CARD_CONSTANTS.height}px`;
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

				// 注意：不需要手动添加节点到canvasData，因为createNodeFromText已经处理了

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

			// 重置拖拽状态（移到成功处理后）
			this.resetDragState();

		} catch (error) {
			console.error('拖拽创建卡片失败:', error);
			new Notice('创建卡片失败，请重试');
			// 确保重新启用文件监听
			this.enableFileWatcher();
			// 错误情况下也要重置拖拽状态
			this.resetDragState();
		}
	}

	// 从文本创建Canvas节点
	private async createNodeFromText(text: string, dropEvent: DragEvent): Promise<CanvasNode | null> {
		try {
			// 分析文本内容类型（异步）
			const contentType = await this.analyzeTextContent(text);

			// 智能判断拖拽目标
			const dropTarget = this.analyzeDropTarget(dropEvent);

			let newNode: CanvasNode;

			if (dropTarget.type === 'existing-group') {
				// 场景1&2：添加到现有分组
				newNode = await this.addToExistingGroup(dropTarget.groupId!, contentType, dropTarget.position);
				console.log('Added to existing group:', dropTarget.groupId);
			} else {
				// 场景3：创建新分组
				const { groupNode, contentNode } = this.createGroupedNodes(text, contentType, dropTarget.position);

				// 添加到Canvas数据
				if (!this.canvasData) {
					this.canvasData = { nodes: [], edges: [] };
				}

				this.canvasData.nodes.push(groupNode);
				this.canvasData.nodes.push(contentNode);
				newNode = contentNode;
				console.log('Created new group with content');
			}

			// 保存到Canvas文件
			await this.saveCanvasData();

			return newNode;

		} catch (error) {
			console.error('创建节点失败:', error);
			return null;
		}
	}

	// 分析文本内容类型（异步版本）
	private async analyzeTextContent(text: string): Promise<ContentAnalysis> {
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

		// 默认为文本节点，添加回链（异步）
		const textWithBacklink = await this.addBacklinkToText(trimmedText);
		const lines = textWithBacklink.split('\n').length;
		const estimatedWidth = Math.min(400, Math.max(200, textWithBacklink.length * 8));
		const estimatedHeight = Math.min(300, Math.max(100, lines * 25 + 40));

		return {
			type: 'text',
			content: { text: textWithBacklink },
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

	// 分析拖拽目标
	private analyzeDropTarget(dropEvent: DragEvent): DropTargetAnalysis {
		// 场景1：当前在分组视图中（二级界面）
		if (this.currentGroupView) {
			console.log('Drop in group view:', this.currentGroupView);
			return {
				type: 'existing-group',
				groupId: this.currentGroupView,
				position: this.calculatePositionInGroup(this.currentGroupView, dropEvent)
			};
		}

		// 场景2：在主界面，检查是否拖拽到分组卡片上
		const targetGroupId = this.findGroupUnderCursor(dropEvent);
		if (targetGroupId) {
			console.log('Drop on group card:', targetGroupId);
			return {
				type: 'existing-group',
				groupId: targetGroupId,
				position: this.calculatePositionInGroup(targetGroupId, dropEvent)
			};
		}

		// 场景3：在主界面空白区域，创建新分组
		console.log('Drop in empty area, creating new group');
		return {
			type: 'new-group',
			position: this.calculateDropPosition(dropEvent)
		};
	}

	// 查找鼠标下的分组
	private findGroupUnderCursor(dropEvent: DragEvent): string | null {
		const rect = this.gridContainer.getBoundingClientRect();
		const x = dropEvent.clientX - rect.left;
		const y = dropEvent.clientY - rect.top;

		// 查找鼠标位置下的分组卡片
		const elementUnderCursor = document.elementFromPoint(dropEvent.clientX, dropEvent.clientY);
		if (elementUnderCursor) {
			const groupCard = elementUnderCursor.closest('[data-node-type="group"]') as HTMLElement;
			if (groupCard) {
				return groupCard.dataset.nodeId || null;
			}
		}

		return null;
	}

	// 计算在分组内的位置
	private calculatePositionInGroup(groupId: string, dropEvent: DragEvent): { x: number, y: number } {
		if (!this.canvasData) {
			return { x: 100, y: 100 };
		}

		// 找到目标分组
		const groupNode = this.canvasData.nodes.find(n => n.id === groupId && n.type === 'group');
		if (!groupNode) {
			return { x: 100, y: 100 };
		}

		// 找到分组内现有的节点
		const groupMembers = this.canvasData.nodes.filter(n =>
			n.type !== 'group' &&
			n.x >= groupNode.x &&
			n.y >= groupNode.y &&
			n.x + n.width <= groupNode.x + groupNode.width &&
			n.y + n.height <= groupNode.y + groupNode.height
		);

		// 计算新节点在分组内的位置
		const padding = 20;
		if (groupMembers.length === 0) {
			// 分组内没有其他节点，放在左上角
			return {
				x: groupNode.x + padding,
				y: groupNode.y + padding + 30 // 为分组标题留空间
			};
		}

		// 找到分组内最右下角的位置
		const maxX = Math.max(...groupMembers.map(n => n.x + n.width));
		const maxY = Math.max(...groupMembers.map(n => n.y + n.height));

		// 尝试在右侧放置
		const newX = maxX + padding;
		if (newX + 300 <= groupNode.x + groupNode.width - padding) {
			return { x: newX, y: groupMembers[0].y };
		}

		// 右侧空间不够，换行
		return {
			x: groupNode.x + padding,
			y: maxY + padding
		};
	}

	// 添加到现有分组
	private async addToExistingGroup(groupId: string, contentType: ContentAnalysis, position: { x: number, y: number }): Promise<CanvasNode> {
		const timestamp = Date.now();
		const contentId = `node-${timestamp}-content`;

		// 创建内容节点
		const contentNode: CanvasNode = {
			id: contentId,
			type: contentType.type,
			x: position.x,
			y: position.y,
			width: contentType.width,
			height: contentType.height,
			...contentType.content
		};

		// 添加到Canvas数据
		if (!this.canvasData) {
			this.canvasData = { nodes: [], edges: [] };
		}
		this.canvasData.nodes.push(contentNode);

		// 可能需要扩展分组大小以容纳新内容
		this.expandGroupIfNeeded(groupId, contentNode);

		// 更新分组分析数据
		this.updateGroupAnalysisAfterAdd(groupId, contentNode);

		// 如果当前在分组视图中，立即刷新显示
		if (this.currentGroupView === groupId) {
			this.refreshGroupView(groupId);
		}

		return contentNode;
	}

	// 扩展分组大小以容纳新内容
	private expandGroupIfNeeded(groupId: string, newNode: CanvasNode): void {
		if (!this.canvasData) return;

		const groupNode = this.canvasData.nodes.find(n => n.id === groupId && n.type === 'group');
		if (!groupNode) return;

		const padding = 20;
		const requiredWidth = (newNode.x + newNode.width) - groupNode.x + padding;
		const requiredHeight = (newNode.y + newNode.height) - groupNode.y + padding;

		// 扩展分组尺寸
		if (requiredWidth > groupNode.width) {
			groupNode.width = requiredWidth;
		}
		if (requiredHeight > groupNode.height) {
			groupNode.height = requiredHeight;
		}
	}

	// 更新分组分析数据（添加新节点后）
	private updateGroupAnalysisAfterAdd(groupId: string, newNode: CanvasNode): void {
		const groupInfo = this.groupAnalysis.get(groupId);
		if (groupInfo) {
			// 添加新节点到分组成员列表
			groupInfo.members.push(newNode);
			groupInfo.memberCount = groupInfo.members.length;

			// 更新分组边界
			this.updateGroupBounds(groupInfo);

			console.log(`Updated group ${groupId} analysis, new member count: ${groupInfo.memberCount}`);
		} else {
			// 如果分组信息不存在，重新分析所有分组
			console.log(`Group ${groupId} not found in analysis, re-analyzing all groups`);
			this.analyzeGroups();
		}
	}

	// 更新分组边界
	private updateGroupBounds(groupInfo: GroupInfo): void {
		if (groupInfo.members.length === 0) return;

		const allNodes = [groupInfo.group, ...groupInfo.members];
		const minX = Math.min(...allNodes.map(n => n.x));
		const minY = Math.min(...allNodes.map(n => n.y));
		const maxX = Math.max(...allNodes.map(n => n.x + n.width));
		const maxY = Math.max(...allNodes.map(n => n.y + n.height));

		groupInfo.bounds = { minX, minY, maxX, maxY };
	}

	// 刷新分组视图
	private refreshGroupView(groupId: string): void {
		console.log(`Refreshing group view for: ${groupId}`);

		// 重新分析分组以获取最新数据
		this.analyzeGroups();

		// 获取更新后的分组信息
		const groupInfo = this.groupAnalysis.get(groupId);
		if (!groupInfo) {
			console.error(`Group ${groupId} not found after analysis`);
			return;
		}

		// 更新筛选节点列表
		this.filteredNodes = [...groupInfo.members];

		// 重新渲染分组成员
		this.renderGroupMembers();

		console.log(`Group view refreshed, showing ${groupInfo.members.length} members`);
	}

	// 创建分组和内容节点
	private createGroupedNodes(text: string, contentType: ContentAnalysis, position: { x: number, y: number }): { groupNode: CanvasNode, contentNode: CanvasNode } {
		const timestamp = Date.now();
		const groupId = `group-${timestamp}`;
		const contentId = `node-${timestamp}-content`;

		// 计算分组尺寸（比内容节点稍大一些）
		const groupPadding = 40;
		const groupWidth = contentType.width + groupPadding * 2;
		const groupHeight = contentType.height + groupPadding * 2 + 60; // 额外空间给分组标题

		// 创建分组节点
		const groupNode: CanvasNode = {
			id: groupId,
			type: 'group',
			x: position.x,
			y: position.y,
			width: groupWidth,
			height: groupHeight,
			label: '收集', // 分组标题
			color: '1' // 使用红色作为默认分组颜色
		};

		// 创建内容节点（位于分组内部）
		const contentNode: CanvasNode = {
			id: contentId,
			type: contentType.type,
			x: position.x + groupPadding,
			y: position.y + groupPadding + 30, // 为分组标题留出空间
			width: contentType.width,
			height: contentType.height,
			...contentType.content
		};

		return { groupNode, contentNode };
	}

	// 计算拖拽放置位置
	private calculateDropPosition(dropEvent: DragEvent): { x: number, y: number } {
		// 为新的分组内容找一个合适的位置
		if (this.canvasData && this.canvasData.nodes.length > 0) {
			// 找到所有现有节点的最右下角位置
			const maxX = Math.max(...this.canvasData.nodes.map(n => n.x + n.width));
			const maxY = Math.max(...this.canvasData.nodes.map(n => n.y + n.height));

			// 计算新分组的位置，确保不重叠
			const groupSpacing = 50; // 分组之间的间距

			// 优先在右侧放置，如果空间不够则换行
			const newX = maxX + groupSpacing;
			const newY = 100; // 从顶部开始

			// 检查是否有足够的水平空间（假设Canvas视图宽度约为1200px）
			const estimatedCanvasWidth = 1200;
			const groupWidth = CARD_CONSTANTS.width + 80; // 分组宽度

			if (newX + groupWidth > estimatedCanvasWidth) {
				// 空间不够，换到下一行
				return {
					x: 100, // 从左边开始
					y: maxY + groupSpacing
				};
			}

			return { x: newX, y: newY };
		}

		// 如果没有现有节点，从左上角开始
		return { x: 100, y: 100 };
	}

	// 生成唯一节点ID
	private generateNodeId(): string {
		return 'node-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
	}

	// 生成唯一的块引用ID
	private generateBlockId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substr(2, 6);
		return `canvas-${timestamp}-${random}`;
	}

	// 🔧 修复：创建 dragData 的安全快照，避免竞态条件
	private createDragDataSnapshot(): {
		sourceFile: TFile;
		sourcePosition: { line: number; ch: number };
		sourcePath: string;
		sourceContext: string;
	} | null {
		try {
			if (!this.dragData) {
				console.log('No dragData to snapshot');
				return null;
			}

			if (!this.dragData.sourceFile) {
				console.log('No sourceFile in dragData');
				return null;
			}

			if (!this.dragData.sourcePosition) {
				console.log('No sourcePosition in dragData');
				return null;
			}

			// 创建深拷贝快照
			const snapshot = {
				sourceFile: this.dragData.sourceFile,
				sourcePosition: {
					line: this.dragData.sourcePosition.line,
					ch: this.dragData.sourcePosition.ch
				},
				sourcePath: this.dragData.sourcePath || '',
				sourceContext: this.dragData.sourceContext || ''
			};

			console.log('✅ Created dragData snapshot:', snapshot);
			return snapshot;

		} catch (error) {
			console.error('Failed to create dragData snapshot:', error);
			return null;
		}
	}

	// 在源文件中插入块引用（修复版本：添加文件锁保护）
	private async insertBlockReference(file: TFile, position: { line: number; ch: number }, blockId: string): Promise<boolean> {
		const filePath = file.path;

		try {
			console.log('=== Inserting Block Reference (Protected) ===');
			console.log('File:', filePath);
			console.log('Position:', position);
			console.log('Block ID:', blockId);

			// 🔧 修复：检查文件是否正在被修改
			if (this.fileModificationLocks.has(filePath)) {
				console.log('❌ File is currently being modified, skipping');
				new Notice('源文件正在被修改，请稍后重试');
				return false;
			}

			// 🔧 修复：添加文件锁
			this.fileModificationLocks.add(filePath);

			// 🔧 修复：添加输入验证
			if (!file || !position || typeof position.line !== 'number') {
				console.error('Invalid input parameters');
				return false;
			}

			const content = await this.app.vault.read(file);
			const lines = content.split('\n');

			// 检查行是否存在
			if (position.line < 0 || position.line >= lines.length) {
				console.error('Line number out of range:', position.line, 'max:', lines.length - 1);
				return false;
			}

			const targetLine = lines[position.line];

			// 🔧 修复：改进块引用检测逻辑
			if (this.hasExistingBlockReference(targetLine)) {
				console.log('Line already has block reference, skipping');
				return false;
			}

			// 在行末添加块引用
			lines[position.line] = `${targetLine} ^${blockId}`;

			// 写回文件
			const newContent = lines.join('\n');
			await this.app.vault.modify(file, newContent);

			console.log('✅ Block reference inserted successfully');
			new Notice('已在源文件中添加块引用');
			return true;

		} catch (error) {
			console.error('Failed to insert block reference:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			new Notice('插入块引用失败：' + errorMessage);
			return false;
		} finally {
			// 🔧 修复：确保总是释放文件锁
			this.fileModificationLocks.delete(filePath);
			console.log('Released file lock for:', filePath);
		}
	}

	// 🔧 修复：改进的块引用检测方法
	private hasExistingBlockReference(line: string): boolean {
		if (!line || typeof line !== 'string') {
			return false;
		}

		// 使用正则表达式精确匹配块引用格式
		// 匹配格式：空格 + ^ + 字母数字字符
		const blockRefPattern = /\s\^[a-zA-Z0-9\-_]+$/;

		return blockRefPattern.test(line);
	}

	// 🔧 修复：用户确认机制
	private async confirmBlockReferenceInsertion(file: TFile): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new Modal(this.app);
			modal.titleEl.setText('确认修改源文件');

			const content = modal.contentEl;
			content.empty();

			// 说明文本
			content.createEl('p', {
				text: '为了创建精确的回链，需要在源文件中添加块引用标记。'
			});

			content.createEl('p', {
				text: `文件：${file.basename}`,
				cls: 'canvas-grid-file-info'
			});

			content.createEl('p', {
				text: '这将在拖拽的文本行末尾添加一个块引用ID（如：^canvas-123456）',
				cls: 'canvas-grid-detail-info'
			});

			// 按钮容器
			const buttonContainer = content.createDiv('canvas-grid-confirm-buttons');
			buttonContainer.style.cssText = `
				display: flex;
				gap: 10px;
				margin-top: 20px;
				justify-content: center;
			`;

			// 确认按钮
			const confirmButton = buttonContainer.createEl('button', { text: '确认修改' });
			confirmButton.style.cssText = `
				background-color: var(--interactive-accent);
				color: var(--text-on-accent);
				border: none;
				padding: 8px 16px;
				border-radius: 4px;
				cursor: pointer;
			`;
			confirmButton.onclick = () => {
				modal.close();
				resolve(true);
			};

			// 取消按钮
			const cancelButton = buttonContainer.createEl('button', { text: '取消（使用行号）' });
			cancelButton.style.cssText = `
				background-color: var(--background-modifier-border);
				color: var(--text-normal);
				border: none;
				padding: 8px 16px;
				border-radius: 4px;
				cursor: pointer;
			`;
			cancelButton.onclick = () => {
				modal.close();
				resolve(false);
			};

			// 设置默认焦点
			confirmButton.focus();

			modal.open();
		});
	}

	// 在文本中添加回链（修复版本：解决竞态条件）
	private async addBacklinkToText(originalText: string): Promise<string> {
		console.log('=== addBacklinkToText called (Fixed Version) ===');
		console.log('Original text:', originalText);
		console.log('Drag data:', this.dragData);

		// 🔧 修复：立即创建 dragData 的快照，避免竞态条件
		const dragDataSnapshot = this.createDragDataSnapshot();

		if (!dragDataSnapshot) {
			console.log('❌ No valid dragData snapshot available');
			return originalText;
		}

		try {
			// 生成块引用ID
			const blockId = this.generateBlockId();
			console.log('Generated block ID:', blockId);

			// 🔧 修复：添加用户确认机制
			const userConfirmed = await this.confirmBlockReferenceInsertion(dragDataSnapshot.sourceFile);
			if (!userConfirmed) {
				console.log('User declined block reference insertion, using fallback');
				// 用户拒绝修改源文件，使用行号作为后备方案
				const sourceFileName = dragDataSnapshot.sourceFile.basename;
				const lineNumber = dragDataSnapshot.sourcePosition.line + 1;
				const backlink = `[[${sourceFileName}#^L${lineNumber}]]`;
				return `${originalText}\n\n---\n来源：${backlink}`;
			}

			// 在源文件中插入块引用（使用快照数据）
			const insertSuccess = await this.insertBlockReference(
				dragDataSnapshot.sourceFile,
				dragDataSnapshot.sourcePosition,
				blockId
			);

			if (!insertSuccess) {
				console.log('❌ Failed to insert block reference, using fallback');
				// 如果插入失败，使用行号作为后备方案（使用快照数据）
				const sourceFileName = dragDataSnapshot.sourceFile.basename;
				const lineNumber = dragDataSnapshot.sourcePosition.line + 1;
				const backlink = `[[${sourceFileName}#^L${lineNumber}]]`;
				return `${originalText}\n\n---\n来源：${backlink}`;
			}

			// 创建块引用链接（使用快照数据）
			const sourceFileName = dragDataSnapshot.sourceFile.basename;
			const backlink = `[[${sourceFileName}#^${blockId}]]`;

			// 在原文本后添加回链，使用分隔符
			const textWithBacklink = `${originalText}\n\n---\n来源：${backlink}`;

			console.log('✅ Successfully added block reference backlink:', backlink);
			console.log('Final text with backlink:', textWithBacklink);
			return textWithBacklink;

		} catch (error) {
			console.error('Error in addBacklinkToText:', error);
			new Notice('创建回链时发生错误，已使用原始文本');
			// 出错时返回原文本
			return originalText;
		}
	}

	// 检查节点是否包含回链（支持块引用和行号格式）
	private hasBacklink(node: CanvasNode): boolean {
		if (node.type !== 'text' || !node.text) {
			return false;
		}
		// 检测双链格式：
		// 1. 块引用格式：---\n来源：[[文件名#^block-id]]
		// 2. 行号格式：---\n来源：[[文件名#^L行号]]
		return /---\n来源：\[\[.*#\^(canvas-\d+-\w+|L\d+)\]\]/.test(node.text);
	}

	// 从节点回链跳转到源位置（支持块引用）
	private async navigateToBacklink(node: CanvasNode): Promise<void> {
		if (node.type !== 'text' || !node.text) {
			new Notice('节点不包含文本内容');
			return;
		}

		try {
			console.log('=== Navigating to Backlink ===');
			console.log('Node text:', node.text);

			// 从文本中提取回链信息，支持两种格式：
			// 1. 块引用格式：[[文件名#^canvas-timestamp-random]]
			// 2. 行号格式：[[文件名#^L行号]]
			const backlinkMatch = node.text.match(/来源：\[\[(.*)#\^(canvas-\d+-\w+|L\d+)\]\]/);
			if (!backlinkMatch) {
				new Notice('未找到有效的回链信息');
				return;
			}

			const fileName = backlinkMatch[1];
			const reference = backlinkMatch[2];

			console.log('Parsed backlink:', fileName, 'reference:', reference);

			// 查找文件
			const files = this.app.vault.getMarkdownFiles();
			const sourceFile = files.find(f => f.basename === fileName);

			if (!sourceFile) {
				new Notice(`源文件不存在: ${fileName}`);
				return;
			}

			// 根据引用类型进行不同的处理
			if (reference.startsWith('canvas-')) {
				// 块引用格式：跳转到块引用
				await this.openFileAndNavigateToBlock(sourceFile, reference);
			} else if (reference.startsWith('L')) {
				// 行号格式：跳转到行号
				const lineNumber = parseInt(reference.substring(1)) - 1; // 转换为0基索引
				await this.openFileAndNavigate(sourceFile, lineNumber);
			} else {
				new Notice('不支持的回链格式');
			}

		} catch (error) {
			console.error('Failed to navigate to backlink:', error);
			new Notice('跳转到源文件失败');
		}
	}

	// 打开文件并导航到指定位置
	private async openFileAndNavigate(file: TFile, lineNumber: number): Promise<void> {
		try {
			// 打开源文件
			const leaf = this.app.workspace.getUnpinnedLeaf();
			await leaf.openFile(file);

			// 等待视图加载
			await new Promise(resolve => setTimeout(resolve, 100));

			// 获取编辑器并定位到指定位置
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView && activeView.editor) {
				const editor = activeView.editor;

				// 定位到指定行
				const targetPos = { line: lineNumber, ch: 0 };
				editor.setCursor(targetPos);

				// 滚动到可见区域
				editor.scrollIntoView({ from: targetPos, to: targetPos }, true);

				// 高亮显示整行
				const lineText = editor.getLine(lineNumber);
				const lineEnd = { line: lineNumber, ch: lineText.length };
				editor.setSelection(targetPos, lineEnd);

				// 3秒后取消选择
				setTimeout(() => {
					try {
						const cursor = editor.getCursor();
						editor.setCursor(cursor);
					} catch (e) {
						// 忽略错误
					}
				}, 3000);

				new Notice(`已跳转到源文件: ${file.basename} (第${lineNumber + 1}行)`);
				console.log('Successfully navigated to backlink position');
			} else {
				new Notice('无法获取编辑器视图');
			}
		} catch (error) {
			console.error('Failed to open file and navigate:', error);
			new Notice('打开文件失败');
		}
	}

	// 打开文件并导航到指定的块引用
	private async openFileAndNavigateToBlock(file: TFile, blockId: string): Promise<void> {
		try {
			console.log('=== Opening file and navigating to block ===');
			console.log('File:', file.path);
			console.log('Block ID:', blockId);

			// 打开源文件
			const leaf = this.app.workspace.getUnpinnedLeaf();
			await leaf.openFile(file);

			// 等待视图加载
			await new Promise(resolve => setTimeout(resolve, 100));

			// 获取编辑器并查找块引用
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView && activeView.editor) {
				const editor = activeView.editor;
				const content = editor.getValue();
				const lines = content.split('\n');

				// 查找包含块引用的行
				let targetLine = -1;
				for (let i = 0; i < lines.length; i++) {
					if (lines[i].includes(`^${blockId}`)) {
						targetLine = i;
						break;
					}
				}

				if (targetLine >= 0) {
					// 定位到找到的行
					const targetPos = { line: targetLine, ch: 0 };
					editor.setCursor(targetPos);

					// 滚动到可见区域
					editor.scrollIntoView({ from: targetPos, to: targetPos }, true);

					// 高亮显示整行
					const lineText = lines[targetLine];
					const lineEnd = { line: targetLine, ch: lineText.length };
					editor.setSelection(targetPos, lineEnd);

					// 3秒后取消选择
					setTimeout(() => {
						try {
							const cursor = editor.getCursor();
							editor.setCursor(cursor);
						} catch (e) {
							// 忽略错误
						}
					}, 3000);

					new Notice(`已跳转到块引用: ${file.basename}`);
					console.log('Successfully navigated to block reference');
				} else {
					new Notice(`未找到块引用: ^${blockId}`);
					console.log('Block reference not found:', blockId);
				}
			} else {
				new Notice('无法获取编辑器视图');
			}
		} catch (error) {
			console.error('Failed to open file and navigate to block:', error);
			new Notice('跳转到块引用失败');
		}
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
			console.log('Setting linked canvas file:', canvasFile.path);

			this.linkedCanvasFile = canvasFile;
			this.linkedTabManager.linkCanvasFile(canvasFile, this);

			// 显示加载状态
			this.showLoadingState();

			// 加载关联文件的数据
			await this.loadCanvasDataFromFile(canvasFile);

			// 确保数据加载完成后重新初始化搜索和筛选
			this.initializeSearchAndSort();

			// 更新UI显示
			this.updateLinkedCanvasDisplay(canvasFile);
			this.updateActionButtonsVisibility();

			// 强制重新渲染网格
			this.renderGrid();

			new Notice(`已关联Canvas文件: ${canvasFile.basename}`, 3000);
			console.log('Canvas file linked and data loaded:', canvasFile.path);
		} catch (error) {
			console.error('Failed to link canvas file:', error);
			new Notice('关联Canvas文件失败');
			this.showErrorState(error instanceof Error ? error.message : '未知错误');
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
				// 如果文件为空，创建空的Canvas数据
				console.log('Canvas file is empty, creating empty data structure');
				this.canvasData = { nodes: [], edges: [] };
				this.clearRenderCache(); // 清空渲染缓存
				this.renderGrid();
				return;
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

			// 更新Canvas数据
			this.canvasData = parsedData;

			// 清空渲染缓存，确保使用新数据重新渲染
			this.clearRenderCache();

			// 重置搜索和筛选状态
			this.filteredNodes = [...parsedData.nodes];
			this.searchQuery = '';
			if (this.searchInputEl) {
				this.searchInputEl.value = '';
			}
			this.activeColorFilter = null;

			// 调试：检查节点的颜色值
			console.log('Canvas数据加载成功，节点数量:', parsedData.nodes.length);
			parsedData.nodes.forEach(node => {
				if (node.color) {
					console.log('节点颜色值:', node.id, 'color:', node.color, 'type:', typeof node.color);
				}
			});

			// 强制重新渲染网格
			this.renderGrid();
			console.log('Canvas data loaded and rendered successfully from file:', file.path);
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
		try {
			if (this.linkedCanvasFile) {
				await this.loadCanvasDataFromFile(this.linkedCanvasFile);
				new Notice('Canvas数据已刷新', 2000);
			} else {
				await this.loadActiveCanvas();
			}

			// 数据刷新后，重新初始化搜索和排序
			this.initializeSearchAndSort();
			console.log('✅ Canvas data refreshed and sort reapplied');
		} catch (error) {
			console.error('Failed to refresh canvas data:', error);
			new Notice('刷新数据失败', 2000);
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
	settings!: CanvasGridSettings;
	private canvasViewButtons: Map<HTMLElement, HTMLElement> = new Map();

	async onload() {
		await this.loadSettings();

		// 初始化国际化
		i18n.setLanguage(this.settings.language);

		// 注册视图
		this.registerView(
			CANVAS_GRID_VIEW_TYPE,
			(leaf) => new CanvasGridView(leaf, this)
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

		// 添加命令：时间胶囊收集
		this.addCommand({
			id: 'time-capsule-collect',
			name: '时间胶囊收集内容',
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'c' }],
			callback: () => {
				this.collectToTimeCapsule();
			}
		});

		// 添加命令：切换时间胶囊
		this.addCommand({
			id: 'toggle-time-capsule',
			name: '切换时间胶囊状态',
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 't' }],
			callback: () => {
				this.toggleTimeCapsule();
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

		console.log('🎨 Canvasgrid Transit Plugin loaded - 热重载测试成功!');
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

	// ==================== 时间胶囊功能方法 ====================

	// 收集内容到时间胶囊
	collectToTimeCapsule() {
		const gridView = this.getActiveGridView();
		if (!gridView) {
			new Notice('请先打开Canvas网格视图');
			return;
		}

		// 检查时间胶囊是否激活
		if (!gridView.isTimeCapsuleActive()) {
			new Notice('时间胶囊未激活，请先启动时间胶囊');
			return;
		}

		// 获取当前选中的内容
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			const editor = activeView.editor;
			const selectedText = editor.getSelection();

			if (selectedText) {
				// 收集选中的文本
				gridView.collectToTimeCapsule(selectedText, {
					sourceFile: activeView.file,
					sourcePath: activeView.file?.path || '',
					sourcePosition: {
						line: editor.getCursor('from').line,
						ch: editor.getCursor('from').ch
					}
				});
				new Notice('内容已收集到时间胶囊');
			} else {
				new Notice('请先选择要收集的内容');
			}
		} else {
			// 尝试从剪贴板收集
			navigator.clipboard.readText().then(text => {
				if (text && text.trim()) {
					gridView.collectToTimeCapsule(text.trim(), {
						sourceFile: null,
						sourcePath: '剪贴板',
						sourcePosition: null
					});
					new Notice('剪贴板内容已收集到时间胶囊');
				} else {
					new Notice('剪贴板为空或无可收集内容');
				}
			}).catch(() => {
				new Notice('无法访问剪贴板');
			});
		}
	}

	// 切换时间胶囊状态
	toggleTimeCapsule() {
		const gridView = this.getActiveGridView();
		if (!gridView) {
			new Notice('请先打开Canvas网格视图');
			return;
		}

		gridView.toggleTimeCapsule();
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
				? '网格布局使用固定的卡片尺寸和间距，自动适应屏幕宽度。'
				: 'Grid layout uses fixed card dimensions and spacing, automatically adapting to screen width.',
			cls: 'setting-item-description'
		});

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

		// 统一的颜色管理设置
		this.createUnifiedColorSection(containerEl);

		// 关于插件部分（移动到末尾）
		this.createAboutSection(containerEl);
	}

	// 创建统一的颜色管理设置部分
	private createUnifiedColorSection(containerEl: HTMLElement): void {
		// 主标题
		containerEl.createEl('h3', {
			text: '🎨 ' + (this.plugin.settings.language === 'zh' ? '颜色管理' : 'Color Management')
		});

		// 描述文本
		const descContainer = containerEl.createDiv('unified-color-desc');
		descContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 6px;
			padding: 12px;
			margin-bottom: 20px;
			border-left: 3px solid var(--interactive-accent);
		`;

		const descText = descContainer.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '选择要在颜色筛选器中显示的颜色（最多5个）。这些颜色将显示为搜索框下方的筛选圆点。在下方预览区域可以拖拽调整颜色显示顺序。'
				: 'Select colors to display in the color filter (up to 5). These colors will appear as filter dots below the search box. Drag colors in the preview area to reorder them.',
			cls: 'setting-item-description'
		});
		descText.style.cssText = `
			margin: 0;
			color: var(--text-muted);
			font-size: 13px;
			line-height: 1.4;
		`;

		// 创建可选颜色网格
		this.createSelectableColorGrid(containerEl);

		// 创建已选择颜色预览
		this.createSelectedColorsPreview(containerEl);
	}

	// 创建可选颜色网格
	private createSelectableColorGrid(containerEl: HTMLElement): void {
		const gridContainer = containerEl.createDiv('selectable-color-grid-container');
		gridContainer.style.cssText = `
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 20px;
		`;

		const gridTitle = gridContainer.createEl('h4', {
			text: this.plugin.settings.language === 'zh' ? '可选颜色' : 'Available Colors',
			cls: 'color-grid-title'
		});
		gridTitle.style.cssText = `
			margin: 0 0 16px 0;
			color: var(--text-normal);
			font-size: 14px;
			font-weight: 600;
		`;

		const colorGrid = gridContainer.createDiv('selectable-color-grid');
		colorGrid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
			gap: 16px;
		`;

		// 可用颜色选项
		const availableColors = [
			{ value: '1', color: '#ff6b6b' },
			{ value: '2', color: '#ffa726' },
			{ value: '3', color: '#ffeb3b' },
			{ value: '4', color: '#66bb6a' },
			{ value: '5', color: '#26c6da' },
			{ value: '6', color: '#42a5f5' },
			{ value: '7', color: '#ab47bc' }
		];

		availableColors.forEach(colorOption => {
			this.createSelectableColorCard(colorGrid, colorOption);
		});
	}

	// 创建可选择的颜色卡片
	private createSelectableColorCard(container: HTMLElement, colorOption: { value: string, color: string }): void {
		const isSelected = this.plugin.settings.colorFilterColors.includes(colorOption.value);
		const category = this.plugin.settings.colorCategories.find(cat => cat.color === colorOption.value);

		const colorCard = container.createDiv('selectable-color-card');
		colorCard.style.cssText = `
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 20px 16px;
			border: 2px solid ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.2s ease;
			background: var(--background-secondary);
			position: relative;
			min-height: 140px;
		`;

		// 选中状态指示器
		if (isSelected) {
			const checkmark = colorCard.createDiv('color-card-checkmark');
			checkmark.innerHTML = '✓';
			checkmark.style.cssText = `
				position: absolute;
				top: 8px;
				right: 8px;
				width: 20px;
				height: 20px;
				background: ${colorOption.color};
				color: white;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 12px;
				font-weight: bold;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
			`;
		}

		// 颜色圆点
		const colorDot = colorCard.createDiv('color-dot');
		colorDot.style.cssText = `
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background: ${colorOption.color};
			margin-bottom: 16px;
			box-shadow: 0 2px 8px ${colorOption.color}40;
			border: 3px solid white;
		`;

		// 颜色名称（可编辑）
		const nameContainer = colorCard.createDiv('color-name-container');
		nameContainer.style.cssText = `
			width: 100%;
			text-align: center;
			margin-bottom: 8px;
		`;

		const nameDisplay = nameContainer.createEl('div', {
			text: category ? category.name : this.getDefaultColorName(colorOption.value),
			cls: 'color-name-display'
		});
		nameDisplay.style.cssText = `
			font-size: 14px;
			font-weight: 600;
			color: var(--text-normal);
			cursor: text;
			padding: 4px 8px;
			border-radius: 4px;
			transition: background 0.2s ease;
		`;

		// 颜色描述（可编辑）
		const descContainer = colorCard.createDiv('color-desc-container');
		descContainer.style.cssText = `
			width: 100%;
			text-align: center;
		`;

		const descDisplay = descContainer.createEl('div', {
			text: category ? category.description : '',
			cls: 'color-desc-display'
		});
		descDisplay.style.cssText = `
			font-size: 11px;
			color: var(--text-muted);
			cursor: text;
			padding: 4px 8px;
			border-radius: 4px;
			transition: background 0.2s ease;
			min-height: 16px;
			line-height: 1.3;
		`;

		// 添加编辑功能
		this.addInlineEditingToColorCard(nameDisplay, descDisplay, colorOption.value);

		// 点击选择/取消选择
		colorCard.addEventListener('click', (e) => {
			// 如果点击的是文本编辑区域，不触发选择逻辑
			if ((e.target as HTMLElement).classList.contains('color-name-display') ||
				(e.target as HTMLElement).classList.contains('color-desc-display')) {
				return;
			}
			this.toggleColorSelection(colorOption.value);
		});

		// 悬停效果
		colorCard.addEventListener('mouseenter', () => {
			if (!isSelected) {
				colorCard.style.borderColor = colorOption.color;
				colorCard.style.transform = 'translateY(-2px)';
			}
		});

		colorCard.addEventListener('mouseleave', () => {
			if (!isSelected) {
				colorCard.style.borderColor = 'var(--background-modifier-border)';
				colorCard.style.transform = 'translateY(0)';
			}
		});
	}

	// 添加内联编辑功能到颜色卡片
	private addInlineEditingToColorCard(nameDisplay: HTMLElement, descDisplay: HTMLElement, colorValue: string): void {
		// 名称编辑
		nameDisplay.addEventListener('dblclick', () => {
			this.startInlineEdit(nameDisplay, colorValue, 'name');
		});

		// 描述编辑
		descDisplay.addEventListener('dblclick', () => {
			this.startInlineEdit(descDisplay, colorValue, 'description');
		});

		// 悬停提示
		nameDisplay.addEventListener('mouseenter', () => {
			nameDisplay.style.background = 'var(--background-modifier-hover)';
			nameDisplay.title = this.plugin.settings.language === 'zh' ? '双击编辑名称' : 'Double-click to edit name';
		});

		nameDisplay.addEventListener('mouseleave', () => {
			nameDisplay.style.background = 'transparent';
		});

		descDisplay.addEventListener('mouseenter', () => {
			descDisplay.style.background = 'var(--background-modifier-hover)';
			descDisplay.title = this.plugin.settings.language === 'zh' ? '双击编辑描述' : 'Double-click to edit description';
		});

		descDisplay.addEventListener('mouseleave', () => {
			descDisplay.style.background = 'transparent';
		});
	}

	// 开始内联编辑
	private startInlineEdit(element: HTMLElement, colorValue: string, field: 'name' | 'description'): void {
		const currentText = element.textContent || '';

		// 创建输入框
		const input = document.createElement(field === 'description' ? 'textarea' : 'input');
		input.value = currentText;
		input.style.cssText = `
			width: 100%;
			background: var(--background-primary);
			border: 1px solid var(--interactive-accent);
			border-radius: 4px;
			padding: 4px 8px;
			font-size: ${field === 'name' ? '14px' : '11px'};
			font-weight: ${field === 'name' ? '600' : 'normal'};
			color: var(--text-normal);
			text-align: center;
			resize: none;
			${field === 'description' ? 'min-height: 32px; line-height: 1.3;' : ''}
		`;

		// 替换显示元素
		element.style.display = 'none';
		element.parentElement?.insertBefore(input, element);
		input.focus();
		input.select();

		// 保存编辑
		const saveEdit = async () => {
			const newValue = input.value.trim();
			element.textContent = newValue;
			element.style.display = 'block';
			input.remove();

			// 更新颜色分类设置
			await this.updateColorCategory(colorValue, field, newValue);
		};

		// 取消编辑
		const cancelEdit = () => {
			element.style.display = 'block';
			input.remove();
		};

		// 事件监听
		input.addEventListener('blur', saveEdit);
		input.addEventListener('keydown', (e) => {
			const keyEvent = e as KeyboardEvent;
			if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
				e.preventDefault();
				saveEdit();
			} else if (keyEvent.key === 'Escape') {
				e.preventDefault();
				cancelEdit();
			}
		});
	}

	// 更新颜色分类
	private async updateColorCategory(colorValue: string, field: 'name' | 'description', newValue: string): Promise<void> {
		// 查找现有分类
		let category = this.plugin.settings.colorCategories.find(cat => cat.color === colorValue);

		if (!category) {
			// 创建新分类
			const defaultName = this.getDefaultColorName(colorValue);
			category = {
				id: `color-${colorValue}`,
				name: field === 'name' ? newValue : defaultName,
				description: field === 'description' ? newValue : '',
				color: colorValue
			};
			this.plugin.settings.colorCategories.push(category);
		} else {
			// 更新现有分类
			if (field === 'name') {
				category.name = newValue;
			} else {
				category.description = newValue;
			}
		}

		// 保存设置
		await this.plugin.saveSettings();
		this.updateAllGridViews();
	}

	// 切换颜色选择状态
	private async toggleColorSelection(colorValue: string): Promise<void> {
		const currentColors = [...this.plugin.settings.colorFilterColors];
		const isCurrentlySelected = currentColors.includes(colorValue);

		if (isCurrentlySelected) {
			// 移除颜色
			const index = currentColors.indexOf(colorValue);
			if (index > -1) {
				currentColors.splice(index, 1);
			}
		} else {
			// 添加颜色，但限制最多5个
			if (currentColors.length < 5) {
				currentColors.push(colorValue);
			} else {
				new Notice(this.plugin.settings.language === 'zh' ? '最多只能选择5个颜色' : 'Maximum 5 colors can be selected');
				return;
			}
		}

		this.plugin.settings.colorFilterColors = currentColors;
		await this.plugin.saveSettings();
		this.updateAllGridViews();

		// 重新渲染界面
		this.display();
	}

	// 创建已选择颜色预览
	private createSelectedColorsPreview(containerEl: HTMLElement): void {
		const previewContainer = containerEl.createDiv('selected-colors-preview');
		previewContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 6px;
			padding: 16px;
			margin-bottom: 20px;
		`;

		const previewHeader = previewContainer.createDiv('preview-header');
		previewHeader.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 12px;
		`;

		const statusText = previewHeader.createEl('span', {
			text: this.plugin.settings.language === 'zh'
				? `已选择 ${this.plugin.settings.colorFilterColors.length}/5 个颜色`
				: `Selected ${this.plugin.settings.colorFilterColors.length}/5 colors`,
			cls: 'selected-colors-status'
		});
		statusText.style.cssText = `
			color: var(--text-muted);
			font-size: 13px;
		`;

		const sortHint = previewHeader.createEl('span', {
			text: this.plugin.settings.language === 'zh' ? '拖拽调整顺序' : 'Drag to reorder',
			cls: 'sort-hint'
		});
		sortHint.style.cssText = `
			color: var(--text-muted);
			font-size: 11px;
			font-style: italic;
		`;

		// 可排序的颜色预览区域
		const sortableContainer = previewContainer.createDiv('sortable-preview-container');
		sortableContainer.style.cssText = `
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
			min-height: 40px;
			padding: 8px;
			border: 1px dashed var(--background-modifier-border);
			border-radius: 4px;
			background: var(--background-primary);
		`;

		// 渲染可排序的颜色圆点
		this.renderSortableColorDots(sortableContainer);
	}

	// 创建颜色选择网格
	private createColorSelectionGrid(container: HTMLElement): void {
		const colorGridContainer = container.createDiv('color-filter-grid-container');
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
			grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
			gap: 12px;
		`;

		// 可用颜色选项（结合颜色分类信息）
		const availableColors = [
			{ value: '1', color: '#ff6b6b', emoji: '🔴' },
			{ value: '2', color: '#ffa726', emoji: '🟠' },
			{ value: '3', color: '#ffeb3b', emoji: '🟡' },
			{ value: '4', color: '#66bb6a', emoji: '🟢' },
			{ value: '5', color: '#26c6da', emoji: '🔵' },
			{ value: '6', color: '#42a5f5', emoji: '🔵' },
			{ value: '7', color: '#ab47bc', emoji: '🟣' }
		];

		availableColors.forEach(colorOption => {
			const colorCard = colorGrid.createDiv('color-filter-card');
			const isSelected = this.plugin.settings.colorFilterColors.includes(colorOption.value);

			// 查找对应的颜色分类
			const category = this.plugin.settings.colorCategories.find(cat => cat.color === colorOption.value);
			const displayName = category ? category.name : this.getDefaultColorName(colorOption.value);
			const description = category ? category.description : '';

			colorCard.style.cssText = `
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 16px 12px;
				border: 2px solid ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
				border-radius: 8px;
				cursor: pointer;
				transition: all 0.2s ease;
				background: ${isSelected ? colorOption.color + '10' : 'var(--background-secondary)'};
				position: relative;
				min-height: 120px;
			`;

			// 颜色预览圆点
			const colorPreview = colorCard.createDiv('color-preview-large');
			colorPreview.style.cssText = `
				width: 36px;
				height: 36px;
				border-radius: 50%;
				background: ${colorOption.color};
				margin-bottom: 12px;
				box-shadow: 0 2px 8px ${colorOption.color}40;
				border: 2px solid white;
			`;

			// 颜色名称
			const colorName = colorCard.createEl('div', {
				text: displayName,
				cls: 'color-card-name'
			});
			colorName.style.cssText = `
				font-size: 13px;
				font-weight: 600;
				color: var(--text-normal);
				text-align: center;
				margin-bottom: 4px;
			`;

			// 颜色描述
			if (description) {
				const colorDesc = colorCard.createEl('div', {
					text: description,
					cls: 'color-card-desc'
				});
				colorDesc.style.cssText = `
					font-size: 11px;
					color: var(--text-muted);
					text-align: center;
					line-height: 1.3;
					margin-bottom: 8px;
				`;
			}

			// 选中状态指示器
			if (isSelected) {
				const checkmark = colorCard.createDiv('color-card-checkmark');
				checkmark.innerHTML = '✓';
				checkmark.style.cssText = `
					position: absolute;
					top: 6px;
					right: 6px;
					width: 18px;
					height: 18px;
					background: ${colorOption.color};
					color: white;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 11px;
					font-weight: bold;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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

				// 重新渲染界面
				this.display();
			});

			// 悬停效果
			colorCard.addEventListener('mouseenter', () => {
				if (!isSelected) {
					colorCard.style.borderColor = colorOption.color;
					colorCard.style.background = colorOption.color + '08';
					colorCard.style.transform = 'translateY(-2px)';
				}
			});

			colorCard.addEventListener('mouseleave', () => {
				if (!isSelected) {
					colorCard.style.borderColor = 'var(--background-modifier-border)';
					colorCard.style.background = 'var(--background-secondary)';
					colorCard.style.transform = 'translateY(0)';
				}
			});
		});
	}

	// 创建可排序的颜色预览
	private createSortableColorPreview(container: HTMLElement): void {
		const statusContainer = container.createDiv('color-filter-status');
		statusContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 6px;
			margin-bottom: 20px;
			padding: 16px;
		`;

		const statusHeader = statusContainer.createDiv('status-header');
		statusHeader.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 12px;
		`;

		const statusText = statusHeader.createEl('span', {
			text: this.plugin.settings.language === 'zh'
				? `已选择 ${this.plugin.settings.colorFilterColors.length}/5 个颜色`
				: `Selected ${this.plugin.settings.colorFilterColors.length}/5 colors`,
			cls: 'color-filter-status-text'
		});
		statusText.style.cssText = `
			color: var(--text-muted);
			font-size: 13px;
		`;

		const sortHint = statusHeader.createEl('span', {
			text: this.plugin.settings.language === 'zh' ? '拖拽调整顺序' : 'Drag to reorder',
			cls: 'sort-hint'
		});
		sortHint.style.cssText = `
			color: var(--text-muted);
			font-size: 11px;
			font-style: italic;
		`;

		// 可排序的颜色预览区域
		const sortableContainer = statusContainer.createDiv('sortable-color-container');
		sortableContainer.style.cssText = `
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
			min-height: 40px;
			padding: 8px;
			border: 1px dashed var(--background-modifier-border);
			border-radius: 4px;
			background: var(--background-primary);
		`;

		// 渲染可排序的颜色圆点
		this.renderSortableColorDots(sortableContainer);
	}

	// 获取默认颜色名称
	private getDefaultColorName(colorValue: string): string {
		const colorNames: { [key: string]: string } = {
			'1': this.plugin.settings.language === 'zh' ? '红色' : 'Red',
			'2': this.plugin.settings.language === 'zh' ? '橙色' : 'Orange',
			'3': this.plugin.settings.language === 'zh' ? '黄色' : 'Yellow',
			'4': this.plugin.settings.language === 'zh' ? '绿色' : 'Green',
			'5': this.plugin.settings.language === 'zh' ? '青色' : 'Cyan',
			'6': this.plugin.settings.language === 'zh' ? '蓝色' : 'Blue',
			'7': this.plugin.settings.language === 'zh' ? '紫色' : 'Purple'
		};
		return colorNames[colorValue] || colorValue;
	}



	// 创建颜色分类列表
	private createColorCategoryList(containerEl: HTMLElement): void {
		const categoryContainer = containerEl.createDiv('color-category-list');
		categoryContainer.style.cssText = `
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 20px;
			margin-bottom: 16px;
		`;

		const listTitle = categoryContainer.createEl('h4', {
			text: this.plugin.settings.language === 'zh' ? '颜色分类配置' : 'Color Category Configuration',
			cls: 'color-category-title'
		});
		listTitle.style.cssText = `
			margin: 0 0 16px 0;
			color: var(--text-normal);
			font-size: 14px;
			font-weight: 600;
		`;

		// 显示每个颜色分类
		this.plugin.settings.colorCategories.forEach((category, index) => {
			this.createColorCategoryItem(categoryContainer, category, index);
		});
	}

	// 创建单个颜色分类项
	private createColorCategoryItem(container: HTMLElement, category: ColorCategory, index: number): void {
		const itemContainer = container.createDiv('color-category-item');
		itemContainer.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			margin-bottom: 8px;
			background: var(--background-secondary);
		`;

		// 颜色圆点
		const colorDot = itemContainer.createDiv('color-category-dot');
		colorDot.style.cssText = `
			width: 24px;
			height: 24px;
			border-radius: 50%;
			background: ${this.getColorValue(category.color)};
			border: 2px solid var(--background-modifier-border);
			flex-shrink: 0;
		`;

		// 分类信息
		const infoContainer = itemContainer.createDiv('color-category-info');
		infoContainer.style.cssText = `
			flex: 1;
			min-width: 0;
		`;

		const nameEl = infoContainer.createEl('div', {
			text: category.name,
			cls: 'color-category-name'
		});
		nameEl.style.cssText = `
			font-weight: 600;
			color: var(--text-normal);
			margin-bottom: 4px;
		`;

		const descEl = infoContainer.createEl('div', {
			text: category.description,
			cls: 'color-category-desc'
		});
		descEl.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
			line-height: 1.3;
		`;

		// 编辑按钮
		const editBtn = itemContainer.createEl('button', {
			text: this.plugin.settings.language === 'zh' ? '编辑' : 'Edit',
			cls: 'mod-cta'
		});
		editBtn.style.cssText = `
			padding: 4px 12px;
			font-size: 12px;
		`;
		editBtn.onclick = () => {
			this.openColorCategoryEditor(category, index);
		};
	}

	// 获取颜色值
	private getColorValue(colorId: string): string {
		const colorMap = {
			'1': '#ff6b6b', // 红色
			'2': '#ffa726', // 橙色
			'3': '#ffeb3b', // 黄色
			'4': '#66bb6a', // 绿色
			'5': '#26c6da', // 青色
			'6': '#42a5f5', // 蓝色
			'7': '#ab47bc'  // 紫色
		};
		return colorMap[colorId as keyof typeof colorMap] || '#999999';
	}

	// 打开颜色分类编辑器
	private openColorCategoryEditor(category: ColorCategory, index: number): void {
		new ColorCategoryEditModal(this.app, this.plugin, category, index, () => {
			this.display(); // 重新渲染设置页面
		}).open();
	}



	// 渲染可排序的颜色圆点
	private renderSortableColorDots(container: HTMLElement): void {
		container.empty();

		const colorMap: { [key: string]: string } = {
			'1': '#ff6b6b', '2': '#ffa726', '3': '#ffeb3b', '4': '#66bb6a',
			'5': '#26c6da', '6': '#42a5f5', '7': '#ab47bc'
		};

		const colorNames: { [key: string]: string } = {
			'1': this.plugin.settings.language === 'zh' ? '红色' : 'Red',
			'2': this.plugin.settings.language === 'zh' ? '橙色' : 'Orange',
			'3': this.plugin.settings.language === 'zh' ? '黄色' : 'Yellow',
			'4': this.plugin.settings.language === 'zh' ? '绿色' : 'Green',
			'5': this.plugin.settings.language === 'zh' ? '青色' : 'Cyan',
			'6': this.plugin.settings.language === 'zh' ? '蓝色' : 'Blue',
			'7': this.plugin.settings.language === 'zh' ? '紫色' : 'Purple'
		};

		this.plugin.settings.colorFilterColors.forEach((colorValue, index) => {
			const colorDot = container.createDiv('sortable-color-dot');
			colorDot.draggable = true;
			colorDot.dataset.colorValue = colorValue;
			colorDot.dataset.index = index.toString();

			colorDot.style.cssText = `
				width: 32px;
				height: 32px;
				border-radius: 50%;
				background: ${colorMap[colorValue]};
				border: 2px solid white;
				box-shadow: 0 2px 8px ${colorMap[colorValue]}40;
				cursor: grab;
				transition: all 0.2s ease;
				position: relative;
				display: flex;
				align-items: center;
				justify-content: center;
			`;

			// 添加颜色名称提示
			colorDot.title = colorNames[colorValue] || colorValue;

			// 拖拽事件
			colorDot.addEventListener('dragstart', (e) => {
				colorDot.style.cursor = 'grabbing';
				colorDot.style.opacity = '0.5';
				e.dataTransfer!.setData('text/plain', index.toString());
				e.dataTransfer!.effectAllowed = 'move';
			});

			colorDot.addEventListener('dragend', () => {
				colorDot.style.cursor = 'grab';
				colorDot.style.opacity = '1';
			});

			colorDot.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer!.dropEffect = 'move';
			});

			colorDot.addEventListener('drop', async (e) => {
				e.preventDefault();
				const draggedIndex = parseInt(e.dataTransfer!.getData('text/plain'));
				const targetIndex = index;

				if (draggedIndex !== targetIndex) {
					// 重新排序颜色数组
					const newColors = [...this.plugin.settings.colorFilterColors];
					const draggedColor = newColors.splice(draggedIndex, 1)[0];
					newColors.splice(targetIndex, 0, draggedColor);

					// 更新设置
					this.plugin.settings.colorFilterColors = newColors;
					await this.plugin.saveSettings();
					this.updateAllGridViews();

					// 重新渲染
					this.renderSortableColorDots(container);
				}
			});

			// 悬停效果
			colorDot.addEventListener('mouseenter', () => {
				colorDot.style.transform = 'scale(1.1)';
			});

			colorDot.addEventListener('mouseleave', () => {
				colorDot.style.transform = 'scale(1)';
			});
		});

		// 如果没有选择颜色，显示提示
		if (this.plugin.settings.colorFilterColors.length === 0) {
			const emptyHint = container.createDiv('empty-hint');
			emptyHint.textContent = this.plugin.settings.language === 'zh'
				? '请在上方选择颜色'
				: 'Please select colors above';
			emptyHint.style.cssText = `
				color: var(--text-muted);
				font-size: 12px;
				font-style: italic;
				text-align: center;
				padding: 8px;
			`;
		}
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
				? '🎨 关于 Canvasgrid Transit'
				: '🎨 About Canvasgrid Transit',
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
			text: 'v0.5.1',
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
				? '为 Obsidian Canvas 提供强大的网格卡片视图，集成智能搜索、颜色筛选、分组管理、时间胶囊收集、快速书签解析等创新功能，让您的知识管理更加高效便捷。'
				: 'Powerful grid card view for Obsidian Canvas with intelligent search, color filtering, group management, time capsule collection, fast bookmark parsing and other innovative features for efficient knowledge management.',
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
			'🔍 智能搜索 - 支持内容、文件名、URL全文搜索',
			'🎨 颜色筛选 - 可配置颜色分类和一键筛选',
			'📱 响应式布局 - 自适应屏幕宽度的网格布局',
			'🗂️ 分组管理 - Canvas分组的卡片化显示和编辑',
			'⏰ 时间胶囊 - 创新的内容收集和时间管理功能',
			'🔗 快速书签 - 网页链接的瞬间解析和美观展示',
			'✏️ 实时编辑 - 直接在网格视图中编辑卡片内容',
			'🎯 精准定位 - 一键聚焦到Canvas中的具体节点',
			'🔄 双向同步 - 与Canvas白板的实时数据同步',
			'🌐 多语言 - 支持中文和英文界面切换'
		] : [
			'🔍 Smart Search - Full-text search for content, filenames, and URLs',
			'🎨 Color Filtering - Configurable color categories and one-click filtering',
			'📱 Responsive Layout - Grid layout that adapts to screen width',
			'🗂️ Group Management - Card-based display and editing of Canvas groups',
			'⏰ Time Capsule - Innovative content collection and time management',
			'🔗 Fast Bookmarks - Instant parsing and beautiful display of web links',
			'✏️ Real-time Editing - Direct card content editing in grid view',
			'🎯 Precise Navigation - One-click focus to specific Canvas nodes',
			'🔄 Bidirectional Sync - Real-time data sync with Canvas whiteboard',
			'🌐 Multi-language - Support for Chinese and English interface'
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
				? '感谢您选择 Canvasgrid Transit！这个插件融合了创新的时间胶囊、智能书签解析、分组管理等功能，致力于提升您的知识管理体验。您的每一个反馈都是我们前进的动力！'
				: 'Thank you for choosing Canvasgrid Transit! This plugin integrates innovative features like time capsule, intelligent bookmark parsing, and group management to enhance your knowledge management experience. Every feedback from you is our driving force!',
			cls: 'plugin-thanks-text'
		});

		// 特别感谢部分
		const specialThanks = thanksContainer.createEl('div', {
			cls: 'plugin-special-thanks'
		});
		specialThanks.style.cssText = `
			margin-top: 16px;
			padding: 12px;
			background: var(--background-secondary);
			border-radius: 6px;
			border-left: 3px solid var(--interactive-accent);
		`;

		const obsidianThanks = specialThanks.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '🙏 特别感谢 Obsidian 团队创造了如此优秀的知识管理平台，为我们的创新提供了无限可能。'
				: '🙏 Special thanks to the Obsidian team for creating such an excellent knowledge management platform, providing infinite possibilities for our innovation.',
			cls: 'plugin-obsidian-thanks'
		});
		obsidianThanks.style.cssText = `
			color: var(--text-muted);
			font-size: 12px;
			margin-bottom: 8px;
			font-style: italic;
		`;

		const designInspiration = specialThanks.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '⏰ 时间胶囊功能的设计灵感来源于锤子科技 Smartisan 的时间胶囊，致敬经典的创新设计理念。'
				: '⏰ The time capsule feature design is inspired by Smartisan\'s time capsule from Hammer Technology, paying tribute to classic innovative design concepts.',
			cls: 'plugin-design-inspiration'
		});
		designInspiration.style.cssText = `
			color: var(--text-muted);
			font-size: 12px;
			margin: 0;
			font-style: italic;
		`;
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
			window.open('https://github.com/zhuzhige123/Canvasgrid-Transit', '_blank');
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
			window.open('mailto:tutaoyuan8@outlook.com', '_blank');
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

		// 支付宝支持按钮
		const alipayBtn = supportButtons.createEl('button', {
			text: '💙 ' + i18n.t('alipaySupport'),
			cls: 'plugin-support-btn'
		});
		alipayBtn.style.cssText = `
			background: linear-gradient(135deg, #1677ff, #00a6fb);
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		`;
		alipayBtn.onmouseover = () => {
			alipayBtn.style.transform = 'translateY(-1px) scale(1.05)';
			alipayBtn.style.boxShadow = '0 4px 12px rgba(22, 119, 255, 0.3)';
		};
		alipayBtn.onmouseout = () => {
			alipayBtn.style.transform = 'translateY(0) scale(1)';
			alipayBtn.style.boxShadow = 'none';
		};
		alipayBtn.onclick = () => {
			window.open('https://github.com/zhuzhige123/Canvasgrid-Transit/blob/main/SUPPORT.md#-支付宝', '_blank');
		};



		// GitHub赞助按钮
		const sponsorBtn = supportButtons.createEl('button', {
			text: '⭐ ' + i18n.t('githubSponsor'),
			cls: 'plugin-support-btn'
		});
		sponsorBtn.style.cssText = `
			background: linear-gradient(135deg, #6366f1, #8b5cf6);
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		`;
		sponsorBtn.onmouseover = () => {
			sponsorBtn.style.transform = 'translateY(-1px) scale(1.05)';
			sponsorBtn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
		};
		sponsorBtn.onmouseout = () => {
			sponsorBtn.style.transform = 'translateY(0) scale(1)';
			sponsorBtn.style.boxShadow = 'none';
		};
		sponsorBtn.onclick = () => {
			window.open('https://github.com/zhuzhige123/Canvasgrid-Transit', '_blank');
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
			{ text: '📚 使用文档', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit/blob/main/README.md' },
			{ text: '🐛 问题报告', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit/issues' },
			{ text: '⭐ GitHub 仓库', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit' },
			{ text: '🎨 更新日志', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit/releases' }
		] : [
			{ text: '📚 Documentation', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit/blob/main/README.md' },
			{ text: '🐛 Bug Reports', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit/issues' },
			{ text: '⭐ GitHub Repository', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit' },
			{ text: '🎨 Changelog', url: 'https://github.com/zhuzhige123/Canvasgrid-Transit/releases' }
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
				? '© 2025 Canvasgrid Transit v0.5.1 - 用 ❤️ 为 Obsidian 知识管理社区精心打造'
				: '© 2025 Canvasgrid Transit v0.5.1 - Crafted with ❤️ for Obsidian knowledge management community',
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

// 颜色分类编辑模态框
class ColorCategoryEditModal extends Modal {
	private plugin: CanvasGridPlugin;
	private category: ColorCategory;
	private index: number;
	private onSave: () => void;
	private nameInput!: HTMLInputElement;
	private descInput!: HTMLTextAreaElement;

	constructor(app: App, plugin: CanvasGridPlugin, category: ColorCategory, index: number, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.category = category;
		this.index = index;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// 设置模态框标题
		contentEl.createEl('h2', {
			text: this.plugin.settings.language === 'zh' ? '编辑颜色分类' : 'Edit Color Category',
			cls: 'modal-title'
		});

		// 创建表单容器
		const formContainer = contentEl.createDiv('color-category-form');
		formContainer.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 16px;
			margin: 20px 0;
		`;

		// 颜色预览
		const colorPreview = formContainer.createDiv('color-preview-container');
		colorPreview.style.cssText = `
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px;
			background: var(--background-secondary);
			border-radius: 6px;
		`;

		const colorDot = colorPreview.createDiv('color-preview-dot');
		colorDot.style.cssText = `
			width: 32px;
			height: 32px;
			border-radius: 50%;
			background: ${this.getColorValue(this.category.color)};
			border: 2px solid var(--background-modifier-border);
			flex-shrink: 0;
		`;

		const colorInfo = colorPreview.createDiv('color-info');
		colorInfo.innerHTML = `
			<div style="font-weight: 600; color: var(--text-normal);">
				${this.plugin.settings.language === 'zh' ? '颜色' : 'Color'}: ${this.getColorName(this.category.color)}
			</div>
			<div style="font-size: 12px; color: var(--text-muted);">
				${this.plugin.settings.language === 'zh' ? '颜色ID' : 'Color ID'}: ${this.category.color}
			</div>
		`;

		// 分类名称输入
		const nameContainer = formContainer.createDiv('input-container');
		const nameLabel = nameContainer.createEl('label', {
			text: this.plugin.settings.language === 'zh' ? '分类名称:' : 'Category Name:',
			cls: 'setting-item-name'
		});
		nameLabel.style.cssText = `
			display: block;
			margin-bottom: 6px;
			font-weight: 600;
			color: var(--text-normal);
		`;

		this.nameInput = nameContainer.createEl('input', {
			type: 'text',
			value: this.category.name,
			cls: 'color-category-name-input'
		});
		this.nameInput.style.cssText = `
			width: 100%;
			padding: 8px 12px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			background: var(--background-primary);
			color: var(--text-normal);
			font-size: 14px;
		`;

		// 分类描述输入
		const descContainer = formContainer.createDiv('input-container');
		const descLabel = descContainer.createEl('label', {
			text: this.plugin.settings.language === 'zh' ? '分类描述:' : 'Category Description:',
			cls: 'setting-item-name'
		});
		descLabel.style.cssText = `
			display: block;
			margin-bottom: 6px;
			font-weight: 600;
			color: var(--text-normal);
		`;

		this.descInput = descContainer.createEl('textarea', {
			value: this.category.description,
			cls: 'color-category-desc-input'
		});
		this.descInput.style.cssText = `
			width: 100%;
			min-height: 80px;
			padding: 8px 12px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			background: var(--background-primary);
			color: var(--text-normal);
			font-size: 14px;
			resize: vertical;
			font-family: inherit;
		`;

		// 按钮容器
		const buttonContainer = contentEl.createDiv('modal-button-container');
		buttonContainer.style.cssText = `
			display: flex;
			justify-content: flex-end;
			gap: 12px;
			margin-top: 20px;
			padding-top: 16px;
			border-top: 1px solid var(--background-modifier-border);
		`;

		// 取消按钮
		const cancelBtn = buttonContainer.createEl('button', {
			text: this.plugin.settings.language === 'zh' ? '取消' : 'Cancel',
			cls: 'mod-cancel'
		});
		cancelBtn.onclick = () => this.close();

		// 保存按钮
		const saveBtn = buttonContainer.createEl('button', {
			text: this.plugin.settings.language === 'zh' ? '保存' : 'Save',
			cls: 'mod-cta'
		});
		saveBtn.onclick = () => this.saveChanges();

		// 聚焦到名称输入框
		setTimeout(() => {
			this.nameInput.focus();
			this.nameInput.select();
		}, 100);
	}

	private getColorValue(colorId: string): string {
		const colorMap = {
			'1': '#ff6b6b', // 红色
			'2': '#ffa726', // 橙色
			'3': '#ffeb3b', // 黄色
			'4': '#66bb6a', // 绿色
			'5': '#26c6da', // 青色
			'6': '#42a5f5', // 蓝色
			'7': '#ab47bc'  // 紫色
		};
		return colorMap[colorId as keyof typeof colorMap] || '#999999';
	}

	private getColorName(colorId: string): string {
		const colorNames = {
			'1': this.plugin.settings.language === 'zh' ? '红色' : 'Red',
			'2': this.plugin.settings.language === 'zh' ? '橙色' : 'Orange',
			'3': this.plugin.settings.language === 'zh' ? '黄色' : 'Yellow',
			'4': this.plugin.settings.language === 'zh' ? '绿色' : 'Green',
			'5': this.plugin.settings.language === 'zh' ? '青色' : 'Cyan',
			'6': this.plugin.settings.language === 'zh' ? '蓝色' : 'Blue',
			'7': this.plugin.settings.language === 'zh' ? '紫色' : 'Purple'
		};
		return colorNames[colorId as keyof typeof colorNames] || colorId;
	}

	private saveChanges(): void {
		const newName = this.nameInput.value.trim();
		const newDesc = this.descInput.value.trim();

		if (!newName) {
			new Notice(this.plugin.settings.language === 'zh' ? '分类名称不能为空' : 'Category name cannot be empty');
			this.nameInput.focus();
			return;
		}

		// 更新分类信息
		this.plugin.settings.colorCategories[this.index] = {
			...this.category,
			name: newName,
			description: newDesc
		};

		// 保存设置
		this.plugin.saveSettings();

		// 显示成功消息
		new Notice(this.plugin.settings.language === 'zh' ? '颜色分类已更新' : 'Color category updated');

		// 关闭模态框并刷新设置页面
		this.close();
		this.onSave();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
