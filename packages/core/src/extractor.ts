export interface ArticleContent {
  type: 'article';
  title: string;
  content: string;
}

export interface QuestionContent {
  type: 'question';
  title: string;
  content: string;
}

export interface AnswerContent {
  type: 'answer';
  questionTitle: string;
  questionDesc: string;
  author: string;
  content: string;
}

export type ExtractedContent = ArticleContent | QuestionContent | AnswerContent;

export class ContentExtractor {
  static extractArticle(): ArticleContent {
    const title = document.querySelector('h1.Post-Title, .Post-Title')?.textContent || '';
    const content = document.querySelector('.Post-RichTextContainer, .RichText, .Post-RichText')?.textContent || '';
    return { type: 'article', title: title.trim(), content: content.trim() };
  }

  static async extractQuestion(): Promise<QuestionContent> {
    const title = document.querySelector('h1.QuestionHeader-title, .QuestionHeader-title')?.textContent || '';
    const questionRichText = document.querySelector('.QuestionRichText');

    if (questionRichText?.classList.contains('QuestionRichText--collapsed')) {
      const expandButton = questionRichText.querySelector('.QuestionRichText-more') as HTMLElement;
      if (expandButton) {
        expandButton.click();
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (!questionRichText.classList.contains('QuestionRichText--collapsed')) {
              clearInterval(check);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            resolve();
          }, 2000);
        });
      }
    }

    const description = document.querySelector('.QuestionRichText, .QuestionHeader-detail')?.textContent || '';
    return { type: 'question', title: title.trim(), content: description.trim() };
  }

  static async extractAnswer(answerElement: Element): Promise<AnswerContent> {
    const questionTitle = document.querySelector('h1.QuestionHeader-title, .QuestionHeader-title')?.textContent || '';
    const questionDesc = document.querySelector('.QuestionRichText, .QuestionHeader-detail')?.textContent || '';
    const author = answerElement.querySelector('.AuthorInfo-name, .UserLink-link')?.textContent || '匿名用户';
    const contentElement = answerElement.querySelector('.RichContent-inner, .RichText');

    const selectors = [
      'button.ContentItem-expandButton',
      '.ContentItem-expandButton',
      'button.ContentItem-rightButton',
      '.RichContent-inner button[class*="expand"]',
      'button[class*="expandButton"]',
    ];

    let expandButton: HTMLElement | null = null;
    for (const selector of selectors) {
      const btn = answerElement.querySelector(selector) as HTMLElement;
      if (btn && (btn.innerText || btn.textContent || '').includes('展开')) {
        expandButton = btn;
        break;
      }
    }

    if (expandButton) {
      expandButton.click();
      await new Promise<void>((resolve) => {
        let checkCount = 0;
        const check = setInterval(() => {
          checkCount++;
          let currentButton: HTMLElement | null = null;
          for (const selector of selectors) {
            const btn = answerElement.querySelector(selector) as HTMLElement;
            if (btn) {
              currentButton = btn;
              break;
            }
          }
          if (!currentButton || currentButton.innerText.includes('收起') || checkCount >= 30) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const content = contentElement?.textContent || '';
    return {
      type: 'answer',
      questionTitle: questionTitle.trim(),
      questionDesc: questionDesc.trim(),
      author: author.trim(),
      content: content.trim(),
    };
  }
}
