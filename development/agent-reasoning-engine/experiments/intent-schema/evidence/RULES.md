# Intent-schema mechanics rule catalog

This catalog belongs only to the private `intent-schema-population@1`
experiment. The validator is deterministic, dependency-free beyond the Node.js
standard library, and reads append-only JSONL without changing its input.

| Rule | Rejection condition |
|---|---|
| `SCHEMA-001` | A named schema cannot be read or parsed. |
| `SCHEMA-002` | The run-row schema identity is not the frozen candidate identity. |
| `SCHEMA-003` | The row schema does not name one sibling intent-record schema. |
| `SCHEMA-004` | The referenced intent-record schema identity is unexpected. |
| `ROW-001` | A JSONL row cannot be read or parsed. |
| `ROW-002` | Required run metadata is absent or an undeclared top-level property appears. |
| `ROW-010` | A run/sample identity, assignment, stratum, or append-only pending status is invalid. |
| `ROW-020` | Source provenance is missing or malformed. |
| `ROW-030` | A sample identity is duplicated. |
| `INT-001` | The intent envelope or raw-intent metadata is malformed. |
| `INT-002` | One of the seven semantic fields is absent or a hidden eighth field appears. |
| `INT-003` | A field-value envelope is malformed or contains hidden glue. |
| `INT-004` | A declared/inferred value lacks value or evidence. |
| `INT-005` | An inference note is missing where required or supplied for a declaration. |
| `INT-006` | An unresolved field silently carries a value, evidence, or inference. |
| `INT-007` | With a manifest, field evidence does not resolve through the frozen selector. |
| `INT-008` | Revision evidence is malformed. |
| `OBS-001` | An observation is outside the registered shape or vocabulary. |
| `ACT-001` | A field action is malformed or claims an owner decision before g6. |
| `MANIFEST-001`–`006` | The frozen 12+3 manifest, assignments, coverage, or source locks fail. |

Passing these rules proves only JSON shape and explicitly encoded invariant
behavior (CAV2-D56). It cannot prove that a populated value is true, that the
seven-field candidate is fit, or that any evaluator, reasoning engine, or
anti-bias mechanism is effective. Synthetic fixtures are not live empirical
evidence.
