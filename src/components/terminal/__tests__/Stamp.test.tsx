import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stamp } from '../Stamp';

describe('<Stamp>', () => {
  it('renders the label text uppercased', () => {
    render(<Stamp>conflict parameters</Stamp>);
    expect(screen.getByText(/CONFLICT PARAMETERS/)).toBeInTheDocument();
  });

  it('wraps label in ASCII brackets (decorative)', () => {
    const { container } = render(<Stamp>hello</Stamp>);
    expect(container.textContent).toContain('┌─');
    expect(container.textContent).toContain('─┐');
  });

  it('marks decorative chars aria-hidden', () => {
    const { container } = render(<Stamp>hello</Stamp>);
    const hiddenSpans = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenSpans.length).toBeGreaterThan(0);
  });
});
