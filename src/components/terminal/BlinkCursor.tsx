interface BlinkCursorProps {
  char?: string;
}

export function BlinkCursor({ char = '█' }: BlinkCursorProps) {
  return (
    <span
      aria-hidden="true"
      className="fg-phos"
      style={{
        display: 'inline-block',
        animation: 'blink 1s steps(2, start) infinite',
      }}
    >
      {char}
    </span>
  );
}
