FROM node:22

WORKDIR /Basilisk

COPY *.json ./

COPY packages ./packages

COPY apps/relay ./apps/relay

RUN npm ci

RUN npm run build -w packages/core

RUN npm run build -w apps/relay

WORKDIR /Basilisk/apps/relay

EXPOSE 4001
EXPOSE 4002
EXPOSE 443

CMD ["node", "dist/index.js"] 