#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
image_ref="${1:-}"
if [[ -z "$image_ref" ]]; then
  echo "usage: $0 <private-registry/image:tag>" >&2
  exit 2
fi
if [[ "${RUNPOD_DEPLOY:-0}" == "1" ]]; then
  echo "RUNPOD_DEPLOY is retired; use pod.sh up --execute after creating a template" >&2
  exit 2
fi
exec "$script_dir/pod.sh" simulate --image "$image_ref"
