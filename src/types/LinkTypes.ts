/**
 * 链接生成和管理相关类型定义
 */

/**
 * 链接生成选项
 */
export interface LinkOptions {
    /** 链接样式 */
    style: 'simple' | 'enhanced' | 'minimal' | 'detailed';
    /** 是否包含元数据 */
    includeMetadata: boolean;
    /** 是否生成多层次链接 */
    multiLevel: boolean;
    /** 自定义链接文本 */
    customText?: string;
    /** 是否包含坐标信息 */
    includeCoordinates: boolean;
    /** 是否包含时间戳 */
    includeTimestamp: boolean;
    /** 链接目标 */
    target?: '_blank' | '_self' | '_parent' | '_top';
    /** 自定义CSS类名 */
    cssClass?: string;
    /** 自定义样式 */
    customStyle?: string;
}

/**
 * 链接验证结果
 */
export interface LinkValidationResult {
    /** 链接是否有效 */
    valid: boolean;
    /** 使用的协议 */
    protocol: string;
    /** 是否可访问 */
    accessible: boolean;
    /** 响应时间（毫秒） */
    responseTime?: number;
    /** 错误信息 */
    error?: string;
    /** 警告信息 */
    warnings: string[];
}

/**
 * 多层次链接配置
 */
export interface MultiLevelLinkConfig {
    /** 节点直接链接 */
    nodeLink: {
        enabled: boolean;
        text: string;
        icon: string;
        priority: number;
    };
    /** Canvas文件链接 */
    fileLink: {
        enabled: boolean;
        text: string;
        icon: string;
        priority: number;
    };
    /** 网格视图链接 */
    gridViewLink: {
        enabled: boolean;
        text: string;
        icon: string;
        priority: number;
    };
    /** 插件设置链接 */
    settingsLink: {
        enabled: boolean;
        text: string;
        icon: string;
        priority: number;
    };
}

/**
 * 链接生成上下文
 */
export interface LinkGenerationContext {
    /** Vault名称 */
    vaultName: string;
    /** Canvas文件路径 */
    canvasFilePath: string;
    /** 节点ID */
    nodeId: string;
    /** 节点坐标 */
    nodeCoordinates: {
        x: number;
        y: number;
    };
    /** 节点类型 */
    nodeType: string;
    /** 节点颜色 */
    nodeColor?: string;
    /** 生成时间戳 */
    timestamp: number;
    /** 插件版本 */
    pluginVersion?: string;
}

/**
 * 链接模板配置
 */
export interface LinkTemplate {
    /** 模板名称 */
    name: string;
    /** 模板描述 */
    description: string;
    /** HTML模板 */
    htmlTemplate: string;
    /** 支持的变量 */
    supportedVariables: string[];
    /** 默认样式 */
    defaultStyle: string;
    /** 是否为内置模板 */
    builtin: boolean;
}

/**
 * 链接样式配置
 */
export interface LinkStyleConfig {
    /** 基础样式 */
    base: {
        color: string;
        backgroundColor: string;
        padding: string;
        borderRadius: string;
        fontSize: string;
        fontWeight: string;
        textDecoration: string;
        border: string;
    };
    /** 悬停样式 */
    hover: {
        color: string;
        backgroundColor: string;
        textDecoration: string;
        transform: string;
        transition: string;
    };
    /** 激活样式 */
    active: {
        color: string;
        backgroundColor: string;
        transform: string;
    };
    /** 容器样式 */
    container: {
        marginTop: string;
        marginBottom: string;
        padding: string;
        backgroundColor: string;
        borderRadius: string;
        border: string;
        boxShadow: string;
    };
}

/**
 * 跨平台链接配置
 */
export interface CrossPlatformLinkConfig {
    /** Windows配置 */
    windows: {
        protocol: string;
        fallbackUrl?: string;
        registryCheck: boolean;
    };
    /** macOS配置 */
    macos: {
        protocol: string;
        fallbackUrl?: string;
        bundleCheck: boolean;
    };
    /** Linux配置 */
    linux: {
        protocol: string;
        fallbackUrl?: string;
        desktopFileCheck: boolean;
    };
    /** 通用配置 */
    universal: {
        timeoutMs: number;
        retryCount: number;
        fallbackMessage: string;
    };
}

/**
 * 链接分析结果
 */
export interface LinkAnalysisResult {
    /** 链接类型 */
    type: 'obsidian' | 'http' | 'https' | 'file' | 'custom';
    /** 是否为内部链接 */
    internal: boolean;
    /** 目标资源类型 */
    targetType: 'canvas' | 'note' | 'image' | 'file' | 'external';
    /** 参数解析结果 */
    parameters: Record<string, string>;
    /** 是否包含节点定位信息 */
    hasNodeLocation: boolean;
    /** 安全性评估 */
    security: {
        safe: boolean;
        risks: string[];
        recommendations: string[];
    };
}

/**
 * 链接使用统计
 */
export interface LinkUsageStats {
    /** 链接生成次数 */
    generationCount: number;
    /** 链接点击次数 */
    clickCount: number;
    /** 最后生成时间 */
    lastGenerated: number;
    /** 最后点击时间 */
    lastClicked: number;
    /** 成功率 */
    successRate: number;
    /** 平均响应时间 */
    averageResponseTime: number;
    /** 错误统计 */
    errorStats: Record<string, number>;
}

/**
 * 链接批量操作结果
 */
export interface BatchLinkResult {
    /** 总操作数 */
    totalOperations: number;
    /** 成功数 */
    successCount: number;
    /** 失败数 */
    failureCount: number;
    /** 详细结果 */
    results: Array<{
        nodeId: string;
        success: boolean;
        link?: string;
        error?: string;
    }>;
    /** 总耗时 */
    totalDuration: number;
}

/**
 * 预定义链接样式
 */
export const PREDEFINED_LINK_STYLES = {
    simple: {
        name: '简单样式',
        template: '<a href="{url}" style="color: #0066cc; text-decoration: none;">{text}</a>'
    },
    enhanced: {
        name: '增强样式',
        template: `<div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; border-left: 3px solid #6f42c1;">
            <a href="{url}" style="color: #6f42c1; text-decoration: none; font-weight: 500;">{icon} {text}</a>
            <div style="font-size: 10px; color: #6c757d; margin-top: 2px;">{metadata}</div>
        </div>`
    },
    minimal: {
        name: '极简样式',
        template: '<a href="{url}" style="color: inherit; text-decoration: underline;">{text}</a>'
    },
    detailed: {
        name: '详细样式',
        template: `<div style="margin: 12px 0; padding: 12px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border: 1px solid #dee2e6;">
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 16px; margin-right: 8px;">{icon}</span>
                <a href="{url}" style="color: #495057; text-decoration: none; font-weight: 600; flex: 1;">{text}</a>
            </div>
            <div style="font-size: 11px; color: #6c757d; line-height: 1.4;">
                {metadata}
            </div>
        </div>`
    }
} as const;

/**
 * 链接图标配置
 */
export const LINK_ICONS = {
    canvas: '🎨',
    node: '🎯',
    file: '📄',
    grid: '🔲',
    settings: '⚙️',
    external: '🔗',
    location: '📍',
    time: '⏰'
} as const;
