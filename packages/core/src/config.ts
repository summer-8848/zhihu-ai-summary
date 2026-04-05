// 存储适配器接口
export interface StorageAdapter {
  get<T>(key: string, defaultValue?: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

// 账号配置
export interface Account {
  id: string;
  name: string;
  apiKey: string;
  apiUrl: string;
  model: string;
}

// 缓存的总结结果（只存 markdown，HTML 读取时动态生成）
export interface CachedSummary {
  markdown: string;
  timestamp: number;
}

// 配置键到值的映射（用于强类型 get/set）
export interface ConfigValueMap {
  AI_ACCOUNTS: Account[];
  CURRENT_ACCOUNT_ID: string;
  AUTO_SUMMARIZE: boolean;
  MIN_ANSWER_LENGTH: number;
  SUMMARY_CACHE: Record<string, CachedSummary>;
  SUMMARY_CACHE_SIZE: number;
}

export type ConfigKey = keyof ConfigValueMap;

type BatchDefaults<K extends ConfigKey> = { [P in K]: ConfigValueMap[P] };

// 配置管理器
export class ConfigManager {
  constructor(private adapter: StorageAdapter) {}

  async get<K extends ConfigKey>(key: K, defaultValue: ConfigValueMap[K]): Promise<ConfigValueMap[K]>;
  async get<K extends ConfigKey>(key: K, defaultValue?: ConfigValueMap[K]): Promise<ConfigValueMap[K] | undefined>;
  async get<K extends ConfigKey>(
    key: K,
    defaultValue?: ConfigValueMap[K]
  ): Promise<ConfigValueMap[K] | undefined> {
    try {
      return await this.adapter.get<ConfigValueMap[K]>(key, defaultValue);
    } catch (error) {
      console.warn(`配置获取失败 [${key}]:`, error);
      return defaultValue;
    }
  }

  async set<K extends ConfigKey>(key: K, value: ConfigValueMap[K]): Promise<boolean> {
    try {
      await this.adapter.set<ConfigValueMap[K]>(key, value);
      return true;
    } catch (error) {
      console.error(`配置设置失败 [${key}]:`, error);
      return false;
    }
  }

  // 批量获取：传入 key->默认值 的对象，返回同 key 的结果对象
  async getBatch<K extends ConfigKey>(configs: BatchDefaults<K>): Promise<BatchDefaults<K>> {
    const results = {} as BatchDefaults<K>;
    for (const key of Object.keys(configs) as K[]) {
      results[key] = await this.get(key, configs[key]);
    }
    return results;
  }

  // 批量设置：传入部分配置，返回每个 key 是否设置成功
  async setBatch<K extends ConfigKey>(
    configs: Partial<Pick<ConfigValueMap, K>>
  ): Promise<Partial<Record<K, boolean>>> {
    const results: Partial<Record<K, boolean>> = {};
    for (const key of Object.keys(configs) as K[]) {
      const value = configs[key];
      if (value === undefined) {
        continue;
      }
      results[key] = await this.set(key, value as ConfigValueMap[K]);
    }
    return results;
  }

  async exportConfig(): Promise<string> {
    const configs = {
      AI_ACCOUNTS: (await this.get('AI_ACCOUNTS', [])) ?? [],
      CURRENT_ACCOUNT_ID: (await this.get('CURRENT_ACCOUNT_ID', '')) ?? '',
      AUTO_SUMMARIZE: (await this.get('AUTO_SUMMARIZE', false)) ?? false,
      MIN_ANSWER_LENGTH: (await this.get('MIN_ANSWER_LENGTH', 200)) ?? 200,
      SUMMARY_CACHE_SIZE: (await this.get('SUMMARY_CACHE_SIZE', 100)) ?? 100,
    };
    return JSON.stringify(configs, null, 2);
  }

  async importConfig(configJson: string): Promise<boolean> {
    try {
      const configs = JSON.parse(configJson) as Partial<ConfigValueMap>;
      await this.setBatch(configs);
      return true;
    } catch (error) {
      console.error('配置导入失败:', error);
      return false;
    }
  }

  async clearAll(): Promise<void> {
    await this.set('AI_ACCOUNTS', []);
    await this.set('CURRENT_ACCOUNT_ID', '');
    await this.set('AUTO_SUMMARIZE', false);
    await this.set('MIN_ANSWER_LENGTH', 200);
  }

  // 获取缓存的总结结果
  async getCachedSummary(key: string): Promise<CachedSummary | null> {
    const cache = await this.get('SUMMARY_CACHE', {});
    return cache[key] || null;
  }

  // 保存总结结果到缓存
  async setCachedSummary(key: string, summary: CachedSummary): Promise<void> {
    const cache = await this.get('SUMMARY_CACHE', {});
    const maxSize = await this.get('SUMMARY_CACHE_SIZE', 100);

    // 如果已存在该键，先删除（以便更新顺序）
    if (cache[key]) {
      delete cache[key];
    }

    // 添加到缓存末尾（最新）
    cache[key] = summary;

    // 超过最大数量，删除最旧的（LRU）
    const keys = Object.keys(cache);
    while (keys.length > maxSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        delete cache[oldestKey];
      }
    }

    await this.set('SUMMARY_CACHE', cache);
  }

  // 获取缓存条目数
  async getCacheCount(): Promise<number> {
    const cache = await this.get('SUMMARY_CACHE', {});
    return Object.keys(cache).length;
  }

  // 获取缓存占用空间大小
  async getCacheStorageSize(): Promise<string> {
    const cache = await this.get('SUMMARY_CACHE', {});
    const bytes = new TextEncoder().encode(JSON.stringify(cache)).length;
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }
  }

  // 根据存储限制返回建议的最大缓存条数
  // userscript: GM_setValue 单条限制 ~1MB
  // extension: chrome.storage.local 单条限制 ~10MB
  async getRecommendedCacheSize(): Promise<number> {
    return 100; // 默认 100 条足够（单条 markdown 通常几 KB）
  }

  // 清空所有缓存
  async clearCache(): Promise<void> {
    await this.set('SUMMARY_CACHE', {});
  }
}
