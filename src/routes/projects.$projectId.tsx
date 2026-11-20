import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Check, CheckCircle2, Clipboard, Clock3, ExternalLink, FileText, GitPullRequestArrow, ListChecks, MessageSquareText, Plus, Send, Trash2, X } from "lucide-react";
import { AppShell, WorkspaceGate } from "@/components/app/AppShell";
import { EmptyState, Panel, RevisionMeter, SampleBadge, StatusBadge } from "@/components/app/bits";
import { PageLoading } from "@/components/brand/LoadingScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addChangeRequest, addDeliverable, addRevision, addScopeItem, decideChangeRequest, deleteProject, logActivity, projectQuery, removeScopeItem, updateDeliverable, updateProject, updateScopeItem, type ProjectBundle } from "@/lib/data";
import { ago, fmtDate, fmtDateTime, money, PROJECT_STATUSES, STATUS_LABEL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Project record — RevisionShield" }, { name: "description", content: "Manage project scope, deliverables, revisions, approvals and change requests." }, { property: "og:title", content: "Project record — RevisionShield" }, { property: "og:description", content: "A clear freelance project record in RevisionShield." }, { name: "twitter:card", content: "summary" }] }),
  component: () => <WorkspaceGate><AppShell><ProjectPage /></AppShell></WorkspaceGate>,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const query = useQuery(projectQuery(projectId));
  if (query.isLoading) return <PageLoading />;
  if (query.isError) return <EmptyState icon={<X />} title="This project couldn’t load"><span>{query.error.message}</span><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Try again</Button></EmptyState>;
  if (!query.data) return <EmptyState icon={<FileText />} title="Project not found" action={<Button asChild variant="outline"><Link to="/dashboard">Back to projects</Link></Button>}>It may have been deleted, or it belongs to another account.</EmptyState>;
  return <ProjectWorkspace data={query.data} />;
}

