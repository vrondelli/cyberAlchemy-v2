#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! -x "$1/bin/are-companion" ]]; then
  echo "Usage: test-linux-ui.sh <extracted-opt/are-companion>" >&2
  exit 2
fi
for command in xdpyinfo xdotool setpriv; do
  command -v "$command" >/dev/null || { echo "Missing test dependency: $command" >&2; exit 2; }
done
if [[ "${ARE_LINUX_UI_USE_EXISTING_DISPLAY:-0}" != 1 ]]; then
  command -v Xvfb >/dev/null || { echo "Missing test dependency: Xvfb" >&2; exit 2; }
fi

package_root=$1
native_orb="$package_root/bin/native-orb/are-native-orb"
native_orb_bundled=false
if [[ -x "$native_orb" ]]; then native_orb_bundled=true; fi
test_home=$(mktemp -d /tmp/are-companion-linux-ui-XXXXXX)
chown 1000:1000 "$test_home"
xvfb_pid=
wm_pid=
test_ok=false
if [[ "${ARE_LINUX_UI_USE_EXISTING_DISPLAY:-0}" != 1 ]]; then
  Xvfb -screen 0 1280x800x24 -ac -nolisten tcp -displayfd 3 3>"$test_home/display.number" >"$test_home/xvfb.stdout" 2>"$test_home/xvfb.stderr" &
  xvfb_pid=$!
  for _ in $(seq 1 30); do
    if [[ -s "$test_home/display.number" ]]; then break; fi
    if ! kill -0 "$xvfb_pid" 2>/dev/null; then
      echo "Xvfb exited before allocating a display" >&2
      sed -n '1,80p' "$test_home/xvfb.stderr" >&2
      exit 1
    fi
    sleep .1
  done
  if [[ ! -s "$test_home/display.number" ]]; then
    echo "Xvfb did not allocate a display" >&2
    exit 1
  fi
  export DISPLAY=":$(tr -d '\r\n' <"$test_home/display.number")"
fi
app_pid=
cleanup() {
  if [[ -n "$app_pid" ]]; then kill "$app_pid" 2>/dev/null || true; fi
  if [[ -n "$wm_pid" ]]; then kill "$wm_pid" 2>/dev/null || true; fi
  if [[ -n "$xvfb_pid" ]]; then kill "$xvfb_pid" 2>/dev/null || true; fi
  if [[ "$test_ok" == true && "$test_home" == /tmp/are-companion-linux-ui-* ]]; then
    rm -r -- "$test_home"
  elif [[ "$test_ok" != true ]]; then
    echo "UI probe diagnostics retained: $test_home" >&2
  fi
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if xdpyinfo >/dev/null 2>&1; then break; fi
  sleep .2
done
xdpyinfo >/dev/null
if [[ "${ARE_LINUX_UI_USE_EXISTING_DISPLAY:-0}" != 1 ]] && command -v openbox >/dev/null; then
  setpriv --reuid 1000 --regid 1000 --clear-groups -- env HOME="$test_home" DISPLAY="$DISPLAY" openbox >"$test_home/openbox.stdout" 2>"$test_home/openbox.stderr" &
  wm_pid=$!
  sleep .5
  if ! kill -0 "$wm_pid" 2>/dev/null; then
    echo "Openbox exited before the UI probe" >&2
    sed -n '1,80p' "$test_home/openbox.stderr" >&2
    exit 1
  fi
fi
if [[ "${ARE_LINUX_UI_USE_EXISTING_DISPLAY:-0}" == 1 ]] &&
  [[ -n "$(xdotool search --onlyvisible --name 'ARE Companion' 2>/dev/null || true)" ]]; then
  echo "Existing ARE Companion window on the shared display; refusing an ambiguous UI probe" >&2
  exit 2
fi
app_command=("$package_root/bin/are-companion")
orb_title='ARE Companion'
if [[ "$native_orb_bundled" == true ]]; then
  app_command=("$native_orb" --dashboard "$package_root/bin/are-companion")
  orb_title='ARE Companion native orb experiment'
fi
setpriv --reuid 1000 --regid 1000 --clear-groups -- env HOME="$test_home" DISPLAY="$DISPLAY" XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-}" WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-}" GDK_BACKEND=x11 SLINT_BACKEND=winit-x11 WEBKIT_DISABLE_COMPOSITING_MODE=1 WEBKIT_INSPECTOR_HTTP_SERVER="${ARE_LINUX_UI_INSPECTOR_SERVER:-}" "${app_command[@]}" >"$test_home/app.stdout" 2>"$test_home/app.stderr" &
app_pid=$!

