#!/usr/bin/env sh
set -eu
umask 077

MODE="${1:---preflight}"
DEPLOY_AUTHORIZATION="${CA2_KEP_DEPLOY_AUTHORIZATION:-}"
EXPECTED_AUTHORIZATION="CA2-KEP-VPS-DEPLOY-001"

SSH_TARGET="${SSH_TARGET:-root@187.77.248.154}"
REMOTE_DIR="${REMOTE_DIR:-/srv/kep-hosted-devnet}"
PUBLIC_HOST="${PUBLIC_HOST:-kep.cyberalchemize.com}"
EDGE_NETWORK="${EDGE_NETWORK:-troqar_edge}"
TRAEFIK_ENTRYPOINT="${TRAEFIK_ENTRYPOINT:-websecure}"
TRAEFIK_CERT_RESOLVER="${TRAEFIK_CERT_RESOLVER:-letsencrypt}"
KEP_DB_PASSWORD_FILE="${KEP_DB_PASSWORD_FILE:-}"
CA2_KEP_DEVNET_RPC_URL="${CA2_KEP_DEVNET_RPC_URL:-https://api.devnet.solana.com}"
KEP_BACKUP_ENVELOPE_ID="${KEP_BACKUP_ENVELOPE_ID:-}"

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CAPABILITY_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/../../../../../../.." && pwd)"
IMPLEMENTATION_DIR="$CAPABILITY_DIR/implementation"
COMPOSE_FILE="$SCRIPT_DIR/compose.yaml"
DOCKERFILE="$IMPLEMENTATION_DIR/Dockerfile.hosted"
PROTOCOL_BINDING="$IMPLEMENTATION_DIR/protocol-implementation-binding-record-001.json"
MARK_FILE="$REPO_ROOT/arcanum/docs/assets/cyberalchemy-mark.svg"
ORB_FILE="$REPO_ROOT/arcanum/docs/assets/cyberalchemy-orb-imagegen-v1.png"

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

ssh_remote() {
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$SSH_TARGET" "$1"
}

upload() {
  scp -o BatchMode=yes -o StrictHostKeyChecking=yes "$1" "$SSH_TARGET:$REMOTE_DIR/$2"
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "missing required deployment input: $1" >&2
    exit 1
  fi
}

case "$MODE" in
  --preflight | --execute) ;;
  *)
    echo "usage: $0 [--preflight|--execute]" >&2
    exit 2
    ;;
esac

case "$PUBLIC_HOST" in
  "" | *[!A-Za-z0-9.-]* | .* | *..* | *.)
    echo "invalid PUBLIC_HOST: $PUBLIC_HOST" >&2
    exit 2
    ;;
  cyberalchemize.com | troqarapp.com | time-capsule.cyberalchemize.com)
    echo "refusing to replace an existing product host: $PUBLIC_HOST" >&2
    exit 2
    ;;
esac

if [ "$REMOTE_DIR" != "/srv/kep-hosted-devnet" ]; then
  echo "refusing unbound REMOTE_DIR: $REMOTE_DIR" >&2
  exit 2
fi

for required in \
  "$COMPOSE_FILE" \
  "$DOCKERFILE" \
  "$PROTOCOL_BINDING" \
  "$MARK_FILE" \
  "$ORB_FILE"
do
  require_file "$required"
done

python3 "$SCRIPT_DIR/validate.py" --no-write

PREFLIGHT_ENV="$TMP_DIR/preflight.env"
printf '%s\n' \
  "PUBLIC_HOST=$PUBLIC_HOST" \
  "EDGE_NETWORK=$EDGE_NETWORK" \
  "TRAEFIK_ENTRYPOINT=$TRAEFIK_ENTRYPOINT" \
  "TRAEFIK_CERT_RESOLVER=$TRAEFIK_CERT_RESOLVER" \
  "KEP_IMAGE=ca2-kep-hosted-devnet:preflight" \
  "KEP_DB_PASSWORD=preflight-not-a-live-secret" \
  "CA2_KEP_DEVNET_RPC_URL=https://api.devnet.solana.com" \
  > "$PREFLIGHT_ENV"
docker compose --env-file "$PREFLIGHT_ENV" --file "$COMPOSE_FILE" config --quiet

