# Work Pack — Minted Project Node Package

Status: `implementation complete through W3; SWU-MNP-007 admission deferred`  
Complexity: `high`  
Output mode: `split`  
Active SWU: none; implementation stream complete, admission deferred

## Objective

Implement the selected project-mint machine-node package through the owner-bound homes and experimental admission posture, preserving the factory/consumer/generated-view boundaries proven by the toy game.

## Task Board

| Task | Layer | SWUs | Status | Contract |
| --- | --- | --- | --- | --- |
| TASK-MNP-CONTRACT | L0 | SWU-MNP-001 + R1 + R2 | completed; receipt pass | [task](work-pack/tasks/TASK-MNP-CONTRACT.md) |
| TASK-MNP-COMPILER | L0 | SWU-MNP-002, SWU-MNP-003 | completed; receipt pass | [task](work-pack/tasks/TASK-MNP-COMPILER.md) |
| TASK-MNP-VIEWS | L1 | SWU-MNP-004 | completed; receipt pass | [task](work-pack/tasks/TASK-MNP-VIEWS.md) |
| TASK-MNP-MINTER | L1 | SWU-MNP-005 | completed; receipt pass | [task](work-pack/tasks/TASK-MNP-MINTER.md) |
| TASK-MNP-CONFORMANCE | L2 | SWU-MNP-006 | completed; receipt pass | [task](work-pack/tasks/TASK-MNP-CONFORMANCE.md) |
| TASK-MNP-ADMISSION | L3 | SWU-MNP-007 | deferred by operator | [task](work-pack/tasks/TASK-MNP-ADMISSION.md) |

## SWU Manifest

| SWU | Parent | Goal | Dependencies | Write scope | Evidence | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-MNP-001 | [CONTRACT](work-pack/tasks/TASK-MNP-CONTRACT.md) | author machine contracts and profile binding | authority and selection decisions PASS | `definitions/minted-project/`; `impl/spec/minted-project/`; contract fixtures under the minted-project conformance root | schemas + red/green fixtures + registry/profile binding | `npm --prefix projects/domainspec-v2/impl run tools:test` and `npm --prefix projects/domainspec-v2/impl run typecheck` | local fallback | completed; receipt pass |
| SWU-MNP-001-R2 | [CONTRACT](work-pack/tasks/TASK-MNP-CONTRACT.md) | admit empty project/feature sources and empty generated provenance | empty-project Option 1 PASS | `impl/spec/minted-project/`; resolver and minted-project tests | empty resolver/compiler/view proof + exact repair digests | `npm --prefix projects/domainspec-v2/impl run tools:test` and `npm --prefix projects/domainspec-v2/impl run typecheck` | local fallback | completed; receipt pass |
| SWU-MNP-002 | [COMPILER](work-pack/tasks/TASK-MNP-COMPILER.md) | implement safe project/source resolver | 001 | `impl/tools/minted-project/` plus `impl/tools/tests/minted-project-resolver.test.ts` | containment, duplicate, missing, and source-set tests | `npm --prefix projects/domainspec-v2/impl run tools:test` | local fallback | completed; receipt pass |
| SWU-MNP-003 | [COMPILER](work-pack/tasks/TASK-MNP-COMPILER.md) | validate/normalize graph and source manifest | 001,002 + 001-R1 | `impl/tools/minted-project/` plus `impl/tools/tests/minted-project-compiler.test.ts` | formation/profile + relationship + deterministic graph tests | `npm --prefix projects/domainspec-v2/impl run tools:test` | local fallback | completed; receipt pass |
| SWU-MNP-004 | [VIEWS](work-pack/tasks/TASK-MNP-VIEWS.md) | generate Markdown and source-aware receipts | 003 | `impl/tools/minted-project/` plus `impl/tools/tests/minted-project-views.test.ts` | byte equality and stale source/graph/view controls | `npm --prefix projects/domainspec-v2/impl run tools:test` | local fallback | completed; receipt pass |
| SWU-MNP-005 | [MINTER](work-pack/tasks/TASK-MNP-MINTER.md) | emit a clean consumer project with contained outputs | 001,004 + 001-R2 | `impl/tools/minted-project/` including `templates/project/`, plus `impl/tools/tests/minted-project-minter.test.ts` | clean mint/rebuild, path leakage scan, output-root failures | `npm --prefix projects/domainspec-v2/impl run tools:test` | local fallback | completed; receipt pass |
| SWU-MNP-006 | [CONFORMANCE](work-pack/tasks/TASK-MNP-CONFORMANCE.md) | prove repeatability and profile/degraded-mode behavior | 003,004,005 | `impl/test-derivation-engine/__fixtures__/minted-project/` plus engine conformance tests | second fixture, 10 controls, profile matrix, degraded receipts | `npm --prefix projects/domainspec-v2/impl run engine:test` | independent verifier recommended | completed; receipt pass |
| SWU-MNP-007 | [ADMISSION](work-pack/tasks/TASK-MNP-ADMISSION.md) | bind release/admission and effective fixture migration by owner receipt | 006 + release-owner gate | private authority/admission evidence selected by that later owner gate; no fixture move in this SWU without a destination | digest receipt, disposition matrix, mutation invalidation | `npm --prefix projects/domainspec-v2/impl run validate` plus manual owner review | manual | deferred by operator |

## Validation Strategy

1. Contract validation: every required field and prohibited authority collapse has positive and negative fixtures.
2. Formation/profile validation: a kind name alone never admits a node; configured formation/profile status is derived from authority.
3. Edge validation: active exact endpoint signatures pass; unknown, wrong endpoint, generated, deprecated, and deferred authoring fail under their own classes.
4. Determinism: unchanged source sets produce byte-identical graph, manifest, Markdown, and receipts.
5. Navigation: every graph ID resolves through exactly one manifest record to a containing canonical source.
6. Drift: stale source, graph, source manifest, and Markdown each fail independently.
7. Mint containment: all canonical sources and generated outputs resolve under the new project root; scans find no DomainSpec development-fixture path.
8. Governance: admission and migration require digest-bound owner receipt and fail after deliberate artifact mutation.

## Blocker and Gap Ledger

| ID | Status | Owner | Repair path |
| --- | --- | --- | --- |
| PLAN-B1 exact authority homes | resolved | `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE` Decision 1 | reflected in every SWU write scope |
| PLAN-B2 admission posture | resolved | Decision 2 | experimental profile and distinct failure classes bound; release remains separate |
| PLAN-B3 fixture disposition | resolved | Decisions 3 and 4 | classifications bound; actual migration waits for a consumer-example destination |
| GAP-MNP-CROSS-FEATURE | deferred | future design owner | rerun Refine on multi-feature corpus before claim |
| GAP-MNP-EDGE-LIFECYCLE | deferred | future owner | rerun A/B tournament when independent lifecycle exists |
| MNP-FORMATION-BODY-MAPPING | resolved | Option 1 + SWU-MNP-001-R1 | per-kind body schemas validated; compiler retry unblocked |

## Handoff Contract

Each selected SWU returns the following result shape:

```yaml
swu_id: SWU-MNP-<nnn>
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage | local-fallback | blocked
receipt_artifact: <owner-approved run path>
files_touched: []
validation: []
blockers: []
residue: []
reroute: <next owner or none>
handoff_note: <synchronization required>
```

`SWU-MNP-001` completed with a passing Task Session receipt at
`../../task-sessions/20260714-swu-mnp-001/receipt.json`. No SWU is currently active.
`SWU-MNP-002` is dependency-ready but requires a separate explicit selection;
Invoke Refresh still owns synchronization of `PLAN.md` and
`transport-report.json` from the receipt.
