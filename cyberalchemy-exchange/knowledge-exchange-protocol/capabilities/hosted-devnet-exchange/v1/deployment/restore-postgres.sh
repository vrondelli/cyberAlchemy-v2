#!/usr/bin/env sh
set -eu
umask 077

MODE="${1:---preflight}"
EXPECTED_AUTHORIZATION="CA2-KEP-DISPOSABLE-RESTORE-VERIFY-001"
ARCHIVE="${KEP_BACKUP_ARCHIVE:-}"
KEY_FILE="${KEP_BACKUP_KEY_FILE:-}"
AUTHORIZATION="${CA2_KEP_RESTORE_AUTHORIZATION:-}"

case "$MODE" in
  --preflight | --verify-disposable) ;;
  *) echo "usage: $0 [--preflight|--verify-disposable]" >&2; exit 2 ;;
esac
for command_name in docker openssl; do
  command -v "$command_name" >/dev/null || {
    echo "missing required command: $command_name" >&2
    exit 1
  }
done

if [ "$MODE" = "--preflight" ]; then
  echo "KEP disposable restore preflight: PASS"
  echo "production restore: unsupported"
  exit 0
fi

if [ "$AUTHORIZATION" != "$EXPECTED_AUTHORIZATION" ]; then
  echo "restore verification requires CA2_KEP_RESTORE_AUTHORIZATION=$EXPECTED_AUTHORIZATION" >&2
  exit 2
fi
if [ ! -r "$ARCHIVE" ] || [ ! -r "$KEY_FILE" ]; then
  echo "KEP_BACKUP_ARCHIVE and KEP_BACKUP_KEY_FILE must be readable" >&2
  exit 2
fi

TMP_DIR="$(mktemp -d)"
CONTAINER="ca2-kep-restore-verify-$$"
cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM
DUMP="$TMP_DIR/restore.dump"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -pass "file:$KEY_FILE" -in "$ARCHIVE" -out "$DUMP"
docker run -d --name "$CONTAINER" --tmpfs /var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=disposable-restore-verification postgres:17-alpine >/dev/null
attempt=1
while [ "$attempt" -le 30 ]; do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
  attempt=$((attempt + 1))
done
docker exec "$CONTAINER" pg_isready -U postgres >/dev/null
docker exec -i "$CONTAINER" pg_restore --username postgres --dbname postgres --clean --if-exists < "$DUMP"
TABLES="$(docker exec "$CONTAINER" psql --username postgres --dbname postgres --tuples-only --no-align --command \
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'kep_hosted' ORDER BY table_name;")"
printf '%s\n' "$TABLES" | grep -Fx application_state >/dev/null
printf '%s\n' "$TABLES" | grep -Fx encrypted_archive >/dev/null
printf '%s\n' "$TABLES" | grep -Fx event_journal >/dev/null
echo "disposable PostgreSQL restore verification: PASS"
echo "production database was not contacted or changed"
