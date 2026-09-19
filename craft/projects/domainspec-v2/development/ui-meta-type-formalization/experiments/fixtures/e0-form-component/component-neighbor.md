---
fixture_id: UIF-E0-FC-NEIGHBOR
pair_id: UIF-E0-FORM-COMPONENT
candidate_under_test: Form
declared_type: Component
role: neighbor
provenance: synthetic
framework_style: framework-neutral-normalized
expected_behavior: reroute
expected_route: Component
expectation_frozen: true
promotion_eligible: false
---

# E0 Fixture: Component Neighbor

Typed visual unit with a callback, but no field-validation-submission aggregate.

## Concept Registry

| Concept | Type |
| --- | --- |
| PlayerSummaryCard | Component |

## PlayerSummaryCard Props

| Name | Type | Required |
| --- | --- | --- |
| player_name | String | yes |
| status_label | String | yes |

## PlayerSummaryCard Callbacks

| Name | Input | Output |
| --- | --- | --- |
| on_open | PlayerId | Void |

## Expected Probe

- Form structural probe: reject and reroute.
- Route: Component.
- Correction to become Form: add input fields, validation/error contract,
  submission action, target interface, and error mapping.
