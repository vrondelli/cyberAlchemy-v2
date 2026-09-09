#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if (( $# < 3 || $# > 4 )); then
  echo "usage: $0 <extractor|reducer|synthesizer|judge> <role-id> <input-file|-> [output-file|-]" >&2
  exit 2
fi

exec python3 "$script_dir/structured_agent.py" "$@"
