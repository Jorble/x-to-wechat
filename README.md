# X文章转公众号格式工具

一个简单易用的工具，帮助将X(Twitter)文章快速转换为适合微信公众号发布的格式。

## 功能特点

- 📥 **一键获取**：粘贴X文章链接，自动获取内容
- 🖼️ **自动下载图片**：将X的图片转换为Data URL，直接嵌入
- ✨ **智能转换**：Markdown转公众号富文本格式
- 🎨 **美化排版**：自动优化标题、代码块、列表等样式
- 📋 **一键复制**：直接复制到公众号编辑器，图片自动显示
- 👀 **实时预览**：左右分栏，即时查看效果
- 🛠️ **可编辑**：支持手动调整内容
- 🔑 **无需API密钥**：使用Jina AI Reader免费服务

## 技术栈

- 纯前端：原生JavaScript (ES6+)
- 框架：Express.js (用于部署)
- 部署：Vercel
- 核心服务：Jina AI Reader (免费公开API)

## 使用方法

### 本地运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 访问 http://localhost:3000
```

### 在线使用

访问 https://your-app.vercel.app

### 操作流程

1. 粘贴X文章链接，点击"获取文章"
2. 等待自动下载图片并转换完成
3. 点击"一键复制"
4. 直接粘贴到微信公众号编辑器即可发布

## 为什么不需要API密钥？

本工具使用 **Jina AI Reader** (r.jina.ai) 这个免费的公开API：

- **功能**: 将任何URL转换成Markdown格式
- **用途**: 专门为AI/LLM提供更好的网页内容解析
- **无需注册**: 公开API，无需API密钥
- **免费使用**: 有一定的免费额度

### 技术原理

```
X文章链接 
    ↓
Jina AI Reader (r.jina.ai) 自动抓取和转换
    ↓
返回Markdown格式内容
    ↓
前端JavaScript解析Markdown
    ↓
下载图片并转换为Data URL
    ↓
生成HTML并复制到剪贴板
```

## 项目结构

```
x-to-wechat/
├── index.html       # 主页面
├── styles.css       # 样式文件
├── app.js          # 核心逻辑
├── server.js       # Express服务器
├── package.json    # 项目配置
├── vercel.json     # Vercel部署配置
└免 README.md      # 使用说明
```

## 部署到Vercel

1. Fork本项目到你的GitHub
2. 在Vercel中导入项目
3. 自动部署完成
4. 获得可访问的URL

## 许可证

MIT License