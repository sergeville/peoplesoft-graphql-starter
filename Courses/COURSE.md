# Full-Stack Course: PeopleSoft GraphQL Starter

**Audience:** Developers who know JavaScript/TypeScript and want to understand this project from **browser → GraphQL → PeopleSoft (mock and real)**.

**Repo:** `peoplesoft-graphql-starter`  
**Time:** ~12–16 hours (self-paced)  
**Outcome:** You can trace any user action end-to-end, extend the API, and plan a production PeopleSoft Integration Broker integration with row security.

---

## How to use this course

1. Clone/open the repo and complete **Module 0** setup.
2. Do each module in order; **Labs** are hands-on (required).
3. Use **Checkpoint questions** to verify understanding before moving on.
4. Deep dives live in this `Courses/` folder — especially [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md), [CODE_PATH_GRAPHQL_TO_PS.md](./CODE_PATH_GRAPHQL_TO_PS.md).

| Module | Topic | ~Time |
|--------|--------|-------|
| 0 | Setup & first run | 45 min |
| 1 | Why this architecture exists (+ team boundaries) | 1 h |
| 2 | The three runtimes (ports 3000, 4000, 4100) | 1 h |
| 3 | GraphQL contract (schema & Sandbox) | 1.5 h |
| 4 | Backend: Apollo Server boot flow | 1 h |
| 5 | Resolvers & EmployeeService | 1.5 h |
| 6 | PeopleSoft data layer (mock, CSV, store) | 2 h |
| 7 | Mock Integration Broker REST | 1.5 h |
| 8 | Frontend: Next.js + Apollo Client | 2 h |
| 9 | CRUD: mutations & forms | 1.5 h |
| 10 | Pagination & effective dating | 1 h |
| 11 | Real PS Integration Broker & row security | 2 h |
| 12 | Capstone & production checklist | 2 h |

---

## Module 0 — Setup & first run

### Goals

- Run frontend + backend locally.
- Open the employee list and Apollo Sandbox.

### Steps

```bash
cd ~/Documents/Projects/peoplesoft-graphql-starter
npm install
npm install --prefix backend
npm install --prefix frontend
cp backend/.env.example backend/.env
```

Ensure `backend/.env` contains:

```env
PORT=4000
PEOPLESOFT_DATA_SOURCE=mock
MOCK_DATA_SOURCE=auto
```

```bash
npm run dev
```

| URL | What |
|-----|------|
| http://localhost:3000 | Next.js UI |
| http://localhost:4000 | GraphQL (Apollo Sandbox) |

### Lab 0.1

1. Confirm three employees (or paginated list of 1000) on the home page.
2. Open http://localhost:4000 and run:

```graphql
query {
  employeeCount
  employees(limit: 3) {
    emplid
    name
  }
}
```

### Checkpoint

- What port does the **browser** talk to for GraphQL?
- What port does the **GraphQL server** listen on?

<details>
<summary>Answers</summary>

- Browser uses **3000** via `/api/graphql` (Next.js rewrite).
- Apollo listens on **4000**.

</details>

---

## Module 1 — Why this architecture exists

### The problem

PeopleSoft holds HR data in an enterprise database with **effective dating**, **row security**, and complex APIs. A modern React/Next UI should not:

- Connect directly to the database (forbidden, fragile).
- Call dozens of REST endpoints per screen (slow, rigid).
- Duplicate PeopleSoft business rules in the frontend.

### The pattern: BFF + GraphQL

```text
┌────────────┐    GraphQL      ┌─────────────┐    REST/CI     ┌─────────────┐
│  Frontend  │ ──────────────► │  BFF layer  │ ─────────────► │ PeopleSoft  │
│  (Next.js) │   one request   │  (Apollo)   │   secured      │     (IB)    │
└────────────┘   exact fields  └─────────────┘                └─────────────┘
```

**BFF** = Backend-for-Frontend: one API shaped for your UI.  
**GraphQL** = client asks only for the fields it needs.

### Two sides of the system

This repo mirrors how work is often split in the enterprise:

```text
┌─────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  SIDE 1 — Your team (this repo)     │     │  SIDE 2 — PeopleSoft team          │
│  Next.js → GraphQL BFF (:4000)      │     │  Integration Broker REST → PS      │
│  schema, UI, EmployeeService        │────►│  tables, row security, effdt       │
└─────────────────────────────────────┘     └──────────────────────────────────────┘
         GraphQL contract                           HTTP / JSON contract
```

