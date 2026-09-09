# ACFT Evidence Harness Validation

Validated: 2026-09-01

Status: PASS for candidate-local synthetic evidence mechanics.

Effect verdict: `not_evaluable`.

## Positive path

```text
$ python3 generate_fixtures.py
{"evidence_kind": "synthetic_fixture", "fixtures": 7, "rows": 14, "status": "pass"}

$ python3 validate_harness.py --manifest fixtures/arm-manifest-pass.json --rows fixtures/run-pass.jsonl
{"claim_status": "synthetic_fixture_no_human_or_product_claim", "evidence_kind": "synthetic_fixture", "pairs": 7, "rows": 14, "status": "pass", "witness_classes": ["harmful", "leakage", "misleading", "neutral", "positive_helpful_control", "required_return", "unfamiliar_transfer"]}

$ python3 calculate_metrics.py --manifest fixtures/arm-manifest-pass.json --rows fixtures/run-pass.jsonl --output results/dry-run-summary.json
{"claim_status": "synthetic_fixture_no_human_or_product_claim", "effect_verdict": "not_evaluable", "output": "results/dry-run-summary.json", "pairs": 7, "rows": 14, "status": "pass"}
```

## Negative path

The unequal-evidence fixture was rejected with both:

```text
EVIDENCE_PARITY:manifest.fixtures[4].acft.evidence_atom_ids
LEAKAGE:manifest.fixtures[4].acft:[[ANSWER_KEY]]
```

The missing-metadata fixture was rejected with:

```text
FIELDS:rows[0]
```

The invalid-metric fixture was rejected with:

```text
ARITHMETIC:rows[0].outcomes.semantic_fidelity
```

The calculator also rejected the invalid-metric fixture and did not create an
output file.

## Regression suite

```text
$ python3 test_harness.py
Ran 6 tests in 0.487s

OK
```

The suite covers the passing bundle, evidence parity and leakage rejection,
required metadata, metric arithmetic, fail-closed calculation, and the
synthetic claim ceiling.

## Claim boundary

The generated values are deliberately scripted to exercise calculations and
failure sentinels. They are not observations of people, models, products, or
operational work. They do not show that ACFT—or framing generally—improves
comprehension, cognitive effort, usability, productivity, ergonomics, or any
other outcome.

Live execution remains blocked until the owner supplies and authorizes the
population, sample/sensitivity rationale, boundary-error non-inferiority
margin, analogy-harm critical-event threshold, P2 decision rule and minimum
benefit threshold, uncertainty method, missing-data rule, and burden limit.
