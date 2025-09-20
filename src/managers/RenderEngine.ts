import { CanvasNode } from './DataManager';

// 卡片常量
export const CARD_CONSTANTS = {
	width: 300,
	height: 200,
	spacing: 20
};

// DOM工具类
export class DOMUtils {
	/**
	 * 安全地设置元素的HTML内容
	 */
	static setHTML(element: HTMLElement, htmlContent: string, allowedTags: string[] = ['strong', 'em', 'code', 'br']): void {
		element.empty();
		
		if (!htmlContent.includes('<')) {
			element.textContent = htmlContent;
			return;
		}
		
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = htmlContent;
		
		this.sanitizeAndAppend(tempDiv, element, allowedTags);
	}

	/**
	 * 创建SVG图标
	 */
	static createSVGIcon(iconName: string, size: string = '16'): HTMLElement {
		const icons: Record<string, string> = {
			grid: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
			edit: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
			file: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`,
			link: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`
		};

		const container = document.createElement('span');
		container.className = 'svg-icon';
		
		const svgContent = icons[iconName] || icons.file;
		container.innerHTML = svgContent;
		
		return container;
	}

	/**
	 * 递归清理和复制安全的元素
	 */
	private static sanitizeAndAppend(source: Element, target: HTMLElement, allowedTags: string[]): void {
		Array.from(source.childNodes).forEach(node => {
			if (node.nodeType === Node.TEXT_NODE) {
				target.appendChild(node.cloneNode(true));
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const element = node as Element;
				const tagName = element.tagName.toLowerCase();
				
				if (allowedTags.includes(tagName)) {
					const newElement = document.createElement(tagName);
					this.copySafeAttributes(element, newElement);
					this.sanitizeAndAppend(element, newElement as HTMLElement, allowedTags);
					target.appendChild(newElement);
				}
			}
		});
	}

	/**
	 * 复制安全的属性
	 */
	private static copySafeAttributes(source: Element, target: Element): void {
		const safeAttributes = ['class', 'id'];
		safeAttributes.forEach(attr => {
			const value = source.getAttribute(attr);
			if (value !== null) {
				target.setAttribute(attr, value);
			}
		});
	}
}

// 卡片工厂类
export class CardFactory {
	/**
	 * 创建基础卡片结构
	 */
	createBaseCard(node: CanvasNode): HTMLElement {
		const card = document.createElement('div');
		card.className = 'canvas-grid-card';
		card.style.minHeight = `${CARD_CONSTANTS.height}px`;
		card.dataset.nodeId = node.id;
		card.dataset.nodeType = node.type;

		// 设置颜色
		if (node.color) {
			card.dataset.nodeColor = node.color;
			card.style.setProperty('--node-color', this.getColorValue(node.color));
		}

		return card;
	}

	/**
	 * 创建卡片头部
	 */
	createCardHeader(node: CanvasNode): HTMLElement {
		const header = document.createElement('div');
		header.className = 'canvas-grid-card-header';

		// 类型图标
		const typeIcon = DOMUtils.createSVGIcon(node.type, '14');
		typeIcon.className = 'card-type-icon';
		header.appendChild(typeIcon);

		// 节点ID（调试用）
		if (process.env.NODE_ENV === 'development') {
			const idSpan = document.createElement('span');
			idSpan.className = 'card-node-id';
			idSpan.textContent = node.id.substring(0, 8);
			header.appendChild(idSpan);
		}

		return header;
	}

	/**
	 * 创建卡片内容区域
	 */
	createCardContent(node: CanvasNode): HTMLElement {
		const content = document.createElement('div');
		content.className = 'canvas-grid-card-content';

		switch (node.type) {
			case 'text':
				this.renderTextContent(content, node);
				break;
			case 'file':
				this.renderFileContent(content, node);
				break;
			case 'link':
				this.renderLinkContent(content, node);
				break;
			default:
				content.textContent = `未知节点类型: ${node.type}`;
		}

		return content;
	}

	/**
	 * 渲染文本内容（简化版本，主要渲染在main.ts中）
	 */
	private renderTextContent(container: HTMLElement, node: CanvasNode): void {
		if (node.text) {
			// 简化显示，主要渲染逻辑在main.ts的ObsidianMarkdownRenderer中
			container.textContent = node.text.length > 100 ? node.text.substring(0, 100) + '...' : node.text;
			container.style.color = 'var(--text-normal)';
		} else {
			container.textContent = "空文本节点";
			container.style.color = 'var(--text-muted)';
			container.style.fontStyle = 'italic';
		}
	}

