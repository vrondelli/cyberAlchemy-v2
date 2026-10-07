#!/usr/bin/env bash
# Guarded post-run G01 r7 analysis, independent audit, and private archive.
# Never retries a pair, alters a freeze, or publishes a claim.
set -euo pipefail

root=/opt/are/evolution-runtime/g01-product-replication-r7
definition=/opt/are/evolution-runtime/g01-product-replication-input-r10/DEFINITION.json
analysis=/opt/are/evolution-runtime/g01-product-replication-tools-r5/analyze-product-paired-cohort.mjs
audit=/opt/are/evolution-runtime/g01-product-replication-tools-r7/audit-campaign-r7.mjs
archive=/opt/are/evolution-runtime/g01-product-replication-tools-r4s/archive-private-campaign.mjs
node=/opt/are/evolution-runtime/g01-toolchain-r3/node
unit=are-g01-r7-campaign.service
invocation=5dd809c6672149dd9b9e7b8269319637

while :; do
  state=$(systemctl show "$unit" -p ActiveState --value)
  current=$(systemctl show "$unit" -p InvocationID --value)
  if [[ "$state" != active ]]; then
    result=$(systemctl show "$unit" -p Result --value)
    if [[ "$result" != success || "$current" != "$invocation" ]]; then
      echo "g01-r7-finalize.runner-terminal-failure:$result:$current" >&2
      exit 2
    fi
    break
  fi
  if [[ "$current" != "$invocation" ]]; then
    echo 'g01-r7-finalize.runner-identity-drift' >&2
    exit 2
  fi
  sleep 20
done

test "$(sha256sum "$definition" | cut -d' ' -f1)" = d0d02594dfac39104d4f3afbc0242414b5e84ea30b82ab766b438548a0594a59
test "$(sha256sum "$root/CAMPAIGN-FREEZE.json" | cut -d' ' -f1)" = 258164a3e34ce406f6074c6ec1fa7aff5130976da66e66b05d4c0ae600f6576a
test "$(sha256sum "$analysis" | cut -d' ' -f1)" = 459b848d91c5ac3fcb3837bc9da043ed2cefc16e90e6207a641e8f0cd14e6ef3
test "$(sha256sum "$audit" | cut -d' ' -f1)" = 5dd11f0cb6b7d7b806a33c453e80a9def20a48ec79c98ad38f111209de7c29f0
test "$(sha256sum "$archive" | cut -d' ' -f1)" = e916a4f0a1f02f16e91534de43d3a63044f9e9973d9c7f9c96420e2d0f937bdd
test "$(find "$root" -mindepth 2 -maxdepth 2 -name PAIR-RESULT.json | wc -l)" -eq 24
"$node" -e 'const fs=require("node:fs"); const r=JSON.parse(fs.readFileSync(process.argv[1])); if(r.schema_version!=="are.g01-campaign-result/v1"||r.status!=="complete"||r.rows?.length!==24)process.exit(2)' "$root/CAMPAIGN-RESULT.json"
test ! -e "$root/PRODUCT-ANALYSIS.json"
test ! -e "$root/HASH-AUDIT.json"

"$node" "$analysis" g01 "$definition" "$root" "$root/PRODUCT-ANALYSIS.json"
"$node" "$audit"

# Preserve the raw root if even a pessimistically uncompressed copy plus a
# 512 MiB reserve does not fit. Archival can be retried separately later.
bytes=$(du -sb "$root" | cut -f1)
free=$(df --output=avail -B1 "$root" | tail -n 1 | tr -d ' ')
if (( free <= bytes + 536870912 )); then
  echo 'g01-r7-finalize.archive-space-deferred; analysis-and-audit-preserved'
  exit 0
fi
"$node" "$archive" g01-product-replication-r7 /opt/are/evolution-runtime g01-product-replication-r7
echo 'g01-r7-finalize.complete-private; publication-not-authorized'
