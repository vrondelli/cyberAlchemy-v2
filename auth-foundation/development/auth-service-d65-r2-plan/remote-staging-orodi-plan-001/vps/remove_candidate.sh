#!/usr/bin/env bash
set -euo pipefail

release_id=${1:?expected candidate release id required}
test -L /srv/auth-foundation-candidate/current
release=$(readlink -f /srv/auth-foundation-candidate/current)
test "$release" = "/srv/auth-foundation-candidate/releases/$release_id"
test "$(cat /var/lib/auth-foundation-candidate/release-id)" = "$release_id"

systemctl disable --now auth-foundation-candidate.service
cd "$release"
usermod --append --groups docker auth-stage
cleanup_docker_group(){ gpasswd --delete auth-stage docker >/dev/null 2>&1 || true; }
trap cleanup_docker_group EXIT
runuser -u auth-stage -- env PATH="$release:$PATH" docker compose --env-file .runtime/compose.env down --volumes
cleanup_docker_group
trap - EXIT
rm -f /etc/systemd/system/auth-foundation-candidate.service
rm -f /srv/auth-foundation-candidate/current
systemctl daemon-reload
test "$(systemctl is-active auth-foundation-staging.service)" = active

