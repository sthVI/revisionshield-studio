import type { Deliverable, ProjectBundle } from "@/lib/data";

export type RiskLevel = "low" | "medium" | "high";
export type InsightCategory = "scope" | "requirements" | "deliverables" | "revisions" | "changes" | "approval" | "deadline";
export type InsightStatus = "active" | "resolved" | "dismissed";

export type IntelligenceInsight = {
  id: string;
  category: InsightCategory;
  severity: RiskLevel;
  title: string;
  reason: string;
  recommendation: string;
  clientSafe: boolean;
};

export type IntelligenceState = {
  id: string;
  project_id: string;
  user_id: string;
  insight_key: string;
  status: Exclude<InsightStatus, "active">;
  created_at: string;
  updated_at: string;
};

export type DeliverableGaps = {
  missing: boolean;
  incomplete: Deliverable[];
  awaiting: Deliverable[];
  completed: Deliverable[];
};

export type ProjectAnalysis = {
  insights: IntelligenceInsight[];
  deliverableGaps: DeliverableGaps;
  scope: { included: number; excluded: number; completed: number; remaining: number };
  revisions: { used: number; included: number; over: number };
  riskScore: number;
  overallRisk: RiskLevel;
};

const SEVERITY_WEIGHT: Record<RiskLevel, number> = { low: 5, medium: 15, high: 30 };
const SEVERITY_ORDER: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };
const DAY = 86_400_000;

function dayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY);
}

