import { App, TFile } from 'obsidian';
import { CanvasNode } from '../types/CanvasTypes';
import { 
    LinkOptions, 
    LinkValidationResult, 
    MultiLevelLinkConfig,
    LinkGenerationContext,
    LinkTemplate,
    LinkAnalysisResult,
    PREDEFINED_LINK_STYLES,
    LINK_ICONS
} from '../types/LinkTypes';

/**
 * Obsidian链接管理器
 * 负责生成和管理指向Obsidian的各种链接
 */
export class ObsidianLinkManager {
    private app: App;
    private linkTemplates: Map<string, LinkTemplate> = new Map();
    
    constructor(app: App) {
        this.app = app;
        this.initializeLinkTemplates();
    }

    /**
     * 生成HTML格式的Obsidian链接
     */
    generateHtmlLink(canvasFile: TFile, node: CanvasNode, options?: LinkOptions): string {
        const defaultOptions: LinkOptions = {
            style: 'enhanced',
            includeMetadata: true,
            multiLevel: false,
            includeCoordinates: true,
            includeTimestamp: false,
            target: '_blank',
            cssClass: 'obsidian-link'
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const context = this.createLinkContext(canvasFile, node);
            
            if (finalOptions.multiLevel) {
                return this.generateMultiLevelLinks(context, finalOptions);
            } else {
                return this.generateSingleLink(context, finalOptions);
            }
        } catch (error) {
            console.error('ObsidianLink: 生成链接时发生错误:', error);
            return this.generateFallbackLink(canvasFile, node);
        }
    }

    /**
     * 生成多层次链接
     */
    generateMultiLevelLinks(context: LinkGenerationContext, options: LinkOptions): string {
        const links: string[] = [];
        
        // 节点直接链接
        const nodeLink = this.generateNodeLink(context, options);
        links.push(nodeLink);
        
        // Canvas文件链接
        const fileLink = this.generateFileLink(context, options);
        links.push(fileLink);
        
        // 网格视图链接
        const gridLink = this.generateGridViewLink(context, options);
        links.push(gridLink);
        
        return this.wrapMultiLevelLinks(links, options);
    }

    /**
     * 生成单个链接
     */
    private generateSingleLink(context: LinkGenerationContext, options: LinkOptions): string {
        const url = this.buildObsidianUrl(context, 'node');
        const text = this.generateLinkText(context, options);
        const metadata = options.includeMetadata ? this.generateMetadata(context, options) : '';
        
        return this.applyLinkTemplate(url, text, metadata, options);
    }

    /**
     * 生成节点链接
     */
    private generateNodeLink(context: LinkGenerationContext, options: LinkOptions): string {
        const url = this.buildObsidianUrl(context, 'node');
        const text = `${LINK_ICONS.node} 在Obsidian中查看`;
        const metadata = `节点ID: ${context.nodeId.substring(0, 8)}... (坐标: ${context.nodeCoordinates.x}, ${context.nodeCoordinates.y})`;

        return this.applyLinkTemplate(url, text, metadata, options);
    }

    /**
     * 生成文件链接
     */
    private generateFileLink(context: LinkGenerationContext, options: LinkOptions): string {
        const url = this.buildObsidianUrl(context, 'file');
        const text = `${LINK_ICONS.canvas} 打开Canvas文件`;
        const metadata = `文件: ${context.canvasFilePath}`;
        
        return this.applyLinkTemplate(url, text, metadata, options);
    }

    /**
     * 生成网格视图链接
     */
    private generateGridViewLink(context: LinkGenerationContext, options: LinkOptions): string {
        const url = this.buildObsidianUrl(context, 'grid');
        const text = `${LINK_ICONS.grid} 网格视图`;
        const metadata = `坐标: (${context.nodeCoordinates.x}, ${context.nodeCoordinates.y})`;
        
        return this.applyLinkTemplate(url, text, metadata, options);
    }

    /**
     * 构建Obsidian URL
     */
    private buildObsidianUrl(context: LinkGenerationContext, type: 'node' | 'file' | 'grid'): string {
        const encodedVault = encodeURIComponent(context.vaultName);
        const encodedPath = encodeURIComponent(context.canvasFilePath);

        // 使用标准的Obsidian链接格式
        let baseUrl = `obsidian://open?vault=${encodedVault}&file=${encodedPath}`;

        switch (type) {
            case 'node':
                // 添加节点坐标信息作为注释，虽然Obsidian不会自动聚焦，但至少能打开文件
                // 用户可以手动查找节点
                baseUrl += `#node-${encodeURIComponent(context.nodeId)}`;
                break;
            case 'file':
                // 仅打开Canvas文件
                break;
            case 'grid':
                // 打开文件，添加网格视图标识
                baseUrl += `#grid-view`;
                break;
        }

        return baseUrl;
    }

