#!/usr/bin/env bash
# One-time Ubuntu setup for AOS VPS hosting broadwaycreation.rw

set -euo pipefail

APP_DIR="/var/www/Broadway-Property-Management"
REPO_URL="https://github.com/Dgeba/Broadway-Property-Management.git"
BRANCH="main"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir) APP_DIR="$2"; shift 2 ;;
    --repo) REPO_URL="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

log() { echo "[bootstrap] $*"; }

if [[ "$(id -u)" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

log "Installing system packages..."
$SUDO apt-get update -qq
$SUDO apt-get install -y curl git nginx build-essential

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
fi

log "Installing PM2..."
$SUDO npm install -g pm2

if [[ ! -d "$APP_DIR/.git" ]]; then
  log "Cloning repository to $APP_DIR..."
  $SUDO mkdir -p "$(dirname "$APP_DIR")"
  if [[ ! -d "$APP_DIR" ]]; then
    $SUDO git clone "$REPO_URL" "$APP_DIR"
  fi
  $SUDO chown -R "$USER:$USER" "$APP_DIR" 2>/dev/null || true
fi

cd "$APP_DIR"
git fetch origin "$BRANCH" || true
git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"
git pull origin "$BRANCH" || true

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  log "Created backend/.env from example — EDIT before production use"
fi

if [[ ! -f frontend/.env.production ]]; then
  cp deploy/env/frontend.production.example frontend/.env.production
fi

log "Bootstrap complete. Next steps:"
echo "  1. Edit $APP_DIR/backend/.env (DB, JWT, CORS)"
echo "  2. sudo cp $APP_DIR/deploy/nginx/broadwaycreation.conf /etc/nginx/sites-available/broadwaycreation.rw"
echo "  3. sudo ln -sf /etc/nginx/sites-available/broadwaycreation.rw /etc/nginx/sites-enabled/"
echo "  4. sudo nginx -t && sudo systemctl reload nginx"
echo "  5. bash $APP_DIR/scripts/deploy/deploy.sh"
echo "  6. pm2 save && sudo env PATH=\$PATH pm2 startup"
