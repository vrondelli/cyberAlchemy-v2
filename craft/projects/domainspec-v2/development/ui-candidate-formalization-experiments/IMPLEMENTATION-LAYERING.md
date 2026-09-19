---
artifact_id: UCFE-IMPLEMENTATION-LAYERING-v1
status: approved
active_layer: L0
created: 2026-07-12
---

# Implementation Layering

| Layer | Decision question | Minimum working unit | Included | Deferred | Exit evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 Contract proof | After this layer, we know whether the process can distinguish support, coverage, and missing without authority leakage. | CandidateRun evaluator plus Form preregistration | schemas, canonical identity, hypotheses, alternatives, failure branches | real evidence collection | SWU-001/002 receipts | run coverage audit or repair contract |
| L1 Evidence credibility | After this layer, we know whether existing coverage or empirical separation is credibly observable. | Form coverage audit plus pinned corpus/experiment receipts | six coverage dimensions, corpus A/B, erasure and consequence tests | reviewer judgment and authority | SWU-003 through 006 receipts | review, defer, or covered-existing route |
| L2 Governance reliability | After this layer, we know whether independence, policy, disposition, and handoff rules hold. | reviewer attestations plus fixed evaluation | review dedupe, 2/2/2, conjuncts, immutable disposition, owner firewall | reusable rollout | SWU-007/008 receipts | audit pilot or repair evidence |
| L3 Reuse credibility | After this layer, we know whether the process can be reused without copying Form conclusions. | audited Form run and one neutral replay fixture | profile extraction, neutral fixture, integrated audit | execution for remaining candidates | SWU-009/010 receipts | approve per-candidate rollout or defer |

## Non-Regression Guardrails

- Later layers preserve the three-disposition algebra and coverage precedence.
- Missing evidence remains a valid `defer-missing` result.
- Fixed policy and hard conjuncts cannot be weakened by later layers.
- Profile extraction copies process contracts only, never candidate outcomes.
- No layer grants canonical mutation authority.

## Recommended Next Layer

- Next: L0
- Decision unlocked: whether candidate formalization can fail closed before real evidence collection
- Major deferrals: corpus B, reviewer identities, Form disposition, rollout to other candidates
