import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, Clipboard, ShieldCheck, Target, TrendingUp, UserRound } from "lucide-react";
import { AppShell, WorkspaceGate } from "@/components/app/AppShell";
import { Panel } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/freelancer")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Freelancer Intelligence — RevisionShield" },
    { name: "description", content: "Organise opportunities, qualify leads, understand buyers and improve your freelance workflow." },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <WorkspaceGate><AppShell><FreelancerPage /></AppShell></WorkspaceGate>,
});

type Stage = "saved" | "reviewing" | "proposal" | "submitted" | "won" | "lost";
type Scores = { skills: number; budget: number; clarity: number; buyer: number; competition: number; time: number };
type Opportunity = {
  id: string; title: string; platform: string; buyer: string; url: string; budget: string;
  deadline: string; brief: string; evidence: string; assumptions: string; risks: string;
  scores: Scores; stage: Stage; createdAt: string;
};
type Profile = { name: string; service: string; skills: string; portfolio: string; availability: string };
type Workspace = { profile: Profile; opportunities: Opportunity[]; lessons: string };

const STORAGE_KEY = "revisionshield.freelancer-workspace.v1";
const EMPTY_PROFILE: Profile = { name: "", service: "", skills: "", portfolio: "", availability: "Open to work" };
const EMPTY_SCORES: Scores = { skills: 0, budget: 0, clarity: 0, buyer: 0, competition: 0, time: 0 };
const STAGES: { value: Stage; label: string }[] = [
  { value: "saved", label: "Saved" }, { value: "reviewing", label: "Reviewing" },
  { value: "proposal", label: "Proposal ready" }, { value: "submitted", label: "Submitted" },
  { value: "won", label: "Won" }, { value: "lost", label: "Closed / lost" },
];
const CRITERIA: { key: keyof Scores; label: string; max: number; hint: string }[] = [
  { key: "skills", label: "Skills match", max: 30, hint: "How closely the work matches your demonstrated skills" },
  { key: "budget", label: "Budget", max: 20, hint: "Whether the stated budget is realistic for the scope" },
  { key: "clarity", label: "Scope clarity", max: 15, hint: "How clearly the tasks and deliverables are described" },
  { key: "buyer", label: "Buyer credibility", max: 15, hint: "Evidence of a genuine, consistent buyer" },
  { key: "competition", label: "Competition", max: 10, hint: "How manageable the competition appears" },
  { key: "time", label: "Time feasibility", max: 10, hint: "Whether the deadline fits your availability" },
];

function scoreOf(scores: Scores) { return Object.values(scores).reduce((sum, value) => sum + value, 0); }
function bandOf(score: number) {
  if (score >= 80) return { label: "Prioritize", className: "text-success" };
  if (score >= 60) return { label: "Review", className: "text-cyan" };
  if (score >= 40) return { label: "Cautious", className: "text-warning" };
  return { label: "Not recommended", className: "text-destructive" };
}
function makeProposal(opportunity: Opportunity, profile: Profile) {
  const skills = profile.skills.trim() || "my relevant experience";
  return `Hello ${opportunity.buyer.trim() || "there"},

I’m interested in helping with ${opportunity.title || "your project"}. The brief suggests you need ${opportunity.brief.trim() || "support with the project described"}.

My relevant strengths include ${skills}. I would begin by confirming the expected deliverables, priorities and acceptance criteria, then agree on a realistic timeline before starting.

A few details I’d like to clarify:
- Which outcome is most important to you?
- Are there reference examples or existing materials I should work from?
- What is the preferred review and feedback process?

If the scope and timeline align, I’d be glad to discuss the next step.

Regards,
${profile.name.trim() || "Your name"}`;
}

