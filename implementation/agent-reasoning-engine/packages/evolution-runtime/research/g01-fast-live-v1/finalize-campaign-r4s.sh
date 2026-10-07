#!/usr/bin/env bash
# Guarded post-run G01 r4s analysis, independent audit, and private archive.
# Never alters the frozen campaign, retries a task, or publishes a claim.
set -euo pipefail

root=/opt/are/evolution-runtime/g01-product-replication-r4s
definition=/opt/are/evolution-runtime/g01-product-replication-input-r7/DEFINITION.json
analysis=/opt/are/evolution-runtime/g01-product-replication-tools-r5/analyze-product-paired-cohort.mjs
audit=/opt/are/evolution-runtime/g01-product-replication-tools-r4s/audit-campaign-r4s.mjs
archive=/opt/are/evolution-runtime/g01-product-replication-tools-r4s/archive-private-campaign.mjs
node=/opt/are/evolution-runtime/g01-toolchain-r3/node
unit=are-g01-r4s-campaign.service
invocation=42a80fcdf0de41538e92f5e848bb2aca

while :; do
  state=$(systemctl show "$unit" -p ActiveState --value)
  current=$(systemctl show "$unit" -p InvocationID --value)
  if [[ "$state" != active ]]; then
    result=$(systemctl show "$unit" -p Result --value)
    if [[ -n "$result" && "$result" != success ]]; then
      echo "g01-r4s-finalize.runner-terminal-failure:$result" >&2
      exit 2
    fi
    break
  fi
  if [[ "$current" != "$invocation" ]]; then
    echo 'g01-r4s-finalize.runner-identity-drift' >&2
    exit 2
  fi
  sleep 20
done

test "$(sha256sum "$definition" | cut -d' ' -f1)" = 9fa1749b4a2f6b8196871f7ddd3bb062cfe045f207c8d8ad553871ff4e12d67b
test "$(sha256sum "$root/CAMPAIGN-FREEZE.json" | cut -d' ' -f1)" = de9ea87b8d68816502ac1d202ca9d9378ec22098d4e8c37e33b869bf182f6e8d
test "$(sha256sum "$analysis" | cut -d' ' -f1)" = 459b848d91c5ac3fcb3837bc9da043ed2cefc16e90e6207a641e8f0cd14e6ef3
test "$(sha256sum "$audit" | cut -d' ' -f1)" = 13df1d145955869fabefab2d70a4cf2c6d8755132b1e565458d4f03551dac0ac
test "$(sha256sum "$archive" | cut -d' ' -f1)" = e916a4f0a1f02f16e91534de43d3a63044f9e9973d9c7f9c96420e2d0f937bdd
test "$(find "$root" -mindepth 2 -maxdepth 2 -name PAIR-RESULT.json | wc -l)" -eq 24
"$node" -e 'const fs=require("node:fs"); const r=JSON.parse(fs.readFileSync(process.argv[1])); if(r.schema_version!=="are.g01-campaign-result/v1"||r.status!=="complete"||r.rows?.length!==24)process.exit(2)' "$root/CAMPAIGN-RESULT.json"
test ! -e "$root/PRODUCT-ANALYSIS.json"
test ! -e "$root/HASH-AUDIT.json"

"$node" "$analysis" g01 "$definition" "$root" "$root/PRODUCT-ANALYSIS.json"
"$node" "$audit"

# The archive tool preserves the source and verifies full tar readability.
bytes=$(du -sb "$root" | cut -f1)
free=$(df --output=avail -B1 "$root" | tail -n 1 | tr -d ' ')
if (( free <= bytes + 536870912 )); then
  echo 'g01-r4s-finalize.archive-space-gate; analysis-and-audit-preserved' >&2
  exit 2
fi
"$node" "$archive" g01-product-replication-r4s /opt/are/evolution-runtime g01-product-replication-r4s
echo 'g01-r4s-finalize.complete-private; publication-not-authorized'
