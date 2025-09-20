/**
 * Canvas 相关类型定义
 */

// Canvas 节点类型
export type CanvasNodeType = 'text' | 'file' | 'link' | 'group';

// Canvas 节点接口
export interface CanvasNode {
    id: string;
    type: CanvasNodeType;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    text?: string;
    file?: string;
    url?: string;
    subpath?: string;
    label?: string;
}

// Canvas 边接口
export interface CanvasEdge {
    id: string;
    fromNode: string;
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    toNode: string;
    toSide: 'top' | 'right' | 'bottom' | 'left';
    color?: string;
    label?: string;
}

// Canvas 数据接口
export interface CanvasData {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

// Canvas 文件接口
export interface CanvasFile {
    path: string;
    data: CanvasData;
    lastModified: number;
}

// Canvas 节点验证结果
export interface NodeValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Canvas 解析选项
export interface CanvasParseOptions {
    validateNodes?: boolean;
    validateEdges?: boolean;
    strictMode?: boolean;
    ignoreInvalidNodes?: boolean;
}

// Canvas 序列化选项
export interface CanvasSerializeOptions {
    indent?: number;
    sortNodes?: boolean;
    sortEdges?: boolean;
    includeMetadata?: boolean;
}

// Canvas 统计信息
export interface CanvasStats {
    totalNodes: number;
    nodesByType: Record<CanvasNodeType, number>;
    totalEdges: number;
    colorDistribution: Record<string, number>;
    averageNodeSize: { width: number; height: number };
    canvasBounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        width: number;
        height: number;
    };
}

// Canvas 搜索选项
export interface CanvasSearchOptions {
    query: string;
    caseSensitive?: boolean;
    includeNodeTypes?: CanvasNodeType[];
    excludeNodeTypes?: CanvasNodeType[];
    colorFilter?: string[];
    searchFields?: ('text' | 'file' | 'url' | 'label')[];
}

// Canvas 搜索结果
export interface CanvasSearchResult {
    node: CanvasNode;
    matches: {
        field: string;
        value: string;
        highlightRanges: { start: number; end: number }[];
    }[];
    score: number;
}

// Canvas 过滤器
export interface CanvasFilter {
    nodeTypes?: CanvasNodeType[];
    colors?: string[];
    textContains?: string;
    fileExtensions?: string[];
    urlDomains?: string[];
    sizeRange?: {
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
    };
    positionRange?: {
        minX?: number;
        maxX?: number;
        minY?: number;
        maxY?: number;
    };
}

// Canvas 排序选项
export interface CanvasSortOptions {
    field: 'x' | 'y' | 'width' | 'height' | 'text' | 'file' | 'color' | 'type';
    direction: 'asc' | 'desc';
    secondary?: {
        field: 'x' | 'y' | 'width' | 'height' | 'text' | 'file' | 'color' | 'type';
        direction: 'asc' | 'desc';
    };
}

