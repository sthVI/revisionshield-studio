import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Minus, ClipboardList, FileCheck2, GitPullRequestArrow, Link2, FileText, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{title}</h2>
      {children && <p className="mt-4 text-muted-foreground">{children}</p>}
    </div>
  );
}

export const FEATURES = [
  { icon: ClipboardList, title: "Scope from the brief", body: "Paste the client brief, split it into scope items, and mark what's explicitly out of scope so nobody has to guess later." },
  { icon: Gauge, title: "Revision counter", body: "Set the included rounds per project. Every revision is logged with who asked and when — and you'll see the moment you go over." },
  { icon: Link2, title: "Client approval link", body: "Send an unguessable link. Clients approve deliverables or request a revision without an account. Budget and private notes stay hidden." },
  { icon: GitPullRequestArrow, title: "Change requests", body: "Log new asks, classify them in or out of scope, attach an extra fee and time estimate, then record accept or decline with timestamps." },
  { icon: FileCheck2, title: "Timeline you can point to", body: "Every approval, revision and decision lands on a project timeline — a calm record instead of digging through email threads." },
  { icon: FileText, title: "Scope & closeout reports", body: "Print or save as PDF: a scope-of-work summary up front, and a closeout report with approvals, revisions and change requests at the end." },
];

export function Features() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f) => (
        <div key={f.title} className="group rounded-xl border border-border bg-card/70 p-6 transition-colors hover:border-violet/50">
          <div className="mb-4 grid size-10 place-items-center rounded-lg bg-accent text-cyan"><f.icon className="size-5" /></div>
          <h3 className="font-display text-lg font-semibold">{f.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
        </div>
      ))}
    </div>
  );
}

export const STEPS = [
  { n: "01", title: "Turn the brief into scope", body: "Create a project, list scope items and deliverables, and set how many revision rounds are included." },
  { n: "02", title: "Share the approval link", body: "Send your client a private link. They review deliverables and approve or request a revision with comments." },
  { n: "03", title: "Log changes as they come", body: "When a request falls outside scope, log it as a change request with a fee and time estimate before doing the work." },
  { n: "04", title: "Close out with a record", body: "Export a closeout report summarising approvals, revisions used and change decisions — handy for invoices and wrap-up." },
];

