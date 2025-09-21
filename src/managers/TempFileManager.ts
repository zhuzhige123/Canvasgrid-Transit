import { App, TFile, WorkspaceLeaf } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';

/**
 * 临时文件信息接口
 */
export interface TempFileInfo {
    file: TFile;
    leaf: WorkspaceLeaf;
    createdAt: number;
    lastAccessed: number;
}

/**
 * 临时文件管理器配置
 */
export interface TempFileManagerConfig {
    maxAge: number; // 临时文件最大存活时间（毫秒）
    cleanupInterval: number; // 清理检查间隔（毫秒）
    filePrefix: string; // 临时文件前缀
    enablePeriodicCleanup: boolean; // 是否启用定期清理
}

/**
 * 临时文件管理器
 * 负责管理单一临时文件的生命周期，确保资源正确清理
 */
export class TempFileManager {
    private static instance: TempFileManager | null = null;
    private app: App;
    private config: TempFileManagerConfig;
    private currentTempFile: TempFileInfo | null = null;
    private cleanupInterval: NodeJS.Timeout | null = null;
    private isCleaningUp = false;

    private constructor(app: App, config?: Partial<TempFileManagerConfig>) {
        this.app = app;
        this.config = {
            maxAge: 300000, // 5分钟
            cleanupInterval: 60000, // 1分钟检查一次
            filePrefix: 'canvasgrid-temp-editor',
            enablePeriodicCleanup: true,
            ...config
        };

        DebugManager.log('TempFileManager initialized with config:', this.config);
    }

    /**
     * 获取单例实例
     */
    static getInstance(app: App, config?: Partial<TempFileManagerConfig>): TempFileManager {
        if (!TempFileManager.instance) {
            TempFileManager.instance = new TempFileManager(app, config);
        }
        return TempFileManager.instance;
    }

