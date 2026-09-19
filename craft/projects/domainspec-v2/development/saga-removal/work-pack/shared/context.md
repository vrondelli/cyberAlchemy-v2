# Shared Context: Saga Removal

## Authority

- Decision: ../../ds-d1-improvement-plan/decisions/DEC-DSD1-SAGA-FORK.md
- Evidence: ../../ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md
- DS-D1 registry: ../../../definitions/meta-types/meta-types.yml
- DS-D8 registry: ../../../definitions/relationships/relationships.yml

## Boundaries

- Remove active Saga surfaces, not history.
- Keep orchestrates and move cross-feature behavior to Workflow.
- Do not renumber stable DS-D1 IDs.
- Use one widened Workflow relationship row.
- Add attribute-one-of as an attestation rule.
- Stop if external consumer evidence appears.

## Runtime Context Rule

Task Session builds a fresh strict context pack for one SWU. Do not copy the
entire research corpus into execution context.
