---
tags: [language-fit, skeptic, dialectic, refine, lean-validator, sigma-model, design-package]
node_type: spec
is_session: true
layer: [domain, application]
nature: reference
status: draft
version: 0.1.0
last_updated: 2026-06-08
---

# SKEPTIC-BRIEF — the DomainSpec LANGUAGE is INCIDENTAL

> Role: `language-fit-skeptic`. Read-only. I argue the strongest honest case that
> the σ-model in the Lean validator already carries the categorical weight, and the
> DESIGN-PACKAGE language is a **parallel, unwired** documentation effort that is
> not in the validation path. Every claim cites `file:locator`. I am not arguing the
> language is *worthless* — I am arguing it is **not load-bearing for codegen-readiness**,
> which is the thing the validator certifies.

---

## Thesis

The σ-model (`Meta`/`EdgeType`/`sigmaValid`/`EdgeRow`/`Spec`/`Profile`/P1–P5) is a
**self-contained vocabulary closed over `domainspec-core` DEFINITIONS and the paper
Tables 3 & 4**. Nothing in the Lean pipeline — vocabulary, representation, grading,
or translation — imports, references, or depends on the DESIGN-PACKAGE language's
5 document kinds, 9-field envelope, or two-axis lifecycle. The validator's correctness
claims are stated entirely in σ terms. Therefore the language is incidental to the
artifact that actually decides codegen-readiness. Worse, two of its core decisions
(OD-3 schema dialect, B-1 obligation labelling) are language-internal problems the
σ-model **does not have**.

---

## 1. The validator's vocabulary source of truth is `domainspec-core`, not the language

The validator names its authority explicitly, and it is **not** the DESIGN-PACKAGE:

- `spec/SPEC.md:19` (Authority blockquote): *"Vocabulary source of truth: `domainspec-core`
  DEFINITIONS.md DS-D1, DS-D2, DS-D8 and paper Tables 3 & 4."* It cites discovery
  artifacts (`INITIAL-DEFINITIONS.md`, `PROJECT-DECISIONS.md`) and the paper — never
  the language.
- `spec/SPEC.md:17`: the module *"does not own vocabulary definitions (`domainspec-core`
  is upstream and canonical)."* The Bounded-Contexts table (`spec/SPEC.md:38-42`) lists
  the Vocabulary context's Authority as *"`domainspec-core` (lifted into v3 read-only)"* —
  again, the core repo, not the language.
- `README.md:42`: σ-signature *"Sourced from paper Tables 3 (R_B) and 4 (R_X)."*
  `README.md:34`: the `research/` dir holds *"σ-signature source tables (paper Tables 3 & 4)."*
- `VALIDATOR-XRAY.md:196`: *"σ-table is hand-transcribed from paper Tables 3 & 4 …
  there is no machine link back to the paper."* The provenance chain is paper → Lean,
  with zero mention of contract/schema/iteration.

The σ-model is closed: `Sigma.lean` defines `Meta`/`EdgeType`/`Profile`/`sigmaValid`
with no upward import of any language construct (`README.md:23-26` layout — four Lean
modules, all internal; `VALIDATOR-XRAY.md:30` "VOCAB --lifted read-only--> REPR").
The DESIGN-PACKAGE never appears anywhere in this dependency graph. **The σ-model
does not need the language to define what a legal spec is.**

## 2. The translator T maps to σ vocabulary — the language is not in the validation path

The Stage-B translator maps code to the σ-vocabulary, and only that:

- `TRANSLATOR-DESIGN.md:55-57`: *"All vocabulary below is the canonical 25 `Meta` /
  29 `EdgeType` from `Sigma.lean:13/28`."* The mapping tables (`:75-83`, `:92-106`)
  resolve every code signal into a `Meta` or `EdgeType` constructor — i.e. into the
  σ-model's enums, which come from `domainspec-core`/the paper (§1), **not** from the
  DESIGN-PACKAGE.
- The output is a `Spec` (`Richness.lean:58`), emitted byte-compatibly into the
  existing `SpecToLean` format (`TRANSLATOR-DESIGN.md:139-142`) and graded by
  `gradeFor` (`Report.lean:136`). The whole pipeline is
  `code → Meta/EdgeType/EdgeRow → Spec → gradeFor → CodegenReadinessReport`.
