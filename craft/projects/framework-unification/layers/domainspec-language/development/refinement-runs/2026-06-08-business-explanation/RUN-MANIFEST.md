# Run Manifest — 2026-06-08-business-explanation

- Owner: refine · Parent run: 2026-06-08-language-validator-convergence
- Target: plain-language buyer-facing explanation of the language + Lean validator
- Preset: standard · Research: research-if-gap-appears (none triggered)
- Subagents: 2 (recommended, approved); dialectic; parent_synthesis
- Dispatch: `REFINE-DISPATCH.json` — validated vs `dispatch.schema.yml` (10 steps, 8 gates)
- Status: **complete — final verdict pass**
- Deliverable: `stages/s6-invoke-design/EXPLAINER.md`

## Stage ledger
| # | Stage | Capability | Status | Artifact |
|---|-------|-----------|--------|----------|
| s1 | Context Builder | context-builder | pass | stages/s1-context-builder/context-pack.md |
| s2 | Invoke Define | invoke | pass | stages/s2-invoke-define/DEFINE.md |
| s3 | Interrogation (sell vs honest) | interrogation | pass (converged) | stages/s3-interrogation/REVIEW.md, EXPLAINER-DRAFT.md |
| s4 | Research / assurance ladder | refine | pass | stages/s4-research/ASSURANCE-LADDER.md |
| s5 | Distill + format decision | distill | pass (g-format-decision) | stages/s5-distill/DISTILL.md, FORMAT-DECISION.md |
| s6 | Invoke Design (explainer) | invoke | pass | stages/s6-invoke-design/EXPLAINER.md |
| s7 | Interrogation (due-diligence re-attack) | interrogation | pass (no overclaim) | stages/s7-interrogation/DESIGN-REVIEW.md |
| s8 | Distill Repair | distill | pass | stages/s8-distill-repair/REPAIR.md |
| s9 | Invoke Plan | invoke | pass | stages/s9-invoke-plan/PLAN.md |
| s10 | Final synthesis | interrogation | pass | RESULT.md |

## Subagent ledger
| role_id | status | receipt |
|---------|--------|---------|
| business-explainer | completed | EXPLAINER-DRAFT.md |
| due-diligence-skeptic | completed | ASSURANCE-LADDER.md |

## Gates
g-native-handles pass · g-stage-receipts pass · g-subagent-auth pass ·
g-format-decision pass (DEC-FMT-01) · g-no-overclaim pass · g-traceability pass ·
g-owner-boundary pass · g-final-readiness pass

## Decisions
- DEC-FMT-01: explainer format = executive-narrative + embedded assurance ladder + FAQ + built-vs-roadmap box.
