import { App, TFile, WorkspaceLeaf, MarkdownView, Editor } from 'obsidian';
import { DebugManager } from '../utils/DebugManager';
import { TempFileManager } from './TempFileManager';

/**
 * 隐藏编辑器配置
 */
export interface HiddenEditorConfig {
    enableSyntaxHighlight: boolean;
    enableAutoComplete: boolean;
    enableVimMode: boolean;
    theme: 'auto' | 'light' | 'dark';
}

/**
 * 编辑器实例信息
 */
export interface EditorInstance {
    editor: Editor;
    markdownView: MarkdownView;
    leaf: WorkspaceLeaf;
    tempFile: TFile;
    container: HTMLElement;
    createdAt: number;
}

/**
 * 隐藏编辑器管理器
 * 负责创建和管理隐藏的Obsidian编辑器实例，避免在主工作区显示标签页
 */
export class HiddenEditorManager {
    private app: App;
    private tempFileManager: TempFileManager;
    private config: HiddenEditorConfig;
    private currentEditor: EditorInstance | null = null;
    private hiddenContainer: HTMLElement | null = null;

    constructor(app: App, config?: Partial<HiddenEditorConfig>) {
        this.app = app;
        this.tempFileManager = TempFileManager.getInstance(app);
        this.config = {
            enableSyntaxHighlight: true,
            enableAutoComplete: true,
            enableVimMode: false,
            theme: 'auto',
            ...config
        };

        this.initializeHiddenContainer();
        DebugManager.log('HiddenEditorManager initialized');
    }

    /**
     * 创建隐藏编辑器
     */
    async createHiddenEditor(content: string): Promise<HTMLElement> {
        try {
            // 清理现有编辑器
            if (this.currentEditor) {
                await this.cleanupCurrentEditor();
            }

            // 创建临时文件
            const tempFile = await this.tempFileManager.createTempFile(content);
            const leaf = this.tempFileManager.getCurrentLeaf();

            if (!leaf) {
                throw new Error('无法获取临时文件的leaf');
            }

            // 获取MarkdownView和Editor
            const markdownView = leaf.view as MarkdownView;
            if (!markdownView || !markdownView.editor) {
                throw new Error('无法获取MarkdownView或Editor实例');
            }

            const editor = markdownView.editor;

            // 创建编辑器容器
            const container = this.createEditorContainer();

            // 提取编辑器DOM元素
            await this.extractEditorElement(markdownView, container);

            // 设置编辑器样式和配置
            this.setupEditorStyles(container);
            this.configureEditor(editor);

            // 记录编辑器实例
            this.currentEditor = {
                editor,
                markdownView,
                leaf,
                tempFile,
                container,
                createdAt: Date.now()
            };

            DebugManager.log('Created hidden editor successfully');
            return container;

        } catch (error) {
            DebugManager.error('Failed to create hidden editor:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`隐藏编辑器创建失败: ${errorMessage}`);
        }
    }

    /**
     * 获取当前编辑器实例
     */
    getCurrentEditor(): Editor | null {
        return this.currentEditor?.editor || null;
    }

    /**
     * 获取编辑器内容
     */
    getEditorContent(): string {
        if (!this.currentEditor) {
            return '';
        }

        try {
            return this.currentEditor.editor.getValue();
        } catch (error) {
            DebugManager.error('Failed to get editor content:', error);
            return '';
        }
    }

    /**
     * 设置编辑器内容
     */
    setEditorContent(content: string): void {
        if (!this.currentEditor) {
            DebugManager.warn('No active editor to set content');
            return;
        }

        try {
            this.currentEditor.editor.setValue(content);
            DebugManager.log('Editor content updated');
        } catch (error) {
            DebugManager.error('Failed to set editor content:', error);
        }
    }

    /**
     * 聚焦编辑器
     */
    focusEditor(): void {
        if (!this.currentEditor) {
            return;
        }

        try {
            this.currentEditor.editor.focus();
            
            // 将光标移到文本末尾
            const lastLine = this.currentEditor.editor.lastLine();
            const lastLineLength = this.currentEditor.editor.getLine(lastLine).length;
            this.currentEditor.editor.setCursor({ line: lastLine, ch: lastLineLength });
            
            DebugManager.log('Editor focused');
        } catch (error) {
            DebugManager.error('Failed to focus editor:', error);
        }
    }

    /**
     * 添加编辑器事件监听器
     */
    addEditorEventListeners(
        onChange?: (content: string) => void,
        onSave?: (content: string) => void,
        onCancel?: () => void
    ): void {
        if (!this.currentEditor) {
            return;
        }

        const { editor, container } = this.currentEditor;

        // 内容变化监听
        if (onChange) {
            const changeHandler = () => {
                const content = editor.getValue();
                onChange(content);
            };
            this.app.workspace.on('editor-change', changeHandler);
            
            // 存储处理器以便清理
            (container as any).changeHandler = changeHandler;
        }

        // 键盘事件监听
        const keyHandler = (evt: KeyboardEvent) => {
            if (evt.key === 'Escape' && onCancel) {
                evt.preventDefault();
                onCancel();
            } else if (evt.key === 'Enter' && (evt.ctrlKey || evt.metaKey) && onSave) {
                evt.preventDefault();
                onSave(editor.getValue());
            }
        };

        container.addEventListener('keydown', keyHandler);
        (container as any).keyHandler = keyHandler;

        DebugManager.log('Editor event listeners added');
    }

    /**
     * 清理当前编辑器
     */
    async cleanupCurrentEditor(): Promise<void> {
        if (!this.currentEditor) {
            return;
        }

        try {
            const { container } = this.currentEditor;

            // 移除事件监听器
            const changeHandler = (container as any).changeHandler;
            const keyHandler = (container as any).keyHandler;

            if (changeHandler) {
                this.app.workspace.off('editor-change', changeHandler);
            }

            if (keyHandler) {
                container.removeEventListener('keydown', keyHandler);
            }

            // 清理临时文件
            await this.tempFileManager.cleanupCurrentTempFile();

            // 清理容器
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }

            this.currentEditor = null;
            DebugManager.log('Current editor cleaned up');

        } catch (error) {
            DebugManager.error('Failed to cleanup current editor:', error);
        }
    }

