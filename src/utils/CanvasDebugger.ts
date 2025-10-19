import { WorkspaceLeaf } from 'obsidian';
import { DebugManager } from './DebugManager';

/**
 * Canvas调试工具
 * 用于诊断Canvas API和节点聚焦问题
 */
export class CanvasDebugger {
    private leaf: WorkspaceLeaf;
    private canvas: any;

    constructor(leaf: WorkspaceLeaf) {
        this.leaf = leaf;
        this.canvas = this.getCanvasAPI(leaf);
    }

    /**
     * 获取Canvas API实例
     */
    private getCanvasAPI(leaf: WorkspaceLeaf): any {
        try {
            const view = leaf.view;

            // 使用类型检查而不是强制转换
            if (view && 'canvas' in view) {
                return (view as any).canvas;
            }

            if (view && 'canvasView' in view && (view as any).canvasView?.canvas) {
                return (view as any).canvasView.canvas;
            }

            if (view && 'renderer' in view && (view as any).renderer?.canvas) {
                return (view as any).renderer.canvas;
            }

            return null;
        } catch (error) {
            DebugManager.error('Error getting Canvas API:', error);
            return null;
        }
    }

    /**
     * 完整的Canvas诊断报告
     */
    async generateDiagnosticReport(nodeId?: string): Promise<string> {
        const report: string[] = [];
        
        report.push('=== Canvas 诊断报告 ===');
        report.push(`时间: ${new Date().toLocaleString()}`);
        report.push('');

        // 1. 基础信息
        report.push('1. 基础信息:');
        report.push(`   - Leaf类型: ${this.leaf.view?.getViewType() || 'unknown'}`);
        report.push(`   - View类型: ${(this.leaf.view as any)?.constructor?.name || 'Unknown'}`);
        report.push(`   - Canvas API可用: ${this.canvas ? '是' : '否'}`);
        report.push('');

        // 2. Canvas API分析
        if (this.canvas) {
            report.push('2. Canvas API分析:');
            const methods = this.analyzeCanvasAPI();
            methods.forEach(method => {
                report.push(`   - ${method}`);
            });
            report.push('');

            // 3. 节点信息
            const nodeInfo = await this.analyzeNodes();
            report.push('3. 节点信息:');
            report.push(`   - 总节点数: ${nodeInfo.totalNodes}`);
            report.push(`   - 节点获取方式: ${nodeInfo.method}`);
            
            if (nodeId) {
                const specificNode = await this.analyzeSpecificNode(nodeId);
                report.push(`   - 目标节点 ${nodeId}:`);
                if (specificNode) {
                    report.push(`     * 找到: 是`);
                    report.push(`     * 位置: (${specificNode.x}, ${specificNode.y})`);
                    report.push(`     * 尺寸: ${specificNode.width} x ${specificNode.height}`);
                    report.push(`     * 类型: ${specificNode.type}`);
                } else {
                    report.push(`     * 找到: 否`);
                }
            }
            report.push('');

            // 4. 视口信息
            const viewportInfo = this.analyzeViewport();
            report.push('4. 视口信息:');
            Object.entries(viewportInfo).forEach(([key, value]) => {
                report.push(`   - ${key}: ${value}`);
            });
            report.push('');
        }

        // 5. 文件信息
        const fileInfo = await this.analyzeCanvasFile();
        report.push('5. Canvas文件信息:');
        Object.entries(fileInfo).forEach(([key, value]) => {
            report.push(`   - ${key}: ${value}`);
        });

        return report.join('\n');
    }

    /**
     * 分析Canvas API可用方法
     */
    private analyzeCanvasAPI(): string[] {
        if (!this.canvas) return ['Canvas API不可用'];

        const methods: string[] = [];
        const apiMethods = [
            'zoomToBbox', 'zoomToSelection', 'panTo', 'setViewport',
            'deselectAll', 'selectNode', 'addToSelection',
            'nodes', 'viewport', 'view'
        ];

        apiMethods.forEach(method => {
            const available = typeof this.canvas[method] !== 'undefined';
            const type = typeof this.canvas[method];
            methods.push(`${method}: ${available ? `可用 (${type})` : '不可用'}`);
        });

        return methods;
    }

    /**
     * 分析节点信息
     */
    private async analyzeNodes(): Promise<{totalNodes: number, method: string}> {
        let totalNodes = 0;
        let method = '未知';

        try {
            // 方法1: 通过Canvas API
            if (this.canvas?.nodes) {
                if (this.canvas.nodes.size !== undefined) {
                    totalNodes = this.canvas.nodes.size;
                    method = 'Canvas API (Map)';
                } else if (Array.isArray(this.canvas.nodes)) {
                    totalNodes = this.canvas.nodes.length;
                    method = 'Canvas API (Array)';
                } else if (typeof this.canvas.nodes.get === 'function') {
                    // 尝试遍历Map
                    let count = 0;
                    try {
                        this.canvas.nodes.forEach(() => count++);
                        totalNodes = count;
                        method = 'Canvas API (Map遍历)';
                    } catch (e) {
                        method = 'Canvas API (无法遍历)';
                    }
                }
            }

            // 方法2: 通过文件数据
            if (totalNodes === 0) {
                const fileData = await this.getCanvasFileData();
                if (fileData?.nodes) {
                    totalNodes = fileData.nodes.length;
                    method = '文件数据';
                }
            }
        } catch (error) {
            method = `错误: ${error instanceof Error ? error.message : String(error)}`;
        }

        return { totalNodes, method };
    }

