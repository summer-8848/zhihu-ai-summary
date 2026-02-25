import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // 等待动画结束
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  return (
    <div className={`zhihu-ai-toast zhihu-ai-toast-${type} ${visible ? 'zhihu-ai-toast-show' : 'zhihu-ai-toast-hide'}`}>
      <div className="zhihu-ai-toast-icon">{icons[type]}</div>
      <div className="zhihu-ai-toast-message">{message}</div>
      <button className="zhihu-ai-toast-close" onClick={handleClose}>×</button>
    </div>
  );
}

// Toast 管理器
class ToastManager {
  private container: HTMLElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'zhihu-ai-toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(message: string, type: ToastType = 'info', duration = 3000) {
    const container = this.ensureContainer();

    const toastElement = document.createElement('div');
    container.appendChild(toastElement);

    render(
      <Toast
        message={message}
        type={type}
        duration={duration}
        onClose={() => {
          if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
          }
        }}
      />,
      toastElement
    );
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 3000) {
    this.show(message, 'warning', duration);
  }
}

export const toast = new ToastManager();
