import { App, TFile, normalizePath } from 'obsidian';
import { AnkiConnectManager, AnkiConnectConfig } from './AnkiConnectManager';
import { CanvasNode } from '../types/CanvasTypes';
import { 
    MediaReference, 
    MediaSyncResult, 
    MediaFileInfo, 
    MediaSyncConfig,
    MediaProcessingOptions,
    MediaValidationResult,
    MediaCacheInfo,
    MediaSyncStats,
    SUPPORTED_MEDIA_FORMATS,
    MediaType
} from '../types/MediaTypes';
import * as crypto from 'crypto';
import * as path from 'path';

/**
 * 媒体同步管理器
 * 负责处理Canvas节点中的媒体文件同步到Anki
 */
export class MediaSyncManager {
    private app: App;
    private config: AnkiConnectConfig;
    private ankiConnectManager: AnkiConnectManager;
    private mediaConfig: MediaSyncConfig;
    private mediaCache: Map<string, MediaCacheInfo> = new Map();

    constructor(
        app: App, 
        config: AnkiConnectConfig, 
        ankiConnectManager: AnkiConnectManager,
        mediaConfig: MediaSyncConfig
    ) {
        this.app = app;
        this.config = config;
        this.ankiConnectManager = ankiConnectManager;
        this.mediaConfig = mediaConfig;
    }

    /**
     * 同步节点中的媒体资产
     */
    async syncNodeMediaAssets(node: CanvasNode, options?: MediaProcessingOptions): Promise<MediaSyncResult> {
        const startTime = Date.now();
        console.log(`MediaSync: 开始同步节点 ${node.id} 的媒体资产`);

        if (!this.mediaConfig.enabled) {
            return this.createEmptyResult('媒体同步已禁用');
        }

        try {
            // 提取媒体引用
            const mediaReferences = this.extractMediaReferences(node);
            console.log(`MediaSync: 找到 ${mediaReferences.length} 个媒体引用`);

            if (mediaReferences.length === 0) {
                return this.createEmptyResult('未找到媒体引用');
            }

            const syncedFiles: string[] = [];
            const failedFiles: string[] = [];
            const errors: string[] = [];
            const warnings: string[] = [];
            let totalTransferSize = 0;

            // 处理每个媒体引用
            for (const mediaRef of mediaReferences) {
                try {
                    const result = await this.processSingleMedia(mediaRef, options);
                    if (result.success) {
                        syncedFiles.push(result.ankiFileName);
                        totalTransferSize += result.fileSize;
                    } else {
                        failedFiles.push(mediaRef.originalPath);
                        errors.push(...result.errors);
                    }
                } catch (error) {
                    failedFiles.push(mediaRef.originalPath);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    errors.push(`处理媒体文件失败: ${errorMessage}`);
                }
            }

            const syncDuration = Date.now() - startTime;
            const stats: MediaSyncStats = {
                totalFiles: mediaReferences.length,
                successCount: syncedFiles.length,
                failureCount: failedFiles.length,
                skippedCount: 0,
                totalTransferSize,
                syncDuration
            };

            console.log(`MediaSync: 同步完成 - 成功: ${syncedFiles.length}, 失败: ${failedFiles.length}, 耗时: ${syncDuration}ms`);

            return {
                success: syncedFiles.length > 0,
                syncedFiles,
                failedFiles,
                errors,
                warnings,
                stats
            };

        } catch (error) {
            console.error('MediaSync: 同步过程中发生错误:', error);
            return {
                success: false,
                syncedFiles: [],
                failedFiles: [],
                errors: [`同步过程中发生错误: ${error instanceof Error ? error.message : String(error)}`],
                warnings: [],
                stats: {
                    totalFiles: 0,
                    successCount: 0,
                    failureCount: 0,
                    skippedCount: 0,
                    totalTransferSize: 0,
                    syncDuration: Date.now() - startTime
                }
            };
        }
    }

    /**
     * 提取节点中的媒体引用
     */
    extractMediaReferences(node: CanvasNode): MediaReference[] {
        const references: MediaReference[] = [];

        // 处理文本节点中的媒体引用
        if (node.text) {
            references.push(...this.extractTextMediaReferences(node.text));
        }

        // 处理文件节点
        if (node.type === 'file' && node.file) {
            const mediaRef = this.createFileMediaReference(node.file);
            if (mediaRef) {
                references.push(mediaRef);
            }
        }

        return references;
    }

    /**
     * 从文本中提取媒体引用
     */
    private extractTextMediaReferences(text: string): MediaReference[] {
        const references: MediaReference[] = [];

        // Obsidian 嵌入语法: ![[filename]]
        const obsidianEmbedRegex = /!\[\[([^\]]+)\]\]/g;
        let match;
        while ((match = obsidianEmbedRegex.exec(text)) !== null) {
            const filePath = match[1];
            const mediaRef = this.createFileMediaReference(filePath);
            if (mediaRef) {
                mediaRef.position = {
                    start: match.index,
                    end: match.index + match[0].length,
                    originalText: match[0]
                };
                references.push(mediaRef);
            }
        }

