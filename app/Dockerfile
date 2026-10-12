# Hanbok web app (Next.js). Build from the repo root:
#   docker build -f app/Dockerfile -t hanbok-app .
FROM node:24-bookworm-slim AS build
WORKDIR /srv/app
COPY app/package.json ./
RUN npm install --no-audit --no-fund
COPY app/ ./
# Baked in at build time (next.config.mjs): where the app reaches the API.
ARG API_INTERNAL_URL=http://api:5666
ENV API_INTERNAL_URL=$API_INTERNAL_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3059
WORKDIR /srv/app
COPY --from=build /srv/app/package.json /srv/app/next.config.mjs ./
COPY --from=build /srv/app/node_modules ./node_modules
COPY --from=build /srv/app/public ./public
COPY --from=build /srv/app/.next ./.next
USER node
EXPOSE 3059
CMD ["node_modules/.bin/next", "start"]
