FROM node:26.8.1-bookworm-slim@sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY runtime/ /app/
WORKDIR /app/integrations
RUN npm ci --omit=dev --ignore-scripts --install-links --no-audit --no-fund && npm cache clean --force && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
RUN groupadd -g 10001 keld && useradd -u 10001 -g 10001 -M keld
USER 10001:10001
ENV NODE_ENV=production PYTHONDONTWRITEBYTECODE=1 KELD_SCRATCH_DIR=/scratch
CMD ["node","bin/server.mjs","start","/config/keld.json"]
