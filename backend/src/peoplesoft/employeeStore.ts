import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { jobRowsToCsv } from "./csvEmployees.js";
import { traceFn, traceFnReturn } from "../devTrace.js";
import {
  compareEffectiveRows,
  isActiveHrStatus,
  pickActiveEffectiveRow,
  pickEffectiveRow,
  todayIsoDate,
} from "./effectiveDating.js";
import { jobRowToEmployee } from "./jobHistory.js";
import { resolveEmployeeCsvPath } from "./loadMockJobRows.js";
import { initMockJobIndex } from "./mockJobIndex.js";
import type { EmployeeRecord, JobRow } from "./types.js";

export type EmployeeWriteInput = {
  emplid?: string | null;
  name: string;
  email?: string | null;
  department?: string | null;
  position?: string | null;
  salary?: number | null;
  managerEmplid?: string | null;
  effdt?: string | null;
  hrStatus?: string | null;
};

let allJobRows: JobRow[] = [];

/**
 * Why: Mode A keeps PS job rows in memory at boot so GraphQL writes hit the same eff-dated
 * store the course CSV seeded, without a live Integration Broker.
 * Course: Module 6 · Mode A
 */
export function initEmployeeStore(rows: JobRow[]): void {
  traceFn("store", "initEmployeeStore", { rowCount: rows.length });
  allJobRows = [...rows];
  refreshIndex();
}

/** Why: Rebuild EMPLID index after terminate append so list/count queries stay O(1) without rescanning all rows. */
function refreshIndex(): void {
  traceFn("store", "refreshIndex", { rowCount: allJobRows.length });
  initMockJobIndex(allJobRows);
}

/** Why: Mirror in-memory mutations back to the course CSV so mock Mode A survives restarts like a tiny PS file. */
function persistToCsv(): void {
  traceFn("store", "persistToCsv");
  const csvPath = resolveEmployeeCsvPath();
  mkdirSync(path.dirname(csvPath), { recursive: true });
  writeFileSync(csvPath, `${jobRowsToCsv(allJobRows)}\n`, "utf8");
}

/** Why: Auto-assign EMPLID when GraphQL create omits id, matching PS key generation without manual counters. */
function nextEmplid(): string {
  traceFn("store", "nextEmplid");
  let max = 100000;
  for (const row of allJobRows) {
    const numeric = Number.parseInt(row.emplid, 10);
    if (Number.isFinite(numeric) && numeric > max) max = numeric;
  }
  return String(max + 1);
}

/** Why: All store ops are per-EMPLID eff-dated slices; central filter avoids duplicating index lookup rules. */
function rowsFor(emplid: string): JobRow[] {
  traceFn("store", "rowsFor", { emplid });
  return allJobRows.filter((row) => row.emplid === emplid);
}

/**
 * Why: Field updates patch the current effective row in place; PS treats that as correcting the
 * latest segment, while terminate intentionally appends a new row instead.
 * Course: Module 9
 */
function upsertLatestRow(emplid: string, patch: Partial<JobRow>): EmployeeRecord {
  traceFn("store", "upsertLatestRow", { emplid, effdt: patch.effdt });
  const rows = rowsFor(emplid);
  if (rows.length === 0) {
    throw new Error(`Employee not found: ${emplid}`);
  }

  const latest = [...rows].sort(
    (a, b) => Date.parse(b.effdt) - Date.parse(a.effdt),
  )[0]!;

  const updated: JobRow = {
    ...latest,
    ...patch,
    emplid,
  };

  allJobRows = allJobRows.map((row) =>
    row.emplid === emplid && row.effdt === latest.effdt && row.effseq === latest.effseq
      ? updated
      : row,
  );

  persistToCsv();
  return jobRowToEmployee(updated);
}

/**
 * Why: GraphQL create must mint the first eff-dated job row (and EMPLID if absent) so later
 * as-of reads and history behave like a real PS hire row, not a flat record insert.
 * Course: Module 9 · Mode A
 */
