import { pickActiveEffectiveRow, todayIsoDate } from "../effectiveDating.js";
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
  HR_STATUS: string;
};

/**
 * Why: Mock IB must emit PS uppercase REST fields so IntegrationBrokerClient and mappers
 * exercise the same inbound shape as a real PeopleSoft response.
 * Course: Module 7
 */
export function jobRowToPsBrokerRow(row: JobRow): PsBrokerEmployeeRow {
  return {
    EMPLID: row.emplid,
    NAME: row.name,
    EMAIL_ADDR: row.email,
    DEPTID: row.department,
    MANAGER_ID: row.managerEmplid,
    EFFDT: row.effdt,
    POSITION: row.position,
    HR_STATUS: row.hrStatus,
  };
}

/**
 * Why: GET /employees returns PS JSON rows per EMPLID at asOfDate — eff-dating applied here
 * so the mock list matches what Mode A GraphQL would show.
 * Course: Module 7 · Mode B
 */
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
    const effective = pickActiveEffectiveRow(jobRows, asOf);
    if (effective) rows.push(jobRowToPsBrokerRow(effective));
  }

  return rows;
}

/**
 * Why: Count endpoint mirrors IB contract for pagination totals without serializing every employee row.
 * Course: Module 7
 */
export function countPsBrokerEmployees(asOfDate?: string | null): number {
  const asOf = asOfDate?.trim() || todayIsoDate();
  let count = 0;
  for (const emplid of mockEmplids) {
    const jobRows = mockJobRowsByEmplid.get(emplid);
    if (jobRows && pickActiveEffectiveRow(jobRows, asOf)) count += 1;
  }
  return count;
}

/**
 * Why: Single-employee GET must return one PS-shaped row after eff-dating so fetchEmployee
 * mapping path matches production IB responses.
 * Course: Module 7
 */
export function getPsBrokerEmployee(
  emplid: string,
  asOfDate?: string | null,
): PsBrokerEmployeeRow | null {
  const asOf = asOfDate?.trim() || todayIsoDate();
  const jobRows = mockJobRowsByEmplid.get(emplid);
  if (!jobRows) return null;
  const effective = pickActiveEffectiveRow(jobRows, asOf);
  return effective ? jobRowToPsBrokerRow(effective) : null;
}

/**
 * Why: PS list operations use a status/total/rows envelope; wrapping keeps mock IB compatible
 * with client parsing in IntegrationBrokerClient.fetchEmployees.
 * Course: Module 7
 */
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
