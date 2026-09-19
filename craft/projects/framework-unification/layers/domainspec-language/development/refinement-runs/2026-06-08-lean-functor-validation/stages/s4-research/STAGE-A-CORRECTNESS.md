# Stage A — What "A DomainSpec Spec Is CORRECT" Means

Stage: s4 (research) · Role: `spec-correctness-prover` · Dispatch: `refine-2026-06-08-lean-functor-validation`
Mode: read-only analysis · Output: Stage-A design (no code written)

> **Scope.** Stage A of the two-stage categorical verification pipeline. Stage A answers
> _"is this spec internally correct enough to feed to codegen?"_ by EXTENDING the existing
> validator's P1–P5 predicates and σ-model (`Sigma.lean`, `Profiles.lean`, `Richness.lean`,
> `Report.lean`). Stage B (the `Δ : Σ_code → Σ_spec` schema-functor / migration trio) is the
> sibling `CATEGORICAL-FORMALIZATIONS.md` and is out of scope here.
>
> **Citation discipline.** Every claim about existing code cites `file:definition`. Each
> obligation is tagged **TYPE-level** (free by construction, compile-time) or **GRADER-level**
> (an `#eval`-time decidable check). "Decidable check (`#eval`)" ≠ "proved theorem" and the two
> are kept distinct throughout.

---

## 0. The two notions Stage A must not conflate

The validator already separates two things the prose tends to collapse:

1. **Type-level invariant** — enforced by Lean's type checker at _construction/emit_ time. You
   cannot build a `Spec` value that violates it. The only "proof" is that the file compiles.
   Example: `EdgeRow.wellTyped` (`Richness.lean:50`).
2. **Grader-level check** — a `Bool`/`Grade`-valued function evaluated by `#eval gradeFor spec`
   at _runtime over a constructed `Spec`_. It can return `fail`/`warn`/`pass`; the spec object
   still exists either way. The tool "never rejects a spec — it always runs to completion"
   (`SPEC.md:65`). Example: `gradeP1Closure` (`Report.lean:56`).

Stage-A correctness is the conjunction of (1) the type-level invariants that hold by
construction and (2) the grader-level checks that return non-`fail`. The README explicitly
positions this whole surface as living _above_ the "Claim B Wall": "the spec is taken as given"
(`README.md:89`). See §4.

---

## 1. Layered definition of "spec correctness"

Five layers. For each: the proof obligation as a decidable proposition, and TYPE-level vs
GRADER-level status with the citation that establishes it.

### (a) Well-typedness — σ-typing — **TYPE-level (free, Theorem 1)**

**Obligation.** Every edge respects the profile-aware σ-signature:
`∀ e ∈ spec.edges, sigmaValid spec.profile e.edge (metaOf e.src) (metaOf e.tgt) = true`
(`rules.md:41`, P2SigmaRule "Formal").

**Why free.** The obligation is a _field_ of the edge: `EdgeRow.wellTyped : sigmaValid p edge
(C.metaOf src) (C.metaOf tgt) = true` (`Richness.lean:50`). An ill-typed edge for the declared
profile cannot be constructed (`README.md:44`; `Richness.lean:41–43`). The aggregate is
**Theorem 1** `all_edges_well_typed`, proved by list induction with `simp [..., e.wellTyped,
ih]` — no `native_decide`, no Mathlib (`Richness.lean:71–76`).

**Status.** This is the _only_ layer that is a genuine **proved theorem** today. It carries no
grader entry: `gradeFor` runs P1, P3, P4, P5 only (`Report.lean:136–141`); P2 "is free" / "no
`gradeP2` operation runs at eval time" (`SPEC.md:65`, `rules.md:38`). σ-validity itself is
decidable because `sigmaValid` is a total `Bool` function by pattern match with a catch-all
`| _, _, _, _ => false` (`Sigma.lean:84`).

> **Caveat (R_U / σ-fallback).** The 8 R_U edges have empty σ; a `paperBaseline` spec cannot
> build a real `wellTyped` proof for them — the emitter inserts a `sorry`-placeholder that
> surfaces as a Lean warning, graded `WARN` by D12 convention (`rules.md:42`, `SPEC.md:57`).
> So "free" holds strictly only for edges with a real σ-triple; R_U use degrades the theorem to
> a `sorry` and is a known honesty boundary.

### (b) Schema closure — P1 — **GRADER-level (real)**

**Obligation (decidable).** `spec.unresolvedRefs = []`. Equivalently, every referenced name is
declared: `∀ name ∈ spec.unresolvedRefs, name ∉ conceptSpace.concepts.map(.name)` ⇒ each is a
`fail` (`rules.md:26`).

