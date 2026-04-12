import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BlockGridMap } from '../BlockGridMap';

vi.mock('@/lib/data/map-grid.json', () => ({
  default: [
    [null, null, null, null],
    [null, 'USA', 'USA', null],
    [null, 'FRA', 'RUS', null],
    [null, null, null, null],
  ],
}));

describe('<BlockGridMap>', () => {
  it('renders a canvas element', () => {
    const { container } = render(
      <BlockGridMap aggressor="USA" target="RUS" />
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('has accessible label', () => {
    const { container } = render(
      <BlockGridMap aggressor="USA" target="RUS" />
    );
    expect(container.querySelector('canvas')?.getAttribute('aria-label')).toContain('Map');
  });
});
