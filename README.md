# PeopleSoft GraphQL Starter

Next.js UI → Apollo GraphQL (port **4000**) → **mock** PeopleSoft data → swap to **Integration Broker REST**.

**Full-stack course (frontend → backend → PeopleSoft):** [Courses/COURSE.md](./Courses/COURSE.md)  
**App team vs PeopleSoft team (org boundaries):** [Courses/TEAM_BOUNDARIES.md](./Courses/TEAM_BOUNDARIES.md)

## Versioning

Current version: **0.0.1** (see `package.json`).

After `npm install`, a **pre-commit hook** bumps the **patch** version on every commit (`0.0.1` → `0.0.2` → …) in root, `backend/`, and `frontend/` `package.json` files.

Skip once: `SKIP_VERSION_BUMP=1 git commit -m "your message"`

Manual bump: `npm run version:patch`

## Docker (mock PeopleSoft — no real PS site)

Runs the full stack with a **mock Integration Broker** pretending to be PeopleSoft on your network:

```text
frontend :3000  →  backend :4000  →  mock-ps :4100  (fake IB REST)
```

```bash
docker compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Next.js UI |
| http://localhost:4000 | GraphQL |
| http://localhost:4100/employees | Mock PS REST (Basic `demo` / `demo`) |

For your **real** site later, see `docker-compose.real-ps.example.yml` (set `PS_BASE_URL` to Integration Broker — not direct Oracle DB).

**Course module:** [Courses/DOCKER_AND_IB_CONFIGURE.md](./Courses/DOCKER_AND_IB_CONFIGURE.md) · IB comment map in `docker-compose.yml`

## Quick start

```bash
cd ~/Documents/Projects/peoplesoft-graphql-starter
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

- Frontend: <http://localhost:3000>
- GraphQL: <http://localhost:4000> (proxied via Next.js at `/api/graphql`)

## Architecture

```text
Browser
  → Next.js (3000)  /api/graphql rewrite
  → Apollo Server (4000)
  → EmployeeService
  → mock data | Integration Broker REST
```

### Two sides (and why it matters at work)

In many organizations **your app team** owns Side 1; a **PeopleSoft team** owns Side 2.

| Side | What | Contract |
|------|------|----------|
| **1 — App** | Next.js UI + GraphQL BFF (ports 3000 / 4000) | GraphQL (`employees`, mutations) — **your** frontend only talks here |
| **2 — PeopleSoft** | Integration Broker REST (or local stand-in) | HTTP + JSON (`EMPLID`, `EMAIL_ADDR`, …) — **between teams**, not GraphQL |

```text
┌─────────────────────────────┐         ┌────────────────────────────────┐
│  Side 1 (this repo)         │         │  Side 2 (often another team) │
│  Frontend → GraphQL BFF     │  HTTP   │  Integration Broker → PS       │
└─────────────────────────────┘         └────────────────────────────────┘
```

- **`PEOPLESOFT_DATA_SOURCE=mock`** — Side 2 is local CSV/memory (no PS team, no HTTP).
- **`PEOPLESOFT_DATA_SOURCE=integration-broker`** — Side 2 is `integrationBrokerClient.ts` → `PS_BASE_URL` (real PS, mock IB on :4100, or [Google Sheet via Apps Script](./Courses/GOOGLE_SHEET_AS_MOCK_PS.md)).

**Study the PS boundary in:** `backend/src/peoplesoft/integrationBrokerClient.ts`  
**Full write-up:** [Courses/TEAM_BOUNDARIES.md](./Courses/TEAM_BOUNDARIES.md) · [Courses/CODE_PATH_GRAPHQL_TO_PS.md](./Courses/CODE_PATH_GRAPHQL_TO_PS.md)

## Edit employees in Google Sheets

1. `npm run export:employees` → creates `backend/data/employees.csv`
2. Import that CSV into [Google Sheets](https://sheets.google.com)
3. Add / edit / delete rows (see [Courses/GOOGLE_SHEETS.md](./Courses/GOOGLE_SHEETS.md) for column headers)
4. Download CSV back **or** `npm run sync:sheet` with a published Sheet URL
5. Restart the backend — data loads into GraphQL objects automatically

## Mock PeopleSoft side (Integration Broker REST)

Simulates what real PS Integration Broker returns (JSON with `EMPLID`, `NAME`, `EMAIL_ADDR`, etc.) on port **4100**.

```bash
cp backend/.env.mock-ib.example backend/.env
npm run dev:mock-ps
```

This starts:

- **mock-ps** — fake IB REST at <http://localhost:4100>
- **backend** — GraphQL calls IB via `PS_BASE_URL` (`integration-broker` mode)
- **frontend** — <http://localhost:3000>

Try the mock IB directly:

```bash
curl -u demo:demo "http://localhost:4100/employees"
curl -u demo:demo "http://localhost:4100/employee/100001?asOfDate=2024-06-01"
```

Code: `backend/src/peoplesoft/mockIntegrationBroker/`

## Swap mock → real Integration Broker

1. Copy `backend/.env.example` values into `backend/.env`
2. Set:

   ```env
   PEOPLESOFT_DATA_SOURCE=integration-broker
   PS_BASE_URL=https://your-host/.../your-rest-base
   PS_USERNAME=...
   PS_PASSWORD=...
   ```

3. Edit `backend/src/peoplesoft/integrationBrokerClient.ts` — set the real REST paths for your delivered IB service
4. Adjust `backend/src/peoplesoft/mappers.ts` for your JSON field names

## GraphQL queries

```graphql
query {
  employees {
    emplid
    name
    email
    department
    manager { name }
  }
}

query {
  employee(id: "100001", asOfDate: "2026-05-18") {
    emplid
    name
    effectiveDate
  }
}
```

## Project layout

```text
backend/src/
  graphql/          # schema
  resolvers/        # GraphQL resolvers
  peoplesoft/       # mock + IB client + mappers
    mockIntegrationBroker/  # mock PS REST (port 4100)
  mock-ib-server.ts # entrypoint for mock PS
  services/         # employeeService (data source switch)
frontend/
  app/              # Next.js pages
  components/       # EmployeeList, ApolloWrapper
  lib/              # Apollo client
```

# Google Sheets as the employee source
https://docs.google.com/spreadsheets/d/e/2PACX-1vQyNmWHCtWVtuiko06XwiKhZaa-2s0OJsixiiJKn9zRB0Fh420g6jkYaCUoY-c9EQSgQIUoLXXWQq6D/pub?gid=164390836&single=true&output=csv