# ORODI WP4 Evidence Eligibility Prototype Validation

Status: **pass — candidate-local prototype only**

Work Pack: `WP-ORODI-PROTOTYPE-004`

Handoff Notice: `HN-DBA92C7E3962`

Authority effect: `none`

## What now works

The legacy-v1 adapter's two supported declaration shapes can be replayed through a closed eligibility gate without being mistaken for runtime evidence. Both observations remain available for audit as `replay-only`; both receive receipts with zero eligible controls and all six foundational controls ineligible; zero observations enter `runtime_admitted_observations`.

The gate then calls the existing foundational evaluator over that empty admitted set. It produces exactly:

| Control | State |
| --- | --- |
| C01 | `passed` |
| C05 | `missing` |
| C11 | `not-run` |
| C12 | `not-run` |
| C14 | `passed` |
| C15 | `missing` |

The overall derived verdict remains `reject`, while comparison is `match`: the supplied claims accurately describe what the empty admitted set proves. `runtime-eligible` exists as a future contract term but is unreachable in WP4.

## Evidence-laundering proof

The test suite executes the same existing foundational evaluator twice. Directly assembling the legacy simulations makes C05, C11, and C15 appear `passed`. Passing them through the new eligibility boundary first makes those states `missing`, `not-run`, and `missing` because the admitted set is empty. This is the precise path WP4 was created to close.

Seventeen hostile fixtures reject normalization rejection, live mode, deployment effects, independent-observation claims, non-zero telemetry, workflow-plane substitution, source drift, unknown shapes, family drift, duplicate IDs, missing normalizations, future replay, forged C05/C11 passes, malformed observations, missing controls, and unexpected fields. Every rejection emits no assembly, no receipts, and no derived result.

## Validation

- TypeScript compile: pass.
- Complete suite: 88/88 tests pass; 26 are WP4 and 62 are pre-existing regressions.
- Golden CLI: exit 0 and byte-equal to the pure function.
- Closed result schema: golden and every hostile emitted result pass.
- Legacy source inventory: all eleven current source hashes pass; only two shapes remain normalizable.
- Corrected closeout projection: CLI 0, schema 0, jq 0, exact-state assertion 0.
- All scoped JSON parses independently.
- Scoped whitespace, regular-file, symlink/special-file, empty-file, conflict-marker, and final-newline checks pass.
- Product inventory: 89 files, sorted path/SHA inventory digest `69243c5bf08e17eee9761e4420935ab68c922971e4ef6bb37f43cf89045f1a7d`.

Invoke and its linked Distill child were recorded exactly once in the central observability ledger at lines 699 and 700. Their dedupe, central ledger, reflection state, and newly appended hook rows validate. The threshold evaluator recommended `reflect-now`; that recommendation is non-authoritative and was not executed within this WP4 product lane. Distill telemetry is explicitly `partial` because the role-simulated reduction produced source-bound Markdown rather than the structured runtime request/receipt/result trio.

One governance-only closeout projection defect was preserved in `CLOSEOUT-PROJECTION-DEFECT-RECEIPT.json`: the original jq expression used the wrong `from_entries` input shape and its status was omitted from the final shell exit. The corrected command captures and asserts every status; it passes without changing product bytes. Two earlier independent Handoff Notice invocations also used incorrect command shapes; the canonical resolve and inspect commands subsequently passed.

## Boundary and next decision

This prototype does not execute or validate live monitoring, load, faults, infrastructure, canary, deployment, rollback, release, or production behavior. It does not admit a profile or ontology branch, synchronize the normal lifecycle, mutate Git, or authorize promotion.

Lifecycle reconciliation remains deferred, not waived. Handoff `HN-DBA92C7E3962` records a possible future `invoke:refresh`, but its authorization is explicitly `not-granted`; a separate owner decision is required.
