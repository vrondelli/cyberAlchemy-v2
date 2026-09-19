---
fixture_id: UIF-E0-AM-NEIGHBOR
pair_id: UIF-E0-ADAPTER-MAPPING
candidate_under_test: Adapter
declared_type: Mapping
role: neighbor
provenance: synthetic
framework_style: framework-neutral-normalized
expected_behavior: accept-collapse-signal
expected_route: Mapping
expectation_frozen: true
promotion_eligible: false
---

# E0 Fixture: Mapping Neighbor

Existing-type neighbor with the same constructible source/target transform
shape as the Adapter positive. UI boundary metadata is intentionally absent.

## Concept Registry

| Concept | Type |
| --- | --- |
| PlayerResponseMapping | Mapping |

## PlayerResponseMapping Contract

| Attribute | Value |
| --- | --- |
| source_schema | API.PlayerResponse |
| target_schema | UI.PlayerSummary |
| direction | inbound |
| lossiness | drops-internal-audit-fields |

## PlayerResponseMapping Field Mapping

| Source Field | Target Field | Transform |
| --- | --- | --- |
| displayName | name | copy |
| status.code | status_label | lookup-label |

## Expected Probe

- Adapter transform structural probe: accept as a collapse signal.
- Expected method route: Mapping.
- A distinct Adapter would need a new separating structural witness registered
  before execution; naming, `boundary=ui`, or `shapes` alone do not count.
