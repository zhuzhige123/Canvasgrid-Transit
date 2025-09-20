import { App, Component, MarkdownRenderer } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';

// 渲染缓存项接口
interface RenderCacheItem {
    element: HTMLElement;
    timestamp: number;
    hash: string;
}

// 内容复杂度分析结果
interface ContentComplexity {
    hasMarkdownFeatures: boolean;
    hasLinks: boolean;
    hasTags: boolean;
    hasEmbeds: boolean;
    hasMath: boolean;
    hasCodeBlocks: boolean;
    complexity: 'simple' | 'medium' | 'complex';
}

// 渲染配置接口
interface RenderConfig {
    enableCache: boolean;
    cacheTimeout: number; // 毫秒
    maxCacheSize: number;
    enableLazyLoading: boolean;
    performanceMonitoring: boolean;
}

// 渲染性能指标
interface RenderMetrics {
    renderTime: number;
    cacheHits: number;
    cacheMisses: number;
    totalRenders: number;
    averageRenderTime: number;
}

/**
 * Obsidian渲染引擎管理器
 * 负责统一管理Markdown内容的渲染，提供缓存、性能优化和生命周期管理
 */
export class ObsidianRenderManager {
    private app: App;
    private config: RenderConfig;
    private componentPool: Component[] = [];
    private activeComponents: Set<Component> = new Set();
    private renderCache: Map<string, RenderCacheItem> = new Map();
    private metrics: RenderMetrics;
    // 🎯 新增：容器→组件的弱引用映射，用于生命周期管理
    private containerComponents: WeakMap<HTMLElement, Component> = new WeakMap();

    constructor(app: App, config?: Partial<RenderConfig>) {
        this.app = app;
        this.config = {
            enableCache: true,
            cacheTimeout: 2 * 60 * 1000, // 🎯 优化：降低为2分钟
            maxCacheSize: 30, // 🎯 优化：降低缓存大小
            enableLazyLoading: true,
            performanceMonitoring: true,
            ...config
        };

        this.metrics = {
            renderTime: 0,
            cacheHits: 0,
            cacheMisses: 0,
            totalRenders: 0,
            averageRenderTime: 0
        };

        DebugManager.log('✅ ObsidianRenderManager initialized', this.config);
    }

    /**
     * 渲染Markdown内容到指定容器
     */
    async renderMarkdownContent(
        content: string,
        container: HTMLElement,
        sourcePath: string = '',
        nodeId?: string
    ): Promise<void> {
        const startTime = performance.now();

        try {
            // 🎯 修复：渲染前先释放容器已关联的组件
            this.disposeContainer(container);

            DebugManager.log('🎨 开始渲染Markdown内容', {
                nodeId,
                contentLength: content.length,
                contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            });

            // 分析内容复杂度
            const complexity = this.analyzeContentComplexity(content);
            DebugManager.log('📊 内容复杂度分析', { nodeId, complexity });

            // 检查缓存
            if (this.config.enableCache) {
                const cached = this.getCachedContent(content);
                if (cached) {
                    container.empty();
                    container.appendChild(cached.cloneNode(true) as HTMLElement);
                    this.metrics.cacheHits++;
                    DebugManager.log('⚡ 使用缓存内容', { nodeId, cacheHits: this.metrics.cacheHits });
                    return;
                }
                this.metrics.cacheMisses++;
            }

            // 清空容器
            container.empty();

            // 根据复杂度选择渲染策略
            if (complexity.hasMarkdownFeatures) {
                await this.renderWithObsidianEngine(content, container, sourcePath, nodeId);
            } else {
                this.renderSimpleText(content, container, nodeId);
            }

            // 缓存渲染结果
            if (this.config.enableCache && complexity.hasMarkdownFeatures) {
                this.cacheRenderedContent(content, container);
            }

        } catch (error) {
            DebugManager.error('❌ Markdown渲染失败', { nodeId, error });
            this.renderErrorFallback(container, content, error as Error);
        } finally {
            const renderTime = performance.now() - startTime;
            this.updateMetrics(renderTime);
            
            if (this.config.performanceMonitoring) {
                DebugManager.log('📈 渲染性能指标', {
                    nodeId,
                    renderTime: `${renderTime.toFixed(2)}ms`,
                    metrics: this.metrics
                });
            }
        }
    }

