export function AppLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span className="text-lg font-semibold">GradeGrid</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-border py-4 text-center text-sm text-fg-muted">
        © {new Date().getFullYear()} GradeGrid
      </footer>
    </div>
  );
}
