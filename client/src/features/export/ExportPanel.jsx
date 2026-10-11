import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { DownloadIcon } from '../../components/icons';
import { downloadCsv, toCsv } from '../../utils/csv';
import { SavedSelections } from '../presets/SavedSelections';
import { ColumnPicker } from './ColumnPicker';
import { groupColumns } from './columnGroups';
import { ResultsPreview } from './ResultsPreview';
import {
  FILE_COLUMN,
  selectColumns,
  selectEmptyResultNames,
  selectStudentRows,
  selectWarnedNames,
} from './exportSelectors';

export function ExportPanel() {
  const rows = useSelector(selectStudentRows);
  const fieldColumns = useSelector(selectColumns);
  const emptyNames = useSelector(selectEmptyResultNames);
  const warnedNames = useSelector(selectWarnedNames);
  // Track exclusions so columns from newly extracted cards start selected.
  const [excluded, setExcluded] = useState(() => new Set());

  const allColumns = useMemo(() => [FILE_COLUMN, ...fieldColumns], [fieldColumns]);
  const groups = useMemo(() => groupColumns(fieldColumns), [fieldColumns]);
  const selectedKeys = useMemo(
    () => new Set(allColumns.filter((column) => !excluded.has(column.key)).map((column) => column.key)),
    [allColumns, excluded],
  );
  const availableKeys = useMemo(() => new Set(allColumns.map((column) => column.key)), [allColumns]);
  const selectedColumns = allColumns.filter((column) => selectedKeys.has(column.key));

  if (!rows.length && !emptyNames.length) return null;

  const toggle = (key) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const setMany = (keys, include) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => (include ? next.delete(key) : next.add(key)));
      return next;
    });

  const handleDownload = () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`gradegrid-results-${date}.csv`, toCsv(selectedColumns, rows));
  };

  return (
    <section aria-labelledby="export-heading" className="space-y-6 border-t border-border pt-8">
      <div className="space-y-1">
        <h2 id="export-heading" className="text-xl font-semibold">
          Choose columns
        </h2>
        <p className="text-sm text-fg-muted">
          Pick the details to keep. Each student becomes one row in the CSV.
        </p>
      </div>

      {emptyNames.length > 0 && (
        <Alert title={`No details found in ${emptyNames.length} file${emptyNames.length > 1 ? 's' : ''}`}>
          {emptyNames.join(', ')}. The PDF may be blurry or use a layout GradeGrid does not support yet, so it is left out of the CSV.
        </Alert>
      )}

      {warnedNames.length > 0 && (
        <Alert tone="warning" title={`Double-check ${warnedNames.length} card${warnedNames.length > 1 ? 's' : ''}`}>
          {warnedNames.join(', ')}. Some values were unclear or auto-corrected so the marks add up. Details are listed
          under each file above.
        </Alert>
      )}

      {rows.length > 0 && (
        <>
          <SavedSelections
            availableKeys={availableKeys}
            selectedKeys={selectedKeys}
            onApply={(keys) => setExcluded(new Set(allColumns.filter((c) => !keys.has(c.key)).map((c) => c.key)))}
          />

          <ColumnPicker
            columns={allColumns}
            groups={groups}
            totalRows={rows.length}
            selectedKeys={selectedKeys}
            onToggle={toggle}
            onSetMany={setMany}
            onSelectAll={() => setExcluded(new Set())}
            onClear={() => setExcluded(new Set(allColumns.map((column) => column.key)))}
          />

          {selectedColumns.length > 0 ? (
            <ResultsPreview columns={selectedColumns} rows={rows} />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-fg-muted">
              Select at least one column to preview and download the CSV.
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleDownload} disabled={!selectedColumns.length} className="w-full sm:w-auto">
              <DownloadIcon />
              Download CSV ({rows.length} student{rows.length > 1 ? 's' : ''})
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
