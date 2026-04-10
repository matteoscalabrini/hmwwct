import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminalSelect } from '../TerminalSelect';

const OPTIONS = [
  { value: 'USA', label: 'United States' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'UKR', label: 'Ukraine' },
];

describe('<TerminalSelect>', () => {
  it('shows the selected label at rest', () => {
    render(<TerminalSelect options={OPTIONS} value="USA" onChange={vi.fn()} label="AGGRESSOR" />);
    expect(screen.getByText(/United States/)).toBeInTheDocument();
  });

  it('opens on click and shows search prompt', async () => {
    render(<TerminalSelect options={OPTIONS} value="USA" onChange={vi.fn()} label="AGGRESSOR" />);
    await userEvent.click(screen.getByRole('button', { name: /AGGRESSOR/i }));
    expect(screen.getByPlaceholderText(/SEARCH/i)).toBeInTheDocument();
  });

  it('filters as user types and selects on enter', async () => {
    const onChange = vi.fn();
    render(<TerminalSelect options={OPTIONS} value="USA" onChange={onChange} label="X" />);
    await userEvent.click(screen.getByRole('button', { name: /X/i }));
    const input = screen.getByPlaceholderText(/SEARCH/i);
    await userEvent.type(input, 'uk');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalled();
  });

  it('closes on escape', async () => {
    render(<TerminalSelect options={OPTIONS} value="USA" onChange={vi.fn()} label="X" />);
    await userEvent.click(screen.getByRole('button', { name: /X/i }));
    expect(screen.getByPlaceholderText(/SEARCH/i)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByPlaceholderText(/SEARCH/i)).not.toBeInTheDocument();
  });
});
