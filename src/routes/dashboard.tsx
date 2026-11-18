import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { SectionHead, Features } from "@/components/brand/sections";
export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard (coming soon) — RevisionShield" }, { name: "description", content: "Dashboard (coming soon) for RevisionShield." }, { property: "og:title", content: "Dashboard (coming soon) — RevisionShield" }, { property: "og:description", content: "Dashboard (coming soon) for RevisionShield." }] }),
  component: () => (<MarketingLayout><section className="mx-auto max-w-6xl space-y-10 px-5 py-16"><SectionHead eyebrow="RevisionShield" title="Dashboard (coming soon)" /><Features /></section></MarketingLayout>),
});
