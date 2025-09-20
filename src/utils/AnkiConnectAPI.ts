import { AnkiConnectResponse } from '../managers/AnkiConnectManager';

/**
 * Anki Connect API工具类
 * 负责底层HTTP请求封装和错误处理
 */
export class AnkiConnectAPI {
	private apiUrl: string;
	private apiKey?: string;
	private timeout: number;
	private retryAttempts: number;

	constructor(apiUrl: string, apiKey?: string, timeout: number = 5000, retryAttempts: number = 3) {
		this.apiUrl = apiUrl;
		this.apiKey = apiKey;
		this.timeout = timeout;
		this.retryAttempts = retryAttempts;
	}

	/**
	 * 执行Anki Connect API调用
	 */
	async invoke(action: string, params: any = {}): Promise<any> {
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
			try {
				const result = await this.performRequest(action, params);
				return result;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('未知错误');
				
				// 如果是最后一次尝试，或者是不可重试的错误，直接抛出
				if (attempt === this.retryAttempts || !this.isRetryableError(error)) {
					break;
				}

				// 等待一段时间后重试
				await this.delay(attempt * 1000);
			}
		}

		throw lastError;
	}

	/**
	 * 执行单次HTTP请求
	 */
	private async performRequest(action: string, params: any): Promise<any> {
		const requestBody = {
			action,
			version: 6,
			params,
			...(this.apiKey && { key: this.apiKey })
		};

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(this.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
			}

			const data: AnkiConnectResponse = await response.json();

			if (!this.validateResponse(data)) {
				throw new Error('无效的响应格式');
			}

			if (data.error) {
				throw new Error(`Anki Connect错误: ${data.error}`);
			}

			return data.result;
		} catch (error) {
			clearTimeout(timeoutId);
			
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					throw new Error('请求超时');
				}
				throw error;
			}
			
			throw new Error('未知网络错误');
		}
	}

	/**
	 * 验证响应格式
	 */
	validateResponse(response: any): response is AnkiConnectResponse {
		return (
			typeof response === 'object' &&
			response !== null &&
			('result' in response || 'error' in response)
		);
	}

	/**
	 * 判断错误是否可重试
	 */
	private isRetryableError(error: any): boolean {
		if (error instanceof Error) {
			const message = error.message.toLowerCase();
			
			// 网络相关错误可重试
			if (message.includes('network') || 
				message.includes('timeout') || 
				message.includes('fetch') ||
				message.includes('connection')) {
				return true;
			}

			// HTTP 5xx 错误可重试
			if (message.includes('500') || 
				message.includes('502') || 
				message.includes('503') || 
				message.includes('504')) {
				return true;
			}
		}

		return false;
	}

	/**
	 * 延迟函数
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * 处理错误并返回用户友好的错误信息
	 */
	handleError(error: any): string {
		if (error instanceof Error) {
			const message = error.message;

			// 连接相关错误
			if (message.includes('fetch') || message.includes('network')) {
				return '无法连接到Anki Connect，请确保Anki正在运行且已安装AnkiConnect插件';
			}

			// 超时错误
			if (message.includes('timeout') || message.includes('AbortError')) {
				return '请求超时，请检查网络连接或增加超时时间';
			}

			// HTTP错误
			if (message.includes('HTTP错误')) {
				return `服务器错误: ${message}`;
			}

			// Anki Connect特定错误
			if (message.includes('Anki Connect错误')) {
				return message;
			}

			// 其他已知错误
			return message;
		}

		return '未知错误，请查看控制台获取详细信息';
	}

	/**
	 * 更新配置
	 */
	updateConfig(apiUrl: string, apiKey?: string, timeout?: number, retryAttempts?: number): void {
		this.apiUrl = apiUrl;
		this.apiKey = apiKey;
		if (timeout !== undefined) this.timeout = timeout;
		if (retryAttempts !== undefined) this.retryAttempts = retryAttempts;
	}

	/**
	 * 获取当前配置
	 */
	getConfig(): { apiUrl: string; apiKey?: string; timeout: number; retryAttempts: number } {
		return {
			apiUrl: this.apiUrl,
			apiKey: this.apiKey,
			timeout: this.timeout,
			retryAttempts: this.retryAttempts
		};
	}
}
