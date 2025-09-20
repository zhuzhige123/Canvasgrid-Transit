import { DebugManager } from '../../utils/DebugManager';

/**
 * Canvas节点类型
 */
export type CanvasNodeType = 'text' | 'file' | 'link' | 'group';

/**
 * Canvas节点颜色
 */
export type CanvasNodeColor = '1' | '2' | '3' | '4' | '5' | '6' | '7';

/**
 * Canvas节点基础接口
 */
export interface CanvasNodeBase {
    id: string;
    type: CanvasNodeType;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: CanvasNodeColor;
}

/**
 * 文本节点
 */
export interface TextNode extends CanvasNodeBase {
    type: 'text';
    text: string;
}

/**
 * 文件节点
 */
export interface FileNode extends CanvasNodeBase {
    type: 'file';
    file: string;
    subpath?: string;
}

/**
 * 链接节点
 */
export interface LinkNode extends CanvasNodeBase {
    type: 'link';
    url: string;
}

/**
 * 分组节点
 */
export interface GroupNode extends CanvasNodeBase {
    type: 'group';
    label?: string;
    background?: string;
    backgroundStyle?: string;
}

/**
 * Canvas节点联合类型
 */
export type CanvasNode = TextNode | FileNode | LinkNode | GroupNode;

/**
 * Canvas边连接
 */
export interface CanvasEdge {
    id: string;
    fromNode: string;
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    toNode: string;
    toSide: 'top' | 'right' | 'bottom' | 'left';
    color?: CanvasNodeColor;
    label?: string;
}

/**
 * Canvas数据结构
 */
export interface CanvasData {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

/**
 * Canvas元数据
 */
export interface CanvasMetadata {
    version: string;
    createdAt: Date;
    modifiedAt: Date;
    author?: string;
    description?: string;
    tags: string[];
    viewportX: number;
    viewportY: number;
    zoomLevel: number;
}

/**
 * 完整的Canvas文档
 */
export interface CanvasDocument {
    data: CanvasData;
    metadata: CanvasMetadata;
    filePath: string;
    fileName: string;
}

/**
 * Canvas数据模型类
 * 负责Canvas数据的验证、转换和操作
 * 支持内存版本与文件版本分离的新架构
 */
export class CanvasDataModel {
    private data: CanvasData;
    private metadata: CanvasMetadata;
    private filePath: string;
    private fileName: string;
    private isDirty: boolean = false;

    // 新增：支持内存版本管理
    private memoryVersion: CanvasData;
    private fileVersion: CanvasData;
    private hasMemoryChanges: boolean = false;

    constructor(document: CanvasDocument) {
        this.data = document.data;
        this.metadata = document.metadata;
        this.filePath = document.filePath;
        this.fileName = document.fileName;

        // 初始化内存版本和文件版本
        this.memoryVersion = JSON.parse(JSON.stringify(document.data));
        this.fileVersion = JSON.parse(JSON.stringify(document.data));

        this.validateData();
    }

    /**
     * 获取所有节点
     */
    getNodes(): CanvasNode[] {
        return [...this.data.nodes];
    }

    /**
     * 获取指定类型的节点
     */
    getNodesByType<T extends CanvasNode>(type: CanvasNodeType): T[] {
        return this.data.nodes.filter(node => node.type === type) as T[];
    }

    /**
     * 根据ID获取节点
     */
    getNodeById(id: string): CanvasNode | null {
        return this.data.nodes.find(node => node.id === id) || null;
    }

    /**
     * 添加节点
     */
    addNode(node: CanvasNode): void {
        // 验证节点
        this.validateNode(node);
        
        // 检查ID唯一性
        if (this.getNodeById(node.id)) {
            throw new Error(`Node with ID ${node.id} already exists`);
        }
        
        this.data.nodes.push(node);
        this.markDirty();
        
        DebugManager.log(`Node added: ${node.id} (${node.type})`);
    }

    /**
     * 更新节点
     */
    updateNode(id: string, updates: Partial<CanvasNode>): boolean {
        const nodeIndex = this.data.nodes.findIndex(node => node.id === id);
        if (nodeIndex === -1) {
            return false;
        }

        const currentNode = this.data.nodes[nodeIndex];
        const updatedNode = { ...currentNode, ...updates } as CanvasNode;
        this.validateNode(updatedNode);

        this.data.nodes[nodeIndex] = updatedNode;
        this.markDirty();

        DebugManager.log(`Node updated: ${id}`);
        return true;
    }

