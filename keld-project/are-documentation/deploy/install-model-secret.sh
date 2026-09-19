#!/bin/sh
# Install one dedicated inference credential for the non-root broker.
set -eu

test "$#" -eq 1
test "$(id -u)" = 0
secret=$1
case "$secret" in
  /*) ;;
  *) exit 2 ;;
esac
test -f "$secret"
test ! -L "$secret"
bytes=$(wc -c < "$secret")
test "$bytes" -ge 1
test "$bytes" -le 16384

chown 65532:65532 -- "$secret"
chmod 400 -- "$secret"
test "$(stat -c '%u:%g:%a' -- "$secret")" = "65532:65532:400"
printf '%s\n' '{"ok":true,"owner":"65532:65532","mode":"0400","valuePrinted":false}'
