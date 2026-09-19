# Independent v2 construction review

Status: candidate implementation review; **not live-ready approval**. No model
calls were made. Standalone terminal-evidence tests pass; actual episode/request
integration remains a prerequisite.
No v1 source or evidence was edited.

## Contract and scope

The plan preserves the 8,000-token actual-input-plus-reserved-output boundary,
15% cumulative model-token reduction per benchmark, all assigned outcomes and the
original research method. Maximum quality is additional to these requirements;
valid selections or improving averages do not replace it.

Before live freeze, name the exact per-task perfect-quality vector: LongMemEval
native-rubric success for every assigned answer and ContextBench valid, complete
selections with span/file coverage and precision and derived Span-F1 all equal to
one. Record other native metrics unchanged. State the exact scorer, all planned
slots, repetitions and how unknown usage or instrument failures prevent success.
A same-model judge's yes is a result under that scorer, not independent proof of
answer truth. Any broader native/full-benchmark perfection claim needs its complete
metric and dataset contract; four development tasks cannot establish it.

Confirmation identities must be untouched before selection and frozen independently
of development outcomes. Repeatedly tuning the same four tasks can improve those
tasks but never turns them into held-out evidence. Keep failed versions visible.

## Scheduler findings

The scheduler now checks a benchmark's active group before reserving a global slot
or tokens. This fixes the observed v1 stranded-slot behavior. A finite acyclic
manifest with positive group limits has no newly identified dependency deadlock.
Known/unknown accounting, exclusive ownership, interruption recovery, immutable
manifests and no-retry semantics remain inherited. Twenty-eight scheduler/group/pool/storage/terminal-evidence checks passed
independently, including unequal-duration progress and resume.

The fairness claim should remain precise: at nominal concurrency equal to the sum
of group limits, slow jobs from one benchmark cannot occupy another's group slots.
After rate-limit reduction below that sum, manifest-order scheduling can favor the
first group until it drains; this is not round-robin fairness. Preserve throttling
and measure actual request overlap. Do not infer throughput or simultaneous model
calls from reserved worker count.

The previously identified journal-I/O edge is resolved. Acquisition now occurs
inside the protected block; a journal error before executor entry records known
zero model usage, and counters are released. A release-journal error preserves
known result usage or the original failure receipt. Both acquisition and release
fault-injection tests pass; no remaining accounting defect was found in this fix.

## Storage and call accounting

The pool correctly forces its actual output root after supplied storage options
and records pre-executor disk admission failures as zero model spend. The added
`source-slots.mjs` explicitly counts `pairs/<id>/run/<arm>/base|work` and reserves
four trees for every active or next ContextBench pair. Active trees are not double
counted; retained completed trees remain counted. The bounded path traversal does
not descend into source contents and rejects symlinked ownership paths. The tests
cover retained plus in-flight reservations and the top-level pairs-symlink bypass.
The previous nested-tree-cap finding is resolved for this owned layout.

These are pair-entry checks; actual per-model-dispatch disk admission is still an
episode/provider integration requirement. The four-tree reservation assumes two
sequential arms with exactly one base and one work clone each. A paging/recovery
implementation that creates additional clones must declare and reserve those
separately. Native evaluator worktrees and shared caches are separate storage.

Before dispatch, freeze per-call output caps, maximum calls, corrections/retries,
terminal review allowances, model-assisted memory and judge allocations. Include
terminal state and its entire tool schema in real request tokenization. State-text
sizing alone is not 8K admission. Include repeated histories, all failed/corrective
calls and judges in the same matched cumulative denominator. A single selected
terminal call can be a useful mechanism diagnostic while remaining incapable of
proving 15% whole-task savings on an expensive unchanged prefix.

## Terminal evidence assessment

The standalone module preserves exact H72 tool/schema behavior at the default
three-handle limit and uses a separate tool and receipt-bound decoder for the
explicit expanded 1–32-handle contract. Its four-file test reaches the unchanged
native exporter with all four actual delivered IDs, rather than merely passing a
permissive schema. Strict envelope checks reject unknown/duplicate handles, wrong
types, extra fields and missing summary. Empty selection is valid syntax, not
successful completion.

The capture-based builder reconstructs confirmed delivery; tokenizer-only input
cannot create candidates. Whole reads containing edited/unmapped lines are excluded.
Unchanged reads from shifted current source retain their original delivered IDs
and exact mapped base coordinates. Acceptance rechecks packet integrity, actual
successful request state/tool bytes, terminal response/receipt binding and source
projection. Cross-page reuse and altered base evidence fail closed in the tests.
No standalone provenance/schema blocker was found in the reviewed module.

Remaining integration risks are concrete:

- Hold every first terminal candidate before acceptance, including early raw-JSON
  empty selections. Hooking only the budget-driven finalization phase misses a
  demonstrated failure boundary.
- Persist the private packet for the actual successful request, matched by its
  request digest. A last-tokenizer-candidate variable is not a delivery binding.
- Emit only `packet.model`; never serialize private full IDs. Inherited IDs remain
  a separately controlled arm exposure.
- Use the expanded selector/exporter in both acceptance and independent replay.
  The original native terminal entrypoints reject wider bindings and the new tool.
- Give the model the matching terminal tool name, and tokenize the full wire request
  including schema and reserved output. Fixture token estimates prove no live8K
  admission.
- A non-ready packet must yield an explicit instrument/no-evidence disposition.
  Empty, truncated or omitted candidates cannot count as perfect evidence access.
- Paging has no runtime request tool or cross-page accumulator yet. Its omission
  counts are honest, but private archive availability alone does not expose that
  evidence to the model. Freeze a bounded paging policy before claiming coverage.

These are live integration gates, not requests to alter the fixed native scorer.

## Recommended bounded next experiment

First replay archived empty-selection and edited-source failures offline. Prove
that every offered handle resolves to delivered, base-projectable evidence, that
pages expose omissions explicitly, and that the expanded schema rejects malformed,
duplicate, unknown or unbound handles. Preserve default H72 three-handle behavior;
version the wider contract independently. Whole-read spans can impose a precision
ceiling even with 32 handles: provenance validity is not sufficient for perfect
native relevance. An evaluator-only diagnostic may assess attainable source
coverage without feeding gold locations back into candidate selection.

Then freeze a small paired canary: two exposed ContextBench cases representing
those failure mechanisms and two LongMemEval cases testing the generic preference
scope intervention, one repetition with fixed arm order. Prefer bounded archived
continuations where the exact causal boundary is reproducible; otherwise declare
and budget fresh full trajectories. Two workers per benchmark is sufficient.
Charge reused prefixes to both logical arms and new dispatch once physically.
Choose exact IDs, maximum calls and a numeric global cap from real token admission
before any new output is observed. Retain every assigned outcome; this canary may
advance the mechanism but cannot close the perfect-score goal or either full
benchmark. Broader full-trajectory and untouched tests follow a successful
instrument and measured evidence, not an automatic large rerun.

## Open Questions

Will base-valid evidence improve relevance as well as validity? Does page truncation
or coarse source granularity prevent perfect native quality? Does the generic
LongMemEval change transfer beyond exposed preference cases? Can stopping/reuse
save 15% while preserving perfect quality? These questions require frozen measured
experiments and independently reviewed outcomes. The journal and nested-storage findings are resolved. Context episode integration,
real full-request admission and the exact frozen canary contract remain open before
a live-ready review.
