#!/usr/bin/env sh
set -eu
umask 077

MODE="${1:---preflight}"
EXPECTED_AUTHORIZATION="CA2-KEP-OFFHOST-BACKUP-001"
SSH_TARGET="${SSH_TARGET:-root@187.77.248.154}"
REMOTE_DIR="${REMOTE_DIR:-/srv/kep-hosted-devnet}"
BACKUP_COPY_TARGET="${KEP_BACKUP_COPY_TARGET:-}"
BACKUP_KEY_FILE="${KEP_BACKUP_KEY_FILE:-}"
AUTHORIZATION="${CA2_KEP_BACKUP_AUTHORIZATION:-}"

case "$MODE" in
  --preflight | --execute) ;;
  *) echo "usage: $0 [--preflight|--execute]" >&2; exit 2 ;;
esac

if [ "$REMOTE_DIR" != "/srv/kep-hosted-devnet" ]; then
  echo "refusing unbound REMOTE_DIR: $REMOTE_DIR" >&2
  exit 2
fi
for command_name in ssh scp openssl sha256sum; do
  command -v "$command_name" >/dev/null || {
    echo "missing required command: $command_name" >&2
    exit 1
  }
done

if [ "$MODE" = "--preflight" ]; then
  echo "KEP off-host backup preflight: PASS"
  echo "backup effect: none"
  exit 0
fi

if [ "$AUTHORIZATION" != "$EXPECTED_AUTHORIZATION" ]; then
  echo "--execute requires CA2_KEP_BACKUP_AUTHORIZATION=$EXPECTED_AUTHORIZATION" >&2
  exit 2
fi
if [ -z "$BACKUP_COPY_TARGET" ]; then
  echo "KEP_BACKUP_COPY_TARGET is required and must be outside the primary VPS failure domain" >&2
  exit 2
fi
if [ ! -r "$BACKUP_KEY_FILE" ]; then
  echo "KEP_BACKUP_KEY_FILE must name a readable local passphrase file" >&2
  exit 2
fi
if [ "$(stat -c '%a' "$BACKUP_KEY_FILE")" != "600" ]; then
  echo "KEP_BACKUP_KEY_FILE must have mode 0600" >&2
  exit 2
fi

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT INT TERM
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP="$TMP_DIR/kep-$STAMP.dump"
ARCHIVE="$DUMP.enc"
MANIFEST="$ARCHIVE.sha256"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$SSH_TARGET" \
  "set -eu; cd '$REMOTE_DIR'; docker compose --env-file .env --file compose.yaml exec -T database pg_dump --username kep --dbname kep --format=custom" \
  > "$DUMP"
test -s "$DUMP"
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
  -pass "file:$BACKUP_KEY_FILE" -in "$DUMP" -out "$ARCHIVE"
sha256sum "$ARCHIVE" | sed "s|$ARCHIVE|$(basename "$ARCHIVE")|" > "$MANIFEST"
scp -o BatchMode=yes -o StrictHostKeyChecking=yes "$ARCHIVE" "$BACKUP_COPY_TARGET/"
scp -o BatchMode=yes -o StrictHostKeyChecking=yes "$MANIFEST" "$BACKUP_COPY_TARGET/"
echo "encrypted off-host backup uploaded: $(basename "$ARCHIVE")"
echo "restore verification remains a separate required effect"
