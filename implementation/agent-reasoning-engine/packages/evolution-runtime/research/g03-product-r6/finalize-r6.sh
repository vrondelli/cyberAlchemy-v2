#!/usr/bin/env bash
# Wait for sealed generation, then project references, score, analyze, and audit.
set -euo pipefail

generation_pid=134634
cohort=/opt/are/evolution-runtime/g03-product-replication-r6
generation=/opt/are-benchmark-runs/longmemeval-product40-20260928-r6
score=/opt/are-benchmark-runs/longmemeval-product40-20260928-r6-score
code=/opt/are/evolution-runtime/g03-product-replication-code-r8/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1
tools=/opt/are/evolution-runtime/g03-product-replication-tools-r6
source_json=/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f/longmemeval_s_cleaned.json
rubric=/opt/are-benchmark-runs/longmemeval-16paired-evaluation-20260926-v1/native-rubric.py
node=/opt/cyberalchemy-are-tools/node-24.10.0/node

while :; do
  state=$(ps -p "$generation_pid" -o stat= 2>/dev/null || true)
  if [[ -z "$state" || "$state" == Z* ]]; then break; fi
  cmdline=$(tr '\0' ' ' < "/proc/$generation_pid/cmdline" 2>/dev/null || true)
  if [[ "$cmdline" != *replication-cohort-paired-r6.mjs* ]]; then
    echo 'generation-pid-identity-drift' >&2
    exit 2
  fi
  sleep 20
done

test "$(sha256sum "$cohort/FREEZE.json" | cut -d' ' -f1)" = ea3919b6cdffc532283e47dfe31e1a808ce00d2a91a47c683edd76959e03f5f1
test "$(sha256sum "$cohort/source/manifest.json" | cut -d' ' -f1)" = af04cd3230cd99085fad90c7ad1e0db8654a5ee1a7096345a1d3b8b1b8bae393
test "$(sha256sum "$code/replication-cohort-score-r6.mjs" | cut -d' ' -f1)" = ca55e85a1f52f903018a0b335590cba88b0927f2a1adcb4f65f320af800b916c
test "$(sha256sum "$code/replication-cohort-reference-project-r6.py" | cut -d' ' -f1)" = b5ced823cf11a3b4843cc8610089c0898874bbb5806cb7931019761a1d4f73eb
test "$(sha256sum "$tools/analyze-accuracy-r6.mjs" | cut -d' ' -f1)" = caf1e81c8fbbcfaaed88b182383a87008cc4a0c7b74b4a9f6b5134f3f9da9bef
python3 -c 'import json,sys;r=json.load(open(sys.argv[1]));assert r["status"]=="completed" and r["terminal_count"]==40 and r["unknown_usage"] is False and r["failure_count"]==0 and len(r["results"])==40' "$generation/RESULT.json"

test ! -e "$cohort/references"
test ! -e "$score"
python3 "$code/replication-cohort-reference-project-r6.py" "$source_json" "$cohort/source/manifest.json" "$generation/RESULT.json" "$cohort/references"
"$node" "$code/replication-cohort-score-r6.mjs" "$cohort/source" "$generation/RESULT.json" "$cohort/references" "$rubric" "$score"
"$node" "$tools/analyze-accuracy-r6.mjs" "$cohort/source/manifest.json" "$generation/RESULT.json" "$score/RESULT.json" "$score/ANALYSIS.json"
python3 "$tools/audit-r6.py" "$cohort" "$generation" "$score" "$cohort/HASH-AUDIT.json"
echo 'g03-r6-finalized'
