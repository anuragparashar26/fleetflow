# FleetFlow - Logistics & Fleet Operations Platform

FleetFlow is an all-in-one operations platform for small and mid-sized logistics teams to run shipments, fleets, drivers, routes, and customer accounts from a single workspace — with shared authentication, workspace management, and role-based access control.

## Project Overview

FleetFlow consolidates logistics operations into one workspace: a shipment kanban board, fleet & driver directories, route planning, trip execution, fuel and maintenance tracking, and driver payouts — all secured by multi-tenant workspace isolation.

### Key Features
- **Shipments:** Kanban board with delivery stages, cargo items, labels, drivers, comments, and status history
- **Fleet:** Vehicles, drivers, routes with stops, trip lifecycle, fuel logs, and preventive maintenance plans
- **Customers & Activities:** Shipper accounts, shipment activities, and an activity log
- **Workspace Management:** Team collaboration with role-based access control (Owner, Admin, Manager, Member, Viewer)
- **Authentication:** Supabase Auth with workspace isolation
- **Payouts:** Driver payout records with approval workflow (draft → approved → paid)

---

## Quick Start Guide

### Prerequisites
- Node.js 16+ and npm 7+
- PostgreSQL database (Supabase recommended)
- Supabase account for authentication, database, and storage
- Supabase account for database and storage

### Installation Steps

#### Step 1: Clone the Repository
```bash
git clone https://github.com/anuragparashar26/fleetflow.git
cd fleetflow
```

#### Step 2: Install Dependencies
```bash
npm install
```

This installs dependencies for the entire monorepo, including the web app, API, and shared packages.

#### Step 3: Configure Environment Variables

Use separate env files so backend secrets never mix with frontend config.

1. Copy these files:
```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env
```
2. Fill your real values in each file.

See complete instructions in [docs/env-setup.md](docs/env-setup.md).

#### Step 4: Set Up Supabase Database
```bash
cd packages/db
npm run prisma:migrate
cd ../..
```

#### Step 5: Start Development Servers
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend API (in new terminal)
npm run dev:api
```

Frontend: http://localhost:5173
Backend: http://localhost:4000

---

## Monorepo Structure

```
fleetflow/
├── apps/
│   ├── web/           # React + Vite Frontend (port 5173)
│   │   └── src/
│   │       ├── modules/
│   │       │   └── fleet/    # Fleet dashboard, kanban, directories, modals
│   │       ├── components/   # Shared UI components (sidebar, icons)
│   │       ├── pages/        # Root pages
│   │       └── utils/        # apiClient, fleetApi, platformApi helpers
│   │
│   └── api/           # Node.js + Express Backend (port 4000)
│       └── src/
│           ├── modules/
│           │   ├── fleet/     # Fleet REST module (routes + controllers)
│           │   └── platform/  # Auth, workspace, member routes/services
│           ├── middleware/    # Auth, RBAC, logging, error handling
│           └── utils/         # Prisma client, Supabase, workspace context
│
├── packages/
│   ├── db/            # Prisma ORM & Database (26 models)
│   ├── ui/            # Shared UI Components
│   └── types/         # TypeScript Type Definitions
│
├── scripts/
│   └── fleet-smoke.mjs # Data-layer smoke test (all fleet controllers)
│
└── docs/              # Documentation files
```

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19 + Vite | UI framework and build tool |
| Backend | Node.js + Express | REST API server |
| Database | PostgreSQL (Supabase) | Data storage |
| ORM | Prisma | Schema, migrations, and runtime queries (nested writes, transactions) |
| Auth | Supabase Auth | User authentication |
| Styling | CSS + inline styles | UI styling |

---

## API Overview

All endpoints are prefixed with `/api/v1` — **58 endpoints total**:

- **Platform (13):** `auth` (sync, me), `workspaces` CRUD, `members` CRUD, API info & health
- **Fleet (45):** `shipments` (incl. move, comments), `boards` (nested columns), `shippers`, `vehicles` (incl. fuel logs, service records), `drivers`, `routes` (nested stops), `trips`, `activities`, `payouts`, `dashboard`

Access control is enforced per request: every fleet route resolves the caller's workspace membership (multi-tenant isolation), and role guards restrict writes to Member+ and destructive/financial operations to Manager+.

---

## Features

### Shipments
- **Kanban Board:** Track shipments through delivery stages with drag-and-drop
- **Cargo & Labels:** Line items, priority, weight/value/COD, workspace labels
- **Collaboration:** Comments, assigned drivers, full status history timeline
- **Tracking:** Auto-generated tracking numbers per shipment

### Fleet Operations
- **Vehicles:** Registry with status, odometer, fuel type, capacity
- **Drivers:** Directory with license tracking and availability status
- **Routes & Trips:** Ordered stops, trip lifecycle with automatic fleet availability
- **Maintenance:** Service types, maintenance plans with next-due date/km, service records
- **Fuel:** Fill-up logs that advance the vehicle odometer

### Platform Features
- **Workspace Management:** Create and switch between team workspaces
- **Role-Based Access Control:** Owner, Admin, Manager, Member, Viewer roles
- **Notifications:** Real-time alerts for important events
- **Activity Audit Trail:** Track all system changes

---

## Available Commands

```bash
# Development
npm install              # Install all dependencies
npm run dev              # Start frontend dev server
npm run dev:api          # Start backend API server

# Database
npm run prisma:migrate   # Create and apply migrations
npm run prisma:studio    # Open Prisma Studio GUI
npm run prisma:generate  # Regenerate Prisma client

# Quality
npm run lint             # Run ESLint
node scripts/fleet-smoke.mjs   # Run data-layer smoke test (needs SMOKE_DATABASE_URL)
```

## Vercel Deployment

Deploy `apps/web` and `apps/api` as two separate Vercel projects from this repository.

### Frontend project

- Root Directory: `apps/web`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_API_BASE_URL=https://your-api-project.vercel.app`

### API project

- Root Directory: `apps/api`
- Build Command: `npm run build`
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `DATABASE_URL`
  - `FRONTEND_ORIGIN=https://your-web-project.vercel.app`

The API is exposed under `/api/v1` and uses `apps/api/api/index.js` as its Vercel serverless entrypoint.

After deployment, add the frontend URL to Supabase Auth's allowed redirect URLs and configure the frontend's `VITE_API_BASE_URL` with the deployed API URL.

---

## Troubleshooting

**Frontend not loading?**
- Verify `apps/web/.env` has all required `VITE_*` keys
- Check browser console for errors (F12)
- Clear cache and restart: `npm run dev`

**Cannot connect to database?**
- Verify `DATABASE_URL` and `DIRECT_URL` in `packages/db/.env` (and `DATABASE_URL` in `apps/api/.env`)
- Check Supabase dashboard for credentials
- Ensure your IP is whitelisted in Supabase

**API not starting?**
- Verify Node version: `node --version` (must be 16+)
- Ensure `apps/api/.env` has `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `DATABASE_URL`
- Ensure port 4000 is not in use

**Hot reload not working?**
- Restart dev server: `npm run dev`
- Hard refresh: `Ctrl+Shift+R`

---

> Last Updated: November 10, 2026