if [ "$MODE" = "--preflight" ]; then
  echo "KEP VPS deployment preflight: PASS"
  echo "remote effects: none"
  echo "deployment conformance: not_evaluable pending system-ontology admission and binding acceptance"
  exit 0
fi

if [ "$DEPLOY_AUTHORIZATION" != "$EXPECTED_AUTHORIZATION" ]; then
  echo "--execute requires CA2_KEP_DEPLOY_AUTHORIZATION=$EXPECTED_AUTHORIZATION" >&2
  exit 2
fi
if [ ! -r "$KEP_DB_PASSWORD_FILE" ]; then
  echo "KEP_DB_PASSWORD_FILE must name a readable local password file" >&2
  exit 2
fi
if [ "$(stat -c '%a' "$KEP_DB_PASSWORD_FILE")" != "600" ]; then
  echo "KEP_DB_PASSWORD_FILE must have mode 0600" >&2
  exit 2
fi
PASSWORD_LINE_COUNT="$(awk 'END {print NR}' "$KEP_DB_PASSWORD_FILE")"
KEP_DB_PASSWORD="$(tr -d '\r\n' < "$KEP_DB_PASSWORD_FILE")"
if [ "$PASSWORD_LINE_COUNT" -ne 1 ] || [ "${#KEP_DB_PASSWORD}" -lt 24 ]; then
  echo "KEP_DB_PASSWORD_FILE must contain one line of at least 24 characters" >&2
  exit 2
fi
case "$KEP_DB_PASSWORD" in
  *[!A-Za-z0-9._~-]*)
    echo "KEP_DB_PASSWORD_FILE must use only URL-safe A-Z, a-z, 0-9, dot, underscore, tilde, or hyphen" >&2
    exit 2
    ;;
esac
if [ -z "$KEP_BACKUP_ENVELOPE_ID" ]; then
  echo "KEP_BACKUP_ENVELOPE_ID is required before VPS execution" >&2
  exit 2
fi

BUILD_CONTEXT="$TMP_DIR/build-context"
CRATE_STAGE="$BUILD_CONTEXT/cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation"
BRAND_STAGE="$BUILD_CONTEXT/arcanum/docs/assets"
mkdir -p "$CRATE_STAGE" "$BRAND_STAGE"
(cd "$IMPLEMENTATION_DIR" && tar \
  --exclude='./target' \
  --exclude='./node_modules' \
  --exclude='./.git' \
  --exclude='*.env' \
  --exclude='*.pem' \
  --exclude='*.key' \
  -cf - .) | tar -C "$CRATE_STAGE" -xf -
cp "$MARK_FILE" "$BRAND_STAGE/cyberalchemy-mark.svg"
cp "$ORB_FILE" "$BRAND_STAGE/cyberalchemy-orb-imagegen-v1.png"

MATERIAL_DIGEST="$(python3 - "$BUILD_CONTEXT" <<'PY'
import hashlib
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
digest = hashlib.sha256()
for path in sorted(item for item in root.rglob("*") if item.is_file()):
    digest.update(path.relative_to(root).as_posix().encode())
    digest.update(b"\0")
    digest.update(path.read_bytes())
    digest.update(b"\0")
print(digest.hexdigest())
PY
)"
KEP_IMAGE="ca2-kep-hosted-devnet:$MATERIAL_DIGEST"
IMAGE_ARCHIVE="$TMP_DIR/kep-image.tar.gz"

echo "building exact hosted image: $KEP_IMAGE"
docker build --file "$DOCKERFILE" --tag "$KEP_IMAGE" "$BUILD_CONTEXT"
docker image inspect "$KEP_IMAGE" >/dev/null
docker save "$KEP_IMAGE" | gzip -9 > "$IMAGE_ARCHIVE"

DEPLOY_ENV="$TMP_DIR/kep.env"
printf '%s\n' \
  "PUBLIC_HOST=$PUBLIC_HOST" \
  "EDGE_NETWORK=$EDGE_NETWORK" \
  "TRAEFIK_ENTRYPOINT=$TRAEFIK_ENTRYPOINT" \
  "TRAEFIK_CERT_RESOLVER=$TRAEFIK_CERT_RESOLVER" \
  "KEP_IMAGE=$KEP_IMAGE" \
  "KEP_DB_PASSWORD=$KEP_DB_PASSWORD" \
  "CA2_KEP_DEVNET_RPC_URL=$CA2_KEP_DEVNET_RPC_URL" \
  > "$DEPLOY_ENV"
