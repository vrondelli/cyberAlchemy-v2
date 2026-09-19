# Distill Validation: ORODI WP7 Offline Replay Campaign

## Run profile

- Mode: validate
- Budget: one Balancer-led validation round with one local Proposer repair pass
- Role execution: parent role simulation; no subagents required
- Target: WP7 Work Pack, layering, SWU manifest, tasks, waves, and validation strategy
- Objective: confirm the smallest coherent implementable unit and its recomposition into the existing WP5-WP6 vertical
- Verdict: pass for plan coherence; implementation remains blocked pending exact acceptance

## Role conversation trace

| Role | Claim or objection | Category | Reconciliation |
| --- | --- | --- | --- |
| Proposer | Compose multiple WP6 results into one aggregate receipt. | initial unit | retained with narrower campaign semantics |
| Balancer | The seven source contexts have distinct bindings and invalidation keys, so one evaluation bundle would create meaning loss. | abstraction-level / boundary object | accepted; revised to a campaign of per-binding partitions with no aggregate derived result |
| Balancer | Raw supplied result bytes and semantic equality are different evidence. | data integrity | accepted; require caller SHA-256, recomputed raw digest, and semantic equality |
| Balancer | A partial-success campaign could leak a valid sibling when another item is forged. | failure-mode / premortem | accepted; campaign rejection discards every projection |
| Balancer | Contract, implementation, and proof could be one task-shaped SWU. | SWU atomicity | rejected; they have independently reviewable compile/schema, pure-behavior, and corpus/regression boundaries |
| Balancer | Repeated same-family items may be a future need. | evolution pressure | deferred; current proof uses the exact seven-family denominator and at most one item per family |

## Smallest coherent unit and atomicity

- Current smallest coherent Work Pack: one offline replay campaign vertical over unchanged WP6.
- First narrow unit: `SWU-ORODI-WP7-001`, because it establishes the closed no-merge/no-partial vocabulary without executable behavior.
- SWU-001 closure: campaign types and schemas share one acceptance boundary.
- SWU-002 closure: recomputation, parity, uniqueness, sorting, and atomic projection jointly enforce one security behavior.
- SWU-003 closure: the persisted finite corpus, executable tests, and claim-ceiling documentation jointly form one proof behavior.
- Task-shaped SWUs: zero.

## Recomposition proof

W0 defines the only legal campaign states. W1 implements those states by invoking unchanged WP6 for each item and preserving per-binding partitions. W2 proves the complete seven-family denominator, bounded subsets, hostile closure, regression, and operator-visible limits. No hidden adapter, registry, eligibility rule, generic contract change, or cross-binding evaluator is needed.

## Technique trace

- Abstraction-level guard: pass; campaign is distinct from evaluation bundle.
- Recomposition proof: pass; W0-W2 cover contract -> behavior -> evidence.
- Evolution profile: pass with deferral; repeated-family, larger campaign, infrastructure/compatibility, and live coordination require separate decisions.
- Frame-expiry note: this optimization expires if WP6 admits runtime evidence, generic evaluation becomes multi-binding, or the seven-family denominator changes.
- Navigability: pass; Work Pack links exact task/wave/source contracts.
- Premortem: likely failure is accidental aggregate control inference; guardrail is the absence of an aggregate-derived field plus per-binding partition tests.
- Cognitive-load check: pass; three serial SWUs and nine product paths are bounded.
- Tournament: skipped; no competing viable design remains after the source-binding constraint.

## Deferred complexity and residue

- More than seven items or repeated same-family items.
- Aggregate policy interpretation across bindings.
- Infrastructure-plan and compatibility profile families.
- Live tools, runtime admission, infrastructure, canary/deployment/rollback effects.
- Lifecycle reconciliation, ontology/profile promotion, publication, and release.

No acceptance-critical design gap remains. Exact owner acceptance and implementation authorization are authority gates, not design gaps.
