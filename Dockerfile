FROM node:26-bookworm AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@12.4.2

WORKDIR /Basilisk

COPY package.json tsconfig*.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

EXPOSE 4001
EXPOSE 4002

ENV DATABASE_URL="file:/home/basilisk/.basilisk/basilisk.db"

FROM base AS test

COPY apps/test ./apps/test

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @basilisk/test... build

WORKDIR /Basilisk/apps/test

ENV HOME=/home/basilisk
RUN mkdir -p /home/basilisk/.basilisk /home/basilisk/.cache \
  && chown -R node:node /Basilisk /home/basilisk

USER node

CMD ["pnpm", "dev"]

FROM base AS relay

COPY apps/relay ./apps/relay

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @basilisk/relay... build

WORKDIR /Basilisk/apps/relay

ENV HOME=/home/basilisk
RUN mkdir -p /home/basilisk/.basilisk /home/basilisk/.cache \
  && chown -R node:node /Basilisk /home/basilisk

USER node

CMD ["pnpm", "start"]
