# Define CLI self-hosted model decision memo — 2026-08-29

## Outcome

The **provisional canary baseline** is **Qwen/Qwen3-32B@`9216db5781bf21249d130ec9da846c4624c16137`**, BF16, served by **vLLM `v0.23.0` source commit `0fc695fc6d1d82e9a5ac6835ac8e4e1c83703665`**, on Azure `Standard_NC80adis_H100_v5` (2x94-GiB H100 NVL), same host, requested TP=2/PP=1. It is a SKU-family witness only: Azure has not confirmed the instance-level interconnect or a regional price, and TP=2 viability requires provision/canary verification. OCI digest, CUDA, driver, chat template, reasoning parser, and adapter remain pre-canary manifest-freeze inputs.

The **lower-compute comparison candidate** is **Qwen/Qwen3-14B@`40c069824f4251a91eefaf281ebe4c544efd3e18`**, BF16, with the same provisional vLLM source posture on Azure `Standard_NC40ads_H100_v5` (1x94-GiB H100 NVL). It is not a switch decision. **No switch is permitted until frozen measurable thresholds exist and the owner accepts them.**

This is a self-hosted CyberAlchemy-operated endpoint over pinned open weights, not a laptop-local model or proprietary managed API. It is a provisional canary decision memo only, not empirical selection, execution, or readiness.

## Define workload and one-model invariant

The private Define CLI must use bounded evidence/context; ask exactly one focused question when needed; preserve authority-safe structured records; run planner-to-implementer code work in fresh isolated sessions; keep tool edits in allowed paths; and emit `implement`, `abstain`, `ask`, or `escalate` under hidden acceptance and one-attempt semantics. Local selectors: `cyberAlchemy-v2/define/docs/INTERACTION.md#interaction-principles`, `cyberAlchemy-v2/define/docs/INTERACTION.md#context-resolution-contract`, `cyberAlchemy-v2/define/docs/INTERACTION.md#question-contract`, `cyberAlchemy-v2/define/docs/INTERACTION.md#answer-contract`, `cyberAlchemy-v2/define/docs/INTERACTION.md#cli-wizard`, `cyberAlchemy-v2/define/README.md#what-define-produces`, `cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/RUNTIME-DESIGN.md#planner-and-implementer-sessions`, `cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/RUNTIME-DESIGN.md#task-runtime-profile`, `cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/RUNTIME-DESIGN.md#sandbox-isolation`, `cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/RUNTIME-DESIGN.md#failure-and-retry-rules`, `cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/runtime/RUNTIME-DESIGN.md#runtime-acceptance-criteria`, `cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/PROTOCOL.md#plan-to-implementation-handoff`, and `cyberAlchemy-v2/development/research/2026-08-29-define-agentic-engineering-evidence/experiment/PROTOCOL.md#stop-rules`.

First-pilot invariant: each task block uses **one identical frozen checkpoint, serving identity, adapter identity, and finite context/output/time budgets** for both separate fresh planner and implementer sessions. No role routing, silent retry, or implicit model switch.

## Candidate verdict matrix

| Candidate | Owner / precedent | Witnessed | Sound | Verdict |
|---|---|---|---|---|
| Qwen3-32B BF16, vLLM `v0.23.0` / `0fc695…03665`, `NC80adis_H100_v5`, requested TP=2 | Revision-pinned Qwen/config/license sources; vLLM release/source; Microsoft SKU source. Owners must still accept provider/region, privacy, budgets, adapter, thresholds, and canary. | Full SHA; displayed 65.5-GB artifact; config-derived raw KV; 2x94-GiB SKU witness. No provider-confirmed interconnect/price. | Conditional: exact runtime source is named, but manifest image/driver/adapter, usable KV, TP, schema/authority behavior, latency, reliability, and TCO are unmeasured. | **Provisional canary baseline.** |
| Qwen3-14B BF16, same vLLM posture, `NC40ads_H100_v5` | Same ownership/source posture. | Full SHA; displayed 29.6-GB artifact; config-derived raw KV; 1x94-GiB SKU witness. No regional price. | Conditional: lower GPU count is not semantic/authority equivalence or usable capacity. | **Lower-compute comparison candidate.** |
| DeepSeek-R1-Distill-Qwen-32B | Official source exists; no Define parser/tool/authority owner witness. | Similar conservative 2x80-GB BF16 posture, not lower compute. | No justified behavior/cost comparison. | Deferred. |
| 32B on one 80-GB GPU; 14B on 48-GB GPU | No accepted usable-KV envelope. | Raw weights are not concurrent long-context capacity. | Loadable is not usable. | Deferred. |
| Quantization, speculative decoding, SGLang substitution, multi-node PP, Spot primary sessions | No model-specific compatibility/quality or owner authority. | General features/prices do not establish Define reliability. | Adds confounders or failure domains. | Deferred. |

