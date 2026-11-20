import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, CircleDashed } from "lucide-react";
import { MarketingLayout } from "@/components/brand/SiteChrome";

export const Route = createFileRoute("/whop-setup")({
  head: () => ({ meta: [{ title: "Whop launch checklist — RevisionShield" }, { name: "description", content: "Honest setup status and launch checklist for selling RevisionShield memberships on Whop." }, { property: "og:title", content: "Whop launch checklist — RevisionShield" }, { property: "og:description", content: "RevisionShield membership setup status." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: WhopSetupPage,
});

function WhopSetupPage() {
  return <MarketingLayout><section className="mx-auto max-w-3xl px-5 py-16"><div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning"><p className="flex items-center gap-2 font-semibold"><AlertCircle className="size-4" />Whop is not connected</p><p className="mt-2 text-muted-foreground">This page is a launch checklist, not an integration dashboard. No membership, checkout or payment events are currently synced.</p></div><h1 className="mt-10 text-3xl font-semibold">Before selling on Whop</h1><p className="mt-3 text-muted-foreground">Complete these steps outside the demo before presenting RevisionShield as a paid membership.</p><div className="mt-8 space-y-3">{[
    { done: true, title: "Core project records", body: "Projects, scope, deliverables, revisions, change requests, approvals and printable reports are available." },
    { done: false, title: "Create the Whop product and checkout", body: "Set final pricing, membership terms, refund policy and support expectations on Whop." },
    { done: false, title: "Connect verified membership events", body: "Build and test a verified webhook that grants, suspends and restores app access from Whop membership status." },
    { done: false, title: "Enforce paid access", body: "Until this is complete, every registered account has access. Do not describe access as member-only." },
    { done: false, title: "Run launch checks", body: "Test real sign-up, email delivery, project permissions, client responses, mobile layouts and PDF export with your own accounts." },
  ].map((item) => <div key={item.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">{item.done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}<div><h2 className="font-display font-semibold">{item.title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p></div></div>)}</div></section></MarketingLayout>;
}
