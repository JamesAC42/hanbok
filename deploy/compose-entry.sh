#!/usr/bin/env bash
# Forced command for the GitHub Actions deploy key on a Docker server (see
# docs/deploy-docker.md). authorized_keys pins the key to a copy of this file,
# so the key can only switch the running images to another commit's images or
# roll back.
#
#   deploy <40-char sha>   pull that commit's images, start them, health-check,
#                          and put the previous images back if the check fails
#   rollback               switch back to the images that ran before
set -euo pipefail

DIR="${HANBOK_COMPOSE_DIR:-/srv/hanbok}"
API_HEALTH="${API_HEALTH:-http://127.0.0.1:5666/api/health}"
APP_HEALTH="${APP_HEALTH:-http://127.0.0.1:3059/}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"
cd "$DIR"

log() { echo "[$(date -u +%FT%TZ)] $*" | tee -a deploy.log; }

healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT))
  while [ $SECONDS -lt $deadline ]; do
    if curl -fsS -o /dev/null "$API_HEALTH" && curl -fsS -o /dev/null "$APP_HEALTH"; then return 0; fi
    sleep 2
  done
  return 1
}

run_tag() { HANBOK_TAG="$1" docker compose up -d --remove-orphans; }

read -r action sha extra <<< "${SSH_ORIGINAL_COMMAND:-${*:-}}"
current="$(cat .tag 2>/dev/null || true)"

case "$action" in
  deploy)
    [[ "$sha" =~ ^[0-9a-f]{40}$ && -z "${extra:-}" ]] || { echo "usage: deploy <40-char sha>" >&2; exit 2; }
    log "deploying ${sha:0:7} (was ${current:0:7})"
    HANBOK_TAG="$sha" docker compose pull -q
    run_tag "$sha"
    if healthy; then
      [ -n "$current" ] && [ "$current" != "$sha" ] && echo "$current" > .tag-prev
      echo "$sha" > .tag
      log "live on ${sha:0:7}"
      docker image prune -af --filter "until=168h" >/dev/null || true
    else
      log "health check failed on ${sha:0:7}"
      if [ -n "$current" ]; then run_tag "$current"; log "back on ${current:0:7}"; fi
      exit 1
    fi
    ;;
  rollback)
    prev="$(cat .tag-prev 2>/dev/null || true)"
    [ -n "$prev" ] || { echo "nothing to roll back to" >&2; exit 1; }
    log "rolling back ${current:0:7} -> ${prev:0:7}"
    run_tag "$prev"
    healthy || { log "rollback target is unhealthy too"; exit 1; }
    echo "$current" > .tag-prev
    echo "$prev" > .tag
    log "live on ${prev:0:7}"
    ;;
  *)
    echo "usage: deploy <sha> | rollback" >&2
    exit 2
    ;;
esac
