import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { demoId, isDemoMode, loadDemoState, saveDemoState } from "@/lib/demo";
import type { InsightStatus, IntelligenceState } from "@/lib/intelligence";

type T<N extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][N]["Row"];
export type Project = T<"projects">;
export type ScopeItem = T<"scope_items">;
export type Deliverable = T<"deliverables">;
export type Revision = T<"revisions">;
export type ChangeRequest = T<"change_requests">;
export type Activity = T<"activities">;
export type Profile = T<"profiles">;

function check<D>(r: { data: D; error: { message: string } | null }): D {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export async function currentUserId() {
  if (isDemoMode()) return loadDemoState().profile.id;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in again to continue.");
  return data.user.id;
}

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile", isDemoMode()],
    queryFn: async (): Promise<Profile | null> => {
      if (isDemoMode()) return loadDemoState().profile;
      const uid = await currentUserId();
      return check(await supabase.from("profiles").select("*").eq("id", uid).maybeSingle());
    },
  });

export type ProjectSummary = Project & { revisions_used: number; deliverables: Pick<Deliverable, "status">[]; pending_crs: number };

export const projectsQuery = () =>
  queryOptions({
    queryKey: ["projects", isDemoMode()],
    queryFn: async (): Promise<ProjectSummary[]> => {
      if (isDemoMode()) {
        const state = loadDemoState();
        return state.projects.map((p) => ({
          ...p,
          revisions_used: state.revisions.filter((r) => r.project_id === p.id).length,
          deliverables: state.deliverables.filter((d) => d.project_id === p.id).map(({ status }) => ({ status })),
          pending_crs: state.changes.filter((c) => c.project_id === p.id && c.status === "pending").length,
        }));
      }
      const rows = check(
        await supabase.from("projects").select("*, revisions(count), deliverables(status), change_requests(status)").order("created_at", { ascending: false }),
      ) as unknown as (Project & { revisions: { count: number }[]; deliverables: { status: string }[]; change_requests: { status: string }[] })[];
      return rows.map(({ revisions, change_requests, ...p }) => ({
        ...p,
        revisions_used: revisions?.[0]?.count ?? 0,
        pending_crs: change_requests.filter((c) => c.status === "pending").length,
      }));
    },
  });

export const recentActivityQuery = () =>
  queryOptions({
    queryKey: ["activity", "recent", isDemoMode()],
    queryFn: async (): Promise<(Activity & { projects: { name: string } | null })[]> => {
      if (isDemoMode()) {
        const state = loadDemoState();
        return state.activities
          .slice()
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 8)
          .map((a) => ({ ...a, projects: { name: state.projects.find((p) => p.id === a.project_id)?.name ?? "Project" } }));
      }
      return check(await supabase.from("activities").select("*, projects(name)").order("created_at", { ascending: false }).limit(8)) as (Activity & {
        projects: { name: string } | null;
      })[];
    },
  });

export const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["project", id, isDemoMode()],
    queryFn: async (): Promise<ProjectBundle | null> => {
      if (isDemoMode()) {
        const state = loadDemoState();
        const project = state.projects.find((p) => p.id === id);
        if (!project) return null;
        return {
          project,
          scope: state.scope.filter((s) => s.project_id === id).sort((a, b) => a.position - b.position),
          deliverables: state.deliverables.filter((d) => d.project_id === id).sort((a, b) => a.position - b.position),
          revisions: state.revisions.filter((r) => r.project_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
          changes: state.changes.filter((c) => c.project_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
          activity: state.activities.filter((a) => a.project_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
        };
      }
      const [p, s, d, r, c, a] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).maybeSingle(),
        supabase.from("scope_items").select("*").eq("project_id", id).order("position"),
        supabase.from("deliverables").select("*").eq("project_id", id).order("position"),
        supabase.from("revisions").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("change_requests").select("*").eq("project_id", id).order("created_at", { ascending: false }),
        supabase.from("activities").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      ]);
      const project = check(p);
      if (!project) return null;
      return { project, scope: check(s) ?? [], deliverables: check(d) ?? [], revisions: check(r) ?? [], changes: check(c) ?? [], activity: check(a) ?? [] };
    },
  });
export type ProjectBundle = { project: Project; scope: ScopeItem[]; deliverables: Deliverable[]; revisions: Revision[]; changes: ChangeRequest[]; activity: Activity[] };

export async function logActivity(project_id: string, message: string) {
  if (isDemoMode()) {
    const state = loadDemoState();
    state.activities.push({ id: demoId(), project_id, user_id: state.profile.id, message, actor: "you", created_at: new Date().toISOString() });
    saveDemoState(state);
    return;
  }
  const user_id = await currentUserId();
  check(await supabase.from("activities").insert({ project_id, user_id, message, actor: "you" }));
}

