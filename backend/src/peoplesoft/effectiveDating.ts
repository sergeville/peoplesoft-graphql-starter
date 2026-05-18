/** Rows with PeopleSoft-style effective date (and optional sequence). */
export type EffectiveDated = {
  effdt: string;
  effseq?: number;
};

/** MAX(EFFDT) <= asOfDate, then highest EFFSEQ. */
export function pickEffectiveRow<T extends EffectiveDated>(
  rows: T[],
  asOfDate: string,
): T | null {
  const asOfMs = Date.parse(asOfDate);
  if (Number.isNaN(asOfMs)) return null;

  const eligible = rows.filter((row) => Date.parse(row.effdt) <= asOfMs);
  if (eligible.length === 0) return null;

  return [...eligible].sort(compareEffectiveRows)[0] ?? null;
}

export function compareEffectiveRows<T extends EffectiveDated>(a: T, b: T): number {
  const dateDiff = Date.parse(b.effdt) - Date.parse(a.effdt);
  if (dateDiff !== 0) return dateDiff;
  return (b.effseq ?? 0) - (a.effseq ?? 0);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
