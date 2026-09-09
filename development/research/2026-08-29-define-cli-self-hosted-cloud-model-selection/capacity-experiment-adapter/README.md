# Capacity experiment adapter

This crate turns one or more self-hosted inference experiments into the
digest-bound observed profiles consumed by `capacity-curve`. It is the data
boundary between a serving/swarm runtime and the optimizer; it does not infer
hardware capacity, gates, budgets, or unobserved RPS points.

## What the units mean

- **request RPS** is the number of successful external requests completed in
  the observation window. JSON stores milli-RPS, so 50 RPS is `50000`.
- **in flight** is the maximum number of successful requests concurrently
  resident on one serving replica. It is not RPS and not an agent count.
- **inference points** are distinct model-invocation points observed in the
  cognitive pipeline. A five-worker Distill → three proposal tracks →
  Tournament run therefore has five points when each worker invokes the model
  once.
- **request token rate** is measured prompt tokens per second; **response token
  rate** is measured generated tokens per second. Neither is called “prompts
  per second” in the machine contract because that phrase conflates requests
  and tokens.
- memory remains componentized per replica: accelerator-resident weights, host
  weight pool, expert cache, KV cache, recurrent state, and runtime reserve.
  The optimizer sums components only after preserving their identities.

## 32k curve protocol

For the requested 50/70/100 RPS curve, run three independent, steady-state
experiments per model. Keep `context_tokens` at `32768`, keep the workload,
template, tokenizer, parser, adapter, pipeline, gates, topology, dtypes, and
techniques digest-identical, and set `target_milli_rps` to `50000`, `70000`, and
`100000` respectively. The prompt plus actual response token count must never
exceed 32768; reserve the declared `response_tokens` budget before building the
prompt corpus.

Warm-up traffic must be outside `observation_start_ms..observation_end_ms`.
Record every attempt, periodic memory samples for every serving replica, every
cognitive evaluation event, and optional cost samples. A missing cost stream is
unknown cost, never zero cost. FreeToken or another memory technique is declared
only when it was active in that exact run (for example
`freetoken_observed`); observed memory remains mandatory.

This produces three evidence points. The optimizer is deliberately forbidden
from treating a 50 RPS observation as proof for 70 or 100 RPS.

## Serving-only H200 experiment

`import-vllm` and `project-serving` are intentionally separate from `adapt`
and `scenario`. They measure one serving replica and emit a labelled linear
fleet estimate; they never synthesize cognitive events or claim that
multi-replica scaling, Define reasoning quality, or the Distill/Tournament
pipeline was observed.

The pinned experiment contract is Qwen3.5-35B-A3B-FP8 at its 40-character
revision, the digest-pinned community vLLM image, FP8 checkpoint weights, and
the runtime's recorded compute and KV dtype requests, with a 30,720-token prompt plus a
2,048-token response, two repetitions, 20% capacity headroom, and 100
simultaneously outstanding agent calls. An uncached observation and a
`prefix_cache_observed` observation are different identities and cannot be
aggregated together.

Create the pod with the fields in `RUNPOD-QWEN35-FP8.md`, then run
`scripts/bootstrap-qwen35-fp8.sh` before `scripts/run-vllm-32k.sh`. The
bootstrap writes the required environment to the model directory:

```bash
MODEL_PATH=/workspace/define-capacity/models/qwen3-32b \
MODEL_PROFILE_ID=<64-hex-profile-id> \
WEIGHTS_ARTIFACT_BYTES=<verified-weight-bytes> \
TOKENIZER_DIGEST=<64-hex-tokenizer-manifest-digest> \
IMAGE_CONFIG_DIGEST=<64-hex-image-config-digest> \
OUTPUT_ROOT=/workspace/define-capacity/raw-run \
scripts/run-vllm-32k.sh
```

