---
mode: refresh
spell: invoke
phase_status: pass
mutation_mode: proposal-only
created: 2026-07-12
target_artifact: generation-2 evidence-repair L2/L3 continuation
target_owner: WP-CDSC2-001
decision_source: DEC-CDSC2-009
---

# Invoke Refresh Report: Three-Layer F3 Adjudication

## Verdict

PASS, proposal-only. The selected Option 2 is translated into an executable
four-SWU continuation. No target planning artifact, schema, runtime module,
evidence receipt, result, or generation index was mutated.

## Source Signals

| ID | Type | Source | Claim | Safety |
| --- | --- | --- | --- | --- |
| RFS-01 | blocker_resolved | `runs/SWU-CDSC2-005/DECISION-GATE.md` | User selected explicit pre-observation, observation, and adjudication layers. | safe |
| RFS-02 | evidence_added | M1 receipt | Permitted substitution is a frozen supported observation with bounded uncertainty. | safe |
| RFS-03 | evidence_added | M2 receipt | Breaking substitution is a frozen supported observation with bounded uncertainty. | safe |
| RFS-04 | artifact_drift | old SWU005 and parent Q-06 | Directly replacing Q-06 would rewrite an immutable absence statement after observation. | blocked under old route |
| RFS-05 | artifact_drift | parent total matrix and frozen evaluator | One combined Q-06 cell cannot represent partial coverage across two substitutions. | needs_review |
| RFS-06 | route_changed | `WORK-PACK.md` | L2/L3 must route through a new overlay contract and compatibility projection before evaluation. | safe |
| RFS-07 | no_op | SWU001-SWU004 receipts | Parity kernel, harness, and M1/M2 evidence remain accepted and unchanged. | safe |

## Delta Summary

| Delta class | Count | Result |
| --- | ---: | --- |
| blocker_resolved | 1 | Human policy gate closed with Option 2. |
| evidence_added | 2 | Frozen M1/M2 handles become observation-layer inputs. |
| artifact_drift | 2 | Old direct F3 builder and combined matrix route are superseded. |
| route_changed | 1 | New exact first route is SWU-CDSC2-005A. |
| no_op | 1 | Completed L0/L1 work remains accepted. |

## Proposed Changes

1. Add the protocol in `THREE-LAYER-PROTOCOL.md`.
2. Supersede the current L2/L3 continuation with `REFRESHED-WORK-PACK.md`.
3. Add one overlay schema/validator and deterministic v1 materializer in 005A.
4. Freeze separate permitted/breaking adjudication and compatibility projection
   in 005B.
5. Reuse the frozen parent evaluator and successor wrapper in 006R.
6. Extend independent replay to temporal-layer and target-provenance checks in
   007R.
7. Apply the planning-file deltas listed in `REFRESH-PATCH-PROPOSAL.md` only
   through explicit Task Session execution.

## Applied Changes

None. Mutation mode is proposal-only.

## Skipped Changes

| Change | Reason |
| --- | --- |
| Patch current spec/architecture/plan/work-pack | No apply-approved authorization. |
| Implement overlay schema/materializer | Owned by proposed SWU005A. |
| Freeze adjudication cells or compatibility receipt | Owned by proposed SWU005B; cannot precede contract negatives. |
| Evaluate or append generation 2 | Owned by proposed SWU006R after accepted projection. |
| Inventory promotion/update | Deferred to independent closeout SWU007R. |

## Dispatch Technique Trace

- `sequence`: decision/evidence -> contract -> adjudication -> evaluation -> audit.
- `scu_swu_reduction`: reduced continuation to four independently gated units.
- `recomposition_proof`: three layers recompose into one deterministic v1
  projection and original suite path.
- `handle_handoff`: parent, M1, M2, overlay, projection, and result artifacts
  cross steps by stable handle.
- `artifact_contract_bridge`: protocol fields map to schema, validator,
  materializer, test, and task acceptance.
- `validation_loop`: every layer has negative vectors and deterministic replay.
- `concrete_path_evidence`: every signal and target cites a repository path.
- `owner_boundary_check`: Invoke authors only the proposal; Task Session owns
  execution; parent evaluator and authority owners remain read-only.
- `state_namespace_boundary`: historical, observation, adjudication, projection,
  result, and Inventory namespaces remain separate.
- `execution_receipt_handoff`: each SWU must return a structured Task Session
  and observability receipt.
- `residue_ledger`: runtime failures and deferred portability remain explicit.
- `authority_split_gate`: calibration output cannot promote type, relationship,
  pattern, candidate, activation, or authority state.

Full dispatch JSON is required because this refresh authors a reusable
Invoke-to-Task-Session route. See
`three-layer-adjudication-refresh.dispatch.json`.

## Distill Validation

PASS. The four SWUs are the smallest coherent units and recompose into the
original successor-generation objective. See `DISTILL-VALIDATION.md`.

## Validation

- Dispatch Spec: PASS with no blocks or flags.
- Refresh and dispatch JSON parse: PASS.
- SWU manifest/task coverage: 4 of 4.
- SWU manifest/wave coverage: 4 of 4.
- Implementation-detail contracts: complete for 005A, 005B, 006R, and 007R.
- Distill/recomposition: PASS.
- Mutation boundary: proposal-only; no target artifact applied.

## Blockers And Gaps

Invoke gaps: none.

Target gap `GAP-CDSC2-008` remains open until SWU005A proves the new schema,
validator, materializer, and negative vectors. This is an execution gate, not a
missing decision.

## Next Route

On explicit execution approval, run Task Session on
`REFRESHED-WORK-PACK.md`, exact first unit `SWU-CDSC2-005A`. Do not resume the
superseded SWU-CDSC2-005.
