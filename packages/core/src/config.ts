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

// 配置键到值的映射（用于强类型 get/set）
export interface ConfigValueMap {
  AI_ACCOUNTS: Account[];
  CURRENT_ACCOUNT_ID: string;
  AUTO_SUMMARIZE: boolean;
  MIN_ANSWER_LENGTH: number;
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
    const configs: ConfigValueMap = {
      AI_ACCOUNTS: (await this.get('AI_ACCOUNTS', [])) ?? [],
      CURRENT_ACCOUNT_ID: (await this.get('CURRENT_ACCOUNT_ID', '')) ?? '',
      AUTO_SUMMARIZE: (await this.get('AUTO_SUMMARIZE', false)) ?? false,
      MIN_ANSWER_LENGTH: (await this.get('MIN_ANSWER_LENGTH', 200)) ?? 200,
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
}
