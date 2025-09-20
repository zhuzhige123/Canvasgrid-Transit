import { App, TFile, TFolder, Vault, Notice } from 'obsidian';

// 文件系统配置接口
export interface FileSystemConfig {
	enableFileWatcher: boolean;
	enableAutoBackup: boolean;
	backupInterval: number; // 毫秒
	maxBackupFiles: number;
	enableFileValidation: boolean;
	allowedFileTypes: string[];
	enableTrash: boolean;
	enableFileHistory: boolean;
}

// 文件操作结果接口
export interface FileOperationResult {
	success: boolean;
	file?: TFile;
	data?: any;
	error?: string;
	timestamp: number;
}

// 文件信息接口
export interface FileInfo {
	path: string;
	name: string;
	extension: string;
	size: number;
	created: number;
	modified: number;
	type: 'file' | 'folder';
	exists: boolean;
}

// 文件变更事件接口
export interface FileChangeEvent {
	type: 'created' | 'modified' | 'deleted' | 'renamed';
	file: TFile;
	oldPath?: string;
	newPath?: string;
	timestamp: number;
}

// 文件操作策略接口
export interface FileOperationStrategy {
	name: string;
	canHandle(file: TFile): boolean;
	read(file: TFile): Promise<string>;
	write(file: TFile, content: string): Promise<boolean>;
	validate?(content: string): boolean;
}

// 文本文件操作策略
export class TextFileStrategy implements FileOperationStrategy {
	name = 'text';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(file: TFile): boolean {
		const textExtensions = ['.md', '.txt', '.json', '.canvas', '.css', '.js', '.ts'];
		return textExtensions.some(ext => file.path.endsWith(ext));
	}

