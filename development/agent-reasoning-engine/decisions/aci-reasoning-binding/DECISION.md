---
decision_id: G-ARE-ACI-BINDING-20260723
gate_id: G-ARE-ACI-BINDING
status: pass
selected_option: ACI-BIND-A-SUBORDINATE
---

# Decision — ACI reasoning binding disposition

## Question

Which authority disposition should govern the reasoning engine after its
promoted bounded L0 semantic witness?

## Consequential boundary

This choice controls whether later planning can shape local actor-journal,
publication, durability, replay, provenance, and effect-intent work. It does
not authorize implementation or select an SWU.

## Options

| Choice | Stable option ID | Benefit | Cost / risk | Downstream effect |
|---|---|---|---|---|
| A | `ACI-BIND-A-SUBORDINATE` | Aligns the target with the orchestrator's one-journal authority while allowing isolated local evidence during external immaturity. | Integrated work waits for ACI/Bus/ACP/APT gates and conformance; local interim must carry a strict non-integration label. | Invoke may revise the design/plan for an ACI-subordinate target, still with no automatic SWU selection. |
| B | `ACI-BIND-B-LOCAL-ONLY` | Lets local reasoning experiments evolve independently. | Creates divergence pressure and permanently withholds ACI compatibility/integrated packaging until a later superseding decision. | Invoke may plan only isolated local witnesses and must prohibit integrated claims. |
| C | `ACI-BIND-C-DEFER` | Preserves optionality while external contracts mature. | No affected L1/L2 plan continuation. | Keep `BLK-ARE-ACI-BINDING-001` open. |
| D | `ACI-BIND-D-STANDALONE-REROUTE` | Keeps the proven semantic reducer and removes runtime authority collision. | Abandons the current whole-engine integration direction. | Return to Invoke Define/Design to narrow the target to a standalone semantic library. |

Standing non-answer: **Explain / more context**. It expands these trade-offs but
does not resolve the gate.

## Recommendation

The owner selected **A**. The target architecture is ACI-subordinate: integrated
command/event lifecycle, canonical acceptance identity, replay cursor, and
effect intents belong to ACI. Local-only interim witnesses remain permitted
only as explicitly non-integrated evidence and cannot claim ACI compatibility.

## Evidence

- [`../../design/aci-reasoning-binding/ARCHITECTURE.md`](../../design/aci-reasoning-binding/ARCHITECTURE.md)
- [`../../design/aci-reasoning-binding/DISTILL-VALIDATION.md`](../../design/aci-reasoning-binding/DISTILL-VALIDATION.md)
- [`option-admissibility-request.json`](option-admissibility-request.json)
- [`option-admissibility-receipt.json`](option-admissibility-receipt.json)
- [`BINDING-RECEIPT.json`](BINDING-RECEIPT.json)

## Owner selection

- Selected option: `ACI-BIND-A-SUBORDINATE`
- Source: explicit user response `A` to the active gate
- Recorded at: `2026-07-23T18:38:42-03:00`
- Rationale: preserve the whole-engine architectural objective without
  duplicating ACI's accepted one-writer authority; treat local-only work as an
  interim evidence path rather than a compatibility shortcut.

## Result

- Result: `PASS`
- Resolved decisions: `1`
- Remaining local decision blockers: `0`
- External maturity dependencies: ACI runtime, Bus, ACP, and APT gates remain
  open
- Implementation authorized: `false`
- Selected SWU: `none`
- Next step: synchronize Invoke/Craft state, then revise the plan around
  ACI-subordinate conformance without selecting implementation work.
