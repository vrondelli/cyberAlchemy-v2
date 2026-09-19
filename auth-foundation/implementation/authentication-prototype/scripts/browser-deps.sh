#!/usr/bin/env bash
# Optional Ubuntu runner preparation; extracts packages locally without sudo.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .runtime/browser-libs
cd .runtime/browser-libs
apt-get download libnspr4 libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libatspi2.0-0t64 libxshmfence1
for package in *.deb; do dpkg-deb -x "$package" root; done
