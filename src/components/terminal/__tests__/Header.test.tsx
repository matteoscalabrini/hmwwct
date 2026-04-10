import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../Header';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe('<Header>', () => {
  it('renders the HMWWCT wordmark', () => {
    render(<Header currentPath="/" />);
    expect(screen.getByText('HMWWCT')).toBeInTheDocument();
  });

  it('renders the three nav items', () => {
    render(<Header currentPath="/" />);
    expect(screen.getByText('HOME')).toBeInTheDocument();
    expect(screen.getByText('CALCULATOR')).toBeInTheDocument();
    expect(screen.getByText('METHODOLOGY')).toBeInTheDocument();
  });

  it('marks the active route', () => {
    const { container } = render(<Header currentPath="/calculator" />);
    const active = container.querySelector('[data-active="true"]');
    expect(active).not.toBeNull();
    expect(active?.textContent).toContain('CALCULATOR');
  });
});
