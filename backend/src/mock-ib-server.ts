import "dotenv/config";

import { bootstrapMockData } from "./peoplesoft/bootstrapMockData.js";
import { mockEmployeeCount } from "./peoplesoft/mockJobIndex.js";
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

const shutdown = async () => {
  await close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
