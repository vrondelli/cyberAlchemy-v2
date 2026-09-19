---
node_type: define
is_session: false
status: candidate
created: 2026-07-10
authored_by: invoke (mode: define)
target_artifact: DomainSpec v2 R1 AXIOMS definition-sync repair
scope: projects/domainspec-v2 Batch-1 R1 only
owner_route: CTX-DSV2-REFORMULATE-BATCH1
governing_definitions:
  - CAV2-D49
  - CAV2-D53
  - CAV2-D54
source_contracts:
  - ../research/axiom-definition-sync-fix/findings.md
  - ../../../../authority/AXIOMS.md
  - ../../../../authority/AXIOMS.yml
  - ../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md
  - ../WORK-PACK.md
mutation_boundary: plan-only; no AXIOMS, manifest, Craft, or parent work-pack mutation in this Invoke pass
---

# Define - R1 AXIOMS Definition-Sync Repair

## Intent

Repair the R1 AXIOMS authority surface so it no longer implies that every
retained row is a first-class CAV2-D53 axiom or that `axiom` / `invariant` are
currently CAV2-D49 authority kinds.

This is a classification and metadata repair inside
`projects/domainspec-v2/authority/AXIOMS.md` and
`projects/domainspec-v2/authority/AXIOMS.yml`. It is not a redesign, not a new
authority-kind amendment, and not a movement of R1 material into definitions.

## Problem Statement

SWU-R1A-001 created the correct R1 authority home and machine companion, but
the follow-up research found a definition-sync risk:

- CAV2-D53 `axiom` is a world/domain truth held as given.
- CAV2-D54 `invariant` is a checkable must-hold on system behavior or
  artifacts.
- CAV2-D49 keeps the authority-kind enumeration closed; `axiom` and
  `invariant` are not currently first-class authority kinds.

The current R1 surface is still named `AXIOMS`, but A1/A2/A3 are
invariant-shaped under the CAV2 subject test. A4/A6 are routed pointers, and A5
is split between DomainSpec shift-left validation governance and Saturn
reflection ownership. The repair should make that explicit without changing R1
substance.

## Scope

In scope:

- Add a CAV2 definition-alignment note to `authority/AXIOMS.md`.
- Classify A1/A2/A3 as `local_role: invariant-shaped`,
  `cav2_shape.primary: CAV2-D54`, and
  `authority_kind_rollup: Definition`.
- Preserve A4/A6 as routed pointers, not active DomainSpec D53/D54 rows.
- Preserve A5 as split-routed: the DomainSpec shift-left fragment is D54-shaped;
  the Saturn reflection fragment is routed out.
- Rename ambiguous machine metadata such as `authority: authority/axioms` to a
  surface field that does not imply an authority kind.
- Rename A2 `validates` metadata to a downstream/non-enforcement field such as
  `downstream_validation` so validation bindings do not become axiom substance.
- Validate YAML and existing DomainSpec v2 implementation gates after the patch.

Out of scope:

- Adding `axiom` or `invariant` to the CAV2-D49 authority-kind enumeration.
- Rewriting A1/A2/A3 into true D53 world/domain axioms.
- Moving AXIOMS rows into `authority/definitions/DEFINITIONS.md`.
- Changing A2/C6 semantics, Saturn routing, R5/R6 material, or R2 TAXONOMY.
- Repairing the upstream CAV2-D34 citation mismatch through DomainSpec R1.
- Editing public `arcanum/` content.

## Source Evidence

| Evidence ID | Source | Required Use |
| --- | --- | --- |
| E-R1B-001 | `../research/axiom-definition-sync-fix/findings.md` | Accepted repair shape and row-level classification. |
| E-R1B-002 | `../../../../authority/AXIOMS.md` | Current human authority surface to patch later. |
| E-R1B-003 | `../../../../authority/AXIOMS.yml` | Current machine companion to patch later. |
| E-R1B-004 | `../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | CAV2-D49/D53/D54 source definitions. |
| E-R1B-005 | `../WORK-PACK.md` | Existing R1 closeout state and pending SWU-R1A-002 sync route. |

## Glossary

| Term | Meaning | Status |
| --- | --- | --- |
| R1 continuity surface | The local DomainSpec v2 `AXIOMS` surface kept for R1 continuity after spec-homing. | local |
| local_role | Compatibility classification for a row in this R1 surface; not a new authority taxonomy. | local |
| cav2_shape.primary | The CAV2 semantic shape a row currently matches: `CAV2-D53`, `CAV2-D54`, or `not-applicable`. | local |
| authority_kind_rollup | Cataloging rollup under an existing CAV2-D49 authority kind. For this repair it is `Definition` only. | local |
| downstream_validation | Non-enforcement metadata that points from a row to validation surfaces without turning validators into axiom substance. | local |

## Acceptance Criteria

- `AXIOMS.md` explicitly states that the file is a DomainSpec v2 R1 continuity
  surface subordinate to CAV2-D49/D53/D54.
- `AXIOMS.md` explains that `Definition` is a cataloging rollup only and does
  not convert rows into definitions or create `axiom` / `invariant` authority
  kinds.
- A1/A2/A3 are classified as invariant-shaped under CAV2-D54 unless a future
  owner rewrites a separate D53 grounding axiom.
- A4/A6 remain routed pointers; A5 remains split-routed.
- `AXIOMS.yml` parses and carries root `cav2_alignment` metadata plus per-row
  `local_role`, `cav2_shape.primary`, and `authority_kind_rollup`.
- No row uses `authority_kind: axiom` or `authority_kind: invariant`.
- A2/C6 substance and Saturn routing remain unchanged.
- Existing R1 authority-home conditions remain true, including
  `impl/spec/AXIOMS.md` remaining absent or non-authoritative.

## Decision Posture

No new human decision is required for the minimal metadata/classification
repair. It preserves the accepted research finding and keeps CAV2 ownership
intact.

A new decision is required before any of these moves:

- Promote `axiom` or `invariant` as first-class CAV2-D49 authority kinds.
- Rewrite any row into a true D53 world/domain axiom.
- Split a new `INVARIANTS` authority surface or move AXIOMS rows into
  definitions.
- Change Saturn routing, A2/C6 semantics, or upstream CAV2-D34 wording.
