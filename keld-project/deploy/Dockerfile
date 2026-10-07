FROM node:26.8.1-alpine@sha256:ad6400dee476b06e82d0ee3a088e2d7555f6e6569c346e61d69e14d0f19e8c2b

RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates python3

WORKDIR /app
COPY runtime/ /app/

WORKDIR /app/integrations
RUN npm ci --omit=dev --ignore-scripts --install-links --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

RUN addgroup -S -g 10001 keld \
    && adduser -S -D -H -u 10001 -G keld keld

USER 10001:10001
ENV NODE_ENV=production PYTHONDONTWRITEBYTECODE=1 KELD_SCRATCH_DIR=/scratch
CMD ["node","bin/server.mjs","start","/config/keld.json"]
