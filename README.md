# PeopleSoft GraphQL Starter

Next.js UI → Apollo GraphQL (port **4000**) → **mock** PeopleSoft data → swap to **Integration Broker REST**.

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

## Edit employees in Google Sheets

1. `npm run export:employees` → creates `backend/data/employees.csv`
2. Import that CSV into [Google Sheets](https://sheets.google.com)
3. Add / edit / delete rows (see `backend/data/GOOGLE_SHEETS.md` for column headers)
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
