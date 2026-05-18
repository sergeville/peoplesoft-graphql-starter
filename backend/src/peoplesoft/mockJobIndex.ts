import type { JobRow } from "./types.js";

function buildIndex(rows: JobRow[]) {
  const byEmplid = new Map<string, JobRow[]>();

  for (const row of rows) {
    const list = byEmplid.get(row.emplid);
    if (list) list.push(row);
    else byEmplid.set(row.emplid, [row]);
  }

  const emplids = [...byEmplid.keys()].sort((a, b) => a.localeCompare(b));
  return { byEmplid, emplids };
}

export let mockJobRowsByEmplid: Map<string, JobRow[]> = new Map();
export let mockEmplids: string[] = [];
export let mockEmployeeCount = 0;

export function initMockJobIndex(rows: JobRow[]): void {
  const index = buildIndex(rows);
  mockJobRowsByEmplid = index.byEmplid;
  mockEmplids = index.emplids;
  mockEmployeeCount = index.emplids.length;
}
