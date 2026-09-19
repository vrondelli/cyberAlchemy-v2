---
artifact_id: CONTEXT-UIR-012-v1
task: SWU-UIR-012
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-12
---

# SWU-UIR-012 Context Pack

## Objective

Publish immutable corpus generation 002 as a successor to generation 001.
Corpus v2 may use `observed-absent` only when a valid SWU-UIR-011 bounded-search
receipt proves a complete zero-match search over the exact pinned source and
selector. Every drift or incomplete proof remains `not-observed`.

## Authority Order

1. `work-pack/tasks/TASK-UIR-ABSENCE.md` SWU-UIR-012.
2. Accepted `runs/SWU-UIR-011/receipt.json` and DEC-UIR-007.
3. `contracts/corpus-receipt-v2.schema.yml` and bounded-search v1 contract.
4. Corpus generation 001 and `fixtures/contracts/corpus-manifest.json`.
5. Canonical envelope and immutable publisher conventions.

## Selected Evidence

| Source | Obligation |
| --- | --- |
| `work-pack/tasks/TASK-UIR-ABSENCE.md` | Algorithm, failures, write scope, done criteria |
| `runs/SWU-UIR-011/receipt.json` | Accepted bounded-search dependency |
| `contracts/bounded-search-receipt.schema.yml` | Complete finite-search semantics |
| `evidence/bounded-search-receipt.mjs` | Valid proof constructor |
| `contracts/corpus-receipt-v2.schema.yml` | Corpus-v2 absence-handle rule |
| `fixtures/contracts/corpus-manifest.json` | Pinned fact universe |
| `evidence/results/corpus/generation-001/receipts.json` | Immutable predecessor |
| `evidence/build-corpus-generation.mjs` | Existing publisher convention |
| `evidence/corpus-receipt.mjs` | v1 source-fact compatibility floor |
| `tests/corpus-receipt.test.mjs` | v1 regression surface |

## Obligation Coverage

| ID | Required proof | Coverage |
| --- | --- | --- |
| O1 | Generation 001 schema and normalized envelope handles verify | complete |
| O2 | Generation 001 byte digest is captured before mutation | complete |
| O3 | Every v2 fact derives from the pinned manifest and current source | complete |
| O4 | Every `observed-absent` fact has an aligned complete bounded-search handle | complete |
| O5 | Missing, invalid, stale, partial, or mismatched proof remains `not-observed` or rejects | complete |
| O6 | Generation 002 points to generation 001 as predecessor | complete |
| O7 | Identical replay is a no-op; non-identical overwrite fails | complete |
| O8 | Generation 001 writes are rejected and its bytes remain unchanged | complete |
| O9 | Mutation stays inside SWU-UIR-012 scope plus run/sync evidence | complete |

## Predecessor Baseline

- schema: `ui-repair.corpus-generation.v1`
- record: `record:sha256:2334cc9e976602901bcd538bdf236a177f838d70e2f2c83d8b6ce197cff2bae3`
- content: `sha256:1b53cef85b3d0dbcc6e7057f08f3fac4e03d38d2294f640b4ed52d0b6ef4c17b`
- generation: `generation:sha256:858c0d94070258dc1db5eccf945e1965409ed4b85f5c442600d04f27336aaa85`
- byte digest: `sha256:72f49516b741cf31b3f7fb930a67ca9144b43d04a27f0b2031cd231c51bff03f`

The generation wrapper replaces the generic envelope `schema_version` with a
generation schema. Verification therefore first requires the generation schema
and then validates a normalized envelope view with all semantic and identity
fields unchanged.

## Gate Verdict

`PASS`. SWU-UIR-011 is accepted, generation 001 verifies, the manifest is
pinned, and no human-owned choice is required. The only eligible absence target
is the manifest entry whose pinned source is current and whose missing literal
selector receives an aligned complete zero-match bounded-search receipt.

## Mutation Boundary

- `evidence/corpus-receipt-v2.mjs`
- `evidence/build-corpus-v2-generation.mjs`
- `fixtures/contracts/corpus-v2-*`
- `evidence/results/corpus/generation-002/`
- `tests/corpus-receipt-v2.test.mjs`
- SWU-UIR-012 run evidence and synchronized work-pack evidence

Generation 001, corpus receipt v1, the original manifest, candidate state, and
canonical DomainSpec authority are immutable inputs.
