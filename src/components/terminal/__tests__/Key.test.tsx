import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Key } from '../Key';

describe('<Key>', () => {
  it('wraps the label in brackets', () => {
    render(<Key>F1</Key>);
    expect(screen.getByText('[F1]')).toBeInTheDocument();
  });

  it('inverts when active', () => {
    const { container } = render(<Key active>F1</Key>);
    expect(container.firstChild).toHaveAttribute('data-active', 'true');
  });
});
