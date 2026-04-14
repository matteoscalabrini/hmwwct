'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface TerminalDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function TerminalDrawer({ open, onClose, title, children }: TerminalDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus the panel on open so keyboard users land inside it
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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
        ref={panelRef}
        data-testid="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
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
