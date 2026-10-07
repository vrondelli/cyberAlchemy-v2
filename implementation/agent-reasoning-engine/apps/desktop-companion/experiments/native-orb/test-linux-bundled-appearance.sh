#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 || ! -x "$1/bin/are-companion" || ! -x "$1/bin/native-orb/are-native-orb" ||
      ! -x "$1/node/bin/node" || ( "$2" != --x11-pointer && "$2" != --launcher-activate ) ||
      ( "$2" == --x11-pointer && ! -x "$3" ) || ! -f "${ARE_LINUX_UI_INSPECTOR_SCRIPT:-}" ]]; then
  echo 'Usage: test-linux-bundled-appearance.sh <extracted-opt/are-companion> <--x11-pointer|--launcher-activate> <pointer-helper|unused>' >&2
  exit 2
fi

package_root=$1
activation=$2
pointer_helper=$3
dashboard_exe="$package_root/bin/are-companion"
orb_exe="$package_root/bin/native-orb/are-native-orb"
node_exe="$package_root/node/bin/node"
orb_pid=
dashboard_pid=
orb_log=

if [[ -n "$(pgrep -x are-native-orb || true)" || -n "$(pgrep -x are-companion || true)" ]]; then
  echo 'Existing ARE Companion process in this PID namespace; refusing an ambiguous probe' >&2
  exit 2
fi
orb_log=$(mktemp /tmp/are-native-appearance-orb-XXXXXX.log)

cleanup() {
  if [[ -n "$orb_pid" ]]; then kill "$orb_pid" 2>/dev/null || true; fi
  if [[ -n "$dashboard_pid" ]]; then kill "$dashboard_pid" 2>/dev/null || true; fi
  rm -f -- "$orb_log"
}
trap cleanup EXIT

wait_dashboard() {
  local previous=${1:-} found=
  for _ in $(seq 1 80); do
    found=$(pgrep -x are-companion | head -1 || true)
    if [[ -n "$found" && "$found" != "$previous" ]]; then
      if [[ "$(ps -o ppid= -p "$found" | tr -d ' ')" == "$orb_pid" ]]; then
        printf '%s' "$found"
        return 0
      fi
    fi
    sleep .25
  done
  echo 'Owned dashboard did not appear' >&2
  return 1
}

wait_skin_line() {
  local skin=$1 count=$2
  for _ in $(seq 1 80); do
    if [[ "$(grep -Fc "ARE_NATIVE_ORB_SKIN_CHANGED $skin" "$orb_log" || true)" -ge "$count" ]]; then
      return 0
    fi
    sleep .1
  done
  echo "Native orb did not apply $skin skin $count time(s)" >&2
  return 1
}

wait_dashboard_exit() {
  local pid=$1 state=
  for _ in $(seq 1 40); do
    state=$(ps -o stat= -p "$pid" 2>/dev/null | tr -d ' ' || true)
    if [[ -z "$state" || "$state" == Z* ]]; then return 0; fi
    sleep .25
  done
  echo 'Owned dashboard did not exit' >&2
  return 1
}

start_orb() {
  : > "$orb_log"
  "$orb_exe" --dashboard "$dashboard_exe" > "$orb_log" 2>&1 &
  orb_pid=$!
  for _ in $(seq 1 80); do
    if kill -0 "$orb_pid" 2>/dev/null; then return 0; fi
    sleep .1
  done
  echo 'Native orb did not start' >&2
  return 1
}

activate_dashboard() {
  if [[ "$activation" == --x11-pointer ]]; then
    "$pointer_helper" >/dev/null
  else
    "$dashboard_exe"
  fi
}

inspect() {
  "$node_exe" "$ARE_LINUX_UI_INSPECTOR_SCRIPT" "$1" "$2"
}

start_orb
if [[ "$activation" == --x11-pointer ]]; then
  "$pointer_helper" --assert-skin verdant >/dev/null
fi
activate_dashboard
dashboard_pid=$(wait_dashboard)
wait_skin_line verdant 1

inspect --set-skin ember
wait_skin_line ember 1
if [[ "$activation" == --x11-pointer ]]; then
  "$pointer_helper" --assert-skin ember >/dev/null
fi

inspect --set-skin cobalt
wait_skin_line cobalt 1
if [[ "$activation" == --x11-pointer ]]; then
  "$pointer_helper" --assert-skin cobalt >/dev/null
  "$pointer_helper" --close-dashboard "$dashboard_pid" >/dev/null
else
  kill -TERM "$dashboard_pid"
fi
wait_dashboard_exit "$dashboard_pid"
previous_dashboard=$dashboard_pid
dashboard_pid=

"$dashboard_exe"
dashboard_pid=$(wait_dashboard "$previous_dashboard")
wait_skin_line cobalt 2
inspect --verify-skin cobalt
if [[ "$activation" == --x11-pointer ]]; then
  "$pointer_helper" --assert-skin cobalt >/dev/null
  "$pointer_helper" --close-dashboard "$dashboard_pid" >/dev/null
else
  kill -TERM "$dashboard_pid"
fi
wait_dashboard_exit "$dashboard_pid"
dashboard_pid=

kill -TERM "$orb_pid"
wait "$orb_pid" 2>/dev/null || true
orb_pid=
start_orb
"$dashboard_exe"
dashboard_pid=$(wait_dashboard)
wait_skin_line cobalt 1
inspect --verify-skin cobalt
if [[ "$activation" == --x11-pointer ]]; then
  "$pointer_helper" --assert-skin cobalt >/dev/null
fi

printf '{"schema_version":"are.linux-bundled-native-appearance-test/v1","renderer":"WebKitGTK","native_orb_skin_changed":true,"x11_pixel_color_verified":%s,"skin_persisted_after_dashboard_reopen":true,"skin_persisted_after_orb_restart":true,"authority_effect":"none"}\n' "$([[ "$activation" == --x11-pointer ]] && printf true || printf false)"
