import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/SiteChrome";
import { SectionHead, CtaBand } from "@/components/brand/sections";
export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: string } => ({ mode: typeof s["mode"] === "string" ? s["mode"] : undefined }),
  head: () => ({ meta: [{ title: "Sign in — RevisionShield" }, { name: "description", content: "Sign in for RevisionShield." }, { property: "og:title", content: "Sign in — RevisionShield" }, { property: "og:description", content: "Sign in for RevisionShield." }] }),
  component: () => (<MarketingLayout><section className="mx-auto max-w-6xl space-y-10 px-5 py-16"><SectionHead eyebrow="RevisionShield" title="Sign in" /><CtaBand /></section></MarketingLayout>),
});
