# syntax=docker/dockerfile:1.7
# Production backend image.
#
# Build from the repository root:
#   docker build -f infra/docker/backend.Dockerfile -t agroshield-backend:local .

ARG NODE_IMAGE=node:24.15.0-alpine3.22@sha256:b689d4005875ae167178471a7a622ec2909459a3bbb32277260be1971af7a99f

# ---------- build ----------
FROM ${NODE_IMAGE} AS build
WORKDIR /workspace

RUN npm install --global pnpm@11.1.2

# Only manifests first so dependency installation is cached independently of
# source changes. All workspace manifests are required by pnpm's lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY landing/package.json landing/
COPY packages/design-tokens/package.json packages/design-tokens/

RUN pnpm install --frozen-lockfile --filter "@agroshield/backend..."

COPY backend ./backend

RUN pnpm --filter @agroshield/backend build \
 && pnpm --filter @agroshield/backend deploy --prod --legacy /deploy \
 && rm -rf /deploy/.data /deploy/.env /deploy/.env.* \
      /deploy/src /deploy/eslint.config.js /deploy/.dependency-cruiser.cjs \
      /deploy/tsconfig.json /deploy/tsconfig.build.json /deploy/vitest.config.ts \
      /deploy/node_modules/.cache \
 && test -f /deploy/dist/main.js \
 && test -f /deploy/dist/tools/migrate.js \
 && test -f /deploy/dist/tools/seed.js \
 && test -f /deploy/migrations/0001_core.sql

# ---------- runtime ----------
FROM ${NODE_IMAGE} AS runtime

RUN apk add --no-cache tini \
 && addgroup -g 10001 -S app \
 && adduser -u 10001 -S -G app -H -s /sbin/nologin app

WORKDIR /app
COPY --from=build --chown=app:app /deploy /app

ENV NODE_ENV=production \
    APP_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=3000 \
    HOME=/tmp

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.API_PORT || '3000') + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
