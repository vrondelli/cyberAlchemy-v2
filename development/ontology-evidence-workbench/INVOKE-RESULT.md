# Invoke Result: Ontology Evidence Workbench

Date: 2026-07-27
Dispatch: `dispatch.oew.invoke-define-design-plan.2026-07-27`
Modes: Define + Design + Plan
Overall status: pass for governed artifact authoring

## Outcome

A private governed package now defines, designs, and plans the Ontology Evidence
Workbench: a trust-aware interface over verified ontology candidate-graph
evidence, using a pinned Understand-Anything viewer substrate without assigning
its generalized graph vocabulary ontology authority.

The proposed interface is **Evidence Constellation**:

```text
┌ trust rail: verified run · authority none · policy state · upstream pin ┐
├ navigator/search ─┬─ graph · outline · table · code context ─┬ inspector ┤
│ kinds/relations   │ F1 → R1 → D1; D2 contradicts D1          │ exact edge│
│ dispositions      │ specializes: policy-indeterminate        │ provenance│
└───────────────────┴──────────── receipt drawer ───────────────┴──────────┘
```

The verified candidate bundle remains the source of truth. A deterministic
adapter emits a generalized presentation graph plus a separate lossless
evidence sidecar. The UI can therefore use upstream layout and navigation while
the inspector always recovers the exact relation, disposition, provenance,
digest, and `authority_effect: none`.

## Phase Status

| Phase | Status | Evidence |
| --- | --- | --- |
| Context | pass | bounded Inventory-first context pack with local and pinned upstream evidence |
| Define | pass | feature, domain, operations, queries, interfaces, states, events, mappings, glossary |
| Design denominator | pass | 17 signals, zero unbound signals, zero diagnostics |
| Design selection | pass | 9 concerns, fixed point, zero diagnostics |
| Design output | pass | six-view architecture, interface, Poker example, UX and validation contracts |
| Plan | pass | L0-L3, nine tasks, four waves, 20 atomic SWUs, 91 unique targets |
| Dispatch | pass | root and Plan routes have zero blocks and zero flags |
| Runtime | not run | implementation root absent; no dependencies, viewer, or browser executed |

## Primary Artifacts

- [Feature specification](define/SPEC.md)
- [Architecture](design/ARCHITECTURE.md)
- [Interface concept](design/INTERFACE-CONCEPT.md)
- [Poker Team example](design/EXAMPLE.md)
- [UX plan](design/UX-PLAN.md)
- [Validation contracts](design/VALIDATION-CONTRACTS.md)
- [Implementation layering](planning/IMPLEMENTATION-LAYERING.md)
- [Work pack](planning/WORK-PACK.md)
- [Plan result](planning/PLAN-RESULT.md)
- [Validation report](planning/VALIDATION-REPORT.md)

## Authority and Product Boundaries

- Understand-Anything is a pinned presentation dependency, not the ontology
  carrier or policy owner.
- Poker Team is a read-only worked example.
- IOLM remains a separate product lane and was not modified.
- Candidate results retain `authority_effect: none`.
- No authority, Craft, public Arcanum, release, or production claim is granted.

## Handoff

The recommended first candidate is `SWU-OEW-001`, source admission only. This
Plan does not select or execute it. Implementation requires a new explicit
selection followed by Task Session preflight.

## Open Questions

See [define/SPEC.md](define/SPEC.md#open-questions).
