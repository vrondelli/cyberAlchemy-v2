---
tags: [language-validator-convergence, coupling-architecture, invoke-design, refinement-run]
node_type: design
is_session: true
layer: [domain, application]
nature: design
status: draft
version: 0.1.0
last_updated: 2026-06-08
role: coupling-architect
---

# COUPLING-ARCHITECTURE — DomainSpec Language ↔ Lean Validator Convergence (s6)

> Design-only. No code. Produces a convergence architecture for D1∧D2 plus the
> coupling seam, single-source-of-truth rule, pipeline/lifecycle recomposition,
> and acyclicity story. Cites DESIGN-PACKAGE §§ and validator definitions from
> VALIDATOR-XRAY / lean-functor DESIGN.

The intent (DEFINE s2): converge LANGUAGE and VALIDATOR into one **mutually
dependent** system across two directions, without vicious circularity.
- **D1 (language → validator):** validator's content surface — P3 per-Meta
  obligations + active `Meta`/`EdgeType`/profile — is **derived from** language
  artifacts (contract `obligation_id`s, schema, taxonomy).
- **D2 (validator → language):** language's validation authority (§7) +
  lifecycle promotion (§8) is **bound to** the Lean validator's verdict.

---

## 0. Route-menu evaluation (4 options)

| Option | Gives D1? | Gives D2? | Acyclic? | Single source? | Verdict |
| --- | --- | --- | --- | --- | --- |
| **shared-core-vocab** (one vocab both import) | Partial — shares vocabulary, but obligations are a *derivation* over contracts, not a static shared enum; does not carry verdicts back | No D2 at all | Yes | Vocab yes, obligations no | **Rejected** — covers only the σ-vocabulary slice DEC-FIT-01 already calls *incidental*; no verdict path. |
| **layered-dependency** (language=upper semantic authority, validator=lower well-formedness; deps cross a layer boundary) | Yes (upper consumes lower? — inverted) | Yes | Risky | Ambiguous | **Rejected as framed** — a single layer stack forces one global direction; you cannot have *both* "language depends on validator verdict" and "validator depends on language obligations" in one acyclic layer order. The correct insight (authority split) survives into the recommendation, but as **two authorities over different facts**, not one layer dominating. |
| **full-merge** (collapse into one system) | Trivially | Trivially | **No** — collapses the two authorities into one object; a spec would validate its own content (the R-circularity the DEFINE forbids, s2 lines 18–28) | One system | **Rejected** — destroys the content/well-formedness authority separation that is the whole acyclicity guarantee. |
| **compiler-pair** (two one-way compilers: language artifacts → validator inputs; validator verdict → language lifecycle state) | **Yes** — `K↓` compiles contract/schema/taxonomy → `obligationsForMeta` + active Σ | **Yes** — `K↑` compiles `gradeFor` verdict → lifecycle/promotion transition guard | **Yes** — two compilers move *different artifacts in opposite directions over disjoint facts*; no fact flows in a circle | Each side authored once, other side generated | **RECOMMENDED** |

### Recommendation: **compiler-pair** (with the layered authority split folded in)

compiler-pair is the only option that delivers **genuine D1 AND D2** while
staying acyclic. The reason is structural, not stylistic: D1 and D2 do not
operate on the same fact.

- D1 moves **content** (obligations, vocabulary) **down** from language to
  validator: `K↓ : LanguageArtifacts → ValidatorInputs`.
- D2 moves a **verdict** (well-formedness judgment) **up** from validator to
  language lifecycle: `K↑ : Verdict → LifecycleTransitionGuard`.

`K↓` reads contracts/schema/taxonomy and **never reads a verdict**. `K↑` reads
`gradeFor`'s `pass/warn/fail` and **never reads obligations**. The two compilers
share no output fact, so the system-level bidirectional coupling decomposes into
two acyclic one-way maps at the meta level — exactly the
"acyclic-at-meta-level / bidirectional-at-system-level" requirement (DEFINE s2
lines 26–28). This *is* the layered-dependency insight done correctly: the
language is the **content authority** and the validator is the **well-formedness
authority**, but neither sits "above" the other in a single dependency stack —
they are peers connected by two compilers over disjoint facts.

This realizes DEC-FIT-01's bridge condition directly: B-1 resolved (obligations
addressable), single source of truth (table derived not hand-kept), no dialect
fork (one schema dialect feeds both `K↓` input and `Spec`).

