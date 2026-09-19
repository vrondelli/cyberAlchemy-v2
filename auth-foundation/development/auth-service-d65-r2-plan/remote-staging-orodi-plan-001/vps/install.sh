#!/usr/bin/env bash
set -euo pipefail

archive=${1:?archive path required}
expected_sha=${2:?archive sha256 required}
release_id=${3:?release id required}
node_binary=/srv/are-luna-pilot/candidates/04384954e710e58f/bin/node
node_sha=19235a9b678f84729464c52623f92de130a165452747c6826d3fdc13df3abcc3
release=/srv/auth-foundation-staging/releases/${release_id}
state=/var/lib/auth-foundation-staging/runtime

test "$(sha256sum "$archive" | awk '{print $1}')" = "$expected_sha"
test -x "$node_binary"
test "$(sha256sum "$node_binary" | awk '{print $1}')" = "$node_sha"
test ! -e "$release"
for port in 13443 18443 19443; do
  if ss -lntH "sport = :$port" | grep -q .; then
    echo "required loopback port occupied: $port" >&2
    exit 2
  fi
done

mkdir -p /srv/auth-foundation-staging/releases /var/lib/auth-foundation-staging
mkdir "$release"
tar -xzf "$archive" -C "$release" --no-same-owner --no-same-permissions
install -m 0755 "$node_binary" "$release/runtime-node"

python3 - "$release" <<'PY'
import hashlib, json, sys
from pathlib import Path
root=Path(sys.argv[1])
manifest=json.loads((root/'MANIFEST.json').read_text())
for item in manifest['files']:
    path=root/item['path']
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:
        raise SystemExit(f"bundle verification failed: {item['path']}")
PY

if ! id auth-stage >/dev/null 2>&1; then
  test -z "$(getent passwd 1000 || true)"
  test -z "$(getent group 1000 || true)"
  groupadd --system --gid 1000 auth-stage
  useradd --system --uid 1000 --gid 1000 --home-dir /var/lib/auth-foundation-staging --shell /usr/sbin/nologin auth-stage
fi
test "$(id -u auth-stage)" = 1000
test "$(id -g auth-stage)" = 1000
mkdir -p "$state"
cp -a "$release/runtime-seed/." "$state/"
rm -rf "$release/runtime-seed"
ln -s "$state" "$release/.runtime"
chmod 700 "$state"
chmod 700 "$state/auth-prototype-bridge"
chown -R auth-stage:auth-stage /var/lib/auth-foundation-staging

cd "$release"
usermod --append --groups docker auth-stage
cleanup_docker_group(){ gpasswd --delete auth-stage docker >/dev/null 2>&1 || true; }
trap cleanup_docker_group EXIT
runuser -u auth-stage -- env PATH="$release:$PATH" "$release/runtime-node" scripts/setup.mjs >/var/lib/auth-foundation-staging/setup.log 2>&1
cleanup_docker_group
trap - EXIT
chmod 0770 "$state/socket"

cat >/etc/systemd/system/auth-foundation-staging.service <<EOF
[Unit]
Description=Auth Foundation isolated VPS staging rehearsal
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=simple
User=auth-stage
Group=auth-stage
WorkingDirectory=$release
Environment=NODE_EXTRA_CA_CERTS=$state/tls/ca.crt
ExecStart=$release/runtime-node src/server.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/auth-foundation-staging
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now auth-foundation-staging.service
ln -s "$release" /srv/auth-foundation-staging/current
echo "$release_id" >/var/lib/auth-foundation-staging/release-id
