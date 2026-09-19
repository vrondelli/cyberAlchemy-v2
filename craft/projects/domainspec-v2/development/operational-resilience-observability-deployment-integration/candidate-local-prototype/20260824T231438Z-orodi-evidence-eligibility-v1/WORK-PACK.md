# Work Pack: ORODI Evidence Eligibility and Replay Integration

Work Pack ID: `WP-ORODI-PROTOTYPE-004`

Designation: **candidate-local-prototype fast lane**

Normal lifecycle status: **deferred, not waived**

Normal Invoke/Task Session readiness: **not claimed**

## Outcome

Implement a closed, deterministic eligibility boundary that proves legacy-v1 declaration replays cannot satisfy runtime operational controls. Preserve replay observations for audit, admit none to runtime evaluation, invoke the existing foundational derived evaluator over the admitted set, and reject forged control claims.

## Authorization and ceiling

The initiating DomainSpec v2 project owner authorized the WP4 candidate-local lane by replying `authorized` to the exact proposed scope. This authorizes the serial repository-local write scopes and validation commands below. It does not authorize live tools, runtime profile admission, infrastructure, load/fault execution, canary, deployment, rollback, external transport, ontology/profile promotion, lifecycle reconciliation, or Git publication.

## Fixed eligibility rules

1. A legacy normalization must be exact adapter v1 output, bind one uniquely pinned normalizable source, and contain one structurally valid observation.
2. A legacy observation is replay-only only when it is product-plane simulation, claims no deployment effect, is not independently observed, has zero telemetry accounting, preserves its source digest and family, and is not future-dated.
3. Every replay-only observation has zero eligible controls and marks all six foundational controls ineligible.
4. `runtime-eligible` remains in the vocabulary but is unreachable in WP4 because no admitted live profile exists.
5. Rejected, forged, duplicate, drifted, or malformed normalization results produce no replay assembly and no derived result.
6. A valid replay-only request assembles an empty `runtime_admitted_observations` set and invokes the existing derived evaluator over that set.
7. The exact foundational outcome is C01 `passed`, C05 `missing`, C11 `not-run`, C12 `not-run`, C14 `passed`, C15 `missing`; divergent supplied claims reject the eligibility result.

## Execution waves and SWUs

### W0 / L0 — Closed eligibility contract

Task: [TASK-ELIGIBILITY-CONTRACT](work-pack/tasks/TASK-ELIGIBILITY-CONTRACT.md)

SWU `SWU-ORODI-ELIG-001` writes:

- `projects/domainspec-v2/impl/operational-resilience/contracts/evidence-eligibility.ts`
- `projects/domainspec-v2/impl/operational-resilience/contracts/evidence-eligibility-result.schema.json`

Acceptance: closed types and schema preserve replay/runtime/rejected states, per-observation receipts, admitted/replay separation, derived-result evidence, and `authority_effect: none`.

### W1 / L1-L2 — Pure gate and replay assembly

Depends on W0. Task: [TASK-ELIGIBILITY-GATE](work-pack/tasks/TASK-ELIGIBILITY-GATE.md)

SWU `SWU-ORODI-ELIG-002` writes:

- `projects/domainspec-v2/impl/operational-resilience/src/evaluate-evidence-eligibility.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/eligibility-replay-cli.ts`

Acceptance: exact inventory/provenance checks, stable findings, zero runtime admissions, pure assembly, existing derived-evaluator invocation, exact states, and no I/O outside the CLI wrapper.

### W2 / L2 — Golden, hostile, and regression proof

Depends on W1. Task: [TASK-REPLAY-PROOF](work-pack/tasks/TASK-REPLAY-PROOF.md)

SWU `SWU-ORODI-ELIG-003` writes:

- `projects/domainspec-v2/impl/operational-resilience/fixtures/eligibility/golden/*.json`
- `projects/domainspec-v2/impl/operational-resilience/fixtures/eligibility/hostile/*.json`
- `projects/domainspec-v2/impl/operational-resilience/test/evidence-eligibility.test.ts`
- `projects/domainspec-v2/impl/operational-resilience/README.md`
- this run’s validation JSON and Markdown report.

Acceptance: exact golden states and receipt counts, every hostile discriminator, CLI parity, schema replay, purity, all previous tests, source pins, and hygiene pass.

## SWU atomicity

| SWU | Candidate child units | Retained-boundary rationale | Verdict |
| --- | --- | --- | --- |
| 001 | Type definitions; JSON Schema. | Either alone leaves the output contract ambiguous or unenforceable. | pass |
| 002 | Classifier; assembler; derived invocation; CLI. | The classifier without admitted-set assembly does not prove containment; the CLI is only a thin local projection of the same function. | pass |
| 003 | Golden fixtures; hostile fixtures; test harness; report. | Fixtures without executable interpretation or tests without persisted attacks are not independently sufficient replay evidence. | pass |

First-unit narrowness: SWU-001 is the smallest reversible trust-building step because it changes no evaluator behavior and fixes the exact result vocabulary before code.

## Exact validation commands

Run from `/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl` unless stated otherwise:

1. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH npm exec -- tsc --project operational-resilience/tsconfig.json --noEmit`
2. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx --test operational-resilience/test/operational-evidence.test.ts operational-resilience/test/derived-control-evaluators.test.ts operational-resilience/test/legacy-v1-normalizer.test.ts operational-resilience/test/evidence-eligibility.test.ts`
3. `PATH=/home/vrondelli/.nvm/versions/node/v22.12.0/bin:$PATH node --import tsx operational-resilience/src/eligibility-replay-cli.ts evaluate operational-resilience/fixtures/eligibility/golden/replay-request.json --inventory operational-resilience/contracts/legacy-v1-source-inventory.json`
4. Validate the golden CLI result and every emitted hostile result with `python3 -m jsonschema -i <result> operational-resilience/contracts/evidence-eligibility-result.schema.json`.
5. Parse every owned JSON file independently with `jq empty` and replay every hostile descriptor.
6. Recompute all eleven legacy source hashes and require exact inventory equality.
7. From repository root: `git diff --check -- projects/domainspec-v2/impl/operational-resilience projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/candidate-local-prototype/20260824T231438Z-orodi-evidence-eligibility-v1`.
8. Assert no symlinks/special files, conflict markers, empty files, or missing final newlines; record a stable sorted product SHA-256 inventory.

Browser, generation, external network, live tools, load/fault execution, infrastructure plan/apply, canary, deployment, rollback, and publication are not applicable.

## Stop conditions

Stop for ambiguous eligibility semantics, any request to mark legacy replay runtime-eligible, source drift, dependency installation, credentials, external effects, protected owner choices, writes outside exact scopes, or failed acceptance-critical validation.

## Deferred lifecycle route

Before product mutation, publish and join the mandatory Handoff Notice. After candidate validation, lifecycle reconciliation remains a separately authorized `invoke:refresh` route; the notice grants no authority.
