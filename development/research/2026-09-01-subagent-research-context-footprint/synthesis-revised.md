## Revised candidate synthesis — skeptic review

### Scope and ownership

This is a derived accounting instrument over the private v0.10.0 dispatch form. The private profile must be bound explicitly; the public Arcanum profile is stale and cannot serve as the controlling profile. The older Define fixture must not be called v0.10.0 unless that identity is independently evidenced. [Skeptic gates, Precedent gate; A1: `research.md` → Agent 1 → “Inputs” and “Extracted static fixture”]

The current dispatch remains research evidence, not implementation, serving, quality, or optimization authority. Inventory remains discovery-only. [Packet `$.non_authority_notice`; packet `$.unresolved_gaps`]

### Definitions and accounting

For logical agent role \(i\):

- `persisted_prompt_bytes` is exact stored prompt bytes/chars.
- `visible_prompt_tokens_est=P_i/k` is only a tokenizer estimate.
- `fixed_runtime_context_tokens` covers platform/base instructions, developer overlays, AGENTS/environment context, task briefing, and protocol framing.
- `hidden_tool_schema_tokens` is semantically available but unmeasured.
- `retrieved_payload_tokens` and `upstream_return_tokens` are visible only if actually serialized into model context.
- `input_tokens` and `output_tokens` are provider-accounted receipt fields.
- `cached_input_tokens` is a scalar satisfying \(0\le cached\_input\_tokens\le input\_tokens\).
- `total_tokens=input_tokens+output_tokens` is a relation for the observed host receipt schema only, not a universal accounting identity.
- `reasoning_output_tokens` is a subdivision of `output_tokens` in that schema and must not be added again.
- `declared_token_budget` is a requested output target. It is not an `enforced_output_cap` unless separately measured.

For a connection class \(e=(u,v)\), define \(f_e\) as its fan-out. A connection class represents one source role sending to a destination group; if \(E\) instead contains literal directed edges, set \(f_e=1\) to avoid double counting. With traversal count \(m_e\) and source declared target \(B_u\):

\[
H_{\mathrm{declared}}=\sum_{e\in E}m_e f_e B_u
\]

For observed accounting, replace \(B_u\) with the actual source output \(O_u\). Per-call declared visible estimate is:

\[
I^{\mathrm{declared}}_i=P_i/k+\sum_{e\rightarrow i}m_e f_e B_u
\]

Actual provider input is not recoverable from this formula because fixed runtime and hidden schema tokens are absent.

Use separate metrics:

\[
peak\_input\_tokens=\max_i(input\_tokens)
\]

\[
peak\_request\_tokens=\max_i(input\_tokens+output\_tokens)
\]

only when both are observed for the same request,

\[
aggregate\_input\_tokens=\sum_i input\_tokens
\]

\[
aggregate\_total\_tokens=\sum_i total\_tokens
\]

A declared budget must never be substituted for actual output in aggregate totals.

### Nine-agent topology

The nine logical roles form five orchestration waves:

```text
Wave E: E1,E2,E3 (parallel)
Wave S: Synthesizer
Wave K: K1,K2,K3 (parallel)
Wave W: Writer
Wave A: Auditor
```

The current static fixture has nine agents, 5,539 persisted prompt chars, and 14,600 declared output tokens. At \(k=4\), the prompt estimate is 1,384.75 tokens. Base declared handoff is 18,200 tokens; aggregate persisted-prompt plus declared-handoff estimate is 19,584.75. [A1: `research.md` → Agent 1 → “Extracted static fixture” → “2026-09-01 footprint”; “Base dependency-flow model”]

Use Luna as the candidate path under test, not as an already-optimized path. Use Luna/`fork_turns:none` versus Sol/`fork_turns:none` as the direct model control. Sol/`fork_turns:all` is a separate history-sensitivity cell because both model and inherited history change in that comparison. Hold effort, prompts, source hashes, upstream hashes, tool surface, revisions, termination rule, and scoring procedure constant. [A2: `research.md` → Agent 2 → “Fork behavior”; Skeptic gates, Non-vacuity gate]

