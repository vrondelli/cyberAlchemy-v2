# TASK-CDSC2-GENERATION-REFRESHED

## SWU-CDSC2-006R - Evaluate Projection And Append Generation 2

**Goal:** evaluate the accepted compatibility projection with the frozen parent
evaluator, join stable F1/F2 results, and append exactly one successor.

**Dependencies:** accepted SWU-CDSC2-005B.

**Inputs:** parent/M1/M2/overlay/projection handles, stable F1/F2 result handles,
parent fixture evaluator, successor suite wrapper, protected manifest, and
current generation index tail.

**Ordered algorithm:**

1. Revalidate every protected and layer handle.
2. Regenerate the compatibility projection and require exact equality with the
   frozen projection.
3. Evaluate it with the unchanged parent `evaluateFixture` implementation.
4. Preserve any insufficient, rubric-fail, or residual-supported outcome; do
   not normalize to explained.
5. Validate F1/F2 result handles and compose the three-result suite.
6. Require same-process replay equality before setting replay state identical.
7. Build the successor with predecessor equal to the generation-1 index tail.
8. Append one index entry atomically and reject duplicate/wrong-tail writes.
9. Write F3 result, suite result, run receipt, provenance manifest, and focused
   integration test.

**Failure modes:** projection drift, layer handle drift, non-total outcome,
result duplication, wrong control, replay drift, wrong predecessor, duplicate
append, hidden uncertainty, or authority-bearing route.

**Write scope:** parent calibration `results/generation-002/`, append-only parent
`generations/index.json`, generation-2 package integration test, this SWU's run
evidence, and status synchronization only.

**Done criteria:** total F3 and suite outcomes, exact input/provenance handles,
two-entry predecessor-consistent index, deterministic replay, and no authority
claim.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/generation-002-integration.test.mjs
```

**Execution owner:** local fallback through Task Session.

**Handoff:** on pass, route only to SWU-CDSC2-007R with all immutable layer,
projection, result, and generation handles.

## State

Complete through local Task Session on 2026-07-12.

## Evidence

See `../../../../runs/SWU-CDSC2-006R/TASK-SESSION-RESULT.md`. The unchanged
evaluator preserved `INSUFFICIENT-EVIDENCE` for F3 and `CALIBRATION-DEFER` for
the suite. Generation 2 appended exactly once after generation 1; focused tests
passed 6/6 and the combined parent plus generation-2 suites passed 84/84.
