#!/usr/bin/env bash
set -euo pipefail

# Produce raw, identity-bound serving evidence. Import and fleet projection run
# through the repository's central Cargo workspace after retrieval.
require_env() {
  if [[ -z "${!1:-}" ]]; then
    echo "missing required environment variable: $1" >&2
    exit 2
  fi
}
for name in MODEL_PATH MODEL_PROFILE_ID WEIGHTS_ARTIFACT_BYTES TOKENIZER_DIGEST IMAGE_CONFIG_DIGEST; do
  require_env "$name"
done

VLLM_BIN="${VLLM_BIN:-vllm}"
TOKENIZER_PATH="${TOKENIZER_PATH:-$MODEL_PATH}"
MODEL_REVISION="${MODEL_REVISION:-9d1823d2dee688a6b25e77009dc727688c44936e}"
SERVED_MODEL_NAME="${SERVED_MODEL_NAME:-define-qwen35-35b-a3b-fp8}"
IMAGE_MANIFEST_DIGEST="${IMAGE_MANIFEST_DIGEST:-7fdd5424d42f9f181c8e3d9994db43966c2106293e2b895f8c8b485ab15adbe0}"
OUTPUT_ROOT="${OUTPUT_ROOT:-/workspace/define-capacity/raw-$(date -u +%Y%m%dT%H%M%SZ)}"
RUN_PREFIX_CACHE="${RUN_PREFIX_CACHE:-0}"
CONCURRENCY_POINTS="${CONCURRENCY_POINTS:-1 2 4 8 16 24 32 48 64}"
REPETITIONS="${REPETITIONS:-2}"
PORT="${PORT:-8000}"
READY_TIMEOUT="${READY_TIMEOUT:-900}"
SERVER_PID=""
SAMPLER_PID=""

stop_sampler() {
  if [[ -n "$SAMPLER_PID" ]] && kill -0 "$SAMPLER_PID" 2>/dev/null; then
    kill "$SAMPLER_PID" 2>/dev/null || true
    wait "$SAMPLER_PID" 2>/dev/null || true
  fi
  SAMPLER_PID=""
}
stop_server() {
  stop_sampler
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  SERVER_PID=""
}
trap stop_server EXIT INT TERM

