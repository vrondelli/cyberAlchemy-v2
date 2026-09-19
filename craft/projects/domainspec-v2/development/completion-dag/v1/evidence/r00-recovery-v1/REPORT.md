# R00 recovery baseline

R00 is complete as a bounded source reconciliation. Recovery implementation is still incomplete.

## What to reuse

The TypeScript, Python, and Rust reference planners already construct deterministic Recovery Intent and occurrence identities. Their executors verify the supplied plan, preflight every Operation binding, invoke in order, and leave durable terminal disposition empty. Extend their durable boundaries rather than recreating planning. Existing Python recovery tests passed in this run; TypeScript, Rust, and generated-target test files were inspected but their suites were not rerun.

The provider-neutral compiler already forms dependency, persistence, transaction, failure, and durable-runtime bindings and emits three-language contract surfaces. These are metadata and contract formation, not implemented persistence methods or proven transactions. Both compiler variants preserve runtime_guarantees_observed=false.

## What remains to build

The inventory covers all 23 architecture components, including 11 designed runtime gaps: coordination store, claim coordinator, lease service, durable worker, attempt journal, Operation-owned invocation ledger, retry scheduler, terminal recorder, restart reconciler, dispatch outbox publisher, and telemetry contract. Each gap links the architecture findings and required invariant evidence. Clock and Wakeup have generated contracts but still need concrete runtime behavior.

The 30 selected invariants retain their exact property/constraint/finding joins. R00 does not turn their historical supported/partial/unsupported labels into current runtime PASS results. Durable execution checks remain not_evaluable pending a testable candidate.

## Drift and implementation boundaries

Eight of the architecture source index's 25 recorded hashes differ from current files: CLI generator, generated-target tests, current implementation pointer, system-integration compiler, validator and tests, and CLI system-integration compiler and tests. The new source manifest retains both old and current digests. The current implementation pointer still denies durable dispatch. Current message/transport binding extensions do not establish recovery durability or add a recovery dead-letter state. The architecture source index is preserved; refreshing it and its receipts is a separate owner task.

The working CLI contains pre-existing edits. This inventory describes bound working-tree source, not the approved Stable compiler package. No existing implementation or acceptance-bound bytes were changed. Source references outside inspected code selectors are provenance bindings, not newly evaluated authority decisions. This is a bounded source inventory, not a repository-wide proof of absence.

## Construction frontier

R01 is next: define one local recovery product, select one provider candidate and language, and specify finite crash/retry/fencing/identity/terminal scenarios. R00 selects neither provider nor language. Preserve the coordination transaction versus Operation business transaction boundary, and distinguish at-least-once invocation from idempotent semantic application.

R01, U00, and L00 are dependency-ready. No current R00 source-baseline blocker remains. The compiler and bounded EVF approvals are carried forward as prior recorded milestones, not revalidated here. Recovery product approval remains pending.

## Operational support

- Architecture/source-index owner: reconcile eight stale source bindings and any dependent architecture receipts; stage source-index maintenance, deferred and not a prerequisite to R01 definitions based on this manifest.
- Repository/release owner: O01 compiler release preparation, deferred.
- Portable EVF package owner: O06 distribution publication, deferred.
- E03/E04 execution owner: runtime environment was verified for recorded E04 runs; recheck before future native provider runs.
- Portable EVF/TLC owner: prior intermittent TLC setup failure remains unresolved; no dependency on R00 or R01 definitions.

See INVENTORY.json for each component and invariant, source-manifest.json for selected bytes and drift, CHECKS.json for raw test results, and receipt.json for the bounded completion claim.
