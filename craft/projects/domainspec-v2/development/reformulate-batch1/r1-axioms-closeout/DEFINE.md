---
node_type: define
is_session: false
status: candidate
created: 2026-07-09
authored_by: invoke (mode: define)
target_artifact: DomainSpec v2 R1 AXIOMS authority-home closeout
scope: projects/domainspec-v2 Batch-1 R1 only
owner_route: CTX-DSV2-REFORMULATE-BATCH1
governing_decisions:
  - DEC-DSV2-SPEC-HOMING
  - DEC-B1-SATURN-AXIOM-SCOPE
source_contracts:
  - ../WORK-PACK.md
  - ../DESIGN.md
  - ../../../.craft/ledger.yml
  - ../../../impl/spec/AXIOMS.md
  - ../../../authority/constitutions/domainspec-v2-CONSTITUTION.md
mutation_boundary: plan-only; no AXIOMS, authority, manifest, or Craft mutation in this Invoke pass
---

# Define - R1 AXIOMS Authority-Home Closeout

## Intent

Close Batch-1 R1 by moving DomainSpec v2's retained axioms out of the
hand-authored `impl/spec/AXIOMS.md` projection and into a canonical owner home
under `authority/`.

The closeout is not fresh axiom invention. It is a verify-and-close task over
the already reviewed R1 state plus the two later governing decisions:

- `DEC-DSV2-SPEC-HOMING`: governance prose routes to its owner surface; AXIOMS
  belongs under `authority/`, not `definitions/`.
- `DEC-B1-SATURN-AXIOM-SCOPE`: DomainSpec v2 keeps A1, A2, and A3-recast;
  A4/A6 route to Saturn; A5 splits between DomainSpec shift-left control and
  Saturn reflection loop.

## Scope

In scope:

- Author `authority/AXIOMS.md` as the canonical R1 owner home.
- Preserve the retained DomainSpec axioms:
  - A1: semantic authority precedes implementation.
  - A2: decisions belong to the domain, not adapters; binds to C6 adapter-line
    layering.
  - A3-recast: governance methods must be runnable or computable when they
    gate critical behavior.
- Carry Saturn-owned material as explicit route pointers, not silent deletion:
  A4, A6, and the reflection half of A5.
- Remove or de-authorize `impl/spec/AXIOMS.md` so it is no longer a
  hand-authored authority surface.
- Synchronize R1 status in `IMPORT-MANIFEST.md`, `.craft/ledger.yml`, and
  `CRAFT.md` after validation passes.

Out of scope:

- R2 TAXONOMY / UI-11 migration.
- R5 DRIFT owner-home migration.
- R6a/R6b constitution crosswalk and constitution split.
- Creating the Saturn pillar or Saturn authority spine.
- Changing engine `src/rules` or exposing private algorithm details.

## Source Evidence

| Evidence ID | Source | Relevance |
| --- | --- | --- |
| E-R1-001 | `../WORK-PACK.md` | R1 row and acceptance criteria: authority home, A2-C6 binding, validate docs, no v1 residue. |
| E-R1-002 | `../DESIGN.md` | R1 target result and spec-homing decision placement. |
| E-R1-003 | `../../../.craft/ledger.yml` | Current Craft next move, resolved Saturn scope, and active prose-home gap. |
| E-R1-004 | `../../../impl/spec/AXIOMS.md` | Current imported/reformulated text to verify and replace as authority. |
| E-R1-005 | `../../../authority/constitutions/domainspec-v2-CONSTITUTION.md` | C6 adapter-line target that A2 must bind. |

## Glossary

| Term | Meaning | Status |
| --- | --- | --- |
| authority home | Canonical owner surface for governance prose that is not a definition term. | local |
| retained axiom | A1, A2, or A3-recast: the DomainSpec-owned axiom set after Saturn routing. | local |
| routed axiom | A4, A6, or the reflection half of A5: material that belongs to Saturn and must remain as a pointer. | local |
| de-authorized projection | Any remaining `impl/spec/AXIOMS.md` content after R1; it may only point to authority and must not contain independent axiom text. | local |

## Acceptance Definition

R1 is closeable when:

1. `authority/AXIOMS.md` exists and carries the retained A1/A2/A3-recast
   authority.
2. A2 explicitly binds to C6/layering adapter-line.
3. A4/A6 and A5-reflection are routed to Saturn as pointers.
4. `impl/spec/AXIOMS.md` is absent or reduced to a non-authority redirect; it
   does not carry independent axiom authority.
5. `npm run validate`, `npm run tags:test`, `npm run engine:test`, and
   `npm run typecheck` pass from `projects/domainspec-v2/impl`.
6. `IMPORT-MANIFEST.md`, `.craft/ledger.yml`, and `CRAFT.md` state R1 closed or
   accurately record any remaining non-blocking residue.

## Gate Result

- Status: pass
- Reason: The target is narrow, the source evidence is available, and the
  remaining execution is one authority-home closeout with explicit validation.