function ProjectWorkspace({ data }: { data: ProjectBundle }) {
  const { project } = data;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);

  async function run(key: string, action: () => Promise<unknown>, message?: string) {
    setBusy(key);
    try { await action(); await queryClient.invalidateQueries(); if (message) toast.success(message); }
    catch (error) { toast.error(error instanceof Error ? error.message : "That change couldn’t be saved"); }
    finally { setBusy(""); }
  }

  async function copyLink() {
    const url = `${window.location.origin}/share/${project.share_token}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { toast.info("Copy this client link", { description: url }); }
  }

  async function removeProject() {
    if (!window.confirm(`Delete “${project.name}” and all of its records? This cannot be undone.`)) return;
    setBusy("delete");
    try { await deleteProject(project.id); queryClient.clear(); toast.success("Project deleted"); navigate({ to: "/dashboard", replace: true }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Project couldn’t be deleted"); setBusy(""); }
  }

  const approved = data.deliverables.filter((d) => d.status === "approved").length;
  const pendingChanges = data.changes.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      <div><Button asChild variant="ghost" size="sm" className="mb-4 -ml-2"><Link to="/dashboard"><ArrowLeft />All projects</Link></Button><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{project.is_sample && <SampleBadge />}<StatusBadge status={project.status} /><span className="text-xs text-muted-foreground">{project.project_type}</span></div><h1 className="mt-3 break-words text-3xl font-semibold">{project.name}</h1><p className="mt-2 text-muted-foreground">{project.client_name} · Due {fmtDate(project.due_date)}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={copyLink}>{copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy client link"}</Button><Button asChild variant="outline"><Link to="/share/$token" params={{ token: project.share_token }} target="_blank"><ExternalLink />Preview client page</Link></Button><Button asChild variant="hero"><Link to="/projects/$projectId/report" params={{ projectId: project.id }} search={{ type: "closeout" }}><FileText />Report</Link></Button></div></div></div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Scope complete" value={`${data.scope.filter((s) => s.in_scope && s.done).length}/${data.scope.filter((s) => s.in_scope).length}`} icon={<ListChecks />} />
        <Metric label="Deliverables approved" value={`${approved}/${data.deliverables.length}`} icon={<CheckCircle2 />} />
        <Metric label="Pending changes" value={String(pendingChanges)} icon={<GitPullRequestArrow />} />
        <div className="rounded-xl border border-border bg-card p-4"><RevisionMeter used={data.revisions.length} included={project.included_revisions} compact /></div>
      </div>

      <Panel><div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="project-status">Project status</Label><Select value={project.status} onValueChange={(value) => run("status", () => updateProject(project.id, { status: value }), "Project status updated")} disabled={busy === "status"}><SelectTrigger id="project-status"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Client review link</Label><Button variant={project.share_enabled ? "outline" : "secondary"} className="w-full" onClick={() => run("share", () => updateProject(project.id, { share_enabled: !project.share_enabled }), project.share_enabled ? "Client link disabled" : "Client link enabled")}>{project.share_enabled ? "Enabled — click to disable" : "Disabled — click to enable"}</Button></div><Button variant="ghost" className="text-destructive" onClick={removeProject} disabled={busy === "delete"}><Trash2 />Delete project</Button></div></Panel>

      <Tabs defaultValue="scope" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5"><TabsTrigger value="scope">Scope</TabsTrigger><TabsTrigger value="deliverables">Deliverables</TabsTrigger><TabsTrigger value="revisions">Revisions <Count n={data.revisions.length} /></TabsTrigger><TabsTrigger value="changes">Changes <Count n={pendingChanges} /></TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
        <TabsContent value="scope" className="mt-5"><ScopeTab data={data} run={run} busy={busy} /></TabsContent>
        <TabsContent value="deliverables" className="mt-5"><DeliverablesTab data={data} run={run} busy={busy} /></TabsContent>
        <TabsContent value="revisions" className="mt-5"><RevisionsTab data={data} run={run} busy={busy} /></TabsContent>
        <TabsContent value="changes" className="mt-5"><ChangesTab data={data} run={run} busy={busy} /></TabsContent>
        <TabsContent value="activity" className="mt-5"><Panel title="Project timeline">{data.activity.length ? <ol className="relative ml-2 space-y-5 border-l border-border pl-5">{data.activity.map((a) => <li key={a.id} className="relative"><span className="absolute -left-[27px] top-1 size-2.5 rounded-full bg-cyan ring-4 ring-card" /><p className="text-sm">{a.message}</p><p className="mt-1 text-xs text-muted-foreground">{a.actor === "client" ? "Client" : "You"} · {fmtDateTime(a.created_at)}</p></li>)}</ol> : <p className="text-sm text-muted-foreground">Project updates will appear here as you work.</p>}</Panel></TabsContent>
      </Tabs>
    </div>
  );
}

type Run = (key: string, action: () => Promise<unknown>, message?: string) => Promise<void>;
function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) { return <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between text-muted-foreground"><p className="text-xs">{label}</p><span className="text-cyan [&_svg]:size-4">{icon}</span></div><p className="mt-2 font-display text-2xl font-semibold">{value}</p></div>; }
function Count({ n }: { n: number }) { return n ? <span className="ml-1 rounded-full bg-violet/20 px-1.5 text-[10px] text-violet">{n}</span> : null; }

function ScopeTab({ data, run, busy }: { data: ProjectBundle; run: Run; busy: string }) {
  const [title, setTitle] = useState(""); const [inScope, setInScope] = useState("in");
  async function add(e: FormEvent) { e.preventDefault(); if (!title.trim()) return; await run("add-scope", () => addScopeItem(data.project.id, title.trim(), inScope === "in"), "Scope item added"); setTitle(""); }
  return <Panel title="Scope checklist" action={<Button asChild variant="outline" size="sm"><Link to="/projects/$projectId/report" params={{ projectId: data.project.id }} search={{ type: "scope" }}><FileText />Scope report</Link></Button>}><div className="space-y-2">{data.scope.length ? data.scope.map((item) => <div key={item.id} className="group flex items-center gap-3 rounded-lg border border-border bg-background/30 p-3"><input type="checkbox" className="size-4 shrink-0 accent-[var(--violet)]" aria-label={`Mark ${item.title} complete`} checked={item.done} disabled={!item.in_scope || busy === item.id} onChange={(e) => run(item.id, () => updateScopeItem(item.id, { done: e.target.checked }))} /><div className="min-w-0 flex-1"><p className={`text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}>{item.title}</p><p className={`mt-0.5 text-xs ${item.in_scope ? "text-cyan" : "text-warning"}`}>{item.in_scope ? item.done ? "Complete" : "In scope" : "Explicitly out of scope"}</p></div><Button variant="ghost" size="icon" className="shrink-0" aria-label={`Remove ${item.title}`} onClick={() => run(item.id, () => removeScopeItem(item.id), "Scope item removed")}><Trash2 /></Button></div>) : <p className="py-6 text-center text-sm text-muted-foreground">No scope items yet. Add the first below.</p>}</div><form onSubmit={add} className="mt-5 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row"><Input aria-label="New scope item" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add an inclusion or exclusion…" /><Select value={inScope} onValueChange={setInScope}><SelectTrigger className="sm:w-40" aria-label="New scope item classification"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in">In scope</SelectItem><SelectItem value="out">Out of scope</SelectItem></SelectContent></Select><Button type="submit" variant="outline" disabled={busy === "add-scope"}><Plus />Add</Button></form></Panel>;
}

