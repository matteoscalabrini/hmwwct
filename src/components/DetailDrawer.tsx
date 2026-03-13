'use client';

import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const CLOSE_THRESHOLD = 100;

export function DetailDrawer({ isOpen, onClose, children, title }: DetailDrawerProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > CLOSE_THRESHOLD) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(18, 33, 27, 0.98), rgba(9, 17, 13, 1))',
              borderTop: '1px solid var(--border-bright)',
              maxHeight: '85vh',
              minHeight: '40vh',
              boxShadow: '0 -24px 60px rgba(0, 0, 0, 0.45)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: 'var(--border-bright)', boxShadow: '0 0 12px rgba(84, 245, 214, 0.2)' }}
              />
            </div>

            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2
                className="text-sm font-semibold tracking-[0.16em] uppercase"
                style={{ color: 'var(--text)' }}
              >
                {title ?? 'Details'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                style={{ color: 'var(--text-secondary)', background: 'rgba(18, 33, 27, 0.8)' }}
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
