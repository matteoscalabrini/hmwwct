'use client';

import { useState } from 'react';
import { Panel } from '@/components/terminal/Panel';
import { BlockGridMap } from '@/components/terminal/BlockGridMap';
import { InspectorStrip } from './InspectorStrip';

interface CountryInfo {
  name: string;
  population?: number;
}

interface Props {
  aggressor: string | null;
  target: string | null;
  countriesByIso: Record<string, CountryInfo>;
}

export function OperationsTheaterPanel({ aggressor, target, countriesByIso }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <Panel title="OPERATIONS THEATER">
      <BlockGridMap
        aggressor={aggressor ?? ''}
        target={target ?? ''}
        onHoverCountry={setHover}
      />
      <InspectorStrip
        iso={hover}
        country={hover ? countriesByIso[hover] ?? null : null}
      />
    </Panel>
  );
}
