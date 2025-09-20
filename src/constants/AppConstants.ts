/**
 * 应用程序常量配置
 * 统一管理所有硬编码的数值、字符串和配置
 */

// 搜索相关常量
export const SEARCH_CONSTANTS = {
    // 文本长度限制
    MAX_SEARCH_TEXT_LENGTH: 50,
    PRIMARY_SEARCH_LENGTH: 30,
    MAX_PREVIEW_LENGTH: 100,
    MAX_CONTENT_LENGTH: 150,
    MAX_NOTICE_TEXT_LENGTH: 30,

    // 搜索阈值
    SIMILARITY_THRESHOLD: 0.3,
    MAX_SEARCH_RESULTS: 10,

    // 搜索关键词过滤
    MIN_WORD_LENGTH: 1,

    // 文件读取
    MAX_FILE_READ_ATTEMPTS: 3
} as const;

// 时间线相关常量
export const TIMELINE_CONSTANTS = {
    // 布局参数
    HOUR_HEIGHT: 60,
    DEFAULT_CARD_DURATION: 30, // 分钟
    
    // 时间格式
    TIME_FORMAT_OPTIONS: {
        hour: '2-digit' as const,
        minute: '2-digit' as const,
        hour12: false
    },
    
    // 拖拽计算
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24
} as const;

// 网格布局常量
export const GRID_CONSTANTS = {
    // 卡片尺寸
    CARD_WIDTH: 300,
    CARD_HEIGHT: 200,
    LARGE_CARD_WIDTH: 400,
    LARGE_CARD_HEIGHT: 300,
    MIN_CARD_WIDTH: 280,

    // 间距
    CARD_SPACING: 20,
    GRID_GAP: 16,
    GROUP_PADDING: 40,
    GROUP_SPACING: 50,

    // 布局参数
    MIN_WIDTH: 300,
    EXPANDED_HEIGHT_MULTIPLIER: 2,
    MIN_EXPANDED_HEIGHT: 400,

    // 响应式断点
    BREAKPOINTS: {
        SMALL: 800,
        MEDIUM: 1200,
        LARGE: 1600
    }
} as const;

// 性能相关常量
export const PERFORMANCE_CONSTANTS = {
    // 超时设置
    DEFAULT_TIMEOUT: 3000,
    METADATA_FETCH_TIMEOUT: 3000,
    FILE_OPERATION_TIMEOUT: 5000,

    // 缓存设置
    MAX_CACHE_SIZE: 1000,
    MAX_LOG_SIZE: 100,
    MAX_HISTORY_SIZE: 100,
    CACHE_TTL: 300000, // 5分钟

    // 节流防抖
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,

    // 延迟设置
    MINIMAL_DELAY: 100,
    QUICK_DELAY: 300,
    SHORT_DELAY: 500,
    STANDARD_DELAY: 1000,

    // 批处理
    BATCH_SIZE: 50,
    MAX_CONCURRENT_OPERATIONS: 5
} as const;

// 拖拽相关常量
export const DRAG_CONSTANTS = {
    // 拖拽阈值
    DRAG_THRESHOLD: 5,
    LONG_PRESS_THRESHOLD: 500,
    
    // 拖拽状态重置延迟
    DRAG_STATE_RESET_DELAY: 100,
    
    // 拖拽预览
    PREVIEW_MAX_WIDTH: 250,
    PREVIEW_MAX_HEIGHT: 150
} as const;

// 动画相关常量
export const ANIMATION_CONSTANTS = {
    // 持续时间
    FAST_DURATION: 150,
    NORMAL_DURATION: 200,
    SLOW_DURATION: 300,
    
    // 缓动函数
    EASING: {
        EASE_OUT: 'ease-out',
        EASE_IN_OUT: 'ease-in-out',
        EASE_IN: 'ease-in'
    }
} as const;

// 通知相关常量
export const NOTIFICATION_CONSTANTS = {
    // 显示时长
    SHORT_DURATION: 2000,
    MEDIUM_DURATION: 3000,
    LONG_DURATION: 5000,
    PERSISTENT_DURATION: 0,

    // 详细信息显示时长
    INFO_DURATION: 6000
} as const;

// 文件相关常量
export const FILE_CONSTANTS = {
    // 文件扩展名
    CANVAS_EXTENSION: '.canvas',
    MARKDOWN_EXTENSION: '.md',
    
    // 文件大小限制
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    
    // 编码
    DEFAULT_ENCODING: 'utf8'
} as const;

// 正则表达式常量
export const REGEX_PATTERNS = {
    // 回链格式
    BACKLINK_NEW_FORMAT: /📍\s*来源:\s*\[\[([^\]]+)\]\]\s*\(第(\d+)行\)/,
    BACKLINK_BLOCK_REFERENCE: /📍\s*来源:\s*\[\[([^\]]+)#\^([^\]]+)\]\]\s*\(第(\d+)行\)/,
    BACKLINK_OLD_FORMAT: /---\n来源：.*\s\(行\s\d+\)/,
    
    // URL检测
    URL_PATTERN: /^https?:\/\/\S+$/,
    
    // 文件链接检测
    FILE_LINK_PATTERN: /^\[\[.*\]\]$/,
    
    // 搜索词转义
    SEARCH_ESCAPE: /[.*+?^${}()|[\]\\]/g
} as const;

// 颜色相关常量
export const COLOR_CONSTANTS = {
    // 默认颜色
    DEFAULT_COLORS: ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink'],
    
    // 透明度
    HOVER_OPACITY: 0.8,
    DISABLED_OPACITY: 0.5,
    
    // 高亮
    HIGHLIGHT_OPACITY: 0.3
} as const;
