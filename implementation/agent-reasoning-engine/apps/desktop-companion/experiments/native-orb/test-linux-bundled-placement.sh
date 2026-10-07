#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 || ! -x "$1/bin/are-companion" || ! -x "$1/bin/native-orb/are-native-orb" ||
      ! -x "$1/node/bin/node" || ! -x "$2" || ! -f "${ARE_LINUX_UI_INSPECTOR_SCRIPT:-}" ||
      -z "${ARE_LINUX_UI_INSPECTOR_SERVER:-}" ]]; then
  echo 'Usage: test-linux-bundled-placement.sh <extracted-opt/are-companion> <test-linux-pointer-binary>' >&2
  exit 2
fi
if [[ -n "$(pgrep -x are-native-orb || true)" || -n "$(pgrep -x are-companion || true)" ]]; then
  echo 'Existing ARE Companion process in this PID namespace; refusing an ambiguous probe' >&2
  exit 2
fi

package_root=$1
pointer_helper=$2
dashboard_exe="$package_root/bin/are-companion"
node_exe="$package_root/node/bin/node"
orb_pid=
dashboard_pid=

cleanup() {
  if [[ -n "$orb_pid" ]]; then kill "$orb_pid" 2>/dev/null || true; fi
  if [[ -n "$dashboard_pid" ]]; then kill "$dashboard_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT

process_exited() {
  local state
  state=$(ps -o stat= -p "$1" 2>/dev/null | tr -d ' ' || true)
  [[ -z "$state" || "$state" == Z* ]]
}

wait_orb() {
  local previous=${1:-} found=
  for _ in $(seq 1 80); do
    found=$(pgrep -x are-native-orb | head -1 || true)
    if [[ -n "$found" && "$found" != "$previous" ]]; then printf '%s' "$found"; return 0; fi
    sleep .25
  done
  echo 'Bundled native orb did not appear' >&2
  return 1
}

wait_dashboard() {
  local previous=${1:-} found=
  for _ in $(seq 1 80); do
    found=$(pgrep -x are-companion | head -1 || true)
    if [[ -n "$found" && "$found" != "$previous" &&
          "$(ps -o ppid= -p "$found" | tr -d ' ')" == "$orb_pid" ]]; then
      printf '%s' "$found"
      return 0
    fi
    sleep .25
  done
  echo 'Owned dashboard did not appear' >&2
  return 1
}

position() {
  local line
  line=$("$pointer_helper" --position)
  if [[ ! "$line" =~ ^native-orb-position\ x=(-?[0-9]+)\ y=(-?[0-9]+)\ width=([0-9]+)\ height=([0-9]+)$ ]]; then
    echo "Unexpected native orb geometry: $line" >&2
    return 1
  fi
  printf '%s,%s' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
}

wait_position() {
  local expected=$1 actual=
  for _ in $(seq 1 60); do
    actual=$(position)
    if [[ "$actual" == "$expected" ]]; then return 0; fi
    sleep .1
  done
  echo "Native orb did not restore position $expected; found $actual" >&2
  return 1
}

wait_changed() {
  local previous=$1 actual=
  for _ in $(seq 1 60); do
    actual=$(position)
    if [[ "$actual" != "$previous" ]]; then printf '%s' "$actual"; return 0; fi
    sleep .1
  done
  echo "Native orb did not move from $previous" >&2
  return 1
}

set_placement() {
  "$node_exe" "$ARE_LINUX_UI_INSPECTOR_SCRIPT" --set-native-placement "$1"
}

"$dashboard_exe"
orb_pid=$(wait_orb)
"$pointer_helper" >/dev/null
dashboard_pid=$(wait_dashboard)
set_placement center
center=$(position)
set_placement top-right
top_right=$(wait_changed "$center")
set_placement center
wait_position "$center"

"$pointer_helper" --close-dashboard "$dashboard_pid" >/dev/null
for _ in $(seq 1 40); do
  if process_exited "$dashboard_pid"; then break; fi
  sleep .25
done
if ! process_exited "$dashboard_pid"; then echo 'Dashboard did not close' >&2; exit 1; fi
previous_dashboard=$dashboard_pid
dashboard_pid=
"$pointer_helper" --drag >/dev/null
dragged=$(wait_changed "$center")
"$dashboard_exe"
dashboard_pid=$(wait_dashboard "$previous_dashboard")
wait_position "$center"

kill -TERM "$orb_pid"
for _ in $(seq 1 40); do
  if process_exited "$orb_pid" && process_exited "$dashboard_pid"; then break; fi
  sleep .25
done
if ! process_exited "$orb_pid" || ! process_exited "$dashboard_pid"; then
  echo 'Owned dashboard survived native-orb exit' >&2
  exit 1
fi
previous_orb=$orb_pid
orb_pid=
dashboard_pid=
"$dashboard_exe"
orb_pid=$(wait_orb "$previous_orb")
"$pointer_helper" >/dev/null
dashboard_pid=$(wait_dashboard)
wait_position "$center"

printf '{"schema_version":"are.linux-bundled-native-placement-test/v1","center":"%s","top_right":"%s","dragged":"%s","restored_after_dashboard_reopen":true,"restored_after_orb_restart":true,"owned_dashboard_exited_with_orb":true,"package_installed":false,"authority_effect":"none"}\n' \
  "$center" "$top_right" "$dragged"
