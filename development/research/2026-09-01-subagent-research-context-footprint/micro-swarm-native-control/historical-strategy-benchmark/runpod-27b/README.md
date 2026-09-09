# RunPod 27B micro-shard experiment

Status: prepared, not run
Authority effect: none

This package turns the frozen historical micro-shard benchmark into a two-GPU
RunPod container. Two independent `Qwen/Qwen3.8-27B-FP8` vLLM replicas execute:

```text
27 extractors -> 9 reducers -> 3 synthesizers -> 3 blinded local judges
```

The judges compare each new 27B synthesis with the already-frozen Sol baseline
against the withheld historical result. Gold and baseline bytes are unavailable
to extractors, reducers, and synthesizers. Local-model judging is provisional;
it is useful for the deployment canary but is not an independent Sol verdict.

## Hardware

The candidate template requests exactly `2x NVIDIA RTX PRO 6000 Blackwell Server
Edition`, with at least 200 GB mounted at `/workspace`. Each GPU owns one
tensor-parallel-size-1 replica: GPU 0 on port 8000 and GPU 1 on port 8002. The
profile uses a 16,384-token context, at most 16 sequences per replica, automatic
KV-cache dtype, and a 300-second experiment deadline.

## Build and push

The workload contains private source and historical-result bytes. Use a private
container registry. From this directory:

```bash
./prepare-and-build.sh registry.example/private/qwen-27b-microshard:20260901
```

Set `NO_PUSH=1` to build locally without pushing. `prepare_workload.py` verifies
every manifest-bound input and gold digest before creating the ignored
`build/workload.json`. A source mismatch fails closed.

The image defaults to `vllm/vllm-openai:latest` because Qwen recommends current
serving engines for Qwen3.8 compatibility. For a frozen canary, override the
Docker build argument with a tested digest and preserve that digest with the
run receipt:

```bash
docker build --build-arg VLLM_IMAGE=vllm/vllm-openai@sha256:<digest> -t <image> .
```

## RunPod Pod template

`pod.sh` is non-effectful by default. It writes a candidate receipt containing
the exact template, start, and stop commands without requiring `runpodctl`:

```bash
./pod.sh simulate \
  --image registry.example/private/qwen-27b-microshard:20260902 \
  --receipt ./pod-simulation-receipt.json
```

The generated template uses the exact GPU ID
`NVIDIA RTX PRO 6000 Blackwell Server Edition`, GPU count 2, ports 8000/8002,
and `/opt/experiment/pod-bootstrap.sh`. Every effectful lifecycle action requires
both the action and `--execute`:

```bash
./pod.sh template-create --execute --image registry.example/private/qwen-27b-microshard:20260902
./pod.sh up --execute
RUNPOD_POD_ID=<id> ./pod.sh down --execute
```

Those commands require a separately installed and configured `runpodctl`. This
package does not provide credentials. Successful template creation accepts a
top-level JSON `id` or `templateId` and writes only that non-secret identifier
to `.runpod-template-id` with mode `0600`; the file is ignored. Override its
location with `RUNPOD_TEMPLATE_STATE_FILE`. `up` resolves
`RUNPOD_TEMPLATE_ID` first, then the state file. Unknown response shapes fail
closed, leave the raw response visible, and record only its digest.

`runpodctl 2.8.0` requires an absolute RFC3339 value for `--stop-after`.
`pod.sh` therefore defaults to current UTC plus one hour, controlled by
`RUNPOD_STOP_AFTER_HOURS`. Supply `RUNPOD_STOP_AFTER` to pass an exact absolute
timestamp such as `2030-01-02T03:04:05Z`.

Recommended environment variables are in `.env.example`. At minimum set:

```text
HF_HOME=/workspace/rwo/hf-cache
RESULTS_ROOT=/workspace/rwo/results
API_BASES=http://127.0.0.1:8000/v1,http://127.0.0.1:8002/v1
API_BASE_COUNTER_FILE=/tmp/cav2-rwo-api-base.counter
VLLM_USE_FLASHINFER_SAMPLER=0
GLOBAL_DEADLINE_SECONDS=300
MAX_OUTPUT_TOKENS_EXTRACTOR=3600
MAX_OUTPUT_TOKENS_REDUCER=6000
MAX_OUTPUT_TOKENS_SYNTHESIZER=5000
MAX_OUTPUT_TOKENS_JUDGE=4096
MAX_MODEL_LEN=16384
MAX_NUM_SEQS=32
GPU_MEMORY_UTILIZATION=0.90
REASONING_EFFORT=medium
```