The host limit is at most three concurrent child instances, including the root in the four-slot total. This constrains child instances, not necessarily provider model calls or active serving sequences. Nine logical agents therefore execute across waves. [A2: `research.md` → Agent 2 → “Concurrency bound”]

### Corrected loop arithmetic

For the current fixture:

\[
H_{\mathrm{current}}
=5400+7200(1+z)+3600+2000+7200f_{SE}+1200f_{AW}
\]

With \(z=f_{SE}=f_{AW}=1\), the optional-loop handoff is:

\[
18,200+7,200+7,200+1,200=33,800
\]

For the older fixture, the corresponding corrected value is 45,600. Conditional whole-pass envelopes are 67,600 for current (`max_loops=1`) and 136,800 for older (`max_loops=2`). These are conditional declared envelopes, not observed runtime traces. [A1: `research.md` → Agent 1 → “Loop/revision amplification”; Skeptic gates, Non-vacuity gate]

### H200/Qwen provisional envelope

Distinguish:

- `context_window_capacity`: Qwen native 262,144 tokens;
- `W_artifact`: 30.9 GB repository artifacts;
- `W_loaded`: runtime-loaded weight allocation, currently unknown;
- `C_servable`: estimated request-state/KV budget, not usable context capacity.

Use:

\[
C_{\mathrm{servable}}=u(141\ \mathrm{GB})-W_{\mathrm{loaded}}-A
\]

where \(u=0.85\text{–}0.90\), and \(A=8\text{–}16\) GB is an unmeasured reserve for workspace, graphs, activations, preprocessing, fragmentation, and safety margin. If, purely conditionally, \(W_{\mathrm{loaded}}=30.9\) GB, the arithmetic range is 72.95–88.00 GB; this is not a measured runtime envelope. [A3: `research.md` → Agent 3 → “Memory equations”; Skeptic gates, Non-vacuity gate]

At 262,144 sequence tokens, per-request memory must charge all components:

\[
M_{\mathrm{req}}=KV_{\mathrm{req}}+M_{\mathrm{recurrent}}+M_{\mathrm{conv}}
\]

BF16 KV is 17.179869184 GB/request; FP8 KV is 8.589934592 GB/request; recurrent state is 0.150994944 GB/request; FP32 convolution state is 0.005898240 GB/request. [A3: `research.md` → Agent 3 → “Memory equations”; Skeptic gates, Non-vacuity gate]

Thus the memory-only active-request bound is:

\[
n_{\mathrm{memory}}=\left\lfloor
\frac{C_{\mathrm{servable}}}{M_{\mathrm{req}}}
\right\rfloor
\]

This yields approximately 4–5 BF16 or 8–10 FP8 requests only under the conditional envelope. Four BF16 requests consume approximately 69.347 GB and leave only 3.603 GB at the low envelope; five consume approximately 86.684 GB and fit only near the high envelope. These are capacity bounds, not safe-concurrency, throughput, or quality claims. [A3: `research.md` → Agent 3 → “Memory equations”; Skeptic gates, Non-vacuity gate]

Separate runtime concepts:

- a logical agent is a role;
- a child instance is a host-spawned agent;
- a model call is one provider request;
- an active sequence is one serving request;
- a replica is an independent engine/process with duplicated weights;
- batching co-schedules requests within one engine and does not merge per-request KV or recurrent state;
- throughput means measured prefill, decode, or completed-token rate;
- agreement means hash/token/semantic consistency;
- quality means rubric or ground-truth performance;
- `deadline_completion_count` means runs completed by 300 seconds, distinct from throughput.

### Exact / observed / estimated / unknown

