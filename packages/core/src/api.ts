import type { ConfigManager } from './config';
import type { ExtractedContent, ArticleContent, QuestionContent, AnswerContent } from './extractor';

export interface APIResponse {
  success: boolean;
  message: string;
}

export class APIClient {
  private apiKey: string = '';
  private apiUrl: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-4o-mini';
  private maxTokens: number = 0;

  // Expose model property for UI components
  get modelName(): string {
    return this.model;
  }

  constructor(private configManager: ConfigManager) {
    this.loadCurrentAccount();
  }

  async loadCurrentAccount(): Promise<void> {
    const accounts = (await this.configManager.get('AI_ACCOUNTS', [])) ?? [];
    const currentAccountId = (await this.configManager.get('CURRENT_ACCOUNT_ID', '')) ?? '';

    if (accounts.length === 0) {
      this.apiKey = '';
      this.apiUrl = 'https://api.openai.com/v1/chat/completions';
      this.model = 'gpt-4o-mini';
    } else {
      const currentAccount = accounts.find((acc) => acc.id === currentAccountId) || accounts[0];
      if (currentAccount) {
        this.apiKey = currentAccount.apiKey;
        this.apiUrl = currentAccount.apiUrl;
        this.model = currentAccount.model;
        if (!currentAccountId) {
          await this.configManager.set('CURRENT_ACCOUNT_ID', currentAccount.id);
        }
      }
    }
    this.maxTokens = 0;
  }

  private generatePrompt(content: ExtractedContent): string {
    if (content.type === 'article') {
      const article = content as ArticleContent;
      return `请对以下知乎文章进行总结，提取关键信息和要点：\n\n标题：${article.title}\n\n内容：${article.content.substring(0, 3000)}\n\n要求：\n- 使用清晰的分段和标题\n- 关键点用列表形式展示\n- 避免使用表格`;
    }
    if (content.type === 'question') {
      const question = content as QuestionContent;
      return `请详细总结以下知乎问题：\n\n问题：${question.title}\n\n描述：${question.content.substring(0, 3000)}\n\n请从以下方面进行总结：\n1. **核心疑问**：用1-2句话说明提问者的主要困惑或需求\n2. **背景信息**：列出问题中提到的关键背景、场景或前提条件\n3. **具体诉求**：提问者希望得到什么样的答案或建议\n\n要求：\n- 信息要具体完整，不要遗漏重要细节\n- 使用清晰的标题和列表展示\n- 避免使用表格`;
    }
    const answer = content as AnswerContent;
    return `请基于以下知乎问题，详细分析该回答：\n\n【问题】\n标题：${answer.questionTitle}\n描述：${answer.questionDesc}\n\n【回答】\n作者：${answer.author}\n内容：${answer.content.substring(0, 3000)}\n\n请从以下方面进行分析：\n1. **核心观点**：总结回答的主要论点和结论（2-3句话）\n2. **关键论据**：列出回答中的重要依据、数据、案例或事实（至少3点）\n3. **实用建议**：如果回答中有具体建议或方法，请明确列出\n4. **价值评估**：简短评价该回答是否切题、论据是否充分、是否有实用价值（1-2句话）\n\n要求：\n- 提取的信息要具体完整，保留关键数据和细节\n- 用清晰的格式输出，使用标题和列表\n- 避免使用表格`;
  }

  async testConnection(apiKey: string, apiUrl: string, model: string): Promise<APIResponse> {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: '测试连接' }],
          max_tokens: 10,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      await response.json();
      return { success: true, message: '连接成功！API配置正确。' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: errorMessage.includes('Failed to fetch')
          ? '连接失败：无法访问API接口，请检查网络连接和接口地址'
          : `连接失败：${errorMessage}`,
      };
    }
  }

  async streamCall(
    content: ExtractedContent,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!this.apiKey) {
      onError(new Error('请先配置OpenAI API Key！点击右下角设置按钮进行配置。'));
      return;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                '你是一个专业的内容总结助手，擅长提取关键信息并进行简洁准确的总结。请使用清晰的Markdown格式，优先使用列表、标题和段落，避免使用表格，保持输出简洁易读。',
            },
            { role: 'user', content: this.generatePrompt(content) },
          ],
          max_tokens: this.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {break;}

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content || '';
              if (text) {
                onChunk(text);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error(String(error));
      onError(typedError);
    }
  }
}
