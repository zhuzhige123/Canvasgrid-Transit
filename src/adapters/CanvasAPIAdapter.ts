import { WorkspaceLeaf } from 'obsidian';
import { CanvasNode } from '../types/CanvasTypes';

/**
 * 边界框接口
 */
export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * 聚焦选项接口
 */
export interface FocusOptions {
    highlight?: boolean;
    animation?: boolean;
    padding?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

/**
 * 节点聚焦结果接口
 */
export interface NodeFocusResult {
    success: boolean;
    method: 'zoomToBbox' | 'zoomToSelection' | 'viewport' | 'scroll' | 'fallback';
    nodeFound: boolean;
    canvasLoaded: boolean;
    error?: string;
    executionTime: number;
}

/**
 * Canvas API适配器接口
 */
export interface ICanvasAPIAdapter {
    isAvailable(): boolean;
    getVersion(): string;
    focusNode(nodeId: string, options?: FocusOptions): Promise<NodeFocusResult>;
    selectNode(nodeId: string): Promise<boolean>;
    zoomToNode(nodeId: string, padding?: number): Promise<boolean>;
    highlightNode(nodeId: string, duration?: number): Promise<void>;
}

/**
 * Canvas API适配器实现
 * 封装不同版本Obsidian Canvas API的差异，提供统一接口
 */
export class CanvasAPIAdapter implements ICanvasAPIAdapter {
    private leaf: WorkspaceLeaf;
    private canvas: any;
    private debugMode: boolean = true;

    constructor(leaf: WorkspaceLeaf) {
        this.leaf = leaf;
        this.canvas = this.getCanvasAPI(leaf);
    }

    /**
     * 获取Canvas API实例
     */
    private getCanvasAPI(leaf: WorkspaceLeaf): any {
        try {
            const view = leaf.view as any;

            // 尝试多种方式获取Canvas API
            if (view?.canvas) {
                this.log('Canvas API found via view.canvas');
                return view.canvas;
            }

            if (view?.canvasView?.canvas) {
                this.log('Canvas API found via view.canvasView.canvas');
                return view.canvasView.canvas;
            }

            if (view?.renderer?.canvas) {
                this.log('Canvas API found via view.renderer.canvas');
                return view.renderer.canvas;
            }

            this.log('Canvas API not found');
            return null;
        } catch (error) {
            this.log('Error getting Canvas API:', error);
            return null;
        }
    }

    /**
     * 检查Canvas API是否可用
     */
    isAvailable(): boolean {
        return !!(this.canvas && typeof this.canvas === 'object');
    }

    /**
     * 获取Canvas版本信息
     */
    getVersion(): string {
        try {
            // 尝试检测Canvas版本
            if (this.canvas?.version) {
                return this.canvas.version;
            }
            
            // 通过API方法检测版本
            const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.canvas) || {});
            if (methods.includes('zoomToBbox')) {
                return 'modern';
            } else if (methods.includes('zoomToSelection')) {
                return 'legacy';
            }
            
