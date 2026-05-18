import { mapIntegrationBrokerEmployee } from "./mappers.js";
import type { EmployeeRecord } from "./types.js";

export type IntegrationBrokerWriteInput = {
  emplid?: string | null;
  name: string;
  email?: string | null;
  department?: string | null;
  position?: string | null;
  salary?: number | null;
  managerEmplid?: string | null;
  effdt?: string | null;
};

type IntegrationBrokerConfig = {
  baseUrl: string;
  username: string;
  password: string;
};

/**
 * PeopleSoft Integration Broker REST client (HTTP consumer — Side 1 of the app).
 *
 * Your PS team configures IB in PeopleTools (Side 2). You only need their published:
 *   - PS_BASE_URL  (REST base, e.g. .../s/WEBLIB_EMP_REST.v1)
 *   - Operations: GET /employees, GET /employees/count, GET|PUT|DELETE /employee/{EMPLID}, POST /employees
 *   - Query: asOfDate, limit, offset (or page / pageSize)
 *   - Auth: Basic (this client) or extend for OAuth
 *   - JSON field names → mappers.ts (EMPLID, NAME, …)
 *
 * Local mock IB: PS_BASE_URL=http://localhost:4100 (see mockIntegrationBroker/server.ts).
 */
export class IntegrationBrokerClient {
  constructor(private readonly config: IntegrationBrokerConfig) {}

  private isGoogleAppsScript(): boolean {
    return this.config.baseUrl.includes("script.google.com");
  }

  /** Build REST URL (path style) or Apps Script ?path= style. */
  private buildUrl(
    path: string,
    params?: {
      asOfDate?: string | null;
      limit?: number | null;
      offset?: number | null;
      method?: string;
    },
  ): string {
    const cleanPath = path.replace(/^\//, "");
    const search = new URLSearchParams();

    if (this.isGoogleAppsScript()) {
      search.set("path", cleanPath);
    }

    if (params?.asOfDate?.trim()) {
      search.set("asOfDate", params.asOfDate.trim());
    }
    if (params?.limit != null && params.limit > 0) {
      search.set("limit", String(params.limit));
    }
    if (params?.offset != null && params.offset >= 0) {
      search.set("offset", String(params.offset));
    }
    if (params?.method) {
      search.set("_method", params.method);
    }

    const base = this.config.baseUrl.replace(/\/$/, "");
    if (this.isGoogleAppsScript()) {
      const query = search.toString();
      return query ? `${base}?${query}` : base;
    }

    const restBase = `${base}/${cleanPath}`;
    const query = search.toString();
    return query ? `${restBase}?${query}` : restBase;
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString("base64")}`;
  }

  private async request(
    path: string,
    init: RequestInit & {
      params?: {
        asOfDate?: string | null;
        limit?: number | null;
        offset?: number | null;
        method?: string;
      };
    },
  ): Promise<Response> {
    const { params, ...fetchInit } = init;
    const url = this.buildUrl(path, params);
    console.log(`[Integration Broker] ${fetchInit.method ?? "GET"} ${url}`);

    return fetch(url, {
      ...fetchInit,
      headers: {
        Authorization: this.authHeader(),
        Accept: "application/json",
        ...(fetchInit.body ? { "Content-Type": "application/json" } : {}),
        ...fetchInit.headers,
      },
    });
  }

  async fetchEmployee(
    emplid: string,
    asOfDate?: string | null,
  ): Promise<EmployeeRecord | null> {
    // TODO: replace path with your IB REST resource, e.g. /EMPLOYEE/v1/{emplid}
    const response = await this.request(
      `/employee/${encodeURIComponent(emplid)}`,
      { method: "GET", params: { asOfDate } },
    );

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
    const response = await this.request("/employees", {
      method: "GET",
      params: { asOfDate, limit, offset },
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
    const response = await this.request("/employees/count", {
      method: "GET",
      params: { asOfDate },
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

  async createEmployee(
    input: IntegrationBrokerWriteInput,
  ): Promise<EmployeeRecord> {
    const response = await this.request("/employees", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(
        `Integration Broker create failed (${response.status}): ${await response.text()}`,
      );
    }

    return mapIntegrationBrokerEmployee(await response.json());
  }

  async updateEmployee(
    emplid: string,
    input: IntegrationBrokerWriteInput,
  ): Promise<EmployeeRecord> {
    const path = `/employee/${encodeURIComponent(emplid)}`;
    const response = this.isGoogleAppsScript()
      ? await this.request(path, {
          method: "POST",
          params: { method: "PUT" },
          body: JSON.stringify(input),
        })
      : await this.request(path, {
          method: "PUT",
          body: JSON.stringify(input),
        });

    if (!response.ok) {
      throw new Error(
        `Integration Broker update failed (${response.status}): ${await response.text()}`,
      );
    }

    return mapIntegrationBrokerEmployee(await response.json());
  }

  async deleteEmployee(emplid: string): Promise<boolean> {
    const path = `/employee/${encodeURIComponent(emplid)}`;
    const response = this.isGoogleAppsScript()
      ? await this.request(path, {
          method: "POST",
          params: { method: "DELETE" },
        })
      : await this.request(path, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(
        `Integration Broker delete failed (${response.status}): ${await response.text()}`,
      );
    }

    const payload = (await response.json()) as { deleted?: boolean };
    return payload.deleted ?? true;
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
