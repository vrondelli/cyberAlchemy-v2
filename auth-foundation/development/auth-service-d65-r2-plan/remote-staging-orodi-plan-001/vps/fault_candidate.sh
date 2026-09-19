#!/usr/bin/env bash
set -euo pipefail

container=auth-foundation-candidate-keycloak-1
candidate_release=$(readlink -f /srv/auth-foundation-candidate/current)
candidate_ca=/var/lib/auth-foundation-candidate/runtime/tls/ca.crt
stable_ca=/var/lib/auth-foundation-staging/runtime/tls/ca.crt
test "$(docker inspect "$container" --format '{{index .Config.Labels "com.docker.compose.project"}}')" = auth-foundation-candidate

unpause(){ docker unpause "$container" >/dev/null 2>&1 || true; }
trap unpause EXIT
docker pause "$container" >/dev/null
started=$(date +%s%3N)
set +e
failure=$(timeout 8s runuser -u auth-stage -- env NODE_EXTRA_CA_CERTS="$candidate_ca" \
  "$candidate_release/runtime-node" "$candidate_release/scripts/service.mjs" 2>&1)
failure_code=$?
set -e
elapsed_ms=$(($(date +%s%3N)-started))
test "$failure_code" -ne 0
test "$elapsed_ms" -lt 7000
echo "fault=keycloak-paused"
echo "failure_code=$failure_code"
echo "failure_elapsed_ms=$elapsed_ms"
echo "$failure" | tail -8
unpause
trap - EXIT

for _ in $(seq 1 60); do
  if curl --silent --show-error --fail --cacert "$candidate_ca" \
    https://localhost:28443/realms/auth-https/.well-known/openid-configuration >/dev/null; then
    break
  fi
  sleep 1
done
echo RECOVERED_SERVICE_AUTHORIZATION
runuser -u auth-stage -- env NODE_EXTRA_CA_CERTS="$candidate_ca" \
  "$candidate_release/runtime-node" "$candidate_release/scripts/service.mjs"
echo STABLE_AFTER_FAULT
curl --silent --show-error --fail --cacert "$stable_ca" https://localhost:13443/health
echo
echo "candidate_service=$(systemctl is-active auth-foundation-candidate.service)"
echo "stable_service=$(systemctl is-active auth-foundation-staging.service)"
