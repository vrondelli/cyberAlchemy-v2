#!/bin/bash
set -euo pipefail

usage() {
  echo "usage: $0 KEYCLOAK_IMAGE APP_IMAGE BACKUP_DIR ARTIFACT_FILE EVIDENCE_FILE" >&2
  exit 2
}

[[ $# -eq 5 ]] || usage
keycloak_image=$1
app_image=$2
backup_dir=$3
artifact_file=$4
evidence_file=$5
postgres_image=${KELD_REHEARSAL_POSTGRES_IMAGE:-keld-postgres:16-security-plan-20260920-r2}
caddy_image=${KELD_REHEARSAL_CADDY_IMAGE:-keld-caddy:2.11.4-security-plan-20260920-r2}
hold_seconds=${KELD_REHEARSAL_HOLD_SECONDS:-600}
browser_receipt=${KELD_REHEARSAL_BROWSER_RECEIPT:-${evidence_file%.json}.browser.json}

for image in "$keycloak_image" "$app_image" "$postgres_image" "$caddy_image"; do
  [[ $image =~ ^[A-Za-z0-9][A-Za-z0-9._/:@-]+$ ]] || {
    echo "invalid image reference" >&2
    exit 2
  }
done
[[ $backup_dir = /* && -f $backup_dir/keycloak.dump && -f $backup_dir/keld_sessions.dump && -f $backup_dir/commerce.db && -f $backup_dir/keld.json ]] || {
  echo "backup directory is incomplete" >&2
  exit 2
}
[[ $artifact_file = /* && -f $artifact_file ]] || {
  echo "artifact file must be an existing absolute path" >&2
  exit 2
}
for path in "$evidence_file" "$browser_receipt"; do
  [[ $path = /* && -d ${path%/*} && ! -e $path ]] || {
    echo "evidence paths must be new absolute paths in existing directories" >&2
    exit 2
  }
done
[[ $hold_seconds =~ ^[0-9]+$ && $hold_seconds -ge 30 && $hold_seconds -le 1200 ]] || {
  echo "KELD_REHEARSAL_HOLD_SECONDS must be an integer from 30 to 1200" >&2
  exit 2
}

keycloak_image_id=$(docker image inspect "$keycloak_image" --format '{{.Id}}')
app_image_id=$(docker image inspect "$app_image" --format '{{.Id}}')
postgres_image_id=$(docker image inspect "$postgres_image" --format '{{.Id}}')
caddy_image_id=$(docker image inspect "$caddy_image" --format '{{.Id}}')

rehearsal_id="keld-app-rehearsal-$$"
network=$rehearsal_id
pg_volume="${rehearsal_id}-pgdata"
dump_volume="${rehearsal_id}-dumps"
postgres_container="${rehearsal_id}-postgres"
keycloak_container="${rehearsal_id}-keycloak"
proxy_container="${rehearsal_id}-proxy"
app_container="${rehearsal_id}-app"
runtime_dir=$(mktemp -d "/tmp/${rehearsal_id}.XXXXXX")
rehearsal_password=$(openssl rand -hex 24)
client_secret=$(openssl rand -hex 32)
session_key=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n')
origin=https://app.rehearsal.test:18443
issuer=https://auth.rehearsal.test:18443/realms/keld
started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cleanup() {
  docker rm -f "$app_container" "$proxy_container" "$keycloak_container" "$postgres_container" >/dev/null 2>&1 || true
  docker volume rm "$dump_volume" "$pg_volume" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  if [[ $runtime_dir == /tmp/keld-app-rehearsal-* ]]; then rm -rf "$runtime_dir"; fi
}
trap cleanup EXIT

chmod 0711 "$runtime_dir"
install -d -m 0755 "$runtime_dir/config" "$runtime_dir/proxy" "$runtime_dir/tls"
install -d -m 0700 "$runtime_dir/secrets" "$runtime_dir/commerce"
chown 10001:10001 "$runtime_dir/secrets" "$runtime_dir/commerce"

openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -subj /CN=auth.rehearsal.test \
  -addext 'subjectAltName=DNS:auth.rehearsal.test,DNS:app.rehearsal.test' \
  -keyout "$runtime_dir/tls/key.pem" -out "$runtime_dir/tls/cert.pem" >/dev/null 2>&1
chown 1001:1001 "$runtime_dir/tls/key.pem" "$runtime_dir/tls/cert.pem"
chmod 0400 "$runtime_dir/tls/key.pem"
chmod 0444 "$runtime_dir/tls/cert.pem"

python3 - "$backup_dir/keld.json" "$runtime_dir/config/keld.json" "$origin" "$issuer" <<'PY'
import json
import sys
import time

source, target, origin, issuer = sys.argv[1:]
config = json.load(open(source, encoding="utf-8"))
config["origin"] = origin
config["auth"]["issuer"] = issuer
config["listener"] = {"mode": "proxy-http", "host": "0.0.0.0", "port": 8080}
config["ledger"]["database"] = "/data/commerce.db"
config["ledger"]["fixtureFile"] = "/artifacts/sandbox.bin"
config["quoteBrl"]["reference"] = "isolated-candidate-rehearsal"
config["quoteBrl"]["expiresAt"] = int(time.time()) + 3600
with open(target, "x", encoding="utf-8") as handle:
    json.dump(config, handle, indent=2, sort_keys=True)
    handle.write("\n")
PY
chmod 0444 "$runtime_dir/config/keld.json"

install -m 0600 "$backup_dir/commerce.db" "$runtime_dir/commerce/commerce.db"
chown 10001:10001 "$runtime_dir/commerce/commerce.db"
write_secret() {
  local name=$1 value=$2 path="$runtime_dir/secrets/$1"
  install -m 0400 /dev/null "$path"
  chown 10001:10001 "$path"
  printf %s "$value" >"$path"
}
write_secret stripe sk_test_isolated_candidate_rehearsal
write_secret mercadopago APP_USR-isolated-candidate-rehearsal
write_secret paypal_client_id isolated-candidate-client
write_secret paypal_secret isolated-candidate-secret
write_secret oidc "$client_secret"
write_secret session_database_url "postgresql://keld_session:${rehearsal_password}@postgres:5432/keld_sessions"
write_secret session_key "$session_key"
write_secret stripe_webhook whsec_isolated_candidate_rehearsal
write_secret mp_webhook isolated-candidate-webhook

cat >"$runtime_dir/proxy/Caddyfile" <<'CADDY'
{
  admin off
  auto_https disable_redirects
}
https://auth.rehearsal.test:18443 {
  tls /tls/cert.pem /tls/key.pem
  reverse_proxy keycloak:8080
}
https://app.rehearsal.test:18443 {
  tls /tls/cert.pem /tls/key.pem
  reverse_proxy app:8080
}
CADDY
chmod 0444 "$runtime_dir/proxy/Caddyfile"

docker network create --internal "$network" >/dev/null
docker volume create "$pg_volume" >/dev/null
docker volume create "$dump_volume" >/dev/null
docker run --rm --user 0:0 \
  -v "$backup_dir:/source:ro" -v "$dump_volume:/backup" \
  --entrypoint /bin/sh "$postgres_image" -c \
  'cp /source/keycloak.dump /source/keld_sessions.dump /backup/ && chown 70:70 /backup/*.dump && chmod 0400 /backup/*.dump'

docker run -d --name "$postgres_container" --network "$network" --network-alias postgres \
  --user 70:70 --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  --pids-limit 128 --memory 768m -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD="$rehearsal_password" -v "$pg_volume:/var/lib/postgresql/data" \
  --tmpfs /tmp:size=16m,mode=1777 --tmpfs /var/run/postgresql:size=16m,uid=70,gid=70,mode=3775 \
  "$postgres_image" >/dev/null

postgres_ready=false
for _ in $(seq 1 30); do
  if docker exec "$postgres_container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then postgres_ready=true; break; fi
  sleep 1
done
[[ $postgres_ready = true ]] || { docker logs --tail 80 "$postgres_container" >&2; exit 1; }

docker exec -i "$postgres_container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres >/dev/null <<SQL
CREATE ROLE keycloak LOGIN PASSWORD '$rehearsal_password';
CREATE DATABASE keycloak OWNER keycloak;
CREATE ROLE keld_session LOGIN PASSWORD '$rehearsal_password';
CREATE DATABASE keld_sessions OWNER keld_session;
SQL
for database in keycloak keld_sessions; do
  restore_user=keycloak
  [[ $database == keld_sessions ]] && restore_user=keld_session
  docker run --rm --network "$network" -e PGPASSWORD="$rehearsal_password" \
    -v "$dump_volume:/backup:ro" --entrypoint pg_restore "$postgres_image" \
    --exit-on-error --no-owner --no-privileges --host postgres \
    --username "$restore_user" --dbname "$database" "/backup/${database}.dump"
done

restored_users=$(docker exec "$postgres_container" psql -U postgres -d keycloak -Atc 'SELECT count(*) FROM user_entity')
restored_sessions=$(docker exec "$postgres_container" psql -U postgres -d keld_sessions -Atc 'SELECT count(*) FROM af_session_families')
docker exec -i "$postgres_container" psql -v ON_ERROR_STOP=1 -U postgres -d keycloak >/dev/null <<SQL
UPDATE client SET secret='$client_secret' WHERE client_id='keld' AND realm_id=(SELECT id FROM realm WHERE name='keld');
DELETE FROM redirect_uris WHERE client_id=(SELECT id FROM client WHERE client_id='keld' AND realm_id=(SELECT id FROM realm WHERE name='keld'));
INSERT INTO redirect_uris(client_id,value) SELECT id,'$origin/auth/callback' FROM client WHERE client_id='keld' AND realm_id=(SELECT id FROM realm WHERE name='keld');
DELETE FROM web_origins WHERE client_id=(SELECT id FROM client WHERE client_id='keld' AND realm_id=(SELECT id FROM realm WHERE name='keld'));
INSERT INTO web_origins(client_id,value) SELECT id,'$origin' FROM client WHERE client_id='keld' AND realm_id=(SELECT id FROM realm WHERE name='keld');
UPDATE client_attributes SET value='5' WHERE name='access.token.lifespan' AND client_id=(SELECT id FROM client WHERE client_id='keld' AND realm_id=(SELECT id FROM realm WHERE name='keld'));
SQL
docker exec "$postgres_container" psql -v ON_ERROR_STOP=1 -U postgres -d keld_sessions -c \
  'TRUNCATE af_login_transactions, af_session_handles, af_session_families' >/dev/null

docker run -d --name "$keycloak_container" --network "$network" --network-alias keycloak \
  --user 1000:0 --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  --pids-limit 256 --memory 2g -e KC_DB=postgres \
  -e KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD="$rehearsal_password" -e KC_HOSTNAME=https://auth.rehearsal.test:18443 \
  -e KC_HTTP_ENABLED=true -e KC_PROXY_HEADERS=xforwarded -e KC_HEALTH_ENABLED=true \
  --tmpfs /tmp:size=64m,mode=1777 --tmpfs /opt/keycloak/data/tmp:size=64m,uid=1000,gid=0,mode=0770 \
  "$keycloak_image" start --optimized >/dev/null

keycloak_ready=false
for _ in $(seq 1 45); do
  if docker exec "$keycloak_container" bash -c \
    "exec 3<>/dev/tcp/127.0.0.1/9000; printf 'GET /health/ready HTTP/1.1\\r\\nhost: localhost\\r\\nConnection: close\\r\\n\\r\\n' >&3; head -n 1 <&3 | grep -q ' 200 '" >/dev/null 2>&1; then keycloak_ready=true; break; fi
  sleep 2
done
[[ $keycloak_ready = true ]] || { docker logs --tail 120 "$keycloak_container" >&2; exit 1; }

docker run -d --name "$proxy_container" --network "$network" \
  --network-alias auth.rehearsal.test --network-alias app.rehearsal.test \
  --user 1001:1001 --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  --pids-limit 128 --memory 256m \
  -v "$runtime_dir/proxy/Caddyfile:/etc/caddy/Caddyfile:ro" \
  -v "$runtime_dir/tls:/tls:ro" --tmpfs /data:size=32m,uid=1001,gid=1001 \
  --tmpfs /config:size=16m,uid=1001,gid=1001 --tmpfs /tmp:size=16m,uid=1001,gid=1001 \
  "$caddy_image" >/dev/null

proxy_ready=false
for _ in $(seq 1 20); do
  if docker run --rm --network "$network" --user 10001:10001 \
    -e NODE_EXTRA_CA_CERTS=/tls/cert.pem -v "$runtime_dir/tls/cert.pem:/tls/cert.pem:ro" \
    --entrypoint node "$app_image" -e \
    "fetch('${issuer}/.well-known/openid-configuration').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))" \
    >/dev/null 2>&1; then proxy_ready=true; break; fi
  sleep 1
done
[[ $proxy_ready = true ]] || { docker logs --tail 80 "$proxy_container" >&2; exit 1; }

docker run -d --name "$app_container" --network "$network" --network-alias app \
  --user 10001:10001 --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  --pids-limit 128 --memory 768m -e NODE_EXTRA_CA_CERTS=/tls/cert.pem \
  -e KELD_STRIPE_SECRET_FILE=/run/secrets/stripe \
  -e KELD_MP_TOKEN_FILE=/run/secrets/mercadopago \
  -e KELD_PAYPAL_CLIENT_ID_FILE=/run/secrets/paypal_client_id \
  -e KELD_PAYPAL_SECRET_FILE=/run/secrets/paypal_secret \
  -e KELD_OIDC_SECRET_FILE=/run/secrets/oidc \
  -e KELD_DATABASE_URL_FILE=/run/secrets/session_database_url \
  -e KELD_SESSION_KEY_FILE=/run/secrets/session_key \
  -e KELD_STRIPE_WEBHOOK_SECRET_FILE=/run/secrets/stripe_webhook \
  -e KELD_MP_WEBHOOK_SECRET_FILE=/run/secrets/mp_webhook \
  -v "$runtime_dir/config/keld.json:/config/keld.json:ro" \
  -v "$runtime_dir/secrets:/run/secrets:ro" -v "$runtime_dir/commerce:/data" \
  -v "$artifact_file:/artifacts/sandbox.bin:ro" -v "$runtime_dir/tls/cert.pem:/tls/cert.pem:ro" \
  --tmpfs /tmp:size=16m,mode=1777 --tmpfs /scratch:size=64m,mode=1777 \
  "$app_image" >/dev/null

app_ready=false
for _ in $(seq 1 45); do
  if docker exec "$app_container" node -e \
    "fetch('http://127.0.0.1:8080/readyz').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then app_ready=true; break; fi
  sleep 2
done
[[ $app_ready = true ]] || { docker logs --tail 120 "$app_container" >&2; exit 1; }

proxy_ip=$(docker inspect "$proxy_container" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "browser-target=${proxy_ip}:18443 origin=$origin issuer=$issuer receipt=$browser_receipt hold-seconds=$hold_seconds"

receipt_ready=false
for _ in $(seq 1 "$hold_seconds"); do
  if [[ -f $browser_receipt ]]; then receipt_ready=true; break; fi
  sleep 1
done
[[ $receipt_ready = true ]] || { echo "browser receipt was not supplied before timeout" >&2; exit 1; }

python3 - "$browser_receipt" <<'PY'
import json
import sys

data = json.load(open(sys.argv[1], encoding="utf-8"))
required = {
    "schema": "keld-candidate-app-browser/v1",
    "registrationA": True,
    "registrationB": True,
    "callbackExchangeA": True,
    "callbackExchangeB": True,
    "renewalA": True,
    "logoutA": True,
    "buyerAOrderCount": 1,
    "buyerBOrderCount": 0,
    "buyerBCrossRestoreStatus": 404,
}
for key, expected in required.items():
    if data.get(key) != expected:
        raise SystemExit(f"browser-receipt-invalid:{key}")
PY

final_users=$(docker exec "$postgres_container" psql -U postgres -d keycloak -Atc 'SELECT count(*) FROM user_entity')
session_families=$(docker exec "$postgres_container" psql -U postgres -d keld_sessions -Atc "SELECT count(*) FROM af_session_families WHERE namespace='keld'")
max_generation=$(docker exec "$postgres_container" psql -U postgres -d keld_sessions -Atc "SELECT COALESCE(max(generation),0) FROM af_session_families WHERE namespace='keld'")
active_sessions=$(docker exec "$postgres_container" psql -U postgres -d keld_sessions -Atc "SELECT count(*) FROM af_session_families WHERE namespace='keld' AND status='active'")
revoked_sessions=$(docker exec "$postgres_container" psql -U postgres -d keld_sessions -Atc "SELECT count(*) FROM af_session_families WHERE namespace='keld' AND status='revoked'")
receipt_sha=$(sha256sum "$browser_receipt" | cut -d' ' -f1)
finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)

python3 - "$evidence_file" <<PY
import json
import os
import sys

payload = {
    "schema": "keld-keycloak-app-candidate-rehearsal/v1",
    "startedAt": "$started_at",
    "finishedAt": "$finished_at",
    "keycloakImage": "$keycloak_image",
    "keycloakImageId": "$keycloak_image_id",
    "appImage": "$app_image",
    "appImageId": "$app_image_id",
    "postgresImageId": "$postgres_image_id",
    "caddyImageId": "$caddy_image_id",
    "restoredUsers": int("$restored_users"),
    "restoredSessionFamiliesBeforeReset": int("$restored_sessions"),
    "finalUsers": int("$final_users"),
    "sessionFamilies": int("$session_families"),
    "maxSessionGeneration": int("$max_generation"),
    "activeSessions": int("$active_sessions"),
    "revokedSessions": int("$revoked_sessions"),
    "browserReceipt": "$browser_receipt",
    "browserReceiptSha256": "$receipt_sha",
    "keycloakTlsTerminatedAtProxy": True,
    "keycloakHttpOnly": True,
    "networkInternal": True,
    "publishedPorts": False,
    "liveStateMutated": False,
    "cleanupOnExit": True,
}
fd = os.open(sys.argv[1], os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w", encoding="utf-8") as handle:
    json.dump(payload, handle, indent=2, sort_keys=True)
    handle.write("\n")
PY
sha256sum "$evidence_file" "$browser_receipt"
echo "candidate-backed application rehearsal passed"
