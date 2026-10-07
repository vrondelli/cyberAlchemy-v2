#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 || ! -x "$1/bin/are-companion" || ! -x "$1/node/bin/node" || ! -x "$3" ]]; then
  echo "Usage: test-linux-evolution-narrow.sh <extracted-opt/are-companion> <registry|verified|verified-rebuild|verified-multi> <x11-resize-helper>" >&2
  exit 2
fi
if [[ "$2" != registry && "$2" != verified && "$2" != verified-rebuild && "$2" != verified-multi ]]; then
  echo "Expectation must be registry, verified, verified-rebuild, or verified-multi" >&2
  exit 2
fi
if [[ "$2" != registry && ! -d "${ARE_COMPANION_EVOLUTION_ROOT:-}" ]]; then
  echo "Verified probe requires an existing disposable ARE_COMPANION_EVOLUTION_ROOT" >&2
  exit 2
fi
if [[ "${ARE_VERIFY_NAVIGATION_RESIZE:-0}" == 1 && "${ARE_VERIFY_NAVIGATION:-0}" == 1 ]]; then
  echo "Run narrow scrolling and wide-to-narrow navigation checks in separate sessions" >&2
  exit 2
fi
if [[ -z "${DISPLAY:-}" || -z "${WEBKIT_INSPECTOR_HTTP_SERVER:-}" || -z "${ARE_LINUX_UI_INSPECTOR_SERVER:-}" ]]; then
  echo "An X11 display and test-only local WebKit inspector are required" >&2
  exit 2
fi

package_root=$1
expectation=$2
resize_helper=$3
node="$package_root/node/bin/node"
inspector="$(dirname "$0")/inspect-linux-ui.mjs"
test_home=$(mktemp -d "${HOME}/are-evolution-narrow-XXXXXXXX")
app_pid=
cleanup() {
  result=$?
  if [[ -n "$app_pid" ]]; then
    kill "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  fi
  if [[ "$result" -ne 0 ]]; then
    echo "Narrow UI probe failed; isolated logs retained at $test_home" >&2
    sed -n '1,80p' "$test_home/app.stderr" >&2 || true
  fi
}
trap cleanup EXIT

HOME="$test_home" "$package_root/bin/are-companion" --dashboard-only >"$test_home/app.stdout" 2>"$test_home/app.stderr" &
app_pid=$!
metrics=
for _ in $(seq 1 50); do
  if metrics=$("$node" "$inspector" --read-dashboard-metrics 2>"$test_home/inspector.stderr"); then break; fi
  if ! kill -0 "$app_pid" 2>/dev/null; then
    echo "Companion exited before the dashboard inspector connected" >&2
    exit 1
  fi
  sleep .2
done
if [[ -z "$metrics" ]]; then
  echo "Dashboard inspector did not become ready" >&2
  sed -n '1,80p' "$test_home/inspector.stderr" >&2 || true
  exit 1
fi

"$node" "$inspector" --verify-dashboard-only
if [[ "${ARE_VERIFY_NAVIGATION_RESIZE:-0}" == 1 ]]; then
  "$node" "$inspector" --prepare-navigation-resize
fi

physical_width=$("$node" -e 'const x=JSON.parse(process.argv[1]); process.stdout.write(String(Math.round(340*x.devicePixelRatio)))' "$metrics")
physical_height=$("$node" -e 'const x=JSON.parse(process.argv[1]); process.stdout.write(String(Math.round(740*x.devicePixelRatio)))' "$metrics")
"$resize_helper" --resize-dashboard "$app_pid" "$physical_width" "$physical_height"
if [[ "${ARE_VERIFY_NAVIGATION_RESIZE:-0}" == 1 ]]; then
  "$node" "$inspector" --verify-navigation-resize
fi
if [[ "${ARE_VERIFY_NAVIGATION:-0}" == 1 ]]; then
  "$node" "$inspector" --verify-navigation-narrow
fi
"$node" "$inspector" --verify-evolution-narrow "$expectation"
if [[ "${ARE_VERIFY_EVOLUTION_PHASE:-0}" == 1 ]]; then
  if [[ "$expectation" != verified ]]; then
    echo "Phase probe requires the verified coordination fixture" >&2
    exit 2
  fi
  "$node" "$inspector" --verify-evolution-phase
fi
if [[ "$expectation" == verified-multi ]]; then
  "$node" "$inspector" --verify-evolution-filter
fi
if [[ -n "${ARE_LINUX_UI_CAPTURE_PATH:-}" ]]; then
  "$resize_helper" --capture-dashboard "$app_pid" "$ARE_LINUX_UI_CAPTURE_PATH"
fi
printf '{"schema_version":"are.companion-linux-evolution-narrow/v1","expectation":"%s","initial_metrics":%s,"x11_requested_width":%s,"x11_requested_height":%s,"authority_effect":"none"}\n' \
  "$expectation" "$metrics" "$physical_width" "$physical_height"
