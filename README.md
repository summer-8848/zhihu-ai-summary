# 知乎AI总结助手

一个现代化的 Monorepo 项目，同时维护油猴脚本和浏览器插件版本。

## ✨ 特性

- 🎯 **代码共享** - 核心逻辑和 UI 组件完全复用
- ⚡ **热更新开发** - 修改代码立即生效
- 🎨 **现代化 UI** - 使用 Preact 开发组件（仅 3KB）
- 📦 **TypeScript** - 完整的类型安全
- 🚀 **快速构建** - Vite 驱动的极速构建

## 项目结构

```
zhihu-ai-summary/
├── packages/
│   ├── core/          # 核心逻辑（API、配置、内容提取）
│   ├── ui/            # UI 组件（Preact）
│   ├── userscript/    # 油猴脚本版
│   └── extension/     # 浏览器插件版
├── package.json
└── pnpm-workspace.yaml
```

## 快速开始

### 安装依赖

```bash
cd zhihu-ai-summary
pnpm install
```

### 开发模式

**油猴脚本（支持热更新）：**
```bash
pnpm dev:userscript
```
访问 http://localhost:5173/ 并在 Tampermonkey 中安装开发版脚本

**浏览器插件（支持热更新）：**
```bash
pnpm dev:extension
```
在 Chrome 扩展管理页面加载 `packages/extension/dist` 目录

### 构建生产版本

```bash
# 构建所有版本
pnpm build

# 或单独构建
pnpm build:userscript  # 输出到 packages/userscript/dist
pnpm build:extension   # 输出到 packages/extension/dist
```

## 技术栈

- **TypeScript** - 类型安全
- **Preact** - 轻量级 React（3KB）
- **Vite** - 快速构建工具
- **pnpm** - 高效的包管理器
- **vite-plugin-monkey** - 油猴脚本开发
- **@crxjs/vite-plugin** - Chrome 插件开发

## 架构设计

### 1. Core 包（核心逻辑）
- ConfigManager - 配置管理
- APIClient - API 调用
- ContentExtractor - 内容提取
- MarkdownParser - Markdown 解析

### 2. UI 包（共享组件）
- SummaryButton - 总结按钮
- SummaryPanel - 总结面板
- ConfigModal - 配置弹窗
- ConfigButton - 配置按钮

### 3. Userscript/Extension（平台适配）
- 存储适配器（GM_getValue / chrome.storage）
- 平台特定的入口文件

## 开发指南

详细的开发文档请查看 [DEVELOPMENT.md](./DEVELOPMENT.md)

## 功能特点

- **多场景支持**：支持知乎文章、问题描述、回答内容的AI总结
- **智能总结**：调用 OpenAI ChatGPT API，提供高质量的内容摘要
- **美观界面**：使用 Preact 开发的现代化 UI 组件
- **易于配置**：可视化配置界面，一键保存 API Key
- **自动适配**：自动检测页面类型，为不同内容添加相应的总结按钮

## License

MIT