orb_id=
for _ in $(seq 1 40); do
  orb_id=$(xdotool search --onlyvisible --name "$orb_title" 2>/dev/null | head -1 || true)
  if [[ -n "$orb_id" ]]; then break; fi
  if ! kill -0 "$app_pid" 2>/dev/null; then
    echo "Companion exited before the floating mark appeared" >&2
    sed -n '1,80p' "$test_home/app.stderr" >&2
    exit 1
  fi
  sleep .25
done
if [[ -z "$orb_id" ]]; then
  echo "Floating mark did not appear" >&2
  sed -n '1,80p' "$test_home/app.stderr" >&2
  exit 1
fi
if [[ "$(xdotool getwindowpid "$orb_id" 2>/dev/null || true)" != "$app_pid" ]]; then
  echo "Floating mark is not owned by this exact test process" >&2
  exit 1
fi
orb_geometry=$(xdotool getwindowgeometry --shell "$orb_id")
orb_width=$(printf '%s\n' "$orb_geometry" | sed -n 's/^WIDTH=//p')
orb_height=$(printf '%s\n' "$orb_geometry" | sed -n 's/^HEIGHT=//p')
if [[ -n "${ARE_LINUX_UI_INSPECTOR_SERVER:-}" && "$native_orb_bundled" == false ]]; then
  "$package_root/node/bin/node" "$(dirname "$0")/inspect-linux-ui.mjs" --verify-orb >/dev/null
else
  sleep 1
fi
if [[ -n "${ARE_LINUX_UI_SCREENSHOT_DIR:-}" ]] && command -v xwd >/dev/null; then
  xwd -silent -id "$orb_id" -out "$ARE_LINUX_UI_SCREENSHOT_DIR/orb.xwd"
  if command -v convert >/dev/null; then
    convert "$ARE_LINUX_UI_SCREENSHOT_DIR/orb.xwd" "$ARE_LINUX_UI_SCREENSHOT_DIR/orb.png"
  fi
fi
if [[ "$native_orb_bundled" == true ]]; then
  orb_click_x=$((orb_width / 2))
  orb_click_y=$((orb_height / 2))
else
  # WSLg may scale the WebView window while its clickable surface remains
  # within the original 84 logical coordinates.
  orb_click_x=42
  orb_click_y=42
fi
orb_dragged=false
if [[ "$native_orb_bundled" == true ]]; then
  before_drag=$(xdotool getwindowgeometry --shell "$orb_id")
  xdotool mousemove --window "$orb_id" "$orb_click_x" "$orb_click_y"
  sleep .1
  xdotool mousedown 1
  sleep .1
  for _ in $(seq 1 8); do
    xdotool mousemove_relative 15 10
    sleep .1
  done
  xdotool mouseup 1
  sleep .2
  after_drag=$(xdotool getwindowgeometry --shell "$orb_id")
  before_x=$(printf '%s\n' "$before_drag" | sed -n 's/^X=//p')
  before_y=$(printf '%s\n' "$before_drag" | sed -n 's/^Y=//p')
  after_x=$(printf '%s\n' "$after_drag" | sed -n 's/^X=//p')
  after_y=$(printf '%s\n' "$after_drag" | sed -n 's/^Y=//p')
  if [[ "$before_x" == "$after_x" && "$before_y" == "$after_y" ]]; then
    echo "Native orb did not move after X11 pointer drag: before=$before_x,$before_y after=$after_x,$after_y" >&2
    xdotool getmouselocation --shell >&2 || true
    sed -n '1,40p' "$test_home/app.stdout" >&2
    exit 1
  fi
  orb_dragged=true
fi
xdotool mousemove --window "$orb_id" "$orb_click_x" "$orb_click_y" click 1
input_method=x11-synthetic
content_verified=false

dashboard_id=
for _ in $(seq 1 40); do
  dashboard_id=$(xdotool search --onlyvisible --name 'ARE.*Observatory' 2>/dev/null | head -1 || true)
  if [[ -n "$dashboard_id" ]]; then break; fi
  sleep .25
