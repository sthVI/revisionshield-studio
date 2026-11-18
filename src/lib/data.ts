import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async () => {
      const uid = await currentUserId();
      return check(await supabase.from("profiles").select("*").eq("id", uid).maybeSingle());
    },
  });

export type ProjectSummary = Project & { revisions_used: number; deliverables: Pick<Deliverable, "status">[]; pending_crs: number };

export const projectsQuery = () =>
  queryOptions({
    queryKey: ["projects"],
    queryFn: async (): Promise<ProjectSummary[]> => {
      const rows = check(
        await supabase
          .from("projects")
          .select("*, revisions(count), deliverables(status), change_requests(status)")
          .order("created_at", { ascending: false }),
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
    queryKey: ["activity", "recent"],
    queryFn: async () =>
      check(await supabase.from("activities").select("*, projects(name)").order("created_at", { ascending: false }).limit(8)) as (Activity & {
        projects: { name: string } | null;
      })[],
  });

export const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["project", id],
    queryFn: async () => {
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
      return { project, scope: check(s), deliverables: check(d), revisions: check(r), changes: check(c), activity: check(a) };
    },
  });
export type ProjectBundle = NonNullable<Awaited<ReturnType<NonNullable<ReturnType<typeof projectQuery>["queryFn"]>>>>;

export async function logActivity(project_id: string, message: string) {
  const user_id = await currentUserId();
  await supabase.from("activities").insert({ project_id, user_id, message, actor: "you" });
}

export type SharedProject = {
  project: { name: string; client_name: string; project_type: string; due_date: string | null; summary: string | null; included_revisions: number; status: string; is_sample: boolean; business_name: string | null };
  scope: { title: string; in_scope: boolean; done: boolean }[];
  deliverables: { id: string; title: string; description: string | null; status: string; approved_at: string | null; approved_by: string | null }[];
  revisions_used: number;
  revisions: { note: string; requested_by: string; created_at: string; deliverable_id: string | null }[];
};
