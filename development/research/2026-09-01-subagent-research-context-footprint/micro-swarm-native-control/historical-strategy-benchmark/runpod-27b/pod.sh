#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
action="simulate"
execute=0
image_ref="registry.example/private/qwen-27b-microshard:candidate"
receipt_path="${POD_RECEIPT_PATH:-./pod-simulation-receipt.json}"
gpu_id="${RUNPOD_GPU_ID:-NVIDIA RTX PRO 6000 Blackwell Server Edition}"
gpu_count=2
template_name="${RUNPOD_TEMPLATE_NAME:-qwen-27b-rwo-2gpu}"
pod_name="${RUNPOD_POD_NAME:-qwen-27b-rwo-2gpu}"
template_state_file="${RUNPOD_TEMPLATE_STATE_FILE:-$script_dir/.runpod-template-id}"
template_id="${RUNPOD_TEMPLATE_ID:-}"
pod_id="${RUNPOD_POD_ID:-<pod-id>}"
if [[ -n "${RUNPOD_STOP_AFTER:-}" ]]; then
  stop_after="$RUNPOD_STOP_AFTER"
else
  stop_after_hours="${RUNPOD_STOP_AFTER_HOURS:-1}"
  if [[ ! "$stop_after_hours" =~ ^[1-9][0-9]*$ ]]; then
    echo "RUNPOD_STOP_AFTER_HOURS must be a positive integer" >&2
    exit 2
  fi
  stop_after="$(date -u -d "+${stop_after_hours} hours" '+%Y-%m-%dT%H:%M:%SZ')"
fi

usage() {
  echo "usage: $0 [simulate|template-create|up|down] [--execute] [--image IMAGE] [--receipt PATH]" >&2
}

if [[ $# -gt 0 && "$1" != --* ]]; then
  action="$1"
  shift
fi
while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) execute=1; shift ;;
    --image) image_ref="${2:?--image requires a value}"; shift 2 ;;
    --receipt) receipt_path="${2:?--receipt requires a value}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

case "$action" in
  simulate|template-create|up|down) ;;
  *) usage; echo "unknown action: $action" >&2; exit 2 ;;
esac
if [[ "$action" == "simulate" && "$execute" == 1 ]]; then
  echo "simulate is always non-effectful; omit --execute" >&2
  exit 2
fi
if [[ "$action" != "simulate" && "$execute" != 1 ]]; then
  echo "$action requires explicit --execute; run simulate to inspect commands" >&2
  exit 3
fi
if [[ "$action" == "up" && -z "$template_id" && -s "$template_state_file" ]]; then
  template_id="$(head -n 1 "$template_state_file" | tr -d '[:space:]')"
fi
if [[ -n "$template_id" && ! "$template_id" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "resolved RunPod template ID is malformed" >&2
  exit 2
fi
template_id="${template_id:-<template-id>}"

env_json='{"HF_HOME":"/workspace/rwo/hf-cache","RESULTS_ROOT":"/workspace/rwo/results","API_BASES":"http://127.0.0.1:8000/v1,http://127.0.0.1:8002/v1","API_BASE_STRATEGY":"round-robin","API_BASE_COUNTER_FILE":"/tmp/cav2-rwo-api-base.counter","VLLM_USE_FLASHINFER_SAMPLER":"0","MAX_OUTPUT_TOKENS_EXTRACTOR":"3600","MAX_OUTPUT_TOKENS_REDUCER":"6000","MAX_OUTPUT_TOKENS_SYNTHESIZER":"5000","MAX_OUTPUT_TOKENS_JUDGE":"4096","GLOBAL_DEADLINE_SECONDS":"300"}'
template_command=(
  runpodctl template create
  --name "$template_name"
  --image "$image_ref"
  --container-disk-in-gb "${RUNPOD_CONTAINER_DISK_GB:-40}"
  --volume-in-gb "${RUNPOD_VOLUME_GB:-200}"
  --volume-mount-path /workspace
  --ports "8000/http,8002/http"
  --env "$env_json"
  --docker-start-cmd /opt/experiment/pod-bootstrap.sh
)
up_command=(
  runpodctl pod create
  --name "$pod_name"
  --gpu-id "$gpu_id"
  --gpu-count "$gpu_count"
  --template-id "$template_id"
  --cloud-type "${RUNPOD_CLOUD_TYPE:-SECURE}"
  --stop-after "$stop_after"
)
down_command=(runpodctl pod stop "$pod_id")
if [[ -n "${RUNPOD_NETWORK_VOLUME_ID:-}" ]]; then
  up_command+=(--network-volume-id "$RUNPOD_NETWORK_VOLUME_ID")
fi

printf -v template_text '%q ' "${template_command[@]}"
printf -v up_text '%q ' "${up_command[@]}"
printf -v down_text '%q ' "${down_command[@]}"
selected_text=""
case "$action" in
  template-create) selected_text="$template_text" ;;
  up) selected_text="$up_text" ;;
  down) selected_text="$down_text" ;;
