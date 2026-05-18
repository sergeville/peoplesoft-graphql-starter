import {
  pickEffectiveRow,
  todayIsoDate,
} from "../peoplesoft/effectiveDating.js";
import { createIntegrationBrokerClientFromEnv } from "../peoplesoft/integrationBrokerClient.js";
import { buildJobHistory, jobRowToEmployee } from "../peoplesoft/jobHistory.js";
import { mockJobRows } from "../peoplesoft/mockData.js";
import type { EmployeeRecord, JobRecord } from "../peoplesoft/types.js";

export type EmployeeServiceContext = {
  dataSource: "mock" | "integration-broker";
};

export class EmployeeService {
  constructor(private readonly ctx: EmployeeServiceContext) {}

  private resolveAsOfDate(asOfDate?: string | null): string {
    return asOfDate?.trim() || todayIsoDate();
  }

  async listEmployees(asOfDate?: string | null): Promise<EmployeeRecord[]> {
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      const emplids = [...new Set(mockJobRows.map((row) => row.emplid))];
      const employees: EmployeeRecord[] = [];

      for (const emplid of emplids) {
        const row = await this.getEmployee(emplid, asOf);
        if (row) employees.push(row);
      }

      return employees.sort((a, b) => a.emplid.localeCompare(b.emplid));
    }

    const client = createIntegrationBrokerClientFromEnv();
    return client.fetchEmployees();
  }

  async getEmployee(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<EmployeeRecord | null> {
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      const rows = mockJobRows.filter((row) => row.emplid === emplid);
      const effective = pickEffectiveRow(rows, asOf);
      return effective ? jobRowToEmployee(effective) : null;
    }

    const client = createIntegrationBrokerClientFromEnv();
    return client.fetchEmployee(emplid);
  }

  async getJobHistory(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<JobRecord[]> {
    if (this.ctx.dataSource === "mock") {
      const asOf = this.resolveAsOfDate(asOfDate);
      const asOfMs = Date.parse(asOf);
      const rows = mockJobRows.filter(
        (row) => row.emplid === emplid && Date.parse(row.effdt) <= asOfMs,
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
