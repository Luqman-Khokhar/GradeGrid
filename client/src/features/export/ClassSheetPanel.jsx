import { useId, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { DownloadIcon } from '../../components/icons';
import { Panel } from '../../components/Panel';
import { Spinner } from '../../components/Spinner';
import { buildClassWorkbook } from '../../utils/classSheet';
import { buildClassSheets } from '../../utils/classSheetPlan';
import { downloadBlob } from '../../utils/download';
import { XLSX_TYPE } from '../../utils/xlsx';
import { FAIL_PERCENT } from '../../utils/xlsxPlan';

const PREVIEW_ROWS = 3;

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function SheetPreview({ sheet }) {
  const shown = sheet.rows.slice(0, PREVIEW_ROWS);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">
        {sheet.name} <span className="font-normal text-fg-muted">· {plural(sheet.rows.length, 'student')}</span>
      </h3>
      <div className="scroll-area overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <caption className="caption-bottom border-t border-border px-3 py-2 text-left text-xs text-fg-muted">
            {sheet.rows.length > PREVIEW_ROWS
              ? `Preview: first ${PREVIEW_ROWS} of ${sheet.rows.length} students, sorted by roll no.`
              : `Preview: ${plural(sheet.rows.length, 'student')}.`}
          </caption>
          <thead className="bg-surface-muted text-xs text-fg-muted">
            <tr>
              {sheet.headers.map((header) => (
                <th key={header} scope="col" className="whitespace-nowrap border-b border-border px-3 py-2 text-center font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border tabular-nums">
            {shown.map((row, r) => (
              <tr key={r} className="hover:bg-surface-muted/60">
                {row.values.map((value, c) => (
                  <td
                    key={c}
                    className={`whitespace-nowrap px-3 py-2 text-center ${row.fails.has(c) ? 'font-semibold text-danger' : ''}`}
                  >
                    {value ?? <span className="text-fg-muted">—</span>}
                    {row.fails.has(c) && <span className="sr-only"> (fail)</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The default download: the school's marks-sheet layout, one worksheet per group. */
export function ClassSheetPanel({ cards, skippedCount, customOpen, onToggleCustom, children }) {
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState(null);
  const noteId = useId();
  const sheets = useMemo(() => buildClassSheets(cards), [cards]);

  const download = async () => {
    setBuilding(true);
    setError(null);
    try {
      const name = `class-sheet-${new Date().toISOString().slice(0, 10)}.xlsx`;
      downloadBlob(name, await buildClassWorkbook(cards), XLSX_TYPE);
    } catch (err) {
      setError(`The Excel file could not be created (${err.message}). Try again, or use custom columns below.`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <Panel
      headingId="class-sheet-heading"
      title="Class sheet"
      description="Roll no, names, one column per subject, totals and status. Each group gets its own sheet."
      meta={`${plural(cards.length, 'student')} · ${plural(sheets.length, 'sheet')}`}
      footer={
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <p id={noteId} className="max-w-xl text-[13px] text-fg-muted">
            Red marks a subject under {FAIL_PERCENT}% or absent. Students with one are marked COMPARTMENT, and Total Obtained
            lists those subjects.
          </p>
          <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onToggleCustom} aria-expanded={customOpen} aria-controls="custom-export">
              {customOpen ? 'Hide custom columns' : 'Custom columns'}
            </Button>
            <Button onClick={download} disabled={building} aria-describedby={noteId}>
              {building ? <Spinner /> : <DownloadIcon />}
              {building ? 'Preparing Excel…' : `Download class sheet (${plural(cards.length, 'student')})`}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger lg:basis-full">
              {error}
            </p>
          )}
        </div>
      }
    >
      {children}
      {skippedCount > 0 && (
        <p className="text-sm text-fg-muted">
          {plural(skippedCount, 'file')} {skippedCount === 1 ? 'is not a' : 'are not'} BISE marks sheet
          {skippedCount === 1 ? '' : 's'}, so {skippedCount === 1 ? 'it is' : 'they are'} only in the custom columns export.
        </p>
      )}
      {sheets.map((sheet) => (
        <SheetPreview key={sheet.name} sheet={sheet} />
      ))}
    </Panel>
  );
}
