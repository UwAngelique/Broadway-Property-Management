# Staging deployment (recommended stack)

| Layer | Choice | Why |
|--------|--------|-----|
| Frontend | **Vercel** | Native Next.js, free preview URLs |
| Backend | **Render** | Simple Node/Nest deploy, stable free tier |
| Database | **Neon** | Serverless Postgres, pooling, works well with Render |

Alternatives: Railway (backend+DB in one place) or Supabase (Postgres + extras). This repo is configured for **Vercel + Render + Neon**.

---

## 1. Neon database

1. Create project at [neon.tech](https://neon.tech).
2. Create database `broadway_pm`.
3. Copy connection details → map to Render env:
   - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME=broadway_pm`
4. Set `DB_SYNCHRONIZE=false` on staging/production (use migrations later).

---

## 2. Render (API)

1. Push repo to GitHub.
2. New **Web Service** → connect repo → root `backend`.
3. Build: `npm install && npm run build`
4. Start: `npm run start:prod`
5. Environment:
   - `NODE_ENV=production`
   - `DB_SYNCHRONIZE=false`
   - `JWT_SECRET` / `JWT_REFRESH_SECRET` — strong random strings
   - `CORS_ORIGINS=https://YOUR-APP.vercel.app`
   - `APP_URL=https://YOUR-APP.vercel.app`
6. Deploy → note API URL, e.g. `https://broadway-pm-api.onrender.com`

Seed demo data (from your machine with env pointing at Neon):

```bash
cd backend
node scripts/seed-demo-staging.js
```

---

## 3. Vercel (frontend)

1. Import repo → root `frontend`.
2. Environment:
   - `NEXT_PUBLIC_API_BASE_URL=https://YOUR-API.onrender.com`
   - `API_PROXY_TARGET=https://YOUR-API.onrender.com` (for optional `/api` rewrite in preview)
3. Deploy.

For production-like routing without CORS issues, set `NEXT_PUBLIC_API_BASE_URL` to your Render URL directly (backend already enables CORS for `CORS_ORIGINS`).

---

## 4. Demo logins (after seed)

| Role | Email | Password |
|------|--------|----------|
| Platform | platform@broadway.demo | Demo2026! |
| Landlord | owner@demo-landlord.rw | Demo2026! |
| Tenant | tenant@demo-landlord.rw | Demo2026! |

Change passwords immediately on a public staging URL.

---

## 5. Google sign-in (optional)

1. Google Cloud Console → OAuth client (Web).
2. Authorized origins: `https://YOUR-APP.vercel.app`
3. Set `GOOGLE_CLIENT_ID` on Render and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on Vercel (same value).

---

## 6. Partner walkthrough

Share: `docs/PARTNER_WALKTHROUGH.md` (print to PDF from browser: Ctrl+P → Save as PDF).

---

## Local DB fix

`backend/.env` must include `DB_NAME=broadway_pm` (not `broadway_pmD`). File was repaired; restart API after changes.
