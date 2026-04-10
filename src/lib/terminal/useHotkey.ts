import { useEffect } from 'react';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function useHotkey(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: { allowInInputs?: boolean } = {}
): void {
  useEffect(() => {
    const needle = key.toLowerCase();
    const listener = (e: KeyboardEvent) => {
      if (!options.allowInInputs && isEditable(e.target)) return;
      if (e.key.toLowerCase() === needle) handler(e);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, handler, options.allowInInputs]);
}
