# Code path: GraphQL → PeopleSoft (mock)

Trace every layer when you click **Save** or load the employee list.

**Org context (app team vs PeopleSoft team):** [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md)

**Scripts by mode:** [SCRIPT_COURSE_LINKS](./SCRIPT_COURSE_LINKS.md#by-course-module-course--script) · Mode B: [`npm run dev:mock-ps`](../package.json) → [`mock-ib-server.ts`](../backend/src/mock-ib-server.ts) · Mode A CSV: [`npm run export:employees`](../package.json) → [`export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts)

## Two modes in this project

| Mode | `PEOPLESOFT_DATA_SOURCE` | Where data lives | See HTTP calls? |
|------|------------------------|------------------|-----------------|
| **A. Direct mock** | `mock` | `employeeStore.ts` → `employees.csv` | No HTTP |
| **B. Integration Broker** | `integration-broker` | HTTP → mock PS on :4100 (or real PS / Google Apps Script) | **Yes** |

To **see the call in code**, use mode **B**.

---

## Mode A — GraphQL → CSV (current default)

**Course:** [Module 6](./COURSE.md#module-6--peoplesoft-data-layer-mock--csv) · **Run:** [`npm run dev`](../package.json) · **Data scripts:** [`export-employees-csv.ts`](../backend/scripts/export-employees-csv.ts), [`sync-employees-from-sheet.ts`](../backend/scripts/sync-employees-from-sheet.ts)

```text
Browser (EmployeeForm.tsx)
  useMutation(createEmployee | updateEmployee)
    → POST http://localhost:3000/api/graphql

Next.js rewrite (next.config.ts)
    → POST http://localhost:4000/

Apollo resolvers (resolvers/index.ts)
  Mutation.createEmployee → employeeService.createEmployee()

EmployeeService (employeeService.ts)
  if dataSource === "mock" → createEmployeeInStore()

EmployeeStore (employeeStore.ts)
  allJobRows.push(...)
  persistToCsv()  →  backend/data/employees.csv
```

**Files to open:**

1. `frontend/components/EmployeeForm.tsx` — `useMutation`, `handleSubmit`
2. `backend/src/resolvers/index.ts` — `Mutation.createEmployee`
3. `backend/src/services/employeeService.ts` — `createEmployee`
4. `backend/src/peoplesoft/employeeStore.ts` — `createEmployeeInStore`, `persistToCsv`

Google Sheet is **not** in this path. Update Sheet manually: **File → Import** `employees.csv`.

---

## Mode B — GraphQL → HTTP → Mock PS (see `fetch`)

**Course:** [Module 7](./COURSE.md#module-7--mock-integration-broker) · **Run:** [`npm run dev:mock-ps`](../package.json) · **Mock server:** [`mock-ib-server.ts`](../backend/src/mock-ib-server.ts)

### Read (employee list)

```text
EmployeeList.tsx
  useQuery(GET_EMPLOYEES_PAGE)
    → POST /api/graphql

resolvers/index.ts
  Query.employees → employeeService.listEmployees()

employeeService.ts
  if integration-broker → integrationBrokerClient.fetchEmployees()
    → fetch("http://localhost:4100/employees?limit=50&offset=0")   ← LOOK HERE

integrationBrokerClient.ts  (fetchEmployees → request())
  buildUrl("/employees") + Authorization: Basic ...
  console.log `[Integration Broker] GET …` in backend terminal
  response.json() → mapIntegrationBrokerEmployee()

mockIntegrationBroker/server.ts
  GET /employees → listPsBrokerEmployees() → JSON rows

mappers.ts
  EMPLID, NAME, EMAIL_ADDR → EmployeeRecord
```

### Write (add / edit / delete)

```text
EmployeeForm.tsx
  useMutation(CREATE_EMPLOYEE)

resolvers/index.ts
  Mutation.createEmployee

employeeService.ts
  integration-broker → integrationBrokerClient.createEmployee(input)
    → fetch("http://localhost:4100/employees", { method: "POST", body: JSON })

mockIntegrationBroker/server.ts
  POST /employees → createEmployeeInStore() → employees.csv
  console.log("[Mock PS IB] POST /employees", ...)
```

**Open `integrationBrokerClient.ts`** — every `fetch()` is the “call to PeopleSoft” (mock or real).

---

## Run mode B locally (mock IB on :4100)

**Terminal 1 — repo root:**

```bash
cd ~/Documents/Projects/peoplesoft-graphql-starter
cp backend/.env.mock-ib.example backend/.env
npm run dev:mock-ps   # mock-ib-server.ts + server.ts + frontend — Module 7
```

**`backend/.env`:**

```env
PEOPLESOFT_DATA_SOURCE=integration-broker
PS_BASE_URL=http://localhost:4100
PS_USERNAME=demo
PS_PASSWORD=demo
```

Watch terminals when you use the UI (`npm run dev:mock-ps` labels them **`[backend]`** and **`[mock-ps]`**):

```text
[backend]  [Integration Broker] GET http://localhost:4100/employees?limit=50&offset=0
[mock-ps]  [Mock PS IB] GET /employees?limit=50&offset=0
[mock-ps]  [Mock PS IB] POST /employees
[mock-ps]  [Mock PS IB] PUT /employee/100002
[mock-ps]  [Mock PS IB] DELETE /employee/100099
```

---

## Mode C — GraphQL → Google Sheet as mock PS (Apps Script)

**Course:** [GOOGLE_SHEET_AS_MOCK_PS](./GOOGLE_SHEET_AS_MOCK_PS.md) · **Run:** [`npm run dev`](../package.json) · **Deploy:** [`google-apps-script-mock-ps.gs`](./google-apps-script-mock-ps.gs)

Your sheet can **be** the mock PeopleSoft server:

1. Deploy script: [google-apps-script-mock-ps.gs](./google-apps-script-mock-ps.gs) (see [GOOGLE_SHEET_AS_MOCK_PS.md](./GOOGLE_SHEET_AS_MOCK_PS.md))
2. Set `PS_BASE_URL` to the Apps Script web app URL
3. Same `integrationBrokerClient.ts` `fetch()` calls — but data reads/writes **your Sheet**

```text
GraphQL → integrationBrokerClient.fetch()
       → https://script.google.com/macros/s/.../exec?path=employees
       → Apps Script reads/writes spreadsheet "Peoplesoft muck"
```

---

## Real PeopleSoft (production)

**Course:** [Module 11](./COURSE.md#module-11--real-peoplesoft--row-security) · [PEOPLESOFT_IB_ROW_SECURITY](./PEOPLESOFT_IB_ROW_SECURITY.md)

Same client file, different URL:

```env
PS_BASE_URL=https://your-peoplesoft-host/.../your-rest-base
```

Only change: `integrationBrokerClient.ts` paths + `mappers.ts` field names.  
GraphQL and frontend stay the same.

---

## Quick file map

| Layer | File |
|-------|------|
| UI | `frontend/components/EmployeeList.tsx`, `EmployeeForm.tsx` |
| GraphQL contract | `backend/src/graphql/schema.ts` |
| GraphQL → service | `backend/src/resolvers/index.ts` |
| Source switch | `backend/src/services/employeeService.ts` |
| **HTTP to PS** | `backend/src/peoplesoft/integrationBrokerClient.ts` |
| PS JSON mapping | `backend/src/peoplesoft/mappers.ts` |
| Mock PS server | `backend/src/mock-ib-server.ts`, `mockIntegrationBroker/server.ts` |
| Direct CSV (no HTTP) | `backend/src/peoplesoft/employeeStore.ts` |

**Command index:** [SCRIPT_COURSE_LINKS.md](./SCRIPT_COURSE_LINKS.md)
