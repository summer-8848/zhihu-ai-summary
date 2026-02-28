import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import {
  ConfigManager,
  APIClient,
  ContentExtractor,
  MarkdownParser,
  type ExtractedContent,
} from '@zhihu-ai-summary/core';
import { ConfigModal, ConfigButton, SummaryButton, SummaryPanel } from '@zhihu-ai-summary/ui';
import '@zhihu-ai-summary/ui/src/styles.css';
import { ExtensionStorage } from './storage';

// 初始化
const storage = new ExtensionStorage();
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

// 通用的总结按钮包装组件
interface SummaryButtonWrapperProps {
  content: ExtractedContent | (() => Promise<ExtractedContent>);
  buttonClass: string;
  type: 'article' | 'question' | 'answer';
  targetElement: Element;
  authorName?: string;
  autoTrigger?: boolean;
  minLength?: number;
}

function SummaryButtonWrapper({
  content,
  buttonClass,
  type,
  targetElement,
  authorName,
  autoTrigger = false,
  minLength = 0
}: SummaryButtonWrapperProps) {
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(window.location.href);
  const [modelName, setModelName] = useState('AI');

  const handleClick = async (isManualClick: boolean = true) => {
    // 关闭已存在的面板
    setShowPanel(false);
    setMarkdown('');
    setHtml('');

    setLoading(true);
    setShowPanel(true);
    setStreaming(true);

    // 获取模型名称
    const model = apiClient['model'] || 'AI';
    setModelName(model);

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

    try {
      // 获取内容
      const extractedContent = typeof content === 'function' ? await content() : content;

      // 检查内容长度（仅对自动触发的回答）
      if (!isManualClick && type === 'answer') {
        const contentLength = extractedContent.content?.length || 0;
        if (contentLength < minLength) {
          setHtml(`<div style="color: #666; padding: 12px; text-align: center;">回答内容较短 (${contentLength} < ${minLength}字)，可手动点击AI总结按钮触发总结</div>`);
          setLoading(false);
          setStreaming(false);
          return;
        }
      }

      let fullMarkdown = '';
      const authorPrefix = (type === 'answer' && authorName) ? `**对 ${authorName} 的回答进行AI总结**\n\n` : '';

      await apiClient.streamCall(
        extractedContent,
        (chunk) => {
          fullMarkdown += chunk;
          const fullText = authorPrefix + fullMarkdown;
          setMarkdown(fullText);

          // 流式显示时使用转义的文本
          const escaped = fullText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
          setHtml(`<div style="white-space: pre-wrap;">${escaped}</div>`);
        },
        () => {
          const fullText = authorPrefix + fullMarkdown;
          setMarkdown(fullText);
          setHtml(MarkdownParser.parse(fullText));
          setLoading(false);
          setStreaming(false);
        },
        (error) => {
          setHtml(`<div class="zhihu-ai-inline-error">${error.message}</div>`);
          setLoading(false);
          setStreaming(false);
        }
      );
    } catch (error) {
      console.error('生成总结失败:', error);
      setHtml(`<div class="zhihu-ai-inline-error">${error instanceof Error ? error.message : '生成总结失败'}</div>`);
      setLoading(false);
      setStreaming(false);
    }
  };

  // 自动触发 - 使用 useEffect 确保只触发一次
  useEffect(() => {
    if (autoTrigger) {
      const timer = setTimeout(() => handleClick(false), 100);
      return () => clearTimeout(timer);
    }
  }, [autoTrigger]);

  const titleMap = {
    answer: `AI 回答总结 (${modelName})`,
    article: `AI 文章总结 (${modelName})`,
    question: `AI 问题总结 (${modelName})`
  };

  return (
    <>
      <SummaryButton
        text="AI总结"
        loading={loading}
        onClick={() => handleClick(true)}
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
          title={titleMap[type]}
          panelType={type}
          targetElement={targetElement}
        />
      )}
    </>
  );
}

// 添加总结按钮到指定元素
function addSummaryButton(
  targetElement: Element,
  content: ExtractedContent | (() => Promise<ExtractedContent>),
  buttonClass: string,
  type: 'article' | 'question' | 'answer',
  options: {
    authorName?: string;
    autoTrigger?: boolean;
    minLength?: number;
  } = {}
) {
  const container = document.createElement('span');
  container.className = `zhihu-ai-button-container ${buttonClass}-container`;
  targetElement.appendChild(container);

  render(
    <SummaryButtonWrapper
      content={content}
      buttonClass={buttonClass}
      type={type}
      targetElement={targetElement}
      authorName={options.authorName}
      autoTrigger={options.autoTrigger}
      minLength={options.minLength}
    />,
    container
  );
}

