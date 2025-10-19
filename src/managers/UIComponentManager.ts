import { App, TFile, Notice, Modal, setIcon } from 'obsidian';
import { SafeDOMUtils } from '../utils/SafeDOMUtils';

// UI组件配置接口
export interface UIComponentConfig {
	theme: 'auto' | 'light' | 'dark';
	language: 'zh' | 'en';
	showTooltips: boolean;
	animationEnabled: boolean;
	compactMode: boolean;
}

// 工具栏配置接口
export interface ToolbarConfig {
	showMainMenu: boolean;
	showSearch: boolean;
	showTimeCapsule: boolean;
	showColorFilter: boolean;
	showSortOptions: boolean;
}

// 卡片渲染配置接口
export interface CardRenderConfig {
	maxPreviewLength: number;
	showMetadata: boolean;
	enableHover: boolean;
	cardSpacing: number;
	borderRadius: number;
}

// 模态窗配置接口
export interface ModalConfig {
	width: string;
	height: string;
	backdrop: boolean;
	closeOnEscape: boolean;
	animation: boolean;
}

// 工具栏管理器
export class ToolbarManager {
	private app: App;
	private config: ToolbarConfig;
	private container: HTMLElement | null = null;

	constructor(app: App, config: ToolbarConfig) {
		this.app = app;
		this.config = config;
	}

	/**
	 * 创建工具栏
	 */
	createToolbar(container: HTMLElement): HTMLElement {
		this.container = container;
		
		const toolbar = container.createDiv('canvas-grid-toolbar');
		toolbar.addClass('canvas-grid-toolbar-container');

		// 左侧工具组
		const leftGroup = toolbar.createDiv('toolbar-group toolbar-left');
		
		if (this.config.showMainMenu) {
			this.createMainMenuButton(leftGroup);
		}

		if (this.config.showTimeCapsule) {
			this.createTimeCapsuleButton(leftGroup);
		}

		// 中间搜索组
		const centerGroup = toolbar.createDiv('toolbar-group toolbar-center');
		
		if (this.config.showSearch) {
			this.createSearchBox(centerGroup);
		}

		// 右侧工具组
		const rightGroup = toolbar.createDiv('toolbar-group toolbar-right');
		
		if (this.config.showColorFilter) {
			this.createColorFilter(rightGroup);
		}

		if (this.config.showSortOptions) {
			this.createSortOptions(rightGroup);
		}

		// 添加Anki同步按钮
		this.createAnkiSyncButton(rightGroup);

		return toolbar;
	}

	/**
	 * 创建主菜单按钮
	 */
	private createMainMenuButton(container: HTMLElement): HTMLElement {
		const button = container.createEl('button', {
			cls: 'canvas-grid-button main-menu-button',
			attr: { 'aria-label': '主菜单' }
		});

		// 使用Obsidian的setIcon方法设置图标
		setIcon(button, 'menu');

		button.addEventListener('click', (e) => {
			this.showMainMenu(e);
		});

		return button;
	}

	/**
	 * 创建时间胶囊按钮
	 */
	private createTimeCapsuleButton(container: HTMLElement): HTMLElement {
		const button = container.createEl('button', {
			cls: 'canvas-grid-button time-capsule-button',
			attr: { 'aria-label': '时间胶囊' }
		});

		// 使用Obsidian的setIcon方法设置时钟图标
		setIcon(button, 'clock');

		button.addEventListener('click', () => {
			this.toggleTimeCapsule();
		});

		return button;
	}

