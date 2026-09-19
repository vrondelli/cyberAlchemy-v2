---
node_type: define
is_session: false
status: candidate
created: 2026-07-02
authored_by: invoke (mode: define)
target_artifact: the spec-comprehension model — moves M1–M4 made concrete on the DomainSpec surface
scope: projects/domainspec-v2 (impl/spec: TAXONOMY, RELATIONSHIPS, meta-types/**, __fixtures__/mt/**)
owner_route: validation-governance + definitions-governance (the surface) + layering-governance (the tiers)
source:
  - research/target-state/2026-07-02-comprehension-narrative-model/findings.md (the 4-region partition + moves)
  - ../comprehension-novice-test/ (produces the stall-dataset this package is prioritized + validated by)
promotion_boundary: PUBLIC spec surface only; engine src/rules δ-rules untouched; UI-11 stay first-class.
---

# Define — Spec Comprehension Model (M1–M4)

## Intent
Make DomainSpec's proposed abstractions understandable at spec-authoring time, by the mechanism the closed
research established — **distillation + surfacing what already exists**, NOT a new narrative layer — and
do it **data-first**: the [novice-test](../comprehension-novice-test/) stall-dataset **prioritizes** the
moves (worst confusion ships first) and each move's promotion is a **measured stall-drop**, not a claim.

## The four moves (verbatim from findings.md §Recommendation; each grounded in a verified disk-fact)
- **M1 — distilled learning order.** Tier the 25 into ~6 core / ~6 supporting / ~13 generic as a
  **per-domain declarable lens** (never a deletion — all 25 stay typed for the engine). Distill the edge
  reading view (~8 relations + `@cross`/`@shadow` modifiers). Keep the 11 UI shadows **first-class in the
  graph** (they carry their own edges `protects`/`mirrors`/`reflects` — verified; dictionary the
  *learning*, not the edges).
- **M2 — surface the 9 crossed pairs (author nothing).** For the 9 backend types that already have a
  genuine discriminating fixture pair (Entity/VO + all 7 Behavioral), lift the existing `-ok`/`-bad`
  fixtures into the author's entry point and caption with the schema's existing `distinguisher.rule`;
  delete the redundant `TAXONOMY.md` "Common Confusion" rows that merely restate a pair.
- **M3 — upgrade the 5 weak pairs (the single build).** Enum, Interface, Mapping, Event, State Machine
  have malformed-only or unmatched-intent-flip negatives. Upgrade each to a genuine class-flipping pair,
  OR explicitly mark it *attribute-distinguished* (axis read from the schema) where no clean sibling-cross
  exists. **2 of these (Event, State Machine) are in the core-6** — so this gap is load-bearing.
- **M4 — target-state doc + oracle-by-example.** The one place the narrative instinct lands: a
  buildable "done looks like…" paragraph + a checkable oracle (a DONE exemplar vs a discriminating
  NOT-DONE near-miss). Document-level (SEED Lane-A), never a per-type authoring layer.

## The falsifiable claim (per move)
> Each landed move **drops its targeted stall-class** in the novice-test treatment re-run **without
> introducing a new stall-class** and **without a validator regression** (`validate:*` / `tools:test`
> stay green — fixtures remain the single validator source).

- **SURVIVED (per move)** iff the targeted stall drops in the re-run + no regression + validators green.
- **FALSIFIED (per move)** iff the stall persists (the move doesn't help) or a new stall/validator failure
  appears (the move hurt) — recorded, the move reverted or reworked, not forced.

## Data-driven ordering (why this needs Package A first)
The move that fixes the **highest-ranked baseline stall** ships first. Order is decided by the dataset,
not preference (DEF-B3). This is the literal meaning of "start it with data already": Package B L0's input
IS Package A L0's output.

## Glossary
- **crossed pair** — a discriminating fixture pair: the *same* concept, two models, two verdicts (the
  Money Entity↔VO pair). Distinct from a *malformed* negative (missing a field) or an *unmatched
  intent-flip* (renames the concept so it lands on no existing positive).
- **declarable lens** — the core/supporting/generic tiering, overridable per domain (Evans/Vernon: the
  same subdomain is core or generic depending on the org).
- **oracle-by-example** — a target-state's DONE exemplar + a NOT-DONE near-miss that flips the verdict.

## Non-goals
- Deleting any meta-type (completeness lives in the type system). Exposing/re-deriving δ-rules.
- Formalizing the 11 UI types (deferred — they only get their one-line dictionary entry here, edges intact).
- Rewriting RELATIONSHIPS.md (M1's edge view is a *reading aid* over it, not a mutation).

## Open decisions (surfaced)
- **DEF-B1 — M1 home:** RESOLVED → a `meta-types/LEARNING-ORDER.md` companion + an **optional** `tier:`
  field per `.schema.yml` (declarable, not hard-coded).
- **DEF-B2 — M3 per-type:** genuine-pair-upgrade *vs* attribute-distinguished-mark, decided per type by
  whether a clean class-flip with a matching sibling positive exists (DESIGN §M3 pre-decides all 5).
- **DEF-B3 — move order:** RESOLVED → set by Package A's baseline ranking (data, not preference).
