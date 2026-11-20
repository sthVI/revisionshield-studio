import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FilePlus2, FolderOpen, GitPullRequestArrow, Search, Sparkles } from "lucide-react";
import { AppShell, WorkspaceGate } from "@/components/app/AppShell";
import { EmptyState, Panel, RevisionMeter, SampleBadge, StatusBadge } from "@/components/app/bits";
import { PageLoading } from "@/components/brand/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ago, fmtDate, STATUS_LABEL } from "@/lib/format";
import { projectsQuery, recentActivityQuery, seedSampleProject } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Projects — RevisionShield" }, { name: "description", content: "Manage project scope, revision allowances, client approvals and change requests." }, { property: "og:title", content: "Projects — RevisionShield" }, { property: "og:description", content: "Your RevisionShield project workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return <WorkspaceGate><AppShell><Dashboard /></AppShell></WorkspaceGate>;
}

function Dashboard() {
  const projects = useQuery(projectsQuery());
  const activity = useQuery(recentActivityQuery());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [seeding, setSeeding] = useState(false);

  const filtered = useMemo(() => (projects.data ?? []).filter((p) => {
    const matchesSearch = `${p.name} ${p.client_name}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === "all" || p.status === status);
  }), [projects.data, search, status]);

  async function addSample() {
    setSeeding(true);
    try {
      const id = await seedSampleProject();
      await queryClient.invalidateQueries();
      toast.success("Sample project is ready", { description: "Open it to try the complete review workflow." });
      if (!projects.data?.some((p) => p.id === id)) await projects.refetch();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create the sample"); }
    finally { setSeeding(false); }
  }

  if (projects.isLoading) return <PageLoading />;
  if (projects.isError) return <EmptyState icon={<FolderOpen />} title="Your projects couldn’t load"><span>{projects.error.message}</span><Button className="mt-4" variant="outline" onClick={() => projects.refetch()}>Try again</Button></EmptyState>;

  const rows = projects.data ?? [];
  const active = rows.filter((p) => !["completed", "draft"].includes(p.status)).length;
  const awaiting = rows.reduce((sum, p) => sum + p.deliverables.filter((d) => d.status === "submitted").length, 0);
  const pendingChanges = rows.reduce((sum, p) => sum + p.pending_crs, 0);

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Workspace</p><h1 className="mt-2 text-3xl font-semibold">Your projects</h1><p className="mt-2 text-sm text-muted-foreground">A clear view of scope, approvals and extra work.</p></div>
        <Button asChild variant="hero"><Link to="/projects/new"><FilePlus2 />Create project</Link></Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[{ label: "Active projects", value: active, icon: FolderOpen }, { label: "Awaiting client", value: awaiting, icon: Clock3 }, { label: "Pending changes", value: pendingChanges, icon: GitPullRequestArrow }].map((stat) => <div key={stat.label} className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{stat.label}</p><stat.icon className="size-4 text-cyan" /></div><p className="mt-2 font-display text-3xl font-semibold">{stat.value}</p></div>)}
      </div>

      {rows.length > 0 && <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search projects" placeholder="Search project or client…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{["draft", "active", "in_review", "on_hold", "completed"].map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select></div>}

      {rows.length === 0 ? <EmptyState icon={<FolderOpen />} title="Start with a clear project record" action={<div className="flex flex-wrap justify-center gap-2"><Button asChild variant="hero"><Link to="/projects/new">Create your first project</Link></Button><Button variant="outline" onClick={addSample} disabled={seeding}><Sparkles />{seeding ? "Adding…" : "Add sample project"}</Button></div>}>Add scope, deliverables and a revision allowance. Or use the labelled sample to explore first.</EmptyState> : filtered.length === 0 ? <EmptyState icon={<Search />} title="No matching projects" action={<Button variant="outline" onClick={() => { setSearch(""); setStatus("all"); }}>Clear filters</Button>}>Try another project name, client or status.</EmptyState> : <div className="grid gap-4 lg:grid-cols-2">{filtered.map((p) => <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-violet/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{p.is_sample && <SampleBadge />}<StatusBadge status={p.status} /></div><h2 className="mt-3 truncate text-lg font-semibold group-hover:text-cyan">{p.name}</h2><p className="mt-1 truncate text-sm text-muted-foreground">{p.client_name} · {p.project_type}</p></div><ArrowRight className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-cyan" /></div><div className="mt-5"><RevisionMeter used={p.revisions_used} included={p.included_revisions} compact /></div><div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{p.deliverables.filter((d) => d.status === "approved").length}/{p.deliverables.length} approved</span><span>Due {fmtDate(p.due_date)}</span></div></Link>)}</div>}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title="Recent activity">{activity.isLoading ? <p className="text-sm text-muted-foreground">Loading activity…</p> : activity.isError ? <p className="text-sm text-destructive">Activity couldn’t load.</p> : activity.data?.length ? <ul className="divide-y divide-border">{activity.data.map((a) => <li key={a.id} className="flex gap-3 py-3 first:pt-0 last:pb-0"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan" /><div><p className="text-sm">{a.message}</p><p className="mt-1 text-xs text-muted-foreground">{a.projects?.name} · {ago(a.created_at)}</p></div></li>)}</ul> : <p className="text-sm text-muted-foreground">Approvals, revisions and project updates will appear here.</p>}</Panel>
        <Panel title="Need a walkthrough?"><p className="text-sm leading-relaxed text-muted-foreground">Open the sample project to try scope tracking, client review, change requests and reports.</p><Button className="mt-4 w-full" variant="outline" onClick={addSample} disabled={seeding || rows.some((p) => p.is_sample)}><Sparkles />{rows.some((p) => p.is_sample) ? "Sample already added" : "Add sample project"}</Button></Panel>
      </div>
    </div>
  );
}
