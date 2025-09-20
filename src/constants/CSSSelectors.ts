/**
 * CSS选择器常量配置
 * 统一管理所有CSS选择器，便于维护和更新
 */

// Canvas相关选择器
export const CANVAS_SELECTORS = {
    // Canvas容器
    CONTAINERS: [
        '.workspace-leaf-content[data-type="canvas"]',
        '[data-type="canvas"]',
        '.canvas-wrapper',
        '.canvas-container',
        '.view-content[data-type="canvas"]'
    ],
    
    // Canvas元素
    CANVAS_ELEMENT: '.canvas',
    CANVAS_NODE: '.canvas-node',
    CANVAS_EDGE: '.canvas-edge',
    
    // Canvas视图
    CANVAS_VIEW: '.canvas-view',
    CANVAS_VIEWPORT: '.canvas-viewport'
} as const;

// 编辑器相关选择器
export const EDITOR_SELECTORS = {
    // CodeMirror编辑器
    CM_EDITOR: '.cm-editor',
    CM_CONTENT: '.cm-content',
    CM_LINE: '.cm-line',
    CM_SELECTION: '.cm-selectionBackground',
    
    // Obsidian编辑器
    MARKDOWN_VIEW: '.markdown-source-view',
    MARKDOWN_EDITOR: '.markdown-source-view .cm-editor',
    
    // 编辑器容器
    EDITOR_CONTAINER: '.workspace-leaf-content[data-type="markdown"]'
} as const;

// 工作区相关选择器
export const WORKSPACE_SELECTORS = {
    // 工作区叶子
    WORKSPACE_LEAF: '.workspace-leaf',
    WORKSPACE_LEAF_CONTENT: '.workspace-leaf-content',
    
    // 视图类型
    VIEW_HEADER: '.view-header',
    VIEW_CONTENT: '.view-content',
    VIEW_ACTIONS: '.view-actions',
    
    // 标签页
    TAB_HEADER: '.workspace-tab-header',
    TAB_CONTAINER: '.workspace-tab-container'
} as const;

// 插件UI相关选择器
export const PLUGIN_SELECTORS = {
    // 主容器
    MAIN_CONTAINER: '.canvas-grid-plugin',
    GRID_CONTAINER: '.canvas-grid-container',
    TIMELINE_CONTAINER: '.timeline-container',
    
    // 卡片
    GRID_CARD: '.canvas-grid-card',
    TIMELINE_CARD: '.timeline-card',
    CARD_CONTENT: '.card-content',
    CARD_HEADER: '.card-header',
    CARD_FOOTER: '.card-footer',
    
    // 控制面板
    CONTROL_PANEL: '.canvas-grid-controls',
    SEARCH_INPUT: '.canvas-grid-search',
    FILTER_CONTROLS: '.canvas-grid-filters',
    
    // 按钮
    VIEW_TOGGLE: '.view-toggle-btn',
    REFRESH_BUTTON: '.refresh-btn',
    SETTINGS_BUTTON: '.settings-btn'
} as const;

// 拖拽相关选择器
export const DRAG_SELECTORS = {
    // 拖拽区域
    DROP_ZONE: '.canvas-grid-drop-zone',
    TIMELINE_DROP_ZONE: '.timeline-drop-zone',
    DROP_ZONE_ACTIVE: '.drop-zone-active',
    
    // 拖拽状态
    DRAGGING: '.dragging',
    DRAGGING_FROM_GRID: '.dragging-from-grid',
    DRAG_OVER: '.drag-over',
    TIMELINE_DRAG_OVER: '.timeline-drag-over',
    
    // 拖拽指示器
    DROP_INDICATOR: '.drop-indicator',
    TIMELINE_DROP_INDICATOR: '.timeline-drop-indicator',
    
    // 拖拽预览
    DRAG_PREVIEW: '.drag-preview',
    TIMELINE_DRAG_PREVIEW: '.timeline-drag-preview'
} as const;

