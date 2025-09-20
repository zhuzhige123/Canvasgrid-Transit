import { App } from 'obsidian';

// 性能配置接口
export interface PerformanceConfig {
	enableMonitoring: boolean;
	enableProfiling: boolean;
	sampleRate: number; // 采样率 (0-1)
	maxMetricsHistory: number;
	enableMemoryTracking: boolean;
	enableRenderTracking: boolean;
	enableNetworkTracking: boolean;
	alertThresholds: PerformanceThresholds;
	enableOptimizations: boolean;
	optimizationStrategies: OptimizationStrategy[];
}

// 性能阈值接口
export interface PerformanceThresholds {
	responseTime: number; // 毫秒
	memoryUsage: number; // MB
	renderTime: number; // 毫秒
	fpsThreshold: number; // 帧率
	bundleSize: number; // KB
}

// 性能指标接口
export interface PerformanceMetrics {
	timestamp: number;
	responseTime: number;
	memoryUsage: number;
	renderTime: number;
	fps: number;
	domNodes: number;
	eventListeners: number;
	cacheHitRate: number;
	bundleSize: number;
	networkRequests: number;
	errors: number;
}

// 性能报告接口
export interface PerformanceReport {
	period: {
		start: number;
		end: number;
	};
	summary: PerformanceSummary;
	metrics: PerformanceMetrics[];
	alerts: PerformanceAlert[];
	recommendations: PerformanceRecommendation[];
}

// 性能摘要接口
export interface PerformanceSummary {
	averageResponseTime: number;
	maxResponseTime: number;
	averageMemoryUsage: number;
	maxMemoryUsage: number;
	averageFPS: number;
	minFPS: number;
	totalErrors: number;
	uptime: number;
}

// 性能警报接口
export interface PerformanceAlert {
	type: 'warning' | 'error' | 'critical';
	metric: string;
	value: number;
	threshold: number;
	timestamp: number;
	message: string;
}

// 性能建议接口
export interface PerformanceRecommendation {
	category: 'memory' | 'rendering' | 'network' | 'caching' | 'dom';
	priority: 'low' | 'medium' | 'high' | 'critical';
	title: string;
	description: string;
	impact: string;
	implementation: string;
}

// 优化策略接口
export interface OptimizationStrategy {
	name: string;
	enabled: boolean;
	trigger: (metrics: PerformanceMetrics) => boolean;
	execute: () => Promise<void>;
	description: string;
}

// 性能监控器
export class PerformanceMonitor {
	private metrics: PerformanceMetrics[] = [];
	private observers: PerformanceObserver[] = [];
	private startTime: number = Date.now();

	constructor(private config: PerformanceConfig) {
		this.setupObservers();
	}

