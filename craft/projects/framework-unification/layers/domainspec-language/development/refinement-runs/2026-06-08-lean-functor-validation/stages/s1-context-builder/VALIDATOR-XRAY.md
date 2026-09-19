---
tags:
  [
    lean-code-validator,
    x-ray,
    current-state,
    functor-validation,
    refinement-run,
  ]
node_type: spec
is_session: true
layer: [domain, application]
nature: reference
status: draft
version: 0.1.0
last_updated: 2026-06-08
---

# VALIDATOR-XRAY — lean-code-validator current state

> Read-only x-ray of the seed Lean validator at
> `implementation/domainspec/internal_tools/lean-code-validator/`.
> Produced for the two-stage categorical verification refine run
> (Stage A = prove a DomainSpec spec correct in Lean; Stage B = validate
> LLM-produced code as a functor C→S into the spec category).
> This is a MAP, not an opinion. Every claim cites `file:definition`.

Base path (all paths below are relative to it unless absolute):
`implementation/domainspec/internal_tools/lean-code-validator/`

Lean toolchain: `leanprover/lean4:v4.30.0-rc2` (`lean-toolchain`, per `README.md:24`). No Mathlib.

---

## 1. Category-theoretic content that already exists

### 1.1 The typed quiver / σ-signature

The spec vocabulary is encoded as two finite enums plus a profile-indexed validity relation:

- `LeanCodeValidator/Sigma.lean:13` `inductive Meta` — 25 node-type labels (objects of the meta-quiver): 13 backend, 11 UI, 1 composition (`Saga`). `deriving DecidableEq, BEq, Repr`.
- `LeanCodeValidator/Sigma.lean:28` `inductive EdgeType` — 29 edge-type labels grouped R_B (12), R_U (8), R_X (6), R_CF (3). `deriving DecidableEq, BEq, Repr`.
- `LeanCodeValidator/Sigma.lean:45` `inductive Profile` — `paperBaseline | compositionExtension`.
- `LeanCodeValidator/Sigma.lean:56` `def sigmaValid : Profile → EdgeType → Meta → Meta → Bool` — the σ-table reified as a decidable function. Returns `true` iff `(profile, edgeType, srcMeta, tgtMeta)` is a sanctioned σ-triple. Encodes paper Tables 3 (R*B) and 4 (R_X), R_CF only under `.compositionExtension` (lines 80-82), and a catch-all `| *, _, _, \_ => false` (line 84) — so all 8 R_U edges and any unsanctioned triple are σ-invalid.

This is a **typed quiver at the meta level** (`Meta` = vertex colors, `EdgeType` = edge colors) plus a `Bool`-valued admissibility predicate `sigmaValid` that says which colored edges may connect which colored vertices under a given profile. There is no composition operation, no identities, and no associativity law on `sigmaValid` itself — so at the vocabulary layer the artifact is a **typed/colored quiver (directed multigraph schema), not yet a category**.

### 1.2 A concrete spec as a quiver instance

- `LeanCodeValidator/Richness.lean:29` `structure ConceptSpace` — `{ Concept : Type, decEq, beq, concepts : List Concept, metaOf : Concept → Meta }`. `metaOf` is the **coloring functor on objects**: it sends each concrete concept to its meta (vertex color). `concepts` is the explicit object enumeration.
- `LeanCodeValidator/Richness.lean:45` `structure EdgeRow (p : Profile) (C : ConceptSpace)` — `{ src, edge, tgt, provenance, wellTyped : sigmaValid p edge (C.metaOf src) (C.metaOf tgt) = true }`. The `wellTyped` field is a **compile-time proof** that the edge respects σ under the declared profile. An ill-typed edge for that profile is **unconstructible** — the type is uninhabited (no proof of `... = true`).
- `LeanCodeValidator/Richness.lean:58` `structure Spec` — `{ profile, conceptSpace, edges : List (EdgeRow profile conceptSpace), unresolvedRefs : List String, conceptCount : Nat }`. Telescopic: `edges` is indexed by the `profile` and `conceptSpace` declared above it.

