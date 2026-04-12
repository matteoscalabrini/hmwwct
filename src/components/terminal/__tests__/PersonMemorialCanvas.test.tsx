import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonMemorialCanvas } from '@/components/terminal/PersonMemorialCanvas';

describe('PersonMemorialCanvas', () => {
  it('renders a canvas element in the document', () => {
    render(
      <PersonMemorialCanvas
        total={1000}
        childRatio={0.4}
        casualtyRatio={0.005}
        height={360}
      />
    );
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('wraps the canvas in a scrollable container', () => {
    const { container } = render(
      <PersonMemorialCanvas
        total={500}
        childRatio={0.3}
        casualtyRatio={0.01}
        height={200}
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.overflow).toBe('auto');
    expect(wrapper.style.height).toBe('200px');
  });
});