## Trade-offs and raw-memory lower bounds

The 32B baseline preserves the reasoning-depth hypothesis; its two-GPU envelope may increase GPU cost and operational exposure. The 14B comparison candidate may reduce GPU use, but cannot replace it unless the measured Define semantic, evidence, authority, and schema gates pass. Parameter count, benchmark score, tool-call claims, or tokens/s do not prove Define correctness. End-to-end latency includes context, queue, TTFT, output, tool work, retries, and reviewer capacity; throughput is not task latency. Privacy depends on residency, logging, retention, operator access, and isolation. Apache-2.0 is a publisher license claim, not accepted legal clearance. Realized TCO includes GPU billing, idle/load, CPU/RAM, storage, transfer, logs, redundancy, retries, review/rework, and operations.

Raw KV formula at BF16 is `layers × num_key_value_heads × head_dim × 2(K,V) × 2 bytes` per token.

- Qwen3-32B config fields: `64 × 8 × 128 × 2 × 2 = 262,144 bytes = 256 KiB/token`; at 32,768 tokens, `8,589,934,592 bytes = 8 GiB`. Add only the displayed 65.5-GB artifact as a weight lower bound.
- Qwen3-14B config fields: `40 × 8 × 128 × 2 × 2 = 163,840 bytes = 160 KiB/token`; at 32,768 tokens, `5,368,709,120 bytes = 5 GiB`. Add only the displayed 29.6-GB artifact as a weight lower bound.

These are raw lower bounds, not usable capacity: they exclude sharding behavior, allocator/page/metadata overhead, runtime reserve, cache dtype, model length, batching, concurrency, and fragmentation.

## 24-cell GPU-hour normalization

Assumptions only: 24 cells × two fresh 30-minute sessions/cell + ten-minute load/readiness/cell = 70 minutes/cell. The dollars normalize GPU-hours using AWS `p5.4xlarge` Capacity Block H100 rates checked 2026-08-29: London `$4.720/GPU-hour`; listed US regions `$5.191/GPU-hour`. They are **not an actual bill, Azure price, same-host two-GPU quote, or generic On-Demand rate**. Capacity Block purchase granularity is excluded and unverified.

| Assumption set | 14B, 1 GPU | 32B, 2 GPUs |
|---|---:|---:|
| Load + active only | 28 GPU-h; $132.16 London / $145.35 listed US | 56 GPU-h; $264.32 London / $290.70 listed US |
| +10% eligible retry time | 30.8 GPU-h; $145.38 / $159.88 | 61.6 GPU-h; $290.75 / $319.77 |
| +30m warm idle/cell | 40 GPU-h; $188.80 / $207.64 | 80 GPU-h; $377.60 / $415.28 |

Excluded: CPU/RAM, storage, transfer, logs, redundancy, reviewers, rework, operator labor, and Capacity Block purchase granularity. Concurrency saves cost only when it removes billed idle, load bursts, or rounding waste. Primary interactive sessions remain protected capacity; Spot is, if authorized, only for fault-tolerant replay/batch work.

## Proposed gates, ownership, and canary

These thresholds are **proposed, not accepted**. Owner acceptance is required; if the owner does not accept them, no switch or scale is permitted.

