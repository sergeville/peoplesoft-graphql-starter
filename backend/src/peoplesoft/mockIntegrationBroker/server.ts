import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

import {
  createEmployeeInStore,
  deleteEmployeeFromStore,
  terminateEmployeeInStore,
  updateEmployeeInStore,
  type EmployeeWriteInput,
} from "../employeeStore.js";
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

/** Why: IB list/get accept asOfDate query param; extract once so every route applies the same PS temporal filter. */
function readAsOfDate(url: URL): string | null {
  return url.searchParams.get("asOfDate");
}

/** Why: Normalize limit/offset and page/pageSize so the mock IB matches real PS pagination contracts. */
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

/** Why: Decode Basic credentials for mock IB auth parity with production Integration Broker. */
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

/** Why: Optional mock credentials let Mode B exercises fail like real PS when auth is wrong. */
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

/** Why: Consistent JSON + mock header so clients can tell course traffic from a real PS host. */
function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "X-Mock-PeopleSoft-IB": "true",
  });
  res.end(JSON.stringify(body, null, 2));
}

/** Why: Plain-text errors for bad requests mirror simple IB failure bodies without JSON parsing. */
function sendText(res: ServerResponse, status: number, message: string) {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(message);
}

/** Why: Request logging helps trace GraphQL→IB→store flow during local Mode B debugging. */
function logRequest(method: string, path: string) {
  console.log(`[Mock PS IB] ${method} ${path}`);
}

/** Why: POST/PUT bodies must be parsed once into a neutral object before PS field mapping. */
async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

/**
 * Why: IB JSON may use camelCase or PS HR_STATUS; normalize to store input so mock IB and
 * GraphQL mutations share one write shape against employeeStore.
 * Course: Module 7
 */
function bodyToWriteInput(body: Record<string, unknown>): EmployeeWriteInput {
  return {
    emplid: body.emplid != null ? String(body.emplid) : null,
    name: String(body.name ?? ""),
    email: body.email != null ? String(body.email) : null,
    department: body.department != null ? String(body.department) : null,
    position: body.position != null ? String(body.position) : null,
    salary:
      typeof body.salary === "number"
        ? body.salary
        : body.salary != null
          ? Number.parseFloat(String(body.salary))
          : null,
    managerEmplid:
      body.managerEmplid != null
        ? String(body.managerEmplid)
        : body.manager_emplid != null
          ? String(body.manager_emplid)
          : null,
    effdt: body.effdt != null ? String(body.effdt) : null,
    hrStatus:
      body.hrStatus != null
        ? String(body.hrStatus)
        : body.HR_STATUS != null
          ? String(body.HR_STATUS)
          : null,
  };
}

/**
 * Why: PS terminates via inactive HR_STATUS on PUT, not a separate route — detect so update
 * vs terminate branches match production IB behavior.
 * Course: Module 9 · CODE_PATH § ps-terminate-vs-delete
 */
function isTerminateInput(input: EmployeeWriteInput): boolean {
  const code = (input.hrStatus?.trim() || "").toUpperCase();
  return code === "I" || code === "T";
}

/**
 * Why: Local :4100 IB mimics PS REST so Mode B runs without PeopleTools — same routes the
 * real client calls, backed by employeeStore and PS-shaped payloads.
 * Course: Module 7 · Mode B
 */
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
          list: "GET /employees?limit=50&offset=0",
          count: "GET /employees/count",
          one: "GET /employee/{EMPLID}",
          create: "POST /employees",
          update: "PUT /employee/{EMPLID}",
          delete: "DELETE /employee/{EMPLID}",
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
      logRequest("GET", url.pathname + url.search);
      const { limit, offset } = readPagination(url);
      const total = countPsBrokerEmployees(asOfDate);
      const rows = listPsBrokerEmployees(asOfDate, limit, offset);
      sendJson(res, 200, psBrokerListResponse(rows, total, offset));
      return;
    }

    if (req.method === "POST" && url.pathname === "/employees") {
      logRequest("POST", url.pathname);
      void readJsonBody(req)
        .then((body) => {
          const record = createEmployeeInStore(bodyToWriteInput(body));
          const row = getPsBrokerEmployee(record.emplid, asOfDate);
          if (!row) {
            sendText(res, 500, "Created employee not found in index");
            return;
          }
          sendJson(res, 201, row);
        })
        .catch((err) => sendText(res, 400, String(err)));
      return;
    }

    const employeeMatch = url.pathname.match(/^\/employee\/([^/]+)$/);
    if (req.method === "GET" && employeeMatch) {
      logRequest("GET", url.pathname + url.search);
      const emplid = decodeURIComponent(employeeMatch[1] ?? "");
      const row = getPsBrokerEmployee(emplid, asOfDate);
      if (!row) {
        sendText(res, 404, `Employee not found: ${emplid}`);
        return;
      }
      sendJson(res, 200, row);
      return;
    }

    if (req.method === "PUT" && employeeMatch) {
      logRequest("PUT", url.pathname);
      const emplid = decodeURIComponent(employeeMatch[1] ?? "");
      void readJsonBody(req)
        .then((body) => {
          const input = bodyToWriteInput(body);
          if (isTerminateInput(input)) {
            terminateEmployeeInStore(emplid, input.effdt);
          } else {
            updateEmployeeInStore(emplid, input);
          }
          const row = getPsBrokerEmployee(emplid, asOfDate);
          if (!row) {
            sendText(res, 404, `Employee not found: ${emplid}`);
            return;
          }
          sendJson(res, 200, row);
        })
        .catch((err) => sendText(res, 400, String(err)));
      return;
    }

    if (req.method === "DELETE" && employeeMatch) {
      logRequest("DELETE", url.pathname);
      const emplid = decodeURIComponent(employeeMatch[1] ?? "");
      const terminated = deleteEmployeeFromStore(emplid);
      sendJson(res, 200, { status: "success", terminated, deleted: terminated });
      return;
    }

    sendJson(res, 404, {
      error: "Not found",
      path: url.pathname,
      hint: "Try GET /employees or GET /employee/100001",
    });
  });
}

/**
 * Why: Startup helper binds the mock IB port for dev scripts so PS_BASE_URL can point at
 * localhost without embedding listen logic in every entrypoint.
 * Course: Module 7
 */
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
