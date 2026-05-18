import { initEmployeeStore } from "./employeeStore.js";
import { loadMockJobRows } from "./loadMockJobRows.js";
import type { JobRow } from "./types.js";

export async function bootstrapMockData(): Promise<JobRow[]> {
  const rows = await loadMockJobRows();
  initEmployeeStore(rows);
  return rows;
}
