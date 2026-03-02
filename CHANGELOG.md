# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [2.1.1](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.1.0...v2.1.1) (2026-03-02)


### Bug Fixes

* 修复正则表达式中的引号转义问题 ([eccc60f](https://github.com/summer-8848/zhihu-ai-summary/commit/eccc60f1424fd48e8ccaa6ec8cd5fa126021082a))

## [2.1.0](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.0.0...v2.1.0) (2026-03-02)


### Features

* 添加 Toast 组件替代 alert ([4c47694](https://github.com/summer-8848/zhihu-ai-summary/commit/4c47694a2c2ccac745c846ac0598f2ead8917473))
* 引入自动发版 ([1a44a37](https://github.com/summer-8848/zhihu-ai-summary/commit/1a44a3780dc703328d610f9b69e587a0a47ad337))
* 引入eslint ([f46b6cb](https://github.com/summer-8848/zhihu-ai-summary/commit/f46b6cb4ac9e0c4b115a64d5dc590d94c0b4d794))
* 右下角配置按钮改为自动贴边隐藏 ([5c2a886](https://github.com/summer-8848/zhihu-ai-summary/commit/5c2a886d37ba765f0f6276b93cb865533fc26d41))
* 增加更多通知提醒 ([1e5a7c3](https://github.com/summer-8848/zhihu-ai-summary/commit/1e5a7c312d528350cebee783f505ec4f2bc6cd6d))
* 重构总结按钮组件，优化内容提取与面板显示逻辑 ([4d845a2](https://github.com/summer-8848/zhihu-ai-summary/commit/4d845a2a3c0bcf382273deba767022a2a981db50))


### Bug Fixes

* 修复 pnpm run dev:extension 热更新无效 ([ecf9a32](https://github.com/summer-8848/zhihu-ai-summary/commit/ecf9a32d5766e5bdae209663c0fa2a40a0c430bc))
* 修复pnpm run clean报错 ([7487e66](https://github.com/summer-8848/zhihu-ai-summary/commit/7487e666377b52c40be187f44dbdbd74975a2cd9))

## 2.0.0 (2026-02-25)

### Features
* 使用现代化的 monorepo 架构重构，方便本地开发调试和发版

## 1.4.0 (2026-02-12)

### Features
* 增加复制AI总结结果的功能

## 1.3.0 (2026-02-11)

### Features
* 添加账号复制和导入配置功能，方便测试和迁移

## 1.2.2 (2026-01-22)

### Bug Fixes
* 修改插件基本信息，避免油猴脚本重名

## 1.2.1 (2026-01-08)

### Improvements
* 对于较短的回答，总结结果改为自适应高度显示，提升阅读体验

## 1.2.0 (2026-01-07)

### Features
* 修改AI总结样式，改为侧边栏展示总结结果

## 1.1.0 (2025-12-24)

### Features
* 添加最少回答字数设置
* 优化自动总结逻辑

## 1.0.0 (2025-12-22)

### Features
* 初始版本发布
* 支持文章、问题、回答的 AI 总结
* 多账号管理功能
* 自动总结功能
* 流式输出支持
