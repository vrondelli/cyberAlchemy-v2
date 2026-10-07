#!/usr/bin/env bash
# Wait for the exact frozen generation unit, then score and audit without retries.
set -euo pipefail

unit=are-g03-r7-generation.service
cohort=/opt/are/evolution-runtime/g03-product-replication-r7
generation=/opt/are-benchmark-runs/longmemeval-product28-20261002-r7
score=/opt/are-benchmark-runs/longmemeval-product28-20261002-r7-score
code=/opt/are/evolution-runtime/g03-product-replication-code-r9/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1
tools=/opt/are/evolution-runtime/g03-product-replication-tools-r7
source_json=/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f/longmemeval_s_cleaned.json
rubric=/opt/are-benchmark-runs/longmemeval-16paired-evaluation-20260926-v1/native-rubric.py
node=/opt/cyberalchemy-are-tools/node-24.10.0/node

while [[ $(systemctl show "$unit" -p ActiveState --value) == active ]]; do sleep 20; done
test "$(sha256sum "$cohort/FREEZE.json" | cut -d' ' -f1)" = c4d4b762a9a541d11ae7d57aaf6ed6f601dad38b9d0165357a50455d38b97924
python3 - "$cohort" "$generation" "$code" "$tools" <<'PY'
import hashlib, json, pathlib, sys
cohort, generation, code, tools = map(pathlib.Path, sys.argv[1:])
freeze = json.loads((cohort / 'FREEZE.json').read_text())
files = {
    'protocol': tools / 'G03-R7-PROTOCOL.md',
    'selection': cohort / 'SELECTION.json',
    'source_manifest': cohort / 'source/manifest.json',
    'selector': tools / 'select-cohort-r7.py',
    'code_builder': tools / 'build-code-r7.mjs',
    'analyzer': tools / 'analyze-accuracy-r7.mjs',
    'independent_auditor': tools / 'audit-r7.py',
    'adapter': code / 'replication-cohort-adapter-v1.mjs',
    'runner': code / 'replication-cohort-paired-r7.mjs',
    'scorer': code / 'replication-cohort-score-r7.mjs',
    'reference_projector': code / 'replication-cohort-reference-project-r7.py',
}
assert set(files) == set(freeze['file_sha256'])
for key, path in files.items():
    assert hashlib.sha256(path.read_bytes()).hexdigest() == freeze['file_sha256'][key], key
result = json.loads((generation / 'RESULT.json').read_text())
assert result['status'] == 'completed' and result['terminal_count'] == 28
assert result['failure_count'] == 0 and result['unknown_usage'] is False
assert len(result['results']) == 28
PY

test ! -e "$cohort/references"
test ! -e "$score"
python3 "$code/replication-cohort-reference-project-r7.py" "$source_json" "$cohort/source/manifest.json" "$generation/RESULT.json" "$cohort/references"
"$node" "$code/replication-cohort-score-r7.mjs" "$cohort/source" "$generation/RESULT.json" "$cohort/references" "$rubric" "$score"
"$node" "$tools/analyze-accuracy-r7.mjs" "$cohort/source/manifest.json" "$generation/RESULT.json" "$score/RESULT.json" "$score/ANALYSIS.json"
python3 "$tools/audit-r7.py" "$cohort" "$generation" "$score" "$cohort/HASH-AUDIT.json"
echo 'g03-r7-finalized'
