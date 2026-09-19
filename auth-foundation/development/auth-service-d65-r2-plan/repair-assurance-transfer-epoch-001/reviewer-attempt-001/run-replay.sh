#!/usr/bin/env bash
set -uo pipefail

EPOCH=/home/vrondelli/projects/domainspec-core/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001
REVIEW="$EPOCH/reviewer-attempt-001"
IMPL=/home/vrondelli/projects/domainspec-core/projects/auth-foundation/implementation
TOOLBIN=/home/vrondelli/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/bin
BUILDBIN=/home/vrondelli/.cache/auth-completion/build-tools/bin
PYTHON=/usr/bin/python3.14

export PATH="$BUILDBIN:$TOOLBIN:/usr/bin:/bin"
export CC="$BUILDBIN/cc"
export AR="$BUILDBIN/ar"
export RUSTC="$TOOLBIN/rustc"
export RUSTFMT="$TOOLBIN/rustfmt"
export CARGO_HOME=/home/vrondelli/.cargo
export PYTHONDONTWRITEBYTECODE=1

find "$IMPL" -type f \
  ! -path '*/target/*' ! -path '*/__pycache__/*' ! -path '*/.runtime/*' \
  -print0 | sort -z | xargs -0 sha256sum > "$REVIEW/source-before.sha256"

{
  printf 'started_at=%s\n' "$(date --iso-8601=ns)"
  printf 'command=env PATH=%s CC=%s AR=%s RUSTC=%s RUSTFMT=%s CARGO_HOME=%s PYTHONDONTWRITEBYTECODE=1 %s -B %s/mutations.py\n' \
    "$PATH" "$CC" "$AR" "$RUSTC" "$RUSTFMT" "$CARGO_HOME" "$PYTHON" "$EPOCH"
  printf 'python_sha256=%s\n' "$(sha256sum "$PYTHON" | cut -d' ' -f1)"
  printf 'cargo_sha256=%s\n' "$(sha256sum "$TOOLBIN/cargo" | cut -d' ' -f1)"
  printf 'rustc_sha256=%s\n' "$(sha256sum "$RUSTC" | cut -d' ' -f1)"
  printf 'cc_sha256=%s\n' "$(sha256sum "$CC" | cut -d' ' -f1)"
  printf 'ar_sha256=%s\n' "$(sha256sum "$AR" | cut -d' ' -f1)"
  "$PYTHON" --version
  "$TOOLBIN/cargo" --version
  "$RUSTC" --version
} > "$REVIEW/replay-metadata.log" 2>&1

set +e
/usr/bin/time -v -o "$REVIEW/mutation-replay.time.log" \
  "$PYTHON" -B "$EPOCH/mutations.py" \
  > "$REVIEW/mutation-replay.stdout.json" \
  2> "$REVIEW/mutation-replay.stderr.log"
replay_exit=$?
set -e

find "$IMPL" -type f \
  ! -path '*/target/*' ! -path '*/__pycache__/*' ! -path '*/.runtime/*' \
  -print0 | sort -z | xargs -0 sha256sum > "$REVIEW/source-after.sha256"

if cmp -s "$REVIEW/source-before.sha256" "$REVIEW/source-after.sha256"; then
  source_unchanged=true
else
  source_unchanged=false
fi

set +e
(
  cd "$EPOCH"
  /usr/bin/time -v -o "$REVIEW/regression-tests.time.log" \
    "$PYTHON" -B -m unittest discover -v -s . -p 'test_*.py' \
    > "$REVIEW/regression-tests.stdout.log" \
    2> "$REVIEW/regression-tests.stderr.log"
)
regression_exit=$?
set -e

{
  printf 'finished_at=%s\n' "$(date --iso-8601=ns)"
  printf 'mutation_replay_exit_code=%s\n' "$replay_exit"
  printf 'regression_tests_exit_code=%s\n' "$regression_exit"
  printf 'source_unchanged=%s\n' "$source_unchanged"
} >> "$REVIEW/replay-metadata.log"

if [ "$replay_exit" -eq 0 ] && [ "$regression_exit" -eq 0 ] && [ "$source_unchanged" = true ]; then
  exit 0
fi
exit 1
