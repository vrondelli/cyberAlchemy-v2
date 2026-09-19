# Refine Result — Clarity Gaps + DomainSpec Language Fit

- Run id: `2026-06-08-clarity-language-fit` (parent: `2026-06-08-lean-functor-validation`)
- Status: **pass** (both operator questions answered with evidence; dialectic converged)
- Preset: standard · Research: research-if-gap-appears (none triggered) · Subagents: 3 (recommended, approved)

## Answer to Q1 — "What is not clear in the refining?"
A **28-gap clarity register** (`stages/s4-research/CLARITY-GAP-REGISTER.md`), typed
and owned, deduped against the prior run (20 already-tracked, 8 newly-surfaced).
The **5 sharpest** (most downstream block):
1. **B-1 `obligation_id`s** — the bridge (and a *language* task, not a validator task).
2. **P4 grade + per-edge provenance** — the prior run's falsifier (Lean-provable).
3. **DEC-CAT-01 ratification** — the categorical model is still provisional.
4. **OD-1 / OD-3** — syntax + schema dialect must not fork.
5. **"functor obligation" misnomer** — path-equation commutativity is undecidable in general; no path equations exist in `Spec` today.

The most useful *new* finding: the prior run's **below-the-wall assumptions**
(parser fidelity, σ-table faithfulness, vocabulary canonicity, R_U empty-σ) were
never tracked as gaps — they are now promoted to owned **evidence-gaps**.

## Answer to Q2 — "Does our DomainSpec language help in this?"
**Verdict: PARTIAL-BRIDGE** (`stages/s5-distill/LANGUAGE-FIT-VERDICT.md`, DEC-FIT-01).
The advocate and skeptic **independently converged** on the same boundary:

- **Today the language is incidental.** The shipped validator (Stage A structural:
  P1 closure, P2 σ-typing, P5 acyclicity) is self-contained; its vocabulary source
  of truth is `domainspec-core` + the paper tables, **not** the DESIGN-PACKAGE
  language. The translator maps code to `Meta`/`EdgeType`; the language's doc
  kinds / 9-field envelope / lifecycle appear in **no** Lean module.
- **The language becomes load-bearing on the P3/P4 (obligation) surface** — but
  only once a bridge is built. The prior run's own blocker **B-1** names a language
  artifact (`obligation_id`s) as the precondition for P3. So the language is
  load-bearing *by design and stated dependency*, not yet *by running wire*.

### The bridge condition (what must hold)
1. **B-1 resolved** — obligations authored as addressable per-`Meta` predicates.
2. **Derive, don't duplicate** — the graded obligation table is *derived from*
   contract/schema artifacts, not hand-maintained (else it stays parallel).
3. **No dialect fork** — OD-3 collapses the language `schema` kind and the
   validator `Spec` into one dialect.

If (1)–(3) hold, the language is the **obligation authority** for ~half the
grading surface. If not, the σ-model proceeds alone and the language stays a
parallel doc effort.

## The one actionable correction to the prior run
The prior PLAN **deferred B-1**. This run shows B-1 is the *bridge that makes the
language matter* — so it should be sequenced **alongside Wave A** (provenance/P4),
not deferred (`stages/s9-invoke-plan/PLAN.md`, step N6).

## Honesty boundary (binding)
No present-tense claim that the language helps the running validator — it does
not, yet. It is *required to* help on the obligation path; the bridge is designed,
not wired. Two open residues: **R-circularity** (keep obligation-content authority
separate from well-formedness authority) and **R-bridge-feasibility** (prose
obligations may not fully reduce to per-Meta predicates → at worst warn-only P3).

## Stage evidence
| Stage | Verdict | Artifact |
|---|---|---|
| s1 Context Builder | pass | stages/s1-context-builder/context-pack.md |
| s2 Invoke Define | pass | stages/s2-invoke-define/DEFINE.md |
| s3 Interrogation (dialectic) | pass (converged) | stages/s3-interrogation/REVIEW.md (+ ADVOCATE/SKEPTIC briefs) |
| s4 Research/cartography | pass | stages/s4-research/CLARITY-GAP-REGISTER.md |
| s5 Distill + verdict | pass (g-language-fit-verdict satisfied) | stages/s5-distill/DISTILL.md, LANGUAGE-FIT-VERDICT.md |
| s6 Invoke Design | pass | stages/s6-invoke-design/DESIGN.md |
| s7 Interrogation (design-review) | pass (provisional) | stages/s7-interrogation/DESIGN-REVIEW.md |
| s8 Distill Repair | pass | stages/s8-distill-repair/REPAIR.md |
| s9 Invoke Plan | pass | stages/s9-invoke-plan/PLAN.md |
| s10 Final synthesis | pass | this file |

## Recommended next routes
1. **decision-gate** on OD-3 (one schema dialect) + DEC-CAT-01 ratification.
2. **task-session on B-1** (`obligation_id`s) — the bridge; sequence with the prior run's Wave A.
3. Append DEC-FIT-01 + the bridge condition to `research/DESIGN-PACKAGE.md` as a "validation-authority / Lean-fit" section.
