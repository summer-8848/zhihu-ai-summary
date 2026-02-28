import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import preact from '@preact/preset-vite';
import manifest from './manifest.json';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const packagesDir = r('..');

export default defineConfig({
  plugins: [preact(), crx({ manifest })],
  resolve: {
    // IMPORTANT: order matters. The more specific alias must come first;
    // otherwise "@zhihu-ai-summary/ui" would also rewrite
    // "@zhihu-ai-summary/ui/src/styles.css" into a broken path.
    alias: [
      {
        find: '@zhihu-ai-summary/ui/src/styles.css',
        replacement: r('../ui/src/styles.css'),
      },
      {
        // In this monorepo, prefer source files during dev so `pnpm clean`
        // doesn't break `vite` (dist outputs are removed).
        find: '@zhihu-ai-summary/ui',
        replacement: r('../ui/src/index.ts'),
      },
    ],
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'popup.html',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
    fs: {
      allow: [packagesDir],
    },
    watch: {
      // Improve file watching reliability on Windows / network drives.
      usePolling: process.platform === 'win32',
      interval: 100,
    },
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
});
