# Financial Settlement Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `ef0f6589e3c706a31758e6f8014dc5db823325cec2e740f28a50f8937271e341`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `financial-settlement.DealSplitCalculation` | Calculation | Calculate the player deal share admitted by experimental clause C3. |
| `financial-settlement.GenerateSettlement` | Operation | Generate settlement and expose the payout write/event effects admitted by experimental clause P4. |
| `financial-settlement.NoDuplicateMakeupRule` | Rule | Reject a duplicate same-date MAKEUP_APPLIED decision while otherwise eligible. |
| `financial-settlement.PayoutCreatedEvent` | Event | Record that the observed payout creation effect occurred. |
| `financial-settlement.PayoutEligibilityRule` | Rule | Identify the bounded experimental condition under which payout effects are observed. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `financial-settlement.edge.deal-split-calculates-generation` | `financial-settlement.DealSplitCalculation` | `calculates` | `financial-settlement.GenerateSettlement` |
| `financial-settlement.edge.generation-produces-payout-event` | `financial-settlement.GenerateSettlement` | `produces` | `financial-settlement.PayoutCreatedEvent` |
| `financial-settlement.edge.no-duplicate-makeup-rule-enforces-generation` | `financial-settlement.NoDuplicateMakeupRule` | `enforces` | `financial-settlement.GenerateSettlement` |
| `financial-settlement.edge.payout-rule-enforces-generation` | `financial-settlement.PayoutEligibilityRule` | `enforces` | `financial-settlement.GenerateSettlement` |

This file is generated; edit machine sources and rebuild.
