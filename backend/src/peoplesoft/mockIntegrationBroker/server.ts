import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

import { mockEmployeeCount } from "../mockJobIndex.js";
import {
  countPsBrokerEmployees,
  getPsBrokerEmployee,
  listPsBrokerEmployees,
  psBrokerListResponse,
} from "./payloads.js";

export type MockIntegrationBrokerOptions = {
  port: number;
  username?: string;
  password?: string;
};

function readAsOfDate(url: URL): string | null {
  return url.searchParams.get("asOfDate");
}

function readPagination(url: URL): { limit: number | null; offset: number } {
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");
  const pageRaw = url.searchParams.get("page");
  const pageSizeRaw = url.searchParams.get("pageSize");

  let limit: number | null = limitRaw ? Number.parseInt(limitRaw, 10) : null;
  let offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0;

  if (pageRaw || pageSizeRaw) {
    const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);
    const pageSize = Math.max(
      1,
      Number.parseInt(pageSizeRaw ?? "50", 10) || 50,
    );
    limit = pageSize;
    offset = (page - 1) * pageSize;
  }

  if (limit != null && (!Number.isFinite(limit) || limit <= 0)) limit = null;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

function parseBasicAuth(
  header: string | undefined,
): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const colon = decoded.indexOf(":");
  if (colon < 0) return null;
  return {
    username: decoded.slice(0, colon),
    password: decoded.slice(colon + 1),
  };
}

function authorize(
  req: IncomingMessage,
  options: MockIntegrationBrokerOptions,
): boolean {
  const expectedUser = options.username;
  const expectedPass = options.password;
  if (!expectedUser || !expectedPass) return true;

  const credentials = parseBasicAuth(req.headers.authorization);
  return (
    credentials?.username === expectedUser &&
    credentials?.password === expectedPass
  );
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "X-Mock-PeopleSoft-IB": "true",
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendText(res: ServerResponse, status: number, message: string) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(message);
}

export function createMockIntegrationBrokerServer(
  options: MockIntegrationBrokerOptions,
) {
  return createServer((req, res) => {
    if (!req.url || !req.method) {
      sendText(res, 400, "Bad request");
      return;
    }

    if (!authorize(req, options)) {
      res.writeHead(401, {
        "WWW-Authenticate": 'Basic realm="Mock PeopleSoft IB"',
        "Content-Type": "text/plain",
      });
      res.end("Unauthorized");
      return;
    }

    const url = new URL(req.url, `http://127.0.0.1:${options.port}`);
    const asOfDate = readAsOfDate(url);

    if (req.method === "GET" && url.pathname === "/") {
      sendJson(res, 200, {
        service: "Mock PeopleSoft Integration Broker REST",
        employeeCount: mockEmployeeCount,
        endpoints: {
          list: "GET /employees?limit=50&offset=0&asOfDate=YYYY-MM-DD",
          count: "GET /employees/count",
          one: "GET /employee/{EMPLID}?asOfDate=YYYY-MM-DD",
        },
        auth: options.username ? "Basic (required)" : "none",
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/employees/count") {
      sendJson(res, 200, {
        status: "success",
        total: countPsBrokerEmployees(asOfDate),
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/employees") {
      const { limit, offset } = readPagination(url);
      const total = countPsBrokerEmployees(asOfDate);
      const rows = listPsBrokerEmployees(asOfDate, limit, offset);
      sendJson(res, 200, psBrokerListResponse(rows, total, offset));
      return;
    }

    const employeeMatch = url.pathname.match(/^\/employee\/([^/]+)$/);
    if (req.method === "GET" && employeeMatch) {
      const emplid = decodeURIComponent(employeeMatch[1] ?? "");
      const row = getPsBrokerEmployee(emplid, asOfDate);
      if (!row) {
        sendText(res, 404, `Employee not found: ${emplid}`);
        return;
      }
      sendJson(res, 200, row);
      return;
    }

    sendJson(res, 404, {
      error: "Not found",
      path: url.pathname,
      hint: "Try GET /employees or GET /employee/100001",
    });
  });
}

export async function listenMockIntegrationBroker(
  options: MockIntegrationBrokerOptions,
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createMockIntegrationBrokerServer(options);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, () => resolve());
  });

  const url = `http://localhost:${options.port}`;
  return {
    url,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
