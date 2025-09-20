import { App } from 'obsidian';

// 验证配置接口
export interface ValidationConfig {
	enableRealTimeValidation: boolean;
	enableStrictMode: boolean;
	maxErrorsPerField: number;
	validationTimeout: number;
	enableCustomRules: boolean;
	customRules: ValidationRule[];
	enableAsyncValidation: boolean;
	debounceDelay: number;
}

// 验证规则接口
export interface ValidationRule {
	name: string;
	field: string;
	type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'async';
	value?: any;
	message: string;
	validator?: (value: any, context?: any) => boolean | Promise<boolean>;
	priority: number;
}

// 验证结果接口
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	fieldResults: Map<string, FieldValidationResult>;
	timestamp: number;
	duration: number;
}

// 验证错误接口
export interface ValidationError {
	field: string;
	rule: string;
	message: string;
	value: any;
	severity: 'error' | 'warning' | 'info';
}

// 验证警告接口
export interface ValidationWarning {
	field: string;
	message: string;
	suggestion?: string;
}

// 字段验证结果接口
export interface FieldValidationResult {
	field: string;
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	value: any;
}

// 验证策略接口
export interface ValidationStrategy {
	name: string;
	canValidate(type: string): boolean;
	validate(value: any, rules: ValidationRule[], context?: any): Promise<FieldValidationResult>;
	getDefaultRules(type: string): ValidationRule[];
}

// 文本验证策略
export class TextValidationStrategy implements ValidationStrategy {
	name = 'text';

	canValidate(type: string): boolean {
		return type === 'text' || type === 'string' || type === 'textarea';
	}

	async validate(value: any, rules: ValidationRule[], context?: any): Promise<FieldValidationResult> {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];
		const stringValue = String(value || '');

		for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
			try {
				let isValid = true;

				switch (rule.type) {
					case 'required':
						isValid = stringValue.trim().length > 0;
						break;
					
					case 'minLength':
						isValid = stringValue.length >= (rule.value || 0);
						break;
					
					case 'maxLength':
						isValid = stringValue.length <= (rule.value || Infinity);
						break;
					
					case 'pattern':
						if (rule.value instanceof RegExp) {
							isValid = rule.value.test(stringValue);
						}
						break;
					
					case 'custom':
						if (rule.validator) {
							isValid = await rule.validator(stringValue, context);
						}
						break;
				}

				if (!isValid) {
					errors.push({
						field: rule.field,
						rule: rule.name,
						message: rule.message,
						value: stringValue,
						severity: 'error'
					});
				}
			} catch (error) {
				errors.push({
					field: rule.field,
					rule: rule.name,
					message: `验证规则执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
					value: stringValue,
					severity: 'error'
				});
			}
		}

		// 添加文本特定的警告
		if (stringValue.length > 1000) {
			warnings.push({
				field: rules[0]?.field || 'text',
				message: '文本内容较长，可能影响性能',
				suggestion: '考虑分段或使用文件链接'
			});
		}

		return {
			field: rules[0]?.field || 'text',
			isValid: errors.length === 0,
			errors,
			warnings,
			value: stringValue
		};
	}

	getDefaultRules(type: string): ValidationRule[] {
		return [
			{
				name: 'maxLength',
				field: type,
				type: 'maxLength',
				value: 10000,
				message: '文本长度不能超过10000个字符',
				priority: 1
			}
		];
	}
}

// 数字验证策略
export class NumberValidationStrategy implements ValidationStrategy {
	name = 'number';

	canValidate(type: string): boolean {
		return type === 'number' || type === 'integer' || type === 'float';
	}

	async validate(value: any, rules: ValidationRule[], context?: any): Promise<FieldValidationResult> {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];
		const numValue = Number(value);

		// 检查是否为有效数字
		if (value !== '' && value !== null && value !== undefined && isNaN(numValue)) {
			errors.push({
				field: rules[0]?.field || 'number',
				rule: 'type',
				message: '必须是有效的数字',
				value,
				severity: 'error'
			});
		} else {
			for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
				try {
					let isValid = true;

					switch (rule.type) {
						case 'required':
							isValid = !isNaN(numValue);
							break;
						
						case 'custom':
							if (rule.validator) {
								isValid = await rule.validator(numValue, context);
							}
							break;
					}

					if (!isValid) {
						errors.push({
							field: rule.field,
							rule: rule.name,
							message: rule.message,
							value: numValue,
							severity: 'error'
						});
					}
				} catch (error) {
					errors.push({
						field: rule.field,
						rule: rule.name,
						message: `验证规则执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
						value: numValue,
						severity: 'error'
					});
				}
			}
		}

		return {
			field: rules[0]?.field || 'number',
			isValid: errors.length === 0,
			errors,
			warnings,
			value: numValue
		};
	}

	getDefaultRules(type: string): ValidationRule[] {
		return [
			{
				name: 'type',
				field: type,
				type: 'custom',
				message: '必须是有效的数字',
				validator: (value) => !isNaN(Number(value)),
				priority: 1
			}
		];
	}
}

