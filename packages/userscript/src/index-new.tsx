import { render, h } from 'preact';
import { useState } from 'preact/hooks';
import {
  ConfigManager,
  APIClient,
  ContentExtractor,
  MarkdownParser,
  type ExtractedContent,
} from '@zhihu-ai-summary/core';
import { SummaryButton, SummaryPanel, ConfigModal, ConfigButton } from '@zhihu-ai-summary/ui';
import { UserscriptStorage } from './storage';

// 初始化
const storage = new UserscriptStorage();
const configManager = new ConfigManager(storage);
const apiClient = new APIClient(configManager);

// 主应用组件
function App() {
  const [showConfig, setShowConfig] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState('');

  // 加载配置
  const loadConfig = async () => {
    const accs = await configManager.get('AI_ACCOUNTS', []);
    const currentId = await configManager.get('CURRENT_ACCOUNT_ID', '');
    setAccounts(accs);
    setCurrentAccountId(currentId);
  };

  // 保存配置
  const handleSaveConfig = async (account: any) => {
    await configManager.set('AI_ACCOUNTS', [account]);
    await configManager.set('CURRENT_ACCOUNT_ID', account.id);
    await apiClient.loadCurrentAccount();
    await loadConfig();
  };

  return (
    <div>
      <ConfigButton onClick={() => setShowConfig(true)} />
      {showConfig && (
        <ConfigModal
          accounts={accounts}
          currentAccountId={currentAccountId}
          onSave={handleSaveConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}

// 渲染配置按钮
function renderConfigButton() {
  const container = document.createElement('div');
  container.id = 'zhihu-ai-config-root';
  document.body.appendChild(container);
  render(<App />, container);
}

// 为文章/问题/回答添加总结按钮
function addSummaryButton(
  targetElement: Element,
  content: ExtractedContent | (() => Promise<ExtractedContent>),
  buttonClass: string
) {
  const container = document.createElement('span');
  targetElement.insertBefore(container, targetElement.firstChild);

  function SummaryButtonWrapper() {
    const [loading, setLoading] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [markdown, setMarkdown] = useState('');
    const [html, setHtml] = useState('');
    const [streaming, setStreaming] = useState(false);

    const handleClick = async () => {
      setLoading(true);
      setShowPanel(true);
      setMarkdown('');
      setHtml('');
      setStreaming(true);

      // 获取内容
      const extractedContent = typeof content === 'function' ? await content() : content;

      let fullMarkdown = '';

      await apiClient.streamCall(
        extractedContent,
        (chunk) => {
          fullMarkdown += chunk;
          setMarkdown(fullMarkdown);
          setHtml(MarkdownParser.parse(fullMarkdown));
        },
        () => {
          setLoading(false);
          setStreaming(false);
        },
        (error) => {
          setLoading(false);
          setStreaming(false);
          alert(error.message);
          setShowPanel(false);
        }
      );
    };

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <SummaryButton
          text="AI总结"
          loading={loading}
          onClick={handleClick}
          className={buttonClass}
        />
        {showPanel && (
          <SummaryPanel
            content={html}
            loading={loading}
            streaming={streaming}
            onClose={() => setShowPanel(false)}
            className="long"
          />
        )}
      </div>
    );
  }

  render(<SummaryButtonWrapper />, container);
}

// 处理文章页面
function handleArticlePage() {
  const titleActions = document.querySelector('.Post-Header .ContentItem-actions');
  if (titleActions && !titleActions.querySelector('#zhihu-ai-article-btn')) {
    const content = ContentExtractor.extractArticle();
    addSummaryButton(titleActions, content, 'zhihu-ai-summary-btn-article');
  }
}

// 处理问题页面
function handleQuestionPage() {
  const questionHeader = document.querySelector('.QuestionHeader-main');
  if (questionHeader && !questionHeader.querySelector('#zhihu-ai-question-btn')) {
    addSummaryButton(
      questionHeader,
      () => ContentExtractor.extractQuestion(),
      'zhihu-ai-summary-btn-question'
    );
  }
}

// 处理回答列表
function handleAnswers() {
  const answers = document.querySelectorAll('.List-item');
  answers.forEach((answer) => {
    const actions = answer.querySelector('.ContentItem-actions');
    if (actions && !actions.querySelector('.zhihu-ai-summary-btn-answer')) {
      addSummaryButton(
        actions,
        () => ContentExtractor.extractAnswer(answer),
        'zhihu-ai-summary-btn-answer'
      );
    }
  });
}

// 主函数
function main() {
  renderConfigButton();

  if (window.location.pathname.includes('/p/')) {
    handleArticlePage();
  } else if (window.location.pathname.includes('/question/')) {
    handleQuestionPage();
    handleAnswers();

    // 监听新回答加载
    const observer = new MutationObserver(() => {
      handleAnswers();
    });

    const answerList = document.querySelector('.List');
    if (answerList) {
      observer.observe(answerList, { childList: true, subtree: true });
    }
  }
}

// 等待页面加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
