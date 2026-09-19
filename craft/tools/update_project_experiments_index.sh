#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROJECT_KEY="${1:-domainspec}"
PROJECT_DIR="research/projects/${PROJECT_KEY}"
EXPERIMENTS_DIR="${PROJECT_DIR}/experiments"
EXPERIMENTS_MD="${EXPERIMENTS_DIR}/EXPERIMENTS.md"
README_MD="${EXPERIMENTS_DIR}/README.md"
OPEN_DECISIONS_MD="${EXPERIMENTS_DIR}/OPEN-DECISIONS.md"
PROJECT_YAML="${PROJECT_DIR}/PROJECT.yaml"

AUTO_START="<!-- AUTO-DASHBOARD:START -->"
AUTO_END="<!-- AUTO-DASHBOARD:END -->"

if [[ ! -d "$EXPERIMENTS_DIR" ]]; then
  echo "[error] experiments directory not found: $EXPERIMENTS_DIR" >&2
  exit 1
fi

if [[ ! -f "$EXPERIMENTS_MD" ]]; then
  echo "[error] missing experiments index: $EXPERIMENTS_MD" >&2
  exit 1
fi

if [[ ! -f "$README_MD" ]]; then
  echo "[error] missing experiments README: $README_MD" >&2
  exit 1
fi

if ! grep -q "$AUTO_START" "$README_MD" || ! grep -q "$AUTO_END" "$README_MD"; then
  echo "[error] README is missing auto-generation markers:" >&2
  echo "        $AUTO_START" >&2
  echo "        $AUTO_END" >&2
  exit 1
fi

trim() {
  local value="$1"
  value="${value#${value%%[![:space:]]*}}"
  value="${value%${value##*[![:space:]]}}"
  printf '%s' "$value"
}

repeat_bar() {
  local count="$1"
  if (( count <= 0 )); then
    printf '.'
  else
    printf '%*s' "$count" '' | tr ' ' '#'
  fi
}

normalize_status_label() {
  local raw
  raw="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  if [[ "$raw" == *"in progress"* ]]; then
    printf 'in progress'
  elif [[ "$raw" == *"completed"* ]]; then
    printf 'completed + analyzed'
  else
    printf 'not started'
  fi
}

project_display_name() {
  local value=""
  if [[ -f "$PROJECT_YAML" ]]; then
    value="$(awk -F': ' '/^project_name:/ {print $2; exit}' "$PROJECT_YAML" | tr -d '\r')"
  fi
  if [[ -z "$value" ]]; then
    value="$PROJECT_KEY"
  fi
  printf '%s' "$value"
}

search_unresolved_first_match() {
  local file="$1"
  local rg_pattern='\b(pending|open decision|todo|tbd|blocked|unresolved|needs|waiting|waiver)\b'
  local grep_pattern='pending|open decision|todo|tbd|blocked|unresolved|needs|waiting|waiver'

  if command -v rg >/dev/null 2>&1; then
    timeout 20s rg -i -n -m 1 "$rg_pattern" "$file" | head -n 1 || true
  else
    grep -Einm 1 "$grep_pattern" "$file" | head -n 1 || true
  fi
}

has_unresolved_signal() {
  local file="$1"
  local rg_pattern='\b(pending|open decision|todo|tbd|blocked|unresolved|needs|waiting|waiver)\b'
  local grep_pattern='pending|open decision|todo|tbd|blocked|unresolved|needs|waiting|waiver'

  if command -v rg >/dev/null 2>&1; then
    timeout 20s rg -i -q "$rg_pattern" "$file"
  else
    grep -Eiq "$grep_pattern" "$file"
  fi
}