	/**
	 * 设置性能观察器
	 */
	private setupObservers(): void {
		if (!this.config.enableMonitoring) return;

		// 导航性能观察器
		if ('PerformanceObserver' in window) {
			try {
				const navigationObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						this.recordNavigationMetrics(entry);
					}
				});
				navigationObserver.observe({ entryTypes: ['navigation'] });
				this.observers.push(navigationObserver);
			} catch (error) {
				console.warn('Navigation performance observer not supported:', error);
			}

			// 资源性能观察器
			try {
				const resourceObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						this.recordResourceMetrics(entry);
					}
				});
				resourceObserver.observe({ entryTypes: ['resource'] });
				this.observers.push(resourceObserver);
			} catch (error) {
				console.warn('Resource performance observer not supported:', error);
			}

			// 测量性能观察器
			try {
				const measureObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						this.recordMeasureMetrics(entry);
					}
				});
				measureObserver.observe({ entryTypes: ['measure'] });
				this.observers.push(measureObserver);
			} catch (error) {
				console.warn('Measure performance observer not supported:', error);
			}
		}
	}

	/**
	 * 记录导航指标
	 */
	private recordNavigationMetrics(entry: PerformanceEntry): void {
		const navigationEntry = entry as PerformanceNavigationTiming;
		
		const metrics: PerformanceMetrics = {
			timestamp: Date.now(),
			responseTime: navigationEntry.responseEnd - navigationEntry.responseStart,
			memoryUsage: this.getMemoryUsage(),
			renderTime: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
			fps: this.getFPS(),
			domNodes: document.querySelectorAll('*').length,
			eventListeners: this.getEventListenerCount(),
			cacheHitRate: 0, // 需要从缓存管理器获取
			bundleSize: 0, // 需要计算
			networkRequests: performance.getEntriesByType('resource').length,
			errors: 0
		};

		this.addMetrics(metrics);
	}

	/**
	 * 记录资源指标
	 */
	private recordResourceMetrics(entry: PerformanceEntry): void {
		// 处理资源加载性能
		const resourceEntry = entry as PerformanceResourceTiming;
		
		if (resourceEntry.transferSize) {
			// 更新网络相关指标
		}
	}

	/**
	 * 记录测量指标
	 */
	private recordMeasureMetrics(entry: PerformanceEntry): void {
		// 处理自定义测量
		console.log('Custom measure:', entry.name, entry.duration);
	}

	/**
	 * 获取内存使用情况
	 */
	private getMemoryUsage(): number {
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			return memory.usedJSHeapSize / 1024 / 1024; // MB
		}
		return 0;
	}

	/**
	 * 获取FPS
	 */
	private getFPS(): number {
		// 简化的FPS计算
		return 60; // 默认值，实际实现需要更复杂的计算
	}

	/**
	 * 获取事件监听器数量
	 */
	private getEventListenerCount(): number {
		// 这是一个估算，实际实现可能需要更复杂的逻辑
		return document.querySelectorAll('[onclick], [onload], [onchange]').length;
	}

	/**
	 * 添加指标
	 */
	addMetrics(metrics: PerformanceMetrics): void {
		this.metrics.push(metrics);
		
		// 限制历史记录大小
		if (this.metrics.length > this.config.maxMetricsHistory) {
			this.metrics = this.metrics.slice(-this.config.maxMetricsHistory);
		}
	}

	/**
	 * 获取所有指标
	 */
	getMetrics(): PerformanceMetrics[] {
		return [...this.metrics];
	}

	/**
	 * 获取最新指标
	 */
	getLatestMetrics(): PerformanceMetrics | null {
		return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
	}

	/**
	 * 清理观察器
	 */
	destroy(): void {
		this.observers.forEach(observer => observer.disconnect());
		this.observers = [];
		this.metrics = [];
	}
}

// 性能分析器
export class PerformanceProfiler {
	private profiles: Map<string, number> = new Map();
	private activeProfiles: Set<string> = new Set();

	/**
	 * 开始性能分析
	 */
	start(name: string): void {
		if (this.activeProfiles.has(name)) {
			console.warn(`Profile ${name} is already active`);
			return;
		}

		this.activeProfiles.add(name);
		performance.mark(`${name}-start`);
	}

	/**
	 * 结束性能分析
	 */
	end(name: string): number {
		if (!this.activeProfiles.has(name)) {
			console.warn(`Profile ${name} is not active`);
			return 0;
		}

		performance.mark(`${name}-end`);
		performance.measure(name, `${name}-start`, `${name}-end`);
		
		const entries = performance.getEntriesByName(name, 'measure');
		const duration = entries.length > 0 ? entries[entries.length - 1].duration : 0;
		
		this.profiles.set(name, duration);
		this.activeProfiles.delete(name);
		
		// 清理标记
		performance.clearMarks(`${name}-start`);
		performance.clearMarks(`${name}-end`);
		performance.clearMeasures(name);
		
		return duration;
	}

	/**
	 * 获取分析结果
	 */
	getProfile(name: string): number | undefined {
		return this.profiles.get(name);
	}

	/**
	 * 获取所有分析结果
	 */
	getAllProfiles(): Map<string, number> {
		return new Map(this.profiles);
	}

	/**
	 * 清理分析数据
	 */
	clear(): void {
		this.profiles.clear();
		this.activeProfiles.clear();
	}
}

// 性能优化器
export class PerformanceOptimizer {
	private strategies: OptimizationStrategy[] = [];

	constructor(private config: PerformanceConfig) {
		this.initializeStrategies();
	}

