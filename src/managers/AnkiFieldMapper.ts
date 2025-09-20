import { App, TFile } from 'obsidian';
import { AnkiNote, AnkiConnectConfig, ConversionResult, FieldMapping } from '../types/AnkiTypes';
import { CanvasNode } from '../types/CanvasTypes';
import { ObsidianLinkGenerator } from '../utils/ObsidianLinkGenerator';
import { ObsidianLinkManager } from './ObsidianLinkManager';
import { MediaSyncManager } from './MediaSyncManager';
import { PLUGIN_MODEL_DEFINITION } from './AnkiModelManager';
import { LinkOptions } from '../types/LinkTypes';
import { MediaSyncConfig } from '../types/MediaTypes';

/**
 * Anki字段映射管理器
 * 负责将Canvas节点转换为Anki卡片格式
 */
export class AnkiFieldMapper {
	private app: App;
	private config: AnkiConnectConfig;
	private fieldMappings: FieldMapping[] = [];
	private obsidianLinkManager: ObsidianLinkManager;
	private mediaSyncManager: MediaSyncManager | null = null;

	constructor(app: App, config: AnkiConnectConfig, mediaSyncConfig?: MediaSyncConfig) {
		this.app = app;
		this.config = config;
		this.obsidianLinkManager = new ObsidianLinkManager(app);

		// 如果提供了媒体同步配置，初始化媒体同步管理器
		if (mediaSyncConfig && mediaSyncConfig.enabled) {
			// 注意：这里需要AnkiConnectManager实例，暂时设为null
			// 在实际使用时需要通过setter方法设置
			this.mediaSyncManager = null;
		}

		this.initializeDefaultFieldMappings();
	}

