import { defineContentScript } from 'wxt/utils/define-content-script';

// Keep runtime code inside `main` (WXT imports entrypoints in Node during build).
export default defineContentScript({
  matches: ['https://zhuanlan.zhihu.com/p/*', 'https://www.zhihu.com/question/*'],
  runAt: 'document_idle',

  async main() {
    const { runZhihuContentScript } = await import('../content-main');
    runZhihuContentScript();
  },
});
