# TASK-IOLM-00C-UI — Fixture-Backed Workable Example

## Mapping and status

- Slice/layer/wave: `S-00C-UI / L0C-demo / W0C-UI`.
- Parent status: active after fresh A1 current-fixture rebind `20260723T002902Z-current-fixture-rebind` passed; A2 regeneration is selected, historical A1–A3 receipts and both blocked A4 attempts remain immutable, and no browser-acceptance handle exists.
- Execution owner: four sequential bounded Task Sessions, one selected at a time.
- Selected unit: `SWU-IOLM-00C-UI-A2` regeneration only, consuming the fresh current-generation A1 receipt; A3 revalidation and A4 replay are gated in sequence. The historical passes remain audit evidence but cannot satisfy the current fixture generation.
- Superseded unit: `SWU-IOLM-00C-UI-A`; it never executed or passed and is not a parent or reusable receipt.
- Primary behavior: serve one pinned DomainSpec fixture as synchronized graph, outline, table, shared selection, and provenance inspector through one immutable `DemoSnapshotV1`.

## Source contracts

- [Accepted workable-example findings](../../../research/2026-07-22-iolm-workable-example/findings.md), including the exact first-build slice and file boundary.
- Sole upstream dependency: passed [`SWU-IOLM-00C-A`](../session-evidence/SWU-IOLM-00C-A/RESULT.md) and handle `iolm-candidate-contract/v1`.
- Read-only fixture inputs:
  - `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json` — refresh snapshot SHA-256 `1f0691fac9ed9612605d62d8b390e9b39eca24b6f11a6b0868c7591c6179e7ae`;
  - `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json` — refresh snapshot SHA-256 `ed4a1fdf4684b26fb5dbf086cf98f80050734ffea1d2c845503f0bf429e9cd6e`;
  - `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json` — refresh snapshot SHA-256 `14ac660824e8a697ef6ae3e20b18132bf99aa45f9adbe46e46e686db36260fbe`.
- Snapshot values: project `key-and-door`; source-set `33b2b650bcd5e4f4ab8c4f03c892bca8fcc660d167c9b6220a775e0b5bccdb1c`; profile `feature-with-independent-node-files@1` with digest `0868785499944ce2b21b915962cba48f8b21d627b840c24d81c77194e8864478`; generator `minted-project-tools/v1`; kinds digest `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede`; relationships digest `ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f`; 4 nodes and 3 edges.
- These hashes are a Refresh selection snapshot, not permission to skip A1 preflight. A1 must re-read all three files immediately before mutation and block on any drift.
- Existing candidate posture/provenance contract under `prototype/contracts/candidate/` is read-only input.
- Runtime floor: Python 3.11+, Node 22+, ES2022-capable browser; no package installation.

## SWU-IOLM-00C-UI-A1 — Pinned fixture boundary

| Field | Contract |
|---|---|
| Dependency | passed `iolm-candidate-contract/v1` |
| Primary behavior | validate the exact three fixture paths, nine pinned values, 4/3 counts, IDs, joins and containment, then expose only the fixed loopback GET/HEAD surface |
| Output | `iolm-fixture-boundary/v1` |
| Implementation files | `contracts/source-binding.v1.json`; `contracts/source-binding.v1.schema.json`; `serve_demo.py`; `assets/gateway.mjs`; `assets/binding-guard.mjs`; `tests/binding-guard.test.mjs`; `tests/test_server_contract.py` |
| Lifecycle scope | historical root remains read-only; new evidence only under `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/rebinds/<run-id>/**` |
| Acceptance | Python/Node boundary suites prove hashes, realpaths, symlink rejection, pre-bind failure, fixed fixture/application routes, GET/HEAD only, 404/405 and no mutation |
| Status | passed for the current generation at [rebind result](../session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/RESULT.md) and [receipt](../session-evidence/SWU-IOLM-00C-UI-A1/rebinds/20260723T002902Z-current-fixture-rebind/execution-receipt.json); historical root result and receipt remain immutable and stale for this generation |

