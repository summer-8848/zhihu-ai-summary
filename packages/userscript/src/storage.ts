import { StorageAdapter } from '@zhihu-ai-summary/core';

// 油猴脚本存储适配器
export class UserscriptStorage implements StorageAdapter {
  async get<T>(key: string, defaultValue?: T): Promise<T> {
    // GM_getValue is typed in vite-env.d.ts
    return GM_getValue(key, defaultValue);
  }

  async set<T>(key: string, value: T): Promise<void> {
    GM_setValue(key, value);
  }
}