export type NewProjectInput = {
  name: string;
  client_name: string;
  client_email?: string | undefined;
  project_type: string;
  budget?: number | undefined;
  currency: string;
  due_date?: string | undefined;
  summary?: string | undefined;
  private_notes?: string | undefined;
  included_revisions: number;
  scope: { title: string; in_scope: boolean }[];
  deliverables: { title: string; description?: string }[];
};

export async function createProject(input: NewProjectInput) {
  const user_id = await currentUserId();
  if (isDemoMode()) {
    const state = loadDemoState();
    const id = demoId();
    const now = new Date().toISOString();
    state.projects.unshift({ ...input, id, user_id, client_email: input.client_email || null, budget: input.budget ?? null, due_date: input.due_date || null, summary: input.summary || null, private_notes: input.private_notes || null, status: "draft", is_sample: false, share_enabled: true, share_token: `${demoId()}${demoId()}`.replaceAll("-", ""), created_at: now, updated_at: now });
    input.scope.forEach((s, position) => state.scope.push({ ...s, id: demoId(), project_id: id, user_id, done: false, position, created_at: now }));
    input.deliverables.forEach((d, position) => state.deliverables.push({ ...d, description: d.description || null, id: demoId(), project_id: id, user_id, status: "pending", position, submitted_at: null, approved_at: null, approved_by: null, created_at: now }));
    saveDemoState(state);
    await logActivity(id, `Created project “${input.name}”`);
    return id;
  }
  const project = check(await supabase.from("projects").insert({
    user_id, name: input.name, client_name: input.client_name, client_email: input.client_email || null, project_type: input.project_type,
    budget: input.budget ?? null, currency: input.currency, due_date: input.due_date || null, summary: input.summary || null,
    private_notes: input.private_notes || null, included_revisions: input.included_revisions, status: "draft",
  }).select("id").single());
  if (!project) throw new Error("The project could not be created. Please try again.");
  if (input.scope.length) check(await supabase.from("scope_items").insert(input.scope.map((s, position) => ({ ...s, project_id: project.id, user_id, position }))));
  if (input.deliverables.length) check(await supabase.from("deliverables").insert(input.deliverables.map((d, position) => ({ ...d, project_id: project.id, user_id, position }))));
  await logActivity(project.id, `Created project “${input.name}”`);
  return project.id;
}

export async function updateProject(id: string, patch: Partial<Project>) {
  if (isDemoMode()) {
    const state = loadDemoState();
    const project = state.projects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found");
    Object.assign(project, patch, { updated_at: new Date().toISOString() });
    saveDemoState(state);
    return;
  }
  check(await supabase.from("projects").update(patch).eq("id", id));
}

export async function deleteProject(id: string) {
  if (isDemoMode()) {
    const state = loadDemoState();
    state.projects = state.projects.filter((p) => p.id !== id);
    for (const key of ["scope", "deliverables", "revisions", "changes", "activities", "intelligence"] as const) {
      state[key] = state[key].filter((row) => row.project_id !== id) as never;
    }
    saveDemoState(state);
    return;
  }
  check(await supabase.from("projects").delete().eq("id", id));
}

export async function addScopeItem(projectId: string, title: string, inScope: boolean) {
  const user_id = await currentUserId();
  if (isDemoMode()) {
    const state = loadDemoState();
    const position = state.scope.filter((s) => s.project_id === projectId).length;
    state.scope.push({ id: demoId(), project_id: projectId, user_id, title, in_scope: inScope, done: false, position, created_at: new Date().toISOString() });
    saveDemoState(state);
    return;
  }
  const { count } = await supabase.from("scope_items").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  check(await supabase.from("scope_items").insert({ project_id: projectId, user_id, title, in_scope: inScope, position: count ?? 0 }));
}

export async function updateScopeItem(id: string, patch: Partial<ScopeItem>) {
  if (isDemoMode()) {
    const state = loadDemoState();
    const item = state.scope.find((s) => s.id === id);
    if (!item) throw new Error("Scope item not found");
    Object.assign(item, patch);
    saveDemoState(state);
    return;
  }
  check(await supabase.from("scope_items").update(patch).eq("id", id));
}

export async function removeScopeItem(id: string) {
  if (isDemoMode()) {
    const state = loadDemoState();
    state.scope = state.scope.filter((s) => s.id !== id);
    saveDemoState(state);
    return;
  }
  check(await supabase.from("scope_items").delete().eq("id", id));
}

export async function addDeliverable(projectId: string, title: string, description?: string) {
  const user_id = await currentUserId();
  if (isDemoMode()) {
    const state = loadDemoState();
    const position = state.deliverables.filter((d) => d.project_id === projectId).length;
    state.deliverables.push({ id: demoId(), project_id: projectId, user_id, title, description: description || null, status: "pending", position, submitted_at: null, approved_at: null, approved_by: null, created_at: new Date().toISOString() });
    saveDemoState(state);
    return;
  }
  const { count } = await supabase.from("deliverables").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  check(await supabase.from("deliverables").insert({ project_id: projectId, user_id, title, description: description || null, position: count ?? 0 }));
}

