<!--
  GOLDEN FIXTURE — worked mint-act output. Hand-instantiated from templates/promotion-policy.md
  for the release-approval process domain. Every gate resolves to this repo's own authority/.
-->

# Promotion Policy

Status: active local policy
Owner: release-approval owner

Release-approval promotes by evidence and owner route, not by author urgency.

## Promotion Ladder

| State | Meaning | May promote to |
| --- | --- | --- |
| Change record | A submitted change in its own context (diff, declared blast-radius). | Source record. |
| Source record | Path, date, source kind, and boundary captured. | Change-class proposal. |
| Change-class proposal | A proposed `routine`/`significant`/`emergency` class with rationale. | Change-class ruling (owner-ratified). |
| Change-class ruling | An owner-ratified class; its gate-set binding now fires. | Gate evaluation. |
| Candidate gate rule | A proposed approval condition for a class. | Validation request after collapse test and a workflow witness. |
| Workflow witness | A concrete past change for testing a gate rule. | Evidence harness or external review. |
| Release recommendation | A source-backed "gates passed, recommend release" with residual risk. | External owner decision (release / hold). |

## Required Gates

| Gate | Required when | Standard |
| --- | --- | --- |
| Source-kind gate | A new source is added or cited. | Primary, supporting, related, analogy, inference, or residue is explicit. |
| Authority gate | A claim could affect a release decision. | Route to **this repo's `authority/`** and mark non-policy until external owner review. *(Resolves locally — never to a framework.)* |
| **Blast-radius classification gate** ⟵ *domain-originated* | A change enters review with a declared blast-radius. | The change-class is **ruled by `change-class-governance`, not accepted from the author's declaration**; an under-declared change is re-classed up before its gate-set binds. *(A gate cav2 has no analog for: it gates the class ruling itself.)* |
| **Self-approval separation gate** ⟵ *domain-originated* | Any approver is assigned to a bound gate. | **Block if the assigned approver is the change author or owns the change-class ruling for this change** — the class ruler, the gate, and the approver are three separated roles. |
| Two-approver gate | A change is ruled `significant` or `emergency`. | At least two independent approvers, neither the author, both inside the bound gate-set. |

## Promotion Blocks

Block promotion when:

- the change-class is self-assigned by the author rather than ruled by `change-class-governance`;
- a bound gate-set is edited mid-flight for a change already in review;
- the claim depends on an analogy (an external standard) without a bridge decision;
- the proposal skips its bound gate-set;
- the recommendation has no witness, falsifier, or audit route;
- **the promotion would resolve by traversing into a framework attachment** (no framework
  edge is a promotion path — Obs-B at the promotion level).
