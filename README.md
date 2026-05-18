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

## Swap mock → Integration Broker

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
  services/         # employeeService (data source switch)
frontend/
  app/              # Next.js pages
  components/       # EmployeeList, ApolloWrapper
  lib/              # Apollo client
```
