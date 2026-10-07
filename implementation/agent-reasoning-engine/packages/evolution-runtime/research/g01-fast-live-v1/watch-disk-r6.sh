#!/usr/bin/env bash
# Stop only the exact r6 campaign if VPS free space falls below the hard floor.
set -euo pipefail

unit=are-g01-r6-campaign.service
invocation=f1662cf685654a3c9b5b51c8cd903db3
root=/opt/are/evolution-runtime/g01-product-replication-r6
floor=536870912

while :; do
  state=$(systemctl show "$unit" -p ActiveState --value)
  [[ "$state" == active ]] || exit 0
  current=$(systemctl show "$unit" -p InvocationID --value)
  if [[ "$current" != "$invocation" ]]; then
    echo 'g01-r6-disk-watch.campaign-identity-drift' >&2
    exit 2
  fi
  free=$(df --output=avail -B1 "$root" | tail -n 1 | tr -d ' ')
  if (( free < floor )); then
    echo "g01-r6-disk-watch.floor-crossed:$free; stopping exact campaign" >&2
    systemctl stop "$unit"
    exit 2
  fi
  sleep 20
done