    /**
     * 删除节点
     */
    removeNode(id: string): boolean {
        const nodeIndex = this.data.nodes.findIndex(node => node.id === id);
        if (nodeIndex === -1) {
            return false;
        }
        
        // 删除相关的边
        this.data.edges = this.data.edges.filter(
            edge => edge.fromNode !== id && edge.toNode !== id
        );
        
        this.data.nodes.splice(nodeIndex, 1);
        this.markDirty();
        
        DebugManager.log(`Node removed: ${id}`);
        return true;
    }

    /**
     * 获取所有边
     */
    getEdges(): CanvasEdge[] {
        return [...this.data.edges];
    }

    /**
     * 根据ID获取边
     */
    getEdgeById(id: string): CanvasEdge | null {
        return this.data.edges.find(edge => edge.id === id) || null;
    }

    /**
     * 获取节点的连接边
     */
    getNodeEdges(nodeId: string): CanvasEdge[] {
        return this.data.edges.filter(
            edge => edge.fromNode === nodeId || edge.toNode === nodeId
        );
    }

    /**
     * 添加边
     */
    addEdge(edge: CanvasEdge): void {
        // 验证边
        this.validateEdge(edge);
        
        // 检查ID唯一性
        if (this.getEdgeById(edge.id)) {
            throw new Error(`Edge with ID ${edge.id} already exists`);
        }
        
        // 验证节点存在
        if (!this.getNodeById(edge.fromNode) || !this.getNodeById(edge.toNode)) {
            throw new Error('Edge references non-existent nodes');
        }
        
        this.data.edges.push(edge);
        this.markDirty();
        
        DebugManager.log(`Edge added: ${edge.id}`);
    }

    /**
     * 删除边
     */
    removeEdge(id: string): boolean {
        const edgeIndex = this.data.edges.findIndex(edge => edge.id === id);
        if (edgeIndex === -1) {
            return false;
        }
        
        this.data.edges.splice(edgeIndex, 1);
        this.markDirty();
        
        DebugManager.log(`Edge removed: ${id}`);
        return true;
    }

    /**
     * 获取元数据
     */
    getMetadata(): CanvasMetadata {
        return { ...this.metadata };
    }

    /**
     * 更新元数据
     */
    updateMetadata(updates: Partial<CanvasMetadata>): void {
        this.metadata = { ...this.metadata, ...updates };
        this.markDirty();
        
        DebugManager.log('Metadata updated');
    }

    /**
     * 获取文档信息
     */
    getDocumentInfo(): { filePath: string; fileName: string; isDirty: boolean } {
        return {
            filePath: this.filePath,
            fileName: this.fileName,
            isDirty: this.isDirty
        };
    }

    /**
     * 导出为Canvas JSON格式
     */
    toCanvasJSON(): any {
        return {
            nodes: this.data.nodes,
            edges: this.data.edges
        };
    }

    /**
     * 从Canvas JSON创建模型
     */
    static fromCanvasJSON(json: any, filePath: string, fileName: string): CanvasDataModel {
        const data: CanvasData = {
            nodes: json.nodes || [],
            edges: json.edges || []
        };
        
        const metadata: CanvasMetadata = {
            version: '1.0.0',
            createdAt: new Date(),
            modifiedAt: new Date(),
            tags: [],
            viewportX: 0,
            viewportY: 0,
            zoomLevel: 1
        };
        
        return new CanvasDataModel({
            data,
            metadata,
            filePath,
            fileName
        });
    }

    /**
     * 验证Canvas数据
     */
    private validateData(): void {
        if (!this.data.nodes || !Array.isArray(this.data.nodes)) {
            throw new Error('Invalid nodes data');
        }
        
        if (!this.data.edges || !Array.isArray(this.data.edges)) {
            throw new Error('Invalid edges data');
        }
        
        // 验证所有节点
        for (const node of this.data.nodes) {
            this.validateNode(node);
        }
        
        // 验证所有边
        for (const edge of this.data.edges) {
            this.validateEdge(edge);
        }
    }

    /**
     * 验证节点
     */
    private validateNode(node: CanvasNode): void {
        if (!node.id || typeof node.id !== 'string') {
            throw new Error('Node must have a valid ID');
        }
        
        if (!['text', 'file', 'link', 'group'].includes(node.type)) {
            throw new Error(`Invalid node type: ${node.type}`);
        }
        
        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
            throw new Error('Node must have valid coordinates');
        }
        
