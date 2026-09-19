# ORODI Derived Foundational Controls — Prototype Validation Report

Status: **pass, candidate-local only**

Work Pack: `WP-ORODI-PROTOTYPE-002`

Handoff Notice: `HN-FFA71AA828B9`

## What this prototype now does

The prototype no longer has to trust a supplied foundational control state. It reads the closed evaluation binding and observations, derives C01, C05, C11, C12, C14, and C15 in stable order, emits one typed child receipt per control, and compares each derived state with the corresponding supplied claim.

The accepted synthetic bundle derives six `passed` states with `comparison: match`. If a fixture says C05 is `failed` while its facts prove `passed`, the new comparison emits `ORODI_DERIVED_CONTROL_STATE_MISMATCH`; both `derive` and the original `validate` path reject the bundle.

## Implemented rules

- C01 proves the required closed owner/binding structure; malformed structure prevents derivation.
- C05 detects missing product evidence, non-allowlisted attributes, and cardinality overflow.
- C11 distinguishes simulation not run, safe simulation, and simulation that falsely claims a deployment effect.
- C12 distinguishes live effect not run, no effect, non-independent effect, and an independently observed live effect.
- C14 distinguishes valid freshness, invalid future observations, expired bindings, and invalidation-key drift.
- C15 enforces both telemetry accounting equations, treats invalid partial counts as failure, and treats non-zero partial success as inconclusive. Fully accounted pending work remains valid.

Every result retains all seven evidence states and `authority_effect: none`.

## Validation result

| Check | Result |
| --- | --- |
| TypeScript compile | pass |
| Combined tests | 41/41 pass |
| Existing WP1 regression suite | 20/20 pass |
| New derived-control suite | 21/21 pass |
| Persisted derived hostile cases | 15/15 pass |
| Positive `derive` CLI | pass |
| Positive original `validate` CLI | pass |
| Forged supplied-state rejection | pass |
| Durable derived receipt versus live CLI output | exact semantic parity |
| Closed JSON Schema | pass |
| Owned JSON parsing | pass |
| Dispatch validation | pass, zero blocks and zero flags |
| Whitespace, conflict markers, file kinds, UTF-8, final newlines | pass |

Durable evidence:

- `DERIVED-CONTROL-RECEIPT.json` — SHA-256 `81d560fb131ba97dd8296065e33897bd122c1d56638842bd3c1c194ca7611eab`
- Product-root aggregate — SHA-256 `545daa6a2665f6ff2b79abc4f7f1ee365b430545c07154f97d284f8298039977`
- Fifteen derivation fixtures — aggregate SHA-256 `3d72b9bb60c7e2b0bf4ea41adbda6814fde27e406f4d4bcada6b3c4aaae9a8b0`

One parent verification attempt launched `--import tsx` from the wrong working directory and failed before running the CLI. It is preserved, not masked, in `VALIDATION-CWD-DEFECT-RECEIPT.json`. The exact Work Pack command from `projects/domainspec-v2/impl` passed with exit 0; no product repair was justified.

## Changed product surface

- Modified the existing type contract, validator, CLI, and README.
- Added one closed derived-result schema and one pure evaluator module.
- Added one 21-test derived suite and 15 persisted mutation descriptors.
- Preserved the original positive fixture and existing 20-test proof suite unchanged.
- Added no package root, dependency, network call, collector, adapter, actuator, or external transport.

## Boundary and next decision

This is repository-local candidate evidence, not synchronized lifecycle state or a live operational claim. Legacy v1 normalization, tool/profile admission, live monitoring, load/fault execution, infrastructure, canary, deployment, rollback, promotion, release, and production readiness remain deferred.

The recorded next route is a future `invoke:refresh` over the exact final bytes, followed by a separately authorized legacy v1 adapter Work Pack if desired. That route currently has `authorization: not-granted`.
