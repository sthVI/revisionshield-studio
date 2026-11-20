import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, CheckCircle2, Clock3, FileText, LockKeyhole, MessageSquareText, ShieldCheck, XCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { PageLoading } from "@/components/brand/LoadingScreen";
import { SampleBadge, StatusBadge } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientRespond, getSharedProject } from "@/lib/data";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/share/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "Client project review — RevisionShield" }, { name: "description", content: "Review project scope and deliverables, approve work or request a revision." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Client project review — RevisionShield" }, { property: "og:description", content: "A private RevisionShield project review link." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SharePage,
});

function SharePage() {
  const { token } = Route.useParams();
  const query = useQuery({ queryKey: ["shared-project", token], queryFn: () => getSharedProject(token), retry: 1 });
  const [name, setName] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function respond(deliverableId: string, action: "approve" | "revise") {
    setError("");
    if (!name.trim()) { setError("Enter your name before approving or requesting a revision."); return; }
    const comment = comments[deliverableId]?.trim() ?? "";
    if (action === "revise" && comment.length < 3) { setError("Describe the revision you need before sending the request."); return; }
    setBusy(`${deliverableId}-${action}`);
    try {
      await clientRespond(token, deliverableId, action, name.trim(), comment);
      await query.refetch();
      setComments((current) => ({ ...current, [deliverableId]: "" }));
      toast.success(action === "approve" ? "Approval recorded" : "Revision request sent", { description: "Your freelancer can now see this update." });
    } catch (err) { setError(err instanceof Error ? err.message : "Your response couldn’t be recorded."); }
    finally { setBusy(""); }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><Logo /><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" />Private review link</span></div></header>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {query.isLoading ? <PageLoading /> : query.isError ? <ReviewMessage icon={<XCircle />} title="This review page couldn’t load" body={query.error.message} action={<Button variant="outline" onClick={() => query.refetch()}>Try again</Button>} /> : !query.data ? <ReviewMessage icon={<LockKeyhole />} title="This review link isn’t available" body="It may have been disabled or the address may be incomplete. Ask your freelancer for a new link." /> : <>
          <section className="relative overflow-hidden rounded-2xl border border-violet/30 bg-card p-6 sm:p-8"><div className="pointer-events-none absolute inset-0 bg-glow" /><div className="relative"><div className="flex flex-wrap items-center gap-2">{query.data.project.is_sample && <SampleBadge />}<StatusBadge status={query.data.project.status} /><span className="text-xs text-muted-foreground">{query.data.project.project_type}</span></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan">{query.data.project.business_name || "Project review"}</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{query.data.project.name}</h1><p className="mt-3 text-muted-foreground">Prepared for {query.data.project.client_name} · Due {fmtDate(query.data.project.due_date)}</p>{query.data.project.summary && <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">{query.data.project.summary}</p>}<div className="mt-6 flex flex-wrap gap-5 border-t border-border pt-5 text-sm"><span><strong>{query.data.revisions_used}</strong> of <strong>{query.data.project.included_revisions}</strong> revisions used</span><span><strong>{query.data.deliverables.filter((d) => d.status === "approved").length}</strong> of <strong>{query.data.deliverables.length}</strong> deliverables approved</span></div></div></section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
            <div className="space-y-6">
              <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><div className="mb-5"><h2 className="text-xl font-semibold">Deliverables for review</h2><p className="mt-1 text-sm text-muted-foreground">Approve work when it’s ready, or explain the revision you need.</p></div><div className="mb-5 rounded-lg bg-background/60 p-4"><Label htmlFor="reviewer-name">Your name</Label><Input id="reviewer-name" className="mt-2" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="So your freelancer knows who responded" autoComplete="name" /></div>{error && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<div className="space-y-4">{query.data.deliverables.map((d) => <article key={d.id} className="rounded-xl border border-border bg-background/30 p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><StatusBadge status={d.status} /><h3 className="mt-2 font-display text-lg font-semibold">{d.title}</h3>{d.description && <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>}</div>{d.status === "approved" && <span className="flex shrink-0 items-center gap-1 text-xs text-success"><CheckCircle2 className="size-4" />Approved</span>}</div>{d.approved_at && <p className="mt-3 text-xs text-success">Approved by {d.approved_by} · {fmtDateTime(d.approved_at)}</p>}{d.status !== "approved" && <div className="mt-4 border-t border-border pt-4"><Label htmlFor={`comment-${d.id}`}>Feedback or approval note</Label><Textarea id={`comment-${d.id}`} className="mt-2" rows={3} maxLength={2000} value={comments[d.id] ?? ""} onChange={(e) => setComments({ ...comments, [d.id]: e.target.value })} placeholder="Optional for approval; required to request a revision" /><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Button variant="hero" disabled={busy !== ""} onClick={() => respond(d.id, "approve")}><Check />{busy === `${d.id}-approve` ? "Recording…" : "Approve deliverable"}</Button><Button variant="outline" disabled={busy !== ""} onClick={() => respond(d.id, "revise")}><MessageSquareText />{busy === `${d.id}-revise` ? "Sending…" : "Request revision"}</Button></div></div>}</article>)}</div></section>
              {query.data.revisions.length > 0 && <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="text-lg font-semibold">Revision history</h2><ul className="mt-4 space-y-4">{query.data.revisions.map((r, i) => <li key={`${r.created_at}-${i}`} className="border-l-2 border-violet/40 pl-4"><p className="text-sm">{r.note}</p><p className="mt-1 text-xs text-muted-foreground">{r.requested_by} · {fmtDateTime(r.created_at)}</p></li>)}</ul></section>}
            </div>
            <aside className="space-y-5 lg:sticky lg:top-6"><section className="rounded-xl border border-border bg-card p-5"><h2 className="flex items-center gap-2 font-display font-semibold"><FileText className="size-4 text-cyan" />Agreed scope</h2><ul className="mt-4 space-y-3">{query.data.scope.map((item, i) => <li key={i} className="flex gap-2 text-sm">{item.in_scope ? item.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <Check className="mt-0.5 size-4 shrink-0 text-cyan" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-warning" />}<div><p>{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.in_scope ? item.done ? "Complete" : "In scope" : "Out of scope"}</p></div></li>)}</ul></section><section className="rounded-xl border border-cyan/20 bg-cyan/5 p-5"><ShieldCheck className="size-5 text-cyan" /><h2 className="mt-3 font-display text-sm font-semibold">Your response is recorded</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Approvals and revision requests are added to the project timeline for you and your freelancer.</p></section></aside>
          </div>
        </>}
      </main>
      <footer className="border-t border-border/60 py-6"><div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-1.5"><LockKeyhole className="size-3.5" />Only project review details are shown. Budgets, private notes and email addresses are never included.</p><Link to="/" className="hover:text-foreground">About RevisionShield</Link></div></footer>
    </div>
  );
}

function ReviewMessage({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) { return <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-cyan [&_svg]:size-6">{icon}</div><h1 className="mt-5 text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>{action && <div className="mt-5">{action}</div>}</div>; }
