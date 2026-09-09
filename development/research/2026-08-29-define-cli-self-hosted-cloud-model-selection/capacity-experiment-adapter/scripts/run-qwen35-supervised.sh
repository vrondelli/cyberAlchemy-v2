#!/usr/bin/env bash
set -u -o pipefail

EXPERIMENT_ROOT="${EXPERIMENT_ROOT:-/workspace/define-capacity}"
MODEL_ROOT="${MODEL_ROOT:-/workspace/models/Qwen__Qwen3.5-35B-A3B-FP8}"
STATUS_FILE="$EXPERIMENT_ROOT/experiment.status"
BOOTSTRAP_LOG="$EXPERIMENT_ROOT/bootstrap-qwen35-fp8-resume.log"
BENCHMARK_LOG="$EXPERIMENT_ROOT/benchmark-qwen35-fp8.log"

write_status() {
  local phase="$1" state="$2" exit_code="${3:-}"
  local temporary="$STATUS_FILE.tmp.$$"
  if [[ -n "$exit_code" ]]; then
    printf 'phase=%s status=%s exit=%s timestamp=%s\n' \
      "$phase" "$state" "$exit_code" "$(date -u +%FT%TZ)" >"$temporary"
  else
    printf 'phase=%s status=%s timestamp=%s\n' \
      "$phase" "$state" "$(date -u +%FT%TZ)" >"$temporary"
  fi
  mv "$temporary" "$STATUS_FILE"
}

on_signal() {
  write_status supervisor interrupted 130
  exit 130
}
trap on_signal INT TERM

write_status bootstrap running
if "$EXPERIMENT_ROOT/bootstrap-qwen35-fp8.sh" >>"$BOOTSTRAP_LOG" 2>&1; then
  write_status bootstrap complete
else
  exit_code=$?
  write_status bootstrap failed "$exit_code"
  exit "$exit_code"
fi

environment_file="$MODEL_ROOT/experiment.env"
if [[ ! -s "$environment_file" ]]; then
  write_status bootstrap missing_environment 2
  exit 2
fi
# shellcheck disable=SC1090
source "$environment_file"

write_status benchmark running
if OUTPUT_ROOT="$EXPERIMENT_ROOT/raw-qwen35-fp8" \
  RUN_PREFIX_CACHE=0 \
  "$EXPERIMENT_ROOT/run-vllm-32k.sh" >>"$BENCHMARK_LOG" 2>&1; then
  write_status benchmark complete
else
  exit_code=$?
  write_status benchmark failed "$exit_code"
  exit "$exit_code"
fi
