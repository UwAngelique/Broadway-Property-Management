# Broadway Property Management

Property management platform for landlords and platform operators: buildings, leases, payments, Rwanda tax compliance, and multi-tenant workspaces.

**Repository:** https://github.com/Dgeba/Broadway-Property-Management

## Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS, TypeORM, PostgreSQL, WebSocket, Stripe billing |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, PWA service worker |
| Mobile | Expo (React Native) — `mobile/` |
| Staging | Vercel (frontend) + DigitalOcean/Render (API) + Postgres |

## Quick start

1. **PostgreSQL** — create database `broadway_pm`.
2. **Backend** — see [SETUP.md](./SETUP.md): copy `backend/.env.example` → `backend/.env`, then `npm install` and `npm run start:dev` (port 3000).
3. **Frontend** — copy `frontend/.env.example` → `frontend/.env.local`, then `npm install` and `npm run dev` (port 3001).

Open http://localhost:3001

## Documentation

| Doc | Purpose |
|-----|---------|
| [SETUP.md](./SETUP.md) | Local development |
| [DEPLOY_STAGING.md](./DEPLOY_STAGING.md) | Vercel + Render + Neon staging |
| [PRODUCTION_DEPLOY.md](./docs/PRODUCTION_DEPLOY.md) | Production env checklist (DO + Vercel) |
| [mobile/README.md](./mobile/README.md) | iOS / Android app (Expo) |
| [PARTNER_DEMO.md](./PARTNER_DEMO.md) | Partner preview tunnels |
| [docs/PARTNER_WALKTHROUGH.md](./docs/PARTNER_WALKTHROUGH.md) | Demo walkthrough script |

## Demo accounts (after `seed-demo-staging.js`)

| Role | Email | Password |
|------|--------|----------|
| Platform | platform@broadway.demo | Demo2026! |
| Landlord | owner@demo-landlord.rw | Demo2026! |
| Tenant | tenant@demo-landlord.rw | Demo2026! |

## Security

Never commit `.env` or `.env.local`. Use the committed `*.env.example` files as templates.
