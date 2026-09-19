#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEFAULT_LOG_REL="docs/signals/terminal-guard.jsonl"

usage() {
  cat <<'EOF'
Usage:
  tools/terminal_guard.sh run [--timeout SEC] [--log PATH] [--no-log] [--quiet] -- <command> [args...]
  tools/terminal_guard.sh auto [--timeout SEC] [--retry-timeout SEC] [--max-retries N] [--log PATH] [--no-log] [--quiet] -- <command> [args...]
  tools/terminal_guard.sh shell [--timeout SEC] [--retry-timeout SEC] [--max-retries N] [--log PATH] [--no-log] [--quiet] [--prompt STR]
  tools/terminal_guard.sh nudge -- <command> [args...]
  tools/terminal_guard.sh profile [--top N] [--transcript JSONL]

Examples:
  tools/terminal_guard.sh nudge -- rg -n "stageRunId" docs/signals/delegation-tuning.jsonl
  tools/terminal_guard.sh run --timeout 20 -- rg -n "stageRunId" docs/signals/delegation-tuning.jsonl
  tools/terminal_guard.sh auto --timeout 30 --retry-timeout 15 -- rg -n "stageRunId" docs/signals/delegation-tuning.jsonl
  tools/terminal_guard.sh shell --timeout 120 --retry-timeout 45
  tools/terminal_guard.sh profile --top 15 --transcript /path/to/session.jsonl
EOF
}

resolve_path() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    printf '%s' "$path"
  else
    printf '%s' "$REPO_ROOT/$path"
  fi
}

command_display() {
  printf '%q ' "$@"
}

unique_lines() {
  awk 'NF && !seen[$0]++ { print }'
}

preflight_nudges() {
  local cmd_display="$1"
  local cmd_head="$2"
  local timeout_guarded="${3:-0}"

  if [[ "$cmd_display" == *"set -e"* || "$cmd_display" == *"set\\ -e"* ]]; then
    echo "strict-errexit: non-zero subcommands terminate the shell; wrap expected failures with if ! cmd; then ...; fi"
  fi

  if [[ "$timeout_guarded" -eq 0 ]] && [[ "$cmd_display" =~ (^|[[:space:];])rg[[:space:]] ]] && [[ ! "$cmd_display" =~ (^|[[:space:];])timeout[[:space:]] ]]; then
    echo "search-without-timeout: add timeout and explicit include paths"
  fi

  if [[ "$cmd_display" =~ (^|[[:space:];])(rg|grep|find)[[:space:]] ]] && [[ "$cmd_display" =~ [[:space:]]--no-ignore([[:space:]]|$) ]]; then
    echo "broad-no-ignore-search: narrow path scope or cap matches with -m"
  fi

  if [[ "$cmd_display" == *'`'* ]]; then
    echo "backtick-substitution-risk: backticks can trigger shell command substitution; prefer single-quoted regex or escaped backticks"
  fi

  if [[ "$cmd_display" == *'$('* ]]; then
    echo "subshell-substitution-risk: verify \$() is intentional; unexpected expansion can alter command behavior"
  fi

  if [[ "$cmd_head" =~ ^(pnpm|npm|yarn|vite|tsx|nodemon)$ ]] && [[ "$cmd_display" =~ (^|[[:space:]])(dev|watch|start)([[:space:]]|$) ]]; then
    echo "watch-command: prefer async/background terminal mode"
  fi

  if [[ "$cmd_head" == "tail" ]] && [[ "$cmd_display" =~ (^|[[:space:]])-f([[:space:]]|$) ]]; then
    echo "streaming-command: prefer async/background terminal mode"
  fi

  if [[ "$cmd_head" == "git" ]] && [[ "$cmd_display" =~ (^|[[:space:]])(rebase[[:space:]]-i|add[[:space:]]-p|commit([[:space:]]|$))(.*) ]]; then
    echo "interactive-git-command: use non-interactive flags in automation"
  fi
}