// 时间线相关选择器
export const TIMELINE_SELECTORS = {
    // 时间线结构
    CALENDAR_SECTION: '.timeline-calendar-section',
    CALENDAR_CONTAINER: '.timeline-calendar-container',
    CONTENT_SECTION: '.timeline-content-section',
    VERTICAL_CONTAINER: '.timeline-content-vertical',
    
    // 时间轴
    VERTICAL_AXIS: '.timeline-vertical-axis',
    TIME_SLOT: '.time-slot',
    TIME_LABEL: '.time-label',
    
    // 时间线项目
    ITEMS_CONTAINER: '.timeline-items-container',
    TIMELINE_ITEM: '.timeline-item',
    
    // 日历
    CALENDAR_HEADER: '.calendar-header',
    CALENDAR_NAV_BTN: '.calendar-nav-btn',
    CALENDAR_MONTH_YEAR: '.calendar-month-year',
    CALENDAR_GRID: '.calendar-grid',
    CALENDAR_DAY: '.calendar-day'
} as const;

// 搜索相关选择器
export const SEARCH_SELECTORS = {
    // 搜索容器
    SEARCH_CONTAINER: '.canvas-search-container',
    SEARCH_INPUT: '.canvas-search-input',
    SEARCH_RESULTS: '.canvas-search-results',
    
    // 文件列表
    FILE_LIST: '.canvas-file-list',
    FILE_ITEM: '.canvas-file-item',
    FILE_NAME: '.file-name',
    FILE_PATH: '.file-path',
    
    // 搜索状态
    NO_RESULTS: '.canvas-search-no-results',
    LOADING_RESULTS: '.canvas-search-loading'
} as const;

// 模态框相关选择器
export const MODAL_SELECTORS = {
    // 模态框容器
    MODAL: '.modal',
    MODAL_CONTAINER: '.modal-container',
    MODAL_CONTENT: '.modal-content',
    
    // 模态框组件
    MODAL_HEADER: '.modal-header',
    MODAL_TITLE: '.modal-title',
    MODAL_BODY: '.modal-body',
    MODAL_FOOTER: '.modal-footer',
    
    // 关闭按钮
    MODAL_CLOSE: '.modal-close',
    MODAL_CLOSE_BUTTON: '.modal-close-button'
} as const;

// 状态相关选择器
export const STATE_SELECTORS = {
    // 加载状态
    LOADING: '.loading',
    LOADED: '.loaded',
    ERROR: '.error',
    
    // 激活状态
    ACTIVE: '.active',
    SELECTED: '.selected',
    FOCUSED: '.focused',
    
    // 可见性状态
    HIDDEN: '.hidden',
    VISIBLE: '.visible',
    COLLAPSED: '.collapsed',
    EXPANDED: '.expanded',
    
    // 交互状态
    HOVER: '.hover',
    PRESSED: '.pressed',
    DISABLED: '.disabled'
} as const;

// 主题相关选择器
export const THEME_SELECTORS = {
    // 主题类
    THEME_LIGHT: '.theme-light',
    THEME_DARK: '.theme-dark',
    
    // 颜色类
    COLOR_RED: '.color-red',
    COLOR_ORANGE: '.color-orange',
    COLOR_YELLOW: '.color-yellow',
    COLOR_GREEN: '.color-green',
    COLOR_CYAN: '.color-cyan',
    COLOR_BLUE: '.color-blue',
    COLOR_PURPLE: '.color-purple',
    COLOR_PINK: '.color-pink'
} as const;

// 动画相关选择器
export const ANIMATION_SELECTORS = {
    // 动画类
    FADE_IN: '.fade-in',
    FADE_OUT: '.fade-out',
    SLIDE_IN: '.slide-in',
    SLIDE_OUT: '.slide-out',
    
    // 过渡类
    TRANSITION: '.transition',
    NO_TRANSITION: '.no-transition',
    
    // 特效类
    PULSE: '.pulse',
    BOUNCE: '.bounce',
    SHAKE: '.shake'
} as const;
