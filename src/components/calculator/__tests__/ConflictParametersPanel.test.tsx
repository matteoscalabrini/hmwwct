import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConflictParametersPanel } from '../ConflictParametersPanel';

const countries = [
  { value: 'USA', label: 'United States' },
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'FRA', label: 'France' },
];

describe('<ConflictParametersPanel>', () => {
  it('renders aggressor and target selectors', () => {
    render(
      <ConflictParametersPanel
        countries={countries}
        value={{ aggressor: 'USA', target: 'FRA', scenario: 'conventional' }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.getByText(/France/)).toBeInTheDocument();
  });

  it('renders four scenario buttons', () => {
    render(
      <ConflictParametersPanel
        countries={countries}
        value={{ aggressor: null, target: null, scenario: 'conventional' }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(/PRECISION/i)).toBeInTheDocument();
    expect(screen.getByText(/SKIRMISH/i)).toBeInTheDocument();
    expect(screen.getByText(/CONVENTIONAL/i)).toBeInTheDocument();
    expect(screen.getByText(/OCCUPATION/i)).toBeInTheDocument();
  });

  it('calls onChange when scenario button clicked', async () => {
    const onChange = vi.fn();
    render(
      <ConflictParametersPanel
        countries={countries}
        value={{ aggressor: null, target: null, scenario: 'conventional' }}
        onChange={onChange}
      />
    );
    await userEvent.click(screen.getByText(/SKIRMISH/i));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ scenario: 'skirmish' }));
  });
});
