/**
 * UI消息常量配置
 * 统一管理所有用户界面文本，支持国际化扩展
 */

// 错误消息
export const ERROR_MESSAGES = {
    // 节点相关错误
    EMPTY_NODE_TEXT: '节点文本为空，无法搜索',
    TEXT_NODE_ONLY: '只能为文本节点搜索相关文件',
    NODE_NOT_FOUND: '节点不存在，可能已被删除',
    
    // 搜索相关错误
    NO_MATCHES_FOUND: '未找到匹配的原文内容',
    NO_SELECTED_TEXT: '没有选中的文本',
    SEARCH_FAILED: '搜索相关文件失败',
    
    // 文件相关错误
    FILE_NOT_FOUND: '文件不存在',
    FILE_READ_FAILED: '文件读取失败',
    FILE_SAVE_FAILED: '文件保存失败',
    CANVAS_LOAD_FAILED: '无法加载Canvas文件',
    
    // 拖拽相关错误
    DRAG_TO_CANVAS_FAILED: '拖拽到Canvas失败',
    NO_DRAG_DATA: '没有检测到有效的拖拽数据',
    INVALID_DROP_TARGET: '无效的拖拽目标',
    
    // 时间线相关错误
    TIMELINE_LOAD_FAILED: '时间线加载失败',
    TIMELINE_CARD_CREATE_FAILED: '创建时间线卡片失败',
    
    // 网络相关错误
    NETWORK_ERROR: '网络连接失败',
    TIMEOUT_ERROR: '操作超时',
    
    // 权限相关错误
    PERMISSION_DENIED: '权限不足',
    ACCESS_DENIED: '访问被拒绝'
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
    // 文件操作成功
    FILE_SAVED: '文件保存成功',
    CANVAS_LOADED: 'Canvas文件加载成功',
    
    // 搜索成功
    SEARCH_COMPLETED: '搜索完成',
    LOCATION_FOUND: '已定位到原文',
    
    // 拖拽成功
    CARD_CREATED: '卡片创建成功',
    CARD_MOVED: '卡片已移动到Canvas',
    CARD_COPIED: '卡片已复制到Canvas',
    
    // 时间线成功
    TIMELINE_CARD_CREATED: '时间线卡片已创建',
    TIMELINE_LOADED: '时间线加载成功',
    
    // 导航成功
    NAVIGATION_SUCCESS: '导航成功',
    BACKLINK_NAVIGATION: '已跳转到源文件'
} as const;

// 信息提示消息
export const INFO_MESSAGES = {
    // 搜索提示
    SEARCH_SUGGESTION: '建议在搜索面板中查找',
    GLOBAL_SEARCH_STARTED: '已在全局搜索中查找',
    
    // 操作提示
    LOADING: '正在加载...',
    PROCESSING: '正在处理...',
    SAVING: '正在保存...',
    
    // 拖拽提示
    DRAG_TO_CREATE: '拖拽到此处创建新卡片',
    DRAG_TO_TIMELINE: '拖拽到此处创建时间线卡片',
    
    // 状态提示
    NO_CANVAS_SELECTED: '请先选择一个Canvas文件',
    NO_RESULTS: '未找到结果',
    EMPTY_CANVAS: 'Canvas文件为空',
    
    // 功能提示
    RIGHT_CLICK_FOR_OPTIONS: '右键点击查看更多选项',
    DOUBLE_CLICK_TO_EDIT: '双击编辑',
    
    // 时间线提示
    SELECT_DATE: '请选择日期',
    TIME_SLOT_OCCUPIED: '该时间段已有内容'
} as const;

// 警告消息
export const WARNING_MESSAGES = {
    // 数据警告
    DATA_CORRUPTION: '数据可能已损坏',
    UNSAVED_CHANGES: '有未保存的更改',
    LARGE_FILE_WARNING: '文件较大，加载可能需要时间',
    
    // 操作警告
    OPERATION_IRREVERSIBLE: '此操作不可撤销',
    CONFIRM_DELETE: '确认删除此项目？',
    CONFIRM_OVERWRITE: '确认覆盖现有内容？',
    
    // 兼容性警告
    FEATURE_NOT_SUPPORTED: '当前版本不支持此功能',
    BROWSER_NOT_SUPPORTED: '浏览器不支持此功能',
    
    // 性能警告
    PERFORMANCE_WARNING: '操作可能影响性能',
    MEMORY_WARNING: '内存使用较高'
} as const;

// 按钮和控件文本
export const UI_LABELS = {
    // 通用按钮
    OK: '确定',
    CANCEL: '取消',
    SAVE: '保存',
    DELETE: '删除',
    EDIT: '编辑',
    COPY: '复制',
    MOVE: '移动',
    REFRESH: '刷新',
    RELOAD: '重新加载',
    
    // 搜索相关
    SEARCH: '搜索',
    FILTER: '筛选',
    SORT: '排序',
    CLEAR: '清除',
    
    // 视图切换
    GRID_VIEW: '网格视图',
    TIMELINE_VIEW: '时间线视图',
    LIST_VIEW: '列表视图',
    
    // 导航
    BACK: '返回',
    FORWARD: '前进',
    HOME: '首页',
    
    // 文件操作
    OPEN: '打开',
    CLOSE: '关闭',
    NEW: '新建',
    IMPORT: '导入',
    EXPORT: '导出',
    
    // 时间线
    TODAY: '今天',
    YESTERDAY: '昨天',
    TOMORROW: '明天',
    THIS_WEEK: '本周',
    THIS_MONTH: '本月'
} as const;

// 占位符文本
export const PLACEHOLDER_TEXTS = {
    SEARCH_INPUT: '搜索Canvas文件...',
    FILTER_INPUT: '筛选条件...',
    TEXT_INPUT: '输入文本...',
    URL_INPUT: '输入URL...',
    FILE_NAME: '文件名...',
    CARD_CONTENT: '卡片内容...',
    COMMENT: '添加备注...'
} as const;

// 状态文本
export const STATUS_TEXTS = {
    // 加载状态
    LOADING: '加载中...',
    LOADED: '已加载',
    LOADING_FAILED: '加载失败',
    
    // 保存状态
    SAVING: '保存中...',
    SAVED: '已保存',
    SAVE_FAILED: '保存失败',
    
    // 连接状态
    CONNECTED: '已连接',
    DISCONNECTED: '已断开',
    CONNECTING: '连接中...',
    
    // 同步状态
    SYNCING: '同步中...',
    SYNCED: '已同步',
    SYNC_FAILED: '同步失败',
    
    // 处理状态
    PROCESSING: '处理中...',
    COMPLETED: '已完成',
    FAILED: '失败'
} as const;

// 工具提示文本
export const TOOLTIP_TEXTS = {
    // 功能按钮
    SEARCH_BUTTON: '搜索Canvas文件',
    FILTER_BUTTON: '筛选和排序',
    REFRESH_BUTTON: '刷新视图',
    SETTINGS_BUTTON: '打开设置',
    
    // 视图切换
    SWITCH_TO_GRID: '切换到网格视图',
    SWITCH_TO_TIMELINE: '切换到时间线视图',
    
    // 卡片操作
    EDIT_CARD: '编辑卡片',
    DELETE_CARD: '删除卡片',
    COPY_CARD: '复制卡片',
    MOVE_CARD: '移动卡片',
    
    // 导航
    GO_TO_SOURCE: '跳转到源文件',
    SHOW_IN_CANVAS: '在Canvas中显示',
    
    // 时间线
    SELECT_TIME: '选择时间',
    CHANGE_DATE: '更改日期'
} as const;
