import { App } from 'obsidian';

// 主题配置接口
export interface ThemeConfig {
	mode: 'auto' | 'light' | 'dark' | 'custom';
	customTheme?: string;
	enableTransitions: boolean;
	transitionDuration: number;
	enableColorScheme: boolean;
	colorScheme: ColorScheme;
	enableCustomCSS: boolean;
	customCSS: string;
}

// 颜色方案接口
export interface ColorScheme {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	surface: string;
	text: string;
	textSecondary: string;
	border: string;
	shadow: string;
	success: string;
	warning: string;
	error: string;
}

// 主题变量接口
export interface ThemeVariables {
	[key: string]: string | number;
}

// 主题状态接口
export interface ThemeState {
	currentMode: 'light' | 'dark';
	isCustomTheme: boolean;
	activeColorScheme: ColorScheme;
	cssVariables: ThemeVariables;
}

// 主题策略接口
export interface ThemeStrategy {
	name: string;
	apply(config: ThemeConfig): void;
	remove(): void;
	getVariables(): ThemeVariables;
}

// 自动主题策略
export class AutoThemeStrategy implements ThemeStrategy {
	name = 'auto';
	private mediaQuery: MediaQueryList;
	private changeHandler: (e: MediaQueryListEvent) => void;

	constructor() {
		this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		this.changeHandler = this.handleSystemThemeChange.bind(this);
	}

	apply(config: ThemeConfig): void {
		// 监听系统主题变化
		this.mediaQuery.addEventListener('change', this.changeHandler);
		
		// 应用当前系统主题
		this.applySystemTheme();
	}

	remove(): void {
		this.mediaQuery.removeEventListener('change', this.changeHandler);
		this.removeThemeClasses();
	}

	getVariables(): ThemeVariables {
		const isDark = this.mediaQuery.matches;
		return {
			'--theme-mode': isDark ? 'dark' : 'light',
			'--is-auto-theme': '1'
		};
	}

	private handleSystemThemeChange(e: MediaQueryListEvent): void {
		this.applySystemTheme();
	}

	private applySystemTheme(): void {
		const isDark = this.mediaQuery.matches;
		const body = document.body;
		
		body.removeClass('canvas-grid-theme-light', 'canvas-grid-theme-dark');
		body.addClass(isDark ? 'canvas-grid-theme-dark' : 'canvas-grid-theme-light');
		body.addClass('canvas-grid-theme-auto');
	}

	private removeThemeClasses(): void {
		const body = document.body;
		body.removeClass('canvas-grid-theme-light', 'canvas-grid-theme-dark', 'canvas-grid-theme-auto');
	}
}

// 浅色主题策略
export class LightThemeStrategy implements ThemeStrategy {
	name = 'light';

	apply(config: ThemeConfig): void {
		const body = document.body;
		body.removeClass('canvas-grid-theme-dark', 'canvas-grid-theme-auto');
		body.addClass('canvas-grid-theme-light');
		
		this.applyColorScheme(config.colorScheme);
	}

	remove(): void {
		const body = document.body;
		body.removeClass('canvas-grid-theme-light');
		this.removeColorScheme();
	}

	getVariables(): ThemeVariables {
		return {
			'--theme-mode': 'light',
			'--is-light-theme': '1'
		};
	}

	private applyColorScheme(colorScheme: ColorScheme): void {
		const root = document.documentElement;
		
		root.style.setProperty('--canvas-grid-primary', colorScheme.primary);
		root.style.setProperty('--canvas-grid-secondary', colorScheme.secondary);
		root.style.setProperty('--canvas-grid-accent', colorScheme.accent);
		root.style.setProperty('--canvas-grid-background', colorScheme.background);
		root.style.setProperty('--canvas-grid-surface', colorScheme.surface);
		root.style.setProperty('--canvas-grid-text', colorScheme.text);
		root.style.setProperty('--canvas-grid-text-secondary', colorScheme.textSecondary);
		root.style.setProperty('--canvas-grid-border', colorScheme.border);
		root.style.setProperty('--canvas-grid-shadow', colorScheme.shadow);
		root.style.setProperty('--canvas-grid-success', colorScheme.success);
		root.style.setProperty('--canvas-grid-warning', colorScheme.warning);
		root.style.setProperty('--canvas-grid-error', colorScheme.error);
	}

