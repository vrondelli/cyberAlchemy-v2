#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SCRIPT="$SCRIPT_DIR/../implementation/domainspec/tools/check_markdown_links.sh"

if [[ ! -x "$TARGET_SCRIPT" ]]; then
  chmod +x "$TARGET_SCRIPT" 2>/dev/null || true
fi

if [[ ! -x "$TARGET_SCRIPT" ]]; then
  echo "ERROR: checker not found or not executable: $TARGET_SCRIPT"
  exit 2
fi

exec "$TARGET_SCRIPT" "$@"
