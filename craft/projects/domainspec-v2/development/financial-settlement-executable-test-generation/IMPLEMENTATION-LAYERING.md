---
module: financial-settlement-executable-test-generation
version: 0.1.0
status: draft
updatedAt: 2026-07-23
docType: implementation-layering
---

# Implementation Layering

## Target And Scope

- Target: Financial Settlement structural test generation
- Scope: feature-to-BTE adapter and executable structural emission
- Current state: BTE complete-profile path works; feature-sized source adapter is absent

## Layer Decision Table

| Layer | Decision Question | Minimum Working Unit | Included | Deferred | Exit Evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether a valid feature subset can traverse the BTE without weakening complete-profile mode. | Explicit `declared-subset` mode plus one valid subset fixture | Membership mode, receipts, 13/16 regression | Financial Settlement parsing and file emission | Focused engine tests and unchanged complete-profile counts | Continue only if both modes replay |
| L1 | After this layer, we know whether Financial Settlement can be projected completely and diagnosed per instance. | Registry/graph projector plus collecting node/edge evaluators | Exact 10/7 census, source anchors, full test materialization | Generated Vitest file | Projector and conformance tests, including current red mapping | Continue if no row disappears |
| L2 | After this layer, we know whether every structural case is emitted and runnable. | Deterministic Vitest emitter and feature CLI | 52 structural cases, report, replay, red-source behavior | Behavioral oracle closure | Generated suite compiles, runs, and is byte-stable | Stop or repair source after honest report |
| L3 | After this layer, we know whether the route generalizes to another normalized feature. | One second feature fixture using the same adapter | Dialect hardening and packaging | Production/release work | Cross-feature regression | Defer until requested |

## Non-Regression Guardrails

- Existing complete-profile mode remains the default and preserves 13 kinds, 16
  families, 89 obligations, two consumers, and terminal replay.
- Existing behavioral derivation remains 79 obligations with its current honest
  executable/gap split until separately changed.
- Source contradictions remain diagnostics; projector logic cannot rewrite them.
- L2 cannot claim behavioral or production completeness.

## Recommended Next Layer

- Next: L0
- Decision unlocked: whether feature-sized exact subsets can use the BTE safely
- Major deferred scope: behavioral oracle authoring and source correction
