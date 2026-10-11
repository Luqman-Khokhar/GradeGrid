import { ThemeToggle } from './ThemeToggle';

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
          <span>© {new Date().getFullYear()} GradeGrid</span>
          <span>Files are read to extract marks and are not kept.</span>
        </div>
      </footer>
    </div>
  );
}
