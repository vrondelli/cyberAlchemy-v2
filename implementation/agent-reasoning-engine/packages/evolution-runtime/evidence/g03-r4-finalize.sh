#!/usr/bin/env bash
# Fail-closed G03 r4 evaluation after the fixed generation campaign terminates.
set -euo pipefail

campaign=/opt/are-benchmark-runs/longmemeval-product80-20260928-r4
cohort=/opt/are/evolution-runtime/g03-product-replication-r4
score=/opt/are-benchmark-runs/longmemeval-product80-20260928-r4-score
code=/opt/are/evolution-runtime/g03-product-replication-code-r6
node=/opt/cyberalchemy-are-tools/node-24.10.0/node
source_json=/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f/longmemeval_s_cleaned.json
rubric=/opt/are-benchmark-runs/longmemeval-16paired-evaluation-20260926-v1/native-rubric.py
scripts="$code/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1"
archive="$code/implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/archive-private-campaign.mjs"

while systemctl is-active --quiet are-g03-r4-20260928.service; do sleep 20; done
python3 -c 'import json,sys; r=json.load(open(sys.argv[1])); assert r["schema_version"]=="are.longmemeval-product-replication-paired-result/v2" and r["status"]=="completed" and r["terminal_count"]==80 and r["unknown_usage"] is False and r["failure_count"]==0 and len(r["results"])==80 and r["completed"]+r["provider_refused"]==80' "$campaign/RESULT.json"
python3 "$scripts/replication-cohort-reference-project-r4.py" "$source_json" "$cohort/source/manifest.json" "$campaign/RESULT.json" "$cohort/references"
"$node" "$scripts/replication-cohort-score-r4.mjs" "$cohort/source" "$campaign/RESULT.json" "$cohort/references" "$rubric" "$score"
"$node" "$code/implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/analyze-product-longmemeval-r4.mjs" "$cohort/source/manifest.json" "$campaign/RESULT.json" "$score/RESULT.json" "$score/ANALYSIS.json"
"$node" "$archive" g03-product80-r4-cohort /opt/are/evolution-runtime g03-product-replication-r4
"$node" "$archive" g03-product80-r4-generation /opt/are-benchmark-runs longmemeval-product80-20260928-r4
"$node" "$archive" g03-product80-r4-score /opt/are-benchmark-runs longmemeval-product80-20260928-r4-score
printf '%s\n' 'g03-r4-finalized'