The script derives runtime, execution-environment, GPU, adapter, argument, and
process-set identities on the pod. It binds the API to loopback, refuses an
already-busy GPU, warms up outside the saved observations, and runs concurrency
`1,2,4,8,16,24,32,48,64` twice. The first run defaults to the uncached lane only. The native
prefix-cache lane must be explicitly enabled after its before/after cache
counter evidence is implemented. The script samples GPU memory, captures vLLM
metrics, and writes one import manifest beside every detailed result. It does
not install packages, download weights, copy evidence home, or terminate the
pod.

Import each repetition locally from the repository root:

```bash
cargo run --locked -p capacity-experiment-adapter -- import-vllm \
  --result <run>/result.json \
  --gpu-samples <run>/gpu-samples.jsonl \
  --manifest <run>/serving-import-manifest.json \
  --out <run>/serving-observation.json
```

Project each technique separately:

```bash
cargo run --locked -p capacity-experiment-adapter -- project-serving \
  --observation <run-1>/serving-observation.json \
  --observation <run-2>/serving-observation.json \
  --target-milli-rps 50000,70000,100000 \
  --active-agents 100 \
  --inference-points-per-request 1 \
  --parallel-inference-points-per-request 1 \
  --headroom-milli 800 \
  --out serving-projection.json
```

The selected point has zero failures, at least two repetitions, no more than
10% repeat variance, and the greatest conservative minimum RPS (ties prefer
the larger observed in-flight count). The report preserves throughput-driven
and concurrency-driven replica counts before taking their maximum. Artifact
weights, engine-reported KV allocation, idle/peak GPU use, and unattributed
memory remain separate. Missing hourly price is unknown, never zero.

## Run layout

```text
run/
  model-profile.json
  run-manifest.json
  raw/
    request-samples.jsonl
    runtime-samples.jsonl
    cognitive-events.jsonl
    cost-samples.jsonl       # optional
```

Schemas are in `schemas/`. `fixtures/single-run/` is a complete deterministic
example; `fixtures/vllm-serving/` exercises the serving-only CLI. Runtime
integrations can write those language-neutral JSONL streams directly or use
the Rust `JsonlRunSink`. The sink creates each stream with
create-new semantics and its `finish()` method flushes, syncs, and validates the
complete run.

## Commands

Validate one raw run:

```bash
cargo run --locked -p capacity-experiment-adapter -- \
  validate --run-dir path/to/run
```

Emit serving, cognitive, optional cost profiles, and an adapter receipt:

```bash
cargo run --locked -p capacity-experiment-adapter -- \
  adapt --run-dir path/to/run --out-dir path/to/adapted
```

Materialize one digest-bound scenario from the three curve experiments. Repeat
`--run-dir` for additional models or observed rates:

```bash
cargo run --locked -p capacity-experiment-adapter -- scenario \
  --policy path/to/scenario-policy.json \
  --run-dir path/to/run-50 \
  --run-dir path/to/run-70 \
  --run-dir path/to/run-100 \
  --out-dir path/to/scenario-bundle

cargo run --locked -p capacity-curve -- plan \
  --input path/to/scenario-bundle/scenario.json \
  --json-out path/to/scenario-bundle/curve.json
```

The policy is separate from observations by design. It must explicitly carry
the target RPS curve, capability/facet requirements, exact serving identity,
quality gates, memory/replica/point/worker budgets, cost ceiling, minimum sample
count, and optimizer search limit. Policy/run identity mismatches fail before
the output directory is created.

## Derived formulas

- `milli_rps = successful_requests * 1_000_000 / observation_window_ms`
- `token_rate = floor(tokens * 1_000 / observation_window_ms)`
- latency and TTFT use the declared nearest-rank percentile
- `defect_ppm = defects * 1_000_000 / evaluated_events`
- `cost_per_replica_hour = sum(component_hourly_rates) / serving_replicas`

All profile IDs are content digests with their own ID field cleared. Every
profile also binds the run manifest and raw-file SHA-256 values. Scenario refs
bind the exact emitted profile bytes and cannot escape the scenario directory.
