import { useState, useEffect, useRef } from 'preact/hooks';
import { toast } from './Toast';

interface PanelElement extends HTMLDivElement {
  __cleanup?: () => void;
}

interface SummaryPanelProps {
  content: string;
  markdown?: string;
  sourceUrl?: string;
  loading?: boolean;
  streaming?: boolean;
  onClose: () => void;
  className?: string;
  title?: string;
  panelType?: 'answer' | 'article' | 'question';
  targetElement?: Element;
}

export function SummaryPanel({
  content,
  markdown,
  sourceUrl,
  loading,
  streaming,
  onClose,
  className = '',
  title = 'AI总结',
  panelType = 'answer',
  targetElement
}: SummaryPanelProps) {
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef<PanelElement>(null);
  const originalParentRef = useRef<Element | null>(null);
  const contentCheckIntervalRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    dragging: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    startRect: { left: number; top: number; width: number; height: number } | null;
    prevBodyUserSelect: string;
  }>({
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    startRect: null,
    prevBodyUserSelect: '',
  });

  const applyDragTransform = (x: number, y: number) => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    panel.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const endDrag = () => {
    const state = dragStateRef.current;
    if (!state.dragging) {
      return;
    }

    state.dragging = false;
    state.pointerId = null;
    state.startRect = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);

    document.body.style.userSelect = state.prevBodyUserSelect;
    setDragging(false);
  };

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
  };

  const handlePointerMove = (event: PointerEvent) => {
    const state = dragStateRef.current;
    if (!state.dragging || state.pointerId === null || event.pointerId !== state.pointerId) {
      return;
    }
    if (!state.startRect) {
      return;
    }

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    // 允许拖动，但避免把面板完全拖出屏幕（保留一小块可见区域，便于找回）
    const visibleMarginX = 80;
    const visibleMarginY = 60;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = state.startRect;

    const deltaXMin = (visibleMarginX - rect.width) - rect.left;
    const deltaXMax = (vw - visibleMarginX) - rect.left;
    const deltaYMin = (visibleMarginY - rect.height) - rect.top;
    const deltaYMax = (vh - visibleMarginY) - rect.top;

    const clampedDx = clamp(dx, deltaXMin, deltaXMax);
    const clampedDy = clamp(dy, deltaYMin, deltaYMax);

    const nextX = state.baseX + clampedDx;
    const nextY = state.baseY + clampedDy;

    dragOffsetRef.current = { x: nextX, y: nextY };
    applyDragTransform(nextX, nextY);
  };

  const handlePointerUp = (event: PointerEvent) => {
    const state = dragStateRef.current;
    if (!state.dragging || state.pointerId === null || event.pointerId !== state.pointerId) {
      return;
    }
    endDrag();
  };

  const handleHeaderPointerDown = (event: PointerEvent) => {
    // 点击关闭/复制按钮时不触发拖动
    const target = event.target as Element | null;
    if (target?.closest('button')) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const header = event.currentTarget as HTMLElement;
    dragStateRef.current.dragging = true;
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startY = event.clientY;
    dragStateRef.current.baseX = dragOffsetRef.current.x;
    dragStateRef.current.baseY = dragOffsetRef.current.y;

    const rect = panel.getBoundingClientRect();
    dragStateRef.current.startRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };

    dragStateRef.current.prevBodyUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    header.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    setDragging(true);
  };

  // 检查内容高度并调整滚动条
  const checkContentHeight = (panel: HTMLDivElement, answerItem: Element) => {
    const elem = answerItem as HTMLElement;
    const elementHeight = elem.offsetHeight;
    const minPanelHeight = Math.max(300, window.innerHeight * 0.3);
    const maxPanelHeight = window.innerHeight - 90;

    // 计算目标高度
    let targetHeight: number;
    if (elementHeight < maxPanelHeight) {
      targetHeight = Math.max(minPanelHeight, elementHeight);
    } else {
      targetHeight = maxPanelHeight;
    }

    // 获取面板内容的实际高度
    const panelContentHeight = panel.scrollHeight;

    // 设置最大高度
    panel.style.maxHeight = `${targetHeight}px`;

    if (panelContentHeight > targetHeight) {
      panel.style.overflowY = 'auto';
    } else {
      panel.style.overflowY = 'hidden';
    }
  };

  // 监听流式输出状态，定期检查内容高度
  useEffect(() => {
    if (!panelRef.current || !targetElement || panelType !== 'answer') {return;}

    const panel = panelRef.current;
    const answerItem = targetElement.closest('.ContentItem.AnswerItem');
    if (!answerItem) {return;}

    if (streaming) {
      contentCheckIntervalRef.current = window.setInterval(() => {
        checkContentHeight(panel, answerItem);
      }, 500);
    } else {
      if (contentCheckIntervalRef.current) {
        clearInterval(contentCheckIntervalRef.current);
        contentCheckIntervalRef.current = null;
      }
      // 最后检查一次
      checkContentHeight(panel, answerItem);
    }

    return () => {
      if (contentCheckIntervalRef.current) {
        clearInterval(contentCheckIntervalRef.current);
        contentCheckIntervalRef.current = null;
      }
    };
  }, [streaming, targetElement, panelType]);

  useEffect(() => {
    if (!panelRef.current || !targetElement) {return;}

    const panel = panelRef.current;
    originalParentRef.current = panel.parentElement;

    // 找到正确的父元素并移动面板
    let parentElement: Element | null = null;
    let answerItem: Element | null = null;
    let updateTimer: number | null = null;

    // 更新面板高度的函数（带防抖）
    const updatePanelHeight = () => {
      if (!answerItem || panelType !== 'answer') {return;}

      // 清除之前的定时器
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // 延迟执行，避免频繁更新
      updateTimer = window.setTimeout(() => {
        if (answerItem) {
          checkContentHeight(panel, answerItem);
        }
      }, 150);
    };

    if (panelType === 'question') {
      panel.classList.add('question-fixed');
      parentElement = document.body;
    } else if (panelType === 'answer') {
      // 对于回答，找到回答元素
      answerItem = targetElement.closest('.ContentItem.AnswerItem');
      if (answerItem) {
        parentElement = answerItem;
        const elem = answerItem as HTMLElement;
        if (!elem.style.position || elem.style.position === 'static') {
          elem.style.position = 'relative';
        }

        // 初始化面板高度
        updatePanelHeight();

        // 使用 ResizeObserver 监听回答元素高度变化
        const resizeObserver = new ResizeObserver(() => {
          updatePanelHeight();
        });
        resizeObserver.observe(answerItem);

        // 使用 MutationObserver 监听 DOM 变化（例如展开/收起按钮点击）
        const mutationObserver = new MutationObserver(() => {
          // 延迟更新，等待动画完成
          updatePanelHeight();
        });

        // 只监听特定的变化，减少触发频率
        mutationObserver.observe(answerItem, {
          childList: false,
          subtree: false,
          attributes: true,
          attributeFilter: ['class']
        });

        // 清理观察器和定时器
        const cleanup = () => {
          if (updateTimer) {
            clearTimeout(updateTimer);
            updateTimer = null;
          }
          resizeObserver.disconnect();
          mutationObserver.disconnect();
        };

        // 保存清理函数
        panel.__cleanup = cleanup;
      }
    } else if (panelType === 'article') {
      // 对于文章，找到文章容器
      // 优先使用正文左侧内容列作为定位基准，保证面板贴在正文右边
      const articleContainer = document.querySelector('.Post-Row-Content-left') ||
                             document.querySelector('.Post-Row-Content') ||
                             targetElement.closest('article') ||
                             targetElement.closest('.Post-Main');
      if (articleContainer) {
        parentElement = articleContainer;
        const elem = articleContainer as HTMLElement;
        if (!elem.style.position || elem.style.position === 'static') {
          elem.style.position = 'relative';
        }
        panel.style.top = '0';
      }
    }

    // 移动面板到正确的父元素
    if (parentElement && panel.parentElement !== parentElement) {
      parentElement.appendChild(panel);
    }

    // 清理函数：组件卸载时移除面板和观察器
    return () => {
      // 清理拖动监听器（如果正在拖动）
      endDrag();

      // 清理观察器
      if (panel.__cleanup) {
        panel.__cleanup();
        delete panel.__cleanup;
      }

      // 移除面板
      if (panel.parentElement) {
        panel.parentElement.removeChild(panel);
      }
    };
  }, [panelType, targetElement]);

  useEffect(() => {
    // 初始化 transform，避免浏览器计算差异导致首次拖动跳变
    applyDragTransform(dragOffsetRef.current.x, dragOffsetRef.current.y);
    return () => {
      endDrag();
    };
  }, []);

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
      toast.success('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      toast.error('复制失败，请检查浏览器剪贴板权限');
    }
  };

  return (
    <div
      ref={panelRef}
      className={`zhihu-ai-side-panel ${className} ${dragging ? 'zhihu-ai-side-panel--dragging' : ''}`}
    >
      <div className="zhihu-ai-answer-result">
        <div
          className="zhihu-ai-answer-result-header zhihu-ai-draggable-header"
          onPointerDown={handleHeaderPointerDown}
          title="按住拖动面板"
        >
          <svg viewBox="0 0 1024 1024" fill="currentColor" width="18" height="18" aria-hidden="true">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
            <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0z m72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/>
          </svg>
          <span className="zhihu-ai-result-title">{title}</span>
          <div className="zhihu-ai-result-actions">
            <button
              type="button"
              className="zhihu-ai-result-copy"
              onClick={handleCopy}
              title={copied ? '已复制' : streaming ? '请等待AI总结完成后再复制' : '复制Markdown格式'}
              disabled={!content || streaming}
            >
              {copied ? '✅' : '📋'}
            </button>
            <button
              type="button"
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
            <div className="zhihu-ai-inline-loading">
              <div className="zhihu-ai-inline-spinner"></div>
              <span>AI正在分析内容，请稍候...</span>
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
