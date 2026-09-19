---
fixture_id: UIF-E0-AM-POS
pair_id: UIF-E0-ADAPTER-MAPPING
candidate_under_test: Adapter
declared_type: Adapter
role: positive
provenance: synthetic
framework_style: framework-neutral-normalized
expected_behavior: accept
expected_route: Adapter-under-test
expectation_frozen: true
promotion_eligible: false
---

# E0 Fixture: Adapter Positive

Synthetic UI-boundary transform. The E0 probe may accept its transform shape,
but that does not prove Adapter is distinct from Mapping.

## Concept Registry

| Concept | Type |
| --- | --- |
| PlayerResponseAdapter | Adapter |
| PlayerSummary | View Model |

## PlayerResponseAdapter Contract

| Attribute | Value |
| --- | --- |
| source_schema | API.PlayerResponse |
| target_schema | UI.PlayerSummary |
| direction | inbound |
| boundary | ui |
| lossiness | drops-internal-audit-fields |

## PlayerResponseAdapter Field Mapping

| Source Field | Target Field | Transform |
| --- | --- | --- |
| displayName | name | copy |
| status.code | status_label | lookup-label |

## Relationships

| From | Edge | To |
| --- | --- | --- |
| PlayerResponseAdapter | shapes | PlayerSummary |

## Expected Probe

- Transform structural probe: accept.
- `boundary=ui`, Adapter naming, and `shapes` are forbidden as standalone
  non-collapse witnesses.
