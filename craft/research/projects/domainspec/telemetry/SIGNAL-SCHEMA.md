# DomainSpec Telemetry Schema

Append-only run signals for DomainSpec project execution.

## Envelope

- id
- timestamp
- project_id
- experiment_id
- run_id
- source
- type
- severity
- data

## Required Types

- stage-verdict
- gate-decision
- integrity-issue
- evidence-update
- rework

## Invariants

1. every run emits at least one stage-verdict
2. any blocked gate emits a remediation block
3. evidence-update must reference a claim ID and result artifact
