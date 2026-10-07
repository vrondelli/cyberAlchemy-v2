#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'usage: %s <online|quiesced> <absolute-target-directory> [compose-file]\n' "$0" >&2
  exit 64
}

[[ $# -ge 2 && $# -le 3 ]] || usage
mode=$1
target=$2
compose_file=${3:-compose.staging-candidate.yaml}

[[ $mode == online || $mode == quiesced ]] || usage
[[ $target == /* && $target != / ]] || {
  printf 'backup target must be an absolute non-root path\n' >&2
  exit 64
}

deployment_root=$(pwd -P)
script_root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
backup_verifier=$script_root/verify_full_state_backup.py
[[ -f $backup_verifier && ! -L $backup_verifier ]] || {
  printf 'backup verifier is missing or invalid\n' >&2
  exit 66
}
[[ $compose_file == /* ]] || compose_file=$deployment_root/$compose_file
target_parent=$(dirname -- "$target")
target_name=$(basename -- "$target")
partial=$target_parent/.${target_name}.partial.$$

[[ -d $target_parent && ! -L $target_parent ]] || {
  printf 'backup parent must be an existing non-symlink directory\n' >&2
  exit 65
}
[[ ! -e $target && ! -L $target && ! -e $partial && ! -L $partial ]] || {
  printf 'backup target or private partial path already exists\n' >&2
  exit 65
}

required=(
  "$deployment_root/.env"
  "$compose_file"
  "$deployment_root/.runtime/keld.json"
  "$deployment_root/.runtime/commerce/commerce.db"
)
for path in "${required[@]}"; do
  [[ -f $path && ! -L $path ]] || {
    printf 'required regular non-symlink input is missing: %s\n' "$path" >&2
    exit 66
  }
done

compose=(docker compose -p keld-staging -f "$compose_file" --env-file "$deployment_root/.env")
running_services=$("${compose[@]}" ps --services --status running)
grep -qx postgres <<<"$running_services" || {
  printf 'postgres must be running for a full-state backup\n' >&2
  exit 69
}
if [[ $mode == quiesced ]]; then
  for writer in web worker keycloak; do
    if grep -qx "$writer" <<<"$running_services"; then
      printf 'quiesced backup requires %s to be stopped by the operator\n' "$writer" >&2
      exit 69
    fi
  done
fi

umask 077
mkdir -m 700 -- "$partial"

python3 - "$deployment_root/.runtime/commerce/commerce.db" "$partial/commerce.db" <<'PY'
import os
import sqlite3
import sys

source_path, destination_path = sys.argv[1:]
source = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
destination = sqlite3.connect(destination_path)
try:
    source.backup(destination)
    result = destination.execute("PRAGMA integrity_check").fetchone()
    if result != ("ok",):
        raise SystemExit("commerce backup integrity check failed")
finally:
    destination.close()
    source.close()
os.chmod(destination_path, 0o600)
PY

"${compose[@]}" exec -T postgres sh -eu -c '
  export PGPASSWORD="$(cat /run/secrets/postgres_admin_password)"
  exec pg_dump --host=127.0.0.1 --username=postgres --format=custom --no-password keycloak
' > "$partial/keycloak.dump"
"${compose[@]}" exec -T postgres sh -eu -c '
  export PGPASSWORD="$(cat /run/secrets/postgres_admin_password)"
  exec pg_dump --host=127.0.0.1 --username=postgres --format=custom --no-password keld_sessions
' > "$partial/keld_sessions.dump"

"${compose[@]}" exec -T postgres pg_restore --list < "$partial/keycloak.dump" >/dev/null
"${compose[@]}" exec -T postgres pg_restore --list < "$partial/keld_sessions.dump" >/dev/null

install -m 600 -- "$deployment_root/.env" "$partial/.env"
install -m 600 -- "$compose_file" "$partial/compose.staging-candidate.yaml"
install -m 600 -- "$deployment_root/.runtime/keld.json" "$partial/keld.json"

created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
app_image=$("${compose[@]}" images -q web 2>/dev/null || true)
postgres_image=$("${compose[@]}" images -q postgres 2>/dev/null || true)
keycloak_image=$("${compose[@]}" images -q keycloak 2>/dev/null || true)
printf '%s\n' \
  'schema=keld-full-state-backup/v1' \
  "created_at=$created_at" \
  "consistency_mode=$mode" \
  "app_image=$app_image" \
  "postgres_image=$postgres_image" \
  "keycloak_image=$keycloak_image" \
  > "$partial/BACKUP-METADATA"

chmod 600 -- "$partial"/* "$partial/.env"
(
  cd -- "$partial"
  sha256sum BACKUP-METADATA commerce.db keycloak.dump keld_sessions.dump \
    .env compose.staging-candidate.yaml keld.json > SHA256SUMS
  chmod 600 SHA256SUMS
  sha256sum -c SHA256SUMS >/dev/null
)

python3 "$backup_verifier" "$partial" >/dev/null

mv -- "$partial" "$target"
printf 'full-state backup created: %s (%s)\n' "$target" "$mode"
