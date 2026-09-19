# Task: Closed Evidence Eligibility Contract

Task ID: `TASK-ELIGIBILITY-CONTRACT`

SWU: `SWU-ORODI-ELIG-001`

## Outcome

Define the smallest closed TypeScript and JSON Schema contract that distinguishes `replay-only`, `runtime-eligible`, and `rejected` evidence while keeping replay observations separate from runtime-admitted observations.

## Write scope

- `projects/domainspec-v2/impl/operational-resilience/contracts/evidence-eligibility.ts`
- `projects/domainspec-v2/impl/operational-resilience/contracts/evidence-eligibility-result.schema.json`

## Required invariants

- Every result has `authority_effect: none`.
- Every accepted replay observation receives one eligibility receipt.
- Replay-only receipts have no eligible controls and list all six foundational controls as ineligible.
- A rejected request exposes no derived result.
- The contract cannot grant runtime admission, lifecycle status, or operational authority.

## Validation

Compile the repository-local TypeScript project and validate representative golden and rejected outputs against the closed schema.
