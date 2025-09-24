import { App, TFile, WorkspaceLeaf } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';

/**
 * 持久化文件信息接口
 */
export interface PersistentFileInfo {
    file: TFile;
    leaf: WorkspaceLeaf;
    createdAt: number;
    lastAccessed: number;
    isInUse: boolean;
}

/**
 * 持久化文件管理器配置
 */
export interface PersistentFileManagerConfig {
    fileName: string; // 持久化文件名
    defaultContent: string; // 默认文件内容（注释说明）
    hiddenDirectory: string; // 隐藏目录路径
    enableFileHiding: boolean; // 是否隐藏文件
}

/**
 * 持久化文件管理器
 * 负责管理单一持久化文件的生命周期，通过内容替换实现编辑器复用
 * 
 * 核心优势：
 * - 避免频繁的文件创建和删除操作
 * - 减少异常情况下的文件泄漏风险
 * - 提升编辑器响应性能
 * - 简化文件系统管理
 */
export class PersistentFileManager {
    private static instance: PersistentFileManager | null = null;
    private app: App;
    private config: PersistentFileManagerConfig;
    private persistentFile: PersistentFileInfo | null = null;
    private isInitialized = false;

    private constructor(app: App, config?: Partial<PersistentFileManagerConfig>) {
        this.app = app;
        this.config = {
            fileName: '.canvasgrid-editor-workspace.md',
            defaultContent: this.generateDefaultContent(),
            hiddenDirectory: '.obsidian/plugins/canvasgrid-transit',
            enableFileHiding: true,
            ...config
        };

        DebugManager.log('PersistentFileManager initialized with config:', this.config);
    }

    /**
     * 获取单例实例
     */
    static getInstance(app: App, config?: Partial<PersistentFileManagerConfig>): PersistentFileManager {
        if (!PersistentFileManager.instance) {
            PersistentFileManager.instance = new PersistentFileManager(app, config);
        }
        return PersistentFileManager.instance;
    }