- **Side 1 is always the same:** the browser only calls `/api/graphql`. Your squad owns the schema, resolvers, and frontend.
- **Side 2 depends on config:** `PEOPLESOFT_DATA_SOURCE=mock` uses CSV/memory (no PS team, no HTTP). `integration-broker` uses `integrationBrokerClient.ts` → `fetch(PS_BASE_URL/...)` — the same code path you will use when the PS team delivers a real IB URL.

The frontend **never** talks to PeopleSoft directly. GraphQL is **internal** to your team; REST over Integration Broker is the **handshake with the other team**.

### Team boundaries at work

| Your team delivers | PeopleSoft team delivers |
|--------------------|---------------------------|
| GraphQL types & resolvers | IB service URLs and operations |
| Next.js pages & forms | JSON payloads (`EMPLID`, `NAME`, …) |
| `integrationBrokerClient.ts` (consumer) | Secured endpoints, auth, row security |
| `mappers.ts` (field mapping) | Effective dating & HR rules in PS |

**Local stand-ins** (mock IB :4100, Google Sheet Apps Script) simulate Side 2 so you can build Side 1 before PS is ready — they do not replace the PS team in production.

### Read

- Root [README.md](./README.md) — Architecture & two sides
- [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md) — org split, deliverables, questions for PS team
- [CODE_PATH_GRAPHQL_TO_PS.md](./CODE_PATH_GRAPHQL_TO_PS.md) — trace Save → `fetch()`
- Your notes: `StepGrapQL.md` (concepts)

### Lab 1.1 — Find the team boundary in code

1. Open `backend/src/services/employeeService.ts` — find where `dataSource` switches `mock` vs `integration-broker`.
2. Open `backend/src/peoplesoft/integrationBrokerClient.ts` — every `fetch()` is Side 2.
3. Open `frontend/components/EmployeeForm.tsx` — confirm there is **no** `PS_BASE_URL` or PeopleSoft URL (Side 1 only).

### Checkpoint

- Name two reasons **not** to query `PS_JOB` directly from Next.js.
- What does **effective dating** mean in HR data?
- What API does the **frontend** use vs what API does **your BFF** use to reach PeopleSoft?
- Who typically owns `integrationBrokerClient.ts` vs who implements the REST service behind `PS_BASE_URL`?

<details>
<summary>Answers (team boundaries)</summary>

- Frontend: **GraphQL** to your BFF only.
- BFF → PeopleSoft: **HTTP REST** via Integration Broker (when `integration-broker` is set).
- Your team maintains the client and mappers; the PS team (or their vendor) delivers and operates the IB REST service.

</details>

---

## Module 2 — The three runtimes (ports)

### Map

```text
                    ┌──────────────────────────────────────┐
  Browser :3000     │  Next.js                             │
                    │  • pages (app/)                      │
                    │  • components (EmployeeList, Form)   │
                    │  • rewrite /api/graphql → :4000      │
                    └──────────────────┬───────────────────┘
                                       │
                    ┌──────────────────▼───────────────────┐
  GraphQL :4000     │  Apollo Server (backend/)            │
                    │  • schema + resolvers                │
                    │  • EmployeeService                   │
                    └──────────────────┬───────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │ mock (in-memory/CSV)   │ integration-broker      │
              ▼                        ▼                         │
         mockJobIndex            integrationBrokerClient.ts      │
              │                        │                         │
              │                        ▼                         │
              │              Mock IB :4100 (optional)            │
              │              or real PeopleSoft host             │
              └──────────────────────────────────────────────────┘
```

### Environment switch

| Variable | Values | Effect |
|----------|--------|--------|
| `PEOPLESOFT_DATA_SOURCE` | `mock` \| `integration-broker` | Where EmployeeService reads/writes |
| `MOCK_DATA_SOURCE` | `auto` \| `csv` \| `sheet` \| `generate` | How mock rows load at startup |

**Common mistake:** `PEOPLESOFT_DATA_SOURCE=integration-broker` without anything on port **4100** → `fetch failed`. Use `mock` for UI + CSV, or `npm run dev:mock-ps`.

### Lab 2.1 — Trace a request

