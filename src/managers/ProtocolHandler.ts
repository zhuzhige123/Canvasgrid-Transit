import { App, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { CanvasNode } from '../types/CanvasTypes';
import { CanvasAPIAdapter, NodeFocusResult, FocusOptions } from '../adapters/CanvasAPIAdapter';
import { DebugManager } from '../utils/DebugManager';

/**
 * 协议参数接口
 */
export interface ProtocolParams {
    action: 'open-canvas' | 'focus-node';
    file: string;
    nodeId?: string;
    x?: string;
    y?: string;
    vault?: string;
    fallback?: string;
    highlight?: string;
    animation?: string;
}

/**
 * 聚焦结果接口 (继承自CanvasAPIAdapter)
 */
export type FocusResult = NodeFocusResult;

/**
 * 增强的协议处理器
 * 负责处理obsidian://canvasgrid-transit协议请求
 */
export class ProtocolHandler {
    private app: App;
    private debugMode: boolean = true;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * 处理协议请求的主入口
     */
    async handleProtocolRequest(params: Record<string, string>): Promise<void> {
        const startTime = Date.now();
        
        try {
            this.log('=== Protocol Request Started ===', params);
            
            // 验证和解析参数
            const validatedParams = this.validateAndParseParams(params);
            if (!validatedParams) {
                new Notice('协议参数无效');
                return;
            }

            // 根据action执行不同操作
            switch (validatedParams.action) {
                case 'focus-node':
                    await this.handleFocusNode(validatedParams);
                    break;
                case 'open-canvas':
                    await this.handleOpenCanvas(validatedParams);
                    break;
                default:
                    new Notice(`不支持的操作: ${validatedParams.action}`);
            }

            this.log(`Protocol request completed in ${Date.now() - startTime}ms`);
        } catch (error) {
            console.error('Protocol handler error:', error);
            new Notice('协议处理失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
    }

    /**
     * 验证和解析协议参数
     */
    private validateAndParseParams(params: Record<string, string>): ProtocolParams | null {
        try {
            // 提取基础参数
            const { file, nodeId, x, y, vault, fallback, highlight, animation } = params;
            
            if (!file) {
                this.log('Missing required parameter: file');
                return null;
            }

            // 确定操作类型
            const action: ProtocolParams['action'] = nodeId ? 'focus-node' : 'open-canvas';

            const validatedParams: ProtocolParams = {
                action,
                file: decodeURIComponent(file),
                nodeId: nodeId ? decodeURIComponent(nodeId) : undefined,
                x: x || undefined,
                y: y || undefined,
                vault: vault ? decodeURIComponent(vault) : undefined,
                fallback: fallback || 'true',
                highlight: highlight || 'true',
                animation: animation || 'true'
            };

            this.log('Validated params:', validatedParams);
            return validatedParams;
        } catch (error) {
            this.log('Parameter validation failed:', error);
            return null;
        }
    }

    /**
     * 处理节点聚焦请求
     */
    private async handleFocusNode(params: ProtocolParams): Promise<void> {
        if (!params.nodeId) {
            new Notice('缺少节点ID参数');
            return;
        }

        const startTime = Date.now();
        new Notice('正在定位节点...', 2000);

        try {
            // 1. 查找Canvas文件
            const canvasFile = this.findCanvasFile(params.file);
            if (!canvasFile) {
                new Notice(`找不到Canvas文件: ${params.file}`);
                return;
            }

            // 2. 打开Canvas文件
            const leaf = await this.openCanvasFile(canvasFile);
            if (!leaf) {
                new Notice('无法打开Canvas文件');
                return;
            }

            // 3. 等待Canvas加载完成
            const canvasReady = await this.waitForCanvasReady(leaf);
            if (!canvasReady) {
                new Notice('Canvas加载超时');
                return;
            }

            // 4. 添加额外延迟确保Canvas完全准备就绪
            await new Promise(resolve => setTimeout(resolve, 300));

            // 5. 执行节点聚焦
            const focusOptions: FocusOptions = {
                highlight: params.highlight === 'true',
                animation: params.animation === 'true',
                padding: 100,
                retryAttempts: 3,
                retryDelay: 500
            };

            const result = await this.focusCanvasNode(leaf, params.nodeId, focusOptions);
            
            if (result.success) {
                new Notice(`已聚焦到节点 (${result.method})`, 3000);
                this.log(`Focus successful: ${result.method} in ${result.executionTime}ms`);
            } else {
                // 降级处理
                if (params.fallback === 'true') {
                    new Notice('聚焦失败，已打开Canvas文件', 3000);
                } else {
                    new Notice('节点聚焦失败: ' + (result.error || '未知错误'));
                }
            }

        } catch (error) {
            console.error('Focus node failed:', error);
            new Notice('节点聚焦失败');
        }
    }

    /**
     * 处理打开Canvas请求
     */
    private async handleOpenCanvas(params: ProtocolParams): Promise<void> {
        try {
            const canvasFile = this.findCanvasFile(params.file);
            if (!canvasFile) {
                new Notice(`找不到Canvas文件: ${params.file}`);
                return;
            }

            await this.openCanvasFile(canvasFile);
            new Notice(`已打开Canvas文件: ${canvasFile.basename}`);
        } catch (error) {
            console.error('Open canvas failed:', error);
            new Notice('打开Canvas文件失败');
        }
    }

    /**
     * 查找Canvas文件
     */
    private findCanvasFile(filePath: string): TFile | null {
        try {
            // 尝试直接路径
            let file = this.app.vault.getAbstractFileByPath(filePath);
            if (file && file instanceof TFile) {
                return file;
            }

            // 尝试添加.canvas扩展名
            if (!filePath.endsWith('.canvas')) {
                file = this.app.vault.getAbstractFileByPath(filePath + '.canvas');
                if (file && file instanceof TFile) {
                    return file;
                }
            }

            // 尝试在所有Canvas文件中查找
            const canvasFiles = this.app.vault.getFiles().filter(f => f.extension === 'canvas');
            const matchingFile = canvasFiles.find(f => 
                f.path === filePath || 
                f.path.endsWith('/' + filePath) ||
                f.basename === filePath.replace('.canvas', '')
            );

            return matchingFile || null;
        } catch (error) {
            this.log('Find canvas file failed:', error);
            return null;
        }
    }

    /**
     * 打开Canvas文件
     */
    private async openCanvasFile(file: TFile): Promise<WorkspaceLeaf | null> {
        try {
            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(file);
            return leaf;
        } catch (error) {
            this.log('Open canvas file failed:', error);
            return null;
        }
    }

    /**
     * 等待Canvas准备就绪
     */
    private async waitForCanvasReady(leaf: WorkspaceLeaf, timeout: number = 5000): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const view = leaf.view as any;
                if (view && view.canvas && view.canvas.nodes) {
                    this.log('Canvas is ready');
                    return true;
                }
            } catch (error) {
                // 继续等待
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.log('Canvas ready timeout');
        return false;
    }

    /**
     * 聚焦Canvas节点 - 使用CanvasAPIAdapter实现
     */
    private async focusCanvasNode(leaf: WorkspaceLeaf, nodeId: string, options: FocusOptions): Promise<FocusResult> {
        try {
            // 创建Canvas API适配器
            const adapter = new CanvasAPIAdapter(leaf);

            // 检查API可用性
            if (!adapter.isAvailable()) {
                this.log('Canvas API not available');
                return {
                    success: false,
                    method: 'fallback',
                    error: 'Canvas API not available',
                    nodeFound: false,
                    canvasLoaded: false,
                    executionTime: 0
                };
            }

            this.log(`Using Canvas API version: ${adapter.getVersion()}`);

            // 使用适配器聚焦节点
            const result = await adapter.focusNode(nodeId, options);

            this.log('Focus result:', result);
            return result;
        } catch (error) {
            this.log('Focus canvas node failed:', error);
            return {
                success: false,
                method: 'fallback',
                error: error instanceof Error ? error.message : 'Unknown error',
                nodeFound: false,
                canvasLoaded: true,
                executionTime: 0
            };
        }
    }

    /**
     * 调试日志
     */
    private log(message: string, data?: any): void {
        if (this.debugMode) {
            DebugManager.log(`[ProtocolHandler] ${message}`, data || '');
        }
    }

    /**
     * 设置调试模式
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }
}
