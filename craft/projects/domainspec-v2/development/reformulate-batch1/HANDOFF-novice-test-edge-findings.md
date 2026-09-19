---
node_type: handoff
is_session: false
status: candidate
created: 2026-07-02
authored_by: task-session (comprehension novice-witness) → handoff to R3
source: ../comprehension-novice-test/stall-dataset.md (BASELINE arm, CampusRead task)
target: R3 edge-law formalization (reformulate-batch1 + reviews/2026-07-02-r3-edge-law-formalization)
promotion_boundary: local; proposal only — the R3 owner decides. No files mutated by this handoff.
---

# Handoff → R3 — edge-law gaps found by USE (not by artifact review)

## Current resolution note (2026-07-11)

The earlier R3A resolution below was later superseded for Saga: the owner
selected collapse into scoped Workflow, and the separate Saga relationship
signature and hardening route were removed. The remaining handoff text is
historical evidence from the pre-collapse surface.

## R3A resolution note (2026-07-02)
This handoff has been consumed by R3A rather than rewritten:

- **R3-F5 Entity→Entity association:** deferred as a modeling decision; structural associations remain field-table
  structure until a distinct relationship verb proves implementation behavior.
- **R3-F6 Saga orphaned:** resolved by adding an active `Saga --orchestrates--> Operation` signature in root
  relationship authority.
- **R3-F4 schema participation contradiction:** resolved by deriving schema `edge_participation` consistency
  from root signatures and validating it in `validate:rels`.
- **S7 `produces` vs `emits`:** resolved by endpoint signatures: `Operation --produces--> Event` and
  `Entity --emits--> Event`.

Canonical authority now lives in `definitions/relationships/relationships.yml`; `impl/spec/RELATIONSHIPS.md`
is only an implementation projection.

## Why this exists
A blind novice authored a real multi-entity spec (library lending) using only the DomainSpec surface. Its
two hard **blockers were the edge model**, not type discrimination. The R3 review
(`reviews/2026-07-02-r3-edge-law-formalization/findings.md`) attacked the *artifacts*; this witness
attacked *by use* — and use surfaces two edge-law gaps the artifact review did not, plus a concrete failing
case for an existing finding. All three are **P8-verified on disk**. Nothing here is mutated; these are
proposed R3 change-requests.

## What to fold into R3

### NEW — R3-F5 (proposed, MAJOR): no Entity→Entity association edge exists
- **Evidence:** `impl/spec/RELATIONSHIPS.md:13-27` — the only Entity-**sourced** edges are `performs`
  (→Operation), `contains` (→Value Object), `emits` (→Event). There is **no Entity→Entity** association/
  reference edge in the 29.
- **Failure by use:** in an ordinary domain, `Loan→Copy`, `Copy→Title`, `Loan→Patron`, `Reservation→Title`,
  `Copy→Branch` are all **unrepresentable** — the most basic structure (references between entities) has no
  verb. The novice left them unexpressed (a `blocker`, stall S3).
- **Proposed R3 decision:** either add an authoritative Entity→Entity edge-law (e.g. `references` /
  `associates`, with a signature) to the reconciled relation set, **or** explicitly rule it out-of-scope
  with a rationale (e.g. "associations live inside the field table, not as edges"). Today it is neither —
  an undocumented gap. Fits the R3-F2 decision-led reconciliation frame.

### NEW — R3-F6 (proposed, MAJOR): Saga has no edge signature (orphaned)
- **Evidence:** `grep -i saga impl/spec/RELATIONSHIPS.md` → **empty**. Saga is neither source nor target of
  any of the 29 edges; `orchestrates` is `Workflow → Operation[]` only.
- **Failure by use:** a cross-branch `ReservationFulfillment` (Saga) cannot connect to anything (`blocker`,
  stall S5).
- **Proposed R3 decision:** give Saga a source/target signature (e.g. `Saga --orchestrates-->
  Operation[]/Workflow[]` cross-feature), **or** fold Saga per `DEC-DSV2-EDGE-ADMISSIBILITY` (collapse into
  Workflow + a cross-feature flag, mirroring the `enforces-cross` collapse in R3-F2). Either way Saga must
  become connectable or be removed.

### CORROBORATES — R3-F4 (concrete failing case for "edge_participation not reliable authority")
- R3-F4 already says the `edge_participation` slices "are not reliable authority" and cites
  `operation.schema.yml:21-23`. Here is the **specific contradiction** (a discriminating fixture for the fix):
  - `impl/spec/meta-types/behavioral/operation.schema.yml:22` — `source_of: [performs, emits, produces-for]`.
  - But `RELATIONSHIPS.md:13` — `performs` is **Entity**→Operation (Operation is the *target*), and
    `RELATIONSHIPS.md:27` — `emits` is **Entity**→Event (Operation is not involved). Operation's real source
    edge `produces` (`RELATIONSHIPS.md:14`) is **omitted**.
- **Proposed:** when R3 demotes `edge_participation` to machine-evidence, add a consistency check that each
  type's `source_of`/`target_of` matches the reconciled RELATIONSHIPS table; seed the negative fixture with
  this Operation case. (Corroborates, does not replace, R3-F4.)

### MINOR — S7 (relates R3-F1): `produces` vs `emits` disambiguation
- Both `produces` (Operation→Event) and `emits` (Entity→Event) fit "notify when X happened"; the surface
  gives no rule to pick the event's source. Fold into R3-F1's endpoint-signature disambiguation. `cosmetic`.

## Evidence table (all disk-verified this session)
| finding | file:line | verdict |
| --- | --- | --- |
| S3 no Entity→Entity edge | `RELATIONSHIPS.md:13-27` | ✅ confirmed |
| S5 Saga orphaned | `RELATIONSHIPS.md` (no `saga` match) | ✅ confirmed |
| S4 card ↔ table contradiction | `operation.schema.yml:22` vs `RELATIONSHIPS.md:13,27` | ✅ confirmed |
| S7 produces/emits ambiguity | `RELATIONSHIPS.md:14,27` | plausible |

## What R3 does NOT need to take
Target-state (S8), vocabulary/individuation (S6/S1), and type discrimination (S2/S10) stay with the
**comprehension model** (`development/spec-comprehension-model/`). Only the edge cluster routes here.

## Provenance
Full dataset + ranking: `../comprehension-novice-test/stall-dataset.md`. Caveat: the witness is a blind
LLM agent (structural pre-test, not human-comprehension proof); the edge facts above are independently
disk-verified regardless of the agent caveat.
