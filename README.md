# Broadway Property Management

Property management platform for landlords and platform operators: buildings, leases, payments, Rwanda tax compliance, and multi-tenant workspaces.

**Repository:** https://github.com/Dgeba/Broadway-Property-Management

## Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS, TypeORM, PostgreSQL, WebSocket, Stripe billing |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, PWA service worker |
| Mobile | Expo (React Native) — `mobile/` |
| **Production** | **AOS Ltd VPS** (`broadwaycreation.rw`) — nginx + PM2 + Postgres — see [HOSTING_AOS.md](./docs/HOSTING_AOS.md) |
| Staging (optional) | Vercel + Render/DO — see [DEPLOY_STAGING.md](./DEPLOY_STAGING.md) |

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
| [HOSTING_AOS.md](./docs/HOSTING_AOS.md) | Where `broadwaycreation.rw` is hosted (detected) |
| [DEPLOY_AOS_PRODUCTION.md](./docs/DEPLOY_AOS_PRODUCTION.md) | AOS VPS deploy + GitHub Actions auto-deploy |
| [AUTH_SETUP.md](./docs/AUTH_SETUP.md) | Google, Microsoft, email, phone OTP setup |
| [PRODUCTION_DEPLOY.md](./docs/PRODUCTION_DEPLOY.md) | Alt: DigitalOcean + Vercel checklist |
| [mobile/README.md](./mobile/README.md) | iOS / Android app (Expo) |
| [GET_APP_ON_STORES.md](./docs/GET_APP_ON_STORES.md) | Publish app so users can download (start here) |
| [APP_STORE_RELEASE.md](./docs/APP_STORE_RELEASE.md) | App Store & Google Play technical detail |
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
