# Deploying

Every push to `main` deploys to hanbokstudy.com once CI passes on it. Any PR
or branch can be put on staging.hanbokstudy.com by hand to try it first
(see [Staging](#staging)).

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

## Staging

staging.hanbokstudy.com runs a second checkout,
`/var/www/hanbokstudy.com/source/hanbok-staging`, under pm2 as `hanbok-staging`
(API) and `hanbok-client-staging` (app, port 3060). Nothing deploys to it
automatically.

To put something on it: Actions → Deploy to staging → Run workflow, and enter

- a **PR number** (e.g. `37`) to deploy the PR as it would look merged into
  `main` (GitHub's `refs/pull/<n>/merge`; needs the PR to merge cleanly), or
- a branch, tag or SHA to deploy exactly that. Branches that predate
  side-by-side builds are refused; merge `main` into them or use the PR number.

`rollback` swaps staging back to its previous build. To reset staging to
production's code, deploy `main`.

It uses the same deploy key as production. `scripts/deploy-entry.sh` sends
`staging-deploy` / `staging-rollback` to the checkout named in
`~/.hanbok-deploy-staging.env` and refuses if that is the production checkout.
Staging always runs `main`'s `scripts/deploy.sh`. Production and staging builds
take turns (`~/.hanbok-build.lock`) so they don't run the server out of memory.

The deploy secrets must be repository secrets (not limited to the `production`
environment) for the staging workflow to see them.

### Staging setup

On the server, as `adminuser`:

```bash
git -C /var/www/hanbokstudy.com/source/hanbok fetch origin
git -C /var/www/hanbokstudy.com/source/hanbok show origin/main:scripts/deploy-entry.sh > ~/hanbok-deploy-entry.sh

cat > ~/.hanbok-deploy-staging.env <<'ENV'
DEPLOY_PATH=/var/www/hanbokstudy.com/source/hanbok-staging
PM2_APPS="hanbok-staging hanbok-client-staging"
SERVER_HEALTH_URL=http://127.0.0.1:3060/api/session
APP_HEALTH_URL=http://127.0.0.1:3060/
# The app's /api rewrite is baked in at build time; point it at the staging API.
export API_INTERNAL_URL=http://localhost:5667
ENV
```

Before staging is used, its `server/.env` must keep it away from real users:

- `MONGODB_DB` is its own database, not production's. Code under test runs
  schema setup and writes on startup, so sharing production's database means
  testing on real users' data. To test with real data, copy production into the
  staging database (`mongodump --db <prod> --archive | mongorestore --archive
  --nsFrom '<prod>.*' --nsTo '<staging>.*'`, with the usual credentials).
- Email only goes out for sign-up, verification and password-reset requests
  made on staging itself, so `EMAIL_ENABLED=true` is fine there.
- `STRIPE_SECRET_KEY` is a test key (`sk_test_…`), with its own webhook secret.
- `REDIS_SESSION_PREFIX`, `SESSION_COOKIE_NAME` and `BULL_QUEUE_PREFIX` differ
  from production, and `COOKIE_DOMAIN` / `FRONTEND_URL` are the staging domain.
