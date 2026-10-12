# Hanbok API. Build from the repo root:
#   docker build -f server/Dockerfile -t hanbok-api .
FROM node:24-bookworm-slim AS deps
WORKDIR /srv/server
# bcrypt may compile from source
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY server/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /srv/server
COPY --from=deps /srv/server/node_modules ./node_modules
COPY server/ ./
# Audio clips served by controllers/streamAudio.js live in /srv/audio (a volume).
RUN mkdir -p /srv/audio && rm -rf test
USER node
EXPOSE 5666
CMD ["node", "index.js"]
