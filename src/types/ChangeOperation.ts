/**
 * 变更操作类型
 */
export type ChangeOperationType = 'update' | 'create' | 'delete' | 'move' | 'resize';

/**
 * 变更操作接口
 */
export interface ChangeOperation {
    id: string;
    nodeId: string;
    type: ChangeOperationType;
    oldValue: any;
    newValue: any;
    timestamp: number;
    applied: boolean;
    source: 'editor' | 'drag' | 'api' | 'external';
}

/**
 * 批量变更操作
 */
export interface BatchChangeOperation {
    id: string;
    operations: ChangeOperation[];
    timestamp: number;
    description?: string;
}

/**
 * 变更操作工厂
 */
export class ChangeOperationFactory {
    private static operationCounter = 0;

    /**
     * 创建更新操作
     */
    static createUpdateOperation(
        nodeId: string,
        oldValue: any,
        newValue: any,
        source: ChangeOperation['source'] = 'editor'
    ): ChangeOperation {
        return {
            id: this.generateId(),
            nodeId,
            type: 'update',
            oldValue: JSON.parse(JSON.stringify(oldValue)),
            newValue: JSON.parse(JSON.stringify(newValue)),
            timestamp: Date.now(),
            applied: false,
            source
        };
    }

    /**
     * 创建创建操作
     */
    static createCreateOperation(
        nodeId: string,
        nodeData: any,
        source: ChangeOperation['source'] = 'editor'
    ): ChangeOperation {
        return {
            id: this.generateId(),
            nodeId,
            type: 'create',
            oldValue: null,
            newValue: JSON.parse(JSON.stringify(nodeData)),
            timestamp: Date.now(),
            applied: false,
            source
        };
    }

    /**
     * 创建删除操作
     */
    static createDeleteOperation(
        nodeId: string,
        nodeData: any,
        source: ChangeOperation['source'] = 'editor'
    ): ChangeOperation {
        return {
            id: this.generateId(),
            nodeId,
            type: 'delete',
            oldValue: JSON.parse(JSON.stringify(nodeData)),
            newValue: null,
            timestamp: Date.now(),
            applied: false,
            source
        };
    }

    /**
     * 创建移动操作
     */
    static createMoveOperation(
        nodeId: string,
        oldPosition: { x: number; y: number },
        newPosition: { x: number; y: number },
        source: ChangeOperation['source'] = 'drag'
    ): ChangeOperation {
        return {
            id: this.generateId(),
            nodeId,
            type: 'move',
            oldValue: oldPosition,
            newValue: newPosition,
            timestamp: Date.now(),
            applied: false,
            source
        };
    }

    /**
     * 创建调整大小操作
     */
    static createResizeOperation(
        nodeId: string,
        oldSize: { width: number; height: number },
        newSize: { width: number; height: number },
        source: ChangeOperation['source'] = 'drag'
    ): ChangeOperation {
        return {
            id: this.generateId(),
            nodeId,
            type: 'resize',
            oldValue: oldSize,
            newValue: newSize,
            timestamp: Date.now(),
            applied: false,
            source
        };
    }

    /**
     * 创建批量操作
     */
    static createBatchOperation(
        operations: ChangeOperation[],
        description?: string
    ): BatchChangeOperation {
        return {
            id: this.generateId(),
            operations,
            timestamp: Date.now(),
            description
        };
    }

    /**
     * 生成唯一ID
     */
    private static generateId(): string {
        return `change_${Date.now()}_${++this.operationCounter}`;
    }
}

/**
 * 变更操作验证器
 */
export class ChangeOperationValidator {
    /**
     * 验证变更操作
     */
    static validate(operation: ChangeOperation): boolean {
        if (!operation.id || !operation.nodeId || !operation.type) {
            return false;
        }

        if (operation.timestamp <= 0) {
            return false;
        }

        // 根据操作类型进行特定验证
        switch (operation.type) {
            case 'create':
                return operation.oldValue === null && operation.newValue !== null;
            case 'delete':
                return operation.oldValue !== null && operation.newValue === null;
            case 'update':
            case 'move':
            case 'resize':
                return operation.oldValue !== null && operation.newValue !== null;
            default:
                return false;
        }
    }

    /**
     * 验证批量操作
     */
    static validateBatch(batchOperation: BatchChangeOperation): boolean {
        if (!batchOperation.id || !Array.isArray(batchOperation.operations)) {
            return false;
        }

        return batchOperation.operations.every(op => this.validate(op));
    }
}

/**
 * 变更操作合并器
 */
export class ChangeOperationMerger {
    /**
     * 合并连续的更新操作
     */
    static mergeConsecutiveUpdates(operations: ChangeOperation[]): ChangeOperation[] {
        const merged: ChangeOperation[] = [];
        const nodeGroups = new Map<string, ChangeOperation[]>();

        // 按节点ID分组
        for (const op of operations) {
            if (!nodeGroups.has(op.nodeId)) {
                nodeGroups.set(op.nodeId, []);
            }
            nodeGroups.get(op.nodeId)!.push(op);
        }

        // 合并每个节点的连续更新
        for (const [nodeId, nodeOps] of nodeGroups) {
            if (nodeOps.length === 1) {
                merged.push(nodeOps[0]);
                continue;
            }

            // 检查是否都是更新操作
            const allUpdates = nodeOps.every(op => op.type === 'update');
            if (allUpdates) {
                // 合并为单个更新操作
                const firstOp = nodeOps[0];
                const lastOp = nodeOps[nodeOps.length - 1];
                
                merged.push({
                    ...firstOp,
                    newValue: lastOp.newValue,
                    timestamp: lastOp.timestamp
                });
            } else {
                // 不能合并，保持原样
                merged.push(...nodeOps);
            }
        }

        return merged.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * 优化操作序列（移除冗余操作）
     */
    static optimizeOperations(operations: ChangeOperation[]): ChangeOperation[] {
        const optimized: ChangeOperation[] = [];
        const nodeLastOp = new Map<string, ChangeOperation>();

        for (const op of operations) {
            const lastOp = nodeLastOp.get(op.nodeId);

            if (!lastOp) {
                nodeLastOp.set(op.nodeId, op);
                continue;
            }

            // 如果是连续的相同类型操作，合并
            if (lastOp.type === op.type && op.type === 'update') {
                nodeLastOp.set(op.nodeId, {
                    ...lastOp,
                    newValue: op.newValue,
                    timestamp: op.timestamp
                });
            } else {
                nodeLastOp.set(op.nodeId, op);
            }
        }

        return Array.from(nodeLastOp.values()).sort((a, b) => a.timestamp - b.timestamp);
    }
}