// Canvas数据验证策略
export class CanvasValidationStrategy implements ValidationStrategy {
	name = 'canvas';

	canValidate(type: string): boolean {
		return type === 'canvas' || type === 'canvasData' || type === 'canvasNode';
	}

	async validate(value: any, rules: ValidationRule[], context?: any): Promise<FieldValidationResult> {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		try {
			// 验证Canvas数据结构
			if (typeof value !== 'object' || value === null) {
				errors.push({
					field: 'canvas',
					rule: 'structure',
					message: 'Canvas数据必须是对象',
					value,
					severity: 'error'
				});
			} else {
				// 验证必需字段
				if (!value.nodes || !Array.isArray(value.nodes)) {
					errors.push({
						field: 'canvas.nodes',
						rule: 'required',
						message: 'Canvas必须包含nodes数组',
						value: value.nodes,
						severity: 'error'
					});
				}

				if (!value.edges || !Array.isArray(value.edges)) {
					errors.push({
						field: 'canvas.edges',
						rule: 'required',
						message: 'Canvas必须包含edges数组',
						value: value.edges,
						severity: 'error'
					});
				}

				// 验证节点
				if (value.nodes && Array.isArray(value.nodes)) {
					value.nodes.forEach((node: any, index: number) => {
						if (!node.id) {
							errors.push({
								field: `canvas.nodes[${index}].id`,
								rule: 'required',
								message: '节点必须有ID',
								value: node.id,
								severity: 'error'
							});
						}

						if (typeof node.x !== 'number' || typeof node.y !== 'number') {
							errors.push({
								field: `canvas.nodes[${index}].position`,
								rule: 'type',
								message: '节点位置必须是数字',
								value: { x: node.x, y: node.y },
								severity: 'error'
							});
						}
					});
				}

				// 性能警告
				if (value.nodes && value.nodes.length > 1000) {
					warnings.push({
						field: 'canvas.nodes',
						message: '节点数量过多，可能影响性能',
						suggestion: '考虑分组或分页显示'
					});
				}
			}

			// 执行自定义规则
			for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
				if (rule.type === 'custom' && rule.validator) {
					try {
						const isValid = await rule.validator(value, context);
						if (!isValid) {
							errors.push({
								field: rule.field,
								rule: rule.name,
								message: rule.message,
								value,
								severity: 'error'
							});
						}
					} catch (error) {
						errors.push({
							field: rule.field,
							rule: rule.name,
							message: `自定义验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
							value,
							severity: 'error'
						});
					}
				}
			}

		} catch (error) {
			errors.push({
				field: 'canvas',
				rule: 'validation',
				message: `Canvas验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
				value,
				severity: 'error'
			});
		}

		return {
			field: 'canvas',
			isValid: errors.length === 0,
			errors,
			warnings,
			value
		};
	}

	getDefaultRules(type: string): ValidationRule[] {
		return [
			{
				name: 'structure',
				field: 'canvas',
				type: 'custom',
				message: 'Canvas数据结构无效',
				validator: (value) => {
					return typeof value === 'object' && 
						   value !== null && 
						   Array.isArray(value.nodes) && 
						   Array.isArray(value.edges);
				},
				priority: 1
			}
		];
	}
}

// 验证管理器主类
export class ValidationManager {
	private app: App;
	private config: ValidationConfig;
	private strategies: Map<string, ValidationStrategy> = new Map();
	private rules: Map<string, ValidationRule[]> = new Map();
	private validationCache: Map<string, ValidationResult> = new Map();
	private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

	constructor(app: App, config: ValidationConfig) {
		this.app = app;
		this.config = config;
		
		this.initializeStrategies();
		this.setupDefaultRules();
	}

	/**
	 * 初始化验证策略
	 */
	private initializeStrategies(): void {
		this.strategies.set('text', new TextValidationStrategy());
		this.strategies.set('number', new NumberValidationStrategy());
		this.strategies.set('canvas', new CanvasValidationStrategy());
	}

	/**
	 * 设置默认验证规则
	 */
	private setupDefaultRules(): void {
		// 为每种类型设置默认规则
		for (const [type, strategy] of this.strategies) {
			const defaultRules = strategy.getDefaultRules(type);
			this.rules.set(type, defaultRules);
		}

		// 添加自定义规则
		if (this.config.enableCustomRules && this.config.customRules) {
			this.config.customRules.forEach(rule => {
				const existingRules = this.rules.get(rule.field) || [];
				existingRules.push(rule);
				this.rules.set(rule.field, existingRules);
			});
		}
	}

	/**
	 * 验证单个字段
	 */
	async validateField(field: string, value: any, type: string, context?: any): Promise<FieldValidationResult> {
		const strategy = this.findStrategy(type);
		if (!strategy) {
			return {
				field,
				isValid: false,
				errors: [{
					field,
					rule: 'strategy',
					message: `不支持的验证类型: ${type}`,
					value,
					severity: 'error'
				}],
				warnings: [],
				value
			};
		}

		const rules = this.rules.get(field) || strategy.getDefaultRules(type);
		return await strategy.validate(value, rules, context);
	}

	/**
	 * 验证多个字段
	 */
	async validateFields(data: Record<string, any>, schema: Record<string, string>, context?: any): Promise<ValidationResult> {
		const startTime = Date.now();
		const fieldResults = new Map<string, FieldValidationResult>();
		const allErrors: ValidationError[] = [];
		const allWarnings: ValidationWarning[] = [];

		// 并行验证所有字段
		const validationPromises = Object.entries(data).map(async ([field, value]) => {
			const type = schema[field] || 'text';
			const result = await this.validateField(field, value, type, context);
			fieldResults.set(field, result);
			allErrors.push(...result.errors);
			allWarnings.push(...result.warnings);
		});

		await Promise.all(validationPromises);

		const result: ValidationResult = {
			isValid: allErrors.length === 0,
			errors: allErrors,
			warnings: allWarnings,
			fieldResults,
			timestamp: startTime,
			duration: Date.now() - startTime
		};

		// 缓存结果
		const cacheKey = this.generateCacheKey(data, schema);
		this.validationCache.set(cacheKey, result);

		return result;
	}

	/**
	 * 实时验证（带防抖）
	 */
	async validateRealTime(field: string, value: any, type: string, context?: any): Promise<void> {
		if (!this.config.enableRealTimeValidation) {
			return;
		}

		// 清除之前的定时器
		const existingTimer = this.debounceTimers.get(field);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// 设置新的防抖定时器
		const timer = setTimeout(async () => {
			const result = await this.validateField(field, value, type, context);
			this.emitValidationResult(field, result);
			this.debounceTimers.delete(field);
		}, this.config.debounceDelay);

		this.debounceTimers.set(field, timer);
	}

	/**
	 * 添加验证规则
	 */
	addRule(field: string, rule: ValidationRule): void {
		const existingRules = this.rules.get(field) || [];
		existingRules.push(rule);
		this.rules.set(field, existingRules.sort((a, b) => a.priority - b.priority));
	}

	/**
	 * 移除验证规则
	 */
	removeRule(field: string, ruleName: string): void {
		const existingRules = this.rules.get(field) || [];
		const filteredRules = existingRules.filter(rule => rule.name !== ruleName);
		this.rules.set(field, filteredRules);
	}

	/**
	 * 清空验证缓存
	 */
	clearCache(): void {
		this.validationCache.clear();
	}

	/**
	 * 查找验证策略
	 */
	private findStrategy(type: string): ValidationStrategy | null {
		for (const strategy of this.strategies.values()) {
			if (strategy.canValidate(type)) {
				return strategy;
			}
		}
		return null;
	}

	/**
	 * 生成缓存键
	 */
	private generateCacheKey(data: Record<string, any>, schema: Record<string, string>): string {
		return JSON.stringify({ data, schema });
	}

	/**
	 * 触发验证结果事件
	 */
	private emitValidationResult(field: string, result: FieldValidationResult): void {
		// 这里可以触发自定义事件
		// 由于这是一个管理器类，事件处理通常在使用它的组件中实现
		console.log(`Validation result for ${field}:`, result);
	}

	/**
	 * 注册验证策略
	 */
	registerStrategy(strategy: ValidationStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<ValidationConfig>): void {
		this.config = { ...this.config, ...config };
		this.setupDefaultRules();
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		// 清理所有定时器
		for (const timer of this.debounceTimers.values()) {
			clearTimeout(timer);
		}
		
		this.debounceTimers.clear();
		this.validationCache.clear();
		this.strategies.clear();
		this.rules.clear();
	}
}
