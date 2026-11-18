import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { SectionHead, Pricing } from "@/components/brand/sections";
export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — RevisionShield" }, { name: "description", content: "Pricing for RevisionShield." }, { property: "og:title", content: "Pricing — RevisionShield" }, { property: "og:description", content: "Pricing for RevisionShield." }] }),
  component: () => (<MarketingLayout><section className="mx-auto max-w-6xl space-y-10 px-5 py-16"><SectionHead eyebrow="RevisionShield" title="Pricing" /><Pricing /></section></MarketingLayout>),
});
