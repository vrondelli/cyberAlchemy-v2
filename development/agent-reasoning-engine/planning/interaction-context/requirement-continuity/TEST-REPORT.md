# Requirement continuity — tested construction slice

ARE's opt-in wrapper now preserves explicitly seeded requirements through local
add/remove/keep operations, ordinary continuation, interruptions, resumption and
file-backed restart. The current snapshot reaches the actual outgoing request.
This advances the existing interaction-learning plan; the complete learning loop
is not implemented by this slice.

## Current evidence

- Candidate: `ARE-REQUIREMENT-CONTINUITY-001`.
- Exact candidate digest: `52229af61a630f1a1a54232df01a7a11b11901194a1c5b211a3ff0822c6dc361`.
- Runtime: Node v26.8.1, Linux/WSL.
- Baseline: 194 intent/wrapper tests passed, zero failures/skips.
- Final: **547 ARE package/root tests passed**, zero failures, cancellations,
  skips or todos. Includes 16 new requirement-continuity behavior tests.
- Isolated DomainSpec: three authored nodes, deterministic graph and system
  scaffold; fresh source checks and replay passed. No shared projections changed.
- Preservation: all 188 pre-existing dirty files retained their exact bytes.
- Model calls for supported local requirement operations: zero, asserted by tests.
- Live model canary: **NOT_RUN**. The optional provider retains its existing
  deadline; this slice installs no model adapter and claims no semantic gain.

Full machine result: [TEST-RESULT.json](TEST-RESULT.json). Exact selected source
closure: [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json). Reproduction and host-input
contract: [INTEGRATION.md](INTEGRATION.md).

## What is protected

Requirements are not inferred to be empty. Seeds bind the exact request, consumer,
scope, objective and state. Changes cannot silently lose prior entries. Suspended
work keeps its own set. Replay checks the predecessor and exact set accounting;
recorded requests are never implicitly dispatched again. Checkpoint failure
forwards nothing. Negative tests cover malformed/stale/cross-scope seeds, quoted
or conditional near-misses, provider timeout, corrupted replay and byte overflow.

The prototype enforces the existing selected-content budget, not a total wire
message limit. Existing cache projections and envelope metadata repeat content
on the wire. A seed adapter verifies host-selected evidence; hashing alone does
not establish the truth of that evidence. General provider proposals remain
structurally checked interpretations.

## Construction and operational lanes

Product construction: this exact requirement-continuity slice is tested and ready
for owner product review. Scoped lesson/application and outcome-to-evolution work
remain at the parent plan's later frontier; the older plan's “objective routing
not implemented” wording is historical relative to the current code.

Operational support: ARE integration owner retains shared source-registry and
projection reconciliation; ARE runtime owner retains seed-source policy and host
activation. Those tasks affect later shared integration and operational use, not
this isolated test result. Publication, admission and deployment remain deferred.
Existing serving profiles and historical acceptance/evidence records were not
changed. Product approval is not requested or manufactured by this receipt.

## Open Questions

See [INTEGRATION.md](INTEGRATION.md) for initial seed provenance, bounded retention,
legacy-state migration and unsupported general-language transitions. No general
learning benefit, whole-engine conformance or production readiness is claimed.