	/**
	 * 初始化优化策略
	 */
	private initializeStrategies(): void {
		// 内存优化策略
		this.strategies.push({
			name: 'memory-cleanup',
			enabled: true,
			trigger: (metrics) => metrics.memoryUsage > this.config.alertThresholds.memoryUsage,
			execute: async () => {
				// 执行内存清理
				if (window.gc) {
					window.gc();
				}
				// 清理缓存
				// 清理DOM节点
			},
			description: '内存使用过高时执行清理'
		});

		// 渲染优化策略
		this.strategies.push({
			name: 'render-optimization',
			enabled: true,
			trigger: (metrics) => metrics.renderTime > this.config.alertThresholds.renderTime,
			execute: async () => {
				// 启用虚拟滚动
				// 减少DOM操作
				// 使用requestAnimationFrame
			},
			description: '渲染时间过长时优化渲染性能'
		});

		// FPS优化策略
		this.strategies.push({
			name: 'fps-optimization',
			enabled: true,
			trigger: (metrics) => metrics.fps < this.config.alertThresholds.fpsThreshold,
			execute: async () => {
				// 降低动画质量
				// 减少重绘
				// 优化CSS动画
			},
			description: 'FPS过低时优化动画性能'
		});
	}

	/**
	 * 执行优化
	 */
	async optimize(metrics: PerformanceMetrics): Promise<void> {
		if (!this.config.enableOptimizations) return;

		for (const strategy of this.strategies) {
			if (strategy.enabled && strategy.trigger(metrics)) {
				try {
					await strategy.execute();
					console.log(`Executed optimization strategy: ${strategy.name}`);
				} catch (error) {
					console.error(`Failed to execute optimization strategy ${strategy.name}:`, error);
				}
			}
		}
	}

	/**
	 * 添加优化策略
	 */
	addStrategy(strategy: OptimizationStrategy): void {
		this.strategies.push(strategy);
	}

	/**
	 * 移除优化策略
	 */
	removeStrategy(name: string): void {
		this.strategies = this.strategies.filter(s => s.name !== name);
	}
}

// 性能管理器主类
export class PerformanceManager {
	private app: App;
	private config: PerformanceConfig;
	private monitor: PerformanceMonitor;
	private profiler: PerformanceProfiler;
	private optimizer: PerformanceOptimizer;
	private alerts: PerformanceAlert[] = [];
	private monitoringTimer: NodeJS.Timeout | null = null;

	constructor(app: App, config: PerformanceConfig) {
		this.app = app;
		this.config = config;
		
		this.monitor = new PerformanceMonitor(config);
		this.profiler = new PerformanceProfiler();
		this.optimizer = new PerformanceOptimizer(config);
		
		this.startMonitoring();
	}

	/**
	 * 开始监控
	 */
	private startMonitoring(): void {
		if (!this.config.enableMonitoring) return;

		this.monitoringTimer = setInterval(() => {
			this.collectMetrics();
		}, 5000); // 每5秒收集一次指标
	}

	/**
	 * 收集指标
	 */
	private async collectMetrics(): Promise<void> {
		const metrics: PerformanceMetrics = {
			timestamp: Date.now(),
			responseTime: 0, // 需要从实际操作中测量
			memoryUsage: this.getMemoryUsage(),
			renderTime: 0, // 需要从渲染操作中测量
			fps: this.getFPS(),
			domNodes: document.querySelectorAll('*').length,
			eventListeners: 0, // 需要计算
			cacheHitRate: 0, // 需要从缓存管理器获取
			bundleSize: 0, // 需要计算
			networkRequests: performance.getEntriesByType('resource').length,
			errors: 0
		};

		this.monitor.addMetrics(metrics);
		this.checkThresholds(metrics);
		await this.optimizer.optimize(metrics);
	}

