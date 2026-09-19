# TASK-ARE-L2-INTEGRATION — Execute One Complete Architecture Proof Unit

## Objective

Recompose all accepted components into the exact selected unit and emit the
bounded proof receipt. Layer L2 with L3 exit assessment, slice S3, wave W3.

## Smallest Working Units

### SWU-ARE-014 — Execute and verify the complete `OrderStatus` proof

- Primary behavior: execute the frozen positive/mutation/replay case through the
  public component contracts and publish one complete proof receipt.
- Independent acceptance: positive path passes; mutation compiles and dies with
  the exact one finding; isolated replay matches; every declared handle is
  reachable; current legacy runner remains green.
- Split analysis: positive execution, mutation, and replay are plausible child
  runs but cannot independently establish the selected proof claim. Their
  implementations are already accepted in earlier SWUs; this unit owns only the
  final immutable join and bounded completion decision.
- Dependencies: SWU-ARE-013, SWU-ARE-015, and every earlier historical
  terminal/closeout receipt, including retained SWU-ARE-003 lineage.
- Inputs: exact frozen definition/spec/snapshot-bound active v2 catalogue/binding,
  immutable v1 catalogue predecessor lineage, component/tool/config
  handles, and one pre-run `ArchitectureRealizationCase/v1` created before any
  source emission.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/run-proof.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/proof.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/case.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/realization-spec.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/ir.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/source/order-status.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/source/order-status.mutant.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/source-manifest.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/compile.positive.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/compile.mutant.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/observation.positive.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/observation.mutant.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/evaluation.positive.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/evaluation.mutant.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/mutation.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/replay.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/raw-index.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/runs/order-status-v1/proof-receipt.json`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-014.json`
- Done criteria:
  - legal lifecycle reaches `proof-complete` only after replay;
  - exact obligation accounting `declared=1, passed=1, failed=0, unaccounted=0`;
  - exact mutation accounting `declared=1, killed=1, survived=0`;
  - definition, ontology, spec, active v2 catalogue, v1 predecessor lineage, IR,
    binding, profile, provider,
    emitter, compiler, source, witness, observation, evaluation, mutation,
    replay, tool, and configuration refs present;
  - claim ceiling says one candidate-local direct TypeScript proof only.
- Validation:
  - focused `proof.test.ts` Vitest and shared realization typecheck;
  - existing TypeScript Enum runner trust-proof Vitest and runner typecheck;
  - ontology validator;
  - JSON parse/schema checks for all `runs/order-status-v1` artifacts;
  - scoped whitespace check over exact touched targets.
- Execution owner: `subagent` or Task Session local fallback. One bounded helper
  may execute this SWU; multi-agent fan-out requires a separately confirmed
  governed dispatch.
- Expected result shape: standard SWU receipt plus
  `ArchitectureProofReceipt/v1`, exact validation commands/results, files
  touched, blockers/residue, and next route `TASK-ARE-VERIFY`.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-014`.

## Synchronization

No product promotion follows automatically. Closeout marks only SWU-ARE-014 and
routes to the non-mutating verification task.
