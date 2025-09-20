import { App } from 'obsidian';

// 缓存配置接口
export interface CacheConfig {
	maxSize: number;
	ttl: number; // 生存时间（毫秒）
	enablePersistence: boolean;
	persistenceKey: string;
	enableCompression: boolean;
	enableMetrics: boolean;
	cleanupInterval: number;
	enableLRU: boolean;
	enableTieredStorage: boolean;
}

// 缓存项接口
export interface CacheItem<T = any> {
	key: string;
	value: T;
	timestamp: number;
	ttl: number;
	accessCount: number;
	lastAccessed: number;
	size: number;
	compressed?: boolean;
	tier?: 'memory' | 'storage' | 'disk';
}

// 缓存统计接口
export interface CacheMetrics {
	hits: number;
	misses: number;
	hitRate: number;
	totalItems: number;
	totalSize: number;
	averageAccessTime: number;
	evictions: number;
	compressionRatio: number;
}

// 缓存策略接口
export interface CacheStrategy<T = any> {
	name: string;
	canHandle(key: string, value: T): boolean;
	store(key: string, value: T, ttl?: number): Promise<boolean>;
	retrieve(key: string): Promise<T | null>;
	remove(key: string): Promise<boolean>;
	clear(): Promise<void>;
	getSize(): number;
	getMetrics(): Partial<CacheMetrics>;
}

// 内存缓存策略
export class MemoryCacheStrategy<T = any> implements CacheStrategy<T> {
	name = 'memory';
	private cache = new Map<string, CacheItem<T>>();
	private accessOrder: string[] = [];
	private metrics: CacheMetrics = {
		hits: 0,
		misses: 0,
		hitRate: 0,
		totalItems: 0,
		totalSize: 0,
		averageAccessTime: 0,
		evictions: 0,
		compressionRatio: 1
	};

	constructor(private config: CacheConfig) {}

	canHandle(key: string, value: T): boolean {
		return true; // 内存缓存可以处理所有类型
	}

	async store(key: string, value: T, ttl?: number): Promise<boolean> {
		const startTime = Date.now();
		
		try {
			const size = this.calculateSize(value);
			const item: CacheItem<T> = {
				key,
				value,
				timestamp: Date.now(),
				ttl: ttl || this.config.ttl,
				accessCount: 0,
				lastAccessed: Date.now(),
				size,
				tier: 'memory'
			};

			// 检查是否需要压缩
			if (this.config.enableCompression && size > 1024) {
				item.value = await this.compress(value);
				item.compressed = true;
				item.size = this.calculateSize(item.value);
			}

			// 检查容量限制
			if (this.cache.size >= this.config.maxSize) {
				this.evictLRU();
			}

			this.cache.set(key, item);
			this.updateAccessOrder(key);
			this.updateMetrics(startTime, true);

			return true;
		} catch (error) {
			console.error('Failed to store in memory cache:', error);
			return false;
		}
	}

	async retrieve(key: string): Promise<T | null> {
		const startTime = Date.now();
		
		try {
			const item = this.cache.get(key);
			
			if (!item) {
				this.metrics.misses++;
				this.updateMetrics(startTime, false);
				return null;
			}

			// 检查是否过期
			if (this.isExpired(item)) {
				this.cache.delete(key);
				this.removeFromAccessOrder(key);
				this.metrics.misses++;
				this.updateMetrics(startTime, false);
				return null;
			}

			// 更新访问信息
			item.accessCount++;
			item.lastAccessed = Date.now();
			this.updateAccessOrder(key);

			// 解压缩（如果需要）
			let value = item.value;
			if (item.compressed) {
				value = await this.decompress(item.value);
			}

			this.metrics.hits++;
			this.updateMetrics(startTime, true);

			return value;
		} catch (error) {
			console.error('Failed to retrieve from memory cache:', error);
			this.metrics.misses++;
			this.updateMetrics(startTime, false);
			return null;
		}
	}

	async remove(key: string): Promise<boolean> {
		try {
			const removed = this.cache.delete(key);
			if (removed) {
				this.removeFromAccessOrder(key);
			}
			return removed;
		} catch (error) {
			console.error('Failed to remove from memory cache:', error);
			return false;
		}
	}

	async clear(): Promise<void> {
		this.cache.clear();
		this.accessOrder = [];
		this.resetMetrics();
	}

	getSize(): number {
		return this.cache.size;
	}

	getMetrics(): Partial<CacheMetrics> {
		this.metrics.totalItems = this.cache.size;
		this.metrics.totalSize = Array.from(this.cache.values())
			.reduce((total, item) => total + item.size, 0);
		this.metrics.hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
		
		return { ...this.metrics };
	}

	/**
	 * 检查项目是否过期
	 */
	private isExpired(item: CacheItem<T>): boolean {
		return Date.now() - item.timestamp > item.ttl;
	}

