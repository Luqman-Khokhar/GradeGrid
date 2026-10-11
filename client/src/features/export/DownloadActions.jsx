import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { DownloadIcon } from '../../components/icons';
import { Spinner } from '../../components/Spinner';
import { downloadCsv, toCsv } from '../../utils/csv';
import { downloadBlob } from '../../utils/download';
import { XLSX_TYPE, buildWorkbook } from '../../utils/xlsx';
import { FAIL_PERCENT, LOW_PERCENT } from '../../utils/xlsxPlan';

const fileStem = () => `gradegrid-results-${new Date().toISOString().slice(0, 10)}`;

export function DownloadActions({ columns, rows }) {
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState(null);
  const noteId = useId();
  const disabled = !columns.length;
  const count = `${rows.length} student${rows.length > 1 ? 's' : ''}`;

  const downloadExcel = async () => {
    setBuilding(true);
    setError(null);
    try {
      downloadBlob(`${fileStem()}.xlsx`, await buildWorkbook(columns, rows), XLSX_TYPE);
    } catch (err) {
      setError(`The Excel file could not be created (${err.message}). Try again, or download the CSV instead.`);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <p id={noteId} className="max-w-xl text-[13px] text-fg-muted">
        The Excel file is ready to use: every column can be filtered, sorted and searched from its header. Red marks a
        fail, absence or under {FAIL_PERCENT}%; amber marks under {LOW_PERCENT}% or a low grade.
      </p>
      <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          onClick={() => downloadCsv(`${fileStem()}.csv`, toCsv(columns, rows))}
          disabled={disabled}
        >
          <DownloadIcon />
          CSV
        </Button>
        <Button onClick={downloadExcel} disabled={disabled || building} aria-describedby={noteId}>
          {building ? <Spinner /> : <DownloadIcon />}
          {building ? 'Preparing Excel…' : `Download Excel (${count})`}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger lg:basis-full">
          {error}
        </p>
      )}
    </div>
  );
}
