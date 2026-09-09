# UOVARR-002 Candidate-Local Prototype Validation Report

- Status: `prototype_validated`
- Resolution mode: Task Session `resume-nearest`
- Resolved unit: `UOVARR-002`
- Execution lane: Candidate-Local Prototype Fast Lane
- Context pack: `CONTEXT-PACK.md`
- Deferred-governance notice: `HN-6F980FB7517C`

## Implemented outcome

The OEW source-bound compatibility adapter now:

- accepts only legacy `oew.knowledge-scene.v1` and `v1.1` identities;
- validates the exact compiled SourceGraph content, index, digest, and receipt;
- validates an immutable admitted ViewPack plus its graph/view identity and receipt;
- recomputes the expected scene relation boundary from visible nodes and SourceGraph endpoints;
- rejects missing, extra, duplicate, wrong-partition, drifted, wrong-graph, and wrong-ViewPack inputs;
- compares predicate, endpoints, direction, presentation cues, evidence, mapping loss, and authority effect by exact relation ID;
- rebuilds v1.2 partition relations from SourceGraph-owned objects;
- emits a deterministic, separately identified v1.2 scene and authority-none migration receipt;
- leaves the legacy artifact unfrozen, unedited, and unrelabelled.

No loader/admission entrypoint was changed because UOVARR-002 did not bind an exact loader target.

## Exact product targets

| Target | Baseline | Final SHA-256 |
|---|---|---|
| `upstream/overlay/packages/dashboard/src/oew/scene/sceneMigration.ts` | absent | `577ad48fca1fc82b737c8d533a6077b464ef84fb2b6c46cf6faa733b764f1cb4` |
| `test/relation-migration.test.mjs` | absent | `0f02fccfcd7658fe056c73dabe9391cb3c00b8af1d7510bf46209eaa0253c037` |

## Acceptance-critical validation

1. `node --experimental-strip-types --test test/relation-migration.test.mjs`
   - PASS: 14 tests, 0 failed, 0 skipped.
   - Covers v1 and v1.1 success, deterministic replay, immutable source-object reuse, noncanonical ViewPack source order, graph/ViewPack/schema mismatch, predicate/endpoint/cue/evidence/mapping/authority drift, missing/extra/duplicate/wrong partition, and forged compiled inputs.

2. `npm test`
   - PASS: 171 tests, 170 passed, 0 failed, 1 intentional canonical-probe skip.

3. Exact two-target `git diff --check`
   - PASS.
   - Direct trailing-whitespace scan: PASS.

## Task Session and claim boundary

The ordinary Task Session admission projection still lacks a synchronized UOVARR-001 terminal/owner-closeout chain and remains on its stale pre-fast-lane cursor. The user's explicit instruction to defer governance activated the repository fast lane, so this did not interrupt product implementation or validation.

This report proves bounded candidate-local UOVARR-002 product behavior only. It is not a governed Task Session closeout, successor selection, Git publication, deployment, promotion, release, browser acceptance, or production-readiness claim.

## Deferred governance

- Notice: `.arcanum/handoff-notices/notices/HN-6F980FB7517C.md`
- JSON: `.arcanum/handoff-notices/notices/HN-6F980FB7517C.json`
- Publish receipt: `.arcanum/handoff-notices/receipts/HN-6F980FB7517C-publish-receipt.json`
- Notice digest: `6f980fb7517c011f7720af9640abfd80082df9354d903ff1dff5b2bde76cd3d9`
