# TASK-CDSC2-ADJUDICATION

## SWU-CDSC2-005B - Freeze Overlay And Compatibility Projection

**Goal:** adjudicate the two frozen substitution coordinates separately, freeze
one overlay, and materialize one deterministic v1 compatibility receipt without
rewriting the parent interpretation.

**Dependencies:** accepted SWU-CDSC2-005A.

**Inputs:** parent F3 receipt, M1/M2 receipts, accepted overlay schema/validator,
materializer, unchanged parent review rubric, and protocol.

**Outputs:**

- `../evidence/generation-002/f3-savvy-page/adjudication-overlay.json`
- `../evidence/generation-002/f3-savvy-page/compatibility-receipt.json`
- `../evidence/generation-002/f3-savvy-page/REVIEW.md`
- `tests/f3-three-layer-adjudication.test.mjs`
- Task Session context, result, receipt, and observability signal

**Ordered algorithm:**

1. Verify every input handle and protected byte.
2. Copy no parent semantic payload into the overlay; bind it by record and
   generation handle.
3. Create exactly twelve cells: six unchanged explanations by permitted and
   breaking substitutions.
4. Judge each cell only against the parent explanation statement, parent
   substitution prediction, corresponding observation handle, and unchanged
   rubric.
5. Use `indeterminate` for partial or disputed coverage; never select a state to
   obtain a preferred evaluator outcome.
6. Resolve parent F3-U-01/F3-U-02 only through matching approved M1/M2 handles;
   carry F3-U-03 and all harness/framework limits.
7. Freeze the overlay, materialize the compatibility receipt, validate both,
   rerun materialization, and compare semantic bytes/handles.
8. Record a field-level provenance table in `REVIEW.md`, including every
   retained, derived, resolved, and carried field.

**Failure modes:** any late explanation/prediction edit, combined coordinate,
partial-as-explained judgment, outcome optimization, missing reviewer,
unresolved uncertainty dropped, handle mismatch, compatibility drift, or
generation-1 mutation.

**Write scope:** parent calibration
`evidence/generation-002/f3-savvy-page/`, generation-2 package focused test,
this SWU's run evidence, and status synchronization only.

**Done criteria:** overlay validates with twelve total cells; compatibility
receipt validates through the parent v1 validator; projection is deterministic;
uncertainty/prohibitions are preserved; no evaluation or append occurs.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/f3-three-layer-adjudication.test.mjs
```

**Execution owner:** local fallback through Task Session.

**Handoff:** on pass, route only to SWU-CDSC2-006R with the frozen compatibility
receipt and all four layer/projection handles.

## State

Complete through local Task Session on 2026-07-12.

## Evidence

See `../../../../runs/SWU-CDSC2-005B/TASK-SESSION-RESULT.md`. The overlay froze
all twelve separate coordinates with exact parent/M1/M2 handles; the parent-valid
compatibility projection replayed identically; focused tests passed 6/6 and the
combined parent plus generation-2 suites passed 78/78. No evaluator, result, or
generation append was produced.
