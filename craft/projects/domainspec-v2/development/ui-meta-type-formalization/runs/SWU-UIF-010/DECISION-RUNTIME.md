---
decision_id: DEC-UIF-010-RUNTIME
status: resolved
selected_option: governed-subagent-dispatch
remaining_blockers: 0
created: 2026-07-11
---

# Decision: UIF-010 Replication Runtime

## Question

How should UIF-010 obtain independent second-corpus and adversarial review
evidence for the nine candidate twins?

## Options

### 1. Approve The Governed Subagent Dispatch - Recommended

Run the tension-checked review sheet with three replication attackers, one
synthesizer, three independent verifiers, and one final auditor.

- Benefit: strongest independence, lens coverage, and accepted-review evidence.
- Cost/risk: eight runtime agents plus governed registration/join/close overhead.
- Downstream: can satisfy UIF-010's independent review acceptance contract.

### 2. Use A Local Single-Agent Fallback

The parent performs corpus mapping, attacks, synthesis, and verification inline.

- Benefit: lowest runtime and coordination cost.
- Cost/risk: weaker independence; evidence must be flagged as parent-reviewed,
  and may not satisfy the accepted adversarial-review bar.
- Downstream: likely leaves UIF-010 flagged and blocks promotion-ready routing.

### 3. Defer UIF-010

Keep the nine candidate twins and round-trip evidence, but stop before
replication/review.

- Benefit: no additional cost or runtime exposure.
- Cost/risk: W2 and all later packet/verification work remain blocked.
- Downstream: candidate evidence stays local and explicitly incomplete.

## Recommendation

Choose option 1. UIF-010 is precisely where independent attackers and verifiers
add evidence value that the parent cannot reproduce alone.

## Decision Record

- Selected option: 1 - approve the governed subagent dispatch.
- Source: user reply `1` on 2026-07-11.
- Runtime dispatch ID: `2026-07-11-uif-010-replication-review`.
- Post-confirmation sheet recheck: double PASS after closing two usage-error
  gate attempts and retrying with a fresh independent pair.
- Registration: ready.

## Standing Non-Decision Option

`Explain / more context` expands agent roles, cost, reversibility, and closeout
without resolving the gate.
