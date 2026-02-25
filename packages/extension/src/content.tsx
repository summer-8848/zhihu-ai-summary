import { render, h } from 'preact';
import { useState } from 'preact/hooks';
import {
  ConfigManager,
  APIClient,
  ContentExtractor,
  MarkdownParser,
  type ExtractedContent,
} from '@zhihu-ai-summary/core';
import { ConfigModal, ConfigButton } from '@zhihu-ai-summary/ui';
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

// 创建结果容器
function createResultContainer(type: string, insertTarget: Element | null = null) {
  const container = document.createElement('div');
  const modelName = apiClient['model'] || 'AI';
  const titleMap = {
    answer: `AI 回答总结 (${modelName})`,
    article: `AI 文章总结 (${modelName})`,
    question: `AI 问题总结 (${modelName})`
  };

  container.className = 'zhihu-ai-answer-result';
  (container as any)._isComplete = false;
  (container as any)._rawContent = '';
  (container as any)._copyUrl = window.location.href;

  // 对于回答类型，尝试获取具体回答的URL
  if (type === 'answer' && insertTarget) {
    const answerItem = insertTarget.closest('.ContentItem.AnswerItem');
    if (answerItem) {
      const metaUrls = answerItem.querySelectorAll('meta[itemprop="url"]');
      const metaUrl = metaUrls.length > 1 ? metaUrls[1] : null;
      if (metaUrl && (metaUrl as HTMLMetaElement).content && (metaUrl as HTMLMetaElement).content.includes('/answer/')) {
        (container as any)._copyUrl = (metaUrl as HTMLMetaElement).content;
      }
    }
  }

  container.innerHTML = `
    <div class="zhihu-ai-answer-result-header">
      <svg viewBox="0 0 1024 1024" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/><path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0z m72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/></svg>
      <span class="zhihu-ai-result-title">${titleMap[type]}</span>
      <div class="zhihu-ai-result-actions">
        <button class="zhihu-ai-result-copy" title="请等待AI总结完成后再复制" disabled>📋</button>
        <button class="zhihu-ai-answer-result-close" title="关闭">×</button>
      </div>
    </div>
    <div class="zhihu-ai-answer-result-body">
      <div class="zhihu-ai-inline-loading"><div class="zhihu-ai-inline-spinner"></div><span>AI正在分析内容，请稍候...</span></div>
    </div>
  `;

  container.querySelector('.zhihu-ai-answer-result-close')!.addEventListener('click', () => {
    const panel = container.closest('.zhihu-ai-side-panel');
    if (panel) panel.remove();
  });

  container.querySelector('.zhihu-ai-result-copy')!.addEventListener('click', async () => {
    if (!(container as any)._isComplete || !(container as any)._rawContent) {
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleString('zh-CN', { hour12: false });
    const copyText = `${(container as any)._rawContent}\n\n---\n**来源**: ${(container as any)._copyUrl}\n**生成时间**: ${timestamp}`;

    try {
      await navigator.clipboard.writeText(copyText);
      const btn = container.querySelector('.zhihu-ai-result-copy') as HTMLButtonElement;
      btn.textContent = '✅';
      setTimeout(() => {
        btn.textContent = '📋';
      }, 1500);
    } catch (err) {
      console.error('复制失败:', err);
    }
  });

  return container;
}

// 创建侧边面板
function createAnswerSidePanel(container: HTMLElement, answerElement: Element, panelType: string = 'answer') {
  const panel = document.createElement('div');
  panel.className = 'zhihu-ai-side-panel';
  panel.appendChild(container);

  if (panelType === 'question') {
    panel.classList.add('question-fixed');
    document.body.appendChild(panel);
  } else {
    const elem = answerElement as HTMLElement;
    if (!elem.style.position || elem.style.position === 'static') {
      elem.style.position = 'relative';
    }

    const elementHeight = elem.offsetHeight;
    const minPanelHeight = window.innerHeight * 0.15;
    const maxPanelHeight = window.innerHeight - 90;

    if (elementHeight < maxPanelHeight) {
      panel.classList.add('short');
      const panelHeight = Math.max(minPanelHeight, elementHeight);
      panel.style.height = 'auto';
      panel.style.maxHeight = `${panelHeight}px`;
    } else {
      panel.classList.add('long');
    }

    elem.appendChild(panel);

    if (panelType === 'article') {
      panel.style.top = '0';
      panel.style.left = '67%';
    }
  }

  return panel;
}

// 显示总结
async function showInlineSummary(
  content: ExtractedContent,
  type: string,
  insertTarget: Element,
  authorName?: string
) {
  const container = createResultContainer(type, insertTarget);
  createAnswerSidePanel(container, insertTarget, type);

  const body = container.querySelector('.zhihu-ai-answer-result-body') as HTMLElement;
  let accumulated = '';

  const authorPrefix = (type === 'answer' && authorName) ? `**对 ${authorName} 的回答进行AI总结**\n\n` : '';

  return new Promise<void>((resolve, reject) => {
    apiClient.streamCall(
      content,
      (chunk) => {
        accumulated += chunk;
        const fullText = authorPrefix + accumulated;
        const escaped = fullText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        body.innerHTML = `<div style="white-space: pre-wrap;">${escaped}<span class="zhihu-ai-streaming-cursor"></span></div>`;
      },
      () => {
        const fullText = authorPrefix + accumulated;
        (container as any)._rawContent = fullText;
        (container as any)._isComplete = true;
        body.innerHTML = MarkdownParser.parse(fullText);

        const copyBtn = container.querySelector('.zhihu-ai-result-copy') as HTMLButtonElement;
        copyBtn.disabled = false;
        copyBtn.title = '复制Markdown格式';
        resolve();
      },
      (error) => {
        body.innerHTML = `<div class="zhihu-ai-inline-error">${error.message}</div>`;
        (container as any)._rawContent = '';
        (container as any)._isComplete = true;
        reject(error);
      }
    );
  });
}

// 创建按钮
function createButton(onClick: () => void) {
  const button = document.createElement('button');
  button.className = 'zhihu-ai-summary-btn';
  button.innerHTML = `
    <svg class="icon" viewBox="0 0 1024 1024" fill="currentColor">
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
      <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0z m72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/>
    </svg>
    AI总结
  `;
  button.addEventListener('click', onClick);
  return button;
}

// 处理文章页面
async function handleArticlePage() {
  setTimeout(async () => {
    if (document.querySelector('.zhihu-ai-summary-btn-article')) return;
    const authorHead = document.querySelector('.AuthorInfo-head');
    console.log('Article page - authorHead:', authorHead);
    if (!authorHead) return;

    const button = createButton(async () => {
      const existingPanel = document.querySelector('.zhihu-ai-side-panel');
      if (existingPanel) existingPanel.remove();

      button.classList.add('loading');

      try {
        const content = ContentExtractor.extractArticle();
        const articleContainer = document.querySelector('.Post-Row-Content') ||
                               document.querySelector('.Post-Row-Content-left') ||
                               authorHead.closest('article') ||
                               authorHead.closest('.Post-Main');

        if (articleContainer) {
          await showInlineSummary(content, 'article', articleContainer);
        }
      } catch (error) {
        console.error('生成文章总结失败:', error);
      } finally {
        button.classList.remove('loading');
      }
    });

    button.classList.add('zhihu-ai-summary-btn-article', 'zhihu-ai-summary-btn-answer');
    authorHead.appendChild(button);

    const autoSummarize = await configManager.get('AUTO_SUMMARIZE', false);
    if (autoSummarize) {
      setTimeout(() => button.click(), 500);
    }
  }, 1000);
}

// 处理问题页面
function handleQuestionPage() {
  setTimeout(() => {
    const titleElements = document.querySelectorAll('.QuestionHeader-title');
    const titleElement = titleElements[1];

    if (!titleElement || document.querySelector('.zhihu-ai-summary-btn-question')) return;

    const questionContainer = document.querySelector('.QuestionHeader') ||
                            document.querySelector('.Question-mainColumn') ||
                            titleElement.closest('.QuestionHeader-content');

    if (questionContainer) {
      const button = createButton(async () => {
        const existingPanel = document.querySelector('.zhihu-ai-side-panel.question-fixed');
        if (existingPanel) existingPanel.remove();

        button.classList.add('loading');

        try {
          const content = await ContentExtractor.extractQuestion();
          await showInlineSummary(content, 'question', questionContainer);
        } catch (error) {
          console.error('生成问题总结失败:', error);
        } finally {
          button.classList.remove('loading');
        }
      });

      button.classList.add('zhihu-ai-summary-btn-question');
      const titleParent = titleElement.parentElement;
      if (titleParent) {
        titleParent.insertBefore(button, titleElement);
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

    if (answer.querySelector('.zhihu-ai-summary-btn-answer')) {
      continue;
    }

    let authorHead = answer.querySelector('.AuthorInfo-head');

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
      } catch (error) {
        continue;
      }
    }

    const authorLink = answer.querySelector('.AuthorInfo-head a.UserLink-link');
    const authorName = authorLink ? authorLink.textContent?.trim() : '匿名用户';

    const button = createButton(async (event?: Event) => {
      const isManualClick = event && (event as any).isTrusted !== false;

      const existingPanel = answer.querySelector('.zhihu-ai-side-panel');
      if (existingPanel) existingPanel.remove();

      button.classList.add('loading');

      try {
        const content = await ContentExtractor.extractAnswer(answer);

        // 检查内容长度
        const contentLength = content.content?.length || 0;

        if (!isManualClick && contentLength < minAnswerLength) {
          // 显示提示信息而不是静默跳过
          const container = createResultContainer('answer', answer);
          createAnswerSidePanel(container, answer, 'answer');
          const body = container.querySelector('.zhihu-ai-answer-result-body') as HTMLElement;
          body.innerHTML = `<div style="color: #666; padding: 12px; text-align: center;">回答内容较短 (${contentLength} < ${minAnswerLength}字)，可手动点击AI总结按钮触发总结</div>`;
          button.classList.remove('loading');
          return;
        }

        await showInlineSummary(content, 'answer', answer, authorName);
      } catch (error) {
        console.error('生成总结失败:', error);
      } finally {
        button.classList.remove('loading');
      }
    });

    button.classList.add('zhihu-ai-summary-btn-answer');
    authorHead.appendChild(button);

    // 自动总结
    if (autoSummarize) {
      const delay = 1000 + index * 500;
      setTimeout(() => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          isTrusted: false
        });
        button.dispatchEvent(clickEvent);
      }, delay);
    }
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
