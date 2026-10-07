#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! -x "$1/bin/are-companion" || -z "${ARE_LINUX_UI_INSPECTOR_SERVER:-}" ]]; then
  echo "Usage: ARE_LINUX_UI_INSPECTOR_SERVER=127.0.0.1:PORT test-linux-placement.sh <extracted-opt/are-companion>" >&2
  exit 2
fi
for command in xdpyinfo xdotool; do
  command -v "$command" >/dev/null || { echo "Missing test dependency: $command" >&2; exit 2; }
done
if [[ "$(id -u)" == 0 ]]; then
  echo "Run this isolated UI probe as a non-root test user" >&2
  exit 2
fi
xdpyinfo >/dev/null
if [[ -n "$(xdotool search --onlyvisible --name 'ARE Companion' 2>/dev/null || true)" ]]; then
  echo "Existing ARE Companion window on the shared display; refusing an ambiguous placement probe" >&2
  exit 2
fi

package_root=$1
test_home=$(mktemp -d /tmp/are-companion-placement-XXXXXX)
app_pid=
orb_id=
cleanup() {
  if [[ -n "$app_pid" ]]; then kill "$app_pid" 2>/dev/null || true; fi
  if [[ "$test_home" == /tmp/are-companion-placement-* ]]; then rm -r -- "$test_home"; fi
}
trap cleanup EXIT

start_app() {
  env \
    ARE_COMPANION_PREFERENCES_PATH="$test_home/companion.json" \
    DISPLAY="$DISPLAY" XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-}" \
    GDK_BACKEND=x11 WEBKIT_DISABLE_COMPOSITING_MODE=1 \
    WEBKIT_INSPECTOR_HTTP_SERVER="$ARE_LINUX_UI_INSPECTOR_SERVER" \
    "$package_root/bin/are-companion" >>"$test_home/app.stdout" 2>>"$test_home/app.stderr" &
  app_pid=$!
  orb_id=
  for _ in $(seq 1 60); do
    orb_id=$(xdotool search --onlyvisible --name 'ARE Companion' 2>/dev/null | head -1 || true)
    if [[ -n "$orb_id" && "$(xdotool getwindowpid "$orb_id" 2>/dev/null || true)" == "$app_pid" ]]; then
      if "$package_root/node/bin/node" "$(dirname "$0")/inspect-linux-ui.mjs" --verify-orb >/dev/null 2>&1; then
        sleep .2
        return 0
      fi
    fi
    if ! kill -0 "$app_pid" 2>/dev/null; then
      echo "Companion exited during placement probe" >&2
      sed -n '1,80p' "$test_home/app.stderr" >&2
      exit 1
    fi
    sleep .1
  done
  echo "Owned orb window did not appear" >&2
  exit 1
}

stop_app() {
  kill "$app_pid"
  wait "$app_pid" || true
  app_pid=
}

position() {
  local geometry x y
  geometry=$(xdotool getwindowgeometry --shell "$orb_id")
  x=$(printf '%s\n' "$geometry" | sed -n 's/^X=//p')
  y=$(printf '%s\n' "$geometry" | sed -n 's/^Y=//p')
  printf '%s,%s' "$x" "$y"
}

wait_position() {
  local expected=$1 current
  for _ in $(seq 1 50); do
    current=$(position)
    if [[ "$current" == "$expected" ]]; then return 0; fi
    sleep .1
  done
  echo "Saved placement did not restore: expected $expected, found $current" >&2
  exit 1
}

set_placement() {
  "$package_root/node/bin/node" "$(dirname "$0")/inspect-linux-ui.mjs" --set-placement "$1"
}

start_app
initial=$(position)
set_placement top-right
top_right=$(position)
if [[ "$top_right" == "$initial" ]]; then
  echo "Top-right placement did not move the orb from $initial" >&2
  exit 1
fi
stop_app
start_app
wait_position "$top_right"
restored_top_right=$(position)

set_placement center
center=$(position)
if [[ "$center" == "$top_right" ]]; then
  echo "Reset to center did not move the orb from $top_right" >&2
  exit 1
fi
stop_app
start_app
wait_position "$center"
restored_center=$(position)

printf '{"schema_version":"are.companion-linux-placement-smoke/v1","ok":true,"initial":"%s","top_right":"%s","restored_top_right":"%s","center":"%s","restored_center":"%s","exact_owned_window":true,"package_installed":false,"authority_effect":"none"}\n' \
  "$initial" "$top_right" "$restored_top_right" "$center" "$restored_center"
