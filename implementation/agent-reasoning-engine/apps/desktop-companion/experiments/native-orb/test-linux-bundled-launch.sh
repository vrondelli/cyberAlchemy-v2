#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 || ! -x "$1/bin/are-companion" || ! -x "$1/bin/native-orb/are-native-orb" ||
      ( "$2" != --terminate-dashboard && ! -x "$2" ) ]]; then
  echo 'Usage: test-linux-bundled-launch.sh <extracted-opt/are-companion> <test-linux-pointer-binary|--terminate-dashboard>' >&2
  exit 2
fi

package_root=$1
pointer_helper=$2
dashboard_exe="$package_root/bin/are-companion"
orb_pid=
dashboard_pid=
reopened_pid=
dashboard_ui_verified=false
window_close_test=false
icon_click_test=false
icon_drag_test=false
repeat_open_test=false

if [[ -n "$(pgrep -x are-native-orb || true)" || -n "$(pgrep -x are-companion || true)" ]]; then
  echo 'Existing ARE Companion process in this PID namespace; refusing an ambiguous probe' >&2
  exit 2
fi

cleanup() {
  if [[ -n "$orb_pid" ]]; then kill "$orb_pid" 2>/dev/null || true; fi
  if [[ -n "$dashboard_pid" ]]; then kill "$dashboard_pid" 2>/dev/null || true; fi
  if [[ -n "$reopened_pid" ]]; then kill "$reopened_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT

wait_named_pid() {
  local name=$1 pid=
  for _ in $(seq 1 80); do
    pid=$(pgrep -x "$name" | head -1 || true)
    if [[ -n "$pid" ]]; then printf '%s' "$pid"; return 0; fi
    sleep .25
  done
  echo "No $name process appeared" >&2
  return 1
}

process_exited() {
  local pid=$1 state
  if [[ ! -e "/proc/$pid/stat" ]]; then return 0; fi
  state=$(ps -o stat= -p "$pid" 2>/dev/null | tr -d ' ' || true)
  [[ -z "$state" || "$state" == Z* ]]
}

"$dashboard_exe"
orb_pid=$(wait_named_pid are-native-orb)
if [[ -n "$(pgrep -x are-companion || true)" ]]; then
  echo 'No-argument launch opened a dashboard before activation' >&2
  exit 1
fi

if [[ "$pointer_helper" == --terminate-dashboard ]]; then
  "$dashboard_exe"
  repeat_open_test=true
else
  "$pointer_helper" --drag >/dev/null
  icon_drag_test=true
  if [[ -n "$(pgrep -x are-companion || true)" ]]; then
    echo 'Dragging the native orb unexpectedly opened a dashboard' >&2
    exit 1
  fi
  "$pointer_helper" >/dev/null
  icon_click_test=true
fi
dashboard_pid=$(wait_named_pid are-companion)
if [[ "$(ps -o ppid= -p "$dashboard_pid" | tr -d ' ')" != "$orb_pid" ]]; then
  echo 'Dashboard is not owned by the native orb' >&2
  exit 1
fi
if [[ "$icon_click_test" == true ]]; then
  "$dashboard_exe"
  sleep 1
  if [[ "$(pgrep -x are-native-orb | wc -l)" -ne 1 ||
        "$(pgrep -x are-companion | wc -l)" -ne 1 ||
        "$(pgrep -x are-companion | head -1)" != "$dashboard_pid" ]]; then
    echo 'Repeated launcher created a duplicate after the icon click' >&2
    exit 1
  fi
fi
if [[ -n "${ARE_LINUX_UI_INSPECTOR_SCRIPT:-}" ]]; then
  if [[ ! -f "$ARE_LINUX_UI_INSPECTOR_SCRIPT" || ! -x "$package_root/node/bin/node" ]]; then
    echo 'Bundled Node or Linux UI inspector is unavailable' >&2
    exit 2
  fi
  "$package_root/node/bin/node" "$ARE_LINUX_UI_INSPECTOR_SCRIPT" --verify-dashboard-only
  dashboard_ui_verified=true
fi
if [[ "$pointer_helper" == --terminate-dashboard ]]; then
  kill -TERM "$dashboard_pid"
else
  "$pointer_helper" --close-dashboard "$dashboard_pid" >/dev/null
  window_close_test=true
fi
for _ in $(seq 1 40); do
  if process_exited "$dashboard_pid"; then break; fi
  sleep .25
done
if ! process_exited "$dashboard_pid"; then
  echo 'Owned dashboard did not exit after its window close request' >&2
  exit 1
fi
"$dashboard_exe"
for _ in $(seq 1 80); do
  reopened_pid=$(pgrep -x are-companion | head -1 || true)
  if [[ -n "$reopened_pid" && "$reopened_pid" != "$dashboard_pid" ]]; then break; fi
  sleep .25
done
if [[ -z "$reopened_pid" || "$reopened_pid" == "$dashboard_pid" ]]; then
  echo 'Repeated launcher did not reopen the closed dashboard' >&2
  exit 1
fi
if [[ "$(ps -o ppid= -p "$reopened_pid" | tr -d ' ')" != "$orb_pid" ]]; then
  echo 'Reopened dashboard is not owned by the native orb' >&2
  exit 1
fi

"$dashboard_exe"
sleep 1
if [[ "$(pgrep -x are-native-orb | wc -l)" -ne 1 ||
      "$(pgrep -x are-companion | wc -l)" -ne 1 ||
      "$(pgrep -x are-companion | head -1)" != "$reopened_pid" ]]; then
  echo 'Repeated launcher created a duplicate orb or dashboard' >&2
  exit 1
fi

kill -KILL "$orb_pid"
for _ in $(seq 1 40); do
  if process_exited "$reopened_pid"; then break; fi
  sleep .25
done
if ! process_exited "$reopened_pid"; then
  echo 'Owned dashboard survived abrupt native-orb loss' >&2
  exit 1
fi
orb_pid=
dashboard_pid=
reopened_pid=
printf '{"schema_version":"are.linux-bundled-native-orb-test/v1","launcher_opened_orb":true,"native_icon_moved_by_x11_drag":%s,"dashboard_opened_by_icon_click":%s,"dashboard_opened_by_repeated_launcher":%s,"dashboard_owned_by_orb":true,"dashboard_ui_verified":%s,"dashboard_reopened_after_exit":true,"dashboard_reopened_after_window_close":%s,"duplicate_orb_and_dashboard_prevented":true,"abrupt_orb_loss_exited_owned_dashboard":true,"authority_effect":"none"}\n' "$icon_drag_test" "$icon_click_test" "$repeat_open_test" "$dashboard_ui_verified" "$window_close_test"
