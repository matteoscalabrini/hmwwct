import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AsciiRule } from '../AsciiRule';

describe('<AsciiRule>', () => {
  it('renders an aria-hidden role=separator', () => {
    const { container } = render(<AsciiRule />);
    const el = container.querySelector('[role="separator"]');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses ─ as default character', () => {
    const { container } = render(<AsciiRule />);
    expect(container.textContent).toContain('─');
  });

  it('accepts a custom character', () => {
    const { container } = render(<AsciiRule char="═" />);
    expect(container.textContent).toContain('═');
  });
});