	/**
	 * LRU淘汰
	 */
	private evictLRU(): void {
		if (this.accessOrder.length === 0) return;
		
		const lruKey = this.accessOrder[0];
		this.cache.delete(lruKey);
		this.accessOrder.shift();
		this.metrics.evictions++;
	}

	/**
	 * 更新访问顺序
	 */
	private updateAccessOrder(key: string): void {
		this.removeFromAccessOrder(key);
		this.accessOrder.push(key);
	}

	/**
	 * 从访问顺序中移除
	 */
	private removeFromAccessOrder(key: string): void {
		const index = this.accessOrder.indexOf(key);
		if (index > -1) {
			this.accessOrder.splice(index, 1);
		}
	}

	/**
	 * 计算值的大小
	 */
	private calculateSize(value: T): number {
		try {
			return JSON.stringify(value).length;
		} catch {
			return 0;
		}
	}

	/**
	 * 压缩值
	 */
	private async compress(value: T): Promise<T> {
		// 简单的压缩实现（实际项目中可以使用更好的压缩算法）
		try {
			const jsonString = JSON.stringify(value);
			// 这里可以实现真正的压缩算法
			return value; // 暂时返回原值
		} catch {
			return value;
		}
	}

	/**
	 * 解压缩值
	 */
	private async decompress(value: T): Promise<T> {
		// 对应的解压缩实现
		return value;
	}

	/**
	 * 更新指标
	 */
	private updateMetrics(startTime: number, success: boolean): void {
		const duration = Date.now() - startTime;
		this.metrics.averageAccessTime = 
			(this.metrics.averageAccessTime + duration) / 2;
	}

	/**
	 * 重置指标
	 */
	private resetMetrics(): void {
		this.metrics = {
			hits: 0,
			misses: 0,
			hitRate: 0,
			totalItems: 0,
			totalSize: 0,
			averageAccessTime: 0,
			evictions: 0,
			compressionRatio: 1
		};
	}
}

// 持久化缓存策略
export class PersistentCacheStrategy<T = any> implements CacheStrategy<T> {
	name = 'persistent';
	private storageKey: string;

	constructor(private config: CacheConfig) {
		this.storageKey = config.persistenceKey || 'canvas-grid-cache';
	}

	canHandle(key: string, value: T): boolean {
		// 检查值是否可序列化
		try {
			JSON.stringify(value);
			return true;
		} catch {
			return false;
		}
	}

	async store(key: string, value: T, ttl?: number): Promise<boolean> {
		try {
			const data = this.loadFromStorage();
			const item: CacheItem<T> = {
				key,
				value,
				timestamp: Date.now(),
				ttl: ttl || this.config.ttl,
				accessCount: 0,
				lastAccessed: Date.now(),
				size: JSON.stringify(value).length,
				tier: 'storage'
			};

			data[key] = item;
			this.saveToStorage(data);
			return true;
		} catch (error) {
			console.error('Failed to store in persistent cache:', error);
			return false;
		}
	}

	async retrieve(key: string): Promise<T | null> {
		try {
			const data = this.loadFromStorage();
			const item = data[key];

			if (!item) {
				return null;
			}

			// 检查是否过期
			if (Date.now() - item.timestamp > item.ttl) {
				delete data[key];
				this.saveToStorage(data);
				return null;
			}

			// 更新访问信息
			item.accessCount++;
			item.lastAccessed = Date.now();
			data[key] = item;
			this.saveToStorage(data);

			return item.value;
		} catch (error) {
			console.error('Failed to retrieve from persistent cache:', error);
			return null;
		}
	}

	async remove(key: string): Promise<boolean> {
		try {
			const data = this.loadFromStorage();
			const existed = key in data;
			delete data[key];
			this.saveToStorage(data);
			return existed;
		} catch (error) {
			console.error('Failed to remove from persistent cache:', error);
			return false;
		}
	}

	async clear(): Promise<void> {
		try {
			localStorage.removeItem(this.storageKey);
		} catch (error) {
			console.error('Failed to clear persistent cache:', error);
		}
	}

	getSize(): number {
		try {
			const data = this.loadFromStorage();
			return Object.keys(data).length;
		} catch {
			return 0;
		}
	}

	getMetrics(): Partial<CacheMetrics> {
		try {
			const data = this.loadFromStorage();
			const items = Object.values(data);
			
			return {
				totalItems: items.length,
				totalSize: items.reduce((total, item) => total + item.size, 0)
			};
		} catch {
			return { totalItems: 0, totalSize: 0 };
		}
	}

	/**
	 * 从存储加载数据
	 */
	private loadFromStorage(): Record<string, CacheItem<T>> {
		try {
			const data = localStorage.getItem(this.storageKey);
			return data ? JSON.parse(data) : {};
		} catch {
			return {};
		}
	}

