---
task_session: SWU-CDSC2-005A
status: accepted
strict_coverage: pass
runtime: local
adapter: none
source_count: 12
---

# Context Pack: SWU-CDSC2-005A

## Selected Scope

Implement only the three-layer adjudication contract, direct validator,
deterministic v1 compatibility materializer, contract vectors, and focused
tests. Do not write adjudication evidence, evaluate F3, append generation 2, or
change any parent/source artifact.

## Controlling Sources

- Refreshed work-pack and SWU-CDSC2-005A task contract.
- `THREE-LAYER-PROTOCOL.md` and resolved `DEC-CDSC2-009`.
- Parent evidence receipt schema, validator, canonical envelope helper, and
  fixture evaluator.
- Generation-2 observation schema and direct validator.
- Frozen parent F3, M1, and M2 receipts.
- Protected generation-1 manifest.
- Existing generation-2 contract-test conventions.

## Hard Constraints

- Parent F3, M1, M2, evaluator, and generation-1 artifacts are read-only.
- Overlay input handles are exactly parent F3, M1, and M2 record IDs.
- Parent explanation IDs and permitted/breaking substitution IDs are closed
  sets for this overlay.
- M1 binds only permitted; M2 binds only breaking.
- Matrix cardinality is exactly `parent.A.length * 2`.
- Structural coverage controls state: `full -> explained`, `none ->
  not-explained`, and `partial|disputed -> indeterminate`.
- A disputed review cannot be represented as approved or determinate.
- Each cell's target provenance is the canonical digest of the parent
  substitution description/prediction, never an observation string.
- Every parent and observation uncertainty must be resolved or carried; none
  may disappear silently.
- Materialized Q06/Q07 statements derive only from parent `S`.
- Parent v1 validation must accept the materialized projection.

## Implementation Path

1. Add one JSON-Schema-compatible overlay contract.
2. Add a direct validator with schema-parity-exported enums and cross-layer
   handle/provenance/cardinality checks.
3. Add a pure materializer that builds and validates a v1 compatibility
   envelope.
4. Add declarative negative-vector metadata and focused executable tests.
5. Run focused, full generation-2, and protected-byte checks.

## Decisions

Blocker decisions: none. The user approved execution by invoking Task Session
on the exact ready SWU.

Assumptions: structural coverage and target-provenance fields are the minimum
machine-checkable additions needed to implement the protocol's explicit
partial/disputed and outcome-derived-target rejection rules.

## Validation Surface

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/adjudication-contract.test.mjs
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/*.test.mjs
```

No runtime handoff pack is needed because execution is local and no subagent is
spawned.
