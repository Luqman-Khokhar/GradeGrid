/** Bordered page section with a title bar. `headingId` ties the <section> to its heading. */
export function Panel({ headingId, title, description, meta, footer, children, className = '' }) {
  return (
    <section aria-labelledby={headingId} className={`rounded-lg border border-border bg-surface shadow-xs ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3 sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <h2 id={headingId} className="text-[15px] font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="text-sm text-fg-muted">{description}</p>}
        </div>
        {meta && <div className="shrink-0 pt-0.5 text-sm text-fg-muted">{meta}</div>}
      </div>
      <div className="space-y-5 p-4 sm:p-5">{children}</div>
      {footer && <div className="border-t border-border bg-surface-muted/60 px-4 py-3 sm:px-5">{footer}</div>}
    </section>
  );
}
