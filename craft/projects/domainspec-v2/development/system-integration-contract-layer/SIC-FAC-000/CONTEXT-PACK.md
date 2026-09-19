# SIC-FAC-000 Context Pack

Session evidence only. This pack does not modify or supersede the Revision 2 contract.

## Identity

- Task: `SIC-FAC-000 — Current Factory Substrate Re-baseline`
- Route: `continuation-router` -> `task-session:execute`
- Owner: existing generic factory owner
- Mode: Context Builder `standard`, strict
- Authorization: the operator's current “do this” selects the exact live bytes captured at task start and authorizes baseline inventory plus generic factory evidence execution only
- Evidence root: `projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000/`
- Material/product writes: none
- Execution outputs: this evidence root only

## Obligations

| ID | Acceptance-critical obligation | Evidence needed | Coverage |
| --- | --- | --- | --- |
| O1 | Bind one exact current-byte baseline | plan-derived input/component/tool locks plus a SHA-256 baseline inventory | covered by contract, CLI, planner, requests |
| O2 | Reproduce historical `MTF-029` drift | historical expected hashes and live hashes | covered by `MTF-029.json`; live hashes captured during execution |
| O3 | Provider-result ID equals locked provider ID | hostile mismatch probe with observable fail-closed result | covered by executor/normalizer inspection; probe required |
| O4 | Provider-result claim ceiling obeys the locked-node rule | hostile mismatch probe with observable fail-closed result | covered by request/provider/executor/normalizer inspection; probe required |
| O5 | Independent denominator accounting is non-empty and kills a mutant | proof-accounting tests and one current run with denominator-backed evidence | covered by recomputation source and reference request; execution required |
| O6 | Node semantic artifact hash matches outer receipt node hash | recompute canonical `semantic.json` hashes against `semantic-receipt.json` | covered by executor/verifier; explicit audit required |
| O7 | Reference suite plan/run/replay/verify/reproduce passes | exact command outputs and terminal run evidence | covered by CLI and reference request; execution required |
| O8 | W3 suite plan/run/replay/verify/reproduce passes | exact command outputs and terminal run evidence | covered by CLI and W3 request; execution required |
| O9 | Joins cannot consume paths, serialized/foreign/historical handles | current tests/source inspection plus an explicit compatibility verdict | covered by planner/executor/replay sources; validation required |
| O10 | Classify integration obligations | compatibility matrix with reuse/adapter/input/blocker | covered by Revision 2 contract and observed factory result |
| O11 | Preserve claim ceiling | terminal result contains no integration-runtime, admission, promotion, release, or deployment claim | covered by task contract; terminal review required |

All obligations are covered by selected evidence or an exact declared execution check. Strict coverage is `pass`; passing execution remains undecided.

## Selected evidence

| Path | Selector | Obligation |
| --- | --- | --- |
| `.../revision-2/RUNTIME-HANDOFF.md` | `Exact next owner route`, `Downstream gates`, `Preserved boundaries` | O1, O10, O11 |
| `.../revision-2/SIC-FAC-000-CONTRACT.md` | `Required baseline decision`, `Acceptance checks`, `Stop conditions` | O1-O11 |
| `impl/architecture-conformance/factory/cli/index.ts` | `runFactoryCli`, `localPath`, terminal error JSON | O1, O7, O8 |
| `impl/architecture-conformance/factory/pipeline/plan-factory-run.ts` | `planFactoryRun`, `resolveRef`, lock and run ID derivation | O1, O7, O8 |
| `impl/architecture-conformance/factory/pipeline/execute-factory-run.ts` | `bindReplayVerifiedSemanticResult`, `executeFactoryRun`, upstream handle construction | O3, O4, O6, O9 |
| `impl/architecture-conformance/factory/evidence/normalize-semantic-receipt.ts` | `normalizeNode`, denominator checks, `normalizeFactorySemanticReceipt` | O3-O6 |
| `impl/architecture-conformance/factory/pipeline/replay-factory-run.ts` | `replayFactoryRun`, current-run handles | O7-O9 |
| `impl/architecture-conformance/factory/pipeline/reproduce-reference-suite.ts` | `reproduceReferenceSuite`, product-tree inventory, isolated roots | O7, O8, O11 |
| `impl/architecture-conformance/factory/evidence/verify-run-root.ts` | complete byte index and semantic receipt verification | O6-O8 |
| `impl/architecture-conformance/kernel/evidence/recompute-proof-accounting.ts` | denominator owner, completeness, killed-mutant diagnostics | O5 |
| `factory/fixtures/reference-suite.request.json` | nine-node current reference graph and claim ceiling | O1, O5-O7, O9, O11 |
| `factory/fixtures/w3-effects-connections.request.json` | W3 node, locked inputs, claim ceiling | O1, O8, O11 |
| `development/meta-type-realization-factory/receipts/MTF-029.json` | recorded outputs, validation, claim ceiling | O2, O11 |

The two `.../revision-2/` paths resolve under `projects/domainspec-v2/development/refinement-runs/20260813T153029Z-system-integration-contract-layer-revision-2/`; all `impl/` paths resolve under `projects/domainspec-v2/`.

## Execution contract

Run both requests through these five operations:

1. `plan` and persist the emitted plan JSON;
2. `run` into a new suite-specific output parent;
3. `replay` the exact terminal run path returned by `run`;
4. `verify` that exact run path;
5. `reproduce` into a new suite-specific reproduction root.

Then run the scoped factory typecheck and test suite, execute non-mutating hostile probes for provider ID and claim ceiling, audit semantic hashes and denominator totals, and write the three required top-level receipts.

## Write and effect boundary

Allowed outputs are restricted to:

- `BASELINE-SCOPE.json`
- `COMPATIBILITY-MATRIX.json`
- `RESULT.json`
- `TASK-SESSION-RECEIPT.json`
- `CONTEXT-PACK.md` and `context-pack.json`
- `TASK-SESSION-PREFLIGHT.json` and `CONTINUATION-ROUTE.json`
- `commands/**`, `probes/**`, and `runs/**`

No implementation, definition, profile, registry, factory, test-source, package, lockfile, Craft, Arcanum, Git, or external-system mutation is allowed. The existing dirty worktree is input evidence and must remain byte-identical across the task.

## Decisions and assumptions

- Resolved consequential/reversible decision: use the exact current live bytes at task-start as the comparison baseline. This does not adopt them.
- No automatic product choice: SQLite-direct and cross-package validator reuse remain downstream and unselected.
- If either generic invariant probe does not fail closed, return `BLOCK`; this task has no factory-core repair authority.
- If any acceptance-critical command fails, preserve output and return `BLOCK` without substituting a weaker check.

## Fallback search

None by default. Search only a named missing command dependency inside the exact factory/architecture-conformance paths; do not broaden to unrelated repository areas or the network.

## Claim ceiling

A passing result can establish only that the selected current local factory substrate reproduces its declared reference and W3 experiments and enforces the enumerated generic evidence invariants. It cannot establish integration behavior, profile admission, authority change, promotion, publication, release, deployment, or production readiness.