1. Open DevTools → Network on http://localhost:3000.
2. Reload home page; find `graphql` POST to `/api/graphql`.
3. Read `frontend/next.config.ts` — find the rewrite rule.
4. Read `frontend/lib/apollo-client.ts` — find the URI.

### Files to bookmark

| File | Role |
|------|------|
| `frontend/next.config.ts` | Proxy GraphQL |
| `frontend/lib/apollo-client.ts` | Apollo Client config |
| `backend/src/server.ts` | Starts Apollo after data bootstrap |
| `package.json` (root) | `npm run dev` runs both processes |

### Checkpoint

- Why does the frontend use `/api/graphql` instead of `http://localhost:4000`?
- Which port is Side 1 only, and which optional port (:4100) stands in for Side 2?

---

## Module 3 — GraphQL contract

### Schema as API documentation

Open `backend/src/graphql/schema.ts`.

```graphql
type Employee {
  emplid: ID!
  name: String!
  ...
}

type Query {
  employees(asOfDate: String, limit: Int, offset: Int): [Employee!]!
  employee(id: ID!, asOfDate: String): Employee
  employeeCount(asOfDate: String): Int!
}

type Mutation {
  createEmployee(input: EmployeeInput!): Employee!
  updateEmployee(emplid: ID!, input: EmployeeInput!): Employee!
  deleteEmployee(emplid: ID!): Boolean!
}
```

- **Query** = read
- **Mutation** = write
- **Type** = shape of data (`Employee`, `JobRecord`)

### Lab 3.1 — Sandbox exercises

At http://localhost:4000:

**List with pagination:**

```graphql
query {
  employeeCount
  employees(limit: 5, offset: 0) {
    emplid
    name
    department
  }
}
```

**One employee + manager (nested field):**

```graphql
query {
  employee(id: "100001") {
    name
    manager {
      emplid
      name
    }
    jobHistory {
      position
      startDate
      salary
    }
  }
}
```

**Effective dating (Jane Doe):**

```graphql
query {
  jane2024: employee(id: "100001", asOfDate: "2024-06-01") {
    name
    position
  }
  jane2026: employee(id: "100001", asOfDate: "2026-06-01") {
    name
    position
  }
}
```

### Lab 3.2 — Intentional error

Run `query { id }` and read the validation error. Understand: **`id` is not on `Query`** — it’s `emplid` on `Employee`.

### Checkpoint

- What is the difference between `employees` and `employee`?
- Why is `manager { name }` valid in a query?

---

## Module 4 — Backend boot flow

### Startup sequence

```text
server.ts
  → dotenv loads backend/.env
  → bootstrapMockData()
       → loadMockJobRows()  (CSV / Sheet / generate)
       → initEmployeeStore(rows)
  → ApolloServer({ typeDefs, resolvers })
  → listen :4000
```

### Files

| File | Purpose |
|------|---------|
| `bootstrapMockData.ts` | Load rows into store + index |
| `loadMockJobRows.ts` | CSV / Google Sheet / generator |
| `employeeStore.ts` | In-memory truth + CSV persist on CRUD |
| `mockJobIndex.ts` | Fast lookup by `emplid` |

### Lab 4.1

1. Start backend with log line: `Loading employees from .../employees.csv`.
2. Change `MOCK_DATA_SOURCE=generate` and `MOCK_EMPLOYEE_COUNT=10`; restart — see generator path in logs.
3. Restore `auto` and CSV.

### Checkpoint

- When does data load — on every request or once at startup?

---

## Module 5 — Resolvers & EmployeeService

### Separation of concerns

```text
GraphQL layer     →  resolvers/index.ts     (HTTP/GraphQL ↔ service calls)
Service layer     →  services/employeeService.ts  (business rules, source switch)
PeopleSoft layer  →  peoplesoft/*           (mock, IB client, dating, CSV)
```

### Resolver example (read path)

```typescript
// resolvers/index.ts
employees: async (_, args, ctx) => {
  const rows = await ctx.employeeService.listEmployees(
    args.asOfDate,
    args.limit,
    args.offset,
  );
  return rows.map((row) => ({ ...row, asOfDate: args.asOfDate ?? null }));
},
```

### EmployeeService switch

```typescript
// mock path → mockJobIndex + effectiveDating
// integration-broker path → integrationBrokerClient.fetch(...)
```

### Context injection

`graphql/context.ts` creates one `EmployeeService` per request (from env).

### Lab 5.1 — Code trace

