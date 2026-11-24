# syntax=docker/dockerfile:1

ARG NODE_VERSION=26
ARG PNPM_VERSION=12.4.2

# ------------------------------------------------------------------------------
# Native builder base (runs on $BUILDPLATFORM — no QEMU needed for multi-arch)
# ------------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-trixie-slim AS base-builder

ARG PNPM_VERSION

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=true \
    PNPM_MANAGE_PACKAGE_MANAGER_VERSIONS=false

RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm install -g "pnpm@${PNPM_VERSION}"

WORKDIR /workspace

# Copy only workspace manifests first for maximal dependency layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/libp2p/package.json ./packages/libp2p/
COPY packages/core/package.json ./packages/core/
COPY apps/relay/package.json ./apps/relay/
COPY apps/test/package.json ./apps/test/
COPY apps/web/package.json ./apps/web/

# ------------------------------------------------------------------------------
# Build & deploy @basilisk/test
# ------------------------------------------------------------------------------
FROM base-builder AS build-test

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install \
      --frozen-lockfile \
      --no-runtime \
      --store-dir=/pnpm/store \
      --filter @basilisk/test... \
      --include-workspace-root

COPY tsconfig.base.json ./
COPY packages/libp2p ./packages/libp2p
COPY packages/core ./packages/core
COPY apps/test ./apps/test

RUN pnpm --filter @basilisk/test... build

# Place TARGETARCH after compile so install+build are shared across all platforms
ARG TARGETARCH

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    case "${TARGETARCH}" in \
      amd64) PNPM_CPU="x64" ;; \
      arm64) PNPM_CPU="arm64" ;; \
      *) PNPM_CPU="${TARGETARCH}" ;; \
    esac \
    && pnpm --filter @basilisk/test deploy \
      --prod \
      --frozen-lockfile \
      --no-runtime \
      --ignore-scripts \
      --trust-lockfile \
      --os=linux \
      --cpu="${PNPM_CPU}" \
      --libc=glibc \
      --store-dir=/pnpm/store \
      /prod/test \
    && rm -rf \
      /prod/test/pnpm-lock.yaml \
      /prod/test/pnpm-workspace.yaml \
      /prod/test/tsconfig*.json \
      /prod/test/*.tsbuildinfo \
      /prod/test/.gitignore \
      /prod/test/drizzle \
      /prod/test/drizzle.config.ts \
      /prod/test/src \
      /prod/test/dist/*.d.ts \
      /prod/test/dist/*.d.ts.map \
      /prod/test/dist/*.js.map \
    && mkdir -p /home-skeleton/.basilisk /home-skeleton/.cache

# ------------------------------------------------------------------------------
# Build & deploy @basilisk/relay
# ------------------------------------------------------------------------------
FROM base-builder AS build-relay

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install \
      --frozen-lockfile \
      --no-runtime \
      --store-dir=/pnpm/store \
      --filter @basilisk/relay... \
      --include-workspace-root

COPY tsconfig.base.json ./
COPY packages/libp2p ./packages/libp2p
COPY apps/relay ./apps/relay

RUN pnpm --filter @basilisk/relay... build

# Place TARGETARCH after compile so install+build are shared across all platforms
ARG TARGETARCH

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    case "${TARGETARCH}" in \
      amd64) PNPM_CPU="x64" ;; \
      arm64) PNPM_CPU="arm64" ;; \
      *) PNPM_CPU="${TARGETARCH}" ;; \
    esac \
    && pnpm --filter @basilisk/relay deploy \
      --frozen-lockfile \
      --no-runtime \
      --ignore-scripts \
      --trust-lockfile \
      --os=linux \
      --cpu="${PNPM_CPU}" \
      --libc=glibc \
      --store-dir=/pnpm/store \
      /prod/relay \
    && rm -rf \
      /prod/relay/pnpm-lock.yaml \
      /prod/relay/pnpm-workspace.yaml \
      /prod/relay/tsconfig*.json \
      /prod/relay/*.tsbuildinfo \
      /prod/relay/.gitignore \
      /prod/relay/dist/*.d.ts \
      /prod/relay/dist/*.d.ts.map \
      /prod/relay/dist/*.js.map \
    && find /prod/relay/src -type f ! -name 'DatabaseSchema.ts' -delete \
    && mkdir -p /home-skeleton/.basilisk /home-skeleton/.cache

# ------------------------------------------------------------------------------
# Shared minimal runtime base (zero RUN steps => QEMU-free multi-arch)
# ------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie-slim AS runtime-base

ENV NODE_ENV=production \
    HOME=/home/basilisk \
    DATABASE_URL="file:/home/basilisk/.basilisk/basilisk.db"

WORKDIR /app

EXPOSE 4001/tcp 4002/tcp

# ------------------------------------------------------------------------------
# Runtime: test
# ------------------------------------------------------------------------------
FROM runtime-base AS test

COPY --link --from=build-test --chown=1000:1000 /home-skeleton /home/basilisk
COPY --link --from=build-test --chown=1000:1000 /prod/test ./

USER node

CMD ["node", "dist/index.js"]

# ------------------------------------------------------------------------------
# Runtime: relay (default target)
# ------------------------------------------------------------------------------
FROM runtime-base AS relay

COPY --link --from=build-relay --chown=1000:1000 /home-skeleton /home/basilisk
COPY --link --from=build-relay --chown=1000:1000 /prod/relay ./

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "import('node:net').then(({ createConnection }) => { const s = createConnection({ host: '127.0.0.1', port: 4001 }, () => { s.end(); process.exit(0); }); s.setTimeout(3000, () => { s.destroy(); process.exit(1); }); s.on('error', () => process.exit(1)); })"]

CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit push --config=./drizzle.config.ts --force && exec node dist/index.js"]