export async function updateDeliverable(id: string, patch: Partial<Deliverable>) {
  if (isDemoMode()) {
    const state = loadDemoState();
    const item = state.deliverables.find((d) => d.id === id);
    if (!item) throw new Error("Deliverable not found");
    Object.assign(item, patch);
    saveDemoState(state);
    return;
  }
  check(await supabase.from("deliverables").update(patch).eq("id", id));
}

export async function addRevision(projectId: string, deliverableId: string | null, note: string) {
  const user_id = await currentUserId();
  if (isDemoMode()) {
    const state = loadDemoState();
    state.revisions.unshift({ id: demoId(), project_id: projectId, user_id, deliverable_id: deliverableId, note, requested_by: state.profile.display_name || "You", source: "freelancer", created_at: new Date().toISOString() });
    if (deliverableId) {
      const deliverable = state.deliverables.find((d) => d.id === deliverableId);
      if (deliverable) Object.assign(deliverable, { status: "revision_requested", approved_at: null, approved_by: null });
    }
    saveDemoState(state);
  } else {
    check(await supabase.from("revisions").insert({ project_id: projectId, user_id, deliverable_id: deliverableId, note, requested_by: "You", source: "freelancer" }));
    if (deliverableId) check(await supabase.from("deliverables").update({ status: "revision_requested", approved_at: null, approved_by: null }).eq("id", deliverableId));
  }
  await logActivity(projectId, "Logged a revision request");
}

export async function addChangeRequest(projectId: string, input: { description: string; classification: string; extra_fee?: number | undefined; extra_days?: number | undefined }) {
  const user_id = await currentUserId();
  if (isDemoMode()) {
    const state = loadDemoState();
    const now = new Date().toISOString();
    state.changes.unshift({ id: demoId(), project_id: projectId, user_id, ...input, extra_fee: input.extra_fee ?? null, extra_days: input.extra_days ?? null, status: "pending", decided_at: null, created_at: now, updated_at: now });
    saveDemoState(state);
  } else {
    check(await supabase.from("change_requests").insert({ project_id: projectId, user_id, ...input, extra_fee: input.extra_fee ?? null, extra_days: input.extra_days ?? null }));
  }
  await logActivity(projectId, "Logged a change request");
}

export async function decideChangeRequest(id: string, status: "accepted" | "declined") {
  const now = new Date().toISOString();
  if (isDemoMode()) {
    const state = loadDemoState();
    const item = state.changes.find((c) => c.id === id);
    if (!item) throw new Error("Change request not found");
    Object.assign(item, { status, decided_at: now, updated_at: now });
    saveDemoState(state);
    return;
  }
  check(await supabase.from("change_requests").update({ status, decided_at: now, updated_at: now }).eq("id", id));
}

export async function updateProfile(patch: Partial<Profile>) {
  const uid = await currentUserId();
  if (isDemoMode()) {
    const state = loadDemoState();
    Object.assign(state.profile, patch, { updated_at: new Date().toISOString() });
    saveDemoState(state);
    return;
  }
  check(await supabase.from("profiles").update(patch).eq("id", uid));
}

export async function seedSampleProject() {
  if (isDemoMode()) {
    const fresh = loadDemoState();
    if (fresh.projects.some((p) => p.is_sample)) return fresh.projects.find((p) => p.is_sample)!.id;
    const { createDemoState } = await import("@/lib/demo");
    const sample = createDemoState();
    fresh.projects.unshift(...sample.projects);
    fresh.scope.push(...sample.scope);
    fresh.deliverables.push(...sample.deliverables);
    fresh.revisions.push(...sample.revisions);
    fresh.changes.push(...sample.changes);
    fresh.activities.push(...sample.activities);
    saveDemoState(fresh);
    const sampleProject = sample.projects[0];
    if (!sampleProject) throw new Error("The sample project could not be created.");
    return sampleProject.id;
  }
  const { data, error } = await supabase.rpc("seed_sample_project");
  if (error) throw new Error(error.message);
  return data;
}

export type SharedProject = {
  project: { name: string; client_name: string; project_type: string; due_date: string | null; summary: string | null; included_revisions: number; status: string; is_sample: boolean; business_name: string | null };
  scope: { title: string; in_scope: boolean; done: boolean }[];
  deliverables: { id: string; title: string; description: string | null; status: string; approved_at: string | null; approved_by: string | null }[];
  revisions_used: number;
  revisions: { note: string; requested_by: string; created_at: string; deliverable_id: string | null }[];
};

