# Refine Result — Lean Functor Validation For DomainSpec

- Run id: `2026-06-08-lean-functor-validation`
- Status: **flag** (refined design produced; honesty-critical sequencing surfaced; one work pack ready — proceed to task-session on Wave A)
- Preset: deep · Research: bounded-research (confirmed) · Subagents: 5 (required, approved)
- Synthesized from stage artifacts (not from the proposal).

## What was refined
The operator intent — "lean validators to mathematically (category theory) prove
first that the spec is correct, then validate LLM code as a functor via a
deterministic translator into the DomainSpec language" — is **viable and
substantially already seeded** by the existing `lean-code-validator`. The refine
loop turned it into a decided categorical model, a deterministic translator
design, an honesty-bounded residue model, and a sequenced work pack.

## Core findings (evidence-backed)

1. **Stage A is ~80% built.** The spec is already a σ-typed quiver, **proved free
   by construction** (`EdgeRow.wellTyped` + Theorem 1 `all_edges_well_typed`).
   P1 closure and P5 acyclicity are real `#eval` checks. Minimal `specCorrect` =
   P1 ∧ P5 (σ-typing already a theorem). P3/P4 are stubs.

2. **Categorical model decided (DEC-CAT-01):** target **`presheaf-lan`**,
   implemented core **`fdm`** (Spivak functorial data migration). It reuses
   `Meta`/`EdgeType`/`sigmaValid`/`EdgeRow`/Theorem 1/`m6Witnesses` unchanged and
   carries the honesty boundary in its name ("Lan-faithful, not full"). `func-sem`
   discarded (σ-category is thin); `refinement-functor` residue language grafted
   onto the translator.

3. **The translator `T` is net-new and is the real work.** No code→Spec
   translator exists in this tree (only the emitted Lean output). T is designed
   as the deterministic dual of `MarkdownToSpec`: total, non-LLM, tier-precedence
   (tag ≻ pattern ≻ graph), σ-filtered, emitting the existing `Spec` format so
   `gradeFor` ingests it unchanged.

4. **The load-bearing honesty result.** "Residue = Lan unit η not iso, witnessed
   today by `m6Witnesses`" is **only half-true**: the witness is computable now,
   but it **governs nothing** (P4 is a `.pass` stub; provenance is hardcoded
   `.declared`), and the η-characterization is **conjectural** (no Lan object
   exists). The falsifier of the whole Stage-B claim is **shipping the "governed
   residue / fidelity" claim before P4 + per-edge provenance land.**

5. **`F` is a partial, lax map — not a strict functor.** Two residue directions
   (code∉spec unspecified behavior; spec∉code unimplemented obligations). No
   `Functor.Full`, no isomorphism, no "proves fidelity" — only operational+formal
   claims (Craft ladder).

## The honesty boundary (what Lean proves vs governed residue)
- **Proved:** σ-typedness (Theorem 1).
- **Operational `#eval` (check, not proof):** P1 closure, P5 acyclicity, M6 witness.
- **Stubbed (must land to claim residue governance):** P4 ambiguity grade, per-edge provenance, P3 obligations.
- **Conjecture (never asserted):** Lan/η, the open M6-graph theorem, general path-equation commutativity (undecidable).
- **Above the Intent Wall (never Lean, human-owned):** whether the spec captures intent.

## Blockers / open decisions
- **B-1 (inherited from DESIGN-PACKAGE):** contract obligations need `obligation_id`s before P3 (per-meta obligations) can be real. Shared precondition.
- **R-determinism (open):** T determinism does not by itself make residue codegen-attributable until the provenance split is populated (Wave A).
- **OD (ratify):** DEC-CAT-01 is provisional pending owner ratification; reversible toward fdm-only if the Lan layer proves too costly.

## One work pack (smallest honest provable surface)
`stages/s9-invoke-plan/PLAN.md`: **Wave A** (make residue govern: per-edge
provenance + real P4 + residue sidecars) → **Wave B** (minimal tag-tier
deterministic T on one fixture) → **Wave C** (toy-game faults A–D prove
non-functorial lifts are rejected). Wave A is the honesty-critical, lowest-cost
unit and unblocks every later claim.

## Stage evidence
| Stage | Verdict | Artifact |
|---|---|---|
| s1 Context Builder | pass | `stages/s1-context-builder/context-pack.md` (+ `VALIDATOR-XRAY.md`) |
| s2 Invoke Define | pass | `stages/s2-invoke-define/DEFINE.md` |
| s3 Interrogation (refine-review) | flag→addressed | `stages/s3-interrogation/REVIEW.md` |
| s4 Research decision (bounded) | pass | `stages/s4-research/CATEGORICAL-FORMALIZATIONS.md`, `STAGE-A-CORRECTNESS.md` |
| s5 Distill + categorical decision | pass (gate g-categorical-decision satisfied) | `stages/s5-distill/DISTILL.md`, `CATEGORICAL-MODEL-DECISION.md` |
| s6 Invoke Redefine/Design | pass | `stages/s6-invoke-design/DESIGN.md`, `TRANSLATOR-DESIGN.md` |
| s7 Interrogation (design-review) | pass (provisional, guardrails) | `stages/s7-interrogation/DESIGN-REVIEW.md` |
| s8 Distill Repair (toy-game) | flag→repaired | `stages/s8-distill-repair/REPAIR.md`, `TOYGAME-FALSIFICATION.md` |
| s9 Invoke Plan | pass | `stages/s9-invoke-plan/PLAN.md` |
| s10 Final Interrogation + synthesis | pass | this file |

## Recommended next routes (not executed here)
1. **task-session on Wave A** (provenance + real P4) — honesty-critical, lowest cost.
2. Owner **ratify DEC-CAT-01** (decision-gate) before Wave B.
3. Fold the two-stage model + honesty boundary back into `research/DESIGN-PACKAGE.md` as a validation-authority section (OD in that package).
4. Resolve **B-1** (`obligation_id`s) to unlock P3.

## Honesty boundary statement (binding)
This run claims only that the pipeline is **operationally seeded and formally
framed**. It does **not** claim any spec or code is proven correct, that `F` is a
functor, or that fidelity/agreement is established. The Lan/M6-graph theorem
remains an open conjecture.
