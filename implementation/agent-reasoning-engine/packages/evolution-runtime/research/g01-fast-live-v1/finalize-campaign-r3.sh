#!/usr/bin/env bash
# Wait for the exact frozen runner, then analyze and independently audit. No archive or publication.
set -euo pipefail

run_pid=302715
root=/opt/are/evolution-runtime/g01-product-replication-r3
definition=/opt/are/evolution-runtime/g01-product-replication-input-r5/DEFINITION.json
analysis=/opt/are/evolution-runtime/g01-product-replication-tools-r5/analyze-product-paired-cohort.mjs
audit=/opt/are/evolution-runtime/g01-product-replication-tools-r3/audit-campaign-r3.mjs
node=/opt/are/evolution-runtime/g01-toolchain-r3/node

while :; do
  state=$(ps -p "$run_pid" -o stat= 2>/dev/null || true)
  if [[ -z "$state" || "$state" == Z* ]]; then break; fi
  cmdline=$(tr '\0' ' ' < "/proc/$run_pid/cmdline" 2>/dev/null || true)
  if [[ "$cmdline" != *run-frozen-campaign-r2.mjs* || "$cmdline" != *"$root/CAMPAIGN-FREEZE.json"* ]]; then
    echo 'run-pid-identity-drift' >&2
    exit 2
  fi
  sleep 20
done

test "$(sha256sum "$definition" | cut -d' ' -f1)" = b5a29ece7386c037a9b2e5e36410179f93d80c52e42b20a6e75caa743a74e2bd
test "$(sha256sum "$root/CAMPAIGN-FREEZE.json" | cut -d' ' -f1)" = 7ddf069e96cb6cf1610da5f21efaf747de152cb1aa597286e5f3b4666555b4bb
test "$(sha256sum "$analysis" | cut -d' ' -f1)" = 459b848d91c5ac3fcb3837bc9da043ed2cefc16e90e6207a641e8f0cd14e6ef3
python3 -c 'import json,sys,pathlib; p=pathlib.Path(sys.argv[1]); r=json.load(open(p/"CAMPAIGN-RESULT.json")); assert r["schema_version"]=="are.g01-campaign-result/v1" and r["status"]=="complete" and len(r["rows"])==24; assert len(list(p.glob("*/PAIR-RESULT.json")))==24' "$root"
"$node" "$analysis" g01 "$definition" "$root" "$root/PRODUCT-ANALYSIS.json"
"$node" "$audit"
echo 'g01-r3-analyzed-and-audited; archive-deferred-for-space-review'
