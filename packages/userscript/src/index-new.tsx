import { render, h } from 'preact';
import { useState } from 'preact/hooks';
import {
  ConfigManager,
  APIClient,
  ContentExtractor,
  MarkdownParser,
  type ExtractedContent,
} from '@zhihu-ai-summary/core';
import { SummaryButton, SummaryPanel, ConfigModal, ConfigButton, toast } from '@zhihu-ai-summary/ui';
import '@zhihu-ai-summary/ui/src/styles.css';
import { UserscriptStorage } from './storage';

// 初始化
const storage = new UserscriptStorage();
const configManager = new ConfigManager(storage);
const apiClient = new APIClient(configManager);

// 主应用组件
function App() {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div>
      <ConfigButton onClick={() => setShowConfig(true)} />
      {showConfig && (
        <ConfigModal
          configManager={configManager}
          apiClient={apiClient}
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
  buttonClass: string,
  type: 'article' | 'question' | 'answer' = 'answer'
) {
  const container = document.createElement('span');
  targetElement.insertBefore(container, targetElement.firstChild);

  function SummaryButtonWrapper() {
    const [loading, setLoading] = useState(false);
    const [showPanel, setShowPanel] = useState(false);
    const [markdown, setMarkdown] = useState('');
    const [html, setHtml] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [sourceUrl, setSourceUrl] = useState(window.location.href);

    const handleClick = async () => {
      setLoading(true);
      setShowPanel(true);
      setMarkdown('');
      setHtml('');
      setStreaming(true);

      // 获取回答的URL（如果是回答类型）
      if (type === 'answer') {
        const answerItem = targetElement.closest('.ContentItem.AnswerItem');
        if (answerItem) {
          const metaUrls = answerItem.querySelectorAll('meta[itemprop="url"]');
          const metaUrl = metaUrls.length > 1 ? metaUrls[1] : null;
          if (metaUrl && (metaUrl as HTMLMetaElement).content && (metaUrl as HTMLMetaElement).content.includes('/answer/')) {
            setSourceUrl((metaUrl as HTMLMetaElement).content);
          }
        }
      }

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
          toast.error(error.message);
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
            markdown={markdown}
            sourceUrl={sourceUrl}
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
    addSummaryButton(titleActions, content, 'zhihu-ai-summary-btn-article', 'article');
  }
}

// 处理问题页面
function handleQuestionPage() {
  const questionHeader = document.querySelector('.QuestionHeader-main');
  if (questionHeader && !questionHeader.querySelector('#zhihu-ai-question-btn')) {
    addSummaryButton(
      questionHeader,
      () => ContentExtractor.extractQuestion(),
      'zhihu-ai-summary-btn-question',
      'question'
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
        'zhihu-ai-summary-btn-answer',
        'answer'
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
