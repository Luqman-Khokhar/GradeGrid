import { Button } from '../../components/Button';
import { AlertIcon, CheckIcon, CloseIcon, FileIcon } from '../../components/icons';
import { Spinner } from '../../components/Spinner';
import { formatBytes } from '../../utils/format';

function FileStatus({ result, isUploading }) {
  if (result?.ok && !result.fields?.length) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
        <AlertIcon className="size-3.5" /> No details found
      </span>
    );
  }
  if (result?.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
        <CheckIcon className="size-3.5" /> Extracted
      </span>
    );
  }
  if (result) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
        <AlertIcon className="size-3.5" /> Failed
      </span>
    );
  }
  if (isUploading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
        <Spinner className="size-3.5" /> Processing
      </span>
    );
  }
  return <span className="text-xs text-fg-muted">Ready</span>;
}

export function SelectedFileList({ items, results, isUploading, onRemove }) {
  return (
    <ul className="scroll-area max-h-96 divide-y divide-border overflow-y-auto rounded-md border border-border">
      {items.map(({ id, file }) => {
        const result = results[id];
        return (
          <li key={id} className="flex items-start gap-3 px-3 py-2.5 sm:px-4">
            <FileIcon className="mt-0.5 size-5 shrink-0 text-fg-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={file.name}>
                {file.name}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs text-fg-muted">{formatBytes(file.size)}</span>
                <FileStatus result={result} isUploading={isUploading} />
              </div>
              {result && !result.ok && <p className="mt-1 text-xs text-danger">{result.error}</p>}
              {result?.ok && result.warnings?.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-warning">
                  {result.warnings.map((warning) => (
                    <li key={warning}>Check: {warning}</li>
                  ))}
                </ul>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(id)}
              disabled={isUploading}
              aria-label={`Remove ${file.name}`}
            >
              <CloseIcon />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
