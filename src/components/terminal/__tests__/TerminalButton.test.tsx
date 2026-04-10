import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminalButton } from '../TerminalButton';

describe('<TerminalButton>', () => {
  it('renders label with > prefix', () => {
    render(<TerminalButton>EXECUTE</TerminalButton>);
    expect(screen.getByRole('button')).toHaveTextContent('> EXECUTE');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<TerminalButton onClick={onClick}>GO</TerminalButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables while loading', () => {
    render(<TerminalButton loading>EXECUTE</TerminalButton>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('> CALCULATING');
  });
});
