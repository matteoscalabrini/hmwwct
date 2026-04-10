import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BlinkCursor } from '../BlinkCursor';

describe('<BlinkCursor>', () => {
  it('renders the block character', () => {
    const { container } = render(<BlinkCursor />);
    expect(container.textContent).toContain('█');
  });

  it('is marked aria-hidden', () => {
    const { container } = render(<BlinkCursor />);
    const el = container.querySelector('span');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
});
