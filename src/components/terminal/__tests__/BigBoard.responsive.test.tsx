import { render } from '@testing-library/react';
import { BigBoard } from '../BigBoard';

test('BigBoard renders with big-board class', () => {
  const { container } = render(
    <BigBoard
      parameters={<div>p</div>}
      theater={<div>t</div>}
      cost={<div>c</div>}
      humanToll={<div>h</div>}
      perPerson={<div>pp</div>}
      history={<div>hi</div>}
    />
  );
  expect(container.querySelector('.big-board')).toBeInTheDocument();
});
