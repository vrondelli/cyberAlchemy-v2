# EVF L1 Cross-Task Decisions

| Decision | Status | Consequence |
| --- | --- | --- |
| `DEC-GCP-001` key-door formal source | selected and evidenced candidate-locally | retain exact L0 receipt; do not call it lifecycle/release admitted |
| `DEC-GCP-002` EVF core vs IOLM consumer | accepted | IOLM remains a sibling lane, not an L1 gate |
| `DEC-GCP-003` first L2 evaluators | accepted direction, implementation gate block | future order is C0 contract/extractor -> Datalog -> Alloy -> non-inflating join; excluded from this Work Pack |
| `DEC-GCP-004` L1 tranche | selected | strict P4 then fresh R4 as distinct serialized SWUs over one graph/source handle |
| `DEC-GCP-005` R4 contract | selected option A | otherwise-eligible zero same-date makeup -> `true`; one or more -> `false`; pure decision only |

## Non-Negotiable Interpretations

- `PayoutEligibilityRule` and `NoDuplicateMakeupRule` remain different Rules.
- Each has its own unique `enforces` edge to `GenerateSettlement`.
- P4 does not prove zero/duplicate payout converses or R5.
- R4 does not prove a write, event, P3, or full preconditions.
- A PASS plan, structural graph, prior SFOL receipt, or C0 synthetic contract
  result cannot stand in for either fresh L1 proof.
