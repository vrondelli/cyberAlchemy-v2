#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$ROOT"

failures=0

fail() {
  echo "FAIL: $*" >&2
  failures=$((failures + 1))
}

require_file() {
  if [ ! -f "$1" ]; then
    fail "missing required file: $1"
  fi
}

require_no_python() {
  scope=$1
  if [ -e "$scope" ]; then
    found=$(find "$scope" -name '*.py' -type f -print)
    if [ -n "$found" ]; then
      echo "$found" >&2
      fail "python files are not allowed in $scope"
    fi
  fi
}

require_file "development/invariants/runtime-language-policy.md"
require_file "development/invariants/runtime-language-legacy-allowlist.txt"
require_file "projects/auth-user-management/package.json"
require_file "projects/auth-user-management/tsconfig.json"
require_file "projects/auth-user-management/scripts/validate.sh"
require_file "projects/auth-user-management/src/index.ts"
require_file "projects/body-war/app/package.json"
require_file "projects/body-war/app/server.ts"

require_no_python "projects/auth-user-management/src"
require_no_python "projects/auth-user-management/tests"

if [ -f "projects/body-war/app/server.py" ]; then
  fail "projects/body-war/app/server.py must not be the auth runtime"
fi

if [ -f "projects/body-war/app/test_auth_adapter.py" ]; then
  fail "projects/body-war/app/test_auth_adapter.py must be replaced by TypeScript tests"
fi

if find projects/body-war/app -maxdepth 2 -name '*.py' -type f -print | grep -q .; then
  find projects/body-war/app -maxdepth 2 -name '*.py' -type f -print >&2
  fail "python files are not allowed in the Body War app runtime"
fi

if find projects/auth-user-management/src -name '*.ts' -type f -print | grep -q .; then
  :
else
  fail "auth-user-management must contain TypeScript source"
fi

if [ "$failures" -ne 0 ]; then
  echo "Runtime language policy check failed with $failures failure(s)." >&2
  exit 1
fi

echo "Runtime language policy check passed."
