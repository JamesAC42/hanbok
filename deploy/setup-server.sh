#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 droplet that runs Hanbok in Docker.
# Run as root right after creating the droplet (with your SSH key):
#
#   curl -fsSL https://raw.githubusercontent.com/JamesAC42/hanbok/main/deploy/setup-server.sh -o setup.sh
#   less setup.sh        # read it first
#   bash setup.sh <your-admin-username> "<GitHub Actions deploy public key>" [hanbok|sites]
#
# The third argument picks the role: hanbok (default) or sites (blog,
# kirakissu, umami and Postgres; see deploy/sites/).
#
# What it does: an admin user with sudo (your SSH key only), a `deploy` user
# without sudo that can only run deploy/compose-entry.sh over SSH, SSH hardening
# (no root, no passwords), a firewall, automatic security updates, fail2ban,
# Docker, nginx and certbot, and /srv/hanbok with the compose file.
set -euo pipefail

ADMIN="${1:?usage: setup-server.sh <admin-user> \"<deploy public key>\"}"
DEPLOY_PUBKEY="${2:?usage: setup-server.sh <admin-user> \"<deploy public key>\"}"
ROLE="${3:-hanbok}"
case "$ROLE" in hanbok|sites) ;; *) echo "role must be hanbok or sites" >&2; exit 2 ;; esac
REPO_RAW=https://raw.githubusercontent.com/JamesAC42/hanbok/main

[ "$(id -u)" = 0 ] || { echo "run as root" >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades nginx certbot python3-certbot-nginx

# Automatic security updates
dpkg-reconfigure -f noninteractive unattended-upgrades

# Docker from Docker's own repository
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
cat > /etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "20m", "max-file": "5" }, "no-new-privileges": true }
JSON
systemctl restart docker

# Admin user: sudo, your SSH key (copied from root's)
id "$ADMIN" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$ADMIN"
usermod -aG sudo "$ADMIN"
install -d -m 700 -o "$ADMIN" -g "$ADMIN" "/home/$ADMIN/.ssh"
install -m 600 -o "$ADMIN" -g "$ADMIN" /root/.ssh/authorized_keys "/home/$ADMIN/.ssh/authorized_keys"
echo "Set a sudo password for $ADMIN:"
passwd "$ADMIN"

# Deploy user: no sudo, no shell beyond the forced command
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
if [ "$ROLE" = hanbok ]; then
  install -d -m 755 -o deploy -g deploy /srv/hanbok /srv/hanbok/audio /srv/hanbok/certs
  curl -fsSL "$REPO_RAW/deploy/docker-compose.yml" -o /srv/hanbok/docker-compose.yml
  curl -fsSL "$REPO_RAW/deploy/compose-entry.sh" -o /home/deploy/hanbok-deploy-entry.sh
  touch /srv/hanbok/api.env && chown deploy:deploy /srv/hanbok/api.env && chmod 600 /srv/hanbok/api.env
else
  install -d -m 755 -o deploy -g deploy /srv/sites /srv/sites/blog /srv/sites/blog/content /srv/sites/kirakissu /srv/sites/kirakissu/content
  chown 1000:1000 /srv/sites/blog/content /srv/sites/kirakissu/content
  curl -fsSL "$REPO_RAW/deploy/sites/docker-compose.yml" -o /srv/sites/docker-compose.yml
  curl -fsSL "$REPO_RAW/deploy/sites/sites-entry.sh" -o /home/deploy/hanbok-deploy-entry.sh
  for f in postgres blog kirakissu umami; do
    touch "/srv/sites/$f.env" && chown deploy:deploy "/srv/sites/$f.env" && chmod 600 "/srv/sites/$f.env"
  done
fi
chown root:root /home/deploy/hanbok-deploy-entry.sh
chmod 755 /home/deploy/hanbok-deploy-entry.sh
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "command=\"/home/deploy/hanbok-deploy-entry.sh\",restrict $DEPLOY_PUBKEY" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

# SSH: keys only, no root
cat > /etc/ssh/sshd_config.d/10-hardening.conf <<'CONF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
AllowUsers ADMIN_PLACEHOLDER deploy
CONF
sed -i "s/ADMIN_PLACEHOLDER/$ADMIN/" /etc/ssh/sshd_config.d/10-hardening.conf
sshd -t && systemctl reload ssh

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo
echo "Done. Next, as $ADMIN (keep this root session open until you've logged in as $ADMIN):"
echo "  Follow docs/deploy-docker.md for the $ROLE server from step 5."
