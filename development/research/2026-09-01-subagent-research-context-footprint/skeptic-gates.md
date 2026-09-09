# Skeptic Gate Returns

## Precedent gate — Lakatos, Imre

Precedent gate verdict: PASS WITH BOUNDED REVISIONS. No KILL is permitted by this gate. The synthesis is mostly “build-from-owned,” but it currently overstates ownership for section-level attribution, Qwen recurrent state, and benchmark adjudication.

| Candidate field/instrument | Precedent classification | Evidence / required correction |
|---|---|---|
| `dispatch_id`, groups, agents, roles, model, `initial_prompt`, `token_budget`, `connections`, `max_loops` | already-deployed owner | Private v0.10.0 form owns these fields and semantics: `register-dispatch/SKILL.md:62-83,182-203,219-227`. `token_budget` is explicitly a declared output target, not an enforced cap (`:199-201`). |
| Static prompt bytes/chars, declared handoff formula, loop amplification | build-from-owned | Inputs are owned by the form; the accounting equations are a new derived instrument. Keep `declared_*` names and never present them as provider usage. |
| `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`, `total_tokens` | already-deployed, but only host-scoped | One native JSONL receipt exposes these fields and `total_tokens = input_tokens + output_tokens` (`synthesis-candidate.md:149-162`; external receipt line 18). The repository’s native spawn schema is only spawn lifecycle (`native-spawn-receipt.schema.json:6-24`), not a durable usage schema. State coverage as “observed host receipt,” not “every invocation.” |
| Fixed runtime categories, tool schemas, retrieved payload, upstream-return attribution | precedent-clean measurement gap / build-from-owned extension | The receipt records representations but no category token attribution (`research.md:164-182,200-205`). The proposed `sections` object is not an existing canonical schema (`research.md:223-258`); label it a new host-bound instrumentation extension, with no authority to infer hidden counts. |
| Experiment matrix, rubric, parity score | build-from-owned, not currently owned by this dispatch | `experiment-harness` owns repeatable prompts, runs, reports, validation, and observability (`experiment-harness/SKILL.md:47-59,62-83,101-118`), but not Luna/Sol quality meaning. The current sheet is `dispatch_type: research`, and closure marks experiment checks `not_applicable` (`preconfirmation-closure.json:19-27`). If parity is load-bearing, create a separate v0.10.0 `experiment/propose` contract with frozen criterion; do not smuggle it into this research row. |
| TTFT, TPOT/ITL, throughput, queue depth, KV-cache usage | already-deployed provider owner | vLLM exposes `/metrics` gauges/histograms for KV usage, running/waiting requests, queue time, TTFT, ITL/TPOT, prompt/generation tokens, and latency: [vLLM metrics](https://docs.vllm.ai/en/stable/usage/metrics/). SGLang exposes Prometheus metrics and `bench_serving` reports throughput, TTFT, ITL, TPOT, and latency percentiles: [SGLang production metrics](https://github.com/sgl-project/sglang/blob/main/docs_new/docs/references/production_metrics.mdx), [SGLang bench serving](https://docs.sglang.ai/developer_guide/bench_serving). Record engine/version and enablement flags. |
| Raw KV allocation bytes, DeltaNet recurrent state, OOM/restarts | unsupported exact owner / precedent-clean | vLLM/SGLang metrics provide proxies, not the synthesis’s exact recurrent-state or allocator fields. Qwen config/model code and NVIDIA H200 specs own the equations, but not live allocation or quality. Require engine/GPU/process instrumentation and mark absent fields unknown. |
| H200 memory envelope and Qwen architecture equations | build-from-owned | The cited Qwen configuration/implementation and H200 specification support the derived equations (`synthesis-candidate.md:93-107`), not throughput, quality, or safe concurrency. Keep all capacity numbers hypothetical until canary evidence. |
| Wall time and serialization cost | build-from-owned | Harness reports lifecycle timestamps, but the proposed wave/serialization decomposition needs per-call start/end and queue receipts; currently unknown (`synthesis-candidate.md:63-69`). |

Concrete revisions:

1. Add an ownership/status column to the synthesis and distinguish “provider field exists” from “this project has captured it.”
2. Rename the proposed receipt as a new, host-bound instrumentation schema; do not call it canonical or already deployed.
3. Separate static declared totals from native `total_tokens`; otherwise the same quantity is double-accounted.
4. Add a warning that the public Arcanum profile is stale (`profiles/arcanum.yaml:35-40`, current `0.6.1`, experiment reserved), while the private profile correctly selects `0.10.0` (`runtime-profile.json:1-28`). Bind the private profile explicitly.
5. Move Luna/Sol parity adjudication into a frozen experiment contract or label it a future instrument, not an owned capability.
6. Mark recurrent state, raw KV bytes, OOM/restarts, and exact hidden-schema tokens as unavailable until an explicit owner/instrument exists.

## Non-vacuity gate — Russell, Bertrand

## Non-vacuity gate: FAIL — revision required

The frozen candidate digest matches `3cda0b5d0b0a23a6343126be3f1c0f51ef2aded67d50aa18965cfa7ded4c698d`. The accounting framework is useful, but two arithmetic errors and unsupported optimization recommendations prevent acceptance.

### Recomputed strategy footprints

The assigned files never identify the older Define fixture as “v0.10.0.” That identity must be cited or marked unknown. Conditional on that mapping:

- Representative older fixture:
  - \(P=7{,}270\) chars; \(P/4=1{,}817.50\) estimated tokens.
  - Base handoff:
    \(7{,}000+3(3{,}200)+4{,}900+2{,}800=24{,}300\) declared tokens.
  - Aggregate visible input estimate:
    \(1{,}817.50+24{,}300=26{,}117.50\).
  - Peak visible call: synthesizer,
    \(922/4+7{,}000=7{,}230.50\).

- Proposed nine-agent fixture:
  - \(P=5{,}539\); \(P/4=1{,}384.75\).
  - Base handoff:
    \(5{,}400+3(2{,}400)+3{,}600+2{,}000=18{,}200\).
  - Aggregate visible input estimate:
    \(19{,}584.75\).
  - Peak visible call: synthesizer,
    \(623/4+5{,}400=5{,}555.75\).

The optional-loop arithmetic in `research.md:125` and `synthesis-candidate.md:49` is wrong. With all three independently defined traversals enabled:

- Old: \(24{,}300+9{,}600+9{,}600+2{,}100=45{,}600\), not 36,000.
- Current: \(18{,}200+7{,}200+7{,}200+1{,}200=33{,}800\), not 26,600.
- Conditional whole-pass handoff envelopes become \(3(45{,}600)=136{,}800\) and \(2(33{,}800)=67{,}600\), not 108,000 and 53,200.

Also define \(E\) as connection classes if multiplying by fan-out; if \(E\) already contains literal directed edges, the current formula double-counts fan-out.

### Luna–Sol pair

A non-confounded model pair is:

- Luna, `fork_turns:none`
- Sol, `fork_turns:none`

Hold effort, prompts, frozen source/upstream hashes, tool surface, model revisions, termination rule, and scoring rubric constant. Compare the same three calls and record per-call token/latency receipts plus blind rubric scores. `Sol/all` is a separate history-sensitivity cell; it cannot serve as the direct control for `Luna/none` because model and history both change.

KILL the five-minute benchmark as a decision recommendation. It lacks exact request rate, repetitions, prompt/output lengths, warm-up duration, latency units/thresholds, quality threshold and non-inferiority margin, and minimum successful traces. Retain it only as an instrumentation smoke test until those are fixed.

### H200/Qwen witness

Using the declared inputs:

\[
C_{\min}=.85(141)-30.9-16=72.95\text{ GB}
\]
\[
C_{\max}=.90(141)-30.9-8=88.00\text{ GB}
\]

At exactly 262,144 total sequence tokens:

- BF16 KV: \(65{,}536\times262{,}144=17.179869184\) GB.
- FP8 KV: \(8.589934592\) GB.
- Recurrent state: \(0.150994944\) GB/request.
- FP32 convolution state: \(0.005898240\) GB/request.

Correct capacity equation is per-request:

\[
n=\left\lfloor\frac C{KV+recurrent+conv}\right\rfloor
\]

—not \(\lfloor(C-0.151)/KV\rfloor\), which subtracts recurrent state only once. Bounds remain 4–5 BF16 and 8–10 FP8, but margins are thin: four BF16 sequences consume 69.347 GB, leaving 3.603 GB at the low envelope; five consume 86.684 GB and fit only near the high envelope.

This is estimated capacity, not a serving witness. A valid witness must freeze total input-plus-output tokens, hashes, modality/tokenization, KV dtype, engine/model revisions, offered load, concurrency, units, acceptance margin, and a trace showing allocation, OOM/restart status, latency, and output agreement. KILL maximum-fan-out and five-minute H200 recommendations until that trace exists.

Status separation:

- Exact: digest match and arithmetic conditional on supplied numbers.
- Observed: one reported Sol receipt, not independently reopened under this scope.
- Declared: topology, budgets, host slot limit, cited model/H200 facts.
- Estimated: chars/token conversion, HBM reserve, capacities.
- Unknown: actual outputs, runtime weight bytes, allocator behavior, throughput, latency, quality, and completion time.

## Definitional-soundness gate — Wittgenstein, Ludwig

Definitional-soundness gate: **BLOCK pending revision**.

The supplied SHA-256 matches `synthesis-candidate.md` exactly (`3cda0b5d…4c698d`). The evidence is generally well stratified, but several terms still permit invalid comparisons or optimization claims.

1. Separate capacity from observed usage. Define:

   - `context_window_capacity`: model/provider limit;
   - `input_tokens`: actual provider-accounted input;
   - `output_tokens`: actual provider-accounted output;
   - `peak_input_tokens = max(input_tokens)`;
   - `peak_request_tokens = max(input_tokens + output_tokens)` only when observed;
   - `aggregate_input_tokens = Σ input_tokens`;
   - `aggregate_total_tokens = Σ total_tokens`.

   Current `C_peak = max I_i` is peak input, not “peak context” generally. Do not add `B_i` unless the provider explicitly defines reserved output in the context limit.

2. Make receipt arithmetic schema-specific. Replace `I_i^{cached} ⊆ I_i` with scalar bounds: `0 ≤ cached_input_tokens ≤ input_tokens`, and call `Q_i = I_i + O_i` the provider-reported relation for this receipt schema, not a universal processed-token identity. State explicitly whether `reasoning_output_tokens` is a subdivision of `output_tokens`; never add it again.

3. Repair visible/hidden terminology. `V_i = P_i/k` is an estimate, not exact token count. Distinguish persisted prompt bytes, model-visible message content, user-visible content, and provider-accounted tokens. `R_i` is not necessarily hidden; tool schemas are semantically available but unmeasured. Label `X_i` and `H_i` as visible payload only when actually serialized into model context. Static accounting should say “persisted-prompt and declared-handoff estimate,” not imply complete visible input.

4. Separate budget from cap. Define `B_i` as a declared target/requested budget. Define an independent `enforced_output_cap` only if measured. An observed `O_i > B_i` falsifies enforcement for that configuration/call; it does not prove that budgets are never caps. Outputs below `B_i` do not demonstrate enforcement.

5. Separate agents from requests. Define logical agent role, child-agent instance, model call/request, and active serving sequence. The host’s three-child limit constrains child instances, not necessarily model requests. Nine agents in five orchestration waves does not establish three concurrent model requests.

6. Separate replicas from batching. A replica is an independent engine/process with duplicated weights and memory. Batching is co-scheduling multiple requests within one engine sharing weights. `max-num-seqs` measures active serving requests/sequences, not agents or replicas. Rewrite the H200 request bounds as “memory-only active-request bounds.”

7. Separate throughput from five-minute completion. Name metrics precisely: prefill throughput, decode throughput, aggregate completed-token throughput, TTFT, TPOT, queue wait, and makespan. A tok/s figure cannot establish completion within 300 seconds. Add a separate completion metric: completed/started runs by deadline, with timeout and truncation definitions.

8. Separate output agreement from quality. Exact output hash match, token agreement, and semantic similarity are consistency/agreement metrics. They are not correctness or quality. Quality requires a fixed rubric, reference/ground truth where applicable, and assessor procedure. “Output agreement versus concurrency one” must not be presented as quality preservation.

9. Kill the tautological optimization claim. Replace line 83’s “Luna is the optimized candidate path” with “Luna is the candidate path under test.” State an objective and acceptance constraints, e.g. minimize measured makespan or cost subject to rubric quality, error rate, deadline completion, and context limits. Optimization is unproven until matched results satisfy that objective.

10. Repair H200 memory nomenclature. Use `W_loaded`, not the 30.9-GB repository artifact footprint, in the HBM equation; retain `W_artifact` separately. Call `C_servable` an estimated free request-state/KV budget, not usable context. Declare GB/GiB units and keep memory capacity distinct from model context-window capacity.

The synthesis can remain a candidate research model after these wording and notation changes; no current observation justifies “optimized,” “quality parity,” “completion in five minutes,” or generalized budget-cap claims.