**Status.** Real grader check. `gradeP1Closure` maps `unresolvedRefs` to findings and returns
`if findings.isEmpty then .pass else .fail` (`Report.lean:56–63`). It is **a decidable
`#eval` check, not a theorem** — `List.isEmpty` on the parser-supplied `unresolvedRefs : List
String` (`Richness.lean:62`). Note the _trust boundary_: closure is only as good as the
parser's population of `unresolvedRefs`; Lean does not re-derive references from the concept
graph. This is a GRADER check precisely because the input is parser metadata, not a structural
invariant of the `Spec` type.

### (c) Acyclicity — P5 — **GRADER-level (real)**

**Obligation (decidable).** Let `G = {(src,tgt) | e ∈ spec.edges, isCodegenDependency e.edge}`.
`G` must be a DAG (`rules.md:83`).

**Status.** Real grader check. `gradeP5Acyclic` filters edges by `isCodegenDependency`
(`Report.lean:117–119`), then runs `graphHasCycle` — gray/black DFS coloring
(`Report.lean:89–114`). `isCodegenDependency` (`Profiles.lean:77–88`) is the D11 partition:
all R_B except `transitions`, no R_U, all R_X, all R_CF (`README.md:62`). It is **a decidable
`#eval` check, not a theorem.** The DFS is a `partial def` (`Report.lean:89`); the comment is
explicit — "no Mathlib proof needed for `#eval` use" (`Report.lean:86`). There is _no_
`acyclic` theorem; the algorithm is trusted, not verified. Promoting this to a theorem would
require a terminating (non-`partial`) reachability definition and a proof that
`graphHasCycle = false → ∃ topological order` (see §3, and the open M6-graph theorem,
`README.md:90`).

### (d) Per-meta obligations — P3 — **GRADER-level (stub today)**

**Intended obligation (decidable target).** For each declared concept, the minimum required
σ-edges for its meta exist: `∀ c ∈ conceptSpace, ∀ ob ∈ obligationsForMeta profile c.meta,
∃ e ∈ spec.edges, ob.satisfied e c` (`rules.md:52`). Per-meta-type granularity (A6 resolution,
`rules.md:50`). Intended grade: `warn` if any obligation missing, `pass` otherwise
(`rules.md:54–57`) — deliberately `warn`-not-`fail` (D1).

**Status today.** Stub. `gradeP3Obligations (_ : Spec)` returns `.pass` unconditionally
(`Report.lean:71–72`). Not a check and not a theorem — it is a constant function. The validator
defers it pending EX1 calibration (`Report.lean:4–5,66–69`; `README.md:74`). Honesty flag H2:
the obligation table "is our derivation, not a doc citation" (`rules.md:56`). See §3 for the
lift plan.

### (e) M6 ambiguity / provenance — P4 — **GRADER-level (stub today)**

**Intended obligation (decidable target).** No M6 witness without a disambiguating relation,
graded by provenance: `declared`/`contextInferred` ⇒ `fail`, `sigmaFallback` ⇒ `warn`, none ⇒
`pass` (`rules.md:67–73`). An M6 witness = two distinct sources converging on the same
non-`Entity` target via the same edge type, with no disambiguating relation
(`Richness.lean:79–96`, `m6Witnesses`).

**Status today.** Stub. `gradeP4Ambiguity (_ : Spec)` returns `.pass` unconditionally
(`Report.lean:80–81`). The _witness enumerator_ `m6Witnesses` already exists and is decidable
(`Richness.lean:85–96`) — it is computed but not yet _consumed_ by the grader. `EdgeProvenance`
(`Richness.lean:17–21`) exists but the emitter defaults every edge to `.declared`
(`README.md:46,76`), so even a real P4 would have only `fail`/`pass` resolution until the parser
tracks per-edge provenance. See §3.

### Aggregation

`aggregateOverall` is worst-component, `fail > warn > pass`, over the four reports
(`Report.lean:42–49`, `Report.lean:141`). Decidable fold; not a theorem. With P3/P4 stubbed,
`overallGrade` is effectively `min(P1, P5)` plus any P2 `sorry`-WARN.

---

## 2. Gap: prior DESIGN-PACKAGE language vs what the validator can prove

