# Task: Pure Evidence Eligibility Gate

Task ID: `TASK-ELIGIBILITY-GATE`

SWU: `SWU-ORODI-ELIG-002`

Depends on: `TASK-ELIGIBILITY-CONTRACT`

## Outcome

Implement a deterministic gate that validates exact legacy-v1 normalization outputs, classifies normalizable declarations as replay-only, admits zero runtime observations, and invokes the existing foundational evaluator over that empty admitted set.

## Write scope

- `projects/domainspec-v2/impl/operational-resilience/src/evaluate-evidence-eligibility.ts`
- `projects/domainspec-v2/impl/operational-resilience/src/eligibility-replay-cli.ts`

## Required invariants

- Classification is fail-closed and does not mutate inputs.
- Source hash, source family, observation shape, replay time, and uniqueness are checked exactly.
- Live mode, deployment effect, independent observation, non-zero telemetry, and workflow-plane evidence are rejected.
- `runtime-eligible` is unreachable in this Work Pack.
- Valid replay-only inputs retain replay evidence but assemble an empty runtime-admitted set.
- Existing derived-control code, not a duplicated evaluator, produces the post-gate control state.
- The CLI is only a filesystem wrapper around the pure evaluator.

## Validation

Compile, run golden evaluation twice for byte-stable output, compare CLI and direct-function results, and validate all results against the result schema.
