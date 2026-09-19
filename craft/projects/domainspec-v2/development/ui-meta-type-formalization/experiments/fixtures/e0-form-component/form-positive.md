---
fixture_id: UIF-E0-FC-POS
pair_id: UIF-E0-FORM-COMPONENT
candidate_under_test: Form
declared_type: Form
role: positive
provenance: synthetic
framework_style: framework-neutral-normalized
expected_behavior: accept
expected_route: Form
expectation_frozen: true
promotion_eligible: false
---

# E0 Fixture: Form Positive

Synthetic method fixture. Passing this fixture does not make Form authoritative
or promotion-ready.

## Concept Registry

| Concept | Type |
| --- | --- |
| CreatePlayerForm | Form |
| CreatePlayerAction | Action |
| PlayerAPI | Interface |

## CreatePlayerForm Fields

| Name | Type | Input | Validation | Error |
| --- | --- | --- | --- | --- |
| display_name | String | text | required, min-length:2 | display_name_required |
| email | Email | email | required, email-format | email_invalid |

## CreatePlayerForm Contract

| Attribute | Value |
| --- | --- |
| submission_action | CreatePlayerAction |
| target_interface | PlayerAPI |
| error_mapping | field-and-form-errors |

## Relationships

| From | Edge | To |
| --- | --- | --- |
| CreatePlayerForm | submits | CreatePlayerAction |
| CreatePlayerForm | contracts | PlayerAPI |

## Expected Probe

- Form structural probe: accept.
- Neighbor route: none.
- DS-D8 role: supporting only.
