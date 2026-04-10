import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel } from '../Panel';

describe('<Panel>', () => {
  it('renders the title as a Stamp', () => {
    render(<Panel title="cost analysis"><div>child</div></Panel>);
    expect(screen.getByText(/COST ANALYSIS/)).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Panel title="t"><div>hello body</div></Panel>);
    expect(screen.getByText('hello body')).toBeInTheDocument();
  });

  it('applies alert tone class when tone="alert"', () => {
    const { container } = render(<Panel title="t" tone="alert">x</Panel>);
    expect(container.firstChild).toHaveAttribute('data-tone', 'alert');
  });
});
