import { App, TFile, Vault } from 'obsidian';
import { CanvasDataModel, CanvasDocument } from '../../domain/models/CanvasDataModel';
import { DebugManager } from '../../utils/DebugManager';

/**
 * 数据访问配置
 */
export interface DataAccessConfig {
    cacheEnabled: boolean;
    cacheSize: number;
    cacheTTL: number; // 毫秒
    autoSave: boolean;
    autoSaveInterval: number; // 毫秒
    backupEnabled: boolean;
    maxBackups: number;
}

/**
 * 缓存项
 */
interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

/**
 * 数据访问结果
 */
export interface DataAccessResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    fromCache?: boolean;
}

/**
 * 文件监听器
 */
export interface FileWatcher {
    filePath: string;
    callback: (file: TFile) => void;
    lastModified: number;
}

/**
 * 数据访问层
 * 负责文件系统操作、缓存管理和数据持久化
 */
export class DataAccessLayer {
    private app: App;
    private vault: Vault;
    private config: DataAccessConfig;
    
    private cache = new Map<string, CacheItem<any>>();
    private fileWatchers = new Map<string, FileWatcher>();
    private autoSaveTimers = new Map<string, NodeJS.Timeout>();

    constructor(app: App, config: DataAccessConfig) {
        this.app = app;
        this.vault = app.vault;
        this.config = config;
        
        this.setupFileWatcher();
    }

