FROM node:26.8.1-bookworm-slim AS build

WORKDIR /application
COPY generated/package.json generated/package-lock.json generated/tsconfig.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY generated/src ./src
COPY generated/migrations ./migrations
RUN ./node_modules/.bin/tsc --noEmit false --outDir dist

FROM node:26.8.1-bookworm-slim

WORKDIR /application
ENV NODE_ENV=production PORT=8080
COPY --from=build --chown=node:node /application/dist ./generated/dist
COPY docker/server.mjs ./server.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
