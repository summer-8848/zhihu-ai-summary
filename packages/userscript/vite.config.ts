import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import preact from '@preact/preset-vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 从根目录 package.json 读取版本号
const rootPackageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
);
const version = rootPackageJson.version;
const author = rootPackageJson.author;
const homepage = rootPackageJson.homepage;

export default defineConfig({
  plugins: [
    preact(),
    monkey({
      entry: 'src/index.tsx',
      userscript: {
        name: '知乎AI总结助手 - 油猴脚本版(by Summer121)',
        namespace: 'http://tampermonkey.net/',
        version: version,
        description: '知乎中的文章、问题和回答提供 AI 智能总结功能',
        author: author,
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
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('知乎AI总结助手 - 油猴脚本版'),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_APP_AUTHOR': JSON.stringify(author),
    'import.meta.env.VITE_APP_HOMEPAGE': JSON.stringify(homepage),
  },
});
