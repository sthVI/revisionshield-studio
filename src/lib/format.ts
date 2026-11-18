import { format, formatDistanceToNow, differenceInCalendarDays, parseISO } from "date-fns";

export function money(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
export const fmtDate = (d?: string | null) => (d ? format(d.length === 10 ? parseISO(d) : new Date(d), "MMM d, yyyy") : "—");
export const fmtDateTime = (d?: string | null, tz?: string) => {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: tz || undefined }).format(new Date(d));
  } catch {
    return format(new Date(d), "MMM d, yyyy HH:mm");
  }
};
export const ago = (d: string) => formatDistanceToNow(new Date(d), { addSuffix: true });
export const daysUntil = (d?: string | null) => (d ? differenceInCalendarDays(parseISO(d), new Date()) : null);

/** Revision usage: how many of the included rounds are used, and how many are over the allowance. */
export function revisionUsage(used: number, included: number) {
  const over = Math.max(0, used - included);
  const remaining = Math.max(0, included - used);
  const pct = included === 0 ? (used > 0 ? 100 : 0) : Math.min(100, Math.round((used / included) * 100));
  const level: "ok" | "warn" | "over" = over > 0 ? "over" : included > 0 && used >= included ? "warn" : "ok";
  return { used, included, remaining, over, pct, level };
}

export const PROJECT_STATUSES = ["draft", "active", "in_review", "completed", "on_hold"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", active: "Active", in_review: "In review", completed: "Completed", on_hold: "On hold",
  pending: "Pending", submitted: "Awaiting client", approved: "Approved", revision_requested: "Revision requested",
  accepted: "Accepted", declined: "Declined", unclassified: "Unclassified", in_scope: "In scope", out_of_scope: "Out of scope",
};
export const PROJECT_TYPES = ["Web design", "Web development", "Video editing", "Graphic design", "Copywriting", "Social media", "Branding", "Other"];
export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "BRL", "MXN", "ZAR", "NGN", "PHP", "JPY", "CHF", "SEK", "NZD", "SGD", "AED"];
