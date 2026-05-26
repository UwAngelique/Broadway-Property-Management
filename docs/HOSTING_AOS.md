# Where broadwaycreation.rw is hosted

Production is **not** on Vercel or DigitalOcean. It runs on a **single Ubuntu VPS** at **AOS Ltd** (Rwanda National Data Center operator).

## DNS & network

| Item | Value |
|------|--------|
| **Domain** | `broadwaycreation.rw` |
| **A record** | `197.243.29.113` |
| **www** | `197.243.29.113` (same host) |
| **Nameservers** | `ns4.aos.rw`, `ns5.aos.rw` |
| **Registrar / DNS** | [AOS Ltd](https://aos.rw) — AS329104, Kigali |
| **HTTPS** | Not configured on port 443 (site served over HTTP today) |

## Server stack (detected from live responses)

| Layer | Technology |
|-------|------------|
| **OS** | Ubuntu (nginx package `1.24.0`) |
| **Reverse proxy** | nginx → routes `/api/*` to NestJS, everything else to Next.js |
| **API** | NestJS on `127.0.0.1:3000` (paths like `/auth/login`, no `/api` prefix on the app) |
| **Web** | Next.js 16 (`X-Powered-By: Next.js`, static prerender) on `127.0.0.1:3001` |
| **Process manager** | Likely **PM2** (typical for this layout; confirm with `pm2 list` on the server) |
| **Database** | PostgreSQL (local on VPS or AOS-managed; not exposed publicly) |

## How traffic is routed

```
Browser → nginx (197.243.29.113:80)
            ├─ /api/*  → http://127.0.0.1:3000/*   (NestJS)
            └─ /*      → http://127.0.0.1:3001      (Next.js)
```

The frontend uses `NEXT_PUBLIC_API_BASE_URL=/api` in the browser, which matches this nginx layout.

## Live vs GitHub (`main`)

As of the hosting audit, production API **does not** yet include commits after platform finance endpoints:

- `GET /api/platform/finance` → **404** on live (should exist after deploy of commit `32774b0+`)
- `GET /api/billing/plans` → **200** (API is up)
- Login `platform@broadway.demo` → **works**

After a successful deploy from `main`, `/api/platform/finance` should return **401/403** without a token, not **404**.

## Auto-deploy

See **[DEPLOY_AOS_PRODUCTION.md](./DEPLOY_AOS_PRODUCTION.md)** for GitHub Actions SSH deploy and one-time server bootstrap.