    /**
     * 生成链接文本
     */
    private generateLinkText(context: LinkGenerationContext, options: LinkOptions): string {
        if (options.customText) {
            return options.customText;
        }
        
        const nodeTypeText = this.getNodeTypeText(context.nodeType);
        const colorText = context.nodeColor ? this.getColorName(context.nodeColor) : '';
        const locationText = options.includeCoordinates ? 
            ` (${context.nodeCoordinates.x}, ${context.nodeCoordinates.y})` : '';
        
        return `${LINK_ICONS.location} 在Obsidian中查看${nodeTypeText}${colorText}${locationText} (手动定位到节点)`;
    }

    /**
     * 生成元数据
     */
    private generateMetadata(context: LinkGenerationContext, options: LinkOptions): string {
        const metadata: string[] = [];
        
        metadata.push(`文件: ${context.canvasFilePath}`);
        metadata.push(`节点: ${context.nodeId.substring(0, 12)}...`);
        
        if (options.includeCoordinates) {
            metadata.push(`坐标: (${context.nodeCoordinates.x}, ${context.nodeCoordinates.y})`);
        }
        
        if (options.includeTimestamp) {
            const timestamp = new Date(context.timestamp).toLocaleString();
            metadata.push(`生成时间: ${timestamp}`);
        }
        
        if (context.pluginVersion) {
            metadata.push(`插件版本: ${context.pluginVersion}`);
        }
        
        return metadata.join(' | ');
    }

    /**
     * 应用链接模板
     */
    private applyLinkTemplate(url: string, text: string, metadata: string, options: LinkOptions): string {
        const style = PREDEFINED_LINK_STYLES[options.style];
        if (!style) {
            return this.generateSimpleLink(url, text, options);
        }
        
        let template = style.template;
        
        // 替换模板变量
        let processedTemplate = template.replace(/{url}/g, url);
        processedTemplate = processedTemplate.replace(/{text}/g, text);
        processedTemplate = processedTemplate.replace(/{metadata}/g, metadata);
        processedTemplate = processedTemplate.replace(/{icon}/g, LINK_ICONS.location);

        // 添加自定义属性
        if (options.target) {
            processedTemplate = processedTemplate.replace(/<a /g, `<a target="${options.target}" `);
        }

        if (options.cssClass) {
            processedTemplate = processedTemplate.replace(/<a /g, `<a class="${options.cssClass}" `);
        }

        if (options.customStyle) {
            processedTemplate = processedTemplate.replace(/style="([^"]*)"/, `style="$1; ${options.customStyle}"`);
        }
        
