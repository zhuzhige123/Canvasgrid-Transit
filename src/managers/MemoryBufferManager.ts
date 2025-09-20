import { DebugManager } from '../utils/DebugManager';
import { DocumentState, ChangeOperation } from './EditorStateManager';

/**
 * 内存缓冲接口
 */
export interface MemoryBuffer {
    documentState: DocumentState;
    pendingChanges: ChangeOperation[];
    autoSaveScheduled: boolean;
    lastAutoSaveTime: number;
}

/**
 * 保存触发器类型
 */
export type SaveTrigger = 'blur' | 'manual' | 'app-close' | 'view-switch' | 'file-close' | 'auto';

/**
 * 保存配置
 */
export interface SaveConfig {
    autoSaveDelay: number;
    maxPendingChanges: number;
    enableAutoSave: boolean;
    saveOnBlur: boolean;
    saveOnViewSwitch: boolean;
}

/**
 * 内存缓冲管理器
 * 负责管理内存缓冲区，实现延迟保存策略
 */
export class MemoryBufferManager {
    private memoryBuffer: MemoryBuffer | null = null;
    private saveConfig: SaveConfig;
    private autoSaveTimer: NodeJS.Timeout | null = null;
    private saveCallbacks: ((trigger: SaveTrigger) => Promise<void>)[] = [];
    private changeListeners: ((hasChanges: boolean) => void)[] = [];

    constructor(config?: Partial<SaveConfig>) {
        this.saveConfig = {
            autoSaveDelay: 0, // 立即保存，移除延迟
            maxPendingChanges: 100,
            enableAutoSave: false, // 禁用自动保存，采用立即保存策略
            saveOnBlur: false, // 禁用失焦保存，避免与官方Canvas冲突
            saveOnViewSwitch: false, // 禁用视图切换保存
            ...config
        };

        DebugManager.log('MemoryBufferManager initialized with Canvas-compatible config:', this.saveConfig);
    }

    /**
     * 初始化内存缓冲区
     */
    initializeBuffer(documentState: DocumentState): void {
        this.memoryBuffer = {
            documentState: JSON.parse(JSON.stringify(documentState)),
            pendingChanges: [],
            autoSaveScheduled: false,
            lastAutoSaveTime: Date.now()
        };
        
        DebugManager.log('Memory buffer initialized for:', documentState.filePath);
    }

    /**
     * 应用变更到内存缓冲区
     */
    applyChange(operation: ChangeOperation): void {
        if (!this.memoryBuffer) {
            DebugManager.warn('Cannot apply change: memory buffer not initialized');
            return;
        }

        // 添加到待处理变更列表
        this.memoryBuffer.pendingChanges.push(operation);
        
        // 应用到内存版本
        this.applyToMemoryVersion(operation);
        
        // 标记为有未保存变更
        this.markAsUnsaved();

        // Canvas兼容模式：不调度延迟保存，由上层决定保存时机
        
        DebugManager.log('Applied change to memory buffer:', operation.id);
    }

    /**
     * 立即保存（移除延迟调度机制）
     */
    async triggerImmediateSave(): Promise<void> {
        if (!this.memoryBuffer) {
            DebugManager.warn('Cannot trigger immediate save: memory buffer not initialized');
            return;
        }

        // 立即触发保存，无延迟
        await this.triggerSave('manual');
        DebugManager.log('Immediate save triggered (Canvas-compatible mode)');
    }

    /**
     * 清理定时器（保留方法以维持接口兼容性）
     */
    cancelAutoSave(): void {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }

        if (this.memoryBuffer) {
            this.memoryBuffer.autoSaveScheduled = false;
        }

