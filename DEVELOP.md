# 开发指南

本项目采用 Monorepo 结构，使用 pnpm workspaces 管理多个包。

## 项目结构

```
packages/
├── core/          # 核心业务逻辑（API、配置、内容提取、Markdown 解析）
├── ui/            # 共享 UI 组件（Preact）
├── userscript/    # 油猴脚本版本
└── extension/     # 浏览器扩展版本（WXT）
```

## 技术栈

| 包 | 技术 |
|---|------|
| 通用 | TypeScript + Preact + pnpm workspaces |
| core | 纯 TypeScript，无运行时依赖 |
| ui | Preact + Vite |
| userscript | Vite + Tampermonkey API |
| extension | [WXT](https://wxt.dev/) + Vite (支持 Chrome/Firefox/Safari) |

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发

#### 浏览器扩展模式开发
```bash
# 建议使用此版本做本地开发调试
pnpm dev:extension
```

然后在浏览器扩展程序中加载 `packages\extension\dist\chrome-mv3-dev`

#### 油猴脚本模式开发
```bash
pnpm dev:userscript
```

在油猴脚本中，创建一个新的脚本，填写下方代码，注意将 `require` 换成自己本机实际打包后的路径

```js
// ==UserScript==
// @name         知乎AI总结助手 - 油猴脚本版(by Summer121) - 本地测试
// @namespace    http://tampermonkey.net/
// @version      2.3.0
// @author       Summer121
// @description  知乎中的文章、问题和回答提供 AI 智能总结功能
// @license      MIT
// @match        https://*.zhihu.com/*
// @connect      localhost
// @connect      *
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-idle
// @require      file:///d:/projects/zhihu-ai-summary/packages/userscript/dist/zhihu-ai-summary.user.js
// ==/UserScript==
```

### 构建

```bash
# 构建所有包
pnpm build

# 仅构建油猴脚本
pnpm build:userscript

# 仅构建浏览器扩展
pnpm build:extension

# 构建扩展至所有浏览器
pnpm build:extension:all
```

## 核心模块

### core 包

负责平台无关的业务逻辑：

| 模块 | 文件 | 功能 |
|------|------|------|
| API | `core/src/api.ts` | OpenAI 兼容 API 调用、流式响应 |
| 配置 | `core/src/config.ts` | 配置管理、存储适配器接口 |
| 内容提取 | `core/src/extractor.ts` | 知乎 DOM 内容抓取 |
| Markdown | `core/src/markdown.ts` | Markdown 转 HTML |
| 页面处理 | `core/src/pageHandlers.ts` | 页面检测、按钮注入 |

### ui 包

共享的 Preact 组件：

| 组件 | 功能 |
|------|------|
| `SummaryButton` | 总结按钮 |
| `SummaryButtonWrapper` | 按钮 + 面板容器 |
| `SummaryPanel` | 流式结果显示 |
| `ConfigModal` | 多账号 API 配置 |
| `Toast` | 通知系统 |
| `ConfirmModal` | 确认对话框 |
| `InputModal` | 输入对话框 |
| `ConfigButton` | 浮动齿轮按钮 |

### 平台适配

两个平台通过不同的存储适配器实现平台特定功能：

- **userscript** (`packages/userscript/src/storage.ts`): 使用 GM_getValue/GM_setValue
- **extension** (`packages/extension/src/storage.ts`): 使用 chrome.storage.local

## 开发注意事项

- **核心逻辑放在 core** — 避免平台特定代码
- **UI 组件放在 ui** — 使用 Preact，无平台 API 依赖
- **存储抽象** — 通过 StorageAdapter 接口实现平台无关
- **选择器维护** — 知乎 DOM 变化时更新 `extractor.ts` 中的选择器

## 流水线与发版

### CI 流水线

GitHub Actions 自动执行：

- **触发条件**: push 到 main 或 pull request
- **检查项**: ESLint 检查、构建所有包
- **产物**: 上传 userscript 和 extension 构建产物（保留 7 天）

### Release 发版

- **触发条件**: 推送 `v*.*.*` 格式的 tag
- **执行流程**:
  1. 构建所有包
  2. 打包扩展为 zip（chrome/firefox/safari）
  3. 创建 GitHub Release 并上传产物

### 发版检查

```bash
# 预览版本号（不实际发版）
pnpm release:dry

# 实际发版
pnpm release
git push origin main --tags
```

> 注意：发版后需手动同步更新 GreasyFork 上的油猴脚本版本。
