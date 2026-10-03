#!/usr/bin/env bash
# Forced command for the GitHub Actions deploy key on the server. A copy lives
# outside the checkout and authorized_keys pins the key to it (see
# docs/deploy.md), so the key can only deploy a commit that exists on GitHub or
# roll back, and can't run anything else.
set -euo pipefail

[ -f "$HOME/.hanbok-deploy.env" ] && . "$HOME/.hanbok-deploy.env"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/hanbokstudy.com/source/hanbok}"
cd "$DEPLOY_PATH"

read -r action sha extra <<< "${SSH_ORIGINAL_COMMAND:-}"
case "$action" in
  deploy)
    [[ "$sha" =~ ^[0-9a-f]{40}$ && -z "${extra:-}" ]] || { echo "usage: deploy <40-char sha>" >&2; exit 2; }
    git fetch -q origin
    # Run the deploy script from the commit being deployed, so changes to it
    # ship with the code they belong to.
    git show "$sha:scripts/deploy.sh" > "$HOME/.hanbok-deploy.sh"
    exec bash "$HOME/.hanbok-deploy.sh" deploy "$sha"
    ;;
  rollback)
    exec bash "$DEPLOY_PATH/scripts/deploy.sh" rollback
    ;;
  *)
    echo "usage: deploy <sha> | rollback" >&2
    exit 2
    ;;
esac