postflight_nudges() {
  local exit_code="$1"
  local duration_ms="$2"
  local timeout_sec="$3"
  local line_count="$4"
  local byte_count="$5"
  local timed_out="$6"

  if [[ "$timed_out" -eq 1 ]]; then
    echo "timeout-hit: rerun with narrower scope or async mode"
  fi

  if [[ "$exit_code" -ge 130 ]]; then
    echo "signal-terminated: command/session interruption detected"
  fi

  if [[ "$duration_ms" -ge $((timeout_sec * 800)) ]]; then
    echo "near-timeout: command ran close to timeout budget"
  fi

  if [[ "$line_count" -gt 2000 ]]; then
    echo "high-output-lines: cap output with head/tail/grep -m"
  fi

  if [[ "$byte_count" -gt 350000 ]]; then
    echo "high-output-bytes: redirect to file and inspect slices"
  fi
}

risk_label() {
  local nudge_count="$1"
  if [[ "$nudge_count" -ge 3 ]]; then
    printf 'high'
  elif [[ "$nudge_count" -ge 1 ]]; then
    printf 'medium'
  else
    printf 'low'
  fi
}

has_max_count_cap() {
  local arg
  for arg in "$@"; do
    case "$arg" in
      -m|--max-count|--max-count=*)
        return 0
        ;;
    esac
  done
  return 1
}

sanitize_shell_line() {
  local line="$1"
  local escaped="$line"
  if [[ "$escaped" == *'`'* ]]; then
    escaped="${escaped//\`/\\\`}"
  fi
  printf '%s' "$escaped"
}

build_recovery_cmd() {
  local cmd=("$@")
  local head="${cmd[0]}"

  # Cap noisy text searches on recovery so retries converge quickly.
  if [[ "$head" == "rg" ]] && ! has_max_count_cap "${cmd[@]}"; then
    cmd+=("--max-count=200")
  elif [[ "$head" == "grep" ]] && ! has_max_count_cap "${cmd[@]}"; then
    cmd+=("-m" "200")
  fi

  printf '%s\n' "${cmd[@]}"
}

