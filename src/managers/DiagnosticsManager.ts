import { App } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';
import { TempFileManager } from './TempFileManager';
import { PersistentFileManager } from './PersistentFileManager';
import { HiddenEditorManager } from './HiddenEditorManager';
import { EditorStateCoordinator } from './EditorStateCoordinator';

/**
 * 系统健康状态
 */
export interface SystemHealthStatus {
    isHealthy: boolean;
    timestamp: number;
    issues: HealthIssue[];
    recommendations: string[];
    resourceUsage: ResourceUsage;
}

/**
 * 健康问题
 */
export interface HealthIssue {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'memory' | 'files' | 'editors' | 'state' | 'performance';
    description: string;
    details?: any;
}

/**
 * 资源使用情况
 */
export interface ResourceUsage {
    tempFiles: {
        count: number;
        totalSize: number;
        oldestAge: number;
    };
    editors: {
        activeCount: number;
        memoryUsage: number;
    };
    performance: {
        averageResponseTime: number;
        errorRate: number;
    };
}

/**
 * 诊断管理器
 * 负责监控系统健康状态和资源使用情况
 */
export class DiagnosticsManager {
    private app: App;
    private tempFileManager: TempFileManager;
    private editorStateCoordinator: EditorStateCoordinator;
    private performanceMetrics: Map<string, number[]> = new Map();
    private errorCount = 0;
    private totalOperations = 0;

    constructor(
        app: App,
        tempFileManager: TempFileManager,
        editorStateCoordinator: EditorStateCoordinator
    ) {
        this.app = app;
        this.tempFileManager = tempFileManager;
        this.editorStateCoordinator = editorStateCoordinator;
    }

    /**
     * 执行系统健康检查
     */
    checkSystemHealth(): SystemHealthStatus {
        const issues: HealthIssue[] = [];
        const recommendations: string[] = [];

        // 检查临时文件状态
        const tempFileIssues = this.checkTempFileHealth();
        issues.push(...tempFileIssues);

        // 检查编辑器状态
        const editorIssues = this.checkEditorHealth();
        issues.push(...editorIssues);

        // 检查状态一致性
        const stateIssues = this.checkStateConsistency();
        issues.push(...stateIssues);

        // 检查性能指标
        const performanceIssues = this.checkPerformanceHealth();
        issues.push(...performanceIssues);

        // 生成建议
        if (issues.length > 0) {
            recommendations.push(...this.generateRecommendations(issues));
        }

        const isHealthy = issues.filter(issue => 
            issue.severity === 'high' || issue.severity === 'critical'
        ).length === 0;

        return {
            isHealthy,
            timestamp: Date.now(),
            issues,
            recommendations,
            resourceUsage: this.getResourceUsage()
        };
    }

    /**
     * 检查临时文件健康状态
     */
    private checkTempFileHealth(): HealthIssue[] {
        const issues: HealthIssue[] = [];
        const tempFileStatus = this.tempFileManager.getTempFileStatus();

        if (tempFileStatus.hasActive) {
            // 检查文件年龄
            if (tempFileStatus.age && tempFileStatus.age > 600000) { // 10分钟
                issues.push({
                    severity: 'medium',
                    category: 'files',
                    description: '临时文件存在时间过长',
                    details: { age: tempFileStatus.age, fileName: tempFileStatus.fileName }
                });
            }

            // 检查最后访问时间
            if (tempFileStatus.lastAccessed && tempFileStatus.lastAccessed > 300000) { // 5分钟
                issues.push({
                    severity: 'low',
                    category: 'files',
                    description: '临时文件长时间未访问',
                    details: { lastAccessed: tempFileStatus.lastAccessed }
                });
            }
        }

        return issues;
    }

    /**
     * 检查编辑器健康状态
     */
    private checkEditorHealth(): HealthIssue[] {
        const issues: HealthIssue[] = [];
        const editorStatus = this.editorStateCoordinator.getEditorStatusInfo();

        // 检查编辑器状态一致性
        const fileHasActive = editorStatus.fileMode === 'persistent'
            ? editorStatus.fileStatus.isInUse
            : editorStatus.fileStatus.hasActive;

        if (editorStatus.hasActiveEditor !== fileHasActive) {
            issues.push({
                severity: 'high',
                category: 'state',
                description: `编辑器和${editorStatus.fileMode === 'persistent' ? '持久化' : '临时'}文件状态不一致`,
                details: editorStatus
            });
        }

        // 检查编辑器年龄
        if (editorStatus.editorStatus.hasActive && editorStatus.editorStatus.age > 900000) { // 15分钟
            issues.push({
                severity: 'medium',
                category: 'editors',
                description: '编辑器会话时间过长',
                details: { age: editorStatus.editorStatus.age }
            });
        }

        return issues;
    }

    /**
     * 检查状态一致性
     */
    private checkStateConsistency(): HealthIssue[] {
        const issues: HealthIssue[] = [];
        
        try {
            const coordinatorHealth = this.editorStateCoordinator.checkSystemHealth();
            
            if (!coordinatorHealth.isHealthy) {
                issues.push({
                    severity: 'high',
                    category: 'state',
                    description: '编辑器状态协调器检测到问题',
                    details: coordinatorHealth
                });
            }
        } catch (error) {
            issues.push({
                severity: 'critical',
                category: 'state',
                description: '状态检查失败',
                details: { error: error instanceof Error ? error.message : String(error) }
            });
        }

        return issues;
    }

