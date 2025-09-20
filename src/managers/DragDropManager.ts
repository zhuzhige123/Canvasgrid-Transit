import { App, TFile, Notice } from 'obsidian';

// 拖拽配置接口
export interface DragDropConfig {
	enableDragToCreate: boolean;
	enableDragToReorder: boolean;
	enableDropFromExternal: boolean;
	enableDropToCanvas: boolean;
	dragThreshold: number;
	dropZoneHighlight: boolean;
	autoScroll: boolean;
	dragPreview: boolean;
}

// 拖拽数据接口
export interface DragData {
	type: 'text' | 'file' | 'url' | 'canvas-node';
	content: string;
	sourceFile?: TFile;
	sourcePosition?: {
		line: number;
		ch: number;
		endLine?: number;
		endCh?: number;
		selection?: any;
	};
	metadata?: {
		[key: string]: any;
	};

}

// 拖拽事件接口
export interface DragEvent {
	type: 'dragstart' | 'dragover' | 'dragenter' | 'dragleave' | 'drop' | 'dragend';
	data: DragData;
	target: HTMLElement;
	position: {
		x: number;
		y: number;
	};
	originalEvent: Event;
}

// 拖拽结果接口
export interface DragResult {
	success: boolean;
	action: 'create' | 'move' | 'copy' | 'link';
	data?: any;
	error?: string;
}

// 拖拽策略接口
export interface DragDropStrategy {
	name: string;
	canHandle(dragData: DragData): boolean;
	handleDrop(dragData: DragData, dropTarget: HTMLElement, position: { x: number; y: number }): Promise<DragResult>;
	createPreview?(dragData: DragData): HTMLElement;
}

// 文本拖拽策略
export class TextDragStrategy implements DragDropStrategy {
	name = 'text';
	private app: App;
	private onCreateCard?: (data: any) => Promise<void>;

	constructor(app: App, onCreateCard?: (data: any) => Promise<void>) {
		this.app = app;
		this.onCreateCard = onCreateCard;
	}

	canHandle(dragData: DragData): boolean {
		return dragData.type === 'text' && dragData.content.trim().length > 0;
	}

	async handleDrop(dragData: DragData, dropTarget: HTMLElement, position: { x: number; y: number }): Promise<DragResult> {
		try {
			// 创建文本卡片
			const cardData = {
				type: 'text',
				content: dragData.content.trim(),
				position,
				sourceFile: dragData.sourceFile,
				sourcePosition: dragData.sourcePosition,
				metadata: dragData.metadata
			};

			if (this.onCreateCard) {
				await this.onCreateCard(cardData);
			}

			return {
				success: true,
				action: 'create',
				data: cardData
			};
		} catch (error) {
			return {
				success: false,
				action: 'create',
				error: error instanceof Error ? error.message : '创建文本卡片失败'
			};
		}
	}

	createPreview(dragData: DragData): HTMLElement {
		const preview = document.createElement('div');
		preview.className = 'drag-preview text-preview';
		
		const content = dragData.content.length > 100 
			? dragData.content.substring(0, 100) + '...'
			: dragData.content;
		
		preview.innerHTML = `
			<div class="preview-header">
				<span class="preview-icon">📝</span>
				<span class="preview-title">文本卡片</span>
			</div>
			<div class="preview-content">${content}</div>
		`;
		
		return preview;
	}
}

// 文件拖拽策略
export class FileDragStrategy implements DragDropStrategy {
	name = 'file';
	private app: App;
	private onCreateCard?: (data: any) => Promise<void>;

	constructor(app: App, onCreateCard?: (data: any) => Promise<void>) {
		this.app = app;
		this.onCreateCard = onCreateCard;
	}

	canHandle(dragData: DragData): boolean {
		return dragData.type === 'file' && dragData.sourceFile != null;
	}

	async handleDrop(dragData: DragData, dropTarget: HTMLElement, position: { x: number; y: number }): Promise<DragResult> {
		try {
			// 创建文件卡片
			const cardData = {
				type: 'file',
				file: dragData.sourceFile?.path || dragData.content,
				position,
				metadata: dragData.metadata
			};

			if (this.onCreateCard) {
				await this.onCreateCard(cardData);
			}

			return {
				success: true,
				action: 'create',
				data: cardData
			};
		} catch (error) {
			return {
				success: false,
				action: 'create',
				error: error instanceof Error ? error.message : '创建文件卡片失败'
			};
		}
	}

