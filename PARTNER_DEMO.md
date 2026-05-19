# Partner demo link (local tunnel)

## Quick start

1. **PostgreSQL** running with database `broadway_pm` (see `SETUP.md`).
2. **Backend** (terminal 1):
   ```bash
   cd backend
   npm run start:dev
   ```
3. **Frontend** (terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
4. **Tunnel** (terminal 3) — share the HTTPS URL with your partner:
   ```bash
   npx --yes localtunnel --port 3001
   ```
   Or install [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/):
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

The frontend proxies API calls through `/api` → `http://localhost:3000`, so **one tunnel on port 3001** is enough for partners to use auth, dashboards, and file uploads.

## Demo logins

After seeding or signup:

- **Landlord owner**: sign up at `/` with a workspace name and plan.
- **Platform operator** (optional):
  ```bash
  cd backend
  node scripts/ensure-platform.js your@email.com
  ```

## What to show

1. Home → Sign up / Sign in with plan selection.
2. **Departments hub** — tile counts (clients, properties, finance, taxes, etc.).
3. Click **Clients** (platform) or **Customers** (landlord) to see the full list.
4. **Finance** — approve manual MoMo/bank proofs.
5. **My rent** (tenant login) — submit MoMo message or screenshot.

Bank/MoMo API and RRA live filing remain pending external approval; manual proof flow is production-ready for pilot landlords.