// 处理文章页面
async function handleArticlePage() {
  setTimeout(async () => {
    const authorHead = document.querySelector('.AuthorInfo-head');
    if (!authorHead || authorHead.querySelector('.zhihu-ai-summary-btn-article-container')) {
      return;
    }

    const articleContainer = document.querySelector('.Post-Row-Content') ||
                           document.querySelector('.Post-Row-Content-left') ||
                           authorHead.closest('article') ||
                           authorHead.closest('.Post-Main');

    if (articleContainer) {
      const content = ContentExtractor.extractArticle();
      const autoSummarize = await configManager.get('AUTO_SUMMARIZE', false);

      addSummaryButton(
        authorHead,
        content,
        'zhihu-ai-summary-btn-article zhihu-ai-summary-btn-answer',
        'article',
        { autoTrigger: autoSummarize }
      );
    }
  }, 1000);
}

// 处理问题页面
function handleQuestionPage() {
  setTimeout(() => {
    const titleElements = document.querySelectorAll('.QuestionHeader-title');
    const titleElement = titleElements[1];

    if (!titleElement) {
      return;
    }

    const questionContainer = document.querySelector('.QuestionHeader') ||
                            document.querySelector('.Question-mainColumn') ||
                            titleElement.closest('.QuestionHeader-content');

    if (questionContainer) {
      const titleParent = titleElement.parentElement;
      if (titleParent && !titleParent.querySelector('.zhihu-ai-summary-btn-question-container')) {
        addSummaryButton(
          titleParent,
          () => ContentExtractor.extractQuestion(),
          'zhihu-ai-summary-btn-question',
          'question'
        );
      }
    }
  }, 2000);
}

// 处理回答列表
async function handleAnswers() {
  const answers = document.querySelectorAll('.ContentItem.AnswerItem');

  const autoSummarize = await configManager.get('AUTO_SUMMARIZE', false);
  const minAnswerLength = await configManager.get('MIN_ANSWER_LENGTH', 200);

  for (let index = 0; index < answers.length; index++) {
    const answer = answers[index];

    let authorHead = answer.querySelector('.AuthorInfo-head');

    // 如果已经添加过按钮，跳过
    if (authorHead && authorHead.querySelector('.zhihu-ai-summary-btn-answer-container')) {
      continue;
    }

    // 如果没有找到，等待元素加载
    if (!authorHead) {
      try {
        authorHead = await new Promise<Element>((resolve, reject) => {
          if (answer.querySelector('.AuthorInfo-head')) {
            resolve(answer.querySelector('.AuthorInfo-head')!);
            return;
          }

          const observer = new MutationObserver(() => {
            const head = answer.querySelector('.AuthorInfo-head');
            if (head) {
              observer.disconnect();
              resolve(head);
            }
          });

          observer.observe(answer, { childList: true, subtree: true });
          setTimeout(() => {
            observer.disconnect();
            reject(new Error('Timeout'));
          }, 2000);
        });

        if (!authorHead) {
          continue;
        }
      } catch {
        continue;
      }
    }

    // 再次检查是否已经添加过按钮（可能在等待期间被添加）
    if (authorHead.querySelector('.zhihu-ai-summary-btn-answer-container')) {
      continue;
    }

    const authorLink = answer.querySelector('.AuthorInfo-head a.UserLink-link');
    const authorName = authorLink ? authorLink.textContent?.trim() : '匿名用户';

    // 添加按钮（统一处理，不管是否自动触发）
    addSummaryButton(
      authorHead,
      () => ContentExtractor.extractAnswer(answer),
      'zhihu-ai-summary-btn-answer',
      'answer',
      {
        authorName,
        autoTrigger: autoSummarize,
        minLength: minAnswerLength
      }
    );
  }
}

// 主函数
function main() {
  renderConfigButton();

  if (window.location.pathname.includes('/p/')) {
    handleArticlePage();
  } else if (window.location.pathname.includes('/question/')) {
    handleQuestionPage();
    handleAnswers();

    // 监听新回答加载 - 使用防抖避免频繁触发
    let debounceTimer: number | null = null;
    const observer = new MutationObserver(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        handleAnswers();
        debounceTimer = null;
      }, 300);
    });

    const mainColumn = document.querySelector('.Question-mainColumn');
    if (mainColumn) {
      observer.observe(mainColumn, { childList: true, subtree: true });
    }
  }
}

// 等待页面加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
