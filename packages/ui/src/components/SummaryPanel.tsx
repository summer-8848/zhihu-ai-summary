import { h } from 'preact';
import { useState } from 'preact/hooks';

interface SummaryPanelProps {
  content: string;
  markdown?: string;
  sourceUrl?: string;
  loading?: boolean;
  streaming?: boolean;
  onClose: () => void;
  className?: string;
}

export function SummaryPanel({ content, markdown, sourceUrl, loading, streaming, onClose, className = '' }: SummaryPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const now = new Date();
      const timestamp = now.toLocaleString('zh-CN', { hour12: false });
      const url = sourceUrl || window.location.href;
      const copyText = markdown
        ? `${markdown}\n\n---\n**来源**: ${url}\n**生成时间**: ${timestamp}`
        : content;

      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className={`zhihu-ai-side-panel ${className}`}>
      <div className="zhihu-ai-answer-result">
        <div className="zhihu-ai-answer-result-header">
          <svg viewBox="0 0 1024 1024" fill="currentColor" width="18" height="18">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
            <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0z m72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/>
          </svg>
          AI总结
          <div className="zhihu-ai-result-actions">
            <button
              className="zhihu-ai-result-copy"
              onClick={handleCopy}
              title={copied ? '已复制' : '复制'}
              disabled={!content}
            >
              {copied ? '✅' : '📋'}
            </button>
            <button
              className="zhihu-ai-answer-result-close"
              onClick={onClose}
              title="关闭"
            >
              ×
            </button>
          </div>
        </div>

        <div className="zhihu-ai-answer-result-body">
          {!content && loading ? (
            <div className="zhihu-ai-loading">
              <div className="zhihu-ai-spinner"></div>
              <span>AI 正在分析中...</span>
            </div>
          ) : (
            <>
              <div dangerouslySetInnerHTML={{ __html: content }} />
              {streaming && <span className="zhihu-ai-streaming-cursor"></span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