        return processedTemplate;
    }

    /**
     * 生成简单链接
     */
    private generateSimpleLink(url: string, text: string, options: LinkOptions): string {
        const attributes: string[] = [`href="${url}"`];
        
        if (options.target) {
            attributes.push(`target="${options.target}"`);
        }
        
        if (options.cssClass) {
            attributes.push(`class="${options.cssClass}"`);
        }
        
        const style = 'color: #0066cc; text-decoration: none;';
        attributes.push(`style="${style}${options.customStyle ? '; ' + options.customStyle : ''}"`);
        
        return `<a ${attributes.join(' ')}>${text}</a>`;
    }

    /**
     * 包装多层次链接
     */
    private wrapMultiLevelLinks(links: string[], options: LinkOptions): string {
        const containerStyle = `
            margin: 10px 0;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #6f42c1;
        `;
        
        const linksHtml = links.join('<br style="margin: 4px 0;">');
        
        return `<div style="${containerStyle}">${linksHtml}</div>`;
    }

    /**
     * 创建链接上下文
     */
    private createLinkContext(canvasFile: TFile, node: CanvasNode): LinkGenerationContext {
        const vaultName = this.getVaultName();
        
        return {
            vaultName,
            canvasFilePath: canvasFile.path,
            nodeId: node.id,
            nodeCoordinates: {
                x: node.x,
                y: node.y
            },
            nodeType: node.type,
            nodeColor: node.color,
            timestamp: Date.now(),
            pluginVersion: this.getPluginVersion()
        };
    }

    /**
     * 获取Vault名称
     */
    private getVaultName(): string {
        // 尝试多种方式获取vault名称
        try {
            // 方法1: 从adapter获取
            const adapterName = (this.app.vault as any).adapter?.name;
            if (adapterName && adapterName !== 'vault') {
                console.log(`ObsidianLink: 从adapter获取vault名称: ${adapterName}`);
                return adapterName;
            }

            // 方法2: 从vault配置获取
            const vaultConfig = (this.app.vault as any).config;
            if (vaultConfig?.name) {
                console.log(`ObsidianLink: 从config获取vault名称: ${vaultConfig.name}`);
                return vaultConfig.name;
            }

            // 方法3: 从app配置获取
            const appVault = (this.app as any).vault;
            if (appVault?.name) {
                console.log(`ObsidianLink: 从app.vault获取vault名称: ${appVault.name}`);
                return appVault.name;
            }

            // 方法4: 从路径推断
            const basePath = (this.app.vault as any).adapter?.basePath;
            if (basePath) {
                const vaultName = basePath.split(/[/\\]/).pop();
                if (vaultName && vaultName !== '.') {
                    console.log(`ObsidianLink: 从路径推断vault名称: ${vaultName}`);
                    return vaultName;
                }
            }

            // 方法5: 使用默认名称
            console.warn('ObsidianLink: 无法获取vault名称，使用默认值');
            return 'vault';

        } catch (error) {
            console.error('ObsidianLink: 获取vault名称时发生错误:', error);
            return 'vault';
        }
    }

    /**
     * 获取插件版本
     */
    private getPluginVersion(): string {
        // 从manifest.json获取版本信息
        return '1.3.0'; // 临时硬编码，后续从配置获取
    }

    /**
     * 获取节点类型文本
     */
    private getNodeTypeText(nodeType: string): string {
        const typeMap: Record<string, string> = {
            'text': '文本卡片',
            'file': '文件卡片',
            'link': '链接卡片',
            'group': '分组'
        };
        return typeMap[nodeType] || '卡片';
    }

    /**
     * 获取颜色名称
     */
    private getColorName(color: string): string {
        const colorMap: Record<string, string> = {
            '1': '红色',
            '2': '橙色',
            '3': '黄色',
            '4': '绿色',
            '5': '青色',
            '6': '蓝色'
        };
        return colorMap[color] ? ` (${colorMap[color]})` : '';
    }

    /**
     * 生成后备链接
     */
    private generateFallbackLink(canvasFile: TFile, node: CanvasNode): string {
        const vaultName = this.getVaultName();
        const encodedVault = encodeURIComponent(vaultName);
        const encodedPath = encodeURIComponent(canvasFile.path);
        const url = `obsidian://open?vault=${encodedVault}&file=${encodedPath}`;
        
        return `<a href="${url}" target="_blank" style="color: #0066cc; text-decoration: none;">${LINK_ICONS.location} 在Obsidian中查看</a>`;
    }

    /**
     * 初始化链接模板
     */
    private initializeLinkTemplates(): void {
        // 初始化预定义模板
        for (const [key, style] of Object.entries(PREDEFINED_LINK_STYLES)) {
            const template: LinkTemplate = {
                name: style.name,
                description: `${style.name}链接模板`,
                htmlTemplate: style.template,
                supportedVariables: ['url', 'text', 'metadata', 'icon'],
                defaultStyle: '',
                builtin: true
            };
            this.linkTemplates.set(key, template);
        }
    }

    /**
     * 验证链接有效性
     */
    async validateLink(link: string): Promise<LinkValidationResult> {
        try {
            const url = new URL(link);
            
            return {
                valid: true,
                protocol: url.protocol,
                accessible: true, // 简化实现，实际应该检查Obsidian是否安装
                warnings: []
            };
        } catch (error) {
            return {
                valid: false,
                protocol: '',
                accessible: false,
                error: `无效的链接格式: ${error instanceof Error ? error.message : String(error)}`,
                warnings: []
            };
        }
    }

    /**
     * 生成跨平台兼容链接
     */
    generateCrossPlatformLink(canvasFile: TFile, node: CanvasNode): string {
        // 基础实现，返回标准Obsidian链接
        return this.generateHtmlLink(canvasFile, node, { 
            style: 'enhanced',
            includeMetadata: true,
            multiLevel: false,
            includeCoordinates: true,
            includeTimestamp: false
        });
    }

    /**
     * 生成智能链接文本
     */
    generateSmartLinkText(node: CanvasNode, canvasFile: TFile): string {
        const nodeType = this.getNodeTypeText(node.type);
        const fileName = canvasFile.basename;
        const colorText = node.color ? this.getColorName(node.color) : '';
        
        return `${LINK_ICONS.location} 查看${fileName}中的${nodeType}${colorText}`;
    }
}
