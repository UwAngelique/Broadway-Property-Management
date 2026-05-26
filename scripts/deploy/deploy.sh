#!/usr/bin/env bash
# Pull latest main, build backend + frontend, restart PM2.
# Run on the AOS VPS from repo root or via GitHub Actions SSH.

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
BRANCH="${DEPLOY_BRANCH:-main}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-false}"

log() { echo "[deploy] $*"; }

cd "$APP_DIR"
log "Working directory: $APP_DIR"

if [[ -d .git ]]; then
  log "Fetching $BRANCH..."
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  log "ERROR: $APP_DIR is not a git repository"
  exit 1
fi

if [[ ! -f backend/.env ]]; then
  log "ERROR: backend/.env missing — copy backend/.env.example and configure secrets"
  exit 1
fi

if [[ -f scripts/deploy/sync-oauth-env.sh ]]; then
  bash scripts/deploy/sync-oauth-env.sh "$APP_DIR"
fi

log "Building API..."
cd backend
npm ci
npm run build
if [[ "$RUN_MIGRATIONS" == "true" ]]; then
  log "Running database migrations..."
  npm run migration:run
fi
cd ..

log "Building web..."
cd frontend
if [[ -f .env.production ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi
npm ci
npm run build
cd ..

log "Restarting PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
  log "ERROR: pm2 not installed — run scripts/deploy/bootstrap-server.sh first"
  exit 1
fi

pm2 startOrReload "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
pm2 save

log "Health checks..."
sleep 3
api_code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/billing/plans || echo "000")
web_code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/ || echo "000")
platform_code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/platform/finance || echo "000")

log "API /billing/plans -> HTTP $api_code (expect 200)"
log "Web / -> HTTP $web_code (expect 200)"
log "API /platform/finance -> HTTP $platform_code (expect 401/403, not 404)"

if [[ "$api_code" != "200" ]] || [[ "$web_code" != "200" ]]; then
  log "ERROR: health check failed"
  pm2 logs --lines 40 --nostream || true
  exit 1
fi

if [[ "$platform_code" == "404" ]]; then
  log "WARN: /platform/finance still 404 — old API build? Check git SHA: $(git rev-parse --short HEAD)"
fi

log "Deploy finished OK ($(git rev-parse --short HEAD))"
