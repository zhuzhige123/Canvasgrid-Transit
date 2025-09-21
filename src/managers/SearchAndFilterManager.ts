import { App, TFile } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';

// 搜索配置接口
export interface SearchConfig {
	caseSensitive: boolean;
	wholeWord: boolean;
	useRegex: boolean;
	searchInContent: boolean;
	searchInTags: boolean;
	searchInFilenames: boolean;
	debounceDelay: number;
}

// 过滤配置接口
export interface FilterConfig {
	enableColorFilter: boolean;
	enableTypeFilter: boolean;
	enableDateFilter: boolean;
	enableSizeFilter: boolean;
}

// 排序配置接口
export interface SortConfig {
	sortBy: 'name' | 'date' | 'size' | 'type' | 'color' | 'custom';
	sortOrder: 'asc' | 'desc';
	groupBy?: 'color' | 'type' | 'date' | 'none';
}

// 搜索结果接口
export interface SearchResult {
	nodes: any[];
	totalCount: number;
	filteredCount: number;
	searchTime: number;
	query: string;
}

// 过滤条件接口
export interface FilterCriteria {
	colors?: string[];
	types?: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
	sizeRange?: {
		min: number;
		max: number;
	};
}

// 搜索策略接口
export interface SearchStrategy {
	name: string;
	search(nodes: any[], query: string, config: SearchConfig): any[];
	validate(query: string): boolean;
}

// 基础搜索策略
export class BasicSearchStrategy implements SearchStrategy {
	name = 'basic';

	search(nodes: any[], query: string, config: SearchConfig): any[] {
		if (!query.trim()) {
			return nodes;
		}

		const searchTerm = config.caseSensitive ? query : query.toLowerCase();
		
		return nodes.filter(node => {
			return this.matchesNode(node, searchTerm, config);
		});
	}

	validate(query: string): boolean {
		return query.length <= 1000; // 基本长度限制
	}

	private matchesNode(node: any, searchTerm: string, config: SearchConfig): boolean {
		// 搜索节点文本内容
		if (config.searchInContent && node.text) {
			const content = config.caseSensitive ? node.text : node.text.toLowerCase();
			if (this.matchesText(content, searchTerm, config)) {
				return true;
			}
		}

		// 搜索文件名
		if (config.searchInFilenames && node.file) {
			const filename = config.caseSensitive ? node.file : node.file.toLowerCase();
			if (this.matchesText(filename, searchTerm, config)) {
				return true;
			}
		}

		// 搜索URL
		if (node.url) {
			const url = config.caseSensitive ? node.url : node.url.toLowerCase();
			if (this.matchesText(url, searchTerm, config)) {
				return true;
			}
		}

		return false;
	}

	private matchesText(text: string, searchTerm: string, config: SearchConfig): boolean {
		if (config.wholeWord) {
			const regex = new RegExp(`\\b${this.escapeRegex(searchTerm)}\\b`, config.caseSensitive ? 'g' : 'gi');
			return regex.test(text);
		} else {
			return text.includes(searchTerm);
		}
	}

	private escapeRegex(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}

// 正则表达式搜索策略
export class RegexSearchStrategy implements SearchStrategy {
	name = 'regex';

	search(nodes: any[], query: string, config: SearchConfig): any[] {
		if (!query.trim()) {
			return nodes;
		}

		try {
			const flags = config.caseSensitive ? 'g' : 'gi';
			const regex = new RegExp(query, flags);
			
			return nodes.filter(node => {
				return this.matchesNodeRegex(node, regex, config);
			});
		} catch (error) {
			console.warn('Invalid regex pattern:', query, error);
			return [];
		}
	}

	validate(query: string): boolean {
		try {
			new RegExp(query);
			return true;
		} catch {
			return false;
		}
	}

	private matchesNodeRegex(node: any, regex: RegExp, config: SearchConfig): boolean {
		// 重置正则表达式状态
		regex.lastIndex = 0;

		if (config.searchInContent && node.text && regex.test(node.text)) {
			return true;
		}

		regex.lastIndex = 0;
		if (config.searchInFilenames && node.file && regex.test(node.file)) {
			return true;
		}

		regex.lastIndex = 0;
		if (node.url && regex.test(node.url)) {
			return true;
		}

		return false;
	}
}

// 模糊搜索策略
export class FuzzySearchStrategy implements SearchStrategy {
	name = 'fuzzy';

