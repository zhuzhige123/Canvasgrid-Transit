import { App } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';
import { SaveTrigger } from './MemoryBufferManager';
import { ConflictResolver, ConflictResolution } from './ConflictResolver';

/**
 * 保存条件配置
 */
export interface SaveConditions {
    onBlur: boolean;           // 编辑器失去焦点
    onManualSave: boolean;     // Ctrl+S手动保存
    onAppClose: boolean;       // 应用关闭
    onViewSwitch: boolean;     // 切换视图
    onFileClose: boolean;      // 文件关闭
    onAutoSave: boolean;       // 自动保存
}

/**
 * 保存触发器管理器
 * 负责管理各种保存触发条件和执行保存操作
 */
export class SaveTriggerManager {
    private app: App;
    private conflictResolver: ConflictResolver;
    private saveConditions: SaveConditions;
    private saveCallbacks: ((trigger: SaveTrigger) => Promise<void>)[] = [];
    private hasUnsavedChangesCallback: (() => boolean) | null = null;
    private getMemoryVersionCallback: (() => any) | null = null;
    private getFileVersionCallback: (() => any) | null = null;
    private hasActiveEditorsCallback: (() => boolean) | null = null;

    constructor(app: App, conditions?: Partial<SaveConditions>) {
        this.app = app;
        this.conflictResolver = new ConflictResolver(app);
        this.saveConditions = {
            onBlur: false, // 禁用失焦保存，避免与官方Canvas冲突
            onManualSave: true, // 保留手动保存（Ctrl+S）
            onAppClose: true, // 保留应用关闭保存
            onViewSwitch: false, // 禁用视图切换保存
            onFileClose: false, // 禁用文件关闭保存
            onAutoSave: false, // 禁用自动保存
            ...conditions
        };

        this.setupEventListeners();
        DebugManager.log('SaveTriggerManager initialized with Canvas-compatible conditions:', this.saveConditions);
    }

    /**
     * 设置回调函数
     */
    setCallbacks(callbacks: {
        hasUnsavedChanges: () => boolean;
        getMemoryVersion: () => any;
        getFileVersion: () => any;
        hasActiveEditors: () => boolean;
    }): void {
        this.hasUnsavedChangesCallback = callbacks.hasUnsavedChanges;
        this.getMemoryVersionCallback = callbacks.getMemoryVersion;
        this.getFileVersionCallback = callbacks.getFileVersion;
        this.hasActiveEditorsCallback = callbacks.hasActiveEditors;
    }

    /**
     * 检查是否应该触发保存
     */
    shouldTriggerSave(trigger: SaveTrigger): boolean {
        if (!this.hasUnsavedChangesCallback?.()) {
            return false;
        }

        switch (trigger) {
            case 'blur':
                return this.saveConditions.onBlur;
            case 'manual':
                return this.saveConditions.onManualSave;
            case 'app-close':
                return this.saveConditions.onAppClose;
            case 'view-switch':
                return this.saveConditions.onViewSwitch;
            case 'file-close':
                return this.saveConditions.onFileClose;
            case 'auto':
                return this.saveConditions.onAutoSave;
            default:
                return false;
        }
    }

    /**
     * 执行保存操作
     */
    async performSave(trigger: SaveTrigger, filePath?: string): Promise<boolean> {
        if (!this.shouldTriggerSave(trigger)) {
            DebugManager.log('Save not triggered for:', trigger);
            return false;
        }

        DebugManager.log('Performing save with trigger:', trigger);

        try {
            // 检查冲突
            const hasConflict = await this.checkForConflicts(filePath);
            
            if (hasConflict) {
                const resolution = await this.resolveConflict(filePath);
                if (resolution.cancelled) {
                    DebugManager.log('Save cancelled due to conflict resolution');
                    return false;
                }
                
                await this.applySaveWithResolution(trigger, resolution);
            } else {
                await this.performNormalSave(trigger);
            }

            DebugManager.log('Save completed successfully for trigger:', trigger);
            return true;

        } catch (error) {
            DebugManager.error('Save failed for trigger:', trigger, error);
            return false;
        }
    }

    /**
     * 手动触发保存
     */
    async triggerManualSave(filePath?: string): Promise<boolean> {
        return await this.performSave('manual', filePath);
    }

