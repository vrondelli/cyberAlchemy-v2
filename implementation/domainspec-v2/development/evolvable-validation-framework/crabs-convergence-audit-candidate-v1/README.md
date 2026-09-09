# CRABS convergence audit candidate

Status: prototype construction candidate; unapproved
Subject: CRABS commit `9e3a0a6fbaa3f163d0afc5afa94a65fbc5be1937`
Authority effect: none

This package checks one narrow claim: whether the current CRABS ordered-set
merge is commutative for two replicas containing one distinct live element
each. It compiles the actual CRABS merge implementation, produces a concrete
native witness, and asks CBMC 6.11.0 to check the same assertion.

It is not a full CRABS audit or proof. A CBMC result applies only to the exact
source, harness, modeled dependencies, and declared bound.

For a plain-language explanation of the defect, evidence, impact, and limits,
read [`FINDINGS.md`](FINDINGS.md). The proposed staged repair direction is in
[`repair-plan.md`](repair-plan.md); it is a planning candidate and does not
authorize CRABS source changes.

## Flow

```text
exact CRABS source bytes
  -> neutral merge-law obligation
  -> C harness over actual merge function
  -> native witness + CBMC bounded check
  -> append-only run record
  -> EVF result with explicit residue
```

## Validate dry-run mechanics

```bash
PYTHONDONTWRITEBYTECODE=1 python3 scripts/validate.py
```

This validates source/runtime bindings and proves that the passing fixture is
accepted while the deliberately malformed fixture is rejected.

## Run live bounded check

```bash
PYTHONDONTWRITEBYTECODE=1 python3 run.py
```

The local CBMC and CRABS checkouts live under ignored `.formal-tools/`. No run
grants product approval, security certification, runtime admission,
publication, release, deployment, or upstream-change authority.

CBMC preprocesses the C inputs with the exact GCC executable bound in
`source-manifest.json`. The runner exposes that compiler under the name `gcc`
in a private temporary path; it does not inherit other executables from the
host `PATH`.

The result normalizer recognizes a counterexample only when CBMC marks the
named commutativity assertion as `FAILURE`. A failure of an unwind, memory,
overflow, pointer, harness, or preprocessing property is `NOT_EVALUABLE` for
this obligation.

The live CBMC command selects only `main.assertion.1`, the named obligation
property, and requests a compact counterexample trace. This keeps the stored
provider output inside the fixed 1 MiB evidence ceiling.

Run records are append-only. If a stored normalization is later found wrong,
`evidence/corrections.jsonl` records the corrected interpretation and the
replacement run without changing the historical bytes.