The DESIGN-PACKAGE describes a _contract / schema / iteration_ document language
(`DESIGN-PACKAGE.md` §§1–8). The validator proves things about a _typed concept-edge graph_
(`Spec`). They meet at exactly one seam: **the schema/structural layer (Layer A of
DESIGN-PACKAGE §7) is what the σ-graph + P1/P5 already mechanize; the contract/obligation layer
(Layer B) is what P3/P4 reach toward but mostly cannot yet prove.**

### 2.1 DESIGN-PACKAGE obligations that DO become decidable Lean predicates

| DESIGN-PACKAGE obligation                                                                                                                                                 | Validator mechanism                                                                                                                                                               | Kind                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Layer A structural shape — required fields, enums, regex, **reference integrity** (`DESIGN-PACKAGE.md:182–186`, step 6 of the 7-step validator `:200–206`)                | P1 schema closure: `unresolvedRefs = []` (`Report.lean:56`)                                                                                                                       | GRADER `#eval` (decidable)                |
| σ-typedness of relations between concepts (the structural core under §4 contract↔schema refs)                                                                             | `EdgeRow.wellTyped` + Theorem 1 (`Richness.lean:50,71`)                                                                                                                           | TYPE-level (proved theorem)               |
| Anti-collapse: "every block-level schema rule must trace to a contract `obligation_id` **and vice versa**" (`DESIGN-PACKAGE.md:122–125`) — the _referential-closure half_ | Becomes a P1-shaped closure check once obligations are nodes: every `satisfies: obligation_id` resolves, and every obligation is referenced. Decidable membership over two lists. | GRADER `#eval` (decidable, **after B-1**) |
| Emission-order soundness (implicit in "codegen-readiness")                                                                                                                | P5 acyclicity of the codegen-dependency subgraph (`Report.lean:116`)                                                                                                              | GRADER `#eval` (decidable)                |
| Mechanical lifecycle edges — "any → `blocked` (mechanical)", open-`block` ⇒ blocked (`DESIGN-PACKAGE.md:231,245`)                                                         | Decidable predicate over blocker-record status lists; not yet in the validator but trivially `#eval`-able                                                                         | GRADER `#eval` (decidable; not built)     |

### 2.2 DESIGN-PACKAGE obligations that CANNOT be mechanized — governed residue

| Obligation                                                                                                                                                                                                                             | Why it stays residue                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer B semantic obligations discharged by narrative review** returning pass/flag/block (`DESIGN-PACKAGE.md:187–189`); risk R-1 "`validation_rules` are natural-language prose, not executable predicates" (`DESIGN-PACKAGE.md:296`) | No decidable proposition exists until each obligation is a predicate. The validator can check _presence_ of a σ-edge (P3) but not that the edge _means_ the prose obligation. Governed by owner authority (`DESIGN-PACKAGE.md:191–196`). |
| **P8 owner-authority approval** — the _sufficient_ promotion act (`DESIGN-PACKAGE.md:241–242`)                                                                                                                                         | A social/authority act by definition; not computable. Stays governed. (Note: P1–P7 of the promotability list are _necessary_ and several map to §2.1 checks.)                                                                            |
| **Confidence** field on definitions (`DESIGN-PACKAGE.md:250–254`, R-4)                                                                                                                                                                 | Unmodeled; a subjective scalar. No σ-/graph-decidable form.                                                                                                                                                                              |
| **Anti-collapse: "a contract must not declare types/patterns"** (`DESIGN-PACKAGE.md:122–123`) — the _semantic-purity half_                                                                                                             | Detecting "is this prose a type declaration?" is not decidable from the typed graph; needs the parser to classify content. Partly mechanizable only if the schema dialect is decided (OD-3, `DESIGN-PACKAGE.md:274–278`).                |
| **Iteration delta replay / `prev_state` abutment** (`DESIGN-PACKAGE.md:157–160`, ITR-R001..R005)                                                                                                                                       | Decidable _in principle_ over a history DAG, but depends on unresolved OD-4 (cardinality/branching, `DESIGN-PACKAGE.md:279–280`) and is outside the `Spec` model entirely. Residue until the iteration document kind is built.           |

### 2.3 The pivotal blocker B-1

DESIGN-PACKAGE **B-1** (`DESIGN-PACKAGE.md:290–293`): contract invariants are unlabeled prose;
they must become addressable `obligation_id`s before referencing, anti-collapse, or
obligation-validation can exist. **This is the precise precondition for lifting P3 and P4 from
GRADER-stub to GRADER-real** (§3). Until B-1, `obligationsForMeta` (`rules.md:52`) has no
calibrated source — which is exactly the H2 honesty flag the validator already records
(`rules.md:56`). B-1 is the single shared dependency that gates §2.1 row 3 and all of P3.

