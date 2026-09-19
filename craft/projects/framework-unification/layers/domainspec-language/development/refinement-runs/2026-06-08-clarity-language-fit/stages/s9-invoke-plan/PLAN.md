# Invoke Plan — Clarification Next Steps (s9, non-executed)

No code. Steps that resolve the sharpest clarity gaps and make the language-fit
verdict actionable.

| ID | Step | Closes | Owner |
|----|------|--------|-------|
| N1 | Resolve **B-1**: define `obligation_id` shape in DESIGN-PACKAGE + author one contract's obligations as addressable per-`Meta` predicates | the bridge; G1 of DEC-FIT-01; unlocks P3 | language (DESIGN-PACKAGE) |
| N2 | Decide **OD-3** (one schema dialect): collapse the language `schema` kind and validator `Spec` | bridge condition 3; no dialect fork | decision-gate |
| N3 | Ratify **DEC-CAT-01** (presheaf-lan/fdm) | prior-run provisional decision | decision-gate |
| N4 | Wire **P3** to a `obligationsForMeta` table **derived** from the contract artifacts (not hand-maintained); keep content vs well-formedness authorities separate (R-circularity) | flips language to load-bearing on the obligation surface | task-session (after N1) |
| N5 | Promote the below-the-wall **evidence gaps** (parser/σ-table/vocabulary faithfulness, R_U empty-σ) from assumptions to tracked items with owners | newly-surfaced evidence-gaps | language + validator owners |
| N6 | Feed the **clarity-gap register** into the prior run's PLAN; re-sequence so B-1 sits alongside Wave A, not deferred | corrects prior PLAN under-weighting | refine/operator |

## Sequencing correction (the actionable finding)
The prior run's PLAN deferred B-1. DEC-FIT-01 shows B-1 is the **bridge** that
makes the language matter — so N1 (B-1) should be sequenced **with** Wave A
(provenance/P4), because P3 (which N1 unlocks) is half the verdict surface.

## Boundaries / stop
- Read-only here; N1–N6 are future task-session/decision-gate work.
- Stop/escalate if N1 reveals prose obligations cannot reduce to per-Meta predicates
  (R-bridge-feasibility) — then the language is only *partially* load-bearing
  (warn-only P3) and that must be recorded honestly.

## Recommended next route
`decision-gate` on N2+N3, then `task-session` on N1 → N4.
