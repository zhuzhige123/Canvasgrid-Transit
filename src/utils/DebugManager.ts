import { Notice } from 'obsidian';

/**
 * 统一的调试管理器
 * 在开发环境启用调试输出，生产环境自动禁用
 */
export class DebugManager {
    private static readonly isDebugMode = process.env.NODE_ENV === 'development';
    private static readonly isVerboseMode = false; // 可通过配置控制

    /**
     * 调试日志输出
     */
    static log(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.log(`[CanvasGrid] ${message}`, ...args);
        }
    }

    /**
     * 警告日志输出
     */
    static warn(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.warn(`[CanvasGrid] ${message}`, ...args);
        }
    }

    /**
     * 错误日志输出（生产环境也会输出）
     */
    static error(message: string, ...args: any[]): void {
        console.error(`[CanvasGrid] ${message}`, ...args);
    }

    /**
     * 详细调试信息（仅在verbose模式下输出）
     */
    static verbose(message: string, ...args: any[]): void {
        if (this.isDebugMode && this.isVerboseMode) {
            console.log(`[CanvasGrid:Verbose] ${message}`, ...args);
        }
    }

    /**
     * 性能计时开始
     */
    static timeStart(label: string): void {
        if (this.isDebugMode) {
            console.time(`[CanvasGrid:Timer] ${label}`);
        }
    }

    /**
     * 性能计时结束
     */
    static timeEnd(label: string): void {
        if (this.isDebugMode) {
            console.timeEnd(`[CanvasGrid:Timer] ${label}`);
        }
    }

    /**
     * 用户通知（开发环境显示详细信息）
     */
    static notify(message: string, duration: number = 3000, debugInfo?: any): void {
        if (this.isDebugMode && debugInfo) {
            new Notice(`${message} (Debug: ${JSON.stringify(debugInfo)})`, duration);
            this.log('User notification with debug info:', { message, debugInfo });
        } else {
            new Notice(message, duration);
        }
    }

    /**
     * 条件调试输出
     */
    static logIf(condition: boolean, message: string, ...args: any[]): void {
        if (condition && this.isDebugMode) {
            this.log(message, ...args);
        }
    }

    /**
     * 对象深度检查（开发环境）
     */
    static inspect(obj: any, label?: string): void {
        if (this.isDebugMode) {
            const prefix = label ? `[${label}] ` : '';
            console.log(`${prefix}Object inspection:`, {
                type: typeof obj,
                constructor: obj?.constructor?.name,
                keys: obj && typeof obj === 'object' ? Object.keys(obj) : 'N/A',
                value: obj
            });
        }
    }

    /**
     * 函数执行追踪
     */
    static trace(functionName: string, args?: any[]): void {
        if (this.isDebugMode) {
            console.trace(`[CanvasGrid:Trace] ${functionName}`, args);
        }
    }

    /**
     * 断言检查（开发环境）
     */
    static assert(condition: boolean, message: string): void {
        if (this.isDebugMode && !condition) {
            console.assert(condition, `[CanvasGrid:Assert] ${message}`);
            throw new Error(`Assertion failed: ${message}`);
        }
    }
}