    /**
     * 检查冲突
     */
    private async checkForConflicts(filePath?: string): Promise<boolean> {
        if (!filePath || !this.getMemoryVersionCallback || !this.getFileVersionCallback) {
            return false;
        }

        try {
            const memoryVersion = this.getMemoryVersionCallback();
            const fileVersion = this.getFileVersionCallback();
            
            return await this.conflictResolver.detectConflict(filePath, memoryVersion, fileVersion);
        } catch (error) {
            DebugManager.error('Error checking for conflicts:', error);
            return false;
        }
    }

    /**
     * 解决冲突
     */
    private async resolveConflict(filePath?: string): Promise<ConflictResolution> {
        if (!filePath || !this.getMemoryVersionCallback || !this.getFileVersionCallback) {
            return { strategy: 'keep-local' };
        }

        const conflictInfo = {
            filePath,
            localVersion: this.getMemoryVersionCallback(),
            remoteVersion: this.getFileVersionCallback(),
            hasActiveEditors: this.hasActiveEditorsCallback?.() || false,
            lastModified: Date.now()
        };

        return await this.conflictResolver.resolveConflict(conflictInfo);
    }

    /**
     * 应用带冲突解决的保存
     */
    private async applySaveWithResolution(trigger: SaveTrigger, resolution: ConflictResolution): Promise<void> {
        // 根据解决策略执行不同的保存逻辑
        switch (resolution.strategy) {
            case 'keep-local':
                await this.performNormalSave(trigger);
                break;
            case 'use-remote':
                // 通知回调使用远程版本
                await this.notifyUseRemoteVersion();
                break;
            case 'merge':
                if (resolution.mergedContent) {
                    await this.notifyUseMergedContent(resolution.mergedContent);
                }
                break;
        }
    }

    /**
     * 执行正常保存
     */
    private async performNormalSave(trigger: SaveTrigger): Promise<void> {
        // 通知所有保存回调
        for (const callback of this.saveCallbacks) {
            try {
                await callback(trigger);
            } catch (error) {
                DebugManager.error('Error in save callback:', error);
                throw error;
            }
        }
    }

    /**
     * 通知使用远程版本
     */
    private async notifyUseRemoteVersion(): Promise<void> {
        // 这里应该通知主系统重新加载远程版本
        DebugManager.log('Using remote version to resolve conflict');
    }

    /**
     * 通知使用合并内容
     */
    private async notifyUseMergedContent(mergedContent: any): Promise<void> {
        // 这里应该通知主系统使用合并后的内容
        DebugManager.log('Using merged content to resolve conflict');
    }

    /**
     * 设置事件监听器（Canvas兼容模式 - 仅保留必要监听器）
     */
    private setupEventListeners(): void {
        // 移除窗口失焦监听器，避免与官方Canvas冲突

        // 监听键盘事件（Ctrl+S）- 保留手动保存功能
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // 监听应用关闭事件 - 保留关闭前保存
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

        DebugManager.log('Event listeners setup completed (Canvas-compatible mode)');
    }

    /**
     * 处理窗口失焦（已禁用，保留方法以维持兼容性）
     */
    private async handleWindowBlur(): Promise<void> {
        // Canvas兼容模式：禁用失焦保存
        DebugManager.log('Window blur detected, but blur save is disabled (Canvas-compatible mode)');
    }

    /**
     * 处理键盘事件
     */
    private async handleKeyDown(event: KeyboardEvent): Promise<void> {
        // Ctrl+S 或 Cmd+S
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            await this.performSave('manual');
        }
    }

    /**
     * 处理应用关闭前事件
     */
    private handleBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.hasUnsavedChangesCallback?.()) {
            event.preventDefault();
            event.returnValue = '您有未保存的更改，确定要离开吗？';
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
     * 更新保存条件
     */
    updateSaveConditions(conditions: Partial<SaveConditions>): void {
        this.saveConditions = { ...this.saveConditions, ...conditions };
        DebugManager.log('Save conditions updated:', this.saveConditions);
    }

    /**
     * 清理资源（Canvas兼容模式）
     */
    cleanup(): void {
        // 移除窗口失焦监听器已在setupEventListeners中禁用
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));

        this.saveCallbacks = [];
        this.hasUnsavedChangesCallback = null;
        this.getMemoryVersionCallback = null;
        this.getFileVersionCallback = null;
        this.hasActiveEditorsCallback = null;

        DebugManager.log('SaveTriggerManager cleaned up (Canvas-compatible mode)');
    }
}