export function Workflow() {
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {STEPS.map((s) => (
        <li key={s.n} className="relative rounded-xl border border-border bg-card/60 p-5">
          <span className="font-mono text-sm text-gradient">{s.n}</span>
          <h3 className="mt-2 font-display font-semibold">{s.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

type Cell = "yes" | "varies" | "no" | string;
const ROWS: { label: string; pm: Cell; suite: Cell; portal: Cell; rs: Cell }[] = [
  { label: "Primary focus", pm: "Tasks & team workflow", suite: "Proposals, contracts, invoicing, CRM", portal: "File sharing & client comms", rs: "Scope, revisions, approvals, change requests" },
  { label: "Revision allowance tracking", pm: "Possible with custom fields", suite: "varies", portal: "varies", rs: "yes" },
  { label: "Client approval without an account", pm: "Usually requires guest access", suite: "Often available", portal: "Often available", rs: "yes" },
  { label: "Change request fee / time estimates", pm: "Manual", suite: "Via new proposals or invoices", portal: "varies", rs: "yes" },
  { label: "Exportable scope & closeout record", pm: "Manual export", suite: "varies", portal: "varies", rs: "Print / save as PDF" },
  { label: "Invoicing & payments", pm: "no", suite: "yes", portal: "varies", rs: "no" },
  { label: "Contracts & e-signatures", pm: "no", suite: "yes", portal: "varies", rs: "no" },
  { label: "Team task management", pm: "yes", suite: "Basic", portal: "no", rs: "no" },
];

function C({ v }: { v: Cell }) {
  if (v === "yes") return <Check className="mx-auto size-4 text-success" aria-label="Yes" />;
  if (v === "no") return <Minus className="mx-auto size-4 text-muted-foreground" aria-label="Not a focus" />;
  if (v === "varies") return <span className="text-xs text-muted-foreground">Varies by tool</span>;
  return <span className="text-xs text-muted-foreground">{v}</span>;
}

export function ComparisonTable() {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="p-4 font-medium text-muted-foreground"> </th>
              <th className="p-4 text-center font-medium">Project management<br /><span className="text-xs font-normal text-muted-foreground">e.g. Trello, Asana</span></th>
              <th className="p-4 text-center font-medium">Freelancer suites<br /><span className="text-xs font-normal text-muted-foreground">e.g. Bonsai, HoneyBook</span></th>
              <th className="p-4 text-center font-medium">Client portals<br /><span className="text-xs font-normal text-muted-foreground">lightweight</span></th>
              <th className="bg-violet/10 p-4 text-center font-semibold text-foreground">RevisionShield</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-t border-border">
                <td className="p-4 font-medium">{r.label}</td>
                <td className="p-4 text-center"><C v={r.pm} /></td>
                <td className="p-4 text-center"><C v={r.suite} /></td>
                <td className="p-4 text-center"><C v={r.portal} /></td>
                <td className="bg-violet/5 p-4 text-center"><C v={r.rs} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        General categories, not a feature audit of any specific product. Tools change often and many can be configured or extended to cover these needs — check each vendor's current documentation. RevisionShield deliberately does less: it focuses on the scope, revision, approval and change-request record and works alongside the tools you already use.
      </p>
    </div>
  );
}

const STARTER_FEATURES = [
  "Up to 3 active projects",
  "Scope and deliverable tracking",
  "Included revision limits",
  "Change requests and client approvals",
  "Basic project health checks",
  "Manual opportunity saving",
];

const PRO_FEATURES = [
  "Everything in Starter",
  "Unlimited active projects",
  "Advanced project intelligence audits",
  "Buyer Finder and opportunity matching",
  "Proposal drafting and buyer analysis",
  "Portfolio analysis and risk detection",
  "Growth Coach and performance reports",
  "Higher AI usage limits",
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center rounded-full border border-border bg-card p-1" aria-label="Billing period">
          <button type="button" onClick={() => setAnnual(false)} aria-pressed={!annual} className={`rounded-full px-4 py-2 text-sm transition-colors ${!annual ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Monthly</button>
          <button type="button" onClick={() => setAnnual(true)} aria-pressed={annual} className={`rounded-full px-4 py-2 text-sm transition-colors ${annual ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Yearly <span className="ml-1 text-xs text-cyan">Save $14</span></button>
        </div>
        <p className="text-xs text-muted-foreground">Choose the billing period that suits your workflow.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card/70 p-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-semibold">Starter</h3>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Free forever</span>
          </div>
          <p className="mt-5 font-display text-4xl font-semibold">Free</p>
          <p className="mt-1 text-sm text-muted-foreground">The essentials for keeping client work clear.</p>
          <ul className="mt-6 space-y-3 text-sm">
            {STARTER_FEATURES.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-cyan" />{feature}</li>)}
          </ul>
          <Button asChild className="mt-8 w-full" variant="glass"><Link to="/auth" search={{ mode: "signup" }}>Start with Starter</Link></Button>
        </section>

        <section className="rounded-2xl border border-violet/60 bg-card p-7 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-semibold">Pro</h3>
            <span className="rounded-full bg-gradient-brand px-2.5 py-1 text-xs font-semibold text-primary-foreground">For growing freelancers</span>
          </div>
          <p className="mt-5 font-display text-4xl font-semibold tabular-nums">{annual ? "$70" : "$7"}<span className="text-base font-normal text-muted-foreground">{annual ? " / year" : " / month"}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">{annual ? "Billed yearly — equivalent to about $5.83 per month." : "Flexible monthly membership."}</p>
          <ul className="mt-6 space-y-3 text-sm">
            {PRO_FEATURES.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-cyan" />{feature}</li>)}
          </ul>
          <Button asChild className="mt-8 w-full" variant="hero"><Link to="/auth" search={{ mode: "signup" }}>Explore Pro</Link></Button>
        </section>
      </div>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Pricing is planned at $7 monthly or $70 yearly for Pro. Whop checkout, verified membership webhooks and paid-access enforcement are not connected yet, so these prices are not currently charged and Pro features are not yet access-controlled.
      </p>
    </div>
  );
}

export const FAQS = [
  { q: "Is a RevisionShield record legally binding?", a: "No. RevisionShield produces a clear, timestamped project record of scope, approvals, revisions and change requests. It is not a contract, not legal advice, and it does not guarantee you'll be paid. For enforceable terms, use a proper contract reviewed for your jurisdiction." },
  { q: "Does my client need an account?", a: "No. You send them a private, hard-to-guess link for one project. They can review deliverables, approve, or request a revision with a comment. They never see your budget, internal notes or other projects." },
  { q: "What counts as a revision?", a: "You decide. Each project has an included revision count. Every revision request — logged by you or submitted by the client through the link — counts toward it, and the counter shows clearly when you go over." },
  { q: "Can I export a PDF?", a: "Yes. The scope-of-work and closeout reports are print-ready; use your browser's Print → Save as PDF to download them." },
  { q: "Is there invoicing or payments?", a: "No. RevisionShield focuses narrowly on scope and change records. Use your existing invoicing tool and reference the change requests and fees recorded here." },
  { q: "Where is my data stored?", a: "In a secured cloud database. Each account can only read its own projects; client links only expose the specific fields needed for review." },
  { q: "Can I delete the sample project?", a: "Yes. The sample project is clearly labelled and can be deleted anytime, or recreated from the dashboard." },
];

export function Faq() {
  return (
    <Accordion type="single" collapsible className="mx-auto max-w-3xl">
      {FAQS.map((f) => (
        <AccordionItem key={f.q} value={f.q}>
          <AccordionTrigger className="text-left font-display text-base">{f.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-violet/40 bg-card p-10 text-center md:p-14">
        <div className="pointer-events-none absolute inset-0 bg-glow" />
        <h2 className="relative text-3xl font-semibold md:text-4xl">Put your next project on the record.</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">Sign up, open the sample project, and send yourself a client link to see how it feels.</p>
        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="lg"><Link to="/auth" search={{ mode: "signup" }}>Create your account</Link></Button>
          <Button asChild variant="glass" size="lg"><Link to="/how-it-works">See how it works</Link></Button>
        </div>
      </div>
    </section>
  );
}
