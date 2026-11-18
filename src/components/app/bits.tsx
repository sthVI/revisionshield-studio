import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, revisionUsage } from "@/lib/format";

const TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending: "bg-muted text-muted-foreground border-border",
  unclassified: "bg-muted text-muted-foreground border-border",
  active: "bg-violet/15 text-violet border-violet/30",
  submitted: "bg-cyan/10 text-cyan border-cyan/30",
  in_review: "bg-cyan/10 text-cyan border-cyan/30",
  in_scope: "bg-cyan/10 text-cyan border-cyan/30",
  approved: "bg-success/15 text-success border-success/30",
  accepted: "bg-success/15 text-success border-success/30",
  completed: "bg-success/15 text-success border-success/30",
  revision_requested: "bg-warning/15 text-warning border-warning/30",
  on_hold: "bg-warning/15 text-warning border-warning/30",
  out_of_scope: "bg-warning/15 text-warning border-warning/30",
  declined: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONE[status] ?? TONE["draft"], className)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function SampleBadge() {
  return <span className="inline-flex items-center rounded-full border border-dashed border-cyan/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan">Sample data</span>;
}

export function RevisionMeter({ used, included, compact }: { used: number; included: number; compact?: boolean }) {
  const u = revisionUsage(used, included);
  const bar = u.level === "over" ? "bg-destructive" : u.level === "warn" ? "bg-warning" : "bg-gradient-brand";
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">Revisions</span>
        <span className="font-mono">
          {used}/{included}
          {u.over > 0 && <span className="ml-1 text-destructive">+{u.over} over</span>}
        </span>
      </div>
      <div className={cn("overflow-hidden rounded-full bg-muted", compact ? "h-1.5" : "h-2")}>
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${u.pct}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-accent text-cyan [&_svg]:size-5">{icon}</div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
