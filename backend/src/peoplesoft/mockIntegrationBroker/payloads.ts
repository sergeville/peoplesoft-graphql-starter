import { pickEffectiveRow, todayIsoDate } from "../effectiveDating.js";
import { mockEmplids, mockJobRowsByEmplid } from "../mockJobIndex.js";
import type { JobRow } from "../types.js";

/** PeopleSoft Integration Broker–style employee row (REST JSON). */
export type PsBrokerEmployeeRow = {
  EMPLID: string;
  NAME: string;
  EMAIL_ADDR: string | null;
  DEPTID: string | null;
  MANAGER_ID: string | null;
  EFFDT: string;
  POSITION: string;
};

export function jobRowToPsBrokerRow(row: JobRow): PsBrokerEmployeeRow {
  return {
    EMPLID: row.emplid,
    NAME: row.name,
    EMAIL_ADDR: row.email,
    DEPTID: row.department,
    MANAGER_ID: row.managerEmplid,
    EFFDT: row.effdt,
    POSITION: row.position,
  };
}

export function listPsBrokerEmployees(
  asOfDate?: string | null,
  limit?: number | null,
  offset?: number | null,
): PsBrokerEmployeeRow[] {
  const asOf = asOfDate?.trim() || todayIsoDate();
  const start = Math.max(0, offset ?? 0);
  const end =
    limit != null && limit > 0 ? start + limit : mockEmplids.length;
  const slice = mockEmplids.slice(start, end);
  const rows: PsBrokerEmployeeRow[] = [];

  for (const emplid of slice) {
    const jobRows = mockJobRowsByEmplid.get(emplid);
    if (!jobRows) continue;
    const effective = pickEffectiveRow(jobRows, asOf);
    if (effective) rows.push(jobRowToPsBrokerRow(effective));
  }

  return rows;
}

export function countPsBrokerEmployees(asOfDate?: string | null): number {
  const asOf = asOfDate?.trim() || todayIsoDate();
  let count = 0;
  for (const emplid of mockEmplids) {
    const jobRows = mockJobRowsByEmplid.get(emplid);
    if (jobRows && pickEffectiveRow(jobRows, asOf)) count += 1;
  }
  return count;
}

export function getPsBrokerEmployee(
  emplid: string,
  asOfDate?: string | null,
): PsBrokerEmployeeRow | null {
  const asOf = asOfDate?.trim() || todayIsoDate();
  const jobRows = mockJobRowsByEmplid.get(emplid);
  if (!jobRows) return null;
  const effective = pickEffectiveRow(jobRows, asOf);
  return effective ? jobRowToPsBrokerRow(effective) : null;
}

export function psBrokerListResponse(
  rows: PsBrokerEmployeeRow[],
  total: number,
  offset: number,
) {
  return {
    status: "success",
    rowCount: rows.length,
    total,
    offset,
    rows,
  };
}
