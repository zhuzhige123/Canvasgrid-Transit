import { DebugManager } from '../utils/DebugManager';

/**
 * 编辑器状态管理器
 *
 * 职责：
 * - 管理单个编辑器实例的状态（内容、修改状态、编辑模式等）
 * - 提供状态的增删改查操作
 * - 处理状态的持久化和恢复
 * - 监听状态变化并触发相应事件
 *
 * 与 EditorStateCoordinator 的关系：
 * - EditorStateManager 负责状态数据管理
 * - EditorStateCoordinator 负责协调多个编辑器和业务逻辑
 */

/**
 * 编辑器状态接口
 */
export interface EditorState {
    nodeId: string;
    originalContent: any;
    currentContent: any;
    isDirty: boolean;
    lastModified: number;
    editingMode: 'text' | 'link' | 'none';
    cardElement?: HTMLElement;
    editorElement?: HTMLElement;
}

/**
 * 文档状态接口
 */
export interface DocumentState {
    filePath: string;
    memoryVersion: any;
    fileVersion: any;
    lastSyncTime: number;
    hasUnsavedChanges: boolean;
    conflictDetected: boolean;
    activeEditors: Set<string>;
}

/**
 * 变更操作接口
 */
export interface ChangeOperation {
    id: string;
    nodeId: string;
    type: 'update' | 'create' | 'delete';
    oldValue: any;
    newValue: any;
    timestamp: number;
    applied: boolean;
}

/**
 * 编辑器状态管理器
 * 负责管理所有编辑器状态，实现编辑器状态优先策略
 */
export class EditorStateManager {
    private editorStates = new Map<string, EditorState>();
    private documentState: DocumentState | null = null;
    private changeOperations: ChangeOperation[] = [];
    private stateChangeListeners: ((nodeId: string, state: EditorState) => void)[] = [];

    constructor() {
        DebugManager.log('EditorStateManager initialized');
    }

    /**
     * 初始化文档状态
     */
    initializeDocument(filePath: string, initialData: any): void {
        this.documentState = {
            filePath,
            memoryVersion: JSON.parse(JSON.stringify(initialData)),
            fileVersion: JSON.parse(JSON.stringify(initialData)),
            lastSyncTime: Date.now(),
            hasUnsavedChanges: false,
            conflictDetected: false,
            activeEditors: new Set()
        };
        
        DebugManager.log('Document state initialized:', filePath);
    }

    /**
     * 开始编辑节点
     */
    startEditing(nodeId: string, content: any, cardElement?: HTMLElement, editorElement?: HTMLElement): EditorState {
        // 如果已经在编辑，返回现有状态
        if (this.editorStates.has(nodeId)) {
            return this.editorStates.get(nodeId)!;
        }

        const editorState: EditorState = {
            nodeId,
            originalContent: JSON.parse(JSON.stringify(content)),
            currentContent: JSON.parse(JSON.stringify(content)),
            isDirty: false,
            lastModified: Date.now(),
            editingMode: this.detectEditingMode(content),
            cardElement,
            editorElement
        };

        this.editorStates.set(nodeId, editorState);
        
        if (this.documentState) {
            this.documentState.activeEditors.add(nodeId);
        }

        this.notifyStateChange(nodeId, editorState);
        DebugManager.log('Started editing node:', nodeId);
        
        return editorState;
    }

    /**
     * 更新编辑内容（仅更新内存状态）
     */
    updateContent(nodeId: string, newContent: any): boolean {
        const state = this.editorStates.get(nodeId);
        if (!state) {
            DebugManager.warn('Attempted to update non-existent editor state:', nodeId);
            return false;
        }

        // 检查内容是否真的发生了变化
        if (JSON.stringify(state.currentContent) === JSON.stringify(newContent)) {
            return false;
        }

        // Canvas兼容模式：简化变更操作记录
        const changeOp: ChangeOperation = {
            id: `${nodeId}-${Date.now()}`,
            nodeId,
            type: 'update',
            oldValue: state.currentContent,
            newValue: newContent,
            timestamp: Date.now(),
            applied: false
        };

        // 更新编辑器状态
        state.currentContent = JSON.parse(JSON.stringify(newContent));
        state.isDirty = true;
        state.lastModified = Date.now();

        // Canvas兼容模式：不保留变更历史，减少内存使用
        this.changeOperations = [changeOp]; // 只保留最新的变更

        // 标记文档有未保存变更
        if (this.documentState) {
            this.documentState.hasUnsavedChanges = true;
        }

        this.notifyStateChange(nodeId, state);
        DebugManager.log('Updated content for node:', nodeId);
        
        return true;
    }

