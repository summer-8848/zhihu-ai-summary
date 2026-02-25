import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Account } from '@zhihu-ai-summary/core';

interface ConfigModalProps {
  accounts: Account[];
  currentAccountId: string;
  onSave: (account: Account) => Promise<void>;
  onClose: () => void;
}

export function ConfigModal({ accounts, currentAccountId, onSave, onClose }: ConfigModalProps) {
  const currentAccount = accounts.find(acc => acc.id === currentAccountId) || accounts[0];

  const [formData, setFormData] = useState({
    apiKey: currentAccount?.apiKey || '',
    apiUrl: currentAccount?.apiUrl || 'https://api.openai.com/v1/chat/completions',
    model: currentAccount?.model || 'gpt-4o-mini',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!formData.apiKey || !formData.apiUrl || !formData.model) {
      setMessage({ text: '请填写完整配置', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const account: Account = {
        id: currentAccount?.id || Date.now().toString(),
        name: '默认账号',
        ...formData,
      };

      await onSave(account);
      setMessage({ text: '配置保存成功！', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({ text: '保存失败，请重试', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="zhihu-ai-modal" onClick={onClose}>
      <div className="zhihu-ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="zhihu-ai-modal-header">
          <h2 className="zhihu-ai-modal-title">配置 AI 总结</h2>
          <button className="zhihu-ai-icon-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="zhihu-ai-form-group">
            <label className="zhihu-ai-label">API Key</label>
            <input
              type="password"
              className="zhihu-ai-input"
              placeholder="输入 OpenAI API Key"
              value={formData.apiKey}
              onInput={(e) => setFormData({ ...formData, apiKey: (e.target as HTMLInputElement).value })}
            />
          </div>

          <div className="zhihu-ai-form-group">
            <label className="zhihu-ai-label">API URL</label>
            <input
              type="text"
              className="zhihu-ai-input"
              placeholder="https://api.openai.com/v1/chat/completions"
              value={formData.apiUrl}
              onInput={(e) => setFormData({ ...formData, apiUrl: (e.target as HTMLInputElement).value })}
            />
          </div>

          <div className="zhihu-ai-form-group">
            <label className="zhihu-ai-label">模型</label>
            <input
              type="text"
              className="zhihu-ai-input"
              placeholder="gpt-4o-mini"
              value={formData.model}
              onInput={(e) => setFormData({ ...formData, model: (e.target as HTMLInputElement).value })}
            />
          </div>

          {message && (
            <div
              style={{
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                background: message.type === 'success' ? '#f6ffed' : '#fff2f0',
                color: message.type === 'success' ? '#52c41a' : '#ff4d4f',
                border: `1px solid ${message.type === 'success' ? '#b7eb8f' : '#ffccc7'}`,
              }}
            >
              {message.text}
            </div>
          )}

          <button type="submit" className="zhihu-ai-btn" disabled={saving}>
            {saving ? '保存中...' : '保存配置'}
          </button>
        </form>
      </div>
    </div>
  );
}
