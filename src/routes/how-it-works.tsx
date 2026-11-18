import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { SectionHead, Workflow } from "@/components/brand/sections";
export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How it works — RevisionShield" }, { name: "description", content: "How it works for RevisionShield." }, { property: "og:title", content: "How it works — RevisionShield" }, { property: "og:description", content: "How it works for RevisionShield." }] }),
  component: () => (<MarketingLayout><section className="mx-auto max-w-6xl space-y-10 px-5 py-16"><SectionHead eyebrow="RevisionShield" title="How it works" /><Workflow /></section></MarketingLayout>),
});
