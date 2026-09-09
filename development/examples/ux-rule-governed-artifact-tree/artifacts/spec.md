---
artifact_id: ux-rule-remove-item-spec
canonical_kind: spec
authority_kind: Spec
process_origin: example-spec-owner-plus-decision-gate
durability: perennial
authority_state: candidate
example_status: illustrative
---

# Candidate Spec: Remove-Item Accessible Name

## Rule

In the cart scenario, every control with role `button` that performs the
remove-item action must expose a non-empty accessible name.

## Allowed Witnesses

- accessible name supplied by visible text;
- accessible name supplied by `aria-label`;
- accessible name supplied by `aria-labelledby`;
- another browser-supported naming mechanism evidenced by calibration.

## Failure

The scoped button exposes an empty or whitespace-only accessible name.

## Claim Boundary

Passing this rule establishes only the browser-observed accessible-name
condition for the scoped control. It does not establish:

- complete accessibility;
- user comprehension;
- user preference or trust;
- task success;
- correctness outside the declared cart scenario.

## Promotion State

Candidate. Promotion is blocked until source cards, browser evidence, fixture
calibration, challenge review, and a real owner decision exist.

