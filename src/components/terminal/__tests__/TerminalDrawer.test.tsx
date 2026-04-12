import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TerminalDrawer } from '../TerminalDrawer';

describe('<TerminalDrawer>', () => {
  it('renders with role="dialog" when open', () => {
    render(
      <TerminalDrawer open onClose={vi.fn()} title="DETAIL">
        <p>content</p>
      </TerminalDrawer>
    );
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('shows children when open', () => {
    render(
      <TerminalDrawer open onClose={vi.fn()} title="DETAIL">
        <p>content text</p>
      </TerminalDrawer>
    );
    expect(screen.getByText('content text')).toBeDefined();
  });

  it('shows the title', () => {
    render(
      <TerminalDrawer open onClose={vi.fn()} title="DETAIL">
        <p>x</p>
      </TerminalDrawer>
    );
    expect(screen.getByText('DETAIL')).toBeDefined();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <TerminalDrawer open onClose={onClose} title="DETAIL">
        <p>x</p>
      </TerminalDrawer>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <TerminalDrawer open onClose={onClose} title="DETAIL">
        <p>x</p>
      </TerminalDrawer>
    );
    const backdrop = container.querySelector('[data-testid="drawer-backdrop"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies translateX(100%) to panel when closed', () => {
    const { container } = render(
      <TerminalDrawer open={false} onClose={vi.fn()} title="DETAIL">
        <p>x</p>
      </TerminalDrawer>
    );
    const panel = container.querySelector('[data-testid="drawer-panel"]');
    expect(panel).not.toBeNull();
    expect((panel as HTMLElement).style.transform).toBe('translateX(100%)');
  });

  it('applies translateX(0) to panel when open', () => {
    const { container } = render(
      <TerminalDrawer open onClose={vi.fn()} title="DETAIL">
        <p>x</p>
      </TerminalDrawer>
    );
    const panel = container.querySelector('[data-testid="drawer-panel"]');
    expect(panel).not.toBeNull();
    expect((panel as HTMLElement).style.transform).toBe('translateX(0)');
  });

  it('has aria-modal="true"', () => {
    render(
      <TerminalDrawer open onClose={vi.fn()} title="DETAIL">
        <p>x</p>
      </TerminalDrawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('does not call onClose when panel content is clicked', () => {
    const onClose = vi.fn();
    render(
      <TerminalDrawer open onClose={onClose} title="DETAIL">
        <p>content</p>
      </TerminalDrawer>
    );
    const panel = screen.getByText('content').closest('[data-testid="drawer-panel"]');
    if (panel) fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });
});