unset KEP_DB_PASSWORD

echo "checking isolated VPS destination"
ssh_remote "set -eu; command -v docker >/dev/null; docker compose version >/dev/null; docker network inspect '$EDGE_NETWORK' >/dev/null; if [ -e '$REMOTE_DIR' ] && [ ! -f '$REMOTE_DIR/.ca2-kep-deployment' ]; then echo 'refusing unexpected remote directory' >&2; exit 1; fi; mkdir -p '$REMOTE_DIR'; touch '$REMOTE_DIR/.ca2-kep-deployment'"

echo "uploading staged image and configuration"
upload "$IMAGE_ARCHIVE" "image.tar.gz.next"
upload "$COMPOSE_FILE" "compose.yaml.next"
upload "$DEPLOY_ENV" ".env.upload"

echo "validating staged release"
ssh_remote "set -eu; cd '$REMOTE_DIR'; install -m 0600 .env.upload .env.next; rm -f .env.upload; gzip -dc image.tar.gz.next | docker load >/dev/null; docker image inspect '$KEP_IMAGE' >/dev/null; docker compose --env-file .env.next --file compose.yaml.next config --quiet"

rollback() {
  echo "deployment validation failed; restoring the prior configuration" >&2
  ssh_remote "set -eu; cd '$REMOTE_DIR'; if [ -f compose.yaml.previous ] && [ -f .env.previous ]; then cp -p compose.yaml.previous compose.yaml; cp -p .env.previous .env; docker compose --env-file .env --file compose.yaml up -d; fi" || true
}

echo "creating exact rollback configuration"
ssh_remote "set -eu; cd '$REMOTE_DIR'; rm -f compose.yaml.previous .env.previous; if [ -f compose.yaml ] || [ -f .env ]; then test -f compose.yaml; test -f .env; cp -p compose.yaml compose.yaml.previous; cp -p .env .env.previous; fi; mv compose.yaml.next compose.yaml; mv .env.next .env; rm -f image.tar.gz.next"

echo "starting isolated KEP services"
if ! ssh_remote "set -eu; cd '$REMOTE_DIR'; docker compose --env-file .env --file compose.yaml up -d --remove-orphans; docker compose --env-file .env --file compose.yaml ps"
then
  rollback
  exit 1
fi

echo "checking container health"
if ! ssh_remote "set -eu; cd '$REMOTE_DIR'; container_id=\"\$(docker compose --env-file .env --file compose.yaml ps -q application)\"; test -n \"\$container_id\"; attempt=1; while [ \"\$attempt\" -le 24 ]; do status=\"\$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \"\$container_id\" 2>/dev/null || true)\"; [ \"\$status\" = healthy ] && exit 0; [ \"\$status\" = exited ] && exit 1; sleep 5; attempt=\$((attempt + 1)); done; exit 1"
then
  rollback
  exit 1
fi

echo "checking public HTTPS observation"
attempt=1
while [ "$attempt" -le 18 ]; do
  if health="$(curl -fsS --max-time 15 "https://$PUBLIC_HOST/health")" &&
     printf '%s' "$health" | grep -F '"network":"solana-devnet"' >/dev/null &&
     curl -fsS --max-time 15 "https://$PUBLIC_HOST/" >/dev/null
  then
    printf '%s\n' \
      "deploy result: PASS" \
      "public URL: https://$PUBLIC_HOST/" \
      "image: $KEP_IMAGE" \
      "implementation material digest: $MATERIAL_DIGEST" \
      "backup envelope: $KEP_BACKUP_ENVELOPE_ID" \
      "claim limit: disposable hosted Devnet deployment observation only"
    exit 0
  fi
  sleep 5
  attempt=$((attempt + 1))
done

rollback
echo "public HTTPS observation failed; do not retry after this ambiguous effect without inspection" >&2
exit 1
