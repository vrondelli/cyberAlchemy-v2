# Reviewed amended external result: D07 and D08 successor v2

Status: retrospective source-bound projection. Authority effect none. All v1 graph,
registration and work-state snapshots are preserved. This successor adds the actual
reviewed LongMemEval result after explicit recovery and independent-control amendments.
It does not turn a stopped raw run into a clean completed experiment.

## longmemeval-sequential-v2-amended

The stopped sequential-v1 decision opens a question about note-budget failure. The
v2 hypothesis and experiment address that successor. Their native observation and
learning decision now exist in
`../longmemeval-sequential-v2/finish-independent-control/observations.json`.
They remain inconclusive about a clean causal claim and recommend against retaining
source-linked notes as a demonstrated improvement.

Actual final disposition: control succeeds on 6/8 slots and completes 8/8; ARE
succeeds on 3/8 and completes 7/8. The failed treatment stays in the fixed denominator.
Fifteen answers plus one failed slot account for all sixteen planned answer slots.
Whole-branch token use is 152,973, including the earlier stopped protocol. No failed
model generation was retried to improve the result. Descriptive results preserve
the explicit post-stop amendments and scoring ambiguity.

The registration binds existing native records to exact result-file bytes, both
blind review files, the original v2 freeze and every original frozen source, recovery
freeze and sources, independent-control freeze and sources, and continuation review.
No new hypothesis, quality observation or decision text is invented by this adapter.

## Prior chains retained

The `selectivity-v2`, `longmemeval-sequential-v1`, and `personamem-admission`
registrations retain the semantics documented in [D07-SUCCESSOR.md](D07-SUCCESSOR.md).
Their explicit lineage still begins at the prototype's open research question.
The v2 amended LongMemEval chain instead follows the stopped sequential-v1 question.
These declarations are retrospective logical dependencies, not preregistration dates.
PersonaMem remains context/budget blocked with no quality score.

## Verification and work state

`project-dag-v2.mjs --check` rebuilds the graph with the native D07 API and the same
source-validating registration seam. All three negative tampering cases still fail.
The graph has 30 nodes and 29 edges, with three open frontier questions.

`d07-bound-work-state-v2.json` preserves the stopped original `A-V2-RUN` state and
adds completed `A-V2-AMENDED-REVIEW`. Its criterion verifier checks all fifteen
reviewed outputs against the actual blind reviews, arm counts, fixed denominators,
generation dispositions and cumulative token totals. Completion here means a reviewed
full-slot disposition, not every model call succeeding or a measured ARE improvement.
The old D08 event history is first replayed through its original substantive verifier.
A new native replay binds the completed amendment review to the new plan and artifact.

Reproduce from the repository root:

`node development/agent-reasoning-engine/planning/representation-preferences/benchmark-pilot-v2/execution/work-tracking/project-dag-v2.mjs --check`

## Open Questions

Why did the retained notes omit useful facts, and how much did reference text cost?
Would exact source recovery at question time improve results under the same budget?
What feasible separately frozen protocol should handle PersonaMem? The recorded
learning decisions own these questions; this version grants no follow-up model calls,
production retention, release approval or broad cross-model claim.
