import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { CheckIcon, SearchIcon } from '../../components/icons';

const SEARCH_THRESHOLD = 12;

export function ColumnPicker({ columns, groups, totalRows, selectedKeys, onToggle, onSetMany, onSelectAll, onClear }) {
  const searchId = useId();
  const quickPickId = useId();
  const countId = useId();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const visible = needle ? columns.filter((column) => column.label.toLowerCase().includes(needle)) : columns;

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Columns to include in the CSV</legend>

      {groups.length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-fg-muted" id={quickPickId}>
            Quick pick for every subject
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={quickPickId}>
            {groups.map((group) => {
              const allOn = group.keys.every((key) => selectedKeys.has(key));
              return (
                <Button
                  key={group.label}
                  variant="secondary"
                  size="sm"
                  aria-pressed={allOn}
                  onClick={() => onSetMany(group.keys, !allOn)}
                  className="aria-pressed:border-brand-500 aria-pressed:bg-brand-50 aria-pressed:text-brand-700 dark:aria-pressed:text-brand-500"
                >
                  {allOn && <CheckIcon className="size-3.5" />}
                  {group.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted/60 px-3 py-2">
          {columns.length > SEARCH_THRESHOLD && (
            <div className="relative min-w-0 flex-1 basis-48">
              <label htmlFor={searchId} className="sr-only">
                Find a column
              </label>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-muted" />
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a column, e.g. Mathematics"
                aria-describedby={countId}
                className="h-8 w-full rounded-md border border-border bg-surface pr-2 pl-8 text-sm placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
              />
            </div>
          )}
          <p id={countId} className="mr-auto text-[13px] text-fg-muted tabular-nums" aria-live="polite">
            <span className="font-medium text-fg">{selectedKeys.size}</span> of {columns.length} selected
            {needle && ` · ${visible.length} shown`}
          </p>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onSelectAll} disabled={selectedKeys.size === columns.length}>
              Select all
            </Button>
            <Button variant="ghost" size="sm" onClick={onClear} disabled={selectedKeys.size === 0}>
              Clear
            </Button>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-fg-muted">
            No columns match “{query}”.{' '}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded font-medium text-brand-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-brand-500"
            >
              Clear search
            </button>
          </p>
        ) : (
          <ul className="scroll-area grid max-h-72 overflow-y-auto overscroll-contain p-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((column) => (
              <li key={column.key}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded px-2 py-1.5 hover:bg-surface-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-brand-500">
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(column.key)}
                    onChange={() => onToggle(column.key)}
                    className="mt-0.5 size-4 shrink-0 accent-brand-600 focus-visible:outline-none"
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-sm">{column.label}</span>
                    {column.count !== undefined && column.count < totalRows && (
                      <span className="block text-xs text-fg-muted">
                        In {column.count} of {totalRows} cards
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </fieldset>
  );
}
