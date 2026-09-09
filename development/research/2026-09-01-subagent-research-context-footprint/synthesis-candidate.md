## Candidate synthesis — skeptic review

### Reconciled model

The three returns are consistent once static dispatch accounting, native-runtime accounting, and H200 serving accounting are treated as different layers.

For agent call \(i\):

\[
I_i =
V_i + R_i + S_i + X_i + H_i
\]

where:

- \(V_i=P_i/k\): visible persisted prompt tokens; \(P_i\) is exact prompt bytes/chars and \(k\) is tokenizer chars/token.
- \(R_i\): fixed platform/runtime context: base instructions, developer overlays, AGENTS/environment context, and protocol framing.
- \(S_i\): hidden tool-schema and orchestration overhead.
- \(X_i\): retrieved source payload.
- \(H_i\): upstream handoff payload.
- \(I_i^{cached}\subseteq I_i\); \(I_i^{uncached}=I_i-I_i^{cached}\).
- \(B_i\): declared output budget.
- \(O_i\): actual output, including any reported reasoning-output subdivision.
- \(Q_i=I_i+O_i\): actual per-call processed-token total.

Static estimates contain only \(V_i\) and budget-based \(H_i\). Runtime receipts contain \(I_i,O_i,Q_i\), but do not currently attribute every token to \(R_i,S_i,X_i,H_i\). This explains why Agent 2 observed a 24,229-token first-call input despite the much smaller static prompt estimate. [A1: `research.md` → Agent 1 → “Extracted static fixture” and “Base dependency-flow model”; A2: `research.md` → Agent 2 → “Observed facts” §2–§3]

For directed edges \(e=(u,v)\), with fan-out \(f_e\), traversal count \(m_e\), and source budget \(B_u\):

\[
H_{\text{declared}}=\sum_{e\in E}m_e f_e B_u
\]

For observed runs, replace \(B_u\) with actual source output \(O_u\). The static current fixture has nine agents, 5,539 prompt chars, and 14,600 declared output tokens. At \(k=4\), its visible prompt estimate is 1,384.75 tokens. One-pass declared handoffs are 18,200 tokens; therefore visible aggregate input is estimated at 19,584.75 tokens. These are estimates, not provider usage. [A1: `research.md` → Agent 1 → “Extracted static fixture” → “2026-09-01 footprint”; “Base dependency-flow model”]

The current edge structure is:

```text
E1,E2,E3 ──> Synth ──> S1,S2,S3 ──> Writer ──> Auditor
```

Optional feedback edges are Synth→Explorers and Auditor→Writer. With \(z\) for an extra Synth→Skeptics traversal, \(f_{SE}\) for Synth→Explorers feedback, and \(f_{AW}\) for Auditor→Writer feedback:

\[
H_{\text{current}}
=5400+7200(1+z)+3600+2000+7200f_{SE}+1200f_{AW}
\]

All three optional traversals once produce 26,600 declared handoff tokens. Any whole-pass multiplier from `max_loops` is conditional: the sheets do not define whether it means retries, edge traversals, or both. [A1: `research.md` → Agent 1 → “Loop/revision amplification” → “Current”]

Peak per-call context is:

\[
C_{\text{peak}}=\max_i I_i
\]

or, conditionally, \(I_i+B_i\) if the provider reserves declared output inside the context window. Aggregate processing is:

\[
Q_{\text{aggregate}}=\sum_i(I_i+O_i)
\]

Wall time is approximately:

\[
T_{\text{wall}}\approx\sum_{w\in\text{waves}}\max_{i\in w}(t_i)+T_{\text{queue}}+T_{\text{serialization}}
\]

All \(t_i\), queueing, and serialization costs are currently unknown.

### Luna topology and Sol controls

Use the nine-agent topology as five dependency waves:

1. **Wave E:** three Luna explorers in parallel.
2. **Wave Synthesis:** one Luna synthesizer.
3. **Wave K:** three Luna skeptics in parallel.
4. **Wave W:** one Luna writer.
5. **Wave A:** one Sol auditor.

The host permits at most three concurrent child agents because four total collaboration slots include the root. Thus the three-agent fan-outs are realizable, while the nine agents must execute across waves. [A2: `research.md` → Agent 2 → “Concurrency bound”; packet `$.design_consequences`]

Luna is the optimized candidate path. Sol is the independent control and final audit:

- freeze identical prompts, source bytes, upstream returns, model revisions, effort, and termination rules;
- use `fork_turns:none` for the primary controlled path so parent conversational history is excluded;
- run matched Sol controls with `fork_turns:all` only as an explicit history-sensitivity cell;
- require the Sol auditor to inspect the same frozen bundle and score against a pre-registered rubric;
- do not infer quality parity from textual similarity or latency alone.

`fork_turns:none` removes surrounding parent turns but does not remove fixed runtime context, tool availability, workspace instructions, or task briefing. [A2: `research.md` → Agent 2 → “Fork behavior”]