            return 'unknown';
        } catch (error) {
            return 'error';
        }
    }

    /**
     * 聚焦到指定节点
     */
    async focusNode(nodeId: string, options: FocusOptions = {}): Promise<NodeFocusResult> {
        const startTime = Date.now();
        const defaultOptions: Required<FocusOptions> = {
            highlight: true,
            animation: true,
            padding: 100,
            retryAttempts: 3,
            retryDelay: 500,
            ...options
        };

        this.log(`Focusing node: ${nodeId}`, defaultOptions);

        if (!this.isAvailable()) {
            return {
                success: false,
                method: 'fallback',
                error: 'Canvas API not available',
                nodeFound: false,
                canvasLoaded: false,
                executionTime: Date.now() - startTime
            };
        }

        // 尝试多种聚焦策略
        const strategies = [
            () => this.focusWithZoomToBbox(nodeId, defaultOptions),
            () => this.focusWithPanTo(nodeId, defaultOptions),
            () => this.focusWithZoomToSelection(nodeId, defaultOptions),
            () => this.focusWithViewport(nodeId, defaultOptions),
            () => this.focusWithScroll(nodeId, defaultOptions)
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                const result = await strategies[i]();
                if (result.success) {
                    // 添加高亮效果
                    if (defaultOptions.highlight) {
                        await this.highlightNode(nodeId, 2000);
                    }
                    
                    result.executionTime = Date.now() - startTime;
                    this.log(`Focus successful with strategy ${i + 1}: ${result.method}`);
                    return result;
                }
            } catch (error) {
                this.log(`Strategy ${i + 1} failed:`, error);
                continue;
            }
        }

        // 所有策略都失败
        return {
            success: false,
            method: 'fallback',
            error: 'All focus strategies failed',
            nodeFound: this.findCanvasNode(nodeId) !== null,
            canvasLoaded: true,
            executionTime: Date.now() - startTime
        };
    }

    /**
     * 策略1: 使用zoomToBbox方法 - 基于成功实现
     */
    private async focusWithZoomToBbox(nodeId: string, options: Required<FocusOptions>): Promise<NodeFocusResult> {
        try {
            if (!this.canvas?.zoomToBbox) {
                throw new Error('zoomToBbox method not available');
            }

            // 查找节点数据
            const nodeData = await this.findCanvasNodeData(nodeId);
            if (!nodeData) {
                return {
                    success: false,
                    method: 'zoomToBbox',
                    error: 'Node not found',
                    nodeFound: false,
                    canvasLoaded: true,
                    executionTime: 0
                };
            }

            this.log('Found node data:', nodeData);

            // 1. 清除现有选择
            if (this.canvas.deselectAll) {
                this.log('Clearing selection...');
                this.canvas.deselectAll();
            }

            // 2. 选择目标节点
            if (this.canvas.selectNode) {
                this.log('Selecting node:', nodeId);
                try {
                    this.canvas.selectNode(nodeId);
                } catch (error) {
                    this.log('selectNode failed:', error);
                }
            }

            // 3. 计算最佳边界框
            const bbox = this.calculateOptimalBbox(nodeData, options.padding);
            this.log('Calculated bbox:', bbox);

            // 4. 缩放到边界框
            this.log('Zooming to bbox...');
            this.canvas.zoomToBbox(bbox);

            return {
                success: true,
                method: 'zoomToBbox',
                nodeFound: true,
                canvasLoaded: true,
                executionTime: 0
            };
        } catch (error) {
            this.log('zoomToBbox strategy failed:', error);
            throw error;
        }
    }

    /**
     * 策略2: 使用panTo方法 - 基于成功实现
     */
    private async focusWithPanTo(nodeId: string, options: Required<FocusOptions>): Promise<NodeFocusResult> {
        try {
            if (!this.canvas?.panTo) {
                throw new Error('panTo method not available');
            }

            // 查找节点数据
            const nodeData = await this.findCanvasNodeData(nodeId);
            if (!nodeData) {
                return {
                    success: false,
                    method: 'viewport',
                    error: 'Node not found',
                    nodeFound: false,
                    canvasLoaded: true,
                    executionTime: 0
                };
            }

            this.log('Using panTo as fallback...');
            const centerX = nodeData.x + nodeData.width / 2;
            const centerY = nodeData.y + nodeData.height / 2;

            try {
                this.canvas.panTo(centerX, centerY);
                return {
                    success: true,
                    method: 'viewport',
                    nodeFound: true,
                    canvasLoaded: true,
                    executionTime: 0
                };
            } catch (error) {
                this.log('panTo failed:', error);
                throw error;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * 策略3: 使用zoomToSelection方法
     */
    private async focusWithZoomToSelection(nodeId: string, options: Required<FocusOptions>): Promise<NodeFocusResult> {
        try {
            if (!this.canvas.zoomToSelection) {
                throw new Error('zoomToSelection method not available');
            }

            const node = this.findCanvasNode(nodeId);
            if (!node) {
                return {
                    success: false,
                    method: 'zoomToSelection',
                    error: 'Node not found',
                    nodeFound: false,
                    canvasLoaded: true,
                    executionTime: 0
                };
            }

            // 清除现有选择
            if (this.canvas.deselectAll) {
                this.canvas.deselectAll();
            }

            // 添加到选择
            if (this.canvas.addToSelection) {
                this.canvas.addToSelection(node);
            } else if (this.canvas.selectNode) {
                this.canvas.selectNode(nodeId);
            }

            // 缩放到选择
            this.canvas.zoomToSelection();

            return {
                success: true,
                method: 'zoomToSelection',
                nodeFound: true,
                canvasLoaded: true,
                executionTime: 0
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 策略3: 直接操作viewport
     */
    private async focusWithViewport(nodeId: string, options: Required<FocusOptions>): Promise<NodeFocusResult> {
        try {
            const node = this.findCanvasNode(nodeId);
            if (!node) {
                return {
                    success: false,
                    method: 'viewport',
                    error: 'Node not found',
                    nodeFound: false,
                    canvasLoaded: true,
                    executionTime: 0
                };
            }

            // 尝试直接设置视口
            const viewport = this.canvas.viewport || this.canvas.view;
            if (!viewport) {
                throw new Error('Viewport not available');
            }

            const centerX = node.x + node.width / 2;
            const centerY = node.y + node.height / 2;

            // 尝试不同的视口设置方法
            if (viewport.setCenter) {
                viewport.setCenter(centerX, centerY);
            } else if (viewport.panTo) {
                viewport.panTo(centerX, centerY);
            } else if (typeof viewport.x !== 'undefined' && typeof viewport.y !== 'undefined') {
                viewport.x = -centerX + (viewport.width || 800) / 2;
                viewport.y = -centerY + (viewport.height || 600) / 2;
            } else {
                throw new Error('No viewport manipulation method available');
            }

            return {
                success: true,
                method: 'viewport',
                nodeFound: true,
                canvasLoaded: true,
                executionTime: 0
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 策略4: DOM滚动方法
     */
    private async focusWithScroll(nodeId: string, options: Required<FocusOptions>): Promise<NodeFocusResult> {
        try {
            const nodeElement = this.findNodeElement(nodeId);
            if (!nodeElement) {
                return {
                    success: false,
                    method: 'scroll',
                    error: 'Node element not found',
                    nodeFound: false,
                    canvasLoaded: true,
                    executionTime: 0
                };
            }

            // 滚动到节点
            nodeElement.scrollIntoView({ 
                behavior: options.animation ? 'smooth' : 'auto', 
                block: 'center',
                inline: 'center'
            });

            // 模拟点击选择
            nodeElement.click();

            return {
                success: true,
                method: 'scroll',
                nodeFound: true,
                canvasLoaded: true,
                executionTime: 0
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 选择节点
     */
    async selectNode(nodeId: string): Promise<boolean> {
        try {
            if (this.canvas.selectNode) {
                this.canvas.selectNode(nodeId);
                return true;
            }

            const node = this.findCanvasNode(nodeId);
            if (node && this.canvas.addToSelection) {
                this.canvas.addToSelection(node);
                return true;
            }

            return false;
        } catch (error) {
            this.log('Select node failed:', error);
            return false;
        }
    }

    /**
     * 缩放到节点
     */
    async zoomToNode(nodeId: string, padding: number = 100): Promise<boolean> {
        try {
            const node = this.findCanvasNode(nodeId);
            if (!node) return false;

            const bbox = this.calculateNodeBbox(node, padding);
            
            if (this.canvas.zoomToBbox) {
                this.canvas.zoomToBbox(bbox);
                return true;
            }

            return false;
        } catch (error) {
            this.log('Zoom to node failed:', error);
            return false;
        }
    }

    /**
     * 高亮节点
     */
    async highlightNode(nodeId: string, duration: number = 2000): Promise<void> {
        try {
            const nodeElement = this.findNodeElement(nodeId);
            if (!nodeElement) return;

            // 添加高亮样式
            const originalOutline = nodeElement.style.outline;
            const originalBoxShadow = nodeElement.style.boxShadow;
            
            nodeElement.style.outline = '3px solid var(--interactive-accent)';
            nodeElement.style.boxShadow = '0 0 20px var(--interactive-accent)';
            nodeElement.style.transition = 'all 0.3s ease';

            // 定时移除高亮
            setTimeout(() => {
                if (nodeElement) {
                    nodeElement.style.outline = originalOutline;
                    nodeElement.style.boxShadow = originalBoxShadow;
                    nodeElement.style.transition = '';
                }
            }, duration);
        } catch (error) {
            this.log('Highlight node failed:', error);
        }
    }

    /**
     * 查找Canvas节点对象
     */
    private findCanvasNode(nodeId: string): any {
        try {
            if (this.canvas.nodes && this.canvas.nodes.get) {
                return this.canvas.nodes.get(nodeId);
            }

            if (this.canvas.nodes && Array.isArray(this.canvas.nodes)) {
                return this.canvas.nodes.find((node: any) => node.id === nodeId);
            }

            return null;
        } catch (error) {
            this.log('Find canvas node failed:', error);
            return null;
        }
    }

    /**
     * 查找节点DOM元素
     */
    private findNodeElement(nodeId: string): HTMLElement | null {
        try {
            const container = (this.leaf as any).containerEl || this.leaf.view?.containerEl;
            
            // 尝试多种选择器
            const selectors = [
                `[data-node-id="${nodeId}"]`,
                `[data-id="${nodeId}"]`,
                `.canvas-node[data-node-id="${nodeId}"]`,
                `.canvas-node[data-id="${nodeId}"]`
            ];

            for (const selector of selectors) {
                const element = container.querySelector(selector) as HTMLElement;
                if (element) return element;
            }

            return null;
        } catch (error) {
            this.log('Find node element failed:', error);
            return null;
        }
    }

    /**
     * 计算节点边界框
     */
    private calculateNodeBbox(node: any, padding: number): BoundingBox {
        return {
            minX: node.x - padding,
            minY: node.y - padding,
            maxX: node.x + node.width + padding,
            maxY: node.y + node.height + padding
        };
    }

    /**
     * 计算最佳聚焦边界框 - 基于成功实现
     */
    private calculateOptimalBbox(node: any, padding: number = 100): BoundingBox {
        return {
            minX: node.x - padding,
            minY: node.y - padding,
            maxX: node.x + node.width + padding,
            maxY: node.y + node.height + padding
        };
    }

    /**
     * 查找Canvas节点数据 - 增强版本
     */
    private async findCanvasNodeData(nodeId: string): Promise<any> {
        try {
            // 方法1: 通过Canvas API查找
            const canvasNode = this.findCanvasNode(nodeId);
            if (canvasNode) {
                this.log('Found node via Canvas API');
                return canvasNode;
            }

            // 方法2: 通过Canvas文件数据查找
            const canvasData = await this.getCanvasFileData();
            if (canvasData?.nodes) {
                for (const node of canvasData.nodes) {
                    if (node.id === nodeId) {
                        this.log('Found node via file data');
                        return node;
                    }
                }
            }

            this.log('Node not found:', nodeId);
            return null;
        } catch (error) {
            this.log('Error finding node data:', error);
            return null;
        }
    }

    /**
     * 获取Canvas文件数据
     */
    private async getCanvasFileData(): Promise<any> {
        try {
            const view = this.leaf.view as any;
            const file = view?.file;

            if (!file) {
                this.log('No file found in view');
                return null;
            }

            const content = await this.leaf.view.app.vault.read(file);
            const canvasData = JSON.parse(content);

            this.log('Canvas file data loaded');
            return canvasData;
        } catch (error) {
            this.log('Error loading canvas file data:', error);
            return null;
        }
    }

    /**
     * 调试日志
     */
    private log(message: string, data?: any): void {
        if (this.debugMode) {
            console.log(`[CanvasAPIAdapter] ${message}`, data || '');
        }
    }

    /**
     * 设置调试模式
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }
}