So a `Spec` is a **finite typed quiver instance**: objects = `conceptSpace.concepts`, object coloring = `metaOf`, edges = `edges` (each a σ-admissible colored arrow). It is a quiver-over-schema, i.e. a map of quivers `C → MetaQuiver` carried by `metaOf` (objects) and the per-edge `wellTyped` witness (arrows).

### 1.3 Theorem 1 — what `all_edges_well_typed` actually proves

- `LeanCodeValidator/Richness.lean:71` `theorem all_edges_well_typed : S.edges.all (fun e => sigmaValid S.profile e.edge (S.conceptSpace.metaOf e.src) (S.conceptSpace.metaOf e.tgt)) = true`. Proof: induction on `S.edges`; `nil => rfl`, `cons` discharges by `simp [List.all, e.wellTyped, ih]`.

Precise statement: **every edge in a `Spec` respects the σ-signature for that spec's profile.** It is "free" because it merely folds the per-`EdgeRow` `wellTyped` proofs that already exist by construction — no `native_decide`, no enumeration.

What this is, categorically: it certifies that the `Spec` is a **valid morphism of typed quivers** `metaOf : C → MetaQuiver` (a "schema-respecting labeled quiver"). It is **NOT** a proof that the spec is a category (no composition/identity laws), nor a presheaf (no functor into Set/Type with restriction maps), nor a Kan extension. Those remain roadmap (§5). The honest current claim: _the spec is a well-typed colored quiver over the σ-schema._

### 1.4 The M6 ambiguity witness enumerator

- `LeanCodeValidator/Richness.lean:85` `def m6Witnesses : List (Concept × Concept × EdgeType × Concept)` — enumerates pairs of distinct sources converging on the same non-`Entity` target via the same edge type, with no disambiguating relation between the two sources (lines 90-96). This is the structural detector behind the "M6-graph" open theorem (§5) and feeds P4 (§2).

---

## 2. Grading predicates P1–P5

All graders live in `LeanCodeValidator/Report.lean` and are orchestrated by `gradeFor` (`Report.lean:136`). Support types: `Grade = pass | warn | fail` (`Report.lean:15`), `Finding` (`Report.lean:19`), `PredicateReport` (`Report.lean:25`), `CodegenReadinessReport` (`Report.lean:31`). Aggregation is worst-component (`Report.lean:42` `aggregateOverall`, `fail > warn > pass`).

`gradeFor` (`Report.lean:136`) returns exactly 4 predicate reports `[p1, p3, p4, p5]` — P2 is not a runtime entry (it is free from the data structure).

| Pred   | Status                | Lean mechanism                                                              | What it checks                |
| ------ | --------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| **P1** | **REAL**              | `Report.lean:56` `gradeP1Closure`                                           | Schema closure                |
| **P2** | **FREE** (structural) | `Richness.lean:50` `EdgeRow.wellTyped` field + `Richness.lean:71` Theorem 1 | σ-typing                      |
| **P3** | **STUB / deferred**   | `Report.lean:71` `gradeP3Obligations`                                       | Per-meta obligation table     |
| **P4** | **STUB / deferred**   | `Report.lean:80` `gradeP4Ambiguity`                                         | M6 codegen ambiguity          |
| **P5** | **REAL**              | `Report.lean:116` `gradeP5Acyclic`                                          | Codegen-dependency acyclicity |

### P1 — schema closure (REAL)

`def gradeP1Closure (spec : Spec) : PredicateReport` (`Report.lean:56`). Maps every entry of `spec.unresolvedRefs` to a `Finding`; grade `.fail` if any unresolved ref exists else `.pass` (`Report.lean:61-63`). It does NOT itself re-derive unresolved refs — it trusts the upstream parser to have populated `spec.unresolvedRefs`. Spec authority: `spec/rules.md:19` P1ClosureRule.

### P2 — σ-typing (FREE, not a grader)