run_mode() {
  local timeout_sec=120
  local quiet=0
  local no_log=0
  local log_rel="$DEFAULT_LOG_REL"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --timeout)
        timeout_sec="${2:-}"
        shift 2
        ;;
      --log)
        log_rel="${2:-}"
        shift 2
        ;;
      --no-log)
        no_log=1
        shift
        ;;
      --quiet)
        quiet=1
        shift
        ;;
      --)
        shift
        break
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        break
        ;;
    esac
  done

  if [[ $# -eq 0 ]]; then
    echo "ERROR: missing command for run mode" >&2
    usage
    exit 2
  fi

  if ! [[ "$timeout_sec" =~ ^[0-9]+$ ]] || [[ "$timeout_sec" -lt 1 ]]; then
    echo "ERROR: --timeout must be a positive integer" >&2
    exit 2
  fi

  local cmd=("$@")
  local cmd_head="${cmd[0]}"
  local cmd_str
  cmd_str="$(command_display "${cmd[@]}")"
  cmd_str="${cmd_str% }"

  local start_ms end_ms duration_ms
  start_ms="$(date +%s%3N 2>/dev/null || true)"
  if [[ -z "$start_ms" ]]; then
    start_ms="$(( $(date +%s) * 1000 ))"
  fi

  local tmp_out
  tmp_out="$(mktemp)"
  cleanup_tmp() {
    if [[ -n "${tmp_out:-}" ]]; then
      rm -f "$tmp_out"
    fi
  }
  trap cleanup_tmp RETURN

  local exit_code=0
  local use_outer_timeout=1
  if [[ "$cmd_head" == "timeout" ]]; then
    use_outer_timeout=0
  fi

  local errexit_was_on=0
  if [[ $- == *e* ]]; then
    errexit_was_on=1
    set +e
  fi
  if [[ "$quiet" -eq 1 ]]; then
    if [[ "$use_outer_timeout" -eq 1 ]]; then
      timeout --preserve-status "${timeout_sec}s" "${cmd[@]}" >"$tmp_out" 2>&1
      exit_code=$?
    else
      "${cmd[@]}" >"$tmp_out" 2>&1
      exit_code=$?
    fi
    cat "$tmp_out"
  else
    if [[ "$use_outer_timeout" -eq 1 ]]; then
      timeout --preserve-status "${timeout_sec}s" "${cmd[@]}" 2>&1 | tee "$tmp_out"
      exit_code=${PIPESTATUS[0]}
    else
      "${cmd[@]}" 2>&1 | tee "$tmp_out"
      exit_code=${PIPESTATUS[0]}
    fi
  fi
  if [[ "$errexit_was_on" -eq 1 ]]; then
    set -e
  fi

  end_ms="$(date +%s%3N 2>/dev/null || true)"
  if [[ -z "$end_ms" ]]; then
    end_ms="$(( $(date +%s) * 1000 ))"
  fi
  duration_ms=$((end_ms - start_ms))

  local line_count byte_count
  line_count="$(wc -l <"$tmp_out" | tr -d '[:space:]')"
  byte_count="$(wc -c <"$tmp_out" | tr -d '[:space:]')"

  # Timeout semantics with --preserve-status can surface as 143 (SIGTERM).
  # Treat near-budget SIGTERM as timeout so nudges/logging stay accurate.
  local timed_out=0
  if [[ "$use_outer_timeout" -eq 1 ]]; then
    if [[ "$exit_code" -eq 124 ]]; then
      timed_out=1
    elif [[ "$exit_code" -eq 143 ]] && [[ "$duration_ms" -ge $((timeout_sec * 1000 - 500)) ]]; then
      timed_out=1
    fi
  fi

  mapfile -t pre_nudges < <(preflight_nudges "$cmd_str" "$cmd_head" "$use_outer_timeout")
  mapfile -t post_nudges < <(postflight_nudges "$exit_code" "$duration_ms" "$timeout_sec" "$line_count" "$byte_count" "$timed_out")
  mapfile -t nudges < <(printf '%s\n' "${pre_nudges[@]:-}" "${post_nudges[@]:-}" | unique_lines)

  if [[ "$quiet" -eq 0 ]]; then
    echo "[terminal_guard] exit=$exit_code durationMs=$duration_ms lines=$line_count bytes=$byte_count"
    if [[ "${#nudges[@]}" -gt 0 ]]; then
      echo "[terminal_guard] nudges:"
      for nudge in "${nudges[@]}"; do
        echo "- $nudge"
      done
    fi
  fi

  if [[ "$no_log" -eq 0 ]]; then
    local log_path
    log_path="$(resolve_path "$log_rel")"
    mkdir -p "$(dirname "$log_path")"

    if command -v jq >/dev/null 2>&1; then
      local nudge_json
      if [[ "${#nudges[@]}" -gt 0 ]]; then
        nudge_json="$(printf '%s\n' "${nudges[@]}" | jq -R . | jq -cs .)"
      else
        nudge_json='[]'
      fi

      jq -nc \
        --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg command "$cmd_str" \
        --arg commandHead "$cmd_head" \
        --argjson timeoutSec "$timeout_sec" \
        --argjson durationMs "$duration_ms" \
        --argjson exitCode "$exit_code" \
        --argjson timedOut "$timed_out" \
        --argjson lineCount "$line_count" \
        --argjson byteCount "$byte_count" \
        --arg risk "$(risk_label "${#nudges[@]}")" \
        --argjson nudges "$nudge_json" \
        '{timestamp:$timestamp, command:$command, commandHead:$commandHead, timeoutSec:$timeoutSec, durationMs:$durationMs, exitCode:$exitCode, timedOut:$timedOut, lineCount:$lineCount, byteCount:$byteCount, risk:$risk, nudges:$nudges}' \
        >>"$log_path"
    else
      printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        "$cmd_head" \
        "$exit_code" \
        "$duration_ms" \
        "$line_count" \
        "$byte_count" \
        >>"$log_path"
    fi
  fi

  return "$exit_code"
}

nudge_mode() {
  if [[ ${1:-} == "--" ]]; then
    shift
  fi

  if [[ $# -eq 0 ]]; then
    echo "ERROR: missing command for nudge mode" >&2
    usage
    exit 2
  fi

  local cmd=("$@")
  local cmd_head="${cmd[0]}"
  local cmd_str
  cmd_str="$(command_display "${cmd[@]}")"
  cmd_str="${cmd_str% }"

  mapfile -t nudges < <(preflight_nudges "$cmd_str" "$cmd_head" 0 | unique_lines)

  echo "[terminal_guard:nudge] command=$cmd_str"
  echo "[terminal_guard:nudge] risk=$(risk_label "${#nudges[@]}")"
  if [[ "${#nudges[@]}" -eq 0 ]]; then
    echo "- no preflight nudges"
    return 0
  fi

  for nudge in "${nudges[@]}"; do
    echo "- $nudge"
  done
}

auto_mode() {
  local timeout_sec=120
  local retry_timeout_sec=45
  local max_retries=1
  local quiet=0
  local no_log=0
  local log_rel="$DEFAULT_LOG_REL"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --timeout)
        timeout_sec="${2:-}"
        shift 2
        ;;
      --retry-timeout)
        retry_timeout_sec="${2:-}"
        shift 2
        ;;
      --max-retries)
        max_retries="${2:-}"
        shift 2
        ;;
      --log)
        log_rel="${2:-}"
        shift 2
        ;;
      --no-log)
        no_log=1
        shift
        ;;
      --quiet)
        quiet=1
        shift
        ;;
      --)
        shift
        break
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        break
        ;;
    esac
  done

  if [[ $# -eq 0 ]]; then
    echo "ERROR: missing command for auto mode" >&2
    usage
    exit 2
  fi

  if ! [[ "$timeout_sec" =~ ^[0-9]+$ ]] || [[ "$timeout_sec" -lt 1 ]]; then
    echo "ERROR: --timeout must be a positive integer" >&2
    exit 2
  fi

  if ! [[ "$retry_timeout_sec" =~ ^[0-9]+$ ]] || [[ "$retry_timeout_sec" -lt 1 ]]; then
    echo "ERROR: --retry-timeout must be a positive integer" >&2
    exit 2
  fi

  if ! [[ "$max_retries" =~ ^[0-9]+$ ]] || [[ "$max_retries" -lt 0 ]]; then
    echo "ERROR: --max-retries must be a non-negative integer" >&2
    exit 2
  fi

  local cmd=("$@")
  local run_opts=()
  if [[ "$quiet" -eq 1 ]]; then
    run_opts+=("--quiet")
  fi
  if [[ "$no_log" -eq 1 ]]; then
    run_opts+=("--no-log")
  else
    run_opts+=("--log" "$log_rel")
  fi

  if [[ "$quiet" -eq 0 ]]; then
    nudge_mode -- "${cmd[@]}"
  fi

  local exit_code=0
  set +e
  run_mode --timeout "$timeout_sec" "${run_opts[@]}" -- "${cmd[@]}"
  exit_code=$?
  set -e

  local attempt=0
  while [[ "$exit_code" -ne 0 ]] && [[ "$attempt" -lt "$max_retries" ]]; do
    attempt=$((attempt + 1))
    mapfile -t cmd < <(build_recovery_cmd "${cmd[@]}")

    if [[ "$quiet" -eq 0 ]]; then
      echo "[terminal_guard:auto] recovery-attempt=$attempt/$max_retries timeout=${retry_timeout_sec}s command=$(command_display "${cmd[@]}")"
    fi

    set +e
    run_mode --timeout "$retry_timeout_sec" "${run_opts[@]}" -- "${cmd[@]}"
    exit_code=$?
    set -e
  done

  return "$exit_code"
}

shell_mode() {
  local timeout_sec=120
  local retry_timeout_sec=45
  local max_retries=1
  local quiet=0
  local no_log=0
  local log_rel="$DEFAULT_LOG_REL"
  local prompt=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --timeout)
        timeout_sec="${2:-}"
        shift 2
        ;;
      --retry-timeout)
        retry_timeout_sec="${2:-}"
        shift 2
        ;;
      --max-retries)
        max_retries="${2:-}"
        shift 2
        ;;
      --log)
        log_rel="${2:-}"
        shift 2
        ;;
      --no-log)
        no_log=1
        shift
        ;;
      --quiet)
        quiet=1
        shift
        ;;
      --prompt)
        prompt="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "ERROR: unknown option for shell mode: $1" >&2
        exit 2
        ;;
    esac
  done

  if ! [[ "$timeout_sec" =~ ^[0-9]+$ ]] || [[ "$timeout_sec" -lt 1 ]]; then
    echo "ERROR: --timeout must be a positive integer" >&2
    exit 2
  fi

  if ! [[ "$retry_timeout_sec" =~ ^[0-9]+$ ]] || [[ "$retry_timeout_sec" -lt 1 ]]; then
    echo "ERROR: --retry-timeout must be a positive integer" >&2
    exit 2
  fi

  if ! [[ "$max_retries" =~ ^[0-9]+$ ]] || [[ "$max_retries" -lt 0 ]]; then
    echo "ERROR: --max-retries must be a non-negative integer" >&2
    exit 2
  fi

  if [[ -z "$prompt" ]]; then
    prompt='[terminal_guard]$ '
  fi

  if [[ "$quiet" -eq 0 ]]; then
    echo "[terminal_guard:shell] started (timeout=${timeout_sec}s retry-timeout=${retry_timeout_sec}s max-retries=${max_retries})"
    echo "[terminal_guard:shell] type 'exit' or 'quit' to close"
  fi

  while true; do
    local line=""
    if ! IFS= read -r -e -p "$prompt" line; then
      echo
      break
    fi

    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    if [[ -z "$line" ]]; then
      continue
    fi

    case "$line" in
      exit|quit)
        break
        ;;
    esac

    if [[ "$line" =~ ^cd([[:space:]]+.*)?$ ]]; then
      local target="${line#cd}"
      target="${target#"${target%%[![:space:]]*}"}"
      if [[ -z "$target" ]]; then
        target="$HOME"
      fi
      set +e
      builtin cd "$target"
      local cd_exit=$?
      set -e
      if [[ "$cd_exit" -ne 0 ]]; then
        echo "[terminal_guard:shell] cd failed: $target" >&2
      fi
      continue
    fi

    local safe_line
    safe_line="$(sanitize_shell_line "$line")"
    if [[ "$safe_line" != "$line" ]] && [[ "$quiet" -eq 0 ]]; then
      echo "[terminal_guard:shell] escaped backticks to avoid accidental command substitution"
    fi

    local auto_opts=(--timeout "$timeout_sec" --retry-timeout "$retry_timeout_sec" --max-retries "$max_retries")
    if [[ "$quiet" -eq 1 ]]; then
      auto_opts+=("--quiet")
    fi
    if [[ "$no_log" -eq 1 ]]; then
      auto_opts+=("--no-log")
    else
      auto_opts+=("--log" "$log_rel")
    fi

    set +e
    auto_mode "${auto_opts[@]}" -- bash -lc "$safe_line"
    local cmd_exit=$?
    set -e

    if [[ "$cmd_exit" -ne 0 ]] && [[ "$quiet" -eq 0 ]]; then
      echo "[terminal_guard:shell] command exit=$cmd_exit"
    fi
  done
}

