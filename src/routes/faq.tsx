import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { SectionHead, Faq } from "@/components/brand/sections";
export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "Frequently asked questions — RevisionShield" }, { name: "description", content: "Frequently asked questions for RevisionShield." }, { property: "og:title", content: "Frequently asked questions — RevisionShield" }, { property: "og:description", content: "Frequently asked questions for RevisionShield." }] }),
  component: () => (<MarketingLayout><section className="mx-auto max-w-6xl space-y-10 px-5 py-16"><SectionHead eyebrow="RevisionShield" title="Frequently asked questions" /><Faq /></section></MarketingLayout>),
});