---

## 3. Extension plan — lift P3 and P4 from stub to real (Mathlib-free, decidable)

Both lifts stay inside the existing `Spec`/σ-model and use only total `Bool` functions +
`List` operations, so they remain `#eval`-checkable without Mathlib. Each row states what data
is needed, the `#eval`-checkable definition, and what would make it a _theorem_ vs a runtime
check. References the validator's own deferral notes (`README.md:73–76`, `Report.lean:66–81`).

### 3.1 P3 — per-meta obligation table

- **Data needed.** A total `obligationsForMeta : Profile → Meta → List Obligation`, where an
  `Obligation` is minimally an `EdgeType` the concept's meta must originate or receive (the
  `rules.md:52` shape `ob.satisfied e c`). Source = EX1 calibration (`README.md:74`); until
  EX1, encode it as a _derivation_ and keep the H2 caveat (`rules.md:56`). The σ-table in
  `Sigma.lean:56–84` already enumerates which `(edge, srcMeta, tgtMeta)` are legal, so the
  obligation table is a _sub-selection_ of σ-triples per meta — no new vocabulary.
- **`#eval`-checkable definition.** Replace the stub (`Report.lean:71–72`) with:
  `for each c in spec.conceptSpace.concepts, for each ob in obligationsForMeta profile (metaOf
c), check spec.edges.any (ob.satisfied · c)`; emit a `warn` finding per miss, grade
  `if anyMiss then .warn else .pass` (matches `rules.md:54–57`, D1 warn-not-fail). All total
  `List.any`/`List.all` over finite lists — decidable, no `partial`.
- **Check vs theorem.** As written it is a **decidable `#eval` check**. To make it a
  _theorem_ you would prove `gradeP3 spec = .pass ↔ ∀ c ∈ concepts, ∀ ob ∈ obligationsForMeta
…, ∃ e …` via `List.all_iff`/`decide` over the finite concept list — feasible Mathlib-free
  (mirrors the Theorem 1 induction style, `Richness.lean:71`). The _content_ of
  `obligationsForMeta` remains a calibrated assumption (H2), so even the theorem is "correct
  relative to the table," not absolutely.

### 3.2 P4 — M6 ambiguity via provenance

- **Data needed.** Two pieces already exist: the enumerator `m6Witnesses` (`Richness.lean:85`)
  and `EdgeProvenance` (`Richness.lean:17`). The missing datum is **real per-edge provenance
  from the parser** — today the emitter writes `.declared` for every edge (`README.md:46,76`).
  To grade `warn` vs `fail` correctly, `m6Witnesses` must additionally carry the provenance of
  the contributing edges (a small extension to the returned tuple, `Richness.lean:96`).
- **`#eval`-checkable definition.** Replace the stub (`Report.lean:80–81`) with: compute
  `spec.m6Witnesses`; if empty ⇒ `.pass`; else grade by worst provenance among the witness's
  edges — `declared`/`contextInferred` ⇒ `.fail`, `sigmaFallback`-only ⇒ `.warn`
  (`rules.md:67–73`, `README.md:75`). `BEq` on `EdgeProvenance` is derived (`Richness.lean:21`)
  so all comparisons are decidable. No `partial` — `m6Witnesses` is a `flatMap` over a finite
  edge list (`Richness.lean:88–96`).
- **Check vs theorem.** A **decidable `#eval` check**. A _theorem_ form —
  `gradeP4 spec = .pass ↔ spec.m6Witnesses = []` — is straightforward (definitional unfolding +
  `List.isEmpty`). The deeper "no genuine codegen ambiguity" claim is the **open M6-graph
  theorem** the README flags as unresolved (`README.md:90`); that one is _not_ mechanizable yet
  and stays residue.

### 3.3 Verdict

Both are **lift-able to real GRADER `#eval` checks now**, Mathlib-free, with no `Spec`-model
change for P4 (only the parser provenance feed) and only the addition of `obligationsForMeta`
for P3. Neither needs to be a theorem to make Stage A defensible. **P4 is the cheaper, more
immediately honest lift** (witness enumerator already built; only `gradeP4Ambiguity` is a
constant); **P3 is gated on B-1 / EX1 calibration** and should ship as `warn`-only with the H2
caveat preserved. Neither becomes an absolute theorem — both are "correct relative to a
declared table/feed," consistent with the validator's existing honesty posture.

---

## 4. Below the Claim B Wall — what Stage A does NOT prove (declared assumptions)

