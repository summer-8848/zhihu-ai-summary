import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact(),
    monkey({
      entry: 'src/index.tsx',
      userscript: {
        name: '知乎AI总结助手 - 油猴脚本版(by Summer121)',
        namespace: 'http://tampermonkey.net/',
        version: '2.1.2',
        description: '知乎中的文章、问题和回答提供 AI 智能总结功能',
        author: 'Summer121',
        match: ['https://*.zhihu.com/*'],
        grant: ['GM_xmlhttpRequest', 'GM_setValue', 'GM_getValue', 'unsafeWindow'],
        license: 'MIT',
        connect: ['localhost', '*'],
        'run-at': 'document-idle',
        // 使用 HTTP 服务器的 URL（配合 dev:userscript:serve 使用）
        updateURL: 'http://localhost:8080/zhihu-ai-summary.user.js',
        downloadURL: 'http://localhost:8080/zhihu-ai-summary.user.js',
      },
      build: {
        externalGlobals: {},
        fileName: 'zhihu-ai-summary.user.js',
      },
      server: {
        open: false,
        mountGmApi: true,
      },
    }),
  ],
  server: {
    port: 5173,
    host: 'localhost',
  },
});
