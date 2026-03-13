import { HumanToll } from '@/types';
import { formatLargeNumber } from '@/lib/utils/formatting';

interface HumanTollBannerProps {
  toll: HumanToll;
}

export function HumanTollBanner({ toll }: HumanTollBannerProps) {
  return (
    <div className="terminal-callout is-warn px-5 py-5">
      <p className="terminal-kicker mb-3" style={{ color: 'var(--accent-amber)' }}>
        Human Toll — Not Monetized
      </p>
      <p className="text-sm leading-7" style={{ color: 'var(--text)' }}>
        Est.{' '}
        <strong style={{ color: 'var(--accent-amber)' }}>
          {formatLargeNumber(toll.displacedPersonsMin)} –{' '}
          {formatLargeNumber(toll.displacedPersonsMax)} people
        </strong>{' '}
        displaced (point:{' '}
        <strong style={{ color: 'var(--accent-amber)' }}>{formatLargeNumber(toll.displacedPersonsPoint)}</strong>).
      </p>
      <p className="mt-3 text-xs leading-6" style={{ color: 'var(--text-secondary)' }}>
        {toll.note}
      </p>
      <a
        href={toll.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex text-xs underline underline-offset-2"
        style={{ color: 'var(--accent-amber)' }}
      >
        Source: {toll.source.name} ({toll.source.year})
      </a>
    </div>
  );
}
