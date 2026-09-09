# Refresh Report — UOVA DomainSpec UI Description

- Mode: `refresh`
- Activation source: `direct-user`
- Mutation mode: `apply-approved` by direct-user default
- Phase status: `pass`
- Apply handoff status: `ready`
- Execution handoff status: `deferred`
- Exact scope: ten new files under this successor stage
- Source signals: five
- Distill: skipped with bounded-delta rationale

## Outcome

The current relation-reference package now has a development-only DomainSpec UI
description. It keeps the complete 58-contract denominator from the earlier UOVA
design but rebinds conformance to UOVARR-005, 006, 007, and 009 and repairs the
relation-bearing View Models around `RelationRef` plus `relation_digest`.

No completed R06/R09 artifact was rewritten. The nine-SWU frontier, order, and
dependencies are unchanged. `PLAN-DELTA.md` is the successor amendment that must be
read with the four named base tasks.

## Applied changes

1. Added a UI type boundary and concrete Page/Layout/Component/View Model/Hook/Form/
   Action/Guard/Binding/Mapping map.
2. Added 58 unique conformance dispositions: 52 UI instances and six Mappings.
3. Preserved zero Adapter nodes and zero general State Indicator nodes.
4. Kept Action-source and Hook-Binding relationship gaps explicit.
5. Bound relation display data to the repaired SourceGraph/KnowledgeScene v1.2
   architecture instead of copied UI truth.
6. Added conformance and validation obligations to four existing SWUs by delta.

## Material and validation gates

The staged exact-byte package is owned by Invoke at
`.arcanum/invoke/refresh/uova-ui-description-20260805T192950Z/`. Its material
receipt and refresh handoff result are external evidence so this successor stage
does not create a self-referential package digest.

Validation covers JSON syntax, exact 58-record uniqueness/count algebra, authority
and candidate ceilings, allowed realization SWUs, relation projection bindings,
profile digest/owner validation, target parity, and scoped whitespace.

## Preserved blockers and claim ceiling

- This authoring refresh does not admit Task Session. Exact runtime targets,
  baselines, execution bindings, and closeout bindings remain missing.
- UOVARR-008 still requires an owner-selected Body War denominator.
- The UI profile remains development-only and release admission remains not
  granted.
- No runtime code, frontend behavior, browser/accessibility result, ontology
  promotion, deployment, release, or production readiness is claimed.

## Next route

Run a separate Invoke Refresh work-pack admission for UOVARR-001 after exact
runtime targets and byte baselines are selected. Do not treat this UI description
receipt as execution admission.
