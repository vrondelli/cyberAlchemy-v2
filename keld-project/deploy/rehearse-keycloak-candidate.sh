#!/bin/bash
set -euo pipefail

usage() {
  echo "usage: $0 IMAGE BACKUP_DIR EVIDENCE_FILE [POSTGRES_IMAGE]" >&2
  exit 2
}

[[ $# -ge 3 && $# -le 4 ]] || usage

candidate_image=$1
backup_dir=$2
evidence_file=$3
postgres_image=${4:-keld-postgres:16-security-plan-20260920-r2}

[[ $candidate_image =~ ^[A-Za-z0-9][A-Za-z0-9._/:@-]+$ ]] || {
  echo "invalid candidate image reference" >&2
  exit 2
}
[[ $postgres_image =~ ^[A-Za-z0-9][A-Za-z0-9._/:@-]+$ ]] || {
  echo "invalid postgres image reference" >&2
  exit 2
}
[[ $backup_dir = /* && -f $backup_dir/keycloak.dump ]] || {
  echo "backup directory must be absolute and contain keycloak.dump" >&2
  exit 2
}
[[ $evidence_file = /* && -d ${evidence_file%/*} && ! -e $evidence_file ]] || {
  echo "evidence file must be a new absolute path in an existing directory" >&2
  exit 2
}

candidate_image_id=$(docker image inspect "$candidate_image" --format '{{.Id}}')
postgres_image_id=$(docker image inspect "$postgres_image" --format '{{.Id}}')
rehearsal_id="keld-kc-rehearsal-$$"
rehearsal_network=$rehearsal_id
rehearsal_volume="${rehearsal_id}-pgdata"
rehearsal_dump_volume="${rehearsal_id}-dump"
postgres_container="${rehearsal_id}-db"
keycloak_container="${rehearsal_id}-keycloak"
rehearsal_password=$(openssl rand -hex 24)
started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
hold_seconds=${KELD_REHEARSAL_HOLD_SECONDS:-0}
browser_port=${KELD_REHEARSAL_BROWSER_PORT:-}
[[ $hold_seconds =~ ^[0-9]+$ && $hold_seconds -le 900 ]] || {
  echo "KELD_REHEARSAL_HOLD_SECONDS must be an integer from 0 to 900" >&2
  exit 2
}
rehearsal_hostname=http://keycloak:8080
if (( hold_seconds > 0 )); then
  [[ $browser_port =~ ^[0-9]+$ && $browser_port -ge 1024 && $browser_port -le 65535 ]] || {
    echo "KELD_REHEARSAL_BROWSER_PORT must be a non-privileged TCP port in hold mode" >&2
    exit 2
  }
  rehearsal_hostname="http://127.0.0.1:${browser_port}"
fi

cleanup() {
  docker rm -f "$keycloak_container" "$postgres_container" >/dev/null 2>&1 || true
  docker volume rm "$rehearsal_dump_volume" "$rehearsal_volume" >/dev/null 2>&1 || true
  docker network rm "$rehearsal_network" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker network create --internal "$rehearsal_network" >/dev/null
docker volume create "$rehearsal_volume" >/dev/null
docker volume create "$rehearsal_dump_volume" >/dev/null
docker run --rm --user 0:0 \
  -v "$backup_dir/keycloak.dump:/source/keycloak.dump:ro" \
  -v "$rehearsal_dump_volume:/backup" \
  --entrypoint /bin/sh "$postgres_image" \
  -c 'cp /source/keycloak.dump /backup/keycloak.dump && chown 70:70 /backup/keycloak.dump && chmod 0400 /backup/keycloak.dump'

docker run -d --name "$postgres_container" \
  --network "$rehearsal_network" --network-alias postgres \
  --user 70:70 --read-only --cap-drop ALL \
  --security-opt no-new-privileges:true --pids-limit 128 --memory 768m \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="$rehearsal_password" \
  -v "$rehearsal_volume:/var/lib/postgresql/data" \
  --tmpfs /tmp:size=16m,mode=1777 \
  --tmpfs /var/run/postgresql:size=16m,uid=70,gid=70,mode=3775 \
  "$postgres_image" >/dev/null

postgres_ready=false
for _ in $(seq 1 30); do
  if docker exec "$postgres_container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then
    postgres_ready=true
    break
  fi
  sleep 1
done
[[ $postgres_ready = true ]] || {
  docker logs --tail 80 "$postgres_container" >&2
  echo "isolated PostgreSQL did not become ready" >&2
  exit 1
}

docker exec "$postgres_container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "CREATE ROLE keycloak LOGIN PASSWORD '$rehearsal_password'" >/dev/null
docker exec "$postgres_container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c 'CREATE DATABASE keycloak OWNER keycloak' >/dev/null
docker run --rm --network "$rehearsal_network" \
  -e PGPASSWORD="$rehearsal_password" \
  -v "$rehearsal_dump_volume:/backup:ro" \
  --entrypoint pg_restore "$postgres_image" \
  --exit-on-error --no-owner --no-privileges \
  --host postgres --username keycloak --dbname keycloak /backup/keycloak.dump

docker run -d --name "$keycloak_container" \
  --network "$rehearsal_network" --network-alias keycloak \
  --user 1000:0 --read-only --cap-drop ALL \
  --security-opt no-new-privileges:true --pids-limit 256 --memory 2g \
  -e KC_DB=postgres \
  -e KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak \
  -e KC_DB_USERNAME=keycloak -e KC_DB_PASSWORD="$rehearsal_password" \
  -e KC_HOSTNAME="$rehearsal_hostname" -e KC_HTTP_ENABLED=true \
  -e KC_HEALTH_ENABLED=true -e KC_BOOTSTRAP_ADMIN_USERNAME=rehearsal-admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD="$rehearsal_password" \
  --tmpfs /tmp:size=64m,mode=1777 \
  --tmpfs /opt/keycloak/data/tmp:size=64m,uid=1000,gid=0,mode=0770 \
  "$candidate_image" start --optimized >/dev/null

keycloak_ready=false
for _ in $(seq 1 45); do
  if docker exec "$keycloak_container" bash -c \
    "exec 3<>/dev/tcp/127.0.0.1/9000; printf 'GET /health/ready HTTP/1.1\\r\\nhost: localhost\\r\\nConnection: close\\r\\n\\r\\n' >&3; head -n 1 <&3 | grep -q ' 200 '" \
    >/dev/null 2>&1; then
    keycloak_ready=true
    break
  fi
  sleep 2
done
[[ $keycloak_ready = true ]] || {
  docker logs --tail 120 "$keycloak_container" >&2
  echo "candidate Keycloak did not become ready" >&2
  exit 1
}

docker exec "$keycloak_container" bash -c \
  "exec 3<>/dev/tcp/127.0.0.1/8080; printf 'GET /realms/keld/.well-known/openid-configuration HTTP/1.1\\r\\nhost: keycloak:8080\\r\\nConnection: close\\r\\n\\r\\n' >&3; head -n 1 <&3 | grep -q ' 200 '"

if (( hold_seconds > 0 )); then
  browser_target=$(docker inspect "$keycloak_container" --format \
    '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
  echo "browser-target=${browser_target}:8080 browser-port=${browser_port} hold-seconds=${hold_seconds}"
  sleep "$hold_seconds"
fi

user_count=$(docker exec "$postgres_container" psql -U postgres -d keycloak -Atc \
  'SELECT count(*) FROM user_entity')
realm_count=$(docker exec "$postgres_container" psql -U postgres -d keycloak -Atc \
  'SELECT count(*) FROM realm')
runtime_image_id=$(docker inspect "$keycloak_container" --format '{{.Image}}')
runtime_read_only=$(docker inspect "$keycloak_container" --format '{{.HostConfig.ReadonlyRootfs}}')
runtime_published_ports=$(docker inspect "$keycloak_container" --format '{{json .NetworkSettings.Ports}}')
finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)

python3 - "$evidence_file" <<PY
import json
import os
import sys

path = sys.argv[1]
payload = {
    "schema": "keld-keycloak-candidate-rehearsal/v1",
    "startedAt": "$started_at",
    "finishedAt": "$finished_at",
    "candidateImage": "$candidate_image",
    "candidateImageId": "$candidate_image_id",
    "runtimeImageId": "$runtime_image_id",
    "postgresImage": "$postgres_image",
    "postgresImageId": "$postgres_image_id",
    "backupDirectory": "$backup_dir",
    "restoredUsers": int("$user_count"),
    "restoredRealms": int("$realm_count"),
    "readyHttpStatus": 200,
    "issuerDiscoveryHttpStatus": 200,
    "readOnlyRoot": "$runtime_read_only" == "true",
    "publishedPorts": json.loads('$runtime_published_ports'),
    "networkInternal": True,
    "cleanupOnExit": True,
}
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w", encoding="utf-8") as handle:
    json.dump(payload, handle, indent=2, sort_keys=True)
    handle.write("\n")
PY

sha256sum "$evidence_file"
python3 - "$evidence_file" <<'PY'
import json
import sys

payload = json.load(open(sys.argv[1], encoding="utf-8"))
print(
    "candidate rehearsal passed:",
    f"users={payload['restoredUsers']}",
    f"realms={payload['restoredRealms']}",
    f"readOnlyRoot={payload['readOnlyRoot']}",
    f"publishedPorts={payload['publishedPorts']}",
)
PY
