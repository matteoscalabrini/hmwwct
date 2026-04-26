import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

const MOCK_SECTIONS = [
  { id: 'abstract', label: 'ABSTRACT' },
  { id: 'data-pipeline', label: 'DATA PIPELINE' },
  { id: 'live-apis', label: 'LIVE APIS' },
  { id: 'static-datasets', label: 'STATIC DATASETS' },
];

beforeEach(() => {
  // Mock IntersectionObserver as a constructor
  const mockDisconnect = vi.fn();
  const MockIntersectionObserver = vi.fn(function () {
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: mockDisconnect,
    };
  });
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('<Sidebar>', () => {
  it('renders a nav with aria-label="Table of contents"', () => {
    render(<Sidebar sections={MOCK_SECTIONS} />);
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();
  });

  it('renders all section links', () => {
    render(<Sidebar sections={MOCK_SECTIONS} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(MOCK_SECTIONS.length);
  });

  it('renders each link with the correct href', () => {
    render(<Sidebar sections={MOCK_SECTIONS} />);
    for (const section of MOCK_SECTIONS) {
      const link = screen.getByRole('link', { name: section.label });
      expect(link).toHaveAttribute('href', `#${section.id}`);
    }
  });

  it('renders all section labels', () => {
    render(<Sidebar sections={MOCK_SECTIONS} />);
    for (const section of MOCK_SECTIONS) {
      expect(screen.getByText(section.label)).toBeInTheDocument();
    }
  });

  it('handles empty sections array', () => {
    render(<Sidebar sections={[]} />);
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('sits below the fixed reading progress bar', () => {
    render(<Sidebar sections={MOCK_SECTIONS} />);
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toHaveStyle({
      top: 'calc(var(--header-h) + var(--methodology-progress-h) + var(--s-5))',
    });
  });
});
