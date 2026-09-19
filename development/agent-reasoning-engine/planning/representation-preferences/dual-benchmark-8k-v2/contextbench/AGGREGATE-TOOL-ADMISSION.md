# Aggregate source-output admission candidate

Status: additive module with offline regression tests; runner integration and
independent review pending. No live experiment or quality result is claimed.

## Problem and behavior

The compact comparison failed when accumulated tool output exceeded a fresh 8K
request. Per-result limits do not bound a batch of up to eight results. This
module measures the complete compact rendering after all results are present.

The caller must supply tokenizer-only measurement of the total request envelope:
input, retained reasoning, safety margin and output reserve. Measuring only the
new output or using character estimates is not valid production integration.
The helper never dispatches a model request or reserves a driver request slot.

Every original result is archived before projection with its exact digest and
an unconfirmed-delivery label. The largest reducible result is halved until a
measured request fits or no reducible output remains. This bounds search work;
it does not claim optimal packing. Each final candidate is measured independently
because token count need not change monotonically.

Read projections preserve whole-line prefixes and recalculate observation IDs.
Search projections preserve observation order and original prefix identities.
File lists preserve path order. Each omitted suffix carries an archive digest
and continuation arguments for the existing source tool. A fully deferred
result is unsuccessful and contains no source observation. Archives and measured
prompts do not become confirmed evidence without a successful request receipt.

Mutation results, error diagnostics and patch results are not shortened or
hidden. If mandatory context still exceeds the limit, admission fails explicitly.
Archive failures, tokenizer failures and malformed provenance propagate.

## Evidence and next integration

Run `node --test` on [aggregate-tool-admission.test.mjs](aggregate-tool-admission.test.mjs).
Tests cover combined output overflow, exact prefix receipt binding, search/list
pagination, immutable original archives, mutation-result denial, failure
propagation, nonmonotonic measurements and oversized search serialization.
Controlled measurements in these tests do not establish actual model token use.

The next runnable product step is a shared runner adapter that supplies the real
tokenizer envelope, durable guarded archive writes and exactly the history that
will be dispatched. It must apply consistently to controls and treatments, and
retain every tokenizer receipt. Integrate the planner and canonical-outcome
repairs in an additive successor; do not edit frozen runs.

This implements part of budget-aware-delivery in the
[native research follow-up](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
The radical retrieval-first branch remains a competing hypothesis, not assumed
effective. Perfect native quality, 15% total-token savings against fresh controls,
full accounting and untouched confirmation remain required.

Operational owner: benchmark orchestrator. Exact source freeze, independent
launch review and D:/WSL storage admission precede any paid run. Publication and
release are deferred; no external effect is granted by these tests.

## Open Questions

Real runner integration and retained-reasoning measurement; archive storage
bounds; coherent larger passages; fairer packing than largest-result halving;
handling a single source line too large to deliver; immutable archive retrieval
when current-revision source changes between pages; independent review and the
exact retrieval-first experiment contract. Reissuing a current-revision source
call is a new observation, not guaranteed replay of archived bytes.
