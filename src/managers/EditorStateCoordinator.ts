import { App } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';
import { EditorStateManager, EditorState } from './EditorStateManager';
import { TempFileManager } from './TempFileManager';
import { HiddenEditorManager } from './HiddenEditorManager';

/**
 * 编辑器创建选项
 */
export interface EditorCreateOptions {
    nodeId: string;
    content: string;
    onChange?: (content: string) => void;
    onSave?: (content: string) => void;
    onCancel?: () => void;
    enableAutoSave?: boolean;
}

/**
 * 编辑器状态协调器
 *
 * 职责：
 * - 协调多个编辑器实例的创建、销毁和切换
 * - 管理编辑器与Canvas数据的同步
 * - 处理编辑器的业务逻辑（保存、取消、自动保存等）
 * - 协调临时文件管理器和隐藏编辑器管理器
 *
 * 与 EditorStateManager 的关系：
 * - 依赖 EditorStateManager 进行状态数据管理
 * - 负责业务逻辑和多编辑器协调
 * - 处理编辑器生命周期管理
 */
export class EditorStateCoordinator {
    private app: App;
    private editorStateManager: EditorStateManager;
    private tempFileManager: TempFileManager;
    private hiddenEditorManager: HiddenEditorManager;
    private activeEditorNodeId: string | null = null;

    constructor(
        app: App,
        editorStateManager: EditorStateManager
    ) {
        this.app = app;
        this.editorStateManager = editorStateManager;
        this.tempFileManager = TempFileManager.getInstance(app);
        this.hiddenEditorManager = new HiddenEditorManager(app);

        // 启动临时文件定期清理
        this.tempFileManager.startPeriodicCleanup();

        DebugManager.log('EditorStateCoordinator initialized');
    }

