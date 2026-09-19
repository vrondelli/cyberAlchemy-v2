---
artifact_id: CONTEXT-UIR-011-v1
task: SWU-UIR-011
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-12
---

# SWU-UIR-011 Context Pack

## Objective

Define the only construction path that may emit `observed-absent`: a complete,
finite, digest-pinned search with exactly one successful result for every
declared selector and no parse, extraction, traversal, or drift failure.

## Authority Order

1. `DECISION-LEDGER.md` DEC-UIR-007 and its closed decision gate.
2. `work-pack/tasks/TASK-UIR-ABSENCE.md`.
3. The approved refresh and successor implementation plan.
4. `contracts/canonical-json-v1.mjs` for envelope identity and lineage.
5. Corpus receipt v1 schema, constructor, and tests as the compatibility floor.

## Selected Evidence

| Source | Obligation |
| --- | --- |
| `work-pack/tasks/TASK-UIR-ABSENCE.md` | Algorithm, edge cases, write scope, done criteria |
| `WORK-PACK.md` | Dependency state and successor order |
| `IMPLEMENTATION-PLAN.md` | Layer and verification placement |
| `IMPLEMENTATION-LAYERING.md` | L0S boundary and stop conditions |
| `DECISION-LEDGER.md#DEC-UIR-007` | Authorized bounded-absence semantics |
| `GAP-LEDGER.md#GAP-UIR-004` | Gap being partially repaired |
| `contracts/canonical-json-v1.mjs` | Canonical semantic envelope |
| `contracts/corpus-receipt.schema.yml` | v1 compatibility boundary |
| `evidence/corpus-receipt.mjs` | Existing receipt-construction convention |
| `tests/contract-kernel.test.mjs` | Contract closure convention |
| `tests/corpus-receipt.test.mjs` | v1 regression surface |

## Obligation Coverage

| ID | Required proof | Selected evidence | Coverage |
| --- | --- | --- | --- |
| O1 | Universe is finite, nonempty, and fully declared | task, DEC-UIR-007 | complete |
| O2 | Source revisions, file digests, and extractor identity are pinned | task, DEC-UIR-007 | complete |
| O3 | Every declared selector has exactly one result | task | complete |
| O4 | Incomplete, stale, duplicate, or erroneous searches cannot emit absence | task, DEC-UIR-007 | complete |
| O5 | Complete zero-match and positive-match states are distinguished | task | complete |
| O6 | Semantic identity covers universe, extractor, selectors, outcomes, and state | task, canonical kernel | complete |
| O7 | Corpus receipt v1 remains unchanged | task, v1 schema/module/tests | complete |
| O8 | Mutation remains inside the declared SWU scope | task | complete |
| O9 | Focused and regression validation are executable | task, tests | complete |

## Gate Verdict

`PASS`. DEC-UIR-007 is closed, dependencies SWU-UIR-001 through SWU-UIR-003
and SWU-UIR-006 are accepted, the task has a total algorithm, and no new
human-owned choice is required.

Malformed contract structures fail validation. Well-formed but incomplete,
drifted, or error-bearing searches construct `not-observed` with typed failure
reasons. Only complete zero-match searches construct `observed-absent`.

## Mutation Boundary

- `contracts/bounded-search-receipt.schema.yml`
- `contracts/corpus-receipt-v2.schema.yml`
- `evidence/bounded-search-receipt.mjs`
- `fixtures/contracts/bounded-search-*`
- `tests/bounded-search-receipt.test.mjs`
- SWU-UIR-011 run evidence and synchronized work-pack evidence

No canonical DomainSpec definition, candidate disposition, DS-D1/DS-D8
authority, or corpus receipt v1 artifact may be changed by this unit.
