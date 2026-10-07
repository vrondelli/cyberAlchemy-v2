#!/usr/bin/env bash
# Fail closed after G03 r5 generation; source references never enter generation.
set -euo pipefail

generation_pid=3024936
root=/opt/are/evolution-runtime/g03-product-replication-r5
campaign=/opt/are-benchmark-runs/longmemeval-product50-20260928-r5
score=/opt/are-benchmark-runs/longmemeval-product50-20260928-r5-score
code=/opt/are/evolution-runtime/g03-product-replication-code-r7
tools=/opt/are/evolution-runtime/g03-product-replication-tools-r5
node=/opt/cyberalchemy-are-tools/node-24.10.0/node
source_json=/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f/longmemeval_s_cleaned.json
rubric=/opt/are-benchmark-runs/longmemeval-16paired-evaluation-20260926-v1/native-rubric.py
scripts="$code/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1"
archive="$code/implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/archive-private-campaign.mjs"

while :; do
  state=$(ps -p "$generation_pid" -o stat= 2>/dev/null || true)
  if [[ -z "$state" || "$state" == Z* ]]; then break; fi
  cmdline=$(tr '\0' ' ' < "/proc/$generation_pid/cmdline" 2>/dev/null || true)
  if [[ "$cmdline" != *replication-cohort-paired-r5.mjs* ]]; then
    echo 'generation-pid-identity-drift' >&2
    exit 2
  fi
  sleep 20
done

python3 -c 'import json,sys; r=json.load(open(sys.argv[1])); assert r["schema_version"]=="are.longmemeval-product-replication-paired-result/v2" and r["status"]=="completed" and r["terminal_count"]==50 and r["unknown_usage"] is False and r["failure_count"]==0 and len(r["results"])==50 and r["completed"]+r["provider_refused"]==50' "$campaign/RESULT.json"
test "$(sha256sum "$root/source/manifest.json" | cut -d' ' -f1)" = d7f255236abf003d8871084a77f6de094ef8bffc81fd7eb1d98a677ac2754200
test "$(sha256sum "$scripts/replication-cohort-reference-project-r5-fix1.py" | cut -d' ' -f1)" = 6c4b9a1e4cbfc96804221e437fdcb692137e8f8d8ad09d1e6fbe2849fbcc0e46
test "$(sha256sum "$scripts/replication-cohort-score-r5.mjs" | cut -d' ' -f1)" = 1873fc9dc6c93b692274343fa3dc2ddc5f73222cca75d1bda60a3dad13d4e2d3
test "$(sha256sum "$tools/analyze-product-longmemeval-r5.mjs" | cut -d' ' -f1)" = 60cc5af0735a9f042fdf49035c845f50b2d3e25a0709dbfb083884369d7f160e

python3 "$scripts/replication-cohort-reference-project-r5-fix1.py" "$source_json" "$root/source/manifest.json" "$campaign/RESULT.json" "$root/references"
"$node" "$scripts/replication-cohort-score-r5.mjs" "$root/source" "$campaign/RESULT.json" "$root/references" "$rubric" "$score"
"$node" "$tools/analyze-product-longmemeval-r5.mjs" "$root/source/manifest.json" "$campaign/RESULT.json" "$score/RESULT.json" "$score/ANALYSIS.json"

free_gib=$(df -BG --output=avail /opt/are/evolution-runtime | tail -1 | tr -dc '0-9')
if [[ "$free_gib" -lt 15 ]]; then
  echo "archive-deferred-low-space:${free_gib}GiB" >&2
  exit 3
fi
"$node" "$archive" g03-product50-r5-cohort /opt/are/evolution-runtime g03-product-replication-r5
"$node" "$archive" g03-product50-r5-generation /opt/are-benchmark-runs longmemeval-product50-20260928-r5
"$node" "$archive" g03-product50-r5-score /opt/are-benchmark-runs longmemeval-product50-20260928-r5-score
echo 'g03-r5-finalized'