extract_heads_from_stream() {
  awk '
  function trim(v){ gsub(/^[ \t]+|[ \t]+$/, "", v); return v }
  function emit(seg, n, parts, i, cmd) {
    seg = trim(seg)
    if (seg == "") return
    n = split(seg, parts, /[ \t]+/)
    i = 1
    while (i <= n && parts[i] ~ /^[A-Za-z_][A-Za-z0-9_]*=.*/) i++
    while (i <= n && parts[i] ~ /^(\{|\}|\(|\)|\\)$/) i++
    if (i > n) return
    cmd = parts[i]
    if (cmd ~ /^#/) return
    if (cmd ~ /^[\|\-]+$/) return
    if (cmd ~ /^"[^"]+":$/) return
    if (cmd ~ /^[\{\}\[\],]+$/) return
    if (cmd ~ /^[0-9]+:$/) return
    if (cmd ~ /^(if|then|fi|for|do|done|while|case|esac|elif|else|function|local|return|in|select|time)$/) return
    print cmd
  }
  {
    line = $0
    gsub(/\r/, "", line)
    sub(/[[:space:]]*#.*/, "", line)
    gsub(/\|\|/, ";", line)
    gsub(/&&/, ";", line)
    n = split(line, segs, /;/)
    for (j = 1; j <= n; j++) emit(segs[j])
  }'
}

print_top_counts() {
  local title="$1"
  local file="$2"
  local top_n="$3"

  echo "## $title"
  if [[ ! -s "$file" ]]; then
    echo "(none)"
    echo
    return
  fi

  sort "$file" | sed '/^[[:space:]]*$/d' | uniq -c | sort -nr | head -n "$top_n" | awk '{c=$1; $1=""; sub(/^ /, ""); printf "%6d %s\n", c, $0}'
  echo
}

command_nudge_for_head() {
  local head="$1"
  case "$head" in
    rg|grep|find)
      echo "search-heavy: always add timeout and explicit path scope"
      ;;
    pnpm|npm|yarn|vite|nodemon|tsx)
      echo "dev/watch-prone: run async for long-lived tasks"
      ;;
    git)
      echo "scm-sensitive: avoid interactive flags; use non-interactive commands"
      ;;
    bash|sh)
      echo "script-runner: enforce set -euo pipefail in called scripts"
      ;;
    jq|awk|sed)
      echo "text-heavy: cap output and validate input size"
      ;;
    timeout)
      echo "wrapper-command: ensure wrapped command has explicit scope"
      ;;
    *)
      echo "general: keep bounded timeout and output caps"
      ;;
  esac
}

