# Decision — Convergence Model (gates g-convergence-decision + g-acyclicity)

- Decision id: DEC-CONV-01
- Status: **decided (evidence-backed; 3-lane converged)**
- Owner: refine (operator-ratifiable)

## Question
How do the DomainSpec language and the Lean validator converge into one
mutually-dependent system?

## Decision: **COMPILER-PAIR** (route_menu item `compiler-pair`)
Two deterministic one-way compilers over **disjoint facts**:

- **D1 — `K↓ : LanguageArtifacts → ValidatorInputs`.** Groups contract
  `obligation_id`s by subject `Meta` into the validator's `obligationsForMeta`
  table (lifts P3 from stub); derives the active `Meta`/`EdgeType`/profile from
  the referenced taxonomy. Same `Spec` ingestion target — no validator code change.
- **D2 — `K↑ : Verdict → LifecycleTransitionGuard`.** Maps `gradeFor`'s
  aggregate verdict onto DESIGN-PACKAGE §8 lifecycle: `pass` authorizes
  `gated→…→validated`; `warn` holds the `validated` edge; `fail` forces
  `any→blocked`. `pass` supplies only the **necessary** promotability conditions
  P1–P7; **P8 owner-approval stays the sufficient human act.**

Rejected: shared-core-vocab (gives only D1, no D2), layered-dependency (a single
stack cannot carry both directions acyclically), full-merge (collapses the
authority split → self-validation; highest deadlock risk).

## Why this satisfies "depend on each other"
Genuine bidirectional dependency: the validator cannot grade obligations without
`K↓(language)`; the language cannot reach `validated`/promotable without `K↑(Lean
verdict)`. Neither is complete alone.

## Acyclicity (g-acyclicity — PASS)
Bidirectional at the **system** level, acyclic at the **meta** level: D1 carries
*content* down, D2 carries a *verdict* up, over disjoint facts.
- **Invariant:** `K↓` never reads a verdict/`status`; `K↑` never reads obligation
  content. The forbidden edge (verdict/status → obligation content) is barred by
  construction → no spec validates its own content.
- **Authorities separated:** content = language; well-formedness = Lean. D2 binds
  only to well-formedness.

## Bootstrap order (breaks chicken-and-egg)
B0 seed σ-vocab from `domainspec-core` (independent of any spec) → B1 well-
formedness-only validator → B2 empty/warn-only obligation table → B3 specs reach
`validated` on well-formedness → B4 graduate obligations warn→fail as B-1
mechanizes → B5 bind promotion last.

## Single source of truth
Obligations/taxonomy/schema authored once in the language; the Lean obligation
table + active Σ + lifecycle advances are **generated**; no hand-maintained
parallel copy. Drift check: `obligationsForMeta == K↓(contracts)`, and every
`validated` transition has a `gradeFor` receipt.

## Recomposition
`K↓` is a peer of the translator `T` (what-to-check vs instance-to-check); `K↑`
is a new consumer of the unchanged `gradeFor`. Both the two-stage pipeline
(DEC-CAT-01) and the DESIGN-PACKAGE lifecycle are preserved additively.

## Honesty
The compilers are **designed, not wired** (consistent with DEC-FIT-01). No claim
the systems currently co-depend at runtime.
