# Explorer returns

These are the strategist-preserved explorer returns for dispatch
`2026-08-29-define-cli-self-hosted-cloud-model-selection`. They are research
evidence, not model selection, license acceptance, provisioning authority, or
live-canary evidence.

## Agent 1 — Turing, Alan — Define workload and evaluation

Evidence-bound workload report — no files changed.

Minimum capability envelope:

- **Interactive Define CLI:** preserve a stable session; assess context from
  explicit, current-window, and saved-session evidence with provenance; ask
  exactly one focused question when sufficiency is insufficient/indeterminate;
  keep user context higher-ranked; and record defer/refuse/correct/route-to-owner
  rather than inventing an answer. Observed:
  `cyberAlchemy-v2/define/docs/INTERACTION.md#interaction-principles`,
  `#context-resolution-contract`, and `#question-contract`.
- **Authority-safe structured interaction:** emit and consume stable
  session/question/answer records containing IDs, provenance, evidence, owner,
  blocked action, answer state, and routing instructions. It must not select
  owners, alter accepted meaning, grant permission, or treat silence as an
  answer. Observed: `INTERACTION.md#answer-contract`, `#cli-wizard`, and
  `cyberAlchemy-v2/define/README.md#what-define-produces`. Derived: JSON mode or
  function calling is useful only insofar as it reliably produces these
  contract-valid records; a particular API feature is not required by the
  evidence.
- **Context/evidence use:** retrieve from the bounded source packet, preserve
  exact source references and candidate provenance, distinguish facts from
  inferences, expose conflict/open residue, and ask rather than fill a material
  gap. The evaluator port is specifically bounded to context sufficiency, not
  general reasoning authority. Observed:
  `INTERACTION.md#context-resolution-contract` and
  `semantic-evaluator-interface.json` at `$.intent` and
  `$.body.interface_kind`. Unverified: any checkpoint's usable long-context
  quality, retrieval discipline, or citation fidelity.
- **Planner/implementer chain:** planner must create a non-empty, freezeable
  plan from a read-only sandbox; implementer must use only that frozen plan plus
  condition material in a fresh session, then produce exactly `implement`,
  `abstain`, `ask`, or `escalate`. Code edits must remain within allowed paths;
  tool use must work in an isolated, network-off sandbox and produce captureable
  identities, logs, and digests. Observed: `RUNTIME-DESIGN.md` at
  `#planner-and-implementer-sessions`, `#task-runtime-profile`, and
  `#sandbox-isolation`; `PROTOCOL.md#plan-to-implementation-handoff`.
- **Hidden acceptance and one-attempt behavior:** the model must work without
  hidden tests or truth-card access; hidden evaluation is performed separately
  after output. Once prompt delivery/output occurs, the attempt is consumed.
  Semantic failure, empty output, or scope violation is evidence, not an
  opportunity for silent self-repair. Observed: `RUNTIME-DESIGN.md` at
  `#failure-and-retry-rules` and `#runtime-acceptance-criteria`, plus
  `PROTOCOL.md#stop-rules`.

Bounded evaluation rubric, run per candidate under one frozen
model/runtime/harness identity:

| Dimension | Pass witness |
|---|---|
| Context sufficiency | Correct status and named missing context/residue from frozen candidate digests |
| One-question/authority | One focused question; correct owner route; never infers authority or silence |
| Structured output | Contract-valid session, question, answer, plan, event, and outcome fields; stable IDs/digests |
| Evidence/long context | Traceable source use; no invented claims; conflict/open state retained |
| Tool/code work | Allowed-path diff only; reproducible command/output capture; no network/hidden-data access |
| Planner to implementer | Distinct sessions; frozen plan passed; no planner-history leakage |
| Abstain/ask/escalate | Frozen expected action matches; directional errors separately counted |
| Hidden acceptance | Independent hidden-case pass rate plus weighted semantic defects |
| One attempt | No rerun after consumed prompt; drift and unknowns block the row |

Observed metric and guardrail basis: `METRICS.md#primary-outcomes`,
`#guardrails`, and `#missing-data`. Derived: do not reduce this to tokens per
second, generic coding score, or nominal context length.

Public benchmark families have only limited transfer. SWE-bench-style and
repository issue-resolution tasks can screen planning, editing, test execution,
patch scope, and hidden acceptance. RepoBench-, LongBench-, and LEval-style
tasks can screen evidence retrieval, cross-file reasoning, and context
pressure. ToolBench-, API-Bank-, and tau-bench-style families can screen schema
adherence and tool selection. Structured-output/function-call suites can screen
syntax/schema conformance and constrained action selection.