	/**
	 * 创建搜索框
	 */
	private createSearchBox(container: HTMLElement): HTMLElement {
		const searchContainer = container.createDiv('search-container');
		
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			cls: 'canvas-grid-search-input',
			attr: { 
				placeholder: '搜索卡片内容...',
				'aria-label': '搜索'
			}
		});

		const searchIcon = searchContainer.createEl('div', {
			cls: 'search-icon'
		});

		// 使用Obsidian的setIcon方法设置搜索图标
		setIcon(searchIcon, 'search');

		// 搜索功能
		let searchTimeout: NodeJS.Timeout;
		searchInput.addEventListener('input', (e) => {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				const query = (e.target as HTMLInputElement).value;
				this.performSearch(query);
			}, 300);
		});

		return searchContainer;
	}

	/**
	 * 创建颜色筛选器
	 */
	private createColorFilter(container: HTMLElement): HTMLElement {
		const filterContainer = container.createDiv('color-filter-container');
		
		const filterButton = filterContainer.createEl('button', {
			cls: 'canvas-grid-button color-filter-button',
			attr: { 'aria-label': '颜色筛选' }
		});

		// 使用Obsidian的setIcon方法设置筛选图标
		setIcon(filterButton, 'filter');

		filterButton.addEventListener('click', () => {
			this.showColorFilterMenu(filterButton);
		});

		return filterContainer;
	}

	/**
	 * 创建排序选项
	 */
	private createSortOptions(container: HTMLElement): HTMLElement {
		const sortContainer = container.createDiv('sort-options-container');

		const sortButton = sortContainer.createEl('button', {
			cls: 'canvas-grid-button sort-button',
			attr: { 'aria-label': '排序选项' }
		});

		// 使用Obsidian的setIcon方法设置排序图标
		setIcon(sortButton, 'arrow-up-down');

		sortButton.addEventListener('click', () => {
			this.showSortMenu(sortButton);
		});

		return sortContainer;
	}

	/**
	 * 创建Anki同步按钮
	 */
	private createAnkiSyncButton(container: HTMLElement): HTMLElement {
		const syncContainer = container.createDiv('sync-button-container');

		const syncButton = syncContainer.createEl('button', {
			cls: 'toolbar-button mod-cta anki-sync-btn',
			attr: { 'aria-label': 'Anki同步' }
		});

		// 使用Obsidian的setIcon方法设置同步图标
		setIcon(syncButton, 'refresh-cw');

		// 添加文本标签
		const textSpan = syncButton.createSpan();
		SafeDOMUtils.setTextContent(textSpan, 'Anki同步');
		SafeDOMUtils.addClasses(textSpan, 'anki-sync-text');

		syncButton.addEventListener('click', async () => {
			await this.handleAnkiSync();
		});

		return syncContainer;
	}

	/**
	 * 显示主菜单
	 */
	private showMainMenu(event: MouseEvent): void {
		const button = event.target as HTMLElement;
		const existingMenu = document.querySelector('.canvas-grid-main-dropdown');

		if (existingMenu) {
			existingMenu.remove();
			return;
		}

		// 创建下拉菜单
		const dropdown = document.createElement('div');
		dropdown.className = 'canvas-grid-main-dropdown';

		// 基础菜单内容（预留扩展）
		const basicSection = dropdown.createDiv('canvas-grid-menu-section');
		const infoItem = this.createMenuItem('网格视图', 'grid', () => {
			console.log('网格视图信息');
			dropdown.remove();
		});
		basicSection.appendChild(infoItem);

		// 定位菜单
		const buttonRect = button.getBoundingClientRect();
		dropdown.style.position = 'absolute';
		dropdown.style.top = `${buttonRect.bottom + 4}px`;
		dropdown.style.left = `${buttonRect.left}px`;
		dropdown.style.zIndex = '1000';

		// 添加到页面
		document.body.appendChild(dropdown);

		// 点击外部关闭菜单
		const closeMenu = (e: MouseEvent) => {
			if (!dropdown.contains(e.target as Node)) {
				dropdown.remove();
				document.removeEventListener('click', closeMenu);
			}
		};
		setTimeout(() => document.addEventListener('click', closeMenu), 0);
	}

	/**
	 * 创建菜单项
	 */
	private createMenuItem(text: string, iconName: string, onClick: () => void): HTMLElement {
		const item = document.createElement('div');
		item.className = 'canvas-grid-menu-item';

		// 图标
		const icon = document.createElement('span');
		icon.className = 'menu-icon';
		setIcon(icon, iconName);
		item.appendChild(icon);

		// 文本
		const label = document.createElement('span');
		label.className = 'menu-label';
		label.textContent = text;
		item.appendChild(label);

		// 点击事件
		item.addEventListener('click', onClick);

		return item;
	}



	/**
	 * 处理Anki同步
	 */
	private async handleAnkiSync(): Promise<void> {
		try {
			console.log('Anki同步功能 - 基础实现');
			// 注意：ToolbarManager 没有 modalManager 属性
			// 这个功能需要通过回调或事件系统来实现
			// 实际实现应该通过 UIComponentManager 来处理
		} catch (error) {
			console.error('Anki同步失败:', error);
			new Notice('Anki同步失败: ' + (error instanceof Error ? error.message : '未知错误'));
		}
	}

	/**
	 * 切换时间胶囊
	 */
	private toggleTimeCapsule(): void {
		console.log('切换时间胶囊');
		// 基础实现：切换时间胶囊状态
		// 实际实现应该由时间胶囊管理器处理
	}

	/**
	 * 执行搜索
	 */
	private performSearch(query: string): void {
		console.log('执行搜索:', query);
		// 基础实现：执行搜索操作
		// 实际实现应该由搜索管理器处理
	}

	/**
	 * 显示颜色筛选菜单
	 */
	private showColorFilterMenu(button: HTMLElement): void {
		console.log('显示颜色筛选菜单', button);
		// 基础实现：显示颜色筛选菜单
		// 实际实现应该由颜色筛选管理器处理
	}

	/**
	 * 显示排序菜单
	 */
	private showSortMenu(button: HTMLElement): void {
		console.log('显示排序菜单', button);
		// 基础实现：显示排序菜单
		// 实际实现应该由排序管理器处理
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<ToolbarConfig>): void {
		this.config = { ...this.config, ...config };
		
		// 重新渲染工具栏
		if (this.container) {
			this.container.empty();
			this.createToolbar(this.container);
		}
	}

	/**
	 * 销毁工具栏
	 */
	destroy(): void {
		if (this.container) {
			this.container.empty();
			this.container = null;
		}
	}
}

// 卡片渲染管理器
export class CardRendererManager {
	private app: App;
	private config: CardRenderConfig;

	constructor(app: App, config: CardRenderConfig) {
		this.app = app;
		this.config = config;
	}

	/**
	 * 渲染文本卡片
	 */
	renderTextCard(node: any, container: HTMLElement): HTMLElement {
		const card = container.createDiv('canvas-card text-card');
		
		// 卡片头部
		const header = card.createDiv('card-header');
		const typeIcon = header.createSpan('card-type-icon');
		SafeDOMUtils.setTextContent(typeIcon, '📝');
		const title = header.createSpan('card-title');
		SafeDOMUtils.setTextContent(title, '文本卡片');

		// 卡片内容
		const content = card.createDiv('card-content');
		const text = node.text || '';
		const preview = text.length > this.config.maxPreviewLength 
			? text.substring(0, this.config.maxPreviewLength) + '...'
			: text;
		
		content.createDiv('card-text').textContent = preview;

		// 卡片工具栏
		if (this.config.showMetadata) {
			this.addCardToolbar(card, node);
		}

		// 悬停效果
		if (this.config.enableHover) {
			this.addHoverEffects(card);
		}

		return card;
	}

