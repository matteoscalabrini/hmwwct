import { HumanToll } from '@/types';
import { formatLargeNumber } from '@/lib/utils/formatting';

interface HumanTollBannerProps {
  toll: HumanToll;
}

export function HumanTollBanner({ toll }: HumanTollBannerProps) {
  return (
    <div
      style={{ border: '1px solid var(--amber)', background: 'rgba(255,176,0,0.05)' }}
      className="p-5"
    >
      <p className="text-xs font-bold tracking-widest uppercase glow-amber mb-2" style={{ color: 'var(--amber)' }}>
        ⚠ HUMAN TOLL // NOT MONETIZED
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--amber)', opacity: 0.9 }}>
        EST.{' '}
        <strong>
          {formatLargeNumber(toll.displacedPersonsMin)} –{' '}
          {formatLargeNumber(toll.displacedPersonsMax)} PEOPLE
        </strong>{' '}
        DISPLACED (POINT:{' '}
        <strong>{formatLargeNumber(toll.displacedPersonsPoint)}</strong>).
      </p>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--amber)', opacity: 0.65 }}>
        {toll.note}
      </p>
      <a
        href={toll.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 text-xs underline"
        style={{ color: 'var(--amber)', opacity: 0.65 }}
      >
        SRC: {toll.source.name} ({toll.source.year})
      </a>
    </div>
  );
}
