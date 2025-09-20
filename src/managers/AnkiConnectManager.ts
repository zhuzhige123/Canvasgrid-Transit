import { App, Notice } from 'obsidian';

// Anki Connect配置接口
export interface AnkiConnectConfig {
	enabled: boolean;
	apiUrl: string;
	apiKey?: string;
	defaultDeck: string;
	modelName: string;
	syncColors: string[];
	enableIncrementalSync: boolean;
	enableAutoSync?: boolean;
	batchSize: number;
	retryAttempts: number;
	timeout: number;
	contentDivider: string; // 自定义分隔符
	forceSync?: boolean; // 强制同步选项
}

// Anki卡片接口
export interface AnkiNote {
	deckName: string;
	modelName: string;
	fields: Record<string, string>;
	tags: string[];
	options?: {
		allowDuplicate: boolean;
		duplicateScope: string;
	};
}

// 同步结果接口
export interface SyncResult {
	success: boolean;
	created: number;
	updated: number;
	skipped: number;
	errors: string[];
	totalProcessed: number;
	duration: number; // 同步耗时（毫秒）
}

// Anki Connect响应接口
export interface AnkiConnectResponse {
	result: any;
	error: string | null;
}

// Anki Connect管理器
export class AnkiConnectManager {
	private app: App;
	private config: AnkiConnectConfig;

	constructor(app: App, config: AnkiConnectConfig) {
		this.app = app;
		this.config = config;
	}

	/**
	 * 测试与Anki Connect的连接
	 */
	async testConnection(): Promise<boolean> {
		try {
			console.log(`AnkiConnect: 测试连接到 ${this.config.apiUrl}`);
			const response = await this.invoke('version');
			console.log(`AnkiConnect: 连接成功，版本:`, response);
			return response !== null;
		} catch (error) {
			console.error('Anki Connect连接测试失败:', error);
			if (error instanceof Error) {
				if (error.message.includes('fetch')) {
					console.error('AnkiConnect: 网络连接失败，请检查Anki是否运行');
				} else if (error.message.includes('timeout')) {
					console.error('AnkiConnect: 连接超时，请检查网络或增加超时时间');
				}
			}
			return false;
		}
	}

	/**
	 * 获取所有牌组名称
	 */
	async getDeckNames(): Promise<string[]> {
		try {
			const result = await this.invoke('deckNames');
			return result || [];
		} catch (error) {
			console.error('获取牌组列表失败:', error);
			return [];
		}
	}

	/**
	 * 获取所有模板名称
	 */
	async getModelNames(): Promise<string[]> {
		try {
			const result = await this.invoke('modelNames');
			return result || [];
		} catch (error) {
			console.error('获取模板列表失败:', error);
			return [];
		}
	}

	/**
	 * 获取指定模板的字段名称
	 */
	async getModelFields(modelName: string): Promise<string[]> {
		try {
			const result = await this.invoke('modelFieldNames', { modelName });
			return result || [];
		} catch (error) {
			console.error('获取模板字段失败:', error);
			return [];
		}
	}

	/**
	 * 检查牌组是否存在
	 */
	async deckExists(deckName: string): Promise<boolean> {
		try {
			const deckNames = await this.getDeckNames();
			return deckNames.includes(deckName);
		} catch (error) {
			console.error('检查牌组存在性失败:', error);
			return false;
		}
	}

	/**
	 * 创建牌组
	 */
	async createDeck(deckName: string): Promise<boolean> {
		try {
			console.log(`AnkiConnect: 创建牌组 "${deckName}"`);
			const result = await this.invoke('createDeck', { deck: deckName });
			console.log(`AnkiConnect: 牌组创建结果:`, result);
			return result !== null;
		} catch (error) {
			console.error(`AnkiConnect: 创建牌组 "${deckName}" 失败:`, error);
			return false;
		}
	}

	/**
	 * 确保牌组存在，如果不存在则创建
	 */
	async ensureDeckExists(deckName: string): Promise<boolean> {
		try {
			const exists = await this.deckExists(deckName);
			if (exists) {
				console.log(`AnkiConnect: 牌组 "${deckName}" 已存在`);
				return true;
			}

			console.log(`AnkiConnect: 牌组 "${deckName}" 不存在，尝试创建`);
			const created = await this.createDeck(deckName);

			if (created) {
				console.log(`AnkiConnect: 成功创建牌组 "${deckName}"`);
				return true;
			} else {
				console.error(`AnkiConnect: 创建牌组 "${deckName}" 失败`);
				return false;
			}
		} catch (error) {
			console.error(`AnkiConnect: 确保牌组存在时出错:`, error);
			return false;
		}
	}