---

## 1. The recommended convergence model

```
                    LANGUAGE  (content authority — DESIGN-PACKAGE)
        contract.obligations[] (obligation_id, §4)
        schema.fields/validation_rules (§7 Layer A)
        taxonomy: Meta / EdgeType labels (TAXONOMY/RELATIONSHIPS)
        lifecycle_state · promotion_state (§8)
                    │                                   ▲
              K↓ (D1 compiler)                    K↑ (D2 compiler)
       LanguageArtifacts → ValidatorInputs   Verdict → LifecycleTransitionGuard
       derives:                              maps gradeFor.overall →
        • obligationsForMeta table            transition authorization
          (queries.md:45)                     • pass  → authorize forward edge
        • active Meta set (Profiles.lean:15)  • warn  → forward only for
        • active EdgeType set (:45)             warn-tolerant edges; else hold
        • profile (paperBaseline/comp.ext)    • fail  → force `blocked`
                    ▼                                   │
                    VALIDATOR  (well-formedness authority — Lean)
        Spec = ConceptSpace + EdgeRow[] (Richness.lean:58)
        gradeFor → [P1,P3,P4,P5] + aggregateOverall (Report.lean:136/42)
        Grade = pass | warn | fail (Report.lean:15)
```

**Why this gives genuine D1.** Today P3 (`gradeP3Obligations`, Report.lean:71)
returns `.pass` unconditionally and the `obligationsForMeta` table is a *v3
derivation flagged H2-risk* — a hand-transcribed artifact with "no machine link
back to the paper" (VALIDATOR-XRAY §7, queries.md:51). Under D1, `K↓` makes that
table the **output of a compiler over the language's contract obligations**, not
a hand-kept Lean literal. The validator stops authoring what it checks
(DEFINE s2 line 10) — it *receives* it. That is load-bearing dependency: with no
language artifacts, `K↓` yields an empty obligation table and P3 has nothing to
grade (the warn-only bootstrap floor, §5).

**Why this gives genuine D2.** Today reaching `validated` is guarded by a
`pass` verdict in prose (§8.2 "each forward edge guarded by a `pass` verdict")
but nothing mechanically binds *which* validator emits it. Under D2, `K↑` makes
`gradeFor`'s `aggregateOverall` (Report.lean:42, `fail > warn > pass`) the
**mechanical transition guard** for `gated→…→validated` and a *necessary input*
to promotability P3 (§8.3). The language cannot self-certify maturity; it must
consult the Lean verdict. That is load-bearing dependency in the reverse
direction.

Together D1∧D2 = one coupled system: the validator's content is the language's
output, and the language's authority advance is the validator's output.

---

## 2. The coupling seam (precise interfaces)

### 2.1 D1 seam — `K↓ : LanguageArtifacts → ValidatorInputs`

**Input (language side, authored once):**
- `contract.obligations[]`, each carrying an `obligation_id` (DESIGN-PACKAGE §3
  per-kind `contract` additions, §4 Lane-2 blocker B-1) and a `subject_meta`
  (which `Meta` the obligation is about) + optional `subject_edge` (`EdgeType`).
- `contract.realizes` / `schema.implements` / `schema.satisfies:[obligation_id]`
  (§4 symmetric referencing model) — the link that says which obligations are in
  scope for the active spec.
- taxonomy labels (`Meta`/`EdgeType`) authored as the language's canonical
  vocabulary, by **identity rename** of `TAXONOMY.md`/`RELATIONSHIPS.md` labels
  (lean-functor DESIGN §"Stage B inputs").

**Compiler behavior (deterministic, total, non-LLM — same discipline as
translator T, lean-functor DESIGN §30):**

1. **`obligationsForMeta` table.** Group every in-scope `obligation_id` by its
   `subject_meta`; emit the map `Meta → List ObligationId` that
   `gradeP3Obligations` consumes. This is exactly the intended-but-stubbed table
   sketched at `spec/queries.md:45` (7 metas carry non-empty obligations:
   Operation/Query/Event/Rule/Workflow/Mapping/Interface). **Today it is a
   hand-sketch; under D1 it is `K↓`'s output.** P3 grades a `Meta`'s concept
   `fail`/`warn` when a required `obligation_id` for that meta is unsatisfied by
   the spec's edges/fields.
