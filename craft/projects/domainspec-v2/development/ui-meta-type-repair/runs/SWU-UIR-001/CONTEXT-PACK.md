---
artifact_id: CONTEXT-UIR-001-v1
task: SWU-UIR-001
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-001 Context Pack

## Summary

- Files selected: 8.
- Selector groups: 11.
- Obligation coverage: 100 percent.
- Handoff pack: none; local execution.
- Noise ratio: low; every source closes a named obligation.
- Blockers: none.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Separate semantic content from volatile and lineage fields. | `EVIDENCE-CONTRACTS.md#Kernel`; `ARCHITECTURE.md#3-Low-Level-Component-View` | covered |
| O2 | Implement `canonical-json-v1` and `sha256-v1`. | `DECISION-LEDGER.md#DEC-UIR-001`; `EVIDENCE-CONTRACTS.md#Kernel` | covered |
| O3 | Derive stable record and generation identities with no-op behavior. | `TASK-UIR-CONTRACTS.md#SWU-UIR-001`; `SPEC.md#Invariants` | covered |
| O4 | Provide schemas for headers, semantic fields, lineage, outcomes, and code references. | `TASK-UIR-CONTRACTS.md#SWU-UIR-001`; prior `result.schema.yml#required_fields` | covered |
| O5 | Provide positive, malformed, field-order, timestamp, and predecessor vectors. | `TASK-UIR-CONTRACTS.md#SWU-UIR-001` | covered |
| O6 | Keep candidate, shared validator, DS-D1, DS-D8, and prior UIF evidence read-only. | `SPEC.md#Scope`; `work-pack/shared/context.md` | covered |
| O7 | Validate schema shape, digest sensitivity, lineage separation, and deterministic rerun. | `WORK-PACK.md#Global-Done-Contract`; `impl/package.json#scripts` | covered |

## Included Context

- `work-pack/tasks/TASK-UIR-CONTRACTS.md` - O2-O5 - SWU-UIR-001 contract, ordered rules, scope, and done criteria.
- `work-pack/shared/context.md` - O6 - authority and promotion boundary.
- `SPEC.md` - O1, O3, O6 - invariants, AC-01, and prohibited inferences.
- `EVIDENCE-CONTRACTS.md` - O1-O4 - selected canonicalization, digest, and lineage behavior.
- `ARCHITECTURE.md` - O1, O3 - canonicalizer, digester, allocator, and failure states.
- `DECISION-LEDGER.md` - O2 - ratified W0 policy and assumptions.
- `../ui-meta-type-formalization/experiments/result.schema.yml` - O4 - repository-owned machine contract precedent.
- `impl/package.json` - O7 - Node/TypeScript test and aggregate validation conventions.

## Execution Constraints

- Write only `contracts/`, `fixtures/contracts/`, `tests/`, and this SWU run folder.
- Use a dependency-free development reference implementation.
- Treat missing and `null` as distinct; preserve array order and string bytes.
- Reject unsafe integers, non-finite numbers, `undefined`, sparse arrays, and
  non-plain objects.
- Keep timestamps, storage paths, lineage, and invalidation out of content digest.
- Require sorted unique input handles so generation identity is unambiguous.
- This SWU does not implement `attribute-nonempty/v1`, shared validator changes,
  duplicate parsing, mutation ledgers, or candidate status changes.

## Validation Surface

1. `node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/contract-kernel.test.mjs`.
2. JSON parse every JSON-formatted `.schema.yml` and fixture.
3. `npm --prefix projects/domainspec-v2/impl run validate:docs`.
4. `git diff --check` over the scoped files.

## Excluded Candidates

- Shared validator and instance files: SWU-UIR-002/003 owned; read-only now.
- Candidate schemas and prior replication results: immutable inputs; no O1-O7 write need.
- DS-D1 and DS-D8 authority: external owner surfaces.
- Generic architecture research: no uncovered obligation remained.
