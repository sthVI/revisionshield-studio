import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, FileText, FolderSearch, X } from "lucide-react";
import { AppShell, WorkspaceGate } from "@/components/app/AppShell";
import { EmptyState } from "@/components/app/bits";
import { IntelligenceIntro, ProjectIntelligence } from "@/components/app/ProjectIntelligence";
import { PageLoading } from "@/components/brand/LoadingScreen";
import { Button } from "@/components/ui/button";
import { intelligenceStatesQuery, projectQuery, setIntelligenceStatus } from "@/lib/data";
import { analyzeProject, applyInsightStates, type InsightStatus, type StatefulInsight } from "@/lib/intelligence";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId_/intelligence")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Project Intelligence — RevisionShield" },
    { name: "description", content: "Deterministic scope, risk, deliverable-gap and next-step analysis for a freelance project." },
    { name: "robots", content: "noindex" },
    { property: "og:title", content: "Project Intelligence — RevisionShield" },
    { property: "og:description", content: "Grounded heuristic analysis of scope, approvals, revisions and deadlines." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <WorkspaceGate><AppShell><IntelligencePage /></AppShell></WorkspaceGate>,
});

function IntelligencePage() {
  const { projectId } = Route.useParams();
  const project = useQuery(projectQuery(projectId));
  const states = useQuery(intelligenceStatesQuery(projectId));
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState("");
  const analysis = useMemo(() => project.data ? applyInsightStates(analyzeProject(project.data), states.data ?? []) : null, [project.data, states.data]);

  async function updateStatus(insight: StatefulInsight, status: InsightStatus) {
    setBusy(insight.id);
    try {
      await setIntelligenceStatus(projectId, insight.id, status);
      await queryClient.invalidateQueries({ queryKey: ["intelligence-states", projectId] });
      toast.success(status === "active" ? "Finding restored" : status === "resolved" ? "Finding marked resolved" : "Finding dismissed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The finding status could not be saved");
    } finally {
      setBusy("");
    }
  }

  if (project.isLoading || states.isLoading) return <PageLoading />;
  if (project.isError) return <EmptyState icon={<X />} title="This project couldn’t load"><span>{project.error.message}</span><Button className="mt-4" variant="outline" onClick={() => project.refetch()}>Try again</Button></EmptyState>;
  if (!project.data || !analysis) return <EmptyState icon={<FolderSearch />} title="Project not found" action={<Button asChild variant="outline"><Link to="/dashboard">Back to projects</Link></Button>}>It may have been deleted, or it belongs to another account.</EmptyState>;

  return <div>
    <Button asChild variant="ghost" size="sm" className="mb-5 -ml-2"><Link to="/projects/$projectId" params={{ projectId }}><ArrowLeft />Back to {project.data.project.name}</Link></Button>
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">RevisionShield Studio 2.0</p><h1 className="mt-2 text-3xl font-semibold">Project Intelligence</h1><p className="mt-2 text-sm text-muted-foreground">{project.data.project.name} · {project.data.project.client_name}</p></div>
      <Button asChild variant="hero"><Link to="/projects/$projectId/intelligence-report" params={{ projectId }}><FileText />Client-safe report</Link></Button>
    </div>
    <IntelligenceIntro />
    {states.isError && <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Saved finding statuses couldn’t load: {states.error.message} Analysis is available, but status changes are paused. <Button variant="outline" size="sm" className="ml-2" onClick={() => states.refetch()}>Retry</Button></div>}
    <ProjectIntelligence analysis={analysis} busy={busy} disabled={states.isError} onStatus={updateStatus} />
  </div>;
}
