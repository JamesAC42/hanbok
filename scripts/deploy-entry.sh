#!/usr/bin/env bash
# Forced command for the GitHub Actions deploy key on the server. A copy lives
# outside the checkout and authorized_keys pins the key to it (see
# docs/deploy.md), so the key can only deploy a commit that exists on GitHub or
# roll back, and can't run anything else.
#
#   deploy <sha> | rollback                   production
#   staging-deploy <sha> | staging-rollback   staging (see docs/deploy.md)
set -euo pipefail

PROD_PATH=/var/www/hanbokstudy.com/source/hanbok

read -r action sha extra <<< "${SSH_ORIGINAL_COMMAND:-}"
case "$action" in
  staging-*)
    target=staging
    action="${action#staging-}"
    export DEPLOY_ENV_FILE="$HOME/.hanbok-deploy-staging.env"
    [ -f "$DEPLOY_ENV_FILE" ] || { echo "staging isn't set up: $DEPLOY_ENV_FILE is missing (see docs/deploy.md)" >&2; exit 1; }
    ;;
  *)
    target=production
    export DEPLOY_ENV_FILE="$HOME/.hanbok-deploy.env"
    ;;
esac

[ -f "$DEPLOY_ENV_FILE" ] && . "$DEPLOY_ENV_FILE"
DEPLOY_PATH="${DEPLOY_PATH:-$PROD_PATH}"
if [ "$target" = staging ] && [ "$(realpath -m "$DEPLOY_PATH")" = "$(realpath -m "$PROD_PATH")" ]; then
  echo "refusing: the staging DEPLOY_PATH points at the production checkout" >&2
  exit 1
fi
cd "$DEPLOY_PATH"

case "$action" in
  deploy)
    [[ "$sha" =~ ^[0-9a-f]{40}$ && -z "${extra:-}" ]] || { echo "usage: deploy <40-char sha>" >&2; exit 2; }
    git fetch -q origin
    if [ "$target" = production ]; then
      # Run the deploy script from the commit being deployed, so changes to it
      # ship with the code they belong to.
      git show "$sha:scripts/deploy.sh" > "$HOME/.hanbok-deploy.sh"
      exec bash "$HOME/.hanbok-deploy.sh" deploy "$sha"
    fi
    # Staging can deploy a PR's merge commit, which no branch points at, and
    # branches that predate the current deploy script, so it fetches the commit
    # by SHA and always runs main's deploy script.
    git fetch -q origin "$sha"
    git show origin/main:scripts/deploy.sh > "$HOME/.hanbok-deploy-staging.sh"
    exec bash "$HOME/.hanbok-deploy-staging.sh" deploy "$sha"
    ;;
  rollback)
    if [ "$target" = production ]; then
      exec bash "$DEPLOY_PATH/scripts/deploy.sh" rollback
    fi
    git fetch -q origin
    git show origin/main:scripts/deploy.sh > "$HOME/.hanbok-deploy-staging.sh"
    exec bash "$HOME/.hanbok-deploy-staging.sh" rollback
    ;;
  *)
    echo "usage: deploy <sha> | rollback | staging-deploy <sha> | staging-rollback" >&2
    exit 2
    ;;
esac
