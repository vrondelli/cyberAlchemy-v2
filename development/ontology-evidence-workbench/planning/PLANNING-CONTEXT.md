# Planning Context

## Objective

Produce a bounded implementation route for OEW from verified source admission
through a useful pinned Understand-Anything viewer proof, then a trust-aware UI,
optional code context, and hardening.

## Approved Design Inputs

- `../design/ARCHITECTURE.md`
- `../design/INTERFACE-CONCEPT.md`
- `../design/UX-PLAN.md`
- `../design/VALIDATION-CONTRACTS.md`
- `../design/DESIGN-SELECTION-RESULT.json`
- result digest:
  `5326089bad0c06931508a4243385a36fcd78482ac008d73a6e869f0c2468a2e3`

## Delivery Boundary

- New implementation root:
  `cyberAlchemy-v2/implementation/ontology-evidence-workbench/`
- Existing candidate engine/run: read-only input.
- Understand-Anything: immutable upstream pin and build input.
- Poker Team, IOLM, Craft, authority, public Arcanum: protected/read-only.
- Runtime: local, loopback, token-gated, read-only.
- First proof: existing SWU-OCGP-008 Poker run.

## Complexity

Medium:

- more than five tasks and two artifacts;
- external upstream source/build boundary;
- browser UI plus deterministic adapter;
- multiple validation surfaces and protected scopes;
- no irreversible migration or production deployment.

Therefore the Plan uses L0-L3 waves, implementation-detail task files, atomic
SWUs, an execution pack, and a shared manifest.

## Planning Decisions

1. Plan all layers, but recommend only `SWU-OEW-001` as the first eligible
   trust-building unit.
2. Keep `selected_swu: none` and `implementation_authorized: false`.
3. Build an unmodified upstream viewer at L0; introduce the OEW overlay only
   after the compatibility proof passes.
4. Require explicit human authorization before scoped Understand-Anything code
   analysis at L2.
5. Keep manual accessibility/usability evidence separate from automated
   browser evidence.

## Context Builder Readiness

Each SWU names exact source anchors, target inventory, write scope, validation,
done criteria, result shape, and closeout synchronization. Runtime Context Packs
are deliberately deferred to Task Session.

## Blockers

No blocker affects Plan authoring. Implementation remains blocked by human SWU
selection and Task Session preflight.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
