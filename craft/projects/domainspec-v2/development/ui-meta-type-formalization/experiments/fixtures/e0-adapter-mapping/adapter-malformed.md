---
fixture_id: UIF-E0-AM-BAD
pair_id: UIF-E0-ADAPTER-MAPPING
candidate_under_test: Adapter
declared_type: Adapter
role: malformed-negative
provenance: synthetic
framework_style: framework-neutral-normalized
expected_behavior: reject
expected_route: repair-transform-structure
expectation_frozen: true
promotion_eligible: false
---

# E0 Fixture: Adapter Malformed

Declared Adapter with a source and UI label but no target schema or field map.

## Concept Registry

| Concept | Type |
| --- | --- |
| IncompleteAdapter | Adapter |

## IncompleteAdapter Contract

| Attribute | Value |
| --- | --- |
| source_schema | API.PlayerResponse |
| direction | inbound |
| boundary | ui |

## Expected Probe

- Transform structural probe: reject.
- Reason: `transform-required-structure-missing`.
- Correction: add target schema and at least one explicit field transform.
