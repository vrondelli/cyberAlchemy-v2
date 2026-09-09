# Intent-schema evidence mechanics dry run

Status: **pass** for `g4-evidence-mechanics`.

The dependency-light Node validator accepted one known-valid append-only JSONL
row and rejected three focused known-invalid rows with the expected rules:

| Case | Expected / actual exit | Expected / observed rules | Result |
|---|---:|---|---|
| valid candidate row | `0 / 0` | none / none | pass |
| missing run metadata | `1 / 1` | `ROW-002` / `ROW-002` | pass |
| malformed provenance | `1 / 1` | `ROW-020` / `ROW-020` | pass |
| hidden/defaulted semantics | `1 / 1` | `INT-002`, `INT-006` / `INT-002`, `INT-006` | pass |

Both JSON schemas parsed, the validator passed Node syntax checking, and the
validator resolved the row schema's sibling candidate intent-record schema.
The rule catalog documents its exact rejection surface.

## Evidence boundary

This result preserves CAV2-D56. It proves only synthetic JSON shape and the
mechanical enforcement of declared invariants. Fixtures are **not live empirical
evidence**. They do not establish that populated intent values are true, that
the candidate fields are fit, that the semantic evaluator works, that the
reasoning engine works, or that any anti-bias mechanism is effective.

## Remaining residue and handoff

Manifest cardinality, live source-lock checks, field postures, pressure metrics,
and held-out behavior remain untested. Because `g4` passes with no blocker, the
only next route is Task Session executing `SWU-INTENT-001` against the unchanged
schemas and validator. Any mechanics change after the live-run freeze requires a
new run identity.