    /**
     * 使用Obsidian渲染引擎渲染复杂内容
     */
    private async renderWithObsidianEngine(
        content: string,
        container: HTMLElement,
        sourcePath: string,
        nodeId?: string
    ): Promise<void> {
        const component = this.getOrCreateComponent();

        try {
            // 使用Obsidian官方MarkdownRenderer
            await MarkdownRenderer.renderMarkdown(
                content,
                container,
                sourcePath,
                component
            );

            // 🎯 修复：渲染成功后，将组件与容器关联
            this.containerComponents.set(container, component);

            // 添加卡片特定样式
            container.addClass('canvas-card-markdown-content');

            // 处理链接点击事件
            this.setupLinkHandlers(container, nodeId);

            DebugManager.log('✅ Obsidian引擎渲染完成', { nodeId });

        } catch (error) {
            DebugManager.error('❌ Obsidian引擎渲染失败', { nodeId, error });
            // 🎯 修复：渲染失败时释放组件
            this.releaseComponent(component);
            // 降级到简单文本渲染
            this.renderSimpleText(content, container, nodeId);
        }
    }

    /**
     * 渲染简单文本内容
     */
    private renderSimpleText(content: string, container: HTMLElement, nodeId?: string): void {
        container.textContent = content;
        container.addClass('canvas-card-simple-text');
        container.style.cssText = `
            color: var(--text-normal);
            line-height: 1.5;
            overflow-wrap: break-word;
            white-space: pre-wrap;
        `;
        
        DebugManager.log('✅ 简单文本渲染完成', { nodeId });
    }

    /**
     * 渲染错误降级处理
     */
    private renderErrorFallback(container: HTMLElement, content: string, error: Error): void {
        container.empty();
        
        const errorDiv = container.createDiv('render-error-fallback');
        errorDiv.style.cssText = `
            color: var(--text-error);
            font-style: italic;
            padding: 8px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            background: var(--background-secondary);
        `;
        
        errorDiv.createDiv('error-message').textContent = '渲染失败，显示原始内容';
        errorDiv.createDiv('error-content').textContent = content;
        
        DebugManager.error('🚨 渲染错误降级', { error: error.message });
    }

    /**
     * 分析内容复杂度
     */
    private analyzeContentComplexity(content: string): ContentComplexity {
        const hasLinks = /\[\[.*?\]\]/.test(content);
        const hasTags = /#[\w-]+/.test(content);
        const hasEmbeds = /!\[\[.*?\]\]/.test(content);
        const hasMath = /\$.*?\$/.test(content);
        const hasCodeBlocks = /```[\s\S]*?```|`[^`]+`/.test(content);
        const hasMarkdown = /[*_~`#>-]/.test(content);

        const hasMarkdownFeatures = hasLinks || hasTags || hasEmbeds || hasMath || hasCodeBlocks || hasMarkdown;

        let complexity: 'simple' | 'medium' | 'complex' = 'simple';
        if (hasMarkdownFeatures) {
            complexity = (hasMath || hasEmbeds || hasCodeBlocks) ? 'complex' : 'medium';
        }

