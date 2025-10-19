/**
 * 持久化文件管理器使用示例
 * 
 * 本示例展示了如何在 Canvasgrid Transit 插件中使用新的持久化文件管理器
 * 来替代传统的临时文件方案，实现更高效的编辑器文件管理。
 */

import { App, Plugin, TFile } from 'obsidian';
import { PersistentFileManager } from '../src/managers/PersistentFileManager';
import { HiddenEditorManager } from '../src/managers/HiddenEditorManager';
import { DebugManager } from '../src/utils/DebugManager';

/**
 * 示例插件类，展示持久化文件管理器的集成
 */
export class ExamplePlugin extends Plugin {
    private persistentFileManager?: PersistentFileManager;
    private hiddenEditorManager?: HiddenEditorManager;

    async onload() {
        console.log('🚀 示例插件加载中...');

        // 1. 初始化持久化文件管理器
        await this.initializePersistentFileManager();

        // 2. 初始化隐藏编辑器管理器
        this.initializeHiddenEditorManager();

        // 3. 添加示例命令
        this.addExampleCommands();

        console.log('✅ 示例插件加载完成');
    }

    async onunload() {
        console.log('🔄 示例插件卸载中...');

        // 清理持久化文件管理器
        if (this.persistentFileManager) {
            await this.persistentFileManager.cleanup();
        }

        // 销毁单例
        await PersistentFileManager.destroy();

        console.log('✅ 示例插件卸载完成');
    }