    /**
     * 加载Canvas文件
     */
    async loadCanvasFile(filePath: string): Promise<DataAccessResult<CanvasDataModel>> {
        try {
            // 检查缓存
            if (this.config.cacheEnabled) {
                const cached = this.getFromCache<CanvasDataModel>(filePath);
                if (cached) {
                    return {
                        success: true,
                        data: cached,
                        fromCache: true
                    };
                }
            }
            
            // 读取文件
            const file = this.vault.getAbstractFileByPath(filePath);
            if (!file || !(file instanceof TFile)) {
                return {
                    success: false,
                    error: `Canvas file not found: ${filePath}`
                };
            }
            
            const content = await this.vault.read(file);
            const canvasData = JSON.parse(content);
            
            // 创建数据模型
            const document: CanvasDocument = {
                data: canvasData,
                metadata: {
                    version: '1.0.0',
                    createdAt: new Date(file.stat.ctime),
                    modifiedAt: new Date(file.stat.mtime),
                    tags: [],
                    viewportX: 0,
                    viewportY: 0,
                    zoomLevel: 1
                },
                filePath,
                fileName: file.name
            };
            
            const model = new CanvasDataModel(document);
            
            // 缓存数据
            if (this.config.cacheEnabled) {
                this.setCache(filePath, model);
            }
            
            // 设置文件监听
            this.watchFile(filePath, (updatedFile) => {
                this.invalidateCache(filePath);
                DebugManager.log(`Canvas file changed: ${filePath}`);
            });
            
            DebugManager.log(`Canvas file loaded: ${filePath}`);
            return {
                success: true,
                data: model
            };
            
        } catch (error) {
            DebugManager.error(`Failed to load canvas file: ${filePath}`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 保存Canvas文件
     */
    async saveCanvasFile(model: CanvasDataModel): Promise<DataAccessResult<void>> {
        try {
            const docInfo = model.getDocumentInfo();
            const canvasJSON = model.toCanvasJSON();
            const content = JSON.stringify(canvasJSON, null, 2);
            
            // 创建备份
            if (this.config.backupEnabled) {
                await this.createBackup(docInfo.filePath);
            }
            
            // 写入文件
            const file = this.vault.getAbstractFileByPath(docInfo.filePath);
            if (file && file instanceof TFile) {
                await this.vault.modify(file, content);
            } else {
                await this.vault.create(docInfo.filePath, content);
            }
            
            // 标记为已保存
            model.markClean();
            
            // 更新缓存
            if (this.config.cacheEnabled) {
                this.setCache(docInfo.filePath, model);
            }
            
            DebugManager.log(`Canvas file saved: ${docInfo.filePath}`);
            return { success: true };
            
        } catch (error) {
            DebugManager.error('Failed to save canvas file', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }



    /**
     * 获取所有Canvas文件
     */
    async getAllCanvasFiles(): Promise<DataAccessResult<TFile[]>> {
        try {
            const files = this.vault.getFiles().filter(file => 
                file.extension === 'canvas'
            );
            
            return {
                success: true,
                data: files
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(filePath: string): Promise<DataAccessResult<void>> {
        try {
            const file = this.vault.getAbstractFileByPath(filePath);
            if (!file) {
                return {
                    success: false,
                    error: `File not found: ${filePath}`
                };
            }
            
            // 创建备份
            if (this.config.backupEnabled) {
                await this.createBackup(filePath);
            }
            
            // 使用推荐的文件管理器方法
            await this.app.fileManager.trashFile(file);
            
            // 清理缓存和监听器
            this.invalidateCache(filePath);
            this.unwatchFile(filePath);
            
            DebugManager.log(`File deleted: ${filePath}`);
            return { success: true };
            
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 启用自动保存
     */
    enableAutoSave(filePath: string, saveCallback: () => Promise<void>): void {
        if (!this.config.autoSave) return;
        
        // 清除现有定时器
        this.disableAutoSave(filePath);
        
        // 设置新定时器
        const timer = setInterval(async () => {
            try {
                await saveCallback();
                DebugManager.log(`Auto-saved: ${filePath}`);
            } catch (error) {
                DebugManager.error(`Auto-save failed: ${filePath}`, error);
            }
        }, this.config.autoSaveInterval);
        
        this.autoSaveTimers.set(filePath, timer);
    }

    /**
     * 禁用自动保存
     */
    disableAutoSave(filePath: string): void {
        const timer = this.autoSaveTimers.get(filePath);
        if (timer) {
            clearInterval(timer);
            this.autoSaveTimers.delete(filePath);
        }
    }

    /**
     * 清理资源
     */
    dispose(): void {
        // 清理所有定时器
        for (const timer of this.autoSaveTimers.values()) {
            clearInterval(timer);
        }
        this.autoSaveTimers.clear();
        
        // 清理缓存
        this.cache.clear();
        
        // 清理文件监听器
        this.fileWatchers.clear();
        
        DebugManager.log('DataAccessLayer disposed');
    }

    /**
     * 从缓存获取数据
     */
    private getFromCache<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;
        
        const now = Date.now();
        if (now - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    /**
     * 设置缓存
     */
    private setCache<T>(key: string, data: T): void {
        if (this.cache.size >= this.config.cacheSize) {
            // 删除最旧的缓存项
            const oldestKey = Array.from(this.cache.keys())[0];
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: this.config.cacheTTL
        });
    }

    /**
     * 使缓存失效
     */
    private invalidateCache(key: string): void {
        this.cache.delete(key);
    }

    /**
     * 监听文件变化
     */
    private watchFile(filePath: string, callback: (file: TFile) => void): void {
        const file = this.vault.getAbstractFileByPath(filePath);
        if (!file || !(file instanceof TFile)) return;
        
        this.fileWatchers.set(filePath, {
            filePath,
            callback,
            lastModified: file.stat.mtime
        });
    }

    /**
     * 取消文件监听
     */
    private unwatchFile(filePath: string): void {
        this.fileWatchers.delete(filePath);
    }

    /**
     * 设置文件监听器
     */
    private setupFileWatcher(): void {
        this.app.vault.on('modify', (file) => {
            const watcher = this.fileWatchers.get(file.path);
            if (watcher && 'stat' in file && (file as any).stat && (file as any).stat.mtime > watcher.lastModified) {
                watcher.lastModified = (file as any).stat.mtime;
                watcher.callback(file as any);
            }
        });
    }

    /**
     * 创建备份
     */
    private async createBackup(filePath: string): Promise<void> {
        try {
            const file = this.vault.getAbstractFileByPath(filePath);
            if (!file || !(file instanceof TFile)) return;
            
            const content = await this.vault.read(file);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${filePath}.backup.${timestamp}`;
            
            await this.vault.create(backupPath, content);
            
            // 清理旧备份
            await this.cleanupOldBackups(filePath);
            
        } catch (error) {
            DebugManager.error(`Failed to create backup for: ${filePath}`, error);
        }
    }

    /**
     * 清理旧备份
     */
    private async cleanupOldBackups(filePath: string): Promise<void> {
        try {
            const backupFiles = this.vault.getFiles().filter(file => 
                file.path.startsWith(`${filePath}.backup.`)
            );
            
            if (backupFiles.length > this.config.maxBackups) {
                // 按修改时间排序，删除最旧的
                backupFiles.sort((a, b) => a.stat.mtime - b.stat.mtime);
                
                const filesToDelete = backupFiles.slice(0, backupFiles.length - this.config.maxBackups);
                for (const file of filesToDelete) {
                    await this.app.fileManager.trashFile(file);
                }
            }
        } catch (error) {
            DebugManager.error(`Failed to cleanup old backups for: ${filePath}`, error);
        }
    }
}