## SWU-IOLM-00C-UI-A2 — Immutable snapshot model

| Field | Contract |
|---|---|
| Dependency | passing `iolm-fixture-boundary/v1` |
| Primary behavior | transform the guarded bundle into one schema-valid immutable `DemoSnapshotV1`, including exact default and Player question slices |
| Output | `iolm-demo-snapshot/v1` |
| Implementation files | `contracts/demo-snapshot.v1.schema.json`; `assets/demo-snapshot-v1.mjs`; `assets/question-slice.mjs`; `generated/read-models/demo-snapshot.v1.json`; `tests/demo-snapshot-v1.test.mjs`; `tests/question-slice.test.mjs`; `tests/fixtures/demo-snapshot-v1-cross-feature.synthetic.json` |
| Lifecycle scope | historical root remains read-only; future evidence only under `work-pack/session-evidence/SWU-IOLM-00C-UI-A2/regenerations/<run-id>/**` |
| Acceptance | Node tests prove schema, exact 4/3 and 2/1 sets, IDs, joins, provenance, immutability, deterministic serialization and typed negatives |
| Status | selected for one current-generation regeneration against fresh A1 rebind `20260723T002902Z-current-fixture-rebind`; historical [result](../session-evidence/SWU-IOLM-00C-UI-A2/RESULT.md) and [receipt](../session-evidence/SWU-IOLM-00C-UI-A2/execution-receipt.json) remain immutable |

## SWU-IOLM-00C-UI-A3 — Interactive synchronized viewer

| Field | Contract |
|---|---|
| Dependency | passing `iolm-demo-snapshot/v1` |
| Primary behavior | render the same active stable-ID set as graph, outline and table with shared selection, persistent provenance inspector, posture strip and no forbidden controls |
| Output | `iolm-interactive-viewer/v1` |
| Implementation files | `README.md`; `index.html`; `assets/demo.css`; `assets/app.mjs`; `assets/selection.mjs`; `assets/graph-view.mjs`; `assets/outline-view.mjs`; `assets/table-view.mjs`; `assets/provenance-inspector.mjs`; `tests/projections.test.mjs`; `tests/selection-inspector.test.mjs` |
| Lifecycle scope | historical root and repair evidence remain read-only; future revalidation evidence only under `work-pack/session-evidence/SWU-IOLM-00C-UI-A3/revalidations/<run-id>/**` |
| Acceptance | pure projection/selection tests plus loopback HTTP asset smoke; no rendered-browser, Playwright, accessibility, usability or manual-success claim |
| Status | gated and unselected pending a fresh current-generation A2 receipt; historical source-contract and [repair](../session-evidence/SWU-IOLM-00C-UI-A3/repairs/2026-07-22-firefox-event-target/RESULT.md) passes remain immutable |
| Repair status | complete; delegated Firefox text-node targets normalize through `parentElement`, the pure regression passes, and `B-IOLM-A3-FIREFOX-EVENT-TARGET` is resolved for this lifecycle |
| Repair write scope | `assets/app.mjs`; `assets/selection.mjs`; `tests/selection-inspector.test.mjs`; new lifecycle evidence only under `session-evidence/SWU-IOLM-00C-UI-A3/repairs/**` |

## SWU-IOLM-00C-UI-A4 — Browser acceptance and evidence