        return {
            hasMarkdownFeatures,
            hasLinks,
            hasTags,
            hasEmbeds,
            hasMath,
            hasCodeBlocks,
            complexity
        };
    }

    /**
     * 获取或创建Component实例
     */
    private getOrCreateComponent(): Component {
        // 尝试从池中获取可用的Component
        let component = this.componentPool.pop();
        
        if (!component) {
            component = new Component();
        }
        
        this.activeComponents.add(component);
        return component;
    }

    /**
     * 释放Component实例
     */
    private releaseComponent(component: Component): void {
        this.activeComponents.delete(component);
        
        // 清理Component状态
        component.unload();
        component.load();
        
        // 返回到池中复用
        if (this.componentPool.length < 10) { // 限制池大小
            this.componentPool.push(component);
        }
    }

    /**
     * 设置链接处理器
     */
    private setupLinkHandlers(container: HTMLElement, nodeId?: string): void {
        const links = container.querySelectorAll('a.internal-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    DebugManager.log('🔗 内部链接点击', { nodeId, href });
                    // 这里可以添加链接跳转逻辑
                    this.app.workspace.openLinkText(href, '');
                }
            });
        });
    }

    /**
     * 缓存渲染内容
     */
    private cacheRenderedContent(content: string, container: HTMLElement): void {
        const hash = this.generateContentHash(content);
        const clonedElement = container.cloneNode(true) as HTMLElement;
        
        this.renderCache.set(hash, {
            element: clonedElement,
            timestamp: Date.now(),
            hash
        });

        // 清理过期缓存
        this.cleanupCache();
    }

    /**
     * 获取缓存内容
     */
    private getCachedContent(content: string): HTMLElement | null {
        const hash = this.generateContentHash(content);
        const cached = this.renderCache.get(hash);
        
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
            return cached.element;
        }
        
        if (cached) {
            this.renderCache.delete(hash);
        }
        
        return null;
    }

    /**
     * 生成内容哈希
     */
    private generateContentHash(content: string): string {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash.toString(36);
    }

    /**
     * 清理过期缓存
     */
    private cleanupCache(): void {
        const now = Date.now();
        const toDelete: string[] = [];
        
        for (const [hash, item] of this.renderCache) {
            if (now - item.timestamp > this.config.cacheTimeout) {
                toDelete.push(hash);
            }
        }
        
        toDelete.forEach(hash => this.renderCache.delete(hash));
        
        // 如果缓存过大，删除最旧的项目
        if (this.renderCache.size > this.config.maxCacheSize) {
            const entries = Array.from(this.renderCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
            toRemove.forEach(([hash]) => this.renderCache.delete(hash));
        }
    }

    /**
     * 更新性能指标
     */
    private updateMetrics(renderTime: number): void {
        this.metrics.totalRenders++;
        this.metrics.renderTime += renderTime;
        this.metrics.averageRenderTime = this.metrics.renderTime / this.metrics.totalRenders;
    }

    /**
     * 获取性能指标
     */
    getMetrics(): RenderMetrics {
        return { ...this.metrics };
    }

    /**
     * 🎯 新增：释放特定容器关联的组件
     */
    disposeContainer(container: HTMLElement): void {
        const component = this.containerComponents.get(container);
        if (component) {
            DebugManager.log('🧹 释放容器关联的组件', {
                containerClass: container.className,
                activeComponentsCount: this.activeComponents.size
            });

            // 从映射中移除
            this.containerComponents.delete(container);

            // 释放组件
            this.releaseComponent(component);
        }
    }

    /**
     * 🎯 新增：获取统计信息
     */
    getStats(): {
        activeComponents: number;
        poolSize: number;
        cacheSize: number;
        cacheHits: number;
        cacheMisses: number;
        averageRenderTime: number;
    } {
        return {
            activeComponents: this.activeComponents.size,
            poolSize: this.componentPool.length,
            cacheSize: this.renderCache.size,
            cacheHits: this.metrics.cacheHits,
            cacheMisses: this.metrics.cacheMisses,
            averageRenderTime: this.metrics.averageRenderTime
        };
    }

    /**
     * 🎯 新增：更新配置
     */
    updateConfig(newConfig: Partial<RenderConfig>): void {
        this.config = { ...this.config, ...newConfig };
        DebugManager.log('🔧 ObsidianRenderManager配置已更新', this.config);
    }

    /**
     * 清理所有资源
     */
    cleanup(): void {
        // 清理所有活动的Component
        this.activeComponents.forEach(component => {
            component.unload();
        });
        this.activeComponents.clear();

        // 清理Component池
        this.componentPool.forEach(component => {
            component.unload();
        });
        this.componentPool.length = 0;

        // 清理缓存
        this.renderCache.clear();

        DebugManager.log('🧹 ObsidianRenderManager 资源清理完成');
    }
}