The README is explicit: "**Below the Claim B Wall** — the spec is taken as given"
(`README.md:89`). Stage-A correctness therefore _assumes_, and must declare:

- **A-WALL-1 — Parser fidelity.** The `Spec` faithfully represents the source markdown:
  `unresolvedRefs` is correctly populated (P1 trusts it, §1b), `metaOf` classifies each concept
  correctly, and edges/provenance reflect authorial intent. Stage A does not re-derive the
  graph from text. The Python emitter (`audit_richness.py`, `README.md:64–70`) is outside the
  proof.
- **A-WALL-2 — σ-table faithfulness.** `sigmaValid` correctly transcribes paper Tables 3 & 4
  and the D6 R_CF rules (`Sigma.lean:51–84`). Theorem 1 proves edges _match the table_, not
  that the table is the _right_ semantics.
- **A-WALL-3 — Vocabulary canonicity.** The 25 Meta / 29 EdgeType / 2 Profile encoding is
  lifted read-only from upstream `domainspec-core` (`SPEC.md:17,40`); Stage A does not prove the
  vocabulary itself is complete or sound.
- **A-WALL-4 — `isCodegenDependency` partition correctness.** The D11 default partition
  (`Profiles.lean:77–88`) is a _design decision_, not proved; a P5 `fail` the author disputes
  triggers D11 review (`rules.md:90`), i.e. the partition is governed, not verified.
- **A-WALL-5 — P3 obligation-table calibration (H2).** The obligation table "is our
  derivation, not a doc citation" (`rules.md:56`); once P3 lands it is assumed, not proved.
- **A-WALL-6 — No `Functor.Full` / no full categorical semantics.** "Lan-faithful, not full"
  (`README.md:90`); the Spec-as-presheaf and open M6-graph theorem are Stage-B / future roadmap,
  not Stage A.
- **A-WALL-7 — DESIGN-PACKAGE Layer B residue.** Semantic obligation satisfaction, owner
  promotion (P8), confidence, iteration replay, and the semantic-purity anti-collapse half (§2.2)
  are governed by owner authority, not by Stage A.

---

## 5. Minimal Stage-A acceptance predicate

The smallest decidable predicate defensible as "this spec is correct for codegen-readiness."
It is the conjunction of the one proved invariant and the two real grader checks, gated as a
`Prop`/`Bool`. **P3/P4 are deliberately excluded from the _minimal_ predicate** — P3 is a stub
and gated on B-1; P4 is a stub today. They are _recommended_ additions (§3) but not required for
the minimal floor.

```text
-- Conceptual; lives above the existing grader, no new Spec fields.
def specCorrectMinimal (spec : Spec) : Bool :=
  -- (1) σ-typedness: FREE / proved. Theorem 1 guarantees this for any
  --     constructible Spec, so it is `true` by construction. Re-expressed as a
  --     runtime witness for completeness:
  spec.edges.all (fun e =>
    sigmaValid spec.profile e.edge
      (spec.conceptSpace.metaOf e.src) (spec.conceptSpace.metaOf e.tgt))
  -- (2) P1 schema closure: real #eval check (Report.lean:56)
  && (gradeP1Closure spec).grade == Grade.pass
  -- (3) P5 acyclicity: real #eval check (Report.lean:116)
  && (gradeP5Acyclic spec).grade == Grade.pass
```

Equivalently, against the shipped aggregator: a spec is minimally correct iff it compiles
(σ-typedness, `Richness.lean:50` + Theorem 1 `Richness.lean:71`) **and** `gradeFor spec` has
no `fail` from P1 or P5 — i.e. `overallGrade ≠ .fail` given that P3/P4 are `.pass` stubs
(`Report.lean:136–144`). Because clause (1) is Theorem 1, the _decidable surface_ of the
minimal predicate reduces to **P1 = pass ∧ P5 = pass**.

- **Defensibility.** Each conjunct is either a **proved theorem** (clause 1) or a **decidable
  `#eval` check** (clauses 2–3) — nothing here is a stub. It directly answers "codegen-readiness":
  closure (every referenced concept exists, §1b) + acyclic codegen-dependency graph (a valid
  emission order exists, §1c) + well-typed edges (every relation is a legal σ-triple).
- **What it intentionally omits.** P3 obligations (warn-only, B-1-gated) and P4 ambiguity
  (warn-or-fail, parser-provenance-gated) are recommended hardening, not part of the minimal
  floor. The R_U `sorry`-WARN honesty caveat (§1a) is the one place "compiles" is weaker than
  "proved."

---

## Receipt

See separate receipt returned to the dispatcher.
