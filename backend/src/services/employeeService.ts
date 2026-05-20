import { devTrace, devTraceAsync, traceFn, traceFnReturn } from "../devTrace.js";
import {
  pickActiveEffectiveRow,
  pickEffectiveRow,
  todayIsoDate,
} from "../peoplesoft/effectiveDating.js";
import { createIntegrationBrokerClientFromEnv } from "../peoplesoft/integrationBrokerClient.js";
import { buildJobHistory, jobRowToEmployee } from "../peoplesoft/jobHistory.js";
import {
  createEmployeeInStore,
  deleteEmployeeFromStore,
  updateEmployeeInStore,
  type EmployeeWriteInput,
} from "../peoplesoft/employeeStore.js";
import {
  mockEmplids,
  mockJobRowsByEmplid,
} from "../peoplesoft/mockJobIndex.js";
import type { EmployeeRecord, JobRecord } from "../peoplesoft/types.js";

export type EmployeeServiceContext = {
  dataSource: "mock" | "integration-broker";
};

/**
 * Why: BFF facade hides mock vs Integration Broker behind one API so GraphQL resolvers never
 * branch on PEOPLESOFT_DATA_SOURCE — the main stability boundary in the stack.
 * Course: Module 5
 */
export class EmployeeService {
  constructor(private readonly ctx: EmployeeServiceContext) {}

  private traceMethod(
    functionName: string,
    detail?: Record<string, unknown>,
  ): void {
    traceFn("service", functionName, {
      dataSource: this.ctx.dataSource,
      ...detail,
    });
  }

  private traceMethodReturn(
    functionName: string,
    detail?: Record<string, unknown>,
  ): void {
    traceFnReturn("service", functionName, {
      dataSource: this.ctx.dataSource,
      ...detail,
    });
  }

  private resolveAsOfDate(asOfDate?: string | null): string {
    traceFn("service", "resolveAsOfDate", { asOfDate });
    return asOfDate?.trim() || todayIsoDate();
  }

  /**
   * Why: employees query needs one list path whether data lives in the mock index or live IB,
   * applying eff-dating and active HR rules before returning GraphQL-shaped rows.
   * Course: Module 5/6
   */
  async listEmployees(
    asOfDate?: string | null,
    limit?: number | null,
    offset?: number | null,
  ): Promise<EmployeeRecord[]> {
    this.traceMethod("listEmployees", { asOfDate, limit, offset });
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      const start = Math.max(0, offset ?? 0);
      const end =
        limit != null && limit > 0 ? start + limit : mockEmplids.length;
      const slice = mockEmplids.slice(start, end);
      const employees: EmployeeRecord[] = [];

      for (const emplid of slice) {
        const rows = mockJobRowsByEmplid.get(emplid);
        if (!rows) continue;
        const effective = pickActiveEffectiveRow(rows, asOf);
        if (effective) employees.push(jobRowToEmployee(effective));
      }

      this.traceMethodReturn("listEmployees", { count: employees.length });
      return employees;
    }

