import { AlertIcon, CheckIcon } from './icons';

const TONES = {
  danger: 'border-danger/30 bg-danger/[0.06] text-danger',
  success: 'border-success/30 bg-success/[0.06] text-success',
  warning: 'border-warning/30 bg-warning/[0.06] text-warning',
};

export function Alert({ tone = 'danger', title, children, action }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 rounded-md border px-4 py-3 sm:grid-cols-[auto_1fr_auto] ${TONES[tone]}`}
    >
      {tone === 'success' ? (
        <CheckIcon className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertIcon className="mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="text-sm text-fg">{children}</div>}
      </div>
      {action && <div className="col-start-2 sm:col-start-auto">{action}</div>}
    </div>
  );
}
