import { initMockJobIndex } from "./mockJobIndex.js";
import { loadMockJobRows } from "./loadMockJobRows.js";
import type { JobRow } from "./types.js";

export async function bootstrapMockData(): Promise<JobRow[]> {
  const rows = await loadMockJobRows();
  initMockJobIndex(rows);
  return rows;
}