        DebugManager.log('Timer cleanup completed (Canvas-compatible mode)');
    }

    /**
     * 手动触发保存
     */
    async triggerSave(trigger: SaveTrigger): Promise<void> {
        if (!this.memoryBuffer) {
            DebugManager.warn('Cannot trigger save: memory buffer not initialized');
            return;
        }

        DebugManager.log('Triggering save with trigger:', trigger);

        // 通知所有保存回调
        for (const callback of this.saveCallbacks) {
            try {
                await callback(trigger);
            } catch (error) {
                DebugManager.error('Error in save callback:', error);
            }
        }

        // 更新最后保存时间
        this.memoryBuffer.lastAutoSaveTime = Date.now();
    }

    /**
     * 标记变更已保存
     */
    markChangesSaved(): void {
        if (!this.memoryBuffer) return;

        // 清空待处理变更
        this.memoryBuffer.pendingChanges = [];

        // 标记为已保存
        this.memoryBuffer.documentState.hasUnsavedChanges = false;

        // 更新文件版本为内存版本
        this.memoryBuffer.documentState.fileVersion = JSON.parse(
            JSON.stringify(this.memoryBuffer.documentState.memoryVersion)
        );

        this.memoryBuffer.documentState.lastSyncTime = Date.now();

        // 通知变更监听器
        this.notifyChangeListeners();

        DebugManager.log('Changes marked as saved');
    }

    /**
     * 检查是否应该自动保存
     */
    shouldAutoSave(): boolean {
        if (!this.memoryBuffer || !this.saveConfig.enableAutoSave) {
            return false;
        }

        // 检查是否有未保存变更
        if (!this.memoryBuffer.documentState.hasUnsavedChanges) {
            return false;
        }

        // 检查是否有活跃编辑器（如果有，延迟保存）
        if (this.memoryBuffer.documentState.activeEditors.size > 0) {
            // 如果编辑器活跃时间过长，仍然执行保存
            const timeSinceLastSave = Date.now() - this.memoryBuffer.lastAutoSaveTime;
            return timeSinceLastSave > this.saveConfig.autoSaveDelay * 3;
        }

        return true;
    }

    /**
     * 获取内存缓冲区状态
     */
    getBufferState(): MemoryBuffer | null {
        return this.memoryBuffer;
    }

    /**
     * 获取待处理变更数量
     */
    getPendingChangesCount(): number {
        return this.memoryBuffer?.pendingChanges.length || 0;
    }

    /**
     * 检查是否有未保存变更
     */
    hasUnsavedChanges(): boolean {
        return this.memoryBuffer?.documentState.hasUnsavedChanges || false;
    }

    /**
     * 获取内存版本数据
     */
    getMemoryVersion(): any {
        return this.memoryBuffer?.documentState.memoryVersion;
    }

    /**
     * 获取文件版本数据
     */
    getFileVersion(): any {
        return this.memoryBuffer?.documentState.fileVersion;
    }

    /**
     * 更新文件版本（用于外部文件变更）
     */
    updateFileVersion(newFileData: any): void {
        if (!this.memoryBuffer) return;

        this.memoryBuffer.documentState.fileVersion = JSON.parse(JSON.stringify(newFileData));
        this.memoryBuffer.documentState.lastSyncTime = Date.now();
        
        DebugManager.log('File version updated');
    }

    /**
     * 检测冲突
     */
    detectConflict(): boolean {
        if (!this.memoryBuffer) return false;

        const memoryVersion = this.memoryBuffer.documentState.memoryVersion;
        const fileVersion = this.memoryBuffer.documentState.fileVersion;

        // 简单的内容比较（实际实现可能需要更复杂的比较逻辑）
        const memoryHash = JSON.stringify(memoryVersion);
        const fileHash = JSON.stringify(fileVersion);

        return memoryHash !== fileHash;
    }

    /**
     * 应用变更到内存版本
     */
    private applyToMemoryVersion(operation: ChangeOperation): void {
        if (!this.memoryBuffer) return;

        const memoryVersion = this.memoryBuffer.documentState.memoryVersion;
        if (!memoryVersion.nodes) return;

        const nodeIndex = memoryVersion.nodes.findIndex((node: any) => node.id === operation.nodeId);

        switch (operation.type) {
            case 'update':
                if (nodeIndex !== -1) {
                    memoryVersion.nodes[nodeIndex] = { 
                        ...memoryVersion.nodes[nodeIndex], 
                        ...operation.newValue 
                    };
                }
                break;
            case 'create':
                memoryVersion.nodes.push(operation.newValue);
                break;
            case 'delete':
                if (nodeIndex !== -1) {
                    memoryVersion.nodes.splice(nodeIndex, 1);
                }
                break;
        }
    }

    /**
     * 标记为未保存
     */
    private markAsUnsaved(): void {
        if (this.memoryBuffer) {
            this.memoryBuffer.documentState.hasUnsavedChanges = true;
            // 通知变更监听器
            this.notifyChangeListeners();
        }
    }

    /**
     * 添加保存回调
     */
    addSaveCallback(callback: (trigger: SaveTrigger) => Promise<void>): void {
        this.saveCallbacks.push(callback);
    }

    /**
     * 移除保存回调
     */
    removeSaveCallback(callback: (trigger: SaveTrigger) => Promise<void>): void {
        const index = this.saveCallbacks.indexOf(callback);
        if (index > -1) {
            this.saveCallbacks.splice(index, 1);
        }
    }

    /**
     * 添加变更监听器
     */
    addChangeListener(listener: (hasChanges: boolean) => void): void {
        this.changeListeners.push(listener);
    }

    /**
     * 移除变更监听器
     */
    removeChangeListener(listener: (hasChanges: boolean) => void): void {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    /**
     * 通知变更监听器
     */
    private notifyChangeListeners(): void {
        const hasChanges = this.hasUnsavedChanges();
        this.changeListeners.forEach(listener => {
            try {
                listener(hasChanges);
            } catch (error) {
                DebugManager.error('Error in change listener:', error);
            }
        });
    }

    /**
     * 清理内存缓冲区
     */
    cleanup(): void {
        this.cancelAutoSave();
        this.memoryBuffer = null;
        this.saveCallbacks = [];
        this.changeListeners = [];
        DebugManager.log('MemoryBufferManager cleaned up');
    }
}
