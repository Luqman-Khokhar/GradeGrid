import { useEffect, useId, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../../components/Button';
import { CloseIcon } from '../../components/icons';
import { Spinner } from '../../components/Spinner';
import { clearSaveError, fetchPresets, removePreset, savePreset, selectPresets } from './presetsSlice';

/** Named column selections stored on the server, shared by everyone using this GradeGrid. */
export function SavedSelections({ availableKeys, selectedKeys, onApply }) {
  const dispatch = useDispatch();
  const { items, status, error, saving, saveError, removeError } = useSelector(selectPresets);
  const [name, setName] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [notice, setNotice] = useState('');
  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    if (status === 'idle') dispatch(fetchPresets());
  }, [status, dispatch]);

  const apply = (preset) => {
    const keys = preset.columns.filter((key) => availableKeys.has(key));
    const missing = preset.columns.length - keys.length;
    onApply(new Set(keys));
    dispatch(clearSaveError());
    setNotice(
      missing
        ? `Applied “${preset.name}”. ${missing} of its columns are not in these cards.`
        : `Applied “${preset.name}”.`,
    );
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const result = await dispatch(savePreset({ name: name.trim(), columns: [...selectedKeys] }));
    if (savePreset.fulfilled.match(result)) {
      setNotice(`Saved “${result.payload.name}”.`);
      setName('');
    }
  };

  return (
    <section aria-labelledby={`${inputId}-heading`} className="space-y-3 rounded-xl border border-border p-4">
      <h3 id={`${inputId}-heading`} className="text-sm font-semibold">
        Saved selections
      </h3>

      {status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Loading saved selections…
        </p>
      )}

      {status === 'failed' && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <span>Saved selections could not be loaded: {error}</span>
          <Button variant="secondary" size="sm" onClick={() => dispatch(fetchPresets())}>
            Retry
          </Button>
        </div>
      )}

      {status === 'succeeded' && items.length === 0 && (
        <p className="text-sm text-fg-muted">
          No saved selections yet. Pick columns below, then save them here to reuse next time.
        </p>
      )}

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((preset) => (
            <li key={preset.id} className="flex items-center rounded-lg border border-border">
              <Button variant="ghost" size="sm" onClick={() => apply(preset)} title={`${preset.columns.length} columns`}>
                {preset.name}
              </Button>
              {confirmId === preset.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  onClick={async () => {
                    setConfirmId(null);
                    dispatch(clearSaveError());
                    const result = await dispatch(removePreset(preset.id));
                    if (removePreset.fulfilled.match(result)) setNotice(`Deleted “${preset.name}”.`);
                  }}
                  onBlur={() => setConfirmId(null)}
                  autoFocus
                >
                  Confirm delete
                </Button>
              ) : (
                <Button variant="ghost" size="icon" aria-label={`Delete ${preset.name}`} onClick={() => setConfirmId(preset.id)}>
                  <CloseIcon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {removeError && <p className="text-sm text-danger">Could not delete: {removeError}</p>}

      {status === 'succeeded' && (
        <form onSubmit={handleSave} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor={inputId} className="text-sm font-medium">
              Save current selection as
            </label>
            <input
              id={inputId}
              value={name}
              maxLength={60}
              onChange={(event) => {
                setName(event.target.value);
                if (saveError) dispatch(clearSaveError());
              }}
              placeholder="e.g. Totals only"
              aria-invalid={Boolean(saveError)}
              aria-describedby={saveError ? errorId : undefined}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 aria-[invalid=true]:border-danger"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={!name.trim() || !selectedKeys.size || saving}>
            {saving && <Spinner />}
            Save
          </Button>
        </form>
      )}

      {saveError && (
        <p id={errorId} className="text-sm text-danger">
          {saveError}
        </p>
      )}
      <p className="text-sm text-fg-muted" aria-live="polite">
        {notice}
      </p>
    </section>
  );
}
