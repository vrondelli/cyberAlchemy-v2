# ACFT Research Evidence Harness

Status: candidate-local dry-run mechanics. Authority effect: none.

This package turns the accepted analogical contextual-framing treatment
(`ACFT`) measurement design into executable evidence-capture mechanics. It
validates frozen paired arm bytes, evidence-atom equivalence, seven required
witness classes, append-only JSONL rows, metric arithmetic, adjudication
traces, dry-run/live separation, result summaries, and claim language.

It does not run an experiment or establish comprehension, cognitive effort,
usability, productivity, ergonomic benefit, or generic-framing effectiveness.

## Commands

```sh
python3 generate_fixtures.py
python3 validate_harness.py --manifest fixtures/arm-manifest-pass.json --rows fixtures/run-pass.jsonl
python3 calculate_metrics.py --manifest fixtures/arm-manifest-pass.json --rows fixtures/run-pass.jsonl --output results/dry-run-summary.json
python3 test_harness.py
```

The generators and validators use only the Python standard library.

## Package map

- `protocol.json`: candidate protocol boundary and blocked live-decision fields.
- `schemas/`: protocol, arm-manifest, JSONL row, and result schemas.
- `fixtures/`: generated positive and negative synthetic fixtures.
- `generate_fixtures.py`: deterministic fixture generator.
- `validate_harness.py`: executable invariant validator.
- `calculate_metrics.py`: validated-row summary calculator.
- `test_harness.py`: positive and negative regression suite.
- `results/dry-run-summary.json`: synthetic-only calculation result.
- `VALIDATION.md`: recorded validation commands and claim boundary.

## Evidence boundary

Synthetic rows may prove only that the evidence mechanics accept and reject the
intended shapes and calculate the declared fields. Live execution remains
blocked because the population, sample/sensitivity rationale, literal safety
margin, analogy-harm threshold, benefit threshold, uncertainty method, burden
limit, and owner authorization are unset.

## Open questions

The authoritative unresolved set remains in
[`../findings.md`](../findings.md#open-residue-and-next-route). This package
does not answer those empirical or owner-controlled questions.
