import { HumanToll } from '@/types';
import { formatLargeNumber } from '@/lib/utils/formatting';

interface HumanTollBannerProps {
  toll: HumanToll;
}

export function HumanTollBanner({ toll }: HumanTollBannerProps) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ border: '1px solid var(--accent-amber)', background: 'rgba(245,158,11,0.06)' }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent-amber)' }}>
        Human Toll — Not Monetized
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--accent-amber)' }}>
        Est.{' '}
        <strong>
          {formatLargeNumber(toll.displacedPersonsMin)} –{' '}
          {formatLargeNumber(toll.displacedPersonsMax)} people
        </strong>{' '}
        displaced (point:{' '}
        <strong>{formatLargeNumber(toll.displacedPersonsPoint)}</strong>).
      </p>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {toll.note}
      </p>
      <a
        href={toll.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 text-xs underline"
        style={{ color: 'var(--accent-amber)', opacity: 0.7 }}
      >
        Source: {toll.source.name} ({toll.source.year})
      </a>
    </div>
  );
}