	/**
	 * 渲染文件卡片
	 */
	renderFileCard(node: any, container: HTMLElement): HTMLElement {
		const card = container.createDiv('canvas-card file-card');
		
		// 卡片头部
		const header = card.createDiv('card-header');
		const typeIcon = header.createSpan('card-type-icon');
		SafeDOMUtils.setTextContent(typeIcon, '📄');

		const fileName = node.file || 'Unknown File';
		const title = header.createSpan('card-title');
		SafeDOMUtils.setTextContent(title, fileName);

		// 卡片内容
		const content = card.createDiv('card-content');
		content.createDiv('file-info').textContent = `文件: ${fileName}`;

		// 卡片工具栏
		if (this.config.showMetadata) {
			this.addCardToolbar(card, node);
		}

		// 悬停效果
		if (this.config.enableHover) {
			this.addHoverEffects(card);
		}

		return card;
	}

	/**
	 * 渲染链接卡片
	 */
	renderLinkCard(node: any, container: HTMLElement): HTMLElement {
		const card = container.createDiv('canvas-card link-card');
		
		// 卡片头部
		const header = card.createDiv('card-header');
		const typeIcon = header.createSpan('card-type-icon');
		SafeDOMUtils.setTextContent(typeIcon, '🔗');
		const title = header.createSpan('card-title');
		SafeDOMUtils.setTextContent(title, '链接卡片');

		// 卡片内容
		const content = card.createDiv('card-content');
		const url = node.url || '';
		content.createDiv('link-url').textContent = url;

		// 卡片工具栏
		if (this.config.showMetadata) {
			this.addCardToolbar(card, node);
		}

		// 悬停效果
		if (this.config.enableHover) {
			this.addHoverEffects(card);
		}

		return card;
	}

	/**
	 * 添加卡片工具栏
	 */
	private addCardToolbar(card: HTMLElement, node: any): void {
		const toolbar = card.createDiv('card-toolbar');
		
		// 编辑按钮
		const editBtn = toolbar.createEl('button', {
			cls: 'card-action-btn edit-btn',
			attr: { 'aria-label': '编辑' }
		});
		setIcon(editBtn, 'edit');
		editBtn.addEventListener('click', () => this.editCard(node));

		// 删除按钮
		const deleteBtn = toolbar.createEl('button', {
			cls: 'card-action-btn delete-btn',
			attr: { 'aria-label': '删除' }
		});
		setIcon(deleteBtn, 'trash');
		deleteBtn.addEventListener('click', () => this.deleteCard(node));

		// 复制按钮
		const copyBtn = toolbar.createEl('button', {
			cls: 'card-action-btn copy-btn',
			attr: { 'aria-label': '复制' }
		});
		setIcon(copyBtn, 'copy');
		copyBtn.addEventListener('click', () => this.copyCard(node));
	}

	/**
	 * 添加悬停效果
	 */
	private addHoverEffects(card: HTMLElement): void {
		card.addEventListener('mouseenter', () => {
			card.addClass('card-hover');
		});

		card.addEventListener('mouseleave', () => {
			card.removeClass('card-hover');
		});
	}

	/**
	 * 编辑卡片
	 */
	private editCard(node: any): void {
		console.log('编辑卡片:', node);
		// 基础实现：编辑卡片
		// 实际实现应该由卡片编辑管理器处理
	}

	/**
	 * 删除卡片
	 */
	private deleteCard(node: any): void {
		console.log('删除卡片:', node);
		// 基础实现：删除卡片
		// 实际实现应该由卡片管理器处理
	}