	private removeColorScheme(): void {
		const root = document.documentElement;
		const properties = [
			'--canvas-grid-primary', '--canvas-grid-secondary', '--canvas-grid-accent',
			'--canvas-grid-background', '--canvas-grid-surface', '--canvas-grid-text',
			'--canvas-grid-text-secondary', '--canvas-grid-border', '--canvas-grid-shadow',
			'--canvas-grid-success', '--canvas-grid-warning', '--canvas-grid-error'
		];
		
		properties.forEach(prop => root.style.removeProperty(prop));
	}
}

// 深色主题策略
export class DarkThemeStrategy implements ThemeStrategy {
	name = 'dark';

	apply(config: ThemeConfig): void {
		const body = document.body;
		body.removeClass('canvas-grid-theme-light', 'canvas-grid-theme-auto');
		body.addClass('canvas-grid-theme-dark');
		
		this.applyColorScheme(config.colorScheme);
	}

	remove(): void {
		const body = document.body;
		body.removeClass('canvas-grid-theme-dark');
		this.removeColorScheme();
	}

	getVariables(): ThemeVariables {
		return {
			'--theme-mode': 'dark',
			'--is-dark-theme': '1'
		};
	}

	private applyColorScheme(colorScheme: ColorScheme): void {
		const root = document.documentElement;
		
		// 深色主题的颜色调整
		const darkColorScheme = this.adjustForDarkTheme(colorScheme);
		
		root.style.setProperty('--canvas-grid-primary', darkColorScheme.primary);
		root.style.setProperty('--canvas-grid-secondary', darkColorScheme.secondary);
		root.style.setProperty('--canvas-grid-accent', darkColorScheme.accent);
		root.style.setProperty('--canvas-grid-background', darkColorScheme.background);
		root.style.setProperty('--canvas-grid-surface', darkColorScheme.surface);
		root.style.setProperty('--canvas-grid-text', darkColorScheme.text);
		root.style.setProperty('--canvas-grid-text-secondary', darkColorScheme.textSecondary);
		root.style.setProperty('--canvas-grid-border', darkColorScheme.border);
		root.style.setProperty('--canvas-grid-shadow', darkColorScheme.shadow);
		root.style.setProperty('--canvas-grid-success', darkColorScheme.success);
		root.style.setProperty('--canvas-grid-warning', darkColorScheme.warning);
		root.style.setProperty('--canvas-grid-error', darkColorScheme.error);
	}

	private adjustForDarkTheme(colorScheme: ColorScheme): ColorScheme {
		// 为深色主题调整颜色
		return {
			...colorScheme,
			background: this.darkenColor(colorScheme.background),
			surface: this.darkenColor(colorScheme.surface),
			text: this.lightenColor(colorScheme.text),
			textSecondary: this.lightenColor(colorScheme.textSecondary),
			border: this.adjustBorderForDark(colorScheme.border)
		};
	}

	private darkenColor(color: string): string {
		// 简单的颜色变暗逻辑
		if (color.startsWith('#')) {
			const hex = color.slice(1);
			const num = parseInt(hex, 16);
			const r = Math.max(0, (num >> 16) - 40);
			const g = Math.max(0, ((num >> 8) & 0x00FF) - 40);
			const b = Math.max(0, (num & 0x0000FF) - 40);
			return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
		}
		return color;
	}

	private lightenColor(color: string): string {
		// 简单的颜色变亮逻辑
		if (color.startsWith('#')) {
			const hex = color.slice(1);
			const num = parseInt(hex, 16);
			const r = Math.min(255, (num >> 16) + 40);
			const g = Math.min(255, ((num >> 8) & 0x00FF) + 40);
			const b = Math.min(255, (num & 0x0000FF) + 40);
			return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
		}
		return color;
	}

	private adjustBorderForDark(color: string): string {
		// 为深色主题调整边框颜色
		return this.lightenColor(color);
	}

	private removeColorScheme(): void {
		const root = document.documentElement;
		const properties = [
			'--canvas-grid-primary', '--canvas-grid-secondary', '--canvas-grid-accent',
			'--canvas-grid-background', '--canvas-grid-surface', '--canvas-grid-text',
			'--canvas-grid-text-secondary', '--canvas-grid-border', '--canvas-grid-shadow',
			'--canvas-grid-success', '--canvas-grid-warning', '--canvas-grid-error'
		];
		
		properties.forEach(prop => root.style.removeProperty(prop));
	}
}