- Search the entire pipeline for the language's primitives: the 5 document kinds
  (`contract`/`schema`/`iteration`/`example`/`use_case`, DESIGN-PACKAGE §2), the
  9-field envelope (`domainspec`/`id`/`kind`/`version`/`status`/`title`/`purpose`/
  `authority`/`references`, §3), the two-axis lifecycle (`lifecycle_state` ×
  `promotion_state`, §8). **None of them appear** in `Sigma.lean`, `Richness.lean`,
  `Profiles.lean`, `Report.lean`, the emitter format, or `TRANSLATOR-DESIGN.md`.

The only `EdgeProvenance` reuse (`TRANSLATOR-DESIGN.md:247`) is an *existing* σ-model
field (`Richness.lean:17`), not a language import. The language is simply absent from
the path that turns code into a verdict.

## 3. Stage-A correctness is defined entirely in σ terms

Everything the validator *proves or checks* is σ-stated, with no language dependency:

- **P2 / Theorem 1** — `all_edges_well_typed` (`Richness.lean:71`) folds the per-`EdgeRow`
  `wellTyped : sigmaValid p edge (metaOf src) (metaOf tgt) = true` proofs
  (`Richness.lean:50`; `VALIDATOR-XRAY.md:58-62`). The claim is *"the spec is a
  well-typed colored quiver over the σ-schema"* — pure σ.
- **P1 closure** — `gradeP1Closure` over `spec.unresolvedRefs` (`Report.lean:56`;
  `VALIDATOR-XRAY.md:84-86`). σ-graph reference integrity.
- **P5 acyclicity** — `gradeP5Acyclic` over the `isCodegenDependency`-filtered subgraph
  (`Report.lean:116`, `Profiles.lean:77`; `VALIDATOR-XRAY.md:100-110`). σ-edge partition.

None of P1/P2/P5 consults a `contract`, a 9-field envelope, or a lifecycle state.
The categorical content the XRAY catalogues — typed quiver, coloring functor `metaOf`,
σ-admissibility, the named `Quiver Meta`/Spec-as-presheaf/`Lan` roadmap
(`VALIDATOR-XRAY.md:36-66`, `:147-155`) — is **all σ-model**. The language contributes
zero lemmas, zero predicates, zero proof obligations.

## 4. They are plausibly solving DIFFERENT problems (conflation = category error)

