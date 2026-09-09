# Synthetic Validation Receipt

Date: `2026-08-29`

Status: `PASS-pre-execution-mechanics`

Authority effect: `none`

## Validated Surface

- one synthetic task-selection record;
- one two-fact condition manifest with two parity reviews;
- one four-condition synthetic task block;
- exact task-selection and manifest digest joins;
- condition packet, fact-set, Definition Pack, gate, and cost bindings;
- paired per-task metrics and separate ambiguity-stratum summaries;
- honest unknown handling and synthetic/live evidence separation;
- a generated 24-row, six-task live-shape regression with two low-ambiguity
  and four high-ambiguity tasks; and
- a fourth-condition hidden-case denominator drift regression.

## Local Results

```text
validate_task_selection.py          PASS: 1 candidate, 1 selected
validate_condition_manifest.py      PASS: 2 facts, 4 conditions, 2 parity reviews
validate_run.py                     PASS: 4 rows, 1 block, synthetic_fixture
validate_experiment_bundle.py       PASS: 1 joined task, 1 manifest, 4 rows
test_task_selection.py              PASS: 3 checks
test_condition_manifest.py          PASS: 1 positive, 3 negative cases
test_run_contract.py                PASS: 7 checks
test_experiment_bundle.py           PASS: 5 checks, including 24-row live shape
validate_package.py                 PASS
```

Expected-fail fixtures for missing metadata and invalid outcomes returned
nonzero. The synthetic task block failed `--live-pilot` on evidence kind,
cardinality, and strata as expected.

## Container Result

Parent: `domainspec-node-toolchain:26.8.1-ts7.0.2`

Node source provenance:
`node:26.8.1-bookworm-slim@sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e`

Runtime versions: Node `26.8.1`; Python `3.11.2`.

The local `cyberalchemy-define-research:local` image passed with:

```text
--network none --read-only --tmpfs /tmp:rw,noexec,nosuid,size=16m
```

Exact local image identity is outside the image in
`container-build-receipt.json`.

## Claim Boundary

`synthetic_fixture_no_product_claim`

This receipt establishes prepared evidence mechanics. It does not establish
that Define improves planning, implementation, productivity, customer value,
or product-market fit. It does not authorize a live run.
