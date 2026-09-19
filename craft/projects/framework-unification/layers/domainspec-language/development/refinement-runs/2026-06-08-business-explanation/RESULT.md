# Refine Result — Plain-Language Business Explanation (Buyer-Facing)

- Run id: `2026-06-08-business-explanation` (parent: `2026-06-08-language-validator-convergence`)
- Status: **pass** — a buyer-facing explainer that is both compelling and honest; passes due-diligence re-attack with no surviving overclaim
- Preset: standard · Research: research-if-gap-appears (none) · Subagents: 2 (recommended, approved)
- Run manifest: `RUN-MANIFEST.md` · **Deliverable:** `stages/s6-invoke-design/EXPLAINER.md`

## What you got
A 5-minute, non-technical **EXPLAINER** a business buyer can read, plus an honest
**assurance ladder** and a **skeptical-buyer FAQ** that survive a technical
advisor's due diligence. Format (DEC-FMT-01): executive narrative → embedded
assurance ladder → FAQ → "built today vs roadmap" box.

## The core story (plain language)
- **The language** = a precise, machine-checkable **blueprint** of what the
  software must be (vs a prose "napkin sketch" two people read two ways).
- **The Lean validator** = a **mathematical proof-checker** (the family used for
  chips/aerospace) that checks **by calculation, not opinion**, identically every
  time.
- **How they prove the system works** = **two locks + one human key**: (1) the
  blueprint is checked for consistency before building; (2) the delivered code is
  checked back against the blueprint (catches drift); (key) a human still signs
  that the blueprint is the *right* one.

## The honest assurance ladder (the differentiator)
- **Proven (math):** the blueprint's structural well-formedness (a real theorem).
- **Machine-checked (reproducible):** no missing references, no circular
  dependencies — deterministic checks, not grand proofs.
- **Human-judged (by design):** does the blueprint capture intent; final sign-off.

The pitch's strength is *transparency about which guarantee is which* — most
vendors can't offer that.

## Honesty guardrails enforced (g-no-overclaim PASS)
Three banned claims, each replaced honestly:
1. "Proves software is bug-free" → proves structure + consistency; intent stays human.
2. "The two systems verify each other today" → convergence is **designed, not
   wired** (Loop 1 now, Loop 2 after the B-1 bridge).
3. "Fully automated, no humans" → the human sign-off is **permanent by design**.
Plus an explicit **built-today-vs-roadmap** box so diligence finds no surprises.

## Stage evidence
| Stage | Verdict | Artifact |
|---|---|---|
| s1 Context Builder | pass | stages/s1-context-builder/context-pack.md |
| s2 Invoke Define | pass | stages/s2-invoke-define/DEFINE.md |
| s3 Interrogation (sell vs honest dialectic) | pass (converged) | stages/s3-interrogation/REVIEW.md, EXPLAINER-DRAFT.md |
| s4 Research / assurance ladder | pass | stages/s4-research/ASSURANCE-LADDER.md |
| s5 Distill + format decision | pass (g-format-decision) | stages/s5-distill/DISTILL.md, FORMAT-DECISION.md |
| s6 Invoke Design (explainer) | pass | stages/s6-invoke-design/EXPLAINER.md |
| s7 Interrogation (due-diligence re-attack) | pass (no overclaim) | stages/s7-interrogation/DESIGN-REVIEW.md |
| s8 Distill Repair | pass | stages/s8-distill-repair/REPAIR.md |
| s9 Invoke Plan | pass | stages/s9-invoke-plan/PLAN.md |
| s10 Final synthesis | pass | this file |

## Residue
R-overclaim → closed. R-current-state → controlled (built-vs-roadmap box). All
inherited technical caveats (designed-not-wired, P3/P4 stubs, B-1 open, translator
net-new, necessary-not-sufficient) are accurately represented, not hidden.

## Recommended next routes
1. Promote `EXPLAINER.md` to `research/EXPLAINER.md` as the canonical buyer doc.
2. Derive a 1-page leave-behind + a 5-slide deck (same honesty line).
3. Build a diligence pack linking each assurance-ladder rung to its evidence.
4. Keep the built-vs-roadmap box synced as Loop 1/Loop 2 progress.
