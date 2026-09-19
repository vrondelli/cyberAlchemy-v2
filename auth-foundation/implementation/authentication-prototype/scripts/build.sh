#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .runtime
cargo build --locked --manifest-path bridge/Cargo.toml
cp "${CARGO_TARGET_DIR:-bridge/target}/debug/auth-prototype-bridge" .runtime/auth-prototype-bridge
