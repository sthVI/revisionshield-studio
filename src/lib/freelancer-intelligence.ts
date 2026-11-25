export type OpportunityStage = "saved" | "reviewing" | "proposal" | "submitted" | "won" | "lost";

export type FreelancerProfileInput = {
  name: string;
  service: string;
  skills: string;
  portfolio: string;
  availability: string;
};

export type OpportunityInput = {
  title: string;
  buyer: string;
  budget: string;
  deadline: string;
  brief: string;
  evidence: string;
  assumptions: string;
  risks: string;
};

export type OpportunityScore = {
  skills: number;
  budget: number;
  clarity: number;
  buyer: number;
  competition: number;
  time: number;
};

export type AssessmentFactor = {
  key: keyof OpportunityScore;
  label: string;
  score: number;
  max: number;
  explanation: string;
  confidence: "measured" | "partial" | "unknown";
};

export type BuyerSignal = {
  phrase: string;
  level: "review" | "caution";
  explanation: string;
};

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "can", "for", "from", "have", "into", "its",
  "need", "our", "that", "the", "their", "then", "this", "with", "will", "your", "you",
  "work", "project", "client", "website", "using", "would", "should", "must",
]);

function words(value: string): string[] {
  return [...new Set((value.toLowerCase().match(/[a-z0-9+#.]{2,}/g) ?? []).filter((word) => !STOP_WORDS.has(word)))];
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(value)));
}

export function assessOpportunity(
  opportunity: OpportunityInput,
  profile: FreelancerProfileInput,
  today = new Date(),
): { score: OpportunityScore; total: number; factors: AssessmentFactor[]; matchedSkills: string[]; signals: BuyerSignal[] } {
  const skillTerms = words([profile.service, profile.skills].join(" "));
  const briefTerms = new Set(words(opportunity.brief));
  const matchedSkills = skillTerms.filter((term) => briefTerms.has(term));
  const skills = skillTerms.length ? clamp((matchedSkills.length / skillTerms.length) * 30, 30) : 0;

  const budget = opportunity.budget.trim() ? 12 : 0;
  const briefWords = words(opportunity.brief).length;
  const hasDeliverable = /deliverable|pages?|screens?|features?|logo|design|dashboard|integration|content|report|prototype|website|app/i.test(opportunity.brief);
  const clarity = clamp((briefWords >= 35 ? 7 : briefWords >= 15 ? 4 : 1) + (hasDeliverable ? 5 : 0) + (opportunity.deadline ? 3 : 0), 15);

  const buyer = opportunity.evidence.trim().length >= 40 ? 10 : opportunity.evidence.trim() ? 7 : 5;
  const competition = 5;
  let time = 5;
  if (opportunity.deadline) {
    const due = new Date(`${opportunity.deadline}T23:59:59`);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
    time = days < 0 ? 0 : days <= 2 ? 3 : days <= 6 ? 6 : 9;
  }

  const score: OpportunityScore = { skills, budget, clarity, buyer, competition, time };
  const factors: AssessmentFactor[] = [
    { key: "skills", label: "Skills match", score: skills, max: 30, explanation: matchedSkills.length ? `Matched profile terms: ${matchedSkills.join(", ")}.` : "No clear skill overlap was found in the brief; review this manually.", confidence: skillTerms.length && briefTerms.size ? "partial" : "unknown" },
    { key: "budget", label: "Budget information", score: budget, max: 20, explanation: budget ? "A budget was provided. This checks transparency only, not whether the amount is fair." : "No budget was recorded, so affordability cannot be assessed.", confidence: budget ? "partial" : "unknown" },
    { key: "clarity", label: "Scope clarity", score: clarity, max: 15, explanation: `${briefWords} meaningful brief terms and ${hasDeliverable ? "a deliverable signal" : "no clear deliverable signal"} were found.`, confidence: briefWords >= 15 ? "partial" : "unknown" },
    { key: "buyer", label: "Buyer evidence notes", score: buyer, max: 15, explanation: opportunity.evidence.trim() ? "Based only on the evidence notes you entered; the buyer has not been independently verified." : "No buyer evidence notes recorded. This is a neutral placeholder, not a credibility verdict.", confidence: "partial" },
    { key: "competition", label: "Competition", score: competition, max: 10, explanation: "No competitor or applicant data was supplied; a neutral placeholder is used.", confidence: "unknown" },
    { key: "time", label: "Deadline proximity", score: time, max: 10, explanation: opportunity.deadline ? "Based on the date entered only; your workload and availability are not known." : "No deadline recorded; a neutral placeholder is used.", confidence: opportunity.deadline ? "partial" : "unknown" },
  ];

  const source = [opportunity.brief, opportunity.risks].join(" ").toLowerCase();
  const patterns: { pattern: RegExp; phrase: string; level: BuyerSignal["level"]; explanation: string }[] = [
    { pattern: /unpaid (test|sample|trial)|free (test|sample|trial)/i, phrase: "Unpaid sample or test", level: "caution", explanation: "Clarify whether any sample work is required and keep speculative work limited." },
    { pattern: /pay to apply|application fee|upfront fee/i, phrase: "Fee to apply", level: "caution", explanation: "Verify any requested fee independently before proceeding." },
    { pattern: /gift card|crypto(?:currency)? payment/i, phrase: "Unusual payment method", level: "caution", explanation: "Confirm that payment terms are legitimate and supported by the platform." },
    { pattern: /unlimited revisions/i, phrase: "Unlimited revisions", level: "review", explanation: "Agree on a defined revision allowance and change-request process." },
    { pattern: /work first|start immediately.{0,30}payment|payment after completion only/i, phrase: "Payment timing needs clarification", level: "review", explanation: "Clarify milestones, acceptance criteria and payment timing before committing." },
    { pattern: /no budget|budget to be discussed/i, phrase: "Budget not specified", level: "review", explanation: "Ask for a budget range before estimating the work." },
  ];
  const signals = patterns.filter((item) => item.pattern.test(source)).map(({ phrase, level, explanation }) => ({ phrase, level, explanation }));

  return { score, total: Object.values(score).reduce((sum, value) => sum + value, 0), factors, matchedSkills, signals };
}

export function getProposalReadiness(opportunity: OpportunityInput, profile: FreelancerProfileInput) {
  return [
    { label: "Relevant skills are listed", ready: Boolean(profile.skills.trim() || profile.service.trim()), action: "Add the skills or service that directly relate to this brief." },
    { label: "Brief has enough detail", ready: words(opportunity.brief).length >= 15, action: "Summarise the requested outcome, deliverables and constraints." },
    { label: "Buyer or client is identified", ready: Boolean(opportunity.buyer.trim()), action: "Add the buyer name if it is publicly available." },
    { label: "Budget is recorded", ready: Boolean(opportunity.budget.trim()), action: "Ask for a budget range if none is listed." },
    { label: "Deadline is recorded", ready: Boolean(opportunity.deadline), action: "Confirm the expected delivery date before committing." },
    { label: "Portfolio link is available", ready: /^https?:\/\//i.test(profile.portfolio.trim()), action: "Add a relevant portfolio link, if you have one." },
  ];
}

export function getGrowthInsights(stages: OpportunityStage[]) {
  const won = stages.filter((stage) => stage === "won").length;
  const lost = stages.filter((stage) => stage === "lost").length;
  const active = stages.filter((stage) => !["won", "lost"].includes(stage)).length;
  const closed = won + lost;
  const winRate = closed ? Math.round((won / closed) * 100) : null;
  const suggestions: string[] = [];

  if (closed < 3) suggestions.push("Track a few more completed outcomes before drawing conclusions about your win rate.");
  else if (winRate !== null && winRate < 25) suggestions.push("Review whether the opportunities you pursue match your strongest skills, and compare proposal outcomes.");
  else if (winRate !== null && winRate >= 50) suggestions.push("Review the characteristics of successful projects and look for similar, well-scoped opportunities.");
  if (active >= 5) suggestions.push("You have several active opportunities. Set a follow-up date for each one you still want to pursue.");
  if (!suggestions.length) suggestions.push("Keep recording outcomes and lessons so future recommendations are based on your own history.");

  return { won, lost, active, closed, winRate, suggestions };
}
