---
task_id: TASK-FPR01-003-REMEDIATION
owner_node: FPR-01
layer: L1
status: completed
---

# TASK-FPR01-003-REMEDIATION

## Objective

Close the two remaining repository-level blockers recorded by `SWU-FPR01-003`, then
replay its already-implemented baseline package. This task repairs validation inputs;
it does not reopen the accepted meta-type decision, ratify FPR-01, select
`SWU-FPR01-004`, or grant production authority.

## Layer And Slice

- Parent slice: `S-001R`, remediation inside FPR-01.
- Parent wave: [W1](../waves/W1-AUTHORITY-BASELINE.md).
- Nested wave: [W1R](../waves/W1R-FPR01-003-REMEDIATION.md).
- Layer decision: after this task, we know whether the existing FPR01-003 package can
  pass against current repository evidence without broad exceptions or invented
  sample semantics.

## Source Contracts

- [Blocked FPR01-003 receipt](../../runs/SWU-FPR01-003/TASK-SESSION-RESULT.md)
- [Completed definitions reconciliation](../../../../../definitions/reviews/2026-07-16-fpr01-meta-type-reconciliation.md)
- [FPR-01 task contract](TASK-FPR-01-AUTHORITY-BASELINE.md)
- [Accepted owner dispositions](../../../evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md)
- `projects/domainspec-v2/impl/tools/retired-orchestration-reference-allowlist.json`
- `projects/domainspec-v2/development/saga-removal/runs/SWU-SGRM-001/ACTIVE-REFERENCE-MANIFEST.json`
- `projects/domainspec-v2/impl/tools/audit-retired-orchestration-references.ts`
- `projects/domainspec-v2/impl/tools/tests/audit-retired-orchestration-references.test.ts`
- `projects/domainspec-v2/impl/spec/features/sample/SPEC.md`
- `projects/domainspec-v2/impl/test-derivation-engine/src/grammar/index.ts#parseNormalizedSpec`

## Current Blocker State

- `BLK-FPR01003-001` is closed by Definitions Governance. The canonical validator now
  passes twice with normalized SHA-256
  `91de9e042b564e1bf85582e8ac360e55e1cafde101f960cbabfb231444b9df7c`.
- `BLK-FPR01003-002` is closed by the guard repair PASS receipt, SHA-256
  `590a59052aefaed1ace5f9fc0e5bf34786977224aeacdd8f0e0506f5a20ba58f`.
- `BLK-FPR01003-003` is closed by the sample repair PASS receipt, SHA-256
  `290e031fff1e28f3fad5ac3a8db59d82b544f278387f5dbb556991cfd575f375`.

## Smallest Working Units

### SWU-FPR01003-GUARD-001 — Exact Retired-Reference Classification

- Selection: completed.
- Dependencies: completed definitions reconciliation; frozen SGRM manifest available.
- Source anchors: guard receipt `BLK-FPR01003-002`; current seven-row audit output;
  allowlist exception schema; guard classification precedence; focused guard tests.
- Related context: four canonical definition files contain the superseded,
  non-reusable `DS-D1.10` identity; three decision/research files contain
  non-runnable historical or disposition evidence.
- Write scope:
  - `projects/domainspec-v2/impl/tools/retired-orchestration-reference-allowlist.json`
  - `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01003-GUARD-001/`
- Explicitly excluded: frozen manifest, canonical definitions, guard algorithm, guard
  tests, sample spec, blocked FPR01-003 receipt, Craft, and roadmap state. If an
  algorithm or test change is genuinely required, stop and refresh this plan.
- Done criteria:
  1. review every match in all seven files;
  2. either remove a semantically invalid match or pin the exact path, count, digest,
     disposition, and reason;
  3. distinguish canonical superseded-ID documentation from active retired
     orchestration use;
  4. keep the SGRM-001 manifest byte-identical; and
  5. produce zero audit violations with digest-drift and active-reference controls
     still killed.
- Acceptance evidence: line/match review report, before/after allowlist digest,
  frozen-manifest digest equality, clean audit output, and focused test result.
- Validation surface:
  - `npm --prefix projects/domainspec-v2/impl run audit:retired-orchestration`
  - focused `audit-retired-orchestration-references` test
  - `npm --prefix projects/domainspec-v2/impl run typecheck`
