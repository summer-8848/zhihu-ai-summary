import { StorageAdapter } from '@zhihu-ai-summary/core';

// Chrome 插件存储适配器
export class ExtensionStorage implements StorageAdapter {
  async get<T>(key: string, defaultValue?: T): Promise<T> {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ [key]: defaultValue }, (result) => {
        resolve(result[key] as T);
      });
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }
}