    /**
     * 分析特定节点
     */
    private async analyzeSpecificNode(nodeId: string): Promise<any> {
        try {
            // 方法1: Canvas API
            if (this.canvas?.nodes?.get) {
                const node = this.canvas.nodes.get(nodeId);
                if (node) return node;
            }

            // 方法2: 文件数据
            const fileData = await this.getCanvasFileData();
            if (fileData?.nodes) {
                return fileData.nodes.find((node: any) => node.id === nodeId);
            }

            return null;
        } catch (error) {
            DebugManager.error('Error analyzing specific node:', error);
            return null;
        }
    }

    /**
     * 分析视口信息
     */
    private analyzeViewport(): Record<string, any> {
        const info: Record<string, any> = {};

        try {
            if (this.canvas?.viewport) {
                const viewport = this.canvas.viewport;
                info['viewport对象'] = '存在';
                info['viewport.x'] = viewport.x || 'undefined';
                info['viewport.y'] = viewport.y || 'undefined';
                info['viewport.zoom'] = viewport.zoom || 'undefined';
                info['viewport.width'] = viewport.width || 'undefined';
                info['viewport.height'] = viewport.height || 'undefined';
            } else {
                info['viewport对象'] = '不存在';
            }

            if (this.canvas?.view) {
                info['view对象'] = '存在';
            } else {
                info['view对象'] = '不存在';
            }
        } catch (error) {
            info['错误'] = error instanceof Error ? error.message : String(error);
        }

        return info;
    }

    /**
     * 分析Canvas文件
     */
    private async analyzeCanvasFile(): Promise<Record<string, any>> {
        const info: Record<string, any> = {};

        try {
            const view = this.leaf.view;

            // 使用类型检查而不是强制转换
            if (view && 'file' in view) {
                const file = (view as any).file;

                if (file) {
                    info['文件名'] = file.name;
                    info['文件路径'] = file.path;
                    info['文件大小'] = file.stat.size + ' bytes';

                    const content = await this.leaf.view.app.vault.read(file);
                    const data = JSON.parse(content);

                    info['节点数量'] = data.nodes?.length || 0;
                    info['边数量'] = data.edges?.length || 0;
                    info['数据结构'] = Object.keys(data).join(', ');
                } else {
                    info['文件'] = '未找到';
                }
            } else {
                info['文件'] = '视图不支持文件访问';
            }
        } catch (error) {
            info['错误'] = error instanceof Error ? error.message : String(error);
        }

        return info;
    }

    /**
     * 获取Canvas文件数据
     */
    private async getCanvasFileData(): Promise<any> {
        try {
            const view = this.leaf.view;

            // 使用类型检查而不是强制转换
            if (view && 'file' in view) {
                const file = (view as any).file;

                if (!file) return null;

                const content = await this.leaf.view.app.vault.read(file);
                return JSON.parse(content);
            }

            return null;
        } catch (error) {
            DebugManager.error('Error loading canvas file data:', error);
            return null;
        }
    }

    /**
     * 测试聚焦功能
     */
    async testFocusCapabilities(nodeId: string): Promise<string[]> {
        const results: string[] = [];
        
        if (!this.canvas) {
            results.push('❌ Canvas API不可用');
            return results;
        }

        const node = await this.analyzeSpecificNode(nodeId);
        if (!node) {
            results.push('❌ 节点未找到');
            return results;
        }

        results.push('✅ 节点已找到');

        // 测试各种聚焦方法
        const tests = [
            {
                name: 'zoomToBbox',
                test: () => {
                    if (this.canvas.zoomToBbox) {
                        const bbox = {
                            minX: node.x - 100,
                            minY: node.y - 100,
                            maxX: node.x + node.width + 100,
                            maxY: node.y + node.height + 100
                        };
                        this.canvas.zoomToBbox(bbox);
                        return true;
                    }
                    return false;
                }
            },
            {
                name: 'panTo',
                test: () => {
                    if (this.canvas.panTo) {
                        const centerX = node.x + node.width / 2;
                        const centerY = node.y + node.height / 2;
                        this.canvas.panTo(centerX, centerY);
                        return true;
                    }
                    return false;
                }
            },
            {
                name: 'zoomToSelection',
                test: () => {
                    if (this.canvas.zoomToSelection && this.canvas.addToSelection) {
                        if (this.canvas.deselectAll) this.canvas.deselectAll();
                        this.canvas.addToSelection(node);
                        this.canvas.zoomToSelection();
                        return true;
                    }
                    return false;
                }
            }
        ];

        for (const test of tests) {
            try {
                const success = test.test();
                results.push(success ? `✅ ${test.name} 成功` : `❌ ${test.name} 不可用`);
                if (success) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待动画完成
                }
            } catch (error) {
                results.push(`❌ ${test.name} 失败: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        return results;
    }
}

/**
 * 全局调试函数 - 可在控制台调用
 */
(window as any).debugCanvas = async (nodeId?: string) => {
    const activeLeaf = (window as any).app?.workspace?.getMostRecentLeaf();
    if (!activeLeaf || activeLeaf.view.getViewType() !== 'canvas') {
        DebugManager.log('请先打开一个Canvas文件');
        return;
    }

    const canvasDebugger = new CanvasDebugger(activeLeaf);
    const report = await canvasDebugger.generateDiagnosticReport(nodeId);
    DebugManager.log(report);

    if (nodeId) {
        DebugManager.log('\n=== 聚焦测试 ===');
        const testResults = await canvasDebugger.testFocusCapabilities(nodeId);
        testResults.forEach(result => DebugManager.log(result));
    }
};
