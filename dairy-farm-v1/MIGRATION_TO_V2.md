# Dairy Farm — V1 → V2 Migration Guide

You've been running V1 successfully. V2 is **additive** — your existing data
(farm, animals, milk records, expenses, sales) is preserved untouched.

New in V2:
- **Customers & suppliers** — linked to sales and purchases
- **Inventory** — feed & medicine stock with weighted-average cost
- **Invoices & payments** — turn unpaid sales into invoices, record partial payments
- **Vaccinations & treatments** — with automatic milk quarantine during withdrawal periods
- **Breeding events** — heat, insemination, pregnancy check, calving, dry-off
- **Reminders** — with a background worker that sweeps overdue items every hour

---

## Step 1 — Back up your database (5 seconds, do it anyway)

Open a terminal and run:

```
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U dairy -h localhost -p 5444 -d dairyfarm > dairy-backup-v1.sql
```

It'll ask for `dairy`'s password (`dairy`). This gives you a rollback file.

---

## Step 2 — Extract V2 over your V1 project

You have your V1 project at wherever you unzipped it (something like
`C:\Users\you\dairy-farm\`).

1. **Do not delete your V1 folder.** Extract `dairy-farm-v2.zip` and copy the
   contents of the `dairy-farm/` folder inside it into your existing V1 folder,
   overwriting when Windows asks.
2. **Do NOT overwrite these** (Windows will offer):
   - `apps/api/.env` — your real config
   - `apps/api/prisma/migrations/` folder — your migration history
   - `node_modules/` folders (there shouldn't be any in the zip anyway)

The zip does not contain `.env` or `migrations/`, so a straight copy-over works.

---

## Step 3 — Install new dependencies

Open a terminal in your project root:

```
cd apps\api
npm install
cd ..\web
npm install
cd ..\..
```

The API install pulls in `bullmq` and `ioredis` (both new for V2).

---

## Step 4 — Install Redis (for the reminder worker)

You said you'd install Redis. On Windows the simplest path is **Memurai** — a
Windows-native, Redis-compatible server. It's free for development use.

1. Go to https://www.memurai.com/get-memurai and download **Memurai Developer**.
2. Run the installer. Accept defaults. It installs as a Windows service and
   starts automatically on port 6379.
3. Verify it's running: open a terminal and run
   ```
   sc query Memurai-Developer
   ```
   You should see `STATE : 4 RUNNING`.

Add this line to `apps/api/.env`:

```
REDIS_URL="redis://localhost:6379"
```

(If you skip Redis, everything else in V2 works — you just won't get automatic
background sweeps. Reminders can still be triggered manually via the "Run sweep
now" button in the UI.)

---

## Step 5 — Run the V2 migration

From your project root:

```
cd apps\api
npx prisma migrate dev --name v2_upgrade
```

Prisma diffs your live DB against the V2 schema and creates a new migration
in `prisma/migrations/[timestamp]_v2_upgrade/` alongside your existing V1
migration. Your V1 data survives. If it asks about the shadow database and you
get a permission error again, you already know the fix from V1 setup —
`ALTER USER dairy CREATEDB;` in psql.

You should see output like:
```
Applying migration `20260724..._v2_upgrade`
Your database is now in sync with your schema.
Running generate... Generated Prisma Client
```

---

## Step 6 — Start it up

Two terminals, from project root:

**Terminal 1 (API):**
```
cd apps\api
npm run start:dev
```

Watch the logs. You should see one of:
- `[Reminders] Background sweeper started` — Redis connected, worker active
- `[Reminders] REDIS_URL not set, reminder worker disabled` — check `.env`

**Terminal 2 (Web):**
```
cd apps\web
npm run dev
```

Open http://localhost:5173 and log in with your existing credentials
(the demo account or whatever you registered).

---

## What you'll see

- The nav bar now has 9 tabs. Extra ones for HERD-only farms: Customers,
  Invoices, Inventory, Reminders. Individual/Hybrid farms also get Health and
  Breeding.
- Dashboard has a new alert row for overdue reminders, low stock, animals under
  withdrawal, and quarantined milk (only shown when any of these apply).
- The Record → Sale form has a customer picker. "Walk-in" preserves your V1
  behavior of typing a name.
- The Record → Feed form has a "Draw from inventory" checkbox. It only appears
  once you've added FEED items in the Inventory tab.

## Trying it out

A good V2 shakedown sequence:

1. **Inventory** → Add item "Dairy pellets", category FEED, unit kg, reorder
   level 50. Add another: "Antibiotic X", category MEDICINE, unit dose.
2. **Inventory** → Purchase the pellets: 200 kg, ₹8000. Notice the avg cost
   settles at ₹40/kg.
3. **Customers** → Add "Valley Dairy Co-op", agreed price 55, 15-day terms.
4. **Record → Sale** → Pick Valley Dairy, enter 100 L, uncheck "Paid now",
   save.
5. **Invoices** → New from sales → pick Valley Dairy → tick the sale → generate.
   Note the invoice number `INV-000001`.
6. **Invoices** → Record a partial payment of ₹2000. Status flips to PARTIAL.
7. **Record → Feed** → tick "Draw from inventory" → pick pellets → 40 kg.
   Cost is ₹1600 automatically, stock drops to 160 kg.
8. If you're in Individual/Hybrid mode with animals: **Health** → Record
   treatment on an animal with 5-day withdrawal → try to record milk for that
   animal — it will save as **quarantined** and won't count toward sellable milk.
9. **Reminders** → click "Run sweep now". You should see LOW_STOCK reminders
   generated if any item is below its reorder level, and INVOICE_DUE for
   invoices due within 2 days.

## If something goes wrong

- **Migration fails with P3014 shadow database error** — same fix as V1:
  `ALTER USER dairy CREATEDB;` as postgres superuser.
- **API won't start, "Cannot find module '@prisma/client'"** — run
  `npx prisma generate` in `apps/api`.
- **Reminders tab is empty and "Run sweep" does nothing** — normal if you have
  no invoices due within 2 days, no stock below reorder level, and no
  vaccination/treatment follow-ups. Try adding an item with reorder level 1000
  to force a low-stock reminder.
- **Rollback to V1** — restore your backup:
  `"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U dairy -h localhost -p 5444 -d dairyfarm < dairy-backup-v1.sql`

## What's not in V2 (coming in V3)

- Per-cow performance dashboards, feed efficiency, profit-by-cow (needs animal
  scope on more records)
- Cash flow forecasting and payables aging
- Staff/role granular permissions beyond the four existing roles
- Multi-farm switching in one login (coming in V4)