    /**
     * 停止编辑节点（Canvas兼容模式 - 简化版本）
     */
    stopEditing(nodeId: string, saveChanges: boolean = true): boolean {
        const state = this.editorStates.get(nodeId);
        if (!state) {
            return false;
        }

        // Canvas兼容模式：简化保存逻辑，直接应用变更
        if (saveChanges) {
            // 直接应用变更到内存版本，无复杂判断
            this.applyChangesToMemoryVersion(nodeId);
        } else {
            // 丢弃变更，移除相关的变更操作
            this.discardChanges(nodeId);
        }

        // 清理编辑器状态
        this.editorStates.delete(nodeId);

        if (this.documentState) {
            this.documentState.activeEditors.delete(nodeId);
        }

        DebugManager.log('Stopped editing node (Canvas-compatible mode):', nodeId, 'saved:', saveChanges);
        return true;
    }

    /**
     * 获取编辑器状态
     */
    getEditorState(nodeId: string): EditorState | null {
        return this.editorStates.get(nodeId) || null;
    }

    /**
     * 获取文档状态
     */
    getDocumentState(): DocumentState | null {
        return this.documentState;
    }

    /**
     * 检查是否有未保存的变更
     */
    hasUnsavedChanges(): boolean {
        return this.documentState?.hasUnsavedChanges || false;
    }

    /**
     * 检查是否有活跃的编辑器
     */
    hasActiveEditors(): boolean {
        return this.editorStates.size > 0;
    }

    /**
     * 获取所有活跃编辑器的节点ID
     */
    getActiveEditorIds(): string[] {
        return Array.from(this.editorStates.keys());
    }

    /**
     * 获取待应用的变更操作
     */
    getPendingChanges(): ChangeOperation[] {
        return this.changeOperations.filter(op => !op.applied);
    }

    /**
     * 检测编辑模式
     */
    private detectEditingMode(content: any): 'text' | 'link' | 'none' {
        if (content && typeof content === 'object') {
            if (content.type === 'text') return 'text';
            if (content.type === 'link') return 'link';
        }
        return 'none';
    }

    /**
     * 应用变更到内存版本
     */
    private applyChangesToMemoryVersion(nodeId: string): void {
        if (!this.documentState) return;

        const relevantChanges = this.changeOperations.filter(
            op => op.nodeId === nodeId && !op.applied
        );

        for (const change of relevantChanges) {
            // 应用变更到内存版本
            this.applyChangeToMemoryVersion(change);
            change.applied = true;
        }
    }

    /**
     * 应用单个变更到内存版本
     */
    private applyChangeToMemoryVersion(change: ChangeOperation): void {
        if (!this.documentState) return;

        const memoryVersion = this.documentState.memoryVersion;
        if (!memoryVersion.nodes) return;

        const nodeIndex = memoryVersion.nodes.findIndex((node: any) => node.id === change.nodeId);
        if (nodeIndex === -1) return;

        // 根据变更类型应用变更
        switch (change.type) {
            case 'update':
                memoryVersion.nodes[nodeIndex] = { ...memoryVersion.nodes[nodeIndex], ...change.newValue };
                break;
            case 'delete':
                memoryVersion.nodes.splice(nodeIndex, 1);
                break;
            // create 类型在其他地方处理
        }

        DebugManager.log('Applied change to memory version:', change.id);
    }

    /**
     * 丢弃变更
     */
    private discardChanges(nodeId: string): void {
        // 移除相关的变更操作
        this.changeOperations = this.changeOperations.filter(op => op.nodeId !== nodeId);
        
        // 检查是否还有其他未保存变更
        const hasOtherChanges = this.changeOperations.some(op => !op.applied);
        if (this.documentState && !hasOtherChanges) {
            this.documentState.hasUnsavedChanges = false;
        }
    }

    /**
     * 通知状态变化
     */
    private notifyStateChange(nodeId: string, state: EditorState): void {
        for (const listener of this.stateChangeListeners) {
            try {
                listener(nodeId, state);
            } catch (error) {
                DebugManager.error('Error in state change listener:', error);
            }
        }
    }

    /**
     * 添加状态变化监听器
     */
    addStateChangeListener(listener: (nodeId: string, state: EditorState) => void): void {
        this.stateChangeListeners.push(listener);
    }

    /**
     * 移除状态变化监听器
     */
    removeStateChangeListener(listener: (nodeId: string, state: EditorState) => void): void {
        const index = this.stateChangeListeners.indexOf(listener);
        if (index > -1) {
            this.stateChangeListeners.splice(index, 1);
        }
    }

    /**
     * 清理所有状态
     */
    cleanup(): void {
        this.editorStates.clear();
        this.changeOperations = [];
        this.stateChangeListeners = [];
        this.documentState = null;
        DebugManager.log('EditorStateManager cleaned up');
    }
}
