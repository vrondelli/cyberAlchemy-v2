# ARE experiment trace and data audit

## Result

The saved corpus supports two high-priority improvements with direct experiment evidence: preserve complete inspected history when it still admits (H21), and remove redundant model-facing envelope fields while retaining full audit sidecars (H23). It also exposes a distinct tool-interface problem: external-task runs spend repeated model turns on validator-rejected calls, including six consecutive staging calls with the same missing required field. The token ledger is broad but incomplete, so its observed total is a lower bound rather than a project cost total.

## Coverage and identity

The reproducible scanner read and SHA-256 hashed every regular file under `implementation/agent-reasoning-engine/benchmarks` without following symlinks. It found **16,266 regular files, 4 symlinks, and 425,894,163 bytes**. All JSON and JSONL outside dependency/cache trees parsed successfully. Text artifacts were keyword-scanned or structure-read; they were not all manually interpreted.

| Family | Files | Bytes | Discovered study/path groups |
| --- | ---: | ---: | ---: |
| external-context-v1 | 2,766 | 163,201,967 | 36 |
| glm-episodes-v1 | 13,385 | 261,773,721 | 135 |
| glm-fitting-v1 | 20 | 238,157 | 10 |
| real-reasoning-v1 | 95 | 680,318 | 12 |

[coverage.json](coverage.json) is the complete file manifest, including content hashes, roles, processing status, symlinks, parse status, and 850 exact-content duplicate groups. Dependencies and bytecode caches were byte-read for inventory and hashing but excluded from semantic parsing. `real-reasoning-v1` contains offline corpora, fixtures, four saved run summaries, and interaction-learning rows; it exposes no canonical provider receipt stream, so it contributes coverage and outcome evidence but no model-token total here.

The attempt/token selector uses one representation per known trace form:

- external-context `result.json` receipts;
- GLM episode `visible-trace.json` receipts;
- provider-study per-row `result.json` receipts;
- completed glm-fitting JSONL rows, paired by invocation ID rather than treating their `started` journal rows as attempts.

It excludes `captures.json`, `responses.json`, checkpoints, state blobs, ledgers, assessments, and aggregate reports from token summation because they restate or summarize the selected rows. No selected nonempty receipt sequence is exactly duplicated by another selected path. This is a **selected-representation count**, not proven global lineage identity: wrappers can differ while referring to one underlying attempt. Request-digest equality never collapses rows because legitimate repeated requests remain separate attempts.

The selector yields 827 rows: 803 with live/provider evidence and 24 offline-synthetic fitting completions. Across them are 6,176 model receipts. Usage is complete for 6,122. The **observed selected-representation subtotal** is **23,161,513 input + 699,588 output = 23,861,101 model tokens**. Cached input (2,452,032) remains included in input; reasoning tokens (190,802) are a subset of output and are not added again. Thirty live/provider receipts and 24 offline-synthetic rows lack complete input/output usage, so the selected-set total is at least this high. Unproven cross-wrapper lineage could also make a global program total lower than the subtotal. [aggregates.json](aggregates.json) retains per-attempt and per-study coverage; no definitive experiment-program cost is claimed.

## Findings

### 1. Stop repeated schema failures before another full model turn

Across 969 external tool events in 39 event files, 31 results have `ok:false`. Twenty-one event records store `arguments:null` alongside validator issues: nine `evidence_refs` array/type failures, six missing staging paths, five read-bound violations, and one hypothesis-cardinality failure. The stored event form does not preserve the rejected raw argument object, so it proves validator rejection and issue class, not whether the bad shape originated in model serialization or harness normalization.

The strongest case is [events 27–32](../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/evidence/16542-reserved-r1/events.json): six consecutive `stage_patch_candidate` calls omit `edits[0].path`. The corresponding model receipts 14–19 in [result.json](../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/evidence/16542-reserved-r1/result.json) consume **50,552 input + 2,836 output = 53,388 tokens** and make no staging progress. Event 33 then reaches a different exact-match failure; the attempt ends `run_error` after a length-capped response.

This directly supports compact example-bearing repair feedback and a same-validator-error circuit breaker. After a bounded correction attempt, the controller should expose the remaining legal recovery paths and allow evidence-based terminal handling only when recovery is genuinely unavailable or the budget is exhausted. It should retain the original issue list in audit evidence.

Other recurring clusters are concrete:

- Nine wrong-type hypothesis calls, including [feedback timing event 3](../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/feedback-timing-v1/evidence/16309-delayed-r1/events.json).
- Six `old_text must match exactly once` staging failures across separate attempts, plus two container stack-trace forms in one success-study attempt.
- Four `line_count` bound errors and one `max_chars` archive bound error.
- One public reproducer infrastructure failure and one generic bounded-tool failure; these should remain distinct from model schema errors.

### 2. Treat terminal output capacity as a dedicated path

Only 3 of 6,176 selected model receipts finish with `finish_reason:length`, but all three enclosing attempts report `run_error` and `error:incomplete-output`: [16417 early](../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/feedback-timing-v1/evidence/16417-early-r1/result.json), [16417 reserved](../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/evidence/16417-reserved-r2/result.json), and [16542 reserved](../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/evidence/16542-reserved-r1/result.json). This is strong within-attempt evidence for compact terminal schema handling, though three cases cannot establish population frequency.

### 3. Keep H21 and H23 at the front of the implementation plan

H21's [live admission result](../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/live-admission-v1/RESULT.md) shows delayed correct first proposals **6/6 versus 0/6**, with 66 model calls in each arm and exact decisive bodies at candidate submission. Five pairs are fully observed wins; the sixth pairs candidate success with a baseline timeout, so the frozen evaluator correctly remains inconclusive rather than attributing that pair to code.

H23's [tokenizer report](../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/payload-token-v1/report.json) measures **316/320/319 input tokens saved** at 8K/10K/12K and changes all three observed near-boundary requests from rejected to admitted. The three payload-heavy negative controls reject in both arms. Its [live result](../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/payload-live-v1/RESULT.md) shows near-boundary success **3/3 versus 0/3**, with all six unpressured controls passing and stronger-pressure rows blocking in both arms. The 18 live rows use 94 model calls and have 401,221 observed model tokens with complete usage. These matched interventions support narrow causation; they do not establish task-family or pressure generalization.

### 4. Use repeated reads as a measured candidate, not an automatic waste label

The external traces contain 144 exact repeated calls, including 121 `read_file` calls. They occur in 9 patch-submitted attempts (19 repeats), 9 unable attempts (76), and 6 run-error attempts (26). The association with failure is confounded by longer trajectories, and successful attempts also reread. A progress view exposing path, exact range, source pin, freshness, and archive status is worth testing, but no current count proves those tokens avoidable.

In the GLM traces, 76 `delivery.read-deferred` and 12 `completion.repeat-read-deferred` observations are explicit controller outcomes rather than malformed calls. The scanner found no non-object call arguments and no duplicate call IDs within an exchange across 3,427 GLM calls. It checked call/observation cardinality only for histories with a nonempty observation list; zero mismatches were found under that condition. Deferred results should keep their reason codes and more clearly state the allowed next call. Rejection ledgers should also retain a bounded safe rendering or digest of the original invalid arguments: the current external event records replace them with null, limiting diagnosis.

### 5. Make missing usage a first-class terminal state

Thirty live/provider receipts lack complete input/output values. They appear at failure boundaries across external-context, provider-study, and qualification evidence; [aggregates.json](aggregates.json) lists every affected path. The existing data cannot establish whether those calls were billed, partially processed, or zero-cost. Adding `usage_known`, a provider terminal class, and explicit zero-versus-unknown fields would make later cost and recovery analysis defensible.

## Limitations

This audit did not run providers, Docker, or tests and did not inspect hidden reasoning. Hash coverage is complete for the discovered checkout, while semantic review is bounded: machine parsing covers structured artifacts; manual causal review targets the recurring failures and high-value H21/H23 studies. The family/study count reflects path groups, including intermediate and analysis variants, rather than claiming each directory is an independent experiment. Source-currentness and whether historical defects remain in current runtime code belong to the companion source audit.

## Open Questions

- What usage, if any, was billed for the 30 live/provider receipts missing input/output values?
- Which repeated reads were required by freshness, recovery, or source-pin rules?
- Can example-bearing feedback or a repeated-error circuit breaker prevent schema loops while saving more tokens than the added prompt costs?
- Do H21 and H23 replicate on held-out task families and genuine larger-payload pressure?
- Can future artifacts carry a stable attempt ID across result, capture, review, snapshot, and ledger representations so deduplication does not rely on path contracts?
