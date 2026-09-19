# WP-MTCLI-001 — frozen meta-type instantiation CLI

Status: planning baseline; product execution units are not yet selected.
Owner decision: `OWNER-BASELINE-DECISION.json`
Frozen baseline: `CANONICAL-IMPLEMENTED-BASELINE.v2.json`

## Shared invariants

- The baseline id and digest are inputs to every generation plan and receipt.
- Existing baseline bytes are never silently refreshed or repaired.
- Target paths are relative, normalized, contained and non-symlinked.
- Publication is atomic and refuses every pre-existing output path.
- Generation and post-write observation are separate steps.
- Unknown types, languages, relations and body fields fail closed.
- No unit publishes, releases, deploys or claims production readiness.

## Smallest Working Units

| SWU | Primary behavior | Write scope | Independently reviewable evidence |
|---|---|---|---|
| `SWU-MTCLI-001` | Freeze current evidence | `development/meta-type-instantiation-cli/**` | baseline validator PASS |
| `SWU-MTCLI-002` | Version the CLI product contract for `instantiate` | `impl/cli/contracts/**`, contract tests | old contract unchanged; new contract PASS |
| `SWU-MTCLI-003` | Load/select frozen catalog row | `impl/cli/src/meta-types/**`, focused tests | exact row/digest selection tests |
| `SWU-MTCLI-004` | Decode one Entity input | `impl/cli/src/input/**`, focused tests | positive/unknown/extra-field tests |
| `SWU-MTCLI-005` | Plan TypeScript Entity files | `impl/cli/src/generation/**`, focused tests | deterministic plan snapshot |
| `SWU-MTCLI-006` | Publish safely to an empty target | publisher module and tests | traversal/symlink/overwrite/atomicity tests |
| `SWU-MTCLI-007` | Expose CLI and receipt | CLI main, receipt module, CLI tests | isolated end-to-end test |
| `SWU-MTCLI-008..012` | Generalize exactly 13/39 | type/language generators and tests | aggregate coverage receipt |
| `SWU-MTCLI-013..016` | Enforce relationships and behavior | decoder/observer/receipt modules and tests | positive plus causal mutant receipts |
| `SWU-MTCLI-017..019` | Integrate and package privately | CLI/package/build fixtures | clean-root deterministic replay |

## Selection recommendation

Select `SWU-MTCLI-002` next. It is the narrowest reversible prerequisite for
L0 because the current candidate-1 contract explicitly permits no writes. Its
acceptance boundary is one versioned contract/schema/test set; it must not edit
or reinterpret candidate-1.

`SWU-MTCLI-003` is the successor only after `SWU-MTCLI-002` closes. No later
unit is implicitly selected.
