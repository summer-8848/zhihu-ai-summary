import { h } from 'preact';
import { useState } from 'preact/hooks';

interface InputModalProps {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  multiline?: boolean;
  rows?: number;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({
  title,
  placeholder = '',
  defaultValue = '',
  multiline = false,
  rows = 10,
  onConfirm,
  onCancel
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div className="zhihu-ai-modal" onClick={onCancel}>
      <div className="zhihu-ai-modal-content zhihu-ai-input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="zhihu-ai-modal-header">
          <div className="zhihu-ai-modal-title">{title}</div>
          <button className="zhihu-ai-modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="zhihu-ai-modal-body">
          {multiline ? (
            <textarea
              className="zhihu-ai-input-modal-textarea"
              placeholder={placeholder}
              value={value}
              rows={rows}
              onInput={(e) => setValue((e.target as HTMLTextAreaElement).value)}
              autoFocus
            />
          ) : (
            <input
              type="text"
              className="zhihu-ai-input-modal-input"
              placeholder={placeholder}
              value={value}
              onInput={(e) => setValue((e.target as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          )}

          <div className="zhihu-ai-input-modal-actions">
            <button className="zhihu-ai-input-modal-btn zhihu-ai-input-modal-btn-cancel" onClick={onCancel}>
              取消
            </button>
            <button
              className="zhihu-ai-input-modal-btn zhihu-ai-input-modal-btn-confirm"
              onClick={handleConfirm}
              disabled={!value.trim()}
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
