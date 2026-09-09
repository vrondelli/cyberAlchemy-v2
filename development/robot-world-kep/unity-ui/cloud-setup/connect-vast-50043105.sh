#!/usr/bin/env bash
set -euo pipefail

rw_setup_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
rw_ssh_options=(
  -F /dev/null -p 14007
  -i /home/vrondelli/.ssh/id_ed25519
  -o IdentitiesOnly=yes -o BatchMode=yes
  -o ConnectTimeout=10 -o ConnectionAttempts=1
  -o ForwardAgent=no -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=${rw_setup_dir}/out/vast-50043105.known_hosts"
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3
)

case "${1:-}" in
  --check)
    exec ssh "${rw_ssh_options[@]}" root@77.54.200.11 \
      'systemctl is-active robot-world-xorg robot-world-desktop robot-world-vnc robot-world-web-desktop && /home/user/Unity/6000.3.23f1/Editor/Unity -version'
    ;;
  '')
    printf '%s\n' 'Open in Chrome or Edge: http://127.0.0.1:16080/vnc.html?autoconnect=true&resize=scale'
    printf '%s\n' 'Keep this terminal open. Ctrl+C closes only this tunnel; the VM keeps running.'
    exec ssh "${rw_ssh_options[@]}" -o ExitOnForwardFailure=yes \
      -L 127.0.0.1:16080:127.0.0.1:6080 -N root@77.54.200.11
    ;;
  *)
    printf '%s\n' 'Usage: connect-vast-50043105.sh [--check]' >&2
    exit 2
    ;;
esac