1. Pick `employees` query in Sandbox.
2. Set a breakpoint or add `console.log` in `listEmployees` (mock branch).
3. Confirm pagination: `limit`/`offset` slice `mockEmplids`.

### Lab 5.2 — Draw a sequence diagram

On paper, trace: `EmployeeList` → `useQuery` → resolver → `listEmployees` → `pickEffectiveRow` → return JSON.

### Checkpoint

- Why don’t resolvers import `mockJobRows` directly?
- What would break if you skipped `EmployeeService`?

---

## Module 6 — PeopleSoft data layer (mock & CSV)

### Mental model: PS_JOB-style rows

One **employee** (`emplid`) can have **many rows** over time (`effdt`, position, salary).  
**Effective dating** picks the row valid on `asOfDate`.

| File | Role |
|------|------|
| `types.ts` | `JobRow`, `EmployeeRecord` |
| `effectiveDating.ts` | `pickEffectiveRow` |
| `jobHistory.ts` | `jobRowToEmployee`, `buildJobHistory` |
| `generateMockJobRows.ts` | 1000 synthetic employees |
| `csvEmployees.ts` | Parse/write CSV |
| `data/employees.csv` | Editable dataset |

### Google Sheets workflow

See [GOOGLE_SHEETS.md](./GOOGLE_SHEETS.md).

```bash
npm run export:employees   # CSV from generator
npm run sync:sheet         # Pull published Sheet → CSV
```

### Lab 6.1

1. Edit `employees.csv` — change Jane Doe’s department.
2. Restart backend; confirm UI update.
3. Import CSV to Google Sheets; edit one row; download back to `employees.csv`; restart.

### Checkpoint

- Why are Jane’s two rows both `emplid: 100001`?
- Where is the “source of truth” in dev mode after CRUD?

---

## Module 7 — Mock Integration Broker

### Why mock IB?

To practice the **`integration-broker`** code path without a PeopleSoft environment.

```bash
cp backend/.env.mock-ib.example backend/.env
# Then set PEOPLESOFT_DATA_SOURCE=integration-broker for IB path only, OR use dev:mock-ps
npm run dev:mock-ps
```

Three processes: **mock-ps :4100**, **backend :4000**, **frontend :3000**.

### PS-shaped JSON

Mock returns `EMPLID`, `EMAIL_ADDR`, etc.  
`mappers.ts` converts → internal `EmployeeRecord`.

### Lab 7.1

```bash
curl -u demo:demo "http://localhost:4100/employees?limit=2"
curl -u demo:demo "http://localhost:4100/employee/100001"
```

Read `mockIntegrationBroker/server.ts` and `payloads.ts`.

### Lab 7.2 — Compare paths

| Config | Data path |
|--------|-----------|
| `PEOPLESOFT_DATA_SOURCE=mock` | Memory/CSV, no HTTP to 4100 |
| `PEOPLESOFT_DATA_SOURCE=integration-broker` + `PS_BASE_URL=http://localhost:4100` | HTTP to mock IB |

### Checkpoint

- What does `integrationBrokerClient.ts` do?
- Why is `mappers.ts` required?

---

## Module 8 — Frontend: Next.js + Apollo Client

### App Router structure

```text
frontend/app/
  layout.tsx          # ApolloWrapper wraps app
  page.tsx            # Home → EmployeeList
  employee/[id]/page.tsx  # Detail → EmployeeDetail
frontend/components/
  EmployeeList.tsx
  EmployeeDetail.tsx
  EmployeeForm.tsx
  ApolloWrapper.tsx
```

### Client components

Files with `"use client"` use hooks (`useQuery`, `useMutation`, `useState`).

### Data fetching pattern

```typescript
const { data, loading, error } = useQuery(GET_EMPLOYEES_PAGE, {
  variables: { limit: 50, offset: 0 },
});
```

Apollo Client:

1. Sends POST to `/api/graphql`
2. Caches by query name
3. Re-renders on data/error/loading

### Lab 8.1

1. In `EmployeeList.tsx`, find `GET_EMPLOYEES_PAGE` — list fields requested.
2. Add `position` to the query (if not present) and confirm UI shows it.
3. Open React DevTools — find Apollo cache.

### Lab 8.2 — Detail page

1. Navigate to Jane Doe; use date picker + Apply.
2. Trace `EmployeeDetail.tsx` → `GET_EMPLOYEE` with `asOfDate`.

