import { ConfigManager } from '@zhihu-ai-summary/core';
import { ExtensionStorage } from './storage';

const storage = new ExtensionStorage();
const configManager = new ConfigManager(storage);

// 初始化 popup 页面
async function initPopup() {
  const app = document.getElementById('app');
  if (!app) {return;}

  const accounts = await configManager.get('AI_ACCOUNTS', []);
  const currentAccountId = await configManager.get('CURRENT_ACCOUNT_ID', '');

  app.innerHTML = `
    <div style="width: 400px; padding: 20px; font-family: sans-serif;">
      <h2 style="margin: 0 0 20px 0; color: #667eea;">知乎AI总结助手</h2>

      <div style="margin-bottom: 20px;">
        <p style="color: #666; font-size: 14px;">
          当前账号: ${accounts.length > 0 ? '已配置' : '未配置'}
        </p>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">API Key</label>
        <input type="password" id="apiKey" placeholder="输入 OpenAI API Key"
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">API URL</label>
        <input type="text" id="apiUrl" value="https://api.openai.com/v1/chat/completions"
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">模型</label>
        <input type="text" id="model" value="gpt-4o-mini"
          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      </div>

      <button id="saveBtn" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500;">
        保存配置
      </button>

      <div id="message" style="margin-top: 12px; padding: 8px; border-radius: 4px; display: none;"></div>
    </div>
  `;

  // 加载当前配置
  if (accounts.length > 0) {
    const currentAccount = accounts.find((acc: any) => acc.id === currentAccountId) || accounts[0];
    if (currentAccount) {
      (document.getElementById('apiKey') as HTMLInputElement).value = currentAccount.apiKey;
      (document.getElementById('apiUrl') as HTMLInputElement).value = currentAccount.apiUrl;
      (document.getElementById('model') as HTMLInputElement).value = currentAccount.model;
    }
  }

  // 保存配置
  document.getElementById('saveBtn')?.addEventListener('click', async () => {
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
    const apiUrl = (document.getElementById('apiUrl') as HTMLInputElement).value;
    const model = (document.getElementById('model') as HTMLInputElement).value;

    if (!apiKey || !apiUrl || !model) {
      showMessage('请填写完整配置', 'error');
      return;
    }

    const accountId = Date.now().toString();
    const newAccount = {
      id: accountId,
      name: '默认账号',
      apiKey,
      apiUrl,
      model,
    };

    await configManager.set('AI_ACCOUNTS', [newAccount]);
    await configManager.set('CURRENT_ACCOUNT_ID', accountId);

    showMessage('配置保存成功！', 'success');
  });
}

function showMessage(text: string, type: 'success' | 'error') {
  const message = document.getElementById('message');
  if (!message) {return;}

  message.textContent = text;
  message.style.display = 'block';
  message.style.background = type === 'success' ? '#f6ffed' : '#fff2f0';
  message.style.color = type === 'success' ? '#52c41a' : '#ff4d4f';
  message.style.border = `1px solid ${type === 'success' ? '#b7eb8f' : '#ffccc7'}`;

  setTimeout(() => {
    message.style.display = 'none';
  }, 3000);
}

initPopup();