Derived limit: none establishes Define utility. They lack the frozen
fact-parity four-condition comparison, owner/permission correctness,
one-question shared-session discipline, Define-specific abstain/ask/escalate
truth, and blinded downstream semantic review. Public benchmark tasks must
enter only through the protocol's explicit benchmark-admission step and still
require owner selection, provenance/license/contamination checks, hidden truth,
offline runtime, and write bounds. Observed:
`RUNTIME-DESIGN.md#implementation-layers`. Unverified: benchmark contamination
and task suitability until each exact task is admitted.

Receipt: `task_status=completed`, `evidence_gate_status=pass`, `artifacts=[]`.
Validation was read-only inspection of the dispatch, inventory packet, and its
seven named Define product/harness sources. Residue: no checkpoint, runtime,
context budget, tool adapter, or benchmark task has been empirically evaluated;
checkpoint-specific behavior remains unverified pending a frozen canary; public
benchmarks are screening inputs only.

## Agent 2 — Shannon, Claude — self-hosted model-serving systems

Checked 2026-08-29. This is a source-backed feasibility matrix, not a model
selection: the required full checkpoint SHA, region, concurrency/context/output
budgets, cost ceiling, and a Define canary are still absent.

| Candidate | Identity / effective license | Capability evidence | Serving and operational evidence | GPU-fit conclusion |
|---|---|---|---|---|
| Primary provisional stack | `Qwen/Qwen3-32B@main`; official tree displayed short head `9216db5`, but the full SHA was not captured, so it is not pin-ready; Apache-2.0. [Model card](https://huggingface.co/Qwen/Qwen3-32B), [tree](https://huggingface.co/Qwen/Qwen3-32B/tree/main) | Publisher claim: 32.8B parameters, thinking/non-thinking switch, tool calling via Qwen-Agent, 32,768 native context and validation with YaRN to 131,072. These do not establish Define semantic utility. | Official card gives both `vllm serve Qwen/Qwen3-32B` and SGLang paths. vLLM supports structured JSON/schema/grammar output, streaming, continuous batching, prefix caching, speculative decoding, TP/PP, metrics, health/load endpoints, and OpenTelemetry. [vLLM structured output](https://docs.vllm.ai/en/latest/features/structured_outputs/), [serving](https://docs.vllm.ai/en/latest/serving/online_serving/), [metrics](https://docs.vllm.ai/en/latest/design/metrics/) | Observed raw artifact package is 65.5 GB. Derived: one 80-GB GPU leaves under 14.5 GB before runtime/KV cache and is not a credible 32k-context pilot envelope without a separately verified low-bit artifact. Use 2x80-GB H100/A100-class GPUs, one host, TP=2, PP=1 as the conservative BF16 feasibility posture. H100 SXM has 80 GB and 900 GB/s NVLink; this is accelerator capability, not measured Define throughput. [NVIDIA H100](https://www.nvidia.com/en-us/data-center/h100/) |
| Lower-hardware-footprint fallback | `Qwen/Qwen3-14B@main`; Apache-2.0; full revision and exact artifact size still need resolution before freeze. [Official card](https://huggingface.co/Qwen/Qwen3-14B) | Publisher exposes the same Qwen3 thinking mode and tool-call posture. It documents deployment with `sglang>=0.4.6.post1` or `vllm>=0.8.5`; that is compatibility evidence, not a Define-quality result. | Same vLLM operational surface. Pinning vLLM `v0.23.0` is provisional because it is an official released version, but the selected container/CUDA/image digest and Qwen3-14B smoke compatibility are unverified. [vLLM v0.23.0](https://github.com/vllm-project/vllm/releases/tag/v0.23.0) | Derived BF16 weight estimate is roughly 28–30 GB from the stated 14B class; exact repository bytes were not captured. A single 80-GB GPU is the evidence-conservative baseline; a 48-GB GPU is only a canary candidate after exact artifact, runtime reserve, and requested KV cache are calculated. It has less hardware footprint than the 2x80 primary, but is not yet proven lower total cost without region/provider pricing and utilization assumptions. |
| Reasoning-focused alternative, not recommended yet | `deepseek-ai/DeepSeek-R1-Distill-Qwen-32B@main`; official tree displayed short head `711ad2e`, but the full SHA was not captured; MIT for model weights/code, with the card noting Qwen2.5 Apache-2.0 ancestry. [Model card/tree](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B), [license statement](https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B/blob/main/README.md#7-license) | Publisher supplies reasoning evaluations, but they neither prove tool/structured-output behavior nor Define utility. Tool-call formatting and one-question/authority compliance are unverified. | Official card documents both vLLM and SGLang launch paths. vLLM can supply schema-constrained output independently of model claims but must be tested with the exact chat template and reasoning parser. | Observed 33B, BF16, 65.5-GB package. It has the same conservative 2x80-GB TP=2 posture as Qwen3-32B and is not a lower-cost option. |

Recommended bounded baseline for a later owner-authorized canary:

- Model: resolve and freeze the full immutable SHA for `Qwen/Qwen3-32B`.
- Runtime: pin vLLM `v0.23.0` plus immutable container/image and CUDA-driver
  identities only after a compatibility smoke check; the model card's direct
  vLLM instruction supports the runtime family, not this exact release pin.
- Precision: raw/BF16 baseline. Do not treat vLLM's general
  GPTQ/AWQ/INT4/INT8/FP8 capability as model-specific supported or
  quality-preserving Qwen quantization.
- Topology: one 2x80-GB, same-host, high-bandwidth node; TP=2, PP=1. Avoid
  multi-node PP for the first pilot because it adds a distributed failure
  domain without a demonstrated capacity need.
- Serving posture: enable schema-constrained output; retain streaming; collect
  health/load/Prometheus and per-request timing; assess prefix caching only for
  identical shared prompt prefixes. Leave speculative decoding off for the
  initial comparison, then test it separately with draft/acceptance metrics.
- Isolation: vLLM has health, metrics, and fault-tolerance surfaces, but no
  collected evidence proves Define planner/implementer fault isolation. Run
  them as separate clean requests under the same frozen serving identity;
  deployment-level replica/process isolation remains an architecture decision.

Important derived capacity boundary: for Qwen3-32B, the 65.5-GB observed package
alone rules out assuming that one 80-GB GPU provides ample long-context or
concurrent-session capacity. Exact KV-cache bytes require the pinned config,
cache dtype, runtime reserve, max model length, and concurrency. The
[vLLM context-parallel guide](https://docs.vllm.ai/en/latest/serving/context_parallel_deployment/)
confirms that KV capacity and sharding affect long-context serving; it does not
fill those missing Define inputs.

Switch/escalation thresholds, expressed without invented targets:

- Switch primary to fallback only if an owner sets a latency/cost envelope and
  a fair canary shows Qwen3-14B meets the same frozen semantic and safety
  guardrails.
- Scale within the primary only when observed KV-cache pressure, queueing,
  time-to-first-token, or concurrent demand exceeds the owner-frozen SLO;
  metrics exist, but no threshold is currently authorized.
- Escalate rather than quantize or add nodes if the primary does not fit the
  frozen context/budget envelope, structured output fails with reasoning
  enabled, or exact model/runtime/license pins cannot be reproduced.
- No benchmark, raw parameter count, model-card tool claim, or inference-server
  feature constitutes a Define winner.

Receipt: `task_status=completed`, `evidence_gate_status=needs_feedback`,
`artifacts=[]`. Verified only primary official Qwen/DeepSeek cards and trees,
vLLM documentation and release, and NVIDIA H100 specifications. Not done:
download, license acceptance, inference/compatibility smoke test, provisioning,
price collection, or manifest freeze. Blockers: full immutable checkpoint SHAs;
exact context/output budgets, concurrency, availability, region, price, and cost
ceiling; model-specific quantization and canary behavior; immutable container,
CUDA, driver, and compatibility identities. Residue: resolve exact pins and
owner envelopes, then run a separately authorized canary.

## Agent 3 — Porter, Michael — self-hosted infrastructure economics

Economic lane completed read-only. The packet fixes the pilot denominator at
24 cells x 2 fresh sessions = 48 primary planner/implementer sessions, while
leaving checkpoint, context budgets, concurrency, topology, and cost ceiling
unresolved. Therefore the result is a parameterized costing framework, not a
selected stack or budget.

Official price and capacity witnesses, accessed 2026-08-29:

- AWS `p5.4xlarge`: 1x H100 80 GB, 16 vCPU, 256 GiB RAM, 100-Gbps EFA,
  3.84-TB NVMe. `p5.48xlarge`: 8x H100, 640 GB HBM3, 192 vCPU, 3,200-Gbps
  EFA, NVSwitch. [AWS accelerated-computing specifications](https://aws.amazon.com/ec2/instance-types/accelerated-computing/).
- AWS Capacity Block illustrative H100 rates, explicitly not generic On-Demand:
  `p5.4xlarge` is `$5.191/GPU-hour` in US East/Ohio/Oregon and
  `$4.720/GPU-hour` in London, Tokyo, Mumbai, Sydney, and Sao Paulo.
  [AWS Capacity Blocks pricing](https://aws.amazon.com/ec2/capacityblocks/pricing/).
- Google Compute Engine examples in `us-central1`: T4 16-GB
  `$0.35/GPU-hour`, P100 16-GB `$1.46`, V100 16-GB `$2.48`; the same page
  lists commitment rates. These are illustrative bands only.
  [Google GPU pricing](https://cloud.google.com/products/compute/gpus-pricing?hl=en).
- GCP bills vCPU, GPU, and memory for a minimum one minute, then per second; a
  running idle VM remains billable. Stopped VMs avoid VM usage charges, but
  disks and static IPs continue billing. [VM pricing](https://cloud.google.com/products/compute/pricing),
  [stop-instance billing](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/stop).
- GCP Spot prices can be up to 91% below standard but are dynamic, can preempt
  at any time, have no SLA, and normally offer only a best-effort 30-second
  shutdown window; Spot cannot receive CUD/SUD discounts.
  [GCP Spot VMs](https://docs.cloud.google.com/compute/docs/instances/spot?hl=en).
- GCP resource commitments cover accelerator-optimized A2, A3, and G2; fees
  remain payable if capacity is unused, and GPU commitments require
  reservations. [GCP Compute pricing](https://cloud.google.com/products/compute/pricing).
- GCP standard Persistent Disk is `$0.000054795/GiB-hour`, SSD Persistent
  Disk `$0.000232877/GiB-hour`, standard snapshots `$0.000068493/GiB-hour`,
  archive snapshots `$0.000026027/GiB-hour`, and archive retrieval
  `$0.019/GiB`. [Disk pricing](https://cloud.google.com/compute/disks-image-pricing?hl=en).
- Cloud Logging is `$0.50/GiB` with the first 50 GiB/project/month free;
  retention beyond 30 days is `$0.01/GiB-month`; monitoring is metered
  separately. [Observability pricing](https://cloud.google.com/products/observability?hl=en).
- GCP network egress is region/tier dependent. Europe to North America internet
  egress is `$0.12/GiB` for the first TiB, `$0.11/GiB` for 1–10 TiB, and
  `$0.085/GiB` above 10 TiB. [VPC pricing](https://cloud.google.com/vpc/pricing?authuser=19).
- AWS Spot is billed to the nearest second at the Spot price in effect at the
  start of the instance-hour and is intended for distributed/fault-tolerant
  workloads. AWS Savings Plans require a consistent one- or three-year dollars
  per hour commitment; advertised savings are up to 66% for Compute Savings
  Plans and 72% for EC2 Instance Savings Plans, with overage On-Demand.
  [AWS Spot](https://aws.amazon.com/ec2/spot/details/),
  [AWS Savings Plans](https://aws.amazon.com/savingsplans/compute-pricing//).

Let `N=48` primary sessions; `g` GPUs per replica; `m` replicas; `p_g` the
effective GPU-hour price; `a_j` active GPU time for session j; `L` startup plus
model-load/readiness time; `I_j` attributable idle; `q` billing quantum; `R_j`
eligible retry time; `B` cold-start bursts; `D_out` egress GiB; `S_w,S_s`
retained weights/snapshots; and reviewer/operator hours and rates be explicit
parameters.

For an ephemeral per-cell process:

`H_GPU = m*g*sum(c=1..24, ceil_q(L + sum(j in c, a_j) + I_j + R_j))`.

For a pooled service:

`H_GPU = m*g*sum(b=1..B, ceil_q(L_b + W_b + I_b))`.

`C_infra = p_g*H_GPU + C_CPU/RAM + C_storage + C_network +
C_observability + C_redundancy`.

`C_total = C_infra + N*rho_m*C_attempt + C_review + C_rework + C_operator`.

Storage and network must include weight/snapshot retention, copy/retrieval,
internet egress, and cross-region transfer. Reviewer and operator rates remain
parameters; no invented labor budget is justified.

Illustrative H100 Capacity Block arithmetic only: assume 24 cells, two fresh
30-minute sessions per cell, 10 minutes model load/readiness per cell, one H100,
and no idle, retries, sidecars, storage, network, logs, reviewers, or labor.
Then one cell is 1.167 GPU-hours and the pilot is 28 GPU-hours: approximately
`$132.16` in London or `$145.35` in US East. With 10% eligible retries it is
30.8 GPU-hours, about `$145.38` or `$159.90`. Add 30 minutes warm idle per
cell and it becomes 40 GPU-hours, about `$188.80` or `$207.64`. These are
arithmetic witnesses, not user budgets, generic On-Demand prices, or measured
utilization.

Sensitivity and break-even rules:

- Scale-to-zero wins only when idle saved exceeds burst startup/load overhead:
  `sum(I) > B*L`, after accounting for interactive delay.
- Spot is justified only when spot compute plus preemption/restart and fallback
  costs remain below protected capacity. Keep primary interactive sessions on
  protected capacity; Spot is safer for fault-tolerant replay/batch work.
- A commitment is cheaper only when expected covered utilization exceeds its
  effective price ratio and remains stable for the term.
- Concurrency reduces cost only when it removes billed idle, cold starts, or
  rounding waste; it does not automatically reduce GPU-hours.
- End-to-end throughput is bounded by the smaller of GPU service and reviewer
  capacity.

Receipt: `task_status=completed`, `evidence_gate_status=pass`, `artifacts=[]`.
Validation used current official AWS and GCP hardware, billing, Spot,
commitment, storage, network, and observability sources and recomputed the
arithmetic witnesses. Blockers: exact checkpoint/precision/VRAM/KV envelope,
topology, concurrency, region, reviewer/rework/operator rates, and live canary
remain unfrozen. Residue: apply the formulas to the systems candidate, refresh
prices immediately before a canary, constrain Spot to fault-tolerant work, and
do not claim an empirical model/topology winner.

## Confirmed explorer feedback loop 1/1

### Agent 2 repair — exact source pins and KV fields

- Qwen3-32B official commit history exposes short revision `9216db5`, dated
  2025-07-26, but not the full 40-hex SHA in the consulted browser surface.
  It remains non-freezable. [Official history](https://huggingface.co/Qwen/Qwen3-32B/commits/main)
- Qwen3-14B exposes short revision `40c0698`, also dated 2025-07-26, but not
  the full SHA. [Official history](https://huggingface.co/Qwen/Qwen3-14B/commits/main)
- Qwen3-14B's official tree displays a 29.6-GB total over eight BF16
  safetensor shards, but rounded UI sizes are not manifest-grade byte lengths
  or hashes. [Official tree](https://huggingface.co/Qwen/Qwen3-14B/tree/main)
- Official Qwen3-14B config fields (40 layers, 8 KV heads, head dimension 128,
  BF16) imply 160 KiB raw KV per token, or 5 GiB for one 32,768-token sequence,
  before allocator/page/metadata/runtime overhead.
  [Official config](https://huggingface.co/Qwen/Qwen3-14B/blob/main/config.json)
- Official Qwen3-32B config fields (64 layers, 8 KV heads, head dimension 128,
  BF16) imply 256 KiB raw KV per token, or 8 GiB for one 32,768-token sequence,
  before overhead. [Official config](https://huggingface.co/Qwen/Qwen3-32B/blob/main/config.json)
- Official vLLM Docker documentation exposes tags including `latest` and an
  example `v0.11.0`, not an immutable OCI digest. A frozen identity requires a
  registry-manifest lookup or image inspection.
  [Official Docker docs](https://docs.vllm.ai/en/latest/deployment/docker/)

Receipt: `task_status=completed`, `evidence_gate_status=needs_feedback` because
full SHAs, byte-exact model manifests, OCI digest, and measured usable KV
capacity remain unavailable without the later manifest-freeze/canary boundary.

### Agent 3 repair — provisionable 1x/2x H100 family witness

- Microsoft documents `Standard_NC40ads_H100_v5` with one H100 NVL and 94 GiB
  GPU memory, and `Standard_NC80adis_H100_v5` with two H100 NVL GPUs, 188 GiB
  aggregate memory, and NVLink support. [Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ncadsh100v5-series)
- No official, region-specific current Azure price pair was verified; the
  Retail Prices API query was not completed, secondary aggregators were
  excluded, and the owner has not selected a region. Numeric Azure cost bands
  are therefore not justified.
- Symbolically, for 24 cells the one-GPU SKU uses
  `H1 = 24*ceil_q(L+a_planner+a_implementer+I+R)`. If two cells safely share a
  two-GPU host, host-hours are
  `H2 = 12*ceil_q(L+a_planner+a_implementer+I+R)` and GPU-hours are `2*H2`.

Receipt: `task_status=completed`, `evidence_gate_status=needs_feedback` because
region, billing posture, official price response, availability, and capacity
guarantee remain owner/runtime inputs. The Azure hardware is H100 NVL 94-GiB,
not an exact 80-GB part.
