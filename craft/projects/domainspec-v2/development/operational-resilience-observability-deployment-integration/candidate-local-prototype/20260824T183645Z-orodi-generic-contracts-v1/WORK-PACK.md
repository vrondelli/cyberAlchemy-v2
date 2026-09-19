# Work Pack: ORODI Repository-Local Generic Contracts Prototype

Work Pack ID: `WP-ORODI-PROTOTYPE-001`

Designation: **candidate-local-prototype**

Normal lifecycle status: **deferred, not waived**

Task Session route: **not exposed**

## Outcome

Create and validate a finite, tool-neutral TypeScript prototype under `projects/domainspec-v2/impl/operational-resilience/` that can reject malformed or semantically unsafe ORODI evaluation bundles and emit a deterministic, non-actuating receipt.

## Authorization and ceiling

The initiating project owner authorized this candidate-local lane in the current conversation. That authorization covers only the exact repository-local write scopes and commands below. It does not grant normal Invoke execution-candidate readiness, Task Session admission, live infrastructure access, deployment authority, ontology/profile admission, promotion, release, Git publication, or external transport.

## Preserved invariants

1. `passed`, `failed`, `missing`, `invalid`, `inconclusive`, `stale`, and `not-run` remain distinct values.
2. Domain/control evaluation never grants protected-effect authority.
3. Product evidence and workflow telemetry cannot alias.
4. C01-C16 are the only admitted prototype denominator; C17-C20 remain unadmitted.
5. Missing controls, malformed bindings, stale evidence, unsafe attributes/cardinality, incomplete telemetry accounting, or simulation presented as actual deployment fail closed.
6. Simulation always has `deployment_effect: false`; C12 can pass only with a live, independently observed effect.
7. All identities, versions, and artifact references are exact; ambient `latest` is invalid.

## Ordered SWUs

### SWU-ORODI-P-001 — Closed generic contracts

Primary behavior: represent one immutable evaluation bundle and one validator receipt without importing a tool, provider, or live environment.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/README.md`
- `projects/domainspec-v2/impl/operational-resilience/tsconfig.json`
- `projects/domainspec-v2/impl/operational-resilience/contracts/operational-evidence.ts`
- `projects/domainspec-v2/impl/operational-resilience/contracts/evaluation-bundle.schema.json`
- `projects/domainspec-v2/impl/operational-resilience/contracts/evaluation-result.schema.json`

Done when:

- JSON contracts are closed (`additionalProperties: false`) at every object boundary;
- TypeScript literals encode C01-C16, the seven states, authority effect `none`, and the candidate-local lane;
- schemas accept the positive fixture/result and reject representative structural mutations;
- no dependency or package root is added.

Split analysis: the schemas and TypeScript types must land together because either alone would leave the executable contract ambiguous. Validator behavior is independently reviewable and remains SWU-002.

### SWU-ORODI-P-002 — Deterministic non-actuating validator and CLI

Depends on: `SWU-ORODI-P-001`.

Primary behavior: decode untrusted JSON, enforce the generic ORODI invariants, aggregate the exact control set, and emit a stable receipt.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/src/validate-operational-evidence.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/cli.ts`

Done when:

- decoding is exact-shape and fail-closed;
- privacy/cardinality and telemetry accounting are checked;
- freshness and invalidation digests are checked against an explicit `--at` time;
- exact C01-C16 membership is enforced with no duplicates or proposed controls;
- C11 simulation and C12 actual effect semantics are enforced;
- result ordering and JSON serialization are deterministic;
- the CLI performs reads only and exits `0` only for a passed candidate-local bundle.

Split analysis: decode/evaluate/aggregate are one pure behavior because each consumes the same closed bundle and the CLI is only its thin repository-local adapter. Tool/profile integration remains outside the unit.

### SWU-ORODI-P-003 — Positive and hostile proof surface

Depends on: `SWU-ORODI-P-002`.

Primary behavior: prove the prototype rejects semantic boundary violations and preserves deterministic evidence.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/fixtures/valid/c01-c16-pass.json`
- `projects/domainspec-v2/impl/operational-resilience/fixtures/hostile/*.json`
- `projects/domainspec-v2/impl/operational-resilience/test/operational-evidence.test.ts`
- this run's `PROTOTYPE-VALIDATION-REPORT.md` and machine-readable evidence receipts

Required hostile witnesses:

- missing required owner/binding;
- unsafe attribute or exceeded cardinality budget;
- incomplete offered/queued/exported telemetry accounting;
- stale receipt or invalidation digest mismatch;
- missing/duplicate/unadmitted control;
- workflow telemetry substituted for product evidence;
- simulation claiming a deployment effect or satisfying C12;
- live effect lacking independent observation;
- ambient-latest version/reference.

Done when all exact validation commands pass and a consolidated candidate-local report records commands, exits, test counts, digests, changed-byte inventory, limitations, and the deferred Handoff Notice locator.

Split analysis: fixtures and tests are a single proof unit because fixtures without executable assertions do not establish discrimination, and tests without persisted fixtures do not provide replayable evidence.

## Exact validation commands

Run from `/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl` unless stated otherwise:

1. `npm exec -- tsc --project operational-resilience/tsconfig.json --noEmit`
2. `node --import tsx --test operational-resilience/test/operational-evidence.test.ts`
3. `node --import tsx operational-resilience/src/cli.ts validate operational-resilience/fixtures/valid/c01-c16-pass.json --at 2026-08-24T18:00:00Z`
4. `python3 -m jsonschema -i operational-resilience/fixtures/valid/c01-c16-pass.json operational-resilience/contracts/evaluation-bundle.schema.json`
5. Run the CLI over every `fixtures/hostile/*.json` and require every exit to be non-zero.
6. Parse every new JSON file independently with `jq empty`.
7. From repository root: `git diff --check -- projects/domainspec-v2/impl/operational-resilience projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/candidate-local-prototype/20260824T183645Z-orodi-generic-contracts-v1`.
8. Assert no symlinks/special files, no conflict markers, and final newlines in both owned roots.

Browser validation, generation, external network, load execution, fault injection, infrastructure planning/apply, canary, deployment, and rollback are not applicable to this generic data-contract slice.

## Stop conditions

Stop on ambiguous semantics, any need for a live binding, credentials, external effects, public/private copying, protected owner decision, dependency installation, write outside the exact roots, or failed acceptance-critical validation.

## Recomposition proof

P0-P2 recompose into the Design's semantic kernel and evidence/evaluation planes: the contracts encode the invariant-bearing vocabulary; the validator enforces it over immutable inputs; the fixtures show the required discriminators. Profile adapters, runtime collectors, workload tools, infrastructure providers, canary controllers, and protected effects remain separable future layers.

## Deferred lifecycle route

After consolidated prototype validation, a future lifecycle owner may run `invoke:refresh` to reconcile exact bytes and decide whether owner/profile admission work should incorporate them. The Handoff Notice grants no authorization for that route.
