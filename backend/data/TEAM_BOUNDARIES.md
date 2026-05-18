# Team boundaries: your squad vs PeopleSoft

At many organizations, **your application team** and the **PeopleSoft platform team** are separate groups. This repo is structured so that split is obvious in code and in how you run environments locally.

---

## Two sides of the system

```text
┌─────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  SIDE 1 — Your team (this repo)     │     │  SIDE 2 — PeopleSoft team            │
│                                     │     │                                      │
│  Next.js UI (:3000)                 │     │  PeopleSoft tables & business rules  │
│       │                             │     │  Integration Broker REST services    │
│       ▼ GraphQL only                │     │  Row security, effective dating      │
│  Apollo BFF (:4000)                 │     │  Auth for IB (Basic / OAuth / SSO)   │
│       │                             │     │                                      │
│       ▼                             │     │                                      │
│  EmployeeService                    │────►│  HTTP contract (not GraphQL)         │
│  integrationBrokerClient.ts         │     │  PS_BASE_URL + JSON field names      │
└─────────────────────────────────────┘     └──────────────────────────────────────┘
```

**Side 1 is fixed** in this project: the browser always talks GraphQL to your BFF. The frontend never calls PeopleSoft directly.

**Side 2 is pluggable** via `PEOPLESOFT_DATA_SOURCE`:

| Mode | Side 2 implementation | Who “owns” the data |
|------|-------------------------|---------------------|
| `mock` | `employeeStore.ts` → `employees.csv` | You (local dev only) |
| `integration-broker` | `integrationBrokerClient.ts` → `fetch(PS_BASE_URL/...)` | PS team (prod) or mock (:4100 / Apps Script for learning) |

Integration Broker is **only** the Side 2 path when `PEOPLESOFT_DATA_SOURCE=integration-broker`. In `mock` mode, Side 2 stops at CSV — there is no HTTP call to PeopleSoft.

---

## What each team typically delivers

| Your team (app / integration) | PeopleSoft team |
|-------------------------------|-----------------|
| GraphQL schema & resolvers | REST resource paths (e.g. `/employees`, `/employee/{emplid}`) |
| Next.js UI & UX | IB operations wired to PS components / CI |
| `integrationBrokerClient.ts` (HTTP **consumer**) | Published API docs, sample JSON, error codes |
| `mappers.ts` (PS JSON → `Employee`) | Field names: `EMPLID`, `EMAIL_ADDR`, `EFFDT`, etc. |
| Env: `PS_BASE_URL`, service account for **their** API | Dev / test / prod IB endpoints, credentials rotation |
| BFF session / SSO (production) | Row-level security enforced in PS for each operator |

The **contract between teams** is REST over Integration Broker — not GraphQL. GraphQL is your internal API for the frontend only.

---

## How this starter simulates the PS team

You can develop Side 1 before Side 2 is ready:

| Stand-in | Use when |
|----------|----------|
| `mock` + `employees.csv` | UI and GraphQL only; no HTTP |
| Mock IB on port **4100** | Practice `integrationBrokerClient.ts` and see `[Integration Broker]` logs |
| [Google Apps Script + Sheet](./GOOGLE_SHEET_AS_MOCK_PS.md) | Same HTTP client; sheet updates like a fake PS database |
| Real `PS_BASE_URL` | Integration with the actual PS team’s delivered service |

None of these replace the PS team in production — they let **your** team move independently until IB endpoints and credentials exist.

---

## Questions to ask the PeopleSoft team

Before go-live, align on:

1. **Base URL** and environment URLs (dev / test / prod)
2. **Authentication** (Basic, OAuth, certificate, per-user token from SSO)
3. **Operations**: list, get, count, create, update, delete — exact paths and verbs
4. **Pagination** (`limit` / `offset` or cursor)
5. **Effective dating** (`asOfDate` query param or header)
6. **JSON samples** for success and error responses
7. **Row security**: how the BFF passes the manager’s identity to IB (never a shared HR admin password in the browser)
8. **Rate limits**, timeouts, and support contacts

---

## Code map (where the boundary lives)

| Layer | File | Team |
|-------|------|------|
| UI | `frontend/components/*.tsx` | Yours |
| GraphQL contract | `backend/src/graphql/schema.ts` | Yours |
| GraphQL → service | `backend/src/resolvers/index.ts` | Yours |
| Source switch | `backend/src/services/employeeService.ts` | Yours |
| **HTTP to PS** | `backend/src/peoplesoft/integrationBrokerClient.ts` | **Boundary** — you call, they implement |
| PS JSON mapping | `backend/src/peoplesoft/mappers.ts` | Yours (adjust to their JSON) |
| Mock PS server | `backend/src/peoplesoft/mockIntegrationBroker/` | Dev stand-in only |

Trace a write end-to-end: [CODE_PATH_GRAPHQL_TO_PS.md](./CODE_PATH_GRAPHQL_TO_PS.md)

Row security in production: [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md)
