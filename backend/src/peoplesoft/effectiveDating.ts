import { traceFn, traceFnReturn } from "../devTrace.js";

/** Rows with PeopleSoft-style effective date (and optional sequence). */
export type EffectiveDated = {
  effdt: string;
  effseq?: number;
};

/**
 * Why: PS answers "what was true on this date" via MAX(EFFDT) ≤ asOfDate (then EFFSEQ), not
 * the latest row globally — required for historical employee and job queries.
 * Course: Module 6
 */
export function pickEffectiveRow<T extends EffectiveDated>(
  rows: T[],
  asOfDate: string,
): T | null {
  traceFn("effdate", "pickEffectiveRow", { asOfDate, rowCount: rows.length });
  const asOfMs = Date.parse(asOfDate);
  if (Number.isNaN(asOfMs)) return null;

  const eligible = rows.filter((row) => Date.parse(row.effdt) <= asOfMs);
  if (eligible.length === 0) return null;

  const picked = [...eligible].sort(compareEffectiveRows)[0] ?? null;
  traceFnReturn("effdate", "pickEffectiveRow", { picked: !!picked });
  return picked;
}

/**
 * Why: Shared newest-first ordering for terminate, upsert, and jobHistory so every layer
 * agrees which row is "latest" when multiple EFFSEQ exist on the same EFFDT.
 * Course: Module 6
 */
export function compareEffectiveRows<T extends EffectiveDated>(a: T, b: T): number {
  traceFn("effdate", "compareEffectiveRows");
  const dateDiff = Date.parse(b.effdt) - Date.parse(a.effdt);
  if (dateDiff !== 0) return dateDiff;
  return (b.effseq ?? 0) - (a.effseq ?? 0);
}

/**
 * Why: Default as-of and eff-dated writes to "today" when GraphQL omits dates, keeping mock
 * and IB paths aligned without each caller duplicating date formatting.
 */
export function todayIsoDate(): string {
  traceFn("effdate", "todayIsoDate");
  return new Date().toISOString().slice(0, 10);
}

const INACTIVE_HR_STATUSES = new Set(["I", "T"]);

/**
 * Why: PS inactive codes (I/T) must be recognized before list/get filtering so terminated
 * employees vanish from active views without deleting eff-dated history rows.
 * Course: Module 6
 */
export function isActiveHrStatus(hrStatus?: string | null): boolean {
  traceFn("effdate", "isActiveHrStatus", { hrStatus });
  const code = (hrStatus?.trim() || "A").toUpperCase();
  return !INACTIVE_HR_STATUSES.has(code);
}

/**
 * Why: GraphQL employee list/get should return only currently active people at asOfDate,
 * combining eff-dating with HR_STATUS — the usual BFF rule over raw PS job rows.
 * Course: Module 6/10
 */
export function pickActiveEffectiveRow<T extends EffectiveDated & { hrStatus?: string }>(
  rows: T[],
  asOfDate: string,
): T | null {
  traceFn("effdate", "pickActiveEffectiveRow", { asOfDate, rowCount: rows.length });
  const row = pickEffectiveRow(rows, asOfDate);
  if (!row || !isActiveHrStatus(row.hrStatus)) {
    traceFnReturn("effdate", "pickActiveEffectiveRow", { active: false });
    return null;
  }
  traceFnReturn("effdate", "pickActiveEffectiveRow", { active: true });
  return row;
}