function FreelancerPage() {
  const [workspace, setWorkspace] = useState<Workspace>({ profile: EMPTY_PROFILE, opportunities: [], lessons: "" });
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState({ title: "", platform: "", buyer: "", url: "", budget: "", deadline: "", brief: "" });
  const [selectedId, setSelectedId] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Workspace;
        setWorkspace({ profile: { ...EMPTY_PROFILE, ...parsed.profile }, opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [], lessons: parsed.lessons ?? "" });
      }
    } catch { toast.error("Saved freelancer workspace could not be read."); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); } catch { toast.error("Browser storage is unavailable; changes may not persist."); } }
  }, [workspace, ready]);

  const selected = workspace.opportunities.find((item) => item.id === selectedId) ?? workspace.opportunities[0];
  const totals = useMemo(() => ({
    total: workspace.opportunities.length,
    active: workspace.opportunities.filter((item) => !["won", "lost"].includes(item.stage)).length,
    won: workspace.opportunities.filter((item) => item.stage === "won").length,
    best: workspace.opportunities.reduce((best, item) => Math.max(best, scoreOf(item.scores)), 0),
  }), [workspace.opportunities]);

  function addOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.platform.trim()) { toast.error("Add an opportunity title and platform first."); return; }
    const item: Opportunity = {
      ...draft, id: crypto.randomUUID(), evidence: "", assumptions: "", risks: "",
      scores: { ...EMPTY_SCORES }, stage: "saved", createdAt: new Date().toISOString(),
    };
    setWorkspace((current) => ({ ...current, opportunities: [item, ...current.opportunities] }));
    setSelectedId(item.id);
    setDraft({ title: "", platform: "", buyer: "", url: "", budget: "", deadline: "", brief: "" });
    toast.success("Opportunity saved in this browser");
  }

  function updateSelected(patch: Partial<Opportunity>) {
    if (!selected) return;
    setWorkspace((current) => ({ ...current, opportunities: current.opportunities.map((item) => item.id === selected.id ? { ...item, ...patch } : item) }));
  }

  async function copyProposal() {
    if (!selected) return;
    try { await navigator.clipboard.writeText(makeProposal(selected, workspace.profile)); toast.success("Proposal draft copied"); }
    catch { toast.error("Clipboard access was unavailable. Try selecting the draft text manually."); }
  }

  if (!ready) return <div className="py-16 text-center text-sm text-muted-foreground">Loading freelancer workspace…</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">RevisionShield · Freelancer Intelligence</p><h1 className="mt-2 text-3xl font-semibold">Find better-fit work.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">A practical workspace for your freelancer identity, opportunity reviews, buyer notes, proposals and growth loop.</p></div>
        <Button variant="outline" onClick={() => setProfileOpen((open) => !open)}><UserRound />{profileOpen ? "Close profile" : "Freelancer profile"}</Button>
      </div>

      <div role="status" className="flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-warning" />
        <div><p className="font-medium">Browser-local workspace</p><p className="mt-1 text-muted-foreground">These opportunity records and profile notes are saved only in this browser. They are not synced to your RevisionShield account or cloud database yet. Do not store passwords, payment details or sensitive client information here.</p></div>
      </div>

      {profileOpen && <Panel title="Freelancer identity"><p className="mb-4 text-sm text-muted-foreground">Keep your service, skills and availability clear. This profile is a working reference, not a verified platform identity.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name"><Input value={workspace.profile.name} onChange={(e) => setWorkspace((w) => ({ ...w, profile: { ...w.profile, name: e.target.value } }))} placeholder="Your professional name" /></Field>
          <Field label="Primary service"><Input value={workspace.profile.service} onChange={(e) => setWorkspace((w) => ({ ...w, profile: { ...w.profile, service: e.target.value } }))} placeholder="e.g. Website design and development" /></Field>
          <Field label="Skills"><Input value={workspace.profile.skills} onChange={(e) => setWorkspace((w) => ({ ...w, profile: { ...w.profile, skills: e.target.value } }))} placeholder="HTML, CSS, JavaScript…" /></Field>
          <Field label="Portfolio link"><Input value={workspace.profile.portfolio} onChange={(e) => setWorkspace((w) => ({ ...w, profile: { ...w.profile, portfolio: e.target.value } }))} placeholder="https://…" /></Field>
          <Field label="Availability"><Input value={workspace.profile.availability} onChange={(e) => setWorkspace((w) => ({ ...w, profile: { ...w.profile, availability: e.target.value } }))} /></Field>
        </div>
      </Panel>}

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Opportunities tracked" value={totals.total} icon={<BriefcaseBusiness />} />
        <Metric label="Active reviews" value={totals.active} icon={<Target />} />
        <Metric label="Won" value={totals.won} icon={<Check />} />
        <Metric label="Top qualification" value={`${totals.best}/100`} icon={<TrendingUp />} />
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <Panel title="Opportunity discovery"><p className="mb-4 text-sm text-muted-foreground">Add opportunities manually from platforms you are authorised to use.</p>
          <form onSubmit={addOpportunity} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Opportunity title"><Input required value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Website redesign" /></Field>
              <Field label="Platform / source"><Input required value={draft.platform} onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))} placeholder="Fiverr, Upwork, referral…" /></Field>
              <Field label="Buyer / client name"><Input value={draft.buyer} onChange={(e) => setDraft((d) => ({ ...d, buyer: e.target.value }))} placeholder="Client or company" /></Field>
              <Field label="Budget (as listed)"><Input value={draft.budget} onChange={(e) => setDraft((d) => ({ ...d, budget: e.target.value }))} placeholder="e.g. $150–$250" /></Field>
              <Field label="Opportunity URL"><Input type="url" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://…" /></Field>
              <Field label="Deadline"><Input type="date" value={draft.deadline} onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))} /></Field>
            </div>
            <Field label="Brief / requirements"><Textarea rows={3} value={draft.brief} onChange={(e) => setDraft((d) => ({ ...d, brief: e.target.value }))} placeholder="Summarise the requested work and expected outcome…" /></Field>
            <Button type="submit" variant="hero"><BriefcaseBusiness />Save opportunity</Button>
          </form>
        </Panel>

        <Panel title="Opportunity pipeline"><p className="mb-4 text-sm text-muted-foreground">Move each opportunity forward as you review it.</p>
          {workspace.opportunities.length === 0 ? <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Your pipeline is empty. Add an opportunity to start tracking it.</div> : <div className="space-y-3">{workspace.opportunities.map((item) => {
            const score = scoreOf(item.scores); const band = bandOf(score);
            return <div key={item.id} className={`rounded-xl border p-4 transition-colors ${selected?.id === item.id ? "border-violet/60 bg-accent/40" : "border-border bg-card/50"}`}>
              <button type="button" onClick={() => setSelectedId(item.id)} className="flex w-full items-start justify-between gap-3 text-left"><div className="min-w-0"><p className="truncate font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.platform}{item.buyer ? ` · ${item.buyer}` : ""}</p></div><span className={`shrink-0 text-sm font-semibold ${band.className}`}>{score}/100</span></button>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{band.label}</span><select aria-label={`Stage for ${item.title}`} value={item.stage} onChange={(e) => setWorkspace((w) => ({ ...w, opportunities: w.opportunities.map((opp) => opp.id === item.id ? { ...opp, stage: e.target.value as Stage } : opp) }))} className="rounded-md border border-border bg-background px-2 py-1 text-xs">{STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></div>
            </div>;
          })}</div>}
        </Panel>
      </section>

      {selected && <section className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Selected opportunity</p><h2 className="mt-1 text-2xl font-semibold">{selected.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.platform}{selected.buyer ? ` · ${selected.buyer}` : ""}{selected.budget ? ` · ${selected.budget}` : ""}</p></div>{selected.url && <a href={selected.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-cyan hover:underline">Open source <ArrowUpRight className="size-4" /></a>}</div>
        <Panel title="Opportunity qualification"><p className="mb-4 text-sm text-muted-foreground">Score each factor using evidence you can explain. The result is a guide, not a guarantee of a good outcome.</p>
          <div className="grid gap-5 md:grid-cols-2">
            {CRITERIA.map((criterion) => <div key={criterion.key} className="space-y-2"><div className="flex items-center justify-between gap-3"><Label>{criterion.label}</Label><span className="font-mono text-sm tabular-nums">{selected.scores[criterion.key]}/{criterion.max}</span></div><input type="range" min="0" max={criterion.max} step="1" value={selected.scores[criterion.key]} onChange={(e) => updateSelected({ scores: { ...selected.scores, [criterion.key]: Number(e.target.value) } })} className="w-full accent-cyan" /><p className="text-xs text-muted-foreground">{criterion.hint}</p></div>)}
          </div>
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-xl border border-border bg-background/70 p-4 sm:flex-row sm:items-center"><div><p className="text-xs text-muted-foreground">Qualification score</p><p className={`mt-1 text-3xl font-semibold ${bandOf(scoreOf(selected.scores)).className}`}>{scoreOf(selected.scores)}<span className="text-base text-muted-foreground"> / 100</span></p></div><div className="text-sm"><p className="font-semibold">{bandOf(scoreOf(selected.scores)).label}</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">80–100 Prioritize · 60–79 Review · 40–59 Cautious · Below 40 Not recommended</p></div></div>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Buyer intelligence"><p className="mb-4 text-sm text-muted-foreground">Keep verifiable evidence separate from your interpretation.</p>
            <div className="space-y-4"><Field label="Evidence"><Textarea rows={3} value={selected.evidence} onChange={(e) => updateSelected({ evidence: e.target.value })} placeholder="Public work history, verified reviews, clear requirements…" /></Field><Field label="Assumptions"><Textarea rows={3} value={selected.assumptions} onChange={(e) => updateSelected({ assumptions: e.target.value })} placeholder="What you suspect but have not confirmed…" /></Field><Field label="Risks / questions"><Textarea rows={3} value={selected.risks} onChange={(e) => updateSelected({ risks: e.target.value })} placeholder="Unclear scope, unusual payment terms, missing details…" /></Field></div>
          </Panel>
          <Panel title="Proposal intelligence"><p className="mb-4 text-sm text-muted-foreground">Create a clear first draft from the opportunity details and your profile. Review it before sending.</p>
            <div className="rounded-lg border border-border bg-background/70 p-4"><p className="whitespace-pre-wrap text-sm leading-6">{makeProposal(selected, workspace.profile)}</p></div>
            <Button className="mt-4" variant="outline" onClick={copyProposal}><Clipboard />Copy proposal draft</Button>
          </Panel>
        </div>
      </section>}

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Freelancer growth loop"><p className="mb-4 text-sm text-muted-foreground">Turn completed opportunities into lessons you can apply next time.</p>
          <div className="flex items-center gap-3 rounded-lg bg-accent/40 p-4"><TrendingUp className="size-5 text-cyan" /><div><p className="font-medium">{totals.won} opportunities marked won</p><p className="text-xs text-muted-foreground">Track your own results; no performance claims are inferred.</p></div></div>
          <div className="mt-4"><Field label="Lessons, wins and improvements"><Textarea rows={4} value={workspace.lessons} onChange={(e) => setWorkspace((w) => ({ ...w, lessons: e.target.value }))} placeholder="What worked? Which project types fit your skills? What would you change next time?" /></Field></div>
        </Panel>
        <Panel title="Platform authorization & safety"><p className="mb-4 text-sm text-muted-foreground">Keep discovery and outreach within each platform’s rules.</p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />Use manual or platform-authorised opportunity discovery.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />Verify buyer claims and keep evidence separate from assumptions.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />Review every proposal and submit it yourself through the platform.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />Do not scrape, spam, bypass platform limits or share account credentials.</li>
          </ul>
          <div className="mt-5 rounded-lg border border-border p-4 text-xs text-muted-foreground"><ShieldCheck className="mb-2 size-4 text-cyan" />RevisionShield does not submit applications or proposals automatically. You remain in control of every platform interaction.</div>
        </Panel>
      </section>
      <p className="text-xs text-muted-foreground">This first-pass module uses manual entry, transparent rule-based scoring and a proposal template. Platform discovery APIs, AI buyer analysis, account-synced opportunity storage and Pro access controls are not connected yet.</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function Metric({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><span className="text-cyan">{icon}</span></div><p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p></div>;
}
