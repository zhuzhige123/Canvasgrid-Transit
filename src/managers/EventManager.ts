import { CanvasNode } from './DataManager';

// 事件类型定义
export interface CardEvent {
	type: 'click' | 'doubleclick' | 'contextmenu' | 'edit' | 'delete';
	node: CanvasNode;
	card: HTMLElement;
	originalEvent?: Event;
}

export interface EventHandler {
	(event: CardEvent): void | Promise<void>;
}

// 事件总线
export class EventBus {
	private listeners: Map<string, EventHandler[]> = new Map();

	/**
	 * 注册事件监听器
	 */
	on(event: string, handler: EventHandler): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push(handler);
	}

	/**
	 * 移除事件监听器
	 */
	off(event: string, handler: EventHandler): void {
		const handlers = this.listeners.get(event);
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	}

	/**
	 * 触发事件
	 */
	async emit(event: string, data: CardEvent): Promise<void> {
		const handlers = this.listeners.get(event);
		if (handlers) {
			for (const handler of handlers) {
				try {
					await handler(data);
				} catch (error) {
					console.error(`Event handler error for ${event}:`, error);
				}
			}
		}
	}

	/**
	 * 清理所有监听器
	 */
	clear(): void {
		this.listeners.clear();
	}
}

// 上下文菜单管理器
export class ContextMenuManager {
	private currentMenu: HTMLElement | null = null;
	private eventBus: EventBus;

	constructor(eventBus: EventBus) {
		this.eventBus = eventBus;
		this.setupGlobalClickHandler();
	}

	/**
	 * 显示上下文菜单
	 */
	showContextMenu(card: HTMLElement, node: CanvasNode, x: number, y: number): void {
		this.hideContextMenu();

		const menu = this.createContextMenu(card, node);
		document.body.appendChild(menu);

		// 定位菜单
		this.positionMenu(menu, x, y);
		this.currentMenu = menu;
	}

	/**
	 * 隐藏上下文菜单
	 */
	hideContextMenu(): void {
		if (this.currentMenu) {
			this.currentMenu.remove();
			this.currentMenu = null;
		}
	}

	/**
	 * 创建上下文菜单
	 */
	private createContextMenu(card: HTMLElement, node: CanvasNode): HTMLElement {
		const menu = document.createElement('div');
		menu.className = 'canvas-grid-context-menu';

		// 编辑选项
		const editItem = this.createMenuItem('编辑', 'edit', () => {
			this.eventBus.emit('card-edit', {
				type: 'edit',
				node,
				card
			});
			this.hideContextMenu();
		});
		menu.appendChild(editItem);

		// 删除选项
		const deleteItem = this.createMenuItem('删除', 'delete', () => {
			this.eventBus.emit('card-delete', {
				type: 'delete',
				node,
				card
			});
			this.hideContextMenu();
		});
		menu.appendChild(deleteItem);

		return menu;
	}

	/**
	 * 创建菜单项
	 */
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

	/**
	 * 定位菜单
	 */
	private positionMenu(menu: HTMLElement, x: number, y: number): void {
		menu.style.position = 'fixed';
		menu.style.left = `${x}px`;
		menu.style.top = `${y}px`;
		menu.style.zIndex = '1000';

		// 确保菜单不超出屏幕边界
		const rect = menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		if (rect.right > viewportWidth) {
			menu.style.left = `${x - rect.width}px`;
		}

		if (rect.bottom > viewportHeight) {
			menu.style.top = `${y - rect.height}px`;
		}
	}

	/**
	 * 设置全局点击处理器
	 */
	private setupGlobalClickHandler(): void {
		document.addEventListener('click', (e) => {
			if (this.currentMenu && !this.currentMenu.contains(e.target as Node)) {
				this.hideContextMenu();
			}
		});
	}
}

// 事件管理器
export class EventManager {
	private eventBus: EventBus;
	private contextMenuManager: ContextMenuManager;
	private eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];

	constructor() {
		this.eventBus = new EventBus();
		this.contextMenuManager = new ContextMenuManager(this.eventBus);
	}

	/**
	 * 获取事件总线
	 */
	getEventBus(): EventBus {
		return this.eventBus;
	}

	/**
	 * 设置事件委托
	 */
	setupEventDelegation(container: HTMLElement): void {
		// 点击事件
		const clickHandler = this.createDelegatedHandler('click', (card, node, event) => {
			this.eventBus.emit('card-click', {
				type: 'click',
				node,
				card,
				originalEvent: event
			});
		});
		this.addEventListenerWithCleanup(container, 'click', clickHandler);

		// 双击事件
		const dblClickHandler = this.createDelegatedHandler('dblclick', (card, node, event) => {
			this.eventBus.emit('card-doubleclick', {
				type: 'doubleclick',
				node,
				card,
				originalEvent: event
			});
		});
		this.addEventListenerWithCleanup(container, 'dblclick', dblClickHandler);

		// 右键菜单事件
		const contextMenuHandler = this.createDelegatedHandler('contextmenu', (card, node, event) => {
			event.preventDefault();
			const mouseEvent = event as MouseEvent;
			this.contextMenuManager.showContextMenu(card, node, mouseEvent.clientX, mouseEvent.clientY);
		});
		this.addEventListenerWithCleanup(container, 'contextmenu', contextMenuHandler);
	}

	/**
	 * 创建委托事件处理器
	 */
	private createDelegatedHandler(
		eventType: string,
		handler: (card: HTMLElement, node: CanvasNode, event: Event) => void
	): EventListener {
		return (event: Event) => {
			const target = event.target as HTMLElement;
			const card = target.closest('.canvas-grid-card') as HTMLElement;

			if (card) {
				const nodeId = card.dataset.nodeId;
				const nodeType = card.dataset.nodeType;

				if (nodeId && nodeType) {
					// 这里需要从外部获取节点数据
					// 在实际使用中，应该通过依赖注入或回调获取
					const node: CanvasNode = {
						id: nodeId,
						type: nodeType,
						x: 0, y: 0, width: 0, height: 0 // 临时值
					};

					handler(card, node, event);
				}
			}
		};
	}

	/**
	 * 添加事件监听器并记录以便清理
	 */
	private addEventListenerWithCleanup(element: Element, event: string, handler: EventListener): void {
		element.addEventListener(event, handler);
		this.eventListeners.push({ element, event, handler });
	}

	/**
	 * 注册卡片事件处理器
	 */
	onCardClick(handler: EventHandler): void {
		this.eventBus.on('card-click', handler);
	}

	onCardDoubleClick(handler: EventHandler): void {
		this.eventBus.on('card-doubleclick', handler);
	}

	onCardEdit(handler: EventHandler): void {
		this.eventBus.on('card-edit', handler);
	}

	onCardDelete(handler: EventHandler): void {
		this.eventBus.on('card-delete', handler);
	}

	/**
	 * 清理所有事件监听器
	 */
	cleanup(): void {
		// 清理DOM事件监听器
		this.eventListeners.forEach(({ element, event, handler }) => {
			element.removeEventListener(event, handler);
		});
		this.eventListeners.length = 0;

		// 清理事件总线
		this.eventBus.clear();

		// 清理上下文菜单
		this.contextMenuManager.hideContextMenu();
	}
}
