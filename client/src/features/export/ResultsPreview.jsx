const PREVIEW_ROWS = 5;

export function ResultsPreview({ columns, rows }) {
  const shown = rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <caption className="px-4 py-2 text-left text-xs text-fg-muted">
          {rows.length > PREVIEW_ROWS
            ? `Preview: first ${PREVIEW_ROWS} of ${rows.length} students. The CSV includes all of them.`
            : `Preview: all ${rows.length} student${rows.length > 1 ? 's' : ''}.`}
        </caption>
        <thead className="bg-surface-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-2 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {shown.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-2">
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
