---
artifact_id: ux-rule-remove-item-review
canonical_kind: review
authority_kind: Evidence
process_origin: example-review-dispatch
durability: ephemeral
authority_state: none
example_status: illustrative
---

# Review: Fixture Expectations

## Expected Matrix

| Fixture | Expected result | Reason |
| --- | --- | --- |
| `known-good.html` | pass | The button uses a non-empty `aria-label`. |
| `known-bad.html` | block | The icon-only button has no naming source. |
| `false-positive.html` | pass | The button is named through `aria-labelledby`; an `aria-label`-only validator would be wrong. |

## Executed Evidence

None. The package-link validator checks references and contracts only. It does
not open a browser or inspect an accessibility tree.

## Review Verdict

`FLAG`: the package is ready for a browser calibration experiment, not for UX
rule promotion.

