#!/usr/bin/env sh
# Builds the zip to upload to the Chrome Web Store.
# Usage: ./package.sh   (writes dist/hanbok-study-<version>.zip)
# The store build drops the localhost:3000 entries, which are only for
# developing against a local Hanbok server.
set -e
cd "$(dirname "$0")"
version=$(node -p "require('./manifest.json').version")
out="$PWD/dist/hanbok-study-$version.zip"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
cp -R manifest.json *.js *.css *.html icons fonts images "$stage"
rm -f "$stage/package.sh"
node -e '
  const fs = require("fs"), file = process.argv[1];
  const m = JSON.parse(fs.readFileSync(file, "utf8"));
  const keep = (list) => list && list.filter((p) => !p.startsWith("http://localhost"));
  m.host_permissions = keep(m.host_permissions);
  for (const cs of m.content_scripts) { cs.matches = keep(cs.matches); if (cs.exclude_matches) cs.exclude_matches = keep(cs.exclude_matches); }
  fs.writeFileSync(file, JSON.stringify(m, null, 2) + "\n");
' "$stage/manifest.json"
mkdir -p dist
rm -f "$out"
(cd "$stage" && zip -qr "$out" .)
echo "dist/hanbok-study-$version.zip"