| Field | Contract |
|---|---|
| Dependency | passing `iolm-interactive-viewer/v1`, with A1 and A2 receipt chain bound |
| Primary behavior | exercise the complete sidecar through real Firefox and aggregate honest automated, manual and overall evidence |
| Output | `iolm-browser-acceptance/v1` |
| Write scope | new `generated/runs/<run-id>/{automated-results.json,manual-results.json,validation-summary.json}`; new `work-pack/session-evidence/SWU-IOLM-00C-UI-A4/output/playwright/<run-id>/**`; new `work-pack/session-evidence/SWU-IOLM-00C-UI-A4/replays/<run-id>/**`; existing A4 evidence is read-only |
| Acceptance | run `PW-BB-01`–`PW-BB-10` through the local Playwright wrapper with `--browser firefox`; rerun all deterministic suites; verify network, console, scope and exclusion evidence; retain unperformed human checks as `NOT_RUN` |
| Repair rule | stop and route an implementation defect receipt to A1, A2 or A3; A4 cannot modify their implementation files |
| Status | gated and unselected pending fresh current-generation A1 -> A2 -> A3 receipts; original terminal [result](../session-evidence/SWU-IOLM-00C-UI-A4/RESULT.md), [receipt](../session-evidence/SWU-IOLM-00C-UI-A4/execution-receipt.json), [defect](../session-evidence/SWU-IOLM-00C-UI-A4/DEFECT-RECEIPT.md), and replay `20260722T182915Z-firefox-replay` remain immutable; no `iolm-browser-acceptance/v1` exists |

## Binding and server acceptance

`source-binding.v1.json` carries the three literal repo-root-relative fixture
paths, all nine pinned binding values for the selected generation, expected 4/3
counts, every four node ID, and every three edge ID. Before reading or serving
bytes, realpath checks prove each explicit path stays under the supplied
repository root, equals one of the three canonical allowlisted paths, and has no
symlinked component. Any hash, receipt, schema, identity, provenance, count,
endpoint, or join mismatch blocks before port bind.

The server binds `127.0.0.1`, accepts only GET/HEAD, exposes only application
assets and `/fixtures/{graph.json,source-manifest.json,build-receipt.json}`, returns
404 for unknown/traversal paths and 405 for other methods, and cannot write,
compile, rebuild, or expose arbitrary repository content.

## Data path, evidence and recomposition

```text
SWU-IOLM-00C-A: iolm-candidate-contract/v1
  -> A1 PinnedMintedFixtureGateway + MintedFixtureBindingGuard
       emits iolm-fixture-boundary/v1
  -> A2 DemoSnapshotV1Adapter + Guard + QuestionSliceSelector
       emits iolm-demo-snapshot/v1
  -> A3 Graph | Outline | Table -> shared selection -> provenance inspector
       emits iolm-interactive-viewer/v1
  -> A4 Firefox black-box matrix + evidence aggregation
       emits iolm-browser-acceptance/v1
  -> TASK-IOLM-00C-UI narrow implementation-and-automation completion
```

Default data remains the exact 4 nodes / 3 edges. The question “What does the
Player do, and what supports that connection?” exposes only
`key-and-door.Player`, `key-and-door.UnlockDoor`, and
`key-and-door.edge.player-performs-unlock-door` with 2 nodes / 1 relation.

Aggregation is exact: binding/security failure is `BLOCK`; another required
failure is `FAIL`; required human `NOT_RUN` without a failure makes overall
`NOT_RUN`; and only all required automated and human passes make overall `PASS`.
A4 may close the parent task's narrow implementation-and-automated-check claim
while overall remains `NOT_RUN`, but cannot claim accessibility or usability.

Every A1–A4 result carries:

```json
{
  "ineligible_for": [
    "SWU-IOLM-00C-B",
    "SWU-IOLM-00C-C",
    "G-DSV2-SG",
    "CROSS_FEATURE_UNSUPPORTED",
    "promotion",
    "publication"
  ]
}
```

- The sidecar is not evidence for the unchanged two-feature 00C-B proof.
- `SWU-IOLM-00C-B` remains selected and blocked; `SWU-IOLM-00C-C` remains unselected.
- A later compiler-backed input may replace only the gateway after the unchanged upstream receipts pass and `DemoSnapshotV1` remains satisfied.
- Each Task Session returns exact changed files, typed output handle, validation results, exclusions, residue and next route, then stops without selecting the next unit automatically. For the selected A2 regeneration, any mismatch with the fresh A1 receipt or guarded current-generation bundle stops before mutation and returns to Invoke Refresh rather than silently adopting another generation.
