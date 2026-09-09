# Synthetic fixtures

- `pass.jsonl` must return exit 0 and `status=pass`.
- `fail-missing-run-metadata.jsonl` must return nonzero and include `ROW-002`.
- `fail-malformed-provenance.jsonl` must return nonzero and include `ROW-020`.
- `fail-hidden-default-semantics.jsonl` must return nonzero and include both
  `INT-002` and `INT-006`.

These rows prove that the evidence mechanics distinguish known valid and invalid
shapes and enforce declared posture invariants. They are synthetic dry-run
fixtures only. They are not live empirical evidence and do not support any live
field, schema, semantic-validity, evaluator, engine, or anti-bias claim.
