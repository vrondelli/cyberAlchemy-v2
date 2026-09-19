---
node_type: refinement-artifact
stage: s4-research
role: gap-cartographer
lane: read-only
status: register
target_run: 2026-06-08-lean-functor-validation
honesty_boundary: enumerate under-determined items only; this is not a defect list
---

# Clarity-Gap Register — Lean Functor Validation (read by clarity-language-fit run)

Read-only enumeration of every CLARITY GAP in the prior refine run
`2026-06-08-lean-functor-validation` (plus its parent `research/DESIGN-PACKAGE.md`).

A **clarity gap** = a NAME without a decidable definition, a DECISION without
ratification, a CLAIM without a proof, or a deferred SCOPE edge. These are
**under-determined**, not wrong.

## Gap types and owners

- **type** ∈ {definition-gap, decision-gap, decidability-gap, scope-gap, evidence-gap}
- **owner** ∈ {Lean-provable, human-only (above Intent Wall), deferred, blocked-on-B1}
- **dedup** = `already-tracked` (prior run / DESIGN-PACKAGE already named it as a
  blocker/decision/unknown/residue) vs `newly-surfaced` (this register names it)

---

## Group 1 — owner: Lean-provable (a decidable definition or check could close it)

| id | name | type | what is unclear (+ artifact) | dedup |
|----|------|------|------------------------------|-------|
| G-LP-01 | P4 grade not real | decidability-gap | `gradeP4Ambiguity` returns `.pass` unconditionally; `m6Witnesses` is computed but ungoverned — the residue NAME has no operative grade (STAGE-A-CORRECTNESS §1e; DESIGN-REVIEW B; REPAIR Fault D). | already-tracked (R-stub, Wave A2) |
| G-LP-02 | Per-edge provenance not populated | decidability-gap | `EdgeProvenance` type exists but emitter hardcodes `.declared`; "codegen-attributable residue" is a NAME with no data feed (STAGE-A §1e; DESIGN-REVIEW C; PLAN A1). | already-tracked (R-determinism, Wave A1) |
| G-LP-03 | P3 obligation table source | definition-gap | `obligationsForMeta` has no calibrated content; the per-meta obligation predicate is named but undefined until EX1/H2 (STAGE-A §1d, §3.1). | already-tracked (R-stub; gated on B-1) |
| G-LP-04 | P5 acyclicity is `partial`, not a theorem | decidability-gap | `graphHasCycle` is a trusted `partial def` `#eval`, NOT a verified proof; "acyclic" is asserted operationally, no termination/topological-order theorem (STAGE-A §1c; DESIGN-REVIEW C.2; DESIGN decidability line). | newly-surfaced (status named, but "promote to theorem?" never decided) |
| G-LP-05 | P1 closure trusts parser-supplied `unresolvedRefs` | evidence-gap | P1 is decidable only relative to the parser's population of `unresolvedRefs`; Lean does not re-derive refs — closure correctness is unproven below the wall (STAGE-A §1b, A-WALL-1). | newly-surfaced |
| G-LP-06 | Two residue directions not computed | scope-gap | code∉spec (unspecified-behavior) and spec∉code (unimplemented-obligation) are NAMED as sidecar records but neither is built/decidable today (DESIGN residue model; DESIGN-REVIEW D FIX-2; PLAN A3). | already-tracked (framing only; build deferred to Wave A3) |
| G-LP-07 | Translator T determinism not demonstrated | evidence-gap | T's "same code → byte-identical Spec" is asserted (tier precedence + lexical sort + pinned snapshot) but not proven/exercised; T does not exist in-repo (DEFINE U3/R-determinism; DESIGN; REPAIR R-translator-absent; PLAN B2). | already-tracked (R-determinism, R-translator-absent) |
| G-LP-08 | Anti-collapse referential half | decidability-gap | "every schema rule traces to a contract `obligation_id` and vice versa" becomes a P1-shaped closure check — but only AFTER B-1; decidable-in-principle, undefined now (STAGE-A §2.1 row 3; DESIGN-PACKAGE §4). | already-tracked (depends on B-1) |

## Group 2 — owner: human-only (above the Intent Wall — never Lean)

