import { ShieldMark } from "./Logo";

export function LoadingScreen({ label = "Preparing your workspace" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background" role="status" aria-live="polite">
      <div className="flex flex-col items-center">
        <div className="relative grid size-20 place-items-center rounded-2xl border border-violet/30 bg-card shadow-glow">
          <ShieldMark className="size-11 animate-pulse" />
        </div>
        <p className="mt-6 font-display text-xl font-semibold">Revision<span className="text-gradient">Shield</span></p>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
        <div className="mt-5 h-1 w-36 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/2 animate-[loading_1.1s_ease-in-out_infinite] rounded-full bg-gradient-brand" /></div>
      </div>
    </div>
  );
}

export function PageLoading() {
  return <div className="grid min-h-64 place-items-center" role="status"><div className="text-center"><div className="mx-auto size-7 animate-spin rounded-full border-2 border-border border-t-cyan" /><p className="mt-3 text-sm text-muted-foreground">Loading project data…</p></div></div>;
}
