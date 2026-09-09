#!/usr/bin/env bash
set -euo pipefail

base_url="${1:-http://127.0.0.1:18080}"
critical_bytes=0

measure() {
  local label="$1"
  local path="$2"
  local result
  result="$(curl --fail --silent --show-error --output /dev/null --write-out '%{size_download} %{time_starttransfer} %{time_total}' "${base_url}${path}")"
  local bytes first_byte total
  read -r bytes first_byte total <<<"$result"
  printf '%-15s %9s bytes  first-byte %7ss  total %7ss\n' "$label" "$bytes" "$first_byte" "$total" >&2
  printf '%s\n' "$bytes"
}

printf 'CyberAlchemy orb load benchmark: %s\n' "$base_url" >&2
for asset in \
  'html|/' \
  'base-css|/assets/style.css' \
  'brand-css|/assets/brand.css' \
  'app-js|/assets/app.js' \
  'mark|/assets/cyberalchemy-mark.svg' \
  'frozen-orb|/assets/cyberalchemy-orb-frozen.webp'
do
  label="${asset%%|*}"
  path="${asset#*|}"
  bytes="$(measure "$label" "$path")"
  critical_bytes=$((critical_bytes + bytes))
done

motion_bytes="$(measure 'motion-orb' '/assets/cyberalchemy-orb-loop.webm')"
printf 'critical total  %9s bytes\n' "$critical_bytes" >&2
printf 'deferred motion %9s bytes\n' "$motion_bytes" >&2

if (( critical_bytes > 650000 )); then
  printf 'FAIL critical assets exceed 650000 bytes\n' >&2
  exit 1
fi
if (( motion_bytes > 500000 )); then
  printf 'FAIL deferred motion exceeds 500000 bytes\n' >&2
  exit 1
fi

printf 'PASS load byte ceilings\n' >&2
