interface AsciiRuleProps {
  char?: string;
  tone?: 'default' | 'accent' | 'mute';
}

export function AsciiRule({ char = '─', tone = 'default' }: AsciiRuleProps) {
  const colorClass = tone === 'accent' ? 'fg-accent' : tone === 'mute' ? 'fg-mute' : 'fg-dim';
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={`${colorClass}`}
      style={{
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        fontFamily: '"Ioskeley Mono", monospace',
        letterSpacing: 0,
      }}
    >
      {char.repeat(400)}
    </div>
  );
}
