# TASK-OEWFR-03: Terminal Evidence Admission

## Objective

Predeclare the producer output and consumer reference before any future
attempt can be admitted. This task does not select a compatibility repair.

## SWU-OEWFR-006 — bounded terminal output slot

- Primary behavior: add one mutually exclusive failure-evidence output slot to
  the parent OEWSN admission and closeout inventories.
- Acceptance boundary: planning validators accept exact normalized path,
  schema, size/redaction ceilings, producer, collision, and exclusivity rules.
- Split analysis: these fields form one admission decision; partial admission
  would be unsafe and unusable.
- Dependencies: 004 (stable producer reference shape).
- Write scope:
  - `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/MUTATION-ADMISSION-CONTRACT.json`
  - `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/CLOSEOUT-SYNC-INVENTORY.json`
- Rules: slot is failure-only and mutually exclusive with success outputs; no
  undeclared output, raw stream, workspace, environment, retry, or authority.
- Done: exact JSON/schema checks pass and no unrelated planning row changes.
- Validation: canonical JSON parse, target diff allowlist, path/bounds negative
  fixtures, scoped diff check.
- Owner: task-session or local-fallback.

## SWU-OEWFR-007 — generic terminal reference join

- Primary behavior: declare the consumer-visible evidence reference and its
  missing/invalid negative behavior in the parent OEWSN work-pack/task.
- Acceptance boundary: one generic reference contract is navigable and remains
  BLOCK when absent or invalid.
- Split analysis: field declaration and fail-closed negative case are one
  consumer contract; either alone is vacuous.
- Dependencies: 006.
- Write scope:
  - parent OEWSN `planning/WORK-PACK.md`
  - parent OEWSN `planning/work-pack/tasks/TASK-OEWSN-01B-SEMANTIC-BUILD-EVOLUTION.md`
- Fields: status, normalized path, SHA-256, schema, producer, gate, issue,
  unavailable reason; join authorization consumed/retry state and final cleanup
  result without importing private record internals.
- Edge cases: missing artifact, stale digest, wrong producer/schema/path,
  evidence present with success status, observer recommendation presented as
  authority.
- Done: V09-V11 review/fixture contract passes; public Task Session source is
  unchanged.
- Validation: link/field/authority checks and scoped diff check.
- Owner: task-session or local-fallback.

## Compatibility boundary

After this task and W4 verification, route
[COMPATIBILITY-DECISION-PACKET.md](../../../design/COMPATIBILITY-DECISION-PACKET.md)
to Decision Gate. No repair SWU may be authored or executed until that owner
receipt exists and Invoke Refresh admits its exact branch.

