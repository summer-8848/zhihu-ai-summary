import { h } from 'preact';
import { useState } from 'preact/hooks';

interface SummaryPanelProps {
  content: string;
  loading?: boolean;
  streaming?: boolean;
  onClose: () => void;
  className?: string;
}

export function SummaryPanel({ content, loading, streaming, onClose, className = '' }: SummaryPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className={`zhihu-ai-summary-panel ${className}`}>
      <div className="zhihu-ai-panel-header">
        <svg viewBox="0 0 1024 1024" fill="currentColor" width="18" height="18">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z"/>
        </svg>
        AI总结
        <div className="zhihu-ai-panel-actions">
          <button
            className="zhihu-ai-icon-btn"
            onClick={handleCopy}
            title={copied ? '已复制' : '复制'}
          >
            {copied ? '✓' : '📋'}
          </button>
          <button
            className="zhihu-ai-icon-btn"
            onClick={onClose}
            title="关闭"
          >
            ×
          </button>
        </div>
      </div>

      <div className="zhihu-ai-panel-body">
        {loading ? (
          <div className="zhihu-ai-loading">
            <div className="zhihu-ai-spinner"></div>
            <span>AI 正在分析中...</span>
          </div>
        ) : (
          <div
            className="zhihu-ai-markdown"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
        {streaming && <span className="zhihu-ai-streaming-cursor"></span>}
      </div>
    </div>
  );
}
