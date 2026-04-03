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

ENV HOME=/home/node

RUN mkdir -p /home/node/.basilisk \
  && chown -R node:node /home/node/.basilisk 

USER node

CMD ["node", "dist/index.js"]