There is no `gradeP2`. The constraint is the `wellTyped : sigmaValid p edge (C.metaOf src) (C.metaOf tgt) = true` field on `EdgeRow` (`Richness.lean:50`). An ill-typed edge cannot be constructed, so a `Spec` that type-checks has already discharged P2. Emit-time signal: the Python emitter would write a `sorry`-placeholder proof for a σ-invalid edge, surfacing as a Lean warning (`spec/rules.md:42`, `spec/mappings.md:53`). Theorem 1 (`Richness.lean:71`) is the global restatement. R_U edges have no σ-triple → cannot be `wellTyped` under either profile → policy is WARN (D12), not FAIL.

### P3 — per-meta obligations (STUB / deferred to Layer 2)

`def gradeP3Obligations (_ : Spec) : PredicateReport := { predicate := "P3", grade := .pass, findings := [] }` (`Report.lean:71-72`). Returns `.pass` unconditionally; argument ignored. Deferred pending EX1 calibration; flagged H2-risk (the obligation table is a v3 derivation, not a paper citation). The intended (not-yet-implemented) table is sketched in `spec/queries.md:45` `obligationsForMeta` (7 metas carry non-empty obligations: Operation/Query/Event/Rule/Workflow/Mapping/Interface).

### P4 — M6 codegen ambiguity (STUB / deferred to Layer 2)

`def gradeP4Ambiguity (_ : Spec) : PredicateReport := { predicate := "P4", grade := .pass, findings := [] }` (`Report.lean:80-81`). Returns `.pass` unconditionally. Intended behavior (`Report.lean:76-78`, `spec/rules.md:63`): wrap `m6Witnesses` (`Richness.lean:85`) and grade by `EdgeProvenance` — `declared`/`contextInferred` → `fail`, `sigmaFallback` → `warn`. The detector (`m6Witnesses`) is REAL and present; only the grading wrapper is stubbed.

### P5 — codegen-order DAG (REAL)

`def gradeP5Acyclic (spec : Spec) : PredicateReport` (`Report.lean:116`). Builds the dependency subgraph by `spec.edges.filter (fun e => isCodegenDependency e.edge) |>.map (fun e => (e.src, e.tgt))` (`Report.lean:117-120`), then runs `graphHasCycle` (`Report.lean:107`), which calls `dfsCycle` (`Report.lean:89`, `private partial def`, gray/black coloring). Grade `.fail` on cycle else `.pass`. Self-contained DFS — no Mathlib (D3).

The codegen-dependency partition is `def isCodegenDependency : EdgeType → Bool` (`Profiles.lean:77`):

- R_B `true` except `transitions` (`Profiles.lean:79-81`) — `transitions` is a runtime state change, not a type import.
- All 8 R_U `false` (`Profiles.lean:82-84`) — intra-UI-layer, no cross-layer import.
- All 6 R_X `true` (`Profiles.lean:85-86`).
- All 3 R_CF `true` (`Profiles.lean:87-88`).
  This partition is the **D11 proposed default**; any P5 fail an author deems legitimate triggers D11 review (`Profiles.lean:74`, `spec/rules.md:90`).

Profile membership helpers (used by P3 intent + smoke tests): `Profiles.lean:15` `metaTypesInProfile` (24 vs 25) and `Profiles.lean:45` `edgeTypesInProfile` (26 vs 29).

---

## 3. FaultInject.lean — the adversarial harness (Stage-B toy-game reference)

`examples/FaultInject.lean`. Header (`FaultInject.lean:1-4`): "Not a spec — a test harness." Shared concept set `C` with `OpA OpB EvA EvB RuleA` (`FaultInject.lean:12`), `metaOf` (`FaultInject.lean:16`), `cs : ConceptSpace` (`FaultInject.lean:23`). Three injected faults each `#eval gradeFor`-ed (`FaultInject.lean:63-65`):