	/**
	 * 将Canvas节点转换为Anki卡片
	 */
	mapNodeToAnkiNote(node: CanvasNode, canvasFile?: TFile, contentDivider: string = '---div---'): ConversionResult {
		const warnings: string[] = [];

		try {
			// 二次保护：排除分组节点
			if (node.type === 'group') {
				return {
					success: false,
					error: '分组节点不支持同步',
					warnings: []
				};
			}

			// 验证节点数据
			const validationResult = this.validateNode(node);
			if (!validationResult.valid) {
				return {
					success: false,
					error: `节点验证失败: ${validationResult.errors.join(', ')}`,
					warnings: validationResult.warnings
				};
			}

			// 提取文本内容
			const textContent = this.extractTextContent(node);
			if (!textContent) {
				return {
					success: false,
					error: '无法提取节点文本内容',
					warnings
				};
			}

			// 生成字段映射（使用插件专属模型）
			const fields = this.generatePluginModelFields(node, textContent, canvasFile, contentDivider);

			// 生成标签
			const tags = this.generateTags(node);

			// 创建Anki卡片（使用插件专属模型）
			const ankiNote: AnkiNote = {
				deckName: this.config.defaultDeck,
				modelName: PLUGIN_MODEL_DEFINITION.name,
				fields,
				tags,
				options: {
					allowDuplicate: false,
					duplicateScope: 'deck'
				}
			};

			// 打印详细的字段信息用于调试
			console.log('AnkiFieldMapper: 生成的卡片数据:', {
				modelName: ankiNote.modelName,
				deckName: ankiNote.deckName,
				fields: Object.entries(ankiNote.fields).map(([key, value]) => ({
					field: key,
					value: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
					length: value.length
				})),
				tags: ankiNote.tags
			});

			return {
				success: true,
				ankiNote,
				warnings
			};

		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : '转换过程中发生未知错误',
				warnings
			};
		}
	}

	/**
	 * 提取节点文本内容
	 */
	extractTextContent(node: CanvasNode): string {
		console.log(`AnkiFieldMapper: 提取节点内容 - ID: ${node.id}, 类型: ${node.type}`);

		let content = '';
		switch (node.type) {
			case 'text':
				content = node.text || '';
				console.log(`AnkiFieldMapper: 文本节点内容长度: ${content.length}`);
				break;

			case 'file':
				// 对于文件节点，使用文件路径作为内容
				content = node.file ? `文件: ${node.file}` : '';
				console.log(`AnkiFieldMapper: 文件节点路径: ${node.file || '(空)'}`);
				break;

			case 'link':
				// 对于链接节点，使用URL
				content = node.url || '';
				console.log(`AnkiFieldMapper: 链接节点URL: ${node.url || '(空)'}`);
				break;

			case 'group':
				// 对于分组节点，使用标签作为内容
				content = node.label || '分组';
				console.log(`AnkiFieldMapper: 分组节点标签: ${node.label || '(空)'}`);
				break;

			default:
				content = '';
				console.warn(`AnkiFieldMapper: 未知节点类型: ${node.type}`);
		}

		console.log(`AnkiFieldMapper: 最终提取内容: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
		return content.trim();
	}

	/**
	 * 生成插件专属模型的字段映射
	 */
	private generatePluginModelFields(node: CanvasNode, textContent: string, canvasFile?: TFile, contentDivider: string = '---div---'): Record<string, string> {
		console.log(`AnkiFieldMapper: 开始生成字段映射 - 节点: ${node.id}`);
		console.log(`AnkiFieldMapper: 输入文本内容: "${textContent}"`);
		console.log(`AnkiFieldMapper: 使用分隔符: "${contentDivider}"`);

		const fields: Record<string, string> = {};

		// 解析内容分隔符
		const parsedContent = this.parseContentWithDivider(textContent, contentDivider);
		console.log(`AnkiFieldMapper: 解析结果 - 正面: "${parsedContent.front}", 背面: "${parsedContent.back}", 有背面: ${parsedContent.hasBack}`);

		// 生成增强的 HTML Obsidian 链接
		const obsidianHtmlLink = this.generateEnhancedObsidianLink(canvasFile, node);
		console.log(`AnkiFieldMapper: 生成HTML链接: "${obsidianHtmlLink}"`);

		// Front字段：分隔符前内容 + 颜色标签 + Obsidian链接
		let frontContent = parsedContent.front;

		// 如果正面内容为空，使用兜底内容
		if (!frontContent || frontContent.trim() === '') {
			frontContent = this.generateFallbackFrontContent(node);
			console.log(`AnkiFieldMapper: 使用兜底内容: "${frontContent}"`);
		}

		// 添加颜色标签
		if (node.color) {
			const colorTag = this.formatColorTag(node.color);
			frontContent += ` ${colorTag}`;
			console.log(`AnkiFieldMapper: 添加颜色标签: "${colorTag}"`);
		}

		// 添加增强的 HTML Obsidian 链接
		if (obsidianHtmlLink) {
			frontContent += `\n\n${obsidianHtmlLink}`;
		}

		fields['Front'] = this.formatContentForAnki(frontContent);

		// Back字段：分隔符后内容（如果存在）
		fields['Back'] = parsedContent.hasBack ?
			this.formatContentForAnki(parsedContent.back) : '';

		// NodeId字段：节点ID
		fields['NodeId'] = node.id;

		// Source字段：Canvas文件名
		fields['Source'] = canvasFile ? canvasFile.basename : '未知来源';

		// Color字段：颜色名称（保留用于管理）
		fields['Color'] = node.color ? this.getColorName(node.color) : '';

		// 验证所有字段都已填充，特别是 Front 字段
		for (const [fieldName, fieldValue] of Object.entries(fields)) {
			if (fieldValue === undefined || fieldValue === null) {
				console.warn(`AnkiFieldMapper: 字段 "${fieldName}" 为空，使用默认值`);
				fields[fieldName] = '';
			}
		}

		// 最终验证 Front 字段不能为空
		if (!fields['Front'] || fields['Front'].trim() === '') {
			const emergencyContent = `${node.type}节点 (${node.id})`;
			fields['Front'] = this.formatContentForAnki(emergencyContent);
			console.error(`AnkiFieldMapper: Front字段为空，使用紧急内容: "${emergencyContent}"`);
		}

		// 调试日志：打印字段值
		console.log(`AnkiFieldMapper: 生成字段映射 ${node.id}:`, {
			Front: fields['Front']?.substring(0, 100) + '...',
			Back: fields['Back']?.substring(0, 50) + '...',
			NodeId: fields['NodeId'],
			Source: fields['Source'],
			Color: fields['Color'],
			HasObsidianLink: obsidianHtmlLink ? '是' : '否'
		});

		return fields;
	}

	/**
	 * 生成兜底的Front内容（确保永不为空）
	 */
	private generateFallbackFrontContent(node: CanvasNode): string {
		switch (node.type) {
			case 'text':
				return '空文本节点';
			case 'file':
				return node.file ? `文件: ${node.file}` : '空文件节点';
			case 'link':
				return node.url ? `链接: ${node.url}` : '空链接节点';
			case 'group':
				return node.label ? `分组: ${node.label}` : '空分组节点';
			default:
				return `${node.type}节点`;
		}
	}

	/**
	 * 生成正面内容
	 */
	private generateFrontContent(node: CanvasNode, textContent: string): string {
		let frontContent = textContent;

		// 根据节点类型添加特殊处理
		switch (node.type) {
			case 'file':
				frontContent = `文件: ${textContent}`;
				break;

			case 'link':
				frontContent = `链接: ${textContent}`;
				break;

			case 'group':
				frontContent = `分组: ${textContent}`;
				break;
		}

		// 添加颜色信息（如果有）
		if (node.color) {
			const colorName = this.getColorName(node.color);
			frontContent += `\n\n<small style="color: ${this.getColorValue(node.color)};">标签: ${colorName}</small>`;
		}

		// 格式化内容用于Anki显示
		return this.formatContentForAnki(frontContent);
	}

	/**
	 * 生成背面内容
	 */
	private generateBackContent(node: CanvasNode, textContent: string): string {
		let backContent = '';

		// 根据节点类型生成不同的背面内容
		switch (node.type) {
			case 'text':
				// 对于文本节点，可以尝试提取关键信息作为背面
				backContent = this.extractKeyInformation(textContent);
				break;
			
			case 'file':
				backContent = `文件路径: ${node.file}\n\n点击查看文件内容`;
				break;
			
			case 'link':
				backContent = `URL: ${node.url}\n\n点击访问链接`;
				break;
			
			case 'group':
				backContent = `分组信息\n位置: (${node.x}, ${node.y})\n大小: ${node.width} × ${node.height}`;
				break;
		}

		// 添加源信息
		const sourceInfo = this.generateSourceInfo(node);
		if (sourceInfo) {
			backContent += `\n\n---\n${sourceInfo}`;
		}

		const finalContent = backContent || textContent; // 如果没有特殊内容，使用原文本

		// 格式化内容用于Anki显示
		return this.formatContentForAnki(finalContent);
	}

	/**
	 * 生成填空题内容
	 */
	private generateClozeContent(node: CanvasNode, textContent: string): string {
		// 简单的填空题生成：将关键词用{{c1::}}包围
		let clozeContent = textContent;

		// 查找可能的关键词（简单实现）
		const keywords = this.extractKeywords(textContent);
		keywords.forEach((keyword, index) => {
			const clozeNumber = index + 1;
			clozeContent = clozeContent.replace(
				new RegExp(`\\b${keyword}\\b`, 'gi'),
				`{{c${clozeNumber}::${keyword}}}`
			);
		});

		return clozeContent;
	}

	/**
	 * 生成额外内容
	 */
	private generateExtraContent(node: CanvasNode): string {
		const extras: string[] = [];

		// 添加节点类型信息
		extras.push(`类型: ${node.type}`);

		// 添加位置信息
		extras.push(`位置: (${node.x}, ${node.y})`);

		// 添加颜色信息
		if (node.color) {
			extras.push(`颜色: ${this.getColorName(node.color)}`);
		}

		// 添加时间戳
		extras.push(`创建时间: ${new Date().toLocaleString()}`);

		return extras.join('\n');
	}

	/**
	 * 生成元数据
	 */
	private generateMetadata(node: CanvasNode): string {
		const metadata = {
			nodeId: node.id,
			nodeType: node.type,
			position: { x: node.x, y: node.y },
			size: { width: node.width, height: node.height },
			color: node.color,
			createdAt: new Date().toISOString()
		};

		return JSON.stringify(metadata, null, 2);
	}

	/**
	 * 生成标签
	 */
	generateTags(node: CanvasNode): string[] {
		const tags: string[] = [];

		// 添加基础标签
		tags.push('canvasgrid-transit');
		tags.push(`type-${node.type}`);

		// 添加颜色标签
		if (node.color) {
			tags.push(`color-${this.getColorName(node.color).toLowerCase()}`);
		}

		// 从文本内容中提取标签
		const textTags = this.extractTagsFromText(this.extractTextContent(node));
		tags.push(...textTags);

		// 去重并过滤空标签
		return [...new Set(tags)].filter(tag => tag && tag.trim().length > 0);
	}

	/**
	 * 处理特殊内容（如图片、链接等）
	 */
	handleSpecialContent(node: CanvasNode): Record<string, string> {
		const specialFields: Record<string, string> = {};

		// 处理文件节点
		if (node.type === 'file' && node.file) {
			specialFields['File'] = node.file;
			
			// 如果是图片文件，添加图片字段
			if (this.isImageFile(node.file)) {
				specialFields['Image'] = `<img src="${node.file}" alt="Canvas Image">`;
			}
		}

		// 处理链接节点
		if (node.type === 'link' && node.url) {
			specialFields['URL'] = node.url;
			specialFields['Link'] = `<a href="${node.url}" target="_blank">${node.url}</a>`;
		}

		return specialFields;
	}

	/**
	 * 验证节点数据
	 */
	private validateNode(node: CanvasNode): { valid: boolean; errors: string[]; warnings: string[] } {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 检查必需字段
		if (!node.id) errors.push('节点ID缺失');
		if (!node.type) errors.push('节点类型缺失');
		if (typeof node.x !== 'number') errors.push('节点X坐标无效');
		if (typeof node.y !== 'number') errors.push('节点Y坐标无效');

		// 检查内容
		const hasContent = node.text || node.file || node.url || node.label;
		if (!hasContent) {
			errors.push('节点内容为空');
		}

		// 检查颜色筛选
		if (node.color && !this.config.syncColors.includes(node.color)) {
			warnings.push('节点颜色不在同步范围内');
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings
		};
	}

	/**
	 * 从文本中提取关键词
	 */
	private extractKeywords(text: string): string[] {
		// 简单的关键词提取（可以改进）
		const words = text.split(/\s+/);
		return words
			.filter(word => word.length > 3) // 只保留长度大于3的词
			.filter(word => !/^[0-9]+$/.test(word)) // 排除纯数字
			.slice(0, 3); // 最多3个关键词
	}

	/**
	 * 提取关键信息
	 */
	private extractKeyInformation(text: string): string {
		// 简单的关键信息提取
		const sentences = text.split(/[.!?。！？]/);
		return sentences[0] || text.substring(0, 100) + '...';
	}

	/**
	 * 生成源信息
	 */
	private generateSourceInfo(node: CanvasNode): string {
		return `来源: Canvasgrid Transit\n节点ID: ${node.id}\n创建时间: ${new Date().toLocaleString()}`;
	}

	/**
	 * 从文本中提取标签
	 */
	private extractTagsFromText(text: string): string[] {
		const tagRegex = /#[\w\u4e00-\u9fa5]+/g;
		const matches = text.match(tagRegex);
		return matches ? matches.map(tag => tag.substring(1)) : [];
	}

	/**
	 * 判断是否为图片文件
	 */
	private isImageFile(filename: string): boolean {
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
		return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
	}

	/**
	 * 获取颜色名称
	 */
	private getColorName(colorId: string): string {
		const colorNames: Record<string, string> = {
			'1': '红色',
			'2': '橙色',
			'3': '黄色',
			'4': '绿色',
			'5': '青色',
			'6': '蓝色',
			'7': '紫色'
		};
		return colorNames[colorId] || colorId;
	}

	/**
	 * 获取颜色值
	 */
	private getColorValue(colorId: string): string {
		const colorValues: Record<string, string> = {
			'1': '#ff6b6b',
			'2': '#ffa726',
			'3': '#ffeb3b',
			'4': '#66bb6a',
			'5': '#26c6da',
			'6': '#42a5f5',
			'7': '#ab47bc'
		};
		return colorValues[colorId] || '#999999';
	}

	/**
	 * 初始化默认字段映射
	 */
	private initializeDefaultFieldMappings(): void {
		this.fieldMappings = [
			{
				ankiField: 'Front',
				canvasProperty: 'text'
			},
			{
				ankiField: 'Back',
				canvasProperty: 'text'
			}
		];
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: AnkiConnectConfig): void {
		this.config = config;
	}

	/**
	 * 设置自定义字段映射
	 */
	setFieldMappings(mappings: FieldMapping[]): void {
		this.fieldMappings = mappings;
	}

	/**
	 * 获取当前字段映射
	 */
	getFieldMappings(): FieldMapping[] {
		return [...this.fieldMappings];
	}

	/**
	 * 解析内容分隔符
	 */
	private parseContentWithDivider(content: string, divider: string): { front: string; back: string; hasBack: boolean } {
		if (!divider || !content.includes(divider)) {
			return { front: content, back: '', hasBack: false };
		}

		const parts = content.split(divider);
		return {
			front: parts[0]?.trim() || '',
			back: parts.slice(1).join(divider).trim(),
			hasBack: true
		};
	}

	/**
	 * 格式化颜色标签
	 */
	private formatColorTag(colorValue: string): string {
		const colorNames: Record<string, string> = {
			'1': '红色', '2': '橙色', '3': '黄色', '4': '绿色',
			'5': '青色', '6': '蓝色', '7': '紫色', '8': '粉色'
		};
		const colorName = colorNames[colorValue] || `颜色${colorValue}`;
		return `#${colorName}`;
	}

	/**
	 * 生成增强的 HTML Obsidian 链接
	 */
	private generateEnhancedObsidianLink(canvasFile?: TFile, node?: CanvasNode): string {
		if (!canvasFile || !node) {
			return '';
		}

		try {
			const linkOptions: LinkOptions = {
				style: 'enhanced',
				includeMetadata: true,
				multiLevel: false,
				includeCoordinates: true,
				includeTimestamp: false,
				target: '_blank',
				cssClass: 'obsidian-canvas-link'
			};

			const htmlLink = this.obsidianLinkManager.generateHtmlLink(canvasFile, node, linkOptions);
			console.log(`AnkiFieldMapper: 生成HTML链接 - ${htmlLink}`);
			return htmlLink;

		} catch (error) {
			console.error('AnkiFieldMapper: 生成HTML链接失败:', error);
			// 回退到简单链接
			return this.generateFallbackLink(canvasFile, node);
		}
	}

	/**
	 * 生成后备链接（当增强链接失败时使用）
	 */
	private generateFallbackLink(canvasFile: TFile, node: CanvasNode): string {
		try {
			const vaultName = (this.app.vault as any).adapter?.name || 'vault';
			const encodedVault = encodeURIComponent(vaultName);
			const encodedPath = encodeURIComponent(canvasFile.path);
			const baseLink = `obsidian://open?vault=${encodedVault}&file=${encodedPath}`;
			const nodeParams = `&nodeId=${node.id}&x=${node.x}&y=${node.y}`;
			const fullLink = baseLink + nodeParams;

			return `<a href="${fullLink}" target="_blank" style="color: #0066cc; text-decoration: none;">📍 在Obsidian中查看</a>`;
		} catch (error) {
			console.error('AnkiFieldMapper: 生成后备链接失败:', error);
			return '';
		}
	}

	/**
	 * 生成官方 Obsidian Canvas 链接
	 */
	private generateOfficialCanvasLink(canvasFile?: TFile, node?: CanvasNode): string {
		if (!canvasFile || !node) {
			return '';
		}

		try {
			// 获取 Vault 名称
			const vaultName = (this.app.vault as any).adapter?.name || 'vault';

			// 编码文件路径和参数
			const encodedVault = encodeURIComponent(vaultName);
			const encodedPath = encodeURIComponent(canvasFile.path);

			// 生成官方 Canvas 链接格式
			const baseLink = `obsidian://open?vault=${encodedVault}&file=${encodedPath}`;

			// 添加节点定位参数（用于插件内部处理）
			const nodeParams = `&nodeId=${node.id}&x=${node.x}&y=${node.y}`;

			return baseLink + nodeParams;
		} catch (error) {
			console.warn('生成 Obsidian 链接失败:', error);
			return '';
		}
	}

	/**
	 * 格式化内容用于Anki显示
	 */
	private formatContentForAnki(content: string): string {
		if (!content || !content.trim()) {
			return content;
		}

		return content
			// 将连续的两个或多个换行符转换为段落分隔
			.replace(/\n{2,}/g, '<br><br>')
			// 将单个换行符转换为换行符
			.replace(/\n/g, '<br>')
			// 清理多余的空格
			.replace(/\s+/g, ' ')
			.trim();
	}
}
