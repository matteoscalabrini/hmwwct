'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    arrowLeft: number;
    placement: 'top' | 'bottom';
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = ref.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportPadding = 8;
    const gap = 12;

    let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(viewportPadding, Math.min(left, viewportWidth - tooltipRect.width - viewportPadding));

    let top = anchorRect.top - tooltipRect.height - gap;
    let placement: 'top' | 'bottom' = 'top';

    if (top < viewportPadding) {
      top = anchorRect.bottom + gap;
      placement = 'bottom';
    }

    if (top + tooltipRect.height > viewportHeight - viewportPadding) {
      top = Math.max(viewportPadding, viewportHeight - tooltipRect.height - viewportPadding);
    }

    const arrowLeft = Math.max(
      14,
      Math.min(anchorRect.left + anchorRect.width / 2 - left, tooltipRect.width - 14),
    );

    setPosition({ left, top, arrowLeft, placement });
  }, []);

  const showTooltip = useCallback(() => {
    clearHideTimeout();
    setVisible(true);
  }, [clearHideTimeout]);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => setVisible(false), 90);
  }, [clearHideTimeout]);

  useEffect(() => () => {
    clearHideTimeout();
  }, [clearHideTimeout]);

  useLayoutEffect(() => {
    if (!visible) return;
    updatePosition();
  }, [visible, content, updatePosition]);

  useEffect(() => {
    if (!visible) return;

    const handleViewportChange = () => updatePosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [visible, updatePosition]);

  return (
    <div
      ref={ref}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={scheduleHide}
      onFocus={showTooltip}
      onBlur={scheduleHide}
    >
      {children}
      {typeof document !== 'undefined' && visible && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="terminal-panel-strong fixed z-[120] w-72 p-3.5 text-xs shadow-xl"
          style={{
            left: position?.left ?? -9999,
            top: position?.top ?? -9999,
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={showTooltip}
          onMouseLeave={scheduleHide}
        >
          {content}
          {position && (
            <div
              className={`absolute h-2 w-2 -translate-x-1/2 rotate-45 ${
                position.placement === 'top'
                  ? 'top-full border-r border-b'
                  : 'bottom-full border-l border-t'
              }`}
              style={{
                left: position.arrowLeft,
                background: 'var(--surface-bright)',
                borderColor: 'var(--border-bright)',
              }}
            />
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
