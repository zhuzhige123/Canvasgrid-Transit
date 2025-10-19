import { setIcon } from 'obsidian';

/**
 * 安全的DOM操作工具类
 * 替代innerHTML/outerHTML等不安全的API，符合Obsidian安全标准
 */
export class SafeDOMUtils {
    /**
     * 安全地设置元素的文本内容
     */
    static setTextContent(element: HTMLElement, content: string): void {
        element.textContent = content;
    }

    /**
     * 安全地设置HTML内容，仅允许特定的安全标签
     */
    static setSafeHTML(element: HTMLElement, content: string, allowedTags: string[] = ['strong', 'em', 'code', 'br']): void {
        // 清空元素
        element.empty();
        
        // 如果内容不包含HTML标签，直接设置文本
        if (!content.includes('<')) {
            element.textContent = content;
            return;
        }
        
        // 解析并清理HTML内容
        const cleanContent = this.sanitizeHTML(content, allowedTags);
        this.appendSafeHTML(element, cleanContent);
    }

    /**
     * 创建安全的SVG图标元素
     */
    static createSVGIcon(iconName: string, size: number = 16): HTMLElement {
        const container = document.createElement('span');
        container.className = 'svg-icon';
        
        // 使用Obsidian的setIcon方法，这是推荐的安全方式
        try {
            setIcon(container, iconName);
        } catch (error) {
            // 如果图标不存在，使用默认图标
            container.textContent = '📄';
        }
        
        return container;
    }

    /**
     * 创建带有图标的元素
     */
    static createIconElement(iconName: string, text?: string, className?: string): HTMLElement {
        const container = document.createElement('span');
        if (className) {
            container.className = className;
        }
        
        // 添加图标
        const iconEl = this.createSVGIcon(iconName);
        container.appendChild(iconEl);
        
        // 添加文本
        if (text) {
            const textEl = document.createElement('span');
            textEl.textContent = text;
            container.appendChild(textEl);
        }
        
        return container;
    }

    /**
     * 安全地添加CSS类
     */
    static addClasses(element: HTMLElement, ...classNames: string[]): void {
        classNames.forEach(className => {
            if (className && typeof className === 'string') {
                element.addClass(className);
            }
        });
    }

    /**
     * 安全地移除CSS类
     */
    static removeClasses(element: HTMLElement, ...classNames: string[]): void {
        classNames.forEach(className => {
            if (className && typeof className === 'string') {
                element.removeClass(className);
            }
        });
    }

    /**
     * 安全地切换CSS类
     */
    static toggleClass(element: HTMLElement, className: string, force?: boolean): void {
        if (className && typeof className === 'string') {
            if (force !== undefined) {
                element.toggleClass(className, force);
            } else {
                // Obsidian的toggleClass需要明确的boolean值
                const hasClass = element.hasClass(className);
                element.toggleClass(className, !hasClass);
            }
        }
    }

    /**
     * 创建安全的链接元素
     */
    static createSafeLink(href: string, text: string, target?: string): HTMLAnchorElement {
        const link = document.createElement('a');
        
        // 验证URL安全性
        if (this.isValidURL(href)) {
            link.href = href;
        } else {
            // 不安全的URL，转换为文本
            link.textContent = `[Invalid URL: ${text}]`;
            return link;
        }
        
        link.textContent = text;
        
        if (target) {
            link.target = target;
            // 安全性：为外部链接添加rel属性
            if (target === '_blank') {
                link.rel = 'noopener noreferrer';
            }
        }
        
        return link;
    }

    /**
     * 验证URL是否安全
     */
    private static isValidURL(url: string): boolean {
        try {
            const urlObj = new URL(url);
            // 只允许安全的协议
            const allowedProtocols = ['http:', 'https:', 'obsidian:', 'file:'];
            return allowedProtocols.includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    /**
     * 清理HTML内容，移除不安全的标签和属性
     */
    private static sanitizeHTML(html: string, allowedTags: string[]): string {
        // 创建临时DOM元素进行解析
        const tempDiv = document.createElement('div');
        tempDiv.textContent = html; // 先作为文本设置，避免执行脚本
        
        // 然后解析为DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(tempDiv.textContent || '', 'text/html');
        
        // 递归清理元素
        this.cleanElement(doc.body, allowedTags);
        
        return doc.body.innerHTML;
    }

    /**
     * 递归清理DOM元素
     */
    private static cleanElement(element: Element, allowedTags: string[]): void {
        const children = Array.from(element.children);
        
        children.forEach(child => {
            const tagName = child.tagName.toLowerCase();
            
            if (!allowedTags.includes(tagName)) {
                // 不允许的标签，替换为文本内容
                const textNode = document.createTextNode(child.textContent || '');
                child.parentNode?.replaceChild(textNode, child);
            } else {
                // 允许的标签，清理属性并递归处理子元素
                this.cleanAttributes(child);
                this.cleanElement(child, allowedTags);
            }
        });
    }

    /**
     * 清理元素属性，只保留安全的属性
     */
    private static cleanAttributes(element: Element): void {
        const allowedAttributes = ['class', 'id', 'title', 'alt'];
        const attributes = Array.from(element.attributes);
        
        attributes.forEach(attr => {
            if (!allowedAttributes.includes(attr.name.toLowerCase())) {
                element.removeAttribute(attr.name);
            }
        });
    }

    /**
     * 安全地添加HTML内容到元素
     */
    private static appendSafeHTML(element: HTMLElement, html: string): void {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        Array.from(doc.body.childNodes).forEach(node => {
            element.appendChild(node.cloneNode(true));
        });
    }

    /**
     * 创建安全的代码块元素
     */
    static createCodeBlock(code: string, language?: string): HTMLElement {
        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        
        if (language) {
            codeEl.className = `language-${language}`;
        }
        
        codeEl.textContent = code;
        pre.appendChild(codeEl);
        
        return pre;
    }

    /**
     * 创建安全的列表元素
     */
    static createList(items: string[], ordered: boolean = false): HTMLElement {
        const list = document.createElement(ordered ? 'ol' : 'ul');
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
        });
        
        return list;
    }

    /**
     * 安全地设置元素属性
     */
    static setSafeAttribute(element: HTMLElement, name: string, value: string): void {
        const allowedAttributes = [
            'class', 'id', 'title', 'alt', 'data-*', 'aria-*', 'role',
            'href', 'target', 'rel', 'type', 'value', 'placeholder'
        ];
        
        const isAllowed = allowedAttributes.some(allowed => {
            if (allowed.endsWith('*')) {
                return name.startsWith(allowed.slice(0, -1));
            }
            return name === allowed;
        });
        
        if (isAllowed) {
            element.setAttribute(name, value);
        }
    }

    /**
     * 创建安全的表格元素
     */
    static createTable(headers: string[], rows: string[][]): HTMLTableElement {
        const table = document.createElement('table');
        
        // 创建表头
        if (headers.length > 0) {
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
        }
        
        // 创建表体
        if (rows.length > 0) {
            const tbody = document.createElement('tbody');
            
            rows.forEach(row => {
                const tr = document.createElement('tr');
                
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
            
            table.appendChild(tbody);
        }
        
        return table;
    }
}
