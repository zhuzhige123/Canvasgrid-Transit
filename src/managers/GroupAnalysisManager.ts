import { App } from 'obsidian';
import { CanvasNode } from '../types/CanvasTypes';
import { 
    GroupAnalysisResult, 
    GroupInfo, 
    GroupBounds, 
    GroupAnalysisStats,
    NodeRelation,
    GroupMemberFilterOptions
} from '../types/GroupTypes';

/**
 * 分组分析管理器
 * 负责分析Canvas中的分组结构，识别分组内的成员节点
 */
export class GroupAnalysisManager {
    private app: App;
    
    constructor(app: App) {
        this.app = app;
    }

    /**
     * 分析Canvas中的分组结构
     */
    analyzeGroupStructure(canvasNodes: CanvasNode[]): GroupAnalysisResult {
        console.log(`GroupAnalysis: 开始分析分组结构，总节点数: ${canvasNodes.length}`);
        
        // 分离分组节点和非分组节点
        const groupNodes = canvasNodes.filter(node => node.type === 'group');
        const nonGroupNodes = canvasNodes.filter(node => node.type !== 'group');
        
        console.log(`GroupAnalysis: 分组节点数: ${groupNodes.length}, 非分组节点数: ${nonGroupNodes.length}`);
        
        // 分析每个分组
        const groups: GroupInfo[] = [];
        const allMemberNodes: CanvasNode[] = [];
        
        for (const groupNode of groupNodes) {
            const groupInfo = this.analyzeGroup(groupNode, nonGroupNodes, groupNodes);
            groups.push(groupInfo);
            allMemberNodes.push(...groupInfo.memberNodes);
        }
        
        // 找出孤立节点（不在任何分组内的节点）
        const memberNodeIds = new Set(allMemberNodes.map(node => node.id));
        const orphanNodes = nonGroupNodes.filter(node => !memberNodeIds.has(node.id));
        
        // 生成统计信息
        const stats = this.generateStats(groups, allMemberNodes, orphanNodes);
        
        console.log(`GroupAnalysis: 分析完成 - 分组: ${groups.length}, 成员节点: ${allMemberNodes.length}, 孤立节点: ${orphanNodes.length}`);
        
        return {
            groups,
            memberNodes: allMemberNodes,
            orphanNodes,
            stats
        };
    }

    /**
     * 分析单个分组
     */
    private analyzeGroup(groupNode: CanvasNode, candidateNodes: CanvasNode[], allGroups: CanvasNode[]): GroupInfo {
        const bounds = this.calculateGroupBounds(groupNode);
        const memberNodes: CanvasNode[] = [];
        
        // 检查每个候选节点是否在分组内
        for (const node of candidateNodes) {
            if (this.isNodeInsideGroup(node, groupNode)) {
                memberNodes.push(node);
            }
        }
        
        // 检查嵌套分组
        let level = 0;
        let parentGroupId: string | undefined;
        
        for (const otherGroup of allGroups) {
            if (otherGroup.id !== groupNode.id && this.isNodeInsideGroup(groupNode, otherGroup)) {
                level++;
                parentGroupId = otherGroup.id;
            }
        }
        
        console.log(`GroupAnalysis: 分组 ${groupNode.id} 包含 ${memberNodes.length} 个成员节点，层级: ${level}`);
        
        return {
            groupNode,
            memberNodes,
            bounds,
            level,
            parentGroupId
        };
    }

    /**
     * 计算分组边界
     */
    private calculateGroupBounds(groupNode: CanvasNode): GroupBounds {
        const x = groupNode.x;
        const y = groupNode.y;
        const width = groupNode.width;
        const height = groupNode.height;
        
        return {
            x,
            y,
            width,
            height,
            right: x + width,
            bottom: y + height
        };
    }

    /**
     * 检查节点是否在分组内
     */
    isNodeInsideGroup(node: CanvasNode, group: CanvasNode): boolean {
        const groupBounds = this.calculateGroupBounds(group);
        const nodeBounds = {
            x: node.x,
            y: node.y,
            right: node.x + node.width,
            bottom: node.y + node.height
        };
        
        // 检查节点是否完全在分组边界内
        const isInside = nodeBounds.x >= groupBounds.x &&
                        nodeBounds.y >= groupBounds.y &&
                        nodeBounds.right <= groupBounds.right &&
                        nodeBounds.bottom <= groupBounds.bottom;
        
        return isInside;
    }

