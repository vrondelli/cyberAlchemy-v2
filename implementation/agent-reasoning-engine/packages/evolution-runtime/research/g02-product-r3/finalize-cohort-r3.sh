#!/usr/bin/env bash
set -euo pipefail

run_pid=2970927
root=/opt/are/evolution-runtime/g02-product-replication-r3
tools=/opt/are/evolution-runtime/g02-product-replication-tools-r3
archive=/opt/are/evolution-runtime/g03-product-replication-code-r7/implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/archive-private-campaign.mjs
node=/opt/cyberalchemy-are-tools/node-24.10.0/node

while :; do
  state=$(ps -p "$run_pid" -o stat= 2>/dev/null || true)
  if [[ -z "$state" || "$state" == Z* ]]; then break; fi
  cmdline=$(tr '\0' ' ' < "/proc/$run_pid/cmdline" 2>/dev/null || true)
  if [[ "$cmdline" != *run-cohort-r3.mjs* ]]; then echo 'run-pid-identity-drift' >&2; exit 2; fi
  sleep 20
done

test "$(sha256sum "$root/COHORT.json" | cut -d' ' -f1)" = 1e52964909d99f456165653d81c4c41a14a3d9d804f078caa52a4d808d463a49
test "$(sha256sum "$root/EXECUTION-PLAN.json" | cut -d' ' -f1)" = 0ccc9f027000682bbe950e8d8561ff150714aeb9610608149b0c26e4d41da53a
test "$(sha256sum "$tools/analyze-product-paired-cohort-r3.mjs" | cut -d' ' -f1)" = d59dc9742b6a737082256bf69971ca4b5e3adb4f6206b80e2c49362f145123dd
python3 -c 'import json,sys; r=json.load(open(sys.argv[1])); assert r["schema_version"]=="are.g02-product-replication-driver/v1" and r["status"]=="completed-dispatch" and len(r["remaining_outcomes"])==12' "$root/DRIVER-RESULT.json"
"$node" "$tools/analyze-product-paired-cohort-r3.mjs" g02 "$root/EXECUTION-PLAN.json" "$root/DRIVER-RESULT.json" "$root/PRODUCT-ANALYSIS.json"

free_gib=$(df -BG --output=avail /opt/are/evolution-runtime | tail -1 | tr -dc '0-9')
if [[ "$free_gib" -lt 20 ]]; then echo "archive-deferred-low-space:${free_gib}GiB" >&2; exit 3; fi
mapfile -t names < <("$node" -e 'const p=JSON.parse(require("fs").readFileSync(process.argv[1])); for(const row of p.ordered_pairs){if(!row.root.startsWith("/opt/are-benchmark-runs/"))throw Error("archive-root");console.log(row.root.split("/").at(-1))}' "$root/EXECUTION-PLAN.json")
test "${#names[@]}" -eq 12
"$node" "$archive" g02-product-replication-r3 /opt/are-benchmark-runs "${names[@]}"
"$node" "$archive" g02-product-replication-r3-manifest /opt/are/evolution-runtime g02-product-replication-r3
echo 'g02-r3-finalized'