    /**
     * 初始化隐藏容器
     */
    private initializeHiddenContainer(): void {
        this.hiddenContainer = document.createElement('div');
        this.hiddenContainer.className = 'canvasgrid-hidden-editor-container';
        this.hiddenContainer.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 1px;
            height: 1px;
            overflow: hidden;
            visibility: hidden;
            pointer-events: none;
        `;
        document.body.appendChild(this.hiddenContainer);
    }

    /**
     * 创建编辑器容器
     */
    private createEditorContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'card-editor-container obsidian-editor hidden-editor';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        `;
        return container;
    }

    /**
     * 提取编辑器DOM元素
     */
    private async extractEditorElement(markdownView: MarkdownView, container: HTMLElement): Promise<void> {
        // 等待编辑器完全初始化
        await new Promise(resolve => setTimeout(resolve, 100));

        const editorEl = (markdownView as any).contentEl;
        if (!editorEl) {
            throw new Error('无法获取编辑器DOM元素');
        }

        // 将编辑器元素移动到我们的容器中
        container.appendChild(editorEl);
        
        // 确保编辑器可见
        editorEl.style.display = '';
        editorEl.style.visibility = 'visible';
        editorEl.style.position = 'relative';
    }

    /**
     * 设置编辑器样式
     */
    private setupEditorStyles(container: HTMLElement): void {
        const editorEl = container.querySelector('.cm-editor');
        if (editorEl) {
            (editorEl as HTMLElement).style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
                background: var(--background-primary);
                color: var(--text-normal);
                font-family: var(--font-text);
                font-size: var(--font-text-size);
                line-height: var(--line-height-normal);
            `;
        }
    }

    /**
     * 配置编辑器
     */
    private configureEditor(editor: Editor): void {
        try {
            // 根据配置设置编辑器选项
            if (!this.config.enableVimMode) {
                // 禁用Vim模式（如果需要）
            }

            // 其他编辑器配置...
            DebugManager.log('Editor configured');
        } catch (error) {
            DebugManager.error('Failed to configure editor:', error);
        }
    }

    /**
     * 检查是否有活跃编辑器
     */
    hasActiveEditor(): boolean {
        return this.currentEditor !== null;
    }

    /**
     * 获取编辑器状态信息
     */
    getEditorStatus(): {
        hasActive: boolean;
        age?: number;
        contentLength?: number;
    } {
        if (!this.currentEditor) {
            return { hasActive: false };
        }

        const now = Date.now();
        const content = this.getEditorContent();

        return {
            hasActive: true,
            age: now - this.currentEditor.createdAt,
            contentLength: content.length
        };
    }

    /**
     * 强制清理所有资源
     */
    async forceCleanup(): Promise<void> {
        try {
            await this.cleanupCurrentEditor();
            
            if (this.hiddenContainer && this.hiddenContainer.parentNode) {
                this.hiddenContainer.parentNode.removeChild(this.hiddenContainer);
                this.hiddenContainer = null;
            }

            DebugManager.log('HiddenEditorManager force cleanup completed');
        } catch (error) {
            DebugManager.error('HiddenEditorManager force cleanup failed:', error);
        }
    }
}
