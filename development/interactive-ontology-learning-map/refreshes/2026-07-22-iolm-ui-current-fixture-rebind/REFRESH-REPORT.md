# Invoke Refresh Report — IOLM current-fixture A1 rebind

## Result

- Mode: `refresh`
- Spell: `invoke`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Phase basis: option 1 was bound to the actual A1 input paths, the exact planning/Craft delta was applied, and no Refresh-authoring blocker remains
- Handoff status: `ready`
- Output handle: `iolm-ui-current-fixture-rebind-refresh-applied/v1`
- Evidence date: `2026-07-22`

## Source signals

| ID | Type | Claim | Evidence |
|---|---|---|---|
| RFS-IOLM-UI-1001 | `blocker_opened` | The latest A4 replay cannot reuse the historical A1–A3 chain. | pre-bind `BIND_GRAPH_HASH_MISMATCH`, browser not opened |
| RFS-IOLM-UI-1002 | `blocker_resolved` | Fixture policy is no longer a human decision blocker. | option 1 selected `rebind-to-current-domainspec-fixture` |
| RFS-IOLM-UI-1003 | `artifact_drift` | The decision-window hashes were superseded and the actual A1 allowlisted inputs must be resolved from `source-binding.v1.json`. | current Key-and-Door trio stable across two reads; nearby UI-profile outputs excluded |
| RFS-IOLM-UI-1004 | `status_changed` | A4 is deselected and one fresh A1 rebind is selected. | synchronized Work-Pack, task, wave, Dispatch, and Craft state |
| RFS-IOLM-UI-1005 | `route_changed` | A2 regeneration, A3 revalidation, and A4 replay now require fresh predecessor receipts. | option-1 decision constraints and current task sequence |

## Applied delta

- Preserved all original A1–A3 results, the A3 repair, and both blocked A4 attempts as immutable evidence.
- Resolved the actual A1 inputs as the three allowlisted Key-and-Door `expected/` files; `ui-profile-create-player/generated/` is not an A1 input.
- Recorded the current stable snapshot hashes and exact generated values without modifying DomainSpec.
- Selected exactly one fresh `SWU-IOLM-00C-UI-A1` rebind lifecycle.
- Gated A2 regeneration, A3 revalidation, and A4 replay behind fresh predecessor receipts.
- Added the rebind/regeneration/revalidation route steps to the existing IOLM Dispatch.
- Synchronized Work-Pack, execution/layering/Distill surfaces, shared context/gaps, parent task, wave, and CyberAlchemy Craft ledger/index/view.
- Kept the six-value ineligibility fence, compiler lane, authority gate, promotion, publication, and public/private boundary unchanged.

## Fixture snapshot

The Refresh snapshot is:

- graph: `1f0691fac9ed9612605d62d8b390e9b39eca24b6f11a6b0868c7591c6179e7ae`
- source manifest: `ed4a1fdf4684b26fb5dbf086cf98f80050734ffea1d2c845503f0bf429e9cd6e`
- build receipt: `14ac660824e8a697ef6ae3e20b18132bf99aa45f9adbe46e46e686db36260fbe`

These are selection evidence, not a waiver of A1 preflight. A1 must re-read all
three immediately before mutation and block if any byte changes.

## Dispatch technique trace

- Dispatch: `REFRESH-DISPATCH.json`
- Techniques: `sequence`, `handle_handoff`, `concrete_path_evidence`, `artifact_contract_bridge`, `owner_boundary_check`, `state_namespace_boundary`, `residue_ledger`, `validation_loop`, `execution_receipt_handoff`, `observability_grouping`
- Concrete effect: option-1 evidence changes only the private planning selection, passes through one current-fixture A1 owner boundary, and cannot execute or promote downstream state.
- Subagents: none; the approved apply touches shared planning/Craft projections sequentially.
- Distill: skipped because this is an exact status/dependency correction over existing SWUs, with no new unit, primary behavior, write-scope family, or recomposition shape.

## Validation

- Strict Context Builder coverage: `10/10`, fourteen selected sources, no fallback exploration.
- Actual A1 allowlist resolution and two-read fixture stability: pass.
- Refresh Dispatch Spec validation: pass.
- Root IOLM Dispatch parse and new-route references: pass; its full validator remains expected `BLOCK` on the preserved `s0c-ui-browser-acceptance`, `s0c-candidate-compile`, and `s0-verify-domainspec-sg` terminal receipts.
- JSON/YAML parsing: pass.
- Selection cardinality: pass; A1 rebind only, A2–A4 gated.
- Planning state synchronization and stale A4-selection scan: pass.
- Craft ledger/index/view synchronization and ledger hash: pass.
- Historical evidence, implementation, DomainSpec, authority, public Arcanum, and six-value fence boundaries: pass.
- Scoped diff hygiene: pass.

## Blockers and residue

- Refresh-authoring: none.
- Apply authorization: resolved by the decision receipt and direct `invoke:refresh:apply-approved` invocation.
- Target lifecycle: `B-IOLM-A1-PINNED-FIXTURE-DRIFT` remains open until a fresh A1 receipt binds the selected stable bytes; A2–A4 remain deferred behind it.
- Audit: resolved for this Refresh's dispatch, source, synchronization, and boundary scope.
- Unchanged independent residue: manual runners, 00C-B cross-feature support, 00C-C selection, G-DSV2-SG authority rebind, promotion, and publication.

## Owner receipt and next route

- Owner: private IOLM planning and Craft owner via `invoke:refresh`
- Receipt: `pass`, `iolm-ui-current-fixture-rebind-refresh-applied/v1`
- Next route: strict Context Builder and compact Codex Goal for one `SWU-IOLM-00C-UI-A1` rebind, then one Task Session.
- A1 write scope: `contracts/source-binding.v1.json`, `contracts/source-binding.v1.schema.json`, `serve_demo.py`, `assets/gateway.mjs`, `assets/binding-guard.mjs`, `tests/binding-guard.test.mjs`, `tests/test_server_contract.py`, and new `session-evidence/SWU-IOLM-00C-UI-A1/rebinds/<run-id>/**` only.
- Read-only: all DomainSpec files, A2–A4 implementation, and every existing A1–A4 lifecycle artifact.
- Stop: return a fresh `iolm-fixture-boundary/v1`; do not select or execute A2 automatically.
