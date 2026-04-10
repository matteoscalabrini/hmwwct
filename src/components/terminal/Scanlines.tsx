export function Scanlines() {
  return (
    <div
      data-scanlines=""
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(74, 255, 122, 0.03) 2px, rgba(74, 255, 122, 0.03) 3px)',
        mixBlendMode: 'screen',
      }}
    />
  );
}
