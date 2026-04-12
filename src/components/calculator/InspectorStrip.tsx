import { BlinkCursor } from '@/components/terminal/BlinkCursor';

interface InspectorStripProps {
  iso: string | null;
  country: { name: string; population?: number } | null;
}

export function InspectorStrip({ iso, country }: InspectorStripProps) {
  if (!iso || !country) {
    return (
      <div className="t-label fg-dim" style={{ padding: 'var(--s-1) 0' }}>
        &gt; HOVER A CELL <BlinkCursor />
      </div>
    );
  }

  return (
    <div className="t-label fg-dim" style={{ padding: 'var(--s-1) 0' }}>
      &gt; {iso} · {country.name.toUpperCase()}
      {country.population ? ` · POP ${(country.population / 1e6).toFixed(1)}M` : ''}
    </div>
  );
}
