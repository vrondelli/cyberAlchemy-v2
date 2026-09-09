# Plan Delta — DomainSpec UI Description

Status: apply-approved planning refresh
Base pack: `UOVA-RR-20260805`
Frontier change: none

This delta is read together with the base task files. It does not rewrite completed
R06/R09 evidence and does not change SWU count, order, dependencies, or product
write authority.

## UOVARR-005 — Navigation and View-Model Integrity

Add these outputs and acceptance obligations:

- compile/pin the OEW-owned `ui-development-explicit-v0.1` snapshot;
- materialize a 58-record compiled UI inventory with exact formation/profile
  digests and runtime-symbol owners;
- realize the 19 contracts assigned to UOVARR-005;
- require relation-bearing View Models to carry `RelationRef` and
  `relation_digest` and reject display drift;
- prohibit runtime imports from `projects/domainspec-v2/`.

## UOVARR-006 — Presentation Joins

Add these acceptance obligations:

- realize the 36 contracts assigned to UOVARR-006;
- Page/Layout/Components/View Models describe the surface but do not own relation
  semantics;
- Portal, graph edge/card, inspector, Path, and Full Index synchronize through the
  exact relation ID;
- Mapping records validate source/target shapes and preserve relation digest;
- geometry stays semantic-free; text, pattern, direction, and color remain
  redundant encodings.

## UOVARR-007 — Static Projection and Accessibility Fallback

Add these acceptance obligations:

- realize `oew.ui.component.static-projection` against validated
  `RelationSnapshot` inputs;
- keep detached output independent of DomainSpec runtime files;
- preserve a self-contained relation sentence and non-color semantics when visual
  tokens are null.

## UOVARR-009 — Acceptance and Reuse

Add these acceptance obligations:

- realize the two project-boundary Mapping contracts;
- validate all 58 unique dispositions and exact count algebra;
- verify Adapter count zero and general State Indicator count zero;
- scan runtime imports/owners for forbidden DomainSpec checkout paths;
- return UI conformance evidence separately from browser, accessibility, ontology,
  deployment, and release claims.

## Preserved blockers

- Exact runtime targets, byte baselines, validation bindings, and closeout bindings
  still belong to a later work-pack admission package.
- UOVARR-008 still requires the Body War denominator owner decision.
- The UI profile is development-only and release admission is not granted.

## Distill disposition

Distill is skipped. This delta adds descriptions and conformance obligations to
four existing SWUs without changing behavior boundaries, recomposition, order, or
dependencies. Re-run Distill only if a later refresh changes those boundaries.
