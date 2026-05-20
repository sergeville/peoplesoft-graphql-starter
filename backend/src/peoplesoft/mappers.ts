import type { EmployeeRecord } from "./types.js";

/**
 * Why: Integration Broker returns PS uppercase field names; the BFF maps once to the stable
 * GraphQL Employee shape so resolvers never branch on IB vs mock casing.
 * Course: Module 7 · CODE_PATH § two-way-mapping
 */
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
    position: row.POSITION
      ? String(row.POSITION)
      : row.position
        ? String(row.position)
        : "Employee",
    salary:
      typeof row.SALARY === "number"
        ? row.SALARY
        : row.salary
          ? Number.parseFloat(String(row.salary))
          : 0,
    managerEmplid: row.MANAGER_ID
      ? String(row.MANAGER_ID)
      : row.managerEmplid
        ? String(row.managerEmplid)
        : null,
  };
}