ensure_bundle_readme() {
  local bundle="$1"
  local folder="$2"
  local display_id="$3"
  local raw_status="$4"
  local data_count="$5"
  local result_count="$6"
  local unresolved_count="$7"

  local readme_path="$bundle/README.md"
  if [[ -f "$readme_path" ]]; then
    return
  fi

  local title="$folder"
  if [[ "$folder" =~ ^${display_id}-(.+)$ ]]; then
    title="${BASH_REMATCH[1]}"
  fi
  title="${title//-/ }"
  title="${title//_/ }"

  local data_started=" "
  local results_published=" "
  local claim_adjudicated=" "
  local execution_state="not started"
  local analysis_state="not started"

  if (( data_count > 0 )); then
    data_started="x"
    execution_state="in progress"
  fi

  if (( result_count > 0 )); then
    results_published="x"
    claim_adjudicated="x"
    analysis_state="in progress"
  fi

  cat > "$readme_path" <<EOF
# ${display_id} - ${title}

## Status Snapshot

- Status: ${raw_status}
- Canonical program status: [../EXPERIMENTS.md](../EXPERIMENTS.md)

## Read Order

1. [context.md](context.md)
2. [protocol.md](protocol.md)
3. [sources.md](sources.md)
4. [data/](data/)
5. [results/](results/)

## Bundle Chart

- planning assets: ##########
- execution data: $(repeat_bar "$data_count") (${data_count} files)
- analysis outputs: $(repeat_bar "$result_count") (${result_count} files)

## Task Completeness

- [x] Context drafted
- [x] Protocol drafted
- [x] Sources drafted
- [${data_started}] Data collection ${execution_state}
- [${results_published}] Results analysis ${analysis_state}
- [${claim_adjudicated}] Claim impact adjudicated

## Open Decisions and Adjudications

- Unresolved signals detected: ${unresolved_count}
- Global rollup: [../OPEN-DECISIONS.md](../OPEN-DECISIONS.md)

## Navigation

- Program index: [../README.md](../README.md)
- Program dashboard: [../EXPERIMENTS.md](../EXPERIMENTS.md)
EOF

  echo "[ok] Created missing bundle README: ${readme_path}"
}

declare -A STATUS_BY_ID
while IFS='|' read -r id status; do
  id="$(trim "$id")"
  status="$(trim "$status")"

  [[ -n "$id" ]] || continue
  [[ -n "$status" ]] || continue

  if [[ "$id" =~ ^[Ii][Dd]$ || "$status" =~ ^[Ss][Tt][Aa][Tt][Uu][Ss]$ ]]; then
    continue
  fi

  if [[ "$id" =~ ^-+$ || "$status" =~ ^-+$ ]]; then
    continue
  fi

  if [[ ! "$id" =~ ^[[:alnum:]][[:alnum:]_.-]*$ ]]; then
    continue
  fi

  STATUS_BY_ID["$id"]="$status"
done < <(
  awk -F'|' '
  function trim(v) {
    gsub(/^[ \t]+/, "", v)
    gsub(/[ \t]+$/, "", v)
    return v
  }

  /^\|/ {
    n = split($0, cols, "|")

    header_detected = 0
    id_exact_found = 0
    for (i = 2; i < n; i++) {
      label = tolower(trim(cols[i]))
      if (label == "status") {
        status_col = i
        header_detected = 1
      }
      if (label == "id" || label == "experiment id") {
        id_col = i
        id_exact_found = 1
        header_detected = 1
      }
      if (!id_exact_found && label == "experiment") {
        id_col = i
        header_detected = 1
      }
    }

    if (header_detected) {
      next
    }

    if ($0 ~ /^\|[[:space:]:-]+\|$/) {
      next
    }

    if (id_col > 0 && status_col > 0) {
      id = trim(cols[id_col])
      status = trim(cols[status_col])
      if (id ~ /^-+$/ || status ~ /^-+$/) {
        next
      }
      if (id != "" && status != "") {
        print id "|" status
      }
    }
  }
  ' "$EXPERIMENTS_MD"
)

not_started_count=0
in_progress_count=0
completed_count=0

dashboard_rows=()
latest_rows=()
open_rows=()
open_by_experiment=()

