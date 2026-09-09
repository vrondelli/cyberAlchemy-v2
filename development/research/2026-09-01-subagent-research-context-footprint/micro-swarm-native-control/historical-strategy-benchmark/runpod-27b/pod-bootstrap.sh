#!/usr/bin/env bash
set -euo pipefail

experiment_root="${EXPERIMENT_ROOT:-/opt/experiment}"
hf_home="${HF_HOME:-/workspace/rwo/hf-cache}"
results_root="${RESULTS_ROOT:-/workspace/rwo/results}"
counter_file="${API_BASE_COUNTER_FILE:-/tmp/cav2-rwo-api-base.counter}"
port_0="${API_PORT_0:-8000}"
port_1="${API_PORT_1:-8002}"
api_bases="http://127.0.0.1:${port_0}/v1,http://127.0.0.1:${port_1}/v1"
receipt_path="${POD_BOOTSTRAP_RECEIPT:-$results_root/bootstrap-receipt.json}"

case "$counter_file" in
  /tmp/*) ;;
  *) echo "API_BASE_COUNTER_FILE must be under /tmp" >&2; exit 2 ;;
esac
if [[ "$port_0" == "$port_1" ]]; then
  echo "API_PORT_0 and API_PORT_1 must differ" >&2
  exit 2
fi

mkdir -p "$hf_home" "$results_root" "$(dirname -- "$receipt_path")"
export HF_HOME="$hf_home"
export RESULTS_ROOT="$results_root"
export API_BASES="$api_bases"
export API_BASE_STRATEGY=round-robin
export API_BASE_COUNTER_FILE="$counter_file"
export VLLM_USE_FLASHINFER_SAMPLER=0
printf '0\n' > "$counter_file"

write_receipt() {
  local status="$1"
  BOOTSTRAP_STATUS="$status" BOOTSTRAP_RECEIPT="$receipt_path" BOOTSTRAP_API_BASES="$api_bases" \
  BOOTSTRAP_HF_HOME="$hf_home" BOOTSTRAP_RESULTS_ROOT="$results_root" \
  BOOTSTRAP_COUNTER_FILE="$counter_file" BOOTSTRAP_PORT_0="$port_0" \
  BOOTSTRAP_PORT_1="$port_1" python3 - <<'PY'
import json
import os
from pathlib import Path

receipt = {
    "schema_version": "cav2.runpod-2gpu-bootstrap-receipt.v1",
    "status": os.environ["BOOTSTRAP_STATUS"],
    "replicas": [
        {"gpu": 0, "port": int(os.environ["BOOTSTRAP_PORT_0"]), "cuda_visible_devices": "0"},
        {"gpu": 1, "port": int(os.environ["BOOTSTRAP_PORT_1"]), "cuda_visible_devices": "1"},
    ],
    "api_bases": os.environ["BOOTSTRAP_API_BASES"].split(","),
    "api_base_strategy": "round-robin",
    "api_base_counter_file": os.environ["BOOTSTRAP_COUNTER_FILE"],
    "vllm_use_flashinfer_sampler": "0",
    "persistent_paths": [os.environ["BOOTSTRAP_HF_HOME"], os.environ["BOOTSTRAP_RESULTS_ROOT"]],
    "external_effect_executed": False,
    "authority_effect": "none",
}
Path(os.environ["BOOTSTRAP_RECEIPT"]).write_text(
    json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(receipt, indent=2))
PY
}

if [[ "${POD_BOOTSTRAP_SIMULATE:-0}" == "1" ]]; then
  write_receipt simulated
  exit 0
fi

for command in vllm curl nvidia-smi; do
  command -v "$command" >/dev/null 2>&1 || { echo "$command is required" >&2; exit 1; }
done
if [[ "$(nvidia-smi --query-gpu=index --format=csv,noheader | wc -l)" -lt 2 ]]; then
  echo "two GPUs are required" >&2
  exit 1
fi

log_0="$results_root/vllm-gpu0-8000.log"
log_1="$results_root/vllm-gpu1-8002.log"
cleanup() {
  local exit_code=$?
  kill "${server_0_pid:-}" "${server_1_pid:-}" 2>/dev/null || true
  wait "${server_0_pid:-}" "${server_1_pid:-}" 2>/dev/null || true
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

common_args=(
  serve "${MODEL_ID:-Qwen/Qwen3.8-27B-FP8}"
  --host 127.0.0.1
  --served-model-name "${SERVED_MODEL_NAME:-qwen-27b-microshard}"
  --tensor-parallel-size 1
  --max-model-len "${MAX_MODEL_LEN:-16384}"
  --max-num-seqs "${MAX_NUM_SEQS_PER_REPLICA:-16}"
  --gpu-memory-utilization "${GPU_MEMORY_UTILIZATION:-0.90}"
  --kv-cache-dtype "${KV_CACHE_DTYPE:-auto}"
  --enable-chunked-prefill
)
CUDA_VISIBLE_DEVICES=0 vllm "${common_args[@]}" --port "$port_0" > "$log_0" 2>&1 &
server_0_pid=$!
CUDA_VISIBLE_DEVICES=1 vllm "${common_args[@]}" --port "$port_1" > "$log_1" 2>&1 &
server_1_pid=$!

ready_deadline=$((SECONDS + ${SERVER_READY_TIMEOUT_SECONDS:-3600}))
for endpoint in "http://127.0.0.1:${port_0}/health" "http://127.0.0.1:${port_1}/health"; do
  until curl --fail --silent "$endpoint" >/dev/null; do
    if ! kill -0 "$server_0_pid" 2>/dev/null || ! kill -0 "$server_1_pid" 2>/dev/null; then
      echo "a vLLM replica exited before readiness; inspect $log_0 and $log_1" >&2
      exit 1
    fi
    if (( SECONDS >= ready_deadline )); then
      echo "dual-replica readiness deadline exceeded" >&2
      exit 1
    fi
    sleep 2
  done
done
write_receipt ready

if [[ $# -gt 0 ]]; then
  "$@"
elif [[ "${AGENT_CLI_ONLY:-0}" == "1" ]]; then
  echo "two structured-agent replicas ready at $API_BASES"
  wait "$server_0_pid" "$server_1_pid"
else
  run_id="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
  run_dir="$results_root/$run_id"
  mkdir -p "$run_dir"
  python3 "$experiment_root/run_experiment.py" \
    --workload "$experiment_root/workload.json" \
    --output "$run_dir" \
    --api-bases "$API_BASES"
  python3 "$experiment_root/summarize_run.py" \
    --run-dir "$run_dir" \
    --output "$run_dir/summary.json"
  echo "dual-GPU experiment complete: $run_dir"
fi
