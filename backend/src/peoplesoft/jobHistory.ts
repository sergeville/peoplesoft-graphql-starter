import { compareEffectiveRows } from "./effectiveDating.js";
import type { JobRecord, JobRow } from "./types.js";

export function jobRowToEmployee(row: JobRow) {
  return {
    emplid: row.emplid,
    name: row.name,
    email: row.email,
    department: row.department,
    position: row.position,
    salary: row.salary,
    managerEmplid: row.managerEmplid,
  };
}

/** Build job history segments from effective-dated rows (newest first). */
export function buildJobHistory(rows: JobRow[]): JobRecord[] {
  const sorted = [...rows].sort(compareEffectiveRows);

  return sorted.map((row, index) => {
    const older = sorted[index + 1];
    const endDate = older ? older.effdt : null;
    return {
      position: row.position,
      startDate: row.effdt,
      endDate,
      salary: row.salary,
    };
  });
}
