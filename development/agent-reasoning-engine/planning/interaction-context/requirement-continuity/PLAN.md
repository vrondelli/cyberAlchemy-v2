# ARE requirement continuity — construction slice

Status: implementation in progress. Route: CA2-ROUTE-IMPLEMENT.
Owner: ARE runtime and implementation owners. Authority effect: none.
User direction: “plan and do next”, following the Interaction Learning Loop discussion.

## Current evidence and intended result

The broader interaction plan predates the objective lifecycle, requirement-set
contracts and local operation grammar now in the implementation. Objective
interpretation already precedes preflight and uses the existing reasoning ledger.
The next integration is to preserve explicit requirements alongside that objective.
This is a bounded step toward the learning loop, not completion of that loop.

Given an explicitly seeded requirement set, add/remove/keep operations must reach
the next model request with exact set accounting. Interrupting work must park its
requirements; resuming it must restore them. A restart must replay the same state,
without seeding again or repeating a dispatch. A requirement is a declared property
of work, never evidence of completion or permission to act.

## Product-construction lane

1. A: capture existing dirty bytes and run the intent/wrapper baseline.
2. D/M: reuse the existing objective and requirement definitions; freeze the
   bounded interface and selected ontology dependencies in MODEL.json; compile
   an isolated DomainSpec prototype without altering the shared dirty projections.
3. I/P: opt-in wrapper requirement tracking, local operations, explicit initial
   snapshots, suspension/resumption, checkpoint and replay using the existing ledger.
4. T/C: test actual outgoing requests, default-disabled compatibility, malformed
   snapshots, stale/cross-consumer input, budgets, provider bounds, checkpoint
   failures, interrupted objectives and real file-backed recovery. Freeze the
   exact changed-source candidate and report the current tests.

Runnable frontier: D/M then I/P. Causal dependencies: exact objective identity,
current snapshot binding, explicit seed provenance, preserved historical records,
and checkpoint success before forwarding. Unknown requirements are never silently
initialized to an empty set. A host may explicitly seed an empty set.

Implementation targets: wrapper src/objective-requirements.mjs (new),
src/objective-lifecycle.mjs, src/config.mjs, src/wrapper.mjs,
test/objective-requirements.test.mjs (new). Planning/model/test evidence is confined
to this directory. Existing intent contracts and grammar implementations are reused.
Existing serving profiles, historical receipts and source registries are unchanged.

## Operational-support lane

- ARE integration owner: reconcile existing relocation/source-registry changes.
  Affected stage: shared model integration; no dependency for this isolated prototype.
- ARE runtime owner: production policy/provider activation and host wiring.
  Affected stage: later operational activation; deferred. The previously measured
  model fallback failed the one-second gate; this slice adds no live model adapter.
- Product owner: review the tested exact candidate after T/C. Product approval is
  separate from activation, admission or release.
- Publication owner: commit/push/deployment, deferred and outside this request.

## Open Questions

Which host supplies source-verified initial requirement snapshots in ordinary use?
How should semantically implicit requirements be established? How should completed
or retired objectives be pruned under a future retention policy? Scoped preference
learning and outcome-to-evolution integration remain with the parent plan.
