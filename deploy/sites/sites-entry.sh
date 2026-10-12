#!/usr/bin/env bash
# Forced command for the sites server's deploy key (authorized_keys pins the
# key to a copy of this file). The key can only switch one known site to
# another commit's image, or back.
#
#   deploy <service> <40-char sha>
#   rollback <service>
set -euo pipefail
cd "${SITES_DIR:-/srv/sites}"

read -r action service sha extra <<< "${SSH_ORIGINAL_COMMAND:-${*:-}}"
case "$service" in
  blog) port=3000 ;;
  kirakissu) port=3001 ;;
  *) echo "unknown site: $service" >&2; exit 2 ;;
esac
var="$(echo "$service" | tr a-z A-Z)_TAG"
log() { echo "[$(date -u +%FT%TZ)] $service: $*" | tee -a deploy.log; }
current="$(cat ".tag-$service" 2>/dev/null || true)"

up() { env "$var=$1" docker compose up -d --no-deps "$service"; }
healthy() {
  for _ in $(seq 1 45); do curl -fsS -o /dev/null "http://127.0.0.1:$port/" && return 0; sleep 2; done
  return 1
}

case "$action" in
  deploy)
    [[ "$sha" =~ ^[0-9a-f]{40}$ && -z "${extra:-}" ]] || { echo "usage: deploy <service> <40-char sha>" >&2; exit 2; }
    log "deploying ${sha:0:7} (was ${current:0:7})"
    env "$var=$sha" docker compose pull -q "$service"
    up "$sha"
    if healthy; then
      [ -n "$current" ] && [ "$current" != "$sha" ] && echo "$current" > ".tag-prev-$service"
      echo "$sha" > ".tag-$service"
      log "live on ${sha:0:7}"
    else
      log "health check failed on ${sha:0:7}"
      [ -n "$current" ] && up "$current" && log "back on ${current:0:7}"
      exit 1
    fi
    ;;
  rollback)
    prev="$(cat ".tag-prev-$service" 2>/dev/null || true)"
    [ -n "$prev" ] || { echo "nothing to roll back to" >&2; exit 1; }
    up "$prev"; healthy || { log "rollback target unhealthy"; exit 1; }
    echo "$current" > ".tag-prev-$service"; echo "$prev" > ".tag-$service"
    log "rolled back to ${prev:0:7}"
    ;;
  *) echo "usage: deploy <service> <sha> | rollback <service>" >&2; exit 2 ;;
esac