	createPreview(dragData: DragData): HTMLElement {
		const preview = document.createElement('div');
		preview.className = 'drag-preview file-preview';
		
		const fileName = dragData.sourceFile?.name || dragData.content;
		
		preview.innerHTML = `
			<div class="preview-header">
				<span class="preview-icon">📄</span>
				<span class="preview-title">文件卡片</span>
			</div>
			<div class="preview-content">${fileName}</div>
		`;
		
		return preview;
	}
}

// URL拖拽策略
export class URLDragStrategy implements DragDropStrategy {
	name = 'url';
	private app: App;
	private onCreateCard?: (data: any) => Promise<void>;

	constructor(app: App, onCreateCard?: (data: any) => Promise<void>) {
		this.app = app;
		this.onCreateCard = onCreateCard;
	}

	canHandle(dragData: DragData): boolean {
		return dragData.type === 'url' || this.isValidURL(dragData.content);
	}

	async handleDrop(dragData: DragData, dropTarget: HTMLElement, position: { x: number; y: number }): Promise<DragResult> {
		try {
			// 创建链接卡片
			const cardData = {
				type: 'link',
				url: dragData.content,
				position,
				metadata: dragData.metadata
			};

			if (this.onCreateCard) {
				await this.onCreateCard(cardData);
			}

			return {
				success: true,
				action: 'create',
				data: cardData
			};
		} catch (error) {
			return {
				success: false,
				action: 'create',
				error: error instanceof Error ? error.message : '创建链接卡片失败'
			};
		}
	}

	createPreview(dragData: DragData): HTMLElement {
		const preview = document.createElement('div');
		preview.className = 'drag-preview url-preview';
		
		preview.innerHTML = `
			<div class="preview-header">
				<span class="preview-icon">🔗</span>
				<span class="preview-title">链接卡片</span>
			</div>
			<div class="preview-content">${dragData.content}</div>
		`;
		
		return preview;
	}

	private isValidURL(text: string): boolean {
		try {
			new URL(text);
			return true;
		} catch {
			return false;
		}
	}
}

// 🔧 新增：浏览器拖拽策略
export class BrowserDragStrategy implements DragDropStrategy {
	name = 'browser';
	private app: App;
	private onCreateCard?: (data: any) => Promise<void>;

	constructor(app: App, onCreateCard?: (data: any) => Promise<void>) {
		this.app = app;
		this.onCreateCard = onCreateCard;
	}

	canHandle(dragData: DragData): boolean {
		// 检查是否为浏览器拖拽（包含HTML数据或特定元数据）
		return !!(dragData.metadata?.source === 'html-link' ||
				 dragData.metadata?.originalHTML ||
				 (dragData.type === 'url' && dragData.metadata?.originalText));
	}

	async handleDrop(dragData: DragData, dropTarget: HTMLElement, position: { x: number; y: number }): Promise<DragResult> {
		try {
			let content = '';
			let sourceUrl = '';

			if (dragData.type === 'url') {
				sourceUrl = dragData.content;
				// 如果有原始文本，使用原始文本作为内容
				if (dragData.metadata?.originalText) {
					content = dragData.metadata.originalText.trim();
					// 如果内容不是URL本身，添加来源链接
					if (content !== sourceUrl) {
						content += `\n\n📍 来源: ${sourceUrl}`;
					}
				} else {
					content = sourceUrl;
				}
			} else {
				content = dragData.content;
				if (dragData.metadata?.source === 'html-link') {
					// 从HTML中提取的链接，添加来源信息
					const originalHTML = dragData.metadata.originalHTML;
					if (originalHTML) {
						const urlMatch = originalHTML.match(/href=["']([^"']+)["']/);
						if (urlMatch) {
							sourceUrl = urlMatch[1];
							content += `\n\n📍 来源: ${sourceUrl}`;
						}
					}
				}
			}

			// 创建卡片数据
			const cardData = {
				type: sourceUrl ? 'link' : 'text',
				content: content,
				url: sourceUrl || undefined,
				position,
				metadata: {
					...dragData.metadata,
					source: 'browser-drag',
					hasSourceLink: !!sourceUrl,
					timestamp: Date.now()
				}
			};

			if (this.onCreateCard) {
				await this.onCreateCard(cardData);
			}

			return {
				success: true,
				action: 'create',
				data: cardData
			};
		} catch (error) {
			return {
				success: false,
				action: 'create',
				error: error instanceof Error ? error.message : '创建浏览器拖拽卡片失败'
			};
		}
	}