### Checkpoint

- What is the difference between `page.tsx` and `EmployeeList.tsx`?
- Why is Apollo configured with `uri: "/api/graphql"`?

---

## Module 9 — CRUD: mutations & forms

### GraphQL mutations (backend)

| Mutation | `mock` path | `integration-broker` path |
|----------|-------------|---------------------------|
| `createEmployee` | `createEmployeeInStore` → CSV | `integrationBrokerClient.createEmployee` → HTTP POST |
| `updateEmployee` | `updateEmployeeInStore` → CSV | `integrationBrokerClient.updateEmployee` → HTTP PUT |
| `deleteEmployee` | `deleteEmployeeFromStore` → CSV | `integrationBrokerClient.deleteEmployee` → HTTP DELETE |

Side 1 (resolver) is the same for both; Side 2 is chosen in `employeeService.ts`.

### Frontend flow

```text
EmployeeForm (modal)
  → useMutation(CREATE_EMPLOYEE | UPDATE_EMPLOYEE)
  → refetchQueries: ["GetEmployeesPage"]
EmployeeList
  → Delete button → useMutation(DELETE_EMPLOYEE)
```

### Lab 9.1

1. Add employee via UI; verify new row in `employees.csv`.
2. Edit department; verify CSV.
3. Delete; verify removed from CSV and UI after refetch.

### Lab 9.2 — Mutation in Sandbox

```graphql
mutation {
  createEmployee(input: {
    name: "Test User"
    department: "IT"
    position: "Analyst"
    salary: 70000
  }) {
    emplid
    name
  }
}
```

### Checkpoint

- Where does `createEmployee` go when `PEOPLESOFT_DATA_SOURCE=mock` vs `integration-broker`?
- In production, which team owns the endpoint your BFF calls on save?

---

## Module 10 — Pagination & effective dating

### Pagination

- GraphQL: `employees(limit, offset)` + `employeeCount`
- UI: 50 per page, Previous/Next
- Mock IB: `?limit=50&offset=0`

### Effective dating

- Query arg: `asOfDate: "2024-06-01"`
- Backend: `pickEffectiveRow(rows, asOfDate)`
- UI: date bar on detail page

### Lab 10.1

1. Navigate to page 2 of list — watch `offset: 50` in Network payload.
2. Compare Jane at 2024 vs 2026 (Module 3 query).

### Checkpoint

- Why not return all 1000 employees to the browser at once?

---

## Module 11 — Real PeopleSoft & row security

### Working with the PeopleSoft team

Re-read [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md) before production planning.

Your integration checklist with the PS team:

1. Get **non-prod** `PS_BASE_URL` and test credentials.
2. Obtain **sample JSON** for list / get / write operations.
3. Align **field names** in `mappers.ts` with their payload.
4. Agree how the BFF passes **user identity** so row security applies (see row-security doc below).
5. Do **not** put shared HR admin passwords in the browser — only server-side calls to IB.

### Production path

```text
Manager SSO → Next.js session → GraphQL BFF
  → IB REST as that manager (not shared HR admin)
  → PeopleCode/CI/Query as %OperatorId
  → Row-level security applied
```

### Read thoroughly

[PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md)

### Concepts to internalize

| Topic | Dev (this repo) | Production |
|-------|-----------------|------------|
| Auth | None | SSO + per-user PS token |
| Row security | You edit CSV | PS enforces by operator |
| CRUD | CSV file | IB → Component Interface |
| Delete | Remove CSV rows | Effective-dated correction |

### Lab 11.1 — Design doc (written)

Write half a page answering:

1. Who is the authenticated user?
2. Which IB operations map to list / get / update?
3. How do you prove two managers see different lists?
4. **Team split:** List three deliverables your squad owns vs three the PeopleSoft team owns.

### Checkpoint

- Can Integration Broker bypass row security?
- Why should the browser never hold a shared HR Admin password?

---

## Module 12 — Capstone project

### Choose one track

**Track A — Feature extension**

- Add search: `employees(search: String)` filtering name/emplid.
- Add department filter dropdown on the home page.

**Track B — Integration readiness**

- Document real `PS_BASE_URL` paths and JSON samples in `integrationBrokerClient.ts`.
- Add a one-page **team contract** appendix (your GraphQL vs their IB REST) — use [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md) as template.
- Add `PsAuth` placeholder to `context.ts` (no real SSO required).