// 自定义主题策略
export class CustomThemeStrategy implements ThemeStrategy {
	name = 'custom';
	private customStyleElement: HTMLStyleElement | null = null;

	apply(config: ThemeConfig): void {
		const body = document.body;
		body.removeClass('canvas-grid-theme-light', 'canvas-grid-theme-dark', 'canvas-grid-theme-auto');
		body.addClass('canvas-grid-theme-custom');
		
		// 应用自定义CSS
		if (config.enableCustomCSS && config.customCSS) {
			this.applyCustomCSS(config.customCSS);
		}
		
		// 应用颜色方案
		this.applyColorScheme(config.colorScheme);
	}

	remove(): void {
		const body = document.body;
		body.removeClass('canvas-grid-theme-custom');
		
		// 移除自定义CSS
		if (this.customStyleElement) {
			this.customStyleElement.remove();
			this.customStyleElement = null;
		}
		
		this.removeColorScheme();
	}

	getVariables(): ThemeVariables {
		return {
			'--theme-mode': 'custom',
			'--is-custom-theme': '1'
		};
	}

	private applyCustomCSS(css: string): void {
		// 移除旧的自定义样式
		if (this.customStyleElement) {
			this.customStyleElement.remove();
		}
		
		// 创建新的样式元素
		this.customStyleElement = document.createElement('style');
		this.customStyleElement.id = 'canvas-grid-custom-theme';
		this.customStyleElement.textContent = css;
		document.head.appendChild(this.customStyleElement);
	}

