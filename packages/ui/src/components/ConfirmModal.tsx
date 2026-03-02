import { render } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  closeOnOverlayClick?: boolean;
}

interface ConfirmModalProps extends ConfirmOptions {
  onResolve: (result: boolean) => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  danger = false,
  closeOnOverlayClick = true,
  onResolve,
}: ConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const resolvedRef = useRef(false);

  const resolveOnce = (result: boolean) => {
    if (resolvedRef.current) {
      return;
    }
    resolvedRef.current = true;
    onResolve(result);
  };

  const handleCancel = () => {
    resolveOnce(false);
  };

  const handleConfirm = () => {
    resolveOnce(true);
  };

  useEffect(() => {
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="zhihu-ai-modal">
      {closeOnOverlayClick && (
        <button
          type="button"
          className="zhihu-ai-modal-overlay"
          onClick={handleCancel}
          aria-label="关闭弹窗"
        />
      )}
      <div
        className="zhihu-ai-modal-content zhihu-ai-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="zhihu-ai-modal-header">
          <div className="zhihu-ai-modal-title">{title}</div>
          <button type="button" className="zhihu-ai-modal-close" onClick={handleCancel} aria-label="关闭">×</button>
        </div>

        <div className="zhihu-ai-modal-body">
          <div className="zhihu-ai-confirm-modal-message">{message}</div>

          <div className="zhihu-ai-confirm-modal-actions">
            <button
              type="button"
              className="zhihu-ai-confirm-modal-btn zhihu-ai-confirm-modal-btn-cancel"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              ref={confirmBtnRef}
              className={
                `zhihu-ai-confirm-modal-btn ${danger ? 'zhihu-ai-confirm-modal-btn-danger' : 'zhihu-ai-confirm-modal-btn-confirm'}`
              }
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const cleanup = (result: boolean) => {
      render(null, container);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      resolve(result);
    };

    render(<ConfirmModal {...options} onResolve={cleanup} />, container);
  });
}
