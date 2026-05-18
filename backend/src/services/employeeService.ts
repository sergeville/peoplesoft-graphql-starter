import {
  pickEffectiveRow,
  todayIsoDate,
} from "../peoplesoft/effectiveDating.js";
import { createIntegrationBrokerClientFromEnv } from "../peoplesoft/integrationBrokerClient.js";
import { buildJobHistory, jobRowToEmployee } from "../peoplesoft/jobHistory.js";
import {
  mockEmplids,
  mockJobRowsByEmplid,
} from "../peoplesoft/mockJobIndex.js";
import type { EmployeeRecord, JobRecord } from "../peoplesoft/types.js";

export type EmployeeServiceContext = {
  dataSource: "mock" | "integration-broker";
};

export class EmployeeService {
  constructor(private readonly ctx: EmployeeServiceContext) {}

  private resolveAsOfDate(asOfDate?: string | null): string {
    return asOfDate?.trim() || todayIsoDate();
  }

  async listEmployees(
    asOfDate?: string | null,
    limit?: number | null,
    offset?: number | null,
  ): Promise<EmployeeRecord[]> {
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
        const effective = pickEffectiveRow(rows, asOf);
        if (effective) employees.push(jobRowToEmployee(effective));
      }

      return employees;
    }

    const client = createIntegrationBrokerClientFromEnv();
    return client.fetchEmployees(asOfDate, limit, offset);
  }

  async countEmployees(asOfDate?: string | null): Promise<number> {
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      let count = 0;
      for (const emplid of mockEmplids) {
        const rows = mockJobRowsByEmplid.get(emplid);
        if (rows && pickEffectiveRow(rows, asOf)) count += 1;
      }
      return count;
    }

    const client = createIntegrationBrokerClientFromEnv();
    return client.countEmployees(asOfDate);
  }

  async getEmployee(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<EmployeeRecord | null> {
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      const rows = mockJobRowsByEmplid.get(emplid);
      if (!rows) return null;
      const effective = pickEffectiveRow(rows, asOf);
      return effective ? jobRowToEmployee(effective) : null;
    }

    const client = createIntegrationBrokerClientFromEnv();
    return client.fetchEmployee(emplid, asOfDate);
  }

  async getJobHistory(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<JobRecord[]> {
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

  async getManager(
    emplid: string | null,
    asOfDate?: string | null,
  ): Promise<EmployeeRecord | null> {
    if (!emplid) return null;
    return this.getEmployee(emplid, asOfDate);
  }
}

export function createEmployeeServiceFromEnv(): EmployeeService {
  const raw = process.env.PEOPLESOFT_DATA_SOURCE ?? "mock";
  const dataSource =
    raw === "integration-broker" ? "integration-broker" : "mock";

  return new EmployeeService({ dataSource });
}
