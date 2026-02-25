import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import type { Account, ConfigManager, APIClient } from '@zhihu-ai-summary/core';
import { toast } from './Toast';
import { InputModal } from './InputModal';

interface ConfigModalProps {
  configManager: ConfigManager;
  apiClient: APIClient;
  onClose: () => void;
}

type TabType = 'accounts' | 'settings';

export function ConfigModal({ configManager, apiClient, onClose }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string>('');
  const [autoSummarize, setAutoSummarize] = useState(false);
  const [minAnswerLength, setMinAnswerLength] = useState(200);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [copyingAccountId, setCopyingAccountId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const accs = await configManager.get('AI_ACCOUNTS', []);
    const currentId = await configManager.get('CURRENT_ACCOUNT_ID', '');
    const autoSum = await configManager.get('AUTO_SUMMARIZE', false);
    const minLen = await configManager.get('MIN_ANSWER_LENGTH', 200);

    setAccounts(accs);
    setCurrentAccountId(currentId);
    setAutoSummarize(autoSum);
    setMinAnswerLength(minLen);
  };

  const handleSelectAccount = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    await configManager.set('CURRENT_ACCOUNT_ID', accountId);
    await apiClient.loadCurrentAccount();
    setCurrentAccountId(accountId);
    if (account) {
      toast.success(`已切换到账号：${account.name}`);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('确定要删除这个账号吗？')) return;

    const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
    await configManager.set('AI_ACCOUNTS', filteredAccounts);

    if (accountId === currentAccountId) {
      const newCurrentId = filteredAccounts[0]?.id || '';
      await configManager.set('CURRENT_ACCOUNT_ID', newCurrentId);
      await apiClient.loadCurrentAccount();
      setCurrentAccountId(newCurrentId);
    }

    setAccounts(filteredAccounts);
  };

  const handleSaveSettings = async () => {
    await configManager.set('AUTO_SUMMARIZE', autoSummarize);
    await configManager.set('MIN_ANSWER_LENGTH', minAnswerLength);
    toast.success('设置已保存！');
  };

  const handleExportConfig = async () => {
    try {
      const configJson = await configManager.exportConfig();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(configJson);
        toast.success('配置已复制到剪贴板！');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = configJson;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success('配置已复制到剪贴板！');
      }
    } catch (error) {
      console.error('复制配置失败:', error);
      toast.error('复制配置失败');
    }
  };

  const handleImportConfig = async (configJson: string) => {
    try {
      const config = JSON.parse(configJson);

      if (!config.AI_ACCOUNTS || !Array.isArray(config.AI_ACCOUNTS)) {
        throw new Error('配置格式错误：缺少有效的账号列表');
      }

      for (const account of config.AI_ACCOUNTS) {
        if (!account.id || !account.name || !account.apiUrl || !account.apiKey || !account.model) {
          throw new Error('配置格式错误：账号信息不完整');
        }
      }

      if (confirm('导入配置将覆盖现有设置，确定要继续吗？')) {
        const success = await configManager.importConfig(configJson);

        if (success) {
          await apiClient.loadCurrentAccount();
          await loadConfig();
          toast.success('配置导入成功！');
        } else {
          toast.error('配置导入失败');
        }
      }
    } catch (error) {
      console.error('导入配置失败:', error);
      toast.error('配置格式错误，请检查JSON格式是否正确');
    }
  };

  return (
    <>
      <div className="zhihu-ai-modal" onClick={onClose}>
        <div className="zhihu-ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="zhihu-ai-modal-header">
          <div className="zhihu-ai-modal-title">
            <svg width="24" height="24" viewBox="0 0 1024 1024" fill="#667eea">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
              <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0z m72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/>
            </svg>
            配置 OpenAI API
          </div>
          <button className="zhihu-ai-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="zhihu-ai-modal-body">
          <div className="zhihu-ai-tabs">
            <div
              className={`zhihu-ai-tab ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              账号管理
            </div>
            <div
              className={`zhihu-ai-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              基础设置
            </div>
          </div>

          {activeTab === 'accounts' && (
            <div className="zhihu-ai-tab-content active">
              <div className="zhihu-ai-account-list">
                {accounts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                    暂无账号，请添加新账号
                  </div>
                ) : (
                  accounts.map(account => (
                    <div
                      key={account.id}
                      className={`zhihu-ai-account-item ${account.id === currentAccountId ? 'active' : ''}`}
                      onClick={() => handleSelectAccount(account.id)}
                    >
                      <div className="zhihu-ai-account-info">
                        <div className="zhihu-ai-account-name">{account.name}</div>
                        <div className="zhihu-ai-account-detail">
                          {account.model} • {account.apiUrl.length > 40 ? account.apiUrl.substring(0, 40) + '...' : account.apiUrl}
                        </div>
                      </div>
                      <div className="zhihu-ai-account-actions">
                        <button
                          className="zhihu-ai-account-btn zhihu-ai-account-btn-copy"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCopyingAccountId(account.id);
                            setShowAccountForm(true);
                          }}
                        >
                          复制
                        </button>
                        <button
                          className="zhihu-ai-account-btn zhihu-ai-account-btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAccountId(account.id);
                            setShowAccountForm(true);
                          }}
                        >
                          编辑
                        </button>
                        <button
                          className="zhihu-ai-account-btn zhihu-ai-account-btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(account.id);
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                className="zhihu-ai-add-account-btn"
                onClick={() => {
                  setEditingAccountId(null);
                  setCopyingAccountId(null);
                  setShowAccountForm(true);
                }}
              >
                + 添加新账号
              </button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="zhihu-ai-tab-content active">
              <div className="zhihu-ai-config-panel">
                <div className="zhihu-ai-config-item">
                  <label className="zhihu-ai-config-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoSummarize}
                      onChange={(e) => setAutoSummarize((e.target as HTMLInputElement).checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>自动总结(页面加载后自动调用AI总结文章和问题中的各个回答)</span>
                  </label>
                </div>
                <div className="zhihu-ai-config-item">
                  <label className="zhihu-ai-config-label">回答最少字数:</label>
                  <input
                    type="number"
                    className="zhihu-ai-config-input"
                    value={minAnswerLength}
                    min="0"
                    placeholder="200"
                    style={{ width: '100%' }}
                    onInput={(e) => setMinAnswerLength(parseInt((e.target as HTMLInputElement).value) || 200)}
                  />
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                    回答字数少于此值时,不自动总结,仅显示提示信息(手动点击仍可总结)
                  </div>
                </div>
                <div className="zhihu-ai-config-item">
                  <div className="zhihu-ai-config-btn-group">
                    <button
                      className="zhihu-ai-config-btn-half zhihu-ai-config-btn-secondary"
                      onClick={handleExportConfig}
                    >
                      📋 复制配置
                    </button>
                    <button
                      className="zhihu-ai-config-btn-half zhihu-ai-config-btn-warning"
                      onClick={() => setShowImportModal(true)}
                    >
                      📥 导入配置
                    </button>
                  </div>
                </div>
                <div className="zhihu-ai-config-item">
                  <button className="zhihu-ai-config-save" onClick={handleSaveSettings}>
                    保存设置
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {showAccountForm && (
      <AccountFormModal
        configManager={configManager}
        apiClient={apiClient}
        accounts={accounts}
        editingAccountId={editingAccountId}
        copyingAccountId={copyingAccountId}
        onClose={() => {
          setShowAccountForm(false);
          setEditingAccountId(null);
          setCopyingAccountId(null);
        }}
        onSave={async () => {
          await loadConfig();
          setShowAccountForm(false);
          setEditingAccountId(null);
          setCopyingAccountId(null);
        }}
      />
    )}

    {showImportModal && (
      <InputModal
        title="导入配置"
        placeholder="请粘贴配置 JSON..."
        multiline={true}
        rows={15}
        onConfirm={(value) => {
          setShowImportModal(false);
          handleImportConfig(value);
        }}
        onCancel={() => setShowImportModal(false)}
      />
    )}
  </>
  );
}

interface AccountFormModalProps {
  configManager: ConfigManager;
  apiClient: APIClient;
  accounts: Account[];
  editingAccountId: string | null;
  copyingAccountId: string | null;
  onClose: () => void;
  onSave: () => Promise<void>;
}

function AccountFormModal({
  configManager,
  apiClient,
  accounts,
  editingAccountId,
  copyingAccountId,
  onClose,
  onSave,
}: AccountFormModalProps) {
  const sourceAccount = copyingAccountId
    ? accounts.find(acc => acc.id === copyingAccountId)
    : editingAccountId
    ? accounts.find(acc => acc.id === editingAccountId)
    : null;

  const [formData, setFormData] = useState({
    name: copyingAccountId && sourceAccount ? `${sourceAccount.name} (副本)` : sourceAccount?.name || '',
    apiUrl: sourceAccount?.apiUrl || '',
    apiKey: sourceAccount?.apiKey || '',
    model: sourceAccount?.model || '',
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!formData.apiUrl || !formData.apiKey || !formData.model) {
      setTestResult({ success: false, message: '请填写完整信息' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await apiClient.testConnection(formData.apiKey, formData.apiUrl, formData.model);

    setTesting(false);
    setTestResult(result);
  };

  const handleSave = async () => {
    if (!formData.apiUrl || !formData.apiKey || !formData.model) {
      toast.warning('请填写完整的账号信息');
      return;
    }

    const allAccounts = await configManager.get('AI_ACCOUNTS', []);

    if (editingAccountId) {
      const index = allAccounts.findIndex(acc => acc.id === editingAccountId);
      if (index !== -1) {
        allAccounts[index] = {
          id: editingAccountId,
          name: formData.name || formData.apiUrl,
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey,
          model: formData.model,
        };
      }
    } else {
      const newAccount: Account = {
        id: Date.now().toString(),
        name: formData.name || formData.apiUrl,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
        model: formData.model,
      };
      allAccounts.push(newAccount);

      if (!editingAccountId) {
        await configManager.set('CURRENT_ACCOUNT_ID', newAccount.id);
      }
    }

    await configManager.set('AI_ACCOUNTS', allAccounts);
    await apiClient.loadCurrentAccount();
    await onSave();
  };

  const title = copyingAccountId ? '复制账号' : editingAccountId ? '编辑账号' : '添加账号';
  const saveButtonText = editingAccountId ? '保存修改' : '添加账号';

  return (
    <div className="zhihu-ai-modal" style={{ zIndex: 10001 }} onClick={onClose}>
      <div className="zhihu-ai-modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="zhihu-ai-modal-header">
          <div className="zhihu-ai-modal-title">{title}</div>
          <button className="zhihu-ai-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="zhihu-ai-modal-body">
          <div className="zhihu-ai-config-panel">
            <div className="zhihu-ai-config-item">
              <label className="zhihu-ai-config-label">备注名称:</label>
              <input
                type="text"
                className="zhihu-ai-config-input"
                value={formData.name}
                placeholder="默认使用API地址"
                onInput={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
              />
            </div>
            <div className="zhihu-ai-config-item">
              <label className="zhihu-ai-config-label">API接口地址:</label>
              <input
                type="text"
                className="zhihu-ai-config-input"
                value={formData.apiUrl}
                placeholder="https://api.openai.com/v1/chat/completions"
                onInput={(e) => setFormData({ ...formData, apiUrl: (e.target as HTMLInputElement).value })}
              />
            </div>
            <div className="zhihu-ai-config-item">
              <label className="zhihu-ai-config-label">API Key:</label>
              <input
                type="password"
                className="zhihu-ai-config-input"
                value={formData.apiKey}
                placeholder="sk-..."
                onInput={(e) => setFormData({ ...formData, apiKey: (e.target as HTMLInputElement).value })}
              />
            </div>
            <div className="zhihu-ai-config-item">
              <label className="zhihu-ai-config-label">模型名称:</label>
              <input
                type="text"
                className="zhihu-ai-config-input"
                value={formData.model}
                placeholder="gpt-4o-mini"
                onInput={(e) => setFormData({ ...formData, model: (e.target as HTMLInputElement).value })}
              />
            </div>
            {testResult && (
              <div className={`zhihu-ai-test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? '✓' : '✗'} {testResult.message}
              </div>
            )}
            {testing && (
              <div className="zhihu-ai-test-result" style={{ background: '#f0f0f0', border: '1px solid #d9d9d9', color: '#666' }}>
                正在测试连接...
              </div>
            )}
            <div className="zhihu-ai-config-btn-group">
              <button
                className="zhihu-ai-config-btn-half zhihu-ai-config-test zhihu-ai-config-btn-secondary"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
              <button
                className="zhihu-ai-config-btn-half zhihu-ai-config-save"
                onClick={handleSave}
              >
                {saveButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
