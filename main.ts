import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, TFile, Notice, Modal, EventRef, MarkdownView, Component, MarkdownRenderer } from 'obsidian';
import { UIComponentManager, UIComponentConfig, ModalType, ModalOptions } from './src/managers/UIComponentManager';
import { SearchAndFilterManager, SearchConfig, FilterConfig, SortConfig, FilterCriteria, SearchResult } from './src/managers/SearchAndFilterManager';
import { DragDropManager, DragDropConfig, DragData as DragDropData, DragResult } from './src/managers/DragDropManager';
import { CanvasAPIManager, CanvasAPIConfig, CanvasData as CanvasAPIData, CanvasOperationResult } from './src/managers/CanvasAPIManager';
import { FileSystemManager, FileSystemConfig, FileOperationResult, FileInfo } from './src/managers/FileSystemManager';
import { ThemeManager, ThemeConfig, ThemeState, ColorScheme, DEFAULT_COLOR_SCHEMES } from './src/managers/ThemeManager';
import { TimeCapsuleManager, TimeCapsuleConfig, TimeCapsuleData, TimeCapsuleResult } from './src/managers/TimeCapsuleManager';
import { NavigationManager, NavigationConfig, NavigationHistoryItem, NavigationResult } from './src/managers/NavigationManager';

// 新增：状态管理相关导入
import { EditorStateManager, EditorState, DocumentState } from './src/managers/EditorStateManager';

// 🔧 新增：分组选择相关接口
interface GroupSelectionItem {
	id: string;
	name: string;
	canvasFile: string;
	isCurrent: boolean;
	memberCount: number;
}
import { MemoryBufferManager, SaveTrigger } from './src/managers/MemoryBufferManager';
import { SaveTriggerManager } from './src/managers/SaveTriggerManager';
import { ConflictResolver } from './src/managers/ConflictResolver';
import { TempFileManager } from './src/managers/TempFileManager';
import { HiddenEditorManager } from './src/managers/HiddenEditorManager';
import { EditorStateCoordinator } from './src/managers/EditorStateCoordinator';
import { ObsidianRenderManager } from './src/managers/ObsidianRenderManager';
import { DiagnosticsManager } from './src/managers/DiagnosticsManager';
import { DebugManager } from './src/utils/DebugManager';
import { DataValidator } from './src/utils/DataValidator';
import { ColorUtils } from './src/utils/ColorUtils';
import { SEARCH_CONSTANTS, GRID_CONSTANTS, PERFORMANCE_CONSTANTS, NOTIFICATION_CONSTANTS, FILE_CONSTANTS, REGEX_PATTERNS, COLOR_CONSTANTS } from './src/constants/AppConstants';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, INFO_MESSAGES, WARNING_MESSAGES, UI_LABELS, PLACEHOLDER_TEXTS, STATUS_TEXTS, TOOLTIP_TEXTS } from './src/constants/UIMessages';
import { CANVAS_SELECTORS, EDITOR_SELECTORS, WORKSPACE_SELECTORS, PLUGIN_SELECTORS, DRAG_SELECTORS, TIMELINE_SELECTORS, SEARCH_SELECTORS, MODAL_SELECTORS, STATE_SELECTORS, THEME_SELECTORS, ANIMATION_SELECTORS } from './src/constants/CSSSelectors';
import { ValidationManager, ValidationConfig, ValidationResult, ValidationRule } from './src/managers/ValidationManager';
// Obsidian渲染引擎已恢复，支持完整Markdown渲染
// CacheManager 导入已移除，使用简单的Map实现缓存
import { PerformanceManager, PerformanceConfig, PerformanceMetrics, PerformanceReport } from './src/managers/PerformanceManager';

// 移除独立的时间线视图导入，将集成到网格视图中

// SVG图标管理器
class SVGIconManager {
	private static icons: Record<string, string> = {
		grid: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
		back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>',
		refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>',
		settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="m12 1 1.27 2.22 2.22 1.27-1.27 2.22L12 8.5l-1.27-2.22L8.5 5.23l1.27-2.22L12 1"/><path d="m21 12-2.22 1.27-1.27 2.22-2.22-1.27L12 15.5l1.27-2.22 2.22-1.27 1.27-2.22L21 12"/><path d="m12 23-1.27-2.22-2.22-1.27 1.27-2.22L12 15.5l1.27 2.22 2.22 1.27-1.27 2.22L12 23"/><path d="m3 12 2.22-1.27 1.27-2.22 2.22 1.27L12 8.5l-1.27 2.22-2.22 1.27-1.27 2.22L3 12"/></svg>',
		close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
		menu: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>',
		timeCapsule: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 2h12v6l-6 6 6 6v6H6v-6l6-6-6-6V2z"/></svg>',
		hourglass: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 2h12v6l-6 6 6 6v6H6v-6l6-6-6-6V2z"/></svg>',
		clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
		externalLink: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
		edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
		file: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
		link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
		group: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>',
		arrow: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6,9 12,15 18,9"/></svg>',
		arrowRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg>',
		arrowLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg>',
		// 🔧 新增：Font Awesome archive图标（收集功能专用）
		archive: '<svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor"><path d="M32 32H480c17.7 0 32 14.3 32 32V96c0 17.7-14.3 32-32 32H32C14.3 128 0 113.7 0 96V64C0 46.3 14.3 32 32 32zm0 128H480V416c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V160zm128 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16s-7.2-16-16-16H176c-8.8 0-16 7.2-16 16z"/></svg>'
	};

	static createIcon(iconName: string, customSize?: string): HTMLElement {
		DebugManager.verbose(`Creating icon: ${iconName}`);

		// 为时间胶囊图标提供emoji后备
		const emojiMap: Record<string, string> = {
			timeCapsule: '⏳',
			hourglass: '⏳',
			clock: '🕐',
			grid: '⊞',
			back: '←',
			refresh: '↻',
			settings: '⚙',
			close: '✕',
			menu: '⋮',
			archive: '📦'  // 🔧 新增：archive图标的emoji后备
		};

		const iconSvg = this.icons[iconName];
		if (!iconSvg) {
			DebugManager.warn(`Icon '${iconName}' not found in icons:`, Object.keys(this.icons));
			const fallback = document.createElement('span');
			fallback.textContent = emojiMap[iconName] || '?';
			fallback.style.fontSize = '16px';
			fallback.style.display = 'inline-flex';
			fallback.style.alignItems = 'center';
			fallback.style.justifyContent = 'center';
			return fallback;
		}

		const container = document.createElement('span');
		container.className = 'svg-icon';
		container.style.display = 'inline-flex';
		container.style.alignItems = 'center';
		container.style.justifyContent = 'center';

		try {
			let svgContent = iconSvg;
			if (customSize) {
				svgContent = svgContent.replace(/width="[^"]*"/, `width="${customSize}"`);
				svgContent = svgContent.replace(/height="[^"]*"/, `height="${customSize}"`);
			}

			DebugManager.log(`Setting SVG content for ${iconName}:`, svgContent.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...');
			// 直接使用innerHTML设置SVG内容
			container.innerHTML = svgContent;

			// 验证SVG是否正确创建
			const svgElement = container.querySelector('svg');
			if (!svgElement) {
				throw new Error('SVG element not created');
			}

			DebugManager.log(`Icon ${iconName} created successfully`);
		} catch (error) {
			DebugManager.error('Failed to create SVG icon:', error);
			// 清空容器并使用emoji后备
			container.innerHTML = '';
			container.textContent = emojiMap[iconName] || '?';
			container.style.fontSize = '16px';
		}

		return container;
	}

	static setIcon(element: HTMLElement, iconName: string, customSize?: string): void {
		DebugManager.log(`Setting icon ${iconName} on element:`, element);
		// 清空元素内容
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		const icon = this.createIcon(iconName, customSize);
		element.appendChild(icon);
		DebugManager.log(`Icon ${iconName} set successfully, element now contains:`, element.innerHTML);
	}
}

// LRU缓存实现已移至 src/managers/CacheManager.ts

// 加载状态管理器
class LoadingManager {
	private static activeOperations = new Map<string, { startTime: number; description: string }>();
	private static loadingIndicators = new Map<string, HTMLElement>();

	/**
	 * 开始加载操作
	 */
	static startLoading(operationId: string, description: string, container?: HTMLElement): void {
		this.activeOperations.set(operationId, {
			startTime: Date.now(),
			description
		});

		if (container) {
			this.showLoadingIndicator(operationId, description, container);
		}

		DebugManager.log(`🔄 开始加载: ${description}`);
	}

	/**
	 * 结束加载操作
	 */
	static endLoading(operationId: string): void {
		const operation = this.activeOperations.get(operationId);
		if (operation) {
			const duration = Date.now() - operation.startTime;
			DebugManager.log(`✅ 加载完成: ${operation.description} (耗时: ${duration}ms)`);
			this.activeOperations.delete(operationId);
		}

		this.hideLoadingIndicator(operationId);
	}

	/**
	 * 显示加载指示器
	 */
	private static showLoadingIndicator(operationId: string, description: string, container: HTMLElement): void {
		const indicator = container.createDiv('loading-indicator');
		indicator.innerHTML = `
			<div class="loading-spinner"></div>
			<div class="loading-text">${description}...</div>
		`;

		this.loadingIndicators.set(operationId, indicator);
	}

	/**
	 * 隐藏加载指示器
	 */
	private static hideLoadingIndicator(operationId: string): void {
		const indicator = this.loadingIndicators.get(operationId);
		if (indicator) {
			indicator.remove();
			this.loadingIndicators.delete(operationId);
		}
	}

	/**
	 * 检查是否有正在进行的操作
	 */
	static isLoading(operationId?: string): boolean {
		if (operationId) {
			return this.activeOperations.has(operationId);
		}
		return this.activeOperations.size > 0;
	}

	/**
	 * 获取所有活动操作
	 */
	static getActiveOperations(): Array<{ id: string; description: string; duration: number }> {
		const now = Date.now();
		return Array.from(this.activeOperations.entries()).map(([id, operation]) => ({
			id,
			description: operation.description,
			duration: now - operation.startTime
		}));
	}

	/**
	 * 清理所有加载状态
	 */
	static cleanup(): void {
		this.activeOperations.clear();
		this.loadingIndicators.forEach(indicator => indicator.remove());
		this.loadingIndicators.clear();
	}
}

// 错误处理工具类
class ErrorHandler {
	private static instance: ErrorHandler;
	private errorLog: Array<{ timestamp: number; error: Error; context: string }> = [];
	private readonly maxLogSize = PERFORMANCE_CONSTANTS.MAX_LOG_SIZE;

	static getInstance(): ErrorHandler {
		if (!this.instance) {
			this.instance = new ErrorHandler();
		}
		return this.instance;
	}

	/**
	 * 处理错误并提供用户友好的反馈
	 */
	handleError(error: Error | string, context: string, showToUser: boolean = true): void {
		const errorObj = typeof error === 'string' ? new Error(error) : error;

		// 记录错误
		this.logError(errorObj, context);

		// 显示用户友好的错误信息
		if (showToUser) {
			this.showUserFriendlyError(errorObj, context);
		}

		// 控制台输出详细错误信息
		DebugManager.error(`[${context}]`, errorObj);
	}

	/**
	 * 处理异步操作的错误
	 */
	async handleAsyncOperation<T>(
		operation: () => Promise<T>,
		context: string,
		fallbackValue?: T,
		showErrorToUser: boolean = true
	): Promise<T | undefined> {
		try {
			return await operation();
		} catch (error) {
			this.handleError(error as Error, context, showErrorToUser);
			return fallbackValue;
		}
	}

	/**
	 * 创建带有重试机制的异步操作
	 */
	async withRetry<T>(
		operation: () => Promise<T>,
		context: string,
		maxRetries: number = 3,
		delay: number = 1000
	): Promise<T | undefined> {
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;

				if (attempt === maxRetries) {
					this.handleError(lastError, `${context} (最终失败，已重试${maxRetries}次)`);
					break;
				}

				DebugManager.warn(`[${context}] 第${attempt}次尝试失败，${delay}ms后重试:`, error);
				await new Promise(resolve => setTimeout(resolve, delay));
				delay *= 2; // 指数退避
			}
		}

		return undefined;
	}

	/**
	 * 记录错误到内部日志
	 */
	private logError(error: Error, context: string): void {
		this.errorLog.push({
			timestamp: Date.now(),
			error,
			context
		});

		// 限制日志大小
		if (this.errorLog.length > this.maxLogSize) {
			this.errorLog.shift();
		}
	}

	/**
	 * 显示用户友好的错误信息
	 */
	private showUserFriendlyError(error: Error, context: string): void {
		const userMessage = this.getUserFriendlyMessage(error, context);

		// 使用Obsidian的Notice显示错误
		if ((window as any).app) {
			new Notice(userMessage, NOTIFICATION_CONSTANTS.LONG_DURATION);
		}
	}

	/**
	 * 将技术错误转换为用户友好的消息
	 */
	private getUserFriendlyMessage(error: Error, context: string): string {
		const message = error.message.toLowerCase();

		// 网络相关错误
		if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
			return '网络连接失败，请检查网络设置后重试';
		}

		// 文件相关错误
		if (message.includes('file') || message.includes('read') || message.includes('write')) {
			return '文件操作失败，请检查文件权限或磁盘空间';
		}

		// JSON解析错误
		if (message.includes('json') || message.includes('parse')) {
			return 'Canvas文件格式错误，请检查文件内容';
		}

		// 权限错误
		if (message.includes('permission') || message.includes('access')) {
			return '权限不足，请检查文件访问权限';
		}

		// Canvas特定错误
		if (context.includes('canvas')) {
			return 'Canvas操作失败，请尝试刷新或重新打开文件';
		}

		// 默认错误消息
		return `操作失败: ${context}`;
	}

	/**
	 * 获取错误统计信息
	 */
	getErrorStats(): { totalErrors: number; recentErrors: number; contexts: string[] } {
		const now = Date.now();
		const oneHourAgo = now - 60 * 60 * 1000;

		const recentErrors = this.errorLog.filter(log => log.timestamp > oneHourAgo);
		const contexts = [...new Set(this.errorLog.map(log => log.context))];

		return {
			totalErrors: this.errorLog.length,
			recentErrors: recentErrors.length,
			contexts
		};
	}

	/**
	 * 清理错误日志
	 */
	clearErrorLog(): void {
		this.errorLog.length = 0;
	}
}

// 内存管理工具类
class MemoryManager {
	private static cleanupCallbacks: (() => void)[] = [];
	private static cleanupInterval: NodeJS.Timeout | null = null;

	/**
	 * 注册清理回调函数
	 */
	static registerCleanup(callback: () => void): void {
		this.cleanupCallbacks.push(callback);
	}

	/**
	 * 启动定期内存清理
	 */
	static startPeriodicCleanup(intervalMs: number = 300000): void { // 5分钟
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
		}

		this.cleanupInterval = setInterval(() => {
			this.performCleanup();
		}, intervalMs);
	}

	/**
	 * 执行内存清理
	 */
	static performCleanup(): void {
		DebugManager.log('🧹 执行内存清理...');

		this.cleanupCallbacks.forEach((callback, index) => {
			try {
				callback();
			} catch (error) {
				DebugManager.error(`清理回调[${index}]执行失败:`, error);
			}
		});

		// 强制垃圾回收（如果可用）
		if (global.gc) {
			global.gc();
		}
	}

	/**
	 * 停止定期清理
	 */
	static stopPeriodicCleanup(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
	}

	/**
	 * 清理所有注册的回调
	 */
	static cleanup(): void {
		this.stopPeriodicCleanup();
		this.performCleanup();
		this.cleanupCallbacks.length = 0;
	}
}

// 数据验证工具类已移至 src/managers/ValidationManager.ts 和 src/utils/DataValidator.ts

// 安全的HTML处理工具类
class SafeHTMLRenderer {
	/**
	 * 安全地设置元素的HTML内容，防止XSS攻击
	 * @param element 目标元素
	 * @param htmlContent HTML内容字符串
	 * @param allowedTags 允许的HTML标签列表
	 */
	static setHTML(element: HTMLElement, htmlContent: string, allowedTags: string[] = ['svg', 'path', 'rect', 'circle', 'polyline', 'line', 'g', 'defs', 'use']): void {
		// 清空元素
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}

		// 如果是纯文本，直接设置
		if (!htmlContent.includes('<')) {
			element.textContent = htmlContent;
			return;
		}

		// 创建临时容器来解析HTML
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = htmlContent;

		// 递归清理和复制安全的元素
		this.sanitizeAndAppend(tempDiv, element, allowedTags);
	}

	/**
	 * 安全地创建SVG图标元素
	 * @param svgContent SVG内容
	 * @returns 安全的SVG元素
	 */
	static createSVGIcon(svgContent: string): SVGElement {
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgContent, 'image/svg+xml');
		const svgElement = doc.documentElement;

		// 验证是否为有效的SVG
		if (svgElement.tagName !== 'svg') {
			throw new Error('Invalid SVG content');
		}

		// 移除潜在的危险属性
		this.removeDangerousAttributes(svgElement);

		return svgElement as unknown as SVGElement;
	}

	/**
	 * 递归清理和复制安全的元素
	 */
	private static sanitizeAndAppend(source: Element, target: HTMLElement, allowedTags: string[]): void {
		Array.from(source.childNodes).forEach(node => {
			if (node.nodeType === Node.TEXT_NODE) {
				// 文本节点直接复制
				target.appendChild(node.cloneNode(true));
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const element = node as Element;
				const tagName = element.tagName.toLowerCase();

				// 检查是否为允许的标签
				if (allowedTags.includes(tagName)) {
					const newElement = document.createElement(tagName);

					// 复制安全的属性
					this.copySafeAttributes(element, newElement);

					// 递归处理子元素
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
		const safeAttributes = [
			'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width',
			'stroke-linecap', 'stroke-linejoin', 'opacity', 'transform',
			'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
			'd', 'points', 'class', 'id'
		];

		safeAttributes.forEach(attr => {
			const value = source.getAttribute(attr);
			if (value !== null) {
				target.setAttribute(attr, value);
			}
		});
	}

	/**
	 * 移除危险的属性
	 */
	private static removeDangerousAttributes(element: Element): void {
		const dangerousAttributes = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'];

		dangerousAttributes.forEach(attr => {
			element.removeAttribute(attr);
		});

		// 递归处理子元素
		Array.from(element.children).forEach(child => {
			this.removeDangerousAttributes(child);
		});
	}


}

// 插件设置接口
interface CanvasGridSettings {
	enableAutoLayout: boolean;
	colorFilterColors: string[]; // 颜色筛选器显示的颜色列表
	language: 'zh' | 'en'; // 界面语言
	colorCategories: ColorCategory[]; // 颜色分类配置
	enableColorCategories: boolean; // 是否启用颜色分类

	// 标注功能设置（保留annotationName用于其他功能）
	annotationName: string; // 自定义标注名称

	// 置顶功能设置
	enablePinnedCards: boolean; // 是否启用置顶功能
	pinnedTagName: string; // 置顶标签名称，默认 "#置顶"
	pinnedTagPosition: 'start' | 'end'; // 标签插入位置，默认 'start'
	showPinnedIndicator: boolean; // 是否显示置顶标识

	// 新增：Anki Connect集成设置
	ankiConnect: {
		enabled: boolean;
		apiUrl: string;
		apiKey?: string;
		defaultDeck: string;
		modelName: string;
		syncColors: string[];
		enableIncrementalSync: boolean;
		enableAutoSync?: boolean;
		batchSize: number;
		retryAttempts: number;
		timeout: number;
		contentDivider: string; // 自定义分隔符
		forceSync?: boolean; // 强制同步选项
	};

	// 新增：Anki同步历史记录
	ankiSyncHistory: {
		lastSyncTime: number;
		syncedNodes: Record<string, { nodeId: string; ankiNoteId: number; lastModified: number; contentHash: string; syncTime: number; }>; // nodeId -> SyncedNodeInfo
		failedNodes: string[];
		totalSynced: number;
		lastSyncResult: any | null;
	};
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
	],

	// 标注功能默认设置
	annotationName: 'card', // 默认标注名称

	// 置顶功能默认设置
	enablePinnedCards: true, // 默认启用置顶功能
	pinnedTagName: '#置顶', // 默认置顶标签
	pinnedTagPosition: 'start', // 默认在首部插入
	showPinnedIndicator: true, // 默认显示置顶标识

	// Anki Connect默认设置
	ankiConnect: {
		enabled: false, // 默认禁用，需要用户手动启用
		apiUrl: 'http://localhost:8765', // 默认Anki Connect地址
		apiKey: undefined, // 默认无API密钥
		defaultDeck: 'Default', // 默认牌组
		modelName: 'Basic', // 默认模板
		syncColors: ['1', '2', '4'], // 默认同步红、橙、绿色卡片
		enableIncrementalSync: true, // 默认启用增量同步
		enableAutoSync: false, // 默认禁用自动同步
		batchSize: 50, // 默认批次大小
		retryAttempts: 3, // 默认重试次数
		timeout: 5000, // 默认超时时间（毫秒）
		contentDivider: '---div---', // 默认内容分隔符
		forceSync: false, // 默认禁用强制同步
	},

	// Anki同步历史默认设置
	ankiSyncHistory: {
		lastSyncTime: 0, // 上次同步时间
		syncedNodes: {}, // 已同步节点记录
		failedNodes: [], // 同步失败节点
		totalSynced: 0, // 总同步数量
		lastSyncResult: null, // 最后同步结果
	},
}

// 固定的卡片尺寸常量
const CARD_CONSTANTS = {
	width: GRID_CONSTANTS.CARD_WIDTH,
	height: GRID_CONSTANTS.CARD_HEIGHT,
	spacing: 20
};

// 视图类型常量
export const CANVAS_GRID_VIEW_TYPE = "canvas-grid-view";
export const CANVAS_TIMELINE_VIEW_TYPE = "canvas-timeline-view";

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

	// Obsidian块链接功能
	blockLinkSettings: string;
	enableBlockLinkMode: string;
	blockLinkModeDesc: string;
	blockLinkName: string;
	blockLinkNameDesc: string;

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

		// Obsidian块链接功能
		blockLinkSettings: 'Obsidian块链接设置',
		enableBlockLinkMode: '启用块链接模式',
		blockLinkModeDesc: '拖拽文本到Canvas时自动在源文档中创建Obsidian块链接标注',
		blockLinkName: '块链接标识名称',
		blockLinkNameDesc: '自定义块链接的标识名称，用于在源文档中标记已提取的内容',

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

		// Obsidian块链接功能
		blockLinkSettings: 'Obsidian Block Link Settings',
		enableBlockLinkMode: 'Enable Block Link Mode',
		blockLinkModeDesc: 'Automatically create Obsidian block link annotations in source documents when dragging text to Canvas',
		blockLinkName: 'Block Link Identifier Name',
		blockLinkNameDesc: 'Customize the identifier name for block links, used to mark extracted content in source documents',

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

// 扩展Canvas节点接口（支持置顶功能）
interface ExtendedCanvasNode extends CanvasNode {
	isPinned?: boolean;      // 置顶状态
	pinnedAt?: number;       // 置顶时间戳
	pinnedOrder?: number;    // 置顶顺序（支持多个置顶卡片的排序）
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

// 🎯 新增：卡片渲染数据接口
interface CardRenderData {
	nodeId: string;
	nodeType: string;
	contentHash: string;
	renderedContent: string;
	metadata: {
		hasGroupBadge: boolean;
		isPinned: boolean;
		colorStyle?: string;
		timestamp: number;
	};
}

// 🎯 新增：节点变更类型
interface NodeChange {
	type: 'add' | 'update' | 'delete';
	nodeId?: string;
	node?: CanvasNode;
	oldState?: NodeRenderState;
}

// 🎯 新增：节点渲染状态
interface NodeRenderState {
	nodeId: string;
	contentHash: string;
	lastRendered: number;
	domElementId?: string;
}

// 🎯 新增：一致性检查报告
interface ConsistencyReport {
	isConsistent: boolean;
	issues: string[];
	fixes: string[];
	statistics: {
		totalNodes: number;
		totalDOMElements: number;
		duplicateElements: number;
		orphanElements: number;
		missingElements: number;
	};
}

// 🎯 新增：修复结果
interface FixResult {
	success: boolean;
	fixedIssues: string[];
	failedFixes: string[];
}

// 🎯 新增：DOM验证结果（避免与ValidationManager冲突）
interface DOMValidationResult {
	isValid: boolean;
	issues: string[];
	fixes: string[];
}

// 🎯 新增：状态报告
interface StateReport {
	isHealthy: boolean;
	totalElements: number;
	uniqueNodes: number;
	duplicates: string[];
	timestamp: number;
}

// 🎯 新增：DOM元素注册表类
class DOMElementRegistry {
	private elementMap = new Map<string, HTMLElement>();
	private nodeToElementMap = new Map<string, string>();

	// 创建唯一DOM元素
	createUniqueElement(nodeId: string, elementType: string = 'div'): HTMLElement {
		const uniqueId = `card-${nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// 检查是否已存在
		if (this.nodeToElementMap.has(nodeId)) {
			this.removeElement(nodeId);
		}

		const element = document.createElement(elementType);
		element.dataset.nodeId = nodeId;
		element.dataset.uniqueId = uniqueId;

		this.elementMap.set(uniqueId, element);
		this.nodeToElementMap.set(nodeId, uniqueId);

		return element;
	}

	// 获取节点对应的DOM元素
	getElement(nodeId: string): HTMLElement | null {
		const uniqueId = this.nodeToElementMap.get(nodeId);
		return uniqueId ? this.elementMap.get(uniqueId) || null : null;
	}

	// 移除DOM元素
	removeElement(nodeId: string): boolean {
		const uniqueId = this.nodeToElementMap.get(nodeId);
		if (uniqueId) {
			const element = this.elementMap.get(uniqueId);
			if (element && element.parentNode) {
				element.parentNode.removeChild(element);
			}
			this.elementMap.delete(uniqueId);
			this.nodeToElementMap.delete(nodeId);
			return true;
		}
		return false;
	}

	// 清理所有元素
	clearAll(): void {
		for (const [uniqueId, element] of this.elementMap) {
			if (element && element.parentNode) {
				element.parentNode.removeChild(element);
			}
		}
		this.elementMap.clear();
		this.nodeToElementMap.clear();
	}

	// 获取所有映射关系
	getAllMappings(): { nodeId: string; uniqueId: string; hasElement: boolean }[] {
		const mappings: { nodeId: string; uniqueId: string; hasElement: boolean }[] = [];
		for (const [nodeId, uniqueId] of this.nodeToElementMap) {
			mappings.push({
				nodeId,
				uniqueId,
				hasElement: this.elementMap.has(uniqueId)
			});
		}
		return mappings;
	}

	// 验证DOM元素一致性
	validateConsistency(): DOMValidationResult {
		const issues: string[] = [];
		const fixes: string[] = [];

		// 检查重复节点ID
		const nodeIds = new Set<string>();
		for (const [nodeId] of this.nodeToElementMap) {
			if (nodeIds.has(nodeId)) {
				issues.push(`重复的节点ID: ${nodeId}`);
				fixes.push(`移除重复的DOM元素`);
			}
			nodeIds.add(nodeId);
		}

		// 检查孤立的DOM元素
		for (const [uniqueId, element] of this.elementMap) {
			if (!element.parentNode) {
				issues.push(`孤立的DOM元素: ${uniqueId}`);
				fixes.push(`清理孤立元素`);
			}
		}

		return { isValid: issues.length === 0, issues, fixes };
	}
}

// 🎯 新增：数据一致性验证器类
class DataConsistencyValidator {
	constructor(
		private gridContainer: HTMLElement,
		private canvasData: CanvasData | null,
		private domElementRegistry: DOMElementRegistry
	) {}

	// 全面的一致性检查
	validateFullConsistency(): ConsistencyReport {
		const report: ConsistencyReport = {
			isConsistent: true,
			issues: [],
			fixes: [],
			statistics: {
				totalNodes: this.canvasData?.nodes.length || 0,
				totalDOMElements: 0,
				duplicateElements: 0,
				orphanElements: 0,
				missingElements: 0
			}
		};

		// 检查1：DOM元素重复
		this.checkDuplicateElements(report);

		// 检查2：孤立DOM元素
		this.checkOrphanElements(report);

		// 检查3：缺失DOM元素
		this.checkMissingElements(report);

		// 检查4：数据节点一致性
		this.checkNodeDataConsistency(report);

		report.isConsistent = report.issues.length === 0;
		return report;
	}

	// 检查重复DOM元素
	private checkDuplicateElements(report: ConsistencyReport): void {
		const domCards = this.gridContainer.querySelectorAll('[data-node-id]');
		const nodeIds = new Set<string>();
		const duplicates: string[] = [];

		domCards.forEach(card => {
			const nodeId = card.getAttribute('data-node-id');
			if (nodeId) {
				if (nodeIds.has(nodeId)) {
					duplicates.push(nodeId);
					report.statistics.duplicateElements++;
				}
				nodeIds.add(nodeId);
			}
		});

		report.statistics.totalDOMElements = domCards.length;

		if (duplicates.length > 0) {
			report.issues.push(`发现重复的DOM元素: ${duplicates.join(', ')}`);
			report.fixes.push(`移除重复的DOM元素`);
		}
	}

	// 检查孤立DOM元素
	private checkOrphanElements(report: ConsistencyReport): void {
		const domCards = this.gridContainer.querySelectorAll('[data-node-id]');
		const dataNodeIds = new Set((this.canvasData?.nodes || []).map(n => n.id));

		domCards.forEach(card => {
			const nodeId = card.getAttribute('data-node-id');
			if (nodeId && !dataNodeIds.has(nodeId)) {
				report.statistics.orphanElements++;
				report.issues.push(`发现孤立的DOM元素: ${nodeId}`);
				report.fixes.push(`移除孤立的DOM元素`);
			}
		});
	}

	// 检查缺失DOM元素
	private checkMissingElements(report: ConsistencyReport): void {
		const domNodeIds = new Set<string>();
		const domCards = this.gridContainer.querySelectorAll('[data-node-id]');

		domCards.forEach(card => {
			const nodeId = card.getAttribute('data-node-id');
			if (nodeId) domNodeIds.add(nodeId);
		});

		(this.canvasData?.nodes || []).forEach(node => {
			if (!domNodeIds.has(node.id)) {
				report.statistics.missingElements++;
				report.issues.push(`缺失DOM元素: ${node.id}`);
				report.fixes.push(`创建缺失的DOM元素`);
			}
		});
	}

	// 检查节点数据一致性
	private checkNodeDataConsistency(report: ConsistencyReport): void {
		// 检查DOM元素注册表的一致性
		const registryValidation = this.domElementRegistry.validateConsistency();
		if (!registryValidation.isValid) {
			report.issues.push(...registryValidation.issues);
			report.fixes.push(...registryValidation.fixes);
		}
	}

	// 自动修复数据不一致问题
	async autoFixInconsistencies(report: ConsistencyReport): Promise<FixResult> {
		const fixResult: FixResult = {
			success: true,
			fixedIssues: [],
			failedFixes: []
		};

		try {
			// 修复重复元素
			await this.fixDuplicateElements(fixResult);

			// 修复孤立元素
			await this.fixOrphanElements(fixResult);

			// 修复缺失元素
			await this.fixMissingElements(fixResult);

		} catch (error) {
			fixResult.success = false;
			fixResult.failedFixes.push(`自动修复失败: ${error}`);
		}

		return fixResult;
	}

	// 修复重复元素
	private async fixDuplicateElements(fixResult: FixResult): Promise<void> {
		const domCards = this.gridContainer.querySelectorAll('[data-node-id]');
		const seenNodeIds = new Set<string>();

		domCards.forEach(card => {
			const nodeId = card.getAttribute('data-node-id');
			if (nodeId) {
				if (seenNodeIds.has(nodeId)) {
					// 移除重复元素
					card.remove();
					fixResult.fixedIssues.push(`移除重复DOM元素: ${nodeId}`);
				} else {
					seenNodeIds.add(nodeId);
				}
			}
		});
	}

	// 修复孤立元素
	private async fixOrphanElements(fixResult: FixResult): Promise<void> {
		const domCards = this.gridContainer.querySelectorAll('[data-node-id]');
		const dataNodeIds = new Set((this.canvasData?.nodes || []).map(n => n.id));

		domCards.forEach(card => {
			const nodeId = card.getAttribute('data-node-id');
			if (nodeId && !dataNodeIds.has(nodeId)) {
				card.remove();
				fixResult.fixedIssues.push(`移除孤立DOM元素: ${nodeId}`);
			}
		});
	}

	// 修复缺失元素
	private async fixMissingElements(fixResult: FixResult): Promise<void> {
		// 这个方法需要访问主类的createCard方法，暂时标记为需要实现
		fixResult.failedFixes.push('缺失元素修复需要主类支持');
	}
}

// 🎯 新增：增量渲染器类
class IncrementalRenderer {
	private lastRenderState: Map<string, NodeRenderState> = new Map();

	// 检测节点变更
	detectChanges(currentNodes: CanvasNode[]): NodeChange[] {
		const changes: NodeChange[] = [];
		const currentNodeMap = new Map(currentNodes.map(node => [node.id, node]));

		// 检测新增和修改
		for (const node of currentNodes) {
			const lastState = this.lastRenderState.get(node.id);
			if (!lastState) {
				changes.push({ type: 'add', node });
			} else if (this.hasNodeChanged(node, lastState)) {
				changes.push({ type: 'update', node, oldState: lastState });
			}
		}

		// 检测删除
		for (const [nodeId, lastState] of this.lastRenderState) {
			if (!currentNodeMap.has(nodeId)) {
				changes.push({ type: 'delete', nodeId, oldState: lastState });
			}
		}

		return changes;
	}

	// 检查节点是否发生变化
	private hasNodeChanged(node: CanvasNode, lastState: NodeRenderState): boolean {
		const currentHash = this.generateNodeHash(node);
		return currentHash !== lastState.contentHash;
	}

	// 生成节点内容哈希
	private generateNodeHash(node: CanvasNode): string {
		const content = JSON.stringify({
			type: node.type,
			text: node.text,
			url: node.url,
			file: node.file,
			color: node.color,
			flag: node.flag
		});
		return this.simpleHash(content).toString();
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

	// 更新渲染状态
	updateRenderState(changes: NodeChange[]): void {
		for (const change of changes) {
			switch (change.type) {
				case 'add':
				case 'update':
					if (change.node) {
						this.lastRenderState.set(change.node.id, {
							nodeId: change.node.id,
							contentHash: this.generateNodeHash(change.node),
							lastRendered: Date.now()
						});
					}
					break;
				case 'delete':
					if (change.nodeId) {
						this.lastRenderState.delete(change.nodeId);
					}
					break;
			}
		}
	}

	// 检查是否有初始状态
	hasInitialState(): boolean {
		return this.lastRenderState.size > 0;
	}

	// 清理渲染状态
	clearRenderState(): void {
		this.lastRenderState.clear();
	}
}

// 🎯 新增：DOM状态监控器类
class DOMStateMonitor {
	private monitorInterval: NodeJS.Timeout | null = null;
	private gridContainer: HTMLElement;
	private onStateChange?: (report: StateReport) => void;

	constructor(gridContainer: HTMLElement, onStateChange?: (report: StateReport) => void) {
		this.gridContainer = gridContainer;
		this.onStateChange = onStateChange;
	}

	// 开始监控
	startMonitoring(): void {
		if (this.monitorInterval) return;

		this.monitorInterval = setInterval(() => {
			const report = this.generateStateReport();
			if (!report.isHealthy && this.onStateChange) {
				this.onStateChange(report);
			}
		}, 5000); // 每5秒检查一次
	}

	// 停止监控
	stopMonitoring(): void {
		if (this.monitorInterval) {
			clearInterval(this.monitorInterval);
			this.monitorInterval = null;
		}
	}

	// 生成状态报告
	private generateStateReport(): StateReport {
		const domCards = this.gridContainer.querySelectorAll('[data-node-id]');
		const nodeIds = new Set<string>();
		const duplicates: string[] = [];

		domCards.forEach(card => {
			const nodeId = card.getAttribute('data-node-id');
			if (nodeId) {
				if (nodeIds.has(nodeId)) {
					duplicates.push(nodeId);
				}
				nodeIds.add(nodeId);
			}
		});

		return {
			isHealthy: duplicates.length === 0,
			totalElements: domCards.length,
			uniqueNodes: nodeIds.size,
			duplicates,
			timestamp: Date.now()
		};
	}

	// 手动检查状态
	checkState(): StateReport {
		return this.generateStateReport();
	}
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
	// 元数据
	metadata?: {
		sourceUrl?: string;
		[key: string]: any;
	};
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

// 颜色分类系统
interface ColorCategory {
	id: string;
	name: string;
	description: string;
	color: string; // Canvas颜色ID
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

		DebugManager.log(`Linked canvas file: ${canvasFile.path}`);
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
		DebugManager.log('Canvas link removed');
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

		DebugManager.log('Registering file watchers for:', this.linkedCanvasFile.path);

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
		DebugManager.log('File watchers unregistered');
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
	private allCanvasFiles: TFile[] = [];
	private filteredFiles: TFile[] = [];
	private searchInput!: HTMLInputElement;
	private fileListContainer!: HTMLElement;

	constructor(app: App, gridView: CanvasGridView, onSelect: (file: TFile) => void) {
		super(app);
		this.gridView = gridView;
		this.onSelect = onSelect;
	}

	onOpen(): void {
		this.titleEl.setText(this.gridView.settings.language === 'zh' ? '选择要关联的Canvas文件' : 'Select Canvas File to Associate');
		this.createContent();
	}

	private createContent(): void {
		this.allCanvasFiles = this.app.vault.getFiles()
			.filter(file => file.extension === 'canvas');
		this.filteredFiles = [...this.allCanvasFiles];

		// 创建搜索框
		this.createSearchBox();

		if (this.allCanvasFiles.length === 0) {
			this.createEmptyState();
		} else {
			this.createFileListContainer();
			this.updateFileList();
		}

		this.createActions();
	}

	// 创建搜索框
	private createSearchBox(): void {
		const searchContainer = this.contentEl.createDiv("canvas-search-container");

		// 搜索输入框
		this.searchInput = searchContainer.createEl("input", {
			type: "text",
			placeholder: this.gridView.settings.language === 'zh' ? "🔍 搜索Canvas文件..." : "🔍 Search Canvas files...",
			cls: "canvas-search-input"
		});

		// 清空按钮
		const clearButton = searchContainer.createEl("button", {
			cls: "canvas-search-clear",
			text: "×"
		});

		// 搜索事件监听
		this.searchInput.addEventListener('input', this.handleSearch.bind(this));

		// 清空按钮事件
		clearButton.addEventListener('click', () => {
			this.searchInput.value = '';
			this.handleSearch();
			this.searchInput.focus();
		});

		// 键盘事件
		this.searchInput.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.searchInput.value = '';
				this.handleSearch();
			}
		});
	}

	// 处理搜索
	private handleSearch(): void {
		const searchTerm = this.searchInput.value.toLowerCase().trim();

		if (searchTerm === '') {
			this.filteredFiles = [...this.allCanvasFiles];
		} else {
			this.filteredFiles = this.allCanvasFiles.filter(file => {
				const fileName = file.basename.toLowerCase();
				const filePath = file.path.toLowerCase();
				return fileName.includes(searchTerm) || filePath.includes(searchTerm);
			});
		}

		this.updateFileList();
	}

	// 创建文件列表容器
	private createFileListContainer(): void {
		this.fileListContainer = this.contentEl.createDiv("canvas-file-list");
	}

	// 更新文件列表
	private updateFileList(): void {
		if (!this.fileListContainer) return;

		// 清空现有内容
		this.fileListContainer.empty();

		if (this.filteredFiles.length === 0) {
			this.showNoResultsMessage();
			return;
		}

		// 渲染过滤后的文件
		this.filteredFiles.forEach(file => {
			const itemEl = this.fileListContainer.createDiv("canvas-file-item");

			itemEl.innerHTML = `
				<div class="file-icon">🎨</div>
				<div class="file-info">
					<div class="file-name">${this.highlightSearchTerm(file.basename)}</div>
					<div class="file-path">${this.highlightSearchTerm(file.path)}</div>
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

	// 高亮搜索词
	private highlightSearchTerm(text: string): string {
		const searchTerm = this.searchInput?.value.toLowerCase().trim();
		if (!searchTerm) return text;

		const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		return text.replace(regex, '<mark>$1</mark>');
	}

	// 显示无结果消息
	private showNoResultsMessage(): void {
		const noResultsEl = this.fileListContainer.createDiv("canvas-search-no-results");
		noResultsEl.innerHTML = `
			<div class="no-results-icon">🔍</div>
			<div class="no-results-title">未找到匹配的Canvas文件</div>
			<div class="no-results-desc">尝试使用不同的关键词搜索</div>
		`;
	}

	private createEmptyState(): void {
		const emptyEl = this.contentEl.createDiv("canvas-selection-empty");
		emptyEl.innerHTML = `
			<div class="empty-icon">📄</div>
			<div class="empty-title">没有找到Canvas文件</div>
			<div class="empty-desc">请先创建一个Canvas文件，然后再进行关联</div>
		`;
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
			DebugManager.error('Failed to create canvas file:', error);
		}
	}
}



// 网格视图类
export class CanvasGridView extends ItemView {
	settings!: CanvasGridSettings;
	plugin!: CanvasGridPlugin;
	canvasData: CanvasData | null = null;
	gridContainer!: HTMLElement;



	// UI组件管理器
	private uiComponentManager!: UIComponentManager;

	// 搜索和过滤管理器
	private searchAndFilterManager!: SearchAndFilterManager;

	// 拖拽管理器
	private dragDropManager!: DragDropManager;

	// P1级别管理器
	// Canvas API管理器
	private canvasAPIManager!: CanvasAPIManager;

	// 文件系统管理器
	private fileSystemManager!: FileSystemManager;

	// 主题管理器
	private themeManager!: ThemeManager;

	// 时间胶囊管理器
	private timeCapsuleManager!: TimeCapsuleManager;

	// P2级别管理器
	// 导航管理器
	private navigationManager!: NavigationManager;

	// 新增：状态管理器
	private editorStateManager!: EditorStateManager;
	private memoryBufferManager!: MemoryBufferManager;
	private saveTriggerManager!: SaveTriggerManager;
	private conflictResolver!: ConflictResolver;

	// 新增：临时文件和编辑器管理器
	private tempFileManager!: TempFileManager;
	private hiddenEditorManager!: HiddenEditorManager;
	private editorStateCoordinator!: EditorStateCoordinator;
	private diagnosticsManager!: DiagnosticsManager;

	// 验证管理器
	private validationManager!: ValidationManager;

	// 缓存管理器 - 使用简单Map实现
	private cacheManager = new Map<string, any>();

	// 性能管理器
	private performanceManager!: PerformanceManager;

	// Obsidian渲染管理器
	private obsidianRenderManager!: ObsidianRenderManager;



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

	// 视图相关属性
	private currentView: 'grid' = 'grid';



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

	// 链接预览缓存 - 使用简单的Map实现
	private linkPreviewCache = new Map<string, { data: LinkPreview; timestamp: number }>();
	private previewLoadingUrls: Set<string> = new Set();
	private readonly CACHE_TTL = 30 * 60 * 1000; // 缓存30分钟过期

	// Canvas兼容模式：使用保存操作标志替代文件监听器禁用机制
	private isSaveOperationInProgress: boolean = false;
	private lastSaveTimestamp: number = 0;

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

	// 🎯 修复：DOM元素注册表，确保元素唯一性
	private domElementRegistry: DOMElementRegistry = new DOMElementRegistry();

	// 🎯 修复：数据缓存替代DOM缓存
	private dataCache = new Map<string, CardRenderData>();

	// 🎯 修复：数据一致性验证器
	private dataConsistencyValidator: DataConsistencyValidator | null = null;

	// 数据验证器实例
	private dataValidator = new DataValidator();

	// 🎯 修复：增量渲染器
	private incrementalRenderer: IncrementalRenderer | null = null;

	// 🎯 修复：DOM状态监控器
	private domStateMonitor: DOMStateMonitor | null = null;

	// 编辑状态管理
	private currentEditingCard: HTMLElement | null = null;
	private currentEditingNode: CanvasNode | null = null;

	// 卡片选中状态管理（官方Canvas逻辑）
	private selectedCard: HTMLElement | null = null;
	private selectedNode: CanvasNode | null = null;

	// 右键菜单操作标志
	private isContextMenuActionExecuting: boolean = false;

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



		// 初始化UI组件管理器
		this.initializeUIComponentManager();

		// 初始化搜索和过滤管理器
		this.initializeSearchAndFilterManager();

		// 初始化拖拽管理器
		this.initializeDragDropManager();

		// 初始化P1级别管理器
		this.initializeCanvasAPIManager();
		this.initializeFileSystemManager();
		this.initializeThemeManager();
		this.initializeTimeCapsuleManager();

		// 初始化P2级别管理器
		this.initializeNavigationManager();

		// 初始化状态管理器
		this.initializeStateManagers();
		this.initializeValidationManager();
		this.initializeCacheManager();
		this.initializePerformanceManager();
		this.initializeObsidianRenderManager();

		// 建立与官方Canvas的双向同步
		this.setupCanvasDataSync();
	}





	// 初始化UI组件管理器
	private initializeUIComponentManager(): void {
		const uiConfig: UIComponentConfig = {
			theme: 'auto',
			language: 'zh',
			showTooltips: true,
			animationEnabled: true,
			compactMode: false
		};

		this.uiComponentManager = new UIComponentManager(this.app, uiConfig);
		DebugManager.log('✅ UIComponentManager initialized');
	}

	// 初始化搜索和过滤管理器
	private initializeSearchAndFilterManager(): void {
		const searchConfig: SearchConfig = {
			caseSensitive: false,
			wholeWord: false,
			useRegex: false,
			searchInContent: true,
			searchInTags: false,
			searchInFilenames: true,
			debounceDelay: 300
		};

		const filterConfig: FilterConfig = {
			enableColorFilter: true,
			enableTypeFilter: true,
			enableDateFilter: false,
			enableSizeFilter: false
		};

		const sortConfig: SortConfig = {
			sortBy: 'name',
			sortOrder: 'asc',
			groupBy: 'none'
		};

		this.searchAndFilterManager = new SearchAndFilterManager(
			this.app,
			searchConfig,
			filterConfig,
			sortConfig
		);
		DebugManager.log('✅ SearchAndFilterManager initialized');
	}

	// 初始化拖拽管理器
	private initializeDragDropManager(): void {
		const dragDropConfig: DragDropConfig = {
			enableDragToCreate: true,
			enableDragToReorder: true,
			enableDropFromExternal: true,
			enableDropToCanvas: true,
			dragThreshold: 5,
			dropZoneHighlight: true,
			autoScroll: true,
			dragPreview: true
		};

		this.dragDropManager = new DragDropManager(this.app, dragDropConfig);

		// 注册主网格容器为放置区域
		if (this.gridContainer) {
			this.dragDropManager.registerDropZone(this.gridContainer, 'grid');
		}

		DebugManager.log('✅ DragDropManager initialized with grid support');
	}

	// 初始化Canvas API管理器
	private initializeCanvasAPIManager(): void {
		const canvasAPIConfig: CanvasAPIConfig = {
			enableAutoSave: true,
			autoSaveInterval: 30000, // 30秒
			enableVersionControl: true,
			maxBackupVersions: 10,
			enableConflictResolution: true,
			syncMode: 'auto'
		};

		this.canvasAPIManager = new CanvasAPIManager(this.app, canvasAPIConfig);
		DebugManager.log('✅ CanvasAPIManager initialized');
	}

	// 初始化文件系统管理器
	private initializeFileSystemManager(): void {
		const fileSystemConfig: FileSystemConfig = {
			enableFileWatcher: true,
			enableAutoBackup: false,
			backupInterval: 300000, // 5分钟
			maxBackupFiles: 5,
			enableFileValidation: true,
			allowedFileTypes: ['.md', '.canvas', '.json', '.txt'],
			enableTrash: true,
			enableFileHistory: true
		};

		this.fileSystemManager = new FileSystemManager(this.app, fileSystemConfig);
		DebugManager.log('✅ FileSystemManager initialized');
	}

	// 初始化主题管理器
	private initializeThemeManager(): void {
		const themeConfig: ThemeConfig = {
			mode: 'auto',
			enableTransitions: true,
			transitionDuration: 200,
			enableColorScheme: true,
			colorScheme: DEFAULT_COLOR_SCHEMES.obsidian,
			enableCustomCSS: false,
			customCSS: ''
		};

		this.themeManager = new ThemeManager(this.app, themeConfig);
		DebugManager.log('✅ ThemeManager initialized');
	}

	// 初始化时间胶囊管理器
	private initializeTimeCapsuleManager(): void {
		const timeCapsuleConfig: TimeCapsuleConfig = {
			enabled: true,
			defaultDuration: 60, // 60分钟
			autoCollectClipboard: false,
			showNotifications: true,
			maxCapsules: 100,
			enableAutoCleanup: true,
			cleanupInterval: 3600000, // 1小时
			enableEncryption: false,
			storageLocation: 'time-capsules.json'
		};

		this.timeCapsuleManager = new TimeCapsuleManager(this.app, timeCapsuleConfig);
		DebugManager.log('✅ TimeCapsuleManager initialized');
	}

	// 初始化导航管理器
	private initializeNavigationManager(): void {
		const navigationConfig: NavigationConfig = {
			enableBreadcrumbs: true,
			enableBackForward: true,
			enableQuickJump: true,
			maxHistorySize: PERFORMANCE_CONSTANTS.MAX_HISTORY_SIZE,
			enableKeyboardShortcuts: true,
			shortcuts: {
				back: 'Alt+Left',
				forward: 'Alt+Right',
				home: 'Alt+Home',
				search: 'Ctrl+K',
				jumpToFile: 'Ctrl+O',
				jumpToLine: 'Ctrl+G'
			},
			enableContextMenu: true,
			enableMinimap: false
		};

		this.navigationManager = new NavigationManager(this.app, navigationConfig);
		DebugManager.log('✅ NavigationManager initialized');
	}

	// 初始化状态管理器
	private initializeStateManagers(): void {
		// 初始化编辑器状态管理器
		this.editorStateManager = new EditorStateManager();

		// 初始化内存缓冲管理器（Canvas兼容模式）
		this.memoryBufferManager = new MemoryBufferManager({
			autoSaveDelay: 0, // 立即保存，无延迟
			enableAutoSave: false, // 禁用自动保存，采用官方Canvas兼容策略
			saveOnBlur: false, // 禁用失焦保存，避免冲突
			saveOnViewSwitch: false // 禁用视图切换保存
		});

		// 初始化冲突解决器
		this.conflictResolver = new ConflictResolver(this.app);

		// 初始化保存触发器管理器（Canvas兼容模式）
		this.saveTriggerManager = new SaveTriggerManager(this.app, {
			onBlur: false, // 禁用失焦保存，避免与官方Canvas冲突
			onManualSave: true, // 保留手动保存（Ctrl+S）
			onAppClose: true, // 保留应用关闭保存
			onViewSwitch: false, // 禁用视图切换保存
			onFileClose: false, // 禁用文件关闭保存
			onAutoSave: false // 禁用自动保存
		});

		// 初始化新的临时文件和编辑器管理器
		this.tempFileManager = TempFileManager.getInstance(this.app);
		this.hiddenEditorManager = new HiddenEditorManager(this.app);
		this.editorStateCoordinator = new EditorStateCoordinator(this.app, this.editorStateManager);

		// 初始化诊断管理器
		this.diagnosticsManager = new DiagnosticsManager(
			this.app,
			this.tempFileManager,
			this.editorStateCoordinator
		);

		// 设置回调函数
		this.setupStateManagerCallbacks();

		// 启动定期健康检查
		this.startPeriodicHealthCheck();

		DebugManager.log('✅ State managers initialized');
	}

	// 设置状态管理器回调函数
	private setupStateManagerCallbacks(): void {
		// 设置保存触发器管理器的回调
		this.saveTriggerManager.setCallbacks({
			hasUnsavedChanges: () => this.memoryBufferManager.hasUnsavedChanges(),
			getMemoryVersion: () => this.memoryBufferManager.getMemoryVersion(),
			getFileVersion: () => this.memoryBufferManager.getFileVersion(),
			hasActiveEditors: () => this.editorStateManager.hasActiveEditors()
		});

		// 添加保存回调
		this.saveTriggerManager.addSaveCallback(async (trigger) => {
			await this.performSaveWithNewSystem(trigger);
		});

		// 添加内存缓冲管理器的保存回调
		this.memoryBufferManager.addSaveCallback(async (trigger) => {
			await this.performSaveWithNewSystem(trigger);
		});

		// 监听编辑器状态变化
		this.editorStateManager.addStateChangeListener((nodeId, state) => {
			this.onEditorStateChanged(nodeId, state);

			// 显示编辑状态指示器
			this.showEditingIndicator(nodeId, state.editingMode !== 'none');
		});

		// 监听内存缓冲区变化
		this.memoryBufferManager.addChangeListener((hasChanges) => {
			this.showUnsavedChangesIndicator(hasChanges);
		});

		// 注册键盘快捷键
		this.registerKeyboardShortcuts();

		// 启动性能监控
		this.startPerformanceMonitoring();

		// 延迟运行系统测试（给系统时间完全初始化）
		setTimeout(() => {
			this.runBasicSystemValidation();
		}, 2000);

		DebugManager.log('State manager callbacks configured');
	}

	// 初始化验证管理器
	private initializeValidationManager(): void {
		const validationConfig: ValidationConfig = {
			enableRealTimeValidation: true,
			enableStrictMode: false,
			maxErrorsPerField: 5,
			validationTimeout: 5000,
			enableCustomRules: true,
			customRules: [],
			enableAsyncValidation: true,
			debounceDelay: 300
		};

		this.validationManager = new ValidationManager(this.app, validationConfig);
		DebugManager.log('✅ ValidationManager initialized');
	}

	// 初始化缓存管理器 - 简化实现
	private initializeCacheManager(): void {
		// 缓存管理器已简化为Map，无需特殊初始化
		DebugManager.log('✅ Simple cache manager initialized');
	}

	// 初始化性能管理器
	private initializePerformanceManager(): void {
		const performanceConfig: PerformanceConfig = {
			enableMonitoring: true,
			enableProfiling: true,
			sampleRate: 0.1, // 10%采样率
			maxMetricsHistory: 1000,
			enableMemoryTracking: true,
			enableRenderTracking: true,
			enableNetworkTracking: true,
			alertThresholds: {
				responseTime: 1000, // 1秒
				memoryUsage: 350, // 🎯 修复：提高内存阈值到350MB，避免进程级误报
				renderTime: 100, // 100ms
				fpsThreshold: 30, // 30FPS
				bundleSize: 1024 // 1MB
			},
			enableOptimizations: true,
			optimizationStrategies: []
		};

		this.performanceManager = new PerformanceManager(this.app, performanceConfig);
		DebugManager.log('✅ PerformanceManager initialized');
	}

	// 初始化Obsidian渲染管理器
	private initializeObsidianRenderManager(): void {
		this.obsidianRenderManager = new ObsidianRenderManager(this.app, {
			enableCache: true,
			cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
			maxCacheSize: 100,
			enableLazyLoading: true,
			performanceMonitoring: true
		});
		DebugManager.log('✅ ObsidianRenderManager initialized');
	}

	// 🎯 新增：初始化数据一致性组件
	private initializeDataConsistencyComponents(): void {
		// 初始化数据一致性验证器（延迟初始化，等待gridContainer创建）
		// 在onOpen方法中完成初始化

		// 初始化增量渲染器
		this.incrementalRenderer = new IncrementalRenderer();

		DebugManager.log('✅ 数据一致性组件初始化完成');
	}

	// 🎯 新增：完成数据一致性组件初始化（在gridContainer创建后）
	private completeDataConsistencyInitialization(): void {
		if (!this.gridContainer) return;

		// 初始化数据一致性验证器
		this.dataConsistencyValidator = new DataConsistencyValidator(
			this.gridContainer,
			this.canvasData,
			this.domElementRegistry
		);

		// 初始化DOM状态监控器
		this.domStateMonitor = new DOMStateMonitor(
			this.gridContainer,
			(report: StateReport) => {
				DebugManager.warn('DOM状态异常:', report);
				this.handleDOMStateIssue(report);
			}
		);

		// 开始监控
		this.domStateMonitor.startMonitoring();

		DebugManager.log('✅ 数据一致性组件完整初始化完成');
	}

	// 🎯 新增：处理DOM状态问题
	private handleDOMStateIssue(report: StateReport): void {
		if (this.dataConsistencyValidator) {
			const consistencyReport = this.dataConsistencyValidator.validateFullConsistency();
			if (!consistencyReport.isConsistent) {
				DebugManager.warn('检测到数据不一致，尝试自动修复');
				this.dataConsistencyValidator.autoFixInconsistencies(consistencyReport)
					.then(fixResult => {
						if (fixResult.success) {
							DebugManager.log('自动修复成功:', fixResult.fixedIssues);
						} else {
							DebugManager.error('自动修复失败:', fixResult.failedFixes);
						}
					});
			}
		}
	}

	// 🎯 新增：彻底清理方法
	private async thoroughCleanup(): Promise<void> {
		DebugManager.log('🧹 开始彻底清理');

		// 停止DOM监控
		if (this.domStateMonitor) {
			this.domStateMonitor.stopMonitoring();
		}

		// 清理DOM元素
		if (this.gridContainer) {
			this.gridContainer.empty();
		}

		// 清理DOM元素注册表
		this.domElementRegistry.clearAll();

		// 清理数据缓存
		this.clearDataCache();

		// 重置增量渲染器状态
		if (this.incrementalRenderer) {
			this.incrementalRenderer.clearRenderState();
		}

		// 重置状态变量
		this.resetRenderState();

		// 清理事件监听器引用
		this.cleanupEventReferences();

		DebugManager.log('✅ 彻底清理完成');
	}

	// 🎯 新增：重置渲染状态
	private resetRenderState(): void {
		this.currentEditingCard = null;
		this.currentEditingNode = null;
		this.selectedCard = null;
		this.selectedNode = null;
	}

	// 🎯 新增：清理事件引用
	private cleanupEventReferences(): void {
		// 清理可能的事件监听器引用
		// 这里可以添加更多的清理逻辑
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

	// 清理过期的缓存项
	private cleanupExpiredCache(): void {
		const now = Date.now();

		// 由于使用了LRU缓存，我们只需要清理过期项
		// LRU缓存会自动管理大小限制
		const expiredKeys: string[] = [];

		// 注意：这里需要重新实现，因为LRU缓存的内部结构不同
		// 暂时跳过过期清理，依赖LRU的自动管理
		DebugManager.log('缓存清理完成，当前缓存大小:', this.linkPreviewCache.size);
	}

	// 清理过期的加载状态
	private cleanupLoadingUrls(): void {
		// 清理可能卡住的加载状态
		this.previewLoadingUrls.clear();
	}

	// 获取缓存项
	private getCacheItem(url: string): LinkPreview | null {
		const cached = this.linkPreviewCache.get(url);
		if (cached) {
			const now = Date.now();
			if (now - cached.timestamp < this.CACHE_TTL) {
				return cached.data;
			} else {
				// 过期删除
				this.linkPreviewCache.delete(url);
			}
		}
		return null;
	}

	// 设置缓存项
	private setCacheItem(url: string, data: LinkPreview): void {
		this.linkPreviewCache.set(url, {
			data,
			timestamp: Date.now()
		});
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
			DebugManager.error('Canvasgrid Transit: Container element not found');
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

		// 🎯 新增：完成数据一致性组件初始化
		this.completeDataConsistencyInitialization();

		this.setupEventDelegation();

		// 尝试加载当前活动的Canvas文件
		await this.loadActiveCanvas();

		// 初始化拖拽功能
		this.initializeDragSystem();

		// 初始化搜索和排序
		this.initializeSearchAndSort();

		// 初始化宽度控制
		this.initializeWidthControl();

		// 启动定期缓存清理（每10分钟清理一次）
		this.cacheCleanupInterval = this.safeSetInterval(() => {
			this.cleanupExpiredCache();
			this.cleanupLoadingUrls();
		}, 10 * 60 * 1000);

		// 注册到内存管理器
		MemoryManager.registerCleanup(() => {
			this.cleanupExpiredCache();
			this.cleanupLoadingUrls();
		});
	}

	// 初始化搜索和排序功能
	private initializeSearchAndSort(): void {
		DebugManager.log('🔧 Initializing search and sort functionality');

		// 初始化筛选节点数组
		this.filteredNodes = this.canvasData?.nodes || [];

		// 重置搜索状态
		this.searchQuery = '';
		this.activeColorFilter = null;

		DebugManager.log(`📊 Initialized with ${this.filteredNodes.length} nodes`);
		DebugManager.log(`🔄 Default sort: ${this.sortBy} (${this.sortOrder})`);

		// 应用默认排序
		this.applySortAndFilter();
	}

	// 创建新的工具栏布局
	createToolbar(container: Element) {
		// 创建新的工具栏结构
		const toolbar = container.createDiv("canvas-grid-toolbar");

		// 顶部功能按钮行
		const functionRow = toolbar.createDiv("canvas-grid-toolbar-function-row");
		this.createFunctionButtons(functionRow);

		// 动态内容区域
		const dynamicContent = toolbar.createDiv("canvas-grid-toolbar-dynamic-content");
		this.createDynamicContentPanels(dynamicContent);

		// 时间胶囊已移动到面板中，不再需要右侧固定位置
	}

	// 创建功能按钮
	private createFunctionButtons(container: Element): void {
		const buttons = [
			{
				id: 'search',
				text: this.settings.language === 'zh' ? '搜索' : 'Search',
				icon: 'search',
				handler: this.toggleSearchPanel.bind(this)
			},
			{
				id: 'create',
				text: this.settings.language === 'zh' ? '创建' : 'Create',
				icon: 'plus',
				handler: this.toggleCreatePanel.bind(this)
			},
			{
				id: 'color-dots',
				text: this.settings.language === 'zh' ? '彩色圆点' : 'Color Filter',
				icon: 'palette',
				handler: this.toggleColorDotsPanel.bind(this)
			},
			{
				id: 'export',
				text: this.settings.language === 'zh' ? 'Anki同步' : 'Anki Sync',
				icon: 'download',
				handler: this.toggleExportPanel.bind(this)
			}
		];

		// 🎯 修复：先创建多功能菜单按钮（独立容器）
		this.createMultiMenuButton(container);

		// 然后创建其他功能按钮
		buttons.forEach(btn => {
			const buttonEl = container.createEl('button', {
				cls: `function-btn responsive-btn ${btn.id}-btn`
			});

			// 创建图标容器
			const iconEl = buttonEl.createEl('span', {
				cls: 'btn-icon'
			});
			iconEl.innerHTML = this.getIconSVG(btn.icon);

			// 创建文本容器
			const textEl = buttonEl.createEl('span', {
				cls: 'btn-text',
				text: btn.text
			});

			// 添加tooltip属性
			buttonEl.setAttribute('title', btn.text);
			buttonEl.setAttribute('aria-label', btn.text);

			buttonEl.addEventListener('click', btn.handler);
		});

		// 设置响应式监听器
		this.setupResponsiveToolbar(container);
	}

	// 🎯 修复：创建多功能菜单按钮（独立容器，正确的DOM结构）
	private createMultiMenuButton(container: Element): void {
		// 创建多功能菜单容器
		const menuContainer = container.createDiv("canvas-grid-multi-menu-container");

		// 创建多功能菜单按钮
		const menuButton = menuContainer.createEl('button', {
			cls: 'function-btn responsive-btn multi-menu-btn'
		});

		// 创建图标容器
		const iconEl = menuButton.createEl('span', {
			cls: 'btn-icon'
		});
		iconEl.innerHTML = this.getIconSVG('menu');

		// 创建文本容器
		const textEl = menuButton.createEl('span', {
			cls: 'btn-text',
			text: this.settings.language === 'zh' ? '多功能菜单' : 'Multi Menu'
		});

		// 添加tooltip属性
		menuButton.setAttribute('title', this.settings.language === 'zh' ? '多功能菜单' : 'Multi Menu');
		menuButton.setAttribute('aria-label', this.settings.language === 'zh' ? '多功能菜单' : 'Multi Menu');

		// 创建下拉菜单（在同一个容器中）
		const dropdown = menuContainer.createDiv("canvas-grid-main-dropdown");
		dropdown.style.display = 'none';

		// 创建菜单内容
		this.createMainMenuContent(dropdown);

		// 按钮点击事件
		menuButton.addEventListener('click', (e) => {
			e.stopPropagation();
			const isVisible = dropdown.style.display !== 'none';

			// 如果当前菜单已显示，则关闭
			if (isVisible) {
				this.hideAllDropdowns();
			} else {
				// 先关闭所有其他菜单和面板
				this.hideAllDropdowns();
				this.closeDynamicContent();

				// 然后显示多功能菜单
				dropdown.style.display = 'block';
				menuButton.classList.add('active');
			}
		});

		// 阻止菜单内部点击冒泡
		dropdown.addEventListener('click', (e) => {
			e.stopPropagation();
		});
	}

	// 获取图标SVG
	private getIconSVG(iconName: string): string {
		const icons: Record<string, string> = {
			'menu': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
			'search': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
			'plus': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
			'palette': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
			'download': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>'
		};
		return icons[iconName] || icons['menu'];
	}

	// 设置响应式工具栏
	private setupResponsiveToolbar(container: Element): void {
		const toolbar = container.closest('.canvas-grid-toolbar') as HTMLElement;
		if (!toolbar) return;

		// 响应式断点
		const BREAKPOINTS = {
			ICON_ONLY: 500,
			COMPACT: 700,
			FULL: 900
		};

		// 更新按钮显示模式
		const updateButtonDisplay = () => {
			const width = toolbar.offsetWidth;
			const buttons = toolbar.querySelectorAll('.responsive-btn');

			buttons.forEach(btn => {
				const textEl = btn.querySelector('.btn-text') as HTMLElement;
				if (!textEl) return;

				btn.classList.remove('icon-only', 'compact', 'full');

				if (width < BREAKPOINTS.ICON_ONLY) {
					btn.classList.add('icon-only');
					textEl.style.display = 'none';
				} else if (width < BREAKPOINTS.COMPACT) {
					btn.classList.add('compact');
					textEl.style.display = 'inline';
				} else {
					btn.classList.add('full');
					textEl.style.display = 'inline';
				}
			});
		};

		// 使用ResizeObserver监听容器大小变化
		if (window.ResizeObserver) {
			const resizeObserver = new ResizeObserver(() => {
				updateButtonDisplay();
			});
			resizeObserver.observe(toolbar);
		} else {
			// 降级方案：使用window resize事件
			window.addEventListener('resize', updateButtonDisplay);
		}

		// 初始化显示
		updateButtonDisplay();
	}

	// 创建动态内容面板
	private createDynamicContentPanels(container: Element): void {
		// 搜索面板
		const searchPanel = container.createDiv('content-panel search-panel');
		const searchWrapper = searchPanel.createDiv('panel-content-wrapper');
		const searchMainContent = searchWrapper.createDiv('panel-main-content');
		this.createSearchBox(searchMainContent);
		const searchRightSide = searchWrapper.createDiv('panel-right-side');
		this.createTimeCapsuleInPanel(searchRightSide);

		// 创建面板
		const createPanel = container.createDiv('content-panel create-panel');
		this.createNewCardForm(createPanel);

		// 颜色筛选面板
		const colorPanel = container.createDiv('content-panel color-dots-panel');
		const colorWrapper = colorPanel.createDiv('panel-content-wrapper');
		const colorMainContent = colorWrapper.createDiv('panel-main-content');
		this.createColorFilter(colorMainContent);
		const colorRightSide = colorWrapper.createDiv('panel-right-side');
		this.createTimeCapsuleInPanel(colorRightSide);

		// 导出面板
		const exportPanel = container.createDiv('content-panel export-panel');
		this.createExportOptions(exportPanel);
	}

	// 面板切换逻辑
	private togglePanel(panelType: string): void {
		const dynamicContent = this.containerEl.querySelector('.canvas-grid-toolbar-dynamic-content');
		const allPanels = dynamicContent?.querySelectorAll('.content-panel');
		const allButtons = this.containerEl.querySelectorAll('.function-btn');
		const targetPanel = dynamicContent?.querySelector(`.${panelType}-panel`);
		const targetButton = this.containerEl.querySelector(`.${panelType}-btn`);

		// 如果当前面板已激活，则关闭
		if (targetPanel?.classList.contains('active')) {
			this.closeDynamicContent();
			return;
		}

		// 先关闭多功能菜单（确保面板和菜单互斥）
		this.hideAllDropdowns();

		// 关闭所有面板和按钮
		allPanels?.forEach(panel => panel.classList.remove('active'));
		allButtons?.forEach(btn => btn.classList.remove('active'));

		// 激活目标面板和按钮
		targetPanel?.classList.add('active');
		targetButton?.classList.add('active');
		dynamicContent?.classList.add('expanded');
	}

	// 关闭动态内容区域
	private closeDynamicContent(): void {
		const dynamicContent = this.containerEl.querySelector('.canvas-grid-toolbar-dynamic-content');
		const allPanels = dynamicContent?.querySelectorAll('.content-panel');
		const allButtons = this.containerEl.querySelectorAll('.function-btn');

		allPanels?.forEach(panel => panel.classList.remove('active'));
		allButtons?.forEach(btn => btn.classList.remove('active'));
		dynamicContent?.classList.remove('expanded');
	}

	// 各个面板的切换方法（多功能菜单现在由按钮直接处理）

	// 在面板中创建时间胶囊
	private createTimeCapsuleInPanel(container: Element): void {
		const timeCapsuleBtn = container.createEl('button', {
			cls: 'canvas-grid-time-capsule-btn panel-time-capsule',
			title: '时间胶囊 - 点击开始倒计时'
		});

		// 创建倒计时显示容器
		const timerDisplay = timeCapsuleBtn.createEl('span', {
			cls: 'timer-display'
		});

		// 初始显示时钟图标
		this.updatePanelTimeCapsuleDisplay(timeCapsuleBtn, timerDisplay);

		// 添加点击事件
		timeCapsuleBtn.addEventListener('click', () => {
			this.toggleTimeCapsule();
		});

		// 存储按钮引用以便更新显示
		container.setAttribute('data-time-capsule-btn', 'true');
	}

	// 更新面板中时间胶囊的显示
	private updatePanelTimeCapsuleDisplay(button: HTMLElement, display: HTMLElement): void {
		if (this.timeCapsuleState.isActive) {
			// 显示倒计时
			const minutes = Math.floor(this.timeCapsuleState.remainingTime / 60000);
			const seconds = Math.floor((this.timeCapsuleState.remainingTime % 60000) / 1000);
			const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

			display.innerHTML = timeText;
			button.classList.add('active', 'counting');
			button.title = `时间胶囊收集中 - 剩余 ${timeText}`;
		} else {
			// 显示时钟图标
			display.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>';
			button.classList.remove('active', 'counting');
			button.title = '时间胶囊 - 点击开始倒计时';
		}
	}

	// 更新所有面板中的时间胶囊按钮
	private updateAllPanelTimeCapsules(): void {
		const panelButtons = this.containerEl.querySelectorAll('.panel-time-capsule');
		panelButtons.forEach(button => {
			const display = button.querySelector('.timer-display');
			if (display) {
				this.updatePanelTimeCapsuleDisplay(button as HTMLElement, display as HTMLElement);
			}
		});
	}

	private toggleSearchPanel(): void {
		this.togglePanel('search');
	}

	private toggleCreatePanel(): void {
		this.togglePanel('create');
	}

	private toggleColorDotsPanel(): void {
		this.togglePanel('color-dots');
	}

	private toggleExportPanel(): void {
		this.togglePanel('export');
	}

	// 创建新卡片表单
	private createNewCardForm(container: Element): void {
		const form = container.createDiv('new-card-form');

		// 卡片类型选择
		const typeSelect = form.createEl('select', { cls: 'card-type-select' });
		typeSelect.createEl('option', { value: 'text', text: '文本卡片' });
		typeSelect.createEl('option', { value: 'link', text: '链接卡片' });

		// 内容输入框
		const contentInput = form.createEl('textarea', {
			cls: 'card-content-input',
			attr: { placeholder: '输入卡片内容...' }
		});

		// 创建按钮
		const createBtn = form.createEl('button', {
			cls: 'create-card-btn mod-cta',
			text: '创建卡片'
		});

		createBtn.addEventListener('click', () => {
			this.handleCreateNewCard(typeSelect.value, contentInput.value);
		});
	}

	// 创建Anki同步选项
	private createExportOptions(container: Element): void {
		const ankiSyncContainer = container.createDiv('anki-sync-options');

		// 检查Anki Connect是否启用
		if (!this.settings.ankiConnect.enabled) {
			this.createAnkiDisabledMessage(ankiSyncContainer);
			return;
		}

		// 创建同步历史表格
		this.createCurrentCanvasSyncHistory(ankiSyncContainer);
	}

	// 创建当前Canvas同步历史
	private createCurrentCanvasSyncHistory(container: Element): void {
		const historyContainer = container.createDiv('current-canvas-sync-history');

		// 创建同步历史表格容器（移除标题）
		const tableContainer = historyContainer.createDiv('current-sync-table-container');
		tableContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 12px;
			border: 1px solid var(--background-modifier-border);
			margin-bottom: 12px;
		`;

		// 创建表格
		const table = tableContainer.createEl('table', {
			cls: 'current-sync-table'
		});
		table.style.cssText = `
			width: 100%;
			border-collapse: collapse;
			font-size: 12px;
		`;

		// 表头
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.style.cssText = `
			border-bottom: 1px solid var(--background-modifier-border);
		`;

		const headers = this.settings.language === 'zh'
			? ['牌组', '新增', '更新', '跳过', '失败', '时间']
			: ['Deck', 'New', 'Updated', 'Skipped', 'Failed', 'Time'];

		headers.forEach((headerText, index) => {
			const th = headerRow.createEl('th');
			th.textContent = headerText;
			th.style.cssText = `
				padding: 8px 4px;
				text-align: center;
				font-weight: 600;
				color: var(--text-normal);
				font-size: 11px;
				${index < headers.length - 1 ? 'border-right: 1px solid var(--background-modifier-border);' : ''}
			`;
		});

		// 表体
		const tbody = table.createEl('tbody');
		const lastResult = this.settings.ankiSyncHistory.lastSyncResult;
		const lastSyncTime = this.settings.ankiSyncHistory.lastSyncTime;

		if (lastResult && lastSyncTime) {
			const dataRow = tbody.createEl('tr');
			dataRow.style.cssText = `
				border-bottom: 1px solid var(--background-modifier-border);
			`;

			// 数据单元格
			const data = [
				this.settings.ankiConnect.defaultDeck || 'Default',
				lastResult.created || 0,
				lastResult.updated || 0,
				lastResult.skipped || 0,
				lastResult.errors?.length || 0,
				this.formatSyncTime(lastSyncTime)
			];

			data.forEach((cellData, index) => {
				const td = dataRow.createEl('td');
				td.textContent = cellData.toString();
				td.style.cssText = `
					padding: 8px 4px;
					text-align: center;
					color: var(--text-normal);
					font-size: 11px;
					${index < data.length - 1 ? 'border-right: 1px solid var(--background-modifier-border);' : ''}
				`;

				// 为失败卡片添加错误样式
				if (index === 4 && cellData > 0) {
					td.style.color = 'var(--text-error)';
					td.style.fontWeight = '600';
				}
				// 为成功数据添加成功样式
				if ((index === 1 || index === 2) && cellData > 0) {
					td.style.color = 'var(--text-success)';
					td.style.fontWeight = '500';
				}
			});
		} else {
			// 无数据行
			const noDataRow = tbody.createEl('tr');
			const noDataCell = noDataRow.createEl('td');
			noDataCell.setAttribute('colspan', '6');
			noDataCell.textContent = this.settings.language === 'zh' ? '暂无同步历史' : 'No sync history';
			noDataCell.style.cssText = `
				padding: 16px;
				text-align: center;
				color: var(--text-muted);
				font-style: italic;
				font-size: 11px;
			`;
		}

		// 按钮容器 - 采用顶部导航栏样式
		const buttonContainer = historyContainer.createDiv('sync-button-container');
		buttonContainer.style.cssText = `
			display: flex;
			gap: 8px;
			margin-top: 12px;
		`;

		// 配置按钮 - 使用导航栏按钮样式
		const configButton = buttonContainer.createEl('button', {
			text: this.settings.language === 'zh' ? '⚙️ 配置' : '⚙️ Config',
			cls: 'canvas-grid-button toolbar-button'
		});
		configButton.style.cssText = `
			flex: 1;
			min-width: 80px;
			height: 36px;
			padding: 8px 16px;
			font-size: 13px;
			font-weight: 500;
			border-radius: 6px;
			background: var(--interactive-normal);
			color: var(--text-normal);
			border: 1px solid var(--background-modifier-border);
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			justify-content: center;
		`;

		configButton.addEventListener('click', () => {
			this.openAnkiSyncModal();
		});

		// 同步按钮 - 使用导航栏按钮样式
		const syncButton = buttonContainer.createEl('button', {
			text: this.settings.language === 'zh' ? '🃏 开始同步' : '🃏 Start Sync',
			cls: 'canvas-grid-button toolbar-button mod-cta'
		});
		syncButton.style.cssText = `
			flex: 2;
			min-width: 120px;
			height: 36px;
			padding: 8px 16px;
			font-size: 13px;
			font-weight: 500;
			border-radius: 6px;
			background: var(--interactive-accent);
			color: var(--text-on-accent);
			border: none;
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			justify-content: center;
		`;

		syncButton.addEventListener('click', async () => {
			await this.startDirectSync();
		});

		// 配置按钮悬停效果 - 导航栏样式
		configButton.addEventListener('mouseenter', () => {
			configButton.style.background = 'var(--interactive-hover)';
			configButton.style.borderColor = 'var(--interactive-accent)';
		});

		configButton.addEventListener('mouseleave', () => {
			configButton.style.background = 'var(--interactive-normal)';
			configButton.style.borderColor = 'var(--background-modifier-border)';
		});

		// 同步按钮悬停效果 - 导航栏样式
		syncButton.addEventListener('mouseenter', () => {
			syncButton.style.background = 'var(--interactive-accent-hover)';
		});

		syncButton.addEventListener('mouseleave', () => {
			syncButton.style.background = 'var(--interactive-accent)';
		});
	}

	// 格式化同步时间
	private formatSyncTime(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMins < 1) {
			return this.settings.language === 'zh' ? '刚刚' : 'Just now';
		} else if (diffMins < 60) {
			return this.settings.language === 'zh' ? `${diffMins}分钟前` : `${diffMins}m ago`;
		} else if (diffHours < 24) {
			return this.settings.language === 'zh' ? `${diffHours}小时前` : `${diffHours}h ago`;
		} else if (diffDays < 7) {
			return this.settings.language === 'zh' ? `${diffDays}天前` : `${diffDays}d ago`;
		} else {
			return date.toLocaleDateString();
		}
	}

	// 直接开始同步
	private async startDirectSync(): Promise<void> {
		try {
			// 检查Anki Connect是否启用
			if (!this.settings.ankiConnect.enabled) {
				new Notice(this.settings.language === 'zh' ?
					'请先在设置中启用Anki Connect' :
					'Please enable Anki Connect in settings first');
				return;
			}

			// 检查是否有选中的颜色
			if (this.settings.ankiConnect.syncColors.length === 0) {
				new Notice(this.settings.language === 'zh' ?
					'请先选择要同步的颜色' :
					'Please select colors to sync first');
				return;
			}

			// 开始同步
			await this.syncAllSelectedColorCards();

			// 刷新界面显示
			const exportPanel = this.containerEl.querySelector('.export-panel');
			if (exportPanel) {
				// 清空现有内容并重新创建
				while (exportPanel.firstChild) {
					exportPanel.removeChild(exportPanel.firstChild);
				}
				this.createExportOptions(exportPanel);
			}
		} catch (error) {
			console.error('直接同步失败:', error);
			new Notice(this.settings.language === 'zh' ?
				'同步失败，请检查Anki Connect连接' :
				'Sync failed, please check Anki Connect connection');
		}
	}

	// 打开Anki同步模态窗
	private openAnkiSyncModal(): void {
		const modal = new AnkiSyncModal(this.app, this);
		modal.open();
	}

	// 更新简要Anki状态
	private updateBriefAnkiStatus(container: Element): void {
		container.empty();

		const syncHistory = this.settings.ankiSyncHistory;
		if (syncHistory.lastSyncTime) {
			const lastSync = new Date(syncHistory.lastSyncTime);
			const statusText = this.settings.language === 'zh'
				? `上次同步: ${lastSync.toLocaleString()}`
				: `Last sync: ${lastSync.toLocaleString()}`;

			const statusEl = container.createEl('div', {
				text: statusText,
				cls: 'anki-status-text'
			});

			statusEl.style.cssText = `
				font-size: 12px;
				color: var(--text-muted);
				text-align: center;
			`;
		} else {
			const noSyncText = this.settings.language === 'zh' ? '尚未同步' : 'Not synced yet';
			const statusEl = container.createEl('div', {
				text: noSyncText,
				cls: 'anki-status-text'
			});

			statusEl.style.cssText = `
				font-size: 12px;
				color: var(--text-muted);
				text-align: center;
			`;
		}
	}

	// 创建右侧时间胶囊
	private createSideTimeCapsule(container: Element): void {
		const sideContainer = document.body.createDiv('canvas-grid-time-capsule-sidebar');
		this.createTimeCapsuleButton(sideContainer);
	}

	// 处理创建新卡片
	private async handleCreateNewCard(type: string, content: string): Promise<void> {
		if (!content.trim()) {
			new Notice('请输入卡片内容');
			return;
		}

		if (!this.canvasData) {
			new Notice('无法创建卡片：Canvas数据不存在');
			return;
		}

		try {
			// 生成新节点ID
			const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

			// 计算新卡片位置（避免重叠）
			const position = this.calculateNewCardPosition();

			// 创建新节点
			const newNode: CanvasNode = {
				id: nodeId,
				type: type as 'text' | 'link',
				x: position.x,
				y: position.y,
				width: GRID_CONSTANTS.CARD_WIDTH,
				height: GRID_CONSTANTS.CARD_HEIGHT,
				...(type === 'text' ? { text: content } : { url: content })
			};

			// 添加到Canvas数据
			this.canvasData.nodes.push(newNode);

			// 保存Canvas数据
			await this.saveCanvasData();

			// 刷新视图
			await this.renderGrid();

			// 关闭创建面板
			this.closeDynamicContent();

			new Notice(`已创建${type === 'text' ? '文本' : '链接'}卡片`);

			// 清空表单
			const contentInput = this.containerEl.querySelector('.card-content-input') as HTMLTextAreaElement;
			if (contentInput) {
				contentInput.value = '';
			}

		} catch (error) {
			DebugManager.error('创建卡片失败:', error);
			new Notice('创建卡片失败');
		}
	}

	// 计算新卡片位置
	private calculateNewCardPosition(): { x: number; y: number } {
		if (!this.canvasData || this.canvasData.nodes.length === 0) {
			return { x: 100, y: 100 };
		}

		// 找到最右下角的位置
		let maxX = 0;
		let maxY = 0;

		this.canvasData.nodes.forEach(node => {
			const rightEdge = node.x + (node.width || GRID_CONSTANTS.CARD_WIDTH);
			const bottomEdge = node.y + (node.height || GRID_CONSTANTS.CARD_HEIGHT);

			if (rightEdge > maxX) maxX = rightEdge;
			if (bottomEdge > maxY) maxY = bottomEdge;
		});

		// 在最右下角添加一些间距
		return {
			x: maxX + 50,
			y: maxY + 50
		};
	}























	// 创建主菜单按钮
	private createMainMenuButton(container: Element): void {
		const menuContainer = container.createDiv("canvas-grid-main-menu");

		// 主菜单按钮 - 纯图标模式
		const mainBtn = menuContainer.createEl("button", {
			cls: "canvas-grid-main-btn canvas-grid-icon-only",
			title: this.settings.language === 'zh' ? "网格视图菜单" : "Grid View Menu"
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
			this.linkedCanvasFile = null;
			this.canvasData = null;
			this.renderGrid();
			new Notice('已解除Canvas文件关联');
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

		DebugManager.log(`🎛️ Creating sort submenu with current sort: ${this.sortBy} (${this.sortOrder})`);

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
				DebugManager.log(`🔄 Sort option clicked: ${option.key} (current: ${this.sortBy})`);

				if (this.sortBy === option.key) {
					// 如果是当前排序字段，切换升序/降序
					this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
					DebugManager.log(`🔄 Toggled sort order to: ${this.sortOrder}`);
				} else {
					// 如果是新的排序字段，默认使用降序（最新的在前）
					this.sortBy = option.key as any;
					this.sortOrder = 'desc';
					DebugManager.log(`🔄 Changed sort to: ${this.sortBy} (${this.sortOrder})`);
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
			DebugManager.error('Failed to create new canvas file:', error);
			new Notice('创建Canvas文件失败');
		}
	}

	// 同步Canvas数据（合并刷新和同步功能）
	private async syncCanvasData(): Promise<void> {
		try {
			if (this.linkedCanvasFile) {
				// 有关联文件时，重新加载关联文件数据
				await this.loadCanvasDataFromOfficialView(this.linkedCanvasFile);
				this.notifyCanvasViewRefresh();
				new Notice('Canvas数据已同步');
			} else {
				// 没有关联文件时，加载当前活动的Canvas
				await this.loadActiveCanvas();
				new Notice('Canvas数据已刷新');
			}
		} catch (error) {
			DebugManager.error('Failed to sync canvas data:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			new Notice(`同步数据失败: ${errorMessage}`);
			this.showErrorState(`同步失败: ${errorMessage}`);
		}
	}

	// exportGridData 已迁移到 FileSystemManager

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

	// createActionButtons 已迁移到 UIComponentManager

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
		SVGIconManager.setIcon(clearBtn, 'close');
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

		// 设置重新设计的混合色渐变背景
		allBtn.style.background = 'conic-gradient(from 45deg, #ff6b6b 0deg 45deg, #ffa726 45deg 90deg, #ffeb3b 90deg 135deg, #66bb6a 135deg 180deg, #26c6da 180deg 225deg, #42a5f5 225deg 270deg, #ab47bc 270deg 315deg, #ff6b6b 315deg 360deg)';
		allBtn.style.boxShadow = '0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 0 0 1px rgba(0, 0, 0, 0.1)';
		allBtn.style.position = 'relative';

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
		DebugManager.log('设置颜色筛选器:', color);

		// 如果点击的是当前已激活的颜色，则取消筛选（回到全部）
		if (this.activeColorFilter === color) {
			this.activeColorFilter = null;
			color = null;
			DebugManager.log('取消当前颜色筛选，回到显示全部');
		} else {
			this.activeColorFilter = color;
		}

		// 更新UI状态 - 确保只有一个圆点处于激活状态
		if (this.colorFilterContainer) {
			const dots = this.colorFilterContainer.querySelectorAll('.canvas-grid-color-dot');
			DebugManager.log('找到颜色圆点数量:', dots.length);

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
					DebugManager.log('激活"全部"按钮');
				}
			} else {
				// 激活对应颜色的圆点
				const targetDot = this.colorFilterContainer.querySelector(`[data-color="${color}"]`);
				if (targetDot) {
					targetDot.classList.add('active');
					DebugManager.log('激活颜色圆点:', color);
				}
			}
		}

		// 重新执行搜索和筛选
		DebugManager.log('执行颜色筛选，当前筛选颜色:', this.activeColorFilter);
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
			// 清空按钮内容
			while (this.timeCapsuleButton.firstChild) {
				this.timeCapsuleButton.removeChild(this.timeCapsuleButton.firstChild);
			}
			const iconContainer = this.timeCapsuleButton.createSpan();
			SVGIconManager.setIcon(iconContainer, 'timeCapsule');
			const timeDisplay = this.timeCapsuleButton.createSpan('time-display');
			timeDisplay.textContent = timeText;
			this.timeCapsuleButton.title = `时间胶囊收集中 - 剩余 ${timeText}`;
		} else {
			// 未激活状态：显示普通沙漏
			this.timeCapsuleButton.className = 'canvas-grid-time-capsule-btn';
			// 清空按钮内容
			while (this.timeCapsuleButton.firstChild) {
				this.timeCapsuleButton.removeChild(this.timeCapsuleButton.firstChild);
			}
			// 创建图标容器并设置图标
			const iconContainer = this.timeCapsuleButton.createSpan();
			SVGIconManager.setIcon(iconContainer, 'timeCapsule');
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
		this.renderGrid().catch(error => {
			DebugManager.error('Failed to render grid after starting time capsule:', error);
		});

		// 显示通知
		new Notice(`时间胶囊已启动！收集时长：${Math.floor(duration / 60000)}分钟`);

		DebugManager.log('时间胶囊已启动，网格视图已刷新:', this.timeCapsuleState);
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
		this.updateAllPanelTimeCapsules(); // 更新面板中的时间胶囊按钮

		// 立即刷新网格视图以更新分组状态
		this.renderGrid().catch(error => {
			DebugManager.error('Failed to render grid after ending time capsule:', error);
		});

		// 显示完成通知
		new Notice(`时间胶囊已结束！共收集了 ${collectedCount} 个项目`);

		DebugManager.log('时间胶囊已停止，网格视图已刷新');
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
			this.updateAllPanelTimeCapsules(); // 更新面板中的时间胶囊按钮

			// 如果时间到了，停止
			if (this.timeCapsuleState.remainingTime <= 0) {
				this.stopTimeCapsule();
			}
		}, 1000);
	}

	// 创建时间胶囊分组
	private createTimeCapsuleGroup(): void {
		if (!this.canvasData) {
			DebugManager.warn('无法创建时间胶囊分组：Canvas数据不存在');
			return;
		}

		// 生成唯一ID
		const groupId = `time-capsule-${Date.now()}`;

		// 智能计算分组位置，避免与现有分组重叠
		const timeCapsuleSize = { width: GRID_CONSTANTS.LARGE_CARD_WIDTH, height: 300 };
		const position = this.findSafePositionForTimeCapsule(timeCapsuleSize);

		DebugManager.log(`🎯 时间胶囊分组位置计算完成: (${position.x}, ${position.y})`);

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

		DebugManager.log('时间胶囊分组已创建:', groupId, '位置:', position);
	}

	// 为时间胶囊分组寻找安全位置，避免与现有分组重叠
	private findSafePositionForTimeCapsule(size: { width: number, height: number }): { x: number, y: number } {
		if (!this.canvasData) {
			return { x: 100, y: 100 }; // 默认位置
		}

		// 获取所有现有分组的边界
		const existingGroups = this.canvasData.nodes.filter(node => node.type === 'group');

		DebugManager.log(`📊 检测到 ${existingGroups.length} 个现有分组`);

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
				DebugManager.log(`✅ 找到安全位置: (${candidate.x}, ${candidate.y})`);
				return candidate;
			}
		}

		// 如果所有预设位置都不安全，尝试动态寻找空白区域
		const dynamicPosition = this.findDynamicSafePosition(size, existingGroups);
		if (dynamicPosition) {
			DebugManager.log(`🔍 动态找到安全位置: (${dynamicPosition.x}, ${dynamicPosition.y})`);
			return dynamicPosition;
		}

		// 最后的备用方案：在画布边缘创建
		const fallbackPosition = { x: 1000, y: 50 };
		DebugManager.log(`⚠️ 使用备用位置: (${fallbackPosition.x}, ${fallbackPosition.y})`);
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
				DebugManager.log(`❌ 位置 (${position.x}, ${position.y}) 与分组 ${group.id} 重叠`);
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

		DebugManager.log(`📐 Canvas使用边界: (${minX}, ${minY}) 到 (${maxX}, ${maxY})`);
		return { minX, minY, maxX, maxY };
	}

	// 更新时间胶囊分组显示
	private updateTimeCapsuleGroupDisplay(): void {
		if (!this.timeCapsuleState.isActive || !this.timeCapsuleState.groupId) return;

		// 查找时间胶囊分组卡片
		const groupCard = this.gridContainer.querySelector(`[data-node-id="${this.timeCapsuleState.groupId}"]`) as HTMLElement;
		if (!groupCard) return;

		// 更新计数信息显示
		const countInfo = groupCard.querySelector('.time-capsule-count-info');
		if (countInfo) {
			const minutes = Math.floor(this.timeCapsuleState.remainingTime / 60000);
			const seconds = Math.floor((this.timeCapsuleState.remainingTime % 60000) / 1000);
			const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

			// 获取当前收集的项目数量
			const collectedCount = this.timeCapsuleState.collectedItems.length;

			countInfo.innerHTML = `
				<div class="countdown-display">${timeText}</div>
				<div class="item-count-text">${collectedCount} 个项目</div>
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
			DebugManager.warn('时间胶囊未激活或分组不存在');
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
			DebugManager.warn('找不到时间胶囊分组');
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

			// 智能刷新显示 - 保持当前视图状态
			if (this.currentGroupView) {
				// 如果在分组视图中，重新分析分组并保持分组视图
				DebugManager.log('时间胶囊收集：在分组视图中，重新分析分组');
				this.analyzeGroups();
				this.enterGroupView(this.currentGroupView);
			} else {
				// 在主视图中，正常刷新
				this.renderGrid().catch(error => {
					DebugManager.error('Failed to render grid after data update:', error);
				});
			}

			// 立即更新时间胶囊分组显示
			this.updateTimeCapsuleGroupDisplay();

			// 显示收集成功的通知
			new Notice(`已收集到时间胶囊 (${this.timeCapsuleState.collectedItems.length}/${this.getMaxCollectionCount()})`);

			DebugManager.log('内容已收集到时间胶囊:', nodeId);
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

	// 获取当前编辑卡片
	public getCurrentEditingCard(): HTMLElement | null {
		return this.currentEditingCard;
	}







	// 更新颜色筛选器（公共方法）
	updateColorFilter(): void {
		if (this.colorFilterContainer) {
			this.colorFilterContainer.remove();
			this.colorFilterContainer = null;
		}
		// 在正确的颜色面板中重新创建颜色筛选器
		const container = this.containerEl.children[1] as HTMLElement;
		if (!container) {
			DebugManager.error('Canvasgrid Transit: Container element not found');
			return;
		}
		const colorPanel = container.querySelector('.color-dots-panel');
		if (colorPanel) {
			this.createColorFilter(colorPanel);
		} else {
			DebugManager.warn('Canvasgrid Transit: Color panel not found, recreating toolbar');
			// 如果颜色面板不存在，重新创建整个工具栏
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

		DebugManager.log(`🔍 Performing search with query: "${this.searchQuery}", currentGroupView: ${this.currentGroupView}`);

		// 缓存之前的结果以避免不必要的重新渲染
		const previousFilteredNodes = [...this.filteredNodes];

		// 确定搜索的基础节点集合
		let baseNodes: CanvasNode[];
		if (this.currentGroupView) {
			// 在分组视图中，只搜索当前分组的成员
			const groupInfo = this.groupAnalysis.get(this.currentGroupView);
			baseNodes = groupInfo ? groupInfo.members : [];
			DebugManager.log(`分组视图搜索，基础节点数量: ${baseNodes.length}`);
		} else {
			// 在主视图中，搜索所有节点（包括分组内的成员节点）
			baseNodes = this.getAllSearchableNodes();
			DebugManager.log(`主视图搜索，基础节点数量: ${baseNodes.length}`);
		}

		// 首先进行文本搜索
		let searchResults: CanvasNode[];

		if (!this.searchQuery || this.searchQuery.trim() === '') {
			// 如果没有搜索查询，根据视图状态决定基础显示内容
			if (this.currentGroupView) {
				searchResults = baseNodes;
			} else {
				// 主视图：显示分组卡片和非分组成员节点（混合色模式的基础集合）
				searchResults = this.getAllDisplayNodes();
				DebugManager.log('主视图无搜索，显示所有节点:', searchResults.length);
			}
			DebugManager.log('无搜索查询，使用基础节点:', searchResults.length);
		} else {
			const query = this.searchQuery.toLowerCase().trim();
			searchResults = baseNodes.filter(node => {
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
			DebugManager.log(`搜索 "${query}" 在${this.currentGroupView ? '分组' : '主视图'}中找到 ${searchResults.length} 个结果`);
		}

		// 然后应用颜色筛选
		DebugManager.log('应用颜色筛选，当前筛选颜色:', this.activeColorFilter);

		if (this.activeColorFilter !== null) {
			// 特定颜色筛选模式
			this.filteredNodes = searchResults.filter(node => {
				// 分组节点不参与颜色筛选（分组本身没有颜色）
				if (node.type === 'group') {
					return false;
				}
				// 直接比较颜色值
				const matches = node.color === this.activeColorFilter;
				DebugManager.log(`节点 ${node.id} 颜色 ${node.color} ${matches ? '匹配' : '不匹配'} 筛选器 ${this.activeColorFilter}`);
				return matches;
			});

			// 如果不在分组视图中，还需要添加分组内匹配颜色的成员
			if (!this.currentGroupView) {
				const groupMembersWithColor = this.getGroupMembersWithColor(this.activeColorFilter);
				// 合并非分组成员和分组内匹配成员，去重
				const allMatchingNodes = [...this.filteredNodes, ...groupMembersWithColor];
				const uniqueNodes = allMatchingNodes.filter((node, index, arr) =>
					arr.findIndex(n => n.id === node.id) === index
				);
				this.filteredNodes = uniqueNodes;
				DebugManager.log(`颜色筛选 [${this.activeColorFilter}] 结果:`, {
					nonGroupMembers: this.filteredNodes.length - groupMembersWithColor.length,
					groupMembers: groupMembersWithColor.length,
					total: this.filteredNodes.length
				});
			} else {
				DebugManager.log('分组视图颜色筛选后节点数量:', this.filteredNodes.length);
			}
		} else {
			// 混合色模式：显示所有搜索结果（包括分组）
			this.filteredNodes = searchResults;
			DebugManager.log('混合色模式，使用所有搜索结果:', this.filteredNodes.length);
		}

		// 总是应用排序，即使结果相同（可能排序设置已更改）
		DebugManager.log(`📊 Final filtered nodes: ${this.filteredNodes.length}, applying sort...`);
		this.applySortAndFilter();
	}

	// 获取所有可搜索的节点（包括分组内的成员节点）
	private getAllSearchableNodes(): CanvasNode[] {
		if (!this.canvasData) return [];

		// 返回所有非分组节点（包括分组内的成员节点）
		return this.canvasData.nodes.filter(node => node.type !== 'group');
	}

	// 获取非分组成员节点（主视图默认显示的节点）
	private getNonGroupMemberNodes(): CanvasNode[] {
		if (!this.canvasData) return [];

		// 确保分组分析已完成
		this.analyzeGroups();

		// 收集所有分组成员节点的ID
		const groupMemberIds = new Set<string>();
		this.groupAnalysis.forEach(groupInfo => {
			groupInfo.members.forEach(member => {
				groupMemberIds.add(member.id);
			});
		});

		// 返回不在任何分组内的节点（排除分组节点本身）
		return this.canvasData.nodes.filter(node =>
			node.type !== 'group' && !groupMemberIds.has(node.id)
		);
	}

	// 获取所有显示节点（包括分组卡片和非分组成员节点）
	private getAllDisplayNodes(): CanvasNode[] {
		if (!this.canvasData) return [];

		// 确保分组分析已完成
		this.analyzeGroups();

		// 收集所有分组成员节点的ID
		const groupMemberIds = new Set<string>();
		this.groupAnalysis.forEach(groupInfo => {
			groupInfo.members.forEach(member => {
				groupMemberIds.add(member.id);
			});
		});

		// 返回分组节点和非分组成员节点
		return this.canvasData.nodes.filter(node => {
			if (node.type === 'group') {
				return true; // 包含分组节点
			}
			return !groupMemberIds.has(node.id); // 包含非分组成员节点
		});
	}

	// 根据颜色筛选获取分组内匹配的成员节点
	private getGroupMembersWithColor(colorFilter: string): CanvasNode[] {
		if (!this.canvasData || !colorFilter) return [];

		const matchingMembers: CanvasNode[] = [];

		// 遍历所有分组，查找包含指定颜色的成员
		this.groupAnalysis.forEach(groupInfo => {
			const colorMatchingMembers = groupInfo.members.filter(member =>
				member.color === colorFilter
			);
			matchingMembers.push(...colorMatchingMembers);
		});

		return matchingMembers;
	}

	// 获取节点所属的分组信息
	private getNodeGroupInfo(nodeId: string): { groupId: string; groupName: string } | null {
		for (const [groupId, groupInfo] of this.groupAnalysis) {
			if (groupInfo.members.some(member => member.id === nodeId)) {
				return {
					groupId: groupId,
					groupName: groupInfo.group.label || '未命名分组'
				};
			}
		}
		return null;
	}

	// 为分组内的卡片添加分组标识
	private addGroupBadgeToCard(card: HTMLElement, groupName: string): void {
		const badge = document.createElement('div');
		badge.className = 'canvas-grid-group-badge';
		badge.textContent = `📁 ${groupName}`;
		badge.title = `此卡片属于分组: ${groupName}`;

		// 将标识添加到卡片的右上角
		card.style.position = 'relative';
		card.appendChild(badge);
	}

	// 添加分组来源标识到卡片左下角
	private addGroupSourceIndicator(card: HTMLElement, groupInfo: { groupId: string; groupName: string }): void {
		const indicator = document.createElement('div');
		indicator.className = 'canvas-grid-card-group-source';
		indicator.innerHTML = `
			<div class="group-source-icon">📁</div>
			<div class="group-source-text">${groupInfo.groupName}</div>
		`;
		indicator.title = `来自分组: ${groupInfo.groupName}`;
		indicator.dataset.groupId = groupInfo.groupId;

		// 将标识添加到卡片的左下角
		card.style.position = 'relative';
		card.appendChild(indicator);

		// 点击分组来源标识可以进入该分组
		indicator.addEventListener('click', (e) => {
			e.stopPropagation(); // 阻止卡片点击事件
			this.enterGroupView(groupInfo.groupId);
		});
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
			this.renderGrid().catch(error => {
				DebugManager.error('Failed to render empty grid:', error);
			});
			return;
		}

		DebugManager.log(`🔄 Applying sort with pinned priority: ${this.sortBy} (${this.sortOrder}) to ${this.filteredNodes.length} nodes`);

		// 排序逻辑（置顶优先）
		this.filteredNodes.sort((a, b) => {
			const aExtended = a as ExtendedCanvasNode;
			const bExtended = b as ExtendedCanvasNode;

			// 检测置顶状态
			const aIsPinned = this.detectPinnedStatus(a);
			const bIsPinned = this.detectPinnedStatus(b);

			// 置顶卡片优先
			if (aIsPinned && !bIsPinned) return -1;
			if (!aIsPinned && bIsPinned) return 1;

			// 如果都是置顶卡片，按置顶时间排序（最新置顶的在前）
			if (aIsPinned && bIsPinned) {
				const aPinnedAt = aExtended.pinnedAt || 0;
				const bPinnedAt = bExtended.pinnedAt || 0;
				return bPinnedAt - aPinnedAt;
			}

			// 非置顶卡片按原有规则排序
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
				DebugManager.error('排序过程中出错:', error);
				// 出错时按ID排序作为备用方案
				comparison = a.id.localeCompare(b.id);
			}

			return this.sortOrder === 'asc' ? comparison : -comparison;
		});

		DebugManager.log(`✅ Sort completed. First node: ${this.getNodeTitle(this.filteredNodes[0])}`);
		this.renderGrid().catch(error => {
			DebugManager.error('Failed to render grid after sorting:', error);
		});
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
			return node.text.split('\n')[0].substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH);
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
		DebugManager.log('🔄 Refreshing sort...');
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

		// 移除多功能菜单按钮激活状态
		const multiMenuButtons = this.containerEl.querySelectorAll('.multi-menu-btn');
		multiMenuButtons.forEach(btn => {
			btn.classList.remove('active');
		});

		// 移除旧的主菜单按钮激活状态（兼容性）
		const oldMainButtons = this.containerEl.querySelectorAll('.canvas-grid-main-btn');
		oldMainButtons.forEach(btn => {
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
		// 先清理旧的事件监听器，防止重复添加
		this.cleanupEventListeners();

		// 🔧 修复：确保事件监听器正确绑定
		if (!this.gridContainer) {
			DebugManager.error('❌ Grid container not found, cannot setup event delegation');
			return;
		}

		// 使用事件委托处理所有点击事件（包括卡片和工具栏按钮）
		this.gridContainer.addEventListener('click', this.handleGridClick);
		DebugManager.log('🎯 Grid click event listener added');

		// 使用事件委托处理右键菜单
		this.gridContainer.addEventListener('contextmenu', this.handleCardContextMenu);

		// 处理键盘事件
		this.gridContainer.addEventListener('keydown', this.handleKeyDown);

		// 点击其他地方关闭右键菜单
		document.addEventListener('click', this.handleDocumentClick);

		DebugManager.log('✅ Event delegation setup completed', {
			gridContainer: !!this.gridContainer,
			hasClickListener: true,
			containerTagName: this.gridContainer.tagName,
			containerClassName: this.gridContainer.className
		});

		// 🔧 测试事件监听器是否正确绑定
		this.testEventListenerBinding();

		// 设置滚动监听，实现功能栏自动隐藏/显示
		this.setupScrollListener();

		// 设置网格卡片拖拽事件
		this.setupGridCardDragEvents();

		// 使用CSS处理悬停效果，移除JavaScript事件监听器
	}

	// 🔧 新增：测试事件监听器绑定
	private testEventListenerBinding(): void {
		if (!this.gridContainer) return;

		// 创建一个测试点击事件
		const testEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		});

		// 临时添加测试标记
		let testEventReceived = false;
		const originalHandler = this.handleGridClick;
		this.handleGridClick = (e: Event) => {
			if (e === testEvent) {
				testEventReceived = true;
				DebugManager.log('🧪 测试事件监听器：正常工作');
				return;
			}
			return originalHandler.call(this, e);
		};

		// 分发测试事件
		this.gridContainer.dispatchEvent(testEvent);

		// 恢复原始处理器
		this.handleGridClick = originalHandler;

		if (!testEventReceived) {
			DebugManager.error('❌ 事件监听器测试失败：未接收到测试事件');
		}
	}

	// 清理事件监听器
	private cleanupEventListeners() {
		// 移除网格容器的事件监听器
		if (this.gridContainer) {
			this.gridContainer.removeEventListener('click', this.handleGridClick);
			this.gridContainer.removeEventListener('contextmenu', this.handleCardContextMenu);
			this.gridContainer.removeEventListener('keydown', this.handleKeyDown);
			DebugManager.log('🧹 Grid container event listeners removed');
		}

		// 移除文档点击监听器
		document.removeEventListener('click', this.handleDocumentClick);

		DebugManager.log('🧹 Event listeners cleaned up', {
			hadGridContainer: !!this.gridContainer
		});
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

			// 根据卡片类型设置不同的鼠标样式
			const nodeType = (card as HTMLElement).dataset.nodeType;
			if (nodeType === 'group') {
				// 分组卡片使用指针样式，表示可点击进入
				(card as HTMLElement).style.cursor = 'pointer';
			} else {
				// 普通卡片使用抓取样式，表示可拖拽
				(card as HTMLElement).style.cursor = 'grab';
			}

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
				DebugManager.log('🔥 Long press detected, drag enabled');

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
			setTimeout(() => {}, PERFORMANCE_CONSTANTS.MINIMAL_DELAY);
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
		LoadingManager.startLoading('canvas-load', 'Canvas加载', this.gridContainer);

		const errorHandler = ErrorHandler.getInstance();

		const result = await errorHandler.handleAsyncOperation(async () => {
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

			DebugManager.log('✅ Canvas loaded and sort applied');
			return true;
		}, 'Canvas加载', false, false);

		LoadingManager.endLoading('canvas-load');

		if (!result) {
			this.showErrorState('Canvas加载失败，请检查文件格式或重试');
		}
	}

	// 🎯 修复：渲染网格视图 - 使用增量更新和数据一致性检查
	async renderGrid() {
		if (!this.gridContainer) return;

		DebugManager.log('🎯 开始渲染网格 (增量更新模式)');

		// 如果在分组视图中，只渲染分组成员
		if (this.currentGroupView) {
			await this.renderGroupMembers();
			return;
		}

		// 🎯 修复：彻底清理DOM和状态
		await this.thoroughCleanup();

		// 主视图：分析分组并渲染
		this.analyzeGroups();

		// 🔧 修复：始终优先使用处理后的数据（包括排序和筛选结果）
		const nodesToRender = (this.filteredNodes && this.filteredNodes.length > 0) ?
			this.filteredNodes :
			(this.canvasData?.nodes || []);

		DebugManager.log('🎯 渲染节点决策 (修复后):', {
			searchQuery: this.searchQuery,
			activeColorFilter: this.activeColorFilter,
			filteredNodesLength: this.filteredNodes.length,
			nodesToRenderLength: nodesToRender.length,
			groupCount: this.groupAnalysis.size,
			sortBy: this.sortBy,
			sortOrder: this.sortOrder,
			usingFilteredNodes: nodesToRender === this.filteredNodes
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
		await this.renderGridItems(itemsToRender);

		// 设置卡片拖拽属性
		this.setupCardDragAttributes();
	}

	// 🎯 新增：应用增量更新
	private async applyIncrementalUpdate(changes: NodeChange[]): Promise<void> {
		if (!this.incrementalRenderer) return;

		for (const change of changes) {
			try {
				switch (change.type) {
					case 'add':
						if (change.node) {
							await this.addNodeToGrid(change.node);
						}
						break;
					case 'update':
						if (change.node) {
							await this.updateNodeInGrid(change.node);
						}
						break;
					case 'delete':
						if (change.nodeId) {
							await this.removeNodeFromGridDOM(change.nodeId);
						}
						break;
				}
			} catch (error) {
				DebugManager.error(`增量更新失败 (${change.type}):`, error);
			}
		}

		// 更新渲染状态
		this.incrementalRenderer.updateRenderState(changes);
	}

	// 🎯 新增：首次渲染网格
	private async renderInitialGrid(nodesToRender: CanvasNode[]): Promise<void> {
		// 批量创建卡片，提升性能
		const cardPromises = nodesToRender.map(node => this.createCard(node));
		const cards = await Promise.all(cardPromises);

		// 添加卡片到fragment并处理搜索高亮
		cards.forEach((card, index) => {
			// 如果有搜索查询，高亮匹配的内容
			if (this.searchQuery) {
				this.highlightSearchResults(card, this.searchQuery);
			}
		});

		// 一次性添加所有卡片到DOM，减少重排
		const fragment = document.createDocumentFragment();
		cards.forEach(card => fragment.appendChild(card));
		this.gridContainer.appendChild(fragment);

		// 更新增量渲染器状态
		if (this.incrementalRenderer) {
			const changes: NodeChange[] = nodesToRender.map(node => ({
				type: 'add' as const,
				node
			}));
			this.incrementalRenderer.updateRenderState(changes);
		}
	}

	// 🎯 新增：添加节点到网格
	private async addNodeToGrid(node: CanvasNode): Promise<void> {
		const card = await this.createCard(node);

		// 如果有搜索查询，高亮匹配的内容
		if (this.searchQuery) {
			this.highlightSearchResults(card, this.searchQuery);
		}

		this.gridContainer.appendChild(card);
	}

	// 🎯 新增：更新网格中的节点
	private async updateNodeInGrid(node: CanvasNode): Promise<void> {
		// 移除旧的DOM元素
		this.domElementRegistry.removeElement(node.id);

		// 创建新的DOM元素
		await this.addNodeToGrid(node);
	}

	// 🎯 新增：从网格中移除节点（DOM层面）
	private async removeNodeFromGridDOM(nodeId: string): Promise<void> {
		this.domElementRegistry.removeElement(nodeId);
	}

	// ==================== 置顶功能相关方法 ====================

	/**
	 * 检测卡片是否包含置顶标签
	 */
	private detectPinnedStatus(node: CanvasNode): boolean {
		if (node.type !== 'text' || !node.text) return false;

		const pinnedTag = this.settings.pinnedTagName;
		const escapedTag = pinnedTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`^\\s*${escapedTag}(?=\\s|$)`, 'i');

		return regex.test(node.text.trim());
	}

	/**
	 * 在卡片内容中添加置顶标签
	 */
	private addPinnedTag(content: string): string {
		const pinnedTag = this.settings.pinnedTagName;
		const trimmedContent = content.trim();

		// 检查是否已存在置顶标签
		if (this.detectPinnedStatus({ type: 'text', text: trimmedContent } as CanvasNode)) {
			return content; // 已存在，不重复添加
		}

		// 在首部添加置顶标签
		if (this.settings.pinnedTagPosition === 'start') {
			return trimmedContent ? `${pinnedTag} ${trimmedContent}` : pinnedTag;
		} else {
			return trimmedContent ? `${trimmedContent} ${pinnedTag}` : pinnedTag;
		}
	}

	/**
	 * 从卡片内容中移除置顶标签
	 */
	private removePinnedTag(content: string): string {
		const pinnedTag = this.settings.pinnedTagName;
		const escapedTag = pinnedTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		// 从首部移除
		const startRegex = new RegExp(`^\\s*${escapedTag}\\s*`, 'i');
		let result = content.replace(startRegex, '');

		// 从尾部移除（如果设置为尾部插入）
		const endRegex = new RegExp(`\\s*${escapedTag}\\s*$`, 'i');
		result = result.replace(endRegex, '');

		return result.trim();
	}

	/**
	 * 切换卡片置顶状态
	 */
	private async togglePinnedStatus(card: HTMLElement, node: CanvasNode): Promise<void> {
		if (node.type !== 'text' || !node.text) return;

		const isPinned = this.detectPinnedStatus(node);
		let newContent: string;
		let newStatus: boolean;

		if (isPinned) {
			// 取消置顶：移除标签
			newContent = this.removePinnedTag(node.text);
			newStatus = false;
			new Notice('已取消置顶');
		} else {
			// 设置置顶：添加标签
			newContent = this.addPinnedTag(node.text);
			newStatus = true;
			new Notice('已置顶');
		}

		// 更新节点内容
		node.text = newContent;

		// 更新扩展属性
		(node as ExtendedCanvasNode).isPinned = newStatus;
		(node as ExtendedCanvasNode).pinnedAt = newStatus ? Date.now() : undefined;

		// 更新按钮状态
		this.updatePinnedButtonState(card, newStatus);

		// 更新卡片样式
		this.updateCardPinnedStyle(card, newStatus);

		// 保存到Canvas文件
		await this.saveCanvasData();

		// 确保filteredNodes包含更新后的节点
		if (this.filteredNodes && this.filteredNodes.length > 0) {
			// 更新filteredNodes中对应的节点
			const nodeIndex = this.filteredNodes.findIndex(n => n.id === node.id);
			if (nodeIndex !== -1) {
				this.filteredNodes[nodeIndex] = node;
			}
		} else {
			// 如果filteredNodes为空，重新初始化
			this.filteredNodes = this.canvasData?.nodes || [];
		}

		// 重新排序和渲染
		this.applySortAndFilter();
	}

	/**
	 * 更新置顶按钮状态
	 */
	private updatePinnedButtonState(card: HTMLElement, isPinned: boolean): void {
		const pinnedBtn = card.querySelector('.canvas-card-toolbar-pinned') as HTMLElement;
		if (!pinnedBtn) return;

		if (isPinned) {
			pinnedBtn.classList.add('pinned-active');
			pinnedBtn.title = '取消置顶';
			pinnedBtn.setAttribute('aria-label', '取消置顶');
		} else {
			pinnedBtn.classList.remove('pinned-active');
			pinnedBtn.title = '置顶';
			pinnedBtn.setAttribute('aria-label', '置顶');
		}
	}

	/**
	 * 更新卡片置顶样式
	 */
	private updateCardPinnedStyle(card: HTMLElement, isPinned: boolean): void {
		if (isPinned) {
			card.classList.add('pinned');
			this.addPinIndicator(card);
		} else {
			card.classList.remove('pinned');
			this.removePinIndicator(card);
		}
	}

	/**
	 * 添加置顶图钉指示器
	 */
	private addPinIndicator(card: HTMLElement): void {
		// 检查是否已存在指示器
		let indicator = card.querySelector('.canvas-grid-card-pin-indicator') as HTMLElement;

		if (!indicator) {
			// 创建新的指示器
			indicator = document.createElement('div');
			indicator.className = 'canvas-grid-card-pin-indicator adding';

			// 添加点击事件
			indicator.addEventListener('click', (e) => {
				e.stopPropagation(); // 防止触发卡片点击事件
				this.handlePinIndicatorClick(card);
			});

			card.appendChild(indicator);

			// 移除添加动画类
			setTimeout(() => {
				indicator.classList.remove('adding');
			}, 300);
		}
	}

	/**
	 * 移除置顶图钉指示器
	 */
	private removePinIndicator(card: HTMLElement): void {
		const indicator = card.querySelector('.canvas-grid-card-pin-indicator') as HTMLElement;

		if (indicator) {
			// 添加移除动画
			indicator.classList.add('removing');

			// 动画完成后移除元素
			setTimeout(() => {
				if (indicator.parentNode) {
					indicator.parentNode.removeChild(indicator);
				}
			}, 300);
		}
	}

	/**
	 * 处理置顶图钉指示器点击
	 */
	private handlePinIndicatorClick(card: HTMLElement): void {
		const nodeId = card.dataset.nodeId;
		if (!nodeId) return;

		const node = this.canvasData?.nodes.find(n => n.id === nodeId);
		if (!node) return;

		// 执行取消置顶操作
		this.togglePinnedStatus(card, node);
	}

	/**
	 * 刷新所有卡片的置顶状态
	 */
	public refreshPinnedStatus(): void {
		if (!this.canvasData) return;

		// 重新检测所有文本节点的置顶状态
		this.canvasData.nodes.forEach(node => {
			if (node.type === 'text') {
				const extendedNode = node as ExtendedCanvasNode;
				const isPinned = this.detectPinnedStatus(node);
				extendedNode.isPinned = isPinned;

				if (isPinned && !extendedNode.pinnedAt) {
					extendedNode.pinnedAt = Date.now();
				} else if (!isPinned) {
					extendedNode.pinnedAt = undefined;
				}
			}
		});

		// 重新排序和渲染
		this.applySortAndFilter();
	}

	/**
	 * 刷新所有视图
	 */
	private refreshAllViews(): void {
		// 刷新当前视图
		this.renderGrid().catch(error => {
			DebugManager.error('Failed to refresh grid view:', error);
		});

		// 如果有其他Canvas Grid视图实例，也需要刷新
		this.app.workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE).forEach(leaf => {
			const view = leaf.view as CanvasGridView;
			if (view !== this) {
				view.renderGrid().catch(error => {
					DebugManager.error('Failed to refresh other grid view:', error);
				});
			}
		});
	}

	// ==================== 渲染相关方法 ====================

	// 立即渲染（小量数据）
	private async renderGridImmediate(nodes: CanvasNode[]): Promise<void> {
		// 使用DocumentFragment批量添加DOM元素，提升性能
		const fragment = document.createDocumentFragment();

		// 并行创建所有卡片
		const cardPromises = nodes.map(node => this.createCard(node));
		const cards = await Promise.all(cardPromises);

		// 添加卡片到fragment并处理搜索高亮
		cards.forEach((card, index) => {
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

		const renderBatch = async () => {
			const fragment = document.createDocumentFragment();
			const endIndex = Math.min(currentIndex + batchSize, nodes.length);

			// 并行创建当前批次的卡片
			const batchNodes = nodes.slice(currentIndex, endIndex);
			const cardPromises = batchNodes.map(node => this.createCard(node));
			const cards = await Promise.all(cardPromises);

			// 添加卡片到fragment并处理搜索高亮
			cards.forEach(card => {
				// 如果有搜索查询，高亮匹配的内容
				if (this.searchQuery) {
					this.highlightSearchResults(card, this.searchQuery);
				}
				fragment.appendChild(card);
			});

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
				const highlightedText = element.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
				SafeHTMLRenderer.setHTML(element, highlightedText, ['mark']);
			}
		});
	}



	// 保存设置
	private async saveSettings(): Promise<void> {
		// 这里应该调用插件的保存设置方法
		// 由于我们在视图类中，需要通过某种方式访问插件实例
		DebugManager.log('Settings saved:', this.settings);
	}

	// 🎯 修复：创建单个卡片 - 使用DOM元素注册表和数据缓存
	async createCard(node: CanvasNode): Promise<HTMLElement> {
		// 🎯 修复：使用DOM元素注册表确保唯一性
		const card = this.domElementRegistry.createUniqueElement(node.id, 'div');
		card.className = 'canvas-grid-card';

		// 设置基本属性
		card.style.minHeight = `${CARD_CONSTANTS.height}px`;
		card.dataset.nodeType = node.type;

		// 🎯 修复：不再使用DOM缓存，而是数据缓存
		const cacheKey = this.generateDataCacheKey(node);
		const cachedData = this.getDataCacheItem(cacheKey);

		if (cachedData && this.isDataCacheValid(cachedData, node)) {
			// 使用缓存的数据重新渲染
			await this.renderCardFromCachedData(card, node, cachedData);
		} else {
			// 创建新的渲染数据
			const renderData = await this.createCardRenderData(node);
			await this.renderCardFromData(card, node, renderData);

			// 缓存渲染数据（而非DOM）
			this.setDataCacheItem(cacheKey, renderData);
		}

		return card;
	}

	// 内部创建卡片方法
	private async createCardInternal(node: CanvasNode): Promise<HTMLElement> {
		const card = document.createElement('div');
		card.className = 'canvas-grid-card';

		// 移除固定宽度，让CSS Grid自动处理
		// 只设置最小高度
		card.style.minHeight = `${CARD_CONSTANTS.height}px`;

		// 设置数据属性用于事件委托
		card.dataset.nodeId = node.id;
		card.dataset.nodeType = node.type;

		// 检查是否为分组内的节点，如果是则添加分组标识
		const groupInfo = this.getNodeGroupInfo(node.id);
		if (groupInfo && !this.currentGroupView) {
			// 只在主视图中显示分组标识
			card.classList.add('canvas-grid-card-in-group');
			card.dataset.groupId = groupInfo.groupId;
			card.dataset.groupName = groupInfo.groupName;
		}

		// 设置节点颜色 - 使用官方Canvas颜色系统
		if (node.color) {
			const normalizedColor = this.normalizeColorValue(node.color);
			if (normalizedColor) {
				// 使用官方Canvas颜色应用方法
				ColorUtils.applyCanvasColorToElement(card, normalizedColor);
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
		await this.renderCardContent(card, node);

		// 如果是分组内的节点，添加分组标识
		if (groupInfo && !this.currentGroupView) {
			this.addGroupBadgeToCard(card, groupInfo.groupName);
			// 添加分组来源标识到卡片左下角
			this.addGroupSourceIndicator(card, groupInfo);
		}

		// 创建卡片工具栏
		this.createCardToolbar(card, node);

		// 检查置顶状态并添加相应样式和指示器
		if (this.settings.enablePinnedCards && this.detectPinnedStatus(node)) {
			card.classList.add('pinned');
			this.addPinIndicator(card);
		}

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

	// 🎯 修复：获取数据缓存项（替代DOM缓存）
	private getDataCacheItem(key: string): CardRenderData | null {
		return this.dataCache.get(key) || null;
	}

	// 🎯 修复：设置数据缓存项（替代DOM缓存）
	private setDataCacheItem(key: string, data: CardRenderData): void {
		this.dataCache.set(key, data);
	}

	// 🎯 修复：清理数据缓存（替代DOM缓存）
	private clearDataCache(): void {
		this.dataCache.clear();
	}

	// 🎯 新增：生成数据缓存键（替代DOM缓存键）
	private generateDataCacheKey(node: CanvasNode): string {
		return `data-${node.id}-${node.type}-${this.getNodeContentHash(node)}`;
	}

	// 🎯 新增：获取节点内容哈希
	private getNodeContentHash(node: CanvasNode): string {
		const content = JSON.stringify({
			type: node.type,
			text: node.text,
			url: node.url,
			file: node.file,
			color: node.color,
			flag: node.flag
		});
		return this.simpleHash(content).toString();
	}



	// 🎯 新增：验证数据缓存有效性
	private isDataCacheValid(cachedData: CardRenderData, node: CanvasNode): boolean {
		const currentHash = this.getNodeContentHash(node);
		return cachedData.contentHash === currentHash;
	}

	// 🎯 新增：创建卡片渲染数据
	private async createCardRenderData(node: CanvasNode): Promise<CardRenderData> {
		const groupInfo = this.getNodeGroupInfo(node.id);
		const isPinned = this.settings.enablePinnedCards && this.detectPinnedStatus(node);

		return {
			nodeId: node.id,
			nodeType: node.type,
			contentHash: this.getNodeContentHash(node),
			renderedContent: await this.generateRenderedContent(node),
			metadata: {
				hasGroupBadge: !!(groupInfo && !this.currentGroupView),
				isPinned: isPinned,
				colorStyle: node.color ? this.getColorStyles(node.color).textColor : undefined,
				timestamp: Date.now()
			}
		};
	}

	// 🎯 新增：生成渲染内容
	private async generateRenderedContent(node: CanvasNode): Promise<string> {
		// 这里简化处理，实际应该根据节点类型生成对应的HTML内容
		switch (node.type) {
			case 'text':
				return node.text || '';
			case 'link':
				return node.url || '';
			case 'file':
				return node.file || '';
			default:
				return '';
		}
	}

	// 🎯 新增：从缓存数据渲染卡片
	private async renderCardFromCachedData(card: HTMLElement, node: CanvasNode, cachedData: CardRenderData): Promise<void> {
		// 设置基本属性
		this.setupCardBasicAttributes(card, node, cachedData);

		// 渲染内容
		await this.renderCardContent(card, node);

		// 应用缓存的元数据
		this.applyCardMetadata(card, node, cachedData.metadata);
	}

	// 🎯 新增：从数据渲染卡片
	private async renderCardFromData(card: HTMLElement, node: CanvasNode, renderData: CardRenderData): Promise<void> {
		// 设置基本属性
		this.setupCardBasicAttributes(card, node, renderData);

		// 渲染内容
		await this.renderCardContent(card, node);

		// 应用元数据
		this.applyCardMetadata(card, node, renderData.metadata);
	}

	// 🎯 新增：设置卡片基本属性
	private setupCardBasicAttributes(card: HTMLElement, node: CanvasNode, renderData: CardRenderData): void {
		// 检查是否为分组内的节点
		const groupInfo = this.getNodeGroupInfo(node.id);
		if (groupInfo && !this.currentGroupView) {
			card.classList.add('canvas-grid-card-in-group');
			card.dataset.groupId = groupInfo.groupId;
			card.dataset.groupName = groupInfo.groupName;
		}

		// 设置颜色样式
		if (node.color) {
			const normalizedColor = this.normalizeColorValue(node.color);
			if (normalizedColor) {
				ColorUtils.applyCanvasColorToElement(card, normalizedColor);
			}
		}

		// 添加无障碍访问支持
		card.setAttribute('role', 'button');
		card.setAttribute('tabindex', '0');
		card.setAttribute('aria-label', `${node.type}节点`);
	}

	// 🎯 新增：应用卡片元数据
	private applyCardMetadata(card: HTMLElement, node: CanvasNode, metadata: CardRenderData['metadata']): void {
		// 添加分组标识
		if (metadata.hasGroupBadge) {
			const groupInfo = this.getNodeGroupInfo(node.id);
			if (groupInfo) {
				this.addGroupBadgeToCard(card, groupInfo.groupName);
			}
		}

		// 创建卡片工具栏
		this.createCardToolbar(card, node);

		// 检查置顶状态
		if (metadata.isPinned) {
			card.classList.add('pinned');
			this.addPinIndicator(card);
		}
	}

	// 更新卡片事件处理器（用于缓存的卡片）
	private updateCardEventHandlers(card: HTMLElement, node: CanvasNode): void {
		// 重新设置数据属性（确保正确）
		card.dataset.nodeId = node.id;
		card.dataset.nodeType = node.type;

		// 事件处理器通过事件委托处理，不需要重新绑定
	}

	// 清空渲染缓存（已在上面定义，删除重复定义）

	// 创建卡片工具栏
	createCardToolbar(card: HTMLElement, node: CanvasNode) {
		const toolbar = document.createElement('div');
		toolbar.className = 'canvas-card-toolbar';

		// 置顶按钮（如果启用置顶功能）
		if (this.settings.enablePinnedCards) {
			const isPinned = this.detectPinnedStatus(node);
			const pinnedBtn = this.createToolbarButton(
				'pinned',
				isPinned ?
					(this.settings.language === 'zh' ? '取消置顶' : 'Unpin') :
					(this.settings.language === 'zh' ? '置顶' : 'Pin')
			);

			// 设置置顶按钮状态
			if (isPinned) {
				pinnedBtn.classList.add('pinned-active');
			}

			toolbar.appendChild(pinnedBtn);
		}

		// 删除按钮（事件通过委托处理）
		const deleteBtn = this.createToolbarButton('delete', this.settings.language === 'zh' ? '删除' : 'Delete');

		// 颜色设置按钮（事件通过委托处理）
		const colorBtn = this.createToolbarButton('color', this.settings.language === 'zh' ? '设置颜色' : 'Set Color');

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



			DebugManager.log('卡片删除完成，UI已更新');

		} catch (error) {
			DebugManager.error('删除卡片失败:', error);
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

		// 更新卡片样式 - 使用官方Canvas颜色系统
		ColorUtils.applyCanvasColorToElement(card, normalizedColor);

		// 保存到Canvas文件
		await this.saveNodeToCanvas(node);
	}



	// 渲染卡片内容
	async renderCardContent(card: HTMLElement, node: CanvasNode) {
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

		// 应用颜色样式到内容区域 - 官方Canvas样式不需要修改文本颜色
		// Canvas官方样式只在边框显示颜色，内容保持默认文本颜色
	}

	// 渲染文本节点 - 简化DOM结构，对齐官方Canvas样式
	renderTextNode(card: HTMLElement, node: CanvasNode) {
		const content = card.createDiv("card-content");

		// 使用官方Canvas样式设置
		content.style.lineHeight = 'var(--line-height-normal)';
		content.style.fontSize = 'var(--font-text-size)';
		content.style.fontFamily = 'var(--font-text)';
		content.style.color = 'var(--text-normal)';
		content.style.padding = '0';
		content.style.margin = '0';

		// 直接渲染内容
		this.renderTextNodeContent(content, node);
	}





	// 🔧 新增：检查是否为图片文件
	private isImageFile(fileName: string): boolean {
		const imageExtensions = [
			'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
			'.tiff', '.tif', '.ico', '.avif', '.heic', '.heif'
		];

		const lowerFileName = fileName.toLowerCase();
		return imageExtensions.some(ext => lowerFileName.endsWith(ext));
	}

	// 🔧 新增：检查是否为视频文件
	private isVideoFile(fileName: string): boolean {
		const videoExtensions = [
			'.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.m4v',
			'.wmv', '.flv', '.3gp', '.m2v', '.mpg', '.mpeg'
		];

		const lowerFileName = fileName.toLowerCase();
		return videoExtensions.some(ext => lowerFileName.endsWith(ext));
	}

	// 🔧 新增：渲染图片预览
	private renderImagePreview(content: HTMLElement, node: CanvasNode, fileName: string): void {
		// 创建图片容器
		const imageContainer = content.createDiv('file-image-container');

		// 创建图片元素
		const img = imageContainer.createEl('img', {
			cls: 'file-image-preview'
		});

		// 设置图片源
		const vault = this.app.vault;
		const file = vault.getAbstractFileByPath(node.file!);

		if (file instanceof TFile) {
			// 使用Obsidian的资源URL
			img.src = this.app.vault.getResourcePath(file);
		} else {
			// 如果文件不存在，显示占位符
			this.handleImageLoadError(imageContainer, fileName);
			return;
		}

		// 设置图片属性
		img.alt = fileName;
		img.title = fileName;

		// 处理图片加载错误
		img.onerror = () => {
			this.handleImageLoadError(imageContainer, fileName);
		};

		// 处理图片加载成功
		img.onload = () => {
			imageContainer.classList.add('image-loaded');
		};

		// 添加文件名标签（可选）
		const fileNameLabel = imageContainer.createDiv('file-image-name');
		fileNameLabel.textContent = fileName;
	}

	// 🔧 新增：处理图片加载错误
	private handleImageLoadError(container: HTMLElement, fileName: string): void {
		container.empty();
		container.classList.add('file-image-error');

		const errorIcon = container.createDiv('file-image-error-icon');
		errorIcon.textContent = '🖼️';

		const errorText = container.createDiv('file-image-error-text');
		errorText.textContent = '图片加载失败';

		const fileNameText = container.createDiv('file-image-error-filename');
		fileNameText.textContent = fileName;
	}

	// 🔧 新增：渲染视频预览
	private renderVideoPreview(content: HTMLElement, node: CanvasNode, fileName: string): void {
		try {
			// 获取文件对象
			const file = this.app.vault.getAbstractFileByPath(node.file!) as TFile;
			if (!file) {
				this.handleVideoLoadError(content, fileName, '文件不存在');
				return;
			}

			// 创建视频容器
			const videoContainer = content.createDiv('file-video-container');

			// 创建视频元素
			const video = videoContainer.createEl('video', {
				cls: 'file-video-preview',
				attr: {
					controls: 'true',
					preload: 'metadata'
				}
			});

			// 设置视频源
			video.src = this.app.vault.getResourcePath(file);

			// 添加错误处理
			video.addEventListener('error', () => {
				this.handleVideoLoadError(videoContainer, fileName, '视频加载失败');
			});

			// 添加加载完成处理
			video.addEventListener('loadedmetadata', () => {
				DebugManager.log('Video loaded successfully:', fileName);
			});

			// 添加文件名标签
			const fileNameLabel = videoContainer.createDiv('file-video-name');
			fileNameLabel.textContent = fileName;

		} catch (error) {
			DebugManager.error('Failed to render video preview:', error);
			this.handleVideoLoadError(content, fileName, '渲染失败');
		}
	}

	// 🔧 新增：处理视频加载错误
	private handleVideoLoadError(container: HTMLElement, fileName: string, errorMessage: string): void {
		// 清空容器
		container.empty();

		// 显示错误信息
		container.classList.add('file-video-error');
		const errorIcon = container.createDiv('file-video-error-icon');
		errorIcon.textContent = '🎬';

		const errorText = container.createDiv('file-video-error-text');
		errorText.textContent = errorMessage;

		const fileNameText = container.createDiv('file-video-error-filename');
		fileNameText.textContent = fileName;
	}

	// 渲染文件节点 - 简化DOM结构，对齐官方Canvas样式
	renderFileNode(card: HTMLElement, node: CanvasNode) {
		const content = card.createDiv("card-content");

		// 使用官方Canvas样式设置
		content.style.lineHeight = 'var(--line-height-normal)';
		content.style.fontSize = 'var(--font-text-size)';
		content.style.fontFamily = 'var(--font-text)';
		content.style.color = 'var(--text-normal)';
		content.style.padding = '0';
		content.style.margin = '0';

		if (node.file) {
			const fileName = node.file.split('/').pop() || node.file;

			// 检查文件类型并渲染相应预览
			if (this.isImageFile(fileName)) {
				this.renderImagePreview(content, node, fileName);
			} else if (this.isVideoFile(fileName)) {
				this.renderVideoPreview(content, node, fileName);
			} else {
				// 渲染普通文件 - 简化结构
				const fileContainer = content.createDiv("file-container");
				fileContainer.style.display = 'flex';
				fileContainer.style.alignItems = 'center';
				fileContainer.style.gap = '8px';

				const fileIcon = fileContainer.createSpan("file-icon");
				fileIcon.textContent = "📄";
				fileIcon.style.fontSize = '16px';

				const fileName = fileContainer.createSpan("file-name");
				fileName.textContent = node.file.split('/').pop() || node.file;
				fileName.style.wordBreak = 'break-word';

				// 如果有子路径，显示它
				if (node.file.includes('#')) {
					const subpath = node.file.split('#')[1];
					const subpathEl = content.createDiv("file-subpath");
					subpathEl.textContent = `#${subpath}`;
					subpathEl.style.color = 'var(--text-muted)';
					subpathEl.style.fontSize = 'var(--font-smaller)';
					subpathEl.style.marginTop = '4px';
				}
			}
		} else {
			content.textContent = "无效的文件引用";
			content.style.color = 'var(--text-error)';
			content.style.fontStyle = 'italic';
		}
	}

	// 渲染链接节点 - 简化DOM结构，对齐官方Canvas样式
	renderLinkNode(card: HTMLElement, node: CanvasNode) {
		const content = card.createDiv("card-content");

		// 使用官方Canvas样式设置
		content.style.lineHeight = 'var(--line-height-normal)';
		content.style.fontSize = 'var(--font-text-size)';
		content.style.fontFamily = 'var(--font-text)';
		content.style.color = 'var(--text-normal)';
		content.style.padding = '0';
		content.style.margin = '0';

		// 异步加载链接预览
		this.renderLinkNodeWithPreview(content, node);
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

	// 获取官方Canvas颜色样式
	getColorStyles(color: string): { backgroundColor: string; textColor: string; borderColor: string } {
		return ColorUtils.getCanvasColorStyles(color);
	}

	// 标准化颜色值 - 使用官方Canvas颜色系统
	private normalizeColorValue(color: string | undefined): string | null {
		return ColorUtils.normalizeCanvasColor(color);
	}

	// 卡片点击事件（官方Canvas逻辑：单击选中，再次点击编辑）
	onCardClick(node: CanvasNode, cardElement?: HTMLElement) {
		const clickedCard = cardElement || this.gridContainer.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
		if (!clickedCard) return;

		DebugManager.log('🖱️ 卡片点击事件 (onCardClick)', {
			nodeId: node.id,
			nodeType: node.type,
			isSelected: this.selectedCard === clickedCard,
			hasCurrentEditing: !!this.currentEditingCard,
			isCurrentEditing: this.currentEditingCard === clickedCard
		});

		// 🔧 注意：分组卡片点击现在在 handleGridClick 中直接处理
		// 这里只处理普通节点卡片

		// 🎯 新增：统一的编辑状态检查
		const editCheck = this.canEnterEditMode(node, clickedCard);
		DebugManager.log('🎯 编辑状态检查:', {
			nodeId: node.id,
			isCurrentEditingCard: this.currentEditingCard === clickedCard,
			hasCurrentEditingCard: !!this.currentEditingCard,
			cardHasEditingClass: clickedCard.classList.contains('editing'),
			editCheck: editCheck
		});

		// 如果当前有卡片在编辑状态，先退出编辑并保存
		if (this.currentEditingCard && this.currentEditingNode) {
			if (clickedCard !== this.currentEditingCard) {
				DebugManager.log('🔄 切换编辑卡片，先保存当前编辑');
				this.exitCurrentEditingState(true); // 保存当前编辑
			}
		}

		// 官方Canvas逻辑：检查是否是已选中的卡片
		if (this.selectedCard === clickedCard && this.selectedNode?.id === node.id) {
			// 再次点击已选中的卡片 -> 进入编辑模式
			if (editCheck.canEdit) {
				if (editCheck.action === 'switch') {
					// 切换到新卡片编辑
					this.exitCurrentEditingState(true);
				}
				DebugManager.log('🎯 再次点击已选中卡片，进入编辑模式');
				this.startEditingFromSelection(node, clickedCard);
			} else {
				DebugManager.log(`🚫 阻止重复编辑: ${editCheck.reason}`);
			}
		} else {
			// 首次点击或点击其他卡片 -> 选中卡片
			DebugManager.log('📌 选中卡片');
			this.selectCard(node, clickedCard);
		}
	}

	/**
	 * 选中卡片（官方Canvas风格）
	 */
	private selectCard(node: CanvasNode, cardElement: HTMLElement): void {
		// 清除之前的选中状态
		if (this.selectedCard) {
			this.selectedCard.classList.remove('selected');
		}

		// 设置新的选中状态
		this.selectedCard = cardElement;
		this.selectedNode = node;
		cardElement.classList.add('selected');

		DebugManager.log('卡片已选中:', node.id);
	}

	/**
	 * 清除卡片选中状态
	 */
	private clearSelection(): void {
		if (this.selectedCard) {
			this.selectedCard.classList.remove('selected');
			this.selectedCard = null;
			this.selectedNode = null;
		}
	}

	/**
	 * 完整的编辑状态清理（官方Canvas风格）
	 * 确保退出编辑后回到正确的未选中状态
	 */
	private completeEditingStateCleanup(): void {
		DebugManager.log('🧹 执行完整的编辑状态清理');

		// 1. 清理编辑状态
		this.clearEditingState();

		// 2. 确保清除选中状态（官方Canvas行为：编辑后回到未选中状态）
		this.clearSelection();

		// 3. 清理可能残留的编辑相关样式和状态
		if (this.gridContainer) {
			// 移除网格编辑状态
			this.gridContainer.classList.remove('has-editing-card');

			// 清理所有可能残留的编辑状态
			const editingCards = this.gridContainer.querySelectorAll('.canvas-grid-card.editing');
			editingCards.forEach(card => {
				card.classList.remove('editing');
				// 重置可能被修改的样式
				(card as HTMLElement).style.zIndex = '';
				(card as HTMLElement).style.position = '';
			});
		}

		DebugManager.log('✅ 编辑状态清理完成，回到未选中状态');
	}

	/**
	 * 统一的编辑状态检查方法
	 * 防止重复进入编辑模式，解决双击高度递增问题
	 */
	private canEnterEditMode(node: CanvasNode, cardElement: HTMLElement): {
		canEdit: boolean;
		reason: string;
		action: 'allow' | 'prevent' | 'switch';
	} {
		// 🎯 关键修复：检查是否是当前编辑的卡片
		if (this.currentEditingCard === cardElement) {
			return {
				canEdit: false,
				reason: '卡片已在编辑状态，防止重复编辑',
				action: 'prevent'
			};
		}

		// 检查是否有其他卡片在编辑
		if (this.currentEditingCard && this.currentEditingNode) {
			return {
				canEdit: true,
				reason: '需要切换编辑卡片',
				action: 'switch'
			};
		}

		// 检查卡片类型是否支持编辑
		if (node.type !== 'text' && node.type !== 'link') {
			return {
				canEdit: false,
				reason: '卡片类型不支持编辑',
				action: 'prevent'
			};
		}

		// 检查DOM状态一致性
		if (cardElement.classList.contains('editing')) {
			return {
				canEdit: false,
				reason: 'DOM显示卡片已在编辑状态',
				action: 'prevent'
			};
		}

		return {
			canEdit: true,
			reason: '可以进入编辑模式',
			action: 'allow'
		};
	}

	/**
	 * 状态一致性验证方法
	 * 检查编辑状态的内存与DOM一致性
	 */
	private validateEditingStateConsistency(): {
		isConsistent: boolean;
		issues: string[];
		fixes: string[];
	} {
		const issues: string[] = [];
		const fixes: string[] = [];

		// 检查内存状态与DOM状态的一致性
		const editingCards = this.gridContainer.querySelectorAll('.canvas-grid-card.editing');

		if (this.currentEditingCard && !this.currentEditingCard.classList.contains('editing')) {
			issues.push('内存中的编辑卡片缺少editing CSS类');
			fixes.push('添加editing CSS类');
		}

		if (editingCards.length > 1) {
			issues.push('发现多个编辑状态的卡片');
			fixes.push('清理多余的编辑状态');
		}

		if (editingCards.length === 0 && this.currentEditingCard) {
			issues.push('内存状态显示有编辑卡片，但DOM中无编辑状态');
			fixes.push('清理内存状态或恢复DOM状态');
		}

		if (editingCards.length === 1 && !this.currentEditingCard) {
			issues.push('DOM显示有编辑卡片，但内存状态为空');
			fixes.push('同步内存状态或清理DOM状态');
		}

		return {
			isConsistent: issues.length === 0,
			issues,
			fixes
		};
	}

	/**
	 * 进入编辑模式（官方Canvas风格）
	 */
	private startEditingFromSelection(node: CanvasNode, cardElement: HTMLElement): void {
		// 🎯 新增：编辑前状态检查
		const editCheck = this.canEnterEditMode(node, cardElement);
		if (!editCheck.canEdit) {
			DebugManager.log(`🚫 阻止从选中状态进入编辑: ${editCheck.reason}`);
			return;
		}

		if (node.type === 'text') {
			this.startTextEditing(node, cardElement);
		} else if (node.type === 'link') {
			this.startLinkEditing(node, cardElement);
		}
		// 文件节点暂时不支持编辑
	}



	// 开始文本编辑（使用新状态管理系统）
	startTextEditing(node: CanvasNode, cardElement: HTMLElement) {
		// 🎯 新增：编辑前状态检查
		const editCheck = this.canEnterEditMode(node, cardElement);
		if (!editCheck.canEdit) {
			DebugManager.log(`🚫 阻止文本编辑: ${editCheck.reason}`);
			return;
		}

		// 清除选中状态（进入编辑模式）
		this.clearSelection();

		// 如果已有其他卡片在编辑，先退出编辑状态
		if (this.currentEditingCard && this.currentEditingCard !== cardElement) {
			this.exitCurrentEditingState(true); // 保存当前编辑
		}

		const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 设置当前编辑状态（保持向后兼容）
		this.currentEditingCard = cardElement;
		this.currentEditingNode = node;

		// 保存原始内容
		const originalText = node.text || '';

		// 使用新的编辑器状态协调器创建编辑器
		this.editorStateCoordinator.createEditor({
			nodeId: node.id,
			content: originalText,
			// 内容变化回调
			onChange: (newText: string) => {
				this.updateContentWithNewSystem(node.id, { ...node, text: newText });
			},
			// 保存回调
			onSave: async (newText: string) => {
				this.stopEditingWithNewSystem(node.id, true);
				await this.exitEditModeWithNewSystem(cardElement, contentDiv, node.id, newText);
				this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
			},
			// 取消回调
			onCancel: async () => {
				this.stopEditingWithNewSystem(node.id, false);
				await this.exitEditModeWithNewSystem(cardElement, contentDiv, node.id, originalText);
				this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
			}
		}).then(editor => {
			// 进入编辑模式
			this.enterEditMode(cardElement, contentDiv, editor);
		}).catch(error => {
			DebugManager.error('Failed to create editor with coordinator, falling back to legacy method:', error);
			// 回退到原有方法
			this.startTextEditingLegacy(node, cardElement);
		});
	}

	// 原有的文本编辑方法（重命名为legacy）
	private startTextEditingLegacy(node: CanvasNode, cardElement: HTMLElement) {
		const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 使用新的状态管理系统开始编辑
		const editorState = this.startEditingWithNewSystem(node.id, node, cardElement);

		// 保存原始内容
		const originalText = node.text || '';

		// 创建文本编辑器（使用新的内容更新机制）
		const editor = this.createTextEditorWithNewSystem(originalText,
			// 内容变化回调
			(newText: string) => {
				this.updateContentWithNewSystem(node.id, { ...node, text: newText });
			},
			// 保存回调
			async (newText: string) => {
				this.stopEditingWithNewSystem(node.id, true);
				await this.exitEditModeWithNewSystem(cardElement, contentDiv, node.id, newText);
				this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
			},
			// 取消回调
			async () => {
				this.stopEditingWithNewSystem(node.id, false);
				await this.exitEditModeWithNewSystem(cardElement, contentDiv, node.id, originalText);
				this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
			}
		);

		// 进入编辑模式
		this.enterEditMode(cardElement, contentDiv, editor);
	}

	// 创建文本编辑器 - 使用Obsidian的CodeMirror编辑器
	createTextEditor(text: string, onSave: (text: string) => void, onCancel: () => void, enableAutoSave: boolean = true): HTMLElement {
		// 创建编辑器容器
		const editorContainer = document.createElement('div');
		editorContainer.className = 'card-editor-container obsidian-editor';
		editorContainer.style.width = '100%';
		editorContainer.style.height = '100%';
		editorContainer.style.position = 'relative';
		editorContainer.style.overflow = 'hidden';

		// 创建一个临时的markdown文件来获取Editor实例
		this.createObsidianEditor(editorContainer, text, onSave, onCancel, enableAutoSave);

		return editorContainer;
	}

	// 创建文本编辑器（新状态管理系统版本）
	createTextEditorWithNewSystem(
		text: string,
		onChange: (text: string) => void,
		onSave: (text: string) => void,
		onCancel: () => void
	): HTMLElement {
		// 使用新的编辑器状态协调器创建编辑器
		const nodeId = `temp-${Date.now()}`;

		// 异步创建编辑器，但返回占位容器
		const placeholderContainer = document.createElement('div');
		placeholderContainer.className = 'card-editor-container obsidian-editor';
		placeholderContainer.style.width = '100%';
		placeholderContainer.style.height = '100%';
		placeholderContainer.style.position = 'relative';
		placeholderContainer.style.overflow = 'hidden';

		// 异步创建真正的编辑器
		this.editorStateCoordinator.createEditor({
			nodeId,
			content: text,
			onChange,
			onSave,
			onCancel
		}).then(editorContainer => {
			// 替换占位容器的内容
			placeholderContainer.innerHTML = '';
			placeholderContainer.appendChild(editorContainer);

			// 复制清理函数
			(placeholderContainer as any).cleanup = (editorContainer as any).cleanup;
		}).catch(error => {
			DebugManager.error('Failed to create editor with coordinator:', error);
			// 回退到原有方法
			this.createObsidianEditorWithNewSystem(placeholderContainer, text, onChange, onSave, onCancel);
		});

		return placeholderContainer;
	}

	// 创建Obsidian编辑器实例
	private async createObsidianEditor(
		container: HTMLElement,
		text: string,
		onSave: (text: string) => void,
		onCancel: () => void,
		enableAutoSave: boolean
	): Promise<void> {
		try {
			// 创建一个临时的markdown文件用于编辑器
			const tempFileName = `temp-editor-${Date.now()}.md`;
			const tempFile = await this.app.vault.create(tempFileName, text);

			// 创建一个新的leaf来承载编辑器
			const leaf = this.app.workspace.createLeafInParent(this.app.workspace.rootSplit, 0);
			await leaf.openFile(tempFile);

			// 获取MarkdownView和Editor
			const markdownView = leaf.view as MarkdownView;
			if (markdownView && markdownView.editor) {
				const editor = markdownView.editor;

				// 将编辑器的DOM元素移动到我们的容器中
				const editorEl = (markdownView as any).contentEl;
				if (editorEl) {
					// 清空容器并添加编辑器
					container.empty();
					container.appendChild(editorEl);

					// 设置编辑器样式
					this.setupLegacyEditorStyles(editorEl);

					// 设置编辑器内容
					editor.setValue(text);

					// 自动保存逻辑
					let autoSaveTimeout: NodeJS.Timeout | null = null;
					const autoSave = () => {
						if (!enableAutoSave) return;

						if (autoSaveTimeout) {
							clearTimeout(autoSaveTimeout);
						}
						autoSaveTimeout = setTimeout(() => {}, PERFORMANCE_CONSTANTS.STANDARD_DELAY);
					};

					// 监听编辑器变化
					const changeHandler = () => {
						if (enableAutoSave) {
							autoSave();
						}
					};

					// 注册事件监听器
					this.app.workspace.on('editor-change', changeHandler);

					// 键盘事件处理
					const keyHandler = (evt: KeyboardEvent) => {
						if (evt.key === 'Escape') {
							evt.preventDefault();
							if (autoSaveTimeout) {
								clearTimeout(autoSaveTimeout);
								autoSaveTimeout = null;
							}
							onSave(editor.getValue());
							this.cleanupTempEditor(leaf, tempFile, changeHandler);
						} else if (evt.key === 'Enter' && (evt.ctrlKey || evt.metaKey)) {
							evt.preventDefault();
							if (autoSaveTimeout) {
								clearTimeout(autoSaveTimeout);
								autoSaveTimeout = null;
							}
							onSave(editor.getValue());
							this.cleanupTempEditor(leaf, tempFile, changeHandler);
						}
					};

					// 添加键盘事件监听
					editorEl.addEventListener('keydown', keyHandler);

					// 聚焦编辑器
					setTimeout(() => {
						editor.focus();
						// 将光标移到文本末尾
						const lastLine = editor.lastLine();
						const lastLineLength = editor.getLine(lastLine).length;
						editor.setCursor({ line: lastLine, ch: lastLineLength });
					}, 100);

					// 存储编辑器实例和清理函数
					(container as any).editorInstance = editor;
					(container as any).cleanup = () => {
						this.cleanupTempEditor(leaf, tempFile, changeHandler);
						editorEl.removeEventListener('keydown', keyHandler);
					};
				}
			}
		} catch (error) {
			DebugManager.error('Failed to create Obsidian editor:', error);
			// 回退到简单的textarea编辑器
			this.createFallbackEditor(container, text, onSave, onCancel, enableAutoSave);
		}
	}

	// 清理临时编辑器（保留向后兼容）
	private async cleanupTempEditor(leaf: WorkspaceLeaf, tempFile: TFile, changeHandler: () => void): Promise<void> {
		try {
			// 移除事件监听器
			this.app.workspace.off('editor-change', changeHandler);

			// 关闭leaf
			leaf.detach();

			// 删除临时文件
			await this.app.vault.delete(tempFile);
		} catch (error) {
			DebugManager.error('Failed to cleanup temp editor:', error);
		}
	}

	// 新的统一清理方法
	private async cleanupEditorWithCoordinator(nodeId: string, saveChanges: boolean = false): Promise<void> {
		try {
			await this.editorStateCoordinator.cleanupEditor(nodeId, saveChanges);
			DebugManager.log('Editor cleaned up with coordinator:', nodeId);
		} catch (error) {
			DebugManager.error('Failed to cleanup editor with coordinator:', error);
		}
	}

	// 启动定期健康检查
	private startPeriodicHealthCheck(): void {
		// 每5分钟执行一次健康检查
		setInterval(() => {
			this.performHealthCheck();
		}, 5 * 60 * 1000);

		// 立即执行一次健康检查
		setTimeout(() => {
			this.performHealthCheck();
		}, 10000); // 10秒后执行第一次检查
	}

	// 执行健康检查
	private async performHealthCheck(): Promise<void> {
		try {
			const healthStatus = this.diagnosticsManager.checkSystemHealth();

			if (!healthStatus.isHealthy) {
				DebugManager.warn('System health check detected issues:', healthStatus.issues);

				// 尝试自动修复
				const fixAttempted = await this.diagnosticsManager.performAutoFix(healthStatus);

				if (fixAttempted) {
					DebugManager.log('Auto-fix attempted for health issues');

					// 重新检查
					const recheck = this.diagnosticsManager.checkSystemHealth();
					if (recheck.isHealthy) {
						DebugManager.log('Auto-fix successful, system is now healthy');
					} else {
						DebugManager.warn('Auto-fix completed but issues remain:', recheck.issues);
					}
				}
			} else {
				DebugManager.log('System health check passed');
			}
		} catch (error) {
			DebugManager.error('Health check failed:', error);
		}
	}

	// 回退编辑器（当Obsidian编辑器创建失败时使用）
	private createFallbackEditor(
		container: HTMLElement,
		text: string,
		onSave: (text: string) => void,
		onCancel: () => void,
		enableAutoSave: boolean
	): void {
		const textarea = document.createElement('textarea');
		textarea.className = 'card-editor-textarea fallback-editor';
		textarea.value = text;
		textarea.style.width = '100%';
		textarea.style.height = '100%';
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.resize = 'none';
		textarea.style.padding = '0';
		textarea.style.fontFamily = 'var(--font-text)';
		textarea.style.fontSize = 'var(--font-text-size)';
		textarea.style.lineHeight = '1.5';
		textarea.style.background = 'transparent';
		textarea.style.color = 'var(--text-normal)';
		textarea.style.borderRadius = 'inherit';

		// Canvas兼容模式：移除自动保存定时器逻辑
		// 保存现在由blur事件和手动操作控制，与官方Canvas行为一致

		// 事件监听（Canvas兼容模式）
		// 移除input事件的自动保存，避免与官方Canvas冲突

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				// Canvas兼容模式：立即保存，无延迟
				onSave(textarea.value);
			} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				// Canvas兼容模式：立即保存，无延迟
				onSave(textarea.value);
			}
		});

		container.empty();
		container.appendChild(textarea);

		// 聚焦
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(textarea.value.length, textarea.value.length);
		}, 0);
	}

	// 创建Obsidian编辑器实例（新状态管理系统版本）
	private async createObsidianEditorWithNewSystem(
		container: HTMLElement,
		text: string,
		onChange: (text: string) => void,
		onSave: (text: string) => void,
		onCancel: () => void
	): Promise<void> {
		try {
			// 创建一个临时的markdown文件用于编辑器
			const tempFileName = `temp-editor-${Date.now()}.md`;
			const tempFile = await this.app.vault.create(tempFileName, text);

			// 创建一个新的leaf来承载编辑器
			const leaf = this.app.workspace.createLeafInParent(this.app.workspace.rootSplit, 0);
			await leaf.openFile(tempFile);

			// 获取MarkdownView和Editor
			const markdownView = leaf.view as MarkdownView;
			if (markdownView && markdownView.editor) {
				const editor = markdownView.editor;

				// 将编辑器的DOM元素移动到我们的容器中
				const editorEl = (markdownView as any).contentEl;
				if (editorEl) {
					// 清空容器并添加编辑器
					container.empty();
					container.appendChild(editorEl);

					// 设置编辑器样式
					this.setupLegacyEditorStyles(editorEl);

					// 设置编辑器内容
					editor.setValue(text);

					// 内容变化监听器（新系统）
					const changeHandler = () => {
						const currentText = editor.getValue();
						onChange(currentText); // 实时更新状态管理系统
					};

					// 注册事件监听器
					this.app.workspace.on('editor-change', changeHandler);

					// 键盘事件处理
					const keyHandler = (evt: KeyboardEvent) => {
						if (evt.key === 'Escape') {
							evt.preventDefault();
							onCancel();
							this.cleanupTempEditor(leaf, tempFile, changeHandler);
						} else if (evt.key === 'Enter' && (evt.ctrlKey || evt.metaKey)) {
							evt.preventDefault();
							onSave(editor.getValue());
							this.cleanupTempEditor(leaf, tempFile, changeHandler);
						}
					};

					// 添加键盘事件监听
					editorEl.addEventListener('keydown', keyHandler);

					// 聚焦编辑器
					setTimeout(() => {
						editor.focus();
						// 将光标移到文本末尾
						const lastLine = editor.lastLine();
						const lastLineLength = editor.getLine(lastLine).length;
						editor.setCursor({ line: lastLine, ch: lastLineLength });
					}, 100);

					// 存储编辑器实例和清理函数
					(container as any).editorInstance = editor;
					(container as any).cleanup = () => {
						this.cleanupTempEditor(leaf, tempFile, changeHandler);
						editorEl.removeEventListener('keydown', keyHandler);
					};
				}
			}
		} catch (error) {
			DebugManager.error('Failed to create Obsidian editor with new system:', error);
			// 回退到简单的textarea编辑器
			this.createFallbackEditorWithNewSystem(container, text, onChange, onSave, onCancel);
		}
	}

	// 回退编辑器（新状态管理系统版本）
	private createFallbackEditorWithNewSystem(
		container: HTMLElement,
		text: string,
		onChange: (text: string) => void,
		onSave: (text: string) => void,
		onCancel: () => void
	): void {
		const textarea = document.createElement('textarea');
		textarea.className = 'card-editor-textarea fallback-editor';
		textarea.value = text;
		textarea.style.width = '100%';
		textarea.style.height = '100%';
		textarea.style.border = 'none';
		textarea.style.outline = 'none';
		textarea.style.resize = 'none';
		textarea.style.fontFamily = 'var(--font-text)';
		textarea.style.fontSize = 'var(--font-text-size)';
		textarea.style.lineHeight = 'var(--line-height-normal)';
		textarea.style.color = 'var(--text-normal)';
		textarea.style.background = 'transparent';
		textarea.style.padding = '0';
		textarea.style.borderRadius = 'inherit';

		// 内容变化监听
		textarea.addEventListener('input', () => {
			onChange(textarea.value);
		});

		// 键盘事件处理
		textarea.addEventListener('keydown', (evt) => {
			if (evt.key === 'Escape') {
				evt.preventDefault();
				onCancel();
			} else if (evt.key === 'Enter' && (evt.ctrlKey || evt.metaKey)) {
				evt.preventDefault();
				onSave(textarea.value);
			}
		});

		container.empty();
		container.appendChild(textarea);

		// 聚焦
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(textarea.value.length, textarea.value.length);
		}, 0);
	}

	// 从编辑器容器获取内容
	private getEditorContent(editorContainer: HTMLElement): string {
		// 尝试从存储的编辑器实例获取内容
		const storedEditor = (editorContainer as any).editorInstance;
		if (storedEditor && typeof storedEditor.getValue === 'function') {
			return storedEditor.getValue();
		}

		// 回退：从DOM中查找textarea
		const textarea = editorContainer.querySelector('textarea');
		if (textarea) {
			return textarea.value;
		}

		// 最后的回退：返回空字符串
		return '';
	}





	// 清除编辑状态
	private clearEditingState() {
		this.currentEditingCard = null;
		this.currentEditingNode = null;
	}

	/**
	 * 🎯 新增：获取当前编辑的内容容器
	 */
	private getEditingContentDiv(): HTMLElement | null {
		if (!this.currentEditingCard) {
			DebugManager.warn('⚠️ 当前无编辑卡片');
			return null;
		}

		const contentDiv = this.currentEditingCard.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) {
			DebugManager.error('❌ 无法找到卡片内容容器', {
				cardId: this.currentEditingCard.dataset.nodeId
			});
			return null;
		}

		return contentDiv;
	}

	/**
	 * 🎯 新增：验证编辑上下文的完整性
	 */
	private validateEditingContext(): boolean {
		const isValid = !!(this.currentEditingCard && this.currentEditingNode);
		if (!isValid) {
			DebugManager.warn('⚠️ 编辑上下文验证失败', {
				hasCard: !!this.currentEditingCard,
				hasNode: !!this.currentEditingNode
			});
		}
		return isValid;
	}

	// 退出当前编辑状态
	private exitCurrentEditingState(save: boolean = false) {
		if (!this.currentEditingCard || !this.currentEditingNode) return;

		const nodeId = this.currentEditingNode.id;

		// 🎯 关键修复：保存编辑上下文信息，确保UI恢复时可用
		const cardElement = this.currentEditingCard;
		const contentDiv = this.getEditingContentDiv();

		if (!contentDiv) {
			DebugManager.error('❌ 无法获取内容容器，回退到传统方法', { nodeId });
			this.exitCurrentEditingStateLegacy(save);
			return;
		}

		// 尝试使用新的协调器清理
		if (this.editorStateCoordinator && this.editorStateCoordinator.isEditorActive(nodeId)) {
			DebugManager.log('🔄 使用协调器清理编辑状态', { nodeId, save });

			this.editorStateCoordinator.cleanupEditor(nodeId, save).then((cleanupResult) => {
				DebugManager.log('✅ 协调器清理完成，开始UI恢复', {
					nodeId,
					hasContent: !!cleanupResult?.content,
					contentLength: cleanupResult?.content?.length || 0
				});

				// 🎯 关键修复：补充遗漏的UI恢复逻辑
				if (contentDiv && cardElement) {
					// 获取编辑后的内容，优先使用清理结果，回退到节点原始内容
					const editedContent = cleanupResult?.content || this.currentEditingNode?.text || '';

					DebugManager.log('🔧 执行UI恢复和内容渲染', {
						nodeId,
						contentPreview: editedContent.substring(0, 50) + (editedContent.length > 50 ? '...' : ''),
						contentLength: editedContent.length
					});

					// 调用完整的UI恢复流程
					this.exitEditModeWithNewSystem(cardElement, contentDiv, nodeId, editedContent);
				} else {
					DebugManager.error('❌ UI恢复失败：缺少必要的DOM元素', {
						nodeId,
						hasCardElement: !!cardElement,
						hasContentDiv: !!contentDiv
					});
				}

				this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
			}).catch(error => {
				DebugManager.error('Failed to cleanup with coordinator, falling back to legacy method:', error);
				this.exitCurrentEditingStateLegacy(save);
			});
			return;
		}

		// 回退到原有方法
		this.exitCurrentEditingStateLegacy(save);
	}

	// 原有的退出编辑状态方法（重命名为legacy）
	private exitCurrentEditingStateLegacy(save: boolean = false) {
		if (!this.currentEditingCard || !this.currentEditingNode) return;

		const contentDiv = this.currentEditingCard.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 查找编辑器
		const textarea = this.currentEditingCard.querySelector('textarea') as HTMLTextAreaElement;
		const input = this.currentEditingCard.querySelector('input') as HTMLInputElement;
		const editorContainer = this.currentEditingCard.querySelector('.card-editor-container') as HTMLElement;

		if (save) {
			// 保存当前编辑内容
			if (this.currentEditingNode.type === 'text') {
				let textContent = '';
				if (editorContainer) {
					// 从CodeMirror编辑器获取内容
					textContent = this.getEditorContent(editorContainer);
				} else if (textarea) {
					// 从传统textarea获取内容
					textContent = textarea.value;
				}
				this.saveTextNode(this.currentEditingNode, textContent);
				this.exitEditMode(this.currentEditingCard, contentDiv, textContent);
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

		this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
	}

	// ==================== Canvas数据同步方法 ====================

	// 建立与官方Canvas的双向数据同步
	private setupCanvasDataSync(): void {
		try {
			// 监听文件变化事件
			this.registerEvent(
				this.app.vault.on('modify', (file) => {
					if (file instanceof TFile && file.extension === 'canvas' && file === this.linkedCanvasFile) {
						DebugManager.log('🔄 Canvas文件变化，同步数据:', file.path);
						this.syncCanvasDataFromFile(file);
					}
				})
			);

			// 监听工作区变化事件
			this.registerEvent(
				this.app.workspace.on('active-leaf-change', (leaf) => {
					if (leaf?.view?.getViewType() === 'canvas') {
						const canvasView = leaf.view as any;
						if (canvasView.file === this.linkedCanvasFile) {
							DebugManager.log('🔄 Canvas视图激活，同步数据');
							this.syncCanvasDataFromView(canvasView);
						}
					}
				})
			);

			// 🎯 新增：监听文件删除事件，确保删除操作的完整同步
			this.registerEvent(
				this.app.vault.on('delete', (file) => {
					if (file instanceof TFile && file.extension === 'canvas' && file === this.linkedCanvasFile) {
						DebugManager.log('🗑️ Canvas文件被删除，清理视图状态');
						this.canvasData = null;
						this.filteredNodes = [];
						this.renderGrid();
					}
				})
			);

			// 监听Canvas特定事件（如果存在）
			this.setupCanvasSpecificEventListeners();

			DebugManager.log('✅ Canvas数据同步机制已建立（增强版）');
		} catch (error) {
			DebugManager.error('Failed to setup Canvas data sync:', error);
		}
	}

	// 设置Canvas特定事件监听器
	private setupCanvasSpecificEventListeners(): void {
		try {
			// 尝试监听Canvas相关事件
			const events = [
				'canvas:node-moved',
				'canvas:node-resized',
				'canvas:node-added',
				'canvas:node-removed',
				'canvas:group-changed'
			];

			events.forEach(eventName => {
				try {
					this.registerEvent(
						this.app.workspace.on(eventName as any, (data: any) => {
							if (this.linkedCanvasFile) {
								DebugManager.log(`🔄 Canvas事件 [${eventName}]:`, data);
								this.handleCanvasEvent(eventName, data);
							}
						})
					);
				} catch (e) {
					// 某些事件可能不存在，忽略错误
					DebugManager.log(`Canvas事件 [${eventName}] 不可用`);
				}
			});
		} catch (error) {
			DebugManager.error('Failed to setup Canvas specific event listeners:', error);
		}
	}

	// 处理Canvas事件
	private handleCanvasEvent(eventName: string, data: any): void {
		switch (eventName) {
			case 'canvas:group-changed':
				// 分组变化时重新分析分组
				this.analyzeGroups();
				this.renderGrid();
				break;
			case 'canvas:node-added':
			case 'canvas:node-removed':
				// 节点增删时重新加载数据
				if (this.linkedCanvasFile) {
					this.syncCanvasDataFromFile(this.linkedCanvasFile);
				}
				break;
			case 'canvas:node-moved':
			case 'canvas:node-resized':
				// 节点移动或调整大小时重新分析分组
				this.analyzeGroups();
				break;
		}
	}

	// 从文件同步Canvas数据
	private async syncCanvasDataFromFile(file: TFile): Promise<void> {
		try {
			await this.loadCanvasDataFromOfficialView(file);
			this.analyzeGroups();
			this.renderGrid();
			DebugManager.log('✅ Canvas数据从文件同步完成');
		} catch (error) {
			DebugManager.error('Failed to sync Canvas data from file:', error);
		}
	}

	// 从视图同步Canvas数据
	private syncCanvasDataFromView(canvasView: any): void {
		try {
			const canvasData = this.extractCanvasDataFromView(canvasView);
			if (canvasData) {
				this.canvasData = canvasData;
				this.filteredNodes = [...canvasData.nodes];
				this.analyzeGroups();
				this.renderGrid();
				DebugManager.log('✅ Canvas数据从视图同步完成');
			}
		} catch (error) {
			DebugManager.error('Failed to sync Canvas data from view:', error);
		}
	}

	// ==================== 分组功能相关方法 ====================

	// 分析Canvas中的分组和成员关系（使用官方Canvas状态）
	private analyzeGroups(): void {
		if (!this.canvasData) return;

		this.groupAnalysis.clear();

		// 找出所有分组节点
		const groupNodes = this.canvasData.nodes.filter(node => node.type === 'group');

		// 为每个分组分析其成员
		groupNodes.forEach(group => {
			const members = this.findGroupMembersFromOfficialState(group);
			const groupInfo: GroupInfo = {
				group: group,
				members: members,
				memberCount: members.length,
				bounds: this.calculateGroupBounds(group)
			};
			this.groupAnalysis.set(group.id, groupInfo);
			DebugManager.log(`✅ 分组分析 [${group.id}]: ${members.length} 个成员`);
		});

		DebugManager.log('分组分析完成，总分组数:', this.groupAnalysis.size);
	}

	// 从官方Canvas状态查找分组成员
	private findGroupMembersFromOfficialState(group: CanvasNode): CanvasNode[] {
		if (!this.canvasData) {
			DebugManager.log(`❌ Canvas数据不存在 [${group.id}]`);
			return [];
		}

		DebugManager.log(`🔍 开始查找分组成员 [${group.id}]:`, {
			groupType: group.type,
			groupText: group.text?.substring(0, 50),
			totalNodes: this.canvasData.nodes.length
		});

		// 首先尝试从官方Canvas视图获取分组信息
		const officialMembers = this.getGroupMembersFromOfficialView(group.id);
		if (officialMembers && officialMembers.length > 0) {
			DebugManager.log(`✅ 从官方Canvas获取分组成员 [${group.id}]: ${officialMembers.length} 个`);
			return officialMembers;
		}

		// 回退到传统的边界检测方法
		DebugManager.log(`🔄 回退到边界检测方法 [${group.id}]`);
		const boundaryMembers = this.findGroupMembersByBounds(group);
		DebugManager.log(`🔄 边界检测结果 [${group.id}]: ${boundaryMembers.length} 个成员`);

		return boundaryMembers;
	}

	// 从官方Canvas视图获取分组成员
	private getGroupMembersFromOfficialView(groupId: string): CanvasNode[] {
		try {
			if (!this.linkedCanvasFile) return [];

			const canvasView = this.getOfficialCanvasView(this.linkedCanvasFile);
			if (!canvasView) return [];

			// 尝试多种方式获取分组成员信息
			let groupMembers: string[] = [];

			// 方式1: 通过canvas.groups
			if (canvasView.canvas?.groups?.[groupId]) {
				const groupData = canvasView.canvas.groups[groupId];
				if (Array.isArray(groupData.members)) {
					groupMembers = groupData.members;
				} else if (groupData.children) {
					groupMembers = Array.isArray(groupData.children) ? groupData.children : [];
				}
			}
			// 方式2: 通过canvas.data.groups
			else if (canvasView.canvas?.data?.groups?.[groupId]) {
				const groupData = canvasView.canvas.data.groups[groupId];
				groupMembers = groupData.members || groupData.children || [];
			}
			// 方式3: 遍历所有节点查找parent关系
			else if (canvasView.canvas?.nodes) {
				const nodes = canvasView.canvas.nodes;
				for (const [nodeId, nodeData] of Object.entries(nodes)) {
					if ((nodeData as any).parent === groupId || (nodeData as any).groupId === groupId) {
						groupMembers.push(nodeId);
					}
				}
			}

			// 将成员ID转换为CanvasNode对象
			if (groupMembers.length > 0) {
				const memberNodes = groupMembers
					.map(memberId => this.canvasData?.nodes.find(node => node.id === memberId))
					.filter(node => node !== undefined) as CanvasNode[];

				DebugManager.log(`✅ 官方Canvas分组成员 [${groupId}]: ${memberNodes.length} 个`);
				return memberNodes;
			}

			return [];
		} catch (error) {
			DebugManager.error('Error getting group members from official view:', error);
			return [];
		}
	}

	// 传统的边界检测方法（回退方案）
	private findGroupMembersByBounds(group: CanvasNode): CanvasNode[] {
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

		DebugManager.log(`🔄 边界检测分组成员 [${group.id}]: ${members.length} 个`);
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
		DebugManager.log('🔄 Group sorting result:');
		sortedGroups.forEach((group, index) => {
			const isActive = this.isActiveTimeCapsuleGroup(group.group.id);
			const isHistorical = this.isHistoricalTimeCapsuleGroup(group.group.id);
			const type = isActive ? 'ACTIVE' : isHistorical ? 'HISTORICAL' : 'NORMAL';
			DebugManager.log(`  ${index + 1}. [${type}] ${group.group.id}`);
		});

		return sortedGroups;
	}

	// 判断是否为时间胶囊分组（包括历史时间胶囊）
	private isTimeCapsuleGroup(groupId: string): boolean {
		// 通过ID前缀检测
		if (groupId.startsWith('time-capsule-')) {
			return true;
		}

		// 通过分组名称检测（兼容手动创建的时间胶囊分组）
		const groupInfo = this.groupAnalysis.get(groupId);
		if (groupInfo && groupInfo.group.label) {
			const label = groupInfo.group.label.toLowerCase();
			return label.includes('时间胶囊') || label.includes('time-capsule') || label.includes('time capsule');
		}

		return false;
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
		DebugManager.log(`🔍 尝试进入分组视图: ${groupId}`);

		const groupInfo = this.groupAnalysis.get(groupId);
		if (!groupInfo) {
			DebugManager.error(`❌ 分组信息不存在: ${groupId}`);
			new Notice(`分组不存在: ${groupId}`);
			return;
		}

		DebugManager.log(`✅ 找到分组信息:`, {
			groupId: groupId,
			memberCount: groupInfo.members.length,
			members: groupInfo.members.map(m => ({ id: m.id, type: m.type, text: m.text?.substring(0, 50) }))
		});

		this.currentGroupView = groupId;

		// 只显示该分组的成员节点
		this.filteredNodes = groupInfo.members;
		DebugManager.log(`🎯 设置分组视图筛选节点: ${this.filteredNodes.length} 个`);

		// 如果分组为空，显示提示
		if (groupInfo.members.length === 0) {
			DebugManager.log(`⚠️ 分组为空，显示空状态提示`);
			new Notice(`分组 "${groupInfo.group.text || groupId}" 暂无内容`);
		}

		// 重新渲染网格
		this.renderGrid().catch(error => {
			DebugManager.error('Failed to render grid in group view:', error);
		});

		// 更新工具栏显示分组信息
		this.updateToolbarForGroupView(groupInfo);

		DebugManager.log(`✅ 分组视图进入完成: ${groupId}`);
	}

	// 退出分组视图，返回主视图
	private exitGroupView(): void {
		this.currentGroupView = null;

		// 恢复显示全部内容（分组节点 + 非分组成员节点）
		if (this.canvasData) {
			// 使用统一的显示集合，确保主视图包含分组卡片与非分组成员
			this.filteredNodes = this.getAllDisplayNodes();
		}

		// 重新渲染网格
		this.renderGrid().catch(error => {
			DebugManager.error('Failed to render grid after exiting group view:', error);
		});

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

		// 查找功能按钮行容器
		const functionRow = toolbar.querySelector('.canvas-grid-toolbar-function-row');
		if (!functionRow) return;

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

		// 插入到功能按钮行的开头
		functionRow.insertBefore(backButton, functionRow.firstChild);
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
	private async renderGroupMembers(): Promise<void> {
		if (!this.currentGroupView) {
			DebugManager.log('❌ 当前不在分组视图中');
			return;
		}

		const groupInfo = this.groupAnalysis.get(this.currentGroupView);
		if (!groupInfo) {
			DebugManager.log(`❌ 分组信息不存在: ${this.currentGroupView}`);
			return;
		}

		DebugManager.log(`🎯 渲染分组成员 [${this.currentGroupView}]: ${groupInfo.members.length} 个`);

		// 清理现有内容
		if (this.gridContainer) {
			this.gridContainer.empty();
		}

		// 如果分组为空，显示空状态
		if (groupInfo.members.length === 0) {
			this.renderEmptyGroupState(groupInfo);
			return;
		}

		// 使用现有的渲染逻辑渲染成员节点
		if (groupInfo.members.length > 50) {
			await this.renderGridBatched(groupInfo.members);
		} else {
			await this.renderGridImmediate(groupInfo.members);
		}

		// 为分组详情界面的卡片设置拖拽属性和事件
		this.setupCardDragAttributes();

		DebugManager.log(`✅ 分组成员渲染完成 [${this.currentGroupView}]: ${groupInfo.members.length} 个卡片`);
	}

	// 渲染空分组状态
	private renderEmptyGroupState(groupInfo: GroupInfo): void {
		if (!this.gridContainer) return;

		const emptyState = this.gridContainer.createDiv('canvas-selection-empty');
		emptyState.innerHTML = `
			<div class="empty-icon">📁</div>
			<div class="empty-title">分组暂无内容</div>
			<div class="empty-description">
				分组 "${groupInfo.group.text || groupInfo.group.id}" 中还没有任何卡片
			</div>
		`;

		DebugManager.log(`📁 显示空分组状态: ${groupInfo.group.id}`);
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
	private async renderGridItems(items: Array<{type: 'group' | 'node', data: CanvasNode | GroupInfo}>): Promise<void> {
		const fragment = document.createDocumentFragment();

		// 分离分组卡片和普通节点卡片
		const groupItems = items.filter(item => item.type === 'group');
		const nodeItems = items.filter(item => item.type === 'node');

		// 同步创建分组卡片（分组卡片不需要异步渲染）
		groupItems.forEach(item => {
			const card = this.createGroupCard(item.data as GroupInfo);
			fragment.appendChild(card);
		});

		// 异步并行创建普通节点卡片
		if (nodeItems.length > 0) {
			const cardPromises = nodeItems.map(item => this.createCard(item.data as CanvasNode));
			const cards = await Promise.all(cardPromises);

			// 添加卡片到fragment并处理搜索高亮
			cards.forEach(card => {
				// 如果有搜索查询，高亮匹配的内容
				if (this.searchQuery) {
					this.highlightSearchResults(card, this.searchQuery);
				}
				fragment.appendChild(card);
			});
		}

		// 一次性添加所有卡片到DOM
		this.gridContainer.appendChild(fragment);
	}

	// 创建分组卡片
	private createGroupCard(groupInfo: GroupInfo): HTMLElement {
		const card = document.createElement('div');
		const isTimeCapsule = this.isTimeCapsuleGroup(groupInfo.group.id);
		const isActiveTimeCapsule = this.isActiveTimeCapsuleGroup(groupInfo.group.id);
		const isHistoricalTimeCapsule = this.isHistoricalTimeCapsuleGroup(groupInfo.group.id);

		// 调试信息
		DebugManager.log(`🔍 Creating group card: ${groupInfo.group.label}`);
		DebugManager.log(`   ID: ${groupInfo.group.id}`);
		DebugManager.log(`   Color: ${groupInfo.group.color}`);
		DebugManager.log(`   Member count: ${groupInfo.memberCount}`);
		DebugManager.log(`   isTimeCapsule: ${isTimeCapsule}`);
		DebugManager.log(`   isActiveTimeCapsule: ${isActiveTimeCapsule}`);
		DebugManager.log(`   isHistoricalTimeCapsule: ${isHistoricalTimeCapsule}`);
		DebugManager.log(`   Current timeCapsule state:`, {
			isActive: this.timeCapsuleState.isActive,
			groupId: this.timeCapsuleState.groupId,
			groupName: this.timeCapsuleState.groupName
		});

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
		// 🔧 新增：添加分组标签信息，用于CSS样式选择
		card.dataset.groupLabel = groupInfo.group.label || '未命名分组';

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

		// 时间胶囊特殊布局
		if (isTimeCapsule) {
			// 分组标题（在顶部）
			const titleDiv = contentDiv.createDiv('group-title time-capsule-title');
			titleDiv.textContent = groupInfo.group.label || '未命名分组';

			// 分组图标容器（居中）
			const iconContainer = contentDiv.createDiv('time-capsule-icon-container');
			const iconDiv = iconContainer.createDiv('group-icon time-capsule-icon-wrapper');

			if (isActiveTimeCapsule) {
				// 激活的时间胶囊图标（带旋转动画）
				iconDiv.innerHTML = `
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 2v6h.01L6 8.01 10 12l-4 4-.01.01V22h12v-5.99-.01L18 16l-4-4 4-3.99.01-.01V2H6z"/>
					</svg>
				`;
				iconDiv.classList.add('time-capsule-icon', 'time-capsule-active');

				// 正在收集状态（在图标下方）
				const collectingDiv = iconContainer.createDiv('time-capsule-collecting-status');
				collectingDiv.innerHTML = '<span class="collecting-text">正在收集</span>';
			} else if (isHistoricalTimeCapsule) {
				// 历史时间胶囊图标（静态）
				iconDiv.innerHTML = `
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 2v6h.01L6 8.01 10 12l-4 4-.01.01V22h12v-5.99-.01L18 16l-4-4 4-3.99.01-.01V2H6z"/>
					</svg>
				`;
				iconDiv.classList.add('time-capsule-icon', 'time-capsule-historical');

				// 已完成状态（在图标下方）
				const completedDiv = iconContainer.createDiv('time-capsule-completed-status');
				completedDiv.innerHTML = '<span class="completed-text">已完成</span>';
			}

			// 底部信息区域（文件图标和计数）
			const bottomInfo = contentDiv.createDiv('time-capsule-bottom-info');

			// 文件图标预览（左侧）
			if (groupInfo.members.length > 0) {
				const fileIconsDiv = bottomInfo.createDiv('time-capsule-file-icons');
				const maxPreview = Math.min(3, groupInfo.members.length);

				for (let i = 0; i < maxPreview; i++) {
					const member = groupInfo.members[i];
					const memberIcon = fileIconsDiv.createDiv('time-capsule-member-icon');

					// 根据成员类型显示不同图标
					switch (member.type) {
						case 'text':
							memberIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
							break;
						case 'file':
							memberIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`;
							break;
						case 'link':
							memberIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
							break;
					}
				}
			}

			// 计数和倒计时信息（右侧）
			const countInfo = bottomInfo.createDiv('time-capsule-count-info');
			if (isActiveTimeCapsule) {
				// 激活的时间胶囊：显示倒计时和项目数量
				const minutes = Math.floor(this.timeCapsuleState.remainingTime / 60000);
				const seconds = Math.floor((this.timeCapsuleState.remainingTime % 60000) / 1000);
				const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
				countInfo.innerHTML = `
					<div class="countdown-display">${timeText}</div>
					<div class="item-count-text">${groupInfo.memberCount} 个项目</div>
				`;
			} else {
				// 历史时间胶囊：只显示项目数量
				countInfo.innerHTML = `<div class="item-count-text">${groupInfo.memberCount} 个项目</div>`;
			}
		} else {
			// 普通分组布局
			// 分组图标
			const iconDiv = contentDiv.createDiv('group-icon');

			// 🔧 根据分组标题选择合适的图标
			const groupLabel = groupInfo.group.label || '未命名分组';
			const isCollectionGroup = groupLabel === '收集' || groupLabel.toLowerCase() === 'collection';

			if (isCollectionGroup) {
				// 收集分组使用archive图标
				SVGIconManager.setIcon(iconDiv, 'archive');
				iconDiv.style.fontSize = '24px'; // 确保图标大小合适
			} else {
				// 其他分组使用默认图标
				iconDiv.innerHTML = `
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
						<path d="M9 9h6v6H9z"/>
					</svg>
				`;
			}

			// 分组标题
			const titleDiv = contentDiv.createDiv('group-title');
			titleDiv.textContent = groupLabel;

			// 成员数量
			const countDiv = contentDiv.createDiv('group-member-count');
			countDiv.textContent = `${groupInfo.memberCount} 个项目`;
		}

		// 成员预览（只对普通分组显示，时间胶囊分组有特殊处理）
		if (!isTimeCapsule && groupInfo.members.length > 0) {
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

		// 移除直接的点击事件监听器，让事件委托系统统一处理
		// 分组卡片的点击事件现在由 onCardClick 方法中的分组类型检查处理

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



	// 开始链接编辑（使用新状态管理系统）
	startLinkEditing(node: CanvasNode, cardElement: HTMLElement) {
		// 🎯 新增：编辑前状态检查
		const editCheck = this.canEnterEditMode(node, cardElement);
		if (!editCheck.canEdit) {
			DebugManager.log(`🚫 阻止链接编辑: ${editCheck.reason}`);
			return;
		}

		// 如果已有其他卡片在编辑，先退出编辑状态
		if (this.currentEditingCard && this.currentEditingCard !== cardElement) {
			this.exitCurrentEditingState(true); // 保存当前编辑
		}

		const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		// 使用新的状态管理系统开始编辑
		const editorState = this.startEditingWithNewSystem(node.id, node, cardElement);

		// 设置当前编辑状态（保持向后兼容）
		this.currentEditingCard = cardElement;
		this.currentEditingNode = node;

		// 保存原始URL
		const originalUrl = node.url || '';

		// 创建链接编辑器（使用新的内容更新机制）
		const editor = this.createLinkEditorWithNewSystem(originalUrl,
			// 内容变化回调
			(newUrl: string) => {
				this.updateContentWithNewSystem(node.id, { ...node, url: newUrl });
			},
			// 保存回调
			(newUrl: string) => {
				this.stopEditingWithNewSystem(node.id, true);
				this.saveLinkNodeAndRefresh(node, newUrl, cardElement, contentDiv);
				this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
			},
			// 取消回调
			() => {
				this.stopEditingWithNewSystem(node.id, false);
				this.exitEditModeAndRefresh(cardElement, contentDiv, node);
				this.completeEditingStateCleanup(); // 🎯 修复：完整的状态清理
			}
		);

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
		// 恢复原始高度
		const originalHeight = (cardElement as any).originalHeight;
		const originalMinHeight = (cardElement as any).originalMinHeight;

		if (originalHeight) {
			// 添加过渡动画
			cardElement.style.transition = 'height 0.3s ease, min-height 0.3s ease';

			// 恢复原始尺寸
			cardElement.style.height = originalMinHeight || '';
			cardElement.style.minHeight = originalMinHeight || '';

			// 清理存储的原始尺寸
			delete (cardElement as any).originalHeight;
			delete (cardElement as any).originalMinHeight;

			// 延迟移除过渡动画，避免影响其他操作
			setTimeout(() => {}, PERFORMANCE_CONSTANTS.QUICK_DELAY);
		}

		// 移除编辑模式样式
		cardElement.classList.remove('editing');
		cardElement.style.zIndex = '';
		cardElement.style.boxShadow = '';
		cardElement.style.maxHeight = ''; // 🎯 清理最大高度限制

		// 🎯 检查是否还有其他卡片在编辑，如果没有则移除网格编辑状态
		const hasOtherEditingCards = this.gridContainer.querySelector('.canvas-grid-card.editing');
		if (!hasOtherEditingCards) {
			this.gridContainer.classList.remove('has-editing-card');
		}

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

		// Canvas兼容模式：移除延迟自动保存逻辑
		// 保存逻辑现在由blur事件和手动触发控制，与官方Canvas行为一致

		// 事件处理（Canvas兼容模式）
		if (enableAutoSave) {
			// 移除input事件的自动保存，避免与官方Canvas冲突
			input.addEventListener('blur', () => {
				// 失去焦点时立即保存（与官方Canvas行为一致）
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
				// 立即保存并退出（Canvas兼容模式）
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

	// 创建链接编辑器（新状态管理系统版本）
	createLinkEditorWithNewSystem(
		url: string,
		onChange: (url: string) => void,
		onSave: (url: string) => void,
		onCancel: () => void
	): HTMLElement {
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

		// 内容变化监听（实时更新状态管理系统）
		input.addEventListener('input', () => {
			onChange(input.value);
		});

		// 键盘快捷键
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onCancel();
			} else if (e.key === 'Enter') {
				e.preventDefault();
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
		cardElement.style.position = 'relative'; // 确保定位上下文

		// 🎯 修复：使用配置常量作为高度基准，避免累积计算
		const standardHeight = CARD_CONSTANTS.height;
		const currentMinHeight = cardElement.style.minHeight;

		// 设置编辑模式下的扩展高度（基于标准高度）
		const expandedHeight = Math.max(standardHeight * 2, 400);

		DebugManager.log('🎯 高度计算:', {
			standardHeight,
			expandedHeight,
			currentDisplayHeight: cardElement.offsetHeight,
			previousHeight: (cardElement as any).originalHeight
		});

		cardElement.style.height = `${expandedHeight}px`;
		cardElement.style.minHeight = `${expandedHeight}px`;

		// 🎯 修复：存储标准高度而非当前显示高度
		(cardElement as any).originalHeight = standardHeight;
		(cardElement as any).originalMinHeight = currentMinHeight;

		// 隐藏原内容
		contentDiv.style.display = 'none';

		// 设置编辑器
		this.setupEditorStyles(cardElement, editor);
	}

	/**
	 * 设置编辑器样式，提取为独立方法便于维护
	 */
	private setupEditorStyles(cardElement: HTMLElement, editor: HTMLElement): void {
		// 让编辑器填满整个卡片，实现0间距效果
		editor.style.position = 'absolute';
		editor.style.top = '0';
		editor.style.left = '0';
		editor.style.right = '0';
		editor.style.bottom = '0';
		editor.style.width = '100%';
		editor.style.height = '100%';
		editor.style.borderRadius = 'inherit';
		editor.style.margin = '0';
		editor.style.border = 'none';
		editor.style.padding = '0'; // 完全0间距
		editor.style.boxSizing = 'border-box';

		// 将编辑器添加到卡片中
		cardElement.appendChild(editor);
	}

	/**
	 * 设置传统编辑器样式（用于向后兼容）
	 */
	private setupLegacyEditorStyles(editorEl: HTMLElement): void {
		editorEl.style.width = '100%';
		editorEl.style.height = '100%';
		editorEl.style.border = 'none';
		editorEl.style.outline = 'none';
		editorEl.style.borderRadius = 'inherit';

		// 查找CodeMirror编辑器元素并设置样式
		const cmEditor = editorEl.querySelector('.cm-editor');
		if (cmEditor) {
			(cmEditor as HTMLElement).style.height = '100%';
			(cmEditor as HTMLElement).style.fontSize = 'var(--font-text-size)';
			(cmEditor as HTMLElement).style.fontFamily = 'var(--font-text)';
		}

		// 设置内容区域样式
		const cmContent = editorEl.querySelector('.cm-content');
		if (cmContent) {
			(cmContent as HTMLElement).style.padding = '0';
			(cmContent as HTMLElement).style.minHeight = '100%';
		}
	}

	// 退出编辑模式
	async exitEditMode(cardElement: HTMLElement, contentDiv: HTMLElement, newContent: string) {
		// 恢复原始高度
		const originalHeight = (cardElement as any).originalHeight;
		const originalMinHeight = (cardElement as any).originalMinHeight;

		if (originalHeight) {
			// 添加过渡动画
			cardElement.style.transition = 'height 0.3s ease, min-height 0.3s ease';

			// 恢复原始尺寸
			cardElement.style.height = originalMinHeight || '';
			cardElement.style.minHeight = originalMinHeight || '';

			// 清理存储的原始尺寸
			delete (cardElement as any).originalHeight;
			delete (cardElement as any).originalMinHeight;

			// 延迟移除过渡动画，避免影响其他操作
			setTimeout(() => {}, PERFORMANCE_CONSTANTS.QUICK_DELAY);
		}

		// 移除编辑模式样式
		cardElement.classList.remove('editing');
		cardElement.style.zIndex = '';
		cardElement.style.position = ''; // 重置定位
		cardElement.style.maxHeight = ''; // 🎯 清理最大高度限制

		// 🎯 检查是否还有其他卡片在编辑，如果没有则移除网格编辑状态
		const hasOtherEditingCards = this.gridContainer.querySelector('.canvas-grid-card.editing');
		if (!hasOtherEditingCards) {
			this.gridContainer.classList.remove('has-editing-card');
		}

		// 移除编辑器（支持新的CodeMirror编辑器和回退的textarea）
		const editorContainer = cardElement.querySelector('.card-editor-container');
		const textarea = cardElement.querySelector('.card-editor-textarea');

		if (editorContainer) {
			// 清理CodeMirror编辑器
			const cleanup = (editorContainer as any).cleanup;
			if (cleanup && typeof cleanup === 'function') {
				cleanup();
			}
			editorContainer.remove();
		} else if (textarea) {
			// 清理传统textarea编辑器
			textarea.remove();
		}

		// 🎯 修复：更新内容显示 - 使用统一的数据访问和渲染逻辑
		if (newContent !== undefined) {
			// 找到对应的节点并重新渲染
			const nodeId = cardElement.getAttribute('data-node-id');
			if (nodeId) {
				DebugManager.log('🔧 修复：传统退出编辑模式，使用实际编辑内容进行渲染', {
					nodeId,
					newContent: newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''),
					contentLength: newContent.length
				});

				// 🎯 关键修复：使用统一的数据访问方法创建渲染节点
				const baseNode = this.getLatestNodeData(nodeId);
				const renderNode: CanvasNode = {
					id: nodeId,
					type: 'text',
					text: newContent,
					x: baseNode?.x || 0,
					y: baseNode?.y || 0,
					width: baseNode?.width || 200,
					height: baseNode?.height || 100,
					color: baseNode?.color,
					file: baseNode?.file,
					url: baseNode?.url,
					label: baseNode?.label,
					flag: baseNode?.flag
				};

				// 立即渲染，确保UI及时更新
				this.renderTextNodeContent(contentDiv, renderNode);
				DebugManager.log('✅ 传统编辑模式内容渲染完成', { nodeId, contentPreview: newContent.substring(0, 50) });

				// 异步同步所有数据源，确保数据一致性
				setTimeout(() => {
					this.syncAllDataSources(nodeId, renderNode);
				}, 0);
			}
		}
		contentDiv.style.display = '';
	}

	// 退出编辑模式（新状态管理系统版本）
	async exitEditModeWithNewSystem(cardElement: HTMLElement, contentDiv: HTMLElement, nodeId: string, newContent?: string) {
		// 恢复原始高度
		const originalHeight = (cardElement as any).originalHeight;
		const originalMinHeight = (cardElement as any).originalMinHeight;

		if (originalHeight) {
			// 添加过渡动画
			cardElement.style.transition = 'height 0.3s ease, min-height 0.3s ease';

			// 恢复原始尺寸
			cardElement.style.height = originalMinHeight || '';
			cardElement.style.minHeight = originalMinHeight || '';

			// 清理存储的原始尺寸
			delete (cardElement as any).originalHeight;
			delete (cardElement as any).originalMinHeight;

			// 延迟移除过渡动画，避免影响其他操作
			setTimeout(() => {}, PERFORMANCE_CONSTANTS.QUICK_DELAY);
		}

		// 移除编辑模式样式
		cardElement.classList.remove('editing');
		cardElement.style.zIndex = '';
		cardElement.style.position = ''; // 重置定位
		cardElement.style.maxHeight = ''; // 🎯 清理最大高度限制

		// 🎯 检查是否还有其他卡片在编辑，如果没有则移除网格编辑状态
		const hasOtherEditingCards = this.gridContainer.querySelector('.canvas-grid-card.editing');
		if (!hasOtherEditingCards) {
			this.gridContainer.classList.remove('has-editing-card');
		}

		// 移除编辑器
		const editorContainer = cardElement.querySelector('.card-editor-container');
		const textarea = cardElement.querySelector('.card-editor-textarea');

		if (editorContainer) {
			// 清理编辑器
			const cleanup = (editorContainer as any).cleanup;
			if (cleanup && typeof cleanup === 'function') {
				cleanup();
			}
			editorContainer.remove();
		} else if (textarea) {
			textarea.remove();
		}

		// 🎯 修复：使用编辑时的实际内容进行渲染，而不是从可能过期的数据源获取
		if (newContent !== undefined) {
			DebugManager.log('🔧 修复：退出编辑模式，使用实际编辑内容进行渲染', {
				nodeId,
				newContent: newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''),
				contentLength: newContent.length
			});

			// 🎯 关键修复：直接使用编辑内容创建节点对象进行渲染
			const baseNode = this.getLatestNodeData(nodeId);
			const renderNode: CanvasNode = {
				id: nodeId,
				type: 'text',
				text: newContent,
				x: baseNode?.x || 0,
				y: baseNode?.y || 0,
				width: baseNode?.width || 200,
				height: baseNode?.height || 100,
				color: baseNode?.color,
				file: baseNode?.file,
				url: baseNode?.url,
				label: baseNode?.label,
				flag: baseNode?.flag
			};

			// 验证渲染节点数据的有效性
			if (!renderNode.text && newContent) {
				DebugManager.warn('⚠️ 渲染节点数据异常，使用编辑内容修正', {
					nodeId,
					renderNodeText: renderNode.text,
					newContent
				});
				renderNode.text = newContent;
			}

			// 立即渲染，确保UI及时更新
			if (renderNode.type === 'text') {
				this.renderTextNodeContent(contentDiv, renderNode);
				DebugManager.log('✅ 文本内容渲染完成', { nodeId, contentPreview: newContent.substring(0, 50) });
			} else if (renderNode.type === 'link') {
				this.renderLinkNodeWithPreview(contentDiv, renderNode);
				DebugManager.log('✅ 链接内容渲染完成', { nodeId });
			}

			// 异步同步所有数据源，确保数据一致性
			setTimeout(() => {
				this.syncAllDataSources(nodeId, renderNode);
			}, 0);
		}

		// 🎯 关键修复：确保内容容器可见
		contentDiv.style.display = '';
		DebugManager.log('👁️ 内容容器已恢复可见（新系统）', {
			nodeId,
			displayStyle: contentDiv.style.display,
			isVisible: contentDiv.style.display !== 'none'
		});
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



	// 🎯 修复：刷新单个卡片 - 使用统一数据访问
	async refreshCard(node: CanvasNode) {
		const cardElement = this.gridContainer.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
		if (!cardElement) return;

		// 找到内容区域
		const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
		if (!contentDiv) return;

		DebugManager.log('🔄 刷新卡片显示', { nodeId: node.id, nodeType: node.type });

		// 🎯 使用统一数据访问获取最新节点数据
		const latestNode = this.getLatestNodeData(node.id) || node;

		// 根据节点类型重新渲染
		if (latestNode.type === 'text') {
			// 使用最新数据重新渲染文本内容
			this.renderTextNodeContent(contentDiv, latestNode);
			DebugManager.log('✅ 文本卡片刷新完成', { nodeId: node.id });
		} else if (latestNode.type === 'link') {
			// 清空内容并重新渲染链接
			contentDiv.innerHTML = '';
			this.renderLinkNodeContent(contentDiv, latestNode);
			DebugManager.log('✅ 链接卡片刷新完成', { nodeId: node.id });
		}
	}

	// 🎯 增强：渲染文本节点内容 - 添加数据验证和调试机制
	renderTextNodeContent(contentDiv: HTMLElement, node: CanvasNode) {
		// 🎯 修复：渲染前先释放容器已关联的组件
		this.obsidianRenderManager.disposeContainer(contentDiv);

		// 🎯 渲染前数据验证
		if (!this.validateRenderData(node, 'renderTextNodeContent')) {
			DebugManager.error('❌ 渲染数据验证失败，使用默认内容', { nodeId: node.id });
			contentDiv.textContent = "数据验证失败";
			contentDiv.style.color = 'var(--text-error)';
			contentDiv.style.fontStyle = 'italic';
			contentDiv.style.display = ''; // 🎯 关键修复：确保容器可见
			return;
		}

		// 🎯 数据一致性检查（开发阶段启用）
		try {
			const consistencyCheck = this.validateDataConsistency(node.id);
			if (!consistencyCheck.isConsistent) {
				DebugManager.warn('⚠️ 渲染时发现数据不一致', {
					nodeId: node.id,
					issues: consistencyCheck.issues,
					recommendations: consistencyCheck.recommendations
				});
			}
		} catch (error) {
			DebugManager.error('❌ 数据一致性检查失败', { nodeId: node.id, error });
		}

		if (!node.text) {
			DebugManager.log('📝 渲染空文本节点', { nodeId: node.id });
			contentDiv.textContent = "空文本节点";
			contentDiv.style.color = 'var(--text-muted)';
			contentDiv.style.fontStyle = 'italic';
			contentDiv.style.display = ''; // 🎯 关键修复：确保容器可见
			return;
		}

		// 🎯 使用Obsidian渲染管理器进行智能渲染
		this.obsidianRenderManager.renderMarkdownContent(
			node.text || '',
			contentDiv,
			'', // sourcePath
			node.id
		).then(() => {
			// 确保容器可见
			contentDiv.style.display = '';
			DebugManager.log('✅ Obsidian引擎渲染完成', {
				nodeId: node.id,
				textLength: node.text?.length || 0,
				textPreview: (node.text || '').substring(0, 50) + ((node.text?.length || 0) > 50 ? '...' : ''),
				containerVisible: contentDiv.style.display !== 'none'
			});
		}).catch((error: Error) => {
			DebugManager.error('❌ Obsidian引擎渲染失败，降级到简单渲染', { nodeId: node.id, error: error.message });
			this.renderSimpleTextFallback(contentDiv, node);
		});
	}

	// 🎯 简单文本渲染降级方法
	private renderSimpleTextFallback(contentDiv: HTMLElement, node: CanvasNode): void {
		// 清空容器
		contentDiv.empty();

		// 使用简单的文本渲染
		contentDiv.textContent = node.text || '';
		contentDiv.addClass('canvas-card-content');
		contentDiv.style.color = 'var(--text-normal)';
		contentDiv.style.lineHeight = '1.5';
		contentDiv.style.overflowWrap = 'break-word';
		contentDiv.style.display = ''; // 确保容器可见

		DebugManager.log('✅ 简单文本渲染完成（降级模式）', {
			nodeId: node.id,
			textLength: node.text?.length || 0,
			textPreview: (node.text || '').substring(0, 50) + ((node.text?.length || 0) > 50 ? '...' : ''),
			containerVisible: contentDiv.style.display !== 'none'
		});
	}





	// 渲染带预览的链接节点
	private async renderLinkNodeWithPreview(contentDiv: HTMLElement, node: CanvasNode) {
		// 🎯 修复：渲染前先释放容器已关联的组件
		this.obsidianRenderManager.disposeContainer(contentDiv);

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
			DebugManager.error('Failed to render link preview:', error);
			// 如果预览失败，回退到简单显示
			contentDiv.empty();
			this.renderSimpleLinkFallback(contentDiv, node.url);
		}
	}

	// 渲染链接加载状态
	private renderLinkLoadingState(contentDiv: HTMLElement, url: string) {
		// 🎯 修复：清空前先释放容器已关联的组件
		this.obsidianRenderManager.disposeContainer(contentDiv);
		contentDiv.empty();
		contentDiv.addClass('link-preview-loading');

		// 创建加载骨架
		const skeleton = contentDiv.createDiv('link-preview-skeleton');

		// 标题骨架
		skeleton.createDiv('skeleton-title');

		// 描述骨架
		skeleton.createDiv('skeleton-description');

		// URL显示
		const urlDiv = skeleton.createDiv('skeleton-url');
		urlDiv.textContent = this.formatUrlForDisplay(url);
	}

	// 渲染链接预览
	private renderLinkPreview(contentDiv: HTMLElement, preview: LinkPreview) {
		// 🎯 修复：渲染前先释放容器已关联的组件
		this.obsidianRenderManager.disposeContainer(contentDiv);
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
		// 🎯 修复：渲染前先释放容器已关联的组件
		this.obsidianRenderManager.disposeContainer(contentDiv);
		const linkElement = contentDiv.createEl('a', {
			cls: 'external-link simple-link',
			href: url
		});

		// 显示域名
		const displayText = this.extractDomainFromUrl(url);
		linkElement.textContent = displayText;

		// 添加外部链接图标
		const linkIcon = linkElement.createSpan('external-link-icon');
		SVGIconManager.setIcon(linkIcon, 'externalLink');

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

	// URL验证方法
	private isValidURL(url: string): boolean {
		try {
			const urlObj = new URL(url);
			// 只允许http和https协议
			return ['http:', 'https:'].includes(urlObj.protocol);
		} catch {
			return false;
		}
	}

	// 获取链接预览数据
	private async fetchLinkPreview(url: string): Promise<LinkPreview> {
		// 验证URL安全性
		if (!this.isValidURL(url)) {
			DebugManager.warn('Invalid or unsafe URL:', url);
			return {
				url,
				title: '无效链接',
				description: '链接格式不正确或不安全',
				error: 'Invalid URL'
			};
		}

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

		const errorHandler = ErrorHandler.getInstance();

		// 使用重试机制获取链接预览
		const preview = await errorHandler.withRetry(async () => {
			return await this.extractLinkMetadata(url);
		}, `链接预览获取: ${url}`, 2, 1000);

		if (preview) {
			// 缓存成功结果
			this.setCacheItem(url, preview);
			this.previewLoadingUrls.delete(url);
			return preview;
		} else {
			// 创建错误预览
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
			this.fetchDetailedMetadata(url);

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
	private async fetchDetailedMetadata(url: string): Promise<void> {
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
					DebugManager.log(`API service failed: ${apiUrl}`, serviceError);
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
			DebugManager.log('详细元数据获取失败，使用基础信息:', error);
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
		// 打开插件设置页面
		(this.app as any).setting.open();
		(this.app as any).setting.openTabById('canvas-grid-view');
	}

	// 切换到Canvas视图
	async switchToCanvasView() {
		// 首先尝试使用当前活动文件
		let targetFile = this.app.workspace.getActiveFile();

		// 如果当前文件不是Canvas文件，尝试使用关联的Canvas文件
		if (!targetFile || targetFile.extension !== 'canvas') {
			if (this.linkedCanvasFile) {
				targetFile = this.linkedCanvasFile;
				DebugManager.log('Using linked canvas file:', targetFile.path);
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
			DebugManager.log('Activated existing canvas view');
		} else {
			// 如果没有找到，在主工作区创建新的标签页
			try {
				await this.openCanvasInMainWorkspace(targetFile);
			} catch (error) {
				DebugManager.error('Failed to open canvas file:', error);
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
					DebugManager.log('Found existing canvas leaf in main workspace');
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
				DebugManager.log('Opened canvas file in new tab in main workspace');
				return;
			}

			// 方法2：回退到使用根分割创建新叶子
			const rootLeaf = this.app.workspace.getLeaf(true);
			if (rootLeaf) {
				await rootLeaf.openFile(targetFile);
				this.app.workspace.setActiveLeaf(rootLeaf);
				DebugManager.log('Opened canvas file in new leaf in main workspace');
				return;
			}

			throw new Error('无法创建新的工作区叶子');
		} catch (error) {
			DebugManager.error('Failed to open canvas in main workspace:', error);
			throw error;
		}
	}

	async onClose() {
		// 清理资源，防止内存泄漏
		this.cleanupEventListeners();

		// 清理拖拽相关的全局事件监听器
		this.removeGlobalMouseListeners();



		// 清理所有全局事件监听器
		this.globalEventListeners.forEach(({ element, event, handler, options }) => {
			try {
				element.removeEventListener(event, handler, options);
			} catch (error) {
				DebugManager.warn('Failed to remove event listener:', error);
			}
		});
		this.globalEventListeners.length = 0;

		// 清理所有定时器
		this.activeTimeouts.forEach(timeoutId => {
			try {
				clearTimeout(timeoutId);
			} catch (error) {
				DebugManager.warn('Failed to clear timeout:', error);
			}
		});
		this.activeTimeouts.clear();

		this.activeIntervals.forEach(intervalId => {
			try {
				clearInterval(intervalId);
			} catch (error) {
				DebugManager.warn('Failed to clear interval:', error);
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

		// 清理Obsidian渲染管理器
		if (this.obsidianRenderManager) {
			this.obsidianRenderManager.cleanup();
		}

		// 清理缓存
		this.linkPreviewCache.clear();
		this.previewLoadingUrls.clear();
		this.clearDataCache();

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
		DebugManager.log('🖱️ 网格点击事件:', {
			className: target.className,
			tagName: target.tagName,
			eventType: e.type
		});

		// 检查是否点击了分组标识
		const groupBadge = target.closest('.canvas-grid-group-badge') as HTMLElement;
		if (groupBadge) {
			DebugManager.log('🏷️ 检测到分组标识点击');
			e.stopPropagation();
			const card = groupBadge.closest('.canvas-grid-card') as HTMLElement;
			if (card && card.dataset.groupId) {
				this.enterGroupView(card.dataset.groupId);
			}
			return;
		}

		// 检查是否点击了工具栏按钮
		const toolbarBtn = target.closest('.canvas-card-toolbar-btn') as HTMLElement;
		if (toolbarBtn) {
			DebugManager.log('🔧 检测到工具栏按钮点击');
			e.stopPropagation();
			this.handleToolbarButtonClick(toolbarBtn);
			return;
		}

		// 检查是否点击了卡片
		const card = target.closest('.canvas-grid-card') as HTMLElement;
		if (card && card.dataset.nodeId) {
			DebugManager.log('🎯 检测到卡片点击:', {
				nodeId: card.dataset.nodeId,
				nodeType: card.dataset.nodeType,
				hasCanvasData: !!this.canvasData,
				nodesCount: this.canvasData?.nodes.length || 0
			});

			// 🔧 修复：特殊处理分组卡片点击
			if (card.dataset.nodeType === 'group') {
				DebugManager.log('🔍 分组卡片直接处理，进入分组视图:', card.dataset.nodeId);
				this.enterGroupView(card.dataset.nodeId);
				return;
			}

			// 处理普通节点卡片
			const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
			if (node) {
				DebugManager.log('✅ 找到节点数据，调用onCardClick');
				this.onCardClick(node, card);
			} else {
				DebugManager.log('❌ 未找到节点数据:', card.dataset.nodeId);
			}
		} else {
			// 点击空白区域，清除选中状态（官方Canvas行为）
			DebugManager.log('🔲 点击空白区域，清除选中状态');
			this.clearSelection();
		}
	};

	// 处理工具栏按钮点击
	private handleToolbarButtonClick = (button: HTMLElement) => {
		DebugManager.log('工具栏按钮被点击:', button.className);

		const card = button.closest('.canvas-grid-card') as HTMLElement;
		if (!card || !card.dataset.nodeId) {
			DebugManager.log('未找到卡片或节点ID');
			return;
		}

		const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
		if (!node) {
			DebugManager.log('未找到对应的节点数据');
			return;
		}

		DebugManager.log('执行工具栏操作，节点:', node.id);

		// 根据按钮类型执行相应操作
		if (button.classList.contains('canvas-card-toolbar-delete')) {
			DebugManager.log('执行删除操作');
			this.deleteCardFromToolbar(card);
		} else if (button.classList.contains('canvas-card-toolbar-color')) {
			DebugManager.log('执行颜色设置操作');
			this.showColorPicker(card, node);
		} else if (button.classList.contains('canvas-card-toolbar-pinned')) {
			DebugManager.log('执行置顶操作');
			this.togglePinnedStatus(card, node);
		} else {
			DebugManager.log('未识别的按钮类型:', button.className);
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



	private handleKeyDown = (e: KeyboardEvent) => {
		const target = e.target as HTMLElement;

		// 处理工具栏按钮的键盘事件
		if (target.classList.contains('canvas-card-toolbar-btn') && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			e.stopPropagation();
			// 触发按钮点击
			this.handleToolbarButtonClick(target);
			return;
		}

		// 处理卡片的键盘事件
		const card = target;
		if (card.classList.contains('canvas-grid-card') && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			// Enter键触发双击编辑
			if (e.key === 'Enter') {
				const node = this.canvasData?.nodes.find(n => n.id === card.dataset.nodeId);
				if (node) {
					// 🎯 新增：键盘触发编辑前的状态检查
					const editCheck = this.canEnterEditMode(node, card);
					if (editCheck.canEdit) {
						// 使用新的编辑逻辑：直接进入编辑模式
						this.startEditingFromSelection(node, card);
					} else {
						DebugManager.log(`🚫 键盘阻止编辑: ${editCheck.reason}`);
					}
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

	// 处理文档点击，关闭右键菜单和退出编辑状态（增强Obsidian原生菜单支持）
	private handleDocumentClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement;

		// 检查是否点击了插件自己的右键菜单
		const clickedInContextMenu = target.closest('.canvas-grid-context-menu');

		// 🎯 关键修复：检查是否点击了Obsidian原生右键菜单
		const clickedInObsidianMenu = this.isClickInObsidianNativeMenu(target);

		// 🎯 新增：检查是否点击了工具栏相关区域
		const clickedInToolbar = target.closest('.canvas-grid-toolbar');
		const clickedInMainDropdown = target.closest('.canvas-grid-main-dropdown');
		const clickedInMultiMenuContainer = target.closest('.canvas-grid-multi-menu-container');
		const clickedInDynamicContent = target.closest('.canvas-grid-toolbar-dynamic-content');
		const clickedInFunctionButton = target.closest('.function-btn');
		const clickedInMultiMenuButton = target.closest('.multi-menu-btn');

		DebugManager.log('🖱️ Document click detected (Enhanced):', {
			target: target.className,
			tagName: target.tagName,
			clickedInContextMenu: !!clickedInContextMenu,
			clickedInObsidianMenu: !!clickedInObsidianMenu,
			clickedInToolbar: !!clickedInToolbar,
			clickedInMainDropdown: !!clickedInMainDropdown,
			clickedInMultiMenuContainer: !!clickedInMultiMenuContainer,
			clickedInDynamicContent: !!clickedInDynamicContent,
			clickedInFunctionButton: !!clickedInFunctionButton,
			clickedInMultiMenuButton: !!clickedInMultiMenuButton,
			hasCurrentEditingCard: !!this.currentEditingCard,
			currentEditingNodeId: this.currentEditingNode?.id
		});

		// 🎯 新增：处理工具栏面板的点击外部关闭逻辑
		this.handleToolbarOutsideClick(target, {
			clickedInMainDropdown: !!clickedInMainDropdown,
			clickedInMultiMenuContainer: !!clickedInMultiMenuContainer,
			clickedInDynamicContent: !!clickedInDynamicContent,
			clickedInFunctionButton: !!clickedInFunctionButton,
			clickedInMultiMenuButton: !!clickedInMultiMenuButton,
			clickedInObsidianMenu: !!clickedInObsidianMenu
		});

		// 关闭右键菜单（但不关闭Obsidian原生菜单）
		if (!clickedInContextMenu && !clickedInObsidianMenu) {
			this.hideContextMenu();
		}

		// 🎯 关键修复：Canvas兼容模式 - 增强编辑状态保护机制，包含Obsidian原生菜单
		if (this.currentEditingCard && this.currentEditingNode && !clickedInContextMenu && !clickedInObsidianMenu && // 新增：Obsidian原生菜单保护
			!this.isContextMenuActionExecuting &&
			!this.isSaveOperationInProgress) { // 保存操作进行中时不退出编辑状态
			// 检查点击是否在当前编辑的卡片内
			const clickedInCurrentCard = target.closest('.canvas-grid-card') === this.currentEditingCard;
			// 检查点击是否在编辑器内
			const clickedInEditor = target.closest('.card-editor-container');
			// 检查点击是否在网格容器内
			const clickedInGrid = target.closest('.canvas-grid-container');

			DebugManager.log('🔍 Enhanced editing state check:', {
				clickedInCurrentCard: !!clickedInCurrentCard,
				clickedInEditor: !!clickedInEditor,
				clickedInGrid: !!clickedInGrid,
				clickedInContextMenu: !!clickedInContextMenu,
				clickedInObsidianMenu: !!clickedInObsidianMenu, // 新增：显示Obsidian菜单检测结果
				isContextMenuActionExecuting: this.isContextMenuActionExecuting,
				isSaveOperationInProgress: this.isSaveOperationInProgress
			});

			// 🎯 关键修复：如果点击在网格外，或者点击在其他卡片上，则退出编辑状态并保存
			// 但现在排除Obsidian原生菜单的点击
			if (!clickedInGrid || (!clickedInCurrentCard && !clickedInEditor && clickedInGrid)) {
				DebugManager.log('⚠️ 触发编辑状态退出: 点击网格外或其他区域，退出编辑状态并保存');
				this.exitCurrentEditingState(true); // 保存当前编辑
			} else {
				DebugManager.log('✅ 编辑状态保持: 点击在允许的区域内（包括Obsidian原生菜单保护）');
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

		// 阻止菜单容器的点击事件冒泡，防止触发编辑状态退出
		menu.addEventListener('click', (e: MouseEvent) => {
			e.stopPropagation();
		});

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

			// 添加相似内容功能
			const node = this.canvasData?.nodes.find(n => n.id === nodeId);
			if (node) {
				// 相似内容功能：智能搜索相关内容
				const similarContentItem = this.createMenuItem('相似内容', 'lucide-search', () => {
					this.handleSmartBlockBacklink(node);
					this.hideContextMenu();
				});
				menu.appendChild(similarContentItem);

				// 🔧 新增：分组移动功能
				const moveToGroupItem = this.createMenuItem('移动分组', 'lucide-folder-plus', () => {
					this.showGroupSelectionModal(node);
					this.hideContextMenu();
				});
				menu.appendChild(moveToGroupItem);

				DebugManager.log('Added similar content and move to group menu items for node:', nodeId);
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

		// 添加点击事件处理，阻止事件冒泡以避免触发编辑状态退出
		item.addEventListener('click', (e: MouseEvent) => {
			e.stopPropagation(); // 阻止事件冒泡
			e.preventDefault();  // 阻止默认行为

			DebugManager.log('🎯 Context menu item clicked:', {
				text: text,
				hasCurrentEditingCard: !!this.currentEditingCard,
				currentEditingNodeId: this.currentEditingNode?.id,
				timestamp: Date.now()
			});

			// Canvas兼容模式：优化右键菜单操作保护机制
			this.isContextMenuActionExecuting = true;

			try {
				onClick();
			} finally {
				// Canvas兼容模式：缩短保护时间窗口，提高响应性
				setTimeout(() => {
					this.isContextMenuActionExecuting = false;
					DebugManager.log('🔄 Context menu action flag reset (Canvas-compatible mode)');
				}, 10); // 从100ms缩短到10ms
			}

			DebugManager.log('✅ Context menu item action completed:', {
				text: text,
				hasCurrentEditingCard: !!this.currentEditingCard,
				currentEditingNodeId: this.currentEditingNode?.id
			});
		});

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

	// 🔧 新增：显示分组选择模态窗口
	private async showGroupSelectionModal(node: CanvasNode): Promise<void> {
		return new Promise((resolve) => {
			const modal = new Modal(this.app);
			modal.titleEl.textContent = '移动到分组';

			// 在模态窗口上存储节点ID，供后续使用
			(modal.containerEl as any).setAttribute('data-node-id', node.id);

			// 创建内容
			const content = modal.contentEl;
			content.empty();

			// 源节点信息
			const sourceInfo = content.createDiv('group-selection-source');
			sourceInfo.createEl('h4', { text: '要移动的节点:' });
			const sourcePreview = sourceInfo.createDiv('node-preview');
			sourcePreview.textContent = this.getNodeDisplayText(node);
			sourcePreview.className = 'node-preview source';

			// 创建左右切换界面
			const tabContainer = content.createDiv('group-tab-container');

			// 标签按钮
			const tabButtons = tabContainer.createDiv('group-tab-buttons');
			const currentTabBtn = tabButtons.createEl('button', {
				text: '当前Canvas',
				cls: 'group-tab-btn active'
			});
			const otherTabBtn = tabButtons.createEl('button', {
				text: '其他Canvas',
				cls: 'group-tab-btn'
			});

			// 搜索框
			const searchContainer = content.createDiv('group-search-container');
			const searchInput = searchContainer.createEl('input', {
				type: 'text',
				placeholder: '搜索分组...',
				cls: 'group-search-input'
			});

			// 分组列表容器
			const listContainer = content.createDiv('group-list-container');
			const currentGroupList = listContainer.createDiv('group-list current-groups active');
			const otherGroupList = listContainer.createDiv('group-list other-groups');

			// 初始加载当前Canvas分组
			this.loadCurrentCanvasGroups(currentGroupList);

			// 标签切换逻辑
			let currentTab = 'current';

			currentTabBtn.addEventListener('click', () => {
				if (currentTab === 'current') return;

				currentTab = 'current';
				currentTabBtn.classList.add('active');
				otherTabBtn.classList.remove('active');
				currentGroupList.classList.add('active');
				otherGroupList.classList.remove('active');

				searchInput.value = '';
				this.loadCurrentCanvasGroups(currentGroupList);
			});

			otherTabBtn.addEventListener('click', async () => {
				if (currentTab === 'other') return;

				currentTab = 'other';
				otherTabBtn.classList.add('active');
				currentTabBtn.classList.remove('active');
				otherGroupList.classList.add('active');
				currentGroupList.classList.remove('active');

				searchInput.value = '';
				await this.loadOtherCanvasGroups(otherGroupList);
			});

			// 搜索功能
			let searchTimeout: NodeJS.Timeout;
			searchInput.addEventListener('input', () => {
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(async () => {
					const query = searchInput.value.trim();
					if (currentTab === 'current') {
						await this.searchCurrentCanvasGroups(currentGroupList, query);
					} else {
						await this.searchOtherCanvasGroups(otherGroupList, query);
					}
				}, 300);
			});

			// 按钮容器
			const buttonContainer = content.createDiv('group-selection-buttons');

			// 取消按钮
			const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
			cancelBtn.addEventListener('click', () => {
				modal.close();
				resolve();
			});

			modal.open();
		});
	}

	// 🔧 新增：加载并显示分组列表
	private async loadAndDisplayGroups(container: HTMLElement, searchQuery: string): Promise<void> {
		container.empty();

		try {
			// 获取当前Canvas的分组
			const currentGroups = this.getCurrentCanvasGroups();

			// 获取所有Canvas文件的分组
			const allGroups = await this.searchAllCanvasGroups(searchQuery);

			// 合并并去重
			const allGroupsMap = new Map<string, GroupSelectionItem>();

			// 添加当前Canvas的分组
			currentGroups.forEach(group => {
				allGroupsMap.set(group.id, {
					id: group.id,
					name: group.name,
					canvasFile: this.linkedCanvasFile?.path || 'current',
					isCurrent: true,
					memberCount: group.memberCount
				});
			});

			// 添加其他Canvas文件的分组
			allGroups.forEach(group => {
				if (!allGroupsMap.has(group.id)) {
					allGroupsMap.set(group.id, group);
				}
			});

			// 过滤和排序
			const filteredGroups = Array.from(allGroupsMap.values())
				.filter(group =>
					searchQuery === '' ||
					group.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
				.sort((a, b) => {
					// 当前Canvas的分组优先
					if (a.isCurrent && !b.isCurrent) return -1;
					if (!a.isCurrent && b.isCurrent) return 1;
					return a.name.localeCompare(b.name);
				});

			// 渲染分组列表
			if (filteredGroups.length === 0) {
				const emptyMsg = container.createDiv('group-list-empty');
				emptyMsg.textContent = searchQuery ? '未找到匹配的分组' : '没有可用的分组';
				return;
			}

			filteredGroups.forEach(group => {
				this.renderGroupListItem(container, group);
			});

		} catch (error) {
			DebugManager.error('Failed to load groups:', error);
			const errorMsg = container.createDiv('group-list-error');
			errorMsg.textContent = '加载分组失败';
		}
	}

	// 🔧 新增：获取当前Canvas的分组
	private getCurrentCanvasGroups(): any[] {
		if (!this.canvasData) return [];

		return this.canvasData.nodes
			.filter(node => node.type === 'group')
			.map(group => ({
				id: group.id,
				name: group.text || '未命名分组',
				memberCount: this.getGroupMemberCount(group.id)
			}));
	}

	// 🔧 新增：获取分组成员数量
	private getGroupMemberCount(groupId: string): number {
		if (!this.canvasData) return 0;

		// 简化处理：计算分组分析中的成员数量
		const groupInfo = this.groupAnalysis.get(groupId);
		return groupInfo?.memberCount || 0;
	}

	// 🔧 新增：加载当前Canvas分组到界面
	private loadCurrentCanvasGroups(container: HTMLElement): void {
		container.empty();

		const currentGroups = this.getCurrentCanvasGroups();

		if (currentGroups.length === 0) {
			const emptyMsg = container.createDiv('group-list-empty');
			emptyMsg.textContent = '当前Canvas中没有分组';
			return;
		}

		currentGroups.forEach(group => {
			const groupItem: GroupSelectionItem = {
				id: group.id,
				name: group.name,
				canvasFile: this.linkedCanvasFile?.path || 'current',
				isCurrent: true,
				memberCount: group.memberCount
			};
			this.renderGroupListItem(container, groupItem);
		});
	}

	// 🔧 新增：加载其他Canvas分组到界面
	private async loadOtherCanvasGroups(container: HTMLElement): Promise<void> {
		container.empty();

		try {
			const otherGroups = await this.searchAllCanvasGroups('');

			if (otherGroups.length === 0) {
				const emptyMsg = container.createDiv('group-list-empty');
				emptyMsg.textContent = '其他Canvas文件中没有分组';
				return;
			}

			otherGroups.forEach(group => {
				this.renderGroupListItem(container, group);
			});
		} catch (error) {
			DebugManager.error('Failed to load other canvas groups:', error);
			const errorMsg = container.createDiv('group-list-error');
			errorMsg.textContent = '加载其他Canvas分组失败';
		}
	}

	// 🔧 新增：搜索当前Canvas分组
	private async searchCurrentCanvasGroups(container: HTMLElement, query: string): Promise<void> {
		container.empty();

		const currentGroups = this.getCurrentCanvasGroups();
		const filteredGroups = currentGroups.filter(group =>
			query === '' || group.name.toLowerCase().includes(query.toLowerCase())
		);

		if (filteredGroups.length === 0) {
			const emptyMsg = container.createDiv('group-list-empty');
			emptyMsg.textContent = query ? '未找到匹配的分组' : '当前Canvas中没有分组';
			return;
		}

		filteredGroups.forEach(group => {
			const groupItem: GroupSelectionItem = {
				id: group.id,
				name: group.name,
				canvasFile: this.linkedCanvasFile?.path || 'current',
				isCurrent: true,
				memberCount: group.memberCount
			};
			this.renderGroupListItem(container, groupItem);
		});
	}

	// 🔧 新增：搜索其他Canvas分组
	private async searchOtherCanvasGroups(container: HTMLElement, query: string): Promise<void> {
		container.empty();

		try {
			const otherGroups = await this.searchAllCanvasGroups(query);

			if (otherGroups.length === 0) {
				const emptyMsg = container.createDiv('group-list-empty');
				emptyMsg.textContent = query ? '未找到匹配的分组' : '其他Canvas文件中没有分组';
				return;
			}

			otherGroups.forEach(group => {
				this.renderGroupListItem(container, group);
			});
		} catch (error) {
			DebugManager.error('Failed to search other canvas groups:', error);
			const errorMsg = container.createDiv('group-list-error');
			errorMsg.textContent = '搜索其他Canvas分组失败';
		}
	}

	// 🔧 新增：搜索所有Canvas文件的分组
	private async searchAllCanvasGroups(searchQuery: string): Promise<GroupSelectionItem[]> {
		const allGroups: GroupSelectionItem[] = [];

		try {
			// 获取所有Canvas文件
			const canvasFiles = this.app.vault.getFiles()
				.filter(file => file.extension === 'canvas');

			for (const file of canvasFiles) {
				// 跳过当前文件
				if (file === this.linkedCanvasFile) continue;

				try {
					const content = await this.app.vault.read(file);
					const canvasData = JSON.parse(content);

					if (canvasData.nodes) {
						const groups = canvasData.nodes
							.filter((node: any) => node.type === 'group')
							.map((group: any) => ({
								id: group.id,
								name: group.text || '未命名分组',
								canvasFile: file.path,
								isCurrent: false,
								memberCount: this.countGroupMembers(canvasData.nodes, group.id)
							}))
							.filter((group: GroupSelectionItem) =>
								searchQuery === '' ||
								group.name.toLowerCase().includes(searchQuery.toLowerCase())
							);

						allGroups.push(...groups);
					}
				} catch (error) {
					DebugManager.warn(`Failed to parse canvas file: ${file.path}`, error);
				}
			}
		} catch (error) {
			DebugManager.error('Failed to search canvas groups:', error);
		}

		return allGroups;
	}

	// 🔧 新增：计算分组成员数量
	private countGroupMembers(nodes: any[], groupId: string): number {
		// 这里简化处理，实际应该根据Canvas的分组逻辑计算
		return nodes.filter(node => node.type !== 'group').length;
	}

	// 🔧 新增：渲染分组列表项
	private renderGroupListItem(container: HTMLElement, group: GroupSelectionItem): void {
		const item = container.createDiv('group-list-item');

		// 分组图标 - 使用与主界面一致的SVG图标
		const icon = item.createDiv('group-item-icon');
		icon.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
				<path d="M9 9h6v6H9z"/>
			</svg>
		`;

		// 分组信息
		const info = item.createDiv('group-item-info');
		const name = info.createDiv('group-item-name');
		name.textContent = group.name;

		const details = info.createDiv('group-item-details');
		details.textContent = `${group.memberCount} 个成员`;

		if (!group.isCurrent) {
			const file = details.createSpan('group-item-file');
			file.textContent = ` • ${group.canvasFile.split('/').pop()?.replace('.canvas', '')}`;
		}

		// 点击事件
		item.addEventListener('click', () => {
			this.handleGroupSelection(group);
		});

		// 当前Canvas的分组添加标识
		if (group.isCurrent) {
			item.classList.add('current-canvas');
		}
	}

	// 🔧 新增：处理分组选择
	private async handleGroupSelection(group: GroupSelectionItem): Promise<void> {
		try {
			// 获取当前选中的节点（从模态窗口的数据中获取）
			const modal = document.querySelector('.modal-container');
			const nodeId = modal?.getAttribute('data-node-id');

			if (!nodeId) {
				new Notice('未找到要移动的节点');
				return;
			}

			const node = this.canvasData?.nodes.find(n => n.id === nodeId);
			if (!node) {
				new Notice('节点不存在');
				return;
			}

			// 执行移动操作
			await this.moveNodeToSelectedGroup(node, group);

			// 关闭模态窗口
			if (modal) {
				(modal as any).close?.();
			}

			new Notice(`已将节点移动到分组"${group.name}"`);

			// 刷新视图
			await this.renderGrid();

		} catch (error) {
			DebugManager.error('Failed to move node to group:', error);
			new Notice('移动节点失败');
		}
	}

	// 🔧 新增：移动节点到选中的分组
	private async moveNodeToSelectedGroup(node: CanvasNode, targetGroup: GroupSelectionItem): Promise<void> {
		if (!this.canvasData) {
			throw new Error('Canvas数据不可用');
		}

		// 如果是跨文件移动
		if (!targetGroup.isCurrent) {
			await this.moveNodeToOtherCanvasGroup(node, targetGroup);
		} else {
			// 当前文件内移动
			await this.moveNodeToCurrentCanvasGroup(node, targetGroup);
		}
	}

	// 🔧 新增：移动节点到当前Canvas的分组
	private async moveNodeToCurrentCanvasGroup(node: CanvasNode, targetGroup: GroupSelectionItem): Promise<void> {
		// 找到目标分组节点
		const groupNode = this.canvasData?.nodes.find(n => n.id === targetGroup.id && n.type === 'group');
		if (!groupNode) {
			throw new Error('目标分组不存在');
		}

		// 计算新位置（在分组内部）
		const newPosition = this.calculatePositionInGroupForMove(groupNode);

		// 更新节点位置
		node.x = newPosition.x;
		node.y = newPosition.y;

		// 保存数据
		await this.saveCanvasData();

		DebugManager.log('节点已移动到当前Canvas分组:', {
			nodeId: node.id,
			groupId: targetGroup.id,
			newPosition
		});
	}

	// 🔧 新增：移动节点到其他Canvas文件的分组
	private async moveNodeToOtherCanvasGroup(node: CanvasNode, targetGroup: GroupSelectionItem): Promise<void> {
		try {
			// 1. 从当前Canvas中移除节点
			if (this.canvasData) {
				this.canvasData.nodes = this.canvasData.nodes.filter(n => n.id !== node.id);
				await this.saveCanvasData();
			}

			// 2. 读取目标Canvas文件
			const targetFile = this.app.vault.getAbstractFileByPath(targetGroup.canvasFile) as TFile;
			if (!targetFile) {
				throw new Error('目标Canvas文件不存在');
			}

			const targetContent = await this.app.vault.read(targetFile);
			const targetCanvasData = JSON.parse(targetContent);

			// 3. 找到目标分组
			const targetGroupNode = targetCanvasData.nodes.find((n: any) => n.id === targetGroup.id && n.type === 'group');
			if (!targetGroupNode) {
				throw new Error('目标分组不存在');
			}

			// 4. 计算新位置并生成新ID
			const newPosition = this.calculatePositionInTargetGroup(targetGroupNode);
			const newNode = {
				...node,
				id: this.generateUniqueId(),
				x: newPosition.x,
				y: newPosition.y
			};

			// 5. 添加到目标Canvas
			targetCanvasData.nodes.push(newNode);

			// 6. 保存目标Canvas文件
			const newContent = JSON.stringify(targetCanvasData, null, 2);
			await this.app.vault.modify(targetFile, newContent);

			DebugManager.log('节点已移动到其他Canvas分组:', {
				originalNodeId: node.id,
				newNodeId: newNode.id,
				targetFile: targetGroup.canvasFile,
				targetGroupId: targetGroup.id
			});

		} catch (error) {
			// 如果移动失败，恢复原节点
			if (this.canvasData && !this.canvasData.nodes.find(n => n.id === node.id)) {
				this.canvasData.nodes.push(node);
				await this.saveCanvasData();
			}
			throw error;
		}
	}

	// 🔧 新增：计算在分组中的位置（用于移动操作）
	private calculatePositionInGroupForMove(groupNode: CanvasNode): { x: number, y: number } {
		// 在分组内部找一个合适的位置
		const padding = 20;
		return {
			x: groupNode.x + padding,
			y: groupNode.y + padding
		};
	}

	// 🔧 新增：计算在目标分组中的位置
	private calculatePositionInTargetGroup(groupNode: any): { x: number, y: number } {
		// 在分组内部找一个合适的位置
		const padding = 20;
		return {
			x: groupNode.x + padding,
			y: groupNode.y + padding
		};
	}



	// 处理回链功能（旧版本，保留兼容性）
	private async handleBacklink(nodeId: string): Promise<void> {
		try {
			DebugManager.log('Handling backlink for node:', nodeId);

			// 这里是回链功能的占位符实现
			// 目前先显示一个通知，表示功能已被触发
			new Notice(`回链功能已触发，节点ID: ${nodeId}`);
			// 3. 高亮显示相关内容

		} catch (error) {
			DebugManager.error('Failed to handle backlink:', error);
			new Notice('回链功能执行失败');
		}
	}

	// 智能处理回链导航（新版本）
	private async handleBacklinkNavigation(node: CanvasNode): Promise<void> {
		try {
			DebugManager.log('=== Backlink Navigation ===');
			DebugManager.log('Node:', node);

			// 首先检查节点是否包含回链
			if (this.hasBacklink(node)) {
				DebugManager.log('✅ Found backlink in node, using navigateToBacklink');
				await this.navigateToBacklink(node);
			} else {
				DebugManager.log('❌ No backlink found, showing alternative options');

				// 如果没有回链，提供其他选项
				await this.showBacklinkAlternatives(node);
			}

		} catch (error) {
			DebugManager.error('Failed to handle backlink navigation:', error);
			new Notice('回链导航失败');
		}
	}

	// 显示源信息替代选项（简化版本）
	private async showBacklinkAlternatives(node: CanvasNode): Promise<void> {
		// 创建一个简单的选择对话框
		const modal = new Modal(this.app);
		modal.titleEl.setText('🔗 回链选项');

		const content = modal.contentEl;
		content.empty();

		// 添加说明文本
		const description = content.createEl('div');
		description.innerHTML = `
			<p>该节点没有检测到回链信息。</p>
			<p>回链功能可以帮您追踪内容的来源，当您从其他文件拖拽文本到Canvas时会自动添加。</p>
		`;
		description.style.cssText = `
			margin-bottom: 20px;
			line-height: 1.5;
			color: var(--text-muted);
		`;

		const buttonContainer = content.createDiv('source-options-container');
		buttonContainer.style.cssText = `
			display: flex;
			gap: 12px;
			margin-top: 20px;
			justify-content: center;
			flex-wrap: wrap;
		`;

		// 选项1：显示节点信息
		const infoButton = buttonContainer.createEl('button', { text: '📋 节点信息' });
		infoButton.className = 'mod-cta';
		infoButton.onclick = () => {
			modal.close();
			this.showNodeInfo(node);
		};

		// 选项2：搜索相关文件
		const searchButton = buttonContainer.createEl('button', { text: '🔍 搜索相关文件' });
		searchButton.onclick = () => {
			modal.close();
			this.searchRelatedFiles(node);
		};

		// 选项3：取消
		const cancelButton = buttonContainer.createEl('button', { text: '取消' });
		cancelButton.onclick = () => {
			modal.close();
		};

		modal.open();
	}

	// 源文件搜索方法已移除（块双链功能已禁用）

	// 显示节点详细信息
	private showNodeInfo(node: CanvasNode): Promise<void> {
		const info = [
			`📋 节点ID: ${node.id}`,
			`🏷️ 节点类型: ${node.type}`,
			`📍 位置: (${node.x}, ${node.y})`,
			`📏 尺寸: ${node.width} × ${node.height}`,
			node.text ? `📝 文本长度: ${node.text.length} 字符` : '📝 无文本内容',
			node.color ? `🎨 颜色: ${node.color}` : '🎨 无颜色设置'
		];

		new Notice(info.join('\n'), 6000);
		DebugManager.log('Node Info:', node);

		return Promise.resolve();
	}

	// 搜索相关文件
	private async searchRelatedFiles(node: CanvasNode): Promise<void> {
		if (node.type !== 'text' || !node.text) {
			new Notice(ERROR_MESSAGES.TEXT_NODE_ONLY);
			return;
		}

		try {
			// 提取节点文本的关键词
			const searchText = node.text.substring(0, SEARCH_CONSTANTS.MAX_SEARCH_TEXT_LENGTH).trim();
			if (!searchText) {
				new Notice(ERROR_MESSAGES.EMPTY_NODE_TEXT);
				return;
			}

			// 使用Obsidian的全局搜索功能
			const searchPlugin = (this.app as any).internalPlugins?.plugins?.['global-search'];
			if (searchPlugin && searchPlugin.enabled) {
				// 打开搜索面板并设置搜索词
				const searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
				if (searchLeaf && (searchLeaf.view as any).setQuery) {
					(searchLeaf.view as any).setQuery(searchText);
					this.app.workspace.revealLeaf(searchLeaf);
					const truncatedText = searchText.substring(0, SEARCH_CONSTANTS.PRIMARY_SEARCH_LENGTH);
					new Notice(`${INFO_MESSAGES.GLOBAL_SEARCH_STARTED}: "${truncatedText}..."`);
				} else {
					const truncatedText = searchText.substring(0, SEARCH_CONSTANTS.PRIMARY_SEARCH_LENGTH);
					new Notice(`${INFO_MESSAGES.SEARCH_SUGGESTION}: "${truncatedText}..."`);
				}
			} else {
				// 回退方案：显示搜索建议
				const truncatedText = searchText.substring(0, SEARCH_CONSTANTS.PRIMARY_SEARCH_LENGTH);
				new Notice(`${INFO_MESSAGES.SEARCH_SUGGESTION}: "${truncatedText}..."`);
			}

		} catch (error) {
			DebugManager.error('Failed to search related files:', error);
			new Notice(ERROR_MESSAGES.SEARCH_FAILED);
		}
	}

	// 智能块回链功能（合并了回链和定位原文功能）
	private async handleSmartBlockBacklink(node: CanvasNode): Promise<void> {
		try {
			DebugManager.log('Smart Block Backlink started', { id: node.id, type: node.type, hasText: !!node.text });

			// 优先级1：检查是否有块引用
			if (this.hasBacklink(node)) {
				DebugManager.log('Found backlink in node, using navigateToBacklink');
				await this.navigateToBacklink(node);
				return;
			}

			// 优先级2：如果是文本节点，尝试通过内容搜索定位
			if (node.type === 'text' && node.text) {
				DebugManager.log('No backlink found, trying content search');

				// 清理文本内容，移除回链信息
				const cleanText = this.cleanTextForSearch(node.text);
				DebugManager.verbose('Cleaned text for search:', cleanText.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...');

				if (cleanText.trim()) {
					// 在所有Markdown文件中搜索匹配的内容
					const searchResults = await this.searchInAllFiles(cleanText);
					DebugManager.log('Search results count:', searchResults.length);

					if (searchResults.length === 1) {
						// 如果只有一个结果，直接跳转
						const result = searchResults[0];
						await this.openFileAndNavigate(result.file, result.line);
						new Notice(`${SUCCESS_MESSAGES.LOCATION_FOUND}: ${result.file.basename} (第${result.line + 1}行)`);
						return;
					} else if (searchResults.length > 1) {
						// 如果有多个结果，显示选择对话框
						this.showLocationChoiceDialog(searchResults, cleanText);
						return;
					}
				}
			}

			// 优先级3：没有找到任何匹配，显示替代选项
			DebugManager.log('No matches found, showing alternatives');
			await this.showSmartBacklinkAlternatives(node);

		} catch (error) {
			DebugManager.error('Failed to handle smart block backlink:', error);
			new Notice('块回链功能执行失败');
		}
	}

	// 显示块链接替代选项
	private async showBlockLinkAlternatives(nodeId: string): Promise<void> {
		const node = this.canvasData?.nodes.find(n => n.id === nodeId);
		if (!node) return;

		const modal = new Modal(this.app);
		modal.titleEl.setText('🔗 块回链选项');

		const content = modal.contentEl;
		content.empty();

		// 添加说明文本
		const description = content.createEl('div');
		description.innerHTML = `
			<p><strong>未找到该卡片的块链接信息</strong></p>
			<p>块回链功能需要以下条件之一：</p>
			<ol>
				<li>🔗 <strong>Obsidian块链接</strong>：从其他文档拖拽时自动创建的块ID</li>
				<li>📍 <strong>位置信息</strong>：记录的源文档位置信息</li>
			</ol>
			<p style="color: var(--text-muted);">当前卡片没有找到块链接信息，您可以尝试以下选项：</p>
		`;
		description.style.cssText = `
			margin-bottom: 20px;
			line-height: 1.6;
			color: var(--text-normal);
		`;

		const buttonContainer = content.createDiv('block-link-options-container');
		buttonContainer.style.cssText = `
			display: flex;
			gap: 12px;
			margin-top: 20px;
			justify-content: center;
			flex-wrap: wrap;
		`;

		// 选项1：显示节点信息
		const infoButton = buttonContainer.createEl('button', { text: '📋 节点信息' });
		infoButton.className = 'mod-cta';
		infoButton.onclick = () => {
			modal.close();
			this.showNodeInfo(node);
		};

		// 选项2：搜索相似内容
		const searchButton = buttonContainer.createEl('button', { text: '🔍 搜索相似内容' });
		searchButton.onclick = () => {
			modal.close();
			this.handleSmartBlockBacklink(node);
		};

		// 选项3：取消
		const cancelButton = buttonContainer.createEl('button', { text: '取消' });
		cancelButton.onclick = () => {
			modal.close();
		};

		modal.open();
	}

	// 显示智能块回链替代选项
	private async showSmartBacklinkAlternatives(node: CanvasNode): Promise<void> {
		const modal = new Modal(this.app);
		modal.titleEl.setText('🔗 相似内容选项');

		const content = modal.contentEl;
		content.empty();

		// 添加说明文本
		const description = content.createEl('div');
		description.innerHTML = `
			<p><strong>未找到该卡片的源文档位置</strong></p>
			<p>相似内容功能会按以下优先级查找：</p>
			<ol>
				<li>🔗 <strong>块引用</strong>：从其他文档拖拽时自动创建的精确链接</li>
				<li>📍 <strong>简单回链</strong>：包含源文件和行号信息的链接</li>
				<li>🔍 <strong>内容搜索</strong>：在所有文档中搜索匹配的文本内容</li>
			</ol>
			<p style="color: var(--text-muted);">当前卡片没有找到匹配的源位置，您可以尝试以下选项：</p>
		`;
		description.style.cssText = `
			margin-bottom: 20px;
			line-height: 1.6;
			color: var(--text-normal);
		`;

		const buttonContainer = content.createDiv('source-options-container');
		buttonContainer.style.cssText = `
			display: flex;
			gap: 12px;
			margin-top: 20px;
			justify-content: center;
			flex-wrap: wrap;
		`;

		// 选项1：显示节点信息
		const infoButton = buttonContainer.createEl('button', { text: '📋 节点信息' });
		infoButton.className = 'mod-cta';
		infoButton.onclick = () => {
			modal.close();
			this.showNodeInfo(node);
		};

		// 选项2：全局搜索
		const searchButton = buttonContainer.createEl('button', { text: '🔍 全局搜索' });
		searchButton.onclick = () => {
			modal.close();
			this.searchRelatedFiles(node);
		};

		// 选项3：取消
		const cancelButton = buttonContainer.createEl('button', { text: '取消' });
		cancelButton.onclick = () => {
			modal.close();
		};

		modal.open();
	}



	// 清理文本内容，移除回链信息和其他干扰内容
	private cleanTextForSearch(text: string): string {
		let cleanText = text;

		// 移除回链信息（新格式）
		cleanText = cleanText.replace(/\n\n---\n📍\s*来源:.*?\n🔗\s*路径:.*$/s, '');

		// 移除回链信息（旧格式）
		cleanText = cleanText.replace(/\n\n---\n来源：.*?\s\(行\s\d+\)$/s, '');

		// 移除多余的空白字符
		cleanText = cleanText.trim();

		// 移除连续的空行
		cleanText = cleanText.replace(/\n\s*\n/g, '\n');

		return cleanText;
	}

	// 在所有文件中搜索匹配的内容
	private async searchInAllFiles(searchText: string): Promise<Array<{file: TFile, line: number, content: string, similarity: number}>> {
		const results: Array<{file: TFile, line: number, content: string, similarity: number}> = [];
		const files = this.app.vault.getMarkdownFiles();

		// 准备搜索关键词
		const primarySearch = searchText.substring(0, SEARCH_CONSTANTS.PRIMARY_SEARCH_LENGTH).trim();
		const searchWords = primarySearch.split(/\s+/).filter(word => word.length > SEARCH_CONSTANTS.MIN_WORD_LENGTH);

		DebugManager.log('搜索关键词:', searchWords);

		for (const file of files) {
			try {
				const content = await this.app.vault.read(file);
				const lines = content.split('\n');

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];

					// 计算相似度
					const similarity = this.calculateTextSimilarity(line, searchText, searchWords);

					// 如果相似度足够高，添加到结果中
					if (similarity > SEARCH_CONSTANTS.SIMILARITY_THRESHOLD) {
						results.push({
							file: file,
							line: i,
							content: line,
							similarity: similarity
						});
					}
				}
			} catch (error) {
				DebugManager.warn('Failed to read file:', file.path, error);
			}
		}

		// 按相似度排序
		results.sort((a, b) => b.similarity - a.similarity);

		// 返回最佳匹配结果
		return results.slice(0, SEARCH_CONSTANTS.MAX_SEARCH_RESULTS);
	}

	// 计算文本相似度
	private calculateTextSimilarity(line: string, searchText: string, searchWords: string[]): number {
		const lineLower = line.toLowerCase();
		const searchLower = searchText.toLowerCase();

		// 完全匹配得分最高
		if (lineLower.includes(searchLower.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH))) {
			return 1.0;
		}

		// 计算关键词匹配度
		let matchedWords = 0;
		for (const word of searchWords) {
			if (lineLower.includes(word.toLowerCase())) {
				matchedWords++;
			}
		}

		// 关键词匹配比例
		const wordMatchRatio = searchWords.length > 0 ? matchedWords / searchWords.length : 0;

		// 长度相似度（避免匹配过短的行）
		const lengthSimilarity = Math.min(line.length / searchText.length, 1.0);

		// 综合得分
		return wordMatchRatio * 0.7 + lengthSimilarity * 0.3;
	}

	// 显示位置选择对话框
	private showLocationChoiceDialog(results: Array<{file: TFile, line: number, content: string, similarity: number}>, searchText: string): void {
		const modal = new Modal(this.app);
		modal.titleEl.setText('🎯 选择原文位置');

		const content = modal.contentEl;
		content.empty();

		// 添加说明
		const description = content.createEl('div');
		description.innerHTML = `
			<p>找到 <strong>${results.length}</strong> 个可能的原文位置，请选择最匹配的一个：</p>
			<p style="color: var(--text-muted); font-size: 0.9em;">搜索内容: "${searchText.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH)}..."</p>
		`;
		description.style.marginBottom = '16px';

		// 创建结果列表
		const resultsList = content.createDiv('locate-results-list');
		resultsList.style.cssText = `
			max-height: 400px;
			overflow-y: auto;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
		`;

		results.forEach((result, index) => {
			const resultItem = resultsList.createDiv('locate-result-item');
			resultItem.style.cssText = `
				padding: 12px;
				border-bottom: 1px solid var(--background-modifier-border);
				cursor: pointer;
				transition: background-color 0.2s;
			`;

			resultItem.innerHTML = `
				<div style="font-weight: 500; margin-bottom: 4px;">
					📄 ${result.file.basename} (第${result.line + 1}行)
					<span style="color: var(--text-muted); font-size: 0.8em; margin-left: 8px;">
						匹配度: ${Math.round(result.similarity * 100)}%
					</span>
				</div>
				<div style="color: var(--text-muted); font-size: 0.9em; line-height: 1.4;">
					${result.content.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH)}${result.content.length > 100 ? '...' : ''}
				</div>
				<div style="color: var(--text-accent); font-size: 0.8em; margin-top: 4px;">
					${result.file.path}
				</div>
			`;

			resultItem.addEventListener('mouseenter', () => {
				resultItem.style.backgroundColor = 'var(--background-modifier-hover)';
			});

			resultItem.addEventListener('mouseleave', () => {
				resultItem.style.backgroundColor = '';
			});

			resultItem.addEventListener('click', async () => {
				modal.close();
				await this.openFileAndNavigate(result.file, result.line);
				new Notice(`✅ 已定位到原文: ${result.file.basename} (第${result.line + 1}行)`);
			});

			// 如果是第一个结果，添加推荐标识
			if (index === 0) {
				const recommendBadge = resultItem.createDiv();
				recommendBadge.textContent = '🌟 推荐';
				recommendBadge.style.cssText = `
					position: absolute;
					right: 12px;
					top: 12px;
					background: var(--color-accent);
					color: white;
					padding: 2px 6px;
					border-radius: 10px;
					font-size: 0.7em;
					font-weight: 500;
				`;
				resultItem.style.position = 'relative';
			}
		});

		// 添加取消按钮
		const buttonContainer = content.createDiv();
		buttonContainer.style.cssText = `
			margin-top: 16px;
			text-align: center;
		`;

		const cancelButton = buttonContainer.createEl('button', { text: '取消' });
		cancelButton.onclick = () => modal.close();

		modal.open();
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
				this.renderGrid().catch(error => {
					DebugManager.error('Failed to render grid after renaming:', error);
				});

				// 通知Canvas视图刷新
				this.notifyCanvasViewRefresh();

				new Notice(`分组已重命名为: ${newName}`);
				DebugManager.log(`Group ${groupId} renamed to: ${newName}`);
			} catch (error) {
				DebugManager.error('Failed to rename group:', error);
				new Notice('重命名分组失败');
			}
		});

		modal.open();
	}

	// 编辑卡片（Canvas兼容模式）
	private editCard(card: HTMLElement) {
		const nodeId = card.dataset.nodeId;
		if (!nodeId) return;

		const node = this.canvasData?.nodes.find(n => n.id === nodeId);
		if (!node) return;

		// 🎯 新增：使用统一的编辑状态检查
		const editCheck = this.canEnterEditMode(node, card);
		if (!editCheck.canEdit) {
			DebugManager.log(`🚫 右键菜单阻止编辑: ${editCheck.reason}`);
			return;
		}

		// 添加编辑状态一致性验证
		if (this.currentEditingCard && this.currentEditingNode) {
			DebugManager.log('Another card is being edited, switching to new card (Canvas-compatible mode)');
		}
		if (node && !card.classList.contains('editing')) {
			DebugManager.log('从右键菜单进入编辑模式 (Canvas-compatible mode):', nodeId);
			this.startEditingFromSelection(node, card);
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
			DebugManager.log('🗑️ 开始删除卡片操作', { nodeId });

			// 从Canvas数据中删除节点
			await this.deleteNodeFromCanvas(nodeId);

			// 🎯 关键修复：删除成功后重新渲染网格视图，确保UI与数据同步
			DebugManager.log('🔄 删除成功，开始重新渲染网格视图');
			await this.renderGrid();

			DebugManager.log('✅ 卡片删除完成，网格视图已更新', {
				nodeId,
				remainingNodes: this.filteredNodes.length
			});
			new Notice('节点删除成功');

		} catch (error) {
			DebugManager.error('❌ 删除卡片失败:', error);
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
			DebugManager.error('无法确定目标Canvas文件');
			new Notice('删除失败：无法确定目标Canvas文件');
			return;
		}

		try {
			// Canvas兼容模式：标记保存操作开始
			this.startSaveOperation();

			const content = await this.app.vault.read(targetFile);
			const canvasData = JSON.parse(content);

			// 检查节点是否存在
			const nodeExists = canvasData.nodes.some((node: any) => node.id === nodeId);
			if (!nodeExists) {
				DebugManager.warn('节点不存在，可能已被删除:', nodeId);
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

			DebugManager.log('✅ 节点删除完成，数据已更新:', {
				deletedNodeId: nodeId,
				remainingFilteredNodes: this.filteredNodes.length,
				remainingTotalNodes: this.canvasData?.nodes?.length || 0
			});

			// 🎯 增强：数据更新后立即同步UI状态
			this.safeSetTimeout(async () => {
				// 触发数据同步事件，确保其他组件也能感知到变化
				DebugManager.log('🔄 删除操作数据同步完成');
				this.endSaveOperation();
			}, 50); // 缩短延迟时间，提升响应速度

			DebugManager.log('✅ 节点删除成功:', nodeId);

		} catch (error) {
			DebugManager.error('删除节点失败:', error);
			new Notice('删除节点失败');
			// 确保结束保存操作标记
			this.endSaveOperation();
		}
	}

	// Canvas兼容模式：保存操作标志管理
	private startSaveOperation() {
		this.isSaveOperationInProgress = true;
		this.lastSaveTimestamp = Date.now();
		DebugManager.log('Save operation started (Canvas-compatible mode)');
	}

	private endSaveOperation() {
		this.isSaveOperationInProgress = false;
		DebugManager.log('Save operation completed (Canvas-compatible mode)');
	}

	// 🔧 新增：保存操作锁机制
	private saveLock = false;
	private saveQueue: Array<() => Promise<void>> = [];

	private async saveWithLock(operation: () => Promise<void>): Promise<void> {
		// 如果已经有保存操作在进行，加入队列
		if (this.saveLock) {
			return new Promise((resolve, reject) => {
				this.saveQueue.push(async () => {
					try {
						await operation();
						resolve();
					} catch (error) {
						reject(error);
					}
				});
			});
		}

		// 获取锁
		this.saveLock = true;

		try {
			// 执行保存操作
			await operation();

			// 处理队列中的下一个操作
			if (this.saveQueue.length > 0) {
				const nextOperation = this.saveQueue.shift();
				if (nextOperation) {
					// 异步执行下一个操作，不阻塞当前操作的完成
					setTimeout(async () => {
						try {
							await nextOperation();
						} catch (error) {
							DebugManager.error('Queued save operation failed:', error);
						} finally {
							this.saveLock = false;
						}
					}, 10);
					return; // 不释放锁，由下一个操作释放
				}
			}
		} finally {
			// 释放锁
			this.saveLock = false;
		}
	}

	// 🎯 关键修复：检测是否点击了Obsidian原生右键菜单
	private isClickInObsidianNativeMenu(target: HTMLElement): boolean {
		// Obsidian原生菜单的常见类名和选择器（基于实际观察和Obsidian源码）
		const obsidianMenuSelectors = [
			'.menu',                    // Obsidian主菜单容器
			'.menu-item',              // 菜单项
			'.menu-separator',         // 菜单分隔符
			'.suggestion-container',   // 建议容器
			'.suggestion-item',        // 建议项
			'.modal',                  // 模态框
			'.modal-container',        // 模态框容器
			'.context-menu',           // 上下文菜单
			'.dropdown-menu',          // 下拉菜单
			'.popover',                // 弹出框
			'.tooltip',                // 工具提示
			'.workspace-leaf-content', // 工作区叶子内容
			'.view-content',           // 视图内容
			'.cm-editor',              // CodeMirror编辑器
			'.markdown-source-view',   // Markdown源码视图
			'.markdown-preview-view',  // Markdown预览视图
			'.canvas-node-content',    // Canvas节点内容
			'.canvas-menu',            // Canvas菜单
			'.file-explorer',          // 文件浏览器
			'.search-result',          // 搜索结果
			'.tag-pane',               // 标签面板
			'.outline',                // 大纲
			'.backlink'                // 反向链接
		];

		// 检查目标元素或其父元素是否匹配Obsidian菜单选择器
		for (const selector of obsidianMenuSelectors) {
			if (target.closest(selector)) {
				DebugManager.log('🎯 Detected click in Obsidian native menu:', selector);
				return true;
			}
		}

		// 额外检查：通过类名模式匹配
		const obsidianClassPatterns = [
			/^menu-/,           // 以menu-开头的类名
			/^modal-/,          // 以modal-开头的类名
			/^suggestion-/,     // 以suggestion-开头的类名
			/^context-/,        // 以context-开头的类名
			/^dropdown-/,       // 以dropdown-开头的类名
			/^popover-/,        // 以popover-开头的类名
			/^tooltip-/         // 以tooltip-开头的类名
		];

		// 检查目标元素及其父元素的类名
		let currentElement: HTMLElement | null = target;
		while (currentElement && currentElement !== document.body) {
			const className = currentElement.className;
			if (typeof className === 'string') {
				const classes = className.split(' ');
				for (const cls of classes) {
					for (const pattern of obsidianClassPatterns) {
						if (pattern.test(cls)) {
							DebugManager.log('🎯 Detected click in Obsidian native menu by class pattern:', cls);
							return true;
						}
					}
				}
			}
			currentElement = currentElement.parentElement;
		}

		return false;
	}

	// 🎯 新增：处理工具栏面板的点击外部关闭逻辑
	private handleToolbarOutsideClick(target: HTMLElement, clickInfo: {
		clickedInMainDropdown: boolean;
		clickedInMultiMenuContainer: boolean;
		clickedInDynamicContent: boolean;
		clickedInFunctionButton: boolean;
		clickedInMultiMenuButton: boolean;
		clickedInObsidianMenu: boolean;
	}): void {
		const {
			clickedInMainDropdown,
			clickedInMultiMenuContainer,
			clickedInDynamicContent,
			clickedInFunctionButton,
			clickedInMultiMenuButton,
			clickedInObsidianMenu
		} = clickInfo;

		// 如果点击了Obsidian原生菜单，不处理任何关闭逻辑
		if (clickedInObsidianMenu) {
			DebugManager.log('🎯 点击了Obsidian原生菜单，跳过工具栏关闭逻辑');
			return;
		}

		// 处理多功能菜单的关闭逻辑
		const mainDropdown = this.containerEl.querySelector('.canvas-grid-main-dropdown') as HTMLElement;
		if (mainDropdown && mainDropdown.style.display !== 'none') {
			// 如果点击在多功能菜单按钮上，不关闭（让按钮自己的点击事件处理）
			if (clickedInMultiMenuButton) {
				DebugManager.log('🎯 点击多功能菜单按钮，由按钮事件处理');
				return;
			}

			// 如果点击在菜单内部或菜单容器内部，不关闭
			if (clickedInMainDropdown || clickedInMultiMenuContainer) {
				DebugManager.log('🎯 点击多功能菜单内部，保持打开');
				return;
			}

			// 点击外部，关闭多功能菜单
			DebugManager.log('🎯 点击多功能菜单外部，关闭菜单');
			this.hideAllDropdowns();
		}

		// 处理动态面板的关闭逻辑
		const dynamicContent = this.containerEl.querySelector('.canvas-grid-toolbar-dynamic-content');
		if (dynamicContent && dynamicContent.classList.contains('expanded')) {
			// 如果点击在功能按钮上，不关闭（让按钮自己的点击事件处理）
			if (clickedInFunctionButton) {
				DebugManager.log('🎯 点击功能按钮，由按钮事件处理');
				return;
			}

			// 如果点击在动态内容面板内部，不关闭
			if (clickedInDynamicContent) {
				DebugManager.log('🎯 点击动态面板内部，保持打开');
				return;
			}

			// 点击外部，关闭动态面板
			DebugManager.log('🎯 点击动态面板外部，关闭面板');
			this.closeDynamicContent();
		}
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
			DebugManager.log('Saving node to canvas:', node.id);

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

			DebugManager.log('Node saved successfully:', node.id);
		} catch (error) {
			DebugManager.error('保存节点失败:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			throw new Error(`保存节点失败: ${errorMessage}`);
		}
	}

	// ==================== 聚焦功能实现 ====================

	// 聚焦到Canvas中的指定节点
	async focusNodeInCanvas(nodeId: string): Promise<boolean> {
		try {
			DebugManager.log('=== Starting focus operation for node:', nodeId);
			new Notice("操作完成", NOTIFICATION_CONSTANTS.SHORT_DURATION);

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

			DebugManager.log('Canvas view obtained, detecting API...');
			const canvasAPI = this.detectCanvasAPI(canvasView);
			if (!canvasAPI) {
				DebugManager.log('Canvas API not available, falling back to simulation');
				// 回退到模拟操作
				return this.focusNodeBySimulation(nodeId);
			}

			// 4. 获取节点数据
			const nodeData = this.canvasData?.nodes.find(n => n.id === nodeId);
			if (!nodeData) {
				new Notice('找不到目标节点');
				return false;
			}

			DebugManager.log('Node data found:', nodeData);

			// 5. 执行聚焦
			DebugManager.log('Executing focus operations...');
			const success = await this.executeCanvasFocus(canvasAPI, nodeId, nodeData);

			if (success) {
				new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
				return true;
			} else {
				DebugManager.log('Canvas API focus failed, falling back to simulation');
				return this.focusNodeBySimulation(nodeId);
			}

		} catch (error) {
			DebugManager.error('聚焦节点失败:', error);
			new Notice('聚焦失败，请手动定位');
			return false;
		}
	}

	// 确保切换到Canvas视图
	private async ensureCanvasView(): Promise<void> {
		DebugManager.log('Ensuring canvas view...');

		// 首先检查是否有关联的Canvas文件
		if (!this.linkedCanvasFile) {
			new Notice('没有关联的Canvas文件，请先关联一个Canvas文件');
			throw new Error('No linked canvas file');
		}

		// 查找现有的Canvas视图（显示关联文件的）
		const targetLeaf = this.findExistingCanvasLeaf(this.linkedCanvasFile);

		if (targetLeaf) {
			// 如果找到现有的Canvas视图，激活它
			DebugManager.log('Found existing canvas view, activating...');
			this.app.workspace.setActiveLeaf(targetLeaf);

			// 等待视图激活完成
			await new Promise(resolve => {
				this.safeSetTimeout(() => resolve(undefined), 300);
			});
			return;
		}

		// 检查当前是否已经是正确的Canvas视图
		const activeLeaf = this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
		if (activeLeaf && activeLeaf.view.getViewType() === 'canvas') {
			const canvasView = activeLeaf.view as any;
			if (canvasView && canvasView.file && canvasView.file.path === this.linkedCanvasFile.path) {
				DebugManager.log('Already in correct canvas view');
				return;
			}
		}

		// 如果没有找到现有视图，创建新的Canvas视图
		DebugManager.log('Creating new canvas view...');
		await this.openCanvasInMainWorkspace(this.linkedCanvasFile);

		// 等待视图切换完成
		await new Promise(resolve => {
			this.safeSetTimeout(() => resolve(undefined), 800);
		});

		// 验证切换是否成功
		const newActiveLeaf = this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
		if (newActiveLeaf && newActiveLeaf.view.getViewType() === 'canvas') {
			DebugManager.log('Successfully switched to canvas view');
		} else {
			DebugManager.warn('Failed to switch to canvas view');
			throw new Error('无法切换到Canvas视图');
		}
	}

	// 探测Canvas视图的可用API
	private detectCanvasAPI(canvasView: unknown): CanvasAPI | null {
		try {
			DebugManager.log('Canvas view object:', canvasView);

			if (!canvasView || typeof canvasView !== 'object') {
				DebugManager.warn('Invalid canvas view object');
				return null;
			}

			DebugManager.log('Canvas view properties:', Object.keys(canvasView));

			if (!hasProperty(canvasView, 'canvas')) {
				DebugManager.warn('Canvas view does not have canvas property');
				return null;
			}

			const canvas = canvasView.canvas;
			DebugManager.log('Canvas object:', canvas);

			if (!canvas) {
				DebugManager.warn('Canvas object not found in view');
				return null;
			}

			DebugManager.log('Canvas properties:', Object.keys(canvas));
			DebugManager.log('Canvas methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(canvas)));

			// 探索所有可用方法
			this.exploreCanvasAPI(canvas);

			// 尝试查找实际可用的方法
			const apiMethods = this.findCanvasAPIMethods(canvas);

			if (!apiMethods) {
				DebugManager.log('No suitable Canvas API methods found');
				return null;
			}

			DebugManager.log('Found Canvas API methods:', apiMethods);
			return apiMethods;

		} catch (error) {
			DebugManager.error('Failed to detect Canvas API:', error);
			return null;
		}
	}

	// 查找Canvas API的实际方法
	private findCanvasAPIMethods(canvas: unknown): CanvasAPI | null {
		// 获取所有方法
		const allMethods = this.getAllMethods(canvas);
		DebugManager.log('All canvas methods:', allMethods);

		// 查找缩放相关方法
		const zoomMethods = allMethods.filter(method =>
			method.toLowerCase().includes('zoom') ||
			method.toLowerCase().includes('scale') ||
			method.toLowerCase().includes('fit')
		);
		DebugManager.log('Zoom methods:', zoomMethods);

		// 查找选择相关方法
		const selectMethods = allMethods.filter(method =>
			method.toLowerCase().includes('select') ||
			method.toLowerCase().includes('focus') ||
			method.toLowerCase().includes('highlight')
		);
		DebugManager.log('Select methods:', selectMethods);

		// 查找节点相关方法
		const nodeMethods = allMethods.filter(method =>
			method.toLowerCase().includes('node') ||
			method.toLowerCase().includes('element') ||
			method.toLowerCase().includes('item')
		);
		DebugManager.log('Node methods:', nodeMethods);

		// 查找平移相关方法
		const panMethods = allMethods.filter(method =>
			method.toLowerCase().includes('pan') ||
			method.toLowerCase().includes('move') ||
			method.toLowerCase().includes('translate')
		);
		DebugManager.log('Pan methods:', panMethods);

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
				DebugManager.log(`Found method: ${name}`);
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
				DebugManager.log('Clearing selection...');
				canvasAPI.deselectAll();
			}

			// 2. 选择目标节点
			if (canvasAPI.selectNode) {
				DebugManager.log('Selecting node:', nodeId);
				try {
					canvasAPI.selectNode(nodeId);
				} catch (error) {
					DebugManager.warn('selectNode failed:', error);
				}
			}

			// 3. 聚焦到节点
			if (canvasAPI.zoomToBbox) {
				DebugManager.log('Zooming to bbox...');
				const bbox = this.calculateOptimalBbox(nodeData);
				DebugManager.log('Calculated bbox:', bbox);
				try {
					canvasAPI.zoomToBbox(bbox);
					return true;
				} catch (error) {
					DebugManager.warn('zoomToBbox failed:', error);
				}
			}

			// 4. 备选方案：使用平移
			if (canvasAPI.panTo) {
				DebugManager.log('Using panTo as fallback...');
				const centerX = nodeData.x + nodeData.width / 2;
				const centerY = nodeData.y + nodeData.height / 2;
				try {
					canvasAPI.panTo(centerX, centerY);
					return true;
				} catch (error) {
					DebugManager.warn('panTo failed:', error);
				}
			}

			return false;
		} catch (error) {
			DebugManager.error('executeCanvasFocus failed:', error);
			return false;
		}
	}

	// 探索Canvas API的可用方法
	private exploreCanvasAPI(canvas: any) {
		DebugManager.log('=== Canvas API Exploration ===');

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

		DebugManager.log('All available methods:', methods);

		// 查找可能的聚焦相关方法
		const focusMethods = methods.filter(method =>
			method.toLowerCase().includes('zoom') ||
			method.toLowerCase().includes('focus') ||
			method.toLowerCase().includes('select') ||
			method.toLowerCase().includes('center') ||
			method.toLowerCase().includes('pan')
		);

		DebugManager.log('Potential focus-related methods:', focusMethods);
	}

	// 获取当前活动的Canvas视图
	private getActiveCanvasView(): any {
		DebugManager.log('=== Getting Canvas View ===');

		const activeLeaf = this.app.workspace.getActiveViewOfType(ItemView)?.leaf;
		DebugManager.log('Active leaf:', activeLeaf);
		DebugManager.log('Active leaf view type:', activeLeaf?.view?.getViewType());

		if (activeLeaf && activeLeaf.view.getViewType() === 'canvas') {
			DebugManager.log('Found active canvas view');
			return activeLeaf.view;
		}

		// 查找Canvas视图
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
		DebugManager.log('Canvas leaves found:', canvasLeaves.length);

		const activeFile = this.app.workspace.getActiveFile();
		DebugManager.log('Active file:', activeFile?.path);

		for (const leaf of canvasLeaves) {
			const view = leaf.view as any;
			DebugManager.log('Checking canvas leaf:', view?.file?.path);
			if (view && view.file && activeFile && view.file.path === activeFile.path) {
				DebugManager.log('Found matching canvas view');
				return view;
			}
		}

		DebugManager.log('No canvas view found');
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
			DebugManager.log('=== Starting simulation focus ===');

			// 获取节点数据
			const nodeData = this.canvasData?.nodes.find(n => n.id === nodeId);
			if (!nodeData) {
				new Notice('找不到目标节点');
				return false;
			}

			DebugManager.log('Node data for simulation:', nodeData);

			// 获取Canvas视图
			const canvasView = this.getActiveCanvasView();
			if (!canvasView || !canvasView.containerEl) {
				DebugManager.log('Canvas view or container not found');
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
					DebugManager.log(`Found canvas element with selector: ${selector}`);
					break;
				}
			}

			if (!canvasElement) {
				DebugManager.log('Canvas element not found, trying direct approach');
				// 尝试直接使用容器
				canvasElement = canvasView.containerEl;
			}

			// 尝试通过Canvas内部API直接操作
			if (canvasView.canvas) {
				DebugManager.log('Trying direct canvas manipulation...');
				const success = await this.tryDirectCanvasManipulation(canvasView.canvas, nodeId, nodeData);
				if (success) {
					new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
					return true;
				}
			}

			// 尝试查找并点击实际的节点元素
			const nodeElement = this.findNodeElement(canvasView.containerEl, nodeId);
			if (nodeElement) {
				DebugManager.log('Found node element, simulating click...');
				nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				nodeElement.click();
				new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
				return true;
			}

			new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
			return false;

		} catch (error) {
			DebugManager.error('模拟聚焦失败:', error);
			new Notice('聚焦失败，请手动定位');
			return false;
		}
	}

	// 尝试直接操作Canvas对象
	private async tryDirectCanvasManipulation(canvas: any, nodeId: string, nodeData: CanvasNode): Promise<boolean> {
		try {
			DebugManager.log('Trying direct canvas manipulation...');
			DebugManager.log('Canvas object:', canvas);

			// 尝试查找节点相关的属性
			if (canvas.nodes && canvas.nodes.has && canvas.nodes.has(nodeId)) {
				DebugManager.log('Found node in canvas.nodes');
				const node = canvas.nodes.get(nodeId);
				DebugManager.log('Canvas node object:', node);

				// 尝试选择节点
				if (canvas.selection) {
					DebugManager.log('Setting canvas selection...');
					canvas.selection.clear();
					canvas.selection.add(node);
				}
			}

			// 尝试设置视图位置
			if (canvas.viewport || canvas.view) {
				const viewport = canvas.viewport || canvas.view;
				DebugManager.log('Found viewport:', viewport);

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
			DebugManager.error('Direct canvas manipulation failed:', error);
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
				DebugManager.log(`Found node element with selector: ${selector}`);
				return element;
			}
		}

		DebugManager.log('Node element not found');
		return null;
	}

	// ==================== 拖拽功能实现 ====================

	// 初始化拖拽系统
	private initializeDragSystem(): void {
		DebugManager.log('Initializing drag system...');
		this.setupDragDropHandlers();
	}





	// 设置拖拽处理器
	private setupDragDropHandlers() {
		DebugManager.log('Setting up drag and drop handlers...');

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

		DebugManager.log('🚀 Starting card drag with HTML5 API:', node);

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

		DebugManager.log('✅ Card drag started successfully');
	}

	// 处理卡片拖拽结束事件
	private handleCardDragEnd(e: DragEvent) {
		DebugManager.log('🏁 Card drag ended');

		// 清理拖拽样式
		if (this.currentDragCard) {
			this.currentDragCard.classList.remove('dragging-from-grid');
			this.currentDragCard.style.cursor = 'grab';
		}

		// 重置拖拽状态
		this.isDragFromGrid = false;
		this.currentDragCard = null;

		DebugManager.log('✅ Card drag cleanup completed');
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
				z-index: var(--layer-popover);
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
			DebugManager.error('Failed to set card drag preview:', error);
		}
	}

	// 设置Canvas拖拽目标
	private setupCanvasDropTarget() {
		DebugManager.log('Setting up Canvas drop target for grid cards...');

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
			DebugManager.log('🎯 Handling Canvas drop from grid...');

			// 获取拖拽数据
			const dragDataStr = e.dataTransfer?.getData('application/json');
			if (!dragDataStr) {
				DebugManager.error('No drag data found');
				return;
			}

			const dragData = JSON.parse(dragDataStr);
			if (dragData.type !== 'canvas-node' || dragData.source !== 'canvas-grid-view') {
				DebugManager.log('Not a grid card drag, ignoring');
				return;
			}

			const node = dragData.nodeData;
			const isCtrlDrag = dragData.isCtrlDrag || e.ctrlKey; // 使用拖拽开始时的Ctrl状态
			DebugManager.log('Processing grid card drop:', node, 'Ctrl pressed:', isCtrlDrag);

			// 使用Obsidian内置的Canvas坐标转换
			const canvasCoords = this.getCanvasCoordinatesFromDrop(e, canvasView);
			DebugManager.log('Canvas coordinates:', canvasCoords);

			// 创建新节点
			const newNode = this.createCanvasNodeFromGridCard(node, canvasCoords);

			// 添加到Canvas
			await this.addNodeToCanvas(newNode, canvasView);

			// 修正操作逻辑：遵循Obsidian官方白板逻辑
			if (isCtrlDrag) {
				// Ctrl+拖拽：复制（保持原卡片）
				new Notice('卡片已复制到Canvas');
				DebugManager.log('✅ Card copied to Canvas (Ctrl+drag)');
			} else {
				// 普通拖拽：移动（删除原卡片）
				await this.removeNodeFromGrid(node.id);
				new Notice('卡片已移动到Canvas');
				DebugManager.log('✅ Card moved to Canvas (normal drag)');
			}

			DebugManager.log('✅ Canvas drop completed successfully');

		} catch (error) {
			DebugManager.error('Failed to handle Canvas drop:', error);
			new Notice('拖拽到Canvas失败');
		}
	}

	// 从拖拽事件获取Canvas坐标 - 使用Obsidian内置方法
	private getCanvasCoordinatesFromDrop(e: DragEvent, canvasView: any): { x: number, y: number } {
		DebugManager.log('🎯 Getting Canvas coordinates from drop event...');

		try {
			// 尝试使用Obsidian Canvas的内置坐标转换方法
			if (canvasView.canvas && typeof canvasView.canvas.posFromEvt === 'function') {
				const pos = canvasView.canvas.posFromEvt(e);
				DebugManager.log('✅ Using Canvas.posFromEvt:', pos);
				return { x: pos.x, y: pos.y };
			}

			// 备用方法：手动计算坐标
			DebugManager.log('⚠️ Canvas.posFromEvt not available, using manual calculation');
			return this.getCanvasCoordinatesManual(e, canvasView);

		} catch (error) {
			DebugManager.error('Error getting Canvas coordinates:', error);
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
			DebugManager.warn('Canvas container not found, using event coordinates');
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
		DebugManager.log('Resetting card drag state...');

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

		DebugManager.log('Card drag state reset complete');
	}

	// 全局鼠标事件监听器引用
	private globalMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
	private globalMouseUpHandler: ((e: MouseEvent) => void) | null = null;



	// 窗口失焦处理器
	private handleWindowBlur = () => {
		// 延迟检查，因为在Obsidian内部切换视图时也会触发blur
		setTimeout(() => {
			// 只有在真正失去焦点且仍在拖拽时才取消
			if (this.isDragFromGrid && !document.hasFocus()) {
				DebugManager.log('Window lost focus, canceling drag...');
				this.cancelDrag();
			}
		}, 100);
	};

	// ESC键取消拖拽处理器
	private handleDragEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && this.isDragFromGrid) {
			DebugManager.log('ESC pressed, canceling drag...');
			this.cancelDrag();
		}
	};

	// 取消拖拽操作
	private cancelDrag() {
		DebugManager.log('Canceling drag operation...');
		this.resetCardDragState();
	}

	// 移除全局鼠标事件监听器
	private removeGlobalMouseListeners() {
		DebugManager.log('Removing global mouse listeners...');

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

		DebugManager.log('Global mouse listeners removed');
	}

	// 开始卡片拖拽
	private startCardDrag(cardElement: HTMLElement, e: MouseEvent) {
		const nodeId = cardElement.dataset.nodeId;
		if (!nodeId || !this.canvasData) return;

		// 查找对应的节点数据
		const node = this.canvasData.nodes.find(n => n.id === nodeId);
		if (!node) return;

		DebugManager.log('Starting card drag from grid:', node);

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
		DebugManager.log('🏁 Ending card drag at:', e.clientX, e.clientY);

		if (!this.currentDragCard || !this.isDragFromGrid) {
			DebugManager.log('❌ Invalid drag state - currentDragCard:', !!this.currentDragCard, 'isDragFromGrid:', this.isDragFromGrid);
			return;
		}

		const nodeId = this.currentDragCard.dataset.nodeId;
		if (!nodeId || !this.canvasData) {
			DebugManager.log('❌ Missing nodeId or canvasData - nodeId:', nodeId, 'canvasData:', !!this.canvasData);
			return;
		}

		// 查找对应的节点数据
		const node = this.canvasData.nodes.find(n => n.id === nodeId);
		if (!node) {
			DebugManager.log('❌ Node not found for nodeId:', nodeId);
			return;
		}

		DebugManager.log('✅ Found node for drag:', node);

		// 检查是否拖拽到Canvas视图
		const canvasView = this.findCanvasViewUnderCursor(e);
		if (canvasView) {
			DebugManager.log('🎯 Canvas view found, handling drop...');
			this.handleDropToCanvas(node, e, canvasView);
		} else {
			DebugManager.log('❌ No Canvas view found under cursor');
			new Notice('请拖拽到Canvas区域');
		}

		// 清理拖拽状态 - 使用完整的状态重置
		DebugManager.log('🧹 Cleaning up drag state...');
		this.resetCardDragState();
	}

	// 创建拖拽预览
	private createDragPreview(cardElement: HTMLElement, e: MouseEvent) {
		// 先清理任何现有的预览
		this.forceCleanupDragPreview();

		DebugManager.log('Creating drag preview...');

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
			z-index: var(--layer-popover) !important;
			transform: rotate(5deg) !important;
			box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
		`;

		document.body.appendChild(this.dragPreviewElement);

		// 不再在这里添加独立的移动监听器，而是通过全局的handleCardMouseMove来处理
		DebugManager.log('Drag preview created and attached');
	}

	// 强制清理拖拽预览
	private forceCleanupDragPreview() {
		DebugManager.log('Force cleaning up drag preview...');

		// 移除预览元素
		if (this.dragPreviewElement) {
			try {
				if (this.dragPreviewElement.parentNode) {
					this.dragPreviewElement.parentNode.removeChild(this.dragPreviewElement);
				}
			} catch (error) {
				DebugManager.warn('Error removing drag preview element:', error);
			}
			this.dragPreviewElement = null;
		}

		// 清理旧的动态函数（向后兼容）
		this.cleanupDragPreview = () => {};

		DebugManager.log('Drag preview cleanup complete');
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
			z-index: var(--layer-modal)1;
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
		DebugManager.log('🔍 Finding Canvas view under cursor at:', e.clientX, e.clientY);

		// 临时隐藏拖拽预览，避免阻挡检测
		const originalDisplay = this.dragPreviewElement?.style.display;
		if (this.dragPreviewElement) {
			this.dragPreviewElement.style.display = 'none';
		}

		const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
		DebugManager.log('🎯 Element under cursor:', elementUnderCursor);

		// 恢复拖拽预览
		if (this.dragPreviewElement && originalDisplay !== undefined) {
			this.dragPreviewElement.style.display = originalDisplay;
		}

		if (!elementUnderCursor) {
			DebugManager.log('❌ No element found under cursor');
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
				DebugManager.log('✅ Found Canvas container with selector:', selector, canvasContainer);
				break;
			}
		}

		if (!canvasContainer) {
			DebugManager.log('❌ No Canvas container found. Element classes:', elementUnderCursor.className);
			DebugManager.log('❌ Element parents:', this.getElementPath(elementUnderCursor));
			return null;
		}

		// 获取所有Canvas视图
		const canvasLeaves = this.app.workspace.getLeavesOfType('canvas');
		DebugManager.log('📋 Available Canvas leaves:', canvasLeaves.length);

		// 查找匹配的Canvas视图实例
		const leaf = canvasLeaves.find(leaf => {
			const containerEl = leaf.view?.containerEl;
			if (containerEl && containerEl.contains(canvasContainer)) {
				DebugManager.log('✅ Found matching Canvas leaf:', leaf);
				return true;
			}
			return false;
		});

		if (!leaf) {
			DebugManager.log('❌ No matching Canvas leaf found');
			return null;
		}

		DebugManager.log('🎉 Successfully found Canvas view:', leaf.view);
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
			DebugManager.log('Dropping card to Canvas:', node);

			// 获取Canvas坐标并进行校准
			const rawCoords = this.getCanvasCoordinates(e, canvasView);
			const canvasCoords = this.calibrateCanvasCoordinates(rawCoords, canvasView);



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
			DebugManager.error('Failed to drop card to Canvas:', error);
			new Notice('拖拽到Canvas失败');
		}
	}

	// 获取Canvas坐标 - 改进版本，支持多种坐标转换方法
	private getCanvasCoordinates(e: MouseEvent, canvasView: any): { x: number, y: number } {
		DebugManager.log('🎯 Converting mouse coordinates to Canvas coordinates...');
		DebugManager.log('Mouse position:', { x: e.clientX, y: e.clientY });

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
				DebugManager.log('✅ Found Canvas container with selector:', selector);
				break;
			}
		}

		if (!canvasContainer) {
			DebugManager.log('❌ No Canvas container found, using containerEl directly');
			canvasContainer = canvasView.containerEl;
		}

		const rect = canvasContainer.getBoundingClientRect();
		DebugManager.log('Canvas container rect:', {
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height
		});

		// 计算相对于容器的坐标
		const relativeX = e.clientX - rect.left;
		const relativeY = e.clientY - rect.top;
		DebugManager.log('Relative coordinates:', { x: relativeX, y: relativeY });

		// 获取Canvas变换信息
		const canvas = canvasView.canvas;
		DebugManager.log('Canvas transform info:', {
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

			DebugManager.log('✅ Canvas coordinates calculated:', { x: canvasX, y: canvasY });

			// 添加偏移补正（根据实际测试调整）
			const adjustedX = canvasX - 10; // 向左偏移10px补正
			const adjustedY = canvasY - 10; // 向上偏移10px补正

			DebugManager.log('🔧 Adjusted coordinates:', { x: adjustedX, y: adjustedY });
			return { x: adjustedX, y: adjustedY };
		}

		// 如果没有变换信息，尝试使用更精确的方法
		DebugManager.log('⚠️ No transform info, trying alternative method...');

		// 尝试获取Canvas的实际渲染区域
		const canvasElement = canvasContainer.querySelector('canvas');
		if (canvasElement) {
			const canvasRect = canvasElement.getBoundingClientRect();
			const canvasRelativeX = e.clientX - canvasRect.left;
			const canvasRelativeY = e.clientY - canvasRect.top;

			DebugManager.log('Canvas element coordinates:', { x: canvasRelativeX, y: canvasRelativeY });
			return { x: canvasRelativeX, y: canvasRelativeY };
		}

		DebugManager.log('📍 Using relative coordinates as final fallback:', { x: relativeX, y: relativeY });
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

		DebugManager.log('🎯 Coordinate calibration:', {
			original: coords,
			offset: { x: offsetX, y: offsetY },
			toolbar: toolbarHeight,
			calibrated: { x: calibratedX, y: calibratedY }
		});

		return { x: calibratedX, y: calibratedY };
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

		DebugManager.log(`🗑️ Removing node from grid: ${nodeId}`);

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
				DebugManager.log('📤 Group is empty, returning to main view');
				this.exitGroupView();
				new Notice('分组已空，已返回主视图');
				return;
			} else {
				// 更新分组视图的筛选节点
				this.filteredNodes = groupInfo.members;
				DebugManager.log(`📊 Group view updated, ${groupInfo.members.length} members remaining`);
			}
		}

		// 刷新网格视图
		this.renderGrid().catch(error => {
			DebugManager.error('Failed to render grid after removing node:', error);
		});

		DebugManager.log('✅ Node removed and view refreshed');
	}

	// 设置编辑器拖拽源
	private setupEditorDragSource() {
		// 监听全局拖拽开始事件
		this.registerDomEvent(document, 'dragstart', (e: DragEvent) => {
			const target = e.target;
			if (!target || !(target instanceof HTMLElement)) {
				DebugManager.log('❌ Invalid drag target');
				return;
			}

			DebugManager.log('🎯 Global dragstart event detected, target:', target.tagName, target.className);

			// 检查是否在编辑器中
			if (this.isInEditor(target)) {
				DebugManager.log('✅ Drag detected in editor');
				const selectedText = this.getSelectedText();
				DebugManager.log('📝 Selected text:', selectedText?.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...');

				if (selectedText && selectedText.trim()) {
					DebugManager.log('🚀 Calling handleEditorDragStart');
					this.handleEditorDragStart(e, selectedText);
				} else {
					DebugManager.log('❌ No selected text found');
				}
			} else {
				DebugManager.log('❌ Drag not in editor, target closest cm-editor:', target.closest?.('.cm-editor'));
			}
		});

		// 监听拖拽结束事件 - 延迟重置以确保drop事件先处理
		this.registerDomEvent(document, 'dragend', (e: DragEvent) => {
			DebugManager.log('🏁 Global dragend event detected');
			DebugManager.log('📊 Current state - isDragging:', this.isDragging, 'dragData exists:', !!this.dragData);

			// 🔑 关键修复：延迟重置拖拽状态，确保drop事件和块链接创建有足够时间处理
			setTimeout(() => {
				DebugManager.log('⏰ Delayed dragend cleanup executing...');
				DebugManager.log('📊 Pre-cleanup state - isDragging:', this.isDragging, 'dragData exists:', !!this.dragData);

				// 只有在没有正在进行的保存操作时才重置拖拽状态
				if (!this.isSaveOperationInProgress) {
					this.resetDragState();
				} else {
					DebugManager.log('⚠️ Save operation in progress, delaying drag state reset');
					// 如果正在保存，再延迟一点
					setTimeout(() => {
						this.resetDragState();
					}, 200);
				}
			}, 500); // 增加延迟时间，确保块链接创建有足够时间
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
			DebugManager.error('Error checking if element is in editor:', error);
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
			DebugManager.error('Failed to get selected text:', error);
			return null;
		}
	}

	// 获取源文件信息（用于创建回链）
	private getSourceFileInfo(): { file: TFile | null; path: string; position: { line: number; ch: number; endLine: number; endCh: number; selection?: any } | null; context: string } {
		try {
			DebugManager.log('📍 === getSourceFileInfo DEBUG START ===');

			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				DebugManager.log('❌ No active MarkdownView found');
				return { file: null, path: '', position: null, context: '' };
			}

			const file = activeView.file;
			const editor = activeView.editor;

			if (!file || !editor) {
				DebugManager.log('❌ No file or editor found');
				return { file: null, path: '', position: null, context: '' };
			}

			DebugManager.log('📁 Active file:', file.path);

			// 获取选中文本的位置信息
			const selections = editor.listSelections();
			const cursor = editor.getCursor();
			const selectedText = editor.getSelection();

			DebugManager.log('📝 Selected text:', `"${selectedText}"`);
			DebugManager.log('📏 Selected text length:', selectedText.length);
			DebugManager.log('🔢 Number of selections:', selections.length);
			DebugManager.log('📍 Cursor position:', cursor);

			// 详细记录所有选择区域
			selections.forEach((selection, index) => {
				DebugManager.log(`📋 Selection ${index}:`, {
					anchor: selection.anchor,
					head: selection.head,
					// EditorSelection 没有 from/to 方法，使用 anchor/head 代替
					from: selection.anchor,
					to: selection.head
				});
			});

			// 确定位置信息 - 需要获取选中文本的起始和结束位置
			let position = {
				line: cursor.line,
				ch: cursor.ch,
				endLine: cursor.line,
				endCh: cursor.ch,
				selection: selections.length > 0 ? selections[0] : null
			};

			// 如果有选中文本，获取选中文本的完整范围
			if (selections.length > 0 && selections[0]) {
				const selection = selections[0];
				DebugManager.log('🎯 Processing selection:', selection);

				// 确定起始位置和结束位置
				let startPos, endPos;
				if (selection.anchor.line < selection.head.line ||
					(selection.anchor.line === selection.head.line && selection.anchor.ch < selection.head.ch)) {
					startPos = selection.anchor;
					endPos = selection.head;
				} else {
					startPos = selection.head;
					endPos = selection.anchor;
				}

				position.line = startPos.line;
				position.ch = startPos.ch;
				position.endLine = endPos.line;
				position.endCh = endPos.ch;

				DebugManager.log('📍 Selection range:', {
					start: { line: position.line, ch: position.ch },
					end: { line: position.endLine, ch: position.endCh }
				});
			} else {
				DebugManager.log('📍 Using cursor position (no selection):', { line: position.line, ch: position.ch });
			}

			// 获取上下文（当前行的内容）
			const currentLine = editor.getLine(position.line);
			DebugManager.log('📄 Current line content:', `"${currentLine}"`);
			DebugManager.log('📏 Current line length:', currentLine.length);

			// 验证位置是否在行内
			if (position.ch > currentLine.length) {
				DebugManager.warn('⚠️ Character position exceeds line length, adjusting...');
				position.ch = Math.min(position.ch, currentLine.length);
			}

			const result = {
				file: file,
				path: file.path,
				position: position,
				context: currentLine
			};

			DebugManager.log('✅ Source file info result:', result);
			DebugManager.log('📍 === getSourceFileInfo DEBUG END ===');
			return result;

		} catch (error) {
			DebugManager.error('Failed to get source file info:', error);
			return { file: null, path: '', position: null, context: '' };
		}
	}



	// 处理编辑器拖拽开始
	private async handleEditorDragStart(e: DragEvent, selectedText: string) {
		if (!e.dataTransfer) return;

		DebugManager.log('🚀 Drag started from editor:', selectedText.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...');

		// 获取源文件信息
		const sourceInfo = this.getSourceFileInfo();
		DebugManager.log('📍 Source file info:', sourceInfo);

		// 设置拖拽数据
		e.dataTransfer.setData('text/plain', selectedText);
		e.dataTransfer.setData('application/obsidian-text', selectedText);
		e.dataTransfer.effectAllowed = 'copy';

		// 保存拖拽状态
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

		DebugManager.log('💾 Drag data info:', {
			hasSourceFile: !!this.dragData.sourceFile,
			sourcePath: this.dragData.sourcePath,
			sourcePosition: this.dragData.sourcePosition,
			textLength: this.dragData.text.length
		});

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
			preview.textContent = text.length > 50 ? text.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...' : text;

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
			DebugManager.error('Failed to set drag preview:', error);
		}
	}

	// 设置网格视图拖拽目标
	private setupGridDropTarget() {
		if (!this.gridContainer) return;

		DebugManager.log('Setting up grid drop target...');

		// 拖拽悬停
		this.registerDomEvent(this.gridContainer, 'dragover', (e: DragEvent) => {
			// 只处理外部拖拽，忽略网格内卡片移动
			if (this.isDragFromGrid) {
				// 网格内移动：处理卡片重新排序或移动到分组
				this.handleGridInternalDragOver(e);
				return;
			}

			// 外部拖拽：新增内容
			// 检查是否有拖拽数据（更宽松的检测）
			const hasTextData = e.dataTransfer?.types.includes('text/plain') ||
							   e.dataTransfer?.types.includes('application/obsidian-text');

			if ((this.isDragging && this.dragData) || hasTextData) {
				e.preventDefault();
				e.dataTransfer!.dropEffect = 'copy';
				this.showDropIndicator(e);
				DebugManager.log('External drag detected over grid');
			}
		});

		// 拖拽进入
		this.registerDomEvent(this.gridContainer, 'dragenter', (e: DragEvent) => {
			e.preventDefault();

			// 检查是否为外部拖拽（更宽松的检测）
			const hasTextData = e.dataTransfer?.types.includes('text/plain') ||
							   e.dataTransfer?.types.includes('application/obsidian-text');

			if (!this.isDragFromGrid && ((this.isDragging && this.dragData) || hasTextData)) {
				this.gridContainer.classList.add('drag-over');
				DebugManager.log('External drag entered grid container');
			}
		});

		// 拖拽离开
		this.registerDomEvent(this.gridContainer, 'dragleave', (e: DragEvent) => {
			// 检查是否真的离开了容器
			if (!this.gridContainer.contains(e.relatedTarget as Node)) {
				this.gridContainer.classList.remove('drag-over');
				this.hideDropIndicator();
				DebugManager.log('Drag left grid container');
			}
		});

		// 拖拽放下
		this.registerDomEvent(this.gridContainer, 'drop', (e: DragEvent) => {
			e.preventDefault();
			this.gridContainer.classList.remove('drag-over');
			this.hideDropIndicator();

			// 区分拖拽来源
			if (this.isDragFromGrid) {
				// 网格内移动：处理卡片移动到分组或重新排序
				DebugManager.log('Processing internal grid card movement');
				this.handleGridInternalDrop(e);
			} else {
				// 外部拖拽：新增内容
				// 检查是否有文本数据（更宽松的检测）
				const hasTextData = e.dataTransfer?.types.includes('text/plain') ||
								   e.dataTransfer?.types.includes('application/obsidian-text');

				if ((this.isDragging && this.dragData) || hasTextData) {
					DebugManager.log('Processing external drop in grid container');
					this.handleGridDrop(e);
				} else {
					DebugManager.log('No valid drag data found');
				}
			}
		});
	}

	// 处理网格内拖拽悬停
	private handleGridInternalDragOver(e: DragEvent) {
		e.preventDefault();

		// 检查是否拖拽到分组卡片上
		const targetElement = e.target as HTMLElement;
		const groupCard = targetElement.closest('.canvas-grid-card[data-node-type="group"]') as HTMLElement;

		if (groupCard && this.currentDragCard && groupCard !== this.currentDragCard) {
			// 拖拽到分组上，显示可放置状态
			e.dataTransfer!.dropEffect = e.ctrlKey ? 'copy' : 'move';
			groupCard.classList.add('drop-target-group');

			// 移除其他分组的高亮
			this.clearGroupDropHighlights(groupCard);
		} else {
			// 不在分组上，清除所有高亮
			this.clearGroupDropHighlights();
			e.dataTransfer!.dropEffect = 'none';
		}
	}

	// 清除分组放置高亮（保持向后兼容）
	private clearGroupDropHighlights(except?: HTMLElement) {
		const groupCards = this.gridContainer.querySelectorAll('.canvas-grid-card[data-node-type="group"]');
		groupCards.forEach(card => {
			if (card !== except) {
				card.classList.remove('drop-target-group', 'drop-target-active');
			}
		});
	}

	// 处理网格内拖拽放置
	private async handleGridInternalDrop(e: DragEvent) {
		// 清除所有高亮
		this.clearGroupDropHighlights();

		if (!this.currentDragCard) {
			DebugManager.log('No current drag card found');
			return;
		}

		const targetElement = e.target as HTMLElement;
		const targetGroupCard = targetElement.closest('.canvas-grid-card[data-node-type="group"]') as HTMLElement;

		// 检查是否拖拽到分组上
		if (targetGroupCard && targetGroupCard !== this.currentDragCard) {
			const sourceNodeId = this.currentDragCard.dataset.nodeId;
			const targetGroupId = targetGroupCard.dataset.nodeId;

			if (sourceNodeId && targetGroupId) {
				const sourceNode = this.canvasData?.nodes.find(n => n.id === sourceNodeId);
				const targetGroup = this.canvasData?.nodes.find(n => n.id === targetGroupId);

				if (sourceNode && targetGroup) {
					// 显示确认弹窗
					const isCtrlDrag = e.ctrlKey;
					await this.showMoveToGroupConfirmation(sourceNode, targetGroup, isCtrlDrag);
				}
			}
		} else {
			// 没有拖拽到分组上，可能是重新排序（暂时不实现）
			DebugManager.log('Card dropped outside of groups - reordering not implemented yet');
		}
	}

	// 显示移动到分组的确认弹窗
	private async showMoveToGroupConfirmation(sourceNode: CanvasNode, targetGroup: CanvasNode, isCtrlDrag: boolean): Promise<void> {
		return new Promise((resolve) => {
			const modal = new Modal(this.app);
			modal.titleEl.textContent = isCtrlDrag ? '确认复制卡片' : '确认移动卡片';

			// 创建内容
			const content = modal.contentEl;
			content.empty();

			// 源卡片信息
			const sourceInfo = content.createDiv('move-confirmation-source');
			sourceInfo.createEl('h4', { text: '源卡片:' });
			const sourcePreview = sourceInfo.createDiv('card-preview');
			sourcePreview.textContent = this.getNodeDisplayText(sourceNode);
			sourcePreview.className = 'card-preview source';

			// 箭头
			const arrow = content.createDiv('move-confirmation-arrow');
			arrow.textContent = isCtrlDrag ? '📋 复制到' : '➡️ 移动到';
			arrow.className = 'move-arrow';

			// 目标分组信息
			const targetInfo = content.createDiv('move-confirmation-target');
			targetInfo.createEl('h4', { text: '目标分组:' });
			const targetPreview = targetInfo.createDiv('card-preview');
			targetPreview.textContent = this.getNodeDisplayText(targetGroup);
			targetPreview.className = 'card-preview target';

			// 操作说明
			const description = content.createDiv('move-confirmation-description');
			if (isCtrlDrag) {
				description.textContent = '将复制此卡片的内容到目标分组中，原卡片保持不变。';
			} else {
				description.textContent = '将移动此卡片到目标分组中，原位置的卡片将被删除。';
			}
			description.className = 'move-description';

			// 按钮容器
			const buttonContainer = content.createDiv('move-confirmation-buttons');

			// 确认按钮
			const confirmBtn = buttonContainer.createEl('button', {
				text: isCtrlDrag ? '确认复制' : '确认移动',
				cls: 'mod-cta'
			});
			confirmBtn.addEventListener('click', async () => {
				modal.close();
				await this.executeMoveToGroup(sourceNode, targetGroup, isCtrlDrag);
				resolve();
			});

			// 取消按钮
			const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
			cancelBtn.addEventListener('click', () => {
				modal.close();
				resolve();
			});

			modal.open();
		});
	}

	// 获取节点显示文本
	private getNodeDisplayText(node: CanvasNode): string {
		switch (node.type) {
			case 'text':
				return node.text ? (node.text.length > 50 ? node.text.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...' : node.text) : '空文本';
			case 'file':
				return node.file ? node.file.split('/').pop() || node.file : '未知文件';
			case 'link':
				return node.url ? new URL(node.url).hostname : '未知链接';
			case 'group':
				return node.text || '未命名分组';
			default:
				return `${node.type} 节点`;
		}
	}

	// 执行移动到分组的操作
	private async executeMoveToGroup(sourceNode: CanvasNode, targetGroup: CanvasNode, isCopy: boolean): Promise<void> {
		try {
			if (isCopy) {
				// 复制操作：创建新节点并添加到目标分组
				await this.copyNodeToGroup(sourceNode, targetGroup);
				new Notice(`卡片已复制到分组"${this.getNodeDisplayText(targetGroup)}"`);
			} else {
				// 移动操作：将节点移动到目标分组
				await this.moveNodeToGroup(sourceNode, targetGroup);
				new Notice(`卡片已移动到分组"${this.getNodeDisplayText(targetGroup)}"`);
			}

			// 刷新视图
			this.renderGrid();
		} catch (error) {
			DebugManager.error('Failed to execute move/copy operation:', error);
			new Notice('操作失败，请重试');
		}
	}

	// 复制节点到分组
	private async copyNodeToGroup(sourceNode: CanvasNode, targetGroup: CanvasNode): Promise<void> {
		if (!this.canvasData) {
			throw new Error('Canvas data not available');
		}

		// 创建新节点（复制源节点）
		const newNode: CanvasNode = {
			...sourceNode,
			id: this.generateUniqueId(), // 生成新的ID
			// 可以在这里调整位置，放在分组附近
			x: targetGroup.x + 50,
			y: targetGroup.y + 50
		};

		// 添加到Canvas数据
		this.canvasData.nodes.push(newNode);

		// 保存到文件
		await this.saveCanvasData();
	}

	// 移动节点到分组
	private async moveNodeToGroup(sourceNode: CanvasNode, targetGroup: CanvasNode): Promise<void> {
		if (!this.canvasData) {
			throw new Error('Canvas data not available');
		}

		// 找到源节点在数组中的位置
		const sourceIndex = this.canvasData.nodes.findIndex(n => n.id === sourceNode.id);
		if (sourceIndex === -1) {
			throw new Error('Source node not found');
		}

		// 更新节点位置（移动到分组附近）
		this.canvasData.nodes[sourceIndex] = {
			...sourceNode,
			x: targetGroup.x + 50,
			y: targetGroup.y + 50
		};

		// 保存到文件
		await this.saveCanvasData();
	}

	// 生成唯一ID
	private generateUniqueId(): string {
		return 'node-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
	}

	// 显示拖拽指示器（优化版本）
	private showDropIndicator(e: DragEvent) {
		// 首先检查是否拖拽到分组上
		const targetGroupElement = this.findGroupElementUnderCursor(e);

		if (targetGroupElement) {
			// 拖拽到分组上，使用分组高亮而不是通用指示器
			this.highlightGroupAsDropTarget(targetGroupElement);
			this.hideGenericDropIndicator();
			return;
		}

		// 清除分组高亮
		this.clearAllGroupHighlights();

		// 显示通用拖拽指示器
		this.showGenericDropIndicator(e);
	}

	// 🔧 新增：查找鼠标下的分组元素
	private findGroupElementUnderCursor(e: DragEvent): HTMLElement | null {
		const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
		if (elementUnderCursor) {
			return elementUnderCursor.closest('.canvas-grid-card[data-node-type="group"]') as HTMLElement;
		}
		return null;
	}

	// 🔧 新增：高亮分组作为放置目标
	private highlightGroupAsDropTarget(groupElement: HTMLElement) {
		// 清除其他分组的高亮
		this.clearAllGroupHighlights();

		// 高亮当前分组
		groupElement.classList.add('drop-target-group', 'drop-target-active');

		DebugManager.log('🎯 Group highlighted as drop target:', groupElement.dataset.nodeId);
	}

	// 🔧 新增：清除所有分组高亮
	private clearAllGroupHighlights() {
		const groupCards = this.gridContainer.querySelectorAll('.canvas-grid-card[data-node-type="group"]');
		groupCards.forEach(card => {
			card.classList.remove('drop-target-group', 'drop-target-active');
		});
	}

	// 🔧 新增：显示通用拖拽指示器
	private showGenericDropIndicator(e: DragEvent) {
		if (!this.dropIndicator) {
			this.dropIndicator = document.createElement('div');
			this.dropIndicator.className = 'drop-indicator generic-drop-indicator';
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

	// 🔧 新增：隐藏通用拖拽指示器
	private hideGenericDropIndicator() {
		if (this.dropIndicator) {
			this.dropIndicator.style.display = 'none';
		}
	}

	// 隐藏拖拽指示器（优化版本）
	private hideDropIndicator() {
		// 隐藏通用指示器
		this.hideGenericDropIndicator();

		// 清除所有分组高亮
		this.clearAllGroupHighlights();

		DebugManager.log('🔄 All drop indicators hidden');
	}

	// 重置拖拽状态
	private resetDragState() {
		DebugManager.log('🧹 === Resetting drag state ===');
		DebugManager.log('📊 Before reset - isDragging:', this.isDragging, 'dragData exists:', !!this.dragData);

		this.isDragging = false;
		this.dragData = null;
		this.gridContainer?.classList.remove('drag-over');
		this.hideDropIndicator();

		DebugManager.log('✅ Drag state reset complete');
	}

	// 🔧 新增：提取拖拽数据的统一方法
	private extractDroppedData(e: DragEvent): any {
		const dataTransfer = e.dataTransfer;
		if (!dataTransfer) return null;

		// 优先检查Obsidian特定数据
		const obsidianText = dataTransfer.getData('application/obsidian-text');
		if (obsidianText && obsidianText.trim()) {
			return {
				type: 'text',
				content: obsidianText.trim(),
				sourceFile: this.dragData?.sourceFile,
				sourcePath: this.dragData?.sourcePath,
				sourcePosition: this.dragData?.sourcePosition,
				metadata: {
					sourceUrl: this.dragData?.metadata?.sourceUrl
				}
			};
		}

		// 检查HTML数据（可能包含链接）
		const html = dataTransfer.getData('text/html');
		if (html) {
			const urlMatch = html.match(/href=["']([^"']+)["']/);
			if (urlMatch) {
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = html;
				const textContent = tempDiv.textContent || tempDiv.innerText || '';
				return {
					type: 'link',
					content: textContent.trim(),
					sourceUrl: urlMatch[1],
					originalHTML: html
				};
			}
		}

		// 检查URL数据
		const url = dataTransfer.getData('text/uri-list');
		if (url && url.trim()) {
			return {
				type: 'link',
				content: url.trim(),
				sourceUrl: url.trim()
			};
		}

		// 最后检查普通文本
		const text = dataTransfer.getData('text/plain');
		if (text && text.trim()) {
			// 检查是否为URL
			try {
				new URL(text.trim());
				return {
					type: 'link',
					content: text.trim(),
					sourceUrl: text.trim()
				};
			} catch {
				return {
					type: 'text',
					content: text.trim()
				};
			}
		}

		return null;
	}

	// 处理网格拖拽放下
	private async handleGridDrop(e: DragEvent) {
		try {
			DebugManager.log('🎯 handleGridDrop called, currentGroupView:', this.currentGroupView);
			DebugManager.log('🎯 isDragging:', this.isDragging);
			DebugManager.log('🎯 dragData exists:', !!this.dragData);

			// 清除拖拽状态
			this.gridContainer.classList.remove('drag-over');
			this.hideDropIndicator();

			// 🔧 修复：增强拖拽数据获取逻辑
			const droppedData = this.extractDroppedData(e);

			if (!droppedData) {
				DebugManager.warn('❌ No valid drop data detected');
				new Notice('没有检测到有效的拖拽内容');
				return;
			}

			DebugManager.log('📝 Dropped data:', {
				type: droppedData.type,
				contentLength: droppedData.content?.length,
				hasSourceInfo: !!(droppedData.sourceFile || droppedData.sourceUrl),
				preview: droppedData.content?.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...'
			});

			// 🔧 修复：统一拖拽数据状态检查
			const dragDataInfo = this.dragData || droppedData;
			if (dragDataInfo) {
				DebugManager.log('✅ Drag data available:', {
					hasSourceFile: !!(dragDataInfo.sourceFile || dragDataInfo.sourcePath),
					sourcePath: dragDataInfo.sourcePath,
					sourcePosition: dragDataInfo.sourcePosition,
					sourceUrl: dragDataInfo.sourceUrl
				});
			} else {
				DebugManager.warn('⚠️ No drag data available - backlink will not be created');
			}

			// 检查是否有关联的Canvas文件
			if (!this.linkedCanvasFile) {
				new Notice('请先关联一个Canvas文件');
				this.showCanvasSelectionDialog();
				return;
			}

			DebugManager.log('Processing drop with linked canvas:', this.linkedCanvasFile.path);

			// 在分组视图中显示不同的提示
			if (this.currentGroupView) {
				new Notice("操作完成", NOTIFICATION_CONSTANTS.SHORT_DURATION);
			} else {
				new Notice("操作完成", NOTIFICATION_CONSTANTS.SHORT_DURATION);
			}

			// 🔧 修复：使用保存锁机制避免数据冲突
			let newNode: CanvasNode | null = null;

			await this.saveWithLock(async () => {
				// Canvas兼容模式：标记保存操作开始
				this.startSaveOperation();

				// 🔧 修复：使用提取的拖拽数据创建新卡片
				newNode = await this.createNodeFromDroppedData(droppedData, e);

				if (newNode) {
					// 保存到关联的Canvas文件
					await this.saveCanvasDataToLinkedFile();
					DebugManager.log('✅ 新节点已创建并保存:', newNode.id);
				}

				// Canvas兼容模式：结束保存操作标记
				this.endSaveOperation();
			});

			// 如果创建成功，更新界面
			if (newNode) {
				// 如果在分组视图中，需要重新分析分组并更新视图
				if (this.currentGroupView) {
					DebugManager.log('Refreshing group view after adding new content');
					// 重新分析分组
					this.analyzeGroups();
					// 重新进入分组视图以更新成员列表
					this.enterGroupView(this.currentGroupView);
				} else {
					// 在主视图中，正常重新渲染
					this.renderGrid();
				}

				// 通知Canvas视图刷新（如果打开）
				this.notifyCanvasViewRefresh();

				// 滚动到新创建的卡片（如果需要）
				// this.scrollToNewCard(newNode.id);

				new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
			}

			// 不在这里重置拖拽状态，让dragend事件处理

		} catch (error) {
			DebugManager.error('拖拽创建卡片失败:', error);
			new Notice('创建卡片失败，请重试');
			// 确保结束保存操作标记
			this.endSaveOperation();
			// 错误情况下立即重置拖拽状态
			this.resetDragState();
		}
	}

	// 🔧 新增：从拖拽数据创建Canvas节点
	private async createNodeFromDroppedData(droppedData: any, dropEvent: DragEvent): Promise<CanvasNode | null> {
		try {
			DebugManager.log('🎯 === createNodeFromDroppedData 开始 ===');
			DebugManager.log('📝 拖拽数据:', {
				type: droppedData.type,
				contentLength: droppedData.content?.length,
				hasSourceUrl: !!droppedData.sourceUrl
			});

			if (droppedData.type === 'link') {
				return await this.createLinkNodeFromDroppedData(droppedData, dropEvent);
			} else {
				return await this.createTextNodeFromDroppedData(droppedData, dropEvent);
			}
		} catch (error) {
			DebugManager.error('❌ createNodeFromDroppedData 失败:', error);
			new Notice('创建卡片失败');
			return null;
		}
	}

	// 🔧 新增：从拖拽数据创建文本节点
	private async createTextNodeFromDroppedData(droppedData: any, dropEvent: DragEvent): Promise<CanvasNode | null> {
		const text = droppedData.content;
		if (!text || !text.trim()) {
			return null;
		}

		// 添加回链信息（如果有源文件信息）
		let finalText = text.trim();
		if (droppedData.sourceFile || droppedData.sourcePath) {
			// 临时设置dragData以便addBacklinkToText使用
			const originalDragData = this.dragData;
			this.dragData = droppedData;
			finalText = await this.addBacklinkToText(finalText);
			this.dragData = originalDragData;
		} else if (droppedData.sourceUrl && droppedData.sourceUrl !== text.trim()) {
			// 如果有来源URL且不同于内容，添加来源链接
			finalText += `\n\n📍 来源: ${droppedData.sourceUrl}`;
		}

		// 使用现有的createNodeFromText方法
		return await this.createNodeFromText(finalText, dropEvent);
	}

	// 🔧 新增：从拖拽数据创建链接节点
	private async createLinkNodeFromDroppedData(droppedData: any, dropEvent: DragEvent): Promise<CanvasNode | null> {
		const url = droppedData.sourceUrl || droppedData.content;
		if (!url || !url.trim()) {
			return null;
		}

		// 创建链接节点，使用现有逻辑
		const position = this.calculateDropPosition(dropEvent);
		const nodeId = this.generateUniqueId();

		const linkNode: CanvasNode = {
			id: nodeId,
			type: 'link',
			url: url.trim(),
			x: position.x,
			y: position.y,
			width: 400,
			height: 200
		};

		// 添加到Canvas数据
		if (this.canvasData) {
			this.canvasData.nodes.push(linkNode);
		}

		return linkNode;
	}

	// 从文本创建Canvas节点
	private async createNodeFromText(text: string, dropEvent: DragEvent): Promise<CanvasNode | null> {
		try {
			DebugManager.log('🎯 === createNodeFromText 开始 ===');
			DebugManager.log('📝 文本内容:', text.substring(0, 100) + '...');

			DebugManager.log('📁 拖拽数据存在:', !!this.dragData);
			DebugManager.log('📄 源文件存在:', !!this.dragData?.sourceFile);
			DebugManager.log('📍 源位置存在:', !!this.dragData?.sourcePosition);



			// 分析文本内容类型（异步）
			const contentType = await this.analyzeTextContent(text);

			// 智能判断拖拽目标
			const dropTarget = this.analyzeDropTarget(dropEvent);

			let newNode: CanvasNode;

			if (dropTarget.type === 'existing-group') {
				// 场景1&2：添加到现有分组
				newNode = await this.addToExistingGroup(dropTarget.groupId!, contentType, dropTarget.position);
				DebugManager.log('Added to existing group:', dropTarget.groupId);
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
				DebugManager.log('Created new group with content');
			}



			// 保存到Canvas文件
			await this.saveCanvasData();

			return newNode;

		} catch (error) {
			DebugManager.error('创建节点失败:', error);
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
				width: GRID_CONSTANTS.CARD_WIDTH,
				height: 100
			};
		}

		// 检测是否为文件链接
		if (this.isFileLink(trimmedText)) {
			return {
				type: 'file',
				content: { file: trimmedText },
				width: GRID_CONSTANTS.CARD_WIDTH,
				height: GRID_CONSTANTS.CARD_HEIGHT
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
		// 如果文本包含换行符，肯定不是URL
		if (text.includes('\n') || text.includes('\r')) {
			return false;
		}

		// 如果文本太长，可能不是URL
		if (text.length > 2000) {
			return false;
		}

		try {
			new URL(text);
			return true;
		} catch {
			return /^https?:\/\/\S+$/.test(text);
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
			DebugManager.log('Drop in group view:', this.currentGroupView);
			return {
				type: 'existing-group',
				groupId: this.currentGroupView,
				position: this.calculatePositionInGroup(this.currentGroupView, dropEvent)
			};
		}

		// 场景2：在主界面，检查是否拖拽到分组卡片上
		const targetGroupId = this.findGroupUnderCursor(dropEvent);
		if (targetGroupId) {
			DebugManager.log('Drop on group card:', targetGroupId);
			return {
				type: 'existing-group',
				groupId: targetGroupId,
				position: this.calculatePositionInGroup(targetGroupId, dropEvent)
			};
		}

		// 场景3：在主界面空白区域，创建新分组
		DebugManager.log('Drop in empty area, creating new group');
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

			DebugManager.log(`Updated group ${groupId} analysis, new member count: ${groupInfo.memberCount}`);
		} else {
			// 如果分组信息不存在，重新分析所有分组
			DebugManager.log(`Group ${groupId} not found in analysis, re-analyzing all groups`);
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
		DebugManager.log(`Refreshing group view for: ${groupId}`);

		// 重新分析分组以获取最新数据
		this.analyzeGroups();

		// 获取更新后的分组信息
		const groupInfo = this.groupAnalysis.get(groupId);
		if (!groupInfo) {
			DebugManager.error(`Group ${groupId} not found after analysis`);
			return;
		}

		// 更新筛选节点列表
		this.filteredNodes = [...groupInfo.members];

		// 重新渲染分组成员
		this.renderGroupMembers();

		DebugManager.log(`Group view refreshed, showing ${groupInfo.members.length} members`);
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

	// 块引用ID生成方法已移除（块双链功能已禁用）

	// 拖拽数据快照方法已移除（块双链功能已禁用）

	// 块引用插入方法已移除（块双链功能已禁用）

	// 块引用检测方法已移除（块双链功能已禁用）

	// 用户确认对话框已移除（块双链功能已禁用）

	// 增强的文本处理方法（支持块引用）
	private async addBacklinkToText(originalText: string): Promise<string> {
		DebugManager.log('🔗 === addBacklinkToText called ===');
		DebugManager.log('📝 Original text length:', originalText.length);
		DebugManager.log('📝 Original text preview:', originalText.substring(0, SEARCH_CONSTANTS.MAX_PREVIEW_LENGTH) + '...');
		DebugManager.log('💾 Drag data exists:', !!this.dragData);

		// 如果有拖拽数据且包含源文件信息，添加回链
		if (this.dragData && this.dragData.sourceFile) {
			const sourceFile = this.dragData.sourceFile;
			const sourceFileName = sourceFile.basename;
			const sourcePath = sourceFile.path;
			const lineNumber = this.dragData.sourcePosition?.line ? this.dragData.sourcePosition.line + 1 : 1;

			DebugManager.log('✅ Adding backlink info:', {
				sourceFileName,
				sourcePath,
				lineNumber,
				hasSourceFile: !!sourceFile
			});

			// 回退到简单回链格式
			DebugManager.log('📝 Using simple backlink format');
			const backlinkInfo = `\n\n---\n📍 来源: [[${sourceFileName}]] (第${lineNumber}行)\n🔗 路径: ${sourcePath}`;
			const result = `${originalText}${backlinkInfo}`;

			DebugManager.log('🎉 Simple backlink added successfully, new text length:', result.length);
			return result;
		}

		DebugManager.log('❌ No drag data or source file, returning original text');
		DebugManager.log('❌ Drag data details:', {
			hasDragData: !!this.dragData,
			hasSourceFile: this.dragData?.sourceFile ? true : false,
			sourcePath: this.dragData?.sourcePath || 'none'
		});
		return originalText;
	}

	// 检查节点是否包含回链信息（支持块引用）
	private hasBacklink(node: CanvasNode): boolean {
		if (node.type !== 'text' || !node.text) {
			return false;
		}

		// 检测块引用格式：📍 来源: [[文件名#^blockId]] (第X行)
		const blockReferenceFormat = /📍\s*来源:\s*\[\[([^\]]+)#\^([^\]]+)\]\]\s*\(第(\d+)行\)/.test(node.text);

		// 检测简单链接格式：📍 来源: [[文件名]] (第X行)
		const simpleLinkFormat = /📍\s*来源:\s*\[\[([^\]]+)\]\]\s*\(第(\d+)行\)/.test(node.text);

		// 兼容旧格式
		const oldFormat = /---\n来源：.*\s\(行\s\d+\)/.test(node.text);

		DebugManager.log('Checking backlink in node:', {
			blockReferenceFormat,
			simpleLinkFormat,
			oldFormat,
			text: node.text.substring(0, 200)
		});

		return blockReferenceFormat || simpleLinkFormat || oldFormat;
	}

	// 增强的源信息导航（支持块引用）
	private async navigateToBacklink(node: CanvasNode): Promise<void> {
		if (node.type !== 'text' || !node.text) {
			new Notice('节点不包含文本内容');
			return;
		}

		try {
			DebugManager.log('=== Navigating to Source Info ===');
			DebugManager.log('Node text:', node.text);

			let fileName: string | null = null;
			let lineNumber: number | null = null;
			let sourcePath: string | null = null;
			let blockId: string | null = null;

			// 优先尝试匹配块引用格式：📍 来源: [[文件名#^blockId]] (第X行)
			const blockReferenceMatch = node.text.match(/📍\s*来源:\s*\[\[([^#\]]+)#\^([^\]]+)\]\]\s*\(第(\d+)行\)/);
			if (blockReferenceMatch) {
				fileName = blockReferenceMatch[1];
				blockId = blockReferenceMatch[2];
				lineNumber = parseInt(blockReferenceMatch[3]) - 1; // 转换为0基索引

				DebugManager.log('Found block reference:', { fileName, blockId, lineNumber: lineNumber + 1 });
			} else {
				// 尝试匹配简单链接格式：📍 来源: [[文件名]] (第X行)
				const simpleLinkMatch = node.text.match(/📍\s*来源:\s*\[\[([^\]]+)\]\]\s*\(第(\d+)行\)/);
				if (simpleLinkMatch) {
					fileName = simpleLinkMatch[1];
					lineNumber = parseInt(simpleLinkMatch[2]) - 1; // 转换为0基索引

					DebugManager.log('Found simple link:', { fileName, lineNumber: lineNumber + 1 });
				} else {
					// 回退到旧格式：来源：文件名 (行 X)
					const oldFormatMatch = node.text.match(/来源：(.*?)\s\(行\s(\d+)\)/);
					if (oldFormatMatch) {
						fileName = oldFormatMatch[1];
						lineNumber = parseInt(oldFormatMatch[2]) - 1;

						DebugManager.log('Found old format:', { fileName, lineNumber: lineNumber + 1 });
					}
				}
			}

			// 尝试提取路径信息
			const pathMatch = node.text.match(/🔗\s*路径:\s*(.+)/);
			if (pathMatch) {
				sourcePath = pathMatch[1].trim();
			}

			if (!fileName || lineNumber === null) {
				new Notice('未找到有效的源信息');
				return;
			}

			DebugManager.log('Parsed source info:', { fileName, lineNumber: lineNumber + 1, sourcePath, blockId });

			// 查找文件 - 优先使用路径，然后使用文件名
			let sourceFile: TFile | null = null;

			if (sourcePath) {
				sourceFile = this.app.vault.getAbstractFileByPath(sourcePath) as TFile;
			}

			if (!sourceFile) {
				// 按文件名查找
				const files = this.app.vault.getMarkdownFiles();
				sourceFile = files.find(f => f.basename === fileName) || null;
			}

			if (!sourceFile) {
				new Notice(`源文件不存在: ${fileName}`);
				return;
			}

			// 跳转到指定行号
			await this.openFileAndNavigate(sourceFile, lineNumber);

		} catch (error) {
			DebugManager.error('Failed to navigate to source:', error);
			new Notice('跳转到源文件失败');
		}
	}



	// 打开文件并导航到指定位置
	private async openFileAndNavigate(file: TFile, lineNumber: number): Promise<void> {
		try {
			DebugManager.log(`Opening file: ${file.path}, line: ${lineNumber + 1}`);

			// 显示加载提示
			const loadingNotice = new Notice('正在打开源文件...', 0);

			// 打开源文件
			const leaf = this.app.workspace.getUnpinnedLeaf();
			await leaf.openFile(file);

			// 等待视图加载
			await new Promise(resolve => setTimeout(resolve, 200));

			// 获取编辑器并定位到指定位置
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView && activeView.editor) {
				const editor = activeView.editor;

				// 检查行号是否有效
				const totalLines = editor.lineCount();
				const validLineNumber = Math.min(Math.max(0, lineNumber), totalLines - 1);

				if (validLineNumber !== lineNumber) {
					DebugManager.warn(`Line number ${lineNumber + 1} out of range, using line ${validLineNumber + 1}`);
				}

				// 定位到指定行
				const targetPos = { line: validLineNumber, ch: 0 };
				editor.setCursor(targetPos);

				// 滚动到可见区域
				editor.scrollIntoView({ from: targetPos, to: targetPos }, true);

				// 高亮显示整行
				const lineText = editor.getLine(validLineNumber);
				const lineEnd = { line: validLineNumber, ch: lineText.length };
				editor.setSelection(targetPos, lineEnd);

				// 3秒后取消选择
				setTimeout(() => {
					try {
						if (editor && editor.getCursor) {
							const cursor = editor.getCursor();
							editor.setCursor(cursor);
						}
					} catch (e) {
						DebugManager.log('Selection cleared automatically');
					}
				}, 3000);

				// 关闭加载提示并显示成功消息
				loadingNotice.hide();
				new Notice(`✅ 已跳转到源文件: ${file.basename} (第${validLineNumber + 1}行)`, 4000);
				DebugManager.log('Successfully navigated to backlink position');
			} else {
				loadingNotice.hide();
				new Notice('❌ 无法获取编辑器视图，请手动打开文件');
				DebugManager.error('No editor view available');
			}
		} catch (error) {
			DebugManager.error('Failed to open file and navigate:', error);
			const errorMessage = error instanceof Error ? error.message : '未知错误';
			new Notice(`❌ 打开文件失败: ${errorMessage}`);
		}
	}

	// 块引用导航方法已移除（块双链功能已禁用）



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
			DebugManager.log('Canvas data saved to active file successfully');
		} catch (error) {
			DebugManager.error('Failed to save canvas data:', error);
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
			DebugManager.log('Setting linked canvas file:', canvasFile.path);

			this.linkedCanvasFile = canvasFile;
			this.linkedTabManager.linkCanvasFile(canvasFile, this);

			// 显示加载状态
			this.showLoadingState();

			// 加载关联文件的数据
			await this.loadCanvasDataFromOfficialView(canvasFile);

			// 确保数据加载完成后重新初始化搜索和筛选
			this.initializeSearchAndSort();

			// 更新UI显示
			this.updateLinkedCanvasDisplay(canvasFile);
			this.updateActionButtonsVisibility();

			// 强制重新渲染网格
			this.renderGrid().catch(error => {
				DebugManager.error('Failed to render grid after linking canvas:', error);
			});

			new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
			DebugManager.log('Canvas file linked and data loaded:', canvasFile.path);
		} catch (error) {
			DebugManager.error('Failed to link canvas file:', error);
			new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
			DebugManager.log('Canvas link removed');
		}
	}

	// 获取官方Canvas视图实例
	private getOfficialCanvasView(file: TFile): any {
		try {
			// 查找打开了指定Canvas文件的视图
			const leaves = this.app.workspace.getLeavesOfType('canvas');
			for (const leaf of leaves) {
				const view = leaf.view as any;
				if (view.file?.path === file.path) {
					DebugManager.log('✅ Found official Canvas view for file:', file.path);
					return view;
				}
			}

			// 如果没有找到，尝试获取当前活动的Canvas视图
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf?.view?.getViewType() === 'canvas') {
				const activeView = activeLeaf.view as any;
				if (activeView.file?.path === file.path) {
					DebugManager.log('✅ Found active Canvas view for file:', file.path);
					return activeView;
				}
			}

			DebugManager.log('❌ No official Canvas view found for file:', file.path);
			return null;
		} catch (error) {
			DebugManager.error('Error getting official Canvas view:', error);
			return null;
		}
	}

	// 从官方Canvas视图提取数据
	private extractCanvasDataFromView(canvasView: any): CanvasData | null {
		try {
			// 尝试多种方式获取Canvas数据
			let canvasData = null;

			// 方式1: 通过canvas.data属性
			if (canvasView.canvas?.data) {
				canvasData = canvasView.canvas.data;
				DebugManager.log('✅ Canvas data extracted via canvas.data');
			}
			// 方式2: 通过data属性
			else if (canvasView.data) {
				canvasData = canvasView.data;
				DebugManager.log('✅ Canvas data extracted via data');
			}
			// 方式3: 通过canvas属性的其他可能结构
			else if (canvasView.canvas?.nodes) {
				canvasData = {
					nodes: canvasView.canvas.nodes,
					edges: canvasView.canvas.edges || []
				};
				DebugManager.log('✅ Canvas data extracted via canvas.nodes');
			}

			if (canvasData && Array.isArray(canvasData.nodes)) {
				DebugManager.log(`✅ Extracted Canvas data with ${canvasData.nodes.length} nodes`);
				return canvasData;
			}

			DebugManager.log('❌ No valid Canvas data found in view');
			return null;
		} catch (error) {
			DebugManager.error('Error extracting Canvas data from view:', error);
			return null;
		}
	}

	// 从官方Canvas视图或文件加载数据
	private async loadCanvasDataFromOfficialView(file: TFile): Promise<void> {
		try {
			DebugManager.log('🔄 Loading Canvas data from official view:', file.path);

			// 首先尝试从官方Canvas视图获取数据
			const canvasView = this.getOfficialCanvasView(file);
			if (canvasView) {
				const canvasData = this.extractCanvasDataFromView(canvasView);
				if (canvasData) {
					this.canvasData = canvasData;
					DebugManager.log('✅ Canvas data loaded from official view');
					return;
				}
			}

			// 回退到文件读取
			DebugManager.log('🔄 Falling back to file reading');
			await this.loadCanvasDataFromFile(file);
		} catch (error) {
			DebugManager.error('Failed to load Canvas data from official view:', error);
			throw error;
		}
	}

	// 从指定文件加载Canvas数据（回退方案）
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
			DebugManager.log('Loading canvas data from file:', file.path);
			const content = await this.app.vault.read(file);

			if (!content || content.trim() === '') {
				// 如果文件为空，创建空的Canvas数据
				DebugManager.log('Canvas file is empty, creating empty data structure');
				this.canvasData = { nodes: [], edges: [] };
				this.clearDataCache(); // 清空数据缓存
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
			const validation = this.dataValidator.validateCanvasData(parsedData);
			if (!validation.isValid) {
				const errorMessage = `Canvas数据验证失败:\n${validation.errors.map(e => e.message).join('\n')}`;
				throw new Error(errorMessage);
			}

			if (!Array.isArray(parsedData.edges)) {
				parsedData.edges = []; // 兼容旧版本
			}

			// 更新Canvas数据
			this.canvasData = parsedData;

			// 清空数据缓存，确保使用新数据重新渲染
			this.clearDataCache();

			// 重置搜索和筛选状态
			this.filteredNodes = [...parsedData.nodes];
			this.searchQuery = '';
			if (this.searchInputEl) {
				this.searchInputEl.value = '';
			}
			this.activeColorFilter = null;

			// 调试：检查节点的颜色值
			DebugManager.log('Canvas数据加载成功，节点数量:', parsedData.nodes.length);
			parsedData.nodes.forEach(node => {
				if (node.color) {
					DebugManager.log('节点颜色值:', node.id, 'color:', node.color, 'type:', typeof node.color);
				}
			});

			// 强制重新渲染网格
			this.renderGrid();
			DebugManager.log('Canvas data loaded and rendered successfully from file:', file.path);
		} catch (error) {
			const errorHandler = ErrorHandler.getInstance();
			errorHandler.handleError(error as Error, `Canvas文件加载: ${file.path}`, false);
			throw error; // 重新抛出错误，让调用者处理
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

			DebugManager.log('Saving canvas data to linked file:', this.linkedCanvasFile.path);

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
			DebugManager.log('Canvas data saved successfully to linked file:', this.linkedCanvasFile.path);
		} catch (error) {
			DebugManager.error('Failed to save to linked canvas file:', error);
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
				new Notice("操作完成", NOTIFICATION_CONSTANTS.SHORT_DURATION);
			} else {
				await this.loadActiveCanvas();
			}

			// 数据刷新后，重新初始化搜索和排序
			this.initializeSearchAndSort();
			DebugManager.log('✅ Canvas data refreshed and sort reapplied');
		} catch (error) {
			DebugManager.error('Failed to refresh canvas data:', error);
			new Notice("操作完成", NOTIFICATION_CONSTANTS.SHORT_DURATION);
		}
	}

	// 自动关联当前Canvas文件
	async autoLinkCurrentCanvas(): Promise<void> {
		try {
			// 获取当前活动的Canvas文件
			const activeFile = this.app.workspace.getActiveFile();

			if (!activeFile || activeFile.extension !== 'canvas') {
				new Notice('没有活动的Canvas文件', NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
				return;
			}

			await this.setLinkedCanvas(activeFile);
			new Notice(`已自动关联Canvas文件: ${activeFile.basename}`, NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
			DebugManager.log('Auto-linked canvas file:', activeFile.path);
		} catch (error) {
			DebugManager.error('Failed to auto-link canvas file:', error);
			new Notice('自动关联Canvas文件失败');
		}
	}

	// ==================== 文件监听事件处理 ====================

	// 关联文件被修改（Canvas兼容模式）
	onLinkedFileModified(file: TFile): void {
		DebugManager.log('Linked canvas file modified:', file.path);

		// Canvas兼容模式：检查是否正在进行保存操作
		if (this.isSaveOperationInProgress) {
			DebugManager.log('Save operation in progress, skipping file change handling');
			return;
		}

		// 检查最近是否刚完成保存操作（避免循环更新）
		const timeSinceLastSave = Date.now() - this.lastSaveTimestamp;
		if (timeSinceLastSave < 200) { // 200ms内的文件变化可能是我们自己的保存操作
			DebugManager.log('Recent save detected, skipping file change handling');
			return;
		}

		// 防抖处理，避免频繁更新
		if (this.updateTimeout) {
			this.safeClearTimeout(this.updateTimeout);
		}

		this.updateTimeout = this.safeSetTimeout(async () => {
			try {
				// 再次检查保存操作状态
				if (this.isSaveOperationInProgress) {
					DebugManager.log('Save operation started during timeout, skipping update');
					return;
				}

				// 使用新的状态管理系统处理文件变化
				await this.handleFileChangeWithNewSystem(file);
			} catch (error) {
				DebugManager.error('Failed to sync canvas data:', error);
				new Notice('同步Canvas数据失败');
			}
		}, 300); // 缩短防抖时间，提高响应性
	}

	// 关联文件被删除
	onLinkedFileDeleted(): void {
		DebugManager.log('Linked canvas file deleted');

		this.linkedCanvasFile = null;
		this.canvasData = null;
		this.renderGrid();

		this.showMessage('关联的Canvas文件已被删除，请重新关联');
		this.updateLinkedCanvasDisplay(null);
		this.updateActionButtonsVisibility();
	}

	// 关联文件被重命名
	onLinkedFileRenamed(file: TFile): void {
		DebugManager.log('Linked canvas file renamed:', file.path);

		this.linkedCanvasFile = file;
		this.updateLinkedCanvasDisplay(file);

		new Notice("操作完成", NOTIFICATION_CONSTANTS.MEDIUM_DURATION);
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
			DebugManager.log('Notifying canvas view to refresh');

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



		// 视图卸载时清理资源
		onunload() {
			DebugManager.log('Canvas Grid View unloaded');

			// 清理编辑器状态协调器
			if (this.editorStateCoordinator) {
				this.editorStateCoordinator.destroy();
			}

			// Obsidian渲染器清理已移除

			// 清理新的状态管理器
			this.cleanupStateManagers();

			// 清理用户体验指示器
			this.cleanupUXIndicators();

			// 🎯 修复样式泄露：清理视图相关的动态样式
			this.cleanupViewDynamicStyles();

			// 清理其他资源（如果有的话）
		}

		// ==================== 新增：状态管理系统方法 ====================

		/**
		 * 🎯 新增：统一数据访问方法 - 获取最新的节点数据
		 * 实现数据源优先级策略：编辑状态 > 编辑器状态管理器 > 主数据源
		 */
		private getLatestNodeData(nodeId: string): CanvasNode | null {
			try {
				// 1. 优先从当前编辑状态获取（最高优先级）
				if (this.currentEditingNode?.id === nodeId) {
					DebugManager.log('📊 从当前编辑状态获取节点数据', { nodeId });
					return this.currentEditingNode;
				}

				// 2. 从编辑器状态管理器获取
				const editorState = this.editorStateManager.getEditorState(nodeId);
				if (editorState?.isDirty && editorState.currentContent) {
					DebugManager.log('📊 从编辑器状态管理器获取节点数据', { nodeId });
					return editorState.currentContent;
				}

				// 3. 从主数据源获取（最后选择）
				const node = this.canvasData?.nodes.find(n => n.id === nodeId) || null;
				if (node) {
					DebugManager.log('📊 从主数据源获取节点数据', { nodeId });
				} else {
					DebugManager.warn('⚠️ 未找到节点数据', { nodeId });
				}
				return node;

			} catch (error) {
				DebugManager.error('❌ 获取节点数据失败', { nodeId, error });
				return null;
			}
		}

		/**
		 * 🎯 新增：数据源一致性检查 - 验证所有数据源的数据一致性
		 */
		private validateDataConsistency(nodeId: string): {
			isConsistent: boolean;
			issues: string[];
			recommendations: string[];
		} {
			const issues: string[] = [];
			const recommendations: string[] = [];

			try {
				DebugManager.log('🔍 开始数据一致性检查', { nodeId });

				// 1. 获取各数据源的节点数据
				const currentEditingData = this.currentEditingNode?.id === nodeId ? this.currentEditingNode : null;
				const editorStateData = this.editorStateManager.getEditorState(nodeId)?.currentContent;
				const memoryBufferData = this.memoryBufferManager.getMemoryVersion()?.nodes?.find((n: any) => n.id === nodeId);
				const mainDataSource = this.canvasData?.nodes.find(n => n.id === nodeId);

				// 2. 检查数据源存在性
				if (!mainDataSource) {
					issues.push('主数据源中缺少节点数据');
					recommendations.push('重新加载Canvas数据');
				}

				// 3. 检查文本内容一致性
				const texts = [
					currentEditingData?.text,
					editorStateData?.text,
					memoryBufferData?.text,
					mainDataSource?.text
				].filter(text => text !== undefined);

				if (texts.length > 1) {
					const uniqueTexts = [...new Set(texts)];
					if (uniqueTexts.length > 1) {
						issues.push(`文本内容不一致：发现${uniqueTexts.length}个不同版本`);
						recommendations.push('执行数据源同步操作');
						DebugManager.warn('⚠️ 文本内容不一致', { nodeId, uniqueTexts });
					}
				}

				// 4. 检查节点类型一致性
				const types = [
					currentEditingData?.type,
					editorStateData?.type,
					memoryBufferData?.type,
					mainDataSource?.type
				].filter(type => type !== undefined);

				if (types.length > 1) {
					const uniqueTypes = [...new Set(types)];
					if (uniqueTypes.length > 1) {
						issues.push(`节点类型不一致：发现${uniqueTypes.length}个不同类型`);
						recommendations.push('检查节点类型定义');
					}
				}

				const isConsistent = issues.length === 0;

				DebugManager.log(isConsistent ? '✅ 数据一致性检查通过' : '⚠️ 数据一致性检查发现问题', {
					nodeId,
					isConsistent,
					issuesCount: issues.length,
					issues
				});

				return { isConsistent, issues, recommendations };

			} catch (error) {
				DebugManager.error('❌ 数据一致性检查失败', { nodeId, error });
				return {
					isConsistent: false,
					issues: ['数据一致性检查执行失败'],
					recommendations: ['重新执行检查']
				};
			}
		}

		/**
		 * 🎯 新增：渲染前数据验证 - 确保渲染数据的有效性
		 */
		private validateRenderData(node: CanvasNode, context: string): boolean {
			try {
				DebugManager.log('🔍 渲染前数据验证', { nodeId: node.id, context });

				// 1. 基本属性验证
				if (!node.id) {
					DebugManager.error('❌ 节点ID缺失', { context });
					return false;
				}

				if (!node.type) {
					DebugManager.error('❌ 节点类型缺失', { nodeId: node.id, context });
					return false;
				}

				// 2. 类型特定验证
				if (node.type === 'text') {
					if (node.text === undefined) {
						DebugManager.warn('⚠️ 文本节点内容为undefined', { nodeId: node.id, context });
						// 允许空文本，但记录警告
					}
				} else if (node.type === 'link') {
					if (!node.url) {
						DebugManager.error('❌ 链接节点URL缺失', { nodeId: node.id, context });
						return false;
					}
				}

				// 3. 位置和尺寸验证
				if (typeof node.x !== 'number' || typeof node.y !== 'number') {
					DebugManager.warn('⚠️ 节点位置信息异常', {
						nodeId: node.id,
						x: node.x,
						y: node.y,
						context
					});
				}

				DebugManager.log('✅ 渲染数据验证通过', { nodeId: node.id, context });
				return true;

			} catch (error) {
				DebugManager.error('❌ 渲染数据验证失败', { nodeId: node.id, context, error });
				return false;
			}
		}

		/**
		 * 🎯 新增：同步所有数据源 - 确保数据一致性
		 */
		private async syncAllDataSources(nodeId: string, updatedNode: CanvasNode): Promise<void> {
			try {
				DebugManager.log('🔄 开始同步所有数据源', { nodeId, nodeType: updatedNode.type });

				// 1. 更新主数据源
				if (this.canvasData?.nodes) {
					const nodeIndex = this.canvasData.nodes.findIndex(n => n.id === nodeId);
					if (nodeIndex !== -1) {
						this.canvasData.nodes[nodeIndex] = { ...updatedNode };
						DebugManager.log('✅ 主数据源已更新', { nodeId });
					} else {
						DebugManager.warn('⚠️ 主数据源中未找到节点', { nodeId });
					}
				}

				// 2. 更新内存缓冲管理器
				const changeOperation = {
					id: `update-${nodeId}-${Date.now()}`,
					nodeId: nodeId,
					type: 'update' as const,
					oldValue: this.currentEditingNode,
					newValue: updatedNode,
					timestamp: Date.now(),
					applied: false
				};
				this.memoryBufferManager.applyChange(changeOperation);
				DebugManager.log('✅ 内存缓冲管理器已更新', { nodeId });

				// 3. 更新编辑器状态管理器
				this.editorStateManager.updateContent(nodeId, updatedNode);
				DebugManager.log('✅ 编辑器状态管理器已更新', { nodeId });

				// 4. 触发保存操作（异步）
				setTimeout(async () => {
					try {
						await this.saveCanvasData();
						DebugManager.log('✅ Canvas数据已保存', { nodeId });
					} catch (error) {
						DebugManager.error('❌ Canvas数据保存失败', { nodeId, error });
					}
				}, 100);

				DebugManager.log('🎉 所有数据源同步完成', { nodeId });

			} catch (error) {
				DebugManager.error('❌ 数据源同步失败', { nodeId, error });
			}
		}

		/**
		 * 使用新系统执行保存（Canvas兼容模式 - 增强防重复机制）
		 */
		private async performSaveWithNewSystem(trigger: any): Promise<void> {
			try {
				// Canvas兼容模式：检查保存操作互斥
				if (this.isSaveOperationInProgress) {
					DebugManager.log('Save operation already in progress, skipping duplicate save');
					return;
				}

				// 检查最小保存间隔（防止频繁保存）
				const timeSinceLastSave = Date.now() - this.lastSaveTimestamp;
				if (timeSinceLastSave < 50) { // 50ms最小间隔
					DebugManager.log('Save too frequent, skipping (Canvas-compatible mode)');
					return;
				}

				DebugManager.log('Performing save with new system (Canvas-compatible mode), trigger:', trigger);

				// 获取内存版本数据
				const memoryVersion = this.memoryBufferManager.getMemoryVersion();
				if (!memoryVersion) {
					DebugManager.warn('No memory version available for save');
					return;
				}

				// 检查内容是否真的发生了变化（避免无意义保存）
				if (this.canvasData && JSON.stringify(this.canvasData) === JSON.stringify(memoryVersion)) {
					DebugManager.log('No content changes detected, skipping save (Canvas-compatible mode)');
					return;
				}

				// 执行实际的文件保存
				if (this.linkedCanvasFile) {
					await this.saveCanvasDataWithNewSystem(memoryVersion, this.linkedCanvasFile);
				} else {
					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile && activeFile.extension === 'canvas') {
						await this.saveCanvasDataWithNewSystem(memoryVersion, activeFile);
					}
				}

				// 标记变更已保存
				this.memoryBufferManager.markChangesSaved();

				DebugManager.log('Save completed with new system (Canvas-compatible mode)');

			} catch (error) {
				DebugManager.error('Save failed with new system:', error);
				throw error;
			}
		}

		/**
		 * 使用新系统保存Canvas数据到文件（Canvas兼容模式）
		 */
		private async saveCanvasDataWithNewSystem(canvasData: any, file: TFile): Promise<void> {
			try {
				// Canvas兼容模式：标记保存操作开始
				this.startSaveOperation();

				// 格式化并写入文件
				const content = JSON.stringify(canvasData, null, 2);
				await this.app.vault.modify(file, content);

				// 更新本地数据引用
				this.canvasData = canvasData;

				// Canvas兼容模式：延迟结束保存操作标记
				setTimeout(() => {
					this.endSaveOperation();
				}, 100); // 缩短延迟时间，提高响应性

				DebugManager.log('Canvas data saved with new system to:', file.path);

			} catch (error) {
				// 确保结束保存操作标记
				this.endSaveOperation();
				throw error;
			}
		}

		/**
		 * 编辑器状态变化处理
		 */
		private onEditorStateChanged(nodeId: string, state: any): void {
			DebugManager.log('Editor state changed for node:', nodeId, 'isDirty:', state.isDirty);

			// 如果有变更，更新内存缓冲区
			if (state.isDirty) {
				// 创建变更操作并应用到内存缓冲区
				const changeOp = {
					id: `${nodeId}-${Date.now()}`,
					nodeId,
					type: 'update' as const,
					oldValue: state.originalContent,
					newValue: state.currentContent,
					timestamp: Date.now(),
					applied: false,
					source: 'editor' as const
				};

				this.memoryBufferManager.applyChange(changeOp);
			}
		}

		/**
		 * 显示编辑状态指示器
		 */
		private showEditingIndicator(nodeId: string, show: boolean): void {
			const cardElement = this.gridContainer.querySelector(`[data-node-id="${nodeId}"]`);
			if (!cardElement) return;

			const existingIndicator = cardElement.querySelector('.editing-indicator');

			if (show && !existingIndicator) {
				// 添加编辑状态样式类
				cardElement.classList.add('editing-active');

				// 添加视觉编辑指示器（不使用文字）
				const indicator = cardElement.createDiv('editing-indicator');
				indicator.style.cssText = `
					position: absolute;
					top: 4px;
					right: 4px;
					width: 12px;
					height: 12px;
					background: var(--color-orange);
					border-radius: 50%;
					z-index: 10;
					pointer-events: none;
					animation: pulse 1.5s infinite;
				`;

				// 添加脉冲动画样式（只添加一次）
				if (!document.querySelector('#editing-indicator-styles')) {
					const style = document.createElement('style');
					style.id = 'editing-indicator-styles';
					style.textContent = `
						@keyframes pulse {
							0% { opacity: 1; transform: scale(1); }
							50% { opacity: 0.7; transform: scale(1.2); }
							100% { opacity: 1; transform: scale(1); }
						}
						.editing-active {
							border: 2px solid var(--color-orange) !important;
							box-shadow: 0 0 8px rgba(255, 165, 0, 0.3) !important;
						}
					`;
					document.head.appendChild(style);
				}
			} else if (!show && existingIndicator) {
				// 移除编辑状态样式类
				cardElement.classList.remove('editing-active');
				// 移除编辑指示器
				existingIndicator.remove();
			}
		}

		/**
		 * 显示未保存变更指示器
		 */
		private showUnsavedChangesIndicator(show: boolean): void {
			const existingIndicator = this.containerEl.querySelector('.unsaved-changes-indicator');

			if (show && !existingIndicator) {
				const indicator = this.containerEl.createDiv('unsaved-changes-indicator');
				indicator.textContent = '有未保存的变更';
				indicator.style.cssText = `
					position: fixed;
					bottom: 20px;
					right: 20px;
					background: var(--color-orange);
					color: white;
					padding: 8px 16px;
					border-radius: 4px;
					font-size: 14px;
					font-weight: 500;
					z-index: 1000;
					cursor: pointer;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				`;

				// 点击保存
				indicator.addEventListener('click', () => {
					this.triggerManualSave();
				});
			} else if (!show && existingIndicator) {
				existingIndicator.remove();
			}
		}

		/**
		 * 清理状态管理器
		 */
		private cleanupStateManagers(): void {
			if (this.editorStateManager) {
				this.editorStateManager.cleanup();
			}
			if (this.memoryBufferManager) {
				this.memoryBufferManager.cleanup();
			}
			if (this.saveTriggerManager) {
				this.saveTriggerManager.cleanup();
			}

			DebugManager.log('State managers cleaned up');
		}

		/**
		 * 触发手动保存
		 */
		private async triggerManualSave(): Promise<void> {
			try {
				this.showSaveStatusIndicator('saving');

				// 使用保存触发管理器触发手动保存
				await this.saveTriggerManager.triggerManualSave();

				this.showSaveStatusIndicator('saved');
				DebugManager.log('Manual save completed');
			} catch (error) {
				this.showSaveStatusIndicator('error', '保存失败');
				DebugManager.error('Manual save failed:', error);
			}
		}

		/**
		 * 显示保存状态指示器
		 */
		private showSaveStatusIndicator(status: 'saving' | 'saved' | 'error', message?: string): void {
			// 移除现有的状态指示器
			const existingIndicator = this.containerEl.querySelector('.save-status-indicator');
			if (existingIndicator) {
				existingIndicator.remove();
			}

			// 创建新的状态指示器
			const indicator = this.containerEl.createDiv('save-status-indicator');
			indicator.style.cssText = `
				position: fixed;
				top: 20px;
				right: 20px;
				padding: 8px 16px;
				border-radius: 4px;
				font-size: 14px;
				font-weight: 500;
				z-index: 1000;
				transition: all 0.3s ease;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			`;

			// 根据状态设置样式和内容
			switch (status) {
				case 'saving':
					indicator.textContent = message || '正在保存...';
					indicator.style.backgroundColor = 'var(--color-orange)';
					indicator.style.color = 'white';
					break;
				case 'saved':
					indicator.textContent = message || '已保存';
					indicator.style.backgroundColor = 'var(--color-green)';
					indicator.style.color = 'white';
					break;
				case 'error':
					indicator.textContent = message || '保存失败';
					indicator.style.backgroundColor = 'var(--color-red)';
					indicator.style.color = 'white';
					break;
			}

			// 自动隐藏（除了错误状态）
			if (status !== 'error') {
				setTimeout(() => {
					if (indicator.parentNode) {
						indicator.style.opacity = '0';
						setTimeout(() => {
							indicator.remove();
						}, 300);
					}
				}, status === 'saving' ? 0 : 2000);
			}
		}

		/**
		 * 注册键盘快捷键
		 */
		private registerKeyboardShortcuts(): void {
			// Ctrl+S 手动保存
			this.addGlobalEventListener(document, 'keydown', (e: Event) => {
				const keyEvent = e as KeyboardEvent;
				if ((keyEvent.ctrlKey || keyEvent.metaKey) && keyEvent.key === 's') {
					keyEvent.preventDefault();
					this.triggerManualSave();
				}
			});

			DebugManager.log('Keyboard shortcuts registered');
		}

		/**
		 * 启动性能监控
		 */
		private startPerformanceMonitoring(): void {
			// 🎯 修复：移除重复的内存检查，统一使用PerformanceManager
			if (this.performanceManager) {
				try {
					DebugManager.log('✅ Performance manager available, monitoring enabled');
				} catch (error) {
					DebugManager.warn('Could not start performance monitoring:', error);
				}
			}

			DebugManager.log('✅ Performance monitoring started (unified through PerformanceManager)');
		}

		/**
		 * 运行基础系统验证
		 */
		private runBasicSystemValidation(): void {
			try {
				// 验证状态管理器
				if (!this.editorStateManager) {
					DebugManager.error('EditorStateManager not initialized');
					return;
				}

				if (!this.memoryBufferManager) {
					DebugManager.error('MemoryBufferManager not initialized');
					return;
				}

				if (!this.saveTriggerManager) {
					DebugManager.error('SaveTriggerManager not initialized');
					return;
				}

				// 验证UI组件
				if (!this.containerEl) {
					DebugManager.error('Container element not found');
					return;
				}

				// 验证Canvas数据
				if (this.canvasData && !this.canvasData.nodes) {
					DebugManager.warn('Canvas data exists but has no nodes');
				}

				DebugManager.log('✅ Basic system validation passed');
			} catch (error) {
				DebugManager.error('System validation failed:', error);
			}
		}

		/**
		 * 使用新状态管理系统开始编辑
		 */
		private startEditingWithNewSystem(nodeId: string, node: CanvasNode, cardElement: HTMLElement): any {
			try {
				// 注册编辑器状态
				const editorState = this.editorStateManager.startEditing(nodeId, {
					nodeType: node.type,
					initialContent: node.text || '',
					editingMode: 'text'
				});

				// 显示编辑状态指示器
				this.showEditingIndicator(nodeId, true);

				DebugManager.log('Started editing with new system:', nodeId);
				return editorState;
			} catch (error) {
				DebugManager.error('Failed to start editing with new system:', error);
				return null;
			}
		}

		/**
		 * 使用新状态管理系统停止编辑
		 */
		private stopEditingWithNewSystem(nodeId: string, saveChanges: boolean): void {
			try {
				// 停止编辑器状态
				this.editorStateManager.stopEditing(nodeId, saveChanges);

				// 隐藏编辑状态指示器
				this.showEditingIndicator(nodeId, false);

				DebugManager.log('Stopped editing with new system:', nodeId, 'saved:', saveChanges);
			} catch (error) {
				DebugManager.error('Failed to stop editing with new system:', error);
			}
		}

		/**
		 * 🎯 增强：使用新状态管理系统更新内容 - 确保所有数据源同步
		 */
		private updateContentWithNewSystem(nodeId: string, updatedNode: CanvasNode): void {
			try {
				DebugManager.log('🔄 开始更新内容（新状态管理系统）', {
					nodeId,
					nodeType: updatedNode.type,
					contentPreview: updatedNode.text?.substring(0, 50) || updatedNode.url?.substring(0, 50) || 'N/A'
				});

				// 1. 更新当前编辑状态（最高优先级）
				if (this.currentEditingNode?.id === nodeId) {
					this.currentEditingNode = { ...updatedNode };
					DebugManager.log('✅ 当前编辑状态已更新', { nodeId });
				}

				// 2. 更新编辑器状态管理器
				this.editorStateManager.updateContent(nodeId, updatedNode);
				DebugManager.log('✅ 编辑器状态管理器已更新', { nodeId });

				// 3. 创建变更操作并应用到内存缓冲区
				const changeOperation = {
					id: `change-${nodeId}-${Date.now()}`,
					nodeId: nodeId,
					type: 'update' as const,
					timestamp: Date.now(),
					oldValue: this.canvasData?.nodes.find(n => n.id === nodeId),
					newValue: updatedNode,
					applied: false
				};

				this.memoryBufferManager.applyChange(changeOperation);
				DebugManager.log('✅ 内存缓冲区已更新', { nodeId });

				// 4. 更新本地Canvas数据（主数据源）
				if (this.canvasData?.nodes) {
					const nodeIndex = this.canvasData.nodes.findIndex(n => n.id === nodeId);
					if (nodeIndex !== -1) {
						this.canvasData.nodes[nodeIndex] = { ...updatedNode };
						DebugManager.log('✅ 主数据源已更新', { nodeId });
					} else {
						DebugManager.warn('⚠️ 主数据源中未找到节点', { nodeId });
					}
				}

				// 5. 实时更新UI显示（如果不在编辑状态）
				if (this.currentEditingNode?.id !== nodeId) {
					const cardElement = this.gridContainer?.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
					if (cardElement) {
						const contentDiv = cardElement.querySelector('.card-content') as HTMLElement;
						if (contentDiv && updatedNode.type === 'text') {
							// 实时更新预览内容
							this.renderTextNodeContent(contentDiv, updatedNode);
							DebugManager.log('✅ UI实时更新完成', { nodeId });
						}
					}
				}

				DebugManager.log('🎉 内容更新完成（所有数据源已同步）', { nodeId });

			} catch (error) {
				DebugManager.error('❌ 内容更新失败', { nodeId, error });
			}
		}



		/**
		 * 使用新状态管理系统处理文件变更
		 */
		private async handleFileChangeWithNewSystem(file: TFile): Promise<void> {
			try {
				if (!this.linkedCanvasFile || file.path !== this.linkedCanvasFile.path) {
					return;
				}

				DebugManager.log('Handling file change with new system:', file.path);

				// 读取文件内容
				const content = await this.app.vault.read(file);
				const newCanvasData = JSON.parse(content);

				// 更新文件版本到内存缓冲管理器
				this.memoryBufferManager.updateFileVersion(newCanvasData);

				// 检查是否有冲突
				if (this.memoryBufferManager.detectConflict()) {
					DebugManager.warn('Conflict detected during file change');
					// 这里可以触发冲突解决流程
					return;
				}

				// 如果没有未保存的变更，直接更新本地数据
				if (!this.memoryBufferManager.hasUnsavedChanges()) {
					this.canvasData = newCanvasData;
					this.filteredNodes = newCanvasData.nodes || [];
					await this.renderGrid();
					DebugManager.log('File change processed successfully');
				} else {
					DebugManager.log('File change detected but has unsaved changes, skipping update');
				}

			} catch (error) {
				DebugManager.error('Failed to handle file change with new system:', error);
			}
		}

		/**
		 * 清理用户体验指示器
		 */
		private cleanupUXIndicators(): void {
			// 清理所有状态指示器
			const indicators = this.containerEl.querySelectorAll(
				'.save-status-indicator, .unsaved-changes-indicator, .editing-indicator'
			);
			indicators.forEach(indicator => indicator.remove());

			DebugManager.log('UX indicators cleaned up');
		}

		/**
		 * 清理视图相关的动态样式 - 防止样式泄露
		 */
		private cleanupViewDynamicStyles(): void {
			// 清理编辑指示器样式
			const editingStyleElement = document.querySelector('#editing-indicator-styles');
			if (editingStyleElement) {
				document.head.removeChild(editingStyleElement);
				DebugManager.log('🎨 View editing indicator styles cleaned up');
			}

			// 清理其他可能的视图相关样式
			const viewStyles = document.querySelectorAll('style[id*="canvas-grid-view"]');
			viewStyles.forEach(style => {
				if (style.parentNode) {
					style.parentNode.removeChild(style);
					DebugManager.log('🧹 Removed view dynamic style:', style.id);
				}
			});
		}

		// ==================== Anki同步功能方法 ====================

		// 创建Anki禁用消息
		private createAnkiDisabledMessage(container: Element): void {
			const disabledMessage = container.createDiv('anki-disabled-message');
			disabledMessage.innerHTML = `
				<div class="anki-disabled-icon">🔒</div>
				<div class="anki-disabled-text">${this.settings.language === 'zh' ? 'Anki Connect同步未启用' : 'Anki Connect sync is disabled'}</div>
				<div class="anki-disabled-subtitle">${this.settings.language === 'zh' ? '请在设置中启用Anki Connect功能' : 'Please enable Anki Connect in settings'}</div>
			`;
			disabledMessage.style.cssText = `
				text-align: center;
				padding: 40px 20px;
				color: var(--text-muted);
			`;
		}

		// 更新Anki同步状态
		public updateAnkiSyncStatus(container: Element): void {
			const statusContainer = container.createDiv('anki-sync-status-display');
			const lastSyncTime = this.settings.ankiSyncHistory.lastSyncTime;
			const syncedCount = Object.keys(this.settings.ankiSyncHistory.syncedNodes).length;
			const failedCount = this.settings.ankiSyncHistory.failedNodes.length;

			statusContainer.innerHTML = `
				<div class="anki-status-item">
					<span class="anki-status-label">${this.settings.language === 'zh' ? '上次同步:' : 'Last sync:'}</span>
					<span class="anki-status-value">${lastSyncTime ? new Date(lastSyncTime).toLocaleString() : (this.settings.language === 'zh' ? '从未同步' : 'Never synced')}</span>
				</div>
				<div class="anki-status-item">
					<span class="anki-status-label">${this.settings.language === 'zh' ? '已同步卡片:' : 'Synced cards:'}</span>
					<span class="anki-status-value">${syncedCount}</span>
				</div>
				${failedCount > 0 ? `
					<div class="anki-status-item anki-status-error">
						<span class="anki-status-label">${this.settings.language === 'zh' ? '同步失败:' : 'Failed:'}</span>
						<span class="anki-status-value">${failedCount}</span>
					</div>
				` : ''}
			`;

			statusContainer.style.cssText = `
				background: var(--background-secondary);
				border-radius: 8px;
				padding: 16px;
				margin-bottom: 16px;
				border: 1px solid var(--background-modifier-border);
			`;
		}

		// 创建颜色同步选项
		public createColorSyncOptions(container: Element): void {
			const colorOptions = [
				{ value: '1', color: '#ff6b6b', name: this.settings.language === 'zh' ? '红色' : 'Red' },
				{ value: '2', color: '#ffa726', name: this.settings.language === 'zh' ? '橙色' : 'Orange' },
				{ value: '3', color: '#ffeb3b', name: this.settings.language === 'zh' ? '黄色' : 'Yellow' },
				{ value: '4', color: '#66bb6a', name: this.settings.language === 'zh' ? '绿色' : 'Green' },
				{ value: '5', color: '#26c6da', name: this.settings.language === 'zh' ? '青色' : 'Cyan' },
				{ value: '6', color: '#42a5f5', name: this.settings.language === 'zh' ? '蓝色' : 'Blue' },
				{ value: '7', color: '#ab47bc', name: this.settings.language === 'zh' ? '紫色' : 'Purple' }
			];

			const colorGrid = container.createDiv('anki-color-sync-grid');
			colorGrid.style.cssText = `
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
				gap: 12px;
				margin: 16px 0;
			`;

			colorOptions.forEach(colorOption => {
				const isSelected = this.settings.ankiConnect.syncColors.includes(colorOption.value);
				const colorCard = colorGrid.createDiv('anki-color-card');
				colorCard.style.cssText = `
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 8px 12px;
					border: 2px solid ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
					border-radius: 8px;
					background: ${isSelected ? colorOption.color + '10' : 'var(--background-primary)'};
					cursor: pointer;
					transition: all 0.2s ease;
				`;

				const colorDot = colorCard.createDiv('anki-color-dot');
				colorDot.style.cssText = `
					width: 16px;
					height: 16px;
					border-radius: 50%;
					background: ${colorOption.color};
					flex-shrink: 0;
				`;

				const colorName = colorCard.createDiv('anki-color-name');
				colorName.textContent = colorOption.name;
				colorName.style.cssText = `
					font-size: 14px;
					color: var(--text-normal);
				`;

				if (isSelected) {
					const checkmark = colorCard.createDiv('anki-color-checkmark');
					checkmark.textContent = '✓';
					checkmark.style.cssText = `
						margin-left: auto;
						color: ${colorOption.color};
						font-weight: bold;
						font-size: 14px;
					`;
				}

				colorCard.addEventListener('click', async () => {
					await this.toggleAnkiSyncColor(colorOption.value);
					// 只更新当前颜色选项的显示状态，不重新创建整个界面
					this.updateColorSyncOptionsDisplay(container);
				});
			});
		}

		// 更新颜色同步选项显示状态
		private updateColorSyncOptionsDisplay(container: Element): void {
			const colorGrid = container.querySelector('.anki-color-sync-grid');
			if (!colorGrid) return;

			// 清空现有内容
			while (colorGrid.firstChild) {
				colorGrid.removeChild(colorGrid.firstChild);
			}

			// 重新创建颜色选项内容
			const colorOptions = [
				{ value: '1', color: '#ff6b6b', name: this.settings.language === 'zh' ? '红色' : 'Red' },
				{ value: '2', color: '#ffa726', name: this.settings.language === 'zh' ? '橙色' : 'Orange' },
				{ value: '3', color: '#ffeb3b', name: this.settings.language === 'zh' ? '黄色' : 'Yellow' },
				{ value: '4', color: '#66bb6a', name: this.settings.language === 'zh' ? '绿色' : 'Green' },
				{ value: '5', color: '#26c6da', name: this.settings.language === 'zh' ? '青色' : 'Cyan' },
				{ value: '6', color: '#42a5f5', name: this.settings.language === 'zh' ? '蓝色' : 'Blue' },
				{ value: '7', color: '#ab47bc', name: this.settings.language === 'zh' ? '紫色' : 'Purple' }
			];

			colorOptions.forEach(colorOption => {
				const isSelected = this.settings.ankiConnect.syncColors.includes(colorOption.value);
				const colorCard = colorGrid.createDiv('anki-color-card');
				colorCard.style.cssText = `
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 8px 12px;
					border: 2px solid ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
					border-radius: 8px;
					background: ${isSelected ? colorOption.color + '10' : 'var(--background-primary)'};
					cursor: pointer;
					transition: all 0.2s ease;
				`;

				const colorDot = colorCard.createDiv('anki-color-dot');
				colorDot.style.cssText = `
					width: 16px;
					height: 16px;
					border-radius: 50%;
					background: ${colorOption.color};
					flex-shrink: 0;
				`;

				const colorName = colorCard.createDiv('anki-color-name');
				colorName.textContent = colorOption.name;
				colorName.style.cssText = `
					font-size: 14px;
					color: var(--text-normal);
				`;

				if (isSelected) {
					const checkmark = colorCard.createDiv('anki-color-checkmark');
					checkmark.textContent = '✓';
					checkmark.style.cssText = `
						margin-left: auto;
						color: ${colorOption.color};
						font-weight: bold;
						font-size: 14px;
					`;
				}

				colorCard.addEventListener('click', async () => {
					await this.toggleAnkiSyncColor(colorOption.value);
					// 只更新当前颜色选项的显示状态，不重新创建整个界面
					this.updateColorSyncOptionsDisplay(container);
				});
			});
		}

		// 切换Anki同步颜色
		private async toggleAnkiSyncColor(colorValue: string): Promise<void> {
			const currentColors = [...this.settings.ankiConnect.syncColors];
			const isCurrentlySelected = currentColors.includes(colorValue);

			if (isCurrentlySelected) {
				const index = currentColors.indexOf(colorValue);
				if (index > -1) {
					currentColors.splice(index, 1);
				}
			} else {
				currentColors.push(colorValue);
			}

			this.settings.ankiConnect.syncColors = currentColors;
			await this.plugin.saveSettings();
		}

		// 同步所有选中颜色的卡片
		public async syncAllSelectedColorCards(): Promise<void> {
			if (!this.canvasData || !this.canvasData.nodes) {
				new Notice(this.settings.language === 'zh' ? '没有可同步的卡片数据' : 'No card data to sync');
				return;
			}

			if (this.settings.ankiConnect.syncColors.length === 0) {
				new Notice(this.settings.language === 'zh' ? '请先选择要同步的颜色' : 'Please select colors to sync first');
				return;
			}

			try {
				// 检查Canvas数据
				if (!this.canvasData || !this.canvasData.nodes || this.canvasData.nodes.length === 0) {
					new Notice(this.settings.language === 'zh' ? '没有Canvas数据可以同步' : 'No Canvas data to sync');
					return;
				}

				// 预筛选有效节点
				const validNodes = this.canvasData.nodes.filter(node => {
					// 基础验证
					if (!node.id || !node.type) return false;
					if (typeof node.x !== 'number' || typeof node.y !== 'number') return false;

					// 内容验证
					switch (node.type) {
						case 'text':
							return !!(node.text && node.text.trim());
						case 'file':
							return !!(node.file && node.file.trim());
						case 'link':
							return !!(node.url && node.url.trim());
						case 'group':
							return !!(node.label && node.label.trim());
						default:
							return !!(node.text || node.file || node.url || node.label);
					}
				});

				console.log(`Canvas节点统计: 总数=${this.canvasData.nodes.length}, 有效=${validNodes.length}`);

				// 详细统计节点类型
				const nodeTypeStats = this.canvasData.nodes.reduce((stats, node) => {
					stats[node.type] = (stats[node.type] || 0) + 1;
					return stats;
				}, {} as Record<string, number>);

				const validNodeTypeStats = validNodes.reduce((stats, node) => {
					stats[node.type] = (stats[node.type] || 0) + 1;
					return stats;
				}, {} as Record<string, number>);

				console.log('所有节点类型统计:', nodeTypeStats);
				console.log('有效节点类型统计:', validNodeTypeStats);

				// 显示无效节点的详细信息
				const invalidNodes = this.canvasData.nodes.filter(node => !validNodes.includes(node));
				if (invalidNodes.length > 0) {
					console.log('无效节点详情:', invalidNodes.map(node => ({
						id: node.id,
						type: node.type,
						hasId: !!node.id,
						hasType: !!node.type,
						hasPosition: typeof node.x === 'number' && typeof node.y === 'number',
						hasContent: !!(node.text || node.file || node.url || node.label),
						text: node.text?.substring(0, 50),
						file: node.file,
						url: node.url,
						label: node.label
					})));
				}

				if (validNodes.length === 0) {
					new Notice(this.settings.language === 'zh' ? '没有有效的节点可以同步' : 'No valid nodes to sync');
					return;
				}

				// 动态导入AnkiSyncManager
				const { AnkiSyncManager } = await import('./src/managers/AnkiSyncManager');

				const syncManager = new AnkiSyncManager(
					this.app,
					this.settings.ankiConnect,
					this.settings.ankiSyncHistory,
					{
						onProgressUpdate: (progress) => {
							// 显示同步进度
							new Notice(`${this.settings.language === 'zh' ? '同步进度:' : 'Sync progress:'} ${progress.current}/${progress.total}`);
						},
						onSyncComplete: (result) => {
							const message = this.settings.language === 'zh'
								? `同步完成！创建 ${result.created} 个，更新 ${result.updated} 个，跳过 ${result.skipped} 个`
								: `Sync completed! Created ${result.created}, updated ${result.updated}, skipped ${result.skipped}`;
							new Notice(message);
						},
						onSyncError: (error) => {
							console.error('Anki同步错误:', error);
							new Notice(`${this.settings.language === 'zh' ? '同步失败:' : 'Sync failed:'} ${error}`);
						}
					}
				);

				await syncManager.syncColorFilteredCards(this.settings.ankiConnect.syncColors, this.canvasData.nodes, this.linkedCanvasFile || undefined);

			} catch (error) {
				console.error('Anki同步失败:', error);

				// 提供更详细的错误信息
				let errorMessage = this.settings.language === 'zh' ? '同步失败' : 'Sync failed';
				if (error instanceof Error) {
					if (error.message.includes('验证失败')) {
						errorMessage = this.settings.language === 'zh'
							? '数据验证失败，请检查Canvas节点内容'
							: 'Data validation failed, please check Canvas node content';
					} else if (error.message.includes('连接')) {
						errorMessage = this.settings.language === 'zh'
							? '无法连接到Anki，请确保Anki正在运行并启用了AnkiConnect插件'
							: 'Cannot connect to Anki, please ensure Anki is running with AnkiConnect plugin enabled';
					} else {
						errorMessage += `: ${error.message}`;
					}
				}

				new Notice(errorMessage);
			}
		}

		// 创建同步历史显示
		public createSyncHistoryDisplay(container: Element): void {
			const historyContainer = container.createDiv('anki-sync-history');
			historyContainer.innerHTML = `
				<h4 class="anki-section-title">${this.settings.language === 'zh' ? '同步历史' : 'Sync History'}</h4>
			`;

			const lastResult = this.settings.ankiSyncHistory.lastSyncResult;
			if (lastResult) {
				const historyContent = historyContainer.createDiv('anki-history-content');
				historyContent.innerHTML = `
					<div class="anki-history-item">
						<span class="anki-history-label">${this.settings.language === 'zh' ? '成功率:' : 'Success rate:'}</span>
						<span class="anki-history-value">${lastResult.success ? '✅' : '❌'}</span>
					</div>
					<div class="anki-history-item">
						<span class="anki-history-label">${this.settings.language === 'zh' ? '处理总数:' : 'Total processed:'}</span>
						<span class="anki-history-value">${lastResult.totalProcessed}</span>
					</div>
					<div class="anki-history-item">
						<span class="anki-history-label">${this.settings.language === 'zh' ? '耗时:' : 'Duration:'}</span>
						<span class="anki-history-value">${Math.round((lastResult.duration || 0) / 1000)}s</span>
					</div>
				`;

				historyContent.style.cssText = `
					background: var(--background-secondary);
					border-radius: 6px;
					padding: 12px;
					margin-top: 8px;
					font-size: 13px;
				`;
			} else {
				const noHistory = historyContainer.createDiv('anki-no-history');
				noHistory.textContent = this.settings.language === 'zh' ? '暂无同步历史' : 'No sync history';
				noHistory.style.cssText = `
					color: var(--text-muted);
					font-style: italic;
					text-align: center;
					padding: 20px;
				`;
			}
		}
	}

// 主插件类
export default class CanvasGridPlugin extends Plugin {
	settings!: CanvasGridSettings;
	private canvasViewButtons: Map<HTMLElement, HTMLElement> = new Map();

	// 新增：临时文件和编辑器管理器（插件级别）
	private tempFileManager?: TempFileManager;
	private editorStateCoordinator?: EditorStateCoordinator;

	async onload() {
		await this.loadSettings();

		// 初始化国际化
		i18n.setLanguage(this.settings.language);

		// 注册Obsidian协议处理器
		this.registerObsidianProtocolHandler('canvasgrid-transit', this.handleObsidianProtocol.bind(this));

		// 启动内存管理
		MemoryManager.startPeriodicCleanup();

		// 初始化插件级别的管理器
		this.tempFileManager = TempFileManager.getInstance(this.app);

		// 启动临时文件异常恢复
		await this.tempFileManager.recoverFromException();

		// 加载拖拽系统样式
		this.loadDragSystemStyles();

		// 注册视图
		this.registerView(
			CANVAS_GRID_VIEW_TYPE,
			(leaf) => new CanvasGridView(leaf, this)
		);

		// 时间线视图已集成到网格视图中，不再需要独立注册

		// 添加侧边栏图标 - 尝试多个可能的图标名称
		let ribbonIconEl;
		try {
			// 尝试使用Obsidian内置图标
			ribbonIconEl = this.addRibbonIcon('grid', 'Canvas网格视图', () => {
				this.activateView();
			});
		} catch (error) {
			try {
				// 备选方案1
				ribbonIconEl = this.addRibbonIcon('layout', 'Canvas网格视图', () => {
					this.activateView();
				});
			} catch (error2) {
				try {
					// 备选方案2
					ribbonIconEl = this.addRibbonIcon('table', 'Canvas网格视图', () => {
						this.activateView();
					});
				} catch (error3) {
					// 最后备选方案：使用自定义SVG
					ribbonIconEl = this.addRibbonIcon('', 'Canvas网格视图', () => {
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

		// 🆕 添加命令：打开时间线视图
		this.addCommand({
			id: 'open-canvas-timeline-view',
			name: '打开Canvas时间线视图',
			callback: () => {
				this.activateTimelineView();
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
		this.addSettingTab(new TabNavigationSettingTab(this.app, this));

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

		DebugManager.log('🎨 Canvasgrid Transit Plugin loaded - 热重载测试成功!');
	}

	onunload() {
		// 清理新的编辑器管理器
		if (this.editorStateCoordinator) {
			this.editorStateCoordinator.destroy();
		}

		// 清理临时文件管理器
		if (this.tempFileManager) {
			this.tempFileManager.forceCleanup();
		}

		// 销毁临时文件管理器单例
		TempFileManager.destroy();

		// 清理内存管理
		MemoryManager.cleanup();

		// 清理Canvas视图按钮
		this.removeAllCanvasViewButtons();

		// 🎯 修复样式泄露：清理所有动态注入的样式
		this.cleanupAllDynamicStyles();

		DebugManager.log('Plugin unloaded with enhanced cleanup and style leak fix');
	}

	/**
	 * 处理Obsidian协议请求
	 */
	private async handleObsidianProtocol(params: Record<string, string>): Promise<void> {
		try {
			const { file, nodeId, x, y } = params;

			if (!file) {
				new Notice('缺少文件参数');
				return;
			}

			// 查找Canvas文件
			const canvasFile = this.app.vault.getAbstractFileByPath(file);
			if (!canvasFile || !(canvasFile instanceof TFile)) {
				new Notice(`找不到Canvas文件: ${file}`);
				return;
			}

			// 打开Canvas文件
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(canvasFile);

			// 如果提供了节点ID和坐标，尝试定位到节点
			if (nodeId && x && y) {
				// 等待Canvas视图加载完成
				setTimeout(() => {
					this.focusCanvasNode(nodeId, parseFloat(x), parseFloat(y));
				}, 500);
			}

			new Notice(`已打开Canvas文件: ${canvasFile.basename}`);
		} catch (error) {
			console.error('处理Obsidian协议失败:', error);
			new Notice('打开Canvas文件失败');
		}
	}

	/**
	 * 在Canvas中定位到指定节点
	 */
	private focusCanvasNode(nodeId: string, x: number, y: number): void {
		try {
			// 获取当前活动的Canvas视图
			const activeLeaf = this.app.workspace.getMostRecentLeaf();
			if (!activeLeaf || activeLeaf.view.getViewType() !== 'canvas') {
				return;
			}

			// 尝试通过Canvas API定位节点
			const canvasView = activeLeaf.view as any;
			if (canvasView.canvas && canvasView.canvas.zoomToFit) {
				// 设置视图中心到节点位置
				canvasView.canvas.setViewport(x - 200, y - 200, 1.0);

				// 高亮显示节点（如果可能）
				const node = canvasView.canvas.nodes.get(nodeId);
				if (node && node.nodeEl) {
					node.nodeEl.style.outline = '3px solid var(--interactive-accent)';
					setTimeout(() => {
						if (node.nodeEl) {
							node.nodeEl.style.outline = '';
						}
					}, 2000);
				}
			}
		} catch (error) {
			console.error('定位Canvas节点失败:', error);
		}
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

		DebugManager.log('Adding button to Canvas view');
		DebugManager.log('Container element:', containerEl);

		// 分析Canvas视图的DOM结构
		this.analyzeCanvasDOM(containerEl);

		// 尝试找到Canvas的右上角菜单容器
		const menuContainer = this.findCanvasMenuContainer(containerEl);

		if (menuContainer) {
			DebugManager.log('Found Canvas menu container:', menuContainer);
			this.addButtonToCanvasMenu(menuContainer, containerEl);
		} else {
			DebugManager.log('Canvas menu container not found, using fallback');
			this.addButtonToCanvasViewFallback(canvasView);
		}
	}

	// 分析Canvas DOM结构
	private analyzeCanvasDOM(containerEl: HTMLElement) {
		DebugManager.log('=== Canvas DOM Structure Analysis ===');

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
				DebugManager.log(`Found ${elements.length} elements with selector: ${selector}`);
				elements.forEach((el, index) => {
					DebugManager.log(`  [${index}]:`, el.className, el.getAttribute('aria-label'));
					// 查看子元素
					const children = el.children;
					DebugManager.log(`    Children count: ${children.length}`);
					for (let i = 0; i < Math.min(children.length, 5); i++) {
						DebugManager.log(`    Child[${i}]:`, children[i].className, children[i].getAttribute('aria-label'));
					}
				});
			}
		});

		// 查找所有可点击图标，特别是问号按钮
		const iconElements = containerEl.querySelectorAll('.clickable-icon, [class*="icon"], [aria-label*="help"], [aria-label*="Help"], [aria-label*="帮助"]');
		DebugManager.log(`Found ${iconElements.length} icon elements:`);
		iconElements.forEach((el, index) => {
			DebugManager.log(`  Icon[${index}]:`, el.className, el.getAttribute('aria-label'), el.parentElement?.className);
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
				DebugManager.log(`Found Canvas element: ${selector}`, element);
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
				DebugManager.log(`Found Canvas toolbar with selector: ${selector}`);
				return toolbar;
			}
		}

		// 如果没找到Canvas特有工具栏，查找包含问号按钮的容器
		const helpButtons = containerEl.querySelectorAll('[aria-label*="help"], [aria-label*="Help"], [aria-label*="帮助"], [title*="help"], [title*="Help"], [title*="帮助"]');
		for (let i = 0; i < helpButtons.length; i++) {
			const helpButton = helpButtons[i];
			const parent = helpButton.parentElement;
			if (parent && this.isValidToolbarContainer(parent)) {
				DebugManager.log('Found toolbar container via help button:', parent);
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
				DebugManager.log(`Found fallback menu container with selector: ${selector}`);
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
			DebugManager.log('Grid button clicked from Canvas toolbar');
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
			DebugManager.log('Button inserted after help button');
		} else {
			// 如果没找到问号按钮，就添加到末尾
			menuContainer.appendChild(gridButton);
			DebugManager.log('Button appended to toolbar end');
		}

		DebugManager.log('Button added to Canvas toolbar successfully');

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
				DebugManager.log('Found help button:', helpButton);
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
			DebugManager.log('Canvas container not found for fallback');
			return;
		}

		// 创建按钮容器 - 使用最小化的定位样式
		const buttonContainer = document.createElement('div');
		buttonContainer.style.cssText = `
			position: absolute;
			top: 10px;
			right: 10px;
			z-index: var(--layer-modal);
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
			DebugManager.log('Grid button clicked from fallback position');
			this.activateViewWithAutoLink(containerEl);
		};

		buttonContainer.appendChild(gridButton);
		canvasContainer.appendChild(buttonContainer);

		DebugManager.log('Fallback button added successfully');

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



	async resetSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS);
		await this.saveData(this.settings);
		// 更新国际化语言
		i18n.setLanguage(this.settings.language);
	}

	// ==================== 拖拽系统样式管理 ====================

	private dragSystemStyleElement: HTMLStyleElement | null = null;

	/**
	 * 加载拖拽系统样式
	 */
	private loadDragSystemStyles(): void {
		if (this.dragSystemStyleElement) {
			return; // 已经加载过了
		}

		// 读取CSS文件内容
		const cssContent = this.getDragSystemCSS();

		// 创建style元素
		this.dragSystemStyleElement = document.createElement('style');
		this.dragSystemStyleElement.id = 'canvas-grid-drag-system-styles';
		this.dragSystemStyleElement.textContent = cssContent;

		// 添加到head
		document.head.appendChild(this.dragSystemStyleElement);

		DebugManager.log('🎨 Drag system styles loaded');
	}

	/**
	 * 卸载拖拽系统样式
	 */
	private unloadDragSystemStyles(): void {
		if (this.dragSystemStyleElement) {
			document.head.removeChild(this.dragSystemStyleElement);
			this.dragSystemStyleElement = null;
			DebugManager.log('🎨 Drag system styles unloaded');
		}
	}

	/**
	 * 卸载编辑指示器样式 - 修复样式泄露问题
	 */
	private unloadEditingIndicatorStyles(): void {
		const editingStyleElement = document.querySelector('#editing-indicator-styles');
		if (editingStyleElement) {
			document.head.removeChild(editingStyleElement);
			DebugManager.log('🎨 Editing indicator styles unloaded - 修复样式泄露');
		}
	}

	/**
	 * 清理所有动态注入的样式 - 防止样式泄露
	 */
	private cleanupAllDynamicStyles(): void {
		// 清理拖拽系统样式
		this.unloadDragSystemStyles();

		// 清理编辑指示器样式
		this.unloadEditingIndicatorStyles();

		// 清理其他可能的动态样式
		const dynamicStyles = document.querySelectorAll('style[id^="canvas-grid-"], style[id*="editing-indicator"]');
		dynamicStyles.forEach(style => {
			if (style.parentNode) {
				style.parentNode.removeChild(style);
				DebugManager.log('🧹 Removed dynamic style:', style.id);
			}
		});
	}

	/**
	 * 获取拖拽系统CSS内容
	 */
	private getDragSystemCSS(): string {
		// 这里直接嵌入CSS内容，避免文件读取问题
		return `
/* ==================== 拖拽系统样式 ==================== */

/* 拖拽预览样式 */
.drag-preview {
    position: fixed;
    pointer-events: none;
    z-index: var(--layer-popover);
    opacity: 0.8;
    transform: rotate(3deg);
    transition: all 0.2s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    background: var(--background-primary);
    border: 2px solid var(--interactive-accent);
    max-width: GRID_CONSTANTS.CARD_WIDTHpx;
    min-width: 200px;
    overflow: hidden;
}

.drag-preview.dragging {
    opacity: 0.9;
    transform: rotate(0deg) scale(1.05);
}

.drag-preview-content {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
}

.drag-preview-icon {
    font-size: 20px;
    flex-shrink: 0;
    opacity: 0.8;
}

.drag-preview-text {
    color: var(--text-normal);
    font-size: 14px;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
}

.drag-preview-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 0 6px 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* 不同类型的预览样式 */
.drag-preview-text-type { border-color: var(--color-blue); }
.drag-preview-text-type .drag-preview-badge { background: var(--color-blue); }
.drag-preview-file-type { border-color: var(--color-green); }
.drag-preview-file-type .drag-preview-badge { background: var(--color-green); }
.drag-preview-card-type { border-color: var(--color-purple); }
.drag-preview-card-type .drag-preview-badge { background: var(--color-purple); }
.drag-preview-group-type { border-color: var(--color-orange); }
.drag-preview-group-type .drag-preview-badge { background: var(--color-orange); }

/* 拖拽状态样式 */
.dragging-from-grid {
    opacity: 0.6;
    transform: scale(0.95) rotate(2deg);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: grabbing !important;
    z-index: var(--layer-modal);
    position: relative;
}

.dragging-from-grid::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: var(--interactive-accent);
    opacity: 0.2;
    border-radius: inherit;
    pointer-events: none;
    animation: drag-pulse 1.5s ease-in-out infinite;
}

/* 放置目标指示器 */
.can-drop {
    position: relative;
    transition: all 0.2s ease;
}

.can-drop::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid var(--interactive-accent);
    border-radius: 8px;
    opacity: 0.6;
    animation: pulse-border 1.5s ease-in-out infinite;
    pointer-events: none;
}

.can-drop.drop-effect-copy::before {
    border-color: var(--color-green);
}

.can-drop.drop-effect-move::before {
    border-color: var(--color-orange);
}

/* 动画定义 */
@keyframes pulse-border {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.02); }
}

@keyframes drag-pulse {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.02); }
}

/* 深色主题适配 */
.theme-dark .drag-preview {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
    .drag-preview,
    .dragging-from-grid,
    .can-drop {
        transition: none;
        animation: none;
    }

    .can-drop::before {
        animation: none;
    }
}
`;
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
						DebugManager.log('Auto-linked canvas file:', activeFile.path);
					} catch (error) {
						DebugManager.error('Failed to auto-link canvas file:', error);
					}
				}
			}
		}
	}

	// 🆕 激活时间线视图
	async activateTimelineView() {
		const { workspace } = this.app;

		// 获取当前活动的Canvas文件
		const activeFile = workspace.getActiveFile();

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CANVAS_TIMELINE_VIEW_TYPE);

		if (leaves.length > 0) {
			// 如果时间线视图已存在，激活它
			leaf = leaves[0];
		} else {
			// 创建新的时间线视图
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: CANVAS_TIMELINE_VIEW_TYPE, active: true });
			}
		}

		// 激活视图
		if (leaf) {
			workspace.revealLeaf(leaf);

			// 时间线视图已集成到网格视图中，不再需要独立的自动关联逻辑
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
						DebugManager.log('Auto-linked canvas file from button:', canvasFile.path);
					} catch (error) {
						DebugManager.error('Failed to auto-link canvas file from button:', error);
					}
				}
			}
		}
	}
}

// 现代化标签页导航设置界面
class TabNavigationSettingTab extends PluginSettingTab {
	plugin: CanvasGridPlugin;
	private currentTab: string = 'basic';
	private tabContainer!: HTMLElement;
	private contentContainer!: HTMLElement;

	constructor(app: App, plugin: CanvasGridPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 更新国际化语言
		i18n.setLanguage(this.plugin.settings.language);

		// 创建主容器
		this.createMainContainer(containerEl);

		// 创建顶部导航栏
		this.createNavigationBar();

		// 创建内容容器
		this.createContentContainer();

		// 显示当前标签页内容
		this.showTabContent(this.currentTab);
	}

	private createMainContainer(containerEl: HTMLElement): void {
		// 插件标题
		const titleContainer = containerEl.createDiv('canvas-grid-title-container');
		titleContainer.style.cssText = `
			display: flex;
			align-items: center;
			margin-bottom: 24px;
			padding-bottom: 16px;
			border-bottom: 2px solid var(--background-modifier-border);
		`;

		const titleIcon = titleContainer.createSpan('canvas-grid-title-icon');
		titleIcon.innerHTML = '🎯';
		titleIcon.style.cssText = `
			font-size: 24px;
			margin-right: 12px;
		`;

		const titleText = titleContainer.createEl('h1', {
			text: 'Canvas Grid Transit',
			cls: 'canvas-grid-title'
		});
		titleText.style.cssText = `
			margin: 0;
			font-size: 24px;
			font-weight: 600;
			color: var(--text-normal);
		`;

		const versionBadge = titleContainer.createSpan('version-badge');
		versionBadge.textContent = 'v0.5.0';
		versionBadge.style.cssText = `
			margin-left: auto;
			background: var(--interactive-accent);
			color: white;
			padding: 4px 8px;
			border-radius: 12px;
			font-size: 12px;
			font-weight: 500;
		`;
	}

	private createNavigationBar(): void {
		this.tabContainer = this.containerEl.createDiv('canvas-grid-nav-container');
		this.tabContainer.style.cssText = `
			display: flex;
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 4px;
			margin-bottom: 24px;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		`;

		const tabs = [
			{ id: 'basic', name: this.plugin.settings.language === 'zh' ? '基础设置' : 'Basic Settings', icon: '' },
			{ id: 'colors', name: this.plugin.settings.language === 'zh' ? '颜色分类' : 'Color Categories', icon: '' },
			{ id: 'anki', name: this.plugin.settings.language === 'zh' ? 'Anki同步' : 'Anki Sync', icon: '' },
			{ id: 'about', name: this.plugin.settings.language === 'zh' ? '关于' : 'About', icon: '' }
		];

		tabs.forEach(tab => {
			const tabButton = this.tabContainer.createEl('button', {
				cls: 'canvas-grid-nav-tab',
				attr: { 'data-tab': tab.id }
			});

			tabButton.innerHTML = `
				<span class="tab-icon">${tab.icon}</span>
				<span class="tab-text">${tab.name}</span>
			`;

			tabButton.style.cssText = `
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				padding: 12px 16px;
				border: none;
				background: transparent;
				color: var(--text-muted);
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.2s ease;
				font-size: 14px;
				font-weight: 500;
			`;

			// 设置活动标签样式
			if (tab.id === this.currentTab) {
				this.setActiveTab(tabButton);
			}

			tabButton.addEventListener('click', () => {
				this.switchTab(tab.id);
			});
		});
	}

	private createContentContainer(): void {
		this.contentContainer = this.containerEl.createDiv('canvas-grid-content-container');
		this.contentContainer.style.cssText = `
			background: var(--background-primary);
			border-radius: 8px;
			padding: 0;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
			min-height: 400px;
			width: 100%;
		`;
	}

	private switchTab(tabId: string): void {
		this.currentTab = tabId;

		// 更新导航栏样式
		this.tabContainer.querySelectorAll('.canvas-grid-nav-tab').forEach(tab => {
			const button = tab as HTMLElement;
			if (button.dataset.tab === tabId) {
				this.setActiveTab(button);
			} else {
				this.setInactiveTab(button);
			}
		});

		// 显示对应内容
		this.showTabContent(tabId);
	}

	private setActiveTab(button: HTMLElement): void {
		button.style.cssText += `
			background: var(--interactive-accent);
			color: white;
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		`;
	}

	private setInactiveTab(button: HTMLElement): void {
		button.style.cssText = button.style.cssText.replace(/background:.*?;|color:.*?;|transform:.*?;|box-shadow:.*?;/g, '') + `
			background: transparent;
			color: var(--text-muted);
			transform: none;
			box-shadow: none;
		`;
	}

	private showTabContent(tabId: string): void {
		this.contentContainer.empty();

		switch (tabId) {
			case 'basic':
				this.renderBasicSettings();
				break;
			case 'colors':
				this.renderColorSettings();
				break;
			case 'anki':
				this.renderAnkiSettings();
				break;
			case 'about':
				this.renderAboutPage();
				break;
		}
}

// 基础设置标签页
private renderBasicSettings(): void {
		const container = this.contentContainer;

		// 网格布局设置
		const layoutSection = this.createSettingSection(container, '网格布局设置', 'Grid Layout Settings');
		new Setting(layoutSection)
			.setName(this.plugin.settings.language === 'zh' ? '启用自动布局' : 'Enable Auto Layout')
			.setDesc(this.plugin.settings.language === 'zh' ? '自动调整卡片布局以适应容器宽度' : 'Automatically adjust card layout to fit container width')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAutoLayout)
				.onChange(async (value) => {
					this.plugin.settings.enableAutoLayout = value;
					await this.plugin.saveSettings();
				}));

		// 界面语言设置
		const languageSection = this.createSettingSection(container, '界面语言', 'Interface Language');
		new Setting(languageSection)
			.setName(this.plugin.settings.language === 'zh' ? '界面语言' : 'Interface Language')
			.setDesc(this.plugin.settings.language === 'zh' ? '选择插件界面显示语言' : 'Select the display language for the plugin interface')
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



		// 置顶功能设置
		this.createPinnedCardsSection(container);
	}

	// 颜色分类标签页
	private renderColorSettings(): void {
		const container = this.contentContainer;

		// 颜色管理设置
		this.createUnifiedColorSection(container);
	}

	// 功能键设置标签页
	private renderHotkeysSettings(): void {
		const container = this.contentContainer;

		this.createSectionTitle(container, '⌨️ 快捷键设置', 'Hotkey Settings');

		const hotkeyInfo = container.createDiv('hotkey-info');
		hotkeyInfo.style.cssText = `
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 24px;
			border-left: 4px solid var(--interactive-accent);
		`;

		hotkeyInfo.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '快捷键可以在 Obsidian 设置 → 快捷键 中进行配置。搜索 "Canvas Grid" 找到相关命令。'
				: 'Hotkeys can be configured in Obsidian Settings → Hotkeys. Search for "Canvas Grid" to find related commands.',
			cls: 'setting-item-description'
		});

		// 常用快捷键说明
		const hotkeyList = container.createDiv('hotkey-list');
		const hotkeys = [
			{ command: 'Open Canvas Grid View', key: 'Ctrl+Shift+G', desc: '打开Canvas网格视图' },
			{ command: 'Toggle Grid Layout', key: '未设置', desc: '切换网格布局模式' },
			{ command: 'Refresh Grid View', key: 'F5', desc: '刷新网格视图' }
		];

		hotkeys.forEach(hotkey => {
			const item = hotkeyList.createDiv('hotkey-item');
			item.style.cssText = `
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 12px 0;
				border-bottom: 1px solid var(--background-modifier-border);
			`;

			const info = item.createDiv();
			info.createEl('strong', { text: hotkey.command });
			info.createEl('br');
			info.createEl('span', {
				text: this.plugin.settings.language === 'zh' ? hotkey.desc : hotkey.command,
				cls: 'setting-item-description'
			});

			const keyBadge = item.createSpan('key-badge');
			keyBadge.textContent = hotkey.key;
			keyBadge.style.cssText = `
				background: var(--background-secondary);
				padding: 4px 8px;
				border-radius: 4px;
				font-family: monospace;
				font-size: 12px;
				color: var(--text-muted);
			`;
		});
	}

	// Anki同步设置标签页
	private renderAnkiSettings(): void {
		const container = this.contentContainer;

		// Anki Connect连接设置
		const connectionSection = this.createSettingSection(container,
			this.plugin.settings.language === 'zh' ? 'Anki Connect连接' : 'Anki Connect Connection',
			this.plugin.settings.language === 'zh' ? 'Anki Connect Connection' : 'Anki Connect Connection'
		);

		// 启用开关
		new Setting(connectionSection)
			.setName(this.plugin.settings.language === 'zh' ? '启用Anki Connect同步' : 'Enable Anki Connect Sync')
			.setDesc(this.plugin.settings.language === 'zh' ? '连接到Anki进行卡片同步' : 'Connect to Anki for card synchronization')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.ankiConnect.enabled)
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.enabled = value;
					await this.plugin.saveSettings();
					this.refreshAnkiSettings();
				}));

		// API地址设置
		new Setting(connectionSection)
			.setName(this.plugin.settings.language === 'zh' ? 'API地址' : 'API URL')
			.setDesc(this.plugin.settings.language === 'zh' ? 'Anki Connect服务地址' : 'Anki Connect service URL')
			.addText(text => text
				.setPlaceholder('http://localhost:8765')
				.setValue(this.plugin.settings.ankiConnect.apiUrl)
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.apiUrl = value;
					await this.plugin.saveSettings();
				}));

		// API密钥设置（可选）
		new Setting(connectionSection)
			.setName(this.plugin.settings.language === 'zh' ? 'API密钥（可选）' : 'API Key (Optional)')
			.setDesc(this.plugin.settings.language === 'zh' ? '如果Anki Connect配置了密钥验证' : 'If Anki Connect is configured with key authentication')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.language === 'zh' ? '留空表示无需密钥' : 'Leave empty if no key required')
				.setValue(this.plugin.settings.ankiConnect.apiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.apiKey = value || undefined;
					await this.plugin.saveSettings();
				}));

		// 连接测试按钮
		new Setting(connectionSection)
			.setName(this.plugin.settings.language === 'zh' ? '连接测试' : 'Connection Test')
			.setDesc(this.plugin.settings.language === 'zh' ? '测试与Anki Connect的连接' : 'Test connection to Anki Connect')
			.addButton(button => button
				.setButtonText(this.plugin.settings.language === 'zh' ? '测试连接' : 'Test Connection')
				.onClick(async () => {
					await this.testAnkiConnection();
				}));

		// 同步配置设置
		const syncSection = this.createSettingSection(container,
			this.plugin.settings.language === 'zh' ? '同步配置' : 'Sync Configuration',
			this.plugin.settings.language === 'zh' ? 'Sync Configuration' : 'Sync Configuration'
		);

		// 默认牌组设置
		const deckSetting = new Setting(syncSection)
			.setName(this.plugin.settings.language === 'zh' ? '默认牌组' : 'Default Deck')
			.setDesc(this.plugin.settings.language === 'zh' ? '卡片将同步到此牌组' : 'Cards will be synced to this deck');

		// 添加文本输入框
		deckSetting.addText(text => text
			.setPlaceholder('Default')
			.setValue(this.plugin.settings.ankiConnect.defaultDeck)
			.onChange(async (value) => {
				this.plugin.settings.ankiConnect.defaultDeck = value;
				await this.plugin.saveSettings();
			}));

		// 添加刷新牌组列表按钮
		deckSetting.addButton(button => button
			.setButtonText(this.plugin.settings.language === 'zh' ? '刷新牌组' : 'Refresh Decks')
			.setTooltip(this.plugin.settings.language === 'zh' ? '从Anki获取牌组列表' : 'Get deck list from Anki')
			.onClick(async () => {
				// TODO: 实现refreshDeckList方法
				console.log('刷新牌组列表功能待实现');
			}));

		// 卡片模板设置
		new Setting(syncSection)
			.setName(this.plugin.settings.language === 'zh' ? '卡片模板' : 'Card Template')
			.setDesc(this.plugin.settings.language === 'zh' ? '使用的Anki卡片模板' : 'Anki card template to use')
			.addText(text => text
				.setPlaceholder('Basic')
				.setValue(this.plugin.settings.ankiConnect.modelName)
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.modelName = value;
					await this.plugin.saveSettings();
				}));

		// 同步颜色选择
		this.createSyncColorSelection(syncSection);

		// 内容分隔符设置
		new Setting(syncSection)
			.setName(this.plugin.settings.language === 'zh' ? '内容分隔符' : 'Content Divider')
			.setDesc(this.plugin.settings.language === 'zh' ? '用于分隔正面和背面内容的标记，分隔符前的内容显示在正面，后的内容显示在背面' : 'Marker to separate front and back content. Content before divider shows on front, after shows on back')
			.addText(text => text
				.setPlaceholder('---div---')
				.setValue(this.plugin.settings.ankiConnect.contentDivider)
				.onChange(async (value) => {
					// 验证分隔符有效性
					if (!value || value.trim().length === 0) {
						value = '---div---'; // 恢复默认值
					}
					this.plugin.settings.ankiConnect.contentDivider = value.trim();
					await this.plugin.saveSettings();
				}));

		// 增量同步开关
		new Setting(syncSection)
			.setName(this.plugin.settings.language === 'zh' ? '启用增量同步' : 'Enable Incremental Sync')
			.setDesc(this.plugin.settings.language === 'zh' ? '只同步变更的卡片，避免重复创建' : 'Only sync changed cards to avoid duplicates')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.ankiConnect.enableIncrementalSync)
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.enableIncrementalSync = value;
					await this.plugin.saveSettings();
				}));

		// 高级设置
		const advancedSection = this.createSettingSection(container,
			this.plugin.settings.language === 'zh' ? '高级设置' : 'Advanced Settings',
			this.plugin.settings.language === 'zh' ? 'Advanced Settings' : 'Advanced Settings'
		);

		// 批次大小设置
		new Setting(advancedSection)
			.setName(this.plugin.settings.language === 'zh' ? '批次大小' : 'Batch Size')
			.setDesc(this.plugin.settings.language === 'zh' ? '每次同步的卡片数量' : 'Number of cards to sync at once')
			.addSlider(slider => slider
				.setLimits(10, 200, 10)
				.setValue(this.plugin.settings.ankiConnect.batchSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.batchSize = value;
					await this.plugin.saveSettings();
				}));

		// 重试次数设置
		new Setting(advancedSection)
			.setName(this.plugin.settings.language === 'zh' ? '重试次数' : 'Retry Attempts')
			.setDesc(this.plugin.settings.language === 'zh' ? '连接失败时的重试次数' : 'Number of retry attempts on connection failure')
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.ankiConnect.retryAttempts)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.retryAttempts = value;
					await this.plugin.saveSettings();
				}));

		// 超时时间设置
		new Setting(advancedSection)
			.setName(this.plugin.settings.language === 'zh' ? '超时时间（秒）' : 'Timeout (seconds)')
			.setDesc(this.plugin.settings.language === 'zh' ? '请求超时时间' : 'Request timeout duration')
			.addSlider(slider => slider
				.setLimits(3, 30, 1)
				.setValue(this.plugin.settings.ankiConnect.timeout / 1000)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.ankiConnect.timeout = value * 1000;
					await this.plugin.saveSettings();
				}));
	}

	// 关于页面
	private renderAboutPage(): void {
		const container = this.contentContainer;

		// 插件标题
		const titleSection = container.createDiv('plugin-title-section');
		titleSection.style.cssText = `
			text-align: center;
			margin-bottom: 32px;
		`;

		titleSection.createEl('h1', {
			text: 'Canvas Grid Transit',
			attr: { style: 'margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: var(--text-normal);' }
		});

		titleSection.createEl('p', {
			text: `v0.5.1 by Tuanki Team`,
			attr: { style: 'margin: 0; color: var(--text-muted); font-size: 14px;' }
		});

		// 主要功能介绍区域
		const featuresSection = container.createDiv('main-features-section');
		featuresSection.style.cssText = `
			background: var(--background-secondary);
			border-radius: 12px;
			padding: 24px;
			margin-bottom: 24px;
			border: 1px solid var(--background-modifier-border);
		`;

		featuresSection.createEl('h3', {
			text: this.plugin.settings.language === 'zh' ? '主要功能介绍' : 'Key Features',
			attr: { style: 'margin: 0 0 20px 0; font-size: 18px; font-weight: 600; text-align: center;' }
		});

		const features = this.plugin.settings.language === 'zh' ? [
			{ icon: '🎯', title: '网格视图', desc: '以网格形式展示Canvas内容，支持响应式布局' },
			{ icon: '🔗', title: '块引用', desc: '自动创建Obsidian块链接，无缝集成笔记系统' },
			{ icon: '🎨', title: '颜色管理', desc: '统一的颜色分类和筛选，支持自定义标签' },
			{ icon: '🚀', title: '拖拽操作', desc: '直观的拖拽交互体验，支持批量操作' },
			{ icon: '📌', title: '置顶功能', desc: '重要内容置顶显示，提高工作效率' },
			{ icon: '🃏', title: 'Anki Connect', desc: '与Anki记忆软件无缝集成，创建高效学习卡片' }
		] : [
			{ icon: '🎯', title: 'Grid View', desc: 'Display Canvas content in responsive grid format' },
			{ icon: '🔗', title: 'Block Reference', desc: 'Auto-create Obsidian block links, seamless note integration' },
			{ icon: '🎨', title: 'Color Management', desc: 'Unified color categorization and filtering with custom tags' },
			{ icon: '🚀', title: 'Drag Operations', desc: 'Intuitive drag and drop interactions with batch operations' },
			{ icon: '📌', title: 'Pin Function', desc: 'Pin important content for improved productivity' },
			{ icon: '🃏', title: 'Anki Connect', desc: 'Seamless integration with Anki memory software for efficient learning cards' }
		];

		const featureGrid = featuresSection.createDiv('feature-grid');
		featureGrid.style.cssText = `
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 16px;
		`;

		features.forEach(feature => {
			const featureCard = featureGrid.createDiv('feature-card');
			featureCard.style.cssText = `
				background: var(--background-primary);
				border-radius: 8px;
				padding: 16px;
				text-align: center;
				border: 1px solid var(--background-modifier-border);
				transition: transform 0.2s ease, border-color 0.2s ease;
			`;

			// 添加悬停效果
			featureCard.addEventListener('mouseenter', () => {
				featureCard.style.transform = 'translateY(-2px)';
				featureCard.style.borderColor = 'var(--interactive-accent)';
			});

			featureCard.addEventListener('mouseleave', () => {
				featureCard.style.transform = 'translateY(0)';
				featureCard.style.borderColor = 'var(--background-modifier-border)';
			});

			featureCard.createDiv().innerHTML = feature.icon;
			featureCard.lastElementChild!.setAttribute('style', 'font-size: 24px; margin-bottom: 8px;');

			featureCard.createEl('h4', {
				text: feature.title,
				attr: { style: 'margin: 0 0 6px 0; font-size: 14px; font-weight: 600;' }
			});

			featureCard.createEl('p', {
				text: feature.desc,
				attr: { style: 'margin: 0; font-size: 12px; line-height: 1.3; color: var(--text-muted);' }
			});
		});

		// 底部功能按钮
		this.createActionButtons(container);
	}

	// 创建底部功能按钮
	private createActionButtons(container: HTMLElement): void {
		const buttonSection = container.createDiv('action-buttons-section');
		buttonSection.style.cssText = `
			display: flex;
			gap: 12px;
			justify-content: center;
			flex-wrap: wrap;
			margin-top: 24px;
		`;

		const buttons = [
			{
				icon: '🐙',
				text: 'GitHub',
				action: () => window.open('https://github.com/zhuzhige123/Canvasgrid-Transit', '_blank')
			},
			{
				icon: '📧',
				text: this.plugin.settings.language === 'zh' ? '邮箱' : 'Email',
				action: () => window.open('mailto:tutaoyuan8@outlook.com', '_blank')
			},
			{
				icon: '💝',
				text: this.plugin.settings.language === 'zh' ? '支持' : 'Support',
				action: () => this.showSupportModal()
			},
			{
				icon: '🔓',
				text: this.plugin.settings.language === 'zh' ? '完全开源' : 'Open Source',
				action: () => this.showOpenSourceModal()
			}
		];

		buttons.forEach(button => {
			const buttonEl = buttonSection.createEl('button', {
				cls: 'action-button'
			});
			buttonEl.style.cssText = `
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 10px 16px;
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				color: var(--text-normal);
				cursor: pointer;
				transition: all 0.2s ease;
				font-size: 13px;
				font-weight: 500;
			`;

			buttonEl.innerHTML = `
				<span style="font-size: 16px;">${button.icon}</span>
				<span>${button.text}</span>
			`;

			// 悬停效果
			buttonEl.addEventListener('mouseenter', () => {
				buttonEl.style.background = 'var(--interactive-hover)';
				buttonEl.style.borderColor = 'var(--interactive-accent)';
				buttonEl.style.transform = 'translateY(-1px)';
			});

			buttonEl.addEventListener('mouseleave', () => {
				buttonEl.style.background = 'var(--background-secondary)';
				buttonEl.style.borderColor = 'var(--background-modifier-border)';
				buttonEl.style.transform = 'translateY(0)';
			});

			buttonEl.addEventListener('click', button.action);
		});
	}

	// 显示支持信息弹窗
	private showSupportModal(): void {
		const modal = new Modal(this.plugin.app);
		modal.titleEl.setText(this.plugin.settings.language === 'zh' ? '💝 支持我们' : '💝 Support Us');

		const content = modal.contentEl;
		content.style.cssText = `
			text-align: center;
			padding: 20px;
		`;

		content.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '如果您喜欢这个插件，请考虑给我们一个 ⭐ 星标支持！'
				: 'If you like this plugin, please consider giving us a ⭐ star!',
			attr: { style: 'margin-bottom: 16px; font-size: 14px; line-height: 1.5;' }
		});

		const githubButton = content.createEl('button', {
			text: this.plugin.settings.language === 'zh' ? '前往 GitHub' : 'Go to GitHub'
		});
		githubButton.style.cssText = `
			background: var(--interactive-accent);
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			cursor: pointer;
			font-size: 13px;
		`;
		githubButton.addEventListener('click', () => {
			window.open('https://github.com/zhuzhige123/Canvasgrid-Transit', '_blank');
			modal.close();
		});

		modal.open();
	}

	// 显示开源信息弹窗
	private showOpenSourceModal(): void {
		const modal = new Modal(this.plugin.app);
		modal.titleEl.setText(this.plugin.settings.language === 'zh' ? '🔓 开源信息' : '🔓 Open Source Info');

		const content = modal.contentEl;
		content.style.cssText = `
			padding: 20px;
		`;

		content.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? 'Canvas Grid Transit 是一个完全开源的项目，采用 MIT 许可证。'
				: 'Canvas Grid Transit is a fully open source project under MIT License.',
			attr: { style: 'margin-bottom: 12px; font-size: 14px;' }
		});

		const features = this.plugin.settings.language === 'zh' ? [
			'🔍 代码完全公开，安全可靠',
			'🤝 欢迎社区贡献和建议',
			'🆓 永久免费，无使用限制',
			'🔧 支持个性化修改和扩展'
		] : [
			'🔍 Code is fully public and secure',
			'🤝 Welcome community contributions',
			'🆓 Forever free, no restrictions',
			'🔧 Support customization and extensions'
		];

		const featureList = content.createEl('ul');
		featureList.style.cssText = `
			margin: 0 0 16px 0;
			padding-left: 20px;
		`;

		features.forEach(feature => {
			const listItem = featureList.createEl('li');
			listItem.textContent = feature;
			listItem.style.cssText = `
				margin-bottom: 4px;
				font-size: 13px;
			`;
		});

		const githubButton = content.createEl('button', {
			text: this.plugin.settings.language === 'zh' ? '查看源码' : 'View Source Code'
		});
		githubButton.style.cssText = `
			background: var(--interactive-accent);
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			cursor: pointer;
			font-size: 13px;
		`;
		githubButton.addEventListener('click', () => {
			window.open('https://github.com/zhuzhige123/Canvasgrid-Transit', '_blank');
			modal.close();
		});

		modal.open();
	}




	// 高级设置标签页
	private renderAdvancedSettings(): void {
		const container = this.contentContainer;

		this.createSectionTitle(container, '🔧 开发者选项', 'Developer Options');

		const warningBox = container.createDiv('warning-box');
		warningBox.style.cssText = `
			background: var(--background-modifier-error);
			border: 1px solid var(--background-modifier-error-border);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 24px;
		`;

		warningBox.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '⚠️ 警告：这些是高级设置选项，仅供开发者和高级用户使用。错误的配置可能导致插件功能异常。'
				: '⚠️ Warning: These are advanced settings for developers and power users only. Incorrect configuration may cause plugin malfunction.',
			cls: 'setting-item-description'
		});

		// 调试选项
		new Setting(container)
			.setName(this.plugin.settings.language === 'zh' ? '启用调试模式' : 'Enable Debug Mode')
			.setDesc(this.plugin.settings.language === 'zh'
				? '在控制台显示详细的调试信息'
				: 'Show detailed debug information in console')
			.addToggle(toggle => toggle
				.setValue(false) // 默认关闭
				.onChange(async (value) => {
					// 这里可以添加调试模式的逻辑
					DebugManager.log('Debug mode:', value);
				}));

		// 性能监控
		new Setting(container)
			.setName(this.plugin.settings.language === 'zh' ? '性能监控' : 'Performance Monitoring')
			.setDesc(this.plugin.settings.language === 'zh'
				? '监控插件性能指标'
				: 'Monitor plugin performance metrics')
			.addToggle(toggle => toggle
				.setValue(false)
				.onChange(async (value) => {
					DebugManager.log('Performance monitoring:', value);
				}));

		// 重置设置
		const resetSection = container.createDiv('reset-section');
		resetSection.style.cssText = `
			margin-top: 32px;
			padding-top: 24px;
			border-top: 2px solid var(--background-modifier-border);
		`;

		this.createSectionTitle(resetSection, '🔄 重置设置', 'Reset Settings');

		new Setting(resetSection)
			.setName(this.plugin.settings.language === 'zh' ? '重置所有设置' : 'Reset All Settings')
			.setDesc(this.plugin.settings.language === 'zh'
				? '将所有设置恢复为默认值（需要重启插件）'
				: 'Reset all settings to default values (requires plugin restart)')
			.addButton(button => button
				.setButtonText(this.plugin.settings.language === 'zh' ? '重置' : 'Reset')
				.setWarning()
				.onClick(async () => {
					const confirmed = confirm(
						this.plugin.settings.language === 'zh'
							? '确定要重置所有设置吗？此操作不可撤销。'
							: 'Are you sure you want to reset all settings? This action cannot be undone.'
					);
					if (confirmed) {
						// 重置设置逻辑
						await this.plugin.resetSettings();
						this.display();
					}
				}));
	}

	// 创建设置区块的辅助方法
	private createSettingSection(container: HTMLElement, zhTitle: string, enTitle: string): HTMLElement {
		const sectionContainer = container.createDiv('canvas-grid-setting-section');
		sectionContainer.style.cssText = `
			margin: 20px 0;
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			background: var(--background-primary);
			overflow: hidden;
			width: 100%;
		`;

		// 获取当前区块的颜色
		const sectionColor = this.getSectionColor(zhTitle, enTitle);

		// 标题区域
		const titleContainer = sectionContainer.createDiv('canvas-grid-section-title-container');
		titleContainer.style.cssText = `
			display: flex;
			align-items: center;
			background: var(--background-secondary);
			padding: 16px 24px;
			position: relative;
		`;

		// 侧边颜色指示条 - 显示在标题左侧
		const colorIndicator = titleContainer.createDiv('section-color-indicator');
		colorIndicator.style.cssText = `
			width: 4px;
			height: 20px;
			background: ${sectionColor};
			border-radius: 2px;
			margin-right: 12px;
			flex-shrink: 0;
		`;

		const title = titleContainer.createEl('h3', {
			text: this.plugin.settings.language === 'zh' ? zhTitle.replace(/^[🎯🌐📝📌🎨⚙️⌨️ℹ️🔧✨💝🔄]+\s*/, '') : enTitle,
			cls: 'canvas-grid-section-title'
		});
		title.style.cssText = `
			margin: 0;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;

		// 内容区域 - 增加适当间距
		const contentContainer = sectionContainer.createDiv('canvas-grid-section-content');
		contentContainer.style.cssText = `
			padding: 16px 20px;
		`;

		return contentContainer;
	}

	// 获取设置区块的颜色
	private getSectionColor(zhTitle: string, enTitle: string): string {
		// 根据标题内容确定颜色
		if (zhTitle.includes('基础设置') || enTitle.includes('Basic')) {
			return '#42a5f5'; // 蓝色
		} else if (zhTitle.includes('颜色') || enTitle.includes('Color')) {
			return '#66bb6a'; // 绿色
		} else if (zhTitle.includes('Anki') || enTitle.includes('Anki')) {
			return '#ffa726'; // 橙色
		} else if (zhTitle.includes('关于') || enTitle.includes('About')) {
			return '#ab47bc'; // 紫色
		} else if (zhTitle.includes('置顶') || enTitle.includes('Pinned')) {
			return '#ff6b6b'; // 红色
		} else if (zhTitle.includes('高级') || enTitle.includes('Advanced')) {
			return '#26c6da'; // 青色
		} else {
			return 'var(--interactive-accent)'; // 默认主题色
		}
	}

	// 创建章节标题的辅助方法（保留兼容性）
	private createSectionTitle(container: HTMLElement, zhTitle: string, enTitle: string): void {
		const titleContainer = container.createDiv('canvas-grid-section-title-container');
		titleContainer.style.cssText = `
			margin: 24px 0 16px 0;
			display: flex;
			align-items: center;
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 16px 20px;
			border-left: 4px solid var(--interactive-accent);
			border: 1px solid var(--background-modifier-border);
		`;

		const title = titleContainer.createEl('h3', {
			text: this.plugin.settings.language === 'zh' ? zhTitle.replace(/^[🎯🌐📝📌🎨⚙️⌨️ℹ️🔧✨💝🔄]+\s*/, '') : enTitle,
			cls: 'canvas-grid-section-title'
		});
		title.style.cssText = `
			margin: 0 0 0 12px;
			font-size: 16px;
			font-weight: 600;
			color: var(--text-normal);
		`;
	}

	// 更新所有网格视图的辅助方法
	private updateAllGridViews(): void {
		// 获取所有网格视图并更新语言
		const leaves = this.app.workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE);
		leaves.forEach(leaf => {
			const view = leaf.view as CanvasGridView;
			if (view) {
				// 重新渲染视图以应用新语言
				view.onOpen();
			}
		});
	}



	// 更新所有网格视图的置顶状态
	private updateAllGridViewsPinnedStatus(): void {
		const leaves = this.app.workspace.getLeavesOfType(CANVAS_GRID_VIEW_TYPE);
		leaves.forEach(leaf => {
			const view = leaf.view as CanvasGridView;
			if (view && view.refreshPinnedStatus) {
				view.refreshPinnedStatus();
			}
		});
	}

	// 创建拖拽系统设置部分
	private createDragSystemSection(containerEl: HTMLElement): void {
		// 主标题
		containerEl.createEl('h3', {
			text: '🚀 ' + (this.plugin.settings.language === 'zh' ? '拖拽系统设置' : 'Drag System Settings')
		});

		// 描述文本
		const descContainer = containerEl.createDiv('drag-system-desc');
		descContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 6px;
			padding: 12px;
			margin-bottom: 20px;
			border-left: 3px solid var(--interactive-accent);
		`;

		const descText = descContainer.createEl('p', {
			text: this.plugin.settings.language === 'zh'
				? '新拖拽系统提供更好的性能和用户体验。如果遇到问题，可以切换回旧系统。'
				: 'The new drag system provides better performance and user experience. You can switch back to the legacy system if you encounter issues.',
			cls: 'setting-item-description'
		});
		descText.style.cssText = `
			margin: 0;
			color: var(--text-muted);
			font-size: 13px;
			line-height: 1.4;
		`;
	}



	// 创建置顶功能设置部分
	private createPinnedCardsSection(containerEl: HTMLElement): void {
		const pinnedSection = this.createSettingSection(containerEl, '置顶功能设置', 'Pinned Cards Settings');

		// 启用置顶功能
		new Setting(pinnedSection)
			.setName(this.plugin.settings.language === 'zh' ? '启用置顶功能' : 'Enable Pinned Cards')
			.setDesc(this.plugin.settings.language === 'zh' ? '允许将重要卡片置顶显示' : 'Allow important cards to be pinned at the top')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePinnedCards)
				.onChange(async (value) => {
					this.plugin.settings.enablePinnedCards = value;
					await this.plugin.saveSettings();
					// 重新渲染网格以应用变更
					this.updateAllGridViews();
				}));

		// 置顶标签名称
		new Setting(pinnedSection)
			.setName(this.plugin.settings.language === 'zh' ? '置顶标签名称' : 'Pinned Tag Name')
			.setDesc(this.plugin.settings.language === 'zh' ? '用于标记置顶卡片的标签名称' : 'Tag name used to mark pinned cards')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.language === 'zh' ? '#置顶' : '#pinned')
				.setValue(this.plugin.settings.pinnedTagName)
				.onChange(async (value) => {
					// 验证标签格式
					const trimmedValue = value.trim();
					if (trimmedValue && !trimmedValue.startsWith('#')) {
						new Notice(this.plugin.settings.language === 'zh' ? '置顶标签必须以 # 开头' : 'Pinned tag must start with #');
						return;
					}

					this.plugin.settings.pinnedTagName = trimmedValue || (this.plugin.settings.language === 'zh' ? '#置顶' : '#pinned');
					await this.plugin.saveSettings();

					// 重新扫描所有卡片的置顶状态
					this.updateAllGridViewsPinnedStatus();
				}));

		// 显示置顶标识
		new Setting(pinnedSection)
			.setName(this.plugin.settings.language === 'zh' ? '显示置顶标识' : 'Show Pinned Indicator')
			.setDesc(this.plugin.settings.language === 'zh' ? '在置顶卡片上显示视觉标识' : 'Show visual indicator on pinned cards')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showPinnedIndicator)
				.onChange(async (value) => {
					this.plugin.settings.showPinnedIndicator = value;
					await this.plugin.saveSettings();
					this.updateAllGridViews();
				}));
	}

	// 创建统一的颜色管理设置部分
	private createUnifiedColorSection(containerEl: HTMLElement): void {
		const colorSection = this.createSettingSection(containerEl, '颜色管理', 'Color Management');

		// 创建可选颜色网格
		this.createSelectableColorGrid(colorSection);

		// 创建已选择颜色预览
		this.createSelectedColorsPreview(colorSection);
	}

	// 创建可选颜色列表
	private createSelectableColorGrid(containerEl: HTMLElement): void {
		const listContainer = containerEl.createDiv('selectable-color-list-container');
		listContainer.style.cssText = `
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 20px;
		`;

		const listTitle = listContainer.createEl('h4', {
			text: this.plugin.settings.language === 'zh' ? '可选颜色' : 'Available Colors',
			cls: 'color-list-title'
		});
		listTitle.style.cssText = `
			margin: 0 0 16px 0;
			color: var(--text-normal);
			font-size: 14px;
			font-weight: 600;
		`;

		const colorList = listContainer.createDiv('selectable-color-list');
		colorList.style.cssText = `
			display: flex;
			flex-direction: column;
			gap: 8px;
		`;

		// 使用统一的颜色选项
		const availableColors = this.getColorOptions();

		availableColors.forEach(colorOption => {
			this.createSelectableColorListItem(colorList, colorOption);
		});
	}

	// 创建可选择的颜色列表项
	private createSelectableColorListItem(container: HTMLElement, colorOption: { value: string, color: string, name: string, desc: string }): void {
		const isSelected = this.plugin.settings.colorFilterColors.includes(colorOption.value);
		const category = this.plugin.settings.colorCategories.find(cat => cat.color === colorOption.value);

		const listItem = container.createDiv('color-list-item');
		listItem.setAttribute('data-color-value', colorOption.value);
		listItem.style.cssText = `
			display: flex;
			align-items: center;
			padding: 12px 16px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 8px;
			background: var(--background-secondary);
			transition: all 0.2s ease;
			cursor: pointer;
			gap: 16px;
		`;

		// 颜色圆点
		const colorDot = listItem.createDiv('color-dot');
		colorDot.style.cssText = `
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: ${colorOption.color};
			flex-shrink: 0;
			box-shadow: 0 1px 3px ${colorOption.color}40;
		`;

		// 内容区域
		const contentArea = listItem.createDiv('color-content-area');
		contentArea.style.cssText = `
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4px;
		`;

		// 颜色名称（可编辑）
		const nameDisplay = contentArea.createEl('div', {
			text: category ? category.name : colorOption.name,
			cls: 'color-name-display'
		});
		nameDisplay.style.cssText = `
			font-size: 14px;
			font-weight: 600;
			color: var(--text-normal);
			cursor: text;
			padding: 2px 4px;
			border-radius: 4px;
			transition: background 0.2s ease;
		`;

		// 颜色描述（可编辑）
		const descDisplay = contentArea.createEl('div', {
			text: category ? category.description : colorOption.desc,
			cls: 'color-desc-display'
		});
		descDisplay.style.cssText = `
			font-size: 12px;
			color: var(--text-muted);
			cursor: text;
			padding: 2px 4px;
			border-radius: 4px;
			transition: background 0.2s ease;
			line-height: 1.3;
		`;

		// 开关功能键
		const toggleSwitch = listItem.createDiv('color-toggle-switch');
		toggleSwitch.style.cssText = `
			width: 40px;
			height: 20px;
			border-radius: 10px;
			background: ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
			position: relative;
			cursor: pointer;
			transition: all 0.2s ease;
			flex-shrink: 0;
		`;

		const toggleKnob = toggleSwitch.createDiv('toggle-knob');
		toggleKnob.style.cssText = `
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background: white;
			position: absolute;
			top: 2px;
			left: ${isSelected ? '22px' : '2px'};
			transition: all 0.2s ease;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		`;

		// 添加编辑功能
		this.addInlineEditingToColorCard(nameDisplay, descDisplay, colorOption.value);

		// 点击切换选择状态
		const toggleSelection = async (e: Event) => {
			// 如果点击的是文本编辑区域，不触发选择逻辑
			if ((e.target as HTMLElement).classList.contains('color-name-display') ||
				(e.target as HTMLElement).classList.contains('color-desc-display')) {
				return;
			}

			// 防止重复点击
			if (toggleSwitch.hasClass('processing')) {
				return;
			}

			toggleSwitch.addClass('processing');
			try {
				await this.toggleColorSelection(colorOption.value);
			} catch (error) {
				console.error('Toggle color selection failed:', error);
			} finally {
				toggleSwitch.removeClass('processing');
			}
		};

		listItem.addEventListener('click', toggleSelection);
		toggleSwitch.addEventListener('click', (e) => {
			e.stopPropagation(); // 防止事件冒泡
			toggleSelection(e);
		});

		// 悬停效果
		listItem.addEventListener('mouseenter', () => {
			listItem.style.borderColor = colorOption.color;
			listItem.style.background = colorOption.color + '08';
		});

		listItem.addEventListener('mouseleave', () => {
			listItem.style.borderColor = 'var(--background-modifier-border)';
			listItem.style.background = 'var(--background-secondary)';
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

		// 事件监听（Canvas兼容模式）
		let hasSaved = false; // 防重复保存标志

		const saveEditOnce = () => {
			if (!hasSaved) {
				hasSaved = true;
				saveEdit();
			}
		};

		input.addEventListener('blur', saveEditOnce);
		input.addEventListener('keydown', (e) => {
			const keyEvent = e as KeyboardEvent;
			if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
				e.preventDefault();
				saveEditOnce();
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

		// 只更新相关的开关状态，而不是重新渲染整个界面
		this.updateColorToggleStates();
	}

	// 获取颜色选项配置
	private getColorOptions() {
		return [
			{ value: '1', color: '#ff6b6b', name: '重要', desc: '重要内容和紧急事项' },
			{ value: '2', color: '#ffa726', name: '待办', desc: '待办事项和提醒' },
			{ value: '3', color: '#ffeb3b', name: '黄色', desc: '注意事项和警告' },
			{ value: '4', color: '#66bb6a', name: '绿色', desc: '已完成和确认事项' },
			{ value: '5', color: '#26c6da', name: '收集', desc: '时间胶囊收集的内容' },
			{ value: '6', color: '#42a5f5', name: '记事', desc: '一般笔记和记录' },
			{ value: '7', color: '#ab47bc', name: '灵感', desc: '创意想法和灵感' }
		];
	}

	// 更新所有颜色开关的状态
	private updateColorToggleStates(): void {
		const colorItems = this.containerEl.querySelectorAll('.color-list-item');
		const colorOptions = this.getColorOptions();

		colorItems.forEach((item) => {
			const colorValue = item.getAttribute('data-color-value');
			if (colorValue) {
				const isSelected = this.plugin.settings.colorFilterColors.includes(colorValue);
				const toggleSwitch = item.querySelector('.color-toggle-switch') as HTMLElement;
				const toggleKnob = item.querySelector('.toggle-knob') as HTMLElement;
				const colorOption = colorOptions.find(opt => opt.value === colorValue);

				if (toggleSwitch && toggleKnob && colorOption) {
					// 更新开关背景色
					toggleSwitch.style.background = isSelected ? colorOption.color : 'var(--background-modifier-border)';
					// 更新滑块位置
					toggleKnob.style.left = isSelected ? '22px' : '2px';
					// 更新列表项边框高亮
					if (isSelected) {
						(item as HTMLElement).style.borderColor = colorOption.color;
					} else {
						(item as HTMLElement).style.borderColor = 'var(--background-modifier-border)';
					}
				}
			}
		});

		// 同时更新底部的已选择颜色预览区域
		this.updateSelectedColorsPreview();
	}

	// 更新已选择颜色预览区域
	private updateSelectedColorsPreview(): void {
		// 更新状态文本
		const statusText = this.containerEl.querySelector('.selected-colors-status') as HTMLElement;
		if (statusText) {
			statusText.textContent = this.plugin.settings.language === 'zh'
				? `已选择 ${this.plugin.settings.colorFilterColors.length}/5 个颜色`
				: `Selected ${this.plugin.settings.colorFilterColors.length}/5 colors`;
		}

		// 更新可排序的颜色圆点
		const sortableContainer = this.containerEl.querySelector('.sortable-preview-container') as HTMLElement;
		if (sortableContainer) {
			this.renderSortableColorDots(sortableContainer);
		}
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
			padding: GRID_CONSTANTS.CARD_SPACINGpx;
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
			padding: GRID_CONSTANTS.CARD_SPACINGpx;
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

	// Anki设置相关辅助方法
	private refreshAnkiSettings(): void {
		// 重新渲染Anki设置界面
		if (this.currentTab === 'anki') {
			// 清空容器内容
			this.contentContainer.empty();
			this.renderAnkiSettings();
		}
	}

		private async testAnkiConnection(): Promise<void> {
			const config = this.plugin.settings.ankiConnect;

			if (!config.enabled) {
				new Notice(this.plugin.settings.language === 'zh' ?
					'请先启用Anki Connect同步' :
					'Please enable Anki Connect sync first');
				return;
			}

			try {
				// 创建临时的AnkiConnectManager进行测试
				const { AnkiConnectManager } = await import('./src/managers/AnkiConnectManager');
				const ankiManager = new AnkiConnectManager(this.app, config);

				const isConnected = await ankiManager.testConnection();

				if (isConnected) {
					new Notice(this.plugin.settings.language === 'zh' ?
						'✅ Anki Connect连接成功！' :
						'✅ Anki Connect connection successful!');
				} else {
					new Notice(this.plugin.settings.language === 'zh' ?
						'❌ 无法连接到Anki Connect，请检查Anki是否运行且已安装AnkiConnect插件' :
						'❌ Cannot connect to Anki Connect. Please check if Anki is running with AnkiConnect plugin installed');
				}
			} catch (error) {
				console.error('Anki Connect测试失败:', error);
				new Notice(this.plugin.settings.language === 'zh' ?
					'❌ 连接测试失败，请检查设置和网络' :
					'❌ Connection test failed. Please check settings and network');
			}
		}

		private createSyncColorSelection(container: HTMLElement): void {
			// 清空容器内容，避免重复显示
			const existingColorSelection = container.querySelector('.anki-sync-color-selection');
			if (existingColorSelection) {
				existingColorSelection.remove();
			}

			// 同步颜色选择设置
			const colorSelectionContainer = container.createDiv('anki-sync-color-selection');
			colorSelectionContainer.style.cssText = `
				margin: 16px 0;
				padding: 16px;
				background: var(--background-secondary);
				border-radius: 8px;
				border: 1px solid var(--background-modifier-border);
			`;

			// 标题
			const title = colorSelectionContainer.createEl('h4', {
				text: this.plugin.settings.language === 'zh' ? '同步颜色选择' : 'Sync Color Selection',
				cls: 'setting-item-name'
			});
			title.style.cssText = `
				margin: 0 0 12px 0;
				font-size: 14px;
				font-weight: 600;
				color: var(--text-normal);
			`;

			// 描述
			const desc = colorSelectionContainer.createEl('p', {
				text: this.plugin.settings.language === 'zh' ?
					'选择要同步到Anki的卡片颜色。只有选中颜色的卡片会被同步。' :
					'Select card colors to sync to Anki. Only cards with selected colors will be synced.',
				cls: 'setting-item-description'
			});
			desc.style.cssText = `
				margin: 0 0 16px 0;
				color: var(--text-muted);
				font-size: 13px;
			`;

			// 颜色选择网格
			const colorGrid = colorSelectionContainer.createDiv('anki-color-grid');
			colorGrid.style.cssText = `
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
				gap: 12px;
			`;

			// 可用颜色选项
			const availableColors = [
				{ value: '1', color: '#ff6b6b', name: this.plugin.settings.language === 'zh' ? '红色' : 'Red' },
				{ value: '2', color: '#ffa726', name: this.plugin.settings.language === 'zh' ? '橙色' : 'Orange' },
				{ value: '3', color: '#ffeb3b', name: this.plugin.settings.language === 'zh' ? '黄色' : 'Yellow' },
				{ value: '4', color: '#66bb6a', name: this.plugin.settings.language === 'zh' ? '绿色' : 'Green' },
				{ value: '5', color: '#26c6da', name: this.plugin.settings.language === 'zh' ? '青色' : 'Cyan' },
				{ value: '6', color: '#42a5f5', name: this.plugin.settings.language === 'zh' ? '蓝色' : 'Blue' },
				{ value: '7', color: '#ab47bc', name: this.plugin.settings.language === 'zh' ? '紫色' : 'Purple' }
			];

			availableColors.forEach(colorOption => {
				const isSelected = this.plugin.settings.ankiConnect.syncColors.includes(colorOption.value);

				const colorCard = colorGrid.createDiv('anki-color-card');
				colorCard.style.cssText = `
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 8px 12px;
					border: 2px solid ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
					border-radius: 8px;
					background: ${isSelected ? colorOption.color + '10' : 'var(--background-primary)'};
					cursor: pointer;
					transition: all 0.2s ease;
				`;

				// 颜色圆点
				const colorDot = colorCard.createDiv('color-dot');
				colorDot.style.cssText = `
					width: 16px;
					height: 16px;
					border-radius: 50%;
					background: ${colorOption.color};
					flex-shrink: 0;
				`;

				// 颜色名称
				const colorName = colorCard.createEl('span', {
					text: colorOption.name,
					cls: 'color-name'
				});
				colorName.style.cssText = `
					font-size: 12px;
					font-weight: 500;
					color: var(--text-normal);
				`;

				// 选中状态指示器
				if (isSelected) {
					const checkmark = colorCard.createDiv('checkmark');
					checkmark.innerHTML = '✓';
					checkmark.style.cssText = `
						margin-left: auto;
						color: ${colorOption.color};
						font-weight: bold;
						font-size: 14px;
					`;
				}

				// 点击事件
				colorCard.addEventListener('click', async () => {
					const currentColors = [...this.plugin.settings.ankiConnect.syncColors];
					const isCurrentlySelected = currentColors.includes(colorOption.value);

					if (isCurrentlySelected) {
						// 移除颜色
						const index = currentColors.indexOf(colorOption.value);
						if (index > -1) {
							currentColors.splice(index, 1);
						}
					} else {
						// 添加颜色
						currentColors.push(colorOption.value);
					}

					this.plugin.settings.ankiConnect.syncColors = currentColors;
					await this.plugin.saveSettings();

					// 重新渲染颜色选择界面
					this.createSyncColorSelection(container);
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
						colorCard.style.background = 'var(--background-primary)';
					}
				});
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
			margin: GRID_CONSTANTS.CARD_SPACINGpx 0;
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
		setTimeout(() => {}, PERFORMANCE_CONSTANTS.MINIMAL_DELAY);
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

// Anki同步模态窗
class AnkiSyncModal extends Modal {
	private plugin: CanvasGridPlugin;
	private view: CanvasGridView;

	constructor(app: App, view: CanvasGridView) {
		super(app);
		this.view = view;
		this.plugin = view.plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// 设置模态框标题
		contentEl.createEl('h2', {
			text: this.plugin.settings.language === 'zh' ? 'Anki同步' : 'Anki Sync',
			cls: 'modal-title'
		});

		// 创建主容器
		const mainContainer = contentEl.createDiv('anki-sync-modal-container');
		mainContainer.style.cssText = `
			max-height: 70vh;
			overflow-y: auto;
			padding: 20px 0;
		`;

		// 同步配置区域
		const configContainer = mainContainer.createDiv('anki-sync-config');
		this.createSyncConfigSection(configContainer);

		// 颜色筛选同步
		const colorSyncContainer = mainContainer.createDiv('color-sync-container');
		colorSyncContainer.createEl('h4', {
			text: this.plugin.settings.language === 'zh' ? '颜色同步到Anki' : 'Color Sync to Anki',
			cls: 'anki-section-title'
		});

		// 创建颜色同步选项（简化版）
		this.createSimplifiedColorSyncOptions(colorSyncContainer);

		// 同步历史信息（表格式）
		const historyContainer = mainContainer.createDiv('sync-history-container');
		historyContainer.style.cssText = `
			margin-top: 20px;
		`;
		this.createTableSyncHistoryDisplay(historyContainer);

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

		// 关闭按钮
		const closeBtn = buttonContainer.createEl('button', {
			text: this.plugin.settings.language === 'zh' ? '关闭' : 'Close',
			cls: 'mod-cancel'
		});
		closeBtn.onclick = () => this.close();
	}

	// 创建同步配置区域
	private createSyncConfigSection(container: Element): void {
		const configSection = container.createDiv('anki-sync-config-section');
		configSection.style.cssText = `
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 20px;
			border: 1px solid var(--background-modifier-border);
		`;

		// 牌组选择
		const deckContainer = configSection.createDiv('deck-selection');
		deckContainer.createEl('label', {
			text: this.plugin.settings.language === 'zh' ? '选择牌组:' : 'Select Deck:',
			cls: 'anki-config-label'
		});

		const deckSelect = deckContainer.createEl('select', {
			cls: 'anki-deck-select'
		});
		deckSelect.style.cssText = `
			width: 100%;
			padding: 8px 12px;
			margin-top: 4px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			background: var(--background-primary);
			color: var(--text-normal);
		`;

		// 加载牌组列表
		this.loadDeckOptions(deckSelect);

		// 自动同步选项
		const autoSyncContainer = configSection.createDiv('auto-sync-option');
		autoSyncContainer.style.cssText = `
			display: flex;
			align-items: center;
			gap: 8px;
			margin-top: 12px;
		`;

		const autoSyncCheckbox = autoSyncContainer.createEl('input', {
			type: 'checkbox',
			cls: 'anki-auto-sync-checkbox'
		});
		autoSyncCheckbox.checked = this.plugin.settings.ankiConnect.enableAutoSync || false;

		autoSyncContainer.createEl('label', {
			text: this.plugin.settings.language === 'zh' ? '启用自动同步' : 'Enable Auto Sync',
			cls: 'anki-config-label'
		});

		// 手动同步按钮
		const syncButtonContainer = configSection.createDiv('manual-sync-button');
		syncButtonContainer.style.cssText = `
			margin-top: 16px;
			text-align: center;
		`;

		const syncButton = syncButtonContainer.createEl('button', {
			text: this.plugin.settings.language === 'zh' ? '开始同步' : 'Start Sync',
			cls: 'anki-sync-btn mod-cta'
		});
		syncButton.style.cssText = `
			padding: 10px 20px;
			font-size: 14px;
			font-weight: 500;
		`;

		// 事件监听器
		deckSelect.addEventListener('change', (e) => {
			const target = e.target as HTMLSelectElement;
			this.plugin.settings.ankiConnect.defaultDeck = target.value;
			this.plugin.saveSettings();
		});

		autoSyncCheckbox.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement;
			this.plugin.settings.ankiConnect.enableAutoSync = target.checked;
			this.plugin.saveSettings();
		});

		syncButton.addEventListener('click', async () => {
			await this.startManualSync();
		});
	}

	// 加载牌组选项
	private async loadDeckOptions(selectElement: HTMLSelectElement): Promise<void> {
		try {
			// 创建临时的AnkiConnectManager实例来获取牌组列表
			const { AnkiConnectManager } = await import('./src/managers/AnkiConnectManager');
			const ankiManager = new AnkiConnectManager(this.app, this.plugin.settings.ankiConnect);

			const deckNames: string[] = await ankiManager.getDeckNames();
			selectElement.innerHTML = '';

			deckNames.forEach((deckName: string) => {
				const option = selectElement.createEl('option', {
					value: deckName,
					text: deckName
				});

				if (deckName === this.plugin.settings.ankiConnect.defaultDeck) {
					option.selected = true;
				}
			});

			if (deckNames.length === 0) {
				selectElement.createEl('option', {
					value: '',
					text: this.plugin.settings.language === 'zh' ? '无可用牌组' : 'No decks available'
				});
			}
		} catch (error) {
			console.error('加载牌组列表失败:', error);
			selectElement.createEl('option', {
				value: '',
				text: this.plugin.settings.language === 'zh' ? '加载失败' : 'Failed to load'
			});
		}
	}

	// 开始手动同步
	private async startManualSync(): Promise<void> {
		try {
			if (this.view.syncAllSelectedColorCards) {
				await this.view.syncAllSelectedColorCards();
			}
		} catch (error) {
			console.error('手动同步失败:', error);
			new Notice(this.plugin.settings.language === 'zh' ? '同步失败' : 'Sync failed');
		}
	}

	// 创建简化的颜色同步选项
	private createSimplifiedColorSyncOptions(container: Element): void {
		const colorOptions = [
			{ value: '1', color: '#ff6b6b' },
			{ value: '2', color: '#ffa726' },
			{ value: '3', color: '#ffeb3b' },
			{ value: '4', color: '#66bb6a' },
			{ value: '5', color: '#26c6da' },
			{ value: '6', color: '#42a5f5' },
			{ value: '7', color: '#ab47bc' }
		];

		const colorGrid = container.createDiv('anki-color-sync-grid-simplified');
		colorGrid.style.cssText = `
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			margin: 16px 0;
			justify-content: center;
		`;

		colorOptions.forEach(colorOption => {
			const isSelected = this.plugin.settings.ankiConnect.syncColors.includes(colorOption.value);

			const colorItem = colorGrid.createDiv('anki-color-item-simplified');
			colorItem.style.cssText = `
				display: flex;
				align-items: center;
				gap: 8px;
				cursor: pointer;
				padding: 8px;
				border-radius: 6px;
				transition: background-color 0.2s ease;
			`;

			// 颜色圆点
			const colorDot = colorItem.createDiv('anki-color-dot');
			colorDot.style.cssText = `
				width: 20px;
				height: 20px;
				border-radius: 50%;
				background-color: ${colorOption.color};
				border: 2px solid ${isSelected ? colorOption.color : 'var(--background-modifier-border)'};
				box-shadow: ${isSelected ? `0 0 0 2px ${colorOption.color}40` : 'none'};
				transition: all 0.2s ease;
			`;

			// 勾选图标
			const checkIcon = colorItem.createDiv('anki-color-check');
			checkIcon.style.cssText = `
				width: 16px;
				height: 16px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 12px;
				color: ${isSelected ? colorOption.color : 'var(--text-muted)'};
				transition: color 0.2s ease;
			`;
			checkIcon.textContent = isSelected ? '✓' : '';

			// 点击事件
			colorItem.addEventListener('click', () => {
				const currentColors = [...this.plugin.settings.ankiConnect.syncColors];
				const colorIndex = currentColors.indexOf(colorOption.value);

				if (colorIndex > -1) {
					// 取消选择
					currentColors.splice(colorIndex, 1);
					colorDot.style.border = '2px solid var(--background-modifier-border)';
					colorDot.style.boxShadow = 'none';
					checkIcon.textContent = '';
					checkIcon.style.color = 'var(--text-muted)';
				} else {
					// 选择
					currentColors.push(colorOption.value);
					colorDot.style.border = `2px solid ${colorOption.color}`;
					colorDot.style.boxShadow = `0 0 0 2px ${colorOption.color}40`;
					checkIcon.textContent = '✓';
					checkIcon.style.color = colorOption.color;
				}

				this.plugin.settings.ankiConnect.syncColors = currentColors;
				this.plugin.saveSettings();
			});

			// 悬停效果
			colorItem.addEventListener('mouseenter', () => {
				colorItem.style.backgroundColor = 'var(--background-modifier-hover)';
			});

			colorItem.addEventListener('mouseleave', () => {
				colorItem.style.backgroundColor = 'transparent';
			});
		});
	}

	// 同步所有选中颜色的卡片
	private async syncAllSelectedColorCards(): Promise<void> {
		// 委托给view的方法
		if (this.view.syncAllSelectedColorCards) {
			await this.view.syncAllSelectedColorCards();
		}
	}

	// 创建表格式同步历史显示
	private createTableSyncHistoryDisplay(container: Element): void {
		const historySection = container.createDiv('anki-sync-history-table');
		historySection.createEl('h4', {
			text: this.plugin.settings.language === 'zh' ? '同步历史' : 'Sync History',
			cls: 'anki-section-title'
		});

		// 创建表格容器
		const tableContainer = historySection.createDiv('sync-history-table-container');
		tableContainer.style.cssText = `
			background: var(--background-secondary);
			border-radius: 8px;
			padding: 16px;
			border: 1px solid var(--background-modifier-border);
			overflow-x: auto;
		`;

		// 创建表格
		const table = tableContainer.createEl('table', {
			cls: 'sync-history-table'
		});
		table.style.cssText = `
			width: 100%;
			border-collapse: collapse;
			font-size: 13px;
		`;

		// 表头
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.style.cssText = `
			border-bottom: 2px solid var(--background-modifier-border);
		`;

		const headers = this.plugin.settings.language === 'zh'
			? ['新增卡片', '更新卡片', '跳过卡片', '失败卡片', '同步时间']
			: ['New Cards', 'Updated', 'Skipped', 'Failed', 'Sync Time'];

		headers.forEach(headerText => {
			const th = headerRow.createEl('th');
			th.textContent = headerText;
			th.style.cssText = `
				padding: 12px 8px;
				text-align: center;
				font-weight: 600;
				color: var(--text-normal);
				border-right: 1px solid var(--background-modifier-border);
			`;
		});

		// 表体
		const tbody = table.createEl('tbody');
		const lastResult = this.plugin.settings.ankiSyncHistory.lastSyncResult;
		const lastSyncTime = this.plugin.settings.ankiSyncHistory.lastSyncTime;

		if (lastResult && lastSyncTime) {
			const dataRow = tbody.createEl('tr');
			dataRow.style.cssText = `
				border-bottom: 1px solid var(--background-modifier-border);
			`;

			// 数据单元格
			const data = [
				lastResult.created || 0,
				lastResult.updated || 0,
				lastResult.skipped || 0,
				lastResult.errors?.length || 0,
				new Date(lastSyncTime).toLocaleString()
			];

			data.forEach((cellData, index) => {
				const td = dataRow.createEl('td');
				td.textContent = cellData.toString();
				td.style.cssText = `
					padding: 10px 8px;
					text-align: center;
					color: var(--text-normal);
					border-right: 1px solid var(--background-modifier-border);
				`;

				// 为失败卡片添加错误样式
				if (index === 3 && cellData > 0) {
					td.style.color = 'var(--text-error)';
					td.style.fontWeight = '600';
				}
			});
		} else {
			// 无数据行
			const noDataRow = tbody.createEl('tr');
			const noDataCell = noDataRow.createEl('td');
			noDataCell.setAttribute('colspan', '5');
			noDataCell.textContent = this.plugin.settings.language === 'zh' ? '暂无同步历史' : 'No sync history';
			noDataCell.style.cssText = `
				padding: 20px;
				text-align: center;
				color: var(--text-muted);
				font-style: italic;
			`;
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// ==================== 弃用代码已清理 ====================
// BlockIdGenerator 和 SourceDocumentModifier 已迁移到 BlockReferenceManager

// SourceDocumentModifier 已迁移到 BlockReferenceManager

// ==================== 编辑器已迁移到Obsidian CodeMirror ====================
// RichTextEditor类已被移除，现在使用Obsidian的内置CodeMirror编辑器
// 所有富文本编辑功能现在通过CodeMirror的内置快捷键和扩展提供
