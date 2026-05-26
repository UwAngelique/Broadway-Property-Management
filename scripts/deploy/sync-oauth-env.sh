#!/usr/bin/env bash
# Merge deploy/env/oauth.production.env into backend/.env and frontend/.env.production (Linux server).

set -euo pipefail

ROOT="${1:-.}"
OAUTH_FILE="$ROOT/deploy/env/oauth.production.env"
BACKEND_ENV="$ROOT/backend/.env"
FRONTEND_ENV="$ROOT/frontend/.env.production"

[[ -f "$OAUTH_FILE" ]] || exit 0

upsert() {
  local file="$1" key="$2" value="$3"
  [[ -n "$value" ]] || return 0
  touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

set -a
# shellcheck disable=SC1090
source "$OAUTH_FILE"
set +a

[[ -f "$BACKEND_ENV" ]] || cp "$ROOT/backend/.env.example" "$BACKEND_ENV"
upsert "$BACKEND_ENV" "GOOGLE_CLIENT_ID" "${GOOGLE_CLIENT_ID:-}"
upsert "$BACKEND_ENV" "MICROSOFT_CLIENT_ID" "${MICROSOFT_CLIENT_ID:-}"

if [[ ! -f "$FRONTEND_ENV" ]]; then
  cp "$ROOT/deploy/env/frontend.production.example" "$FRONTEND_ENV"
fi
upsert "$FRONTEND_ENV" "NEXT_PUBLIC_GOOGLE_CLIENT_ID" "${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}"
upsert "$FRONTEND_ENV" "NEXT_PUBLIC_MICROSOFT_CLIENT_ID" "${NEXT_PUBLIC_MICROSOFT_CLIENT_ID:-}"

echo "[sync-oauth-env] OAuth keys synced from oauth.production.env"
