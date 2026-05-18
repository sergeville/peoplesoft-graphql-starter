import { mapIntegrationBrokerEmployee } from "./mappers.js";
import type { EmployeeRecord } from "./types.js";

type IntegrationBrokerConfig = {
  baseUrl: string;
  username: string;
  password: string;
};

/**
 * PeopleSoft Integration Broker REST client.
 * Implement `fetchEmployeeFromBroker` against your delivered REST service path.
 */
export class IntegrationBrokerClient {
  constructor(private readonly config: IntegrationBrokerConfig) {}

  async fetchEmployee(emplid: string): Promise<EmployeeRecord | null> {
    // TODO: replace path with your IB REST resource, e.g. /EMPLOYEE/v1/{emplid}
    const url = `${this.config.baseUrl.replace(/\/$/, "")}/employee/${encodeURIComponent(emplid)}`;
    const auth = Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString("base64");

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(
        `Integration Broker request failed (${response.status}): ${await response.text()}`,
      );
    }

    const payload: unknown = await response.json();
    return mapIntegrationBrokerEmployee(payload);
  }

  async fetchEmployees(): Promise<EmployeeRecord[]> {
    const url = `${this.config.baseUrl.replace(/\/$/, "")}/employees`;
    const auth = Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString("base64");

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Integration Broker list failed (${response.status}): ${await response.text()}`,
      );
    }

    const payload = (await response.json()) as { rows?: unknown[]; data?: unknown[] };
    const rows = payload.rows ?? payload.data ?? [];
    if (!Array.isArray(rows)) {
      throw new Error("Unexpected Integration Broker list response shape");
    }

    return rows.map(mapIntegrationBrokerEmployee);
  }
}

export function createIntegrationBrokerClientFromEnv(): IntegrationBrokerClient {
  const baseUrl = process.env.PS_BASE_URL;
  const username = process.env.PS_USERNAME;
  const password = process.env.PS_PASSWORD;

  if (!baseUrl || !username || !password) {
    throw new Error(
      "PS_BASE_URL, PS_USERNAME, and PS_PASSWORD are required when PEOPLESOFT_DATA_SOURCE=integration-broker",
    );
  }

  return new IntegrationBrokerClient({ baseUrl, username, password });
}
