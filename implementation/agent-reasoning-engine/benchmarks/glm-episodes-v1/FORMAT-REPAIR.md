# Schema repair and shared correction

The standalone `format-repair.mjs` stage uses the [canonical schema and full diagnostics](SCHEMA-RECOVERY.md). It admits only rejected JSON whose complete source, base, operation, path and file hash can be protected. One native resubmission may repair unprotected metadata but must preserve every source character. It does not reconstruct missing source or foreign scope.

## Shared correction composition

`shared-correction.mjs` accepts exactly one valid candidate or rejected JSON text. Policy `shared-correction-v2` collects public semantic diagnostics before spending its one correction request. Eligible rejected input gets a scope-bound validation envelope using canonical metadata; that envelope is only for isolated public checks and can never be accepted unchanged.

The correction receives the original rejected object, all schema issues and public checks. If those checks already pass, source must remain byte-for-byte identical. If they fail, the one response must repair schema and behavior together while preserving base/path/file bindings. Strict native parsing, public revalidation and a separate oracle still decide acceptance. Execution failures are not semantic counterexamples. Malformed or incorrect correction responses get no further logical correction. An explicitly configured transport may retry the exact admitted request once after a recognized transient transport failure; every physical attempt remains recorded.

`public-feedback-run.mjs --shared-matrix` opts a complete twelve-condition matrix into this composition. Original initial-proposal and delivery records remain intact. This is benchmark-stage integration; the default coding-agent loop is not activated.

The frozen evaluation plan may set `maximum_correction_model_retries` to0 (default) or1. The driver carries the physical attempt count back from the transport; the qualifier reconciles it with receipts and the one logical correction dispatch. The [complete candidate](evidence/complete-transport-qualification-2026-09-09/README.md) passed36/36.

Earlier sequential format-then-semantic composition is retained in [historical evidence](evidence/shared-correction-2026-09-08/PLAN.md). Its one remaining failure in [the recovery campaign](evidence/transient-recovery-qualification-2026-09-08/README.md) motivated joint diagnostics.

## Open Questions

Owned by [the joint-diagnostics qualification plan](evidence/joint-diagnostics-qualification-2026-09-09/PLAN.md#open-questions).