1. **`specP1Fail`** (`FaultInject.lean:31`) — `unresolvedRefs := ["MissingThing", "OtherGhost"]`, empty edges. Triggers **P1 FAIL** (two unresolved-ref findings). Falsifies schema closure.
2. **`specP5Fail`** (`FaultInject.lean:42`) — profile `.compositionExtension`; two R_CF edges forming a cycle: `OpA --producesFor--> EvA` and `EvA --triggersCross--> OpA` (`FaultInject.lean:46-47`). Both are codegen deps (`isCodegenDependency` true for R_CF), so the dependency subgraph has cycle `OpA → EvA → OpA`. Triggers **P5 FAIL**. Falsifies generation-order DAG.
3. **`specCFOk`** (`FaultInject.lean:53`) — happy path: `RuleA --enforcesCross--> OpA`, `OpA --producesFor--> EvA` (`FaultInject.lean:57-58`), no cycle. Demonstrates **R_CF edges accepted under `compositionExtension`** (all-pass). This is the positive control showing the profile machinery admits cross-feature edges only in the extended profile.

For Stage B this file is the existing **falsification reference**: it shows the exact shape of (a) an unresolved-reference failure, (b) a cyclic-dependency failure, and (c) a profile-gated acceptance — three of the failure modes a functor-into-spec validator must reproduce. Note P3/P4 cannot be falsified here because they are stubs (everything they grade is `.pass`).

---

## 4. Spec data model + MarkdownToSpec / SpecToLean emitter pipeline

### Data model (in-repo, Lean)

`Spec` (`Richness.lean:58`) is the single ingestion target — see §1.2. Supporting: `ConceptSpace` (`Richness.lean:29`), `EdgeRow` (`Richness.lean:45`), `EdgeProvenance = declared | contextInferred | sigmaFallback` (`Richness.lean:17`). Hand-written reference instance: `examples/ZagrMarketplace.lean` (6 concepts, 4 edges, `#eval gradeFor spec` at `ZagrMarketplace.lean:54`).

### The translation surface (external Python, NOT in this repo tree)

Per `spec/mappings.md` and `README.md:64-70`, two mappings live in `scripts/audit_richness.py`:

- **`MarkdownToSpec`** (`spec/mappings.md:20`) — L1 markdown spec → typed-graph JSON. Extracts declared concepts + meta classification, typed edges + provenance, unresolved refs, profile frontmatter, per-concept counts. v2 limitation: extracts only the 12 R_B edge types (no R_U/R_X/R_CF), drops provenance/counts at output, no profile parse (`spec/mappings.md:30-34`).
- **`SpecToLean`** (`spec/mappings.md:46`) — typed-graph JSON → a `.lean` file with `def spec : Spec := { ... }` and a trailing `#eval gradeFor spec`. σ-invalid edges get a `sorry`-placeholder proof (the v3 P2 signal) (`spec/mappings.md:53`).

**IMPORTANT residue:** `audit_richness.py` is **referenced but absent from this repo location** (no `scripts/` dir under the tool; `find` returns nothing). The generated example `examples/ZagrMarketplaceGen.lean:2` carries the header path `/Users/victorboscaro/domainspec-theorem/examples/zagr-marketplace` — i.e. the emitter and its source specs live in an **upstream/external `domainspec-theorem` repo**, not here. So the only emitter _evidence_ in-tree is its output: `examples/ZagrMarketplaceGen.lean` (53 concepts, 49 in-graph edges, `unresolvedRefs := []`, `profile := .paperBaseline`, `conceptCount := 53`, every edge `provenance := .declared, wellTyped := rfl`). That file is the concrete shape the translator emits and the de-facto spec of `SpecToLean` output.

Deployment surface: `#eval gradeFor spec`; CLI is just `lake env lean --run examples/X.lean` (`spec/SPEC.md:77`, `spec/interfaces.md`). No separate CLI wrapper; JSON output deferred to v4 (D8).

---

## 5. The categorical ROADMAP the repo already names

The forward-looking categorical program is named in `README.md:88-91` (section "What this still does not prove"):

- "**Below the Claim B Wall** — the spec is taken as given." (`README.md:89`) — i.e. the validator validates _against_ a spec but does not itself prove the spec correct. This is precisely the Stage A boundary.
- "**Lan-faithful, not full** — no `Functor.Full` claim. See `/lean-richness-proof/docs/toward-categorical-spec-semantics.md` for the categorical roadmap (`Quiver Meta`, Spec-as-presheaf, the open M6-graph theorem)." (`README.md:90`)
- "**Parser artifacts** — incidental markdown links accepted as σ-fallback edges may surface as M6 witnesses. Once P4 lands, `sigmaFallback` provenance will surface this as a WARN." (`README.md:91`)

