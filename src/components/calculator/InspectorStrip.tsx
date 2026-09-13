import Image from 'next/image';
import { BlinkCursor } from '@/components/terminal/BlinkCursor';

interface InspectorStripProps {
  iso: string | null;
  country: { name: string; population?: number; flag?: string } | null;
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
    <div
      className="t-label fg-dim"
      style={{ padding: 'var(--s-1) 0', display: 'flex', alignItems: 'center', gap: 'var(--s-2)', flexWrap: 'wrap' }}
    >
      &gt; {country.flag && (
        <Image
          src={country.flag}
          alt=""
          width={16}
          height={11}
          unoptimized
          style={{ width: 16, height: 11, objectFit: 'cover', border: '1px solid var(--fg-mute)', flexShrink: 0 }}
        />
      )}
      <span>{iso} · {country.name.toUpperCase()}</span>
      {country.population ? <span>· POP {(country.population / 1e6).toFixed(1)}M</span> : null}
    </div>
  );
}
