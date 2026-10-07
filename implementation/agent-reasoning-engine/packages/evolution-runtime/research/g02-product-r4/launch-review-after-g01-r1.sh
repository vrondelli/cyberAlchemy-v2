#!/usr/bin/env bash
# Dispatch exposed-only G02 reviewer after the exact G01 r6 campaign is audited.
set -euo pipefail

campaign=are-g01-r6-campaign.service
campaign_invocation=f1662cf685654a3c9b5b51c8cd903db3
finalizer=are-g01-r6-finalize.service
finalizer_invocation=5e31bd6947124b16bd85d196bf8d97e2
root=/opt/are/evolution-runtime/g02-r4-reviewer-development-r2
script=/opt/are/evolution-runtime/g02-r4-reviewer-tools-r2/run-receipt-review-r2.mjs
node=/opt/are/evolution-runtime/g01-toolchain-r3/node

while [[ "$(systemctl show "$campaign" -p ActiveState --value)" == active ]]; do
  [[ "$(systemctl show "$campaign" -p InvocationID --value)" == "$campaign_invocation" ]] || exit 2
  sleep 20
done
[[ "$(systemctl show "$campaign" -p Result --value)" == success ]] || exit 2

while [[ "$(systemctl show "$finalizer" -p ActiveState --value)" == active ]]; do
  [[ "$(systemctl show "$finalizer" -p InvocationID --value)" == "$finalizer_invocation" ]] || exit 2
  sleep 20
done
[[ "$(systemctl show "$finalizer" -p Result --value)" == success ]] || exit 2
[[ -f /opt/are/evolution-runtime/g01-product-replication-r6/HASH-AUDIT.json ]] || exit 2
[[ "$(sha256sum "$script" | cut -d' ' -f1)" == caed753eff56b15c342bab85f5d416553257189912146570d6d59724d4e131b3 ]] || exit 2
[[ "$(sha256sum "$root/FREEZE.json" | cut -d' ' -f1)" == 7e5b762eb749174a8a5566f98be5e92e7b0b5ca29a537e56cf36064682b72039 ]] || exit 2
free=$(df --output=avail -B1 "$root" | tail -n 1 | tr -d ' ')
(( free > 1073741824 )) || { echo "g02-r4-reviewer-r2.insufficient-space:$free" >&2; exit 2; }

"$node" "$script" run