	async read(file: TFile): Promise<string> {
		try {
			return await this.app.vault.read(file);
		} catch (error) {
			throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async write(file: TFile, content: string): Promise<boolean> {
		try {
			await this.app.vault.modify(file, content);
			return true;
		} catch (error) {
			console.error('Failed to write text file:', error);
			return false;
		}
	}

	validate(content: string): boolean {
		// 基本文本验证
		return typeof content === 'string' && content.length < 10 * 1024 * 1024; // 10MB限制
	}
}

// JSON文件操作策略
export class JSONFileStrategy implements FileOperationStrategy {
	name = 'json';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(file: TFile): boolean {
		return file.path.endsWith('.json') || file.path.endsWith('.canvas');
	}

	async read(file: TFile): Promise<string> {
		try {
			const content = await this.app.vault.read(file);
			// 验证JSON格式
			JSON.parse(content);
			return content;
		} catch (error) {
			throw new Error(`Failed to read JSON file: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
		}
	}

	async write(file: TFile, content: string): Promise<boolean> {
		try {
			// 验证JSON格式
			JSON.parse(content);
			await this.app.vault.modify(file, content);
			return true;
		} catch (error) {
			console.error('Failed to write JSON file:', error);
			return false;
		}
	}

	validate(content: string): boolean {
		try {
			JSON.parse(content);
			return true;
		} catch {
			return false;
		}
	}
}

// 二进制文件操作策略
export class BinaryFileStrategy implements FileOperationStrategy {
	name = 'binary';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	canHandle(file: TFile): boolean {
		const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip'];
		return binaryExtensions.some(ext => file.path.endsWith(ext));
	}

	async read(file: TFile): Promise<string> {
		try {
			const buffer = await this.app.vault.readBinary(file);
			return this.bufferToBase64(buffer);
		} catch (error) {
			throw new Error(`Failed to read binary file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	async write(file: TFile, content: string): Promise<boolean> {
		try {
			const buffer = this.base64ToBuffer(content);
			await this.app.vault.modifyBinary(file, buffer);
			return true;
		} catch (error) {
			console.error('Failed to write binary file:', error);
			return false;
		}
	}

	validate(content: string): boolean {
		// 验证Base64格式
		try {
			return btoa(atob(content)) === content;
		} catch {
			return false;
		}
	}

	private bufferToBase64(buffer: ArrayBuffer): string {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	private base64ToBuffer(base64: string): ArrayBuffer {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes.buffer;
	}
}

// 文件系统管理器主类
export class FileSystemManager {
	private app: App;
	private config: FileSystemConfig;
	private strategies: Map<string, FileOperationStrategy> = new Map();
	private fileWatchers: Map<string, () => void> = new Map();
	private backupTimer: NodeJS.Timeout | null = null;
	private fileHistory: Map<string, FileChangeEvent[]> = new Map();

	constructor(app: App, config: FileSystemConfig) {
		this.app = app;
		this.config = config;
		
		this.initializeStrategies();
		this.setupFileWatcher();
		this.setupAutoBackup();
	}

	/**
	 * 初始化文件操作策略
	 */
	private initializeStrategies(): void {
		this.strategies.set('text', new TextFileStrategy(this.app));
		this.strategies.set('json', new JSONFileStrategy(this.app));
		this.strategies.set('binary', new BinaryFileStrategy(this.app));
	}

	/**
	 * 读取文件
	 */
	async readFile(file: TFile): Promise<FileOperationResult> {
		const startTime = Date.now();
		
		try {
			// 验证文件类型
			if (!this.isAllowedFileType(file)) {
				return {
					success: false,
					error: `File type not allowed: ${file.extension}`,
					timestamp: startTime
				};
			}

			// 查找合适的策略
			const strategy = this.findStrategy(file);
			if (!strategy) {
				return {
					success: false,
					error: `No strategy found for file: ${file.path}`,
					timestamp: startTime
				};
			}

			const content = await strategy.read(file);
			
			return {
				success: true,
				file,
				data: content,
				timestamp: startTime
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: startTime
			};
		}
	}

	/**
	 * 写入文件
	 */
	async writeFile(file: TFile, content: string): Promise<FileOperationResult> {
		const startTime = Date.now();
		
		try {
			// 验证文件类型
			if (!this.isAllowedFileType(file)) {
				return {
					success: false,
					error: `File type not allowed: ${file.extension}`,
					timestamp: startTime
				};
			}

			// 查找合适的策略
			const strategy = this.findStrategy(file);
			if (!strategy) {
				return {
					success: false,
					error: `No strategy found for file: ${file.path}`,
					timestamp: startTime
				};
			}

			// 验证内容
			if (this.config.enableFileValidation && strategy.validate && !strategy.validate(content)) {
				return {
					success: false,
					error: 'File content validation failed',
					timestamp: startTime
				};
			}

			const success = await strategy.write(file, content);
			
			if (success) {
				this.recordFileChange({
					type: 'modified',
					file,
					timestamp: Date.now()
				});
			}
			
			return {
				success,
				file: success ? file : undefined,
				timestamp: startTime
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: startTime
			};
		}
	}

	/**
	 * 创建文件
	 */
	async createFile(path: string, content: string = ''): Promise<FileOperationResult> {
		const startTime = Date.now();
		
		try {
			// 检查文件是否已存在
			const existingFile = this.app.vault.getAbstractFileByPath(path);
			if (existingFile) {
				return {
					success: false,
					error: `File already exists: ${path}`,
					timestamp: startTime
				};
			}

			const file = await this.app.vault.create(path, content);
			
			this.recordFileChange({
				type: 'created',
				file,
				timestamp: Date.now()
			});
			
			return {
				success: true,
				file,
				timestamp: startTime
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: startTime
			};
		}
	}

	/**
	 * 删除文件
	 */
	async deleteFile(file: TFile): Promise<FileOperationResult> {
		const startTime = Date.now();
		
		try {
			if (this.config.enableTrash) {
				await this.app.vault.trash(file, false);
			} else {
				await this.app.vault.delete(file);
			}
			
			this.recordFileChange({
				type: 'deleted',
				file,
				timestamp: Date.now()
			});
			
			return {
				success: true,
				file,
				timestamp: startTime
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: startTime
			};
		}
	}

	/**
	 * 重命名文件
	 */
	async renameFile(file: TFile, newPath: string): Promise<FileOperationResult> {
		const startTime = Date.now();
		const oldPath = file.path;
		
		try {
			await this.app.vault.rename(file, newPath);
			
			this.recordFileChange({
				type: 'renamed',
				file,
				oldPath,
				newPath,
				timestamp: Date.now()
			});
			
			return {
				success: true,
				file,
				timestamp: startTime
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: startTime
			};
		}
	}

	/**
	 * 获取文件信息
	 */
	getFileInfo(file: TFile): FileInfo {
		return {
			path: file.path,
			name: file.name,
			extension: file.extension,
			size: file.stat.size,
			created: file.stat.ctime,
			modified: file.stat.mtime,
			type: 'file',
			exists: true
		};
	}

	/**
	 * 搜索文件
	 */
	searchFiles(query: string, folder?: TFolder): TFile[] {
		const allFiles = this.app.vault.getMarkdownFiles();
		const searchFolder = folder || this.app.vault.getRoot();
		
		return allFiles.filter(file => {
			// 检查文件是否在指定文件夹内
			if (!file.path.startsWith(searchFolder.path)) {
				return false;
			}
			
			// 检查文件名是否匹配查询
			return file.name.toLowerCase().includes(query.toLowerCase()) ||
				   file.path.toLowerCase().includes(query.toLowerCase());
		});
	}

	/**
	 * 获取文件变更历史
	 */
	getFileHistory(filePath: string): FileChangeEvent[] {
		return this.fileHistory.get(filePath) || [];
	}

	/**
	 * 清理文件历史
	 */
	clearFileHistory(filePath?: string): void {
		if (filePath) {
			this.fileHistory.delete(filePath);
		} else {
			this.fileHistory.clear();
		}
	}

	/**
	 * 查找文件操作策略
	 */
	private findStrategy(file: TFile): FileOperationStrategy | null {
		for (const strategy of this.strategies.values()) {
			if (strategy.canHandle(file)) {
				return strategy;
			}
		}
		return null;
	}

	/**
	 * 检查文件类型是否允许
	 */
	private isAllowedFileType(file: TFile): boolean {
		if (this.config.allowedFileTypes.length === 0) {
			return true; // 如果没有限制，允许所有类型
		}
		
		return this.config.allowedFileTypes.some(type => 
			file.path.endsWith(type) || file.extension === type.replace('.', '')
		);
	}

	/**
	 * 记录文件变更
	 */
	private recordFileChange(event: FileChangeEvent): void {
		if (!this.config.enableFileHistory) {
			return;
		}
		
		const filePath = event.file.path;
		if (!this.fileHistory.has(filePath)) {
			this.fileHistory.set(filePath, []);
		}
		
		const history = this.fileHistory.get(filePath)!;
		history.push(event);
		
		// 限制历史记录数量
		if (history.length > 100) {
			history.shift();
		}
	}

	/**
	 * 设置文件监听器
	 */
	private setupFileWatcher(): void {
		if (!this.config.enableFileWatcher) {
			return;
		}

		// 监听文件创建
		this.app.vault.on('create', (file) => {
			if (file instanceof TFile) {
				this.recordFileChange({
					type: 'created',
					file,
					timestamp: Date.now()
				});
			}
		});

		// 监听文件修改
		this.app.vault.on('modify', (file) => {
			if (file instanceof TFile) {
				this.recordFileChange({
					type: 'modified',
					file,
					timestamp: Date.now()
				});
			}
		});

		// 监听文件删除
		this.app.vault.on('delete', (file) => {
			if (file instanceof TFile) {
				this.recordFileChange({
					type: 'deleted',
					file,
					timestamp: Date.now()
				});
			}
		});

		// 监听文件重命名
		this.app.vault.on('rename', (file, oldPath) => {
			if (file instanceof TFile) {
				this.recordFileChange({
					type: 'renamed',
					file,
					oldPath,
					newPath: file.path,
					timestamp: Date.now()
				});
			}
		});
	}

	/**
	 * 设置自动备份
	 */
	private setupAutoBackup(): void {
		if (!this.config.enableAutoBackup) {
			return;
		}
		
		this.backupTimer = setInterval(() => {
			this.performAutoBackup();
		}, this.config.backupInterval);
	}

	/**
	 * 执行自动备份
	 */
	private async performAutoBackup(): Promise<void> {
		try {
			// 自动备份逻辑将在需要时实现
			console.log('Auto backup triggered');
		} catch (error) {
			console.error('Auto backup failed:', error);
		}
	}

	/**
	 * 注册文件操作策略
	 */
	registerStrategy(strategy: FileOperationStrategy): void {
		this.strategies.set(strategy.name, strategy);
	}

	/**
	 * 更新配置
	 */
	updateConfig(config: Partial<FileSystemConfig>): void {
		this.config = { ...this.config, ...config };
		
		// 重新设置文件监听器
		if (config.enableFileWatcher !== undefined) {
			// 这里需要重新设置监听器的逻辑
		}
		
		// 重新设置自动备份
		if (config.enableAutoBackup !== undefined) {
			if (this.backupTimer) {
				clearInterval(this.backupTimer);
				this.backupTimer = null;
			}
			if (config.enableAutoBackup) {
				this.setupAutoBackup();
			}
		}
	}

	/**
	 * 销毁管理器
	 */
	destroy(): void {
		// 清理定时器
		if (this.backupTimer) {
			clearInterval(this.backupTimer);
			this.backupTimer = null;
		}
		
		// 清理文件监听器
		this.fileWatchers.clear();
		
		// 清理历史记录
		this.fileHistory.clear();
		
		// 清理策略
		this.strategies.clear();
	}
}