esac

receipt_dir="$(dirname -- "$receipt_path")"
mkdir -p "$receipt_dir"
POD_ACTION="$action" POD_EXECUTE="$execute" POD_GPU_ID="$gpu_id" POD_GPU_COUNT="$gpu_count" \
POD_IMAGE_REF="$image_ref" POD_TEMPLATE_COMMAND="$template_text" POD_UP_COMMAND="$up_text" \
POD_DOWN_COMMAND="$down_text" POD_SELECTED_COMMAND="$selected_text" POD_STOP_AFTER="$stop_after" \
POD_TEMPLATE_STATE_FILE="$template_state_file" python3 - "$receipt_path" <<'PY'
import json
import os
import sys
from pathlib import Path

receipt = {
    "schema_version": "cav2.runpod-2gpu-simulation-receipt.v1",
    "status": "simulated" if os.environ["POD_ACTION"] == "simulate" else "execution-authorized",
    "action": os.environ["POD_ACTION"],
    "external_effect_executed": False,
    "gpu_id": os.environ["POD_GPU_ID"],
    "gpu_count": int(os.environ["POD_GPU_COUNT"]),
    "ports": [8000, 8002],
    "image": os.environ["POD_IMAGE_REF"],
    "persistent_paths": ["/workspace/rwo/hf-cache", "/workspace/rwo/results"],
    "api_bases": ["http://127.0.0.1:8000/v1", "http://127.0.0.1:8002/v1"],
    "api_base_strategy": "round-robin",
    "api_base_counter_file": "/tmp/cav2-rwo-api-base.counter",
    "stop_after": os.environ["POD_STOP_AFTER"],
    "template_state_file": os.environ["POD_TEMPLATE_STATE_FILE"],
    "output_token_ceilings": {
        "extractor": 3600,
        "reducer": 6000,
        "synthesizer": 5000,
        "judge": 4096,
    },
    "commands": {
        "template_create": os.environ["POD_TEMPLATE_COMMAND"].strip(),
        "up": os.environ["POD_UP_COMMAND"].strip(),
        "down": os.environ["POD_DOWN_COMMAND"].strip(),
    },
    "selected_command": os.environ["POD_SELECTED_COMMAND"].strip() or None,
    "authority_effect": "none",
    "claim_ceiling": "Candidate command plan only; no template, pod, deployment, or conformance claim.",
}
path = Path(sys.argv[1])
path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps(receipt, indent=2))
PY

if [[ "$action" == "simulate" ]]; then
  exit 0
fi
if ! command -v runpodctl >/dev/null 2>&1; then
  echo "runpodctl is required for --execute" >&2
  exit 1
fi
if [[ "$action" == "up" && "$template_id" == "<template-id>" ]]; then
  echo "RUNPOD_TEMPLATE_ID is required for up --execute" >&2
  exit 2
fi
if [[ "$action" == "down" && "$pod_id" == "<pod-id>" ]]; then
  echo "RUNPOD_POD_ID is required for down --execute" >&2
  exit 2
fi

executed_template_id=""
case "$action" in
  template-create)
    set +e
    template_response="$("${template_command[@]}" 2>&1)"
    template_status=$?
    set -e
    printf '%s\n' "$template_response"
    if [[ "$template_status" -ne 0 ]]; then
      exit "$template_status"
    fi
    if ! executed_template_id="$(printf '%s' "$template_response" | python3 -c '
import json, re, sys
value = json.load(sys.stdin)
template_id = value.get("id") or value.get("templateId") if isinstance(value, dict) else None
if not isinstance(template_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]+", template_id):
    raise SystemExit("template response has no valid id or templateId")
print(template_id)
')"; then
      TEMPLATE_RESPONSE="$template_response" python3 - "$receipt_path" <<'PY'
import hashlib
import json
import os
import sys
from pathlib import Path

path = Path(sys.argv[1])
receipt = json.loads(path.read_text(encoding="utf-8"))
receipt["status"] = "template-response-invalid"
receipt["template_response_sha256"] = hashlib.sha256(
    os.environ["TEMPLATE_RESPONSE"].encode("utf-8")
).hexdigest()
path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
PY
      echo "template response left visible above; no template ID was persisted" >&2
      exit 1
    fi
    mkdir -p "$(dirname -- "$template_state_file")"
    printf '%s\n' "$executed_template_id" > "$template_state_file"
    chmod 0600 "$template_state_file"
    ;;
  up) "${up_command[@]}" ;;
  down) "${down_command[@]}" ;;
esac

python3 - "$receipt_path" "$executed_template_id" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
receipt = json.loads(path.read_text(encoding="utf-8"))
receipt["status"] = "executed"
receipt["external_effect_executed"] = True
if sys.argv[2]:
    receipt["persisted_template_id"] = sys.argv[2]
path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
PY