/** Explicit public projection used by demo links; the backend RPC uses the same whitelist. */
export function toSharedProject(bundle: ProjectBundle): SharedProject {
  return {
    project: { name: bundle.project.name, client_name: bundle.project.client_name, project_type: bundle.project.project_type, due_date: bundle.project.due_date, summary: bundle.project.summary, included_revisions: bundle.project.included_revisions, status: bundle.project.status, is_sample: bundle.project.is_sample, business_name: null },
    scope: bundle.scope.map(({ title, in_scope, done }) => ({ title, in_scope, done })),
    deliverables: bundle.deliverables.map(({ id, title, description, status, approved_at, approved_by }) => ({ id, title, description, status, approved_at, approved_by })),
    revisions_used: bundle.revisions.length,
    revisions: bundle.revisions.map(({ note, requested_by, created_at, deliverable_id }) => ({ note, requested_by, created_at, deliverable_id })),
  };
}

export async function getSharedProject(token: string): Promise<SharedProject | null> {
  if (isDemoMode()) {
    const state = loadDemoState();
    const project = state.projects.find((p) => p.share_token === token && p.share_enabled);
    if (!project) return null;
    const shared = toSharedProject({ project, scope: state.scope.filter((s) => s.project_id === project.id), deliverables: state.deliverables.filter((d) => d.project_id === project.id), revisions: state.revisions.filter((r) => r.project_id === project.id), changes: [], activity: [] });
    shared.project.business_name = state.profile.business_name;
    return shared;
  }
  const { data, error } = await supabase.rpc("get_shared_project", { _token: token });
  if (error) throw new Error(error.message);
  return (data as unknown as SharedProject | null) ?? null;
}

export async function clientRespond(token: string, deliverableId: string, action: "approve" | "revise", name: string, comment: string) {
  if (isDemoMode()) {
    const state = loadDemoState();
    const project = state.projects.find((p) => p.share_token === token && p.share_enabled);
    const deliverable = state.deliverables.find((d) => d.id === deliverableId && d.project_id === project?.id);
    if (!project || !deliverable) throw new Error("This review link is no longer valid.");
    if (deliverable.status === "approved") throw new Error("This deliverable is already approved.");
    if (action === "approve") {
      Object.assign(deliverable, { status: "approved", approved_at: new Date().toISOString(), approved_by: name });
      state.activities.push({ id: demoId(), project_id: project.id, user_id: project.user_id, actor: "client", message: `${name} approved “${deliverable.title}”`, created_at: new Date().toISOString() });
    } else {
      state.revisions.unshift({ id: demoId(), project_id: project.id, user_id: project.user_id, deliverable_id: deliverableId, note: comment, requested_by: name, source: "client_portal", created_at: new Date().toISOString() });
      Object.assign(deliverable, { status: "revision_requested", approved_at: null, approved_by: null });
      state.activities.push({ id: demoId(), project_id: project.id, user_id: project.user_id, actor: "client", message: `${name} requested a revision on “${deliverable.title}”`, created_at: new Date().toISOString() });
    }
    saveDemoState(state);
    return;
  }
  const { error } = await supabase.rpc("client_respond", { _token: token, _deliverable_id: deliverableId, _action: action, _name: name, _comment: comment });
  if (error) throw new Error(error.message);
}

export const intelligenceStatesQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["intelligence-states", projectId, isDemoMode()],
    queryFn: async (): Promise<IntelligenceState[]> => {
      if (isDemoMode()) {
        return (loadDemoState().intelligence ?? []).filter((state) => state.project_id === projectId) as IntelligenceState[];
      }
      const rows = check(await supabase.from("project_intelligence_states").select("*").eq("project_id", projectId));
      return (rows ?? []) as IntelligenceState[];
    },
  });

export async function setIntelligenceStatus(projectId: string, insightKey: string, status: InsightStatus) {
  const user_id = await currentUserId();
  if (isDemoMode()) {
    const state = loadDemoState();
    const states = state.intelligence ?? [];
    const existing = states.find((item) => item.project_id === projectId && item.insight_key === insightKey);
    if (status === "active") {
      state.intelligence = states.filter((item) => !(item.project_id === projectId && item.insight_key === insightKey));
    } else if (existing) {
      Object.assign(existing, { status, updated_at: new Date().toISOString() });
    } else {
      const now = new Date().toISOString();
      states.push({ id: demoId(), project_id: projectId, user_id, insight_key: insightKey, status, created_at: now, updated_at: now });
      state.intelligence = states;
    }
    saveDemoState(state);
    return;
  }
  if (status === "active") {
    check(await supabase.from("project_intelligence_states").delete().eq("project_id", projectId).eq("insight_key", insightKey));
    return;
  }
  check(await supabase.from("project_intelligence_states").upsert(
    { project_id: projectId, user_id, insight_key: insightKey, status, updated_at: new Date().toISOString() },
    { onConflict: "project_id,insight_key" },
  ));
}
