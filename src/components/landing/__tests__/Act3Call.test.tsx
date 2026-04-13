import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Act3Call } from '../Act3Call';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('<Act3Call>', () => {
  it('renders the ENOUGH READING heading', () => {
    render(<Act3Call />);
    expect(screen.getByText(/ENOUGH READING/)).toBeInTheDocument();
  });

  it('renders the RUN THE NUMBERS heading', () => {
    render(<Act3Call />);
    expect(screen.getByText(/RUN THE NUMBERS YOURSELF/)).toBeInTheDocument();
  });

  it('renders the LAUNCH CALCULATOR button', () => {
    render(<Act3Call />);
    expect(screen.getByRole('button', { name: /LAUNCH CALCULATOR/i })).toBeInTheDocument();
  });

  it('navigates to /calculator when button is clicked', async () => {
    mockPush.mockReset();
    render(<Act3Call />);
    await userEvent.click(screen.getByRole('button', { name: /LAUNCH CALCULATOR/i }));
    expect(mockPush).toHaveBeenCalledWith('/calculator');
  });

  it('renders the secondary nav links', () => {
    render(<Act3Call />);
    expect(screen.getByRole('link', { name: /METHODOLOGY/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SOURCES/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GITHUB/i })).toBeInTheDocument();
  });
});
