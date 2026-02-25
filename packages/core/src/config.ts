// 存储适配器接口
export interface StorageAdapter {
  get<T>(key: string, defaultValue?: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

// 配置键类型
export type ConfigKey = 'AI_ACCOUNTS' | 'CURRENT_ACCOUNT_ID' | 'AUTO_SUMMARIZE' | 'MIN_ANSWER_LENGTH';

// 账号配置
export interface Account {
  id: string;
  name: string;
  apiKey: string;
  apiUrl: string;
  model: string;
}

// 配置管理器
export class ConfigManager {
  constructor(private storage: StorageAdapter) {}

  async get<T>(key: ConfigKey, defaultValue?: T): Promise<T> {
    try {
      return await this.storage.get(key, defaultValue);
    } catch (error) {
      console.warn(`配置获取失败 [${key}]:`, error);
      return defaultValue as T;
    }
  }

  async set<T>(key: ConfigKey, value: T): Promise<boolean> {
    try {
      await this.storage.set(key, value);
      return true;
    } catch (error) {
      console.error(`配置设置失败 [${key}]:`, error);
      return false;
    }
  }

  async getBatch(configs: Record<ConfigKey, any>): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    for (const [key, defaultValue] of Object.entries(configs)) {
      results[key] = await this.get(key as ConfigKey, defaultValue);
    }
    return results;
  }

  async setBatch(configs: Record<ConfigKey, any>): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(configs)) {
      results[key] = await this.set(key as ConfigKey, value);
    }
    return results;
  }

  async exportConfig(): Promise<string> {
    const configs = {
      AI_ACCOUNTS: await this.get('AI_ACCOUNTS', []),
      CURRENT_ACCOUNT_ID: await this.get('CURRENT_ACCOUNT_ID', ''),
      AUTO_SUMMARIZE: await this.get('AUTO_SUMMARIZE', false),
      MIN_ANSWER_LENGTH: await this.get('MIN_ANSWER_LENGTH', 200),
    };
    return JSON.stringify(configs, null, 2);
  }

  async importConfig(configJson: string): Promise<boolean> {
    try {
      const configs = JSON.parse(configJson);
      await this.setBatch(configs);
      return true;
    } catch (error) {
      console.error('配置导入失败:', error);
      return false;
    }
  }

  async clearAll(): Promise<void> {
    const keys: ConfigKey[] = ['AI_ACCOUNTS', 'CURRENT_ACCOUNT_ID', 'AUTO_SUMMARIZE', 'MIN_ANSWER_LENGTH'];
    for (const key of keys) {
      await this.set(key, null as any);
    }
  }
}
