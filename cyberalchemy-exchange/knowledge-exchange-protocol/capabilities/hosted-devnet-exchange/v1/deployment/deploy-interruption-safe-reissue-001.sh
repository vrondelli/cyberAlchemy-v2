#!/usr/bin/env bash
set -euo pipefail
umask 077

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CANDIDATE="$SCRIPT_DIR/interruption-safe-reissue-deployment-candidate-001.json"
EXPECTED_CANDIDATE_DIGEST="${CA2_KEP_DEPLOY_CANDIDATE_DIGEST:-}"
SSH_TARGET="root@187.77.248.154"
REMOTE_DIR="/srv/kep-hosted-devnet"
PUBLIC_HOST="kep.cyberalchemylab.com"
IMAGE_TAG="ca2-kep-hosted-devnet:interruption-safe-ca45ec35c4fb"
LOCAL_ARCHIVE="/home/vrondelli/.cache/cyberalchemy/kep/interruption-safe-reissue-prep-001/image-interruption-safe-ca45ec35c4fb12103156c7d205b8d5b03b3cc3f9e59cbbb8796b8b8681401963.tar.gz"
ARCHIVE_NAME="image-interruption-safe-ca45ec35c4fb12103156c7d205b8d5b03b3cc3f9e59cbbb8796b8b8681401963.tar.gz.next"
DUMP_NAME="predeploy-interruption-safe-001.dump"
ROLLBACK_COMPOSE="compose.yaml.rollback-interruption-safe-001"
ROLLBACK_ENV=".env.rollback-interruption-safe-001"
NEXT_ENV=".env.interruption-safe-001.next"
POSTGRES_PASSWORD_FILE="/home/vrondelli/.config/cyberalchemy/kep-hosted-devnet/postgres-password"
BACKUP_ENVELOPE_FILE="/home/vrondelli/.config/cyberalchemy/kep-hosted-devnet/backup-envelope-id"

require_digest() {
  local value="$1"
  [[ "$value" =~ ^[0-9a-f]{64}$ ]]
}

if ! require_digest "$EXPECTED_CANDIDATE_DIGEST"; then
  echo "CA2_KEP_DEPLOY_CANDIDATE_DIGEST must contain the accepted candidate digest" >&2
  exit 2
fi
test -f "$CANDIDATE"
test "$(sha256sum "$CANDIDATE" | cut -d' ' -f1)" = "$EXPECTED_CANDIDATE_DIGEST"
test "$(stat -c '%a' "$POSTGRES_PASSWORD_FILE")" = 600
test "$(stat -c '%a' "$BACKUP_ENVELOPE_FILE")" = 600
test "$(sha256sum "$BACKUP_ENVELOPE_FILE" | cut -d' ' -f1)" = 59c6e80004cb97551c308c903ef5c07ebc795f0f7e574a06a3d3d271a9ba9ebe
test "$(sha256sum "$LOCAL_ARCHIVE" | cut -d' ' -f1)" = f593ec0b4bb1937f938e33de8c428310f1b00749b8a279d9a3967ceb700d6c11
test "$(stat -c '%s' "$LOCAL_ARCHIVE")" = 37706115
test "$(docker image inspect --format '{{.Id}}' "$IMAGE_TAG")" = sha256:e6ea41cc840047d538ded10aab27f66b72226f97d139e35538e799e9710470d4

