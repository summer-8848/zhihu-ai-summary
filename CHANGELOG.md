# Changelog


## [2.6.0](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.5.0...v2.6.0) (2026-04-05)


### Features

* 缓存命中时在内容顶部显示缓存时间 ([730998b](https://github.com/summer-8848/zhihu-ai-summary/commit/730998bea40ea0e404ffb428b7bde85a44e54c1e))
* 设置页面改为卡片式布局，缓存按钮调整位置 ([14246e9](https://github.com/summer-8848/zhihu-ai-summary/commit/14246e9291017c115501b2e5bd284d04cd8b6fe9))
* 添加账号时不再自动追加v1/chat/completions，改为可选后缀按钮 ([15f3599](https://github.com/summer-8848/zhihu-ai-summary/commit/15f3599bc6da6378602416b3ba84e9951e0a4c64))


### Bug Fixes

* 导出配置时排除 SUMMARY_CACHE 缓存记录 ([917f158](https://github.com/summer-8848/zhihu-ai-summary/commit/917f15810df6b13dbf14dff8ce063b3c57c306db))
* 刷新时跳过缓存直接请求大模型 ([1e0a09a](https://github.com/summer-8848/zhihu-ai-summary/commit/1e0a09a1e650daa1464336e006f15203732a9a50))
* 限制油猴脚本仅在指定知乎页面运行 ([25f793c](https://github.com/summer-8848/zhihu-ai-summary/commit/25f793c13866c4376cea315ba926722b30722b82))
* 修复 max_tokens=0 导致 HTTP 400，扩展改用 chrome.storage.local ([15fe3e7](https://github.com/summer-8848/zhihu-ai-summary/commit/15fe3e777b2c783bb0dd379adda1334173af7543))


### Styles

* 优化设置页面布局，自动总结和缓存卡片并排展示 ([3a0fdf5](https://github.com/summer-8848/zhihu-ai-summary/commit/3a0fdf5f2cf3d762eaa0158755fc1a1297c1e85d))


### Chores

* 限制浏览器插件仅在指定知乎页面运行 ([95c0216](https://github.com/summer-8848/zhihu-ai-summary/commit/95c021639c18b857c03153616ea55894c5744247))

## [2.5.0](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.4.1...v2.5.0) (2026-04-02)


### Features

* 总结面板增加刷新按钮，点击后重新总结 ([f312731](https://github.com/summer-8848/zhihu-ai-summary/commit/f312731fea794d52bd47a1cc490c9b180dc30a08))
* AI总结按钮改为切换面板开关，保留已有总结结果 ([f5cb3b8](https://github.com/summer-8848/zhihu-ai-summary/commit/f5cb3b80fbc19bdd11ff04f5d46b5553efe01517))


### Bug Fixes

* 添加账号时,URL已包含v1则不再强制追加v1/chat/completions ([14ce2cf](https://github.com/summer-8848/zhihu-ai-summary/commit/14ce2cf4d863331bc545fd5d4fa6a426711cc829))

## [2.4.1](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.4.0...v2.4.1) (2026-04-02)


### Bug Fixes

* 修复油猴脚本版设置页面不显示 appName 和作者的问题 ([fe0e99b](https://github.com/summer-8848/zhihu-ai-summary/commit/fe0e99b59e84485499da6008d7ac85aba8d40ebd))


### Chores

* 完善开发说明 ([9fb6029](https://github.com/summer-8848/zhihu-ai-summary/commit/9fb6029d49150eb219afcabb826f8e02f0638c6f))

## [2.4.0](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.3.0...v2.4.0) (2026-03-19)


### Features

* 添加账号时，自动给 API接口地址 追加 v1/chat/completions ([f984d25](https://github.com/summer-8848/zhihu-ai-summary/commit/f984d254953c98ef15070aacb1ab9952a756e36b))


### Bug Fixes

* 修复点击「查看全部」后懒加载回答缺少AI总结按钮的问题 ([65318d0](https://github.com/summer-8848/zhihu-ai-summary/commit/65318d0c9a4a242b1835eda72085c96c26616cb0))


### Chores

* 重新生成changelog.md ([2e0f383](https://github.com/summer-8848/zhihu-ai-summary/commit/2e0f383f0ff60ec39b43a16c309639eb9ba73c9f))

## [2.3.0](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.2.0...v2.3.0) (2026-03-05)


### Features

* 问题和文章的总结结果增加吸顶的功能 ([873a2aa](https://github.com/summer-8848/zhihu-ai-summary/commit/873a2aab92244f34d8c4a692edabc30073de3871))
* 修改问题AI总结按钮的位置 ([12835bb](https://github.com/summer-8848/zhihu-ai-summary/commit/12835bb99b049ace73e838e8fff40165eb3e7bc0))
* AI总结结果面板增加拖动功能 ([524eefb](https://github.com/summer-8848/zhihu-ai-summary/commit/524eefb5f085bcaa9921d12d2de1d9015fce47ec))


### Refactoring

* 使用wxt重构浏览器插件开发 ([4913ef8](https://github.com/summer-8848/zhihu-ai-summary/commit/4913ef8fdc1539e69ed6286154388ffbae0e4183))


### Styles

* 优化markdown渲染 ([6649fb2](https://github.com/summer-8848/zhihu-ai-summary/commit/6649fb236add25f7d21aed8e6ccf829e88cd41e6))


### Chores

* 修改relese流水线 ([65a2b7f](https://github.com/summer-8848/zhihu-ai-summary/commit/65a2b7f14a32359689a6db4b401f465a12dc90f9))

## [2.2.0](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.1.2...v2.2.0) (2026-03-03)


### Features

* 修改配置面板标题 ([562c1f3](https://github.com/summer-8848/zhihu-ai-summary/commit/562c1f3a0ffd3f24bf3b423c84f05c156ac34f44))


### Bug Fixes

* 修复eslint版本不兼容 ([ba1a543](https://github.com/summer-8848/zhihu-ai-summary/commit/ba1a54327f7301e68091820a23d74915a7133013))


### Chores

* 修改发布标题 ([71913a5](https://github.com/summer-8848/zhihu-ai-summary/commit/71913a5c439498101a7d77df5e6141b84af10d7c))
* 压缩打包文件体积 ([1395fc5](https://github.com/summer-8848/zhihu-ai-summary/commit/1395fc5edb609fd4b59ebc0115a1b0a085fed6a5))

## [2.1.2](https://github.com/summer-8848/zhihu-ai-summary/compare/v2.1.1...v2.1.2) (2026-03-02)


### Bug Fixes

* 修复 Release 工作流打包扩展的步骤顺序和路径 ([b9d834c](https://github.com/summer-8848/zhihu-ai-summary/commit/b9d834ca2dceecb66ce5bd2b07614389c970f91b))

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


### Refactoring

* 重写userscript并将公共部分提取到ui和core中 ([b8130e0](https://github.com/summer-8848/zhihu-ai-summary/commit/b8130e0d4a83d7cabff8a0d0289ca4d41857f5eb))


### Styles

* 美化确认框 ([264de2b](https://github.com/summer-8848/zhihu-ai-summary/commit/264de2bb342b96a3b223c36daa9763f5e6198e1a))
* 全局主题色由紫色改为蓝色 ([f026443](https://github.com/summer-8848/zhihu-ai-summary/commit/f026443f5b59f11474024ee1cfc541eed44c73f4))
* 整合样式文件 ([bc36b3e](https://github.com/summer-8848/zhihu-ai-summary/commit/bc36b3ea79d5f4007d286e22749a61348c92c62a))


### Chores

* 迁移readme ([1d715fb](https://github.com/summer-8848/zhihu-ai-summary/commit/1d715fb54499df7baf224fb8cb2b22d4512f4ea8))
* 强化eslint验证，解决any类型遗留 ([83b0754](https://github.com/summer-8848/zhihu-ai-summary/commit/83b0754261daa20fd5eb4ea328cb5c1c33df193f))
* 完成浏览器扩展版功能测试 ([05037dc](https://github.com/summer-8848/zhihu-ai-summary/commit/05037dca62e9a76093d1ec09465da26ffc309d03))
* 修改油猴脚本开发模式 ([36d354b](https://github.com/summer-8848/zhihu-ai-summary/commit/36d354bfab9c306e6e5687131b28c997d97582eb))

## [2.0.0](https://github.com/summer-8848/zhihu-ai-summary/compare/267b944d427c29dbe22e7b8c9ffc10d63706ab79...v2.0.0) (2026-03-02)


### Refactoring

* 重构为现代化 monorepo 架构 ([267b944](https://github.com/summer-8848/zhihu-ai-summary/commit/267b944d427c29dbe22e7b8c9ffc10d63706ab79))

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

