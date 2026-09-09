---
module: ontology-evidence-workbench-typed-test-recovery
version: candidate-1
status: planned
updatedAt: 2026-08-03
docType: implementation-layering
---

# Implementation Layering: OEW Typed-Test Recovery

## Target and scope

Brownfield private builder recovery. Layer value is the decision unlocked,
visible operator evidence, and risk reduced; layer cost is code, verification,
and coordination. Each layer stops before a new authority or runtime boundary.

## Layer decisions

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether unsafe transient diagnostics can become one deterministic private artifact. | pure sanitizer plus exclusive writer | bounds, redaction, digests, path containment, collision, re-read | builder orchestration, patch repair | no-network unit fixtures | promote only if all positive/negative primitive fixtures pass |
| L1 | After this layer, we know whether the actual typed-gate failure path preserves evidence and cleanup without false success. | injected runner/writer through typed nonzero branch | one-call order, blocker precedence, cleanup | successor patch/binding, retry | builder contract fixtures drive pass/nonzero/writer/cleanup paths | promote only if no later command/success handle and cleanup proofs pass |
| L2 | After this layer, we know whether producer failure evidence can be admitted and joined without collapsing owners. | bounded terminal slot and generic reference | admission/reference contract and negative behavior | compatibility repair, public Task Session maintenance, real build/browser | planning contract checks | promote only to package verification |
| L3 | After this layer, we know whether the prevention package is closed and the independent compatibility choice is safely routed. | read-only package verification plus decision packet | complete private fixture suite, scope/whitespace/link checks, owner ceiling | selected repair, network, build, browser, retry, release | verification receipt and compatibility decision handoff | route to Decision Gate; never directly to runtime execution |

## Non-regression guardrails

- Patch0004, binding006, consumed attempt, and existing terminal receipts remain
  immutable.
- No blocked branch produces a success handle.
- Cleanup, source non-retention, and no-retry remain true at every layer.
- Later layers cannot weaken L0 bounds/redaction or L1 blocker precedence.
- Unit focus fixtures never become browser acceptance evidence.

## Recommended next layer

L0, beginning with `SWU-OEWFR-001`. Major deferred scope is the compatibility
repair decision, any fresh generalized build/browser attempt, and the separate
public Task Session maintenance route.
