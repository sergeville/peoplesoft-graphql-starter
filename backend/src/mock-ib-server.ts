import "dotenv/config";

import { bootstrapMockData } from "./peoplesoft/bootstrapMockData.js";
import { mockEmployeeCount } from "./peoplesoft/mockJobIndex.js";
import { isDevTraceEnabled } from "./devTrace.js";
import { listenMockIntegrationBroker } from "./peoplesoft/mockIntegrationBroker/server.js";

await bootstrapMockData();

const port = Number(process.env.MOCK_IB_PORT ?? 4100);
const username = process.env.MOCK_IB_USERNAME ?? "demo";
const password = process.env.MOCK_IB_PASSWORD ?? "demo";

const { url, close } = await listenMockIntegrationBroker({
  port,
  username,
  password,
});

console.log(`Mock PeopleSoft Integration Broker REST at ${url}`);
console.log(`  Dataset: ${mockEmployeeCount.toLocaleString()} employees (MOCK_EMPLOYEE_COUNT)`);
console.log(`  GET ${url}/employees`);
console.log(`  GET ${url}/employee/100001`);
console.log(`  Basic auth: ${username} / (password in MOCK_IB_PASSWORD)`);
if (isDevTraceEnabled()) {
  console.log("  Dev trace: ON — filter logs with [trace] mock-ib (pairs with backend [trace])");
}

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  await close();
  process.exit(0);
};

for (const signal of ["SIGINT", "SIGTERM", "SIGUSR2"] as const) {
  process.on(signal, () => void shutdown());
}