	/**
	 * 复制卡片
	 */
	private copyCard(node: any): void {
		console.log('复制卡片:', node);
		// 基础实现：复制卡片
		// 实际实现应该由卡片管理器处理
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<CardRenderConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

// 模态窗类型枚举
export enum ModalType {
	NEW_CARD = 'new-card',
	EDIT_CARD = 'edit-card',
	CONFIRM_DIALOG = 'confirm-dialog',
	SETTINGS = 'settings',
	HELP = 'help',
	ANKI_SYNC = 'anki-sync',
	ANKI_SETTINGS = 'anki-settings',
	ANKI_PROGRESS = 'anki-progress'
}

// 模态窗选项接口
export interface ModalOptions {
	title?: string;
	content?: string;
	data?: any;
	onConfirm?: (result: any) => void;
	onCancel?: () => void;
	width?: string;
	height?: string;
}

// 模态窗管理器
export class ModalManager {
	private app: App;
	private config: ModalConfig;
	private activeModals: Map<string, Modal> = new Map();

	constructor(app: App, config: ModalConfig) {
		this.app = app;
		this.config = config;
	}

	/**
	 * 显示模态窗
	 */
	async showModal(type: ModalType, options: ModalOptions = {}): Promise<any> {
		return new Promise((resolve, reject) => {
			let modal: Modal;

			switch (type) {
				case ModalType.NEW_CARD:
					modal = this.createNewCardModal(options, resolve, reject);
					break;
				case ModalType.EDIT_CARD:
					modal = this.createEditCardModal(options, resolve, reject);
					break;
				case ModalType.CONFIRM_DIALOG:
					modal = this.createConfirmDialog(options, resolve, reject);
					break;
				case ModalType.SETTINGS:
					modal = this.createSettingsModal(options, resolve, reject);
					break;
				case ModalType.HELP:
					modal = this.createHelpModal(options, resolve, reject);
					break;
				case ModalType.ANKI_SYNC:
					modal = this.createAnkiSyncModal(options, resolve, reject);
					break;
				case ModalType.ANKI_SETTINGS:
					modal = this.createAnkiSettingsModal(options, resolve, reject);
					break;
				case ModalType.ANKI_PROGRESS:
					modal = this.createAnkiProgressModal(options, resolve, reject);
					break;
				default:
					reject(new Error(`不支持的模态窗类型: ${type}`));
					return;
			}

			// 存储活动模态窗
			const modalId = `${type}-${Date.now()}`;
			this.activeModals.set(modalId, modal);

			// 模态窗关闭时清理
			const originalClose = modal.close.bind(modal);
			modal.close = () => {
				this.activeModals.delete(modalId);
				originalClose();
			};

			modal.open();
		});
	}

	/**
	 * 创建新建卡片模态窗
	 */
	private createNewCardModal(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				contentEl.createEl('h2', { text: options.title || '新建卡片' });

				// 卡片类型选择
				const typeContainer = contentEl.createDiv('card-type-selection');
				typeContainer.createEl('label', { text: '卡片类型:' });

				const typeSelect = typeContainer.createEl('select');
				typeSelect.createEl('option', { value: 'text', text: '文本卡片' });
				typeSelect.createEl('option', { value: 'file', text: '文件卡片' });
				typeSelect.createEl('option', { value: 'link', text: '链接卡片' });

				// 内容输入
				const contentContainer = contentEl.createDiv('card-content-input');
				contentContainer.createEl('label', { text: '内容:' });

				const contentInput = contentContainer.createEl('textarea', {
					attr: {
						placeholder: '请输入卡片内容...',
						rows: '6'
					}
				});

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');

				const confirmBtn = buttonContainer.createEl('button', {
					cls: 'mod-cta',
					text: '创建'
				});

				const cancelBtn = buttonContainer.createEl('button', {
					text: '取消'
				});

				// 事件处理
				confirmBtn.addEventListener('click', () => {
					const result = {
						type: typeSelect.value,
						content: contentInput.value.trim()
					};

					if (!result.content) {
						new Notice('请输入卡片内容');
						return;
					}

					resolve(result);
					this.close();
				});

				cancelBtn.addEventListener('click', () => {
					reject(new Error('用户取消'));
					this.close();
				});

				// 焦点设置
				contentInput.focus();
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 创建编辑卡片模态窗
	 */
	private createEditCardModal(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				contentEl.createEl('h2', { text: options.title || '编辑卡片' });

				// 预填充数据
				const cardData = options.data || {};

				// 内容输入
				const contentContainer = contentEl.createDiv('card-content-input');
				contentContainer.createEl('label', { text: '内容:' });

				const contentInput = contentContainer.createEl('textarea', {
					attr: {
						rows: '6'
					}
				});
				contentInput.value = cardData.content || '';

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');

				const saveBtn = buttonContainer.createEl('button', {
					cls: 'mod-cta',
					text: '保存'
				});

				const cancelBtn = buttonContainer.createEl('button', {
					text: '取消'
				});

				// 事件处理
				saveBtn.addEventListener('click', () => {
					const result = {
						...cardData,
						content: contentInput.value.trim()
					};

					if (!result.content) {
						new Notice('请输入卡片内容');
						return;
					}

					resolve(result);
					this.close();
				});

				cancelBtn.addEventListener('click', () => {
					reject(new Error('用户取消'));
					this.close();
				});

				// 焦点设置
				contentInput.focus();
				contentInput.select();
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 创建确认对话框
	 */
	private createConfirmDialog(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				contentEl.createEl('h2', { text: options.title || '确认操作' });

				// 消息内容
				const messageEl = contentEl.createDiv('confirm-message');
				messageEl.textContent = options.content || '确定要执行此操作吗？';

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');

				const confirmBtn = buttonContainer.createEl('button', {
					cls: 'mod-warning',
					text: '确认'
				});

				const cancelBtn = buttonContainer.createEl('button', {
					text: '取消'
				});

				// 事件处理
				confirmBtn.addEventListener('click', () => {
					resolve(true);
					this.close();
				});

				cancelBtn.addEventListener('click', () => {
					resolve(false);
					this.close();
				});

				// 焦点设置
				cancelBtn.focus();
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 创建设置模态窗
	 */
	private createSettingsModal(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				contentEl.createEl('h2', { text: options.title || '设置' });

				// 基础设置界面
				const placeholder = contentEl.createDiv('settings-placeholder');
				placeholder.textContent = '设置界面 - 基础实现';

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');

				const closeBtn = buttonContainer.createEl('button', {
					cls: 'mod-cta',
					text: '关闭'
				});

				closeBtn.addEventListener('click', () => {
					resolve(null);
					this.close();
				});
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 创建帮助模态窗
	 */
	private createHelpModal(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				contentEl.createEl('h2', { text: options.title || '帮助' });

				// 帮助内容
				const helpContent = contentEl.createDiv('help-content');

				// 创建标题
				const title = helpContent.createEl('h3');
				SafeDOMUtils.setTextContent(title, 'Canvasgrid Transit 使用指南');

				// 创建使用指南列表
				const guideItems = [
					'拖拽文本到界面创建卡片',
					'使用搜索框查找卡片',
					'点击颜色筛选器按颜色过滤',
					'使用排序选项重新排列卡片'
				];
				const guideList = SafeDOMUtils.createList(guideItems, false);
				helpContent.appendChild(guideList);

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');

				const closeBtn = buttonContainer.createEl('button', {
					cls: 'mod-cta',
					text: '关闭'
				});

				closeBtn.addEventListener('click', () => {
					resolve(null);
					this.close();
				});
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 创建Anki同步模态窗
	 */
	private createAnkiSyncModal(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			private colorFilterEnabled: boolean = true;
			private selectedColors: string[] = options.data?.selectedColors || ['1', '2', '4'];
			private colorGrid: HTMLElement | null = null;
			private statsSection: HTMLElement | null = null;

			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				// 标题
				contentEl.createEl('h2', { text: options.title || 'Anki同步' });

				// 同步选项容器
				const syncOptions = contentEl.createDiv('anki-sync-options');
				syncOptions.style.cssText = `
					display: flex;
					flex-direction: column;
					gap: 20px;
					margin: 20px 0;
				`;

				// 同步模式说明
				const modeDescription = syncOptions.createDiv('sync-mode-description');
				modeDescription.style.cssText = `
					padding: 12px;
					background: var(--background-secondary);
					border-radius: 6px;
					border: 1px solid var(--background-modifier-border);
					margin-bottom: 16px;
				`;

				const modeTitle = modeDescription.createEl('h4', {
					text: '同步模式',
					cls: 'anki-section-title'
				});
				modeTitle.style.cssText = `
					margin: 0 0 8px 0;
					font-size: 14px;
					font-weight: 600;
					color: var(--text-normal);
				`;

				const modeText = modeDescription.createEl('div', {
					text: this.colorFilterEnabled ? '当前模式：颜色筛选同步 - 只同步选定颜色的卡片' : '当前模式：全量同步 - 同步Canvas中的所有卡片',
					cls: 'mode-description-text'
				});
				modeText.style.cssText = `
					font-size: 13px;
					color: var(--text-muted);
					line-height: 1.4;
				`;

				// 颜色选择区域
				const colorSection = syncOptions.createDiv('color-selection');
				colorSection.createEl('h4', {
					text: '选择要同步的颜色:',
					cls: 'anki-section-title'
				});

				this.colorGrid = colorSection.createDiv('anki-color-sync-grid-simplified');
				this.renderColorOptions();

				// 同步统计
				this.statsSection = syncOptions.createDiv('sync-stats');
				this.updateStats();

				// 注意：这里的事件监听器需要实际的DOM元素
				// 当前代码中缺少 filterToggleCheckbox 和 filterToggleDesc 的定义
				// 这是一个需要修复的代码片段
				console.log('颜色筛选功能需要完整实现');

				// 初始状态设置
				if (!this.colorFilterEnabled) {
					colorSection.style.display = 'none';
				}

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');
				buttonContainer.style.cssText = `
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: 12px;
					margin-top: 20px;
					padding-top: 16px;
					border-top: 1px solid var(--background-modifier-border);
				`;

				// 左侧配置按钮
				const configBtn = buttonContainer.createEl('button', {
					cls: 'toolbar-button',
					text: '⚙️ 配置'
				});
				configBtn.onclick = () => {
					// 基础Anki配置界面
					new Notice('Anki配置功能 - 基础实现');
				};

				// 中间颜色筛选开关
				const filterSwitchContainer = buttonContainer.createDiv('filter-switch-container');
				filterSwitchContainer.style.cssText = `
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 8px 12px;
					background: var(--background-secondary);
					border-radius: 6px;
					border: 1px solid var(--background-modifier-border);
				`;

				const filterSwitchCheckbox = filterSwitchContainer.createEl('input', {
					type: 'checkbox',
					cls: 'filter-switch-checkbox'
				}) as HTMLInputElement;
				filterSwitchCheckbox.checked = this.colorFilterEnabled;
				filterSwitchCheckbox.style.cssText = `
					width: 16px;
					height: 16px;
					accent-color: var(--interactive-accent);
					cursor: pointer;
				`;

				const filterSwitchLabel = filterSwitchContainer.createEl('span', {
					text: '启用颜色筛选',
					cls: 'filter-switch-label'
				});
				filterSwitchLabel.style.cssText = `
					font-size: 13px;
					color: var(--text-normal);
					cursor: pointer;
					user-select: none;
				`;

				// 开关事件监听
				const toggleFilter = () => {
					this.colorFilterEnabled = filterSwitchCheckbox.checked;
					filterSwitchLabel.textContent = this.colorFilterEnabled ? '启用颜色筛选' : '同步所有卡片';

					// 更新模式说明文本
					modeText.textContent = this.colorFilterEnabled ?
						'当前模式：颜色筛选同步 - 只同步选定颜色的卡片' :
						'当前模式：全量同步 - 同步Canvas中的所有卡片';

					// 显示/隐藏颜色选择区域
					if (this.colorFilterEnabled) {
						colorSection.style.display = 'block';
					} else {
						colorSection.style.display = 'none';
					}

					this.updateStats();
				};

				filterSwitchCheckbox.addEventListener('change', toggleFilter);
				filterSwitchLabel.addEventListener('click', () => {
					filterSwitchCheckbox.checked = !filterSwitchCheckbox.checked;
					toggleFilter();
				});

				// 右侧操作按钮
				const actionButtons = buttonContainer.createDiv('action-buttons');
				actionButtons.style.cssText = `
					display: flex;
					gap: 12px;
				`;

				const cancelBtn = actionButtons.createEl('button', {
					cls: 'mod-cancel',
					text: '取消'
				});
				cancelBtn.onclick = () => {
					this.close();
					resolve({ action: 'cancel' });
				};

				const syncBtn = actionButtons.createEl('button', {
					cls: 'mod-cta',
					text: '开始同步'
				});
				syncBtn.onclick = () => {
					this.close();
					resolve({
						action: 'sync',
						data: {
							...options.data,
							colorFilterEnabled: this.colorFilterEnabled,
							selectedColors: this.colorFilterEnabled ? this.selectedColors : []
						}
					});
				};
			}

			private renderColorOptions() {
				if (!this.colorGrid) return;

				this.colorGrid.empty();

				const colors = [
					{ id: '1', name: '红色', desc: '重要内容', color: '#ff6b6b' },
					{ id: '2', name: '橙色', desc: '待办事项', color: '#ffa726' },
					{ id: '3', name: '黄色', desc: '提醒事项', color: '#ffeb3b' },
					{ id: '4', name: '绿色', desc: '已完成', color: '#66bb6a' },
					{ id: '5', name: '青色', desc: '进行中', color: '#26c6da' },
					{ id: '6', name: '蓝色', desc: '信息资料', color: '#42a5f5' },
					{ id: '7', name: '紫色', desc: '创意想法', color: '#ab47bc' }
				];

				colors.forEach(color => {
					const colorItem = this.colorGrid!.createDiv('anki-color-item-simplified');
					const isSelected = this.selectedColors.includes(color.id);

					if (isSelected) {
						colorItem.classList.add('selected');
					}

					const colorDot = colorItem.createDiv('anki-color-dot');
					colorDot.style.backgroundColor = color.color;
					if (isSelected) {
						colorDot.style.borderColor = 'var(--interactive-accent)';
						colorDot.style.borderWidth = '3px';
					}

					const colorInfo = colorItem.createDiv('anki-color-info');
					colorInfo.createEl('div', {
						text: color.name,
						cls: 'anki-color-name'
					});
					colorInfo.createEl('div', {
						text: color.desc,
						cls: 'anki-color-desc'
					});

					const colorCheck = colorItem.createDiv('anki-color-check');
					colorCheck.textContent = isSelected ? '✓' : '';
					colorCheck.style.color = isSelected ? 'var(--interactive-accent)' : 'transparent';

					colorItem.addEventListener('click', () => {
						const index = this.selectedColors.indexOf(color.id);
						if (index > -1) {
							this.selectedColors.splice(index, 1);
						} else {
							this.selectedColors.push(color.id);
						}
						this.renderColorOptions();
						this.updateStats();
					});
				});
			}

			private updateStats() {
				if (!this.statsSection) return;

				const totalCards = options.data?.totalCards || 0;
				const selectedColorsCount = this.colorFilterEnabled ? this.selectedColors.length : 0;
				const estimatedCards = this.colorFilterEnabled ?
					Math.floor(totalCards * (selectedColorsCount / 7)) : totalCards;

				// 清空并重建统计信息
				this.statsSection.empty();

				// 创建标题
				const title = this.statsSection.createEl('h4');
				SafeDOMUtils.setTextContent(title, '同步统计:');
				SafeDOMUtils.addClasses(title, 'anki-stats-title');

				// 创建统计容器
				const statsContainer = this.statsSection.createDiv('anki-stats-container');

				// 同步模式
				const modeRow = statsContainer.createDiv('anki-stats-row');
				const modeLabel = modeRow.createSpan('anki-stats-label');
				SafeDOMUtils.setTextContent(modeLabel, '同步模式:');
				const modeValue = modeRow.createSpan('anki-stats-value');
				SafeDOMUtils.setTextContent(modeValue, this.colorFilterEnabled ? '颜色筛选' : '全量同步');

				// 总卡片数
				const totalRow = statsContainer.createDiv('anki-stats-row');
				const totalLabel = totalRow.createSpan('anki-stats-label');
				SafeDOMUtils.setTextContent(totalLabel, '总卡片数:');
				const totalValue = totalRow.createSpan('anki-stats-value');
				SafeDOMUtils.setTextContent(totalValue, totalCards.toString());

				// 根据模式显示不同信息
				if (this.colorFilterEnabled) {
					// 已选颜色
					const colorRow = statsContainer.createDiv('anki-stats-row');
					const colorLabel = colorRow.createSpan('anki-stats-label');
					SafeDOMUtils.setTextContent(colorLabel, '已选颜色:');
					const colorValue = colorRow.createSpan('anki-stats-value anki-stats-accent');
					SafeDOMUtils.setTextContent(colorValue, `${selectedColorsCount}/7`);

					// 预计同步
					const estimateRow = statsContainer.createDiv('anki-stats-row');
					const estimateLabel = estimateRow.createSpan('anki-stats-label');
					SafeDOMUtils.setTextContent(estimateLabel, '预计同步:');
					const estimateValue = estimateRow.createSpan('anki-stats-value anki-stats-success');
					SafeDOMUtils.setTextContent(estimateValue, `${estimatedCards} 张卡片`);
				} else {
					// 将同步
					const syncRow = statsContainer.createDiv('anki-stats-row');
					const syncLabel = syncRow.createSpan('anki-stats-label');
					SafeDOMUtils.setTextContent(syncLabel, '将同步:');
					const syncValue = syncRow.createSpan('anki-stats-value anki-stats-success');
					SafeDOMUtils.setTextContent(syncValue, `所有 ${totalCards} 张卡片`);
				}
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 创建Anki设置模态窗
	 */
	private createAnkiSettingsModal(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				// 标题
				contentEl.createEl('h2', { text: options.title || 'Anki Connect设置' });

				// 设置表单
				const settingsForm = contentEl.createDiv('anki-settings-form');
				settingsForm.style.cssText = `
					display: flex;
					flex-direction: column;
					gap: 16px;
					margin: 20px 0;
				`;

				// API URL设置
				const urlSection = settingsForm.createDiv('setting-item');
				urlSection.createEl('label', { text: 'Anki Connect URL:' });
				const urlInput = urlSection.createEl('input', {
					type: 'text',
					value: options.data?.apiUrl || 'http://localhost:8765',
					placeholder: 'http://localhost:8765'
				});

				// 默认牌组设置
				const deckSection = settingsForm.createDiv('setting-item');
				deckSection.createEl('label', { text: '默认牌组:' });
				const deckInput = deckSection.createEl('input', {
					type: 'text',
					value: options.data?.defaultDeck || 'Default',
					placeholder: 'Default'
				});

				// 连接测试
				const testSection = settingsForm.createDiv('test-section');
				const testBtn = testSection.createEl('button', {
					cls: 'mod-secondary',
					text: '测试连接'
				});
				const testResult = testSection.createDiv('test-result');

				testBtn.onclick = async () => {
					testResult.textContent = '测试中...';
					// 这里会调用实际的连接测试逻辑
					setTimeout(() => {
						testResult.textContent = '连接成功！';
						testResult.style.color = 'var(--text-success)';
					}, 1000);
				};

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');
				buttonContainer.style.cssText = `
					display: flex;
					justify-content: flex-end;
					gap: 12px;
					margin-top: 20px;
				`;

				const cancelBtn = buttonContainer.createEl('button', {
					cls: 'mod-cancel',
					text: '取消'
				});
				cancelBtn.onclick = () => {
					this.close();
					resolve({ action: 'cancel' });
				};

				const saveBtn = buttonContainer.createEl('button', {
					cls: 'mod-cta',
					text: '保存'
				});
				saveBtn.onclick = () => {
					const settings = {
						apiUrl: urlInput.value,
						defaultDeck: deckInput.value
					};
					this.close();
					resolve({ action: 'save', data: settings });
				};
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 创建Anki同步进度模态窗
	 */
	private createAnkiProgressModal(options: ModalOptions, resolve: Function, reject: Function): Modal {
		return new class extends Modal {
			private progressBar: HTMLElement | null = null;
			private statusText: HTMLElement | null = null;
			private progressPercent: HTMLElement | null = null;

			constructor(app: App) {
				super(app);
			}

			onOpen() {
				const { contentEl } = this;
				contentEl.empty();

				// 标题
				contentEl.createEl('h2', { text: options.title || 'Anki同步进度' });

				// 进度容器
				const progressContainer = contentEl.createDiv('progress-container');
				progressContainer.style.cssText = `
					margin: 20px 0;
					text-align: center;
				`;

				// 进度条
				const progressWrapper = progressContainer.createDiv('progress-wrapper');
				progressWrapper.style.cssText = `
					background: var(--background-secondary);
					border-radius: 10px;
					height: 20px;
					margin: 16px 0;
					overflow: hidden;
				`;

				this.progressBar = progressWrapper.createDiv('progress-bar');
				this.progressBar.style.cssText = `
					background: var(--interactive-accent);
					height: 100%;
					width: 0%;
					transition: width 0.3s ease;
				`;

				// 进度百分比
				this.progressPercent = progressContainer.createDiv('progress-percent');
				this.progressPercent.textContent = '0%';
				this.progressPercent.style.cssText = `
					font-size: 18px;
					font-weight: 600;
					margin-bottom: 8px;
				`;

				// 状态文本
				this.statusText = progressContainer.createDiv('status-text');
				this.statusText.textContent = '准备开始同步...';
				this.statusText.style.cssText = `
					color: var(--text-muted);
					font-size: 14px;
				`;

				// 详细信息
				const detailsContainer = contentEl.createDiv('sync-details');
				detailsContainer.style.cssText = `
					background: var(--background-secondary);
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
					font-family: monospace;
					font-size: 12px;
					max-height: 200px;
					overflow-y: auto;
				`;

				// 按钮组
				const buttonContainer = contentEl.createDiv('modal-buttons');
				buttonContainer.style.cssText = `
					display: flex;
					justify-content: flex-end;
					gap: 12px;
					margin-top: 20px;
				`;

				const cancelBtn = buttonContainer.createEl('button', {
					cls: 'mod-cancel',
					text: '取消'
				});
				cancelBtn.onclick = () => {
					this.close();
					resolve({ action: 'cancel' });
				};

				// 如果同步完成，显示完成按钮
				if (options.data?.completed) {
					const doneBtn = buttonContainer.createEl('button', {
						cls: 'mod-cta',
						text: '完成'
					});
					doneBtn.onclick = () => {
						this.close();
						resolve({ action: 'done' });
					};
				}
			}

			// 更新进度的方法
			updateProgress(percent: number, status: string) {
				if (this.progressBar) {
					this.progressBar.style.width = `${percent}%`;
				}
				if (this.progressPercent) {
					this.progressPercent.textContent = `${percent}%`;
				}
				if (this.statusText) {
					this.statusText.textContent = status;
				}
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
			}
		}(this.app);
	}

	/**
	 * 关闭所有模态窗
	 */
	closeAllModals(): void {
		this.activeModals.forEach(modal => modal.close());
		this.activeModals.clear();
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<ModalConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

// UI组件管理器主类
export class UIComponentManager {
	private app: App;
	private config: UIComponentConfig;
	private toolbarManager: ToolbarManager;
	private cardRenderer: CardRendererManager;
	private modalManager: ModalManager;

	constructor(app: App, config: UIComponentConfig) {
		this.app = app;
		this.config = config;

		// 初始化子管理器
		this.toolbarManager = new ToolbarManager(app, {
			showMainMenu: true,
			showSearch: true,
			showTimeCapsule: true,
			showColorFilter: true,
			showSortOptions: true
		});

		this.cardRenderer = new CardRendererManager(app, {
			maxPreviewLength: 200,
			showMetadata: true,
			enableHover: true,
			cardSpacing: 16,
			borderRadius: 8
		});

		this.modalManager = new ModalManager(app, {
			width: '600px',
			height: '400px',
			backdrop: true,
			closeOnEscape: true,
			animation: true
		});
	}

	/**
	 * 创建工具栏
	 */
	createToolbar(container: HTMLElement): HTMLElement {
		return this.toolbarManager.createToolbar(container);
	}

	/**
	 * 渲染卡片
	 */
	renderCard(node: any, container: HTMLElement): HTMLElement {
		const nodeType = this.detectNodeType(node);

		switch (nodeType) {
			case 'text':
				return this.cardRenderer.renderTextCard(node, container);
			case 'file':
				return this.cardRenderer.renderFileCard(node, container);
			case 'link':
				return this.cardRenderer.renderLinkCard(node, container);
			default:
				return this.cardRenderer.renderTextCard(node, container);
		}
	}

	/**
	 * 显示模态窗
	 */
	async showModal(type: ModalType, options: ModalOptions = {}): Promise<any> {
		return this.modalManager.showModal(type, options);
	}

	/**
	 * 检测节点类型
	 */
	private detectNodeType(node: any): string {
		if (node.file) {
			return 'file';
		} else if (node.url) {
			return 'link';
		} else {
			return 'text';
		}
	}

	/**
	 * 更新工具栏配置
	 */
	updateToolbarConfig(config: Partial<ToolbarConfig>): void {
		this.toolbarManager.updateConfig(config);
	}

	/**
	 * 更新卡片渲染配置
	 */
	updateCardRenderConfig(config: Partial<CardRenderConfig>): void {
		this.cardRenderer.updateConfig(config);
	}

	/**
	 * 更新模态窗配置
	 */
	updateModalConfig(config: Partial<ModalConfig>): void {
		this.modalManager.updateConfig(config);
	}

	/**
	 * 更新主配置
	 */
	updateConfig(config: Partial<UIComponentConfig>): void {
		this.config = { ...this.config, ...config };

		// 应用主题变更
		if (config.theme) {
			this.applyTheme(config.theme);
		}

		// 应用语言变更
		if (config.language) {
			this.applyLanguage(config.language);
		}
	}

	/**
	 * 应用主题
	 */
	private applyTheme(theme: 'auto' | 'light' | 'dark'): void {
		const body = document.body;

		// 移除现有主题类
		body.removeClass('canvas-grid-theme-light', 'canvas-grid-theme-dark');

		if (theme === 'light') {
			body.addClass('canvas-grid-theme-light');
		} else if (theme === 'dark') {
			body.addClass('canvas-grid-theme-dark');
		}
		// auto 模式不添加额外类，使用 Obsidian 默认主题
	}

	/**
	 * 应用语言设置
	 */
	private applyLanguage(language: 'zh' | 'en'): void {
		// 语言切换逻辑将在国际化模块中实现
		console.log('切换语言到:', language);
	}

	/**
	 * 获取工具栏管理器
	 */
	getToolbarManager(): ToolbarManager {
		return this.toolbarManager;
	}

	/**
	 * 获取卡片渲染管理器
	 */
	getCardRenderer(): CardRendererManager {
		return this.cardRenderer;
	}

	/**
	 * 获取模态窗管理器
	 */
	getModalManager(): ModalManager {
		return this.modalManager;
	}

	/**
	 * 销毁所有组件
	 */
	destroy(): void {
		this.toolbarManager.destroy();
		this.modalManager.closeAllModals();

		// 清理主题类
		document.body.removeClass('canvas-grid-theme-light', 'canvas-grid-theme-dark');
	}

	/**
	 * 验证配置
	 */
	validateConfig(config: UIComponentConfig): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!['auto', 'light', 'dark'].includes(config.theme)) {
			errors.push(`无效的主题设置: ${config.theme}`);
		}

		if (!['zh', 'en'].includes(config.language)) {
			errors.push(`无效的语言设置: ${config.language}`);
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}
}
