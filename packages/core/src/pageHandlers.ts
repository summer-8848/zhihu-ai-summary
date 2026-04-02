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
  // 问题页 DOM 经常异步加载：等待标题出现后再插入按钮
  void (async () => {
    try {
      const titleSelector = 'h1.QuestionHeader-title, .QuestionHeader-title';

      const isVisible = (el: Element) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return false;
        }
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return false;
        }
        return true;
      };

      // 某些情况下页面会存在多个同名标题节点（有的不可见），这里优先选择可见的那个
      const waitForVisibleTitle = async (timeoutMs: number) => {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          const candidates = Array.from(document.querySelectorAll(titleSelector));
          const visibleCandidates = candidates.filter(isVisible);
          if (visibleCandidates.length > 0) {
            // 取最后一个可见节点，兼容历史逻辑（之前取了 NodeList[1]）
            return visibleCandidates[visibleCandidates.length - 1];
          }
          await new Promise<void>((resolve) => setTimeout(resolve, 100));
        }
        return null;
      };

      // 先等元素出现，再等“可见的标题节点”出现
      await waitForElement(document.body, titleSelector, 5000);
      const titleElement = await waitForVisibleTitle(5000);

      if (!titleElement) {
        return;
      }

      const questionContainer = document.querySelector('.QuestionHeader') ||
                              document.querySelector('.Question-mainColumn') ||
                              titleElement.closest('.QuestionHeader-content');

      if (!questionContainer) {
        return;
      }

      // 将按钮放到问题标题前面（同一行、标题文本之前）
      let prefix = titleElement.querySelector('.zhihu-ai-question-title-prefix');
      if (!prefix) {
        prefix = document.createElement('span');
        prefix.className = 'zhihu-ai-question-title-prefix';
        titleElement.insertBefore(prefix, titleElement.firstChild);
      }

      if (!prefix.querySelector('.zhihu-ai-summary-btn-question-container')) {
        addSummaryButton(
          prefix,
          extractQuestionFn,
          'zhihu-ai-summary-btn-question',
          'question'
        );
      }
    } catch {
      // 忽略超时/DOM 变更导致的等待失败
    }
  })();
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
  // -------- MutationObserver: 监听 DOM 变化（回答节点增删） --------
  let debounceTimer: number | null = null;
  const mutationObserver = new MutationObserver(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(() => {
      handleAnswersFn();
      debounceTimer = null;
    }, 500);
  });

  const mainColumn = document.querySelector('.Question-mainColumn');
  if (mainColumn) {
    mutationObserver.observe(mainColumn, { childList: true, subtree: true });
  }

  // -------- IntersectionObserver: 监听任意回答触发（虚拟列表兜底） --------
  let scrollDebounceTimer: number | null = null;
  const io = new IntersectionObserver(
    () => {
      if (scrollDebounceTimer) {
        clearTimeout(scrollDebounceTimer);
      }
      scrollDebounceTimer = window.setTimeout(() => {
        handleAnswersFn();
        scrollDebounceTimer = null;
      }, 500);
    },
    { root: null, rootMargin: '0px 0px 500px 0px', threshold: 0 }
  );

  let observeTimer: number | null = null;
  const observeAllAnswers = () => {
    if (observeTimer) {
      clearTimeout(observeTimer);
    }
    observeTimer = window.setTimeout(() => {
      document.querySelectorAll('.ContentItem.AnswerItem').forEach((el) => {
        io.observe(el);
      });
      observeTimer = null;
    }, 500);
  };
  observeAllAnswers();

  // 监听未来新增的回答节点，动态加入 IntersectionObserver
  let answerListTimer: number | null = null;
  const answerListObserver = new MutationObserver(() => {
    if (answerListTimer) {
      clearTimeout(answerListTimer);
    }
    answerListTimer = window.setTimeout(() => {
      observeAllAnswers();
      answerListTimer = null;
    }, 500);
  });
  if (mainColumn) {
    answerListObserver.observe(mainColumn, { childList: true, subtree: true });
  }

  // -------- setInterval 兜底：应对虚拟列表中 IntersectionObserver 漏触发 --------
  // 知乎虚拟列表可能复用节点导致 IO 不触发，轮询确保 eventually 处理所有回答
  const pollTimer = window.setInterval(() => {
    handleAnswersFn();
  }, 5000);

  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (scrollDebounceTimer) {
      clearTimeout(scrollDebounceTimer);
    }
    if (observeTimer) {
      clearTimeout(observeTimer);
    }
    if (answerListTimer) {
      clearTimeout(answerListTimer);
    }
    clearInterval(pollTimer);
    mutationObserver.disconnect();
    io.disconnect();
    answerListObserver.disconnect();
  };
}
