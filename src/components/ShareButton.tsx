'use client';

import { useState } from 'react';
import { ConflictScenario } from '@/types';
import { Share2, Check } from 'lucide-react';

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
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all focus:outline-none"
      style={{
        border: '1px solid var(--border-bright)',
        color: copied ? 'var(--accent-emerald)' : 'var(--text-secondary)',
        background: 'var(--surface)',
      }}
      aria-label="Share this calculation"
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
