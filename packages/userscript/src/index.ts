import {
  ConfigManager,
  APIClient,
  ContentExtractor,
  MarkdownParser,
  STYLES,
} from '@zhihu-ai-summary/core';
import { UserscriptStorage } from './storage';

// 初始化
const storage = new UserscriptStorage();
const configManager = new ConfigManager(storage);
const apiClient = new APIClient(configManager);

// 注入样式
function injectStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = STYLES;
  document.head.appendChild(styleElement);
}

// 创建总结按钮
function createSummaryButton(text: string, className: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `zhihu-ai-summary-btn ${className}`;
  button.innerHTML = `
    <svg class="icon" viewBox="0 0 1024 1024" fill="currentColor">
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
      <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/>
    </svg>
    ${text}
  `;
  return button;
}

// 显示总结结果
function showSummaryResult(container: HTMLElement, markdown: string) {
  const html = MarkdownParser.parse(markdown);
  const resultDiv = document.createElement('div');
  resultDiv.className = 'zhihu-ai-side-panel long';
  resultDiv.innerHTML = `
    <div class="zhihu-ai-answer-result">
      <div class="zhihu-ai-answer-result-header">
        <svg viewBox="0 0 1024 1024" fill="currentColor">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z"/>
        </svg>
        AI总结
        <div class="zhihu-ai-result-actions">
          <button class="zhihu-ai-result-copy" title="复制">📋</button>
          <button class="zhihu-ai-answer-result-close">×</button>
        </div>
      </div>
      <div class="zhihu-ai-answer-result-body">${html}</div>
    </div>
  `;

  container.style.position = 'relative';
  container.appendChild(resultDiv);

  // 关闭按钮
  resultDiv.querySelector('.zhihu-ai-answer-result-close')?.addEventListener('click', () => {
    resultDiv.remove();
  });

  // 复制按钮
  resultDiv.querySelector('.zhihu-ai-result-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      alert('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  });
}

// 处理文章总结
async function handleArticleSummary() {
  const content = ContentExtractor.extractArticle();
  const button = createSummaryButton('AI总结', 'zhihu-ai-summary-btn-article');

  const titleActions = document.querySelector('.Post-Header .ContentItem-actions');
  if (titleActions) {
    titleActions.insertBefore(button, titleActions.firstChild);
  }

  button.addEventListener('click', async () => {
    button.classList.add('loading');
    let markdown = '';

    await apiClient.streamCall(
      content,
      (chunk) => {
        markdown += chunk;
        // 实时更新显示
      },
      () => {
        button.classList.remove('loading');
        const container = document.querySelector('.Post-Main') as HTMLElement;
        if (container) {
          showSummaryResult(container, markdown);
        }
      },
      (error) => {
        button.classList.remove('loading');
        alert(error.message);
      }
    );
  });
}

// 处理问题总结
async function handleQuestionSummary() {
  const button = createSummaryButton('AI总结', 'zhihu-ai-summary-btn-question');

  const questionHeader = document.querySelector('.QuestionHeader-main');
  if (questionHeader) {
    questionHeader.appendChild(button);
  }

  button.addEventListener('click', async () => {
    button.classList.add('loading');
    const content = await ContentExtractor.extractQuestion();
    let markdown = '';

    await apiClient.streamCall(
      content,
      (chunk) => {
        markdown += chunk;
      },
      () => {
        button.classList.remove('loading');
        const container = document.querySelector('.Question-main') as HTMLElement;
        if (container) {
          showSummaryResult(container, markdown);
        }
      },
      (error) => {
        button.classList.remove('loading');
        alert(error.message);
      }
    );
  });
}

// 处理回答总结
function handleAnswerSummary() {
  const answers = document.querySelectorAll('.List-item');

  answers.forEach((answer) => {
    const actions = answer.querySelector('.ContentItem-actions');
    if (actions && !actions.querySelector('.zhihu-ai-summary-btn-answer')) {
      const button = createSummaryButton('AI总结', 'zhihu-ai-summary-btn-answer');
      actions.insertBefore(button, actions.firstChild);

      button.addEventListener('click', async () => {
        button.classList.add('loading');
        const content = await ContentExtractor.extractAnswer(answer);
        let markdown = '';

        await apiClient.streamCall(
          content,
          (chunk) => {
            markdown += chunk;
          },
          () => {
            button.classList.remove('loading');
            const container = answer.querySelector('.RichContent') as HTMLElement;
            if (container) {
              showSummaryResult(container, markdown);
            }
          },
          (error) => {
            button.classList.remove('loading');
            alert(error.message);
          }
        );
      });
    }
  });
}

// 创建配置按钮
function createConfigButton() {
  const button = document.createElement('button');
  button.className = 'zhihu-ai-config-btn';
  button.textContent = '⚙️';
  document.body.appendChild(button);

  button.addEventListener('click', () => {
    // TODO: 显示配置面板
    alert('配置功能开发中...');
  });
}

// 主函数
function main() {
  injectStyles();
  createConfigButton();

  // 检测页面类型并添加相应功能
  if (window.location.pathname.includes('/p/')) {
    // 文章页面
    handleArticleSummary();
  } else if (window.location.pathname.includes('/question/')) {
    // 问题页面
    handleQuestionSummary();
    handleAnswerSummary();

    // 监听新回答加载
    const observer = new MutationObserver(() => {
      handleAnswerSummary();
    });

    const answerList = document.querySelector('.List');
    if (answerList) {
      observer.observe(answerList, { childList: true, subtree: true });
    }
  }
}

// 等待页面加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
