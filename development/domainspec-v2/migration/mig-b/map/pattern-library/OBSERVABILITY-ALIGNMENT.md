# Observability Alignment

## Evidence chain

Every materialization or conformance run should expose:

- input intent identity and digest;
- admitted baseline and selected realization identity;
- exact component and target-file closure;
- tool/runtime identities and bounded environment selectors;
- declared effects and observed effects;
- per-provider result, residue, and claim ceiling;
- direct/replay or reproduction relationship;
- terminal outcome and explicit next route; and
- a separate owner decision reference when admission occurs.

## Failure truth

- Missing evidence is `not_evaluable`, never PASS.
- Unknown provider output is unresolved evidence, never semantic success.
- A stale or widened handle fails closed.
- Partial generation or partial effect publication cannot be hidden by a later successful cleanup.
- Operation and Workflow failures preserve explicit continuations and durable recovery state.
- Claim/Lease loss, replay rejection, compensation failure, and terminal exhaustion are visible outcomes.

## Current observability surfaces

Factory run locks, semantic receipts, replay, reproduction, target manifests, ontology validation receipts,
Task Session results, and owner decisions already form the major evidence vocabulary. Craft and the project
inventory help navigate that evidence but are not terminal truth. The migration must preserve source-bound
receipts while rebinding only genuinely location-dependent references in a separately validated successor
receipt.
