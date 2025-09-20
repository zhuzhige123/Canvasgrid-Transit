import { TFile, App } from 'obsidian';
import { CacheManager } from './CacheManager';
import { ValidationManager } from './ValidationManager';
import { DataValidator, ValidationResult } from '../utils/DataValidator';

// 接口定义
export interface CanvasNode {
	id: string;
	type: string;
	x: number;
	y: number;
	width: number;
	height: number;
	color?: string;
	text?: string;
	file?: string;
	url?: string;
}

export interface CanvasData {
	nodes: CanvasNode[];
	edges: any[];
}

// ValidationResult 已移至 DataValidator.ts，避免重复定义

// 数据验证器已移至 ValidationManager.ts，避免重复定义

// LRU缓存实现已移至 CacheManager.ts，避免重复定义

// 数据管理器
export class DataManager {
	private app: App;
	private cacheManager: CacheManager;
	private validationManager: ValidationManager;

	constructor(app: App, cacheSize: number = 10) {
		this.app = app;
		this.cacheManager = new CacheManager(app, {
			maxSize: cacheSize,
			ttl: 3600000, // 1小时
			enablePersistence: false,
			persistenceKey: 'dataManager',
			enableCompression: false,
			enableMetrics: false,
			cleanupInterval: 300000,
			enableLRU: true,
			enableTieredStorage: false
		});
		this.validationManager = new ValidationManager(app, {
			enableRealTimeValidation: false,
			enableStrictMode: true,
			maxErrorsPerField: 5,
			validationTimeout: 5000,
			enableCustomRules: false,
			customRules: [],
			enableAsyncValidation: false,
			debounceDelay: 300
		});
	}

	/**
	 * 加载Canvas文件数据
	 */
	async loadCanvas(file: TFile): Promise<CanvasData> {
		const cacheKey = file.path;
		
		// 检查缓存
		const cached = await this.cacheManager.get(cacheKey);
		if (cached) {
			return cached as CanvasData;
		}

		try {
			console.log('Loading canvas data from file:', file.path);
			const content = await this.app.vault.read(file);

			if (!content || content.trim() === '') {
				// 如果文件为空，创建空的Canvas数据
				console.log('Canvas file is empty, creating empty data structure');
				const emptyData: CanvasData = { nodes: [], edges: [] };
				await this.cacheManager.set(cacheKey, emptyData);
				return emptyData;
			}

			// 验证JSON格式
			let parsedData: CanvasData;
			try {
				parsedData = JSON.parse(content);
			} catch (parseError) {
				throw new Error(`JSON格式无效: ${parseError instanceof Error ? parseError.message : '解析错误'}`);
			}

			// 验证Canvas数据结构
			const validation = await this.validationManager.validateField('canvasData', parsedData, 'canvas');
			if (!validation.isValid) {
				throw new Error(`Canvas数据验证失败:\n${validation.errors.map((e: any) => e.message).join('\n')}`);
			}

			// 确保edges数组存在
			if (!Array.isArray(parsedData.edges)) {
				parsedData.edges = [];
			}

			// 缓存数据
			await this.cacheManager.set(cacheKey, parsedData);
			
			console.log('Canvas data loaded successfully:', file.path);
			return parsedData;

		} catch (error) {
			console.error('Failed to load canvas data from file:', error);
			throw error;
		}
	}

	/**
	 * 保存Canvas数据到文件
	 */
	async saveCanvas(data: CanvasData, file: TFile): Promise<void> {
		try {
			// 验证数据
			const dataValidator = new DataValidator();
			const validation = dataValidator.validateCanvasData(data);
			if (!validation.isValid) {
				throw new Error(`数据验证失败: ${validation.errors.join(', ')}`);
			}

			// 序列化数据
			const content = JSON.stringify(data, null, '\t');
			
			// 写入文件
			await this.app.vault.modify(file, content);
			
			// 更新缓存
			await this.cacheManager.set(file.path, data);
			
			console.log('Canvas data saved successfully:', file.path);

		} catch (error) {
			console.error('Failed to save canvas data:', error);
			throw error;
		}
	}

	/**
	 * 获取缓存的数据
	 */
	async getCachedData(filePath: string): Promise<CanvasData | null> {
		const cached = await this.cacheManager.get(filePath);
		return cached as CanvasData || null;
	}

	/**
	 * 清除缓存
	 */
	async clearCache(): Promise<void> {
		await this.cacheManager.clear();
	}

	/**
	 * 验证数据
	 */
	validateData(data: any): ValidationResult {
		const dataValidator = new DataValidator();
	return dataValidator.validateCanvasData(data);
	}

	/**
	 * 获取缓存统计信息
	 */
	async getCacheStats(): Promise<{ size: number; maxSize: number }> {
		const metrics = await this.cacheManager.getMetrics();
		const totalItems = typeof metrics === 'object' && 'totalItems' in metrics ? metrics.totalItems : 0;
		return {
			size: Number(totalItems) || 0,
			maxSize: 10 // 从构造函数配置获取
		};
	}
}
