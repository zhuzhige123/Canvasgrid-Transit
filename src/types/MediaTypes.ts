/**
 * 媒体文件同步相关类型定义
 */

/**
 * 媒体引用类型
 */
export interface MediaReference {
    /** 媒体类型 */
    type: 'image' | 'audio' | 'video' | 'file';
    /** 原始文件路径 */
    originalPath: string;
    /** 显示文本（如果有） */
    displayText?: string;
    /** 是否为本地文件 */
    isLocal: boolean;
    /** 文件扩展名 */
    extension: string;
    /** 在内容中的位置信息 */
    position?: MediaPosition;
}

/**
 * 媒体位置信息
 */
export interface MediaPosition {
    /** 开始位置 */
    start: number;
    /** 结束位置 */
    end: number;
    /** 所在行号 */
    line?: number;
    /** 原始匹配文本 */
    originalText: string;
}

/**
 * 媒体同步结果
 */
export interface MediaSyncResult {
    /** 同步是否成功 */
    success: boolean;
    /** 成功同步的文件列表 */
    syncedFiles: string[];
    /** 同步失败的文件列表 */
    failedFiles: string[];
    /** 错误信息列表 */
    errors: string[];
    /** 警告信息列表 */
    warnings: string[];
    /** 同步统计信息 */
    stats: MediaSyncStats;
}

/**
 * 媒体同步统计信息
 */
export interface MediaSyncStats {
    /** 总文件数 */
    totalFiles: number;
    /** 成功同步数 */
    successCount: number;
    /** 失败数 */
    failureCount: number;
    /** 跳过数（已存在且未变更） */
    skippedCount: number;
    /** 总传输大小（字节） */
    totalTransferSize: number;
    /** 同步耗时（毫秒） */
    syncDuration: number;
}

/**
 * 媒体文件信息
 */
export interface MediaFileInfo {
    /** 原始文件路径 */
    originalPath: string;
    /** Anki媒体库中的文件名 */
    ankiFileName: string;
    /** 文件哈希值 */
    fileHash: string;
    /** 文件大小（字节） */
    fileSize: number;
    /** 最后修改时间 */
    lastModified: number;
    /** 文件类型 */
    mimeType: string;
    /** 是否需要压缩 */
    needsCompression: boolean;
}

/**
 * 媒体同步配置
 */
export interface MediaSyncConfig {
    /** 是否启用媒体同步 */
    enabled: boolean;
    /** 同步本地文件 */
    syncLocal: boolean;
    /** 同步远程文件 */
    syncRemote: boolean;
    /** 最大文件大小（MB） */
    maxFileSize: number;
    /** 允许的文件扩展名 */
    allowedExtensions: string[];
    /** 是否启用压缩 */
    compressionEnabled: boolean;
    /** 压缩质量（0-100） */
    compressionQuality: number;
    /** 是否自动清理未使用的媒体 */
    autoCleanup: boolean;
    /** 清理间隔（天） */
    cleanupInterval: number;
}

/**
 * 媒体处理选项
 */
export interface MediaProcessingOptions {
    /** 是否强制重新同步 */
    forceResync: boolean;
    /** 是否生成缩略图 */
    generateThumbnails: boolean;
    /** 缩略图最大尺寸 */
    thumbnailMaxSize: number;
    /** 是否保留原始文件名 */
    preserveOriginalName: boolean;
    /** 自定义文件名前缀 */
    fileNamePrefix?: string;
}

/**
 * 媒体清理结果
 */
export interface MediaCleanupResult {
    /** 清理是否成功 */
    success: boolean;
    /** 删除的文件数量 */
    deletedCount: number;
    /** 删除的文件列表 */
    deletedFiles: string[];
    /** 释放的空间大小（字节） */
    freedSpace: number;
    /** 错误信息 */
    errors: string[];
}

/**
 * 支持的媒体格式配置
 */
export const SUPPORTED_MEDIA_FORMATS = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
    video: ['.mp4', '.webm', '.ogv', '.mov', '.avi'],
    documents: ['.pdf', '.doc', '.docx', '.txt', '.md']
} as const;

/**
 * 媒体类型检测
 */
export type MediaType = keyof typeof SUPPORTED_MEDIA_FORMATS;

/**
 * 媒体文件验证结果
 */
export interface MediaValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** 媒体类型 */
    mediaType?: MediaType;
    /** 文件大小是否符合限制 */
    sizeValid: boolean;
    /** 格式是否支持 */
    formatSupported: boolean;
    /** 验证错误信息 */
    errors: string[];
}

/**
 * 媒体缓存信息
 */
export interface MediaCacheInfo {
    /** 文件路径 */
    filePath: string;
    /** 缓存时间 */
    cachedAt: number;
    /** 文件哈希 */
    hash: string;
    /** Anki文件名 */
    ankiFileName: string;
    /** 是否已同步 */
    synced: boolean;
}

/**
 * 批量媒体操作结果
 */
export interface BatchMediaResult {
    /** 总操作数 */
    totalOperations: number;
    /** 成功操作数 */
    successCount: number;
    /** 失败操作数 */
    failureCount: number;
    /** 详细结果列表 */
    results: MediaSyncResult[];
    /** 总耗时 */
    totalDuration: number;
}