The named categorical targets are therefore: **Quiver Meta** (the meta-quiver, partially realized as `Meta`+`EdgeType`+`sigmaValid`), **Spec-as-presheaf** (not yet built — `Spec` is currently a labeled quiver, not a presheaf), the **Kan extension `Lan`** with the claim "**Lan-faithful, not full**" (no `Functor.Full`), and the **open M6-graph theorem** (the un-proven statement behind `m6Witnesses` / P4). The roadmap doc itself (`toward-categorical-spec-semantics.md` in the `lean-richness-proof` v1 sibling) is **NOT present in this repo tree** (`find` returns nothing) — it lives in the upstream `domainspec-theorem` / `lean-richness-proof` lineage. The README also positions this tool as the successor to `/lean-richness-proof` v1 (`README.md:5`).

---

## 6. Reuse map for the two-stage pipeline

### Serves Stage A directly (prove a DomainSpec spec correct)

- `Sigma.lean:56` `sigmaValid` — the σ-schema as a decidable relation; the authoritative "what is a legal edge" oracle. Reuse as-is as the spec category's hom-admissibility.
- `Richness.lean:45` `EdgeRow` + `Richness.lean:50` `wellTyped` — compile-time σ-correctness by construction. This is the existing mechanism that makes "the spec is well-formed" a _type_, not a runtime check.
- `Richness.lean:71` `all_edges_well_typed` (Theorem 1) — the existing proof that a spec is a valid typed quiver over σ. Stage A's first lemma is already here (modulo upgrading quiver → category/presheaf).
- `Profiles.lean:15` `metaTypesInProfile`, `Profiles.lean:45` `edgeTypesInProfile`, `Profiles.lean:77` `isCodegenDependency` — profile-scoped object/edge universes and the codegen-dependency partition; Stage A needs these to define the target category per profile.

### Serves Stage B directly (validate LLM code as a functor C→S)

- `Richness.lean:29` `ConceptSpace` + `metaOf` — exactly the object-map shape a functor `C → S` needs: a finite object set with a coloring/typing into the meta vocabulary. The translator's output type can be a `ConceptSpace`.
- `Richness.lean:45` `EdgeRow` — the arrow-map with a per-arrow proof that the image respects σ. This is structurally a **functor-on-arrows obligation**: "every translated edge lands on a legal hom of S." Reuse as the per-morphism well-typedness witness.
- `Report.lean:136` `gradeFor` + `Report.lean:42` `aggregateOverall` — the deterministic pass/warn/fail verdict surface with worst-component aggregation. Stage B's verdict layer.
- `Report.lean:116` `gradeP5Acyclic` (+ `Report.lean:89` `dfsCycle`, `Report.lean:107` `graphHasCycle`) — a real, Mathlib-free graph-property checker reusable for any acyclicity/order obligation on translated code.
- `Report.lean:56` `gradeP1Closure` — real reference-closure check (no dangling targets); directly applicable to "every symbol the code references exists in S."
- `examples/FaultInject.lean` — the existing **adversarial toy game**: canonical injected faults (P1, P5, R_CF gate). Stage B's falsification harness can extend this directly.
- `examples/ZagrMarketplaceGen.lean` — a realistic large emitted `Spec` (53 concepts/49 edges) usable as the Stage-B target-category fixture.

### Missing / must be built