    /**
     * 创建临时文件（确保单一文件策略）
     */
    async createTempFile(content: string): Promise<TFile> {
        try {
            // 如果已有临时文件，先清理
            if (this.currentTempFile) {
                await this.cleanupCurrentTempFile();
            }

            // 创建新的临时文件
            const tempFileName = `${this.config.filePrefix}-${Date.now()}.md`;
            const tempFile = await this.app.vault.create(tempFileName, content);

            // 创建隐藏的leaf（不在主工作区显示）
            const leaf = await this.createHiddenLeaf(tempFile);

            // 记录临时文件信息
            this.currentTempFile = {
                file: tempFile,
                leaf: leaf,
                createdAt: Date.now(),
                lastAccessed: Date.now()
            };

            DebugManager.log('Created temp file:', tempFileName);
            return tempFile;

        } catch (error) {
            DebugManager.error('Failed to create temp file:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`临时文件创建失败: ${errorMessage}`);
        }
    }

    /**
     * 更新临时文件内容
     */
    async updateTempFile(content: string): Promise<void> {
        if (!this.currentTempFile) {
            throw new Error('没有活跃的临时文件可以更新');
        }

        try {
            await this.app.vault.modify(this.currentTempFile.file, content);
            this.currentTempFile.lastAccessed = Date.now();
            DebugManager.log('Updated temp file content');
        } catch (error) {
            DebugManager.error('Failed to update temp file:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`临时文件更新失败: ${errorMessage}`);
        }
    }

    /**
     * 获取当前临时文件
     */
    getCurrentTempFile(): TFile | null {
        if (this.currentTempFile) {
            this.currentTempFile.lastAccessed = Date.now();
            return this.currentTempFile.file;
        }
        return null;
    }

    /**
     * 获取当前临时文件的leaf
     */
    getCurrentLeaf(): WorkspaceLeaf | null {
        return this.currentTempFile?.leaf || null;
    }

    /**
     * 清理当前临时文件
     */
    async cleanupCurrentTempFile(): Promise<void> {
        if (!this.currentTempFile || this.isCleaningUp) {
            return;
        }

        this.isCleaningUp = true;

        try {
            const { file, leaf } = this.currentTempFile;

            // 移除事件监听器
            this.app.workspace.off('editor-change', this.handleEditorChange);

            // 关闭leaf
            if (leaf && !leaf.isDeferred) {
                leaf.detach();
            }

            // 删除临时文件
            if (await this.app.vault.adapter.exists(file.path)) {
                await this.app.fileManager.trashFile(file);
            }

            this.currentTempFile = null;
            DebugManager.log('Cleaned up temp file:', file.path);

        } catch (error) {
            DebugManager.error('Failed to cleanup temp file:', error);
        } finally {
            this.isCleaningUp = false;
        }
    }

    /**
     * 创建隐藏的leaf（不在主工作区显示）
     */
    private async createHiddenLeaf(tempFile: TFile): Promise<WorkspaceLeaf> {
        // 创建一个隐藏的容器
        const hiddenContainer = document.createElement('div');
        hiddenContainer.style.display = 'none';
        hiddenContainer.style.position = 'absolute';
        hiddenContainer.style.top = '-9999px';
        hiddenContainer.style.left = '-9999px';
        document.body.appendChild(hiddenContainer);

        // 在隐藏容器中创建leaf
        const leaf = this.app.workspace.createLeafInParent(
            this.app.workspace.rootSplit, 
            0
        );

        // 将leaf的DOM元素移到隐藏容器中
        if ((leaf as any).containerEl) {
            hiddenContainer.appendChild((leaf as any).containerEl);
        }

        // 打开临时文件
        await leaf.openFile(tempFile);

        return leaf;
    }

    /**
     * 编辑器变化处理器
     */
    private handleEditorChange = (): void => {
        if (this.currentTempFile) {
            this.currentTempFile.lastAccessed = Date.now();
        }
    };

    /**
     * 异常恢复机制
     */
    async recoverFromException(): Promise<void> {
        try {
            DebugManager.log('Starting exception recovery...');

            // 查找所有可能的临时文件
            const allFiles = this.app.vault.getFiles();
            const tempFiles = allFiles.filter(file => 
                file.name.startsWith(this.config.filePrefix)
            );

            // 清理所有临时文件
            for (const file of tempFiles) {
                try {
                    await this.app.fileManager.trashFile(file);
                    DebugManager.log('Recovered temp file:', file.path);
                } catch (error) {
                    DebugManager.error('Failed to recover temp file:', file.path, error);
                }
            }

            // 重置当前状态
            this.currentTempFile = null;
            this.isCleaningUp = false;

            DebugManager.log('Exception recovery completed');

        } catch (error) {
            DebugManager.error('Exception recovery failed:', error);
        }
    }

    /**
     * 启动定期清理
     */
    startPeriodicCleanup(): void {
        if (!this.config.enablePeriodicCleanup || this.cleanupInterval) {
            return;
        }

        this.cleanupInterval = setInterval(async () => {
            await this.performPeriodicCleanup();
        }, this.config.cleanupInterval);

        DebugManager.log('Started periodic cleanup');
    }

    /**
     * 停止定期清理
     */
    stopPeriodicCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            DebugManager.log('Stopped periodic cleanup');
        }
    }

    /**
     * 执行定期清理
     */
    private async performPeriodicCleanup(): Promise<void> {
        if (!this.currentTempFile) {
            return;
        }

        const now = Date.now();
        const age = now - this.currentTempFile.lastAccessed;

        // 如果临时文件超过最大存活时间，清理它
        if (age > this.config.maxAge) {
            DebugManager.log('Temp file expired, cleaning up...');
            await this.cleanupCurrentTempFile();
        }
    }

    /**
     * 检查是否有活跃的临时文件
     */
    hasActiveTempFile(): boolean {
        return this.currentTempFile !== null;
    }

    /**
     * 获取临时文件状态信息
     */
    getTempFileStatus(): {
        hasActive: boolean;
        fileName?: string;
        age?: number;
        lastAccessed?: number;
    } {
        if (!this.currentTempFile) {
            return { hasActive: false };
        }

        const now = Date.now();
        return {
            hasActive: true,
            fileName: this.currentTempFile.file.name,
            age: now - this.currentTempFile.createdAt,
            lastAccessed: now - this.currentTempFile.lastAccessed
        };
    }

    /**
     * 强制清理所有资源
     */
    async forceCleanup(): Promise<void> {
        try {
            this.stopPeriodicCleanup();
            await this.cleanupCurrentTempFile();
            await this.recoverFromException();
            DebugManager.log('Force cleanup completed');
        } catch (error) {
            DebugManager.error('Force cleanup failed:', error);
        }
    }

    /**
     * 销毁管理器实例
     */
    static destroy(): void {
        if (TempFileManager.instance) {
            TempFileManager.instance.forceCleanup();
            TempFileManager.instance = null;
        }
    }
}
