import { useId, useState } from 'react';
import { Button } from '../../components/Button';

const SEARCH_THRESHOLD = 12;

export function ColumnPicker({ columns, totalRows, selectedKeys, onToggle, onSelectAll, onClear }) {
  const searchId = useId();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const visible = needle ? columns.filter((column) => column.label.toLowerCase().includes(needle)) : columns;

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Columns to include in the CSV</legend>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">
          {selectedKeys.size} of {columns.length} columns selected
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSelectAll}>
            Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {columns.length > SEARCH_THRESHOLD && (
        <div className="space-y-1">
          <label htmlFor={searchId} className="text-sm font-medium">
            Find a column
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Mathematics"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-fg-muted">No columns match “{query}”.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((column) => (
            <li key={column.key}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 hover:bg-surface-muted has-[:checked]:border-brand-500 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500">
                <input
                  type="checkbox"
                  checked={selectedKeys.has(column.key)}
                  onChange={() => onToggle(column.key)}
                  className="mt-0.5 size-4 shrink-0 accent-brand-600 focus-visible:outline-none"
                />
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium">{column.label}</span>
                  {column.count !== undefined && column.count < totalRows && (
                    <span className="block text-xs text-fg-muted">
                      Found in {column.count} of {totalRows} cards
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