- The **σ-model** answers: *"is this typed concept graph codegen-ready?"* — a
  machine-checked, decidable property of a `Spec` (`README.md:1-3` *"Machine-checked
  structural validator … emits a `CodegenReadinessReport`"*).
- The **language** answers: *"are these human-authored agreement documents well-formed
  and governed?"* — its purpose is *"a small, validateable language for writing three
  separable-but-composable layers of agreement"* (DESIGN-PACKAGE §1), with a Layer-B
  *semantic/obligation* concern discharged today by *"narrative review docs returning
  pass/flag/block"* (§7).

These are different abstraction levels and different artifacts. The σ-model operates
on a **typed graph distilled from code/spec at the concept level** (`metaOf`,
`EdgeRow`). The language operates on **documents and their authorship lifecycle**
(kinds, envelopes, promotion, owner approval — §8.3 P8 *"owner-authority approval …
the sufficient act"*). Treating the language as the validator's missing front-end is
a level confusion: the validator already has a front-end (`MarkdownToSpec`/`SpecToLean`,
`spec/SPEC.md:71-73`) that targets `Spec`, and it never needed document-kind/envelope
governance to do so.

## 5. Where the language ACTIVELY risks getting in the way

The language carries problems the σ-model is **immune to**, so wiring it in imports cost:

- **Two schema dialects (OD-3 / R-2).** The language must reconcile JSON-Schema (dispatch)
  with Craft `row_families`, possibly forcing *"a DomainSpec-native structural dialect
  beyond JSON-Schema"* (DESIGN-PACKAGE §10 R-2, OD-3 `:285-287`). The σ-model has **one**
  schema: the `Spec` Lean `structure` (`Richness.lean:58`), with σ-typing free by
  construction. Introducing a second, prose-derived schema dialect next to a working
  Lean structure is a net liability — a second source of truth to keep in sync.
- **B-1: obligations are unlabeled prose.** *"Contract invariants are unlabeled prose;
  they must become addressable `obligation_id`s before referencing, anti-collapse, or
  obligation-validation rules can exist"* (DESIGN-PACKAGE §10 B-1, §4 `:130-132`). This
  is a **language-internal** blocker. The σ-model has no such gap: obligations (P3) are
  keyed to `Meta` constructors (`spec/queries.md` `obligationsForMeta`,
  `VALIDATOR-XRAY.md:94`), already addressable by enum. B-1 is a problem the σ-model
  *does not have* — adopting the language would import it.
- **R-1: validation_rules are NL prose, not predicates** (DESIGN-PACKAGE §10 R-1) — i.e.
  Layer B is *"not yet mechanizable."* The σ-model's checks are already decidable
  `Bool` functions / compile-time proofs (`VALIDATOR-XRAY.md:192`). The language is
  *behind* the σ-model on mechanization, not ahead.
- **Abstraction mismatch.** The language's smallest validateable surface is a *"7-step
  structural validator over one `example` against one leaf `schema`"* checking headers,
  enums, regex, refs (DESIGN-PACKAGE §7 `:204-210`). That is markdown/YAML well-formedness
  — a strictly weaker, document-shaped check than σ-typing + acyclicity over a concept
  graph. Bolting it onto the σ-pipeline adds a redundant front gate that proves less.

---

## What would CHANGE my mind (condition under which the language becomes load-bearing)

The language becomes load-bearing the moment a σ-model obligation can only be **defined
or discharged** by a language construct. Concretely, any ONE of:

1. **P3/P4 land on language obligations.** The deferred graders (`Report.lean:71/80`,
   stubbed `.pass`) are explicitly gated on *"DESIGN-PACKAGE B-1 / EX1"*
   (`TRANSLATOR-DESIGN.md:279`). If the per-meta obligation table (P3) is sourced from
   `contract.obligations[]` with addressable `obligation_id`s (DESIGN-PACKAGE §4), then
   the σ-model's *completeness* verdict would depend on the language's contract kind —
   making it load-bearing for P3, not just incidental. This is the single strongest
   bridge and it is already named in the design.
2. **The language supplies provenance the σ-model cannot self-generate.** If
   `EdgeProvenance` discrimination (declared/contextInferred/sigmaFallback,
   `Richness.lean:17`) — which P4 needs and the emitter currently fakes as `.declared`
   for everything (`README.md:76`) — is fed authoritatively from language `example`
   fixtures (`expect: pass|fail`, §6) or contract obligations, the language enters the
   *grading* path, not just the doc path.
3. **`authority`/`promotion` becomes a validator gate.** If `domainspec-readiness-gate`
   integration (D9, deferred `README.md:84`) consumes the language's `promotion_state`
   / owner-approval (§8.3 P8) as the gate for "this spec may drive codegen," the
   language's lifecycle becomes part of the readiness decision.

Absent any of these, the language stays a parallel documentation system.

## My strongest concession (the other side's best point)

The bridge in change-condition #1 is **already designed, not hypothetical**:
`TRANSLATOR-DESIGN.md:279` explicitly defers P3/P4 *"gated on DESIGN-PACKAGE B-1 / EX1
per DISTILL recomposition,"* and `spec/SPEC.md:50` lists P3 as needing a *"per-meta
obligation table"* that is currently *"a v3 derivation, not a paper citation"* and
H2-risk (`VALIDATOR-XRAY.md:94`). That obligation table is exactly the kind of artifact
the language's `contract.obligations[]` + addressable `obligation_id` (DESIGN-PACKAGE
§4, B-1) is built to author and govern. So the honest concession is: **the σ-model has
a real, named hole (P3 completeness) whose intended filler is language-shaped.** If that
filler is adopted, the language stops being incidental and becomes the obligation
authority for half the grading surface. My case holds only for the *current* Layer-1
validator (P1/P2/P5 shipped), and only until P3/P4 are wired to a contract source.

---

## Evidence boundary

In-tree and read: `lean-code-validator/README.md`, `lean-code-validator/spec/SPEC.md`,
`refinement-runs/2026-06-08-lean-functor-validation/stages/s1-context-builder/VALIDATOR-XRAY.md`,
`refinement-runs/2026-06-08-lean-functor-validation/stages/s6-invoke-design/TRANSLATOR-DESIGN.md`,
`research/DESIGN-PACKAGE.md`. Not opened (claims about them are second-hand via the docs
above): `domainspec-core` `DEFINITIONS.md` (DS-D1/D2/D8), paper Tables 3 & 4,
`audit_richness.py`, the `research/lanes/` files behind DESIGN-PACKAGE, and the Lean
sources themselves (`Sigma.lean`/`Richness.lean`/`Report.lean`/`Profiles.lean`) — all
cited via VALIDATOR-XRAY's `file:line` locators, not direct inspection.
