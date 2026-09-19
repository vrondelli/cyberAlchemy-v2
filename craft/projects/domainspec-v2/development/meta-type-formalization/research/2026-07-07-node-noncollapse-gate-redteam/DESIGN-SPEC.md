<!--
  ATTACK CORPUS for review dispatch `node-noncollapse-gate-redteam` (2026-07-07).
  This is a PROPOSED design, not authored law. It exists to be red-teamed BEFORE any
  definition file is written. Attack it; do not treat any claim here as settled.
  Claim discipline: every "exists today" fact is grounded in a cited file; everything
  else is proposal.
-->

# DESIGN-SPEC — Node Non-Collapse Admissibility Gate (proposed)

Status: **proposal under adversarial review** (not authored, not promoted)
Proposes: a new definition `domainspec-v2-D-node` + an amendment to `domainspec-v2-D18`
Origin: OQ-6 in [domainspec-v2-discovery.md](../../../../discovery/domainspec-v2-discovery.md)
("node formation has no non-collapse test — the structural root")

## 0. The asymmetry this closes (grounded)

- **Edges HAVE an admissibility gate.** `domainspec-v2-D3` (Edge-Law Admissibility,
  active): *"an edge TYPE is admissible IFF it composes into different code (adds a
  non-redundant distinction over {concept-type, relation-kind, composition-shape,
  feature-boundary})."* Source: [definitions/DEFINITIONS.md](../../../../definitions/DEFINITIONS.md) §domainspec-v2-D3 (lines ~99-142).
- **Nodes DO NOT.** `domainspec-v2-D18`'s promotion boundary reads it governs
  "relationship promotion, **not DS-D1 meta-type formation**." The node challenges D6/D7
  test only *coverage* (fits-no-type / fits-two-types), never *collapse* (do two types
  reduce to one). Confirmed by the 2026-07-07 method-carving review
  ([findings.md](../2026-07-07-method-carving-soundness-review/findings.md)).
- **Consequence on disk:** Saga and Workflow have **identical** `edge_participation`
  (`source_of: [orchestrates]`, `target_of: []`) and both criteria are `attribute-equals`
  on the same key `scope`, differing only in value. Nothing structurally distinguishes
  them. Sources: [saga.schema.yml](../../../../impl/spec/meta-types/behavioral/saga.schema.yml),
  [workflow.schema.yml](../../../../impl/spec/meta-types/behavioral/workflow.schema.yml).

## 1. The proposed rule — `domainspec-v2-D-node` (Meta-Type Non-Collapse Admissibility)

Built-from-owned on the SAME CAV2-D22/D29/D16 non-collapse discipline that D3 imports.

**Criterion (mirror of D3's "composes into different code"):**
> A meta-type earns its own slot IFF it composes into different code from every other
> type, **witnessed by structure or edge-participation — never by a self-declared tag
> alone.**

**Collapse test.** A pair (A, B) *collapses* (B is redundant with A) iff ALL three hold:
1. **No structural discriminator** — neither criterion contains a structure-reading rule
   that separates them.
2. **No edge-participation discriminator** — their DS-D8 slices (`source_of ∪ target_of`)
   are equal as sets.
3. **Not a declared exception** — the pair is not on the W3 exemption list with a stated
   reason.

**Admissibility witnesses.** A type is admissible iff, against *every* other type, it holds
≥ 1 of:
- **W1 · structural-table witness** — its criterion uses a *structural rule* (e.g.
  `at-least-one`, `all-nonempty`) over the concept's own field/attribute table. (Entity's
  `identity: {rule: at-least-one, column: Identity}` is this; source
  [entity.schema.yml](../../../../impl/spec/meta-types/structural/entity.schema.yml).)
- **W2 · edge-participation witness** — its DS-D8 slice differs from the other type's in a
  way that composes into different code, AND every distinguishing edge *itself* passed D3.
