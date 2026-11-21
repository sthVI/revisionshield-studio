import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ListChecks, Plus, Trash2 } from "lucide-react";
import { AppShell, WorkspaceGate } from "@/components/app/AppShell";
import { Panel } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, PROJECT_TYPES } from "@/lib/format";
import { createProject } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/new")({
  ssr: false,
  head: () => ({ meta: [{ title: "New project — RevisionShield" }, { name: "description", content: "Turn a client brief into scope items, deliverables and a clear revision allowance." }, { property: "og:title", content: "New project — RevisionShield" }, { property: "og:description", content: "Create a clear freelance project record." }, { name: "twitter:card", content: "summary" }] }),
  component: () => <WorkspaceGate><AppShell><NewProject /></AppShell></WorkspaceGate>,
});

function NewProject() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scope, setScope] = useState([{ title: "", in_scope: true }, { title: "", in_scope: true }, { title: "", in_scope: false }]);
  const [deliverables, setDeliverables] = useState([{ title: "", description: "" }]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const form = new FormData(e.currentTarget);
    const cleanScope = scope.map((s) => ({ ...s, title: s.title.trim() })).filter((s) => s.title);
    const cleanDeliverables = deliverables.map((d) => ({ ...d, title: d.title.trim(), description: d.description?.trim() })).filter((d) => d.title);
    if (!cleanScope.length) { setError("Add at least one scope item, including anything explicitly out of scope."); return; }
    if (!cleanDeliverables.length) { setError("Add at least one deliverable for your client to review."); return; }
    setBusy(true);
    try {
      const id = await createProject({
        name: String(form.get("name")).trim(), client_name: String(form.get("client_name")).trim(), client_email: String(form.get("client_email")).trim(),
        project_type: String(form.get("project_type")), budget: form.get("budget") ? Number(form.get("budget")) : undefined, currency: String(form.get("currency")),
        due_date: String(form.get("due_date")) || undefined, summary: String(form.get("summary")).trim() || undefined, private_notes: String(form.get("private_notes")).trim() || undefined,
        included_revisions: Number(form.get("included_revisions")), scope: cleanScope, deliverables: cleanDeliverables,
      });
      toast.success("Project created", { description: "Your scope and deliverables are ready." });
      navigate({ to: "/projects/$projectId", params: { projectId: id } });
    } catch (err) { setError(err instanceof Error ? err.message : "The project couldn’t be created."); setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-5 -ml-2"><LinkBack /></Button>
      <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">New project</p><h1 className="mt-2 text-3xl font-semibold">Turn the brief into a clear record</h1><p className="mt-2 text-sm text-muted-foreground">You can add more scope items and deliverables later.</p></div>
      <form onSubmit={submit} className="space-y-5">
        <Panel title="Project details"><div className="grid gap-4 sm:grid-cols-2"><Field label="Project name" name="name" required placeholder="e.g. Bakery website refresh" /><Field label="Client name" name="client_name" required placeholder="Client or company" /><div className="space-y-2"><Label htmlFor="project_type">Project type</Label><Select name="project_type" defaultValue="Web design"><SelectTrigger id="project_type"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><Field label="Due date" name="due_date" type="date" /><Field label="Client email (private)" name="client_email" type="email" placeholder="Optional" /><Field label="Budget (private)" name="budget" type="number" min="0" step="0.01" placeholder="Optional" /><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Select name="currency" defaultValue="USD"><SelectTrigger id="currency"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><Field label="Included revision rounds" name="included_revisions" type="number" min="0" max="99" required defaultValue="2" /><div className="space-y-2 sm:col-span-2"><Label htmlFor="summary">Brief summary</Label><Textarea id="summary" name="summary" rows={4} placeholder="What is the client asking you to make?" /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="private_notes">Private notes</Label><Textarea id="private_notes" name="private_notes" rows={3} placeholder="Internal reminders — never shown on the client link or client review record." /></div></div></Panel>

        <Panel title="Scope checklist" action={<Button type="button" size="sm" variant="outline" onClick={() => setScope([...scope, { title: "", in_scope: true }])}><Plus />Add item</Button>}><p className="mb-4 text-sm text-muted-foreground">Include explicit exclusions. They are often the most useful part of the record.</p><div className="space-y-3">{scope.map((item, i) => <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row"><Input aria-label={`Scope item ${i + 1}`} value={item.title} onChange={(e) => setScope(scope.map((s, j) => j === i ? { ...s, title: e.target.value } : s))} placeholder={item.in_scope ? "What is included?" : "What is explicitly excluded?"} /><Select value={item.in_scope ? "in" : "out"} onValueChange={(v) => setScope(scope.map((s, j) => j === i ? { ...s, in_scope: v === "in" } : s))}><SelectTrigger className="sm:w-40" aria-label={`Scope item ${i + 1} classification`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in">In scope</SelectItem><SelectItem value="out">Out of scope</SelectItem></SelectContent></Select><Button type="button" variant="ghost" size="icon" aria-label={`Remove scope item ${i + 1}`} onClick={() => setScope(scope.filter((_, j) => j !== i))}><Trash2 /></Button></div>)}</div></Panel>

        <Panel title="Deliverables" action={<Button type="button" size="sm" variant="outline" onClick={() => setDeliverables([...deliverables, { title: "", description: "" }])}><Plus />Add deliverable</Button>}><div className="space-y-3">{deliverables.map((item, i) => <div key={i} className="rounded-lg border border-border p-3"><div className="flex gap-2"><Input aria-label={`Deliverable ${i + 1} title`} value={item.title} onChange={(e) => setDeliverables(deliverables.map((d, j) => j === i ? { ...d, title: e.target.value } : d))} placeholder={`Deliverable ${i + 1}, e.g. Homepage design`} /><Button type="button" variant="ghost" size="icon" aria-label={`Remove deliverable ${i + 1}`} onClick={() => setDeliverables(deliverables.filter((_, j) => j !== i))}><Trash2 /></Button></div><Input className="mt-2" aria-label={`Deliverable ${i + 1} description`} value={item.description} onChange={(e) => setDeliverables(deliverables.map((d, j) => j === i ? { ...d, description: e.target.value } : d))} placeholder="Short description (optional)" /></div>)}</div></Panel>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button><Button type="submit" variant="hero" size="lg" disabled={busy}><ListChecks />{busy ? "Creating project…" : "Create project"}</Button></div>
      </form>
    </div>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}
function LinkBack() { return <><ArrowLeft /><span>Back to projects</span></>; }
