# Authentication setup (Broadway PM)

Production host: **AOS VPS** — `http://broadwaycreation.rw` (nginx → Next.js `:3001`, API `:3000` at `/api`).

| Method | Backend env | Frontend env (build time) |
|--------|-------------|---------------------------|
| Email / password | JWT secrets, DB | — |
| Forgot password | `SMTP_*`, `APP_URL` | — |
| Google | `GOOGLE_CLIENT_ID` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| Microsoft | `MICROSOFT_CLIENT_ID` | `NEXT_PUBLIC_MICROSOFT_CLIENT_ID` |
| Phone OTP | `AFRICASTALKING_*` or `TWILIO_*` | — |

OAuth client IDs are **public**. Secrets (JWT, SMTP, SMS API keys) stay only in `backend/.env` on the server.

---

## 1. Google Sign-In (configured)

**Client ID:** `428424757298-bqrqu00qb40e53mibpkfi5m6i1l1io7o.apps.googleusercontent.com`

### Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** (Web application).
3. **Authorized JavaScript origins:**
   - `http://broadwaycreation.rw`
   - `http://www.broadwaycreation.rw`
   - `http://localhost:3001` (local dev)
   - Add `https://` versions after SSL is enabled.
4. Save.

### Server files

| File | Key |
|------|-----|
| `backend/.env` | `GOOGLE_CLIENT_ID=428424757298-...apps.googleusercontent.com` |
| `frontend/.env.production` | `NEXT_PUBLIC_GOOGLE_CLIENT_ID=` (same value) |

On deploy, `scripts/deploy/sync-oauth-env.sh` copies values from `deploy/env/oauth.production.env`.

After any frontend env change: `cd frontend && npm run build` then `pm2 restart broadway-web`.

---

## 2. Email sign-in & forgot password

### Email login

Requires PostgreSQL user with `password_hash`. Demo: `platform@broadway.demo` / `Demo2026!` (after seed).

```bash
curl -X POST http://broadwaycreation.rw/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"platform@broadway.demo","password":"Demo2026!"}'
```

### SMTP (password reset emails)

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=support@broadwaycreation.rw
SMTP_PASS=***
SMTP_FROM=Broadway PM <support@broadwaycreation.rw>
APP_URL=http://broadwaycreation.rw/login
```

Reset links use `APP_URL?reset=<token>`. The login page reads `?reset=` automatically.

---

## 3. Microsoft Sign-In (Azure) — setup steps

### A. Create Azure app

1. [Azure Portal](https://portal.azure.com/) → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. **Name:** Broadway Property Management  
3. **Supported account types:** *Accounts in any organizational directory and personal Microsoft accounts*  
4. **Redirect URI:** Platform **Single-page application (SPA)**  
   - `http://broadwaycreation.rw/login`  
   - `http://localhost:3001/login`  
   - Add `https://` URLs when SSL is ready.  
5. Register → copy **Application (client) ID**.

### B. Enable public client / tokens

1. **Authentication** → ensure **Access tokens** and **ID tokens** are enabled for SPA.  
2. **API permissions** → **Microsoft Graph** → delegated: `openid`, `profile`, `email` (often added by default with OpenID).

### C. Environment variables

```env
# backend/.env
MICROSOFT_CLIENT_ID=<application-client-id>

# frontend/.env.production
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=<same-client-id>
```

Add to `deploy/env/oauth.production.env`, run deploy (or `bash scripts/deploy/sync-oauth-env.sh`), rebuild frontend.

### D. Test

Open `/login` → **Sign in with Microsoft** → popup → should land on `/dashboard`.

---

## 4. Phone OTP (Africa’s Talking) — setup steps

### A. Create account

1. Go to [https://africastalking.com](https://africastalking.com) → **Sign up**.  
2. Choose **Rwanda** as country.  
3. Complete KYC / business verification (required for production SMS).  
4. In dashboard note **Username** and generate **API Key**.

### B. Sandbox vs production

| Mode | Use |
|------|-----|
| **Sandbox** | Free testing; only sends to **whitelisted** phone numbers you add in dashboard |
| **Production** | Live MTN/Airtel delivery; requires approved account + **Sender ID** |

### C. Sender ID

Request a short sender ID (e.g. `BROADWAY`) in the Africa’s Talking dashboard (Rwanda regulations apply).

### D. Server env

```env
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_SENDER_ID=BROADWAY
```

Restart API: `pm2 restart broadway-api`.

### E. Alternative: Twilio

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=+1xxxxxxxxxx
```

### F. User flow

1. Sign in → enter `078xxxxxxx` → **Send SMS code**  
2. Enter 6-digit code → **Verify & sign in**  
3. In **development** only, API may return `devCode` in JSON (not in production).

Phone numbers are normalized to `+250...`.

---

## 5. Deploy checklist

```bash
cd /var/www/Broadway-Property-Management
git pull origin main
bash scripts/deploy/sync-oauth-env.sh .
bash scripts/deploy/deploy.sh
```

Or push to `main` with GitHub Actions secrets (`SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`).

### Verify Google on live

1. Open `http://broadwaycreation.rw/login` — Google button visible.  
2. Sign in with Google account.  
3. Network tab: `POST /api/auth/google` → 200 with tokens.

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| Google button missing | Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and **rebuild** frontend |
| `GOOGLE_CLIENT_ID is not configured` | Fix `backend/.env`, restart API |
| Google popup / origin error | Add exact site URL to Google Console origins |
| Microsoft button missing | Set `NEXT_PUBLIC_MICROSOFT_CLIENT_ID`, rebuild |
| `MICROSOFT_CLIENT_ID is not configured` | Set backend env, restart API |
| Reset email not received | Configure `SMTP_*` |
| Reset link does nothing | Use `/login?reset=...`; ensure `APP_URL` ends with `/login` |
| SMS not received | Africa’s Talking production + whitelist (sandbox) or sender ID approval |
| `Workspace is pending activation` | Activate account in platform **Clients** or DB |

---

## 7. Related docs

- [DEPLOY_AOS_PRODUCTION.md](./DEPLOY_AOS_PRODUCTION.md) — VPS deploy & GitHub Actions  
- [HOSTING_AOS.md](./HOSTING_AOS.md) — where the site is hosted
