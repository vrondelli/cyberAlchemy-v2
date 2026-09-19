# Validation Strategy: ORODI Derived Foundational Controls

## Acceptance boundary

Acceptance is candidate-local only. Every command must operate on repository-local fixtures and exact owned paths. A later successful command cannot mask an earlier failure.

## Checks

1. Compile the complete TypeScript prototype without emitting bytes.
2. Run both the existing WP1 test suite and the new derived-control suite in one Node test invocation.
3. Derive the valid fixture twice at the same explicit time and require byte-identical JSON.
4. Validate the derived result against the new closed JSON Schema.
5. Replay every persisted derivation mutation descriptor and assert its exact derived state, comparison, or structural rejection.
6. Confirm the original `validate` command rejects a forged supplied foundational state.
7. Parse every owned JSON object independently and inspect exact changed paths.
8. Run scoped whitespace, conflict-marker, file-kind, final-newline, and stable digest-inventory checks.

## Hostile matrix

| Boundary | Expected discrimination |
| --- | --- |
| missing C01 owner binding | structural reject; comparison unavailable |
| C05 unsafe attribute/cardinality | derived `failed`; supplied `passed` mismatches |
| C11 no simulation | `not-run` |
| C11 simulation effect | `failed` |
| C12 no live deployment observation | `not-run` |
| C12 non-independent live effect | `invalid` |
| C14 expiry/invalidation drift | `stale` |
| C15 accounting loss | `failed` |
| C15 partial-success accounting | `inconclusive`; fully accounted pending work remains valid |
| forged supplied state over valid facts | derived `passed`; comparison `mismatch`; aggregate reject |

## Non-applicable surfaces

No browser UI, generator, network, load tool, fault tool, infrastructure provider, canary controller, deployment target, or rollback target exists in this Work Pack. Their validation is deferred, not passed.
