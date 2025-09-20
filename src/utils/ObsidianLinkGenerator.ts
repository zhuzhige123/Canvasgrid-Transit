import { TFile } from 'obsidian';
import { CanvasNode } from '../types/CanvasTypes';

/**
 * Obsidian深链生成器
 * 负责生成可点击的obsidian://协议链接
 */
export class ObsidianLinkGenerator {
	
	/**
	 * 生成Canvas节点的深链URL
	 */
	static generateCanvasNodeLink(canvasFile: TFile, node: CanvasNode): string {
		try {
			const params = new URLSearchParams({
				file: canvasFile.path,
				nodeId: node.id,
				x: node.x.toString(),
				y: node.y.toString()
			});

			const deepLink = `obsidian://canvasgrid-transit/open-canvas?${params.toString()}`;
			console.log('ObsidianLink: 生成深链:', deepLink);
			
			return deepLink;
		} catch (error) {
			console.error('ObsidianLink: 生成深链失败:', error);
			// 降级方案：返回普通文件链接
			return `obsidian://open?file=${encodeURIComponent(canvasFile.path)}`;
		}
	}

	/**
	 * 生成普通文件链接（降级方案）
	 */
	static generateFileLink(file: TFile): string {
		return `obsidian://open?file=${encodeURIComponent(file.path)}`;
	}

	/**
	 * 解析深链参数
	 */
	static parseCanvasLink(url: string): {
		file?: string;
		nodeId?: string;
		x?: number;
		y?: number;
	} | null {
		try {
			const urlObj = new URL(url);
			
			if (urlObj.protocol !== 'obsidian:' || 
				urlObj.hostname !== 'canvasgrid-transit' || 
				urlObj.pathname !== '/open-canvas') {
				return null;
			}

			const params = urlObj.searchParams;
			const result: any = {};

			if (params.has('file')) {
				result.file = params.get('file');
			}
			if (params.has('nodeId')) {
				result.nodeId = params.get('nodeId');
			}
			if (params.has('x')) {
				const x = parseFloat(params.get('x')!);
				if (!isNaN(x)) result.x = x;
			}
			if (params.has('y')) {
				const y = parseFloat(params.get('y')!);
				if (!isNaN(y)) result.y = y;
			}

			return result;
		} catch (error) {
			console.error('ObsidianLink: 解析深链失败:', error);
			return null;
		}
	}

	/**
	 * 验证深链格式
	 */
	static isValidCanvasLink(url: string): boolean {
		const parsed = this.parseCanvasLink(url);
		return parsed !== null && parsed.file !== undefined;
	}

	/**
	 * 生成带显示文本的HTML链接
	 */
	static generateHtmlLink(canvasFile: TFile, node: CanvasNode, displayText?: string): string {
		const url = this.generateCanvasNodeLink(canvasFile, node);
		const text = displayText || `📍 定位到节点 ${node.id.substring(0, 8)}`;
		
		return `<a href="${url}" class="obsidian-canvas-link">${text}</a>`;
	}

	/**
	 * 生成Markdown格式链接
	 */
	static generateMarkdownLink(canvasFile: TFile, node: CanvasNode, displayText?: string): string {
		const url = this.generateCanvasNodeLink(canvasFile, node);
		const text = displayText || `📍 定位到节点 ${node.id.substring(0, 8)}`;
		
		return `[${text}](${url})`;
	}
}