    /**
     * 创建简化的编辑器实例（官方Canvas风格）
     */
    async createEditor(options: EditorCreateOptions): Promise<HTMLElement> {
        try {
            // 🎯 简化：确保同时只有一个编辑器活跃
            if (this.activeEditorNodeId && this.activeEditorNodeId !== options.nodeId) {
                await this.cleanupEditor(this.activeEditorNodeId);
            }

            // 🎯 简化：直接创建编辑器，减少中间层
            const editorContainer = await this.hiddenEditorManager.createHiddenEditor(options.content);

            // 🎯 简化：直接设置事件监听器，无需复杂的状态管理
            this.setupSimplifiedEventListeners(options);

            // 记录活跃编辑器
            this.activeEditorNodeId = options.nodeId;

            // 存储清理函数到容器
            (editorContainer as any).cleanup = () => {
                this.cleanupEditor(options.nodeId);
            };

            // 🎯 简化：延迟聚焦，确保编辑器准备就绪
            setTimeout(() => {
                this.hiddenEditorManager.focusEditor();
            }, 50); // 减少延迟时间

            DebugManager.log('Simplified editor created for node:', options.nodeId);
            return editorContainer;

        } catch (error) {
            DebugManager.error('Failed to create simplified editor:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`编辑器创建失败: ${errorMessage}`);
        }
    }

    /**
     * 🎯 优化：同步编辑器状态 - 确保所有管理器及时更新
     */
    syncEditorState(nodeId: string, content: string): void {
        if (this.activeEditorNodeId !== nodeId) {
            DebugManager.warn('Attempting to sync inactive editor:', nodeId);
            return;
        }

        try {
            DebugManager.log('🔄 开始同步编辑器状态', {
                nodeId,
                contentLength: content.length,
                contentPreview: content.substring(0, 50) + (content.length > 50 ? '...' : '')
            });

            // 1. 更新编辑器状态管理器（核心状态）
            this.editorStateManager.updateContent(nodeId, {
                text: content,
                type: 'text',
                id: nodeId,
                x: 0, y: 0, width: 200, height: 100 // 提供默认值
            });
            DebugManager.log('✅ 编辑器状态管理器已同步', { nodeId });

            // 2. 更新隐藏编辑器内容（UI层同步）
            const currentContent = this.hiddenEditorManager.getEditorContent();
            if (currentContent !== content) {
                this.hiddenEditorManager.setEditorContent(content);
                DebugManager.log('✅ 隐藏编辑器内容已同步', { nodeId });
            }

            // 3. 触发状态变化通知（让其他组件知道状态已变化）
            this.notifyStateChange(nodeId, content);

            DebugManager.log('🎉 编辑器状态同步完成', { nodeId });

        } catch (error) {
            DebugManager.error('❌ 编辑器状态同步失败', { nodeId, error });
        }
    }

    /**
     * 🎯 新增：通知状态变化 - 让其他组件及时响应
     */
    private notifyStateChange(nodeId: string, content: string): void {
        try {
            // 这里可以添加状态变化的事件通知
            // 例如：通知主视图更新、通知缓存管理器等
            DebugManager.log('📢 状态变化通知已发送', { nodeId, contentLength: content.length });
        } catch (error) {
            DebugManager.error('❌ 状态变化通知失败', { nodeId, error });
        }
    }

    /**
     * 获取编辑器内容
     */
    getEditorContent(nodeId: string): string {
        if (this.activeEditorNodeId !== nodeId) {
            DebugManager.warn('Attempting to get content from inactive editor:', nodeId);
            return '';
        }

        return this.hiddenEditorManager.getEditorContent();
    }

    /**
     * 检查编辑器是否活跃
     */
    isEditorActive(nodeId: string): boolean {
        return this.activeEditorNodeId === nodeId && this.hiddenEditorManager.hasActiveEditor();
    }

    /**
     * 获取当前活跃编辑器的节点ID
     */
    getActiveEditorNodeId(): string | null {
        return this.activeEditorNodeId;
    }

    /**
     * 清理指定编辑器（简化版本，官方Canvas风格）
     * 🎯 修复：返回清理结果，包含编辑内容
     */
    async cleanupEditor(nodeId: string, saveChanges: boolean = false): Promise<{content?: string, success: boolean}> {
        try {
            if (this.activeEditorNodeId !== nodeId) {
                DebugManager.log('Editor not active, skipping cleanup:', nodeId);
                return { success: true };
            }

            // 🎯 关键修复：在清理前获取编辑器内容
            let editorContent: string | undefined;
            try {
                editorContent = this.hiddenEditorManager.getEditorContent();
                DebugManager.log('📝 获取编辑器内容成功', {
                    nodeId,
                    contentLength: editorContent?.length || 0,
                    contentPreview: editorContent?.substring(0, 50) + (editorContent && editorContent.length > 50 ? '...' : '')
                });
            } catch (contentError) {
                DebugManager.warn('⚠️ 获取编辑器内容失败，使用空内容', { nodeId, error: contentError });
                editorContent = '';
            }

            // 🎯 简化：直接清理编辑器，减少中间层
            await this.hiddenEditorManager.cleanupCurrentEditor();

            // 重置活跃编辑器
            this.activeEditorNodeId = null;

            DebugManager.log('✅ 简化编辑器清理完成', {
                nodeId,
                hasContent: !!editorContent,
                contentLength: editorContent?.length || 0
            });

            return { content: editorContent, success: true };

        } catch (error) {
            DebugManager.error('❌ 编辑器清理失败:', error);
            // 🎯 简化：即使出错也要重置状态，避免状态残留
            this.activeEditorNodeId = null;
            return { success: false };
        }
    }

    /**
     * 清理所有编辑器
     */
    async cleanupAllEditors(): Promise<void> {
        try {
            if (this.activeEditorNodeId) {
                await this.cleanupEditor(this.activeEditorNodeId, false);
            }

            // 强制清理所有资源
            await this.hiddenEditorManager.forceCleanup();
            await this.tempFileManager.forceCleanup();

            DebugManager.log('All editors cleaned up');

        } catch (error) {
            DebugManager.error('Failed to cleanup all editors:', error);
        }
    }

    /**
     * 设置简化的编辑器事件监听器（官方Canvas风格）
     */
    private setupSimplifiedEventListeners(options: EditorCreateOptions): void {
        const { nodeId, onChange, onSave, onCancel } = options;

        this.hiddenEditorManager.addEditorEventListeners(
            // onChange 处理器 - 简化，直接调用
            (content: string) => {
                if (onChange) {
                    onChange(content);
                }
            },
            // onSave 处理器 - 简化，减少异步复杂性
            (content: string) => {
                try {
                    if (onSave) {
                        onSave(content);
                    }
                } catch (error) {
                    DebugManager.error('Error in save handler:', error);
                }
            },
            // onCancel 处理器 - 简化，减少异步复杂性
            () => {
                try {
                    if (onCancel) {
                        onCancel();
                    }
                } catch (error) {
                    DebugManager.error('Error in cancel handler:', error);
                }
            }
        );
    }

    /**
     * 设置编辑器事件监听器（保留向后兼容）
     */
    private setupEditorEventListeners(options: EditorCreateOptions, editorState: EditorState): void {
        // 重定向到简化版本
        this.setupSimplifiedEventListeners(options);
    }

    /**
     * 获取编辑器状态信息
     */
    getEditorStatusInfo(): {
        hasActiveEditor: boolean;
        activeNodeId: string | null;
        editorStatus: any;
        tempFileStatus: any;
        stateManagerStatus: any;
    } {
        return {
            hasActiveEditor: this.activeEditorNodeId !== null,
            activeNodeId: this.activeEditorNodeId,
            editorStatus: this.hiddenEditorManager.getEditorStatus(),
            tempFileStatus: this.tempFileManager.getTempFileStatus(),
            stateManagerStatus: {
                hasActiveEditors: this.editorStateManager.hasActiveEditors(),
                hasUnsavedChanges: this.editorStateManager.hasUnsavedChanges(),
                activeEditorIds: this.editorStateManager.getActiveEditorIds()
            }
        };
    }

    /**
     * 异常恢复
     */
    async recoverFromException(): Promise<void> {
        try {
            DebugManager.log('Starting editor coordinator exception recovery...');

            // 清理所有编辑器
            await this.cleanupAllEditors();

            // 恢复临时文件管理器
            await this.tempFileManager.recoverFromException();

            // 重置状态
            this.activeEditorNodeId = null;

            DebugManager.log('Editor coordinator exception recovery completed');

        } catch (error) {
            DebugManager.error('Editor coordinator exception recovery failed:', error);
        }
    }

    /**
     * 检查系统健康状态
     */
    checkSystemHealth(): {
        isHealthy: boolean;
        issues: string[];
        recommendations: string[];
    } {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // 检查状态一致性
        const hasActiveEditor = this.hiddenEditorManager.hasActiveEditor();
        const hasActiveTempFile = this.tempFileManager.hasActiveTempFile();
        const hasActiveStateManager = this.editorStateManager.hasActiveEditors();

        if (hasActiveEditor !== hasActiveTempFile) {
            issues.push('编辑器和临时文件状态不一致');
            recommendations.push('执行异常恢复');
        }

        if (hasActiveEditor !== hasActiveStateManager) {
            issues.push('编辑器和状态管理器状态不一致');
            recommendations.push('同步编辑器状态');
        }

        if (this.activeEditorNodeId && !hasActiveEditor) {
            issues.push('记录的活跃编辑器与实际状态不符');
            recommendations.push('重置编辑器状态');
        }

        const isHealthy = issues.length === 0;

        return {
            isHealthy,
            issues,
            recommendations
        };
    }

    /**
     * 销毁协调器
     */
    async destroy(): Promise<void> {
        try {
            await this.cleanupAllEditors();
            this.tempFileManager.stopPeriodicCleanup();
            DebugManager.log('EditorStateCoordinator destroyed');
        } catch (error) {
            DebugManager.error('Failed to destroy EditorStateCoordinator:', error);
        }
    }
}