total_open_items=0
experiments_with_open_items=0

mapfile -t EXPERIMENT_BUNDLES < <(find "$EXPERIMENTS_DIR" -mindepth 1 -maxdepth 1 -type d | sort -V)

for bundle in "${EXPERIMENT_BUNDLES[@]}"; do
  folder="$(basename "$bundle")"

  if [[ ! -f "$bundle/protocol.md" && ! -f "$bundle/sources.md" && ! -f "$bundle/context.md" && ! -d "$bundle/data" && ! -d "$bundle/results" ]]; then
    continue
  fi

  display_id="$folder"
  if [[ "$folder" =~ ^(E[0-9]+)- ]]; then
    display_id="${BASH_REMATCH[1]}"
  fi

  raw_status="${STATUS_BY_ID[$display_id]:-${STATUS_BY_ID[$folder]:-not started}}"
  status_label="$(normalize_status_label "$raw_status")"

  case "$status_label" in
    "not started") ((not_started_count += 1)) ;;
    "in progress") ((in_progress_count += 1)) ;;
    "completed + analyzed") ((completed_count += 1)) ;;
  esac

  data_count=0
  result_count=0

  if [[ -d "$bundle/data" ]]; then
    data_count="$(find "$bundle/data" -maxdepth 1 -type f | wc -l | tr -d ' ')"
  fi

  if [[ -d "$bundle/results" ]]; then
    result_count="$(find "$bundle/results" -maxdepth 1 -type f | wc -l | tr -d ' ')"
  fi

  latest_result_file=""
  if [[ -d "$bundle/results" ]]; then
    latest_result_file="$(find "$bundle/results" -maxdepth 1 -type f -printf '%T@|%f\n' 2>/dev/null | sort -nr | head -n 1 | cut -d'|' -f2-)"
  fi

  if [[ -n "$latest_result_file" ]]; then
    latest_rows+=("- ${display_id}: [${latest_result_file}](${folder}/results/${latest_result_file})")
  fi

  unresolved_for_bundle=0

  while IFS= read -r file; do
    lower_name="$(printf '%s' "$(basename "$file")" | tr '[:upper:]' '[:lower:]')"
    if [[ ! "$lower_name" =~ decision|adjudication|next-actions|clearance|gate|waiver|worklist|pending ]]; then
      continue
    fi

    if has_unresolved_signal "$file"; then
      rel_path="${file#$EXPERIMENTS_DIR/}"
      signal_line="$(search_unresolved_first_match "$file")"
      signal_lower="$(printf '%s' "$signal_line" | tr '[:upper:]' '[:lower:]')"
      if [[ "$signal_lower" == *"no unresolved"* ]]; then
        continue
      fi

      ((unresolved_for_bundle += 1))
      ((total_open_items += 1))
      signal_line="${signal_line//|/\\|}"
      open_rows+=("| ${display_id} | ${raw_status} | [${rel_path}](${rel_path}) | ${signal_line} |")
    fi
  done < <(find "$bundle" -type f ! -path "$bundle/data/*" \( -name '*.md' -o -name '*.txt' -o -name '*.csv' \) | sort)

  if (( unresolved_for_bundle > 0 )); then
    ((experiments_with_open_items += 1))
    open_by_experiment+=("- ${display_id}: ${unresolved_for_bundle} unresolved signals")
  fi

  ensure_bundle_readme "$bundle" "$folder" "$display_id" "$raw_status" "$data_count" "$result_count" "$unresolved_for_bundle"

  dashboard_rows+=("| ${display_id} | ${raw_status} | ${data_count} | ${result_count} | ${unresolved_for_bundle} | [README](${folder}/README.md) |")
done

project_name="$(project_display_name)"
now_utc="$(date -u '+%Y-%m-%d %H:%M:%SZ')"

status_block_tmp="$(mktemp)"
open_decisions_tmp="$(mktemp)"
readme_tmp="$(mktemp)"