function dueDays(dueDate: string, now: Date) {
  const parsed = new Date(`${dueDate}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : dayNumber(parsed) - dayNumber(now);
}

function ageDays(timestamp: string, now: Date) {
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : Math.floor((now.getTime() - parsed.getTime()) / DAY);
}

function riskFor(insights: IntelligenceInsight[]) {
  const riskScore = Math.min(100, insights.reduce((total, insight) => total + SEVERITY_WEIGHT[insight.severity], 0));
  const highest = insights.reduce<RiskLevel>((level, insight) => SEVERITY_ORDER[insight.severity] > SEVERITY_ORDER[level] ? insight.severity : level, "low");
  return { riskScore, overallRisk: highest };
}

/**
 * Deterministic project triage. Every finding is derived from stored fields;
 * no text generation, external request, or inferred client intent is involved.
 */
export function analyzeProject(data: ProjectBundle, now = new Date()): ProjectAnalysis {
  const { project, scope, deliverables, revisions, changes } = data;
  const insights: IntelligenceInsight[] = [];
  const includedScope = scope.filter((item) => item.in_scope);
  const excludedScope = scope.filter((item) => !item.in_scope);
  const completedScope = includedScope.filter((item) => item.done);
  const approved = deliverables.filter((item) => item.status === "approved");
  const awaiting = deliverables.filter((item) => item.status === "submitted");
  const incomplete = deliverables.filter((item) => item.status !== "approved" && item.status !== "submitted");
  const revisionOverage = Math.max(0, revisions.length - project.included_revisions);
  const workRemaining = approved.length < deliverables.length || completedScope.length < includedScope.length;

  if (!scope.length) {
    insights.push({
      id: "scope:no-items", category: "scope", severity: "high",
      title: "No scope checklist recorded",
      reason: "This project has no included or excluded scope items to compare client requests against.",
      recommendation: "Add the agreed inclusions and explicit exclusions before treating new requests as covered.",
      clientSafe: true,
    });
  } else {
    if (!includedScope.length) {
      insights.push({
        id: "scope:no-inclusions", category: "scope", severity: "high",
        title: "No included work is defined",
        reason: `All ${scope.length} recorded scope item${scope.length === 1 ? " is" : "s are"} marked out of scope.`,
        recommendation: "Record the deliverable work that the agreed price and timeline include.",
        clientSafe: true,
      });
    }
    if (!excludedScope.length) {
      insights.push({
        id: "scope:no-exclusions", category: "scope", severity: "low",
        title: "No explicit exclusions recorded",
        reason: "The checklist records included work but does not state what is outside the engagement.",
        recommendation: "Add likely exclusions so future requests can be discussed against a written boundary.",
        clientSafe: true,
      });
    }
  }

  if (!project.summary?.trim()) {
    insights.push({
      id: "requirements:missing-summary", category: "requirements", severity: "medium",
      title: "Brief summary is missing",
      reason: "There is no stored brief summary to clarify the intended outcome behind the checklist.",
      recommendation: "Add a concise summary of the client’s requested outcome and constraints.",
      clientSafe: false,
    });
  }

  if (!deliverables.length) {
    insights.push({
      id: "deliverables:none", category: "deliverables", severity: "high",
      title: "No reviewable deliverables recorded",
      reason: "The project has no deliverable records, so completion and client approval cannot be tracked.",
      recommendation: "Add each concrete output the client will review and approve.",
      clientSafe: true,
    });
  } else {
    const unclear = deliverables.filter((item) => !item.description?.trim());
    if (unclear.length) {
      insights.push({
        id: "deliverables:missing-descriptions", category: "requirements", severity: "low",
        title: `${unclear.length} deliverable${unclear.length === 1 ? "" : "s"} need clearer acceptance detail`,
        reason: `${unclear.map((item) => `“${item.title}”`).join(", ")} ${unclear.length === 1 ? "has" : "have"} no description recorded.`,
        recommendation: "Describe what each deliverable includes so review and approval have a clear basis.",
        clientSafe: true,
      });
    }
  }

  if (revisionOverage > 0) {
    insights.push({
      id: "revisions:over-allowance", category: "revisions", severity: "high",
      title: "Revision allowance exceeded",
      reason: `${revisions.length} requests are logged against an allowance of ${project.included_revisions}; ${revisionOverage} ${revisionOverage === 1 ? "is" : "are"} over the limit.`,
      recommendation: "Pause additional revision work and agree whether further requests need a change request.",
      clientSafe: true,
    });
  } else if (project.included_revisions > 0 && revisions.length === project.included_revisions) {
    insights.push({
      id: "revisions:allowance-exhausted", category: "revisions", severity: "medium",
      title: "Revision allowance fully used",
      reason: `All ${project.included_revisions} included revision round${project.included_revisions === 1 ? " is" : "s are"} logged.`,
      recommendation: "Confirm how the next request will be handled before starting another revision round.",
      clientSafe: true,
    });
  }

  const unlinkedRevisions = revisions.filter((revision) => !revision.deliverable_id);
  if (unlinkedRevisions.length) {
    insights.push({
      id: "revisions:unlinked", category: "revisions", severity: "low",
      title: "Some revisions are not linked to a deliverable",
      reason: `${unlinkedRevisions.length} revision request${unlinkedRevisions.length === 1 ? " is" : "s are"} recorded as general project revisions.`,
      recommendation: "Review whether these requests belong to a specific deliverable for a clearer approval trail.",
      clientSafe: false,
    });
  }

  for (const change of changes) {
    if (change.status === "pending" && change.classification === "unclassified") {
      insights.push({
        id: `change:${change.id}:unclassified`, category: "changes", severity: "medium",
        title: "A pending request has no scope classification",
        reason: `“${change.description}” is still pending and unclassified.`,
        recommendation: "Classify the request as in scope or out of scope before beginning the work.",
        clientSafe: true,
      });
    }
    if (change.status === "pending" && change.classification === "out_of_scope") {
      insights.push({
        id: `change:${change.id}:pending-out-of-scope`, category: "changes", severity: "high",
        title: "Out-of-scope work is awaiting a decision",
        reason: `“${change.description}” is marked out of scope and remains pending.`,
        recommendation: "Get an accept or decline decision before starting this additional work.",
        clientSafe: true,
      });
    }
    if (change.status === "accepted" && change.classification === "out_of_scope" && change.extra_fee == null && change.extra_days == null) {
      insights.push({
        id: `change:${change.id}:accepted-without-terms`, category: "changes", severity: "medium",
        title: "Accepted extra work has no adjusted terms",
        reason: `“${change.description}” was accepted as out of scope, but no extra fee or extra days are recorded.`,
        recommendation: "Confirm whether the acceptance intentionally leaves price and timing unchanged, then record any adjustment.",
        clientSafe: false,
      });
    }
  }

  if (project.status !== "completed") {
    if (!project.due_date) {
      insights.push({
        id: "deadline:missing", category: "deadline", severity: "medium",
        title: "No deadline recorded",
        reason: "The project has no due date, so deadline exposure cannot be assessed.",
        recommendation: "Record the agreed due date or confirm that the project intentionally has no fixed deadline.",
        clientSafe: true,
      });
    } else {
      const days = dueDays(project.due_date, now);
      if (days !== null && days < 0 && workRemaining) {
        insights.push({
          id: "deadline:overdue", category: "deadline", severity: "high",
          title: "Deadline passed with work incomplete",
          reason: `The due date was ${project.due_date}; ${deliverables.length - approved.length} deliverable${deliverables.length - approved.length === 1 ? " is" : "s are"} not approved and ${includedScope.length - completedScope.length} included scope item${includedScope.length - completedScope.length === 1 ? " is" : "s are"} incomplete.`,
          recommendation: "Agree a revised completion plan and prioritize the remaining approval or scope items.",
          clientSafe: true,
        });
      } else if (days !== null && days >= 0 && days <= 3 && workRemaining) {
        insights.push({
          id: "deadline:approaching", category: "deadline", severity: "medium",
          title: "Deadline is near with work remaining",
          reason: `The project is due in ${days} day${days === 1 ? "" : "s"} with ${deliverables.length - approved.length} deliverable${deliverables.length - approved.length === 1 ? "" : "s"} not yet approved.`,
          recommendation: "Confirm the remaining owners and approval timing for the open deliverables.",
          clientSafe: true,
        });
      }
    }
  }

  for (const deliverable of awaiting) {
    if (!deliverable.submitted_at) {
      insights.push({
        id: `approval:${deliverable.id}:date-missing`, category: "approval", severity: "low",
        title: `Approval wait cannot be measured for “${deliverable.title}”`,
        reason: "The deliverable is awaiting client approval but has no submission date recorded.",
        recommendation: "Record when it was sent so follow-up timing can be tracked.",
        clientSafe: false,
      });
      continue;
    }
    const waitingDays = ageDays(deliverable.submitted_at, now);
    if (waitingDays !== null && waitingDays >= 3) {
      const severity: RiskLevel = waitingDays >= 7 ? "high" : "medium";
      insights.push({
        id: `approval:${deliverable.id}:delayed`, category: "approval", severity,
        title: `Client approval is pending for “${deliverable.title}”`,
        reason: `The deliverable was submitted ${waitingDays} day${waitingDays === 1 ? "" : "s"} ago and is still awaiting approval.`,
        recommendation: "Follow up with the client and confirm a specific review date or any blocking feedback.",
        clientSafe: true,
      });
    }
  }

  return {
    insights: insights.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || a.title.localeCompare(b.title)),
    deliverableGaps: { missing: deliverables.length === 0, incomplete, awaiting, completed: approved },
    scope: { included: includedScope.length, excluded: excludedScope.length, completed: completedScope.length, remaining: includedScope.length - completedScope.length },
    revisions: { used: revisions.length, included: project.included_revisions, over: revisionOverage },
    ...riskFor(insights),
  };
}

export function applyInsightStates(analysis: ProjectAnalysis, states: IntelligenceState[]) {
  const stateMap = new Map(states.map((state) => [state.insight_key, state.status]));
  const items = analysis.insights.map((insight) => ({ ...insight, status: stateMap.get(insight.id) ?? "active" as InsightStatus }));
  const active = items.filter((item) => item.status === "active");
  return { ...analysis, ...riskFor(active), items, active, resolved: items.filter((item) => item.status === "resolved"), dismissed: items.filter((item) => item.status === "dismissed") };
}

export type StatefulAnalysis = ReturnType<typeof applyInsightStates>;
export type StatefulInsight = StatefulAnalysis["items"][number];

/** Explicit client-safe projection: private notes, budget, email and internal-only findings never enter it. */
export function buildClientIntelligenceReport(data: ProjectBundle, analysis: StatefulAnalysis) {
  const findings = analysis.active.filter((insight) => insight.clientSafe).slice(0, 6);
  return {
    project: { name: data.project.name, client_name: data.project.client_name, due_date: data.project.due_date, status: data.project.status },
    scope: analysis.scope,
    revisions: analysis.revisions,
    deliverables: {
      total: data.deliverables.length,
      completed: analysis.deliverableGaps.completed.map(({ id, title, approved_at, approved_by }) => ({ id, title, approved_at, approved_by })),
      awaiting: analysis.deliverableGaps.awaiting.map(({ id, title }) => ({ id, title })),
      incomplete: analysis.deliverableGaps.incomplete.map(({ id, title, status }) => ({ id, title, status })),
      missing: analysis.deliverableGaps.missing,
    },
    ...riskFor(findings),
    findings: findings.map(({ id, severity, title, reason, recommendation }) => ({ id, severity, title, reason, recommendation })),
  };
}
