# GCF suitability for the GLM engine

Decision: evaluate GCF as an optional encoding of structured tool evidence. Keep output-contract simplification as a separate experiment. The inspected evidence does not establish that GCF improves GLM patch correctness or fixes the failures in our qualification campaigns.

Reviewed 2026-09-09, repository commit `bf6fd3e687a2145f6f1eee3a70fd1e6b72632a1f`. The pinned specification is v3.5.3; cached repository landing-page text advertised an older version. Pin the spec and SDK together before any prototype. This is research evidence, with no runtime adoption or dependency installation.

## What can be reused

GCF's generic profile represents parsed structured values with shared columns and positional rows; its graph profile uses local identifiers for symbols and edges. The generic profile is the plausible starting point for our JSON case/contract observations. File source strings should retain exact decoded contents. Existing canonical JSON schemas and validators remain useful after decoding. GCF is a representation layer within the engine, alongside retrieval, recycling, and validation. [Pinned specification](https://github.com/blackwell-systems/gcf/blob/bf6fd3e687a2145f6f1eee3a70fd1e6b72632a1f/SPEC.md).

Its evaluation method also offers reusable ideas: deterministic evolving-state fixtures; stale-value, deletion, changed-record and unchanged-record probes; and discriminating test doubles that deliberately ignore deltas. These would improve a future continuity benchmark more than another aggregate repair score. [Delta evaluation design](https://github.com/blackwell-systems/gcf/blob/bf6fd3e687a2145f6f1eee3a70fd1e6b72632a1f/eval/generic-delta-comprehension/README.md).

Our current [GLM transport](../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs) still sends JSON chat requests and native function arguments. A GCF input experiment would encode selected observation content inside that existing transport. It would not replace the provider API or remove native output validation.

## What the benchmarks establish

The published generic comprehension experiment uses 500 orders and 13 extraction questions. Several models score equally well with JSON. Its graph comparison includes counts directly represented in GCF section headers; the authors identify that as a source of advantage. This combines encoding with useful precomputed structure. Any local comparison must give JSON the same visible counts and summaries. GLM does not appear in the reviewed model tables. Generation tests concern graph records, rather than our native patch tool or repository repair. [Benchmark tables and method](https://github.com/blackwell-systems/gcf/blob/bf6fd3e687a2145f6f1eee3a70fd1e6b72632a1f/docs/guide/benchmarks.md).

The session-savings script serializes its JSON baseline with indentation and sums encoded response payload tokens. That is not an end-to-end measurement of the complete ARE request history, system instructions, tool schemas, output or provider billing. We must compare compact JSON with GCF using GLM's actual tokenizer and the whole admitted request. Bytes and another model's tokenizer cannot establish GLM token savings. [Savings implementation](https://github.com/blackwell-systems/gcf/blob/bf6fd3e687a2145f6f1eee3a70fd1e6b72632a1f/eval/session-savings-benchmark.py).

The deeper delta study reports model-dependent stale-state drift and evaluates periodic full-state refresh. This is a reason to measure delta depth and recovery explicitly, not assume that codec round-trip correctness proves model retention. [Depth findings](https://github.com/blackwell-systems/gcf/blob/bf6fd3e687a2145f6f1eee3a70fd1e6b72632a1f/eval/generic-delta-comprehension/DEPTH-FINDINGS.md).

## Fit against our evidence

The [local analysis](snapshots/2026-09-09/REPORT.md) separates schema, semantics, delivery and transport. In the first four complete frozen campaigns, every schema failure was an omitted `schema_version`. Public behavior already passed before correction in eleven of twelve. Changing the encoding of input cases does not mechanically supply an omitted output field. The more direct hypothesis is to stop asking the model to generate invariant metadata and construct it from trusted scope in an explicit adapter.

Seven of the eight final failures in those campaigns were initial or correction transport failures; the other retained a semantic defect after the correction allowance was consumed. GCF does not implement transport recovery. Smaller inputs might affect latency, but our records do not establish that causal link.

| Candidate change | Primary hypothesis | Required evidence |
| --- | --- | --- |
| Smaller native submission contract | Fewer invariant-metadata errors | Strict parse rate, source/scope binding, public and oracle outcomes |
| Stateless GCF for structured observations | Less input overhead without losing meaning | Exact decode round trip; full-request GLM token counts; same-information comprehension |
| GCF session/delta mode | Less repeated state transfer | Per-generation reference validity, stale-state probes, loss/recovery tests and refresh cost |

## Controlled next step

Finish the offline analysis before launching another matrix. First pin and inspect an SDK, then replay exported structured inputs through its codec locally. Test source-string preservation, nested values, empty/missing/null distinctions, delimiters, duplicate-key rejection and numeric boundaries. Record byte sizes as byte sizes; do not describe them as GLM token savings.

If that probe supports a live experiment, use a predeclared 2×2 design: compact JSON versus stateless GCF input, crossed with full patch versus minimal native output. Four tasks × three windows × four treatments gives 48 exploratory trials, with randomized treatment order within each task/window. Keep source evidence, summaries, system instructions, deadlines, transport retries and one logical correction fixed. Judge first-proposal schema validity and semantic quality separately from final repair rate, tokens and latency. Freeze exact call/spend caps in a separately selected implementation before execution. Session deltas remain a later treatment.

ARE recycling can remove a declaration that a bare GCF reference requires. The spec explicitly calls for reset/full refresh when the consumer loses prior context. A future adapter must bind IDs and base snapshots to the recycling generation, checkpoint them with delivery state, and refresh after loss. Our existing archive and source bindings remain necessary. [Session lifecycle, §9](https://github.com/blackwell-systems/gcf/blob/bf6fd3e687a2145f6f1eee3a70fd1e6b72632a1f/SPEC.md#9-session-statefulness-graph-profile).

## Current analysis boundary

The [complete five-campaign analysis](snapshots/2026-09-09-final/FINDINGS.md) is now available. The proposed comparison above remains unselected. The user requested the existing ontology/DAG hypothesis process after completing that analysis; no GCF treatment or new experiment has been implemented.

## Open Questions

- Does stateless GCF reduce full-request tokens on GLM for our actual repeated case records and source-heavy payloads?
- Does it improve semantic correctness when compact JSON receives the same summaries?
- Can generation-bound IDs and refresh preserve continuity through ARE recycling without erasing the savings?
- Which pinned SDK has the required strict parsing behavior and compatible numeric domain?

The user owns selection of a new candidate and its operating envelope. The implementer owns codec and contract tests; the evaluator owns treatment separation and frozen evidence. No GCF superiority or adoption is admitted by this review.