    /**
     * 初始化持久化文件
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            await this.ensurePersistentFile();
            this.isInitialized = true;
            DebugManager.log('PersistentFileManager initialized successfully');
        } catch (error) {
            DebugManager.error('Failed to initialize PersistentFileManager:', error);
            throw new Error(`持久化文件管理器初始化失败: ${error}`);
        }
    }

    /**
     * 准备编辑器文件（清空内容并填充卡片数据）
     */
    async prepareEditorFile(content: string): Promise<TFile> {
        try {
            await this.ensureInitialized();

            if (!this.persistentFile) {
                throw new Error('持久化文件未正确初始化');
            }

            // 更新文件内容为卡片数据
            await this.app.vault.modify(this.persistentFile.file, content);
            
            // 更新使用状态
            this.persistentFile.isInUse = true;
            this.persistentFile.lastAccessed = Date.now();

            DebugManager.log('Prepared editor file with content length:', content.length);
            return this.persistentFile.file;

        } catch (error) {
            DebugManager.error('Failed to prepare editor file:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`编辑器文件准备失败: ${errorMessage}`);
        }
    }

    /**
     * 更新编辑器文件内容
     */
    async updateEditorFile(content: string): Promise<void> {
        if (!this.persistentFile || !this.persistentFile.isInUse) {
            throw new Error('没有活跃的编辑器文件可以更新');
        }

        try {
            await this.app.vault.modify(this.persistentFile.file, content);
            this.persistentFile.lastAccessed = Date.now();
            DebugManager.log('Updated editor file content');
        } catch (error) {
            DebugManager.error('Failed to update editor file:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`编辑器文件更新失败: ${errorMessage}`);
        }
    }

    /**
     * 恢复文件到默认状态（结束编辑时调用）
     */
    async restoreDefaultContent(): Promise<void> {
        if (!this.persistentFile) {
            return;
        }

        try {
            // 恢复默认注释内容
            await this.app.vault.modify(this.persistentFile.file, this.config.defaultContent);
            
            // 更新使用状态
            this.persistentFile.isInUse = false;
            this.persistentFile.lastAccessed = Date.now();

            DebugManager.log('Restored file to default content');
        } catch (error) {
            DebugManager.error('Failed to restore default content:', error);
        }
    }

    /**
     * 获取当前的leaf实例
     */
    getCurrentLeaf(): WorkspaceLeaf | null {
        return this.persistentFile?.leaf || null;
    }

    /**
     * 检查是否有活跃的编辑器文件
     */
    hasActiveEditorFile(): boolean {
        return this.persistentFile?.isInUse || false;
    }

    /**
     * 获取文件状态信息
     */
    getFileStatus(): {
        hasFile: boolean;
        isInUse: boolean;
        fileName?: string;
        age?: number;
        lastAccessed?: number;
    } {
        if (!this.persistentFile) {
            return { hasFile: false, isInUse: false };
        }

        const now = Date.now();
        return {
            hasFile: true,
            isInUse: this.persistentFile.isInUse,
            fileName: this.persistentFile.file.name,
            age: now - this.persistentFile.createdAt,
            lastAccessed: now - this.persistentFile.lastAccessed
        };
    }

    /**
     * 确保持久化文件存在
     */
    private async ensurePersistentFile(): Promise<void> {
        const filePath = this.getFilePath();
        
        // 检查文件是否已存在
        let existingFile = this.app.vault.getAbstractFileByPath(filePath);
        
        if (!existingFile) {
            // 确保目录存在
            await this.ensureDirectory();
            
            // 创建持久化文件
            existingFile = await this.app.vault.create(filePath, this.config.defaultContent);
            DebugManager.log('Created persistent file:', filePath);
        }

        // 创建隐藏的leaf
        const leaf = await this.createHiddenLeaf(existingFile as TFile);

        // 记录文件信息
        this.persistentFile = {
            file: existingFile as TFile,
            leaf: leaf,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            isInUse: false
        };

        // 隐藏文件（如果启用）
        if (this.config.enableFileHiding) {
            this.hideFileFromExplorer();
        }
    }

    /**
     * 确保目录存在
     */
    private async ensureDirectory(): Promise<void> {
        const dirPath = this.config.hiddenDirectory;
        
        try {
            const dirExists = await this.app.vault.adapter.exists(dirPath);
            if (!dirExists) {
                await this.app.vault.createFolder(dirPath);
                DebugManager.log('Created directory:', dirPath);
            }
        } catch (error) {
            DebugManager.warn('Failed to create directory, using root:', error);
            // 如果无法创建目录，回退到根目录
            this.config.hiddenDirectory = '';
        }
    }

    /**
     * 获取完整文件路径
     */
    private getFilePath(): string {
        if (this.config.hiddenDirectory) {
            return `${this.config.hiddenDirectory}/${this.config.fileName}`;
        }
        return this.config.fileName;
    }

    /**
     * 生成默认文件内容
     */
    private generateDefaultContent(): string {
        return `<!-- 
Canvasgrid Transit 编辑器工作文件
此文件由插件自动管理，请勿手动编辑

Editor Workspace File for Canvasgrid Transit Plugin
This file is automatically managed by the plugin, please do not edit manually

创建时间 / Created: ${new Date().toISOString()}
-->

<!-- 插件工作区域 - Plugin Workspace -->
`;
    }

    /**
     * 创建隐藏的leaf
     */
    private async createHiddenLeaf(file: TFile): Promise<WorkspaceLeaf> {
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

        // 打开持久化文件
        await leaf.openFile(file);

        return leaf;
    }

    /**
     * 从文件浏览器隐藏文件
     */
    private hideFileFromExplorer(): void {
        if (!this.persistentFile) return;

        const fileName = this.persistentFile.file.name;
        const filePath = this.persistentFile.file.path;

        // 使用CSS隐藏文件
        const style = document.createElement('style');
        style.id = 'canvasgrid-hide-workspace-file';
        style.textContent = `
            .nav-file-title[data-path="${filePath}"] {
                display: none !important;
            }
            .nav-file-title[data-path*="${fileName}"] {
                display: none !important;
            }
        `;
        
        // 移除旧样式（如果存在）
        const existingStyle = document.getElementById('canvasgrid-hide-workspace-file');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        DebugManager.log('Hidden file from explorer:', fileName);
    }

    /**
     * 确保已初始化
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        try {
            // 恢复默认内容
            await this.restoreDefaultContent();

            // 关闭leaf
            if (this.persistentFile?.leaf && !this.persistentFile.leaf.isDeferred) {
                this.persistentFile.leaf.detach();
            }

            // 移除隐藏样式
            const style = document.getElementById('canvasgrid-hide-workspace-file');
            if (style) {
                style.remove();
            }

            DebugManager.log('PersistentFileManager cleanup completed');
        } catch (error) {
            DebugManager.error('Failed to cleanup PersistentFileManager:', error);
        }
    }

    /**
     * 销毁管理器实例
     */
    static async destroy(): Promise<void> {
        if (PersistentFileManager.instance) {
            await PersistentFileManager.instance.cleanup();
            PersistentFileManager.instance = null;
        }
    }
}
