import { traceFn, traceFnReturn } from "../devTrace.js";
import { compareEffectiveRows } from "./effectiveDating.js";
import type { JobRecord, JobRow } from "./types.js";

/**
 * Why: GraphQL Employee hides PS eff-dating fields; map strips EFFDT/HR_STATUS so the public
 * contract stays stable while job rows retain full PS semantics internally.
 * Course: Module 6
 */
export function jobRowToEmployee(row: JobRow) {
  traceFn("jobHistory", "jobRowToEmployee", { emplid: row.emplid });
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

/**
 * Why: UI jobHistory needs contiguous position segments derived from eff-dated rows — endDate
 * of each segment is the prior row's EFFDT, matching how PS history is read.
 * Course: Module 5/10
 */
export function buildJobHistory(rows: JobRow[]): JobRecord[] {
  traceFn("jobHistory", "buildJobHistory", { rowCount: rows.length });
  const sorted = [...rows].sort(compareEffectiveRows);

  const segments = sorted.map((row, index) => {
    const older = sorted[index + 1];
    const endDate = older ? older.effdt : null;
    return {
      position: row.position,
      startDate: row.effdt,
      endDate,
      salary: row.salary,
    };
  });
  traceFnReturn("jobHistory", "buildJobHistory", { segments: segments.length });
  return segments;
}
