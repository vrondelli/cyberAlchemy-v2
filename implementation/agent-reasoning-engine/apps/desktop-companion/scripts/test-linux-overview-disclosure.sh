#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! -x "$1/bin/are-companion" || ! -x "$1/node/bin/node" ]]; then
  echo "Usage: test-linux-overview-disclosure.sh <extracted-opt/are-companion>" >&2
  exit 2
fi
if [[ -z "${DISPLAY:-}" || -z "${WEBKIT_INSPECTOR_HTTP_SERVER:-}" || -z "${ARE_LINUX_UI_INSPECTOR_SERVER:-}" ]]; then
  echo "An X11 display and test-only local WebKit inspector are required" >&2
  exit 2
fi

package_root=$1
test_home=$(mktemp -d /tmp/are-overview-webkit-XXXXXXXX)
app_pid=
cleanup() {
  result=$?
  if [[ -n "$app_pid" ]]; then
    kill "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  fi
  if [[ "$result" -ne 0 ]]; then
    sed -n '1,80p' "$test_home/app.stderr" >&2 || true
  fi
  rm -r -- "$test_home"
}
trap cleanup EXIT

HOME="$test_home" GDK_BACKEND=x11 WEBKIT_DISABLE_COMPOSITING_MODE=1 \
  "$package_root/bin/are-companion" --dashboard-only >"$test_home/app.stdout" 2>"$test_home/app.stderr" &
app_pid=$!

for _ in $(seq 1 50); do
  if "$package_root/node/bin/node" "$(dirname "$0")/inspect-linux-ui.mjs" \
    --verify-overview-adapter-disclosure >"$test_home/inspector.stdout" 2>"$test_home/inspector.stderr"; then
    sed -n '1p' "$test_home/inspector.stdout"
    "$package_root/node/bin/node" "$(dirname "$0")/inspect-linux-ui.mjs" \
      --verify-dashboard-only
    exit 0
  fi
  if ! kill -0 "$app_pid" 2>/dev/null; then
    echo "Companion exited before the dashboard inspector connected" >&2
    sed -n '1,80p' "$test_home/inspector.stderr" >&2 || true
    exit 1
  fi
  sleep .2
done
echo "Native Overview disclosure did not become ready" >&2
sed -n '1,80p' "$test_home/inspector.stderr" >&2 || true
exit 1
