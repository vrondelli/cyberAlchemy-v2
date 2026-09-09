# Findings: subagent context footprint

Evidence-closure SHA-256: `34e55b4a9109558a7f88c542144b1a47ac1e70948e53be06522bcdbf3c6f068b`.
Handoff is `ready`; this remains research synthesis only. It does not authorize
optimization, throughput, safe concurrency, quality parity, provisioning, or
deployment.

## Measured fixture and accounting

The current private v0.10.0 dispatch schedules nine logical roles in five waves:
three explorers, one synthesizer, three skeptics, one writer, and one auditor.
Persisted `initial_prompt` text is **exactly 5,539 characters** and declared
output targets sum to **14,600 tokens**. At the explicitly illustrative
`k=4` characters/token conversion, persisted prompts estimate 1,384.75 tokens.
The base declared handoff is **18,200 tokens**, giving a persisted-prompt plus
declared-handoff estimate of **19,584.75**. These are static/declaration values,
not provider usage. [Agent 1, `research.md#agent-1-shannon-claude / Extracted static fixture`; `... / Base dependency-flow model`]

For connection classes (one source role to a destination group), let `P_i` be
persisted prompt bytes/chars, `k` tokenizer chars/token, `f_e` fan-out,
`m_e` traversals, and `B_u` the source's declared output target:

```text
H_declared = Σ_e (m_e × f_e × B_u)
I_declared_i = P_i/k + Σ_(e→i) (m_e × f_e × B_u)
```

If `E` contains literal directed edges, use `f_e=1`; otherwise fan-out would be
double-counted. For actual receipts, replace `B_u` with observed source output
`O_u`. Hidden fixed runtime context and tool-schema tokens are not recoverable
from the static formula.

Current one-pass/base accounting is:

```text
5,400 + 3×2,400 + 3,600 + 2,000 = 18,200 declared handoff tokens
```

With one traversal of each independently declared optional path (`z=f_SE=f_AW=1`),
the corrected worst-case declared handoff is:

```text
18,200 + 7,200 + 7,200 + 1,200 = 33,800
```

With the sheet's `max_loops=1`, a conditional whole-pass envelope is **67,600**.
These are not observed traces. For comparison, the older fixture is 7,270 prompt
characters, 20,000 declared output tokens, 24,300 base handoff, 45,600 optional
handoff, and 136,800 conditional whole-pass envelope; its v0.10.0 identity is
not independently established. [Agent 1, `research.md#agent-1-shannon-claude / Loop/revision amplification`; Agent 2, `skeptic-gates.md#non-vacuity-gate-russell-bertrand / Recomputed strategy footprints`]

One observed native Sol child call reported `input_tokens=24,229`,
`cached_input_tokens=23,296`, `output_tokens=330`,
`reasoning_output_tokens=115`, and `total_tokens=24,559`; uncached input is
933 by subtraction. This is one host receipt, not coverage of all agents.
Reasoning is an output subdivision in that receipt and must not be added again;
`token_budget` is a declared target, not an enforced cap. [Agent 2, `research.md#agent-2-hewitt-carl / Observed facts 2`]

The host permits at most **three concurrent child instances** (`4` total slots
including root). The total useful scheduled set is **nine logical agents**,
realized across the five waves above; this does not establish three concurrent
provider requests or serving sequences. [Agent 2, `research.md#agent-2-hewitt-carl / Concurrency bound`]

## Model/control and H200 hypothesis

The direct model control is Luna/`fork_turns:none` versus Sol/`fork_turns:none`.
Hold effort, prompts, source/upstream hashes, tools, revisions, termination, and
blind scoring fixed. Sol/`fork_turns:all` is a separate history-sensitivity
cell: it changes inherited history as well as model, so it is not the direct
control. `none` removes parent conversation turns but retains fixed platform,
developer, workspace, task, and tool context. [Agent 2, `research.md#agent-2-hewitt-carl / Fork behavior`; `... / Smallest Luna-versus-Sol benchmark`]

