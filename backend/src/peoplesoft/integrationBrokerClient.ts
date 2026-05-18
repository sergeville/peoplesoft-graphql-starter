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

  private buildUrl(
    path: string,
    params?: {
      asOfDate?: string | null;
      limit?: number | null;
      offset?: number | null;
    },
  ): string {
    const base = `${this.config.baseUrl.replace(/\/$/, "")}${path}`;
    const search = new URLSearchParams();
    if (params?.asOfDate?.trim()) {
      search.set("asOfDate", params.asOfDate.trim());
    }
    if (params?.limit != null && params.limit > 0) {
      search.set("limit", String(params.limit));
    }
    if (params?.offset != null && params.offset >= 0) {
      search.set("offset", String(params.offset));
    }
    const query = search.toString();
    return query ? `${base}?${query}` : base;
  }

  async fetchEmployee(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<EmployeeRecord | null> {
    // TODO: replace path with your IB REST resource, e.g. /EMPLOYEE/v1/{emplid}
    const url = this.buildUrl(`/employee/${encodeURIComponent(emplid)}`, {
      asOfDate,
    });
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

  async fetchEmployees(
    asOfDate?: string | null,
    limit?: number | null,
    offset?: number | null,
  ): Promise<EmployeeRecord[]> {
    const url = this.buildUrl("/employees", { asOfDate, limit, offset });
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

    const payload = (await response.json()) as {
      rows?: unknown[];
      data?: unknown[];
    };
    const rows = payload.rows ?? payload.data ?? [];
    if (!Array.isArray(rows)) {
      throw new Error("Unexpected Integration Broker list response shape");
    }

    return rows.map(mapIntegrationBrokerEmployee);
  }

  async countEmployees(asOfDate?: string | null): Promise<number> {
    const url = this.buildUrl("/employees/count", { asOfDate });
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
        `Integration Broker count failed (${response.status}): ${await response.text()}`,
      );
    }

    const payload = (await response.json()) as { total?: number; count?: number };
    const total = payload.total ?? payload.count;
    if (typeof total !== "number") {
      throw new Error("Unexpected Integration Broker count response shape");
    }

    return total;
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
