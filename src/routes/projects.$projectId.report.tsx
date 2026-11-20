import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CheckCircle2, FileText, Minus, Printer, X } from "lucide-react";
import { AppShell, WorkspaceGate } from "@/components/app/AppShell";
import { PageLoading } from "@/components/brand/LoadingScreen";
import { ShieldMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { profileQuery, projectQuery } from "@/lib/data";
import { fmtDate, fmtDateTime, money, STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/projects/$projectId/report")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { type: "scope" | "closeout" } => ({ type: s["type"] === "scope" ? "scope" : "closeout" }),
  head: () => ({ meta: [{ title: "Project report — RevisionShield" }, { name: "description", content: "Print-ready project scope and closeout record." }, { name: "robots", content: "noindex" }, { property: "og:title", content: "Project report — RevisionShield" }, { property: "og:description", content: "A print-ready RevisionShield project record." }, { name: "twitter:card", content: "summary" }] }),
  component: () => <WorkspaceGate><AppShell><ReportPage /></AppShell></WorkspaceGate>,
});

function ReportPage() {
  const { projectId } = Route.useParams();
  const { type } = Route.useSearch();
  const query = useQuery(projectQuery(projectId));
  const profile = useQuery(profileQuery());
  if (query.isLoading || profile.isLoading) return <PageLoading />;
  if (query.isError || profile.isError) return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">{query.error?.message || profile.error?.message}</div>;
  if (!query.data) return <div><h1 className="text-2xl font-semibold">Project not found</h1><Button asChild className="mt-4" variant="outline"><Link to="/dashboard">Back to projects</Link></Button></div>;
  const { project, scope, deliverables, revisions, changes, activity } = query.data;
  const isScope = type === "scope";
  const generated = new Date();

  return (
    <div>
      <div className="print-hidden mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><Button asChild variant="ghost" size="sm"><Link to="/projects/$projectId" params={{ projectId }}><ArrowLeft />Back to project</Link></Button><div className="flex flex-wrap gap-2"><div className="flex rounded-lg border border-border p-1"><Button asChild variant={isScope ? "secondary" : "ghost"} size="sm"><Link to="/projects/$projectId/report" params={{ projectId }} search={{ type: "scope" }}>Scope of work</Link></Button><Button asChild variant={!isScope ? "secondary" : "ghost"} size="sm"><Link to="/projects/$projectId/report" params={{ projectId }} search={{ type: "closeout" }}>Closeout</Link></Button></div><Button variant="hero" onClick={() => window.print()}><Printer />Print / Save PDF</Button></div></div>
      <p className="print-hidden mb-5 text-sm text-muted-foreground">In your browser’s print dialog, choose “Save as PDF” to download this record. Private notes and budget are intentionally excluded from the printable report.</p>

      <article className="print-report mx-auto max-w-4xl rounded-xl bg-paper p-7 text-ink shadow-glow sm:p-10">
        <header className="flex items-start justify-between gap-5 border-b border-ink/15 pb-6"><div><div className="flex items-center gap-2"><ShieldMark className="size-8" /><span className="font-display text-lg font-semibold">RevisionShield</span></div><p className="mt-2 text-xs opacity-70">{profile.data?.business_name || "Independent freelance project"}</p></div><div className="text-right"><p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">{isScope ? "Scope of work" : "Project closeout"}</p><p className="mt-1 text-xs opacity-70">Generated {fmtDate(generated.toISOString())}</p></div></header>
        <section className="py-7"><div className="flex flex-wrap items-center gap-2">{project.is_sample && <span className="rounded-full border border-ink/20 px-2 py-0.5 text-[10px] font-semibold uppercase">Sample</span>}<span className="text-xs opacity-70">{STATUS_LABEL[project.status] ?? project.status}</span></div><h1 className="mt-3 text-3xl font-semibold">{project.name}</h1><p className="mt-2 text-sm opacity-70">Prepared for {project.client_name}</p>{project.summary && <p className="mt-5 max-w-3xl text-sm leading-6">{project.summary}</p>}<dl className="mt-6 grid grid-cols-2 gap-4 border-y border-ink/15 py-5 text-sm sm:grid-cols-4"><div><dt className="text-xs opacity-60">Project type</dt><dd className="mt-1 font-medium">{project.project_type}</dd></div><div><dt className="text-xs opacity-60">Due date</dt><dd className="mt-1 font-medium">{fmtDate(project.due_date)}</dd></div><div><dt className="text-xs opacity-60">Included revisions</dt><dd className="mt-1 font-medium">{project.included_revisions}</dd></div><div><dt className="text-xs opacity-60">Revisions used</dt><dd className="mt-1 font-medium">{revisions.length}</dd></div></dl></section>

        <ReportSection title="Scope checklist"><div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{scope.map((item) => <div key={item.id} className="flex gap-2 break-inside-avoid text-sm"><span className="mt-0.5 shrink-0">{item.in_scope ? item.done ? <CheckCircle2 className="size-4" /> : <Check className="size-4" /> : <X className="size-4" />}</span><div><p>{item.title}</p><p className="mt-0.5 text-xs opacity-60">{item.in_scope ? item.done ? "Complete" : "In scope" : "Explicitly out of scope"}</p></div></div>)}</div></ReportSection>
        <ReportSection title="Deliverables"><div className="space-y-3">{deliverables.map((d) => <div key={d.id} className="break-inside-avoid rounded-lg border border-ink/15 p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold">{d.title}</h3>{d.description && <p className="mt-1 text-xs leading-5 opacity-70">{d.description}</p>}</div><span className="shrink-0 text-xs font-medium">{STATUS_LABEL[d.status] ?? d.status}</span></div>{d.approved_at && <p className="mt-2 text-xs opacity-70">Approved by {d.approved_by} · {fmtDateTime(d.approved_at)}</p>}</div>)}</div></ReportSection>

        {!isScope && <><ReportSection title="Revision record">{revisions.length ? <ol className="space-y-3">{revisions.map((r, i) => <li key={r.id} className="break-inside-avoid border-l-2 border-ink/20 pl-4"><p className="text-xs opacity-60">Revision {revisions.length - i} · {r.requested_by} · {fmtDateTime(r.created_at)}</p><p className="mt-1 text-sm leading-5">{r.note}</p></li>)}</ol> : <p className="text-sm opacity-70">No revision requests recorded.</p>}</ReportSection><ReportSection title="Change requests">{changes.length ? <div className="space-y-3">{changes.map((c) => <div key={c.id} className="break-inside-avoid rounded-lg border border-ink/15 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-medium">{c.description}</p><span className="text-xs">{STATUS_LABEL[c.status] ?? c.status}</span></div><p className="mt-2 text-xs opacity-70">{STATUS_LABEL[c.classification] ?? c.classification} · Extra fee {money(c.extra_fee, project.currency)} · Extra time {c.extra_days == null ? "—" : `${c.extra_days} days`}{c.decided_at ? ` · Decided ${fmtDateTime(c.decided_at)}` : ""}</p></div>)}</div> : <p className="text-sm opacity-70">No change requests recorded.</p>}</ReportSection><ReportSection title="Approval & activity timeline">{activity.length ? <ol className="space-y-3">{activity.map((a) => <li key={a.id} className="break-inside-avoid text-sm"><p>{a.message}</p><p className="mt-0.5 text-xs opacity-60">{fmtDateTime(a.created_at)}</p></li>)}</ol> : <p className="text-sm opacity-70">No activity recorded.</p>}</ReportSection></>}

        <footer className="mt-8 border-t border-ink/15 pt-5 text-xs leading-5 opacity-60"><p>This document records project information entered in RevisionShield. It is not a contract, legal advice, proof of payment or a guarantee of payment.</p><p className="mt-2">RevisionShield · {isScope ? "Scope of work" : "Project closeout"} · {project.name}</p></footer>
      </article>
      <div className="print-hidden mx-auto mt-5 flex max-w-4xl items-start gap-2 text-xs text-muted-foreground"><Minus className="mt-0.5 size-4 shrink-0" /><p>Budget, client email and private notes remain available in your workspace but are not printed in this report or exposed on the client review page.</p></div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="break-inside-auto border-t border-ink/15 py-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><FileText className="size-4" />{title}</h2>{children}</section>; }
