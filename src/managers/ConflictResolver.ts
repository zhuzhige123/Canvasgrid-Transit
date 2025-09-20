import { App, Modal, Setting, Notice } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';

/**
 * 冲突解决策略
 */
export type ConflictResolutionStrategy = 'keep-local' | 'use-remote' | 'merge' | 'ask-user';

/**
 * 冲突解决结果
 */
export interface ConflictResolution {
    strategy: ConflictResolutionStrategy;
    mergedContent?: any;
    userChoice?: boolean;
    cancelled?: boolean;
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
    filePath: string;
    localVersion: any;
    remoteVersion: any;
    hasActiveEditors: boolean;
    lastModified: number;
}

/**
 * 冲突解决器
 * 负责检测和解决编辑冲突
 */
export class ConflictResolver {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * 检测冲突
     */
    async detectConflict(
        filePath: string,
        localVersion: any,
        remoteVersion: any
    ): Promise<boolean> {
        try {
            // 简单的内容比较
            const localHash = this.generateContentHash(localVersion);
            const remoteHash = this.generateContentHash(remoteVersion);
            
            const hasConflict = localHash !== remoteHash;
            
            if (hasConflict) {
                DebugManager.log('Conflict detected for file:', filePath);
            }
            
            return hasConflict;
        } catch (error) {
            DebugManager.error('Error detecting conflict:', error);
            return false;
        }
    }

    /**
     * 解决冲突
     */
    async resolveConflict(conflictInfo: ConflictInfo): Promise<ConflictResolution> {
        try {
            // 如果没有活跃编辑器，自动使用远程版本
            if (!conflictInfo.hasActiveEditors) {
                DebugManager.log('No active editors, using remote version');
                return {
                    strategy: 'use-remote',
                    userChoice: false
                };
            }

            // 尝试自动合并
            const mergeResult = this.attemptAutoMerge(
                conflictInfo.localVersion,
                conflictInfo.remoteVersion
            );

            if (mergeResult.success) {
                DebugManager.log('Auto-merge successful');
                return {
                    strategy: 'merge',
                    mergedContent: mergeResult.mergedContent
                };
            }

            // 需要用户干预
            DebugManager.log('Conflict requires user intervention');
            return await this.showConflictDialog(conflictInfo);

        } catch (error) {
            DebugManager.error('Error resolving conflict:', error);
            return {
                strategy: 'keep-local',
                cancelled: true
            };
        }
    }

    /**
     * 尝试自动合并
     */
    private attemptAutoMerge(localVersion: any, remoteVersion: any): {
        success: boolean;
        mergedContent?: any;
    } {
        try {
            // 检查是否只是简单的节点添加/删除
            if (this.canAutoMerge(localVersion, remoteVersion)) {
                const merged = this.performAutoMerge(localVersion, remoteVersion);
                return {
                    success: true,
                    mergedContent: merged
                };
            }

            return { success: false };
        } catch (error) {
            DebugManager.error('Auto-merge failed:', error);
            return { success: false };
        }
    }

    /**
     * 检查是否可以自动合并
     */
    private canAutoMerge(localVersion: any, remoteVersion: any): boolean {
        if (!localVersion.nodes || !remoteVersion.nodes) {
            return false;
        }

        // 获取节点ID集合
        const localIds = new Set(localVersion.nodes.map((n: any) => n.id));
        const remoteIds = new Set(remoteVersion.nodes.map((n: any) => n.id));

        // 检查是否有相同节点的内容冲突
        for (const id of localIds) {
            if (remoteIds.has(id)) {
                const localNode = localVersion.nodes.find((n: any) => n.id === id);
                const remoteNode = remoteVersion.nodes.find((n: any) => n.id === id);
                
                // 如果相同节点有不同内容，不能自动合并
                if (JSON.stringify(localNode) !== JSON.stringify(remoteNode)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 执行自动合并
     */
    private performAutoMerge(localVersion: any, remoteVersion: any): any {
        const merged = JSON.parse(JSON.stringify(localVersion));
        
        // 合并节点
        const localIds = new Set(localVersion.nodes.map((n: any) => n.id));
        
        for (const remoteNode of remoteVersion.nodes) {
            if (!localIds.has(remoteNode.id)) {
                // 添加远程版本中的新节点
                merged.nodes.push(remoteNode);
            }
        }

        // 合并边（如果存在）
        if (remoteVersion.edges && localVersion.edges) {
            const localEdgeIds = new Set(localVersion.edges.map((e: any) => e.id));
            
            for (const remoteEdge of remoteVersion.edges) {
                if (!localEdgeIds.has(remoteEdge.id)) {
                    merged.edges.push(remoteEdge);
                }
            }
        }

        return merged;
    }

    /**
     * 显示冲突解决对话框
     */
    private async showConflictDialog(conflictInfo: ConflictInfo): Promise<ConflictResolution> {
        return new Promise((resolve) => {
            const modal = new ConflictResolutionModal(
                this.app,
                conflictInfo,
                (resolution) => resolve(resolution)
            );
            modal.open();
        });
    }

    /**
     * 生成内容哈希
     */
    private generateContentHash(content: any): string {
        try {
            return JSON.stringify(content);
        } catch (error) {
            return String(content);
        }
    }
}

/**
 * 冲突解决对话框
 */
class ConflictResolutionModal extends Modal {
    private conflictInfo: ConflictInfo;
    private onResolve: (resolution: ConflictResolution) => void;

    constructor(
        app: App,
        conflictInfo: ConflictInfo,
        onResolve: (resolution: ConflictResolution) => void
    ) {
        super(app);
        this.conflictInfo = conflictInfo;
        this.onResolve = onResolve;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: '检测到编辑冲突' });
        
        contentEl.createEl('p', { 
            text: `文件 "${this.conflictInfo.filePath}" 在外部被修改，但您有未保存的本地更改。` 
        });

        contentEl.createEl('p', { 
            text: '请选择如何处理这个冲突：' 
        });

        // 选项容器
        const optionsContainer = contentEl.createDiv('conflict-resolution-options');

        // 保留本地更改
        new Setting(optionsContainer)
            .setName('保留我的更改')
            .setDesc('忽略外部更改，保存您的本地修改')
            .addButton(btn => btn
                .setButtonText('保留本地')
                .setCta()
                .onClick(() => {
                    this.resolve({
                        strategy: 'keep-local',
                        userChoice: true
                    });
                })
            );

        // 使用外部更改
        new Setting(optionsContainer)
            .setName('使用外部更改')
            .setDesc('丢弃您的本地修改，使用外部版本')
            .addButton(btn => btn
                .setButtonText('使用外部')
                .setWarning()
                .onClick(() => {
                    this.resolve({
                        strategy: 'use-remote',
                        userChoice: true
                    });
                })
            );

        // 取消
        new Setting(optionsContainer)
            .addButton(btn => btn
                .setButtonText('取消')
                .onClick(() => {
                    this.resolve({
                        strategy: 'keep-local',
                        cancelled: true
                    });
                })
            );
    }

    private resolve(resolution: ConflictResolution) {
        this.close();
        this.onResolve(resolution);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