### Provisional H200/Qwen3.8-27B-FP8 envelope

Agent 3 confirms the official Qwen3.8-27B-FP8 artifact and configuration: 28B parameters, 30.9 GB repository artifacts, native 262,144-token context, and a multimodal Qwen3.5 architecture with 64 layers: 48 linear-attention and 16 full-attention layers. [A3: `research.md` → Agent 3 → “Exact identity” and “Architecture facts”; [official config](https://huggingface.co/Qwen/Qwen3.8-27B-FP8/blob/main/config.json)]

For H200 HBM:

\[
C_{\text{servable}}=u(141)-W-A
\]

with \(u=0.85\text{–}0.90\), \(W=30.9\) GB artifact footprint, and unmeasured reserve \(A=8\text{–}16\) GB. The derived request-state envelope is approximately 73–88 GB, but loaded runtime weight size and allocator behavior remain unmeasured. [A3: `research.md` → Agent 3 → “Memory equations”; [NVIDIA H200 specification](https://www.nvidia.com/en-us/data-center/h200/)]

Full-attention KV demand is 65,536 bytes/token in BF16 or 32,768 bytes/token in FP8. At 262k tokens this is approximately 17.18 GB or 8.59 GB per request, respectively; the fixed DeltaNet recurrent state is approximately 0.151 GB per active request. Memory-only bounds are therefore roughly 4–5 BF16 or 8–10 FP8 full-context requests, subject to engine overhead and quality validation. [A3: `research.md` → Agent 3 → “Memory equations”]

These are capacity hypotheses, not throughput, latency, or quality claims. Start with one shared engine and `max-num-seqs` 1, then 2 and 4; independent replicas duplicate weights and reduce long-context capacity. FP8 KV quality is unknown. [A3: `research.md` → Agent 3 → “Serving behavior” and “Replica hypothesis”]

### Exact, observed, estimated, unknown

| Quantity | Status |
|---|---|
| Current topology: nine agents; three explorers and three skeptics | Exact static fixture [A1, “Extracted static fixture”] |
| Current prompt chars: 5,539 | Exact persisted bytes/chars [A1, same selector] |
| Declared output: 14,600 | Exact declaration, not enforcement [A1, same selector; packet `$.unresolved_gaps`] |
| One-pass handoff: 18,200 | Derived from declared edges [A1, “Base dependency-flow model”] |
| Visible estimate at \(k=4\): 1,384.75 prompt / 19,584.75 aggregate | Estimated tokenizer conversion [A1, same selector] |
| First native call input: 24,229; cached: 23,296; output: 330; total: 24,559 | Observed Sol receipt [A2, `$.payload.info`, cited JSONL line 18] |
| Uncached first-call input: 933 | Derived: 24,229−23,296 [A2, same receipt] |
| Fixed runtime categories | Observed as present; token attribution unknown [A2, “Observed representation”] |
| Hidden tool-schema tokens | Unknown [A2, same selector; packet `$.unresolved_gaps`] |
| Actual output versus declared budget | Unknown; budgets are targets [packet `$.unresolved_gaps`] |
| H200 request-state budget: 73–88 GB | Derived estimate [A3, “Memory equations”] |
| Qwen usable context, throughput, p95 latency, wall time, quality under load | Unknown until canary measurement [A3, “Minimal live trace”] |

### Five-minute benchmark and falsification

Use the minimum four-cell host benchmark:

```text
model ∈ {Luna, Sol}
fork_turns ∈ {none, all}
```

Run each cell for five minutes after identical warm-up, using the same three-call script: no-tool baseline, one fixed hash-bound retrieval, and one fixed hash-bound upstream return. Capture section-level serialized bytes/token counts where possible, plus per-call `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`, `total_tokens`, timestamps, model revision, and rubric score. [A2: `research.md` → Agent 2 → “Smallest Luna-versus-Sol benchmark” and “Required receipt schema”]

Then run H200 canaries for five minutes per cell across contexts 8k, 32k, 128k, and 262k and `max-num-seqs` 1, 2, 4, and 8, with representative text and image prompts. Record KV allocation, recurrent state, TTFT/TPOT, p50/p95 latency, queue depth, OOM/restarts, and output agreement against concurrency one. [A3: `research.md` → Agent 3 → “Minimal live trace”]

Falsify or downgrade the model if:

- actual receipt totals violate \(Q_i=I_i+O_i\);
- cached input exceeds total input;
- section-level accounting cannot reconcile visible payload plus fixed/hidden context;
- actual outputs exceed declared budgets, proving budgets are not caps;
- any H200 cell truncates, OOMs, restarts, or loses output agreement as concurrency rises;
- Luna fails the pre-registered quality/latency criterion against Sol;
- observed wall time cannot be explained by measured wave parallelism and queueing.

Until those conditions are measured, all H200 capacity, Luna optimization, quality parity, and five-minute completion claims remain provisional.
