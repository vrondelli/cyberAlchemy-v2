#!/usr/bin/env bash
set -euo pipefail

stable_ca=/var/lib/auth-foundation-staging/runtime/tls/ca.crt
candidate_ca=/var/lib/auth-foundation-candidate/runtime/tls/ca.crt
candidate_release=$(readlink -f /srv/auth-foundation-candidate/current)

echo "observed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "hostname=$(hostname)"
echo "stable_release=$(cat /var/lib/auth-foundation-staging/release-id)"
echo "candidate_release=$(cat /var/lib/auth-foundation-candidate/release-id)"
echo "candidate_current=$candidate_release"
echo "stable_service=$(systemctl is-active auth-foundation-staging.service)"
echo "candidate_service=$(systemctl is-active auth-foundation-candidate.service)"
echo PORTS
ss -lntH | awk '{print $4}' | grep -E '127.0.0.1:(13443|18443|19443|23443|28443|29443)$' | sort
echo CANDIDATE_CONTAINERS
docker ps --filter label=com.docker.compose.project=auth-foundation-candidate --format '{{.Names}}|{{.Status}}|{{.Ports}}' | sort
echo STABLE_CONTAINERS
docker ps --filter label=com.docker.compose.project=auth-foundation-https --format '{{.Names}}|{{.Status}}|{{.Ports}}' | sort
echo CANDIDATE_PROFILE
python3 - "$candidate_release/.runtime/config.json" <<'PY'
import json, sys
c=json.load(open(sys.argv[1]))
fields=('profile','issuer','origin','operatorOrigin','composeProject','appPort','issuerPort','operatorPort','browserClient','serviceClient')
print(json.dumps({key:c[key] for key in fields},sort_keys=True))
PY
echo CANDIDATE_MODES
stat -c '%a %u:%g %n' \
  /var/lib/auth-foundation-candidate/runtime/proxy \
  /var/lib/auth-foundation-candidate/runtime/proxy/nginx.conf \
  /var/lib/auth-foundation-candidate/runtime/proxy/upstream.conf \
  /var/lib/auth-foundation-candidate/runtime/socket/app.sock
echo STABLE_HEALTH
curl --silent --show-error --fail --cacert "$stable_ca" https://localhost:13443/health
echo
echo CANDIDATE_HEALTH
candidate_headers=$(mktemp)
trap 'rm -f "$candidate_headers"' EXIT
curl --silent --show-error --fail --cacert "$candidate_ca" -D "$candidate_headers" https://localhost:23443/health
echo
awk 'BEGIN{IGNORECASE=1}/^x-auth-correlation-id:/{gsub("\r","");print}' "$candidate_headers"
echo "issuer_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --cacert "$candidate_ca" https://localhost:28443/realms/auth-https/.well-known/openid-configuration)"
echo "invalid_host_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' --cacert "$candidate_ca" -H 'Host: attacker.invalid' https://localhost:23443/health)"
echo CORRELATION_SPOOF
curl --silent --show-error --cacert "$candidate_ca" -D - -H 'X-Auth-Correlation-Id: attacker-controlled' https://localhost:23443/health
echo
echo SERVICE_AUTHORIZATION
runuser -u auth-stage -- env NODE_EXTRA_CA_CERTS=/var/lib/auth-foundation-candidate/runtime/tls/ca.crt \
  "$candidate_release/runtime-node" "$candidate_release/scripts/service.mjs"
echo FINAL_CANDIDATE_HEALTH
curl --silent --show-error --fail --cacert "$candidate_ca" https://localhost:23443/health
echo