| id | name | type | what is unclear (+ artifact) | dedup |
|----|------|------|------------------------------|-------|
| G-HU-01 | "Spec captures intent" | definition-gap | Whether a spec actually expresses operator intent is declared above the Intent Wall — named, never decidable (RESULT honesty boundary; DESIGN-REVIEW D FIX-1). | already-tracked (Intent Wall) |
| G-HU-02 | σ-table faithfulness | evidence-gap | `sigmaValid` is assumed to transcribe paper Tables 3/4 + D6 correctly; Theorem 1 proves edges match the table, not that the table is right (STAGE-A A-WALL-2). | newly-surfaced (named as assumption, not as a tracked gap) |
| G-HU-03 | Vocabulary canonicity | evidence-gap | The 25 Meta / 29 EdgeType / 2 Profile set is lifted read-only; completeness/soundness of the vocabulary is unproven (STAGE-A A-WALL-3). | newly-surfaced |
| G-HU-04 | `isCodegenDependency` D11 partition | decision-gap | The codegen-dependency partition is a design decision, governed not verified; disputes trigger D11 review, not a proof (STAGE-A A-WALL-4). | newly-surfaced |
| G-HU-05 | P8 owner-authority promotion | decision-gap | The sufficient promotion act is a social/authority decision by definition — not computable (DESIGN-PACKAGE §8.3 P8, §2.2). | already-tracked (DESIGN-PACKAGE) |
| G-HU-06 | Layer B semantic-obligation satisfaction | definition-gap | Whether a σ-edge MEANS the prose obligation is not decidable from the typed graph; governed by owner authority (STAGE-A §2.2; DESIGN-PACKAGE §7 Layer B / R-1). | already-tracked (R-1) |
| G-HU-07 | Definition `confidence` field | definition-gap | "source and confidence" requested; only source is modeled; confidence is an unmodeled subjective scalar with no decidable form (DESIGN-PACKAGE §8.5 / R-4). | already-tracked (R-4) |

## Group 3 — owner: deferred (named, off the critical path; conjectural or post-MVP)

| id | name | type | what is unclear (+ artifact) | dedup |
|----|------|------|------------------------------|-------|
| G-DF-01 | Lan unit η / "residue = η-not-iso" | definition-gap | The headline residue characterization depends on a Lan object + η that DO NOT EXIST; conjectural, never asserted (CATEGORICAL-MODEL-DECISION constraint 1; DESIGN-REVIEW A/B; REPAIR G1). | already-tracked (R-undecidable / open conjecture) |
| G-DF-02 | Open M6-graph theorem | evidence-gap | "no genuine codegen ambiguity" is the open M6-graph conjecture — a CLAIM with no proof, deferred off critical path (STAGE-A §3.2; DESIGN-REVIEW; PLAN deferred). | already-tracked (open conjecture) |
| G-DF-03 | Path-equation commutativity | decidability-gap | `F(g∘f)=F(g)∘F(f)` is undecidable in general; the `Spec` record has NO path equations today, so "functor obligation" is currently a misnomer for a typed-quiver-morphism check (DESIGN-REVIEW C.3 / G3; DESIGN decidability line; REPAIR G3). | already-tracked (R-undecidable) |
| G-DF-04 | `fdm` vs `presheaf-lan` scope edge | scope-gap | DEC-CAT-01 builds `fdm` now and frames toward `presheaf-lan`; the boundary where fdm stops and the Lan layer begins is named but its trigger/cost line is undecided (CATEGORICAL-MODEL-DECISION; DESIGN). | newly-surfaced |
| G-DF-05 | R_U σ-fallback `sorry` | evidence-gap | 8 R_U edges have empty σ; emitter inserts a `sorry`-placeholder graded WARN — "compiles" is weaker than "proved" exactly here; remediation undecided (STAGE-A §1a caveat, §5). | newly-surfaced |
| G-DF-06 | Iteration delta replay / `prev_state` abutment | scope-gap | Decidable in principle over a history DAG but depends on OD-4 and is outside the `Spec` model; residue until the iteration doc kind is built (STAGE-A §2.2; DESIGN-PACKAGE §5, OD-4). | already-tracked (OD-4) |
| G-DF-07 | Semantic-purity anti-collapse half | decidability-gap | "a contract must not declare types/patterns" needs the parser to classify prose; partly mechanizable only once schema dialect (OD-3) is decided (STAGE-A §2.2; DESIGN-PACKAGE §4). | already-tracked (depends on OD-3) |
| G-DF-08 | Mechanical lifecycle edges | decidability-gap | "any → blocked", open-block ⇒ blocked are decidable but NOT built in the validator; named, not modeled (STAGE-A §2.1 last row; DESIGN-PACKAGE §8.4). | newly-surfaced |

## Group 4 — owner: blocked-on-B1 (the single shared precondition)

