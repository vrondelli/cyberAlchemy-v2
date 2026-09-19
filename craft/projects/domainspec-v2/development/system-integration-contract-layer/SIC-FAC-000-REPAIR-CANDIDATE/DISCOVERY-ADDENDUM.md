# Claim-Ceiling Compatibility Discovery

## Result

The five-file core repair is mechanically coherent but cannot be admitted against the current factory corpus. A real direct-plus-child execution audit of all 11 request fixtures exercised by the factory tests found 31 provider-result/locked-node claim-ceiling mismatches across 9 fixtures.

The exact report is `probes/existing-claim-ceiling-audit.json` with SHA-256 `7a8f653e56a0fd45f6d329e58105629207f1395797de91961fd23000a13b30eb`.

## Affected fixtures

- `reference-suite.request.json`: 1 mismatch
- `rmt-calculation.request.json`: 4 mismatches
- `rmt-entity.request.json`: 5 mismatches
- `rmt-enum-semantic-slice.request.json`: 5 mismatches
- `rmt-policy.request.json`: 5 mismatches
- `rmt-query.request.json`: 4 mismatches
- `rmt-value-object.request.json`: 5 mismatches
- `w3-effects-connections.request.json`: 1 mismatch
- `w4-orchestration-lifecycle.request.json`: 1 mismatch

`candidate-direct-proof.request.json` and `rule-only.request.json` are already equal.

## Why mutation is stopped

The accepted SIC contract permits exact equality or another exact mechanically enforceable relation selected by the factory owner. The staged executor and normalizer patches implement exact equality. Applying them now would fail the reference suite, W3, W4, and six RMT suites.

Changing the 31 locked values to current provider-authored prose would pre-authorize those claims. Changing provider outputs would alter family evidence claims. Either direction crosses a semantic claim-owner gate. The generic factory repair authorization does not determine that ownership choice, so no product mutation is admitted.

## Preserved candidate

The five core/test patches remain separately staged under `producer/patches/` and all pass `git apply --check`. The sequential reproduction repair remains viable, but it is not partially applied while the bundled claim-ceiling invariant is blocked.
