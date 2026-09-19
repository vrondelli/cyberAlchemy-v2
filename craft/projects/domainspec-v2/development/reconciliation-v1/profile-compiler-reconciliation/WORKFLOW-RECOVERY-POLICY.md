# Selected Workflow recovery ordering policy

Date: 2026-09-09. PCR-06 / DSR-017 construction candidate. Authority effect: none.
User request: `apply the suggestion`, after explaining that ordered and
unconstrained compensations may coexist in one Workflow.

## Result and selected meaning

The [dependency decision](WORKFLOW-RECOVERY-DEPENDENCY-DECISION.md) is resolved as
ordering among needed compensations. `depends_on` is an ordering constraint, not
an inferred mandatory business prerequisite. Empty dependencies impose no
semantic ordering constraints; they do not grant concurrent execution.

`selectWorkflowRecoveryPolicy` binds this versioned policy to one registered
checked Workflow artifact and the exact definition. `planSelectedWorkflowRecovery`
then validates a bounded failure journal and plans recovery without executing it.

| Observations | Outcome |
| --- | --- |
| Reservation and payment committed; a later step did not commit | Plan refund before stock release when that dependency is declared. |
| Only reservation committed; payment definitely did not commit | Plan stock release alone; record the inactive refund dependency. |
| No declared dependency between selected compensations | Use reverse completed-step order as the deterministic tie-break, not a business prerequisite. |
| Failed step's commit outcome is indeterminate | Return reconciliation-required; no Recovery Intent or recovery evaluation result yet. |
| Known non-commit and no completed step needs compensation | Return evaluated/not-required with no intent. |

The complete authored graph is retained. Planning selects the graph induced by
confirmed completed steps' compensations; it neither mutates the source graph nor
invents transitive edges through inactive compensations. Active dependencies take
precedence over the reverse-completion tie-break. Declaration order is not a
scheduling rule. Cycles and unknown references still fail source validation.

## Explicit compiler/runtime input

The policy selection carries `schema_version`, `workflow_sha256`,
`contract_sha256`, `dependency_semantics: needed-compensations-only`, and
`tie_break: reverse-completion`. Only the explicit v1 candidate selection is
accepted; unknown versions, flags, stale Workflow hashes and cloned checked
objects fail closed.

The journal carries its version, Workflow execution ID, failure occurrence ID,
ordered completed step IDs, failed step ID and `failed_commit_status`:
`not-committed` or `indeterminate`. Completed IDs must be exactly the source
prefix and failure must be the immediately following declared step. A generic
`failed` or `rejected` string is not accepted as proof of non-commit. The future
orchestrator must preserve the actual Operation outcome distinction.

These are caller-supplied observations, not authenticated provider evidence.
This bounded input models failure of a forward Operation; it does not model
post-Workflow failures, parallel execution, a persisted journal or reconciliation
provider. It never infers that an unknown step did not commit.

## Identity and effects

For evaluated/recovery-required, the immutable candidate intent binds policy,
exact Workflow, execution and failure occurrence, failed step, completed-prefix
journal digest and ordered plan digest. Each plan entry retains its compensation
occurrence, exact `for_step`, qualified Operation, checked action hash, active and
inactive dependencies, and typed argument/Event binding expressions. Repeated
uses of one Operation have distinct invocation identities.

Arguments remain checked expressions: this planner does not materialize runtime
values, call a mapper, calculate a value, perform lookups, evaluate guards or
dispatch Operations. Mandatory business conditions stay owned by the selected
Operation's declared guards. Its exact action hash remains pinned. No guard is
waived by ordering or by the existence of a plan.

The pure helper does not register intents, enforce one intent across multiple
calls, authenticate observations, provide replay protection, satisfy recovery,
retry an action, or claim durable execution. External coordination must enforce
immutable failure/intent association and resolve exact bindings before dispatch.
The definition and output both state these limits explicitly.

## Definition, ontology and compatibility

The [definition](workflow-recovery-policy-contract.json), SHA-256
`194b34af821696ec129c5894333929670efe9f8acea708c662c55a9e11d4b48f`, and
[ontology scaffold](../ontology/workflow-recovery-policy-candidate.json) were
authored before implementation. They distinguish ordering from eligibility,
inactive from indeterminate, and intent planning from execution.

The new implementation is additive under `impl/cli/src/typed-operation/workflow-recovery.ts`.
The existing occurrence source, checked binding, canonical D36/D37 documents,
legacy reference and old generated sources are not rewritten or reinterpreted.
No new meta-type, canonical edge, default selection, admission or AlchLang syntax
is introduced. In particular, the old strict planner still rejects an inactive
dependency; a test demonstrates old/new behavior side by side.

## Verification

