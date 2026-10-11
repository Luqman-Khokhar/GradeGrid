import { useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

const STORAGE_KEY = 'gradegrid-theme';
const OPTIONS = [
  { value: 'light', label: 'Light theme', Icon: SunIcon },
  { value: 'system', label: 'Match system theme', Icon: MonitorIcon },
  { value: 'dark', label: 'Dark theme', Icon: MoonIcon },
];

const readPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'system';
  } catch {
    return 'system';
  }
};

/** Light / system / dark switch. Writes data-theme on <html>; index.html applies it before first paint. */
export function ThemeToggle() {
  const [preference, setPreference] = useState(readPreference);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
    if (preference !== 'system') return undefined;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  return (
    <div role="radiogroup" aria-label="Color theme" className="flex rounded-md border border-border bg-surface-muted p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={`flex size-7 items-center justify-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 ${
              active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg active:bg-border'
            }`}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
