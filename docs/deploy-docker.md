# Deploying with Docker (new server, October 2026)

Hanbok runs as two containers on its own droplet: `api` (Express, port 5666)
and `app` (Next.js, port 3059). GitHub Actions builds both images, pushes them to
GHCR, and the server only pulls and runs them. Nothing is built or
`npm install`ed on the server. MongoDB and Redis are DigitalOcean managed
databases. The plan behind this is in the project files (`ops/new-server-plan.md`).

Files in `deploy/`:

| File | What it is |
|---|---|
| `setup-server.sh` | One-time setup of a fresh Ubuntu 24.04 droplet |
| `docker-compose.yml` | The two services, hardened: non-root, read-only filesystem, no capabilities, memory limits, log rotation |
| `compose-entry.sh` | What the GitHub Actions key may run: `deploy <sha>` or `rollback` |
| `nginx-hanbok.conf` | nginx site: `/api/` to the API, everything else to the app |

## Set up a new server

1. Create the droplet (Ubuntu 24.04, 4 GB) with your SSH key, plus a managed
   MongoDB and a managed Valkey in the same region. Add the droplet as a
   trusted source on both databases.
2. Make a deploy key on your PC: `ssh-keygen -t ed25519 -N "" -C github-actions-hanbok-deploy -f hanbok_deploy_key`
3. On the droplet, as root: download and read `deploy/setup-server.sh`, then
   `bash setup-server.sh <you> "$(cat hanbok_deploy_key.pub)"`.
4. Log in as `<you>` in a new terminal before closing the root session.
5. Restore the data:
   - Mongo: `mongorestore --uri "<managed uri>" --nsFrom '<old db>.*' --nsTo 'hanbok.*' --archive=hanbok.archive.gz --gzip`
   - Copy the old `audio/` folder into `/srv/hanbok/audio/`.
   - Put the managed Mongo CA certificate in `/srv/hanbok/certs/mongo-ca.crt`.
6. Fill `/srv/hanbok/api.env` (below), with **new** values for every secret.
7. nginx: copy `deploy/nginx-hanbok.conf` to `/etc/nginx/sites-available/hanbokstudy.com`,
   link it into `sites-enabled`, `sudo nginx -t && sudo systemctl reload nginx`,
   then `sudo certbot --nginx -d hanbokstudy.com -d www.hanbokstudy.com` once DNS points here.
8. GitHub → Settings → Secrets and variables → Actions:
   - Variables: `DEPLOY_MODE` = `docker`, `DEPLOY_HOST` = the droplet IP, `DEPLOY_USER` = `deploy`
   - Secrets: `DEPLOY_SSH_KEY` = contents of `hanbok_deploy_key`;
     `DEPLOY_KNOWN_HOSTS` = output of `ssh-keyscan -t ed25519 <droplet ip>` (check the
     fingerprint against `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the droplet)
9. Actions → Deploy (Docker) → Run workflow. The first run publishes the
   images. In GitHub → Packages, set `hanbok-api` and `hanbok-app` to **public**
   (the repo is public) so the server can pull them without a token, then run it again.

From then on every merge to main deploys. Rollback: Actions → Deploy (Docker)
→ rollback, or on the server `sudo -u deploy /home/deploy/hanbok-deploy-entry.sh rollback`.

## api.env

```
NODE_ENV=production
FRONTEND_URL=https://hanbokstudy.com
COOKIE_DOMAIN=hanbokstudy.com
SECURE_SESSION=true
SESSION_SECRET=            # openssl rand -hex 32

MONGODB_URI=mongodb+srv://doadmin:<pw>@<host>/admin?tls=true&authSource=admin&tlsCAFile=/srv/certs/mongo-ca.crt
MONGODB_DB=hanbok
REDIS_URL=rediss://default:<pw>@<host>:25061

GEMINI_API_KEY=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_ANALYTICS_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
EMAIL_ENABLED=true
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=
EMAIL_USER=
EMAIL_PASS=
GOOGLE_CLIENT_ID=
METRICS_TOKEN=
UMAMI_URL=
UMAMI_USERNAME=
UMAMI_PASSWORD=
UMAMI_WEBSITE_ID=
```

Then copy over the feature settings from the old `.env` as they were
(`AUTO_TRIAL_ENABLED`, `ANON_WEEKLY_SENTENCES`, `YEARLY_DEAL_COUPON_ID`,
`STREAK_EMAILS_ENABLED`, `LIFECYCLE_EMAILS_ENABLED`, `STRIPE_STUDENT_COUPON_ID`,
the `SPEAK_*` and `GEMINI_*_MODEL` settings and so on). After editing it:
`cd /srv/hanbok && sudo -u deploy HANBOK_TAG=$(cat .tag) docker compose up -d`.

## Checking on it

```
cd /srv/hanbok
docker compose ps                 # both should say healthy / Up
docker compose logs -f --tail=100 api
curl -s localhost:5666/api/health # {"ok":true,"mongo":true,"redis":true}
tail deploy.log
```

## Adding a second server later

Both images are stateless: sessions, rate limits and queues live in Redis, data
in Mongo, and audio is the one folder to copy. Create a second droplet the same
way, put both behind a DigitalOcean Load Balancer with health check
`/api/health`, and point the deploy workflow at both.
