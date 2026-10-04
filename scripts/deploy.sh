#!/usr/bin/env bash
# Deploys a commit of this repo to the live checkout on the server.
#
# Run from GitHub Actions (.github/workflows/deploy.yml), or by hand on the server:
#   bash scripts/deploy.sh deploy <sha|branch>   build and switch to that commit
#   bash scripts/deploy.sh rollback              switch back to the previous build (no rebuild)
#
# The Next.js app is built into app/.next-build while the live site keeps
# serving app/.next, then the two are swapped and pm2 reloads. The old build is
# kept as app/.next-prev so a rollback is just a swap. If the health check after
# the reload fails, the previous build is put back automatically.
#
# Server-specific settings can be overridden in ~/.hanbok-deploy.env (see the
# defaults below). Setup and usage: docs/deploy.md
set -Eeuo pipefail

[ -f "$HOME/.hanbok-deploy.env" ] && . "$HOME/.hanbok-deploy.env"
# Non-interactive SSH sessions skip .bashrc, so load nvm if node isn't on PATH.
if ! command -v pm2 >/dev/null && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
fi

DEPLOY_PATH="${DEPLOY_PATH:-$(git rev-parse --show-toplevel)}"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
# pm2 process names to reload, server first.
PM2_APPS="${PM2_APPS:-hanbok hanbok-client}"
# Goes through the app's /api rewrite, so it checks the app can reach the server.
SERVER_HEALTH_URL="${SERVER_HEALTH_URL:-http://127.0.0.1:3059/api/session}"
APP_HEALTH_URL="${APP_HEALTH_URL:-http://127.0.0.1:3059/}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-30}"

cd "$DEPLOY_PATH"
APP_DIR="$DEPLOY_PATH/app"
LOG_FILE="$DEPLOY_PATH/.deploy-log"
PREV_SHA_FILE="$DEPLOY_PATH/.deploy-prev-sha"

log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

# One deploy at a time.
exec 9>"$DEPLOY_PATH/.deploy.lock"
flock -n 9 || { log "another deploy is running"; exit 1; }

changed() { # changed <from> <to> <path>: true if <path> differs between commits
  ! git diff --quiet "$1" "$2" -- "$3"
}

install_deps() { # install_deps <dir> <from> <to>
  if [ ! -d "$1/node_modules" ] || changed "$2" "$3" "$1/package.json"; then
    log "installing dependencies in $1"
    (cd "$1" && npm install --no-audit --no-fund)
  fi
}

reload() {
  log "reloading pm2: $PM2_APPS"
  # pm2 reload only acts on its first name argument, so reload one at a time.
  for app in $PM2_APPS; do
    pm2 reload "$app" --update-env
  done
  # Give the old processes time to exit so the health check hits the new ones.
  sleep "${RELOAD_GRACE:-5}"
}

healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT)) code build_url
  # Only the new Next.js process serves the new build's manifest, so this fails
  # if an old process is still holding the port.
  build_url="${APP_HEALTH_URL%/}/_next/static/$(cat "$APP_DIR/.next/BUILD_ID")/_buildManifest.js"
  for url in "$SERVER_HEALTH_URL" "$APP_HEALTH_URL" "$build_url"; do
    while :; do
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)
      if [ "$code" != "000" ] && [ "$code" -lt 500 ] && { [ "$url" != "$build_url" ] || [ "$code" = 200 ]; }; then
        log "healthy: $url ($code)"
        break
      fi
      if [ $SECONDS -ge $deadline ]; then
        log "unhealthy: $url (last status $code)"
        return 1
      fi
      sleep 2
    done
  done
}

# Puts back the previous source and build, then reloads.
restore() { # restore <prev-sha>
  log "restoring $1"
  git reset --hard -q "$1"
  if [ -d "$APP_DIR/.next-prev" ]; then
    rm -rf "$APP_DIR/.next-failed"
    [ -d "$APP_DIR/.next" ] && mv "$APP_DIR/.next" "$APP_DIR/.next-failed"
    mv "$APP_DIR/.next-prev" "$APP_DIR/.next"
  fi
  reload
}

deploy() {
  local target="${1:-$DEPLOY_REMOTE/$DEPLOY_BRANCH}" prev sha
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    log "the checkout has uncommitted changes to tracked files; refusing to overwrite them:"
    git status --short --untracked-files=no
    exit 1
  fi

  git fetch -q "$DEPLOY_REMOTE" "$DEPLOY_BRANCH"
  sha=$(git rev-parse --verify "$target^{commit}")
  prev=$(git rev-parse HEAD)
  log "deploying $(git log -1 --format='%h %s' "$sha") (was ${prev:0:7})"

  # From here on, a failure before the swap puts the old source back. The live
  # site keeps running its old build throughout.
  trap '[ "$BASH_SUBSHELL" -eq 0 ] && { log "failed before switching; site still on ${prev:0:7}"; git reset --hard -q "$prev"; rm -rf "$APP_DIR/.next-build"; }' ERR
  git reset --hard -q "$sha"
  install_deps "$DEPLOY_PATH/server" "$prev" "$sha"
  install_deps "$APP_DIR" "$prev" "$sha"

  log "building app"
  rm -rf "$APP_DIR/.next-build"
  (cd "$APP_DIR" && NEXT_DIST_DIR=.next-build npm run build)
  trap - ERR

  rm -rf "$APP_DIR/.next-prev"
  [ -d "$APP_DIR/.next" ] && mv "$APP_DIR/.next" "$APP_DIR/.next-prev"
  mv "$APP_DIR/.next-build" "$APP_DIR/.next"
  reload

  if ! healthy; then
    restore "$prev"
    echo "$(date -u +%FT%TZ) FAILED ${sha:0:7}, rolled back to ${prev:0:7}" >> "$LOG_FILE"
    exit 1
  fi
  echo "$prev" > "$PREV_SHA_FILE"
  echo "$(date -u +%FT%TZ) deployed ${sha:0:7} (was ${prev:0:7})" >> "$LOG_FILE"
  log "done"
}

rollback() {
  [ -f "$PREV_SHA_FILE" ] && [ -d "$APP_DIR/.next-prev" ] || {
    log "no previous build to roll back to; redeploy an older commit instead"
    exit 1
  }
  local prev cur
  prev=$(cat "$PREV_SHA_FILE")
  cur=$(git rev-parse HEAD)
  restore "$prev"
  # Keep the build we rolled away from so rolling back again flips forward.
  [ -d "$APP_DIR/.next-failed" ] && mv "$APP_DIR/.next-failed" "$APP_DIR/.next-prev"
  echo "$cur" > "$PREV_SHA_FILE"
  healthy || log "warning: health check failed after rollback"
  echo "$(date -u +%FT%TZ) rolled back to ${prev:0:7} (was ${cur:0:7})" >> "$LOG_FILE"
  log "done"
}

case "${1:-deploy}" in
  deploy) deploy "${2:-}" ;;
  rollback) rollback ;;
  *) echo "usage: $0 deploy [sha] | rollback" >&2; exit 2 ;;
esac