// Canvas 布局选项
export interface CanvasLayoutOptions {
    algorithm: 'grid' | 'force' | 'hierarchical' | 'circular';
    spacing?: number;
    alignment?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
    preserveAspectRatio?: boolean;
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

// Canvas 导出选项
export interface CanvasExportOptions {
    format: 'json' | 'svg' | 'png' | 'pdf';
    includeEdges?: boolean;
    includeHiddenNodes?: boolean;
    scale?: number;
    quality?: number;
    backgroundColor?: string;
    margins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

// Canvas 导入选项
export interface CanvasImportOptions {
    mergeMode: 'replace' | 'merge' | 'append';
    validateData?: boolean;
    preserveIds?: boolean;
    offsetPosition?: { x: number; y: number };
    colorMapping?: Record<string, string>;
}

// Canvas 操作历史
export interface CanvasOperation {
    id: string;
    type: 'create' | 'update' | 'delete' | 'move' | 'resize';
    timestamp: number;
    nodeId?: string;
    edgeId?: string;
    oldData?: any;
    newData?: any;
    description: string;
}

// Canvas 撤销/重做状态
export interface CanvasUndoRedoState {
    operations: CanvasOperation[];
    currentIndex: number;
    maxOperations: number;
    canUndo: boolean;
    canRedo: boolean;
}

// Canvas 选择状态
export interface CanvasSelection {
    selectedNodes: string[];
    selectedEdges: string[];
    selectionBounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    lastSelected?: string;
}

// Canvas 视图状态
export interface CanvasViewState {
    zoom: number;
    panX: number;
    panY: number;
    viewportWidth: number;
    viewportHeight: number;
    visibleBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

// Canvas 配置
export interface CanvasConfig {
    defaultNodeSize: { width: number; height: number };
    defaultNodeColor: string;
    defaultEdgeColor: string;
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
    showRuler: boolean;
    enableAnimations: boolean;
    animationDuration: number;
    maxZoom: number;
    minZoom: number;
    zoomStep: number;
}

// Canvas 主题
export interface CanvasTheme {
    name: string;
    colors: {
        background: string;
        grid: string;
        ruler: string;
        selection: string;
        highlight: string;
        text: string;
        border: string;
    };
    fonts: {
        default: string;
        monospace: string;
        sizes: {
            small: number;
            medium: number;
            large: number;
        };
    };
    shadows: {
        node: string;
        selection: string;
    };
}

// Canvas 错误类型
export interface CanvasError {
    code: string;
    message: string;
    details?: any;
    nodeId?: string;
    edgeId?: string;
    timestamp: number;
}

// Canvas 事件类型
export type CanvasEventType = 
    | 'node-created'
    | 'node-updated' 
    | 'node-deleted'
    | 'node-selected'
    | 'node-deselected'
    | 'edge-created'
    | 'edge-updated'
    | 'edge-deleted'
    | 'canvas-loaded'
    | 'canvas-saved'
    | 'view-changed'
    | 'selection-changed';

// Canvas 事件数据
export interface CanvasEvent {
    type: CanvasEventType;
    timestamp: number;
    data: any;
    source: string;
}

// Canvas 插件接口
export interface CanvasPlugin {
    name: string;
    version: string;
    initialize: (canvas: any) => void;
    destroy: () => void;
    onEvent?: (event: CanvasEvent) => void;
}

// Canvas 扩展点
export interface CanvasExtensionPoint {
    name: string;
    description: string;
    handler: (context: any, ...args: any[]) => any;
    priority: number;
}

// Canvas 上下文菜单项
export interface CanvasContextMenuItem {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    enabled?: boolean;
    visible?: boolean;
    action: (context: any) => void;
    submenu?: CanvasContextMenuItem[];
}

// Canvas 工具栏项
export interface CanvasToolbarItem {
    id: string;
    label: string;
    icon: string;
    tooltip?: string;
    enabled?: boolean;
    visible?: boolean;
    action: () => void;
    type: 'button' | 'toggle' | 'dropdown' | 'separator';
    group?: string;
    order?: number;
}

// Canvas 快捷键
export interface CanvasShortcut {
    id: string;
    key: string;
    modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
    description: string;
    action: () => void;
    context?: 'global' | 'canvas' | 'node' | 'edge';
}

// Canvas 性能指标
export interface CanvasPerformanceMetrics {
    renderTime: number;
    updateTime: number;
    memoryUsage: number;
    nodeCount: number;
    edgeCount: number;
    fps: number;
    lastMeasurement: number;
}

// Canvas 调试信息
export interface CanvasDebugInfo {
    version: string;
    buildTime: string;
    performance: CanvasPerformanceMetrics;
    errors: CanvasError[];
    warnings: string[];
    config: CanvasConfig;
    state: {
        loaded: boolean;
        dirty: boolean;
        saving: boolean;
        lastSaved: number;
    };
}
