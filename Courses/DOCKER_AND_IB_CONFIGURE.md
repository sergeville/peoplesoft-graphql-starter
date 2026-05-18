# Docker & Integration Broker configuration (course module)

**Prerequisites:** Modules 0–6  
**Pairs with:** Module 7 (mock IB), Module 11 (real IB)  
**Repo files:** `docker-compose.yml`, `docker-compose.real-ps.example.yml`, `backend/.env.example`

---

## Learning goals

After this module you can:

1. Run the **full mock stack** in Docker (frontend + GraphQL + mock PeopleSoft).
2. Explain what your **PeopleSoft team configures** in Integration Broker vs what **your team** configures in `.env`.
3. Map each mock REST path to a typical **IB service operation**.
4. Restart containers when code or env changes.

---

## Part A — Docker mock stack (your machine)

### Architecture

```text
Browser → frontend :3000
            → backend :4000  (GraphQL BFF)
                → mock-ps :4100  (fake Integration Broker)
```

All three services are required. The backend does **not** connect to Oracle; `mock-ps` pretends to be PeopleSoft REST.

### Lab A.1 — Start the stack

```bash
cd ~/Documents/Projects/peoplesoft-graphql-starter
docker compose up --build
```

| URL | What |
|-----|------|
| http://localhost:3000 | Next.js UI |
| http://localhost:4000 | GraphQL Sandbox |
| http://localhost:4100/ | Mock IB discovery JSON |
| http://localhost:4100/employees | List (Basic `demo` / `demo`) |

### Lab A.2 — Prove mock-ps is “Side 2”

```bash
curl -u demo:demo "http://localhost:4100/employees?limit=2"
curl -u demo:demo "http://localhost:4100/employee/100001"
```

In the UI, open the employee list — traffic path is UI → GraphQL → `http://mock-ps:4100` (Docker network name, not localhost from inside backend).

### When to restart

| You changed… | Run |
|--------------|-----|
| TypeScript / React | `docker compose up --build` |
| `docker-compose.yml` or env | `docker compose down` then `docker compose up --build` |
| Only browser refresh | Nothing |

---

## Part B — What you see in PeopleSoft Integration Broker (real site)

Your **PeopleSoft team** configures IB in **PeopleTools**. Your app only consumes what they publish.

### Typical navigation

```text
PeopleTools
  → Integration Broker
      → Integration Setup
          → Services              (REST service definition)
          → Service Operations    (GET /employees, GET /employee/{id}, …)
          → Routings              (gateway, node, permission list)
          → Service Activity      (monitor / test)
```

You rarely “configure IB” in this repo — you copy **URL + credentials + JSON samples** into `backend/.env`.

---

## Part C — Operation map (mock ↔ production)

What our **mock** exposes on port 4100 is what you should ask the PS team to document:

| Mock REST (this repo) | Typical IB operation name | HTTP | Notes |
|------------------------|----------------------------|------|--------|
| `GET /employees` | GET_EMPLOYEES (example) | GET | List; supports `limit`, `offset`, `page`, `pageSize` |
| `GET /employees/count` | GET_EMPLOYEE_COUNT | GET | Total for pagination |
| `GET /employee/{EMPLID}` | GET_EMPLOYEE | GET | One row; `?asOfDate=` |
| `POST /employees` | CREATE_EMPLOYEE | POST | JSON body |
| `PUT /employee/{EMPLID}` | UPDATE_EMPLOYEE | PUT | JSON body |
| `DELETE /employee/{EMPLID}` | DELETE_EMPLOYEE | DELETE | Site may use eff-dated delete instead |

**Query parameters** (agree with PS team):

- `asOfDate` — effective-dated snapshot (`MAX(EFFDT) <= asOfDate`)
- `limit` / `offset` or `page` / `pageSize` — pagination

**JSON fields** (examples in mock): `EMPLID`, `NAME`, `EMAIL_ADDR`, `DEPTID`, `EFFDT` → mapped in `backend/src/peoplesoft/mappers.ts`.

---

## Part D — Environment variables ↔ IB screens

| Your `.env` / Docker | Meaning in PeopleSoft terms |
|----------------------|-----------------------------|
| `PS_BASE_URL` | Published **REST base URL** (service catalog / external URL) |
| `PS_USERNAME` | **Service account** for server-to-server (not end-user password in browser) |
| `PS_PASSWORD` | Credential for that service user |
| `PEOPLESOFT_DATA_SOURCE=integration-broker` | BFF uses HTTP to IB (not CSV mock) |

**Example real URL pattern** (site-specific):

```text
https://<host>/psc/ps/<NODE>/<PORTAL>/s/<WEBLIB_REST>.<version>
```

**Docker mock equivalent:**

```env
PS_BASE_URL=http://mock-ps:4100
PS_USERNAME=demo
PS_PASSWORD=demo
```

---

## Part E — Security & row-level access

| Layer | Who configures | What you see |
|-------|----------------|--------------|
| GraphQL BFF | Your team | Resolvers, no PS secrets in browser |
| IB gateway auth | PS team | Basic, OAuth, certificates |
| Row security | PS team | PeopleCode / CI — operator sees only allowed rows |
| Mock `demo`/`demo` | This repo | Learning only — never production |

Read [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md) before go-live.

---

## Part F — Switching from Docker mock to real PS

1. Get from PS team: `PS_BASE_URL`, auth, operation list, sample JSON.
2. Update `mappers.ts` for their field names.
3. Use `docker-compose.real-ps.example.yml` or `.env` — **do not** start `mock-ps`.
4. Run only `backend` + `frontend` (or `npm run dev` locally with real `PS_BASE_URL`).

```bash
docker compose -f docker-compose.yml -f docker-compose.real-ps.example.yml up --build backend frontend
```

(Set `PS_USERNAME` / `PS_PASSWORD` in shell or `.env`.)

---

## Checkpoint questions

1. Name the **three** Docker services and ports.
2. Where is Integration Broker configured — in Docker Compose or in PeopleTools?
3. What is `PS_BASE_URL` in one sentence?
4. Why does the browser never call `PS_BASE_URL` directly?
5. Which file converts PS JSON → GraphQL types?

---

## Reference comments in the repo

Line-by-line comments live in:

- `docker-compose.yml` (full IB configure cheat sheet)
- `backend/.env.example`
- `docker-compose.real-ps.example.yml`
- `backend/src/peoplesoft/integrationBrokerClient.ts`

---

*Course module — aligned with peoplesoft-graphql-starter Docker mock stack.*