- **W3 · declared exception** — the distinguisher is provably semantic and
  non-constructible under D15 (D15 forbids inferring the discriminator by parsing the
  Formal cell). The `formal_return_type` trio (Rule/Policy/Calculation) is the canonical
  case. Passes the gate, but is stamped "attestation-strength" in prose.

**Verdict on failure.** A type whose only distinguisher is an attestation rule
(`attribute-equals` / `attribute-present`), with no W1, no W2, and no W3 entry →
**inadmissible → merge** (become the other type + a flag). Saga → `Workflow` + `scope` flag.

**Rule classification (the mechanical core).** The `rule:` vocabulary in the criterion
schemas is closed and small:
- **STRUCTURAL:** `at-least-one`, `all-nonempty` (bounded quantifiers over the concept's own table).
- **ATTESTATION:** `attribute-equals`, `attribute-present` (string-compare over a declared key).

## 2. The proposed D18 amendment

`domainspec-v2-D18`'s promotion boundary currently exempts meta-type formation. The
amendment brings node formation under D-node: a candidate meta-type may not promote
candidate→active unless it clears the D-node collapse test (or carries a W3 entry). This is
the ONLY change to D18; it does not touch relationship promotion.

## 3. How it is tested (the check)

**(A) Validator** — a new `tools/validate-meta-types-noncollapse.ts` (sibling of
`validate-relationships.ts`). Loads all 14 criterion schemas, classifies each `rule` as
structural/attestation, and for every unordered pair emits `collapse-candidate: A ~ B` when
all three collapse conditions hold. Also emits `attestation-only-node` for any type whose
sole distinguisher is attestation and is not W3-listed.

**Acceptance criteria for the validator itself (against today's registry):**
- MUST fire `collapse-candidate: Saga ~ Workflow`. (The gate's own discrimination test — a
  gate silent here is broken.)
- MUST NOT fire `Entity ~ Value Object` (both carry structural witnesses).
- MUST demand W3 for `Rule / Policy / Calculation` (all `formal_return_type` attestation).

**(B) Pair-level fixtures** (mirror the existing pos/neg convention, at the type-pair level):
- `noncollapse-pass/` — Entity/ValueObject, Entity/Enum, StateMachine/Enum: stay admissible.
- `noncollapse-fail/` — Saga/Workflow (live) + a synthetic identical "Widget/Gadget" pair.
- `noncollapse-exception/` — Rule/Policy/Calculation pass ONLY with W3 declared; delete the
  W3 entry and the test must flip to fail.

**(C) Anti-tautology meta-test (the load-bearing one).** The existing pos/neg fixtures are
tautological (the negative = the positive with the tag flipped), so passing only proves "the
validator read the declaration." The node gate must not repeat this. Adversarial fixture: a
concept with **Workflow's structure but tagged `scope: cross-feature`** ("Saga" by
declaration). The gate must STILL report `Saga ~ Workflow` collapse — it reads structure +
edges and ignores the tag. If flipping `scope` changes the verdict, the gate is tautological
and fails its own meta-test.

## 4. Conceded limits (stated, so the review attacks the real thing)

- The gate does **not** make the 11 attestation distinguishers structural. It makes the
  attestation-strength limit explicit + bounded via W3.
- Rule/Policy/Calculation remain attestation-strength by *permanent* necessity (D15).
- The node gate **depends on the edge gate D3 being sound** — W2 is only trustworthy if each
  distinguishing edge itself passed D3.

## 5. Known open design questions (fair game, not yet answered)

- Q-scope: is collapse checked within-category only, or across all 14 pairs? (Cross-category
  pairs differ trivially by `required_structure`.)
- Q-W3-bound: what stops W3 from being claimed by any node? (Proposed: W3 requires the
  distinguisher be a `formal_return_type`-class semantic sort AND cite D15 — but is that
  criterion itself gameable / too narrow / too broad?)
- Q-W2-fabrication: can an author add a bogus `orchestrates`-like edge to manufacture a W2
  witness? What in D3 actually stops that?
- Q-classification: is the structural/attestation split of the `rule` vocabulary complete
  and stable, or can a new rule keyword straddle it?
