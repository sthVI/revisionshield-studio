import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { SectionHead, CtaBand } from "@/components/brand/sections";
export const Route = createFileRoute("/whop-setup")({
  head: () => ({ meta: [{ title: "Whop setup — RevisionShield" }, { name: "description", content: "Whop setup for RevisionShield." }, { property: "og:title", content: "Whop setup — RevisionShield" }, { property: "og:description", content: "Whop setup for RevisionShield." }] }),
  component: () => (<MarketingLayout><section className="mx-auto max-w-6xl space-y-10 px-5 py-16"><SectionHead eyebrow="RevisionShield" title="Whop setup" /><CtaBand /></section></MarketingLayout>),
});
