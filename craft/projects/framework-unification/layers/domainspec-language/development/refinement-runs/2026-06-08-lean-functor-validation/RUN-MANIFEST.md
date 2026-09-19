# Run Manifest — 2026-06-08-lean-functor-validation

- Owner: refine
- Target: DomainSpec Language design ↔ lean-code-validator bridge
- Preset: deep
- Research mode: bounded-research (confirmed)
- Subagent strategy: required (approved); 5 role-bound lanes, parent_synthesis join
- Dispatch: `REFINE-DISPATCH.json` — validated against `formulae/dispatch-spec/dispatch.schema.yml` (10 steps, 8 gates, shape conforms)
- Status: **complete — final verdict flag** (refined design + one work pack; honesty-critical sequencing surfaced)

## Artifacts owned by refine
- `REFINE-SEED-PROPOSAL.md` — written
- `REFINE-DISPATCH.json` — written + validated
- `RUN-MANIFEST.md` — this file
- `evidence-index.json` — written
- `RUNTIME-HANDOFF.md` — written (authorization approved)
- `RESULT.md` — written (final synthesis)

## Canonical stage ledger
| #   | Stage | Capability | Status | Artifact |
| --- | ----- | ---------- | ------ | -------- |
| s1  | Context Builder baseline | context-builder | pass | stages/s1-context-builder/context-pack.md, VALIDATOR-XRAY.md |
| s2  | Invoke Define | invoke | pass | stages/s2-invoke-define/DEFINE.md |
| s3  | Interrogation refine-review | interrogation | flag→addressed | stages/s3-interrogation/REVIEW.md |
| s4  | Research decision (bounded) | refine | pass | stages/s4-research/CATEGORICAL-FORMALIZATIONS.md, STAGE-A-CORRECTNESS.md |
| s5  | Distill + categorical decision | distill | pass (g-categorical-decision satisfied) | stages/s5-distill/DISTILL.md, CATEGORICAL-MODEL-DECISION.md |
| s6  | Invoke Redefine/Design | invoke | pass | stages/s6-invoke-design/DESIGN.md, TRANSLATOR-DESIGN.md |
| s7  | Interrogation design-review | interrogation | pass (guardrails) | stages/s7-interrogation/DESIGN-REVIEW.md |
| s8  | Distill Repair (toy-game) | distill | flag→repaired | stages/s8-distill-repair/REPAIR.md, TOYGAME-FALSIFICATION.md |
| s9  | Invoke Plan | invoke | pass | stages/s9-invoke-plan/PLAN.md |
| s10 | Final Interrogation + synthesis | interrogation | pass | RESULT.md |

## Subagent ledger
| role_id | status | join | receipt |
|---------|--------|------|---------|
| lean-validator-xray | completed | parent_synthesis | VALIDATOR-XRAY.md |
| categorical-formalizer | completed (bounded research) | parent_synthesis | CATEGORICAL-FORMALIZATIONS.md |
| spec-correctness-prover | completed | parent_synthesis | STAGE-A-CORRECTNESS.md |
| translator-designer | completed | parent_synthesis | TRANSLATOR-DESIGN.md |
| residue-skeptic | completed (2 passes) | parent_synthesis | REVIEW.md, DESIGN-REVIEW.md, TOYGAME-FALSIFICATION.md |

## Gates
| gate | result |
|------|--------|
| g-native-handles | pass (native skills/subagents) |
| g-stage-receipts | pass (every stage has artifact) |
| g-research-confirm | pass (bounded research approved) |
| g-subagent-auth | pass (approved) |
| g-categorical-decision | pass (DEC-CAT-01 recorded before plan) |
| g-owner-boundary | pass (no validator/Craft/impl source mutated) |
| g-artifact-existence | pass |
| g-final-readiness | flag (RESULT names honesty boundary, blockers, one work pack; verdict flag by design) |
