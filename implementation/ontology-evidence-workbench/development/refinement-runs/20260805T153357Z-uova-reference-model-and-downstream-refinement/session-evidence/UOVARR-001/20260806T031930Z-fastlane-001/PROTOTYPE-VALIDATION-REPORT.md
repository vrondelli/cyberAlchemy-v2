# UOVARR-001 Candidate-Local Prototype Validation Report

- Status: `prototype_validated`
- Execution lane: Candidate-Local Prototype Fast Lane
- Scope: `UOVARR-001` only
- Task: `stages/09-invoke-plan/tasks/TASK-UOVARR-001-SCENE-REFERENCE-CORE.md`
- Validated at: `2026-08-06T03:19:30Z`

## Implemented outcome

The OEW scene-reference core now:

- emits KnowledgeScene `v1.2` with a domain-separated canonical scene digest;
- constructs one immutable, non-serialized exact-object relation index over the internal/cut union;
- emits and validates a digest-bound relation-index receipt;
- preserves parallel same-tuple relations by exact source relation ID;
- resolves relation references as typed `resolved`, `missing`, or `stale-scene` results without tuple fallback;
- rejects duplicate IDs, union/index/count/order/digest drift, copied index objects, stale content, and stale navigation-frame back-references.

## Exact product targets

| Target | Final SHA-256 |
|---|---|
| `upstream/overlay/packages/dashboard/src/oew/scene/sceneQuery.ts` | `2b49a9a76f148208e6e1533fcc6c8da7ea069c6eaf22baea231696a48aaf6db6` |
| `upstream/overlay/packages/dashboard/src/oew/types.ts` | `c6b58729f05a47aff7ec581f866b59d1f156a42ef1d7d57fe2b6c58a010bcd25` |
| `upstream/overlay/packages/dashboard/src/oew/scene/relationReference.ts` | `0e1b59e6f723d3f94c47af163dd147867a74a20a850df8655e92e400642902f1` |
| `test/relation-reference.test.mjs` | `d2ee7520550f1405c5457199658a7462b366be5aa972b01d739c1b4afd1bc15d` |
| `test/scene-partition.test.mjs` | `2ca4f0feb1b4859a68c24a484672f6cb48fe7bf6048b7b3447954ac307418588` |

## Validation

1. Focused relation-reference and scene-partition suite:
   `node --experimental-strip-types --test test/relation-reference.test.mjs test/scene-partition.test.mjs`
   - Result: PASS
   - Tests: 12 passed, 0 failed, 0 skipped

2. Full OEW regression suite:
   `npm test`
   - Result: PASS
   - Tests: 157 total, 156 passed, 0 failed, 1 intentionally skipped canonical probe

3. Exact-target whitespace validation:
   `git diff --check -- <five declared targets>`
   - Result: PASS
   - Direct trailing-whitespace scan over all five targets: PASS

The first full-suite attempt exposed that exported TypeScript-only declarations in `types.ts` broke existing raw-JavaScript data-URL consumers. The declarations were changed to JSDoc typedefs, the affected compatibility tests passed, and the final full suite above was rerun successfully.

## Deferred work and claim boundary

Lifecycle admission, synchronized governance receipts, Git publication, deployment, and browser acceptance were intentionally deferred. This report proves the bounded candidate-local implementation and its declared automated validation only; it is not release, deployment, promotion, or production-readiness evidence.

Deferred-governance Handoff Notice: `HN-C34A68F97D8A`

- Notice: `.arcanum/handoff-notices/notices/HN-C34A68F97D8A.md`
- Machine-readable notice: `.arcanum/handoff-notices/notices/HN-C34A68F97D8A.json`
- Publish receipt: `.arcanum/handoff-notices/receipts/HN-C34A68F97D8A-publish-receipt.json`
- Notice digest: `c34a68f97d8a067783aeac64999f55849b0bfc78eec5f0c7b4cb1e88f3d05e26`
