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
          'repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(255, 255, 255, 0.025) 2px, rgba(255, 255, 255, 0.025) 3px)',
        mixBlendMode: 'screen',
      }}
    />
  );
}