export function createEmployeeInStore(input: EmployeeWriteInput): EmployeeRecord {
  traceFn("store", "createEmployeeInStore", {
    emplid: input.emplid,
    effdt: input.effdt,
  });
  const emplid = input.emplid?.trim() || nextEmplid();
  if (rowsFor(emplid).length > 0) {
    throw new Error(`Employee already exists: ${emplid}`);
  }

  const row: JobRow = {
    emplid,
    effdt: input.effdt?.trim() || todayIsoDate(),
    effseq: 0,
    hrStatus: input.hrStatus?.trim() || "A",
    name: input.name.trim(),
    email: input.email?.trim() || null,
    department: input.department?.trim() || null,
    position: input.position?.trim() || "Employee",
    salary: input.salary ?? 0,
    managerEmplid: input.managerEmplid?.trim() || null,
  };

  allJobRows.push(row);
  persistToCsv();
  traceFnReturn("store", "createEmployeeInStore", { emplid, effdt: row.effdt });
  return jobRowToEmployee(row);
}

/**
 * Why: Mutations change current job attributes on the latest eff-dated row without rewriting
 * prior history segments the course relies on for jobHistory and as-of queries.
 * Course: Module 9 · Mode A
 */
export function updateEmployeeInStore(
  emplid: string,
  input: EmployeeWriteInput,
): EmployeeRecord {
  const id = emplid.trim();
  traceFn("store", "updateEmployeeInStore", { emplid: id, effdt: input.effdt });
  return upsertLatestRow(id, {
    name: input.name.trim(),
    email: input.email?.trim() || null,
    department: input.department?.trim() || null,
    position: input.position?.trim() || undefined,
    salary: input.salary ?? undefined,
    managerEmplid: input.managerEmplid?.trim() || null,
    effdt: input.effdt?.trim() || undefined,
    hrStatus: input.hrStatus?.trim() || undefined,
  });
}

/**
 * Why: GraphQL delete must not remove PS history; we append an inactive eff-dated row so
 * as-of queries and audit stay correct while the UI hides the employee from active lists.
 * Course: Module 9 · CODE_PATH § ps-terminate-vs-delete
 */
export function terminateEmployeeInStore(
  emplid: string,
  effdt?: string | null,
): boolean {
  const id = emplid.trim();
  traceFn("store", "terminateEmployeeInStore", { emplid: id, effdt });
  const rows = rowsFor(id);
  if (rows.length === 0) {
    traceFnReturn("store", "terminateEmployeeInStore", {
      emplid: id,
      reason: "not found",
    });
    return false;
  }

  const latest = [...rows].sort(compareEffectiveRows)[0]!;
  if (!isActiveHrStatus(latest.hrStatus)) {
    traceFnReturn("store", "terminateEmployeeInStore", {
      emplid: id,
      reason: "already inactive",
    });
    return false;
  }

  const termEffdt = effdt?.trim() || todayIsoDate();
  const sameDaySeq = rows
    .filter((row) => row.effdt === termEffdt)
    .reduce((max, row) => Math.max(max, row.effseq), -1);

  const termRow: JobRow = {
    ...latest,
    effdt: termEffdt,
    effseq: sameDaySeq + 1,
    hrStatus: "I",
  };

  allJobRows.push(termRow);
  persistToCsv();
  refreshIndex();
  traceFnReturn("store", "terminateEmployeeInStore", {
    emplid: id,
    effdt: termEffdt,
    effseq: termRow.effseq,
    hrStatus: termRow.hrStatus,
  });
  return true;
}

/**
 * Why: Keeps the GraphQL deleteEmployee name stable for clients while routing to PS-style
 * terminate semantics instead of physical row deletion in the mock store.
 * Course: Module 9
 */
export function deleteEmployeeFromStore(emplid: string): boolean {
  traceFn("store", "deleteEmployeeFromStore", { emplid });
  return terminateEmployeeInStore(emplid);
}

/**
 * Why: Single-employee reads must honor asOfDate and active HR status so terminated rows
 * disappear from employee(id) while eff-dated history remains in the underlying store.
 * Course: Module 6
 */
export function getEmployeeFromStore(
  emplid: string,
  asOfDate?: string | null,
): EmployeeRecord | null {
  traceFn("store", "getEmployeeFromStore", { emplid, asOfDate });
  const rows = rowsFor(emplid);
  const effective = pickActiveEffectiveRow(rows, asOfDate?.trim() || todayIsoDate());
  traceFnReturn("store", "getEmployeeFromStore", { emplid, found: !!effective });
  return effective ? jobRowToEmployee(effective) : null;
}
