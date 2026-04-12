import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BigBoard } from '../BigBoard';

describe('<BigBoard>', () => {
  it('renders six named areas', () => {
    render(
      <BigBoard
        parameters={<div>PARAMS</div>}
        theater={<div>THEATER</div>}
        cost={<div>COST</div>}
        humanToll={<div>TOLL</div>}
        perPerson={<div>PER</div>}
        history={<div>HIST</div>}
      />
    );
    ['PARAMS', 'THEATER', 'COST', 'TOLL', 'PER', 'HIST'].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument()
    );
  });
});