echo "read-only VPS preflight"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=12 "$SSH_TARGET" "set -eu
cd '$REMOTE_DIR'
test \"\$(sha256sum .ca2-kep-deployment | cut -d' ' -f1)\" = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
test \"\$(sha256sum compose.yaml | cut -d' ' -f1)\" = 33ab1e1c07582df9c0d7d7dbd0f14d512e60e5185ae633e91c3dc4bdd1bb2dde
test \"\$(sha256sum .env | cut -d' ' -f1)\" = eca6b75ec60965d487385c835410320f07e9720c971dba92a793e194e9b55e90
test \"\$(stat -c '%a' .env)\" = 600
test \"\$(grep '^KEP_IMAGE=' .env)\" = 'KEP_IMAGE=ca2-kep-hosted-devnet:recipient-access-3d20751e7462'
test \"\$(sed 's|^KEP_IMAGE=.*$|KEP_IMAGE=$IMAGE_TAG|' .env | sha256sum | cut -d' ' -f1)\" = 8fe2456f1aaef4f5d1aed1333b34c15f0e44aa1b77f9fca8980e841c1fdae760
app=\"\$(docker compose --env-file .env --file compose.yaml ps -q application)\"
db=\"\$(docker compose --env-file .env --file compose.yaml ps -q database)\"
test \"\$(docker inspect --format '{{.Id}}|{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.Config.Image}}|{{.Image}}' \"\$app\")\" = 'ffd070889218ead1b62e4291761affaa97d8ed53842f4b7b6972e6c93497694e|running|healthy|ca2-kep-hosted-devnet:recipient-access-3d20751e7462|sha256:27ef85a82f850069b3e312db707d2c0f8fd857148330db7f5b5bc8bd6bd54902'
test \"\$(docker inspect --format '{{.Id}}|{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.Config.Image}}' \"\$db\")\" = '24ff8c3207f9e68a716ba24391bddf92b270900d65bd0e457f57d0003e47d2ae|running|healthy|postgres:17-alpine'
test \"\$(docker volume inspect --format '{{.Name}}' kep-hosted-devnet_kep-postgres)\" = kep-hosted-devnet_kep-postgres
test \"\$(docker network inspect --format '{{.Name}}' troqar_edge)\" = troqar_edge
for path in 'artifacts/$ARCHIVE_NAME' 'artifacts/$DUMP_NAME' '$ROLLBACK_COMPOSE' '$ROLLBACK_ENV' '$NEXT_ENV'; do test ! -e \"\$path\"; done
test \"\$(df -B1 --output=avail . | tail -n1 | tr -d ' ')\" -ge 1000000000"

echo "creating one mode-0600 PostgreSQL dump"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$SSH_TARGET" "set -eu
cd '$REMOTE_DIR'
umask 077
db=\"\$(docker compose --env-file .env --file compose.yaml ps -q database)\"
docker exec \"\$db\" pg_dump -U kep -d kep -Fc > 'artifacts/$DUMP_NAME'
test -s 'artifacts/$DUMP_NAME'
test \"\$(stat -c '%a' 'artifacts/$DUMP_NAME')\" = 600"

echo "uploading the exact image archive once"
scp -o BatchMode=yes -o StrictHostKeyChecking=yes "$LOCAL_ARCHIVE" "$SSH_TARGET:$REMOTE_DIR/artifacts/$ARCHIVE_NAME"

echo "loading the exact image once"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$SSH_TARGET" "set -eu
cd '$REMOTE_DIR'
test \"\$(sha256sum 'artifacts/$ARCHIVE_NAME' | cut -d' ' -f1)\" = f593ec0b4bb1937f938e33de8c428310f1b00749b8a279d9a3967ceb700d6c11
test \"\$(stat -c '%s' 'artifacts/$ARCHIVE_NAME')\" = 37706115
gzip -dc 'artifacts/$ARCHIVE_NAME' | docker load >/dev/null
docker image inspect '$IMAGE_TAG' >/dev/null"

remote_projection="$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$SSH_TARGET" docker image inspect "$IMAGE_TAG" | jq -cS '.[0] | {Architecture,Os,Created,Entrypoint:.Config.Entrypoint,Env:.Config.Env,ExposedPorts:.Config.ExposedPorts,User:.Config.User,RootFS}' | sha256sum | cut -d' ' -f1)"
test "$remote_projection" = 1dbcdfd6f5b16d3eb424176a05772a7259775dff380798b4864f261d41ee9adc

echo "promoting KEP_IMAGE and replacing only the application container"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$SSH_TARGET" "set -eu
cd '$REMOTE_DIR'
umask 077
cp -p compose.yaml '$ROLLBACK_COMPOSE'
cp -p .env '$ROLLBACK_ENV'
sed 's|^KEP_IMAGE=.*$|KEP_IMAGE=$IMAGE_TAG|' .env > '$NEXT_ENV'
chmod 600 '$NEXT_ENV'
test \"\$(sha256sum '$NEXT_ENV' | cut -d' ' -f1)\" = 8fe2456f1aaef4f5d1aed1333b34c15f0e44aa1b77f9fca8980e841c1fdae760
mv '$NEXT_ENV' .env
docker compose --env-file .env --file compose.yaml up -d --no-build --no-deps application"

