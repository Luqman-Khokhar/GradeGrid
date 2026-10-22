import { ExportPanel } from '../features/export/ExportPanel';
import { UploadPanel } from '../features/upload/UploadPanel';

export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Result cards to one spreadsheet</h1>
        <p className="max-w-2xl text-[15px] text-fg-muted">
          Upload student result cards (PDFs or screenshots) and download one class sheet in Excel: one row per student, one column per subject. Need other details? Use
          custom columns.
        </p>
      </div>
      <UploadPanel />
      <ExportPanel />
    </div>
  );
}
