# Work Pack: ORODI Derived Foundational Controls

Work Pack ID: `WP-ORODI-PROTOTYPE-002`

Designation: **candidate-local-prototype**

Normal lifecycle status: **deferred, not waived**

Task Session route: **not exposed**

## Outcome

Create and validate a deterministic repository-local evaluator kernel for C01, C05, C11, C12, C14, and C15. The kernel derives states from binding and observation facts, compares the results with supplied control claims, and rejects forged or divergent state claims.

## Authorization and ceiling

The initiating DomainSpec v2 project owner authorized this exact candidate-local lane in the current conversation. It covers the finite write scopes and local validation commands below. It does not grant normal Invoke readiness, Task Session admission, live infrastructure or deployment access, ontology/profile admission, promotion, release, Git publication, or external transport.

## Derived rules

| Control | Deterministic rule |
| --- | --- |
| C01 | A structurally valid closed binding has the required owner set and is `passed`; missing binding/owners is a structural rejection and no derived receipt is emitted. |
| C05 | `missing` without product observations; `failed` for non-allowlisted attributes or exceeded cardinality; otherwise `passed`. |
| C11 | `not-run` without simulation observations; `failed` if simulation claims a deployment effect; otherwise `passed`. |
| C12 | `not-run` without a live deployment-effect observation; `invalid` if an effect is claimed without independent observation; `passed` for a live independently observed effect; otherwise `failed`. |
| C14 | `stale` when binding expiry is reached or an observation invalidation digest differs; `invalid` for future-dated observations; otherwise `passed`. |
| C15 | `missing` without product observations; `failed` for accounting equation violations; `inconclusive` when `partial_success` is non-zero; otherwise `passed`. Fully accounted pending work is not evidence loss. |

The aggregate derived result passes only when the input is structurally valid, all six derived states are `passed`, and every supplied foundational state matches its derived state.

## Ordered SWUs

### SWU-ORODI-DERIVE-001 — Derived receipt contracts

Primary behavior: add the closed, tool-neutral type and JSON Schema contracts for the six derived child receipts and their aggregate comparison result.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/contracts/operational-evidence.ts`
- `projects/domainspec-v2/impl/operational-resilience/contracts/derived-control-result.schema.json`

Done when the result surface fixes the six-control denominator, stable order, rule version, evidence references, findings, mismatches, explicit comparison, and `authority_effect: none`; the schema is closed at every object boundary.

Split analysis: the TypeScript and JSON Schema forms are one contract boundary; either alone would leave the evaluator output ambiguous.

### SWU-ORODI-DERIVE-002 — Pure derivation and claim comparison

Depends on: `SWU-ORODI-DERIVE-001`.

Primary behavior: derive six receipts only from the binding, observations, and explicit evaluation time; compare them with the supplied claims; integrate mismatches into the existing validator; expose a read-only `derive` CLI command.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/src/derive-foundational-controls.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/validate-operational-evidence.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/cli.ts`

Done when evaluation is pure and deterministic, stable ordered, fails closed on structure, rejects state mismatches through the main validator, preserves the existing validation route, and never actuates or performs external I/O beyond the CLI's input read/stdout write.

Split analysis: each control rule is testable alone, but the accepted semantic unit is the fixed six-control foundational denominator plus one comparison boundary. Splitting would permit partial admission or inconsistent aggregate rules.

### SWU-ORODI-DERIVE-003 — Hostile replay and consolidated evidence

Depends on: `SWU-ORODI-DERIVE-002`.

Primary behavior: replay persisted fact and claim mutations that exercise every non-pass state and prove that forged supplied states cannot satisfy validation.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/README.md`
- `projects/domainspec-v2/impl/operational-resilience/fixtures/derivation/*.json`
- `projects/domainspec-v2/impl/operational-resilience/test/derived-control-evaluators.test.ts`
- this run's `DERIVED-CONTROL-RECEIPT.json`
- this run's `PROTOTYPE-VALIDATION.json`
- this run's `PROTOTYPE-VALIDATION-REPORT.md`

Required hostile witnesses: missing owner, unsafe attribute, cardinality overflow, simulation effect, simulation not run, live effect without independent observation, live effect not run, expired binding, invalidation mismatch, telemetry accounting loss, partial-success telemetry, and claimed-state forgery.

Done when all exact validation commands pass, existing WP1 tests remain green, persisted mutation descriptors replay deterministically, and the consolidated report records commands, exits, counts, digests, limitations, and the deferred-governance Handoff Notice locator.

Split analysis: fixture descriptors and executable assertions are one replayable proof surface; separating them would leave either uninterpreted evidence or non-replayable test logic.

## Exact validation commands

Run from `/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl` unless stated otherwise:

1. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH npm exec -- tsc --project operational-resilience/tsconfig.json --noEmit`
2. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx --test operational-resilience/test/operational-evidence.test.ts operational-resilience/test/derived-control-evaluators.test.ts`
3. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx operational-resilience/src/cli.ts derive operational-resilience/fixtures/valid/c01-c16-pass.json --at 2026-08-24T18:00:00Z`
4. From repository root: `python3 -m jsonschema -i projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/candidate-local-prototype/20260824T191649Z-orodi-derived-controls-v1/DERIVED-CONTROL-RECEIPT.json projects/domainspec-v2/impl/operational-resilience/contracts/derived-control-result.schema.json`.
5. Parse every owned JSON file independently with `jq empty` and replay every `fixtures/derivation/*.json` descriptor through the test harness.
6. Run the original validation CLI over the valid fixture and require exit `0`; run it over the claimed-state-forgery materialized by the test and require rejection.
7. From repository root: `git diff --check -- projects/domainspec-v2/impl/operational-resilience projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/candidate-local-prototype/20260824T191649Z-orodi-derived-controls-v1`.
8. Assert no symlinks/special files, no conflict markers, final newlines, and a stable sorted aggregate SHA-256 inventory across both owned roots.

Browser validation, generation, external network, load execution, fault injection, infrastructure plan/apply, canary, deployment, and rollback are not applicable to this pure data/evaluator slice.

## Stop conditions

Stop on ambiguous product semantics, any need for credentials or live binding, external effects, public/private copying, dependency installation, protected owner decisions, write outside the exact roots, or failed acceptance-critical validation.

## Recomposition proof

The typed output contract, six-control evaluator, comparison boundary, and replay evidence recompose into the Design's semantic kernel and evidence/evaluation planes. The work proves a reusable fact-to-state boundary before any tool/profile adapter is admitted. It does not implement the legacy v1 adapter.

## Deferred lifecycle route

After prototype validation, a future lifecycle owner may run `invoke:refresh` over the exact bytes and decide whether to author a separately authorized legacy v1 adapter Work Pack. The Handoff Notice grants no authorization for that route.