	createPreview(dragData: DragData): HTMLElement {
		const preview = document.createElement('div');
		preview.className = 'drag-preview browser-preview';

		const isLink = dragData.type === 'url' || dragData.metadata?.source === 'html-link';
		const content = dragData.metadata?.originalText || dragData.content;
		const sourceUrl = dragData.type === 'url' ? dragData.content :
						 (dragData.metadata?.originalHTML?.match(/href=["']([^"']+)["']/) || [])[1];

		preview.innerHTML = `
			<div class="preview-header">
				<span class="preview-icon">${isLink ? '🌐' : '📝'}</span>
				<span class="preview-title">${isLink ? '浏览器链接' : '浏览器内容'}</span>
			</div>
			<div class="preview-content">${content.length > 100 ? content.substring(0, 100) + '...' : content}</div>
			${sourceUrl ? `<div class="preview-source">来源: ${sourceUrl}</div>` : ''}
		`;

		return preview;
	}
}



// 拖拽管理器主类
export class DragDropManager {
	private app: App;
	private config: DragDropConfig;
	private strategies: Map<string, DragDropStrategy> = new Map();
	private currentDragData: DragData | null = null;
	private dragPreview: HTMLElement | null = null;
	private dropZones: Set<HTMLElement> = new Set();
	private isDragging = false;

	// 事件监听器
	private dragStartHandler = this.handleDragStart.bind(this);
	private dragOverHandler = this.handleDragOver.bind(this);
	private dragEnterHandler = this.handleDragEnter.bind(this);
	private dragLeaveHandler = this.handleDragLeave.bind(this);
	private dropHandler = this.handleDrop.bind(this);
	private dragEndHandler = this.handleDragEnd.bind(this);

	constructor(app: App, config: DragDropConfig) {
		this.app = app;
		this.config = config;
		this.initializeStrategies();
		this.setupEventListeners();
	}

	/**
	 * 初始化拖拽策略
	 */
	private initializeStrategies(): void {
		this.strategies.set('text', new TextDragStrategy(this.app));
		this.strategies.set('file', new FileDragStrategy(this.app));
		this.strategies.set('url', new URLDragStrategy(this.app));
		// 🔧 新增：注册浏览器拖拽策略
		this.strategies.set('browser', new BrowserDragStrategy(this.app));
	}

	/**
	 * 设置事件监听器
	 */
	private setupEventListeners(): void {
		if (this.config.enableDragToCreate || this.config.enableDropFromExternal) {
			document.addEventListener('dragstart', this.dragStartHandler);
			document.addEventListener('dragover', this.dragOverHandler);
			document.addEventListener('dragenter', this.dragEnterHandler);
			document.addEventListener('dragleave', this.dragLeaveHandler);
			document.addEventListener('drop', this.dropHandler);
			document.addEventListener('dragend', this.dragEndHandler);
		}
	}

