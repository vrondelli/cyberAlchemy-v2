#!/usr/bin/env bash
# Guarded post-run G01 r6 paired analysis, independent audit, and private archive.
# Never retries a task, changes the frozen campaign, or publishes a claim.
set -euo pipefail

root=/opt/are/evolution-runtime/g01-product-replication-r6
definition=/opt/are/evolution-runtime/g01-product-replication-input-r9/DEFINITION.json
analysis=/opt/are/evolution-runtime/g01-product-replication-tools-r5/analyze-product-paired-cohort.mjs
audit=/opt/are/evolution-runtime/g01-product-replication-tools-r6/audit-campaign-r6.mjs
archive=/opt/are/evolution-runtime/g01-product-replication-tools-r4s/archive-private-campaign.mjs
node=/opt/are/evolution-runtime/g01-toolchain-r3/node
unit=are-g01-r6-campaign.service
invocation=f1662cf685654a3c9b5b51c8cd903db3

while :; do
  state=$(systemctl show "$unit" -p ActiveState --value)
  current=$(systemctl show "$unit" -p InvocationID --value)
  if [[ "$state" != active ]]; then
    result=$(systemctl show "$unit" -p Result --value)
    if [[ -n "$result" && "$result" != success ]]; then
      echo "g01-r6-finalize.runner-terminal-failure:$result" >&2
      exit 2
    fi
    break
  fi
  if [[ "$current" != "$invocation" ]]; then
    echo 'g01-r6-finalize.runner-identity-drift' >&2
    exit 2
  fi
  sleep 20
done

test "$(sha256sum "$definition" | cut -d' ' -f1)" = b8f43652066e037441f9dee0ddcdf1acbed849f63746c31595b07f1ea022a427
test "$(sha256sum "$root/CAMPAIGN-FREEZE.json" | cut -d' ' -f1)" = ca6369131496e64ef670c4cd01feada4f00538a283d452b0c4f2b2e2b0e849e6
test "$(sha256sum "$analysis" | cut -d' ' -f1)" = 459b848d91c5ac3fcb3837bc9da043ed2cefc16e90e6207a641e8f0cd14e6ef3
test "$(sha256sum "$audit" | cut -d' ' -f1)" = 32afccde459f001b761e2184a2c18f156162608a255869ffc5f1d4871cedff40
test "$(sha256sum "$archive" | cut -d' ' -f1)" = e916a4f0a1f02f16e91534de43d3a63044f9e9973d9c7f9c96420e2d0f937bdd
test "$(find "$root" -mindepth 2 -maxdepth 2 -name PAIR-RESULT.json | wc -l)" -eq 24
"$node" -e 'const fs=require("node:fs"); const r=JSON.parse(fs.readFileSync(process.argv[1])); if(r.schema_version!=="are.g01-campaign-result/v1"||r.status!=="complete"||r.rows?.length!==24)process.exit(2)' "$root/CAMPAIGN-RESULT.json"
test ! -e "$root/PRODUCT-ANALYSIS.json"
test ! -e "$root/HASH-AUDIT.json"

"$node" "$analysis" g01 "$definition" "$root" "$root/PRODUCT-ANALYSIS.json"
"$node" "$audit"

# Archive only when enough space exists even for a pessimistically uncompressed
# copy plus 512 MiB reserve. Otherwise leave all raw receipts untouched.
bytes=$(du -sb "$root" | cut -f1)
free=$(df --output=avail -B1 "$root" | tail -n 1 | tr -d ' ')
if (( free <= bytes + 536870912 )); then
  echo 'g01-r6-finalize.archive-space-deferred; analysis-and-audit-preserved'
  exit 0
fi
"$node" "$archive" g01-product-replication-r6 /opt/are/evolution-runtime g01-product-replication-r6
echo 'g01-r6-finalize.complete-private; publication-not-authorized'
