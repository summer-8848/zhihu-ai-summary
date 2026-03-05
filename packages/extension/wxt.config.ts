import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import preact from '@preact/preset-vite';
import { defineConfig } from 'wxt';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPackageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')) as {
  version: string;
  author: string;
  homepage: string;
};

const version = rootPackageJson.version;
const author = rootPackageJson.author;
const homepage = rootPackageJson.homepage;

export default defineConfig({
  // Keep a src/ directory; WXT will look for `src/entrypoints/*`.
  srcDir: 'src',

  // Disable WXT auto-imports to avoid leaking WXT globals into
  // bundled workspace dependencies (like @zhihu-ai-summary/core).
  // This prevents Vite/Rollup from trying to resolve `wxt/utils/*`
  // from outside this package during builds.
  imports: false,

  // Keep output compatible with existing dev docs:
  // previously build artifacts lived in `packages/extension/dist/`.
  outDir: 'dist',

  publicDir: 'public',

  // Preserve monorepo dev ergonomics: use source files for @zhihu-ai-summary/ui
  // so `pnpm clean` (which removes dist outputs) doesn't break dev.
  alias: {
    // More specific alias must come first (same reasoning as previous Vite config).
    '@zhihu-ai-summary/ui/src/styles.css': r('../ui/src/styles.css'),
    '@zhihu-ai-summary/ui': r('../ui/src/index.ts'),
  },

  // Keep using Preact via Vite plugin.
  vite: () => ({
    plugins: [preact()],
    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify('知乎AI总结助手 - 浏览器插件版'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
      'import.meta.env.VITE_APP_AUTHOR': JSON.stringify(author),
      'import.meta.env.VITE_APP_HOMEPAGE': JSON.stringify(homepage),
    },
  }),

  // Configure dev browser startup.
  // Prefer manual loading via chrome://extensions (unpacked) during development.
  // See: https://wxt.dev/api/reference/wxt/interfaces/webextconfig#disabled
  webExt: {
    disabled: true,
  },

  // Generate MV3 manifest matching the previous `manifest.json`.
  manifest: {
    name: '知乎AI总结助手 - 浏览器插件版(by Summer121)',
    description: '为知乎中的文章、问题和回答提供 AI 智能总结功能',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://*.zhihu.com/*', 'http://localhost:5173/*'],
    action: {
      default_popup: 'popup.html',
      default_icon: {
        16: 'icons/icon16.png',
        32: 'icons/icon32.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    },
    icons: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },

  // Zip bundles for manual distribution.
  // Docs: https://wxt.dev/api/reference/wxt/interfaces/inlineconfig#zip
  zip: {
    // Override {{name}} used by WXT's default artifact template.
    // This prevents WXT from producing "zhihu-ai-summaryextension-...".
    name: 'zhihu-ai-summary-extension',

    // Keep the default format, but with corrected name.
    // Default is '{{name}}-{{version}}-{{browser}}.zip'
    artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
  },

  hooks: {
    // WXT may generate an additional "sources" zip for Firefox.
    // We don't distribute it, so delete it after the zip process completes.
    // Docs: https://wxt.dev/api/reference/wxt/interfaces/wxthooks#zip-done
    'zip:done': (_wxt, zipFiles) => {
      for (const zipPath of zipFiles) {
        if (zipPath.endsWith('-sources.zip') && existsSync(zipPath)) {
          unlinkSync(zipPath);
        }
      }
    },
  },
});