| Quantity | Status and source |
|---|---|
| Nine logical roles, current prompt chars 5,539, declared output 14,600 | Exact static declarations [A1, “Extracted static fixture”] |
| Current base handoff 18,200; optional-loop 33,800 | Derived declared arithmetic [A1, “Base dependency-flow model”; “Loop/revision amplification”] |
| One observed call: input 24,229; cached 23,296; output 330; total 24,559 | Observed host receipt, not every invocation [A2, `$.payload.info`, external JSONL line 18] |
| Uncached observed input 933 | Derived subtraction from that receipt [A2, same selector] |
| Fixed-context categories | Observed representations; token attribution unknown [A2, “Observed representation”] |
| Hidden schema tokens, runtime weight allocation, raw KV/recurrent allocation | Unknown or unavailable without new instrumentation [packet `$.unresolved_gaps`; Skeptic gates, Precedent gate] |
| Qwen/H200 architecture and 141 GB HBM facts | Source-backed model/specification facts [A3, “Architecture facts”; [H200 specification](https://www.nvidia.com/en-us/data-center/h200/)] |
| 72.95–88.00 GB and 4–5/8–10 request bounds | Conditional memory estimates only [A3, “Memory equations”; Skeptic gates, Non-vacuity gate] |
| Luna optimization, quality parity, throughput, latency, or 300-second completion | Unknown pending a future frozen experiment contract |

### Five-minute smoke test and falsification

Retain five minutes as a 300-second instrumentation smoke test only; it is not a decision recommendation. The minimum model comparison is Luna/none versus Sol/none, with Sol/all as separate sensitivity. Each cell uses the same three calls: no-tool baseline, one fixed hash-bound retrieval, and one fixed hash-bound upstream return. [A2: `research.md` → Agent 2 → “Smallest Luna-versus-Sol benchmark”]

A future frozen experiment contract must specify request rate, repetitions, warm-up, prompt/output lengths, latency units, quality rubric, non-inferiority margin, and minimum successful traces before parity or optimization is adjudicated. The proposed `sections` receipt is a new host-bound instrumentation extension, not an existing canonical schema. Provider-owned metrics such as TTFT, TPOT/ITL, queueing, KV usage, and latency percentiles must record engine/version and enablement flags. [Skeptic gates, Precedent gate]

Record exact metric names: `input_tokens`, `cached_input_tokens`, `output_tokens`, `total_tokens`, `prefill_tokens_per_second`, `decode_tokens_per_second`, `completed_token_throughput`, `ttft_ms`, `tp50_ms`, `tp95_ms`, `queue_wait_ms`, `active_sequences`, `queued_requests`, `deadline_completion_count`, `oom_count`, `restart_count`, `agreement_score`, and rubric `quality_score`.

Falsify or downgrade the candidate if receipt arithmetic fails for its host schema, cached input exceeds input, hidden/visible accounting is asserted without section evidence, any cell truncates/OOMs/restarts, or Luna fails the future pre-registered quality/error/deadline objective. Agreement must not be reported as quality.

## Gate-closure checklist

- [x] Corrected current/older optional-loop handoffs: 33,800 / 45,600.
- [x] Corrected conditional whole-pass envelopes: 67,600 / 136,800.
- [x] Connection classes and literal-edge fan-out defined separately.
- [x] `W_loaded` used in HBM equation; artifact size kept distinct.
- [x] KV, recurrent, and convolution state charged per request.
- [x] Capacity bounds labeled memory-only.
- [x] Luna relabeled candidate under test.
- [x] Luna/none versus Sol/none made the direct control; all-history separated.
- [x] Logical agents, child instances, model calls, active sequences, replicas, batching, agreement, quality, throughput, and 300-second completion separated.
- [x] Receipt arithmetic scoped to the observed host schema.
- [x] Section receipt identified as proposed host-bound extension.
- [x] Private v0.10.0 profile binding and future frozen experiment-contract requirement stated.
- [x] Five minutes retained only as instrumentation smoke test.
- [ ] Actual runtime usage, quality, serving, and completion evidence still required; no authority or acceptance claim is made.
