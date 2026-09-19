# Work Pack: ORODI Legacy-v1 Adapter

Work Pack ID: `WP-ORODI-PROTOTYPE-003`

Designation: **candidate-local-prototype**

Normal lifecycle status: **deferred, not waived**

Task Session route: **not exposed**

## Outcome

Inventory and pin exact DomainSpec v1 operational-evidence-related shapes, implement deterministic pure normalizers into existing generic ORODI observations, and prove the mapping and rejection boundary with golden and hostile replay tests.

## Authorization and ceiling

The initiating DomainSpec v2 project owner authorized this finite candidate-local lane in the current conversation. It covers only the repository-local files and validation commands below. It does not authorize live tools, external I/O, infrastructure, deployment, canary, rollback, lifecycle reconciliation, ontology/profile admission, promotion, release, or Git publication.

## Mapping rules

| Legacy shape | Result |
| --- | --- |
| `legacy-v1.failure-mapping-row/v1` | One `product/log/simulation` observation carrying the four pinned row fields as safe string attributes; zero runtime telemetry; not independently observed. |
| `legacy-v1.otel-metric-declaration/v1` | One `product/metric/simulation` observation carrying the five pinned declaration fields; zero runtime telemetry; not independently observed. |
| async observer signal or telemetry bundle | Reject: workflow telemetry is not product evidence. |
| SLO row, Prometheus scrape config, Prometheus alert rule | Reject: policy/configuration declarations are not observations. |
| infrastructure or deployment plan | Reject: proposal/procedure is not execution evidence. |
| load result or canary result | Reject: v1 family is absent; no synthetic success shape may be fabricated. |

No normalized output is a complete evaluation bundle, control receipt, live observation, deployment effect, or proof of source execution.

## Ordered SWUs

### SWU-ORODI-V1-001 — Pinned inventory and closed adapter contracts

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/contracts/legacy-v1-source-inventory.json`
- `projects/domainspec-v2/impl/operational-resilience/contracts/legacy-v1-adapter.ts`
- `projects/domainspec-v2/impl/operational-resilience/contracts/legacy-v1-normalization-result.schema.json`

Done when the inventory is an exact semantic copy of the plan inventory, all source bindings are closed and digest-pinned, input/result unions preserve dispositions and authority, and the result schema is closed at every object boundary.

### SWU-ORODI-V1-002 — Pure normalizer and local CLI

Depends on: `SWU-ORODI-V1-001`.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/src/normalize-legacy-v1.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/legacy-v1-cli.ts`

Done when the normalizer performs no I/O, requires an explicit replay timestamp and exact source inventory, emits stable observation ordering and findings, rejects every non-evidence disposition, never emits live/deployment-effect/independently-observed facts, and the CLI only reads local JSON and writes stdout/stderr.

### SWU-ORODI-V1-003 — Golden and hostile replay proof

Depends on: `SWU-ORODI-V1-002`.

Write scope:

- `projects/domainspec-v2/impl/operational-resilience/fixtures/legacy-v1/golden/*.json`
- `projects/domainspec-v2/impl/operational-resilience/fixtures/legacy-v1/hostile/*.json`
- `projects/domainspec-v2/impl/operational-resilience/test/legacy-v1-normalizer.test.ts`
- `projects/domainspec-v2/impl/operational-resilience/README.md`
- this run's `PROTOTYPE-VALIDATION.json`
- this run's `PROTOTYPE-VALIDATION-REPORT.md`

Required hostile witnesses: source digest drift, selector drift, unknown shape, workflow telemetry substitution, policy/configuration laundering, infrastructure/deployment proposal laundering, absent load/canary fabrication, invalid replay timestamp, unsafe attribute key, excessive declared cardinality, malformed supported payload, and input mutation attempt.

Done when golden outputs compare deeply and byte-stably, every hostile descriptor produces its exact discriminator, the CLI agrees with the library, emitted results satisfy the closed schema, all WP1/WP2 regression tests pass, and the consolidated report records the Handoff Notice locator and limitations.

## Exact validation commands

Run from `/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl` unless stated otherwise:

1. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH npm exec -- tsc --project operational-resilience/tsconfig.json --noEmit`
2. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx --test operational-resilience/test/operational-evidence.test.ts operational-resilience/test/derived-control-evaluators.test.ts operational-resilience/test/legacy-v1-normalizer.test.ts`
3. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx operational-resilience/src/legacy-v1-cli.ts normalize operational-resilience/fixtures/legacy-v1/golden/failure-map.input.json --inventory operational-resilience/contracts/legacy-v1-source-inventory.json --at 2026-08-24T20:00:00Z`
4. Validate each emitted golden result and the consolidated normalization receipt with `python3 -m jsonschema -i <result> operational-resilience/contracts/legacy-v1-normalization-result.schema.json`.
5. Parse every owned JSON file independently with `jq empty`; verify the product inventory equals the run-local pinned inventory for `sources`, `claim_ceiling`, and `authority_effect`.
6. Recompute every pinned source SHA-256 and require exact equality; missing or drifted sources fail validation.
7. Replay every hostile descriptor through the test harness and require its exact discriminator.
8. From repository root: `git diff --check -- projects/domainspec-v2/impl/operational-resilience projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/candidate-local-prototype/20260824T200639Z-orodi-legacy-v1-adapter-v1`.
9. Assert no symlinks/special files, no conflict markers, final newlines, and a stable sorted SHA-256 inventory across both owned roots.

Browser validation, generation, external network, live-tool invocation, load execution, fault injection, infrastructure plan/apply, canary, deployment, rollback, and publication are not applicable.

## Stop conditions

Stop for source drift that changes shape semantics, ambiguous mapping behavior, need for private prose copying, dependency installation, credentials, external effects, live bindings, protected owner decisions, writes outside exact scopes, or any failed acceptance-critical validation.

## Deferred lifecycle route

After prototype validation, a future lifecycle owner may run `invoke:refresh` over the exact candidate bytes. The mandatory Handoff Notice records that deferred work and grants no authorization to perform it.
