import { Notice } from 'obsidian';
import { DebugManager } from './DebugManager';

// 验证结果
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	fixedData?: any;
}

// 验证错误
export interface ValidationError {
	type: 'structure' | 'data' | 'format' | 'version';
	field: string;
	message: string;
	severity: 'critical' | 'high' | 'medium' | 'low';
	fixable: boolean;
}

// 验证警告
export interface ValidationWarning {
	type: 'performance' | 'compatibility' | 'data_quality';
	field: string;
	message: string;
	suggestion: string;
}

// 数据修复选项
export interface DataRepairOptions {
	autoFix: boolean;
	createBackup: boolean;
	preserveOriginal: boolean;
	fixMissingFields: boolean;
	fixInvalidValues: boolean;
}

/**
 * 数据验证器
 * 负责验证Canvas数据和时间线数据的完整性和正确性
 */
export class DataValidator {
	private repairOptions: DataRepairOptions;

	constructor(options?: Partial<DataRepairOptions>) {
		this.repairOptions = {
			autoFix: true,
			createBackup: true,
			preserveOriginal: false,
			fixMissingFields: true,
			fixInvalidValues: true,
			...options
		};
	}

	/**
	 * 验证Canvas数据结构
	 */
	validateCanvasData(data: any): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];
		let fixedData = data;

		try {
			// 基础结构验证
			if (!data || typeof data !== 'object') {
				errors.push({
					type: 'structure',
					field: 'root',
					message: 'Canvas数据必须是一个对象',
					severity: 'critical',
					fixable: false
				});
				return { isValid: false, errors, warnings };
			}

			// 验证nodes数组
			if (!Array.isArray(data.nodes)) {
				errors.push({
					type: 'structure',
					field: 'nodes',
					message: 'nodes字段必须是数组',
					severity: 'critical',
					fixable: true
				});

				if (this.repairOptions.autoFix) {
					fixedData = { ...data, nodes: [] };
				}
			} else {
				// 验证每个节点
				const nodeValidation = this.validateNodes(data.nodes);
				errors.push(...nodeValidation.errors);
				warnings.push(...nodeValidation.warnings);
				
				if (nodeValidation.fixedData) {
					fixedData = { ...fixedData, nodes: nodeValidation.fixedData };
				}
			}

			// 验证edges数组
			if (data.edges !== undefined && !Array.isArray(data.edges)) {
				errors.push({
					type: 'structure',
					field: 'edges',
					message: 'edges字段必须是数组',
					severity: 'high',
					fixable: true
				});

				if (this.repairOptions.autoFix) {
					fixedData = { ...fixedData, edges: [] };
				}
			}

			// 性能警告
			if (data.nodes && data.nodes.length > 1000) {
				warnings.push({
					type: 'performance',
					field: 'nodes',
					message: `节点数量过多 (${data.nodes.length})，可能影响性能`,
					suggestion: '考虑分割Canvas或启用虚拟化渲染'
				});
			}

		} catch (error) {
			errors.push({
				type: 'structure',
				field: 'unknown',
				message: `数据验证过程中发生错误: ${error instanceof Error ? error.message : String(error)}`,
				severity: 'critical',
				fixable: false
			});
		}

		const isValid = errors.filter(e => e.severity === 'critical').length === 0;

		return {
			isValid,
			errors,
			warnings,
			fixedData: fixedData !== data ? fixedData : undefined
		};
	}

	/**
	 * 验证节点数组
	 */
	private validateNodes(nodes: any[]): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];
		const fixedNodes: any[] = [];

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const nodeValidation = this.validateSingleNode(node, i);
			
			errors.push(...nodeValidation.errors);
			warnings.push(...nodeValidation.warnings);
			
			// 使用修复后的节点或原节点
			fixedNodes.push(nodeValidation.fixedData || node);
		}

		return {
			isValid: errors.filter(e => e.severity === 'critical').length === 0,
			errors,
			warnings,
			fixedData: fixedNodes
		};
	}

	/**
	 * 验证单个节点
	 */
	private validateSingleNode(node: any, index: number): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];
		let fixedNode = node;

		const fieldPrefix = `nodes[${index}]`;

		try {
			// 基础字段验证
			if (!node.id || typeof node.id !== 'string') {
				errors.push({
					type: 'data',
					field: `${fieldPrefix}.id`,
					message: '节点必须有有效的ID',
					severity: 'critical',
					fixable: true
				});

				if (this.repairOptions.fixMissingFields) {
					fixedNode = { ...fixedNode, id: `node-${Date.now()}-${index}` };
				}
			}

			if (!node.type || !['text', 'file', 'link', 'group'].includes(node.type)) {
				errors.push({
					type: 'data',
					field: `${fieldPrefix}.type`,
					message: '节点类型无效',
					severity: 'high',
					fixable: true
				});

				if (this.repairOptions.fixInvalidValues) {
					fixedNode = { ...fixedNode, type: 'text' };
				}
			}

			// 位置验证
			const positionFields = ['x', 'y', 'width', 'height'];
			for (const field of positionFields) {
				if (typeof node[field] !== 'number') {
					errors.push({
						type: 'data',
						field: `${fieldPrefix}.${field}`,
						message: `${field}字段必须是数字`,
						severity: 'medium',
						fixable: true
					});

					if (this.repairOptions.fixInvalidValues) {
						const defaultValues: Record<string, number> = { x: 0, y: 0, width: 250, height: 60 };
						fixedNode = { ...fixedNode, [field]: defaultValues[field] };
					}
				}
			}

			// 时间线数据验证
			if (node.timelineData) {
				const timelineValidation = this.validateTimelineData(node.timelineData, `${fieldPrefix}.timelineData`);
				errors.push(...timelineValidation.errors);
				warnings.push(...timelineValidation.warnings);
				
				if (timelineValidation.fixedData) {
					fixedNode = { ...fixedNode, timelineData: timelineValidation.fixedData };
				}
			}

		} catch (error) {
			errors.push({
				type: 'structure',
				field: fieldPrefix,
				message: `节点验证失败: ${error instanceof Error ? error.message : String(error)}`,
				severity: 'high',
				fixable: false
			});
		}

		return {
			isValid: errors.filter(e => e.severity === 'critical').length === 0,
			errors,
			warnings,
			fixedData: fixedNode !== node ? fixedNode : undefined
		};
	}

	/**
	 * 验证时间线数据
	 */
	private validateTimelineData(timelineData: any, fieldPrefix: string): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];
		let fixedData = timelineData;

		try {
			// 创建时间验证
			if (typeof timelineData.createdAt !== 'number' || timelineData.createdAt <= 0) {
				errors.push({
					type: 'data',
					field: `${fieldPrefix}.createdAt`,
					message: '创建时间必须是有效的时间戳',
					severity: 'high',
					fixable: true
				});

				if (this.repairOptions.fixInvalidValues) {
					fixedData = { ...fixedData, createdAt: Date.now() };
				}
			}

			// 修改时间验证
			if (timelineData.modifiedAt !== undefined) {
				if (typeof timelineData.modifiedAt !== 'number' || timelineData.modifiedAt <= 0) {
					errors.push({
						type: 'data',
						field: `${fieldPrefix}.modifiedAt`,
						message: '修改时间必须是有效的时间戳',
						severity: 'medium',
						fixable: true
					});

					if (this.repairOptions.fixInvalidValues) {
						fixedData = { ...fixedData, modifiedAt: timelineData.createdAt };
					}
				}
			}

			// 计划时间验证
			if (timelineData.scheduledAt !== undefined && timelineData.scheduledAt !== null) {
				if (typeof timelineData.scheduledAt !== 'number' || timelineData.scheduledAt <= 0) {
					warnings.push({
						type: 'data_quality',
						field: `${fieldPrefix}.scheduledAt`,
						message: '计划时间格式无效',
						suggestion: '检查计划时间设置'
					});

					if (this.repairOptions.fixInvalidValues) {
						fixedData = { ...fixedData, scheduledAt: null };
					}
				}
			}

			// 类别验证
			const validCategories = ['event', 'task', 'note', 'meeting', 'default'];
			if (timelineData.category && !validCategories.includes(timelineData.category)) {
				warnings.push({
					type: 'data_quality',
					field: `${fieldPrefix}.category`,
					message: '未知的类别类型',
					suggestion: `使用以下类别之一: ${validCategories.join(', ')}`
				});

				if (this.repairOptions.fixInvalidValues) {
					fixedData = { ...fixedData, category: 'default' };
				}
			}

			// 优先级验证
			const validPriorities = ['low', 'medium', 'high'];
			if (timelineData.priority && !validPriorities.includes(timelineData.priority)) {
				warnings.push({
					type: 'data_quality',
					field: `${fieldPrefix}.priority`,
					message: '未知的优先级',
					suggestion: `使用以下优先级之一: ${validPriorities.join(', ')}`
				});

				if (this.repairOptions.fixInvalidValues) {
					fixedData = { ...fixedData, priority: 'medium' };
				}
			}

		} catch (error) {
			errors.push({
				type: 'structure',
				field: fieldPrefix,
				message: `时间线数据验证失败: ${error instanceof Error ? error.message : String(error)}`,
				severity: 'medium',
				fixable: false
			});
		}

		return {
			isValid: errors.filter(e => e.severity === 'critical').length === 0,
			errors,
			warnings,
			fixedData: fixedData !== timelineData ? fixedData : undefined
		};
	}

	/**
	 * 修复数据
	 */
	repairData(data: any, validationResult: ValidationResult): any {
		if (validationResult.fixedData) {
			console.log('🔧 Applying data repairs...');
			
			const fixableErrors = validationResult.errors.filter(e => e.fixable);
			if (fixableErrors.length > 0) {
				console.log(`🔧 Fixed ${fixableErrors.length} errors`);
			}

			return validationResult.fixedData;
		}

		return data;
	}

	/**
	 * 显示验证结果
	 */
	showValidationResults(result: ValidationResult): void {
		const criticalErrors = result.errors.filter(e => e.severity === 'critical');
		const highErrors = result.errors.filter(e => e.severity === 'high');
		const warnings = result.warnings;

		if (criticalErrors.length > 0) {
			new Notice(`发现 ${criticalErrors.length} 个严重错误，数据可能无法正常使用`, 5000);
			DebugManager.error('❌ Critical validation errors:', criticalErrors);
		}

		if (highErrors.length > 0) {
			new Notice(`发现 ${highErrors.length} 个重要错误，已尝试自动修复`, 3000);
			DebugManager.warn('⚠️ High priority validation errors:', highErrors);
		}

		if (warnings.length > 0) {
			DebugManager.warn('⚠️ Validation warnings:', warnings);
		}

		if (result.isValid && criticalErrors.length === 0 && highErrors.length === 0) {
			console.log('✅ Data validation passed');
		}
	}

	/**
	 * 更新修复选项
	 */
	updateRepairOptions(options: Partial<DataRepairOptions>): void {
		this.repairOptions = { ...this.repairOptions, ...options };
	}

	/**
	 * 获取当前修复选项
	 */
	getRepairOptions(): DataRepairOptions {
		return { ...this.repairOptions };
	}
}
