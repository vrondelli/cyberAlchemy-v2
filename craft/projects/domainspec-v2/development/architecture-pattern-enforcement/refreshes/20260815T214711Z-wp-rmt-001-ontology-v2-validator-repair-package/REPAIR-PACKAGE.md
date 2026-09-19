# WP-RMT-001 Ontology-v2 Validator Repair Package

## Purpose

This isolated package stages one mechanical correction to the accepted ontology-v2 apply-package validator. It preserves the accepted package and installed ontology bytes while proving that stale rollback references and digest-valid wrong-generation rollback references remain distinct negative classes after the five-target live apply.

## Material layout

- `material/preimages/.../validate-apply-package.mjs`: immutable accepted preimage.
- `material/staged/.../validate-apply-package.mjs`: exact repaired candidate.
- `repair/validate-apply-package.patch`: exact four-added/one-removed-line patch.
- `regression/validate-post-apply-hostile-topology.mjs`: permanent acceptance-critical post-apply regression.
- `REGRESSION-RESULT.json`: deterministic regression output.
- `ordinary-live-validator.stdout.json`: no-environment live validator output.
- `validation/validate-repair-package.mjs`: package/source/scope/hygiene validator.
- `VALIDATION-RESULT.json`: deterministic package validation result.

## One-target contract

| Axis | Value |
|---|---|
| Target | accepted package `validation/validate-apply-package.mjs` |
| Preimage | `2b27e086...`, 149,061 bytes |
| Postimage | `985e4c54...`, 149,370 bytes |
| Target-inventory digest | `817ef12b2ae3261b578b82570423ca984fd786363cd1488becabf1e9f3f04bb0` |
| Apply authority | absent |
| Fresh owner acceptance | required and absent |
| Authority effect | none |

## Required replay

1. Rehash all selected sources and immutable parent inputs.
2. Reproduce the original exact stale-code collision with exit 1.
3. Replay the candidate live validator and require exit 0 plus 37/37 hostiles.
4. Require wrong-generation to return `V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH` and stale-reference to return `V2_PROMOTION_ROLLBACK_REF_STALE`.
5. Run the ordinary live validator without private environment overrides and require 24 checks.
6. Rehash the accepted validator and all five installed live postimages.
7. Enforce exact package scope and strict JSON/text hygiene.
8. Compare fresh validator output byte-for-byte with `VALIDATION-RESULT.json`.

## Authority ceiling

This package may be audited and accepted as exact bytes. It does not apply itself and does not authorize candidate migration, admission, PromotionRecord creation, promotion, publication, release, deployment, production, Git, or network effects.
