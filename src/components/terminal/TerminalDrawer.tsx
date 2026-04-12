'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

export interface TerminalDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function TerminalDrawer({ open, onClose, title, children }: TerminalDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop — always in DOM for transition; only interactive when open */}
      <div
        data-testid="drawer-backdrop"
        onClick={open ? onClose : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 50,
          pointerEvents: open ? 'auto' : 'none',
          opacity: open ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Drawer panel */}
      <div
        data-testid="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(480px, 90vw)',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--fg-mute)',
          zIndex: 51,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--s-3) var(--s-3) var(--s-2)',
            borderBottom: '1px solid var(--fg-mute)',
            flexShrink: 0,
          }}
        >
          {title && (
            <span className="t-label fg-dim">
              <span aria-hidden="true">┌─</span>
              <span> {title} </span>
              <span aria-hidden="true">─┐</span>
            </span>
          )}
          <button
            onClick={onClose}
            className="t-label"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--fg-dim)',
              cursor: 'pointer',
              padding: 'var(--s-1)',
              marginLeft: 'auto',
            }}
            aria-label="Close"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: 'var(--s-3)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
