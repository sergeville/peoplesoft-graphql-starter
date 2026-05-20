# Courses — PeopleSoft GraphQL Starter

Hands-on curriculum: **browser → GraphQL BFF → PeopleSoft (mock CSV, mock IB, Docker, real IB)**.

**Terminology:** **Modules** 0–12 are the core path. **Sections** (e.g. **Section 13**) are optional advanced topics — not “sessions.”

---

## Start here

| Doc | Use when |
|-----|----------|
| **[COURSE.md](./COURSE.md)** | Main path — Modules 0–12, labs, checkpoints |
| **[SCRIPT_COURSE_LINKS.md](./SCRIPT_COURSE_LINKS.md)** | Every `npm run` ↔ script file ↔ module (**two-way**; **To pick** if several modules fit) |

**How the links work**

- Reading a **module** → open **Scripts for this module** (in `COURSE.md`) or the **By course module** table in `SCRIPT_COURSE_LINKS.md`.
- Running a **script** → file header `Course:` / `To pick:` points back to the right module.

---

## Module map (with primary commands)

| Module | Topic | Primary `npm run` | Deep dive |
|--------|--------|-------------------|-----------|
| 0 | Setup & first run | `dev` | — |
| 1 | Architecture & team boundaries | (read-only) | [TEAM_BOUNDARIES](./TEAM_BOUNDARIES.md) |
| 2 | Three runtimes (ports) | `dev`, `stack:stop` | — |
| 3 | GraphQL contract | `dev:backend` | Sandbox :4000 |
| 4 | Backend boot | `dev:backend`, `typecheck` | [`server.ts`](../backend/src/server.ts) |
| 5 | Resolvers & service | `dev:backend` | — |
| 6 | Mock data & CSV | `export:employees`, `sync:sheet` | [GOOGLE_SHEETS](./GOOGLE_SHEETS.md) |
| 7 | Mock Integration Broker | `dev:mock-ps`, `mock-ib` | [CODE_PATH](CODE_PATH_GRAPHQL_TO_PS.md) |
| 7b | Docker mock stack | `stack:docker`, `stack:stop` | [DOCKER_AND_IB](./DOCKER_AND_IB_CONFIGURE.md) |
| 8 | Frontend (Next.js + Apollo) | `dev:frontend`, `dev` | — |
| 9 | CRUD mutations & forms | `dev` (mock) or `dev:mock-ps` | [CODE_PATH](CODE_PATH_GRAPHQL_TO_PS.md) |
| 10 | Pagination & effective dating | `dev` | — |
| 11 | Real PS & row security | (config + design) | [PEOPLESOFT_IB_ROW_SECURITY](./PEOPLESOFT_IB_ROW_SECURITY.md) |
| 12 | Capstone | `build`, `stack:docker` | — |
| **§13** | **Advanced: Agents → MCP Server → MCP Apps Client** (optional) | `dev:with-mcp`, `dev:mcp` | [Section 13](./MODULE_13_APOLLO_MCP_AGENTS.md) — what to change at each layer |

Full command list: **[SCRIPT_COURSE_LINKS.md](./SCRIPT_COURSE_LINKS.md)**.

---

## Supplemental readings

| Doc | Topic | Typical commands |
|-----|--------|------------------|
| [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md) | App team vs PeopleSoft team | — (concepts); trace with `dev:mock-ps` |
| [CODE_PATH_GRAPHQL_TO_PS.md](CODE_PATH_GRAPHQL_TO_PS.md) | Trace Save → `fetch()`; [two-way PS mapping](CODE_PATH_GRAPHQL_TO_PS.md#two-way-mapping) | `dev`, `dev:mock-ps`, `export:employees` |
| [DOCKER_AND_IB_CONFIGURE.md](./DOCKER_AND_IB_CONFIGURE.md) | Docker + IB map; **dev vs prod** + production `.env` | `stack:docker`, `stack:stop` |
| [GOOGLE_SHEETS.md](./GOOGLE_SHEETS.md) | Edit mock data in Sheets | `export:employees`, `sync:sheet` |
| [GOOGLE_SHEET_AS_MOCK_PS.md](./GOOGLE_SHEET_AS_MOCK_PS.md) | Apps Script as mock PS REST | `dev` + deploy [`google-apps-script-mock-ps.gs`](./google-apps-script-mock-ps.gs) |
| [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md) | Row security in production | `dev:mock-ps` (compare); real `PS_BASE_URL` in prod |
| [MODULE_13_APOLLO_MCP_AGENTS.md](./MODULE_13_APOLLO_MCP_AGENTS.md) | **Agents** / **Apollo MCP Server** / **MCP Apps Client** — diffs vs core course | `dev:mcp`, `dev:with-mcp`, `mcp:inspect` |

---

## Repo paths learners touch

| Path | Role |
|------|------|
| `backend/data/employees.csv` | Runtime mock dataset (Module 6) |
| `backend/scripts/*.ts` | `export:employees`, `sync:sheet` |
| `scripts/stop-dev-stack.sh` | `stack:stop` — free ports |
| `docker-compose.yml` | `stack:docker` — mock stack |
| `Courses/` | All course markdown + Apps Script |

---

## Suggested order

1. [COURSE.md](./COURSE.md) Modules **0 → 12** in sequence  
2. [SCRIPT_COURSE_LINKS.md](./SCRIPT_COURSE_LINKS.md) whenever you run a command  
3. Supplemental docs as linked from each module’s **Read** section  

External: [Apollo GraphQL](https://www.apollographql.com/docs) · [Next.js App Router](https://nextjs.org/docs)