2. **Active `Meta` set / `EdgeType` set / profile.** Derived from which
   taxonomy labels the in-scope contracts+schemas actually reference, intersected
   with `Profiles.lean:15` `metaTypesInProfile` and `Profiles.lean:45`
   `edgeTypesInProfile`. The profile (`paperBaseline | compositionExtension`,
   Sigma.lean:45) is selected by the language's `use_case`/contract declaration
   (whether cross-feature R_CF edges are in scope), not hand-set in the Lean
   file's frontmatter.

**Output (validator side, generated — never hand-edited):** the
`obligationsForMeta` definition + the active-Σ profile selection that
`gradeFor` (Report.lean:136) runs over. Same ingestion target as the existing
emitter (`SpecToLean`, ZagrMarketplaceGen.lean shape) — *no validator code
change needed to consume*, matching lean-functor DESIGN §32.

> Acyclicity guard on `K↓`: it reads only contract/schema/taxonomy, **never a
> verdict and never `status`/`lifecycle_state`**. A spec's maturity must not
> influence what obligations it is checked against.

### 2.2 D2 seam — `K↑ : Verdict → LifecycleTransitionGuard`

**Input (validator side):** `gradeFor spec` → `CodegenReadinessReport` with
`overallGrade ∈ {pass, warn, fail}` (Report.lean:31/42) plus the per-predicate
`[P1,P3,P4,P5]` reports (so the guard can read *which* predicate drove the
grade — Report.lean:136).

**Mapping to DESIGN-PACKAGE §8 lifecycle** (`pass/flag/block` is a **transition
guard, not a lifecycle member**, §8.1; we bind Lean `pass/warn/fail` onto that
guard slot):

| `gradeFor.overall` | Lifecycle authorization (§8.2) | Promotion effect (§8.3) |
| --- | --- | --- |
| **`fail`** | `any → blocked` (mechanical; an open `block`-severity record, §8.2/§8.4). The failing predicate (e.g. P1 unresolved ref, P5 cycle — FaultInject.lean reference faults) becomes the blocker row. | P3 (examples pass) / P4 (no open blockers) **not met** — not promotable. |
| **`warn`** | Holds at current state for verdict-sensitive forward edges; may advance `gated→implemented` (warn-tolerant) but **not** `implemented→validated` (the `validated` edge requires `pass`, §8.2). R_U/`sigmaFallback` WARN (D12, lean-functor §45) is the canonical warn case. | Necessary promotability conditions partially unmet; stays `candidate`. |
| **`pass`** | Authorizes the guarded forward edges `gated → implemented → validated` (§8.2). | Satisfies the **necessary** verdict-bearing promotability conditions P1/P3/P4/P7 (§8.3). |

**Critical bound: pass authorizes `…→validated`, it does NOT authorize
promotion.** Reaching `validated` does not make a contract canonical (§8.3, rule
CI-R005: items stay local candidates unless promoted by owner route). The Lean
verdict supplies the **necessary** conditions P1–P7; **P8 owner-authority
approval remains the sufficient act** that flips `promotion_state →
promoted-by-owner` (§8.3). D2 binds the validator to *maturity* and to the
*necessary* gate of *authority*, but never to the *sufficient* human act.

So the three named transitions resolve as:
- **`gated → validated`** ⟸ `gradeFor.overall = pass` (P1∧P5 floor; P3/P4 once
  un-stubbed — lean-functor DESIGN §27 "specCorrect floor").
- **`validated → promotable`** ⟸ `pass` satisfies necessary P1–P7; **gated by
  P8 owner approval** (sufficient) — verdict alone is insufficient.
- **`any → blocked`** ⟸ `gradeFor.overall = fail` (mechanical, §8.4).

> Acyclicity guard on `K↑`: it reads only the verdict + predicate reports,
> **never the obligation table or taxonomy**. The verdict is a judgment *about*
> well-formedness; it does not re-define *what* was checked.

---

## 3. The single source of truth

**Authored once (the language is the sole author of content):**
- `contract.obligations[].obligation_id` + `subject_meta` — authored in
  contract documents (DESIGN-PACKAGE §3/§4). The resolution of blocker **B-1**
  (§10: contract invariants must become addressable `obligation_id`s) is the
  precondition that makes this source exist at all.
