#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${REPO_ROOT:-$(git -C "$script_dir" rev-parse --show-toplevel)}"
image_ref="${1:-}"

if [[ -z "$image_ref" ]]; then
  echo "usage: $0 <private-registry/image:tag>" >&2
  exit 2
fi

mkdir -p "$script_dir/build"
python3 "$script_dir/prepare_workload.py" \
  --repo-root "$repo_root" \
  --output "$script_dir/build/workload.json"

docker build \
  --label "cav2.experiment=qwen-27b-historical-microshard-runpod" \
  --tag "$image_ref" \
  "$script_dir"

if [[ "${NO_PUSH:-0}" != "1" ]]; then
  docker push "$image_ref"
fi

echo "prepared image: $image_ref"

