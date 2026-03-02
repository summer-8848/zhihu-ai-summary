import { useState, useEffect } from 'preact/hooks';
import { MarkdownParser, type APIClient, type ExtractedContent } from '@zhihu-ai-summary/core';
import { SummaryButton } from './SummaryButton';
import { SummaryPanel } from './SummaryPanel';
import { toast } from './Toast';

export interface SummaryButtonWrapperProps {
  content: ExtractedContent | (() => Promise<ExtractedContent>);
  buttonClass: string;
  type: 'article' | 'question' | 'answer';
  targetElement: Element;
  apiClient: APIClient;
  authorName?: string;
  autoTrigger?: boolean;
  minLength?: number;
  panelClassName?: string;
}

export function SummaryButtonWrapper({
  content,
  buttonClass,
  type,
  targetElement,
  apiClient,
  authorName,
  autoTrigger = false,
  minLength = 0,
  panelClassName = '',
}: SummaryButtonWrapperProps) {
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(window.location.href);
  const [modelName, setModelName] = useState('AI');

  const hideSideColumn = () => {
    if (type !== 'answer') {
      return () => {};
    }
    const sideColumn = document.querySelector(
      'div.Question-sideColumn.Question-sideColumn--sticky'
    ) as HTMLElement | null;
    if (!sideColumn) {
      return () => {};
    }

    const prevDisplay = sideColumn.style.display;
    sideColumn.style.display = 'none';
    return () => {
      sideColumn.style.display = prevDisplay;
    };
  };

  const handleClick = async (isManualClick: boolean = true) => {
    const restoreSideColumn = hideSideColumn();
    // 关闭已存在的面板
    setShowPanel(false);
    setMarkdown('');
    setHtml('');

    setLoading(true);
    setShowPanel(true);
    setStreaming(true);

    // 获取模型名称
    const model = apiClient.modelName || 'AI';
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
          restoreSideColumn();
        },
        (error) => {
          setHtml(`<div class="zhihu-ai-inline-error">${error.message}</div>`);
          if (isManualClick) {
            toast.error(error.message || '生成总结失败');
          }
          setLoading(false);
          setStreaming(false);
          restoreSideColumn();
        }
      );
    } catch (error) {
      console.error('生成总结失败:', error);
      const message = error instanceof Error ? error.message : '生成总结失败';
      setHtml(`<div class="zhihu-ai-inline-error">${message}</div>`);
      if (isManualClick) {
        toast.error(message);
      }
      setLoading(false);
      setStreaming(false);
      restoreSideColumn();
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
          className={panelClassName}
        />
      )}
    </>
  );
}