**Track C — Operations**

- Add health query: `health { status employeeCount dataSource }`.
- Document runbook: ports, env vars, common errors.

### Deliverables

1. PR or branch with code + README snippet.
2. Sequence diagram of your feature.
3. Demo video or screenshots (optional).

### Grading rubric (self-check)

| Criteria | Done |
|----------|------|
| Traces request across 3 layers | ☐ |
| Can explain Side 1 vs Side 2 and team ownership | ☐ |
| Uses env switches correctly | ☐ |
| Does not break mock/IB modes | ☐ |
| Documents PS security implications | ☐ |

---

## File map (cheat sheet)

```text
FRONTEND
  app/page.tsx                 Home
  app/employee/[id]/page.tsx   Detail route
  components/EmployeeList.tsx  List + pagination + CRUD buttons
  components/EmployeeForm.tsx    Add/Edit modal + mutations
  components/EmployeeDetail.tsx  Detail + date + CRUD
  components/ApolloWrapper.tsx   Apollo provider
  lib/apollo-client.ts         Client URI /api/graphql
  next.config.ts               Rewrite to :4000

BACKEND
  server.ts                    Entry + bootstrap
  graphql/schema.ts            Contract
  graphql/context.ts           DI EmployeeService
  resolvers/index.ts           Query/Mutation/field resolvers
  services/employeeService.ts  Source switch + CRUD
  peoplesoft/employeeStore.ts  Mutable store + CSV
  peoplesoft/loadMockJobRows.ts  Load CSV/sheet/generate
  peoplesoft/integrationBrokerClient.ts  Real/mock IB HTTP
  peoplesoft/mappers.ts        PS JSON → EmployeeRecord
  peoplesoft/effectiveDating.ts
  mock-ib-server.ts            Port 4100
  data/employees.csv           Dataset (runtime mock data)

Courses/
  COURSE.md                    This file
  TEAM_BOUNDARIES.md
  CODE_PATH_GRAPHQL_TO_PS.md
  GOOGLE_SHEETS.md
  PEOPLESOFT_IB_ROW_SECURITY.md

ROOT
  package.json                 dev, dev:mock-ps, export:employees
  README.md
```

---

## Troubleshooting guide

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `fetch failed` on UI | `integration-broker` but nothing on :4100 | `PEOPLESOFT_DATA_SOURCE=mock` or `npm run dev:mock-ps` |
| `EADDRINUSE :4000` | Old backend process | `kill $(lsof -t -iTCP:4000 -sTCP:LISTEN)` |
| Empty list | Bad CSV / empty parse | Check `employees.csv` headers |
| Mutations fail | IB mode | Use `mock` for CSV CRUD |
| Jane title unchanged | Wrong `asOfDate` | Try 2024-06-01 vs 2026-06-01 |
| Sheet sync fails | Missing URL | Set `GOOGLE_SHEET_CSV_URL` in `.env` |

---

## Commands reference

```bash
npm run dev              # Frontend :3000 + Backend :4000
npm run dev:mock-ps      # + Mock IB :4100
npm run dev:backend      # GraphQL only
npm run dev:frontend     # Next.js only
npm run export:employees # Regenerate employees.csv
npm run sync:sheet       # Pull Google Sheet → CSV
npm run typecheck        # Backend tsc (in backend/)
```

---

## Suggested reading order (docs)

1. [README.md](../README.md)
2. [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md)
3. [CODE_PATH_GRAPHQL_TO_PS.md](./CODE_PATH_GRAPHQL_TO_PS.md)
4. [GOOGLE_SHEETS.md](./GOOGLE_SHEETS.md)
5. [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md)
6. Apollo GraphQL docs: https://www.apollographql.com/docs
7. Next.js App Router: https://nextjs.org/docs

---

## Instructor notes (for mentors)

- **Week 1:** Modules 0–5 (architecture + GraphQL + backend).
- **Week 2:** Modules 6–10 (data, IB mock, frontend, CRUD).
- **Week 3:** Module 11–12 (PS security + capstone).

Pair beginners with Sandbox exercises before React.  
Emphasize **env misconfiguration** early to prevent `fetch failed` confusion.

---

*Course version: 1.0 — aligned with peoplesoft-graphql-starter (mock CSV, 1000 employees, CRUD, mock IB, pagination).*
