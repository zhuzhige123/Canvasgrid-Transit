import { CanvasNode } from './DataManager';
import { SafeDOMUtils } from '../utils/SafeDOMUtils';
import { DebugManager } from '../utils/DebugManager';

// 卡片常量
export const CARD_CONSTANTS = {
	width: 300,
	height: 200,
	spacing: 20
};

// DOM工具类 - 已弃用，使用SafeDOMUtils替代
export class DOMUtils {
	/**
	 * @deprecated 使用SafeDOMUtils.setSafeHTML替代
	 * 安全地设置元素的HTML内容
	 */
	static setHTML(element: HTMLElement, htmlContent: string, allowedTags: string[] = ['strong', 'em', 'code', 'br']): void {
		SafeDOMUtils.setSafeHTML(element, htmlContent, allowedTags);
	}

	/**
	 * @deprecated 使用SafeDOMUtils.createSVGIcon替代
	 * 创建SVG图标
	 */
	static createSVGIcon(iconName: string, size: string = '16'): HTMLElement {
		// 映射旧图标名称到Obsidian图标名称
		const iconMap: Record<string, string> = {
			grid: 'layout-grid',
			edit: 'edit',
			file: 'file',
			link: 'link',
			text: 'file-text'
		};

		const obsidianIconName = iconMap[iconName] || 'file';
		return SafeDOMUtils.createSVGIcon(obsidianIconName, parseInt(size));
	}

	/**
	 * @deprecated 已移至SafeDOMUtils，此方法不再使用
	 */
	private static sanitizeAndAppend(source: Element, target: HTMLElement, allowedTags: string[]): void {
		// 方法已弃用，功能已移至SafeDOMUtils
		DebugManager.warn('DOMUtils.sanitizeAndAppend is deprecated. Use SafeDOMUtils instead.');
	}

	/**
	 * @deprecated 已移至SafeDOMUtils，此方法不再使用
	 */
	private static copySafeAttributes(source: Element, target: Element): void {
		// 方法已弃用，功能已移至SafeDOMUtils
		DebugManager.warn('DOMUtils.copySafeAttributes is deprecated. Use SafeDOMUtils instead.');
	}
}

// 卡片工厂类
export class CardFactory {
	/**
	 * 创建基础卡片结构
	 */
	createBaseCard(node: CanvasNode): HTMLElement {
		const card = document.createElement('div');
		SafeDOMUtils.addClasses(card, 'canvas-grid-card');
		SafeDOMUtils.setSafeAttribute(card, 'data-node-id', node.id);
		SafeDOMUtils.setSafeAttribute(card, 'data-node-type', node.type);

		// 设置颜色类而不是内联样式
		if (node.color) {
			SafeDOMUtils.setSafeAttribute(card, 'data-node-color', node.color);
			SafeDOMUtils.addClasses(card, `canvas-card-color-${node.color}`);
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
			SafeDOMUtils.setTextContent(container, node.text.length > 100 ? node.text.substring(0, 100) + '...' : node.text);
			SafeDOMUtils.addClasses(container, 'canvas-card-text-content');
		} else {
			SafeDOMUtils.setTextContent(container, "空文本节点");
			SafeDOMUtils.addClasses(container, 'canvas-card-empty-text');
		}
	}

	/**
	 * 渲染文件内容
	 */
	private renderFileContent(container: HTMLElement, node: CanvasNode): void {
		if (node.file) {
			const fileName = node.file.split('/').pop() || node.file;
			const fileIcon = SafeDOMUtils.createSVGIcon('file', 16);

			container.appendChild(fileIcon);

			const fileNameSpan = document.createElement('span');
			SafeDOMUtils.setTextContent(fileNameSpan, fileName);
			SafeDOMUtils.addClasses(fileNameSpan, 'canvas-card-file-name');
			container.appendChild(fileNameSpan);
		} else {
			SafeDOMUtils.setTextContent(container, "无效文件节点");
			SafeDOMUtils.addClasses(container, 'canvas-card-invalid-file');
		}
	}

	/**
	 * 渲染链接内容
	 */
	private renderLinkContent(container: HTMLElement, node: CanvasNode): void {
		if (node.url) {
			const linkIcon = SafeDOMUtils.createSVGIcon('link', 16);
			container.appendChild(linkIcon);

			const linkText = document.createElement('span');
			SafeDOMUtils.setTextContent(linkText, this.extractDomainFromUrl(node.url));
			SafeDOMUtils.addClasses(linkText, 'canvas-card-link-text');
			container.appendChild(linkText);
		} else {
			SafeDOMUtils.setTextContent(container, "无效链接节点");
			SafeDOMUtils.addClasses(container, 'canvas-card-invalid-link');
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
	 * @deprecated 不再使用内联样式设置颜色，改用CSS类
	 * 颜色现在通过CSS类 .canvas-card-color-{number} 设置
	 */
	private getColorValue(color: string): string {
		DebugManager.warn('getColorValue is deprecated. Use CSS classes instead.');
		return '';
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