done
if [[ -z "$dashboard_id" && "$native_orb_bundled" == false ]]; then
  if [[ -n "${ARE_LINUX_UI_INSPECTOR_SERVER:-}" ]]; then
    "$package_root/node/bin/node" "$(dirname "$0")/inspect-linux-ui.mjs" --open-and-verify
    input_method=renderer-inspector
    content_verified=true
    for _ in $(seq 1 40); do
      dashboard_id=$(xdotool search --onlyvisible --name 'ARE.*Observatory' 2>/dev/null | head -1 || true)
      if [[ -n "$dashboard_id" ]]; then break; fi
      sleep .25
    done
  fi
fi
if [[ -z "$dashboard_id" ]]; then
  echo "Dashboard did not open after clicking the floating mark" >&2
  if [[ -n "${ARE_LINUX_UI_SCREENSHOT_DIR:-}" ]] && command -v xwd >/dev/null; then
    xwd -silent -id "$orb_id" -out "$ARE_LINUX_UI_SCREENSHOT_DIR/after-click.xwd"
    if command -v convert >/dev/null; then
      convert "$ARE_LINUX_UI_SCREENSHOT_DIR/after-click.xwd" "$ARE_LINUX_UI_SCREENSHOT_DIR/after-click.png"
    fi
  fi
  xdotool getwindowgeometry "$orb_id" >&2 || true
  echo "Visible X11 windows:" >&2
  xdotool search --onlyvisible --name '.' 2>/dev/null | while read -r window_id; do xdotool getwindowname "$window_id" 2>/dev/null || true; done >&2
  sed -n '1,80p' "$test_home/app.stderr" >&2
  exit 1
fi
dashboard_pid=$(xdotool getwindowpid "$dashboard_id" 2>/dev/null || true)
if [[ "$native_orb_bundled" == true ]]; then
  dashboard_parent=$(ps -o ppid= -p "$dashboard_pid" 2>/dev/null | tr -d ' ' || true)
  if [[ "$dashboard_parent" != "$app_pid" ]] ||
    ! grep -Fq "ARE_NATIVE_ORB_DASHBOARD_STARTED pid=$dashboard_pid" "$test_home/app.stdout"; then
    echo "Dashboard is not the bundled child owned by this native orb: orb_pid=$app_pid dashboard_pid=$dashboard_pid parent=$dashboard_parent" >&2
    exit 1
  fi
elif [[ "$dashboard_pid" != "$app_pid" ]]; then
  echo "Dashboard is not owned by this exact test process" >&2
  exit 1
fi

geometry=$(xdotool getwindowgeometry --shell "$dashboard_id")
width=$(printf '%s\n' "$geometry" | sed -n 's/^WIDTH=//p')
height=$(printf '%s\n' "$geometry" | sed -n 's/^HEIGHT=//p')
if [[ "$width" -lt 600 || "$height" -lt 400 ]]; then
  echo "Dashboard window was too small: ${width}x${height}" >&2
  exit 1
fi
if [[ -n "${ARE_LINUX_UI_INSPECTOR_SERVER:-}" && "$content_verified" == false ]]; then
  dashboard_probe=--verify-dashboard
  if [[ "$native_orb_bundled" == true ]]; then dashboard_probe=--verify-standalone-dashboard; fi
  "$package_root/node/bin/node" "$(dirname "$0")/inspect-linux-ui.mjs" "$dashboard_probe"
  content_verified=true
fi
if [[ -n "${ARE_LINUX_UI_SCREENSHOT_DIR:-}" ]] && command -v xwd >/dev/null; then
  xwd -silent -id "$dashboard_id" -out "$ARE_LINUX_UI_SCREENSHOT_DIR/dashboard.xwd"
  if command -v convert >/dev/null; then
    convert "$ARE_LINUX_UI_SCREENSHOT_DIR/dashboard.xwd" "$ARE_LINUX_UI_SCREENSHOT_DIR/dashboard.png"
  fi
fi
printf '{"schema_version":"are.companion-linux-ui-smoke/v1","ok":true,"orb_window":true,"orb_kind":"%s","orb_window_width":%s,"orb_window_height":%s,"orb_click_x":%s,"orb_click_y":%s,"orb_dragged":%s,"dashboard_window":true,"dashboard_owned_by_orb":%s,"dashboard_width":%s,"dashboard_height":%s,"input_method":"%s","content_verified":%s,"authority_effect":"none"}\n' \
  "$(if [[ "$native_orb_bundled" == true ]]; then printf native; else printf webview; fi)" "$orb_width" "$orb_height" "$orb_click_x" "$orb_click_y" "$orb_dragged" "$native_orb_bundled" "$width" "$height" "$input_method" "$content_verified"
test_ok=true