	search(nodes: any[], query: string, config: SearchConfig): any[] {
		if (!query.trim()) {
			return nodes;
		}

		const searchTerm = config.caseSensitive ? query : query.toLowerCase();
		const results = nodes.map(node => ({
			node,
			score: this.calculateFuzzyScore(node, searchTerm, config)
		})).filter(result => result.score > 0);

		// 按分数排序
		results.sort((a, b) => b.score - a.score);
		
		return results.map(result => result.node);
	}

	validate(query: string): boolean {
		return query.length <= 100; // 模糊搜索限制较短查询
	}

	private calculateFuzzyScore(node: any, searchTerm: string, config: SearchConfig): number {
		let maxScore = 0;

		if (config.searchInContent && node.text) {
			const content = config.caseSensitive ? node.text : node.text.toLowerCase();
			maxScore = Math.max(maxScore, this.fuzzyMatch(content, searchTerm));
		}

		if (config.searchInFilenames && node.file) {
			const filename = config.caseSensitive ? node.file : node.file.toLowerCase();
			maxScore = Math.max(maxScore, this.fuzzyMatch(filename, searchTerm));
		}

		if (node.url) {
			const url = config.caseSensitive ? node.url : node.url.toLowerCase();
			maxScore = Math.max(maxScore, this.fuzzyMatch(url, searchTerm));
		}

		return maxScore;
	}

	private fuzzyMatch(text: string, pattern: string): number {
		if (pattern.length === 0) return 0;
		if (text.length === 0) return 0;

		let score = 0;
		let patternIndex = 0;
		let previousMatchIndex = -1;

		for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
			if (text[i] === pattern[patternIndex]) {
				score += 1;
				
				// 连续匹配奖励
				if (i === previousMatchIndex + 1) {
					score += 0.5;
				}
				
				previousMatchIndex = i;
				patternIndex++;
			}
		}

		// 完全匹配奖励
		if (patternIndex === pattern.length) {
			score += pattern.length;
		}

		// 归一化分数
		return score / (text.length + pattern.length);
	}
}

// 过滤器管理器
export class FilterManager {
	private config: FilterConfig;

	constructor(config: FilterConfig) {
		this.config = config;
	}

	/**
	 * 应用过滤条件
	 */
	applyFilters(nodes: any[], criteria: FilterCriteria): any[] {
		let filteredNodes = [...nodes];

		// 颜色过滤
		if (this.config.enableColorFilter && criteria.colors && criteria.colors.length > 0) {
			filteredNodes = filteredNodes.filter(node => 
				criteria.colors!.includes(node.color || 'default')
			);
		}

		// 类型过滤
		if (this.config.enableTypeFilter && criteria.types && criteria.types.length > 0) {
			filteredNodes = filteredNodes.filter(node => {
				const nodeType = this.getNodeType(node);
				return criteria.types!.includes(nodeType);
			});
		}

		// 日期过滤
		if (this.config.enableDateFilter && criteria.dateRange) {
			filteredNodes = filteredNodes.filter(node => {
				const nodeDate = this.getNodeDate(node);
				if (!nodeDate) return false;
				
				return nodeDate >= criteria.dateRange!.start && 
					   nodeDate <= criteria.dateRange!.end;
			});
		}

		// 大小过滤
		if (this.config.enableSizeFilter && criteria.sizeRange) {
			filteredNodes = filteredNodes.filter(node => {
				const nodeSize = this.getNodeSize(node);
				return nodeSize >= criteria.sizeRange!.min && 
					   nodeSize <= criteria.sizeRange!.max;
			});
		}

		return filteredNodes;
	}

	private getNodeType(node: any): string {
		if (node.file) return 'file';
		if (node.url) return 'link';
		if (node.text) return 'text';
		return 'unknown';
	}

	private getNodeDate(node: any): Date | null {
		// 尝试从节点获取日期信息
		if (node.createdAt) {
			return new Date(node.createdAt);
		}
		if (node.updatedAt) {
			return new Date(node.updatedAt);
		}
		return null;
	}

