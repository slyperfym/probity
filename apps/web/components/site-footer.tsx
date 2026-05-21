export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>Probity builds transparent forecasting infrastructure for stablecoin-native markets.</p>
        <div className="flex gap-5">
          <span>Protocol</span>
          <span>Markets</span>
          <span>Risk</span>
          <span>Docs</span>
        </div>
      </div>
    </footer>
  );
}