    /**
     * 检查性能健康状态
     */
    private checkPerformanceHealth(): HealthIssue[] {
        const issues: HealthIssue[] = [];

        // 检查错误率
        const errorRate = this.totalOperations > 0 ? this.errorCount / this.totalOperations : 0;
        if (errorRate > 0.05) { // 5%错误率
            issues.push({
                severity: 'high',
                category: 'performance',
                description: '错误率过高',
                details: { errorRate, errorCount: this.errorCount, totalOperations: this.totalOperations }
            });
        }

        // 检查响应时间
        const avgResponseTime = this.getAverageResponseTime();
        if (avgResponseTime > 1000) { // 1秒
            issues.push({
                severity: 'medium',
                category: 'performance',
                description: '平均响应时间过长',
                details: { averageResponseTime: avgResponseTime }
            });
        }

        return issues;
    }

    /**
     * 生成建议
     */
    private generateRecommendations(issues: HealthIssue[]): string[] {
        const recommendations: string[] = [];
        const categories = new Set(issues.map(issue => issue.category));

        if (categories.has('files')) {
            recommendations.push('执行临时文件清理');
        }

        if (categories.has('editors')) {
            recommendations.push('重启编辑器会话');
        }

        if (categories.has('state')) {
            recommendations.push('执行状态同步和异常恢复');
        }

        if (categories.has('performance')) {
            recommendations.push('优化性能或重启插件');
        }

        const criticalIssues = issues.filter(issue => issue.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push('立即执行完整系统重置');
        }

        return recommendations;
    }

    /**
     * 获取资源使用情况
     */
    private getResourceUsage(): ResourceUsage {
        const tempFileStatus = this.tempFileManager.getTempFileStatus();
        const editorStatus = this.editorStateCoordinator.getEditorStatusInfo();

        return {
            tempFiles: {
                count: tempFileStatus.hasActive ? 1 : 0,
                totalSize: 0, // 暂时无法获取文件大小
                oldestAge: tempFileStatus.age || 0
            },
            editors: {
                activeCount: editorStatus.hasActiveEditor ? 1 : 0,
                memoryUsage: 0 // 暂时无法获取内存使用
            },
            performance: {
                averageResponseTime: this.getAverageResponseTime(),
                errorRate: this.totalOperations > 0 ? this.errorCount / this.totalOperations : 0
            }
        };
    }

    /**
     * 记录操作性能
     */
    recordOperation(operationType: string, duration: number, success: boolean): void {
        // 记录响应时间
        if (!this.performanceMetrics.has(operationType)) {
            this.performanceMetrics.set(operationType, []);
        }
        
        const metrics = this.performanceMetrics.get(operationType)!;
        metrics.push(duration);
        
        // 只保留最近100次记录
        if (metrics.length > 100) {
            metrics.shift();
        }

        // 更新统计
        this.totalOperations++;
        if (!success) {
            this.errorCount++;
        }
    }

    /**
     * 获取平均响应时间
     */
    private getAverageResponseTime(): number {
        let totalTime = 0;
        let totalCount = 0;

        for (const metrics of this.performanceMetrics.values()) {
            totalTime += metrics.reduce((sum, time) => sum + time, 0);
            totalCount += metrics.length;
        }

        return totalCount > 0 ? totalTime / totalCount : 0;
    }

    /**
     * 执行自动修复
     */
    async performAutoFix(healthStatus: SystemHealthStatus): Promise<boolean> {
        try {
            const criticalIssues = healthStatus.issues.filter(issue => issue.severity === 'critical');
            const highIssues = healthStatus.issues.filter(issue => issue.severity === 'high');

            // 处理关键问题
            if (criticalIssues.length > 0) {
                DebugManager.log('Performing critical issue auto-fix...');
                await this.editorStateCoordinator.recoverFromException();
                await this.tempFileManager.recoverFromException();
                return true;
            }

            // 处理高优先级问题
            if (highIssues.length > 0) {
                DebugManager.log('Performing high priority issue auto-fix...');
                
                for (const issue of highIssues) {
                    if (issue.category === 'state') {
                        await this.editorStateCoordinator.recoverFromException();
                    } else if (issue.category === 'files') {
                        await this.tempFileManager.cleanupCurrentTempFile();
                    }
                }
                return true;
            }

            return false;

        } catch (error) {
            DebugManager.error('Auto-fix failed:', error);
            return false;
        }
    }

    /**
     * 生成诊断报告
     */
    generateDiagnosticReport(): string {
        const healthStatus = this.checkSystemHealth();
        const resourceUsage = healthStatus.resourceUsage;

        let report = '=== Canvasgrid Transit 诊断报告 ===\n\n';
        report += `时间: ${new Date(healthStatus.timestamp).toLocaleString()}\n`;
        report += `系统状态: ${healthStatus.isHealthy ? '健康' : '存在问题'}\n\n`;

        // 资源使用情况
        report += '--- 资源使用情况 ---\n';
        report += `临时文件: ${resourceUsage.tempFiles.count} 个\n`;
        report += `活跃编辑器: ${resourceUsage.editors.activeCount} 个\n`;
        report += `平均响应时间: ${resourceUsage.performance.averageResponseTime.toFixed(2)}ms\n`;
        report += `错误率: ${(resourceUsage.performance.errorRate * 100).toFixed(2)}%\n\n`;

        // 问题列表
        if (healthStatus.issues.length > 0) {
            report += '--- 发现的问题 ---\n';
            for (const issue of healthStatus.issues) {
                report += `[${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}\n`;
            }
            report += '\n';
        }

        // 建议
        if (healthStatus.recommendations.length > 0) {
            report += '--- 建议操作 ---\n';
            for (const recommendation of healthStatus.recommendations) {
                report += `- ${recommendation}\n`;
            }
        }

        return report;
    }

    /**
     * 重置统计数据
     */
    resetMetrics(): void {
        this.performanceMetrics.clear();
        this.errorCount = 0;
        this.totalOperations = 0;
        DebugManager.log('Diagnostics metrics reset');
    }
}
