/**
 * Canvas颜色工具类 - 官方Obsidian Canvas颜色系统映射
 * 确保与官方Canvas卡片样式完全一致
 */

// 官方Canvas颜色编号到CSS变量的映射
export const CANVAS_COLOR_MAP = {
    '1': 'red',
    '2': 'orange', 
    '3': 'yellow',
    '4': 'green',
    '5': 'cyan',
    '6': 'blue',
    '7': 'purple'
} as const;

// 颜色样式接口
export interface ColorStyles {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderWidth: string;
}

/**
 * Canvas颜色工具类
 */
export class ColorUtils {
    
    /**
     * 检测当前主题是否为深色主题
     */
    static isDarkTheme(): boolean {
        return document.body.classList.contains('theme-dark');
    }

    /**
     * 获取官方Canvas颜色样式
     * 使用官方CSS变量确保与Canvas原生卡片完全一致
     */
    static getCanvasColorStyles(colorNumber: string): ColorStyles {
        const colorName = CANVAS_COLOR_MAP[colorNumber as keyof typeof CANVAS_COLOR_MAP];
        
        if (!colorName) {
            // 默认样式（无颜色）
            return {
                backgroundColor: 'var(--background-primary)',
                textColor: 'var(--text-normal)',
                borderColor: 'var(--background-modifier-border)',
                borderWidth: '1px'
            };
        }

        // 使用官方Canvas颜色变量
        return {
            backgroundColor: 'var(--background-primary)',
            textColor: 'var(--text-normal)',
            borderColor: `var(--color-${colorName})`,
            borderWidth: '2px'
        };
    }

    /**
     * 标准化颜色值
     * 将各种颜色格式统一为Canvas颜色编号
     */
    static normalizeCanvasColor(color: string | undefined): string | null {
        if (!color) return null;

        // 如果已经是标准编号格式，直接返回
        if (/^[1-7]$/.test(color)) {
            return color;
        }

        // 处理十六进制颜色到编号的映射
        const hexToNumberMap: Record<string, string> = {
            '#ff6b6b': '1', // red
            '#ffa726': '2', // orange  
            '#ffeb3b': '3', // yellow
            '#66bb6a': '4', // green
            '#26c6da': '5', // cyan
            '#42a5f5': '6', // blue
            '#ab47bc': '7'  // purple
        };

        const normalizedHex = color.toLowerCase();
        return hexToNumberMap[normalizedHex] || null;
    }

    /**
     * 应用Canvas颜色样式到元素
     */
    static applyCanvasColorToElement(element: HTMLElement, colorNumber: string | null): void {
        if (!colorNumber) {
            // 清除颜色样式，使用默认样式
            element.style.borderColor = '';
            element.style.borderWidth = '';
            element.dataset.canvasColor = '';
            return;
        }

        const styles = this.getCanvasColorStyles(colorNumber);
        
        // 应用边框颜色和宽度（Canvas官方样式）
        element.style.borderColor = styles.borderColor;
        element.style.borderWidth = styles.borderWidth;
        
        // 设置数据属性用于CSS选择器
        element.dataset.canvasColor = colorNumber;
    }

    /**
     * 获取颜色的显示名称（用于UI显示）
     */
    static getColorDisplayName(colorNumber: string): string {
        const colorName = CANVAS_COLOR_MAP[colorNumber as keyof typeof CANVAS_COLOR_MAP];
        
        const displayNames: Record<string, string> = {
            'red': '红色',
            'orange': '橙色',
            'yellow': '黄色', 
            'green': '绿色',
            'cyan': '青色',
            'blue': '蓝色',
            'purple': '紫色'
        };

        return displayNames[colorName] || '默认';
    }

    /**
     * 验证颜色编号是否有效
     */
    static isValidCanvasColor(colorNumber: string): boolean {
        return colorNumber in CANVAS_COLOR_MAP;
    }

    /**
     * 获取所有可用的Canvas颜色
     */
    static getAllCanvasColors(): Array<{number: string, name: string, displayName: string}> {
        return Object.entries(CANVAS_COLOR_MAP).map(([number, name]) => ({
            number,
            name,
            displayName: this.getColorDisplayName(number)
        }));
    }
}