	private getNodeSize(node: any): number {
		// 计算节点大小（字符数）
		let size = 0;
		if (node.text) size += node.text.length;
		if (node.file) size += node.file.length;
		if (node.url) size += node.url.length;
		return size;
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<FilterConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

// 排序管理器
export class SortManager {
	private config: SortConfig;

	constructor(config: SortConfig) {
		this.config = config;
	}

	/**
	 * 排序节点
	 */
	sortNodes(nodes: any[]): any[] {
		const sortedNodes = [...nodes];

		sortedNodes.sort((a, b) => {
			let comparison = 0;

			switch (this.config.sortBy) {
				case 'name':
					comparison = this.compareByName(a, b);
					break;
				case 'date':
					comparison = this.compareByDate(a, b);
					break;
				case 'size':
					comparison = this.compareBySize(a, b);
					break;
				case 'type':
					comparison = this.compareByType(a, b);
					break;
				case 'color':
					comparison = this.compareByColor(a, b);
					break;
				default:
					comparison = 0;
			}

			return this.config.sortOrder === 'desc' ? -comparison : comparison;
		});

		return sortedNodes;
	}

	private compareByName(a: any, b: any): number {
		const nameA = this.getNodeName(a).toLowerCase();
		const nameB = this.getNodeName(b).toLowerCase();
		return nameA.localeCompare(nameB);
	}

	private compareByDate(a: any, b: any): number {
		const dateA = this.getNodeDate(a);
		const dateB = this.getNodeDate(b);
		
		if (!dateA && !dateB) return 0;
		if (!dateA) return 1;
		if (!dateB) return -1;
		
		return dateA.getTime() - dateB.getTime();
	}

	private compareBySize(a: any, b: any): number {
		const sizeA = this.getNodeSize(a);
		const sizeB = this.getNodeSize(b);
		return sizeA - sizeB;
	}

	private compareByType(a: any, b: any): number {
		const typeA = this.getNodeType(a);
		const typeB = this.getNodeType(b);
		return typeA.localeCompare(typeB);
	}

	private compareByColor(a: any, b: any): number {
		const colorA = a.color || 'default';
		const colorB = b.color || 'default';
		return colorA.localeCompare(colorB);
	}

	private getNodeName(node: any): string {
		if (node.file) return node.file;
		if (node.text) return node.text.substring(0, 50);
		if (node.url) return node.url;
		return 'Untitled';
	}

	private getNodeDate(node: any): Date | null {
		if (node.createdAt) return new Date(node.createdAt);
		if (node.updatedAt) return new Date(node.updatedAt);
		return null;
	}

	private getNodeSize(node: any): number {
		let size = 0;
		if (node.text) size += node.text.length;
		if (node.file) size += node.file.length;
		if (node.url) size += node.url.length;
		return size;
	}

	private getNodeType(node: any): string {
		if (node.file) return 'file';
		if (node.url) return 'link';
		if (node.text) return 'text';
		return 'unknown';
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<SortConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

// 搜索和过滤管理器主类
export class SearchAndFilterManager {
	private app: App;
	private searchConfig: SearchConfig;
	private filterConfig: FilterConfig;
	private sortConfig: SortConfig;

	private searchStrategies: Map<string, SearchStrategy> = new Map();
	private currentStrategy: SearchStrategy;
	private filterManager: FilterManager;
	private sortManager: SortManager;

	private searchTimeout: NodeJS.Timeout | null = null;
	private lastSearchQuery = '';
	private lastSearchResults: SearchResult | null = null;

	constructor(
		app: App,
		searchConfig: SearchConfig,
		filterConfig: FilterConfig,
		sortConfig: SortConfig
	) {
		this.app = app;
		this.searchConfig = searchConfig;
		this.filterConfig = filterConfig;
		this.sortConfig = sortConfig;

		// 初始化搜索策略
		this.initializeSearchStrategies();
		this.currentStrategy = this.searchStrategies.get('basic')!;

		// 初始化子管理器
		this.filterManager = new FilterManager(filterConfig);
		this.sortManager = new SortManager(sortConfig);
	}

	/**
	 * 初始化搜索策略
	 */
	private initializeSearchStrategies(): void {
		this.searchStrategies.set('basic', new BasicSearchStrategy());
		this.searchStrategies.set('regex', new RegexSearchStrategy());
		this.searchStrategies.set('fuzzy', new FuzzySearchStrategy());
	}

	/**
	 * 执行搜索
	 */
	async search(nodes: any[], query: string): Promise<SearchResult> {
		const startTime = performance.now();

		// 清除之前的搜索超时
		if (this.searchTimeout) {
			clearTimeout(this.searchTimeout);
		}

		// 如果查询相同且有缓存结果，直接返回
		if (query === this.lastSearchQuery && this.lastSearchResults) {
			return this.lastSearchResults;
		}

		return new Promise((resolve) => {
			this.searchTimeout = setTimeout(() => {
				const searchResults = this.performSearch(nodes, query, startTime);
				this.lastSearchQuery = query;
				this.lastSearchResults = searchResults;
				resolve(searchResults);
			}, this.searchConfig.debounceDelay);
		});
	}

	/**
	 * 执行实际搜索
	 */
	private performSearch(nodes: any[], query: string, startTime: number): SearchResult {
		try {
			// 验证查询
			if (!this.currentStrategy.validate(query)) {
				return {
					nodes: [],
					totalCount: nodes.length,
					filteredCount: 0,
					searchTime: performance.now() - startTime,
					query
				};
			}

			// 执行搜索
			const searchedNodes = this.currentStrategy.search(nodes, query, this.searchConfig);

			const endTime = performance.now();

			return {
				nodes: searchedNodes,
				totalCount: nodes.length,
				filteredCount: searchedNodes.length,
				searchTime: endTime - startTime,
				query
			};
		} catch (error) {
			DebugManager.error('Search error:', error);
			return {
				nodes: [],
				totalCount: nodes.length,
				filteredCount: 0,
				searchTime: performance.now() - startTime,
				query
			};
		}
	}

	/**
	 * 应用过滤器
	 */
	applyFilters(nodes: any[], criteria: FilterCriteria): any[] {
		return this.filterManager.applyFilters(nodes, criteria);
	}

	/**
	 * 排序节点
	 */
	sortNodes(nodes: any[]): any[] {
		return this.sortManager.sortNodes(nodes);
	}

	/**
	 * 执行完整的搜索、过滤和排序流程
	 */
	async searchFilterAndSort(
		nodes: any[],
		query: string,
		filterCriteria: FilterCriteria = {}
	): Promise<SearchResult> {
		// 1. 执行搜索
		const searchResult = await this.search(nodes, query);

		// 2. 应用过滤器
		const filteredNodes = this.applyFilters(searchResult.nodes, filterCriteria);

		// 3. 排序
		const sortedNodes = this.sortNodes(filteredNodes);

		return {
			...searchResult,
			nodes: sortedNodes,
			filteredCount: sortedNodes.length
		};
	}

	/**
	 * 切换搜索策略
	 */
	setSearchStrategy(strategyName: string): boolean {
		const strategy = this.searchStrategies.get(strategyName);
		if (strategy) {
			this.currentStrategy = strategy;
			this.clearSearchCache();
			return true;
		}
		return false;
	}

	/**
	 * 获取当前搜索策略
	 */
	getCurrentStrategy(): string {
		return this.currentStrategy.name;
	}

	/**
	 * 获取可用的搜索策略
	 */
	getAvailableStrategies(): string[] {
		return Array.from(this.searchStrategies.keys());
	}

	/**
	 * 清除搜索缓存
	 */
	clearSearchCache(): void {
		this.lastSearchQuery = '';
		this.lastSearchResults = null;

		if (this.searchTimeout) {
			clearTimeout(this.searchTimeout);
			this.searchTimeout = null;
		}
	}

	/**
	 * 更新搜索配置
	 */
	updateSearchConfig(config: Partial<SearchConfig>): void {
		this.searchConfig = { ...this.searchConfig, ...config };
		this.clearSearchCache();
	}

	/**
	 * 更新过滤配置
	 */
	updateFilterConfig(config: Partial<FilterConfig>): void {
		this.filterConfig = { ...this.filterConfig, ...config };
		this.filterManager.updateConfig(config);
	}

	/**
	 * 更新排序配置
	 */
	updateSortConfig(config: Partial<SortConfig>): void {
		this.sortConfig = { ...this.sortConfig, ...config };
		this.sortManager.updateConfig(config);
	}

	/**
	 * 获取搜索统计信息
	 */
	getSearchStats(): {
		lastQuery: string;
		lastResultCount: number;
		lastSearchTime: number;
		currentStrategy: string;
	} {
		return {
			lastQuery: this.lastSearchQuery,
			lastResultCount: this.lastSearchResults?.filteredCount || 0,
			lastSearchTime: this.lastSearchResults?.searchTime || 0,
			currentStrategy: this.currentStrategy.name
		};
	}

	/**
	 * 验证配置
	 */
	validateConfigs(): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// 验证搜索配置
		if (this.searchConfig.debounceDelay < 0) {
			errors.push('搜索防抖延迟不能为负数');
		}

		// 验证排序配置
		const validSortFields = ['name', 'date', 'size', 'type', 'color', 'custom'];
		if (!validSortFields.includes(this.sortConfig.sortBy)) {
			errors.push(`无效的排序字段: ${this.sortConfig.sortBy}`);
		}

		const validSortOrders = ['asc', 'desc'];
		if (!validSortOrders.includes(this.sortConfig.sortOrder)) {
			errors.push(`无效的排序顺序: ${this.sortConfig.sortOrder}`);
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		this.clearSearchCache();
		this.searchStrategies.clear();
	}
}
