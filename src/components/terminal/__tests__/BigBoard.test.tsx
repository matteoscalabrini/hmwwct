import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BigBoard } from '../BigBoard';

describe('<BigBoard>', () => {
  it('renders five named areas', () => {
    const { container } = render(
      <BigBoard
        parameters={<div>PARAMS</div>}
        theater={<div>THEATER</div>}
        cost={<div>COST</div>}
        humanToll={<div>TOLL</div>}
        perPerson={<div>PER</div>}
      />
    );
    ['PARAMS', 'THEATER', 'COST', 'TOLL', 'PER'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
    const board = container.querySelector('.big-board') as HTMLElement;
    expect(board).toHaveStyle({ gap: 'var(--s-5)' });
    expect(board.style.gridTemplateAreas).toContain('params  cost    cost');
  });
});
