import { describe, expect, it } from "vitest";
import { assessOpportunity, getGrowthInsights, getProposalReadiness } from "@/lib/freelancer-intelligence";

const profile = {
  name: "Alex",
  service: "Website design",
  skills: "HTML, CSS, JavaScript, responsive design",
  portfolio: "https://example.com",
  availability: "Open to work",
};

const opportunity = {
  title: "Small business website",
  buyer: "Studio Co",
  budget: "$300",
  deadline: "2026-12-10",
  brief: "Build a responsive website with a homepage, contact form, and three service pages. Include mobile layouts and basic accessibility.",
  evidence: "Buyer has a public company profile and a detailed brief with example references.",
  assumptions: "",
  risks: "",
};

describe("Freelancer Intelligence heuristics", () => {
  it("matches profile skills to terms in the opportunity brief", () => {
    const result = assessOpportunity(opportunity, profile, new Date("2026-11-25T12:00:00"));
    expect(result.matchedSkills).toContain("responsive");
    expect(result.score.skills).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("does not claim that a listed budget is fair or adequate", () => {
    const result = assessOpportunity(opportunity, profile);
    const budget = result.factors.find((factor) => factor.key === "budget");
    expect(budget?.explanation).toContain("not whether the amount is fair");
    expect(budget?.confidence).toBe("partial");
  });

  it("uses neutral placeholders when competition and deadline data are missing", () => {
    const result = assessOpportunity({ ...opportunity, deadline: "", budget: "" }, { ...profile, skills: "" });
    expect(result.score.competition).toBe(5);
    expect(result.score.time).toBe(5);
    expect(result.score.skills).toBe(0);
    expect(result.factors.find((factor) => factor.key === "competition")?.confidence).toBe("unknown");
  });

  it("detects explicit brief phrases as review signals without labelling the buyer fraudulent", () => {
    const result = assessOpportunity({ ...opportunity, brief: "We need a free test and unlimited revisions before agreeing the budget." }, profile);
    expect(result.signals.map((signal) => signal.phrase)).toEqual(expect.arrayContaining(["Unpaid sample or test", "Unlimited revisions", "Budget not specified"]));
    expect(result.signals.some((signal) => /fraud|scam|fake/i.test(signal.explanation))).toBe(false);
  });

  it("reports proposal preparation gaps without inventing qualifications", () => {
    const readiness = getProposalReadiness({ ...opportunity, brief: "", buyer: "", budget: "", deadline: "" }, { ...profile, skills: "", service: "", portfolio: "" });
    expect(readiness.filter((item) => !item.ready).length).toBe(6);
  });

  it("calculates growth insights only from manually closed outcomes", () => {
    expect(getGrowthInsights(["won", "lost", "saved"]).winRate).toBe(50);
    expect(getGrowthInsights(["won", "saved"]).winRate).toBeNull();
    expect(getGrowthInsights(["won", "lost", "lost", "lost"]).suggestions.join(" ")).toContain("Review whether");
  });
});
