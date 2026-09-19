# ORODI Candidate-Local Prototype Validation Report

Status: **pass for the bounded candidate-local prototype**.

Work Pack: `WP-ORODI-PROTOTYPE-001`

Deferred-governance locator: `HN-B92ADFF20CC2`

## Implemented outcome

The three ordered SWUs are complete under `projects/domainspec-v2/impl/operational-resilience/`:

1. Closed JSON and TypeScript contracts for bindings, observations, C01-C16 control receipts, seven disjoint evidence states, and non-authoritative results.
2. A deterministic, read-only TypeScript validator and CLI that enforce exact references, owner/profile/policy shape, privacy/cardinality, telemetry accounting, freshness, exact control membership, workflow/product separation, and C11/C12 simulation/live semantics.
3. One complete synthetic positive bundle plus fifteen persisted hostile mutation cases and executable tests.

## Final validation

| Check | Result |
| --- | --- |
| TypeScript compile | pass, exit 0 |
| Unit/integration tests | pass, 20/20 |
| Positive CLI evaluation | pass, exit 0 |
| Bundle and result JSON Schemas | pass |
| Hostile raw CLI loop | pass, 15/15 rejected |
| Seven-state non-collapse | pass |
| Same-input determinism | pass |
| Dispatch revalidation | pass, zero blocks and flags |
| JSON parse and owned-file hygiene | pass |
| Symlink/special-file and tracked/untracked whitespace checks | pass |

Two earlier preflights failed and remain recorded in `PROTOTYPE-VALIDATION.json`: the default WSL PATH selected Windows `npm`, then TypeScript rejected a readonly test mutation cast. The runtime PATH was pinned and the test-only cast was repaired; the complete acceptance sequence was rerun successfully.

## Exact inventory

The product root contains 24 new files, 60,735 bytes. The SHA-256 of the path-sorted `sha256sum` stream is:

`a1e37f318362e42d047d2a11d685c727252929607fa16bf9854084eeec88d370`

The complete per-file inventory is in `PROTOTYPE-VALIDATION.json`. The synthetic passing receipt is `PROTOTYPE-EVALUATION-RECEIPT.json`.

## Boundary and deferred work

No live subject, environment, profile, tool, infrastructure target, canary controller, deployment transport, or credential was bound or contacted. No load, fault, infrastructure, canary, deployment, or rollback operation ran. Nothing was admitted, promoted, released, committed, pushed, or externally delivered.

Craft and the normal Invoke lifecycle were intentionally not reconciled. `HN-B92ADFF20CC2` points a future `invoke:refresh` owner to the exact candidate and validation evidence with `authorization: not-granted`.

Claim ceiling: repository-local synthetic contract/validator evidence only; no production readiness or protected-effect authority. `authority_effect: none`.