	/**
	 * 注册拖拽策略
	 */
	registerStrategy(strategy: DragDropStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * 注册放置区域
	 */
	registerDropZone(element: HTMLElement, type: 'grid' = 'grid'): void {
		this.dropZones.add(element);
		element.classList.add('canvas-grid-drop-zone');
		element.dataset.dropZoneType = type;
	}



	/**
	 * 取消注册放置区域
	 */
	unregisterDropZone(element: HTMLElement): void {
		this.dropZones.delete(element);
		element.classList.remove('canvas-grid-drop-zone', 'drop-zone-active');
		delete element.dataset.dropZoneType;
	}

	/**
	 * 处理拖拽开始
	 */
	private handleDragStart(event: Event): void {
		const dragEvent = event as globalThis.DragEvent;
		
		if (!this.config.enableDragToCreate) return;

		// 提取拖拽数据
		this.currentDragData = this.extractDragData(dragEvent);
		
		if (this.currentDragData) {
			this.isDragging = true;
			
			// 创建拖拽预览
			if (this.config.dragPreview) {
				this.createDragPreview(this.currentDragData);
			}
			
			// 高亮放置区域
			if (this.config.dropZoneHighlight) {
				this.highlightDropZones(true);
			}
		}
	}

	/**
	 * 处理拖拽悬停
	 */
	private handleDragOver(event: Event): void {
		const dragEvent = event as globalThis.DragEvent;
		
		if (!this.isDragging) return;
		
		event.preventDefault();
		
		// 更新拖拽预览位置
		if (this.dragPreview) {
			this.updateDragPreviewPosition(dragEvent.clientX, dragEvent.clientY);
		}
		
		// 自动滚动
		if (this.config.autoScroll) {
			this.handleAutoScroll(dragEvent.clientX, dragEvent.clientY);
		}
	}

	/**
	 * 处理拖拽进入
	 */
	private handleDragEnter(event: Event): void {
		const target = event.target as HTMLElement;
		
		if (this.isValidDropTarget(target)) {
			target.classList.add('drop-zone-active');
		}
	}

	/**
	 * 处理拖拽离开
	 */
	private handleDragLeave(event: Event): void {
		const target = event.target as HTMLElement;
		target.classList.remove('drop-zone-active');
	}

	/**
	 * 处理放置
	 */
	private async handleDrop(event: Event): Promise<void> {
		const dragEvent = event as globalThis.DragEvent;
		event.preventDefault();
		
		if (!this.isDragging || !this.currentDragData) return;
		
		const target = event.target as HTMLElement;
		
		if (!this.isValidDropTarget(target)) {
			new Notice('无效的放置目标');
			return;
		}
		
		// 获取放置位置
		const position = {
			x: dragEvent.clientX,
			y: dragEvent.clientY
		};
		
		// 查找合适的策略
		const strategy = this.findStrategy(this.currentDragData);
		
		if (strategy) {
			try {
				const result = await strategy.handleDrop(this.currentDragData, target, position);
				
				if (result.success) {
					new Notice('成功创建卡片');
				} else {
					new Notice(`创建失败: ${result.error}`);
				}
			} catch (error) {
				console.error('Drop handling error:', error);
				new Notice('处理拖拽失败');
			}
		} else {
			new Notice('不支持的拖拽类型');
		}
	}

	/**
	 * 处理拖拽结束
	 */
	private handleDragEnd(event: Event): void {
		this.isDragging = false;
		this.currentDragData = null;
		
		// 清理拖拽预览
		if (this.dragPreview) {
			this.dragPreview.remove();
			this.dragPreview = null;
		}
		
		// 取消高亮放置区域
		this.highlightDropZones(false);
		
		// 清理活动状态
		this.dropZones.forEach(zone => {
			zone.classList.remove('drop-zone-active');
		});
	}

	/**
	 * 提取拖拽数据
	 */
	private extractDragData(event: globalThis.DragEvent): DragData | null {
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) return null;

		// 🔧 修复：优先检查Obsidian特定的拖拽数据
		const obsidianText = dataTransfer.getData('application/obsidian-text');
		if (obsidianText) {
			return {
				type: 'text',
				content: obsidianText,
				metadata: {
					source: 'obsidian-editor',
					timestamp: Date.now()
				}
			};
		}

		// 🔧 修复：检查Obsidian文件拖拽
		const obsidianFile = dataTransfer.getData('application/obsidian-file');
		if (obsidianFile) {
			try {
				const fileData = JSON.parse(obsidianFile);
				return {
					type: 'file',
					content: fileData.path || fileData.name || obsidianFile,
					metadata: {
						source: 'obsidian-file',
						fileData: fileData,
						timestamp: Date.now()
					}
				};
			} catch (error) {
				// 如果解析失败，作为普通文本处理
				return {
					type: 'text',
					content: obsidianFile
				};
			}
		}

		// 尝试获取URL数据（优先于普通文本，因为URL更具体）
		const url = dataTransfer.getData('text/uri-list');
		if (url && this.isValidURL(url.trim())) {
			return {
				type: 'url',
				content: url.trim(),
				metadata: {
					source: 'external-url',
					timestamp: Date.now()
				}
			};
		}

		// 尝试获取HTML数据（可能包含链接信息）
		const html = dataTransfer.getData('text/html');
		if (html) {
			const urlMatch = html.match(/href=["']([^"']+)["']/);
			if (urlMatch && this.isValidURL(urlMatch[1])) {
				const textContent = this.extractTextFromHTML(html);
				return {
					type: 'url',
					content: urlMatch[1],
					metadata: {
						source: 'html-link',
						originalText: textContent,
						originalHTML: html,
						timestamp: Date.now()
					}
				};
			}
		}

		// 最后尝试获取普通文本数据
		const text = dataTransfer.getData('text/plain');
		if (text && text.trim()) {
			// 检查文本是否为URL
			if (this.isValidURL(text.trim())) {
				return {
					type: 'url',
					content: text.trim(),
					metadata: {
						source: 'text-url',
						timestamp: Date.now()
					}
				};
			}

			return {
				type: 'text',
				content: text.trim(),
				metadata: {
					source: 'external-text',
					timestamp: Date.now()
				}
			};
		}

		return null;
	}

	/**
	 * 🔧 新增：验证URL有效性
	 */
	private isValidURL(text: string): boolean {
		try {
			const url = new URL(text);
			return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'file:';
		} catch {
			return false;
		}
	}

