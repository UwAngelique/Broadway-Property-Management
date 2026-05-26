# Deploy to AOS VPS (broadwaycreation.rw)

Production runs on an **AOS Ltd** Ubuntu server (`197.243.29.113`). Deploy by pulling `main` on the server and restarting PM2. **GitHub Actions** can do this automatically over SSH when secrets are configured.

## 1. One-time server setup

SSH into the VPS (credentials from AOS / your hosting panel):

```bash
ssh YOUR_USER@197.243.29.113
```

Run bootstrap (installs Node 20, PM2, clones repo if missing):

```bash
curl -fsSL https://raw.githubusercontent.com/Dgeba/Broadway-Property-Management/main/scripts/deploy/bootstrap-server.sh | bash -s -- \
  --app-dir /var/www/Broadway-Property-Management \
  --repo https://github.com/Dgeba/Broadway-Property-Management.git
```

Or clone manually:

```bash
sudo mkdir -p /var/www
sudo git clone https://github.com/Dgeba/Broadway-Property-Management.git /var/www/Broadway-Property-Management
cd /var/www/Broadway-Property-Management
```

### Environment files (keep on server only — never commit)

```bash
cp backend/.env.example backend/.env
cp deploy/env/frontend.production.example frontend/.env.production
nano backend/.env
nano frontend/.env.production
```

**backend/.env** (minimum for production):

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=***
DB_NAME=broadway_pm
DB_SYNCHRONIZE=false
DB_SSL=false
JWT_SECRET=<32+ random chars>
JWT_REFRESH_SECRET=<32+ random chars>
CORS_ORIGINS=http://broadwaycreation.rw,http://www.broadwaycreation.rw
APP_URL=http://broadwaycreation.rw
```

**frontend/.env.production**:

```env
NEXT_PUBLIC_API_BASE_URL=/api
API_PROXY_TARGET=http://127.0.0.1:3000
```

### nginx

```bash
sudo cp deploy/nginx/broadwaycreation.conf /etc/nginx/sites-available/broadwaycreation.rw
sudo ln -sf /etc/nginx/sites-available/broadwaycreation.rw /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### OAuth (Google / Microsoft)

Committed defaults live in `deploy/env/oauth.production.env`. Each deploy runs `scripts/deploy/sync-oauth-env.sh` to update `backend/.env` and `frontend/.env.production`. See [AUTH_SETUP.md](./AUTH_SETUP.md).

### First deploy

```bash
cd /var/www/Broadway-Property-Management
bash scripts/deploy/deploy.sh
pm2 save
sudo env PATH=$PATH pm2 startup systemd -u $USER --hp $HOME
```

Seed demo data once (optional):

```bash
cd backend && node scripts/seed-demo-staging.js
```

## 2. GitHub Actions auto-deploy

Workflow: `.github/workflows/deploy-aos-production.yml`

On every push to `main`, GitHub will SSH to the server and run `scripts/deploy/deploy.sh`.

### Required repository secrets

| Secret | Example | Purpose |
|--------|---------|---------|
| `SSH_HOST` | `197.243.29.113` | AOS VPS IP |
| `SSH_USER` | `ubuntu` or `deploy` | SSH login user |
| `SSH_PRIVATE_KEY` | PEM private key | Deploy key (see below) |
| `SSH_PORT` | `22` | Optional; default 22 |
| `DEPLOY_PATH` | `/var/www/Broadway-Property-Management` | Git clone path on server |
| `RUN_MIGRATIONS` | `false` | Set `true` when ready to run TypeORM migrations on deploy |

**Settings → Secrets and variables → Actions → New repository secret**

### Deploy key on the server

On your laptop or the server:

```bash
ssh-keygen -t ed25519 -C "github-actions-broadway" -f ./broadway_deploy -N ""
```

- Add **`broadway_deploy.pub`** to `~/.ssh/authorized_keys` on the VPS.
- Paste **`broadway_deploy`** (private key) into GitHub secret `SSH_PRIVATE_KEY`.

### Manual deploy from GitHub

**Actions → Deploy AOS production → Run workflow**

## 3. Verify after deploy

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/platform/finance
# Expect 401 (not 404) when backend is updated

curl -s http://broadwaycreation.rw/api/billing/plans | head -c 80
```

In the browser: log in as `platform@broadway.demo` → **Finance** — no red 403 JSON box.

## 4. HTTPS (recommended)

Request an SSL certificate via AOS panel or install Certbot on the VPS:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d broadwaycreation.rw -d www.broadwaycreation.rw
```

Update `CORS_ORIGINS` and `APP_URL` to `https://` after certificates are active.
