import { describe, expect, it } from "vitest";
import type { ProjectBundle } from "@/lib/data";
import { analyzeProject, applyInsightStates, buildClientIntelligenceReport } from "@/lib/intelligence";

const NOW = new Date("2026-11-21T12:00:00.000Z");

function bundle(overrides: Partial<ProjectBundle> = {}): ProjectBundle {
  return {
    project: {
      id: "project-1", user_id: "user-1", name: "Website refresh", client_name: "Client Co", client_email: "private@example.com",
      project_type: "Web design", budget: 5000, currency: "USD", due_date: "2026-12-10", summary: "A five page website.",
      private_notes: "Never export this private note", included_revisions: 2, status: "active", is_sample: false,
      share_enabled: true, share_token: "secret-share-token", created_at: "2026-11-01T00:00:00.000Z", updated_at: "2026-11-20T00:00:00.000Z",
    },
    scope: [
      { id: "scope-1", project_id: "project-1", user_id: "user-1", title: "Five pages", in_scope: true, done: true, position: 0, created_at: "2026-11-01T00:00:00.000Z" },
      { id: "scope-2", project_id: "project-1", user_id: "user-1", title: "Online store", in_scope: false, done: false, position: 1, created_at: "2026-11-01T00:00:00.000Z" },
    ],
    deliverables: [
      { id: "deliverable-1", project_id: "project-1", user_id: "user-1", title: "Design", description: "Five responsive layouts", status: "approved", position: 0, submitted_at: "2026-11-10T00:00:00.000Z", approved_at: "2026-11-12T00:00:00.000Z", approved_by: "Client", created_at: "2026-11-01T00:00:00.000Z" },
    ],
    revisions: [], changes: [], activity: [], ...overrides,
  };
}

function insight(data: ProjectBundle, id: string) {
  return analyzeProject(data, NOW).insights.find((item) => item.id === id);
}

describe("Project Intelligence deterministic rules", () => {
  it("flags missing scope and deliverables without inventing content for an empty project", () => {
    const analysis = analyzeProject(bundle({ scope: [], deliverables: [], project: { ...bundle().project, summary: null, due_date: null } }), NOW);

    expect(insight(bundle({ scope: [], deliverables: [] }), "scope:no-items")?.severity).toBe("high");
    expect(analysis.deliverableGaps.missing).toBe(true);
    expect(analysis.insights.map((item) => item.id)).toEqual(expect.arrayContaining(["scope:no-items", "deliverables:none", "requirements:missing-summary", "deadline:missing"]));
  });

  it("flags a high revision risk only after the included allowance is exceeded", () => {
    const base = bundle();
    const revisions = [1, 2, 3].map((number) => ({ id: `revision-${number}`, project_id: "project-1", user_id: "user-1", deliverable_id: "deliverable-1", note: `Request ${number}`, requested_by: "Client", source: "client_portal", created_at: `2026-11-${10 + number}T00:00:00.000Z` }));

    expect(analyzeProject({ ...base, revisions: revisions.slice(0, 2) }, NOW).insights.find((item) => item.id === "revisions:allowance-exhausted")?.severity).toBe("medium");
    const over = analyzeProject({ ...base, revisions }, NOW);
    expect(over.revisions.over).toBe(1);
    expect(over.insights.find((item) => item.id === "revisions:over-allowance")?.severity).toBe("high");
  });

  it("uses three and seven day thresholds for approval follow-up risk", () => {
    const base = bundle();
    const awaiting = { ...base.deliverables[0]!, status: "submitted", approved_at: null, approved_by: null };
    const atThreeDays = analyzeProject({ ...base, deliverables: [{ ...awaiting, submitted_at: "2026-11-18T12:00:00.000Z" }] }, NOW);
    const atSevenDays = analyzeProject({ ...base, deliverables: [{ ...awaiting, submitted_at: "2026-11-14T12:00:00.000Z" }] }, NOW);

    expect(atThreeDays.insights.find((item) => item.id === "approval:deliverable-1:delayed")?.severity).toBe("medium");
    expect(atSevenDays.insights.find((item) => item.id === "approval:deliverable-1:delayed")?.severity).toBe("high");
  });

  it("flags overdue incomplete work but not a completed project", () => {
    const base = bundle();
    const overdueProject = { ...base.project, due_date: "2026-11-20" };
    const overdue = analyzeProject({ ...base, project: overdueProject, scope: [{ ...base.scope[0]!, done: false }], deliverables: [{ ...base.deliverables[0]!, status: "pending", approved_at: null, approved_by: null }] }, NOW);
    const completed = analyzeProject({ ...base, project: { ...overdueProject, status: "completed" } }, NOW);

    expect(overdue.insights.find((item) => item.id === "deadline:overdue")?.reason).toContain("1 deliverable is not approved");
    expect(completed.insights.some((item) => item.id === "deadline:overdue")).toBe(false);
  });

  it("identifies pending out-of-scope requests and accepted extras without adjusted terms", () => {
    const base = bundle();
    const change = { id: "change-1", project_id: "project-1", user_id: "user-1", description: "Add booking", classification: "out_of_scope", extra_fee: null, extra_days: null, status: "pending", decided_at: null, created_at: "2026-11-20T00:00:00.000Z", updated_at: "2026-11-20T00:00:00.000Z" };

    expect(insight({ ...base, changes: [change] }, "change:change-1:pending-out-of-scope")?.severity).toBe("high");
    expect(insight({ ...base, changes: [{ ...change, status: "accepted" }] }, "change:change-1:accepted-without-terms")?.clientSafe).toBe(false);
  });

  it("removes resolved and dismissed findings from the active risk score and supports restoration", () => {
    const analysis = analyzeProject(bundle({ scope: [], deliverables: [] }), NOW);
    const allResolved = applyInsightStates(analysis, analysis.insights.map((item, index) => ({ id: `state-${index}`, project_id: "project-1", user_id: "user-1", insight_key: item.id, status: index % 2 ? "dismissed" as const : "resolved" as const, created_at: NOW.toISOString(), updated_at: NOW.toISOString() })));

    expect(allResolved.active).toHaveLength(0);
    expect(allResolved.riskScore).toBe(0);
    expect(allResolved.overallRisk).toBe("low");
    expect(applyInsightStates(analysis, []).active).toHaveLength(analysis.insights.length);
  });

  it("builds the client report from an explicit projection with no private fields", () => {
    const data = bundle();
    const analysis = applyInsightStates(analyzeProject(data, NOW), []);
    const report = buildClientIntelligenceReport(data, analysis);
    const serialized = JSON.stringify(report);

    expect(serialized).not.toContain("private@example.com");
    expect(serialized).not.toContain("Never export this private note");
    expect(serialized).not.toContain("5000");
    expect(serialized).not.toContain("secret-share-token");
    expect(report.findings.every((finding) => !("clientSafe" in finding))).toBe(true);
  });
});