        if (typeof node.width !== 'number' || typeof node.height !== 'number') {
            throw new Error('Node must have valid dimensions');
        }
        
        // 类型特定验证
        switch (node.type) {
            case 'text':
                if (typeof (node as TextNode).text !== 'string') {
                    throw new Error('Text node must have text content');
                }
                break;
            case 'file':
                if (typeof (node as FileNode).file !== 'string') {
                    throw new Error('File node must have file path');
                }
                break;
            case 'link':
                if (typeof (node as LinkNode).url !== 'string') {
                    throw new Error('Link node must have URL');
                }
                break;
        }
    }

    /**
     * 验证边
     */
    private validateEdge(edge: CanvasEdge): void {
        if (!edge.id || typeof edge.id !== 'string') {
            throw new Error('Edge must have a valid ID');
        }
        
        if (!edge.fromNode || !edge.toNode) {
            throw new Error('Edge must have valid node references');
        }
        
        const validSides = ['top', 'right', 'bottom', 'left'];
        if (!validSides.includes(edge.fromSide) || !validSides.includes(edge.toSide)) {
            throw new Error('Edge must have valid sides');
        }
    }

    /**
     * 标记为已修改
     */
    private markDirty(): void {
        this.isDirty = true;
        this.metadata.modifiedAt = new Date();
    }

    /**
     * 清除修改标记
     */
    markClean(): void {
        this.isDirty = false;
        this.hasMemoryChanges = false;
    }

    // ==================== 新增：内存版本管理方法 ====================

    /**
     * 获取内存版本数据
     */
    getMemoryVersion(): CanvasData {
        return JSON.parse(JSON.stringify(this.memoryVersion));
    }

    /**
     * 获取文件版本数据
     */
    getFileVersion(): CanvasData {
        return JSON.parse(JSON.stringify(this.fileVersion));
    }

    /**
     * 更新内存版本（用于编辑器状态变更）
     */
    updateMemoryVersion(nodeId: string, updates: Partial<CanvasNode>): boolean {
        const nodeIndex = this.memoryVersion.nodes.findIndex(node => node.id === nodeId);
        if (nodeIndex === -1) {
            return false;
        }

        this.memoryVersion.nodes[nodeIndex] = {
            ...this.memoryVersion.nodes[nodeIndex],
            ...updates
        } as CanvasNode;

        this.hasMemoryChanges = true;
        DebugManager.log(`Memory version updated for node: ${nodeId}`);
        return true;
    }

    /**
     * 同步内存版本到主数据（用于保存时）
     */
    syncMemoryToData(): void {
        this.data = JSON.parse(JSON.stringify(this.memoryVersion));
        this.hasMemoryChanges = false;
        DebugManager.log('Memory version synced to main data');
    }

    /**
     * 同步文件版本（用于外部文件变更）
     */
    syncFileVersion(newFileData: CanvasData): void {
        this.fileVersion = JSON.parse(JSON.stringify(newFileData));
        DebugManager.log('File version updated');
    }

    /**
     * 检查是否有内存变更
     */
    hasUnsavedMemoryChanges(): boolean {
        return this.hasMemoryChanges;
    }

    /**
     * 检测内存版本与文件版本的冲突
     */
    detectConflict(): boolean {
        const memoryHash = JSON.stringify(this.memoryVersion);
        const fileHash = JSON.stringify(this.fileVersion);
        return memoryHash !== fileHash;
    }

    /**
     * 重置内存版本为文件版本（用于解决冲突）
     */
    resetMemoryToFile(): void {
        this.memoryVersion = JSON.parse(JSON.stringify(this.fileVersion));
        this.data = JSON.parse(JSON.stringify(this.fileVersion));
        this.hasMemoryChanges = false;
        DebugManager.log('Memory version reset to file version');
    }

    /**
     * 应用内存版本到文件版本（用于保存）
     */
    applyMemoryToFile(): void {
        this.fileVersion = JSON.parse(JSON.stringify(this.memoryVersion));
        this.data = JSON.parse(JSON.stringify(this.memoryVersion));
        this.hasMemoryChanges = false;
        DebugManager.log('Memory version applied to file version');
    }
}