    /**
     * 获取分组内的成员节点
     */
    getGroupMemberNodes(canvasNodes: CanvasNode[], groupId: string): CanvasNode[] {
        const groupNode = canvasNodes.find(node => node.id === groupId && node.type === 'group');
        if (!groupNode) {
            return [];
        }
        
        const nonGroupNodes = canvasNodes.filter(node => node.type !== 'group');
        return nonGroupNodes.filter(node => this.isNodeInsideGroup(node, groupNode));
    }

    /**
     * 获取所有分组内的成员节点
     */
    getAllGroupMemberNodes(canvasNodes: CanvasNode[], options?: GroupMemberFilterOptions): CanvasNode[] {
        const analysisResult = this.analyzeGroupStructure(canvasNodes);
        let memberNodes = analysisResult.memberNodes;
        
        // 应用筛选选项
        if (options) {
            memberNodes = this.applyMemberFilter(memberNodes, options);
        }
        
        return memberNodes;
    }

    /**
     * 应用成员节点筛选
     */
    private applyMemberFilter(nodes: CanvasNode[], options: GroupMemberFilterOptions): CanvasNode[] {
        let filteredNodes = nodes;
        
        // 颜色筛选
        if (options.includeColors && options.includeColors.length > 0) {
            filteredNodes = filteredNodes.filter(node => 
                node.color && options.includeColors!.includes(node.color)
            );
        }
        
        if (options.excludeColors && options.excludeColors.length > 0) {
            filteredNodes = filteredNodes.filter(node => 
                !node.color || !options.excludeColors!.includes(node.color)
            );
        }
        
        // 类型筛选
        if (options.includeTypes && options.includeTypes.length > 0) {
            filteredNodes = filteredNodes.filter(node => 
                options.includeTypes!.includes(node.type)
            );
        }
        
        if (options.excludeTypes && options.excludeTypes.length > 0) {
            filteredNodes = filteredNodes.filter(node => 
                !options.excludeTypes!.includes(node.type)
            );
        }
        
        // 最小面积筛选
        if (options.minNodeArea && options.minNodeArea > 0) {
            filteredNodes = filteredNodes.filter(node => 
                (node.width * node.height) >= options.minNodeArea!
            );
        }
        
        return filteredNodes;
    }

    /**
     * 生成统计信息
     */
    private generateStats(groups: GroupInfo[], memberNodes: CanvasNode[], orphanNodes: CanvasNode[]): GroupAnalysisStats {
        const nestedGroups = groups.filter(group => group.level > 0);
        const maxNestingLevel = groups.length > 0 ? Math.max(...groups.map(group => group.level)) : 0;
        
        return {
            totalGroups: groups.length,
            totalMemberNodes: memberNodes.length,
            orphanNodesCount: orphanNodes.length,
            nestedGroupsCount: nestedGroups.length,
            maxNestingLevel
        };
    }

    /**
     * 获取节点间的位置关系
     */
    getNodeRelation(node1: CanvasNode, node2: CanvasNode): NodeRelation {
        const bounds1 = {
            x: node1.x,
            y: node1.y,
            right: node1.x + node1.width,
            bottom: node1.y + node1.height
        };
        
        const bounds2 = {
            x: node2.x,
            y: node2.y,
            right: node2.x + node2.width,
            bottom: node2.y + node2.height
        };
        
        // 检查是否完全分离
        if (bounds1.right < bounds2.x || bounds2.right < bounds1.x ||
            bounds1.bottom < bounds2.y || bounds2.bottom < bounds1.y) {
            return NodeRelation.SEPARATE;
        }
        
        // 检查是否完全包含
        if (bounds1.x >= bounds2.x && bounds1.y >= bounds2.y &&
            bounds1.right <= bounds2.right && bounds1.bottom <= bounds2.bottom) {
            return NodeRelation.CONTAINED;
        }
        
        if (bounds2.x >= bounds1.x && bounds2.y >= bounds1.y &&
            bounds2.right <= bounds1.right && bounds2.bottom <= bounds1.bottom) {
            return NodeRelation.CONTAINED;
        }
        
        // 检查是否仅边界接触
        if ((bounds1.right === bounds2.x || bounds2.right === bounds1.x ||
             bounds1.bottom === bounds2.y || bounds2.bottom === bounds1.y) &&
            !(bounds1.right < bounds2.x || bounds2.right < bounds1.x ||
              bounds1.bottom < bounds2.y || bounds2.bottom < bounds1.y)) {
            return NodeRelation.TOUCHING;
        }
        
        // 其他情况为重叠
        return NodeRelation.OVERLAPPING;
    }
}
