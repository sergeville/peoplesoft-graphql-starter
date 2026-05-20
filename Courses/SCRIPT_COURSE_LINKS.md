# Scripts ↔ course links

**Two-way index:** course text links to scripts here; script files link back with `Course:` / `To pick:` headers.

**Main course:** [COURSE.md](./COURSE.md) · **Course hub:** [README.md](./README.md)

When several modules apply, pick the one you are teaching (**To pick**).

---

## By course module (course → script)

| Course | Topic / lab | Run | Script or entry file |
|--------|-------------|-----|----------------------|
| [Module 0](./COURSE.md#module-0--setup--first-run) | First run | `npm run dev` | [`backend/src/server.ts`](../backend/src/server.ts), [`frontend/package.json`](../frontend/package.json) |
| [Module 1](./COURSE.md#module-1--why-this-architecture-exists) | Team boundary in code | (read) | [`employeeService.ts`](../backend/src/services/employeeService.ts), [`integrationBrokerClient.ts`](../backend/src/peoplesoft/integrationBrokerClient.ts) — [TEAM_BOUNDARIES](./TEAM_BOUNDARIES.md) |
| [Module 2](./COURSE.md#module-2--the-three-runtimes-ports) | Ports, conflicts | `npm run dev`, `npm run stack:stop` | [`scripts/stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) |
| [Module 3](./COURSE.md#module-3--graphql-contract) | Apollo Sandbox | `npm run dev:backend` | [`backend/src/server.ts`](../backend/src/server.ts), [`graphql/schema.ts`](../backend/src/graphql/schema.ts) |
| [Module 4](./COURSE.md#module-4--backend-boot-flow) | Boot sequence | `npm run dev:backend`, `npm run typecheck` | [`server.ts`](../backend/src/server.ts), [`bootstrapMockData.ts`](../backend/src/peoplesoft/bootstrapMockData.ts) |
| [Module 5](./COURSE.md#module-5--resolvers--employeeservice) | Resolvers trace | `npm run dev:backend` | [`resolvers/index.ts`](../backend/src/resolvers/index.ts), [`employeeService.ts`](../backend/src/services/employeeService.ts) |
| [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) | CSV / Sheets | `npm run export:employees`, `npm run sync:sheet` | [`export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts), [`sync-employees-from-sheet.ts`](../backend/scripts/sync-employees-from-sheet.ts) |
| [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) | Sheet workflow | same as Module 6 | same scripts |
| [Module 7](./COURSE.md#module-7--mock-integration-broker) | Mock IB :4100 | `npm run dev:mock-ps`, `npm run mock-ib` | [`mock-ib-server.ts`](../backend/src/mock-ib-server.ts), [`mockIntegrationBroker/server.ts`](../backend/src/peoplesoft/mockIntegrationBroker/server.ts) |
| [Module 7b](./COURSE.md#module-7b--docker-mock-stack--integration-broker-configure-map) | Docker stack | `npm run stack:docker`, `npm run stack:stop` | [`docker-compose.yml`](../docker-compose.yml), [`stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) |
| [Module 8](./COURSE.md#module-8--frontend-nextjs--apollo-client) | UI only | `npm run dev:frontend` | [`frontend/package.json`](../frontend/package.json), [`apollo-client.ts`](../frontend/lib/apollo-client.ts) |
| [Module 9](./COURSE.md#module-9--crud-mutations--forms) | CRUD UI | `npm run dev` or `npm run dev:mock-ps` | [`EmployeeForm.tsx`](../frontend/components/EmployeeForm.tsx) — [CODE_PATH](./CODE_PATH_GRAPHQL_TO_PS.md) |
| [Module 10](./COURSE.md#module-10--pagination--effective-dating) | List paging | `npm run dev` | [`EmployeeList.tsx`](../frontend/components/EmployeeList.tsx), [`effectiveDating.ts`](../backend/src/peoplesoft/effectiveDating.ts) |
| [Module 11](./COURSE.md#module-11--real-peoplesoft--row-security) | Production IB | (env only) | [`integrationBrokerClient.ts`](../backend/src/peoplesoft/integrationBrokerClient.ts) — [PEOPLESOFT_IB_ROW_SECURITY](./PEOPLESOFT_IB_ROW_SECURITY.md) |
| [Module 12](./COURSE.md#module-12--capstone-project) | Ship / ops | `npm run build`, `npm run stack:docker` | root + `backend/` + `frontend/` `package.json` |
| [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | Agents → MCP Server → MCP Apps Client | `npm run dev:mcp`, `npm run dev:with-mcp`, `npm run mcp:inspect` | [`apollo-mcp/`](../apollo-mcp/), [`run-apollo-mcp.sh`](../scripts/run-apollo-mcp.sh) |
| [GOOGLE_SHEET_AS_MOCK_PS](./GOOGLE_SHEET_AS_MOCK_PS.md) | Sheet as mock PS | `npm run dev` | [`google-apps-script-mock-ps.gs`](./google-apps-script-mock-ps.gs) |
| [CODE_PATH](./CODE_PATH_GRAPHQL_TO_PS.md) | End-to-end trace | Mode A: `dev`; B: `dev:mock-ps` | See [CODE_PATH](./CODE_PATH_GRAPHQL_TO_PS.md) |
| [Troubleshooting](./COURSE.md#troubleshooting-guide) | Free ports | `npm run stack:stop` | [`stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) |
| [README versioning](../README.md#versioning) | Patch on commit | `npm run version:patch` | [`bump-patch-version.mjs`](../scripts/bump-patch-version.mjs), [`.githooks/pre-commit`](../.githooks/pre-commit) |

---

## By supplemental doc (doc → script)

| Doc | Run | Script / entry |
|-----|-----|----------------|
| [TEAM_BOUNDARIES](./TEAM_BOUNDARIES.md) | `dev:mock-ps` (To pick) | Side 2 trace — [`integrationBrokerClient.ts`](../backend/src/peoplesoft/integrationBrokerClient.ts) |
| [CODE_PATH](./CODE_PATH_GRAPHQL_TO_PS.md) | `dev`, `dev:mock-ps`, `export:employees` | Modes A/B/C in that doc |
| [DOCKER_AND_IB](./DOCKER_AND_IB_CONFIGURE.md) | `stack:docker`, `stack:stop` | [`docker-compose.yml`](../docker-compose.yml) |
| [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) | `export:employees`, `sync:sheet` | `backend/scripts/*.ts` |
| [GOOGLE_SHEET_AS_MOCK_PS](./GOOGLE_SHEET_AS_MOCK_PS.md) | `dev` | [`google-apps-script-mock-ps.gs`](./google-apps-script-mock-ps.gs) |
| [PEOPLESOFT_IB_ROW_SECURITY](./PEOPLESOFT_IB_ROW_SECURITY.md) | `dev:mock-ps` (demo); prod: real URL | No new scripts — config + BFF code |

---

## npm commands (root `package.json`)

| Command | Script / entry | Primary course | To pick |
|---------|----------------|----------------|---------|
| `npm run dev` | `server.ts` + Next `dev` | [Module 0](./COURSE.md#module-0--setup--first-run) | [Module 2](./COURSE.md#module-2--the-three-runtimes-ports), [8](./COURSE.md#module-8--frontend-nextjs--apollo-client) |
| `npm run dev:mock-ps` | `mock-ib-server.ts` + `server.ts` + Next | [Module 7](./COURSE.md#module-7--mock-integration-broker) | [Module 2](./COURSE.md#module-2--the-three-runtimes-ports), [CODE_PATH § B](./CODE_PATH_GRAPHQL_TO_PS.md#mode-b--graphql--http--mock-ps-see-fetch) |
| `npm run dev:backend` | [`server.ts`](../backend/src/server.ts) | [Module 4](./COURSE.md#module-4--backend-boot-flow) | [Module 3](./COURSE.md#module-3--graphql-contract), [5](./COURSE.md#module-5--resolvers--employeeservice) |
| `npm run dev:frontend` | Next `dev` | [Module 8](./COURSE.md#module-8--frontend-nextjs--apollo-client) | [Module 9](./COURSE.md#module-9--crud-mutations--forms) |
| `npm run mock-ib` | [`mock-ib-server.ts`](../backend/src/mock-ib-server.ts) | [Module 7](./COURSE.md#module-7--mock-integration-broker) | [DOCKER § A](./DOCKER_AND_IB_CONFIGURE.md#part-a--docker-mock-stack-your-machine) |
| `npm run export:employees` | [`export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts) | [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) | [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) |
| `npm run sync:sheet` | [`sync-employees-from-sheet.ts`](../backend/scripts/sync-employees-from-sheet.ts) | [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) | [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) |
| `npm run build` | `tsc` + `next build` | [Module 12](./COURSE.md#module-12--capstone-project) | [Module 7b](./COURSE.md#module-7b--docker-mock-stack--integration-broker-configure-map) |
| `npm run stack:docker` | [`docker-compose.yml`](../docker-compose.yml) | [Module 7b](./COURSE.md#module-7b--docker-mock-stack--integration-broker-configure-map) | [DOCKER_AND_IB](./DOCKER_AND_IB_CONFIGURE.md) |
| `npm run stack:stop` | [`stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) | [Module 2](./COURSE.md#module-2--the-three-runtimes-ports) | [Troubleshooting](./COURSE.md#troubleshooting-guide) |
| `npm run version:patch` | [`bump-patch-version.mjs`](../scripts/bump-patch-version.mjs) | [README § Versioning](../README.md#versioning) | — |
| `npm run prepare` | [`setup-git-hooks.mjs`](../scripts/setup-git-hooks.mjs) | [README § Versioning](../README.md#versioning) | — |
| `npm run dev:mcp` | [`run-apollo-mcp.sh`](../scripts/run-apollo-mcp.sh) → Docker or `.apollo-mcp/bin` | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |
| `npm run dev:with-mcp` | `server.ts` + MCP | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |
| `npm run mcp:install` | [`install-apollo-mcp.sh`](../scripts/install-apollo-mcp.sh) | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |
| `npm run mcp:inspect` | MCP Inspector CLI | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |

---

## npm commands (`backend/package.json`)

| Command | Entry | Primary course | To pick |
|---------|-------|----------------|---------|
| `dev` | [`server.ts`](../backend/src/server.ts) | [Module 4](./COURSE.md#module-4--backend-boot-flow) | [Module 3](./COURSE.md#module-3--graphql-contract) |
| `mock-ib` | [`mock-ib-server.ts`](../backend/src/mock-ib-server.ts) | [Module 7](./COURSE.md#module-7--mock-integration-broker) | [DOCKER § A](./DOCKER_AND_IB_CONFIGURE.md#part-a--docker-mock-stack-your-machine) |
| `export:employees` | [`export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts) | [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) | [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) |
| `sync:sheet` | [`sync-employees-from-sheet.ts`](../backend/scripts/sync-employees-from-sheet.ts) | [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) | [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) |
| `typecheck` | `tsc --noEmit` | [Module 4](./COURSE.md#module-4--backend-boot-flow) | [Module 5](./COURSE.md#module-5--resolvers--employeeservice) |
| `build` / `start` | compiled `dist/` | [Module 12](./COURSE.md#module-12--capstone-project) | — |

---

## npm commands (`frontend/package.json`)

| Command | Entry | Primary course | To pick |
|---------|-------|----------------|---------|
| `dev` | Next dev :3000 | [Module 8](./COURSE.md#module-8--frontend-nextjs--apollo-client) | [Module 0](./COURSE.md#module-0--setup--first-run) |
| `build` / `start` | `.next` production | [Module 8](./COURSE.md#module-8--frontend-nextjs--apollo-client) | [Module 12](./COURSE.md#module-12--capstone-project) |
| `lint` | `next lint` | [Module 8](./COURSE.md#module-8--frontend-nextjs--apollo-client) | — |

---

## Script files (`scripts/`, `backend/scripts/`, hooks)

| File | Invoked by | Primary course | To pick |
|------|------------|----------------|---------|
| [`stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) | `stack:stop` | [Module 2](./COURSE.md#module-2--the-three-runtimes-ports) | [Troubleshooting](./COURSE.md#troubleshooting-guide), [7b](./COURSE.md#module-7b--docker-mock-stack--integration-broker-configure-map) |
| [`setup-git-hooks.mjs`](../scripts/setup-git-hooks.mjs) | `prepare` | [README versioning](../README.md#versioning) | — |
| [`bump-patch-version.mjs`](../scripts/bump-patch-version.mjs) | `version:patch`, pre-commit | [README versioning](../README.md#versioning) | — |
| [`export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts) | `export:employees` | [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) | [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) |
| [`sync-employees-from-sheet.ts`](../backend/scripts/sync-employees-from-sheet.ts) | `sync:sheet` | [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) | [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) |
| [`.githooks/pre-commit`](../.githooks/pre-commit) | `git commit` | [README versioning](../README.md#versioning) | — |
| [`google-apps-script-mock-ps.gs`](./google-apps-script-mock-ps.gs) | Deploy in Sheets | [GOOGLE_SHEET_AS_MOCK_PS](./GOOGLE_SHEET_AS_MOCK_PS.md) | [Module 7](./COURSE.md#module-7--mock-integration-broker) |
| [`run-apollo-mcp.sh`](../scripts/run-apollo-mcp.sh) | `dev:mcp` | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |
| [`install-apollo-mcp.sh`](../scripts/install-apollo-mcp.sh) | `mcp:install` | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |
| [`apollo-mcp/mcp.local.yaml`](../apollo-mcp/mcp.local.yaml) | MCP config | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |
| [`apollo-mcp/operations/*.graphql`](../apollo-mcp/operations/) | Named MCP tools | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) | — |

---

## Related course docs

| Topic | Doc |
|-------|-----|
| Full module path | [COURSE.md](./COURSE.md) |
| GraphQL → PS paths | [CODE_PATH_GRAPHQL_TO_PS.md](./CODE_PATH_GRAPHQL_TO_PS.md) |
| Docker + IB map | [DOCKER_AND_IB_CONFIGURE.md](./DOCKER_AND_IB_CONFIGURE.md) |
| Team boundaries | [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md) |
| Row security | [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md) |

---

*When adding a script: add rows to **By course module** and **Script files**; add `Course:` / `To pick:` in the file header; add **Scripts for this module** in `COURSE.md` if it is a lab command.*