{
  echo "## Program Status Chart"
  echo
  echo "Auto-generated by [tools/update_project_experiments_index.sh](../../../../tools/update_project_experiments_index.sh) for \`${PROJECT_KEY}\` on ${now_utc}."
  echo
  echo "Status distribution:"
  printf -- "- not started: %s (%d)\n" "$(repeat_bar "$not_started_count")" "$not_started_count"
  printf -- "- in progress: %s (%d)\n" "$(repeat_bar "$in_progress_count")" "$in_progress_count"
  printf -- "- completed + analyzed: %s (%d)\n" "$(repeat_bar "$completed_count")" "$completed_count"
  echo
  echo "Lifecycle chart:"
  echo
  echo '`Context -> Protocol -> Sources -> Data -> Results -> Adjudication -> Claim updates`'
  echo
  echo "## Experiment Dashboard"
  echo
  echo "| ID | Status | Data Files | Result Files | Open Decisions | Bundle Start |"
  echo "| --- | --- | ---: | ---: | ---: | --- |"
  for row in "${dashboard_rows[@]}"; do
    echo "$row"
  done
  echo
  echo "## Latest Evidence Quick Links"
  echo
  if (( ${#latest_rows[@]} == 0 )); then
    echo "- No result files detected yet."
  else
    for row in "${latest_rows[@]}"; do
      echo "$row"
    done
  fi
  echo
  echo "## Open Decisions and Adjudications"
  echo
  echo "- Full rollup: [OPEN-DECISIONS.md](OPEN-DECISIONS.md)"
  echo "- Experiments with unresolved signals: ${experiments_with_open_items}"
  echo "- Unresolved signal items: ${total_open_items}"
  if (( ${#open_by_experiment[@]} > 0 )); then
    echo
    for row in "${open_by_experiment[@]}"; do
      echo "$row"
    done
  fi
} > "$status_block_tmp"

{
  echo "# ${project_name} Experiments - Open Decisions Rollup"
  echo
  echo "Generated by [tools/update_project_experiments_index.sh](../../../../tools/update_project_experiments_index.sh) for \`${PROJECT_KEY}\` on ${now_utc}."
  echo
  echo "## Summary"
  echo
  echo "- Experiments with unresolved signals: ${experiments_with_open_items}"
  echo "- Unresolved signal items: ${total_open_items}"
  echo "- Program dashboard: [README.md](README.md)"
  echo "- Canonical experiment state: [EXPERIMENTS.md](EXPERIMENTS.md)"
  echo
  echo "## Unresolved Items"
  echo
  if (( ${#open_rows[@]} == 0 )); then
    echo "No unresolved decision/adjudication signals detected from current bundle scans."
  else
    echo "| Experiment | Status | File | Signal |"
    echo "| --- | --- | --- | --- |"
    for row in "${open_rows[@]}"; do
      echo "$row"
    done
  fi
  echo
  echo "## Resolution Notes"
  echo
  echo "1. Close unresolved items at the source artifact and rerun the generator."
  echo "2. Keep decision language explicit (pending/open/blocked/needs) for reliable rollups."
  echo "3. If an item is historical-only, remove unresolved markers and add a closure note."
} > "$open_decisions_tmp"

awk -v start="$AUTO_START" -v end="$AUTO_END" -v generated_file="$status_block_tmp" '
BEGIN {
  while ((getline line < generated_file) > 0) {
    generated = generated line ORS
  }
}
$0 == start {
  print
  printf "%s", generated
  in_block = 1
  next
}
$0 == end {
  in_block = 0
  print
  next
}
!in_block {
  print
}
' "$README_MD" > "$readme_tmp"

mv "$readme_tmp" "$README_MD"
mv "$open_decisions_tmp" "$OPEN_DECISIONS_MD"
rm -f "$status_block_tmp"

echo "[ok] Updated: $README_MD"
echo "[ok] Updated: $OPEN_DECISIONS_MD"