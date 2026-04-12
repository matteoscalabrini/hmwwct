import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemorialImmersiveOverlay } from '@/components/calculator/MemorialImmersiveOverlay';

describe('MemorialImmersiveOverlay', () => {
  it('renders a dialog when open=true', () => {
    render(
      <MemorialImmersiveOverlay
        open
        onClose={vi.fn()}
        total={1000}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(
      <MemorialImmersiveOverlay
        open
        onClose={vi.fn()}
        total={1000}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has an aria-label on the dialog', () => {
    render(
      <MemorialImmersiveOverlay
        open
        onClose={vi.fn()}
        total={1000}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <MemorialImmersiveOverlay
        open
        onClose={onClose}
        total={1000}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <MemorialImmersiveOverlay
        open
        onClose={onClose}
        total={1000}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when open=false', () => {
    render(
      <MemorialImmersiveOverlay
        open={false}
        onClose={vi.fn()}
        total={1000}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
