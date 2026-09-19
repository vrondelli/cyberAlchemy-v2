#!/usr/bin/env bash
set -euo pipefail

ledger_path="${1:-docs/signals/delegation-tuning.jsonl}"
guard_log_path="docs/signals/terminal-guard.jsonl"

if [[ ! -f "$ledger_path" ]]; then
  echo "ledger not found: $ledger_path" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not installed." >&2
  exit 1
fi

watchdog_seconds() {
  case "$1" in
    quick) echo 480 ;;
    standard) echo 900 ;;
    deep) echo 1500 ;;
    *) echo 900 ;;
  esac
}

extract_path="$(mktemp)"
cleanup() {
  rm -f "$extract_path"
}
trap cleanup EXIT

# Select latest unresolved started row per stageRunId as a JSON array.
jq -cs '
  def terminal: .outcome == "completed" or .outcome == "blocked" or .outcome == "failed";
  [
    .[]
    | select(type == "object")
    | select(.stageRunId != null)
  ]
  | sort_by(.stageRunId, .timestamp)
  | group_by(.stageRunId)
  | map(
      . as $rows
      | {
          started: ($rows | map(select(.outcome == "started")) | last),
          terminal: ($rows | map(select(terminal)) | last)
        }
      | select(.started != null and (.terminal == null or .terminal.timestamp < .started.timestamp))
      | .started
    )
' "$ledger_path" >"$extract_path"

reconciled=0
while IFS= read -r started_row; do
  [[ -z "$started_row" ]] && continue

  started_ts="$(jq -r '.timestamp // empty' <<<"$started_row")"
  [[ -z "$started_ts" ]] && continue

  started_epoch="$(date -u -d "$started_ts" +%s 2>/dev/null || echo 0)"
  [[ "$started_epoch" == "0" ]] && continue

  now_epoch="$(date -u +%s)"
  profile="$(jq -r '.delegationProfile // "standard"' <<<"$started_row")"
  max_age="$(watchdog_seconds "$profile")"

  # Keep a 120s grace period to avoid racing active stages.
  if (( now_epoch - started_epoch < max_age + 120 )); then
    continue
  fi

  stage_run_id="$(jq -r '.stageRunId // empty' <<<"$started_row")"
  [[ -z "$stage_run_id" ]] && continue

  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  skill="$(jq -r '.skill // "domainspec-orchestrate"' <<<"$started_row")"
  stage="$(jq -r '.stage // "unknown-stage"' <<<"$started_row")"
  delegated_command="$(jq -r '.delegatedCommand // "unknown-command"' <<<"$started_row")"
  thinking_budget="$(jq -r '.thinkingBudget // "medium"' <<<"$started_row")"
  retry_count="$(jq '.retryCount // 0' <<<"$started_row")"
  duration_ms="$(( (now_epoch - started_epoch) * 1000 ))"

  guard_seen="unknown"
  if [[ -f "$guard_log_path" ]]; then
    if jq -e --arg cmd "$delegated_command" --arg ts "$started_ts" '
      select(.timestamp >= $ts)
      | select(.command | contains($cmd))
    ' "$guard_log_path" >/dev/null 2>&1; then
      guard_seen="yes"
    else
      guard_seen="no"
    fi
  fi

  note_prefix="auto-reconciled stale started stage after watchdog expiry; terminal or delegation interruption suspected"
  note_suffix=""
  if [[ "$guard_seen" == "no" ]]; then
    note_suffix="; guard-bypass-suspected: no terminal_guard telemetry row for delegatedCommand since stage start"
  fi

  jq -nc \
    --arg timestamp "$timestamp" \
    --arg skill "$skill" \
    --arg stage "$stage" \
    --arg delegatedCommand "$delegated_command" \
    --arg delegationProfile "$profile" \
    --arg thinkingBudget "$thinking_budget" \
    --argjson retryCount "$retry_count" \
    --argjson durationMs "$duration_ms" \
    --arg stageRunId "$stage_run_id" \
    --arg notes "${note_prefix}${note_suffix}" \
    '{
      timestamp: $timestamp,
      skill: $skill,
      stage: $stage,
      delegatedCommand: $delegatedCommand,
      delegationProfile: $delegationProfile,
      thinkingBudget: $thinkingBudget,
      outcome: "failed",
      suspectedStuck: true,
      retryCount: $retryCount,
      durationMs: $durationMs,
      stageRunId: $stageRunId,
      notes: $notes
    }' >>"$ledger_path"

  reconciled=$((reconciled + 1))
done < <(jq -c '.[]' "$extract_path")

echo "reconciled_stale_started_rows=$reconciled"