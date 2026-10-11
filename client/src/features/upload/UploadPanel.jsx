import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Panel } from '../../components/Panel';
import { Spinner } from '../../components/Spinner';
import { FileDropzone } from './FileDropzone';
import { SelectedFileList } from './SelectedFileList';
import { UploadProgress } from './UploadProgress';
import { validateFiles } from './fileRules';
import { extractResults, reset, resultRemoved, selectUpload } from './uploadSlice';

export function UploadPanel() {
  const dispatch = useDispatch();
  const { status, error, progress, results } = useSelector(selectUpload);
  const [items, setItems] = useState([]);
  const [rejections, setRejections] = useState([]);

  const isUploading = status === 'loading';
  const finished = items.filter((item) => results[item.id]);
  const failed = finished.filter((item) => !results[item.id].ok);
  const pending = items.filter((item) => !results[item.id]);
  const succeededCount = finished.length - failed.length;

  const addFiles = (fileList) => {
    const { accepted, rejected } = validateFiles(
      fileList,
      items.map((item) => item.id),
    );
    setItems((prev) => [...prev, ...accepted]);
    setRejections(rejected);
  };

  const removeFile = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    dispatch(resultRemoved(id));
  };

  const clearAll = () => {
    setItems([]);
    setRejections([]);
    dispatch(reset());
  };

  return (
    <Panel
      headingId="upload-heading"
      title="Result cards"
      description="Add the cards to read. Nothing is extracted until you press Extract."
      meta={items.length > 0 && `${items.length} file${items.length > 1 ? 's' : ''}`}
    >
      <FileDropzone onFiles={addFiles} disabled={isUploading} />

      {rejections.length > 0 && (
        <Alert
          title={`${rejections.length} file${rejections.length > 1 ? 's were' : ' was'} not added`}
          action={
            <Button variant="ghost" size="sm" onClick={() => setRejections([])}>
              Dismiss
            </Button>
          }
        >
          <ul className="list-disc space-y-0.5 pl-4">
            {rejections.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      )}

      {status === 'failed' && (
        <Alert
          title="Extraction stopped"
          action={
            <Button variant="secondary" size="sm" onClick={() => dispatch(extractResults(pending))}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No result cards added yet. Choose PDFs or screenshots above to get started.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {items.length} file{items.length > 1 ? 's' : ''} selected
            </p>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={isUploading}>
              Clear all
            </Button>
          </div>

          {isUploading && <UploadProgress done={progress.done} total={progress.total} />}

          {!isUploading && finished.length > 0 && (
            <Alert
              tone={failed.length ? 'danger' : 'success'}
              title={`${succeededCount} of ${finished.length} result cards extracted`}
              action={
                failed.length > 0 && (
                  <Button variant="secondary" size="sm" onClick={() => dispatch(extractResults(failed))}>
                    Retry {failed.length} failed
                  </Button>
                )
              }
            >
              {failed.length > 0 && 'Failed files are marked below. Fix or remove them, or retry.'}
            </Alert>
          )}

          <SelectedFileList items={items} results={results} isUploading={isUploading} onRemove={removeFile} />

          <div className="flex justify-end">
            <Button
              onClick={() => dispatch(extractResults(pending))}
              disabled={isUploading || pending.length === 0}
              className="w-full sm:w-auto"
            >
              {isUploading && <Spinner />}
              {isUploading
                ? 'Extracting…'
                : pending.length
                  ? `Extract ${pending.length} file${pending.length > 1 ? 's' : ''}`
                  : 'All files extracted'}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