profile_mode() {
  local top_n=20
  local transcript_path=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --top)
        top_n="${2:-}"
        shift 2
        ;;
      --transcript)
        transcript_path="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "ERROR: unknown option for profile mode: $1" >&2
        exit 2
        ;;
    esac
  done

  if ! [[ "$top_n" =~ ^[0-9]+$ ]] || [[ "$top_n" -lt 1 ]]; then
    echo "ERROR: --top must be a positive integer" >&2
    exit 2
  fi

  local repo_heads transcript_heads combined
  repo_heads="$(mktemp)"
  transcript_heads="$(mktemp)"
  combined="$(mktemp)"
  cleanup_profile() {
    rm -f "$repo_heads" "$transcript_heads" "$combined"
  }
  trap cleanup_profile RETURN

  while IFS= read -r -d '' file; do
    extract_heads_from_stream <"$file" >>"$repo_heads"
  done < <(find "$REPO_ROOT" -type f -name '*.sh' ! -path '*/.git/*' ! -path '*/node_modules/*' -print0)

  if [[ -n "$transcript_path" ]]; then
    if [[ ! -f "$transcript_path" ]]; then
      echo "ERROR: transcript file not found: $transcript_path" >&2
      exit 2
    fi
    if ! command -v jq >/dev/null 2>&1; then
      echo "ERROR: jq is required for --transcript parsing" >&2
      exit 2
    fi

    jq -r 'select(.type=="tool.execution_start" and .data.toolName=="run_in_terminal" and (.data.arguments.command|type=="string")) | .data.arguments.command' "$transcript_path" | extract_heads_from_stream >"$transcript_heads"
  fi

  cat "$repo_heads" "$transcript_heads" >"$combined"

  echo "# Terminal Command Profile"
  echo "repo_root: $REPO_ROOT"
  if [[ -n "$transcript_path" ]]; then
    echo "transcript: $transcript_path"
  else
    echo "transcript: (not provided)"
  fi
  echo

  print_top_counts "Repository script command heads" "$repo_heads" "$top_n"
  if [[ -n "$transcript_path" ]]; then
    print_top_counts "Transcript command heads" "$transcript_heads" "$top_n"
  fi
  print_top_counts "Combined command heads" "$combined" "$top_n"

  echo "## Nudges For Top Combined Commands"
  if [[ ! -s "$combined" ]]; then
    echo "(none)"
    return
  fi

  sort "$combined" | sed '/^[[:space:]]*$/d' | uniq -c | sort -nr | head -n "$top_n" | while read -r count head; do
    echo "- $head ($count): $(command_nudge_for_head "$head")"
  done
}

main() {
  if [[ $# -lt 1 ]]; then
    usage
    exit 2
  fi

  local mode="$1"
  shift

  case "$mode" in
    run)
      run_mode "$@"
      ;;
    auto)
      auto_mode "$@"
      ;;
    shell)
      shell_mode "$@"
      ;;
    nudge)
      nudge_mode "$@"
      ;;
    profile)
      profile_mode "$@"
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "ERROR: unknown mode: $mode" >&2
      usage
      exit 2
      ;;
  esac
}

main "$@"