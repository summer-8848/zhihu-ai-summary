import { StorageAdapter } from '@zhihu-ai-summary/core';

// 油猴脚本存储适配器
export class UserscriptStorage implements StorageAdapter {
  async get<T>(key: string, defaultValue?: T): Promise<T> {
    return GM_getValue(key, defaultValue) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    GM_setValue(key, value);
  }
}
