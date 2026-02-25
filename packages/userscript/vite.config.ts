import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact(),
    monkey({
      entry: 'src/index-new.tsx',
      userscript: {
        name: '知乎AI总结助手(by Summer121)',
        namespace: 'http://tampermonkey.net/',
        version: '1.4.0',
        description: '为知乎文章、问题和回答提供 AI 智能总结功能，支持多账号管理和自动总结',
        author: 'Summer121',
        match: ['https://*.zhihu.com/*'],
        grant: ['GM_xmlhttpRequest', 'GM_setValue', 'GM_getValue'],
        license: 'MIT',
        connect: ['*'],
        'run-at': 'document-idle',
      },
      build: {
        externalGlobals: {},
        fileName: 'zhihu-ai-summary.user.js',
      },
      server: {
        open: false,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
});
