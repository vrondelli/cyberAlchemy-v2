# Mappings: DomainSpec Implementation Conformance

## CodeTagToImplementationBinding

**From:** canonical code-tag tuple and selected profile
**To:** generated/reconciled `ImplementationBinding`

| Source | Target | Rule |
| --- | --- | --- |
| concept id/type | canonical concept ref/resolved kind | exact preservation |
| canonical outbound edges | canonical relationship refs | preserve direction |
| source unit/symbol | implementation unit/entry point | derive or reconcile; never re-author identity |
| source/config digest | binding digest set | exact current digest |

Any disagreement fails closed; it does not create a second registry.

## NativeDiagnosticToEvaluationFinding

**From:** language-owned native diagnostic/result
**To:** nested `EvaluationFinding`

| Source | Target | Rule |
| --- | --- | --- |
| adapter/language/tool/version | evaluator identity | exact preservation |
| native disposition/exit semantics | `pass|fail|unsupported` | evaluator-specific total mapping |
| native code/message/location | raw diagnostic reference | never discard or rewrite away |
| source/target modules | topology finding subjects | required for edge findings |
| skip/suppression | evidence/exception finding | underlying finding retained |

## EvaluationInputsToReceipt

**From:** profile, bindings, obligations, native bundles, optional runtime evidence
**To:** generated `EvaluationReceipt`

The receipt binds every input/config/tool/source/output digest, stable findings,
unsupported/skipped cases, candidate exception references, raw artifacts, and
claim limits. Missing or stale input prevents a passing receipt.

## RuntimeFixtureToTransitionEvidence

**From:** `StateMachineRuntimeContract` plus application harness result
**To:** runtime/temporal evidence inside the receipt

The mapping records named input, prior state, guard result, selected transition,
next state, effect intent, observed result, and raw test reference. It does not
claim persistence, delivery, concurrency, retry, or compensation semantics.
