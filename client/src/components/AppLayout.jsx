import { LinkedInIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

const DEVELOPER = { name: 'Muhammad Luqman', url: 'https://www.linkedin.com/in/mluqmangn' };

export function AppLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
            <img src="/favicon.svg" alt="" width="24" height="24" />
            <span className="text-[15px] font-semibold tracking-tight">GradeGrid</span>
          </a>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-fg-muted sm:px-6">
          <p>
            © {new Date().getFullYear()} GradeGrid
            <span> · Files are read to extract marks and are not kept.</span>
          </p>
          <p className="flex items-center gap-1.5">
            Built by
            <a
              href={DEVELOPER.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded font-medium text-fg transition-colors hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:text-brand-500"
            >
              {DEVELOPER.name}
              <LinkedInIcon className="size-3.5" />
              <span className="sr-only">on LinkedIn (opens in a new tab)</span>
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
