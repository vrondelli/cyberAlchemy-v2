# SWU-SGRM-005 Context Pack

## Envelope

- mode: standard-strict
- task: `SWU-SGRM-005`
- runtime: local
- delegation: none
- dependencies: SGRM-002 PASS; SGRM-004 PASS
- write scope: relationship fixtures, relationship/content/non-collapse tests,
  non-collapse CLI acceptance checks, and run/status evidence

## Selected Sources

| Source | Controlling obligation |
|---|---|
| `work-pack/tasks/TASK-SGRM-IMPLEMENTATION.md#swu-sgrm-005-relationship-and-non-collapse-migration` | Ordered rules, boundaries, done criteria, validation. |
| `WORK-PACK.md` | Ready state and implementation-layer completion gate. |
| `runs/SWU-SGRM-004/TASK-SESSION-RESULT.md` | Proves Saga schema/card/fixtures are absent and Workflow replacement validates. |
| `spec/__fixtures__/relationships/valid/SPEC.md` | Already-migrated positive Workflow edge to preserve. |
| `tools/tests/validate-relationships.test.ts` | Positive root-count lock and negative fixture routing. |
| `tools/tests/validate-content.test.ts` | Deleted Saga fixture request to remove. |
| `tools/tests/validate-meta-types-noncollapse.test.ts` | Generic invariants plus remaining synthetic Saga/Workflow naming. |
| `tools/validate-meta-types-noncollapse.ts` | Current zero-collapse registry baseline, already migrated in SGRM-003. |

## Execution Obligations

1. Preserve the valid Workflow `orchestrates` fixture and 30-signature lock.
2. Add a negative relationship fixture proving a Saga source is unconstructible.
3. Remove the deleted Saga fixture request from content tests.
4. Replace Saga/Workflow names in the anti-attestation test with generic
   coordinators while preserving identical behavior and edge participation.
5. Remove commentary/assertions that encode the historical pair as a special
   non-collapse baseline.
6. Preserve fresh-duplicate, attestation permutation, exception-lane,
   structural witness, edge witness, classification-totality, and real-registry
   zero-collapse coverage.
7. Do not change canonical authority, schemas, cards, generators, or production
   validators unless a test exposes a genuine generic defect.

## Validation

- Focused relationship negative/positive tests.
- Focused non-collapse generic and real-registry tests.
- `npm --prefix projects/domainspec-v2/impl run validate:rels`
- `npm --prefix projects/domainspec-v2/impl run tools:test`
- `npm --prefix projects/domainspec-v2/impl run typecheck`
- `npm --prefix projects/domainspec-v2/impl run validate`
- Scoped Saga scan distinguishes the intentional negative proof from stale
  positive/acceptance hard-codes.

## Coverage Result

PASS. Every remaining scoped reference has a required treatment, and every
generic invariant has an explicit preservation check.
