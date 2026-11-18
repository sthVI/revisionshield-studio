import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { SectionHead, ComparisonTable } from "@/components/brand/sections";
export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Honest comparison — RevisionShield" }, { name: "description", content: "Honest comparison for RevisionShield." }, { property: "og:title", content: "Honest comparison — RevisionShield" }, { property: "og:description", content: "Honest comparison for RevisionShield." }] }),
  component: () => (<MarketingLayout><section className="mx-auto max-w-6xl space-y-10 px-5 py-16"><SectionHead eyebrow="RevisionShield" title="Honest comparison" /><ComparisonTable /></section></MarketingLayout>),
});