	/**
	 * 添加单个卡片
	 */
	async addNote(note: AnkiNote): Promise<number | null> {
		try {
			console.log('AnkiConnect: 准备添加卡片:', {
				deck: note.deckName,
				model: note.modelName,
				fields: Object.keys(note.fields),
				tags: note.tags
			});

			const result = await this.invoke('addNote', { note });

			if (result) {
				console.log(`AnkiConnect: 成功添加卡片，ID: ${result}`);
			} else {
				console.warn('AnkiConnect: 添加卡片返回空结果');
			}

			return result;
		} catch (error) {
			console.error('AnkiConnect: 添加卡片失败:', error);
			console.error('AnkiConnect: 失败的卡片数据:', note);
			return null;
		}
	}

	/**
	 * 批量添加卡片
	 */
	async addNotes(notes: AnkiNote[]): Promise<number[]> {
		try {
			const result = await this.invoke('addNotes', { notes });
			return result || [];
		} catch (error) {
			console.error('批量添加卡片失败:', error);
			return [];
		}
	}

	/**
	 * 查找卡片
	 */
	async findNotes(query: string): Promise<number[]> {
		try {
			const result = await this.invoke('findNotes', { query });
			return result || [];
		} catch (error) {
			console.error('查找卡片失败:', error);
			return [];
		}
	}

	/**
	 * 检查模型是否存在
	 */
	async modelExists(modelName: string): Promise<boolean> {
		try {
			const modelNames = await this.getModelNames();
			return modelNames.includes(modelName);
		} catch (error) {
			console.error('检查模型存在性失败:', error);
			return false;
		}
	}

	/**
	 * 获取模型详细信息
	 */
	async getModelInfo(modelName: string): Promise<any> {
		try {
			const result = await this.invoke('modelNamesAndIds');
			const modelData = result ? Object.entries(result).find(([name]) => name === modelName) : null;
			if (!modelData) {
				return null;
			}

			const [name, id] = modelData;
			const fields = await this.getModelFields(modelName);
			const templates = await this.invoke('modelTemplates', { modelName });
			const styling = await this.invoke('modelStyling', { modelName });

			return {
				name,
				id,
				fields,
				templates: templates || {},
				css: styling?.css || ''
			};
		} catch (error) {
			console.error('获取模型信息失败:', error);
			return null;
		}
	}

	/**
	 * 创建新的Anki模型
	 */
	async createModel(modelName: string, inOrderFields: string[], css: string, cardTemplates: any[]): Promise<boolean> {
		try {
			console.log(`AnkiConnect: 创建模型 "${modelName}"`);
			console.log('AnkiConnect: 字段列表:', inOrderFields);
			console.log('AnkiConnect: 卡片模板数量:', cardTemplates.length);

			const result = await this.invoke('createModel', {
				modelName,
				inOrderFields,
				css,
				cardTemplates
			});

			if (result) {
				console.log(`AnkiConnect: 成功创建模型 "${modelName}"`);
				return true;
			} else {
				console.error(`AnkiConnect: 创建模型 "${modelName}" 返回空结果`);
				return false;
			}
		} catch (error) {
			console.error(`AnkiConnect: 创建模型 "${modelName}" 失败:`, error);
			return false;
		}
	}

	/**
	 * 更新模型字段
	 */
	async updateModelFields(modelName: string, targetFields: string[]): Promise<boolean> {
		try {
			console.log(`AnkiConnect: 更新模型 "${modelName}" 字段`);

			const currentFields = await this.getModelFields(modelName);
			console.log('AnkiConnect: 当前字段:', currentFields);
			console.log('AnkiConnect: 目标字段:', targetFields);

			// 添加缺失的字段
			for (const field of targetFields) {
				if (!currentFields.includes(field)) {
					console.log(`AnkiConnect: 添加字段 "${field}"`);
					const addResult = await this.invoke('modelFieldAdd', {
						modelName,
						fieldName: field,
						index: currentFields.length
					});
					if (!addResult) {
						console.error(`AnkiConnect: 添加字段 "${field}" 失败`);
						return false;
					}
				}
			}

			// 移除多余的字段（从后往前删除避免索引问题）
			const fieldsToRemove = currentFields.filter(field => !targetFields.includes(field));
			for (const field of fieldsToRemove.reverse()) {
				console.log(`AnkiConnect: 移除字段 "${field}"`);
				const removeResult = await this.invoke('modelFieldRemove', {
					modelName,
					fieldName: field
				});
				if (!removeResult) {
					console.error(`AnkiConnect: 移除字段 "${field}" 失败`);
					return false;
				}
			}

			console.log(`AnkiConnect: 模型 "${modelName}" 字段更新完成`);
			return true;
		} catch (error) {
			console.error(`AnkiConnect: 更新模型字段失败:`, error);
			return false;
		}
	}

