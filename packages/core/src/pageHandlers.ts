import type { ConfigManager } from './config';
import type { ExtractedContent } from './extractor';

export interface AddSummaryButtonOptions {
  authorName?: string;
  autoTrigger?: boolean;
  minLength?: number;
}

export type AddSummaryButtonFn = (
  targetElement: Element,
  content: ExtractedContent | (() => Promise<ExtractedContent>),
  buttonClass: string,
  type: 'article' | 'question' | 'answer',
  options?: AddSummaryButtonOptions
) => void;

/**
 * 等待元素出现
 */
export async function waitForElement(
  container: Element,
  selector: string,
  timeout: number = 2000
): Promise<Element | null> {
  const element = container.querySelector(selector);
  if (element) {
    return element;
  }

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const el = container.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout'));
    }, timeout);
  });
}

/**
 * 处理文章页面
 */
export async function handleArticlePage(
  addSummaryButton: AddSummaryButtonFn,
  extractArticleFn: () => ExtractedContent,
  configManager: ConfigManager
) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const authorHead = document.querySelector('.AuthorInfo-head');
  if (!authorHead || authorHead.querySelector('.zhihu-ai-summary-btn-article-container')) {
    return;
  }

  const articleContainer = document.querySelector('.Post-Row-Content') ||
                         document.querySelector('.Post-Row-Content-left') ||
                         authorHead.closest('article') ||
                         authorHead.closest('.Post-Main');

  if (articleContainer) {
    const content = extractArticleFn();
    const autoSummarize = await configManager.get('AUTO_SUMMARIZE', false);

    addSummaryButton(
      authorHead,
      content,
      'zhihu-ai-summary-btn-article zhihu-ai-summary-btn-answer',
      'article',
      { autoTrigger: autoSummarize }
    );
  }
}

/**
 * 处理问题页面
 */
export function handleQuestionPage(
  addSummaryButton: AddSummaryButtonFn,
  extractQuestionFn: () => Promise<ExtractedContent>
) {
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
          extractQuestionFn,
          'zhihu-ai-summary-btn-question',
          'question'
        );
      }
    }
  }, 2000);
}

/**
 * 处理回答列表
 */
export async function handleAnswers(
  addSummaryButton: AddSummaryButtonFn,
  extractAnswerFn: (element: Element) => Promise<ExtractedContent>,
  configManager: ConfigManager
) {
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
        authorHead = await waitForElement(answer, '.AuthorInfo-head', 2000);
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
      () => extractAnswerFn(answer),
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

/**
 * 设置问题页面监听器，监听新回答加载
 */
export function setupAnswerObserver(
  handleAnswersFn: () => void
) {
  let debounceTimer: number | null = null;
  const observer = new MutationObserver(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => {
      handleAnswersFn();
      debounceTimer = null;
    }, 300);
  });

  const mainColumn = document.querySelector('.Question-mainColumn');
  if (mainColumn) {
    observer.observe(mainColumn, { childList: true, subtree: true });
  }

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    observer.disconnect();
  };
}
