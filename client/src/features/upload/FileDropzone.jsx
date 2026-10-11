import { useId, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { UploadIcon } from '../../components/icons';
import { formatBytes } from '../../utils/format';
import { ACCEPT, MAX_FILE_BYTES } from './fileRules';

export function FileDropzone({ onFiles, disabled = false }) {
  const inputRef = useRef(null);
  const hintId = useId();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled && event.dataTransfer.files.length) onFiles(event.dataTransfer.files);
  };

  const handleChange = (event) => {
    if (event.target.files.length) onFiles(event.target.files);
    event.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors sm:py-14 ${
        isDragging ? 'border-brand-500 bg-brand-50' : 'border-border bg-surface-muted'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <UploadIcon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">
          <span className="hidden sm:inline">Drag and drop result cards here, or</span>
          <span className="sm:hidden">Add result cards</span>
        </p>
        <p id={hintId} className="text-sm text-fg-muted">
          PDF or screenshot (PNG, JPG), up to {formatBytes(MAX_FILE_BYTES)} each. You can select many at once.
        </p>
        <p className="text-xs text-fg-muted">
          Tip: use the downloaded PDF or a screenshot. Camera photos of a printed card may not read correctly.
        </p>
      </div>
      <Button onClick={() => inputRef.current?.click()} disabled={disabled} aria-describedby={hintId}>
        Choose files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={handleChange}
      />
    </div>
  );
}
