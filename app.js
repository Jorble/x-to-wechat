class XToWechatConverter {
    constructor() {
        this.markdownText = '';
        this.formattedHTML = '';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('fetchBtn').addEventListener('click', () => this.fetchXArticle());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
    }

    async fetchXArticle() {
        const urlInput = document.getElementById('xUrl');
        const url = urlInput.value.trim();

        if (!this.validateXUrl(url)) {
            this.showToast('请输入有效的X文章链接', 'error');
            return;
        }

        const fetchBtn = document.getElementById('fetchBtn');
        const originalText = fetchBtn.innerHTML;
        fetchBtn.innerHTML = '<span class="loading"></span> 获取中...';
        fetchBtn.disabled = true;

        try {
            const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
            const response = await fetch(jinaUrl);

            if (!response.ok) {
                throw new Error('获取文章失败');
            }

            const text = await response.text();
            const markdown = this.parseResponseToMarkdown(text);
            
            document.getElementById('markdownEditor').value = markdown;
            
            fetchBtn.innerHTML = '<span class="loading"></span> 转换中...';
            this.showToast('文章获取成功！正在转换格式...');
            
            setTimeout(() => {
                this.convertToWechat();
            }, 500);
            
        } catch (error) {
            console.error('Error:', error);
            this.showToast('获取文章失败，请检查链接是否正确', 'error');
            fetchBtn.innerHTML = originalText;
            fetchBtn.disabled = false;
        }
    }

    validateXUrl(url) {
        const patterns = [
            /^https?:\/\/(twitter.com|x.com)\/[\w]+\/status\/\d+/,
            /^https?:\/\/(twitter.com|x.com)\/[\w]+\/status\/\d+\/.*/,
            /^[\w]+\/status\/\d+/
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    parseResponseToMarkdown(text) {
        if (!text) return '';
        
        let markdown = text;
        
        markdown = markdown.replace(/^Title:.*$/m, '');
        markdown = markdown.replace(/^URL Source:.*$/m, '');
        markdown = markdown.replace(/^Published Time:.*$/m, '');
        markdown = markdown.replace(/^Markdown Content:$/m, '');
        markdown = markdown.replace(/^Article\s*-+$/m, '');
        markdown = markdown.replace(/^Conversation\s*-+$/m, '');
        markdown = markdown.replace(/^-+$/gm, '');
        
        markdown = markdown.replace(/\[!\[Image.*?\]\((https:\/\/pbs\.twimg\.com\/[^)]+?)\)\]\(https:\/\/x\.com\/[^)]+\)/g, '![]($1)');
        
        markdown = markdown.trim();
        
        return this.cleanupMarkdown(markdown);
    }

    cleanupMarkdown(markdown) {
        if (!markdown) return '';
        
        let cleaned = markdown;
        
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        
        cleaned = cleaned.replace(/^>[\s\n]+关于作者/gim, '\n\n---\n\n## 关于作者');
        
        return cleaned.trim();
    }

    async convertToWechat() {
        this.markdownText = document.getElementById('markdownEditor').value.trim();
        
        if (!this.markdownText) {
            this.showToast('请先获取或输入内容', 'error');
            return;
        }

        try {
            this.formattedHTML = await this.parseMarkdownForWechat(this.markdownText);
            
            const preview = document.getElementById('preview');
            preview.innerHTML = this.formattedHTML;
            
            document.getElementById('copyBtn').disabled = false;
            
            const fetchBtn = document.getElementById('fetchBtn');
            fetchBtn.innerHTML = '<span class="btn-icon">📥</span> 获取文章';
            fetchBtn.disabled = false;
            
            this.showToast('🎉 格式转换完成！可以一键复制了');
        } catch (error) {
            console.error('Error in convertToWechat:', error);
            this.showToast('转换失败：' + error.message, 'error');
            
            const fetchBtn = document.getElementById('fetchBtn');
            fetchBtn.innerHTML = '<span class="btn-icon">📥</span> 获取文章';
            fetchBtn.disabled = false;
        }
    }

    async parseMarkdownForWechat(markdown) {
        if (!markdown) return '';
        
        const lines = markdown.split('\n');
        let result = [];
        let i = 0;
        let imageCount = 0;
        const totalImages = (markdown.match(/!\[/g) || []).length;

        while (i < lines.length) {
            const line = lines[i] || '';
            
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const content = headerMatch[2] || '';
                result.push(this.renderHeader(content, level));
                i++;
                continue;
            }

            const codeBlockMatch = line.match(/^```(\w*)$/);
            if (codeBlockMatch) {
                const lang = codeBlockMatch[1] || '';
                const codeLines = [];
                i++;
                while (i < lines.length && lines[i] !== '```') {
                    codeLines.push(lines[i] || '');
                    i++;
                }
                i++;
                result.push(this.renderCodeBlock(codeLines.join('\n'), lang));
                continue;
            }

            const imageMatch = line.match(/^!\[([^\]]*)\]\((https:\/\/pbs\.twimg\.com\/[^)]+)\)$/);
            if (imageMatch) {
                const alt = imageMatch[1] || '';
                let url = imageMatch[2] || '';
                
                if (url) {
                    if (url.includes('name=')) {
                        url = url.replace(/(name=)(small|medium|900x900)/, '$1large');
                    } else {
                        if (!url.includes('?')) {
                            url += '?name=large';
                        } else {
                            url += '&name=large';
                        }
                    }
                }
                
                imageCount++;
                this.showToast(`正在下载图片 ${imageCount}/${totalImages}...`, 'info');
                const imageData = await this.downloadAndConvertImage(url || '');
                result.push(this.renderImage(imageData, alt));
                
                i++;
                continue;
            }

            const hrMatch = line.match(/^---$/);
            if (hrMatch) {
                result.push(this.renderHorizontalRule());
                i++;
                continue;
            }

            const quoteMatch = line.match(/^>\s+(.+)$/);
            if (quoteMatch) {
                result.push(this.renderQuote(quoteMatch[1] || ''));
                i++;
                continue;
            }

            if (line.trim() === '') {
                i++;
                continue;
            }

            const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
            const unorderedMatch = line.match(/^\s*[*]\s+(.+)$/);
            
            if (unorderedMatch || orderedMatch) {
                const listItems = this.parseListSmart(lines, i, unorderedMatch ? 'unordered' : 'ordered');
                if (listItems.items.length > 0) {
                    result.push(this.renderList(listItems));
                    i = listItems.endIndex;
                    continue;
                }
            }

            result.push(this.renderParagraph(line));
            i++;
        }

        return result.join('\n');
    }

    parseListSmart(lines, startIndex, type) {
        const items = [];
        let i = startIndex;
        const marker = type === 'unordered' ? '*' : '\\d+\\.';

        const prevLine = lines[Math.max(0, i - 1)] || '';
        const hasListContext = prevLine.includes('：') || 
                              prevLine.includes(':') || 
                              prevLine.includes('例子') ||
                              prevLine.includes('例如') ||
                              prevLine.includes('包括') ||
                              prevLine.includes('：') ||
                              prevLine.includes('好处') ||
                              prevLine.includes('原因') ||
                              prevLine.includes('结果');

        while (i < lines.length) {
            const line = lines[i] || '';
            
            let match;
            if (type === 'unordered') {
                match = line.match(/^\s*[*]\s+(.+)$/);
            } else {
                match = line.match(/^(\d+)\.\s+(.+)$/);
            }
            
            if (match) {
                const content = (type === 'unordered' ? match[1] : match[2]) || '';
                
                if (items.length === 0 && !hasListContext && content.length < 15) {
                    if (!content.includes('：') && !content.includes('：')) {
                        return { items: [], endIndex: startIndex };
                    }
                }
                
                items.push(this.parseInline(content));
                i++;
            } else if (line.trim() === '') {
                i++;
                if (i < lines.length) {
                    const nextLine = lines[i] || '';
                    if (type === 'unordered' && nextLine.match(/^\s*[*]\s+/)) {
                        continue;
                    }
                    if (type === 'ordered' && nextLine.match(/^\d+\.\s+/)) {
                        continue;
                    }
                }
                break;
            } else {
                break;
            }
        }

        return { items, type, endIndex: i };
    }

    async downloadAndConvertImage(url) {
        if (!url) return '';
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const blob = await response.blob();
            
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result || '');
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Image download failed:', error);
            this.showToast('图片下载失败，将使用原链接', 'error');
            return url;
        }
    }

    parseList(lines, startIndex) {
        const items = [];
        let type = null;
        let i = startIndex;

        while (i < lines.length) {
            const line = lines[i] || '';
            const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
            const unorderedMatch = line.match(/^[-*]\s+(.+)$/);

            if (orderedMatch || unorderedMatch) {
                const currentType = orderedMatch ? 'ordered' : 'unordered';
                const content = (orderedMatch ? orderedMatch[2] : unorderedMatch[2]) || '';

                if (!type) {
                    type = currentType;
                }

                if (currentType === type) {
                    items.push(this.parseInline(content));
                } else {
                    break;
                }
                i++;
            } else if (line.trim() === '') {
                i++;
                continue;
            } else {
                break;
            }
        }

        return { items, type, endIndex: i };
    }

    parseInline(text) {
        if (!text) return '';
        
        let html = text;
        
        html = html.replace(/&/g, '&amp;');
        html = html.replace(/</g, '&lt;');
        html = html.replace(/>/g, '&gt;');
        
        html = html.replace(/`([^`]+)`/g, '<code style="background: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-family: Monaco, Menlo, Consolas, monospace; font-size: 13px; color: #e83e8c;">$1</code>');
        
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #1DA1F2; text-decoration: none; border-bottom: 1px dashed #1DA1F2;">$1</a>');
        
        return html;
    }

    renderHeader(content, level) {
        const fontSize = Math.max(24, 32 - (level - 1) * 4);
        const colors = ['#333333', '#333333', '#4a5568', '#4a5568', '#718096', '#718096'];
        const parsedContent = this.parseInline(content || '');
        
        if (level === 1) {
            return `<section style="margin: 30px 0; padding-bottom: 20px; border-bottom: 2px solid #e1e8ed;">
                <h1 style="font-size: 32px; font-weight: bold; color: ${colors[0]}; line-height: 1.4;">${parsedContent}</h1>
            </section>`;
        } else {
            return `<h${level} style="margin: 25px 0 15px; font-size: ${fontSize}px; font-weight: 600; color: ${colors[level - 1]}; line-height: 1.5;">${parsedContent}</h${level}>`;
        }
    }

    renderParagraph(text) {
        const parsedContent = this.parseInline(text || '');
        return `<p style="margin: 15px 0; line-height: 1.8; color: #333; font-size: 16px;">${parsedContent}</p>`;
    }

    renderCodeBlock(code, lang) {
        const escapedCode = (code || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        return `<section style="margin: 20px 0; background: #f6f8fa; border-radius: 8px; border: 1px solid #e1e8ed; overflow: hidden;">
            <div style="background: #e1e8ed; padding: 8px 15px; font-size: 13px; color: #666; border-bottom: 1px solid #d1d5db;">
                ${lang || 'code'}
            </div>
            <pre style="padding: 15px; margin: 0; overflow-x: auto; font-family: Monaco, Menlo, Consolas, monospace; font-size: 14px; line-height: 1.6; color: #333;">${escapedCode}</pre>
        </section>`;
    }

    renderImage(src, alt) {
        return `<section style="margin: 20px 0;">
            <img src="${src || ''}" alt="${alt || ''}" style="width: 100%; max-width: 600px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
        </section>`;
    }

    renderList(listData) {
        const { items, type } = listData;
        const tag = type === 'ordered' ? 'ol' : 'ul';
        const style = type === 'ordered' ? 'list-style-type: decimal;' : 'list-style-type: disc;';
        
        const itemsHtml = (items || []).map(item => `<li style="margin: 8px 0; line-height: 1.6;">${item}</li>`).join('');
        
        return `<${tag} style="margin: 15px 0; padding-left: 25px; color: #333; ${style}">
            ${itemsHtml}
        </${tag}>`;
    }

    renderQuote(text) {
        const parsedContent = this.parseInline(text || '');
        return `<blockquote style="margin: 20px 0; padding: 15px 20px; background: #f6f8fa; border-left: 4px solid #1DA1F2; color: #666; font-style: italic;">${parsedContent}</blockquote>`;
    }

    renderHorizontalRule() {
        return `<hr style="margin: 30px 0; border: none; border-top: 2px solid #e1e8ed;">`;
    }

    copyToClipboard() {
        if (!this.formattedHTML) {
            this.showToast('没有可复制的内容', 'error');
            return;
        }

        const blob = new Blob([this.formattedHTML], { type: 'text/html' });
        
        navigator.clipboard.write([
            new ClipboardItem({
                'text/html': blob,
                'text/plain': new Blob([this.formattedHTML.replace(/<[^>]+>/g, '')], { type: 'text/plain' })
            })
        ])
        .then(() => {
            this.showToast('📋 已复制！现在直接粘贴到公众号编辑器即可');
        })
        .catch(err => {
            console.error('Copy failed:', err);
            this.showToast('复制失败，请手动复制', 'error');
        });
    }

    clearAll() {
        document.getElementById('xUrl').value = '';
        document.getElementById('markdownEditor').value = '';
        document.getElementById('preview').innerHTML = `
            <div class="placeholder">
                <div class="placeholder-icon">🎨</div>
                <p>转换后的内容将在这里预览</p>
            </div>
        `;
        document.getElementById('copyBtn').disabled = true;
        this.markdownText = '';
        this.formattedHTML = '';
        this.showToast('已清空所有内容');
    }

    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new XToWechatConverter();
});