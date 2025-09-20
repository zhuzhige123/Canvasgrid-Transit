import { CanvasNode, CanvasEdge, CanvasData } from '../../domain/models/CanvasDataModel';
import { DebugManager } from '../../utils/DebugManager';

/**
 * 验证结果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
    code: string;
    message: string;
    field?: string;
    severity: 'error' | 'warning';
}

/**
 * 验证警告
 */
export interface ValidationWarning {
    code: string;
    message: string;
    field?: string;
    suggestion?: string;
}

/**
 * 验证规则
 */
export interface ValidationRule<T> {
    name: string;
    validate: (data: T) => ValidationError[];
    enabled: boolean;
    priority: number;
}

/**
 * Canvas数据验证器 - 专注于Canvas数据验证
 */
export class DataValidator {
    private canvasRules: ValidationRule<CanvasData>[] = [];
    private nodeRules: ValidationRule<CanvasNode>[] = [];
    private edgeRules: ValidationRule<CanvasEdge>[] = [];

    constructor() {
        this.initializeCanvasRules();
        this.initializeNodeRules();
        this.initializeEdgeRules();
    }

    /**
     * 验证Canvas数据
     */
    validateCanvasData(data: CanvasData): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        try {
            // 验证Canvas整体结构
            for (const rule of this.canvasRules.filter(r => r.enabled)) {
                const ruleErrors = rule.validate(data);
                errors.push(...ruleErrors);
            }

            // 验证每个节点
            for (const node of data.nodes) {
                for (const rule of this.nodeRules.filter(r => r.enabled)) {
                    const ruleErrors = rule.validate(node);
                    errors.push(...ruleErrors);
                }
            }

            // 验证每个边
            for (const edge of data.edges) {
                for (const rule of this.edgeRules.filter(r => r.enabled)) {
                    const ruleErrors = rule.validate(edge);
                    errors.push(...ruleErrors);
                }
            }

            // 生成警告
            warnings.push(...this.generateCanvasWarnings(data));

            const result: ValidationResult = {
                isValid: errors.filter(e => e.severity === 'error').length === 0,
                errors,
                warnings
            };

            DebugManager.log(`Canvas validation completed: ${result.isValid ? 'VALID' : 'INVALID'}`);
            return result;

        } catch (error) {
            DebugManager.error('Canvas validation failed', error);
            return {
                isValid: false,
                errors: [{
                    code: 'VALIDATION_ERROR',
                    message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
                    severity: 'error'
                }],
                warnings: []
            };
        }
    }

    /**
     * 验证单个Canvas节点
     */
    validateCanvasNode(node: CanvasNode): ValidationResult {
        const errors: ValidationError[] = [];

        for (const rule of this.nodeRules.filter(r => r.enabled)) {
            const ruleErrors = rule.validate(node);
            errors.push(...ruleErrors);
        }

        return {
            isValid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
            warnings: []
        };
    }

    /**
     * 验证单个Canvas边
     */
    validateCanvasEdge(edge: CanvasEdge): ValidationResult {
        const errors: ValidationError[] = [];

        for (const rule of this.edgeRules.filter(r => r.enabled)) {
            const ruleErrors = rule.validate(edge);
            errors.push(...ruleErrors);
        }

        return {
            isValid: errors.filter(e => e.severity === 'error').length === 0,
            errors,
            warnings: []
        };
    }

    // 规则管理方法
    addCanvasRule(rule: ValidationRule<CanvasData>): void {
        this.canvasRules.push(rule);
        this.canvasRules.sort((a, b) => b.priority - a.priority);
    }

    addNodeRule(rule: ValidationRule<CanvasNode>): void {
        this.nodeRules.push(rule);
        this.nodeRules.sort((a, b) => b.priority - a.priority);
    }

    addEdgeRule(rule: ValidationRule<CanvasEdge>): void {
        this.edgeRules.push(rule);
        this.edgeRules.sort((a, b) => b.priority - a.priority);
    }

    // 初始化Canvas验证规则
    private initializeCanvasRules(): void {
        // Canvas基础结构验证
        this.canvasRules.push({
            name: 'canvas-structure',
            validate: (data: CanvasData) => {
                const errors: ValidationError[] = [];
                
                if (!data.nodes || !Array.isArray(data.nodes)) {
                    errors.push({
                        code: 'MISSING_NODES',
                        message: 'Canvas数据缺少nodes数组',
                        severity: 'error'
                    });
                }
                
                if (!data.edges || !Array.isArray(data.edges)) {
                    errors.push({
                        code: 'MISSING_EDGES',
                        message: 'Canvas数据缺少edges数组',
                        severity: 'error'
                    });
                }
                
                return errors;
            },
            enabled: true,
            priority: 100
        });

        // 节点ID唯一性验证
        this.canvasRules.push({
            name: 'node-id-uniqueness',
            validate: (data: CanvasData) => {
                const errors: ValidationError[] = [];
                const nodeIds = new Set<string>();
                
                for (const node of data.nodes) {
                    if (nodeIds.has(node.id)) {
                        errors.push({
                            code: 'DUPLICATE_NODE_ID',
                            message: `发现重复的节点ID: ${node.id}`,
                            severity: 'error'
                        });
                    }
                    nodeIds.add(node.id);
                }
                
                return errors;
            },
            enabled: true,
            priority: 90
        });
    }

    // 初始化节点验证规则
    private initializeNodeRules(): void {
        // 节点基础验证
        this.nodeRules.push({
            name: 'node-basic-validation',
            validate: (node: CanvasNode) => {
                const errors: ValidationError[] = [];
                
                if (!node.id || typeof node.id !== 'string') {
                    errors.push({
                        code: 'INVALID_NODE_ID',
                        message: '节点ID无效或缺失',
                        severity: 'error'
                    });
                }
                
                if (!node.type || !['text', 'file', 'link', 'group'].includes(node.type)) {
                    errors.push({
                        code: 'INVALID_NODE_TYPE',
                        message: `节点类型无效: ${node.type}`,
                        severity: 'error'
                    });
                }
                
                if (typeof node.x !== 'number' || typeof node.y !== 'number') {
                    errors.push({
                        code: 'INVALID_NODE_POSITION',
                        message: '节点位置坐标无效',
                        severity: 'error'
                    });
                }
                
                if (typeof node.width !== 'number' || typeof node.height !== 'number') {
                    errors.push({
                        code: 'INVALID_NODE_SIZE',
                        message: '节点尺寸无效',
                        severity: 'error'
                    });
                }
                
                return errors;
            },
            enabled: true,
            priority: 100
        });

        // 文本节点特定验证
        this.nodeRules.push({
            name: 'text-node-validation',
            validate: (node: CanvasNode) => {
                const errors: ValidationError[] = [];
                
                if (node.type === 'text') {
                    if (!node.text || typeof node.text !== 'string') {
                        errors.push({
                            code: 'MISSING_TEXT_CONTENT',
                            message: '文本节点缺少文本内容',
                            severity: 'warning'
                        });
                    }
                }
                
                return errors;
            },
            enabled: true,
            priority: 80
        });

        // 文件节点特定验证
        this.nodeRules.push({
            name: 'file-node-validation',
            validate: (node: CanvasNode) => {
                const errors: ValidationError[] = [];
                
                if (node.type === 'file') {
                    if (!node.file || typeof node.file !== 'string') {
                        errors.push({
                            code: 'MISSING_FILE_PATH',
                            message: '文件节点缺少文件路径',
                            severity: 'error'
                        });
                    }
                }
                
                return errors;
            },
            enabled: true,
            priority: 80
        });
    }

    // 初始化边验证规则
    private initializeEdgeRules(): void {
        // 边基础验证
        this.edgeRules.push({
            name: 'edge-basic-validation',
            validate: (edge: CanvasEdge) => {
                const errors: ValidationError[] = [];
                
                if (!edge.id || typeof edge.id !== 'string') {
                    errors.push({
                        code: 'INVALID_EDGE_ID',
                        message: '边ID无效或缺失',
                        severity: 'error'
                    });
                }
                
                if (!edge.fromNode || typeof edge.fromNode !== 'string') {
                    errors.push({
                        code: 'INVALID_FROM_NODE',
                        message: '边的源节点ID无效',
                        severity: 'error'
                    });
                }
                
                if (!edge.toNode || typeof edge.toNode !== 'string') {
                    errors.push({
                        code: 'INVALID_TO_NODE',
                        message: '边的目标节点ID无效',
                        severity: 'error'
                    });
                }
                
                return errors;
            },
            enabled: true,
            priority: 100
        });
    }

    /**
     * 生成Canvas警告
     */
    private generateCanvasWarnings(data: CanvasData): ValidationWarning[] {
        const warnings: ValidationWarning[] = [];
        
        // 检查空节点
        const emptyNodes = data.nodes.filter(node => 
            node.type === 'text' && (!node.text || node.text.trim().length === 0)
        );
        
        if (emptyNodes.length > 0) {
            warnings.push({
                code: 'EMPTY_TEXT_NODES',
                message: `发现${emptyNodes.length}个空文本节点`,
                suggestion: '考虑删除或填充空文本节点'
            });
        }
        
        // 检查孤立节点
        const connectedNodeIds = new Set<string>();
        data.edges.forEach(edge => {
            connectedNodeIds.add(edge.fromNode);
            connectedNodeIds.add(edge.toNode);
        });
        
        const isolatedNodes = data.nodes.filter(node => !connectedNodeIds.has(node.id));
        if (isolatedNodes.length > 0) {
            warnings.push({
                code: 'ISOLATED_NODES',
                message: `发现${isolatedNodes.length}个孤立节点`,
                suggestion: '考虑连接孤立节点或删除它们'
            });
        }
        
        return warnings;
    }
}