Official Qwen evidence identifies Qwen3.8-27B-FP8 as a multimodal causal LM,
with 64 layers, 16 full-attention layers, native context 262,144, and a 30.9 GB
repository artifact tree; loaded runtime allocation remains unknown. The official
configuration and implementation are [Qwen config](https://huggingface.co/Qwen/Qwen3.8-27B-FP8/blob/main/config.json) and
[Transformers implementation](https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_5/modeling_qwen3_5.py).
NVIDIA specifies [H200](https://www.nvidia.com/en-us/data-center/h200/) at
141 GB HBM3e. [Agent 3, `research.md#agent-3-simon-herbert / Exact identity and Architecture facts`; `... / H200 confirmation`]

Conditionally, with `u=.85–.90`, `A=8–16 GB`, and (only as an arithmetic
assumption) `W_loaded=30.9 GB`:

```text
C_servable = u×141 − W_loaded − A = 72.95–88.00 GB
KV/token = 32,768 × bytes/element
M_req = KV_req + 0.150994944 GB recurrent + 0.005898240 GB FP32 conv
n_memory = floor(C_servable / M_req)
```

At 262,144 tokens, BF16 KV is 17.179869184 GB/request (about 4–5 memory-only
requests); FP8 KV is 8.589934592 GB/request (about 8–10). These are conditional
capacity bounds, not safe concurrency, latency, throughput, or quality claims.
Independent replicas are estimated at 2–3 only for short-context arithmetic;
the maximum-independent-replica recommendation is **KILL** pending a live
witness. A single shared-weight engine with bounded requests is only the
stronger long-context hypothesis, not an admitted serving result. [Agent 3,
`research.md#agent-3-simon-herbert / Memory equations`; `... / Replica hypothesis`]

## 300-second smoke test and future evidence

Five minutes is retained solely as an instrumentation smoke-test duration. The
minimum four-cell matrix is:

| model | history | status |
|---|---|---|
| Luna | `none` | direct candidate cell |
| Sol | `none` | direct control |
| Luna | `all` | history sensitivity (optional if parent history is fixed) |
| Sol | `all` | separate history sensitivity |

Each cell runs the same three calls: no-tool baseline; one fixed hash-bound
retrieval; one fixed hash-bound upstream return. A future frozen contract must
fix request rate, repetitions, warm-up, prompt/output lengths, latency units and
thresholds, quality rubric/reference, non-inferiority margin, and minimum
successful traces. Capture engine/model revisions, token counts, TTFT/TPOT,
queueing, active/queued requests, OOM/restarts, deadline completion, agreement,
and rubric quality. Agreement is not quality. Five-minute completion and Luna
quality parity are **deferred/unknown**. [Agent 2, `research.md#agent-2-hewitt-carl / Smallest Luna-versus-Sol benchmark`; `skeptic-gates.md#non-vacuity-gate-russell-bertrand / Luna–Sol pair`]

Stop and falsification rules: start a hard wall-clock timer at each cell's
first request and stop the cell at **300 seconds**, terminating outstanding
work and recording timeout/truncation. Falsify or downgrade the cell on any
source/upstream digest mismatch, OOM, process restart, incomplete mandatory
receipt trace, arithmetic inconsistency, or missing termination status; a
partial result cannot count as completion. The three-child ceiling is only a
physical host bound. Maximum useful fan-out remains **unknown** until these
timed traces establish makespan, deadline completion, errors, and quality under
the fixed contract.

Smallest receipt/script specification:

```text
for cell in {Luna:none, Sol:none, Luna:all, Sol:all}:
  run 3 fixed calls (baseline, retrieval(hash), upstream(hash))
  record model, effort, fork_turns, source hashes, start/end, termination
  record per call: input, cached_input, output, reasoning_output, total, context_window
  record output_sha256 and blind rubric_score
```

The proposed section-level receipt must also hash/size/token-count base and
developer instructions, AGENTS/environment context, task briefing, tool
schemas, retrieved payload, and upstream return. It is a new host-bound
instrumentation extension, not an existing canonical schema. [Agent 2,
`research.md#agent-2-hewitt-carl / Required receipt schema`]

## Status and verdict matrix

| subject | status | verdict |
|---|---|---|
| Context accounting instrument | exact inputs plus derived formulas; hidden attribution unknown | Candidate build-from-owned instrument; not canonical usage proof |
| Nine-agent Luna candidate | declared nine-role topology; three-child host ceiling | Candidate under test; no optimization claim |
| H200 shared-engine hypothesis | conditional model/HBM arithmetic | Deferred hypothesis; no safe concurrency or serving claim |
| Maximum independent replicas | unmeasured live allocation/long-context witness | **KILL** |
| Five-minute completion | no makespan trace or frozen acceptance rule | **Deferred/unknown**; smoke test only |
| Luna quality parity | no blind rubric result under frozen contract | **Deferred/unknown** |

### Evidence classes

- **Exact:** persisted prompt characters, declared budgets/topology, supplied digest,
  and arithmetic conditional on supplied inputs.
- **Observed:** one native Sol usage receipt and host fork/concurrency behavior.
- **Estimated/derived:** chars/token conversion, loop envelopes, HBM reserve,
  per-request memory, and memory-only request bounds.
- **Unknown:** complete runtime usage attribution, loaded weights, allocator
  behavior, throughput, latency, safe concurrency, quality, provisioning, and
  deadline completion.