        // Markdown 图片语法: ![alt](path)
        const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        while ((match = markdownImageRegex.exec(text)) !== null) {
            const altText = match[1];
            const filePath = match[2];
            const mediaRef = this.createFileMediaReference(filePath);
            if (mediaRef) {
                mediaRef.displayText = altText;
                mediaRef.position = {
                    start: match.index,
                    end: match.index + match[0].length,
                    originalText: match[0]
                };
                references.push(mediaRef);
            }
        }

        // HTML img 标签: <img src="path" alt="alt">
        const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
        while ((match = htmlImageRegex.exec(text)) !== null) {
            const filePath = match[1];
            const mediaRef = this.createFileMediaReference(filePath);
            if (mediaRef) {
                mediaRef.position = {
                    start: match.index,
                    end: match.index + match[0].length,
                    originalText: match[0]
                };
                references.push(mediaRef);
            }
        }

        return references;
    }

    /**
     * 创建文件媒体引用
     */
    private createFileMediaReference(filePath: string): MediaReference | null {
        const extension = path.extname(filePath).toLowerCase();
        const mediaType = this.getMediaType(extension);
        
        if (!mediaType) {
            return null; // 不支持的文件类型
        }

        const isLocal = !filePath.startsWith('http://') && !filePath.startsWith('https://');

        return {
            type: mediaType === 'images' ? 'image' : 
                  mediaType === 'audio' ? 'audio' :
                  mediaType === 'video' ? 'video' : 'file',
            originalPath: filePath,
            isLocal,
            extension
        };
    }

    /**
     * 获取文件的媒体类型
     */
    private getMediaType(extension: string): MediaType | null {
        for (const [type, extensions] of Object.entries(SUPPORTED_MEDIA_FORMATS)) {
            if ((extensions as readonly string[]).includes(extension)) {
                return type as MediaType;
            }
        }
        return null;
    }

    /**
     * 处理单个媒体文件
     */
    private async processSingleMedia(
        mediaRef: MediaReference, 
        options?: MediaProcessingOptions
    ): Promise<{ success: boolean; ankiFileName: string; fileSize: number; errors: string[] }> {
        
        if (!mediaRef.isLocal) {
            return {
                success: false,
                ankiFileName: '',
                fileSize: 0,
                errors: ['暂不支持远程媒体文件同步']
            };
        }

        try {
            // 验证文件
            const validation = await this.validateMediaFile(mediaRef.originalPath);
            if (!validation.valid) {
                return {
                    success: false,
                    ankiFileName: '',
                    fileSize: 0,
                    errors: validation.errors
                };
            }

            // 获取文件信息
            const fileInfo = await this.getMediaFileInfo(mediaRef.originalPath);
            if (!fileInfo) {
                return {
                    success: false,
                    ankiFileName: '',
                    fileSize: 0,
                    errors: ['无法获取文件信息']
                };
            }

            // 检查是否需要更新
            if (!options?.forceResync && await this.isMediaUpdateNeeded(fileInfo)) {
                console.log(`MediaSync: 文件 ${mediaRef.originalPath} 无需更新，跳过同步`);
                return {
                    success: true,
                    ankiFileName: fileInfo.ankiFileName,
                    fileSize: fileInfo.fileSize,
                    errors: []
                };
            }

            // 复制到Anki媒体库
            const ankiFileName = await this.copyToAnkiMedia(fileInfo);
            
            // 更新缓存
            this.updateMediaCache(fileInfo);

            return {
                success: true,
                ankiFileName,
                fileSize: fileInfo.fileSize,
                errors: []
            };

        } catch (error) {
            return {
                success: false,
                ankiFileName: '',
                fileSize: 0,
                errors: [`处理媒体文件时发生错误: ${error instanceof Error ? error.message : String(error)}`]
            };
        }
    }

    /**
     * 创建空的同步结果
     */
    private createEmptyResult(reason: string): MediaSyncResult {
        return {
            success: false,
            syncedFiles: [],
            failedFiles: [],
            errors: [reason],
            warnings: [],
            stats: {
                totalFiles: 0,
                successCount: 0,
                failureCount: 0,
                skippedCount: 0,
                totalTransferSize: 0,
                syncDuration: 0
            }
        };
    }

    /**
     * 验证媒体文件
     */
    private async validateMediaFile(filePath: string): Promise<MediaValidationResult> {
        // 实现文件验证逻辑
        // 这里先返回基本验证结果
        return {
            valid: true,
            sizeValid: true,
            formatSupported: true,
            errors: []
        };
    }

    /**
     * 获取媒体文件信息
     */
    private async getMediaFileInfo(filePath: string): Promise<MediaFileInfo | null> {
        // 实现获取文件信息的逻辑
        // 这里先返回基本信息
        return null;
    }

    /**
     * 检查媒体文件是否需要更新
     */
    private async isMediaUpdateNeeded(fileInfo: MediaFileInfo): Promise<boolean> {
        // 实现更新检查逻辑
        return true;
    }

    /**
     * 复制文件到Anki媒体库
     */
    private async copyToAnkiMedia(fileInfo: MediaFileInfo): Promise<string> {
        // 实现文件复制逻辑
        return fileInfo.ankiFileName;
    }

    /**
     * 更新媒体缓存
     */
    private updateMediaCache(fileInfo: MediaFileInfo): void {
        // 实现缓存更新逻辑
    }
}
