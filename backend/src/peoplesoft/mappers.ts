import type { EmployeeRecord } from "./types.js";

/** Map Integration Broker JSON → internal employee shape. Adjust when wiring real PS REST. */
export function mapIntegrationBrokerEmployee(payload: unknown): EmployeeRecord {
  const row = payload as Record<string, unknown>;
  return {
    emplid: String(row.EMPLID ?? row.emplid ?? ""),
    name: String(row.NAME ?? row.name ?? ""),
    email: row.EMAIL
      ? String(row.EMAIL)
      : row.EMAIL_ADDR
        ? String(row.EMAIL_ADDR)
        : row.email
          ? String(row.email)
          : null,
    department: row.DEPTID
      ? String(row.DEPTID)
      : row.department
        ? String(row.department)
        : null,
    managerEmplid: row.MANAGER_ID
      ? String(row.MANAGER_ID)
      : row.managerEmplid
        ? String(row.managerEmplid)
        : null,
  };
}
