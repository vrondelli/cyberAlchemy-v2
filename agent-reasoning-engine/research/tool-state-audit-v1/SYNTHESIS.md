# Audit synthesis: repair the instrument before testing state usefulness

Status: three audits joined; parent verification and candidate plan complete.
Authority effect: none. The [objective](OBJECTIVE.md) is user-directed guidance;
this report proposes work and does not activate a policy.

## Main conclusion

The tools contain preventable failure paths, but we should not attribute every
failed task to tools. The strongest current finding is **inconsistent contracts
between offered actions, validation, execution, feedback and completion gates**.
A second gap is that preserved archives and workflow metadata are not an evolving,
validated account of useful task evidence. A third is incomplete or incomparable
token measurement across historical experiments.

The shared patch validator already reports multiple errors in one bounded
response. Replacing it with another validator would miss the main integration
problems. The parent [independent checks](parent-verification.json) reproduced
six simultaneous shape diagnostics, a typed malformed-call rejection, and the
provider-schema/local-parser path/hash mismatch. The latter is rejected locally;
it is a communication gap, not unsafe acceptance of an out-of-scope patch.

## Prioritized opportunities

| Priority | Finding | Evidence and interpretation | Next acceptance test |
| --- | --- | --- | --- |
| P0 | Recoverable invalid calls become terminal; required recovery actions disappear | TC-001/002/007: native malformed call returns a typed host BLOCK with no correction tool message; checkpoint exact-match feedback requests a reread while reads are unavailable; external errors lose safe categories | Invalid request → compact complete diagnostic → allowed corrective read/edit → valid retry within total-token cap. Preserve whole-batch validation and zero effects on rejection. |
| P0 | Offered terminal action can contradict completion gate | TC-005/010: native final turn may demand a patch despite unmet prerequisites; external inability can be a placeholder | Table-driven gate/action equivalence; no impossible submission instruction; structured incomplete result references actual blockers/evidence without fabricating a reason. |
| P1 | Paging occurs after oversized full-result rejection | TC-003: full read fails at 65,536-byte result cap before pageObservation can slice it | Source larger than full-result ceiling delivered in bounded, gap-free pages with pinned full-file hash, Unicode/range/drift checks and valid completion accounting. |
| P1 | Edit argument contract leaves avoidable binding failures | TC-004/006: unrelated allowlisted hash accepted by advertised shape then rejected locally; repeated missing edit path in live traces | Source-bound edit identity and precise path/hash agreement; missing, wrong, stale and cross-paired inputs fail with all diagnostics. Evaluate provider-supported schema or adapter alternatives before choosing one. |
| P2 | State capture and model-visible state are conflated | TC-008: recycler clones initial task_state; separate workflow snapshot preserves hypotheses/candidates/tests but not all source conclusions | Distinguish archived, retrieved, presented and confirmed-delivered evidence; preserve typed claims with source refs and uncertainty; no promotion of model claims into facts by storage alone. |
| P2 | Repeated presentation may consume unnecessary input | TC-009 and H23: redundant envelopes and repeated evidence are candidates for lossless reduction | Reconstruct exact payload/provenance; measure actual input/output tokens and outcomes. Repetition may aid salience, so bytes or repeated reads alone do not prove waste. |

These priorities group defects by contract rather than by the next failing field.
The [tool audit](tool-contracts/AUDIT.md) and [finding records](tool-contracts/findings.json)
contain concrete paths, event indices, evidence posture, proposed repairs and
regression cases. Current implementation findings, source-only opportunities and
historical mitigated defects remain distinct. TC-011 raw staging-stack exposure
is already improved on the current path; retain it as a regression case instead
of claiming a new unfixed bug.

The native malformed-call error remains `glm.tool-arguments-invalid` at the host;
it is not collapsed to `glm.runtime-failed`. The failure is absence of a bounded
model-visible correction path. This correction to the preliminary auditor summary
was independently checked before inclusion here.

## Trace interpretation and measurement work

The [trace audit](experiment-traces/AUDIT.md) and its
[coverage manifest](experiment-traces/coverage.json) scan 16,266 regular files
(425,894,163 bytes) plus four symlinks across four benchmark families. The 850
exact-content duplicate groups are an inventory observation, not a count of
redundant model calls. Semantic aggregation selects representations and separates
live, scripted and synthetic evidence; historical lineage ambiguities prevent a
definitive whole-project consumption total.

Across 39 external event files, the scan finds 969 events, 31 failed results and
144 repeated exact calls. Repetition may be necessary after source changes or for
verification. The parent checked all 21 records flagged for non-object arguments:
all store null. A sampled event reports a line-count maximum violation. These are
rejected-argument records, not evidence of 21 malformed transport JSON messages.
Preserve a safe rejected-input representation and structured diagnostics so future
analysis can distinguish model errors, validation and lossy logging.