echo "bounded remote verification"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$SSH_TARGET" "set -eu
cd '$REMOTE_DIR'
app=\"\$(docker compose --env-file .env --file compose.yaml ps -q application)\"
db=\"\$(docker compose --env-file .env --file compose.yaml ps -q database)\"
attempt=1
while [ \"\$attempt\" -le 24 ]; do
  status=\"\$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \"\$app\" 2>/dev/null || true)\"
  [ \"\$status\" = healthy ] && break
  [ \"\$status\" = exited ] && exit 1
  sleep 5
  attempt=\$((attempt + 1))
done
test \"\$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \"\$app\")\" = healthy
test \"\$(docker inspect --format '{{.Config.Image}}' \"\$app\")\" = '$IMAGE_TAG'
test \"\$(docker inspect --format '{{.Id}}' \"\$app\")\" != ffd070889218ead1b62e4291761affaa97d8ed53842f4b7b6972e6c93497694e
test \"\$(docker inspect --format '{{.Id}}|{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \"\$db\")\" = '24ff8c3207f9e68a716ba24391bddf92b270900d65bd0e457f57d0003e47d2ae|running|healthy'
test \"\$(sha256sum compose.yaml | cut -d' ' -f1)\" = 33ab1e1c07582df9c0d7d7dbd0f14d512e60e5185ae633e91c3dc4bdd1bb2dde
test \"\$(sha256sum .env | cut -d' ' -f1)\" = 8fe2456f1aaef4f5d1aed1333b34c15f0e44aa1b77f9fca8980e841c1fdae760
test \"\$(stat -c '%a' .env)\" = 600
test -s 'artifacts/$DUMP_NAME'
test \"\$(stat -c '%a' 'artifacts/$DUMP_NAME')\" = 600"

echo "bounded public and Devnet verification"
public_ok=0
for attempt in $(seq 1 6); do
  if health="$(curl -fsS --max-time 15 "https://$PUBLIC_HOST/health" 2>/dev/null)" &&
     root_sha="$(curl -fsS --max-time 15 "https://$PUBLIC_HOST/" | sha256sum | cut -d' ' -f1)" &&
     bundle_sha="$(curl -fsS --max-time 15 "https://$PUBLIC_HOST/assets/app.js" | sha256sum | cut -d' ' -f1)" &&
     test "$(printf '%s' "$health" | sha256sum | cut -d' ' -f1)" = 3806eb95907ffc42c4501e234a7a2fd2a5b1047e3ab682611e1c60796c0cc0b1 &&
     test "$root_sha" = 12f8ef7647ce474ccce5845c5e57cd84fe1da667d36fcbb917d35e334dcdfb08 &&
     test "$bundle_sha" = f2016a52969892336a2fb6de7bcf050e5ecfd08f14e59a82393df6e97499aa9b; then
    public_ok=1
    break
  fi
  sleep 5
done
test "$public_ok" -eq 1
tls="$(printf '' | openssl s_client -connect "$PUBLIC_HOST:443" -servername "$PUBLIC_HOST" 2>/dev/null | openssl x509 -noout -fingerprint -sha256 | cut -d= -f2)"
test "$tls" = AF:6F:38:23:89:F7:1C:9E:09:C1:37:EC:28:8E:5D:45:30:AD:A6:D0:A7:F2:F2:D7:4F:D0:56:72:89:57:18:34
genesis="$(curl -fsS --max-time 15 https://api.devnet.solana.com -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"getGenesisHash"}' | jq -r '.result')"
test "$genesis" = EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG

printf '%s\n' \
  'deployment_result=PASS' \
  "candidate_digest=$EXPECTED_CANDIDATE_DIGEST" \
  "image_tag=$IMAGE_TAG" \
  'network=solana-devnet' \
  "public_url=https://$PUBLIC_HOST/" \
  'automatic_retry=false' \
  'automatic_rollback=false'