	/**
	 * 保存数据到存储
	 */
	private saveToStorage(data: Record<string, CacheItem<T>>): void {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save to storage:', error);
		}
	}
}

// 缓存管理器主类
export class CacheManager {
	private app: App;
	private config: CacheConfig;
	private strategies: Map<string, CacheStrategy> = new Map();
	private cleanupTimer: NodeJS.Timeout | null = null;
	private defaultStrategy!: CacheStrategy;

	constructor(app: App, config: CacheConfig) {
		this.app = app;
		this.config = config;
		
		this.initializeStrategies();
		this.setupCleanupTimer();
	}

	/**
	 * 初始化缓存策略
	 */
	private initializeStrategies(): void {
		const memoryStrategy = new MemoryCacheStrategy(this.config);
		const persistentStrategy = new PersistentCacheStrategy(this.config);

		this.strategies.set('memory', memoryStrategy);
		this.strategies.set('persistent', persistentStrategy);

		// 设置默认策略
		this.defaultStrategy = memoryStrategy;
	}

	/**
	 * 存储到缓存
	 */
	async set<T>(key: string, value: T, ttl?: number, strategy?: string): Promise<boolean> {
		const cacheStrategy = strategy ? 
			this.strategies.get(strategy) : 
			this.selectStrategy(key, value);

		if (!cacheStrategy) {
			console.error(`Cache strategy not found: ${strategy}`);
			return false;
		}

		return await cacheStrategy.store(key, value, ttl);
	}

	/**
	 * 从缓存获取
	 */
	async get<T>(key: string, strategy?: string): Promise<T | null> {
		if (strategy) {
			const cacheStrategy = this.strategies.get(strategy);
			return cacheStrategy ? await cacheStrategy.retrieve(key) : null;
		}

		// 尝试所有策略
		for (const cacheStrategy of this.strategies.values()) {
			const result = await cacheStrategy.retrieve(key);
			if (result !== null) {
				return result;
			}
		}

		return null;
	}

	/**
	 * 从缓存删除
	 */
	async delete(key: string, strategy?: string): Promise<boolean> {
		if (strategy) {
			const cacheStrategy = this.strategies.get(strategy);
			return cacheStrategy ? await cacheStrategy.remove(key) : false;
		}

		// 从所有策略中删除
		let removed = false;
		for (const cacheStrategy of this.strategies.values()) {
			const result = await cacheStrategy.remove(key);
			removed = removed || result;
		}

		return removed;
	}

	/**
	 * 清空缓存
	 */
	async clear(strategy?: string): Promise<void> {
		if (strategy) {
			const cacheStrategy = this.strategies.get(strategy);
			if (cacheStrategy) {
				await cacheStrategy.clear();
			}
			return;
		}

		// 清空所有策略
		for (const cacheStrategy of this.strategies.values()) {
			await cacheStrategy.clear();
		}
	}

	/**
	 * 获取缓存统计
	 */
	getMetrics(strategy?: string): CacheMetrics | Record<string, Partial<CacheMetrics>> {
		if (strategy) {
			const cacheStrategy = this.strategies.get(strategy);
			return cacheStrategy ? cacheStrategy.getMetrics() as CacheMetrics : {
				hits: 0, misses: 0, hitRate: 0, totalItems: 0,
				totalSize: 0, averageAccessTime: 0, evictions: 0, compressionRatio: 1
			};
		}

		// 返回所有策略的统计
		const allMetrics: Record<string, Partial<CacheMetrics>> = {};
		for (const [name, cacheStrategy] of this.strategies) {
			allMetrics[name] = cacheStrategy.getMetrics();
		}

		return allMetrics;
	}

	/**
	 * 选择缓存策略
	 */
	private selectStrategy<T>(key: string, value: T): CacheStrategy {
		// 根据键和值的特征选择最适合的策略
		for (const strategy of this.strategies.values()) {
			if (strategy.canHandle(key, value)) {
				return strategy;
			}
		}

		return this.defaultStrategy;
	}

	/**
	 * 设置清理定时器
	 */
	private setupCleanupTimer(): void {
		if (this.config.cleanupInterval > 0) {
			this.cleanupTimer = setInterval(() => {
				this.performCleanup();
			}, this.config.cleanupInterval);
		}
	}

	/**
	 * 执行清理
	 */
	private async performCleanup(): Promise<void> {
		console.log('Performing cache cleanup...');
		
		// 这里可以实现过期项清理逻辑
		// 由于策略内部已经处理过期检查，这里主要是触发清理
		
		for (const strategy of this.strategies.values()) {
			// 可以添加策略特定的清理逻辑
		}
	}

	/**
	 * 注册缓存策略
	 */
	registerStrategy(strategy: CacheStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<CacheConfig>): void {
		this.config = { ...this.config, ...config };
		
		// 重新设置清理定时器
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		this.setupCleanupTimer();
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}

		// 清理所有策略
		this.strategies.clear();
	}
}
