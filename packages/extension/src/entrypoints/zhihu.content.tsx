import '@zhihu-ai-summary/ui/src/styles.css';

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  APIClient,
  ConfigManager,
  ContentExtractor,
  handleAnswers,
  handleArticlePage,
  handleQuestionPage,
  setupAnswerObserver,
  type Account,
  type AddSummaryButtonOptions,
  type ExtractedContent,
} from '@zhihu-ai-summary/core';
import { ConfigButton, ConfigModal, SummaryButtonWrapper, toast } from '@zhihu-ai-summary/ui';
import { defineContentScript } from 'wxt/utils/define-content-script';

import { ExtensionStorage } from '../storage';

// Keep runtime code inside `main` (WXT imports entrypoints in Node during build).
export default defineContentScript({
  matches: ['https://*.zhihu.com/*'],
  runAt: 'document_idle',

  main() {
    const storage = new ExtensionStorage();
    const configManager = new ConfigManager(storage);
    const apiClient = new APIClient(configManager);

    function App() {
      const [showConfig, setShowConfig] = useState(false);
      const [autoHideConfigBtn, setAutoHideConfigBtn] = useState(false);

      useEffect(() => {
        const checkConfigured = async () => {
          try {
            const accounts = (await configManager.get('AI_ACCOUNTS', [])) ?? [];
            const hasConfigured = accounts.some(
              (acc: Account) =>
                Boolean(acc.apiKey?.trim()) &&
                Boolean(acc.apiUrl?.trim()) &&
                Boolean(acc.model?.trim())
            );
            setAutoHideConfigBtn(hasConfigured);
          } catch (error) {
            console.error('加载配置失败:', error);
            toast.error('加载配置失败，请刷新页面重试');
          }
        };

        checkConfigured();
      }, []);

      return (
        <div>
          <ConfigButton autoHide={autoHideConfigBtn} onClick={() => setShowConfig(true)} />
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

    function renderConfigButton() {
      const container = document.createElement('div');
      container.id = 'zhihu-ai-config-root';
      document.body.appendChild(container);
      render(<App />, container);
    }

    function addSummaryButton(
      targetElement: Element,
      content: ExtractedContent | (() => Promise<ExtractedContent>),
      buttonClass: string,
      type: 'article' | 'question' | 'answer' = 'answer',
      options: AddSummaryButtonOptions = {}
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
          apiClient={apiClient}
          authorName={options.authorName}
          autoTrigger={options.autoTrigger}
          minLength={options.minLength}
        />,
        container
      );
    }

    function main() {
      renderConfigButton();

      if (window.location.pathname.includes('/p/')) {
        handleArticlePage(addSummaryButton, () => ContentExtractor.extractArticle(), configManager);
      } else if (window.location.pathname.includes('/question/')) {
        handleQuestionPage(addSummaryButton, () => ContentExtractor.extractQuestion());

        const handleAnswersFn = () =>
          handleAnswers(addSummaryButton, ContentExtractor.extractAnswer, configManager);
        handleAnswersFn();
        setupAnswerObserver(handleAnswersFn);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', main);
    } else {
      main();
    }
  },
});
