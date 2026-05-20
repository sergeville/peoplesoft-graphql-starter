# Docker & Integration Broker configuration (course module)

**Prerequisites:** Modules 0–6  
**Pairs with:** Module 7 (mock IB), Module 11 (real IB)  
**Repo files:** `docker-compose.yml`, `docker-compose.real-ps.example.yml`, `backend/.env.example`

**Scripts:** [`npm run stack:docker`](../package.json) → [`docker-compose.yml`](../docker-compose.yml) · [`npm run stack:stop`](../package.json) → [`scripts/stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) · Local: [`npm run dev:mock-ps`](../package.json) → [`mock-ib-server.ts`](../backend/src/mock-ib-server.ts) — [SCRIPT_COURSE_LINKS](./SCRIPT_COURSE_LINKS.md#by-course-module-course--script)

> **IMPORTANT:** All **Docker components** in this repo (`frontend`, `backend`, and `mock-ps` in [`docker-compose.yml`](../docker-compose.yml)) are for **development environments only** — local laptops, course labs, and optional CI. They are **not** the production deployment model. In staging or production, run your app as your platform team dictates (VM, Kubernetes, etc.) and set `PS_BASE_URL` to the **real** Integration Broker URL the PeopleSoft team provides; do **not** ship or rely on the `mock-ps` container.

---

## Learning goals

After this module you can:

1. Run the **full mock stack** in Docker (frontend + GraphQL + mock PeopleSoft) — **dev only**.
2. Explain **why Docker components here are not for production** and what runs instead.
3. Configure a **production environment** (`PS_BASE_URL`, secrets, no `mock-ps`).
4. Explain what your **PeopleSoft team configures** in Integration Broker vs what **your team** configures in `.env`.
5. Map each mock REST path to a typical **IB service operation**.
6. Restart containers when code or env changes.

---

## Architecture decision: Should PeopleSoft be a Docker component?

**Short answer:** A **mock** PeopleSoft side in Docker is a **good idea for dev and learning**. Running **real** PeopleSoft in a container is **not** how enterprises deploy PS — and you should not try to replace the PS team’s environment with a container in this repo.

### What `mock-ps` actually is

```text
mock-ps (Docker)  = fake Integration Broker REST  →  good for local / course / CI
real PeopleSoft     = PS team servers + IB on your site  →  production
```

The `mock-ps` service is **not** PeopleSoft and **not** Oracle. It only **imitates** IB REST so your GraphQL BFF practices the same HTTP contract (`PS_BASE_URL`, Basic auth, JSON shape).

### When a Docker “PS part” is a good idea

| Use case | Verdict |
|----------|---------|
| Local dev — no PS VPN or credentials yet | ✅ Strong yes |
| Course / demos — predictable data | ✅ Yes |
| CI — spin full stack in a pipeline | ✅ Yes |
| Team onboarding — one `docker compose up` | ✅ Yes |
| Contract testing — stable JSON for `mappers.ts` | ✅ Yes |

**Benefits**

- Same three-layer story as production: UI → GraphQL → REST
- No dependency on a shared dev PS environment
- Fast reset (`docker compose down` then `up --build`)
- Safe — cannot corrupt real HR data

### When it is not a good idea

| Idea | Verdict |
|------|---------|
| Run **real** PeopleSoft + Oracle inside your `docker-compose.yml` | ❌ No — licensed, heavy, owned by PS team |
| Use the Docker **mock** in **production** | ❌ No — set `PS_BASE_URL` to real IB; omit `mock-ps` |
| Point anything at the **production** PS database from your containers | ❌ Never |
| Assume mock behavior equals full PS (PeopleCode, row security, upgrades) | ❌ Mock is a contract simulator only |

### Production pattern (recommended)

```text
Your Docker / Kubernetes:     frontend + backend  (GraphQL BFF)
Your organization’s site:     PeopleSoft Integration Broker  (PS team)
                              → PeopleCode / CI / Oracle (inside PS — you do not containerize this)
```

| Environment | PS “component” |
|-------------|----------------|
| Developer laptop | `mock-ps` in Docker **or** `npm run dev:mock-ps` |
| CI (optional) | `mock-ps` in compose |
| Staging / production | **No** `mock-ps` — only `backend` + `frontend`; `PS_BASE_URL` → real IB on your site |

### Rule of thumb

> **Docker for mock IB = good.**  
> **Docker for real PeopleSoft = no.**  
> **Production PS = always the PS team’s Integration Broker URL, not a container in this repo.**

Keep `mock-ps` as a **Side 2 simulator** (see [TEAM_BOUNDARIES.md](./TEAM_BOUNDARIES.md)), not a substitute for PeopleSoft.

---

## Dev vs production environments (explained)

This section answers: **why Docker here is only for dev**, and **how production should be wired** instead.

### Development environment (this course)

What you run on a laptop or in CI to learn the **same three-layer pattern** as production, without a real PeopleSoft site:

```text
┌─────────────┐     GraphQL      ┌─────────────┐     REST (mock)    ┌─────────────┐
│  Next.js    │ ───────────────► │  backend    │ ───────────────► │  mock-ps    │
│  :3000/3001 │   /api/graphql   │  :4000      │   PS_BASE_URL    │  :4100      │
└─────────────┘                  └─────────────┘                  └─────────────┘
                                 PEOPLESOFT_DATA_SOURCE=          fake IB only
                                 integration-broker
```

| How you start it | Command | Includes `mock-ps`? |
|------------------|---------|---------------------|
| Docker (all-in-one) | [`npm run stack:docker`](../package.json) | ✅ Yes — [`docker-compose.yml`](../docker-compose.yml) |
| Local processes | [`npm run dev:mock-ps`](../package.json) | ✅ Yes — `mock-ib-server.ts` on :4100 |
| CSV only (no HTTP to PS) | [`npm run dev`](../package.json) + `PEOPLESOFT_DATA_SOURCE=mock` | ❌ No — uses `employees.csv` |

**Purpose:** contract practice, demos, onboarding, CI smoke tests. **Not** licensed PeopleSoft, not row security, not production data.

### Production environment (your organization)

What actually runs when managers use the real HR system:

```text
┌─────────────┐     GraphQL      ┌─────────────┐     REST (real)    ┌─────────────────────────┐
│  Next.js    │ ───────────────► │  backend    │ ───────────────► │  PeopleSoft             │
│  (your host)│   SSO session    │  (your host)│   PS_BASE_URL    │  Integration Broker     │
└─────────────┘                  └─────────────┘                  │  → PeopleCode / Oracle  │
                                                                    │  (PS team — not Docker) │
                                                                    └─────────────────────────┘
```

| Component | In production | Who operates it |
|-----------|---------------|-----------------|
| `frontend` + `backend` | Your app team’s servers (VM, K8s, PaaS, etc.) | App / platform team |
| `mock-ps` | **Never** | — |
| Integration Broker REST | PeopleSoft application server URL from PS team | PeopleSoft team |
| Row security, effective dating | Inside PeopleSoft | PeopleSoft team |

The browser still **never** calls `PS_BASE_URL` directly — only GraphQL to your BFF (same rule as dev).

### Dev vs production at a glance

| Topic | Development (Docker / local mock) | Production |
|-------|-----------------------------------|------------|
| `docker-compose.yml` with `mock-ps` | ✅ Use for labs | ❌ Do not deploy as-is |
| `PS_BASE_URL` | `http://mock-ps:4100` or `http://localhost:4100` | HTTPS URL from PS team’s IB service |
| `PS_USERNAME` / `PS_PASSWORD` | `demo` / `demo` (mock only) | Service account or token flow from PS/security team |
| `PEOPLESOFT_DATA_SOURCE` | `integration-broker` (with mock) or `mock` (CSV) | **`integration-broker`** |
| PeopleSoft database | Not used | Oracle behind PS — **no direct connection** from your app |
| Row security | You edit CSV or mock returns all rows | PS enforces per operator — [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md) |
| GraphQL | Internal BFF API | Same — still internal |
| Docker optional? | Convenient for dev | Optional for **your** `frontend`/`backend` only; PS stays outside Docker |

---

## How to configure the production environment

Use this checklist when moving from course mocks to a real site. Your platform team may use Kubernetes, VMs, or a PaaS — the **variables and boundaries** stay the same.

### 1. Get from the PeopleSoft team (before changing `.env`)

| Deliverable | Used in this repo |
|-------------|-------------------|
| **REST base URL** (Integration Broker published endpoint) | `PS_BASE_URL` in [`backend/.env`](../backend/.env) |
| **Authentication** (Basic, OAuth, cert, per-user token from SSO) | `PS_USERNAME` / `PS_PASSWORD` or custom headers in [`integrationBrokerClient.ts`](../backend/src/peoplesoft/integrationBrokerClient.ts) |
| **Operation list** (paths + HTTP verbs) | Must match [`integrationBrokerClient.ts`](../backend/src/peoplesoft/integrationBrokerClient.ts) |
| **Sample JSON** (`EMPLID`, `NAME`, `EMAIL_ADDR`, …) | [`mappers.ts`](../backend/src/peoplesoft/mappers.ts) — **inbound** mapper today; agree **POST/PUT** sample bodies too ([two-way mapping](CODE_PATH_GRAPHQL_TO_PS.md#two-way-mapping)) |
| **Pagination** (`limit`/`offset` or site-specific) | Resolvers + client |
| **`asOfDate`** behavior | Query param / header agreement |
| **Row security model** (how BFF passes manager identity) | [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md) |
| Non-prod + prod URLs | Separate `PS_BASE_URL` per environment |

Ask them to configure IB in PeopleTools (Services, Service Operations, Routings, Gateway security) — you **consume** the published REST contract; see [Part B](#part-b--what-you-see-in-peoplesoft-integration-broker-real-site) and comments in [`docker-compose.yml`](../docker-compose.yml).

### 2. Backend configuration (`backend/.env` or secrets store)

Production **minimum** (no mock, no CSV as source of truth):

```env
PORT=4000
PEOPLESOFT_DATA_SOURCE=integration-broker

# From PeopleSoft team — example shape only; your path will differ
PS_BASE_URL=https://your-peoplesoft-host.example.com/psc/ps/.../your-rest-service
PS_USERNAME=<bff-service-account>
PS_PASSWORD=<from-vault-not-git>
```

| Variable | Production rule |
|----------|-----------------|
| `PEOPLESOFT_DATA_SOURCE` | **`integration-broker`** — not `mock` |
| `PS_BASE_URL` | Real IB HTTPS base — **no** `localhost:4100`, **no** `http://mock-ps:4100` |
| `MOCK_DATA_SOURCE` / `employees.csv` | Dev only — do not rely on CSV CRUD in prod |
| `PS_USERNAME` / `PS_PASSWORD` | Server-side only; rotate via vault; **never** in frontend or git |

Copy from [`backend/.env.example`](../backend/.env.example). Align field names in [`mappers.ts`](../backend/src/peoplesoft/mappers.ts) with PS sample payloads.

### 3. Frontend configuration

| Setting | Production |
|---------|------------|
| GraphQL URL | Internal rewrite to BFF (e.g. `/api/graphql` → backend `:4000`) — same pattern as dev |
| `PS_BASE_URL` | **Must not appear** in Next.js env or browser bundle |
| Auth | SSO / session at edge; BFF attaches PS credentials server-side |

Build: `npm run build` in `frontend/` and `backend/` per your deployment pipeline.

### 4. Deploy application tiers (no `mock-ps`)

Deploy **only** what your team owns:

```text
Production deployable units:
  ✅ frontend (Next.js or static export + server)
  ✅ backend (Apollo GraphQL BFF)
  ❌ mock-ps
  ❌ peoplesoft Oracle DB connection from your containers
```

**If you use Docker in production** for your app only (optional):

```bash
# Example: real PS overlay — starts backend + frontend ONLY (no mock-ps)
docker compose -f docker-compose.yml -f docker-compose.real-ps.example.yml up --build backend frontend
```

Before running, set real values in [`docker-compose.real-ps.example.yml`](../docker-compose.real-ps.example.yml) or inject env from your secrets manager:

```yaml
# docker-compose.real-ps.example.yml (excerpt)
environment:
  PEOPLESOFT_DATA_SOURCE: integration-broker
  PS_BASE_URL: https://your-peoplesoft-host.example.com/.../your-rest-service
  PS_USERNAME: ${PS_USERNAME}
  PS_PASSWORD: ${PS_PASSWORD}
```

Most enterprises run `backend` and `frontend` on **Kubernetes or VMs** with the same env vars — not necessarily Compose. The example file shows **which services** belong in prod, not that prod must use Docker.

### 5. Network and security

| Check | Action |
|-------|--------|
| Egress from BFF to PS | Allow HTTPS to `PS_BASE_URL` host only |
| Ingress | Public UI + GraphQL path; lock down admin |
| Secrets | Vault / K8s secrets — not committed `.env` |
| TLS | HTTPS end-to-end where required |
| Row security | Per-user PS auth — see [PEOPLESOFT_IB_ROW_SECURITY.md](./PEOPLESOFT_IB_ROW_SECURITY.md) |
| CORS / cookies | Your SSO vendor + BFF session design |

### 6. Production verification checklist

Before go-live:

- [ ] `PEOPLESOFT_DATA_SOURCE=integration-broker` in prod config
- [ ] `PS_BASE_URL` points to **PS team’s** IB URL (curl with service account works)
- [ ] `mock-ps` is **not** in any production manifest / compose profile
- [ ] Sample employee list via **GraphQL** matches curl to IB for same user (row counts)
- [ ] Two test managers see **different** row sets (row security proof)
- [ ] Browser Network tab shows **only** `/api/graphql`, never `PS_BASE_URL`
- [ ] `mappers.ts` matches live JSON field names
- [ ] Mutations map to IB write operations (not CSV file)

### What must never be in production

| Item | Why |
|------|-----|
| `mock-ps` container / `mock-ib-server.ts` | Fake PS — dev teaching only |
| `demo` / `demo` credentials | Mock IB only |
| `PEOPLESOFT_DATA_SOURCE=mock` + CSV writes | Bypasses PS business rules |
| Direct Oracle / `PS_JOB` connection from app | Forbidden integration pattern |
| `PS_PASSWORD` in frontend env | Exposure risk |

---

## Part A — Docker mock stack (your machine)

### Architecture

```text
Browser → frontend :3001  (Docker host port; container listens on 3000)
            → backend :4000  (GraphQL BFF)
                → mock-ps :4100  (fake Integration Broker)
```

Local `npm run dev:mock-ps` uses **:3000** for the UI instead of :3001.

All three services are required. The backend does **not** connect to Oracle; `mock-ps` pretends to be PeopleSoft REST.

### Lab A.1 — Start the stack

```bash
cd ~/Documents/Projects/peoplesoft-graphql-starter
npm run stack:docker
# same as: docker compose up --build  (see docker-compose.yml)
```

| URL | What |
|-----|------|
| http://localhost:3001 | Next.js UI (Docker; host port 3001) |
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
| TypeScript / React | [`npm run stack:docker`](../package.json) (see [`docker-compose.yml`](../docker-compose.yml)) |
| `docker-compose.yml` or env | `docker compose down` then [`npm run stack:docker`](../package.json) |
| Only browser refresh | Nothing |

### Troubleshooting: `frontend` stopped / port 3000 in use

Docker maps the UI to **host port 3001** so it does not fight with local `npm run dev` on 3000.

| Symptom | Fix |
|---------|-----|
| `bind: address already in use` on 3000 | Use http://localhost:3001 after [`npm run stack:docker`](../package.json), or [`npm run stack:stop`](../package.json) → [`stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) |
| `frontend-1` Created but not running | `docker compose up frontend` after `mock-ps` is healthy |
| HTTP 500 in Docker Desktop | Often frontend never started — check **Containers** tab; start frontend or free the port |

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

**JSON fields** (examples in mock): `EMPLID`, `NAME`, `EMAIL_ADDR`, `DEPTID`, `EFFDT` → **inbound** mapping in `backend/src/peoplesoft/mappers.ts`. Mock GET rows are built in [`mockIntegrationBroker/payloads.ts`](../backend/src/peoplesoft/mockIntegrationBroker/payloads.ts) (`jobRowToPsBrokerRow`). Writes from the BFF still use camelCase until an outbound mapper is added — see [CODE_PATH § Two-way mapping](CODE_PATH_GRAPHQL_TO_PS.md#two-way-mapping).

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

## Part F — Switching from Docker dev mock to production

**Full guide:** [Dev vs production environments (explained)](#dev-vs-production-environments-explained) and [How to configure the production environment](#how-to-configure-the-production-environment).

**Short path:**

1. Complete the **production checklist** in the section above (PS team deliverables + `.env`).
2. Update [`mappers.ts`](../backend/src/peoplesoft/mappers.ts).
3. For a **local smoke test** against real IB (still not production deploy):

```bash
cp backend/.env.example backend/.env
# Set PEOPLESOFT_DATA_SOURCE=integration-broker and real PS_BASE_URL from PS team
npm run dev   # no mock-ps — BFF calls real IB URL only
```

4. For **Docker without mock** (dev machine testing real IB only):

```bash
docker compose -f docker-compose.yml -f docker-compose.real-ps.example.yml up --build backend frontend
```

Do **not** start the `mock-ps` service when `PS_BASE_URL` points at your organization’s Integration Broker.

---

## Checkpoint questions

1. Name the **three** Docker services and ports.
2. Where is Integration Broker configured — in Docker Compose or in PeopleTools?
3. What is `PS_BASE_URL` in one sentence?
4. Why does the browser never call `PS_BASE_URL` directly?
5. Which file converts PS JSON → GraphQL types?
6. Is `mock-ps` real PeopleSoft? What is it for?
7. Should `mock-ps` run in production? What runs instead?
8. Name one benefit and one limit of the Docker mock PS component.
9. Why are Docker Compose services in this repo **dev only**?
10. Name three things you configure differently in **production** vs dev (`PS_BASE_URL`, `PEOPLESOFT_DATA_SOURCE`, `mock-ps`).

---

## Reference comments in the repo

Line-by-line comments live in:

- `docker-compose.yml` (full IB configure cheat sheet)
- `backend/.env.example`
- `docker-compose.real-ps.example.yml`
- `backend/src/peoplesoft/integrationBrokerClient.ts`

---

**Course:** [COURSE.md § Module 7b](./COURSE.md#module-7b--docker-mock-stack--integration-broker-configure-map) · **Commands:** [`stack:docker`](../package.json), [`stack:stop`](../package.json) → [`stop-dev-stack.sh`](../scripts/stop-dev-stack.sh) · **Index:** [SCRIPT_COURSE_LINKS](./SCRIPT_COURSE_LINKS.md)

*Course module — aligned with peoplesoft-graphql-starter Docker mock stack.*
