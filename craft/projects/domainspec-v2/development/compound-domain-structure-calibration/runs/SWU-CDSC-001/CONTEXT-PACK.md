---
task_session: SWU-CDSC-001
mode: local
coverage: strict-local
status: ready
source_count: 9
---

# Context Pack: SWU-CDSC-001

## Selected Unit

Freeze the versioned contract family, generation-1 fixture manifest, source
selectors and digests, semantic-field policy, generation identity, and golden
vectors. Do not implement the evaluator or author fixture predicate judgments.

## Controlling Sources

1. `../../WORK-PACK.md` - selected ready SWU and runtime boundary.
2. `../../work-pack/tasks/TASK-CDSC-CONTRACTS.md` - exact deliverables, ordered
   rules, write scope, done criteria, and verification.
3. `../../SPEC.md` - envelope, fixtures, outcomes, acceptance, invariants, and
   prohibited authority claims.
4. `../../ARCHITECTURE.md` - data contracts and deterministic ownership split.
5. `../../DECISION-LEDGER.md` - fixed planning decisions.
6. `../../../ui-meta-type-repair/research/2026-07-11-compound-domain-structures/findings.md`
   - accepted evidence and selector boundary.
7. `../../../ui-meta-type-repair/contracts/record-envelope.schema.yml` - local
   JSON-Schema-in-YAML-path precedent.
8. `../../../ui-meta-type-repair/contracts/canonical-json-v1.mjs` - canonical
   JSON, SHA-256, record ID, and generation ID precedent.
9. The exact F1/F2/F3 selectors named by the task contract, read-only.

## Hard Constraints

- Write only `contracts/`, `fixtures/`, `tests/contracts.test.mjs`, and this
  Task Session evidence folder.
- GoldenQuill, Savvy, DS-D1, DS-D8, accepted research, and prior UI repair are
  read-only.
- Freeze exactly F1, F2, and F3 for generation 1.
- Predicate state admits `explained`, `not-explained`, and `indeterminate`;
  `indeterminate` is never treated as either of the first two.
- Require finite nonempty `A` and `Q` plus unique total `A x Q` coordinates.
- Every result contract carries prohibited inferences.
- Semantic and volatile fields are explicit and disjoint.
- Generation 1 has no predecessor and later generations must name one.

## Implementation Choice

Use JSON Schema draft 2020-12 documents serialized as JSON in `.yml` paths,
matching the existing repository precedent. Use
`source-slice-sha256-v1`: normalize source line endings to LF, select the exact
1-based inclusive ranges in declared order, retain a final LF, and SHA-256 the
resulting UTF-8 bytes. Bundle digests use sorted canonical JSON.

This avoids adding a YAML or schema-validator dependency in the contract-only
SWU while keeping every artifact machine-readable and later evaluator-ready.

## Validation Surface

- Parse every contract and fixture document as JSON.
- Verify semantic/volatile field declarations are disjoint.
- Verify exactly three fixture IDs and all pinned source paths/ranges/digests.
- Verify valid, missing, duplicate, conflict, unknown-version, digest-drift,
  field-order, and semantic/volatile mutation vectors.
- Verify no source repository diff and run `git diff --check` on the package.

## Gate Result

`PASS`: dependencies are empty, sources exist, write scope is explicit,
verification is available, and no blocker-level decision remains.
