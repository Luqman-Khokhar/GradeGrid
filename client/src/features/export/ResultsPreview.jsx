const PREVIEW_ROWS = 5;

export function ResultsPreview({ columns, rows }) {
  const shown = rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="scroll-area overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <caption className="caption-bottom border-t border-border px-3 py-2 text-left text-xs text-fg-muted">
          {rows.length > PREVIEW_ROWS
            ? `Preview: first ${PREVIEW_ROWS} of ${rows.length} students. The CSV includes all of them.`
            : `Preview: all ${rows.length} student${rows.length > 1 ? 's' : ''}.`}
        </caption>
        <thead className="bg-surface-muted text-xs text-fg-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="whitespace-nowrap border-b border-border px-3 py-2 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border tabular-nums">
          {shown.map((row, index) => (
            <tr key={index} className="hover:bg-surface-muted/60">
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-3 py-2">
                  {row[column.key] ?? <span className="text-fg-muted">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
