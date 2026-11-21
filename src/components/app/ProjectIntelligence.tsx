import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronRight, CircleDashed, Clock3, Eye, FileCheck2, ListChecks, RotateCcw, ShieldCheck, Sparkles, X } from "lucide-react";
import { EmptyState, Panel } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RevisionMeter } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import type { InsightCategory, InsightStatus, RiskLevel, StatefulAnalysis, StatefulInsight } from "@/lib/intelligence";

const CATEGORY_LABEL: Record<InsightCategory, string> = {
  scope: "Scope", requirements: "Requirements", deliverables: "Deliverables", revisions: "Revisions",
  changes: "Client request", approval: "Approval", deadline: "Deadline",
};

const RISK_STYLE: Record<RiskLevel, string> = {
  low: "border-cyan/30 bg-cyan/10 text-cyan",
  medium: "border-warning/30 bg-warning/10 text-warning",
  high: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", RISK_STYLE[level])}>{level} risk</span>;
}

type Props = {
  analysis: StatefulAnalysis;
  busy: string;
  disabled?: boolean;
  onStatus: (insight: StatefulInsight, status: InsightStatus) => void;
};

export function ProjectIntelligence({ analysis, busy, disabled = false, onStatus }: Props) {
  const [filter, setFilter] = useState<InsightStatus>("active");
  const visible = filter === "active" ? analysis.active : filter === "resolved" ? analysis.resolved : analysis.dismissed;
  const scopeFindings = analysis.active.filter((item) => ["scope", "requirements", "revisions", "changes"].includes(item.category));
  const high = analysis.active.filter((item) => item.severity === "high").length;
  const medium = analysis.active.filter((item) => item.severity === "medium").length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-glow sm:p-7" aria-labelledby="risk-overview-title">
        <div className="pointer-events-none absolute inset-0 bg-glow opacity-40" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2"><RiskBadge level={analysis.overallRisk} /><span className="text-xs text-muted-foreground">{analysis.active.length} open finding{analysis.active.length === 1 ? "" : "s"}</span></div>
            <h2 id="risk-overview-title" className="mt-4 text-2xl font-semibold">{analysis.active.length ? "Project attention recommended" : "No open heuristic flags"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {analysis.active.length ? `${high} high-priority and ${medium} medium-priority findings are based on the current project record.` : "The current record has no unresolved rule-based flags. New project activity may create new findings."}
            </p>
          </div>
          <div className="min-w-52 rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-end justify-between gap-4"><span className="text-xs text-muted-foreground">Relative triage score</span><span className="font-display text-3xl font-semibold">{analysis.riskScore}<span className="text-sm text-muted-foreground">/100</span></span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Relative project triage score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analysis.riskScore}><div className={cn("h-full rounded-full", analysis.overallRisk === "high" ? "bg-destructive" : analysis.overallRisk === "medium" ? "bg-warning" : "bg-cyan")} style={{ width: `${analysis.riskScore}%` }} /></div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">A rule-based prioritization aid, not a prediction or probability.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<ListChecks />} label="Scope complete" value={`${analysis.scope.completed}/${analysis.scope.included}`} detail={`${analysis.scope.excluded} explicit exclusion${analysis.scope.excluded === 1 ? "" : "s"}`} />
        <Metric icon={<FileCheck2 />} label="Deliverables approved" value={`${analysis.deliverableGaps.completed.length}/${analysis.deliverableGaps.completed.length + analysis.deliverableGaps.awaiting.length + analysis.deliverableGaps.incomplete.length}`} detail={`${analysis.deliverableGaps.awaiting.length} awaiting client`} />
        <Metric icon={<Clock3 />} label="Incomplete deliverables" value={String(analysis.deliverableGaps.incomplete.length)} detail={analysis.deliverableGaps.missing ? "No deliverable list recorded" : "Pending or revision requested"} />
        <div className="rounded-xl border border-border bg-card p-4"><RevisionMeter used={analysis.revisions.used} included={analysis.revisions.included} compact /><p className="mt-3 text-xs text-muted-foreground">Every logged request is counted.</p></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Scope Audit" className="min-w-0">
          <p className="-mt-2 mb-5 text-sm text-muted-foreground">Checks recorded scope boundaries, revision capacity and client-request decisions.</p>
          <dl className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-background/30 p-4 text-center">
            <div><dt className="text-xs text-muted-foreground">Included</dt><dd className="mt-1 font-display text-2xl font-semibold">{analysis.scope.included}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Excluded</dt><dd className="mt-1 font-display text-2xl font-semibold">{analysis.scope.excluded}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Still open</dt><dd className="mt-1 font-display text-2xl font-semibold">{analysis.scope.remaining}</dd></div>
          </dl>
          <div className="mt-5 space-y-3">
            {scopeFindings.length ? scopeFindings.map((insight) => <CompactFinding key={insight.id} insight={insight} />) : <div className="flex gap-3 rounded-xl border border-success/30 bg-success/10 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" /><div><h3 className="text-sm font-semibold">No open scope-audit flags</h3><p className="mt-1 text-sm text-muted-foreground">The current scope, revision and change-request records pass these heuristic checks.</p></div></div>}
          </div>
        </Panel>

        <Panel title="Next-step checklist" className="min-w-0">
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">Check an item when its recommended action is complete.</p>
          {analysis.active.length ? <ol className="space-y-3">{analysis.active.slice(0, 6).map((insight) => <li key={insight.id} className="flex gap-3 rounded-lg border border-border bg-background/30 p-3"><Checkbox id={`next-${insight.id}`} aria-label={`Resolve: ${insight.recommendation}`} disabled={disabled || busy === insight.id} onCheckedChange={() => onStatus(insight, "resolved")} /><label htmlFor={`next-${insight.id}`} className="cursor-pointer text-sm leading-relaxed">{insight.recommendation}</label></li>)}</ol> : <EmptyState icon={<CheckCircle2 />} title="Checklist clear">Resolved and dismissed items can be reviewed below.</EmptyState>}
        </Panel>
      </div>

      <Panel title="Deliverable Gap Analysis">
        <p className="-mt-2 mb-5 text-sm text-muted-foreground">Status groups come directly from the deliverables recorded for this project.</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <GapCard title="Missing" tone="high" count={analysis.deliverableGaps.missing ? 1 : 0} icon={<CircleDashed />}>
            {analysis.deliverableGaps.missing ? <p className="text-sm text-muted-foreground">No deliverables are recorded. Add the outputs the client needs to review.</p> : <p className="text-sm text-muted-foreground">A deliverable list is recorded.</p>}
          </GapCard>
          <GapCard title="Incomplete" tone="medium" count={analysis.deliverableGaps.incomplete.length} icon={<AlertTriangle />}><DeliverableNames items={analysis.deliverableGaps.incomplete} empty="Nothing pending or in revision." /></GapCard>
          <GapCard title="Awaiting client" tone="low" count={analysis.deliverableGaps.awaiting.length} icon={<Clock3 />}><DeliverableNames items={analysis.deliverableGaps.awaiting} empty="Nothing waiting for approval." /></GapCard>
          <GapCard title="Completed" tone="success" count={analysis.deliverableGaps.completed.length} icon={<CheckCircle2 />}><DeliverableNames items={analysis.deliverableGaps.completed} empty="No approvals recorded yet." /></GapCard>
        </div>
      </Panel>

      <Panel title="Risk Analysis & recommendations" action={<div className="flex rounded-lg border border-border p-1" aria-label="Filter insight status">{(["active", "resolved", "dismissed"] as const).map((status) => <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", filter === status ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>{status}<span className="ml-1.5 opacity-70">{status === "active" ? analysis.active.length : status === "resolved" ? analysis.resolved.length : analysis.dismissed.length}</span></button>)}</div>}>
        <p className="-mt-2 mb-5 text-sm text-muted-foreground">Each flag explains its stored-data evidence and a grounded next action.</p>
        {visible.length ? <div className="space-y-3">{visible.map((insight) => <InsightCard key={insight.id} insight={insight} busy={busy} disabled={disabled} onStatus={onStatus} />)}</div> : <EmptyState icon={filter === "active" ? <ShieldCheck /> : <CircleDashed />} title={`No ${filter} findings`}>{filter === "active" ? "New findings appear when the stored project data matches a rule." : `Findings you mark ${filter} will appear here and can be restored.`}</EmptyState>}
      </Panel>
    </div>
  );
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between text-muted-foreground"><p className="text-xs">{label}</p><span className="text-cyan [&_svg]:size-4">{icon}</span></div><p className="mt-2 font-display text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function CompactFinding({ insight }: { insight: StatefulInsight }) {
  return <div className="flex gap-3 rounded-xl border border-border bg-background/30 p-4"><AlertTriangle className={cn("mt-0.5 size-4 shrink-0", insight.severity === "high" ? "text-destructive" : insight.severity === "medium" ? "text-warning" : "text-cyan")} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{insight.title}</h3><RiskBadge level={insight.severity} /></div><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{insight.reason}</p></div></div>;
}

function InsightCard({ insight, busy, disabled, onStatus }: { insight: StatefulInsight; busy: string; disabled: boolean; onStatus: Props["onStatus"] }) {
  return <article className="rounded-xl border border-border bg-background/30 p-4 sm:p-5" aria-labelledby={`finding-${insight.id}`}>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><RiskBadge level={insight.severity} /><span className="text-xs text-muted-foreground">{CATEGORY_LABEL[insight.category]}</span>{insight.clientSafe && <span className="inline-flex items-center gap-1 text-xs text-cyan"><Eye className="size-3" />Client-safe</span>}</div><h3 id={`finding-${insight.id}`} className="mt-3 text-base font-semibold">{insight.title}</h3></div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {insight.status === "active" ? <><Button size="sm" variant="secondary" disabled={disabled || busy === insight.id} onClick={() => onStatus(insight, "resolved")}><Check />{busy === insight.id ? "Saving…" : "Mark resolved"}</Button><Button size="sm" variant="ghost" disabled={disabled || busy === insight.id} onClick={() => onStatus(insight, "dismissed")}><X />Dismiss</Button></> : <Button size="sm" variant="outline" disabled={disabled || busy === insight.id} onClick={() => onStatus(insight, "active")}><RotateCcw />Restore</Button>}
      </div>
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why this was flagged</p><p className="mt-2 text-sm leading-relaxed">{insight.reason}</p></div><div className="rounded-lg bg-cyan/5 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-cyan">Recommended next step</p><p className="mt-2 text-sm leading-relaxed">{insight.recommendation}</p></div></div>
  </article>;
}

function GapCard({ title, count, icon, tone, children }: { title: string; count: number; icon: ReactNode; tone: RiskLevel | "success"; children: ReactNode }) {
  return <section className="rounded-xl border border-border bg-background/30 p-4"><div className="flex items-center justify-between"><div className={cn("flex items-center gap-2 text-sm font-semibold", tone === "success" ? "text-success" : tone === "high" ? "text-destructive" : tone === "medium" ? "text-warning" : "text-cyan")}><span className="[&_svg]:size-4">{icon}</span>{title}</div><span className="font-display text-2xl font-semibold">{count}</span></div><div className="mt-4">{children}</div></section>;
}

function DeliverableNames({ items, empty }: { items: { id: string; title: string }[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return <ul className="space-y-2">{items.map((item) => <li key={item.id} className="flex items-start gap-2 text-sm"><ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /><span>{item.title}</span></li>)}</ul>;
}

export function IntelligenceIntro() {
  return <div className="mb-6 rounded-xl border border-violet/30 bg-violet/10 p-4"><div className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-violet" /><div><p className="text-sm font-semibold">AI-assisted insights / heuristic analysis</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">This first pass uses deterministic rules over your saved project data. It does not call an LLM, infer intent or invent missing facts.</p></div></div></div>;
}

export function IntelligenceReportLink({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1">{children}<ArrowRight className="size-4" /></span>;
}
