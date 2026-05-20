import { devTrace } from "../devTrace.js";
import { todayIsoDate } from "./effectiveDating.js";
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
  hrStatus?: string | null;
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

  /** Why: Apps Script cannot host true REST paths; detect once so URL and verb routing stay in one place. */
  private isGoogleAppsScript(): boolean {
    return this.config.baseUrl.includes("script.google.com");
  }

  /**
   * Why: Centralize path, asOfDate, pagination, and Apps Script ?path= quirks so every IB
   * operation hits the same URL contract the PS team published.
   * Course: Module 7
   */
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

  /** Why: PS IB expects Basic auth on every call; one helper keeps credentials out of each method. */
  private authHeader(): string {
    return `Basic ${Buffer.from(
      `${this.config.username}:${this.config.password}`,
    ).toString("base64")}`;
  }

  /**
   * Why: Single fetch wrapper applies auth, JSON headers, and logging so Mode B errors and
   * retries behave consistently without duplicating fetch boilerplate per operation.
   * Course: Module 7
   */
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
    const method = fetchInit.method ?? "GET";
    devTrace("integration-broker", "HTTP →", { method, url });
    const response = await fetch(url, {
      ...fetchInit,
      headers: {
        Authorization: this.authHeader(),
        Accept: "application/json",
        ...(fetchInit.body ? { "Content-Type": "application/json" } : {}),
        ...fetchInit.headers,
      },
    });
    devTrace("integration-broker", "HTTP ←", {
      method,
      url,
      status: response.status,
    });
    return response;
  }

  /**
   * Why: Mode B loads one employee from live PS REST instead of the mock index, with asOfDate
   * passed through so historical reads match PeopleSoft semantics.
   * Course: Module 7 · Mode B
   */
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

  /**
   * Why: Employee list in production comes from IB pagination, not CSV; maps each row so
   * GraphQL list shape stays identical to Mode A.
   * Course: Module 7 · Mode B
   */
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

  /**
   * Why: UI pagination needs total active count from PS without fetching every row — IB exposes
   * a dedicated count endpoint the BFF proxies unchanged.
   * Course: Module 7 · Mode B
   */
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

  /**
   * Why: Creates in Mode B must hit PS via POST so hire data lands in PeopleSoft, not the
   * in-memory mock store — same GraphQL mutation, different persistence boundary.
   * Course: Module 7/9 · Mode B
   */
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

  /**
   * Why: Field updates in production are PS PUT operations; Apps Script may need POST+_method
   * but the BFF hides that so EmployeeService stays one code path.
   * Course: Module 7/9 · Mode B
   */
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

  /**
   * Why: GraphQL deleteEmployee terminates in PS via eff-dated inactive status, not HTTP
   * DELETE of the row — mirrors mock store and keeps audit history in PeopleSoft.
   * Course: Module 9 · CODE_PATH § ps-terminate-vs-delete
   */
  async deleteEmployee(emplid: string): Promise<boolean> {
    const path = `/employee/${encodeURIComponent(emplid)}`;
    const body = JSON.stringify({
      effdt: todayIsoDate(),
      hrStatus: "I",
      HR_STATUS: "I",
    });
    const response = this.isGoogleAppsScript()
      ? await this.request(path, {
          method: "POST",
          params: { method: "PUT" },
          body,
        })
      : await this.request(path, { method: "PUT", body });

    if (!response.ok) {
      throw new Error(
        `Integration Broker terminate failed (${response.status}): ${await response.text()}`,
      );
    }

    const payload = (await response.json()) as {
      deleted?: boolean;
      terminated?: boolean;
    };
    return payload.deleted ?? payload.terminated ?? true;
  }
}

/**
 * Why: Mode B wires the IB client from env at startup so missing PS credentials fail fast
 * instead of silently falling back to mock data in production-shaped configs.
 * Course: Module 7 · Mode B
 */
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