- **Switch:** across all 48 sessions, zero authority/schema failures; comparison hidden acceptance no worse than one cell below the baseline; weighted semantic defects no more than one above baseline; comparison p95 end-to-end latency at most 80% of baseline or within the accepted SLO; and realized TCO at most 70% of baseline.
- **Scale:** scale only if an OOM occurs once, measured KV occupancy is at least 85%, or p95 queue delay exceeds 20% of the accepted end-to-end SLO for three consecutive observation windows.
- **Scale-to-zero:** only if predicted idle exceeds twice measured cold-start and p95 stays within the accepted SLO.
- **Escalate:** rather than silently quantize/add nodes if identities are irreproducible, usable KV misses the envelope, structured output fails with reasoning, privacy/license remains open, or neither candidate meets the accepted gates.

Before canary, owners must accept provider/region/billing; context/output/time/tool/cost budgets; concurrency and SLOs; privacy/residency/logging/retention/operator access; retries; reviewer/rework/operator rates; comparison authorization; Define evaluator ownership; and serving/tool-adapter ownership. Manifest inputs: model SHAs and file hashes; accepted license record; OCI digest; vLLM release/source; CUDA/driver; tokenizer/chat template; reasoning parser; adapter; GPU SKU/interconnect; isolation configuration; and budgets.

The smallest fair canary is 24 cells × two fresh sessions = 48 primary planner/implementer sessions, sharing the invariant and one evaluator/harness. Capture semantic/context correctness, authority/schema failures, provenance, allowed-path/tool results, outcome correctness, TTFT, queue and end-to-end latency, throughput, KV occupancy, utilization, cold-load, health/retry/failure rate, and realized all-in TCO.

## Pinned sources and claim ceiling

Revision-pinned Hugging Face sources: [32B revision](https://huggingface.co/Qwen/Qwen3-32B/tree/9216db5781bf21249d130ec9da846c4624c16137), [32B config](https://huggingface.co/Qwen/Qwen3-32B/blob/9216db5781bf21249d130ec9da846c4624c16137/config.json), [32B license claim](https://huggingface.co/Qwen/Qwen3-32B/blob/9216db5781bf21249d130ec9da846c4624c16137/README.md#license), [14B revision](https://huggingface.co/Qwen/Qwen3-14B/tree/40c069824f4251a91eefaf281ebe4c544efd3e18), [14B config](https://huggingface.co/Qwen/Qwen3-14B/blob/40c069824f4251a91eefaf281ebe4c544efd3e18/config.json), and [14B license claim](https://huggingface.co/Qwen/Qwen3-14B/blob/40c069824f4251a91eefaf281ebe4c544efd3e18/README.md#license). vLLM pinned sources: [v0.23.0 release](https://github.com/vllm-project/vllm/releases/tag/v0.23.0) and [source commit](https://github.com/vllm-project/vllm/tree/0fc695fc6d1d82e9a5ac6835ac8e4e1c83703665). [Structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs/), [online serving](https://docs.vllm.ai/en/latest/serving/online_serving/), [metrics](https://docs.vllm.ai/en/latest/design/metrics/), and [Docker](https://docs.vllm.ai/en/latest/deployment/docker/) are current floating `/latest` feature evidence only, not version-pinned proof. Infrastructure sources: [Azure H100 family](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ncadsh100v5-series) and [AWS Capacity Blocks pricing](https://aws.amazon.com/ec2/capacityblocks/pricing/).

Claim ceiling: this research supports a provisional canary decision memo only. It establishes no empirical winner, accepted license, download, manifest freeze, provisioned infrastructure, live inference, deployment, publication, or product readiness.

## Receipt

`task_status=completed`
`writing_gate_status=ready_for_final_evidence_audit`
`artifacts=[findings.md]`
`validation=revision includes exact vLLM source posture, SKU-family caveats, pinned-versus-floating sources, raw-KV formulas, AWS normalization caveat, proposed owner thresholds, complete local selectors, and claim ceiling; git diff --no-index --check /dev/null findings.md exited 1 for content difference with no whitespace diagnostic`
`blockers=owner acceptance of thresholds and inputs; OCI/CUDA/driver/adapter identities; accepted license and byte-exact model manifests; provider interconnect/price; measured usable KV, TP viability, Define behavior, latency, reliability, and TCO`
`residue=no license acceptance, download, provisioning, live inference, manifest freeze, canary, deployment, or readiness claim`