    /**
     * 初始化持久化文件管理器
     */
    private async initializePersistentFileManager(): Promise<void> {
        try {
            // 获取单例实例（可选配置）
            this.persistentFileManager = PersistentFileManager.getInstance(this.app, {
                fileName: '.example-editor-workspace.md',
                defaultContent: '<!-- 示例编辑器工作文件 -->',
                hiddenDirectory: '.obsidian/plugins/example-plugin',
                enableFileHiding: true
            });

            // 初始化
            await this.persistentFileManager.initialize();
            
            DebugManager.log('持久化文件管理器初始化成功');
        } catch (error) {
            DebugManager.error('持久化文件管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化隐藏编辑器管理器
     */
    private initializeHiddenEditorManager(): void {
        this.hiddenEditorManager = new HiddenEditorManager(this.app);
        
        // 启用持久化文件模式
        this.hiddenEditorManager.setPersistentFileMode(true);
        
        DebugManager.log('隐藏编辑器管理器初始化成功');
    }

    /**
     * 添加示例命令
     */
    private addExampleCommands(): void {
        // 命令1：创建编辑器
        this.addCommand({
            id: 'create-persistent-editor',
            name: '创建持久化编辑器',
            callback: () => this.createPersistentEditor()
        });

        // 命令2：更新编辑器内容
        this.addCommand({
            id: 'update-editor-content',
            name: '更新编辑器内容',
            callback: () => this.updateEditorContent()
        });

        // 命令3：清理编辑器
        this.addCommand({
            id: 'cleanup-editor',
            name: '清理编辑器',
            callback: () => this.cleanupEditor()
        });

        // 命令4：查看文件状态
        this.addCommand({
            id: 'show-file-status',
            name: '查看文件状态',
            callback: () => this.showFileStatus()
        });
    }

    /**
     * 示例1：创建持久化编辑器
     */
    private async createPersistentEditor(): Promise<void> {
        try {
            if (!this.hiddenEditorManager) {
                throw new Error('隐藏编辑器管理器未初始化');
            }

            const cardContent = `# 示例卡片内容

这是一个使用持久化文件管理器的示例卡片。

## 特点
- 无需创建临时文件
- 复用单一工作文件
- 提升性能和稳定性

创建时间: ${new Date().toLocaleString()}
`;

            // 创建编辑器
            const editorContainer = await this.hiddenEditorManager.createHiddenEditor(cardContent);
            
            console.log('✅ 持久化编辑器创建成功');
            console.log('编辑器容器:', editorContainer);

        } catch (error) {
            console.error('❌ 创建编辑器失败:', error);
        }
    }

    /**
     * 示例2：更新编辑器内容
     */
    private async updateEditorContent(): Promise<void> {
        try {
            if (!this.hiddenEditorManager) {
                throw new Error('隐藏编辑器管理器未初始化');
            }

            const newContent = `# 更新的内容

内容已于 ${new Date().toLocaleString()} 更新

## 更新说明
- 使用持久化文件管理器
- 内容实时更新
- 无需重新创建文件
`;

            await this.hiddenEditorManager.updateEditorContent(newContent);
            
            console.log('✅ 编辑器内容更新成功');

        } catch (error) {
            console.error('❌ 更新内容失败:', error);
        }
    }

    /**
     * 示例3：清理编辑器
     */
    private async cleanupEditor(): Promise<void> {
        try {
            if (!this.hiddenEditorManager) {
                throw new Error('隐藏编辑器管理器未初始化');
            }

            await this.hiddenEditorManager.cleanupCurrentEditor();
            
            console.log('✅ 编辑器清理成功');

        } catch (error) {
            console.error('❌ 清理编辑器失败:', error);
        }
    }

    /**
     * 示例4：查看文件状态
     */
    private showFileStatus(): void {
        try {
            if (!this.persistentFileManager) {
                throw new Error('持久化文件管理器未初始化');
            }

            const status = this.persistentFileManager.getFileStatus();
            
            console.log('📊 持久化文件状态:');
            console.log('- 文件存在:', status.hasFile);
            console.log('- 正在使用:', status.isInUse);
            console.log('- 文件名:', status.fileName);
            console.log('- 文件年龄:', status.age ?? 'N/A', 'ms');
            console.log('- 最后访问:', status.lastAccessed ? new Date(status.lastAccessed).toLocaleString() : 'N/A');

            // 检查是否有活跃的编辑器文件
            const hasActiveFile = this.persistentFileManager.hasActiveEditorFile();
            console.log('- 活跃编辑器文件:', hasActiveFile);

        } catch (error) {
            console.error('❌ 获取文件状态失败:', error);
        }
    }
}

/**
 * 高级使用示例：自定义编辑器工作流
 */
export class AdvancedPersistentFileExample {
    private app: App;
    private persistentFileManager: PersistentFileManager;

    constructor(app: App) {
        this.app = app;
        this.persistentFileManager = PersistentFileManager.getInstance(app);
    }

    /**
     * 批量编辑工作流示例
     */
    async batchEditingWorkflow(cardContents: string[]): Promise<void> {
        console.log('🔄 开始批量编辑工作流...');

        try {
            // 确保管理器已初始化
            await this.persistentFileManager.initialize();

            for (let i = 0; i < cardContents.length; i++) {
                const content = cardContents[i];
                
                console.log(`📝 处理第 ${i + 1}/${cardContents.length} 个卡片...`);

                // 准备编辑器文件
                const workspaceFile = await this.persistentFileManager.prepareEditorFile(content);
                
                // 模拟编辑操作
                await this.simulateEditing(workspaceFile, content);
                
                // 恢复默认状态
                await this.persistentFileManager.restoreDefaultContent();
                
                console.log(`✅ 第 ${i + 1} 个卡片处理完成`);
            }

            console.log('🎉 批量编辑工作流完成');

        } catch (error) {
            console.error('❌ 批量编辑工作流失败:', error);
            throw error;
        }
    }

    /**
     * 模拟编辑操作
     */
    private async simulateEditing(file: TFile, content: string): Promise<void> {
        // 模拟编辑延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 模拟内容更新
        const updatedContent = content + '\n\n<!-- 编辑完成 -->';
        await this.persistentFileManager.updateEditorFile(updatedContent);
        
        // 再次模拟延迟
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    /**
     * 性能测试示例
     */
    async performanceTest(iterations: number = 100): Promise<void> {
        console.log(`🚀 开始性能测试 (${iterations} 次迭代)...`);

        const startTime = Date.now();
        
        try {
            await this.persistentFileManager.initialize();

            for (let i = 0; i < iterations; i++) {
                const content = `测试内容 ${i + 1}`;
                
                // 准备文件
                await this.persistentFileManager.prepareEditorFile(content);
                
                // 更新内容
                await this.persistentFileManager.updateEditorFile(content + ' - 已更新');
                
                // 恢复默认状态
                await this.persistentFileManager.restoreDefaultContent();
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log('📊 性能测试结果:');
            console.log(`- 总时间: ${totalTime}ms`);
            console.log(`- 平均时间: ${avgTime.toFixed(2)}ms/次`);
            console.log(`- 吞吐量: ${(1000 / avgTime).toFixed(2)} 次/秒`);

        } catch (error) {
            console.error('❌ 性能测试失败:', error);
            throw error;
        }
    }
}

/**
 * 错误处理和恢复示例
 */
export class ErrorHandlingExample {
    private app: App;
    private persistentFileManager: PersistentFileManager;

    constructor(app: App) {
        this.app = app;
        this.persistentFileManager = PersistentFileManager.getInstance(app);
    }

    /**
     * 错误恢复示例
     */
    async errorRecoveryExample(): Promise<void> {
        try {
            // 尝试初始化
            await this.persistentFileManager.initialize();
            
        } catch (error) {
            console.error('初始化失败，尝试恢复:', error);
            
            // 清理并重试
            await this.persistentFileManager.cleanup();
            await this.persistentFileManager.initialize();
        }

        try {
            // 尝试准备编辑器文件
            await this.persistentFileManager.prepareEditorFile('测试内容');
            
        } catch (error) {
            console.error('文件准备失败，尝试恢复:', error);
            
            // 恢复默认状态并重试
            await this.persistentFileManager.restoreDefaultContent();
            await this.persistentFileManager.prepareEditorFile('恢复后的内容');
        }
    }

    /**
     * 健康检查示例
     */
    async healthCheck(): Promise<boolean> {
        try {
            const status = this.persistentFileManager.getFileStatus();
            
            // 检查文件是否存在
            if (!status.hasFile) {
                console.warn('⚠️ 持久化文件不存在');
                return false;
            }

            // 检查文件年龄（超过1小时可能需要重新初始化）
            const maxAge = 60 * 60 * 1000; // 1小时
            if (status.age && status.age > maxAge) {
                console.warn('⚠️ 持久化文件过旧，建议重新初始化');
                return false;
            }

            console.log('✅ 持久化文件管理器健康状态良好');
            return true;

        } catch (error) {
            console.error('❌ 健康检查失败:', error);
            return false;
        }
    }
}