- **No composition or identity structure** — `sigmaValid`/`EdgeRow` give a quiver, not a category. To validate a _functor_ C→S, S must first be a category (composable homs, identities, functor laws). Not present anywhere.
- **Spec-as-presheaf** — named in roadmap (`README.md:90`) but unbuilt.
- **Kan extension `Lan` + "Lan-faithful not full"** — named, unbuilt; no `Functor` / `Functor.Full` machinery exists (consistent with no-Mathlib).
- **The translator C→S itself** — `MarkdownToSpec`/`SpecToLean` translate _markdown spec → Lean Spec_ (artifact → spec). There is **no** existing translator from _LLM-produced code → C_ (the Stage-B source category). The whole `audit_richness.py` deterministic translator is also absent from this repo (§4) — only its emitted output is here.
- **P3 and P4 graders** — stubbed (`Report.lean:71`, `Report.lean:80`); obligation table and M6-ambiguity verdicts not implemented. The M6 _detector_ (`Richness.lean:85`) exists; the _theorem_ (M6-graph) is open.
- **Per-edge provenance in the parser** — emitter currently writes `.declared` for every edge (`README.md:76`, visible in `ZagrMarketplaceGen.lean`), so P4's provenance discrimination has no real input yet.

---

## 7. Constraints that limit provability

- **No Mathlib, self-contained Lean 4** (`Sigma.lean:5`, `README.md:3`, D3). Consequence: no `Quiver`, `CategoryTheory.Functor`, `Functor.Full`, or `Lan` from the library; the categorical roadmap (§5) must be hand-rolled or the constraint relaxed. This is the single biggest limiter on lifting quiver → category → presheaf → Kan extension.
- **`#eval gradeFor spec` deployment surface** (`spec/SPEC.md:77`, `Report.lean:136`). The shipped contract is _evaluation_, not _proof export_: P1/P5 are decidable `Bool`-returning checks run by `#eval`, not theorems. Only P2 (`wellTyped` / Theorem 1) is a real proof obligation. Anything Stage B wants to _prove_ (rather than _check_) must move from the `#eval` graders into the type system like `EdgeRow` did.
- **`partial def dfsCycle`** (`Report.lean:89`) — P5's cycle check is `partial` (termination not certified to Lean's kernel). Fine for `#eval`, but it is **not a proof of acyclicity** — it is an unverified decision procedure. A provable Stage A/B acyclicity result would need a terminating, kernel-checked replacement.
- **Worst-component aggregation** (`Report.lean:42` `aggregateOverall`, `fail > warn > pass`) — verdict is the min over predicates; a single FAIL dominates. Honest and simple, but it discards which predicate failed at the top level (recoverable from `predicateReports`).
- **P3/P4 stubbed to `.pass`** (`Report.lean:71`, `Report.lean:80`) — current `overallGrade` can only ever be driven by P1, P2(compile-time), and P5. Any spec that is reference-closed and acyclic grades `pass` regardless of obligation completeness or M6 ambiguity. Stage B must not assume `pass` means "complete."
- **σ-table is hand-transcribed from paper Tables 3 & 4** (`Sigma.lean:51-53`), and the obligation table is a v3 derivation flagged H2-risk (`spec/queries.md:51`). Provability is only as sound as those transcriptions; there is no machine link back to the paper.
- **R_U edges are unsigned → structurally WARN, never provable as well-typed** (`Sigma.lean:83-84`, D12). Any UI-layer functor edge cannot be discharged by `EdgeRow.wellTyped` today.

---

## Evidence boundary

In-tree and read fully: `Sigma.lean`, `Profiles.lean`, `Richness.lean`, `Report.lean`, `examples/ZagrMarketplace.lean`, `examples/FaultInject.lean`, `examples/ZagrMarketplaceGen.lean`, `spec/{domain,rules,operations,queries,mappings,SPEC}.md`, `README.md`, `PLAN.md`.

Referenced but ABSENT from this repo location (claims about them are from in-tree docs/emitted output, not source inspection): `scripts/audit_richness.py`, `discovery/*.md` (INITIAL-DEFINITIONS, PROJECT-DECISIONS, HYPOTHESES, EXPERIMENT-CANDIDATES), `research/` tables, and `lean-richness-proof/docs/toward-categorical-spec-semantics.md` (the categorical roadmap doc). These live in the upstream `domainspec-theorem` / `lean-richness-proof` lineage (path evidence: `ZagrMarketplaceGen.lean:2`).