| id | name | type | what is unclear (+ artifact) | dedup |
|----|------|------|------------------------------|-------|
| G-B1-01 | Contract `obligation_id`s | definition-gap | Contract invariants are unlabeled prose; until each is an addressable `obligation_id`, P3, referencing, and anti-collapse cannot exist (DESIGN-PACKAGE B-1 §4; STAGE-A §2.3; PLAN deferred; RESULT B-1). | already-tracked (B-1) |

## Group 5 — DESIGN-PACKAGE open decisions (parent, un-ratified; bound this language-fit run)

| id | name | type | what is unclear (+ artifact) | dedup |
|----|------|------|------------------------------|-------|
| G-OD-01 | OD-1 syntax strategy | decision-gap | Option D (YAML-canonical + deferred DSL) recommended but PROVISIONAL pending owner ratification (DESIGN-PACKAGE §9 OD-1, BLOCKER). | already-tracked (OD-1) |
| G-OD-02 | OD-2 handoff kind vs profile | decision-gap | Recommended profile; unratified (DESIGN-PACKAGE §9 OD-2). | already-tracked (OD-2) |
| G-OD-03 | OD-3 schema-dialect unification | decision-gap | Extend JSON-Schema vs DomainSpec-native dialect undecided; blocks `extends`/`reference` and semantic-purity check (DESIGN-PACKAGE §9 OD-3 / R-2). | already-tracked (OD-3) |
| G-OD-04 | OD-4 iteration cardinality/history | decision-gap | One-vs-many subject, linear-vs-branching DAG undecided; gates delta replay (DESIGN-PACKAGE §9 OD-4). | already-tracked (OD-4) |
| G-OD-05 | OD-5 canonical state vocabulary | decision-gap | Two-axis split, terminal-state naming, `superseded` retention unratified (DESIGN-PACKAGE §9 OD-5). | already-tracked (OD-5) |
| G-OD-06 | DEC-CAT-01 not ratified | decision-gap | The categorical framing decision is "decided (provisional, owner-ratifiable)" — a DECISION without ratification (CATEGORICAL-MODEL-DECISION; RESULT OD). | already-tracked (DEC-CAT-01) |
| G-OD-07 | B-2 no negative fixtures | evidence-gap | No `block`-severity rule is proven to trip because no negative fixture exists; CLAIM of enforceability unbacked (DESIGN-PACKAGE B-2 §10). | already-tracked (B-2) |

---

## The 5 sharpest gaps (block the most downstream work)

1. **G-B1-01 (B-1: contract `obligation_id`s).** Single shared precondition —
   gates P3, referencing, both anti-collapse halves, and DESIGN-PACKAGE §4/§5/§7.
   Nothing in Layer B becomes decidable until this lands. (blocked-on-B1)
2. **G-LP-01 + G-LP-02 (P4 grade + per-edge provenance).** The honesty-critical
   Wave A pair: residue is NAMED but governs nothing and is attributable to
   nothing. Shipping any "governed residue/fidelity" claim before these is the
   prior run's explicit falsifier. (Lean-provable)
3. **G-OD-06 (DEC-CAT-01 ratification).** The categorical framing decision gates
   the translator output target, proof obligations, and residue definition for
   all of Stage B; still provisional. (deferred/decision)
4. **G-OD-01 + G-OD-03 (OD-1 syntax / OD-3 schema dialect).** The language-fit
   decisions: until syntax-strategy and schema-dialect are ratified, the envelope
   cannot be frozen and the semantic-purity check cannot be specified. (decision)
5. **G-DF-03 (path-equation commutativity).** The word "functor obligation" is
   load-bearing yet undefined: no path equations exist in `Spec`, so the current
   check is a typed-quiver morphism, not a Spivak functor — undecidable the moment
   relations are added. Blocks any honest composition-preservation claim. (deferred)

---

## Dedup summary against prior named items

| prior item | this register | status |
|------------|---------------|--------|
| U1 (categorical framing) | resolved by DEC-CAT-01 → G-OD-06 (ratification residue) | already-tracked |
| U2 (spec-correct beyond P1/P5; P3/P4 decidable?) | G-LP-01, G-LP-03, G-B1-01 | already-tracked |
| U3 (T determinism attributable to codegen) | G-LP-07, G-LP-02 | already-tracked |
| U4 (minimal provable Stage-B surface) | resolved (specCorrect floor = P1∧P5); residue → G-LP-06 | already-tracked |
| DEC-CAT-01 (provisional) | G-OD-06 | already-tracked |
| B-1 | G-B1-01 | already-tracked |
| R-determinism | G-LP-02, G-LP-07 | already-tracked |
| R-undecidable | G-DF-01, G-DF-02, G-DF-03 | already-tracked |
