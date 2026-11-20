import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, CheckCircle2, Clock3, FileCheck2, MessageSquareText, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { CtaBand, Features, Workflow } from "@/components/brand/sections";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RevisionShield — Stop scope creep. Protect your freelance income." },
      { name: "description", content: "Turn client briefs into clear scope, track revisions, collect approvals and record change requests in one calm freelance workspace." },
      { property: "og:title", content: "RevisionShield — Stop scope creep" },
      { property: "og:description", content: "Clear scope, revision tracking, client approvals and change-request records for freelancers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-glow" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-xs font-medium text-cyan"><ShieldCheck className="size-3.5" />Built for independent client work</div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] sm:text-5xl md:text-6xl">Stop scope creep.<br /><span className="text-gradient">Protect your freelance income.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">Turn a client brief into a clear scope, keep revisions visible, collect approvals and record extra work — before “just one more thing” becomes unpaid work.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg"><Link to="/auth" search={{ mode: "signup" }}>Start your first project<ArrowRight /></Link></Button>
              <Button asChild variant="glass" size="lg"><Link to="/dashboard">Explore the live demo</Link></Button>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><Check className="size-3.5 text-success" />Client needs no account</li>
              <li className="flex items-center gap-1.5"><Check className="size-3.5 text-success" />Print-ready records</li>
              <li className="flex items-center gap-1.5"><Check className="size-3.5 text-success" />No payment setup needed</li>
            </ul>
          </div>
          <ProjectPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">A record, not another project manager</p><h2 className="mt-3 text-3xl font-semibold md:text-4xl">The details that protect the work</h2><p className="mt-4 text-muted-foreground">A focused workspace for the moments freelance projects usually leave buried in messages.</p></div>
        <Features />
      </section>
      <section className="border-y border-border/50 bg-surface/40 py-20"><div className="mx-auto max-w-6xl px-5"><div className="mb-10 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">From brief to closeout</p><h2 className="mt-3 text-3xl font-semibold">One clear thread through the project</h2></div><Workflow /></div></section>
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-3">
        {[{ icon: MessageSquareText, title: "Fewer awkward messages", body: "Point to a shared scope and revision count instead of reconstructing a decision from chat." }, { icon: Clock3, title: "Extra work, made visible", body: "Record the fee and time impact of a change before accepting or declining it." }, { icon: FileCheck2, title: "A cleaner handover", body: "Close with approvals, revisions and decisions in one report you can save as a PDF." }].map((item) => <div key={item.title} className="border-l-2 border-violet/50 pl-5"><item.icon className="size-5 text-cyan" /><h3 className="mt-3 text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p></div>)}
      </section>
      <CtaBand />
    </MarketingLayout>
  );
}

function ProjectPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg" aria-label="Example RevisionShield project overview">
      <div className="absolute -inset-6 rounded-[2rem] bg-glow opacity-80 blur-xl" />
      <div className="relative overflow-hidden rounded-2xl border border-violet/30 bg-card shadow-glow">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-destructive" /><span className="size-2 rounded-full bg-warning" /><span className="size-2 rounded-full bg-success" /></div><span className="font-mono text-[10px] text-muted-foreground">PROJECT / OVERVIEW</span></div>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-muted-foreground">Brightleaf Bakery</p><h2 className="mt-1 text-xl font-semibold">Website refresh</h2></div><span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] text-success">On track</span></div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[["Scope", "4 / 6"], ["Approved", "1 / 3"], ["Revisions", "1 / 2"]].map(([label, value]) => <div key={label} className="rounded-lg bg-background/60 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm">{value}</p></div>)}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3"><CheckCircle2 className="size-5 shrink-0 text-success" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Homepage design</p><p className="text-xs text-muted-foreground">Approved by client</p></div><span className="text-xs text-success">Approved</span></div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3"><Clock3 className="size-5 shrink-0 text-cyan" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Inner page designs</p><p className="text-xs text-muted-foreground">Shared for review</p></div><span className="text-xs text-cyan">Awaiting</span></div>
          </div>
          <div className="mt-5 rounded-lg border border-violet/25 bg-violet/10 p-3"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Revision allowance</span><span className="font-mono">1 remaining</span></div><div className="mt-2 h-1.5 rounded-full bg-background"><div className="h-full w-1/2 rounded-full bg-gradient-brand" /></div></div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Example project · no real client data</p>
    </div>
  );
}