	private applyColorScheme(colorScheme: ColorScheme): void {
		const root = document.documentElement;
		
		Object.entries(colorScheme).forEach(([key, value]) => {
			const cssVar = `--canvas-grid-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
			root.style.setProperty(cssVar, value);
		});
	}

	private removeColorScheme(): void {
		const root = document.documentElement;
		const properties = [
			'--canvas-grid-primary', '--canvas-grid-secondary', '--canvas-grid-accent',
			'--canvas-grid-background', '--canvas-grid-surface', '--canvas-grid-text',
			'--canvas-grid-text-secondary', '--canvas-grid-border', '--canvas-grid-shadow',
			'--canvas-grid-success', '--canvas-grid-warning', '--canvas-grid-error'
		];
		
		properties.forEach(prop => root.style.removeProperty(prop));
	}
}

// 默认颜色方案
export const DEFAULT_COLOR_SCHEMES: Record<string, ColorScheme> = {
	default: {
		primary: '#007acc',
		secondary: '#6c757d',
		accent: '#17a2b8',
		background: '#ffffff',
		surface: '#f8f9fa',
		text: '#212529',
		textSecondary: '#6c757d',
		border: '#dee2e6',
		shadow: 'rgba(0, 0, 0, 0.1)',
		success: '#28a745',
		warning: '#ffc107',
		error: '#dc3545'
	},
	obsidian: {
		primary: 'var(--interactive-accent)',
		secondary: 'var(--text-muted)',
		accent: 'var(--interactive-accent-hover)',
		background: 'var(--background-primary)',
		surface: 'var(--background-secondary)',
		text: 'var(--text-normal)',
		textSecondary: 'var(--text-muted)',
		border: 'var(--background-modifier-border)',
		shadow: 'var(--background-modifier-box-shadow)',
		success: 'var(--text-success)',
		warning: 'var(--text-warning)',
		error: 'var(--text-error)'
	}
};

// 主题管理器主类
export class ThemeManager {
	private app: App;
	private config: ThemeConfig;
	private strategies: Map<string, ThemeStrategy> = new Map();
	private currentStrategy: ThemeStrategy | null = null;
	private transitionStyleElement: HTMLStyleElement | null = null;

	constructor(app: App, config: ThemeConfig) {
		this.app = app;
		this.config = config;
		
		this.initializeStrategies();
		this.applyTheme();
	}

	/**
	 * 初始化主题策略
	 */
	private initializeStrategies(): void {
		this.strategies.set('auto', new AutoThemeStrategy());
		this.strategies.set('light', new LightThemeStrategy());
		this.strategies.set('dark', new DarkThemeStrategy());
		this.strategies.set('custom', new CustomThemeStrategy());
	}

	/**
	 * 应用主题
	 */
	applyTheme(): void {
		// 移除当前主题
		if (this.currentStrategy) {
			this.currentStrategy.remove();
		}
		
		// 应用过渡效果
		if (this.config.enableTransitions) {
			this.applyTransitions();
		}
		
		// 获取新策略
		const strategy = this.strategies.get(this.config.mode);
		if (!strategy) {
			console.error(`Theme strategy not found: ${this.config.mode}`);
			return;
		}
		
		// 应用新主题
		this.currentStrategy = strategy;
		strategy.apply(this.config);
		
		// 应用主题变量
		this.applyThemeVariables();
	}

	/**
	 * 切换主题模式
	 */
	setThemeMode(mode: 'auto' | 'light' | 'dark' | 'custom'): void {
		this.config.mode = mode;
		this.applyTheme();
	}

	/**
	 * 更新颜色方案
	 */
	updateColorScheme(colorScheme: Partial<ColorScheme>): void {
		this.config.colorScheme = { ...this.config.colorScheme, ...colorScheme };
		this.applyTheme();
	}

	/**
	 * 设置自定义CSS
	 */
	setCustomCSS(css: string): void {
		this.config.customCSS = css;
		this.config.enableCustomCSS = true;
		
		if (this.config.mode === 'custom') {
			this.applyTheme();
		}
	}

	/**
	 * 获取当前主题状态
	 */
	getThemeState(): ThemeState {
		const currentMode = this.getCurrentMode();
		const variables = this.currentStrategy?.getVariables() || {};
		
		return {
			currentMode,
			isCustomTheme: this.config.mode === 'custom',
			activeColorScheme: this.config.colorScheme,
			cssVariables: variables
		};
	}

	/**
	 * 获取当前模式
	 */
	private getCurrentMode(): 'light' | 'dark' {
		if (this.config.mode === 'auto') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		return this.config.mode === 'dark' ? 'dark' : 'light';
	}

	/**
	 * 应用过渡效果
	 */
	private applyTransitions(): void {
		if (this.transitionStyleElement) {
			this.transitionStyleElement.remove();
		}
		
		const css = `
			.canvas-grid-container,
			.canvas-grid-toolbar,
			.canvas-card,
			.canvas-grid-button {
				transition: all ${this.config.transitionDuration}ms ease-in-out;
			}
		`;
		
		this.transitionStyleElement = document.createElement('style');
		this.transitionStyleElement.id = 'canvas-grid-transitions';
		this.transitionStyleElement.textContent = css;
		document.head.appendChild(this.transitionStyleElement);
	}

	/**
	 * 应用主题变量
	 */
	private applyThemeVariables(): void {
		if (!this.currentStrategy) return;
		
		const variables = this.currentStrategy.getVariables();
		const root = document.documentElement;
		
		Object.entries(variables).forEach(([key, value]) => {
			root.style.setProperty(key, String(value));
		});
	}

	/**
	 * 注册主题策略
	 */
	registerStrategy(strategy: ThemeStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * 获取可用主题
	 */
	getAvailableThemes(): string[] {
		return Array.from(this.strategies.keys());
	}

	/**
	 * 重置为默认主题
	 */
	resetToDefault(): void {
		this.config = {
			mode: 'auto',
			enableTransitions: true,
			transitionDuration: 200,
			enableColorScheme: true,
			colorScheme: DEFAULT_COLOR_SCHEMES.obsidian,
			enableCustomCSS: false,
			customCSS: ''
		};
		this.applyTheme();
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<ThemeConfig>): void {
		this.config = { ...this.config, ...config };
		this.applyTheme();
	}

	/**
	 * 销毁主题管理器
	 */
	destroy(): void {
		// 移除当前主题
		if (this.currentStrategy) {
			this.currentStrategy.remove();
			this.currentStrategy = null;
		}
		
		// 移除过渡样式
		if (this.transitionStyleElement) {
			this.transitionStyleElement.remove();
			this.transitionStyleElement = null;
		}
		
		// 清理策略
		this.strategies.clear();
		
		// 清理CSS变量
		const root = document.documentElement;
		const properties = [
			'--theme-mode', '--is-auto-theme', '--is-light-theme', 
			'--is-dark-theme', '--is-custom-theme'
		];
		properties.forEach(prop => root.style.removeProperty(prop));
	}
}
