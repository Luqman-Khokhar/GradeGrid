import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '../../components/Alert';
import { Panel } from '../../components/Panel';
import { SavedSelections } from '../presets/SavedSelections';
import { ClassSheetPanel } from './ClassSheetPanel';
import { ColumnPicker } from './ColumnPicker';
import { DownloadActions } from './DownloadActions';
import { groupColumns } from './columnGroups';
import { ResultsPreview } from './ResultsPreview';
import {
  FILE_COLUMN,
  selectCards,
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
  const cards = useSelector(selectCards);
  const [customOpen, setCustomOpen] = useState(false);
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

  // Recognised marks sheets download as the class sheet; the column picker stays one click away.
  const showCustom = !cards.length || customOpen;

  const notices = (
    <>
      {emptyNames.length > 0 && (
        <Alert title={`No details found in ${emptyNames.length} file${emptyNames.length > 1 ? 's' : ''}`}>
          {emptyNames.join(', ')}. The file may be blurry or use a layout GradeGrid does not support yet, so it is left out of the download.
        </Alert>
      )}

      {warnedNames.length > 0 && (
        <Alert tone="warning" title={`Double-check ${warnedNames.length} card${warnedNames.length > 1 ? 's' : ''}`}>
          {warnedNames.join(', ')}. Some values were unclear or auto-corrected so the marks add up. Details are listed
          under each file above.
        </Alert>
      )}
    </>
  );

  return (
    <>
      {cards.length > 0 && (
        <ClassSheetPanel
          cards={cards}
          skippedCount={rows.length - cards.length}
          customOpen={customOpen}
          onToggleCustom={() => setCustomOpen((open) => !open)}
        >
          {notices}
        </ClassSheetPanel>
      )}

      {showCustom && (
      <div id="custom-export" className="space-y-6">
      <Panel
        headingId="export-heading"
        title="Columns"
        description="Pick the details to keep. Each student becomes one row in the file."
      >
        {!cards.length && notices}

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
          </>
        )}
      </Panel>

      {rows.length > 0 && (
        <Panel
          headingId="download-heading"
          title="Preview and download"
          meta={`${rows.length} student${rows.length > 1 ? 's' : ''} · ${selectedColumns.length} column${selectedColumns.length === 1 ? '' : 's'}`}
          footer={<DownloadActions columns={selectedColumns} rows={rows} />}
        >
          {selectedColumns.length > 0 ? (
            <ResultsPreview columns={selectedColumns} rows={rows} />
          ) : (
            <p className="rounded-md border border-dashed border-border-strong p-6 text-center text-sm text-fg-muted">
              Select at least one column to preview and download the file.
            </p>
          )}
        </Panel>
      )}
      </div>
      )}
    </>
  );
}
