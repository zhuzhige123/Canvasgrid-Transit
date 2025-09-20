/**
 * 分组相关类型定义
 */

import { CanvasNode } from './CanvasTypes';

/**
 * 分组分析结果
 */
export interface GroupAnalysisResult {
    /** 所有分组信息 */
    groups: GroupInfo[];
    /** 分组内的成员节点 */
    memberNodes: CanvasNode[];
    /** 不在任何分组内的孤立节点 */
    orphanNodes: CanvasNode[];
    /** 分析统计信息 */
    stats: GroupAnalysisStats;
}

/**
 * 单个分组信息
 */
export interface GroupInfo {
    /** 分组节点本身 */
    groupNode: CanvasNode;
    /** 分组内的成员节点 */
    memberNodes: CanvasNode[];
    /** 分组边界信息 */
    bounds: GroupBounds;
    /** 分组层级（支持嵌套分组） */
    level: number;
    /** 父分组ID（如果是嵌套分组） */
    parentGroupId?: string;
}

/**
 * 分组边界信息
 */
export interface GroupBounds {
    /** 左上角X坐标 */
    x: number;
    /** 左上角Y坐标 */
    y: number;
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
    /** 右下角X坐标 */
    right: number;
    /** 右下角Y坐标 */
    bottom: number;
}

/**
 * 分组分析统计信息
 */
export interface GroupAnalysisStats {
    /** 总分组数 */
    totalGroups: number;
    /** 总成员节点数 */
    totalMemberNodes: number;
    /** 孤立节点数 */
    orphanNodesCount: number;
    /** 嵌套分组数 */
    nestedGroupsCount: number;
    /** 最大嵌套层级 */
    maxNestingLevel: number;
}

/**
 * 节点位置关系类型
 */
export enum NodeRelation {
    /** 完全包含 */
    CONTAINED = 'contained',
    /** 部分重叠 */
    OVERLAPPING = 'overlapping',
    /** 完全分离 */
    SEPARATE = 'separate',
    /** 边界接触 */
    TOUCHING = 'touching'
}

/**
 * 分组成员筛选选项
 */
export interface GroupMemberFilterOptions {
    /** 包含的颜色 */
    includeColors?: string[];
    /** 排除的颜色 */
    excludeColors?: string[];
    /** 包含的节点类型 */
    includeTypes?: string[];
    /** 排除的节点类型 */
    excludeTypes?: string[];
    /** 是否包含嵌套分组的成员 */
    includeNestedMembers?: boolean;
    /** 最小节点面积（过滤太小的节点） */
    minNodeArea?: number;
}