	/**
	 * 🔧 新增：从HTML中提取文本内容
	 */
	private extractTextFromHTML(html: string): string {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = html;
		return tempDiv.textContent || tempDiv.innerText || '';
	}

	/**
	 * 查找合适的策略
	 */
	private findStrategy(dragData: DragData): DragDropStrategy | null {
		for (const strategy of this.strategies.values()) {
			if (strategy.canHandle(dragData)) {
				return strategy;
			}
		}
		return null;
	}

	/**
	 * 创建拖拽预览
	 */
	private createDragPreview(dragData: DragData): void {
		const strategy = this.findStrategy(dragData);
		
		if (strategy && strategy.createPreview) {
			this.dragPreview = strategy.createPreview(dragData);
			this.dragPreview.style.position = 'fixed';
			this.dragPreview.style.pointerEvents = 'none';
			this.dragPreview.style.zIndex = '10000';
			document.body.appendChild(this.dragPreview);
		}
	}

	/**
	 * 更新拖拽预览位置
	 */
	private updateDragPreviewPosition(x: number, y: number): void {
		if (this.dragPreview) {
			this.dragPreview.style.left = `${x + 10}px`;
			this.dragPreview.style.top = `${y + 10}px`;
		}
	}

	/**
	 * 高亮放置区域
	 */
	private highlightDropZones(highlight: boolean): void {
		this.dropZones.forEach(zone => {
			if (highlight) {
				zone.classList.add('drop-zone-highlighted');
			} else {
				zone.classList.remove('drop-zone-highlighted');
			}
		});
	}

	/**
	 * 检查是否为有效的放置目标
	 */
	private isValidDropTarget(target: HTMLElement): boolean {
		// 检查目标是否在注册的放置区域内
		for (const zone of this.dropZones) {
			if (zone.contains(target) || zone === target) {
				return true;
			}
		}

		// 🔧 修复：增加对网格容器子元素的检测
		const gridContainer = target.closest('.canvas-grid-container');
		if (gridContainer) {
			// 检查网格容器是否在注册的放置区域中
			for (const zone of this.dropZones) {
				if (zone.contains(gridContainer) || zone === gridContainer) {
					return true;
				}
			}
		}

		// 🔧 修复：增加对Canvas Grid视图的检测
		const canvasGridView = target.closest('.canvas-grid-view');
		if (canvasGridView) {
			return true;
		}

		// 🔧 修复：增加对特定可放置元素的检测
		const droppableElements = [
			'.canvas-grid-card',
			'.canvas-grid-empty-state',
			'.canvas-grid-main-content'
		];

		for (const selector of droppableElements) {
			if (target.matches(selector) || target.closest(selector)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * 处理自动滚动
	 */
	private handleAutoScroll(x: number, y: number): void {
		const scrollThreshold = 50;
		const scrollSpeed = 10;
		
		// 检查是否需要垂直滚动
		if (y < scrollThreshold) {
			window.scrollBy(0, -scrollSpeed);
		} else if (y > window.innerHeight - scrollThreshold) {
			window.scrollBy(0, scrollSpeed);
		}
		
		// 检查是否需要水平滚动
		if (x < scrollThreshold) {
			window.scrollBy(-scrollSpeed, 0);
		} else if (x > window.innerWidth - scrollThreshold) {
			window.scrollBy(scrollSpeed, 0);
		}
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<DragDropConfig>): void {
		this.config = { ...this.config, ...config };
		
		// 重新设置事件监听器
		this.removeEventListeners();
		this.setupEventListeners();
	}

	/**
	 * 移除事件监听器
	 */
	private removeEventListeners(): void {
		document.removeEventListener('dragstart', this.dragStartHandler);
		document.removeEventListener('dragover', this.dragOverHandler);
		document.removeEventListener('dragenter', this.dragEnterHandler);
		document.removeEventListener('dragleave', this.dragLeaveHandler);
		document.removeEventListener('drop', this.dropHandler);
		document.removeEventListener('dragend', this.dragEndHandler);
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		this.removeEventListeners();
		
		// 清理拖拽预览
		if (this.dragPreview) {
			this.dragPreview.remove();
			this.dragPreview = null;
		}
		
		// 清理放置区域
		this.dropZones.forEach(zone => {
			zone.classList.remove('canvas-grid-drop-zone', 'drop-zone-active', 'drop-zone-highlighted');
		});
		this.dropZones.clear();
		
		// 清理策略
		this.strategies.clear();
		
		this.isDragging = false;
		this.currentDragData = null;
	}
}
