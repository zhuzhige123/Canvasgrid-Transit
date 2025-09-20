/**
 * Anki Connect相关类型定义
 */

// Anki Connect配置接口
export interface AnkiConnectConfig {
	enabled: boolean;
	apiUrl: string;
	apiKey?: string;
	defaultDeck: string;
	modelName: string;
	syncColors: string[];
	enableIncrementalSync: boolean;
	batchSize: number;
	retryAttempts: number;
	timeout: number;
	contentDivider: string; // 自定义分隔符，默认 "---div---"
	forceSync?: boolean; // 强制同步选项，绕过增量判断
}

// Anki卡片接口
export interface AnkiNote {
	deckName: string;
	modelName: string;
	fields: Record<string, string>;
	tags: string[];
	options?: {
		allowDuplicate: boolean;
		duplicateScope: string;
	};
}

// 同步结果接口
export interface SyncResult {
	success: boolean;
	created: number;
	updated: number;
	skipped: number;
	errors: string[];
	totalProcessed: number;
	duration: number; // 同步耗时（毫秒）
}

// Anki Connect响应接口
export interface AnkiConnectResponse {
	result: any;
	error: string | null;
}

// 同步状态枚举
export enum SyncStatus {
	IDLE = 'idle',
	CONNECTING = 'connecting',
	IN_PROGRESS = 'in_progress',
	SYNCING = 'syncing',
	COMPLETED = 'completed',
	ERROR = 'error',
	CANCELLED = 'cancelled'
}

// 同步进度接口
export interface SyncProgress {
	status: SyncStatus;
	current: number;
	total: number;
	message: string;
	errors: string[];
}

// 字段映射接口
export interface FieldMapping {
	ankiField: string;
	canvasProperty: 'text' | 'id' | 'color' | 'position' | 'size' | 'custom';
	customExtractor?: (node: any) => string;
}

// 同步历史记录接口
export interface SyncHistory {
	lastSyncTime: number;
	syncedNodes: Record<string, SyncedNodeInfo>;
	failedNodes: string[];
	totalSynced: number;
	lastSyncResult: SyncResult | null;
}

// 已同步节点信息
export interface SyncedNodeInfo {
	nodeId: string;
	ankiNoteId: number;
	lastModified: number;
	contentHash: string;
	syncTime: number;
}

// Anki牌组信息
export interface DeckInfo {
	name: string;
	id: number;
	cardCount?: number;
	newCount?: number;
	reviewCount?: number;
}

// Anki模板信息
export interface ModelInfo {
	name: string;
	id: number;
	fields: string[];
	templates: TemplateInfo[];
}

// Anki模板详情
export interface TemplateInfo {
	name: string;
	front: string;
	back: string;
}

// 同步选项接口
export interface SyncOptions {
	colors?: string[];
	nodeIds?: string[];
	forceUpdate?: boolean;
	dryRun?: boolean;
	batchSize?: number;
}

// 验证结果接口
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

// Canvas节点到Anki卡片的转换结果
export interface ConversionResult {
	success: boolean;
	ankiNote?: AnkiNote;
	error?: string;
	warnings: string[];
}

// 批量操作结果
export interface BatchResult<T> {
	successful: T[];
	failed: Array<{
		item: any;
		error: string;
	}>;
	totalProcessed: number;
}

// Anki Connect API错误类型
export enum AnkiConnectErrorType {
	CONNECTION_ERROR = 'connection_error',
	AUTHENTICATION_ERROR = 'authentication_error',
	DECK_NOT_FOUND = 'deck_not_found',
	MODEL_NOT_FOUND = 'model_not_found',
	INVALID_NOTE = 'invalid_note',
	DUPLICATE_NOTE = 'duplicate_note',
	TIMEOUT_ERROR = 'timeout_error',
	UNKNOWN_ERROR = 'unknown_error'
}

// Anki Connect错误详情
export interface AnkiConnectError {
	type: AnkiConnectErrorType;
	message: string;
	details?: any;
	retryable: boolean;
}

// 同步配置验证结果
export interface ConfigValidationResult {
	valid: boolean;
	connectionOk: boolean;
	deckExists: boolean;
	modelExists: boolean;
	fieldsValid: boolean;
	errors: string[];
	warnings: string[];
}

// 导出统计信息
export interface ExportStats {
	totalNodes: number;
	eligibleNodes: number;
	processedNodes: number;
	successfulExports: number;
	failedExports: number;
	skippedNodes: number;
	duplicateNodes: number;
}

// Canvas节点扩展信息（用于同步）
export interface CanvasNodeSyncInfo {
	id: string;
	type: string;
	text?: string;
	color?: string;
	x: number;
	y: number;
	width: number;
	height: number;
	lastModified?: number;
	contentHash?: string;
	syncStatus?: 'pending' | 'synced' | 'failed' | 'skipped';
	ankiNoteId?: number;
}

// 同步事件类型
export enum SyncEventType {
	SYNC_STARTED = 'sync_started',
	SYNC_PROGRESS = 'sync_progress',
	SYNC_COMPLETED = 'sync_completed',
	SYNC_ERROR = 'sync_error',
	SYNC_CANCELLED = 'sync_cancelled',
	CONNECTION_TEST = 'connection_test',
	CONFIG_UPDATED = 'config_updated'
}

// 同步事件数据
export interface SyncEvent {
	type: SyncEventType;
	timestamp: number;
	data?: any;
	message?: string;
}
