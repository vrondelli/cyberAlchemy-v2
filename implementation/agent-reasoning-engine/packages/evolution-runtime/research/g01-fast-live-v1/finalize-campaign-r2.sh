#!/usr/bin/env bash
set -euo pipefail

run_pid=2938441
root=/opt/are/evolution-runtime/g01-product-replication-r2
definition=/opt/are/evolution-runtime/g01-product-replication-input-r4/DEFINITION.json
analysis=/opt/are/evolution-runtime/g01-product-replication-tools-r5/analyze-product-paired-cohort.mjs
audit=/opt/are/evolution-runtime/g01-product-replication-tools-r5/audit-campaign-r2.mjs
archive=/opt/are/evolution-runtime/g03-product-replication-code-r7/implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/archive-private-campaign.mjs
node=/opt/cyberalchemy-are-tools/node-24.10.0/node

while :; do
  state=$(ps -p "$run_pid" -o stat= 2>/dev/null || true)
  if [[ -z "$state" || "$state" == Z* ]]; then break; fi
  cmdline=$(tr '\0' ' ' < "/proc/$run_pid/cmdline" 2>/dev/null || true)
  if [[ "$cmdline" != *run-frozen-campaign-r2.mjs* ]]; then echo 'run-pid-identity-drift' >&2; exit 2; fi
  sleep 20
done

test "$(sha256sum "$definition" | cut -d' ' -f1)" = bb5cb1fb1414b694f966d0df3f0cdcae7f64f4e4316801cad0962f9b5c08574e
test "$(sha256sum "$root/CAMPAIGN-FREEZE.json" | cut -d' ' -f1)" = b43f572ddd4a4d91e6315ed48f694ddc24a5f8a9e8da9266e2d39976fac181b6
python3 -c 'import json,sys,pathlib; p=pathlib.Path(sys.argv[1]); r=json.load(open(p/"CAMPAIGN-RESULT.json")); assert r["schema_version"]=="are.g01-campaign-result/v1" and r["status"]=="complete" and len(r["rows"])==24; assert len(list(p.glob("*/PAIR-RESULT.json")))==24' "$root"
"$node" "$analysis" g01 "$definition" "$root" "$root/PRODUCT-ANALYSIS.json"
"$node" "$audit"

free_gib=$(df -BG --output=avail /opt/are/evolution-runtime | tail -1 | tr -dc '0-9')
if [[ "$free_gib" -lt 15 ]]; then echo "archive-deferred-low-space:${free_gib}GiB" >&2; exit 3; fi
"$node" "$archive" g01-product-replication-r2 /opt/are/evolution-runtime g01-product-replication-input-r4 g01-product-replication-preflight-r2 g01-product-replication-r2
echo 'g01-r2-finalized'
