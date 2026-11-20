import type { Database } from "@/integrations/supabase/types";

type Row<N extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][N]["Row"];

export const DEMO_KEY = "revisionshield.demo.v1";
export const DEMO_MODE_KEY = "revisionshield.demo-mode";

export type DemoState = {
  profile: Row<"profiles">;
  projects: Row<"projects">[];
  scope: Row<"scope_items">[];
  deliverables: Row<"deliverables">[];
  revisions: Row<"revisions">[];
  changes: Row<"change_requests">[];
  activities: Row<"activities">[];
};

const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const iso = (days = 0) => new Date(Date.now() + days * 86_400_000).toISOString();

export function createDemoState(): DemoState {
  const userId = "00000000-0000-4000-8000-000000000001";
  const projectId = "00000000-0000-4000-8000-000000000101";
  const d1 = "00000000-0000-4000-8000-000000000201";
  const d2 = "00000000-0000-4000-8000-000000000202";
  const d3 = "00000000-0000-4000-8000-000000000203";
  const project: Row<"projects"> = {
    id: projectId,
    user_id: userId,
    name: "Brightleaf Bakery website refresh",
    client_name: "Brightleaf Bakery",
    client_email: "owner@example.com",
    project_type: "Web design",
    budget: 2400,
    currency: "USD",
    due_date: iso(18).slice(0, 10),
    summary: "Redesign of a five-page marketing website: Home, Menu, About, Catering and Contact. Includes responsive layouts, client-supplied copy integration and design-file handover.",
    private_notes: "Demo private note: possible online ordering add-on later — quote separately.",
    included_revisions: 2,
    status: "active",
    is_sample: true,
    share_enabled: true,
    share_token: "demo-brightleaf-bakery-review-link-2026",
    created_at: iso(-8),
    updated_at: iso(-1),
  };
  const scopeTitles = [
    ["Design five page layouts", true, true],
    ["Responsive mobile and tablet versions", true, true],
    ["Integrate client-supplied copy and photos", true, false],
    ["One design handover with source files", true, false],
    ["Online ordering or payment setup", false, false],
    ["Ongoing content updates after launch", false, false],
  ] as const;
  return {
    profile: { id: userId, business_name: "Northstar Studio (demo)", display_name: "Demo freelancer", default_currency: "USD", default_revisions: 2, timezone: "UTC", onboarded: true, created_at: iso(-30), updated_at: iso(-1) },
    projects: [project],
    scope: scopeTitles.map(([title, in_scope, done], position) => ({ id: uid(), project_id: projectId, user_id: userId, title, in_scope, done, position, created_at: iso(-8) })),
    deliverables: [
      { id: d1, project_id: projectId, user_id: userId, title: "Homepage design", description: "Desktop and mobile homepage layouts.", status: "approved", position: 0, submitted_at: iso(-4), approved_at: iso(-3), approved_by: "Maya (sample client)", created_at: iso(-8) },
      { id: d2, project_id: projectId, user_id: userId, title: "Inner page designs", description: "Menu, About, Catering and Contact layouts.", status: "submitted", position: 1, submitted_at: iso(-1), approved_at: null, approved_by: null, created_at: iso(-8) },
      { id: d3, project_id: projectId, user_id: userId, title: "Final design handover", description: "Source files and exported assets.", status: "pending", position: 2, submitted_at: null, approved_at: null, approved_by: null, created_at: iso(-8) },
    ],
    revisions: [{ id: uid(), project_id: projectId, user_id: userId, deliverable_id: d1, note: "Make the catering call-to-action more prominent on mobile.", requested_by: "Maya (sample client)", source: "client_portal", created_at: iso(-4) }],
    changes: [{ id: uid(), project_id: projectId, user_id: userId, description: "Add a downloadable seasonal catering menu.", classification: "out_of_scope", extra_fee: 120, extra_days: 1, status: "accepted", decided_at: iso(-2), created_at: iso(-3), updated_at: iso(-2) }],
    activities: [
      { id: uid(), project_id: projectId, user_id: userId, actor: "client", message: "Maya approved Homepage design", created_at: iso(-3) },
      { id: uid(), project_id: projectId, user_id: userId, actor: "you", message: "Submitted Inner page designs for review", created_at: iso(-1) },
    ],
  };
}

export function isDemoMode() {
  return typeof window !== "undefined" && window.localStorage.getItem(DEMO_MODE_KEY) === "true";
}

export function setDemoMode(enabled: boolean) {
  window.localStorage.setItem(DEMO_MODE_KEY, String(enabled));
  if (enabled && !window.localStorage.getItem(DEMO_KEY)) saveDemoState(createDemoState());
  window.dispatchEvent(new Event("revisionshield-demo-change"));
}

export function loadDemoState(): DemoState {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    // A corrupt demo should recover rather than block the product tour.
  }
  const state = createDemoState();
  saveDemoState(state);
  return state;
}

export function saveDemoState(state: DemoState) {
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(state));
}

export function resetDemoState() {
  const state = createDemoState();
  saveDemoState(state);
  return state;
}

export function demoId() {
  return uid();
}