mkdir "$OUTPUT_ROOT"
VLLM_VERSION="$(python3 -c 'import vllm; print(vllm.__version__)')"
if [[ ! "$VLLM_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-].*)?$ ]]; then
  echo "vLLM must report a semantic version" >&2
  exit 3
fi
if [[ ! -d "$MODEL_PATH" || ! -d "$TOKENIZER_PATH" ]]; then
  echo "model and tokenizer paths must be local directories" >&2
  exit 3
fi
BENCH_HELP="$($VLLM_BIN bench serve --help)"
for flag in prefix_repetition save-detailed tokenizer max-concurrency; do
  if ! grep -q -- "$flag" <<<"$BENCH_HELP"; then
    echo "vLLM benchmark capability missing: $flag" >&2
    exit 3
  fi
done
SERVER_HELP="$($VLLM_BIN serve --help)"
for flag in max-model-len max-num-seqs reasoning-parser enable-chunked-prefill; do
  if ! grep -q -- "$flag" <<<"$SERVER_HELP"; then
    echo "vLLM server capability missing: $flag" >&2
    exit 3
  fi
done
if nvidia-smi --query-compute-apps=pid --format=csv,noheader,nounits | grep -q '[0-9]'; then
  echo "unrelated GPU process present before server start" >&2
  exit 4
fi

RUNTIME_SNAPSHOT="$OUTPUT_ROOT/runtime-snapshot.txt"
{
  printf 'vllm_path=%s\n' "$(command -v "$VLLM_BIN")"
  printf 'vllm_sha256=%s\n' "$(sha256sum "$(command -v "$VLLM_BIN")" | awk '{print $1}')"
  "$VLLM_BIN" --version
  printf 'python_path=%s\n' "$(command -v python3)"
  python3 --version
  python3 -m pip freeze
  python3 -c 'import torch; print("torch=" + torch.__version__); print("torch_cuda=" + str(torch.version.cuda))'
} >"$RUNTIME_SNAPSHOT"
RUNTIME_DIGEST="$(sha256sum "$RUNTIME_SNAPSHOT" | awk '{print $1}')"
EXECUTION_SNAPSHOT="$OUTPUT_ROOT/execution-snapshot.txt"
{
  uname -a
  sed -n '1,80p' /etc/os-release
  nvidia-smi
  nvidia-smi --query-gpu=uuid,name,memory.total,driver_version --format=csv,noheader,nounits
  lscpu
  sed -n '1,40p' /proc/meminfo
} >"$EXECUTION_SNAPSHOT"
EXECUTION_SNAPSHOT_DIGEST="$(sha256sum "$EXECUTION_SNAPSHOT" | awk '{print $1}')"
CONTAINER_DIGEST="$IMAGE_MANIFEST_DIGEST"
ADAPTER_DIGEST="$(sha256sum "$0" | awk '{print $1}')"
GPU_UUID="$(nvidia-smi --query-gpu=uuid --format=csv,noheader,nounits -i 0 | tr -d '[:space:]')"
export MODEL_REVISION VLLM_VERSION RUNTIME_DIGEST CONTAINER_DIGEST EXECUTION_SNAPSHOT_DIGEST ADAPTER_DIGEST GPU_UUID

sample_gpu() {
  local destination="$1"
  while true; do
    local timestamp values used total
    timestamp="$(date +%s%3N)"
    values="$(nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits -i 0)"
    used="${values%%,*}"; total="${values##*,}"
    used="${used//[[:space:]]/}"; total="${total//[[:space:]]/}"
    printf '{"timestamp_ms":%s,"gpu_used_bytes":%s,"gpu_total_bytes":%s}\n' \
      "$timestamp" "$((used * 1024 * 1024))" "$((total * 1024 * 1024))" >>"$destination"
    sleep 1
  done
}

write_manifest() {
  local destination="$1" experiment_id="$2" technique="$3" concurrency="$4"
  local resident_prefixes="$5" start_ms="$6" end_ms="$7" idle_bytes="$8"
  local server_digest="$9" benchmark_digest="${10}" executed_digest="${11}"
  local process_digest="${12}" cache_digest="${13}"
  python3 - "$destination" "$experiment_id" "$technique" "$concurrency" \
    "$resident_prefixes" "$start_ms" "$end_ms" "$idle_bytes" "$server_digest" \
    "$benchmark_digest" "$executed_digest" "$process_digest" "$cache_digest" <<'PY'
import json, os, sys
(
    destination, experiment_id, technique, concurrency, resident_prefixes,
    start_ms, end_ms, idle_bytes, server_digest, benchmark_digest,
    executed_digest, process_digest, cache_digest,
) = sys.argv[1:]
manifest = {
    "schema": "capacity-experiment/serving-import-manifest/v1",
    "experiment_id": experiment_id,
    "model_profile_id": os.environ["MODEL_PROFILE_ID"],
    "model_revision": os.environ["MODEL_REVISION"],
    "vllm_version": os.environ["VLLM_VERSION"],
    "runtime_digest": os.environ["RUNTIME_DIGEST"],
    "container_digest": os.environ["CONTAINER_DIGEST"],
    "container_identity_kind": "declared_oci_manifest",
    "image_config_digest": os.environ["IMAGE_CONFIG_DIGEST"],
    "execution_snapshot_digest": os.environ["EXECUTION_SNAPSHOT_DIGEST"],
    "server_args_digest": server_digest,
    "benchmark_args_digest": benchmark_digest,
    "executed_args_digest": executed_digest,
    "gpu_process_snapshot_digest": process_digest,
    "tokenizer_digest": os.environ["TOKENIZER_DIGEST"],
    "adapter_digest": os.environ["ADAPTER_DIGEST"],
    "gpu_uuid": os.environ["GPU_UUID"],
    "seed": 0,
    "weight_dtype": "float8",
    "compute_dtype": "auto",
    "requested_kv_dtype": "auto",
    "kv_dtype": "unknown",
    "technique": technique,
    "context_tokens": 32768,
    "prompt_tokens": 30720,
    "response_token_budget": 2048,
    "max_concurrency": int(concurrency),
    "resident_prefixes": int(resident_prefixes),
    "observation_start_ms": int(start_ms),
    "observation_end_ms": int(end_ms),
    "weights_artifact_bytes": int(os.environ["WEIGHTS_ARTIFACT_BYTES"]),
    "idle_gpu_used_bytes": int(idle_bytes),
    "unrelated_gpu_processes_observed": False,
}
if cache_digest:
    manifest["cache_metrics_digest"] = cache_digest
with open(destination, "x", encoding="utf-8") as handle:
    json.dump(manifest, handle, indent=2, sort_keys=True)
    handle.write("\n")
PY
}

run_lane() {
  local lane="$1" technique="$2" resident_prefixes="$3"
  local lane_dir="$OUTPUT_ROOT/$lane" server_args
  mkdir -p "$lane_dir"
  server_args="$lane_dir/server-args.txt"
  {
    printf '%s\n' "$MODEL_PATH"
    printf '%s\n' --host 127.0.0.1 --port "$PORT"
    printf '%s\n' --served-model-name "$SERVED_MODEL_NAME"
    # MODEL_PATH is an exact, revision-pinned local snapshot. Passing --revision
    # here would ask vLLM to interpret a remote-repository concern unnecessarily.
    printf '%s\n' --tokenizer "$TOKENIZER_PATH"
    printf '%s\n' --dtype auto --kv-cache-dtype auto
    printf '%s\n' --max-model-len 32768 --tensor-parallel-size 1 --pipeline-parallel-size 1
    printf '%s\n' --gpu-memory-utilization 0.90 --max-num-seqs 64 --seed 0
    printf '%s\n' --trust-remote-code --reasoning-parser qwen3 --enable-chunked-prefill
    if [[ "$technique" == "prefix_cache_observed" ]]; then printf '%s\n' --enable-prefix-caching; fi
  } >"$server_args"
  mapfile -t server_argv <"$server_args"
  "$VLLM_BIN" serve "${server_argv[@]}" >"$lane_dir/server.log" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 $((READY_TIMEOUT / 2))); do
    if curl --fail --silent "http://127.0.0.1:$PORT/health" >/dev/null; then break; fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then echo "vLLM server exited before readiness" >&2; return 5; fi
    sleep 2
  done
  curl --fail --silent "http://127.0.0.1:$PORT/health" >/dev/null
  local idle_mib idle_bytes server_digest baseline_processes
  idle_mib="$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits -i 0 | tr -d '[:space:]')"
  idle_bytes="$((idle_mib * 1024 * 1024))"
  server_digest="$(sha256sum "$server_args" | awk '{print $1}')"
  baseline_processes="$lane_dir/gpu-processes-baseline.txt"
  nvidia-smi --query-compute-apps=pid,process_name,gpu_uuid --format=csv,noheader,nounits | sort >"$baseline_processes"

  "$VLLM_BIN" bench serve --backend openai --host 127.0.0.1 --port "$PORT" \
    --model "$SERVED_MODEL_NAME" --tokenizer "$TOKENIZER_PATH" --seed 0 \
    --dataset-name prefix_repetition --num-prompts 2 \
    --prefix-repetition-prefix-len 24576 --prefix-repetition-suffix-len 6144 \
    --prefix-repetition-num-prefixes 1 --prefix-repetition-output-len 2048 \
    --max-concurrency 1 --request-rate inf --ignore-eos --disable-tqdm >/dev/null
  nvidia-smi --query-compute-apps=pid,process_name,gpu_uuid --format=csv,noheader,nounits | sort >"$baseline_processes"

  local concurrency repeat prompts run_dir benchmark_args executed_args
  local benchmark_digest executed_digest process_digest start_ms end_ms cache_digest
  for concurrency in $CONCURRENCY_POINTS; do
    prompts=$((4 * concurrency)); if ((prompts < 16)); then prompts=16; fi
    for repeat in $(seq 1 "$REPETITIONS"); do
      run_dir="$lane_dir/c$(printf '%02d' "$concurrency")-r$(printf '%02d' "$repeat")"
      mkdir -p "$run_dir"
      benchmark_args="$run_dir/benchmark-args.txt"
      {
        printf '%s\n' --backend openai --host 127.0.0.1 --port "$PORT"
        printf '%s\n' --model "$SERVED_MODEL_NAME" --tokenizer "$TOKENIZER_PATH" --seed 0
        printf '%s\n' --dataset-name prefix_repetition --num-prompts "$prompts"
        printf '%s\n' --prefix-repetition-prefix-len 24576
        printf '%s\n' --prefix-repetition-suffix-len 6144
        printf '%s\n' --prefix-repetition-num-prefixes 10
        printf '%s\n' --prefix-repetition-output-len 2048
        printf '%s\n' --max-concurrency "$concurrency" --request-rate inf
        printf '%s\n' --ignore-eos --disable-tqdm --save-result --save-detailed
      } >"$benchmark_args"
      executed_args="$run_dir/executed-args.txt"
      cp "$benchmark_args" "$executed_args"
      printf '%s\n' --result-dir "$run_dir" --result-filename result.json >>"$executed_args"
      mapfile -t benchmark_argv <"$executed_args"
      nvidia-smi --query-compute-apps=pid,process_name,gpu_uuid --format=csv,noheader,nounits | sort >"$run_dir/gpu-processes.txt"
      if ! cmp -s "$baseline_processes" "$run_dir/gpu-processes.txt"; then
        echo "GPU process set changed after server readiness" >&2
        return 6
      fi
      sample_gpu "$run_dir/gpu-samples.jsonl" & SAMPLER_PID=$!
      sleep 1
      start_ms="$(date +%s%3N)"
      "$VLLM_BIN" bench serve "${benchmark_argv[@]}" >"$run_dir/benchmark.log" 2>&1
      end_ms="$(date +%s%3N)"
      nvidia-smi --query-compute-apps=pid,process_name,gpu_uuid --format=csv,noheader,nounits | sort >"$run_dir/gpu-processes-after.txt"
      if ! cmp -s "$baseline_processes" "$run_dir/gpu-processes-after.txt"; then
        echo "GPU process set changed during benchmark" >&2
        return 7
      fi
      curl --fail --silent "http://127.0.0.1:$PORT/metrics" >"$run_dir/metrics.prom"
      sleep 1; stop_sampler
      benchmark_digest="$(sha256sum "$benchmark_args" | awk '{print $1}')"
      executed_digest="$(sha256sum "$executed_args" | awk '{print $1}')"
      process_digest="$(sha256sum "$run_dir/gpu-processes.txt" | awk '{print $1}')"
      cache_digest=""
      if [[ "$technique" == "prefix_cache_observed" ]]; then cache_digest="$(sha256sum "$run_dir/metrics.prom" | awk '{print $1}')"; fi
      write_manifest "$run_dir/serving-import-manifest.json" \
        "$lane-c$concurrency-r$repeat" "$technique" "$concurrency" "$resident_prefixes" \
        "$start_ms" "$end_ms" "$idle_bytes" "$server_digest" "$benchmark_digest" \
        "$executed_digest" "$process_digest" "$cache_digest"
    done
  done
  stop_server
}

run_lane uncached uncached 0
if [[ "$RUN_PREFIX_CACHE" == "1" ]]; then run_lane prefix-cache prefix_cache_observed 10; fi
printf 'raw serving evidence: %s\n' "$OUTPUT_ROOT"
