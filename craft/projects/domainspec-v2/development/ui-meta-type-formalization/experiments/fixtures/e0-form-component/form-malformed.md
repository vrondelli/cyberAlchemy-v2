---
fixture_id: UIF-E0-FC-BAD
pair_id: UIF-E0-FORM-COMPONENT
candidate_under_test: Form
declared_type: Form
role: malformed-negative
provenance: synthetic
framework_style: framework-neutral-normalized
expected_behavior: reject
expected_route: repair-as-Form
expectation_frozen: true
promotion_eligible: false
---

# E0 Fixture: Form Malformed

Declared Form with input fields but no validation/error columns, no submission
action, and no error mapping.

## Concept Registry

| Concept | Type |
| --- | --- |
| ProfileEditor | Form |
| PlayerAPI | Interface |

## ProfileEditor Fields

| Name | Type | Input |
| --- | --- | --- |
| display_name | String | text |

## ProfileEditor Contract

| Attribute | Value |
| --- | --- |
| target_interface | PlayerAPI |

## Expected Probe

- Form structural probe: reject.
- Reason: `form-required-structure-missing`.
- Correction: add validation/error cells, submission action, and error mapping.