	/**
	 * 更新模型模板
	 */
	async updateModelTemplates(modelName: string, templates: any): Promise<boolean> {
		try {
			console.log(`AnkiConnect: 更新模型 "${modelName}" 模板`);

			const result = await this.invoke('updateModelTemplates', {
				model: {
					name: modelName,
					templates
				}
			});

			if (result) {
				console.log(`AnkiConnect: 成功更新模型 "${modelName}" 模板`);
				return true;
			} else {
				console.error(`AnkiConnect: 更新模型模板返回空结果`);
				return false;
			}
		} catch (error) {
			console.error(`AnkiConnect: 更新模型模板失败:`, error);
			return false;
		}
	}

	/**
	 * 更新模型样式
	 */
	async updateModelStyling(modelName: string, css: string): Promise<boolean> {
		try {
			console.log(`AnkiConnect: 更新模型 "${modelName}" 样式`);

			const result = await this.invoke('updateModelStyling', {
				model: {
					name: modelName,
					css
				}
			});

			if (result) {
				console.log(`AnkiConnect: 成功更新模型 "${modelName}" 样式`);
				return true;
			} else {
				console.error(`AnkiConnect: 更新模型样式返回空结果`);
				return false;
			}
		} catch (error) {
			console.error(`AnkiConnect: 更新模型样式失败:`, error);
			return false;
		}
	}

	/**
	 * 核心API调用方法
	 */
	private async invoke(action: string, params: any = {}): Promise<any> {
		const requestBody = {
			action,
			version: 6,
			params,
			...(this.config.apiKey && { key: this.config.apiKey })
		};

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const response = await fetch(this.config.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP错误: ${response.status}`);
			}

			const data: AnkiConnectResponse = await response.json();

			if (data.error) {
				throw new Error(data.error);
			}

			return data.result;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('未知错误');
		}
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: AnkiConnectConfig): void {
		this.config = config;
	}

	/**
	 * 检查卡片是否存在
	 */
	async noteExists(noteId: number): Promise<boolean> {
		try {
			const response = await this.invoke('notesInfo', {
				notes: [noteId]
			});

			if (response && Array.isArray(response)) {
				// 如果返回的结果数组不为空且第一个元素不为null，说明卡片存在
				return response.length > 0 && response[0] !== null;
			}

			return false;
		} catch (error) {
			console.error('AnkiConnect: 检查卡片存在性失败:', error);
			return false;
		}
	}

	/**
	 * 更新现有卡片
	 */
	async updateNote(noteId: number, ankiNote: AnkiNote): Promise<boolean> {
		try {
			const updateData = {
				id: noteId,
				fields: ankiNote.fields,
				tags: ankiNote.tags
			};

			// 如果指定了牌组，也更新牌组
			if (ankiNote.deckName) {
				(updateData as any).deckName = ankiNote.deckName;
			}

			const response = await this.invoke('updateNoteFields', updateData);

			if (response !== null) {
				console.log(`AnkiConnect: 成功更新卡片 ${noteId}`);

				// 如果有标签更新，单独处理标签
				if (ankiNote.tags && ankiNote.tags.length > 0) {
					await this.updateNoteTags(noteId, ankiNote.tags);
				}

				return true;
			} else {
				console.error('AnkiConnect: 更新卡片失败');
				return false;
			}
		} catch (error) {
			console.error('AnkiConnect: 更新卡片异常:', error);
			return false;
		}
	}

	/**
	 * 更新卡片标签
	 */
	private async updateNoteTags(noteId: number, tags: string[]): Promise<boolean> {
		try {
			// 先清除现有标签
			await this.invoke('removeTags', {
				notes: [noteId],
				tags: ' ' // 清除所有标签
			});

			// 添加新标签
			if (tags.length > 0) {
				await this.invoke('addTags', {
					notes: [noteId],
					tags: tags.join(' ')
				});
			}

			return true;
		} catch (error) {
			console.error('AnkiConnect: 更新标签失败:', error);
			return false;
		}
	}
}
