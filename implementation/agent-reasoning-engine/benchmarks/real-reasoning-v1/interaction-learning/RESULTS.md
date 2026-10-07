# Interaction-Learning Objective-Cycle Results

Status: objective closed; supported candidate retained  
Authority effect: none  
Serving activation: none

## Outcome

The real interaction-learning lane completed historical ingestion, independent
labeling, baseline measurement, four hypothesis iterations, offline screening,
fresh prospective validation, independent assessment, versioned learning
packages, and durable coordinator settlement.

The historical baseline is `episode_success_rate = 0.50`: 25 successes and 25
assistant-caused failures among 50 eligible objective episodes, plus 13
indeterminate episodes. All 1,269 turn candidates are labeled exactly once.
`scope_transition` accounts for 24 of the 25 historical failures.

| Hypothesis | Intervention | Prospective result | Critical regressions | Decision |
| --- | --- | --- | --- | --- |
| IL-H01 | Model-authored objective-transition checkpoint | 12/20, `0.60`; Wilson 95% `[0.3866, 0.7812]` | 2 | Rejected |
| IL-H02 | Typed identity ledger, model-authored control record | 0/20, `0.00`; Wilson 95% `[0, 0.1611]` | 1 | Rejected |
| IL-H03 | Engine-owned control envelope, model-authored response | 11/20, `0.55`; Wilson 95% `[0.3421, 0.7418]` | 1 | Rejected |
| IL-H04 | Deterministic bilingual renderer for high-risk transitions | 20/20, `1.00`; Wilson 95% `[0.8389, 1]` | 0 | Candidate supported |

The frozen acceptance contract required at least 20 eligible episodes, rate at
least `0.75`, a Wilson 95% lower bound above the `0.50` historical baseline,
zero critical regressions, and independent evaluation. Only IL-H04 passed.

## Retained lesson

At high-risk objective or cycle transitions, ARE should keep transition,
objective identity, cycle identity, relationship, response language, next
action, clarification posture, evidence posture, and decision options under
engine control. A closed deterministic renderer can present those facts. The
model should not regenerate or reinterpret them.

This is not a recommendation to template all assistant responses. The candidate
is restricted to detected high-risk transitions. Low-risk prose remains outside
the claim.

## Evidence and runtime settlement

The retained learning package is
`packages/evolution-runtime/evidence/interaction-learning-objective-cycle-v1/runtime/cycles/interaction-learning-objective-cycle-v1/learning-package-v4.json`.
It was emitted as `eligible-for-owner-review` with `activation: none`. The owner
selected DG-IL-15 A. The runtime preserved that decision in
`owner-decision.json`, closed the objective, and retained `activation: none`.
The decision digest is
`0727a0c4f5a6e25d3cdb107b191f6e38a448c9e7458e00ab152630ac15c8029b`.

The coordinator bound 22 real artifacts across the baseline and all four
hypotheses. Its settlement digest is
`b080b99e0c15234884e75f1e7de53cf3b049f73c410e2f938dba1da88818d078`.
Restart and SQLite-loss reconstruction both reproduced the same coordination
projection.

H01, H02, and H03 remain preserved as counterevidence. H03 also preserves one
failed local-finalization attempt with 20 dispatched calls and unknown usage;
it is not counted as validation evidence. Known provider usage across accepted
run manifests is 21,635 tokens. H04 used no provider calls.

Temporary raw evaluator handoffs were removed after independent verdicts were
ingested. Durable evidence retains hashes, structural fields, usage, verdicts,
limitations, receipts, and learning packages; it does not retain raw response
text, credentials, encrypted reasoning, tool payloads, or environment values.

## Claim boundary

The result supports a construction candidate on bounded synthetic prospective
interactions. It does not establish production or general-user effectiveness,
does not activate a serving change, does not admit the candidate cycle
definition, and does not authorize a controlled upgrade.

## Open Questions

- The first serving integration target is now resolved: the ARE Codex wrapper's
  post-objective-resolution, pre-model-dispatch boundary. The integration is
  implemented but remains disabled.
- What real-user confirmation cohort is required before any controlled-upgrade
  proposal?
