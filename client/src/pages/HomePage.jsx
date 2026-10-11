import { ExportPanel } from '../features/export/ExportPanel';
import { UploadPanel } from '../features/upload/UploadPanel';

export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 pb-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Result cards to one spreadsheet</h1>
        <p className="max-w-2xl text-[15px] text-fg-muted">
          Upload student result cards (PDFs or screenshots), pick the columns you need, and download one Excel or CSV file with one row per
          student.
        </p>
      </div>
      <UploadPanel />
      <ExportPanel />
    </div>
  );
}
