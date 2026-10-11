const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-muted active:bg-border',
  ghost: 'text-fg-muted hover:bg-surface-muted hover:text-fg active:bg-border',
};

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  icon: 'size-8 justify-center',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-inherit ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
