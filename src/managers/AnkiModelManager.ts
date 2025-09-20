import { App } from 'obsidian';
import { AnkiConnectManager } from './AnkiConnectManager';
import { AnkiConnectConfig } from '../types/AnkiTypes';

/**
 * 插件专属模型定义
 */
export const PLUGIN_MODEL_DEFINITION = {
	name: 'Canvasgrid_Transit_Basic',
	fields: ['Front', 'Back', 'NodeId', 'Source', 'Color'],
	templates: [{
		Name: 'Card 1',
		Front: '{{Front}}',
		Back: `{{FrontSide}}

<hr id="answer">

{{Back}}

<div class="source-info">
	<small>{{Source}}</small>
</div>`
	}],
	css: `
.card {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	font-size: 16px;
	line-height: 1.6;
	color: var(--text-normal);
	background: var(--background-primary);
	padding: 20px;
	white-space: pre-wrap;
	word-break: break-word;
}

.card p {
	margin: 0.8em 0;
}

.card ul, .card ol {
	margin: 0.5em 0;
	padding-left: 1.5em;
}

.card li {
	margin: 0.3em 0;
}

.source-info {
	margin-top: 20px;
	padding-top: 10px;
	border-top: 1px solid var(--background-modifier-border);
	font-size: 12px;
	color: var(--text-muted);
}

.obsidian-link {
	color: var(--text-accent);
	text-decoration: none;
	font-weight: 500;
}

.obsidian-link:hover {
	text-decoration: underline;
}

/* 适配深色模式 */
.night_mode .card {
	background: #1e1e1e;
	color: #e0e0e0;
}

.night_mode .source-info {
	border-top-color: #404040;
	color: #a0a0a0;
}

.night_mode .obsidian-link {
	color: #7c3aed;
}
`
};

/**
 * 模型验证结果
 */
export interface ModelValidationResult {
	exists: boolean;
	fieldsMatch: boolean;
	needsUpdate: boolean;
	missingFields: string[];
	extraFields: string[];
	currentFields: string[];
}

/**
 * Anki模型管理器
 * 负责插件专属模型的创建、验证和更新
 */
export class AnkiModelManager {
	private app: App;
	private ankiConnectManager: AnkiConnectManager;
	private config: AnkiConnectConfig;

	constructor(app: App, ankiConnectManager: AnkiConnectManager, config: AnkiConnectConfig) {
		this.app = app;
		this.ankiConnectManager = ankiConnectManager;
		this.config = config;
	}

	/**
	 * 确保插件模型存在且字段正确
	 */
	async ensurePluginModelExists(): Promise<boolean> {
		try {
			console.log('AnkiModel: 开始检查插件专属模型');
			
			const validation = await this.validatePluginModel();
			console.log('AnkiModel: 模型验证结果:', validation);

			if (!validation.exists) {
				console.log('AnkiModel: 模型不存在，开始创建');
				return await this.createPluginModel();
			}

			if (validation.needsUpdate) {
				console.log('AnkiModel: 模型需要更新，开始覆盖');
				return await this.updatePluginModel();
			}

			console.log('AnkiModel: 模型已存在且字段正确');
			return true;
		} catch (error) {
			console.error('AnkiModel: 确保模型存在时出错:', error);
			return false;
		}
	}

	/**
	 * 验证插件模型状态
	 */
	async validatePluginModel(): Promise<ModelValidationResult> {
		const modelName = PLUGIN_MODEL_DEFINITION.name;
		const targetFields = PLUGIN_MODEL_DEFINITION.fields;

		try {
			const exists = await this.ankiConnectManager.modelExists(modelName);
			
			if (!exists) {
				return {
					exists: false,
					fieldsMatch: false,
					needsUpdate: false,
					missingFields: targetFields,
					extraFields: [],
					currentFields: []
				};
			}

			const currentFields = await this.ankiConnectManager.getModelFields(modelName);
			const missingFields = targetFields.filter(field => !currentFields.includes(field));
			const extraFields = currentFields.filter(field => !targetFields.includes(field));
			const fieldsMatch = missingFields.length === 0 && extraFields.length === 0;

			return {
				exists: true,
				fieldsMatch,
				needsUpdate: !fieldsMatch,
				missingFields,
				extraFields,
				currentFields
			};
		} catch (error) {
			console.error('AnkiModel: 验证模型时出错:', error);
			throw error;
		}
	}

	/**
	 * 创建插件专属模型
	 */
	async createPluginModel(): Promise<boolean> {
		const { name, fields, templates, css } = PLUGIN_MODEL_DEFINITION;

		try {
			console.log(`AnkiModel: 创建模型 "${name}"`);
			console.log('AnkiModel: 字段:', fields);
			console.log('AnkiModel: 模板数量:', templates.length);

			const success = await this.ankiConnectManager.createModel(name, fields, css, templates);
			
			if (success) {
				console.log(`AnkiModel: 成功创建模型 "${name}"`);
				return true;
			} else {
				console.error(`AnkiModel: 创建模型 "${name}" 失败`);
				return false;
			}
		} catch (error) {
			console.error('AnkiModel: 创建模型时出错:', error);
			return false;
		}
	}

	/**
	 * 更新插件模型（覆盖策略）
	 */
	async updatePluginModel(): Promise<boolean> {
		const { name, fields, templates, css } = PLUGIN_MODEL_DEFINITION;

		try {
			console.log(`AnkiModel: 更新模型 "${name}"`);
			
			// 更新字段
			const fieldsUpdated = await this.ankiConnectManager.updateModelFields(name, fields);
			if (!fieldsUpdated) {
				console.error('AnkiModel: 更新字段失败');
				return false;
			}

			// 更新模板
			const templatesUpdated = await this.ankiConnectManager.updateModelTemplates(name, templates);
			if (!templatesUpdated) {
				console.error('AnkiModel: 更新模板失败');
				return false;
			}

			// 更新样式
			const stylingUpdated = await this.ankiConnectManager.updateModelStyling(name, css);
			if (!stylingUpdated) {
				console.error('AnkiModel: 更新样式失败');
				return false;
			}

			console.log(`AnkiModel: 成功更新模型 "${name}"`);
			return true;
		} catch (error) {
			console.error('AnkiModel: 更新模型时出错:', error);
			return false;
		}
	}

	/**
	 * 获取插件模型名称
	 */
	getPluginModelName(): string {
		return PLUGIN_MODEL_DEFINITION.name;
	}

	/**
	 * 获取插件模型字段列表
	 */
	getPluginModelFields(): string[] {
		return [...PLUGIN_MODEL_DEFINITION.fields];
	}

	/**
	 * 检查字段是否为插件模型的必需字段
	 */
	isRequiredField(fieldName: string): boolean {
		return PLUGIN_MODEL_DEFINITION.fields.includes(fieldName);
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: AnkiConnectConfig): void {
		this.config = config;
	}
}
