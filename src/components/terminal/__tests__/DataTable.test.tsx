import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from '../DataTable';

describe('<DataTable>', () => {
  it('renders rows with label and value', () => {
    render(
      <DataTable>
        <DataTable.Row label="DURATION" value="1.5 YEARS" />
        <DataTable.Row label="DISPLACED" value="8.4M" tone="alert" />
      </DataTable>
    );
    expect(screen.getByText('DURATION')).toBeInTheDocument();
    expect(screen.getByText('1.5 YEARS')).toBeInTheDocument();
    expect(screen.getByText('DISPLACED')).toBeInTheDocument();
    expect(screen.getByText('8.4M')).toBeInTheDocument();
  });

  it('marks alert-toned rows with data-tone attr', () => {
    const { container } = render(
      <DataTable>
        <DataTable.Row label="X" value="Y" tone="alert" />
      </DataTable>
    );
    expect(container.querySelector('[data-tone="alert"]')).not.toBeNull();
  });
});
