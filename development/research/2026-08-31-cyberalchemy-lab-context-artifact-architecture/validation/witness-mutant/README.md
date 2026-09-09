# CyberAlchemy-lab Witness And Mutant Validation

This package executes the next non-effectful validation gate identified by the
accepted context-and-artifact architecture research. It tests a synthetic
candidate contract; it is not CyberAlchemy-lab source or tooling.

## Validation object

The positive witness contains:

- one owner-local artifact type and matching artifact instance;
- machine-canonical source direction with an exact generated human projection;
- one separately identified capability instance and CAV2 Context;
- one explicit typed relation across two context identities;
- one bounded recursive parent/instance envelope with stop, recomposition, and
  terminal handoff;
- an explicit `not_admitted` source posture and `authority_effect: none`.

`fixtures/cases.jsonl` applies eight isolated mutants to that witness:

1. hand-edited projection;
2. schema digest drift;
3. wrong artifact-type binding;
4. missing semantic owner;
5. stale generator;
6. hidden cross-context dependency;
7. recursion without stop or recomposition;
8. source discovery presented as admission.

## Run

From the repository root:

```bash
python3 cyberAlchemy-v2/development/research/2026-08-31-cyberalchemy-lab-context-artifact-architecture/validation/witness-mutant/scripts/validate.py
```

The validator uses only the Python standard library. It emits a deterministic
JSON result to standard output and does not write to CyberAlchemy-lab.

## Four facets

- Classification: `protocol.json` identifies this as synthetic, non-effectful
  witness-and-mutant validation.
- Schema: `schemas/witness-case.schema.json` declares the JSONL case shape;
  the validator enforces that shape and the candidate's cross-record rules.
- Human continuation: this README and the run receipt state purpose, boundaries,
  result, blockers, and next route.
- Machine view: `protocol.json`, the positive JSON witness, JSONL cases, exact
  digests, deterministic validator output, and the run receipt are parseable.

## Claim ceiling

A passing run proves only that this local synthetic validator accepts the one
positive witness and rejects the eight named mutants for the reasons declared.
It does not select the repository architecture, admit CyberAlchemy-v2 source,
constitute an owner, create a Lab artifact type, implement a Lab generator or
validator, prove runtime enforcement, satisfy D64 or D65, publish, release,
deploy, or establish `v1.0.0`.
