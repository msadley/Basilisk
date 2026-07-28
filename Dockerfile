FROM node:22-bookworm

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /Basilisk

COPY *.json ./
COPY *.yaml ./
COPY packages ./packages
COPY apps/relay ./apps/relay

RUN pnpm install --frozen-lockfile
RUN pnpm --filter relay build

WORKDIR /Basilisk/apps/relay

RUN chown -R node:node /Basilisk

EXPOSE 4001
EXPOSE 4002

ENV HOME=/home/basilisk
RUN mkdir -p /home/basilisk/.basilisk \
  && chown -R node:node /home/basilisk/.basilisk

USER node

CMD ["pnpm", "start"]
