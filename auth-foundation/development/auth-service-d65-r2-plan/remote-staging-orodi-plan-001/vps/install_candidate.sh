#!/usr/bin/env bash
set -euo pipefail

archive=${1:?archive path required}
expected_sha=${2:?archive sha256 required}
release_id=${3:?release id required}
node_binary=/srv/are-luna-pilot/candidates/04384954e710e58f/bin/node
node_sha=19235a9b678f84729464c52623f92de130a165452747c6826d3fdc13df3abcc3
release=/srv/auth-foundation-candidate/releases/${release_id}
state=/var/lib/auth-foundation-candidate/runtime
unit=auth-foundation-candidate.service

test "$(sha256sum "$archive" | awk '{print $1}')" = "$expected_sha"
test -x "$node_binary"
test "$(sha256sum "$node_binary" | awk '{print $1}')" = "$node_sha"
python3 - "$archive" "$release_id" <<'PY'
import json, sys, tarfile
from pathlib import PurePosixPath
archive, expected_release = sys.argv[1:]
with tarfile.open(archive, "r:gz") as bundle:
    members = bundle.getmembers()
    for member in members:
        path = PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts or not (member.isfile() or member.isdir()):
            raise SystemExit(f"unsafe bundle member: {member.name}")
    manifest_member = bundle.extractfile("MANIFEST.json")
    if manifest_member is None:
        raise SystemExit("bundle manifest missing")
    manifest = json.load(manifest_member)
    if manifest.get("schema_version") != "auth.orodi-vps-bundle/v1-candidate":
        raise SystemExit("bundle manifest schema mismatch")
    if manifest.get("release_id") != expected_release:
        raise SystemExit("release id does not match bundle manifest")
PY
test "$(id -u auth-stage)" = 1000
test "$(id -g auth-stage)" = 1000
test ! -e /srv/auth-foundation-candidate
test ! -e /var/lib/auth-foundation-candidate
test ! -e /srv/auth-foundation-candidate/current
test ! -e /etc/systemd/system/$unit
test "$(systemctl is-active auth-foundation-staging.service)" = active
for port in 23443 28443 29443; do
  if ss -lntH "sport = :$port" | grep -q .; then
    echo "candidate loopback port occupied: $port" >&2
    exit 2
  fi
done
if docker ps -a --format '{{.Label "com.docker.compose.project"}}' | grep -Fxq auth-foundation-candidate; then
  echo "candidate Docker project already exists" >&2
  exit 2
fi

install_committed=0
cleanup_failed_install(){
  if test "$install_committed" != 1; then
    systemctl disable --now $unit >/dev/null 2>&1 || true
    if test -d "$release" && test -f "$release/.runtime/compose.env"; then
      cd "$release"
      usermod --append --groups docker auth-stage >/dev/null 2>&1 || true
      runuser -u auth-stage -- env PATH="$release:$PATH" docker compose --env-file .runtime/compose.env down --volumes >/dev/null 2>&1 || true
    fi
    rm -f /etc/systemd/system/$unit
    rm -f /srv/auth-foundation-candidate/current
    rm -rf /srv/auth-foundation-candidate /var/lib/auth-foundation-candidate
    systemctl daemon-reload >/dev/null 2>&1 || true
  fi
  gpasswd --delete auth-stage docker >/dev/null 2>&1 || true
}
trap cleanup_failed_install EXIT
mkdir -p /srv/auth-foundation-candidate/releases /var/lib/auth-foundation-candidate
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

mkdir -p "$state"
cp -a "$release/runtime-seed/." "$state/"
rm -rf "$release/runtime-seed"
ln -s "$state" "$release/.runtime"
chmod 700 "$state"
chmod 700 "$state/auth-prototype-bridge"
chown -R auth-stage:auth-stage /var/lib/auth-foundation-candidate

cd "$release"
usermod --append --groups docker auth-stage
runuser -u auth-stage -- env AUTH_PROFILE=candidate PATH="$release:$PATH" "$release/runtime-node" scripts/setup.mjs >/var/lib/auth-foundation-candidate/setup.log 2>&1
gpasswd --delete auth-stage docker >/dev/null 2>&1 || true
chmod 0770 "$state/socket"

cat >/etc/systemd/system/$unit <<EOF
[Unit]
Description=Auth Foundation isolated VPS candidate
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
ReadWritePaths=/var/lib/auth-foundation-candidate
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now $unit
echo "$release_id" >/var/lib/auth-foundation-candidate/release-id
ln -s "$release" /srv/auth-foundation-candidate/current
install_committed=1
trap - EXIT
