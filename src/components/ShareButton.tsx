'use client';

import { useState } from 'react';
import { ConflictScenario } from '@/types';

interface ShareButtonProps {
  aggressorCode: string;
  targetCode: string;
  scenario: ConflictScenario;
}

export function ShareButton({ aggressorCode, targetCode, scenario }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    const base = window.location.origin;
    return `${base}/calculator?aggressor=${aggressorCode}&target=${targetCode}&scenario=${scenario}`;
  };

  const handleShare = async () => {
    const url = getUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'How Much Would a War Cost There?', url });
        return;
      } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase transition-colors focus:outline-none"
      style={{
        border: '1px solid var(--green-dim)',
        color: copied ? 'var(--green)' : 'var(--text-dim)',
        background: 'transparent',
      }}
      aria-label="Share this calculation"
    >
      {copied ? '✓ COPIED' : '> SHARE LINK'}
    </button>
  );
}
