# Deploying

Every push to `main` deploys to hanbokstudy.com once CI passes on it.

## How it works

1. `.github/workflows/deploy.yml` runs after the CI workflow succeeds on a push
   to `main`. It SSHes to the server with a deploy key that can only run
   `scripts/deploy-entry.sh` (pinned in `authorized_keys`), passing the commit SHA.
2. On the server, `scripts/deploy.sh` (taken from the commit being deployed):
   - checks out the commit in `/var/www/hanbokstudy.com/source/hanbok`,
     refusing if someone has uncommitted edits to tracked files there;
   - runs `npm install` in `server/` and `app/` only if that `package.json` changed;
   - builds the app into `app/.next-build` while the live site keeps serving
     `app/.next`. If the build fails, the checkout goes back to the old commit and
     the site never notices;
   - swaps the new build into `app/.next` (the old one is kept as
     `app/.next-prev`) and runs `pm2 reload hanbok hanbok-client`;
   - health-checks the app, the API through the app, and that the new build is
     the one being served. If that fails within 30 seconds, it puts the previous
     build back and the workflow goes red.
3. Deploys run one at a time; a push that lands mid-deploy waits its turn.

Each deploy appends a line to `.deploy-log` in the checkout.

## Redeploying or rolling back

From GitHub: Actions → Deploy → Run workflow.

- **rollback** swaps back to the previous build without rebuilding (seconds).
  Running it again flips forward.
- **deploy** with a branch, tag or SHA builds and deploys that commit; use an
  older SHA to go further back than one deploy.

On the server: `bash scripts/deploy.sh rollback` or `bash scripts/deploy.sh deploy <sha>`.

A rollback restores code and the build, not `node_modules`. If a bad deploy
changed dependencies, deploy the older SHA instead so `npm install` runs again.

## One-time setup

On the server, as `adminuser`:

```bash
cd /var/www/hanbokstudy.com/source/hanbok
git fetch origin
git show origin/main:scripts/deploy-entry.sh > ~/hanbok-deploy-entry.sh   # or the PR branch before merging
chmod 700 ~/hanbok-deploy-entry.sh

ssh-keygen -t ed25519 -N "" -C github-actions-hanbok-deploy -f ~/hanbok_deploy_key
echo "command=\"$HOME/hanbok-deploy-entry.sh\",restrict $(cat ~/hanbok_deploy_key.pub)" >> ~/.ssh/authorized_keys

cat ~/hanbok_deploy_key                                          # -> secret DEPLOY_SSH_KEY
echo "167.99.112.20 $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"   # -> secret DEPLOY_KNOWN_HOSTS
rm ~/hanbok_deploy_key ~/hanbok_deploy_key.pub
```

In GitHub → Settings → Secrets and variables → Actions:

| Kind     | Name                 | Value                                 |
|----------|----------------------|---------------------------------------|
| Secret   | `DEPLOY_SSH_KEY`     | the private key printed above         |
| Secret   | `DEPLOY_KNOWN_HOSTS` | the host key line printed above       |
| Variable | `DEPLOY_HOST`        | `167.99.112.20`                       |
| Variable | `DEPLOY_USER`        | `adminuser`                           |

If `~/hanbok-deploy-entry.sh` itself ever changes in the repo, copy it again
with the `git show` line above; `deploy.sh` updates itself with each deploy.

Server-specific overrides (pm2 names, ports, health timeout) go in
`~/.hanbok-deploy.env`; see the defaults at the top of `scripts/deploy.sh`.
