---
module: ontology-vault-runtime-api
version: candidate-v0
status: plan-blocked
updatedAt: 2026-07-30
docType: implementation-layering
authority_effect: none
---

# Implementation Layering: Ontology Vault Runtime API

## Purpose And Boundary

Sequence a private fixture runtime from the narrowest admission contract to an
end-to-end local witness. This artifact proposes an inactive private root,
`cyberAlchemy-v2/implementation/ontology-runtime/`; the implementation owner
must ratify or replace that path before any SWU is selected.

Layer value = decision unlocked + observable outcome + risk reduced.  
Layer cost = implementation + verification + coordination.

## Preconditions Before L0

The runtime-contract owner, implementation owner, five transition owner
families, fixture-cap owner, and isolation decision must be bound. Until then,
recommended next layer is **blocked before L0**.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether one declared fixture can become one deterministic immutable snapshot and support the exact v0 read/operation contract without authority collapse. | SWU-OVR-001 first; then SWU-OVR-002–007 in sequence | frozen schemas/config admission, fixture adapter, compiler, minimum GETs, native validation, same-adapter diff, draft bytes | isolation hardening beyond the fixture, later adapters, retention/GC, remote use | contract, determinism, curl/API, native-separation, diff, draft, source-preservation receipts | stop/pivot or enter L1 |
| L1 | After this layer, we know whether the L0 contract fails closed under abuse, caps, and concurrent mutation. | SWU-OVR-008–010 | process/path/outbound isolation, every fixture cap, race/replay | packaging and repeated lifecycle witness | security, resource, and controlled-race receipts | remediate or enter L2 |
| L2 | After this layer, we know whether repeated local start/use/stop preserves all L0/L1 guarantees with zero owned residue. | SWU-OVR-011 plus verification/audit exemptions | exact lifecycle handle, repeat replay, teardown, full claim-ceiling audit | project adapters and release | repeated local-fixture receipt, zero residue, authority audit | stop or consider L3 decision |
| L3 | After this layer, we know whether owner-selected packaging or one later adapter is justified without widening v0 authority. | no admitted SWU | decision record only | Augmentor until race closes; Body War/CAV2 until exact owner gates | new approved Define/Design/Plan delta and adapter-native witness contract | separate future work-pack or defer |

## Boundary Heuristic

- L0 stops once the complete fixture contract is falsifiable; security/race
  stress adds less value to the core feasibility decision than a separate
  hardening layer.
- L1 stops once fail-closed behavior is witnessed under named stressors;
  packaging/teardown repeatability is a distinct lifecycle decision.
- L2 stops at a repeatable private witness. Deployment, registry release,
  production, and later adapters are different owner decisions.
- L3 is intentionally not executable in this work-pack.

## Non-regression Guardrails

Later layers must preserve deterministic bytes, logical-ID-only interfaces,
source preservation, exact native results, both confidence axes, local facet
qualification, invariant authority none, create-only publication, zero
outbound requests, typed cap failures, and exact-owned teardown.

## Recommended Next Layer

- Next layer: blocked before L0
- First future unit after owner gates: SWU-OVR-001
- Key decision: can one frozen registration/schema contract reject malformed
  input deterministically without source or runtime-store mutation?
- Major deferral: compiler/server work does not begin until this contract passes.