	/**
	 * 检查阈值
	 */
	private checkThresholds(metrics: PerformanceMetrics): void {
		const thresholds = this.config.alertThresholds;

		if (metrics.responseTime > thresholds.responseTime) {
			this.addAlert('warning', 'responseTime', metrics.responseTime, thresholds.responseTime, '响应时间过长');
		}

		if (metrics.memoryUsage > thresholds.memoryUsage) {
			this.addAlert('error', 'memoryUsage', metrics.memoryUsage, thresholds.memoryUsage, '内存使用过高');
		}

		if (metrics.renderTime > thresholds.renderTime) {
			this.addAlert('warning', 'renderTime', metrics.renderTime, thresholds.renderTime, '渲染时间过长');
		}

		if (metrics.fps < thresholds.fpsThreshold) {
			this.addAlert('warning', 'fps', metrics.fps, thresholds.fpsThreshold, 'FPS过低');
		}
	}

	/**
	 * 添加警报
	 */
	private addAlert(type: 'warning' | 'error' | 'critical', metric: string, value: number, threshold: number, message: string): void {
		const alert: PerformanceAlert = {
			type,
			metric,
			value,
			threshold,
			timestamp: Date.now(),
			message
		};

		this.alerts.push(alert);
		
		// 限制警报数量
		if (this.alerts.length > 100) {
			this.alerts = this.alerts.slice(-100);
		}

		console.warn(`Performance Alert [${type}]: ${message}`, alert);
	}

	/**
	 * 开始性能分析
	 */
	startProfile(name: string): void {
		this.profiler.start(name);
	}

	/**
	 * 结束性能分析
	 */
	endProfile(name: string): number {
		return this.profiler.end(name);
	}

	/**
	 * 生成性能报告
	 */
	generateReport(startTime?: number, endTime?: number): PerformanceReport {
		const now = Date.now();
		const start = startTime || (now - 3600000); // 默认最近1小时
		const end = endTime || now;

		const metrics = this.monitor.getMetrics().filter(m => 
			m.timestamp >= start && m.timestamp <= end
		);

		const summary = this.calculateSummary(metrics);
		const alerts = this.alerts.filter(a => 
			a.timestamp >= start && a.timestamp <= end
		);
		const recommendations = this.generateRecommendations(metrics);

		return {
			period: { start, end },
			summary,
			metrics,
			alerts,
			recommendations
		};
	}

	/**
	 * 计算摘要
	 */
	private calculateSummary(metrics: PerformanceMetrics[]): PerformanceSummary {
		if (metrics.length === 0) {
			return {
				averageResponseTime: 0,
				maxResponseTime: 0,
				averageMemoryUsage: 0,
				maxMemoryUsage: 0,
				averageFPS: 0,
				minFPS: 0,
				totalErrors: 0,
				uptime: 0
			};
		}

		return {
			averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
			maxResponseTime: Math.max(...metrics.map(m => m.responseTime)),
			averageMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
			maxMemoryUsage: Math.max(...metrics.map(m => m.memoryUsage)),
			averageFPS: metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length,
			minFPS: Math.min(...metrics.map(m => m.fps)),
			totalErrors: metrics.reduce((sum, m) => sum + m.errors, 0),
			uptime: Date.now() - this.monitor['startTime']
		};
	}

	/**
	 * 生成建议
	 */
	private generateRecommendations(metrics: PerformanceMetrics[]): PerformanceRecommendation[] {
		const recommendations: PerformanceRecommendation[] = [];

		// 基于指标生成建议
		const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
		if (avgMemory > 50) {
			recommendations.push({
				category: 'memory',
				priority: 'high',
				title: '内存使用优化',
				description: '平均内存使用过高，建议优化内存管理',
				impact: '减少内存使用，提高应用稳定性',
				implementation: '实施缓存清理、对象池、弱引用等策略'
			});
		}

		return recommendations;
	}

	/**
	 * 获取内存使用情况
	 */
	private getMemoryUsage(): number {
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			return memory.usedJSHeapSize / 1024 / 1024;
		}
		return 0;
	}

	/**
	 * 获取FPS
	 */
	private getFPS(): number {
		return 60; // 简化实现
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<PerformanceConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		if (this.monitoringTimer) {
			clearInterval(this.monitoringTimer);
			this.monitoringTimer = null;
		}

		this.monitor.destroy();
		this.profiler.clear();
		this.alerts = [];
	}
}