The model is public, so `HF_TOKEN` is optional. `pod-bootstrap.sh` creates
`/workspace/rwo/{hf-cache,results}`, forces
`VLLM_USE_FLASHINFER_SAMPLER=0`, starts both loopback replicas, health-checks
both, and runs the full DAG with `--api-bases`. The in-process assignment is
deterministic and balances the 42 roles exactly 21/21. Stop the RunPod after the
container exits; container exit alone must not be treated as proof that billing
has stopped. `deploy-runpod.sh` remains a simulation-only compatibility wrapper.
The output ceilings above carry forward measured prior-run truncation bounds;
they do not prove the 300-second live deadline will pass.

## Result bundle

Each `/workspace/rwo/results/<UTC-run-id>/` contains:

- `run.json`: deadline, stages, workload digest, and model identity;
- `summary.json`: stage timing, request latency, token usage, and judge outputs;
- `roles/*.json`: one raw receipt per logical role;
- `gpu.csv`: one-second GPU memory, utilization, and power samples;
- `vllm-server.log`, `vllm-version.txt`, and `nvidia-smi.txt`.

The five-minute criterion passes only when `run.json.deadline_result` is `PASS`.
Quality remains `provisional_local_model_judge` until an independent judge
replays the frozen outputs. A successful run does not establish general model
parity, benchmark admission, deployment readiness, or production capacity.

## Schema-first agent CLI

The image also contains a small schema-constrained client. Start the Pod with
`AGENT_CLI_ONLY=1` to keep the loopback vLLM server running without launching
the complete benchmark. From an SSH session, give each agent only its contract,
role id, and UTF-8 input:

```bash
/opt/experiment/agent.sh extractor extractor-01 /workspace/inputs/source.txt /workspace/results/extractor-01.json
/opt/experiment/agent.sh reducer reducer-01 /workspace/inputs/extractor-results.json /workspace/results/reducer-01.json
/opt/experiment/agent.sh synthesizer synthesis-01 /workspace/inputs/reducer-results.json /workspace/results/synthesis-01.json
```

Standard input and output are supported with `-`:

```bash
printf '%s\n' 'The observed runtime was 94.642 seconds.' \
  | /opt/experiment/agent.sh extractor extractor-01 - -
```

The client loads the predeclared schema, binds `role_id` with `const`, sends it
as strict `response_format.json_schema`, parses the result, and validates it
again locally with `jsonschema`. A file output also produces
`<output>.receipt.json` containing input, schema, and output digests, latency,
finish reason, and token usage. Invalid or non-JSON output exits non-zero; there
is no unstructured fallback.

For a dual-GPU host, set comma-separated OpenAI-compatible endpoints directly;
no internal nginx layer is required:

```bash
export API_BASES='http://127.0.0.1:8000/v1,http://127.0.0.1:8002/v1'
```

Concurrent agent processes claim endpoints through a Linux `flock`-protected
round-robin counter, avoiding the stage imbalance produced by role hashing. The
counter defaults to `/tmp/cav2-structured-agent-api-base-<uid>.counter`; the Pod
template selects `/tmp/cav2-rwo-api-base.counter`. Use another `/tmp` path when
multiple independent runs share a filesystem:

```bash
export API_BASE_COUNTER_FILE=/tmp/run-001-api-base.counter
```

Set `API_BASE_STRATEGY=stable-hash` to restore deterministic role pinning with
`SHA-256(role_id) mod endpoint_count`. An explicit `--api-base` overrides the
list. When `API_BASES` is absent, the existing `API_BASE` behavior is unchanged.
The receipt records `selected_api_base` and `api_base_strategy`.

## Local deterministic validation

No GPU or model download is required:

```bash
python3 -m unittest discover -s tests -v
python3 prepare_workload.py --repo-root "$(git rev-parse --show-toplevel)" --output build/workload.json
python3 -m py_compile prepare_workload.py run_experiment.py summarize_run.py
bash -n prepare-and-build.sh deploy-runpod.sh pod.sh pod-bootstrap.sh runpod-start.sh
POD_BOOTSTRAP_SIMULATE=1 \
  POD_BOOTSTRAP_RECEIPT=/tmp/rwo-bootstrap-receipt.json \
  ./pod-bootstrap.sh
```

## Open questions

- Do two RTX PRO 6000 replicas complete all four stages within 300 seconds at `medium` reasoning?
- Does the 21/21 endpoint allocation preserve reconstruction quality relative to concurrency 1?
- Is BF16/automatic KV cache sufficient, or does a later FP8-KV canary become necessary?
- How much score variance remains when a separate Sol judge evaluates the frozen run?
