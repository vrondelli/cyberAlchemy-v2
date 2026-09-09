# Queries: Learner Projection And Next-Route Guide

## InspectFocusedSubject

**Type:** Query (read-only)

Input: current snapshot ID and exact subject ID.

Output: semantic anchor, profile expectation, source observation, evaluator
finding set, proof tier, invalidation state, and allowed explanation. The query
must preserve record classes and may return `ABSTAIN`.

## GetRouteSuggestion

**Type:** Query (read-only)

Input: current snapshot ID and evidence-gap ID.

Output: the literal candidate destination `TypeScript adapter owner`, exact
verification question, proposed witness, prerequisites, invalidation rule, and
`authority_effect: none`.

The query returns no suggestion when the snapshot is stale/invalid, the gap is
closed, the owner string conflicts, prerequisites are circular, or any output
would resemble confirmation, registration, dispatch, or execution.

## ExplainPositiveFixture

For `implementation.payment.MaxAmountRule`, return only
`FIXTURE_HAS_NO_REPORTED_FINDING` and the explicit limitation that no positive
per-assertion record, semantic identity, live-source conformance, or runtime
proof exists.