    const client = createIntegrationBrokerClientFromEnv();
    return devTraceAsync(
      "service",
      "listEmployees",
      { path: "integration-broker" },
      () => client.fetchEmployees(asOfDate, limit, offset),
    );
  }

  /**
   * Why: Pagination UI needs total active headcount at asOfDate without loading full employee
   * payloads — delegated to index scan (mock) or IB count endpoint (prod).
   * Course: Module 5
   */
  async countEmployees(asOfDate?: string | null): Promise<number> {
    this.traceMethod("countEmployees", { asOfDate });
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      let count = 0;
      for (const emplid of mockEmplids) {
        const rows = mockJobRowsByEmplid.get(emplid);
        if (rows && pickActiveEffectiveRow(rows, asOf)) count += 1;
      }
      this.traceMethodReturn("countEmployees", { count });
      return count;
    }

    const client = createIntegrationBrokerClientFromEnv();
    return devTraceAsync(
      "service",
      "countEmployees",
      { path: "integration-broker" },
      () => client.countEmployees(asOfDate),
    );
  }

  /**
   * Why: employee(id) must resolve the effective active row at asOfDate from either backend
   * so the same GraphQL field works in course mock and customer IB deployments.
   * Course: Module 5/6
   */
  async getEmployee(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<EmployeeRecord | null> {
    this.traceMethod("getEmployee", { emplid, asOfDate });
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      const rows = mockJobRowsByEmplid.get(emplid);
      if (!rows) return null;
      const effective = pickActiveEffectiveRow(rows, asOf);
      const record = effective ? jobRowToEmployee(effective) : null;
      this.traceMethodReturn("getEmployee", { found: !!record });
      return record;
    }

    const client = createIntegrationBrokerClientFromEnv();
    return devTraceAsync(
      "service",
      "getEmployee",
      { emplid, path: "integration-broker" },
      () => client.fetchEmployee(emplid, asOfDate),
    );
  }

  /**
   * Why: jobHistory exposes PS eff-dated segments to the UI; mock builds from stored rows
   * while IB path is reserved so the GraphQL contract does not change when wired later.
   * Course: Module 5/10
   */
  async getJobHistory(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<JobRecord[]> {
    this.traceMethod("getJobHistory", { emplid, asOfDate });
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      const asOfMs = Date.parse(asOf);
      const rows = (mockJobRowsByEmplid.get(emplid) ?? []).filter(
        (row) => Date.parse(row.effdt) <= asOfMs,
      );
      return buildJobHistory(rows);
    }

    // TODO: Integration Broker or PS Query for job history
    return [];
  }

  /**
   * Why: Nested manager field must use the parent's asOfDate so reorgs and terminations
   * at historical dates do not show a manager who was not effective then.
   * Course: Module 5
   */
  async getManager(
    emplid: string | null,
    asOfDate?: string | null,
  ): Promise<EmployeeRecord | null> {
    this.traceMethod("getManager", { emplid, asOfDate });
    if (!emplid) return null;
    return this.getEmployee(emplid, asOfDate);
  }

  /**
   * Why: createEmployee mutation funnels to mock store or IB POST so hire semantics stay in
   * PeopleSoft either way without resolver-level data-source switches.
   * Course: Module 9
   */
  async createEmployee(input: EmployeeWriteInput): Promise<EmployeeRecord> {
    this.traceMethod("createEmployee", {
      emplid: input.emplid,
      name: input.name,
      effdt: input.effdt,
    });
    if (this.ctx.dataSource === "mock") {
      return createEmployeeInStore(input);
    }
    const client = createIntegrationBrokerClientFromEnv();
    return devTraceAsync(
      "service",
      "createEmployee",
      { path: "integration-broker" },
      () => client.createEmployee(input),
    );
  }

  /**
   * Why: Updates patch the current job segment in mock or PS via PUT while GraphQL input
   * shape stays fixed for the frontend.
   * Course: Module 9
   */
  async updateEmployee(
    emplid: string,
    input: EmployeeWriteInput,
  ): Promise<EmployeeRecord> {
    this.traceMethod("updateEmployee", { emplid, effdt: input.effdt });
    if (this.ctx.dataSource === "mock") {
      return updateEmployeeInStore(emplid, input);
    }
    const client = createIntegrationBrokerClientFromEnv();
    return devTraceAsync(
      "service",
      "updateEmployee",
      { emplid, path: "integration-broker" },
      () => client.updateEmployee(emplid, input),
    );
  }

  /**
   * Why: deleteEmployee is terminate-only in both modes so clients keep one mutation name
   * while PS retains eff-dated history (never a hard delete in this course stack).
   * Course: Module 9 · CODE_PATH § ps-terminate-vs-delete
   */
  async deleteEmployee(emplid: string): Promise<boolean> {
    this.traceMethod("deleteEmployee", { emplid });
    if (this.ctx.dataSource === "mock") {
      const ok = deleteEmployeeFromStore(emplid);
      this.traceMethodReturn("deleteEmployee", { emplid, ok });
      return ok;
    }
    const client = createIntegrationBrokerClientFromEnv();
    return devTraceAsync(
      "service",
      "deleteEmployee",
      { emplid, path: "integration-broker", method: "PUT terminate" },
      () => client.deleteEmployee(emplid),
    );
  }
}

/**
 * Why: Server boot picks mock vs IB once from env so request handlers share a single service
 * instance with a consistent data boundary for the whole process.
 * Course: Module 5
 */
export function createEmployeeServiceFromEnv(): EmployeeService {
  traceFn("service", "createEmployeeServiceFromEnv");
  const raw = process.env.PEOPLESOFT_DATA_SOURCE ?? "mock";
  const dataSource =
    raw === "integration-broker" ? "integration-broker" : "mock";

  const service = new EmployeeService({ dataSource });
  traceFnReturn("service", "createEmployeeServiceFromEnv", { dataSource });
  return service;
}