- Execution owner: `local-fallback` through Task Session; SGRM guard-owner review.
- Handoff: return a structured PASS/FLAG/BLOCK receipt. Never classify by filename or
  add a wildcard/broad exception.

### SWU-FPR01003-SAMPLE-001 — Minimal Normalized Sample Spec

- Selection: completed through the bounded Task Session route.
- Dependencies: normalized grammar contract and current sample intent.
- Source anchors: `parseNormalizedSpec`; normalized-spec fail-closed test; current
  sample `SPEC.md`; `BLK-FPR01003-003`.
- Related context: the sample explicitly declares no relationships. Normalization must
  not invent workflow, behavior, fields, or edges from prose.
- Write scope:
  - `projects/domainspec-v2/impl/spec/features/sample/SPEC.md`
  - `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01003-SAMPLE-001/`
- Explicitly excluded: parser, engine rules, other feature packs, guard files,
  canonical definitions, FPR receipt, Craft, and roadmap state.
- Done criteria:
  1. add the exact `Concept|Type` Concept Registry table with at least one explicit
     fixture concept;
  2. add the exact `From|Edge|To|Source Evidence` Feature Concept Graph table;
  3. preserve the fixture's declared no-relationship semantics rather than inventing
     an edge; and
  4. make the normalized parser and engine lint deterministic and green.
- Acceptance evidence: focused diff, parsed graph/violation summary, two clean lint
  outputs, and normalized grammar test result.
- Validation surface:
  - `npm --prefix projects/domainspec-v2/impl run engine:lint`
  - focused `normalized-spec` test
  - `npm --prefix projects/domainspec-v2/impl run validate:docs`
- Execution owner: `local-fallback` through Task Session; implementation-content
  owner review.
- Handoff: return a structured PASS/FLAG/BLOCK receipt. Stop if a green result needs
  parser relaxation or an invented semantic edge.

### SWU-FPR01003-REPLAY-001 — Joined FPR01-003 Replay

- Selection: completed after both repair receipts passed.
- Dependencies: `SWU-FPR01003-GUARD-001` PASS and
  `SWU-FPR01003-SAMPLE-001` PASS.
- Source anchors: FPR01-003 blocked receipt; canonical baseline, schema, validator,
  five mutants; repair receipts; current aggregate validation commands.
- Related context: the definitions reconciliation is already complete and must be
  consumed, not reopened.
- Write scope:
  - `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-003/TASK-SESSION-RESULT.md`
  - optional replay evidence under the same run directory.
- Explicitly excluded: baseline implementation unless replay discovers a new defect;
  FPR01-004 receipt; Craft; roadmap; production flags. A new code defect stops the
  replay and returns a named blocker.
- Done criteria:
  1. canonical baseline validates twice with equal normalized digest;
  2. all five mutants remain killed with their distinct exits;
  3. full DomainSpec implementation validation passes;
  4. replay binds exact repair and definitions-reconciliation evidence; and
  5. replace the blocked receipt with PASS only when every declared check is green.
- Acceptance evidence: command matrix, content digests, repeat-run equality, aggregate
  PASS, and a superseding FPR01-003 receipt.
- Validation surface:
  - canonical authority-baseline validator, twice
  - authority-baseline mutant suite
  - `npm --prefix projects/domainspec-v2/impl run validate`
- Execution owner: `local-fallback` through Task Session with independent validation
  review.
- Handoff: PASS routes to a separate Invoke refresh. That refresh may synchronize the
  receipt and select `SWU-FPR01-004`; this SWU may not do either itself.

## Synchronization Rules

1. The two repair SWUs retained disjoint write scopes.
2. The replay consumed both PASS receipts through a strict `join: all`.
3. The replay did not itself mutate Craft or select FPR01-004.
4. The separate apply-approved Invoke refresh synchronized the result and selected
   but did not execute FPR01-004.

## Completion Evidence

This task is closed by the FPR01-003 PASS receipt, SHA-256
`ad4064f890fb3445de642b8a2096a0de6961f89b011cf45e3d43caeed17d68a3`.
It cites both repair receipts, the definitions reconciliation, deterministic
validator results, five killed mutants, aggregate validation, and the unchanged
authority boundary. FPR-01 remains open until `SWU-FPR01-004` passes.
