#!/usr/bin/env bash
set -euo pipefail

experiment_root="/opt/experiment"
results_root="${RESULTS_ROOT:-/workspace/results}"
run_id="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
run_dir="$results_root/$run_id"
api_port="${API_PORT:-8000}"
server_log="$run_dir/vllm-server.log"
gpu_log="$run_dir/gpu.csv"

mkdir -p "$run_dir" "${HF_HOME:-/workspace/hf-cache}"
cp "$experiment_root/experiment.json" "$run_dir/experiment.json"
cp "$experiment_root/workload.json" "$run_dir/workload.json"

cleanup() {
  local exit_code=$?
  if [[ -n "${monitor_pid:-}" ]]; then kill "$monitor_pid" 2>/dev/null || true; fi
  if [[ -n "${server_pid:-}" ]]; then kill "$server_pid" 2>/dev/null || true; fi
  wait "${monitor_pid:-}" 2>/dev/null || true
  wait "${server_pid:-}" 2>/dev/null || true
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

(
  echo "timestamp_utc,index,name,memory_used_mib,memory_total_mib,utilization_gpu_percent,power_draw_w"
  while true; do
    timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    nvidia-smi --query-gpu=index,name,memory.used,memory.total,utilization.gpu,power.draw \
      --format=csv,noheader,nounits | sed "s/^/$timestamp,/" || true
    sleep 1
  done
) > "$gpu_log" &
monitor_pid=$!

python3 -m pip show vllm > "$run_dir/vllm-version.txt" 2>&1 || true
nvidia-smi -q > "$run_dir/nvidia-smi.txt" 2>&1 || true

vllm serve "${MODEL_ID:-Qwen/Qwen3.8-27B-FP8}" \
  --host 127.0.0.1 \
  --port "$api_port" \
  --served-model-name "${SERVED_MODEL_NAME:-qwen-27b-microshard}" \
  --tensor-parallel-size "${TENSOR_PARALLEL_SIZE:-1}" \
  --max-model-len "${MAX_MODEL_LEN:-16384}" \
  --max-num-seqs "${MAX_NUM_SEQS:-32}" \
  --gpu-memory-utilization "${GPU_MEMORY_UTILIZATION:-0.90}" \
  --kv-cache-dtype "${KV_CACHE_DTYPE:-auto}" \
  --enable-chunked-prefill > "$server_log" 2>&1 &
server_pid=$!

ready_deadline=$((SECONDS + ${SERVER_READY_TIMEOUT_SECONDS:-3600}))
until curl --fail --silent "http://127.0.0.1:$api_port/health" >/dev/null; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "vLLM exited before becoming ready; inspect $server_log" >&2
    exit 1
  fi
  if (( SECONDS >= ready_deadline )); then
    echo "vLLM readiness deadline exceeded; inspect $server_log" >&2
    exit 1
  fi
  sleep 2
done

if [[ "${AGENT_CLI_ONLY:-0}" == "1" ]]; then
  echo "structured-agent CLI ready: /opt/experiment/agent.sh <contract> <role-id> <input-file|-> [output-file|-]"
  wait "$server_pid"
  exit $?
fi

python3 "$experiment_root/run_experiment.py" \
  --workload "$experiment_root/workload.json" \
  --output "$run_dir" \
  --api-base "http://127.0.0.1:$api_port/v1"

python3 "$experiment_root/summarize_run.py" \
  --run-dir "$run_dir" \
  --output "$run_dir/summary.json"

echo "experiment complete: $run_dir"
