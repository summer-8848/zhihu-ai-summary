import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPackageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
);
const version = rootPackageJson.version;
const author = rootPackageJson.author;
const homepage = rootPackageJson.homepage;

export default defineConfig({
  plugins: [preact()],
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('知乎AI总结助手 - 油猴脚本版'),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_APP_AUTHOR': JSON.stringify(author),
    'import.meta.env.VITE_APP_HOMEPAGE': JSON.stringify(homepage),
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['preact', 'preact/hooks', '@zhihu-ai-summary/core'],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
