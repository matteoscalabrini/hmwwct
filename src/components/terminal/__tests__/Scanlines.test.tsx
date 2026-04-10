import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Scanlines } from '../Scanlines';

describe('<Scanlines>', () => {
  it('renders a fixed aria-hidden div', () => {
    const { container } = render(<Scanlines />);
    const el = container.querySelector('div');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not capture pointer events', () => {
    const { container } = render(<Scanlines />);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.pointerEvents).toBe('none');
  });
});