- the taxonomy (`Meta`/`EdgeType` labels) — authored once as the language's
  canonical vocabulary; the σ-table `sigmaValid` (Sigma.lean:56) remains the
  validator's *admissibility oracle* but its **label set** is the language's.
- `schema` documents (one dialect — OD-3 resolved, no dialect fork per
  DEC-FIT-01 bridge condition #3) — feed both `K↓` input and the validator's
  `Spec` shape.

**Generated (never hand-edited, never a parallel copy):**
- the Lean `obligationsForMeta` table (today the hand-sketch at queries.md:45;
  henceforth `K↓` output).
- the active `Meta`/`EdgeType`/profile selection driving `gradeFor`.
- the lifecycle `status`/`promotion_state` *advances* (not the prose; the
  guarded transitions) — emitted by `K↑` into the iteration record's
  `prev_state`/`next_state` + `validations_run` receipt (§5, §8.4).

**The no-hand-maintained-parallel-copy rule.** Neither the validator nor the
language may carry a hand-maintained copy of a fact the other authors:
- the validator MUST NOT hand-author its obligation table or active vocabulary
  (it receives `K↓` output) — this retires the H2-risk hand-transcription
  (VALIDATOR-XRAY §7, queries.md:51) and satisfies DEC-FIT-01 bridge condition
  #2 ("derived from … not maintained in parallel by hand").
- the language MUST NOT hand-author a `validated`/promotable status without a
  `K↑`-emitted verdict receipt backing the transition (§8.4 receipt-shaped
  `validations_run`).

A drift check (modeled on iteration rules ITR-R001..R005, §5) asserts:
`obligationsForMeta == K↓(current contracts)` and every `validated` transition
has a matching `gradeFor` receipt. Divergence is a `gap` record (§4: uncovered
obligations surface as tracked gaps, never silently).

---

## 4. Recomposition — pipeline AND lifecycle survive

### 4.1 The two-stage lean-functor pipeline is preserved

The convergence adds the two compilers **around** the existing pipeline; it
changes no proof and no grader internals (lean-functor DESIGN §7 pipeline).

- **Stage A (spec-correctness):** unchanged. `specCorrect = σ-typed (PROVED by
  Theorem 1, Richness.lean:71) ∧ P1 closure ∧ P5 acyclic` (lean-functor §24/§27).
  D1's `K↓` only *populates* P3's table and the active Σ; P1/P2/P5 are untouched.
  When P3/P4 un-stub, they grade against `K↓`-derived data — strictly additive to
  the `gradeFor` surface, consuming the same `Spec` record (lean-functor §32).
- **Stage B (code-as-functor):** unchanged. The translator `T` still lifts
  produced code → recovered `Spec` with `EdgeProvenance` (lean-functor §30/§34).
  `K↓` and `T` are *peers* — both deterministic non-LLM compilers feeding the
  validator; `K↓` supplies *what to check* (obligations/Σ), `T` supplies *the
  instance to check* (the recovered Spec). They do not interfere: `K↓` reads
  language artifacts, `T` reads code.
- **Verdict surface:** `gradeFor` + `aggregateOverall` (Report.lean:136/42)
  remains the single verdict layer. D2's `K↑` is a **new consumer** of that
  verdict, not a modification of it. The honesty constraints hold: no
  "proves spec correct" unqualified, P3/P4 governs nothing until un-stubbed
  (lean-functor §36–39, §52).

### 4.2 The DESIGN-PACKAGE lifecycle is preserved

- The two-axis split (`lifecycle_state` maturity × `promotion_state` authority,
  §8.1) is untouched. `K↑` writes into the **guard slot** that §8.1 already
  reserves for `pass/flag/block` — it does not add a lifecycle member.
- Guarded transitions (§8.2) keep their existing guards; D2 only *names the
  emitter* of the `pass` verdict (the Lean validator) that §8.2 already required
  abstractly. `blocked` (§8.4) stays mechanical.
- Promotion (§8.3) keeps P1–P7 necessary / **P8 owner-sufficient**. D2 feeds the
  verdict-bearing necessary conditions; it never usurps P8. This is the exact
  guard against the validator promoting a spec by itself.
- Iteration (§5) absorbs the verdict as a `validations_run` receipt and the
  `prev_state→next_state` delta — the audit trail of every `K↑` transition.

Nothing in either pipeline or lifecycle is broken; both gain a *named, derived,
non-hand-maintained* link where they previously had a prose-level abstraction.

---

## 5. The acyclicity story (D1∧D2 stay acyclic at the meta level)

**Two authorities over disjoint facts (DEFINE s2 lines 22–25):**
- **content authority = the language** — what obligations/concepts *mean* and
  which are in scope.
- **well-formedness authority = the validator** — whether a given instance is
  structurally/σ-typed/closed/acyclic *correct*.

**The dependency graph at the meta level has no cycle.** Track the *facts*, not
the systems:

```
contract.obligation_id ──K↓──▶ obligationsForMeta ──┐
taxonomy labels ─────────K↓──▶ active Σ / profile  ──┼─▶ gradeFor over Spec ──K↑──▶ verdict ──▶ lifecycle guard
schema dialect ──────────────▶ Spec shape ─────────┘                                              │
                                                                                                  ▼
                                                                          status/promotion advance (≠ obligation content)
```

Every arrow points **forward**; no fact returns to its own producer:
- `K↓` consumes obligation *content* and produces a *checkable table*.
- `gradeFor` consumes the table + an instance and produces a *verdict*.
- `K↑` consumes the *verdict* and produces a *lifecycle-state advance*.
- the lifecycle-state advance is consumed by **owners and downstream
  iterations** — it is **never read back by `K↓`** (the §2.1 guard).

**The forbidden edge that would close the loop** is "lifecycle/verdict →
obligation content," i.e. letting a spec's *status* or its *own verdict* change
*what obligations it is checked against*. Both `K↓` and `K↑` are forbidden from
crossing this line by construction (§2.1/§2.2 guards). Concretely: **a spec
never validates its own content.** The content it is judged against (`K↓`
output) is fixed *before* and *independently of* the verdict (`K↑` input).

**Bootstrap order (the chicken-and-egg, DEFINE s2 lines 30–36):**
1. Seed the σ-vocabulary from `domainspec-core` + paper tables (Sigma.lean) —
   *independent of any one spec* (DEC-FIT-01: Stage-A vocabulary is incidental,
   already shipped).
2. First `K↓` run yields an **empty / warn-only** `obligationsForMeta` (P3 is a
   `.pass`-stub today anyway — Report.lean:71). Validator runs P1/P2/P5 over the
   first spec with no obligation gate.
3. First `gradeFor pass` (on P1∧P5 floor) lets `K↑` authorize
   `gated→…→validated` for that first spec — producing the **first validated
   language artifact**.
4. With a validated contract in hand, obligations are now authored as
   `obligation_id`s (B-1 resolved); subsequent `K↓` runs produce a *non-empty*
   table; P3 un-stubs.
5. **Promotion (P8) binds last** — it is the final coupling, deferred until
   owner ratification, never automatic.

No step depends on a not-yet-existing output of a later step; the loop is opened
at the warn-only floor and tightened monotonically.

---

## Evidence boundary & citations

- DESIGN-PACKAGE: §3 envelope, §4 contract↔schema + B-1, §5 iteration/receipt,
  §7 validation strategy/authority, §8 lifecycle (§8.1 two axes, §8.2 guarded
  transitions, §8.3 P1–P8 promotion, §8.4 mechanical blocked + receipt), §10 B-1.
- DEC-FIT-01 (LANGUAGE-FIT-VERDICT): partial-bridge + 3-part bridge condition.
- VALIDATOR-XRAY: Sigma.lean:45/56, Richness.lean:58/71, Report.lean:15/42/71/
  80/136, Profiles.lean:15/45, queries.md:45/51 (H2-risk), FaultInject.lean.
- lean-functor DESIGN.md: §7 pipeline, §24/§27 Stage A floor, §30/§32/§34 T,
  §36–39 residue honesty, §45 R_U WARN, §52 claims-permitted ladder.
- Conjectural / not-yet-real (held open, not claimed): P3/P4 graders are stubs
  (govern nothing until un-stubbed); P5/P1 are `#eval` checks not proofs; only
  σ-typing (Theorem 1) is a proof. `K↓`/`K↑` are *designed compilers, not wired*
  — same honesty stance as DEC-FIT-01 ("the bridge is designed, not wired").
