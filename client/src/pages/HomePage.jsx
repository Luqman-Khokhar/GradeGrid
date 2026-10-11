import { ExportPanel } from '../features/export/ExportPanel';
import { UploadPanel } from '../features/upload/UploadPanel';

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold sm:text-3xl">Result cards to one spreadsheet</h1>
        <p className="max-w-prose text-fg-muted">
          Upload student result cards (PDFs or screenshots), pick the columns you need, and download one Excel or CSV file with one row per
          student.
        </p>
      </section>
      <UploadPanel />
      <ExportPanel />
    </div>
  );
}
