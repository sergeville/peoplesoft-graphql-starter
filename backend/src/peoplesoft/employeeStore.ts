import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { jobRowsToCsv } from "./csvEmployees.js";
import { pickEffectiveRow, todayIsoDate } from "./effectiveDating.js";
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
};

let allJobRows: JobRow[] = [];

export function initEmployeeStore(rows: JobRow[]): void {
  allJobRows = [...rows];
  refreshIndex();
}

function refreshIndex(): void {
  initMockJobIndex(allJobRows);
}

function persistToCsv(): void {
  const csvPath = resolveEmployeeCsvPath();
  mkdirSync(path.dirname(csvPath), { recursive: true });
  writeFileSync(csvPath, `${jobRowsToCsv(allJobRows)}\n`, "utf8");
}

function nextEmplid(): string {
  let max = 100000;
  for (const row of allJobRows) {
    const numeric = Number.parseInt(row.emplid, 10);
    if (Number.isFinite(numeric) && numeric > max) max = numeric;
  }
  return String(max + 1);
}

function rowsFor(emplid: string): JobRow[] {
  return allJobRows.filter((row) => row.emplid === emplid);
}

function upsertLatestRow(emplid: string, patch: Partial<JobRow>): EmployeeRecord {
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

export function createEmployeeInStore(input: EmployeeWriteInput): EmployeeRecord {
  const emplid = input.emplid?.trim() || nextEmplid();
  if (rowsFor(emplid).length > 0) {
    throw new Error(`Employee already exists: ${emplid}`);
  }

  const row: JobRow = {
    emplid,
    effdt: input.effdt?.trim() || todayIsoDate(),
    effseq: 0,
    name: input.name.trim(),
    email: input.email?.trim() || null,
    department: input.department?.trim() || null,
    position: input.position?.trim() || "Employee",
    salary: input.salary ?? 0,
    managerEmplid: input.managerEmplid?.trim() || null,
  };

  allJobRows.push(row);
  persistToCsv();
  return jobRowToEmployee(row);
}

export function updateEmployeeInStore(
  emplid: string,
  input: EmployeeWriteInput,
): EmployeeRecord {
  const id = emplid.trim();
  return upsertLatestRow(id, {
    name: input.name.trim(),
    email: input.email?.trim() || null,
    department: input.department?.trim() || null,
    position: input.position?.trim() || undefined,
    salary: input.salary ?? undefined,
    managerEmplid: input.managerEmplid?.trim() || null,
    effdt: input.effdt?.trim() || undefined,
  });
}

export function deleteEmployeeFromStore(emplid: string): boolean {
  const id = emplid.trim();
  const before = allJobRows.length;
  allJobRows = allJobRows.filter((row) => row.emplid !== id);
  if (allJobRows.length === before) return false;
  persistToCsv();
  return true;
}

export function getEmployeeFromStore(
  emplid: string,
  asOfDate?: string | null,
): EmployeeRecord | null {
  const rows = rowsFor(emplid);
  const effective = pickEffectiveRow(rows, asOfDate?.trim() || todayIsoDate());
  return effective ? jobRowToEmployee(effective) : null;
}