One independently checked six-turn staging loop repeated the same missing-path
error without accepting an edit, consuming **50,552 input + 2,836 output = 53,388
model tokens**. That establishes a costly failed correction sequence, not that
all those tokens can safely be eliminated. Test reusable correction behavior
against held-out argument failures before claiming savings.

The visible-trace scan covers 3,427 tool calls and 88 `ok:false` observations:
76 delivery-read deferrals and 12 repeat-read deferrals. These are explicit
controller decisions, not 88 unexpected tool crashes. Its
structural checks do not establish semantic argument correctness or recovery
quality. Token aggregates must retain missing-usage coverage and source lineage;
neither missing receipts nor copied exports should silently become zero-cost or
additional independent runs. These findings motivate F before any efficiency claim.

## What the experiment history changes

See the [full recap](experiment-recap/RECAP.md) and [inventory](experiment-recap/inventory.json).

| Evidence | What to retain | What remains unproved |
| --- | --- | --- |
| Known-fixture GLM qualification: 28/36 initial, 36/36 final | Correction can materially improve completion; retain all earlier failed campaigns separately | First-proposal quality, fresh-task qualification and whole GLM readiness |
| H21 ordinary source preservation | Candidate 12/12 versus baseline 6/12; five fully observed delayed semantic wins plus a candidate completion paired with a timeout; source still fits | Formal all-known screen remains inconclusive; no actual recycles; candidate measured input is ~5.1% higher; equal calls are not equal total tokens |
| H22 post-delivery pressure | Both needed facts delivered, then absent at fallback in all three pressured candidate rows; wrong archive choices did not restore them | Mechanical archive access does not establish recovery of relevant evidence |
| H23 lossless envelope reduction | Near-boundary candidate 3/3 versus baseline 0/3; matched tokenizer savings 316–320 input tokens; complete payloads preserved | Stronger-pressure rows blocked before useful evidence delivery; not proof of post-delivery recovery or compressed reasoning-state benefit |
| Feedback timing on real tasks | Twelve episodes, 3/6 verified repairs per arm | No live syntax-invalid candidate; does not disprove benefits of earlier error feedback generally |
| Recovery reservation on real tasks | Eight episodes, 1/4 verified repairs per arm; three checkpoint-exposed episodes produced no accepted candidate | No benefit for strict checkpoints; task 16542 still unresolved; successful reserved patch preceded exposure |

The recent conversation's statement that state usefulness had not been tested
was too broad. Specific source-availability and presentation mechanisms were
tested. What is missing is a clean test of **useful bounded working state under
actual post-delivery pressure and cumulative input-plus-output token budgets**.
New work should extend H21/H22/H23, not restart their questions from zero.

[H21 source](../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/live-admission-v1/RESULT.md),
[H22 source](../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/measured-pressure-episode-v1/RESULT.md),
[H23 source](../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/payload-live-v1/RESULT.md).

## Audit scope and limits

Three requested agents worked independently: two Sol/medium auditors for source
contracts and experiment traces, plus a recap agent. Parent checked selected
current source/event claims and corrected attribution before planning. No new
model/tokenizer calls, Docker evaluations or runtime fixes were performed.

The recap inventories 15,096 files and 94 **overlapping family/package roots**,
including 334 report/plan documents. These are not 94 independent live experiments.
Its report explicitly distinguishes complete bounded path discovery from selected
content review and missing historical results. The trace audit has a different
scope/filter and owns event/attempt/token denominators; do not add the two inventories
or merge unrelated live, offline, synthetic, correction and replay populations.

Some old reports reference absent artifacts or historical temporary paths. Those
claims remain attributed history rather than newly verified results. Selected
recent frozen source manifests remain unchanged; see [preservation check](preservation-check.json).
Updating the user-directed lighthouse does not rewrite frozen experiment inputs
or refresh historical planning-document hashes to conceal a change.

## Decision and Open Questions

First bind the P0/P1 tool repairs and offline regression corpus, and normalize
measurement in parallel. Then freeze a direct state-usefulness comparison,
followed by token-budget curves and independent real-task qualification. Keep
workflow changes fixed across state arms. The [plan](PLAN.md) owns the DAG and
exact gates; the existing GLM finish tracker remains open beyond small-window work.

Which source-reproduced gaps explain actual task failures, and which are merely
future hazards? How much of repeated presentation is useful salience? Which
state representation preserves necessary evidence without inventing certainty?
What data cannot be recovered from old traces and must be collected prospectively?
