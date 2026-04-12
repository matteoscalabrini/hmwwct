import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InHumanTerms } from '../InHumanTerms';

describe('<InHumanTerms>', () => {
  it('renders first frame', () => {
    render(<InHumanTerms totalUsd={1e12} aggressorPop={150e6} />);
    expect(screen.getByText(/PER TAXPAYER/i)).toBeInTheDocument();
  });

  it('cycles on click', async () => {
    render(<InHumanTerms totalUsd={1e12} aggressorPop={150e6} />);
    const btn = screen.getByRole('button');
    const firstText = btn.textContent;
    await userEvent.click(btn);
    expect(btn.textContent).not.toBe(firstText);
  });
});
