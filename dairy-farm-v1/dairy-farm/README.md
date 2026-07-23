# Dairy Farm Manager

A hybrid dairy management platform: herd-level tracking by default, individual-animal tracking whenever needed. This repository holds Version 1 — daily milk, feed, expense, and sales entry with a live profit dashboard.

## Stack (fixed across all versions)

React + TypeScript (Vite, PWA) · NestJS · PostgreSQL + Prisma · Redis + BullMQ (from V2) · Docker Compose

```
dairy-farm/
├── apps/
│   ├── api/          # NestJS backend (modules: auth, farms, groups, animals, records, dashboard)
│   │   └── prisma/   # schema.prisma + seed.ts
│   └── web/          # React PWA
├── packages/
│   └── shared/       # types, money utils, scope-rule validation (used by both sides)
└── docker-compose.yml
```

## Prerequisites

Node.js 20+, Docker, npm.

## First run

```bash
# 1. Install dependencies (from repo root)
npm install

# 2. Start Postgres and Redis
docker compose up -d

# 3. Configure the API environment
cp .env.example apps/api/.env

# 4. Create the database schema and generate the Prisma client
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed        # optional: demo data (demo@farm.test / password123)
cd ../..

# 5. Run both apps (two terminals)
npm run dev:api           # API on http://localhost:3000/api
npm run dev:web           # Web on http://localhost:5173 (proxies /api to the backend)
```

Open http://localhost:5173, register (or log in with the demo account), and you're in.

## Core design decisions

**The scope rule.** Every milk and feed record declares a scope: `HERD`, `GROUP`, or `ANIMAL`, and must reference exactly the matching entity. The server rejects mismatches. This is what lets herd totals and per-animal entries coexist without double-counting — reports aggregate one scope level at a time.

**Money is integer cents.** No floats anywhere in financial math. Display formatting happens at the edge.

**Animal lifecycle is a state machine.** `CALF → HEIFER → MILKING ⇄ DRY`, with terminal states `SOLD / CULLED / DEAD`. Invalid transitions are rejected server-side.

**Append + audit.** Record creation writes an `AuditLog` row. Deletes are not exposed in V1 (edit history and delete protection arrive with the V2 admin surface).

**Roles.** Farm creator becomes `OWNER`. Financial routes (expenses, sales) require `OWNER`, `MANAGER`, or `ACCOUNTANT`. Milk/feed entry is open to all members including `WORKER` and `VET`.

## API summary

All routes are prefixed `/api`. Authenticated routes require `Authorization: Bearer <token>`.

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/register` `/auth/login` | returns `{ token, user }` |
| POST | `/farms` | creates farm, seeds default groups, creator = OWNER |
| GET | `/farms/mine` | farms the user belongs to |
| GET/PATCH | `/farms/:farmId` | PATCH: OWNER/MANAGER |
| GET/POST | `/farms/:farmId/groups` · PATCH `/groups/:id` | headcount lives here for herd-mode farms |
| GET/POST | `/farms/:farmId/animals` · PATCH `/animals/:id` | status changes validated by lifecycle |
| GET/POST | `/farms/:farmId/milk` · `/feed` | scope-validated; GET accepts `?from&to` (YYYY-MM-DD) |
| GET/POST | `/farms/:farmId/expenses` · `/sales` | finance roles only |
| PATCH | `/farms/:farmId/sales/:id/paid` | mark an unpaid sale paid |
| GET | `/farms/:farmId/dashboard` | today + 7-day series + headcounts + unpaid total |

## V1 scope (this release)

Register/login · farm creation with operating mode · herd groups with headcounts · optional animal registry with lifecycle · milk entry (morning/evening, herd/group scope) · feed entry with cost · expense entry by category · milk sales with paid/unpaid tracking · dashboard (today's profit, milk balance, outstanding payments, 7-day milk trend) · 7-day reports (profit, cost per liter, cost breakdown) · role-restricted finance routes · audit log on every record.

## Roadmap

- **V2** — invoices, payments, inventory (feed costing moves from manual entry to weighted-average consumption), health records, breeding, tasks and reminders (BullMQ), customers and suppliers.
- **V3** — per-cow performance dashboards, feed efficiency, profit by cow/herd, cash flow, forecasting, staff management.
- **V4** — offline sync (local-first), multi-farm, accounting and sensor integrations, public API, AI recommendations.

## Notes for production hardening (before real users)

Move JWT storage from localStorage to httpOnly cookies with refresh rotation; add rate limiting on auth routes; set a strong `JWT_SECRET`; run `prisma migrate deploy` (not `dev`) in deployment; put the API behind HTTPS.
