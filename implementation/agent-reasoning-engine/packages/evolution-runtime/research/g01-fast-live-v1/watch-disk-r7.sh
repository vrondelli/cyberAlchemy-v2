#!/usr/bin/env bash
# Stop only the exact G01 r7 invocation if the VPS crosses the hard free-space floor.
set -euo pipefail

unit=are-g01-r7-campaign.service
invocation=5dd809c6672149dd9b9e7b8269319637
root=/opt/are/evolution-runtime/g01-product-replication-r7
floor=536870912

while :; do
  state=$(systemctl show "$unit" -p ActiveState --value)
  [[ "$state" == active ]] || exit 0
  current=$(systemctl show "$unit" -p InvocationID --value)
  if [[ "$current" != "$invocation" ]]; then
    echo 'g01-r7-disk-watch.campaign-identity-drift' >&2
    exit 2
  fi
  free=$(df --output=avail -B1 "$root" | tail -n 1 | tr -d ' ')
  if (( free < floor )); then
    echo "g01-r7-disk-watch.floor-crossed:$free; stopping exact campaign" >&2
    systemctl stop "$unit"
    exit 2
  fi
  sleep 20
done
