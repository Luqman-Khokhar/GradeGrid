export function UploadProgress({ done, total }) {
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <p className="text-sm text-fg-muted" aria-live="polite">
        Processing {done} of {total} files…
      </p>
      <p className="text-xs text-fg-muted">Scanned result cards take about 10 seconds each to read.</p>
      <div
        role="progressbar"
        aria-label="Extraction progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
