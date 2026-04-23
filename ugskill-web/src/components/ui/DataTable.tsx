import React from 'react';
import { cn } from '../../lib/utils';
import './Primitives.css';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends Record<string, any>>({ 
  data, columns, className, page, totalPages, onPageChange 
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col gap-4">
      <div className={cn('ug-table-container', className)}>
        <table className="ug-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--on-surface-variant)' }}>
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="base-btn outline-btn" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
            disabled={page === 1}
            onClick={() => onPageChange?.((page || 1) - 1)}
          >
            Prev
          </button>
          <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
            Page {page} of {totalPages}
          </span>
          <button 
            className="base-btn outline-btn" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
            disabled={page === totalPages}
            onClick={() => onPageChange?.((page || 1) + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
