# TASK-CDSC3-GENERATION

## Objective

Evaluate the accepted generation-3 projection through unchanged v1 code and
append exactly one predecessor-consistent generation.

## SWU-CDSC3-008 - Evaluate And Append Generation 3

**Goal:** produce total F3/suite results, provenance, run receipt, and one exact
generation-3 index entry regardless of outcome.

**Dependencies:** accepted SWU-CDSC3-007.

**Source anchors:** accepted generation-3 projection; parent
`evaluation/evaluate-fixture.mjs`, `evaluate-suite.mjs`, and
`generation-index.mjs`; stable F1/F2 results; generation-2 suite/index tail;
`SPEC.md#Evaluation-And-Generation`.

**Ordered algorithm:**

1. Revalidate protected bytes and all generation-3 input handles.
2. Rebuild the projection and require exact equality.
3. Evaluate F3 twice with unchanged `cdsc-evaluator-v1`.
4. Validate stable F1/F2 result handles and compose the suite twice with replay
   state `identical`.
5. Preserve any insufficient, explained, rubric-fail, or residual-supported
   result and any defer, fail, or pass verdict.
6. Require predecessor equal to generation 2
   `generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683`.
7. Build provenance linking parent, targets, browser observations, `D`, overlay,
   projection, fixture results, suite result, and uncertainty.
8. Preflight generation entry, write immutable results/receipts, and invoke the
   existing atomic append API once.
9. Reject rerun, duplicate ID, and wrong-tail append without changing index.
10. Verify generations 1/2 protected projections remain exact.

**Write scope:** parent calibration `results/generation-003/`, append-only
parent `generations/index.json`, generation-3 focused integration test, and
`runs/SWU-CDSC3-008/`.

**Done criteria:** F3 and suite outcomes are total; same-process replay is
identical; index has one new exact successor; duplicate/wrong-tail writes
reject; no authority claim exists.

**Acceptance evidence:** F3 result, suite result, provenance, run receipt,
generation entry, append/rejection proofs, focused integration test, Task
Session receipt, observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/generation-003-integration.test.mjs
```

**Execution owner:** local fallback.

**Handoff:** route only to SWU-CDSC3-009 with all immutable input/output handles.

**Execution status:** complete. Generation
`generation:sha256:a96be3dcc50a196f4d044971ecf94141de34583784050581cda913ba1cf5e4bc`
is the sole successor to generation 2. F3 is `INSUFFICIENT-EVIDENCE`; the suite
is `CALIBRATION-DEFER`; replay and three rejection proofs pass.

## Synchronization

On pass, mark L2/W3 complete and SWU009 ready. The suite's machine route is
evidence output; independent audit remains the immediate work-pack route.