	/**
	 * 渲染文件内容
	 */
	private renderFileContent(container: HTMLElement, node: CanvasNode): void {
		if (node.file) {
			const fileName = node.file.split('/').pop() || node.file;
			const fileIcon = DOMUtils.createSVGIcon('file', '16');
			
			container.appendChild(fileIcon);
			
			const fileNameSpan = document.createElement('span');
			fileNameSpan.textContent = fileName;
			fileNameSpan.className = 'file-name';
			container.appendChild(fileNameSpan);
		} else {
			container.textContent = "无效文件节点";
			container.style.color = 'var(--text-muted)';
		}
	}

	/**
	 * 渲染链接内容
	 */
	private renderLinkContent(container: HTMLElement, node: CanvasNode): void {
		if (node.url) {
			const linkIcon = DOMUtils.createSVGIcon('link', '16');
			container.appendChild(linkIcon);
			
			const linkText = document.createElement('span');
			linkText.textContent = this.extractDomainFromUrl(node.url);
			linkText.className = 'link-text';
			container.appendChild(linkText);
		} else {
			container.textContent = "无效链接节点";
			container.style.color = 'var(--text-muted)';
		}
	}



	/**
	 * 从URL提取域名
	 */
	private extractDomainFromUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname;
		} catch {
			return url;
		}
	}

	/**
	 * 获取颜色值
	 */
	private getColorValue(color: string): string {
		const colorMap: Record<string, string> = {
			'1': '#ff6b6b', // 红色
			'2': '#ffa726', // 橙色
			'3': '#ffeb3b', // 黄色
			'4': '#66bb6a', // 绿色
			'5': '#26c6da', // 青色
			'6': '#42a5f5', // 蓝色
			'7': '#ab47bc'  // 紫色
		};
		return colorMap[color] || '#666666';
	}
}

// 渲染引擎
export class RenderEngine {
	private cardFactory: CardFactory;
	private renderCache: Map<string, HTMLElement>;

	constructor() {
		this.cardFactory = new CardFactory();
		this.renderCache = new Map();
	}

	/**
	 * 渲染网格
	 */
	renderGrid(nodes: CanvasNode[], container: HTMLElement): void {
		// 清空容器
		this.clearContainer(container);

		if (nodes.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		// 使用DocumentFragment批量添加DOM元素
		const fragment = document.createDocumentFragment();
		
		nodes.forEach(node => {
			const card = this.createCard(node);
			fragment.appendChild(card);
		});

		container.appendChild(fragment);
	}

	/**
	 * 创建卡片
	 */
	createCard(node: CanvasNode): HTMLElement {
		const cacheKey = this.generateCacheKey(node);
		
		// 检查缓存
		const cached = this.renderCache.get(cacheKey);
		if (cached) {
			return cached.cloneNode(true) as HTMLElement;
		}

		// 创建新卡片
		const card = this.cardFactory.createBaseCard(node);
		const header = this.cardFactory.createCardHeader(node);
		const content = this.cardFactory.createCardContent(node);

		card.appendChild(header);
		card.appendChild(content);

		// 缓存卡片
		this.renderCache.set(cacheKey, card.cloneNode(true) as HTMLElement);

		return card;
	}

	/**
	 * 更新卡片
	 */
	updateCard(card: HTMLElement, node: CanvasNode): void {
		const content = card.querySelector('.canvas-grid-card-content') as HTMLElement;
		if (content) {
			content.empty();
			const newContent = this.cardFactory.createCardContent(node);
			content.appendChild(newContent.firstChild!);
		}
	}

	/**
	 * 清空容器
	 */
	clearContainer(container: HTMLElement): void {
		container.empty();
	}

	/**
	 * 渲染空状态
	 */
	private renderEmptyState(container: HTMLElement): void {
		const emptyEl = container.createDiv("canvas-grid-empty-state");

		const iconEl = emptyEl.createDiv("empty-icon");
		iconEl.textContent = "📄";

		const titleEl = emptyEl.createDiv("empty-title");
		titleEl.textContent = "没有Canvas节点";

		const descEl = emptyEl.createDiv("empty-desc");
		descEl.textContent = "当前Canvas文件中没有节点，请先在Canvas中添加一些内容";
	}

	/**
	 * 生成缓存键
	 */
	private generateCacheKey(node: CanvasNode): string {
		return `${node.id}-${node.type}-${node.color || 'default'}`;
	}

	/**
	 * 清理缓存
	 */
	clearCache(): void {
		this.renderCache.clear();
	}

	/**
	 * 获取缓存统计
	 */
	getCacheStats(): { size: number } {
		return { size: this.renderCache.size };
	}
}
