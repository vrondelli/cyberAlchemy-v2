# Findings — domainspec-lean-formalization: non-trivial implications for domainspec-core

Dispatch: `2026-07-14-lean-formalization-implications` (research; 2 lanes: import-advocate vs transfer-skeptic; parent revised).
Lanes: [lane-import-advocate.md](lane-import-advocate.md) · [lane-transfer-skeptic.md](lane-transfer-skeptic.md).
Parent verification: `DomainSpecEdgeSignature.lean` and `ResidueCompositionLaw.lean` read directly (0 `sorry` tokens each);
`PROOF-OBLIGATIONS.md:25` drift confirmed; F11 status confirmed at `GLOSSARY.md` claim ledger.

> **Boundary:** nothing here is promoted. Every row is a candidate feeding the already-routed
> category-law research tower ([route packet](../../projects/domainspec-v2/definitions/reviews/2026-07-12-category-law-formalization-route.md))
> or a drift observation. Claim ≤ proof throughout.

## Survivors (parent-confirmed)

| # | Artifact (sibling repo) | Proof status | What it is, in DomainSpec wording | Which core decision it changes |
|---|---|---|---|---|
| 1 | `lean-formalization/DomainSpecEdgeSignature.lean` | proved, 0 `sorry` (build-gate re-verify pending per sibling README) | A decidable, executable type-checker for DS-D8 edge signatures: σ table (edge label → admissible source/target meta-types), `Decidable (WellTyped G)`, and a proved split between **residue** (vocabulary violations → validation errors) and **escapes** (edges the vocabulary cannot classify → adequacy gaps) (`wellTyped_iff_residue_empty` :234). | (a) The route packet's **Morphism typing** row already has a mechanized formal statement. (b) **Drift gate obligation:** the Lean σ table is stale vs root `relationships.yml` (Lean keeps `enforcesCross` active; root deprecates it, adds `owns`/`belongs-to`, counts 30) — derivation candidate: generate the Lean table from root yml so fidelity theorems become an executable drift gate. (c) `escapes` operationalizes promotion-rubric criterion 8 (witnessed decision pressure) as a measurable counter. |
| 2 | Counterexample pack: `M6Counter.lean`, `M2Counter.lean`, `Bicyclic.lean`, `S2VsS3Counter.lean` | proved (closed-proof, no `sorry`) | Countermodels proving schema-conformance obligations and instance/behavior obligations are **non-substitutable**: no schema-level discipline certifies the instance round-trip. | Exactly the countermodels the route packet demands for **Projection preservation** and **Obligation preservation**; blocks any "schema validation ⇒ instance fidelity" candidate law at the definitions-governance gate; for `impl/test-derivation-engine`, a behavioral lane is proved-necessary — schema checks and derived behavior tests must never merge into one verdict. |
| 3 | `lean-formalization/ResidueCompositionLaw.lean` | proved, 0 `sorry` | Positive law: post-composition with a **fully faithful** projection functor leaves the residue predicate unchanged — an FF projection preserves the obligation set exactly; a non-FF projection must declare residue. | Supplies the positive side of the **Projection preservation** row (hypothesis: FF), pairing with row-2's negative side. |
| 4 | `F11.lean` (`schema_instance_decoupling_threshold`) | Lean source-level theorem family (per sibling claim ledger) | The sharp threshold: **fully-faithful** — not injective+faithful — is the hypothesis any positive preservation law needs. Indicator is binary two-pole, no continuous magnitude. | Fixes the hypothesis for every positive law the tower drafts; contradicts any future scalar "promotion score" proposal. Kept independently by both lanes. |
| 5 | `GLOSSARY.md` §1 + `NAMING.md` | definitional (zero proof risk) | Curated notation bridge: objects/morphisms/representability with engineer readings. | Direct input to route deliverable 2 (DS-D1/DS-D8 → objects/morphisms notation bridge). |

## Core-internal drift found in passing

- `projects/domainspec-v2/research/dcb-saga-correctness/PROOF-OBLIGATIONS.md:25` still cites deprecated `enforces-cross` (root reconciled it into `enforces` + cross-feature scope). Confirmed by parent. Surface, don't silently fix.

## Kill-list (do NOT import — skeptic lane, parent-endorsed)

- **Scope-warning / closed-negative by the sibling's own discipline:** Noether "two conservation laws" coda (explicit scope warning; every Noether ingredient Absent); Lawvere/strange-loop finite closure (`closed-negative`, `C_ω_absorption_refuted`); M2 / M6' / M6-restricted (open conjectures — cannot ground authority).
- **Already routed — no double-import:** Representability Witness + Representability-Grounded Promotion Gate (routed 2026-06-21 to definitions-/constitution-governance; contingent on the H-8 check). Same math as F11's threshold — tower and CAV2 candidate must share one source, not fork.
- **Vocabulary-only / regime-bound:** "Yoneda solves translation" slogans (glossary itself warns), "fractal" brand taxonomy, time-as-functor (breaks in distributed/partial-order settings).
- **Bulk caution:** ~89/198 sibling files contain `sorry` (sibling README) — the survivors above are the no-sorry islands; nothing else is import-grade.

## Lane disagreement, parent ruling

The skeptic's blanket attack ("theorems quantified over small categories cannot be *stated* over v2's finite typed graph fragment") is correct for the presheaf/Kan machinery but does **not** touch survivor 1: `DomainSpecEdgeSignature.lean` is finite, decidable, and written over the concrete DS-D8 vocabulary — no category hypotheses. Parent verified the file directly; it stands as the highest-value item. Advocate's lossless-join candidate (`DatabaseLosslessJoin*.lean`) is downgraded to tower-lane-candidate-only (sibling's own dispatch killed its novelty; engineering value unproven here).