function DeliverablesTab({ data, run, busy }: { data: ProjectBundle; run: Run; busy: string }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  async function add(e: FormEvent) { e.preventDefault(); if (!title.trim()) return; await run("add-deliverable", () => addDeliverable(data.project.id, title.trim(), description.trim()), "Deliverable added"); setTitle(""); setDescription(""); }
  return <Panel title="Deliverables & approvals"><div className="space-y-3">{data.deliverables.length ? data.deliverables.map((d) => <article key={d.id} className="rounded-xl border border-border bg-background/30 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><StatusBadge status={d.status} /><h3 className="mt-2 font-display text-base font-semibold">{d.title}</h3>{d.description && <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>}{d.approved_at && <p className="mt-2 text-xs text-success">Approved by {d.approved_by} · {fmtDateTime(d.approved_at)}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{d.status === "pending" && <Button size="sm" variant="outline" disabled={busy === d.id} onClick={() => run(d.id, async () => { await updateDeliverable(d.id, { status: "submitted", submitted_at: new Date().toISOString() }); await logActivity(data.project.id, `Submitted “${d.title}” for review`); }, "Marked as awaiting client")}><Send />Send for review</Button>}{d.status !== "approved" && <Button size="sm" variant="secondary" disabled={busy === d.id} onClick={() => run(d.id, async () => { await updateDeliverable(d.id, { status: "approved", approved_at: new Date().toISOString(), approved_by: "You (on client’s behalf)" }); await logActivity(data.project.id, `Marked “${d.title}” approved`); }, "Deliverable approved")}><Check />Mark approved</Button>}{d.status === "approved" && <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="size-4" />Recorded</span>}</div></div></article>) : <p className="py-6 text-center text-sm text-muted-foreground">No deliverables yet. Add something your client can review.</p>}</div><form onSubmit={add} className="mt-5 grid gap-2 border-t border-border pt-5 sm:grid-cols-[1fr_1fr_auto]"><Input aria-label="New deliverable title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deliverable title" /><Input aria-label="New deliverable description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" /><Button type="submit" variant="outline" disabled={busy === "add-deliverable"}><Plus />Add</Button></form></Panel>;
}

function RevisionsTab({ data, run, busy }: { data: ProjectBundle; run: Run; busy: string }) {
  const [note, setNote] = useState(""); const [deliverable, setDeliverable] = useState("none");
  async function add(e: FormEvent) { e.preventDefault(); if (note.trim().length < 3) return; await run("add-revision", () => addRevision(data.project.id, deliverable === "none" ? null : deliverable, note.trim()), "Revision logged"); setNote(""); }
  return <div className="grid gap-5 lg:grid-cols-[1fr_340px]"><Panel title="Revision log">{data.revisions.length ? <ul className="space-y-3">{data.revisions.map((r) => <li key={r.id} className="rounded-lg border border-border p-4"><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{r.requested_by}</span><span>{ago(r.created_at)}</span></div><p className="mt-2 text-sm leading-relaxed">{r.note}</p>{r.deliverable_id && <p className="mt-2 text-xs text-cyan">{data.deliverables.find((d) => d.id === r.deliverable_id)?.title ?? "Deliverable"}</p>}</li>)}</ul> : <p className="py-6 text-center text-sm text-muted-foreground">No revision requests logged.</p>}</Panel><div className="space-y-5"><Panel title="Allowance"><RevisionMeter used={data.revisions.length} included={data.project.included_revisions} /><p className="mt-3 text-xs text-muted-foreground">Every request counts. Going over is a signal to discuss a change, not an automatic charge.</p></Panel><Panel title="Log a revision"><form onSubmit={add} className="space-y-3"><div className="space-y-2"><Label htmlFor="revision-deliverable">Deliverable</Label><Select value={deliverable} onValueChange={setDeliverable}><SelectTrigger id="revision-deliverable"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">General project revision</SelectItem>{data.deliverables.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="revision-note">Requested change</Label><Textarea id="revision-note" required minLength={3} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe the requested change…" /></div><Button variant="hero" className="w-full" disabled={busy === "add-revision"}><MessageSquareText />Log revision</Button></form></Panel></div></div>;
}

function ChangesTab({ data, run, busy }: { data: ProjectBundle; run: Run; busy: string }) {
  const [description, setDescription] = useState(""); const [classification, setClassification] = useState("out_of_scope"); const [fee, setFee] = useState(""); const [days, setDays] = useState("");
  async function add(e: FormEvent) { e.preventDefault(); if (description.trim().length < 3) return; await run("add-change", () => addChangeRequest(data.project.id, { description: description.trim(), classification, extra_fee: fee ? Number(fee) : undefined, extra_days: days ? Number(days) : undefined }), "Change request logged"); setDescription(""); setFee(""); setDays(""); }
  return <div className="space-y-5"><Panel title="Log a change request"><form onSubmit={add} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_130px_120px_auto]"><div className="sm:col-span-2 lg:col-span-1"><Label htmlFor="change-description" className="sr-only">Change description</Label><Input id="change-description" required minLength={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is the client asking to change?" /></div><Select value={classification} onValueChange={setClassification}><SelectTrigger aria-label="Change classification"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unclassified">Unclassified</SelectItem><SelectItem value="in_scope">In scope</SelectItem><SelectItem value="out_of_scope">Out of scope</SelectItem></SelectContent></Select><Input aria-label="Extra fee" type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder={`Fee (${data.project.currency})`} /><Input aria-label="Extra days" type="number" min="0" step="1" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Extra days" /><Button variant="hero" disabled={busy === "add-change"}><Plus />Log change</Button></form></Panel><Panel title="Change requests">{data.changes.length ? <div className="space-y-3">{data.changes.map((c) => <article key={c.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={c.classification} /><StatusBadge status={c.status} /><span className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</span></div><p className="mt-3 text-sm">{c.description}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span>Extra fee: <strong className="text-foreground">{money(c.extra_fee, data.project.currency)}</strong></span><span>Extra time: <strong className="text-foreground">{c.extra_days == null ? "—" : `${c.extra_days} day${c.extra_days === 1 ? "" : "s"}`}</strong></span>{c.decided_at && <span>Decided {fmtDateTime(c.decided_at)}</span>}</div>{c.status === "pending" && <div className="mt-4 flex gap-2"><Button size="sm" variant="secondary" disabled={busy === c.id} onClick={() => run(c.id, () => decideChangeRequest(c.id, "accepted"), "Change accepted")}><Check />Accept</Button><Button size="sm" variant="outline" disabled={busy === c.id} onClick={() => run(c.id, () => decideChangeRequest(c.id, "declined"), "Change declined")}><X />Decline</Button></div>}</article>)}</div> : <p className="py-6 text-center text-sm text-muted-foreground">No change requests logged. New asks can be recorded here before work begins.</p>}</Panel></div>;
}
