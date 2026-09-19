# TASK-CDSC3-ADJUDICATION

## Objective

Judge unchanged parent explanations against six atomic targets, then create one
deterministic parent-valid compatibility projection without running evaluation.

## SWU-CDSC3-007 - Atomic Adjudication And Compatibility Projection

**Goal:** freeze exactly 36 reviewed coordinates, bind usefulness/uncertainty,
and materialize a deterministic v1 F3 receipt.

**Dependencies:** accepted SWU-CDSC3-004, 005, and 006.

**Source anchors:** parent F3 `semantic.A`; accepted atomic target set; `M3-P`,
`M3-B`, and usefulness receipts; generation-2 overlay/projection; `SPEC.md#Adjudication`;
parent v1 evidence-receipt schema and validator.

**Inputs:** six unchanged explanations, six targets, matching browser evidence,
`D`, protected import manifest, generation-2 uncertainty, and reviewer identity.

**Ordered algorithm:**

1. Revalidate all protected and evidence handles.
2. Freeze `cdsc.atomic-adjudication-overlay.v1` with total `A x T` coordinates.
3. For each coordinate, read only the explanation statement, atomic target,
   matching observation handle, and approved rubric.
4. Map full coverage to `explained`, none to `not-explained`, and partial,
   conflict, missing evidence, or dispute to `indeterminate`.
5. Bind `D` exactly; do not reinterpret empty/nonempty output.
6. Resolve uncertainty only with matching evidence; carry browser, source,
   direct-attestation, and portability limits.
7. Materialize a v1 receipt with stable F1/F2-compatible vocabulary. Atomic
   targets become current observable coordinates; parent `G`/`A` and unchanged
   pre-atomic observations retain their semantic values.
8. Validate overlay and projection directly and through parent validator.
9. Replay and compare canonical bytes/handles.
10. Add negative vectors for 35/37 cells, duplicate coordinate, changed
    explanation/target, observed-outcome target, partial-as-explained, dropped
    uncertainty, `D` inflation, unknown field, and evaluator import/call.

**Write scope:** generation-3 adjudication/projection schemas and validators,
`evidence/generation-003/f3-atomic/`, adjudication fixtures,
`tests/atomic-adjudication.test.mjs`, and `runs/SWU-CDSC3-007/`.

**Done criteria:** 36 cells validate; every coordinate has target and evidence
provenance; projection is parent-valid/deterministic; uncertainty and authority
prohibitions survive; evaluator is not invoked.

**Acceptance evidence:** overlay, projection, field-level review/provenance
report, negative-vector results, deterministic replay, Task Session receipt,
observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/atomic-adjudication.test.mjs
```

**Execution owner:** local fallback.

**Handoff:** route only to SWU-CDSC3-008 with exact predecessor, target,
observation, `D`, overlay, and projection handles. Do not precompute a result.

**Execution status:** complete. The 36-cell overlay is
`record:sha256:3731f6bbe8a33ab259d5846e35b175f91ea78fb941cba4306246443b104374a4`;
the parent-valid projection is
`record:sha256:a3c119864e5749dfe0b0a2d5f2a8e3d70b593c9f7fd279a194195850afdd7da1`.
Six partial coordinates remain explicitly indeterminate; no evaluator ran.

## Synchronization

On pass, mark W3 adjudication slice complete and SWU008 ready. Any disputed or
indeterminate coordinate remains visible; it is not a blocker if validly frozen.
