ARG NODE_IMAGE=node:26.8.1-bookworm-slim@sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e
FROM ${NODE_IMAGE}

ENV NPM_CONFIG_CACHE=/var/cache/node/npm \
    PNPM_STORE_DIR=/var/cache/node/pnpm \
    PATH=/opt/node-toolchain/node_modules/.bin:${PATH}

WORKDIR /opt/node-toolchain

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      fonts-freefont-ttf \
      fonts-ipafont-gothic \
      fonts-liberation \
      fonts-noto-color-emoji \
      fonts-tlwg-loma-otf \
      fonts-unifont \
      fonts-wqy-zenhei \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libatspi2.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libfontconfig1 \
      libfreetype6 \
      libgbm1 \
      libglib2.0-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libx11-6 \
      libxcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
      python3 \
      python3-jsonschema \
      python3-yaml \
      procps \
      ripgrep \
      xfonts-scalable \
      xvfb \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
    && install -d -m 0777 /var/cache/node/npm /var/cache/node/pnpm

COPY toolchain.json ./
COPY migration-inventory.json ./
COPY Dockerfile ./Dockerfile
COPY tsconfig ./tsconfig
COPY scripts ./scripts
COPY bin/container-entrypoint /usr/local/bin/node-toolchain
COPY bin/playwright /usr/local/bin/playwright
RUN chmod 0755 /usr/local/bin/node-toolchain /usr/local/bin/playwright

WORKDIR /workspace
ENTRYPOINT ["node-toolchain"]
CMD ["versions"]
