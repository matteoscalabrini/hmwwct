import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusStrip } from '../StatusStrip';

describe('<StatusStrip>', () => {
  it('renders UPLINK status', () => {
    render(<StatusStrip uplink="NOMINAL" sources={9} sourceTotal={9} version="2.6.1" />);
    expect(screen.getByText(/UPLINK/)).toBeInTheDocument();
    expect(screen.getByText(/NOMINAL/)).toBeInTheDocument();
  });

  it('renders source count', () => {
    render(<StatusStrip uplink="NOMINAL" sources={7} sourceTotal={9} version="x" />);
    expect(screen.getByText(/SOURCES 7\/9/)).toBeInTheDocument();
  });

  it('renders WOPR version', () => {
    render(<StatusStrip uplink="NOMINAL" sources={9} sourceTotal={9} version="2.6.1" />);
    expect(screen.getByText(/WOPR v2.6.1/)).toBeInTheDocument();
  });
});