Eleven focused new tests pass in **5.07 seconds**, zero failures/skips. The
independent permutation oracle enumerates all 64 directed graphs on three
compensations: 25 acyclic graphs across 100 failure prefixes agree with the
specified order, and 39 cyclic graphs are rejected. Additional tests cover
mixed ordered/unconstrained behavior, partial failure, inactive path removal,
unknown commits even without compensation, exact-prefix rejection, source and
definition drift, ordinary accessor safety, resource bounds, ownership,
occurrence identity and legacy non-collapse.

The final four-file focused run passed **38/38** in **21.06 seconds**, with no
failures or skips, including the exhaustive-graph test. Source typecheck and frozen checks
pass: 39 catalog cells, 31 relationship signatures and five integration-profile
definitions across three languages. The 37-file shared regression completed
**412 passed / 2 failed / 0 skipped** in **926.49 seconds**. Both failures were
`spawnSync cargo ETIMEDOUT` at the existing 240-second limit: native Mapping
argument execution and full-safe-integer Rust composition. Neither failure was
in the new Workflow suites. A serial rerun of both affected complete suites passed
**19/19**, zero failures/skips, in **179.42 seconds** without source changes or
timeout increases. The initial run is not reported as 414/414 passing. The native
Rust cases that timed out passed in 105.54 and 69.96 seconds respectively on retry.

During development, typecheck caught a narrowing issue in the journal decoder;
the validated commit-status local now has the exact union type. A no-compensation
fixture initially retained an extra canonical edge and selected unused actions;
the fixture was corrected to satisfy exact source closure. No validator was
weakened to make those cases pass.

The preservation audit confirms eight protected files retain their entry hashes:
existing Workflow source/binding implementation and test, legacy generator and
reference planner, canonical definitions, project input model and frozen source
configuration. Removing only the new test registration from `impl/cli/package.json`
reproduces its entry hash. All ten scoped files pass JSON/whitespace checks where
applicable, and the scoped `git diff --check` passes. Implementation SHA-256:
`fa6b901d617745a28c00aa00f9e821121a50d4112427022731870db23ea0f138`;
new test SHA-256:
`e1d4d6d24939742f653a02797b0fe36cb28d958e76807b04bc54b48fb7ae596a`.

After all test processes finished, the exact verified temporary `impl/node_modules`
symlink was removed. Its cached target and user-owned CLI dependencies were retained.
The post-cleanup source typecheck passed, including the 39-cell catalog,
31-signature relationship authority and five integration definitions in three
languages. No canonical artifacts were regenerated or admitted.

## Task Session context and scope

Arcanum Orchestrate / Task Session used a standard bounded Context Builder pack:
user selection and decision record; typed Workflow bindings and occurrence
source; exact graph/action contracts; D36/D37 and legacy reference behavior;
Operation commit outcomes; existing test fixture; full CLI status and completion
ledger. Obligations cover selected-subgraph semantics, deterministic ordering,
unknown-state separation, exact binding, ownership and legacy compatibility.
One owner choice is resolved; no additional material decision is required for
this unit. No delegation or handoff. Sigil-development experiments are not
applicable to this compiler/runtime policy unit.

Product construction: selected policy, checked planner, tests and evidence.
Operational support: the established temporary dependency link for the shared
test corpus only. No database setup, publication or provider admission blocks
this unit. The full CLI outcome remains unchanged and incomplete.

Ten-file write scope: implementation, new tests and package registration;
definition and ontology; this report; selected decision, binding report and
status/completion ledgers. ARE request `ds-cli-continuation-20260909-061`, raw
request `apply the suggestion`; route receipt
`93b874f0e98aca1dd71773251512f76b2ed358baca067e33658a60b4f5575685`.
Context: `daa2f0501c0d2e64d2f91a9c8eda06fecf7586bb775d38fb5b46b65ba2944ded`.
Effect: `9739e361c46b9603ffc019b6bcf337a37e0a6c8fa4ca727ebd0946fa0f8ed881`.
These assessments do not grant authority or perform the proposed effects.

Continuation assessment `da7441c9c4574858b51df9350a5541c07c04f35df022945fb7ebb19dffa44360`
selects native Workflow orchestration as the next admissible local construction
option, with no missing owner-gate references. It is an assessment, not execution
or admission of that successor work. The selected recovery meaning is no longer
an owner decision blocker.

## Remaining work

Native Workflow orchestration/generation must compose the existing checked
Operation functions with these typed bindings and recovery policy, retain actual
commit outcomes and immutable values, and materialize recovery arguments without
dispatching compensation. Provider reconciliation, durable registration and
execution remain separate responsibilities; none is claimed here.

Public CLI integration, Interface/Mapping integration and the remaining PCR
requirements are tracked in [CLI-COMPLETION.md](CLI-COMPLETION.md). This internal
report is not user-facing product documentation or proof of the full CLI goal.
