---
mode: refresh
phaseStatus: pass
phaseStatusBasis: artifact-complete
mutationMode: apply-approved
handoffStatus: ready
refreshed_at: 2026-07-20
---

# Invoke Refresh Report — BTE-009 Order Repair

## Result

The final implementation-completion audit is valid refresh input. It accepted the
bounded S1 path and rejected one backend ordering contradiction: the candidate
findings reassigned existing `SWU-BTE-009` from edge/16-signature coverage to IOLM
and Body War execution.

The live BTE package confirms that `SWU-BTE-009` belongs to W2 and owns independent
edge roots plus causal proof for all 16 backend signatures. The package also exposes
a coupled drift: `TASK-BTE-INTEGRATION` currently mixes consumer receipts into the
core check and `SWU-BTE-008` does not explicitly depend on 009. A correction only in
the review findings would therefore leave the execution plan internally inconsistent.

The approved refresh has applied the smallest coherent state:

1. `SWU-BTE-009` remains the W2 edge/16-signature proof.
2. `SWU-BTE-008` depends on 004-007 and 009 and produces only
   `verify:bte:core` plus a non-admitting core receipt.
3. After that core passes, the independently governed IOLM and Body War owners run
   their own gates and produce fresh receipts.
4. `SWU-BTE-010` validates those external receipts, compares exact identities and
   digests, and composes terminal `verify:bte` from `verify:bte:core` and
   `verify:bte:consumers`.
5. No new BTE SWU is created or reassigned.

This run is `apply-approved`. All eight reviewed targets were patched after exact
preimage verification. The machine apply receipt is [apply-receipt.json](apply-receipt.json),
and the refreshed 61-path re-audit boundary is
[corpus-manifest.refresh-001.json](../../reviews/2026-07-20-implementation-completion/corpus-manifest.refresh-001.json).
The Refresh authoring/apply phase is complete; promotion remains gated on a separate
independent re-audit.

## Refresh Signals

| Signal | Type | Claim | Confidence | Mutation safety |
| --- | --- | --- | --- | --- |
| `RS-EVF-BTE009-001` | `evidence_added` | Bourbaki rejected the candidate package on the exact `SWU-BTE-009` reassignment. | high | safe |
| `RS-EVF-BTE009-002` | `artifact_drift` | `findings.md` assigns consumer runs to 009 while the BTE Work-Pack and W2 assign edge proof. | high | safe |
| `RS-EVF-BTE009-003` | `artifact_drift` | The BTE core task mixes consumer receipts into core and omits explicit 009 dependency. | high | needs_review |
| `RS-EVF-BTE009-004` | `route_changed` | Correct order is edge proof -> core -> external consumer gates -> 010 manifest -> terminal verification. | high | needs_review |
| `RS-EVF-BTE009-005` | `status_changed` | The findings must become corrected-candidate/pending-re-audit, not pending an audit that already rejected them. | high | safe |
| `RS-EVF-BTE009-006` | `no_op` | S1, `DEC-GCP-001`, all other SWU identities, and the non-admission boundary remain unchanged. | high | safe |
| `RS-EVF-BTE009-007` | `no_op` | The original audit and corpus manifest remain immutable historical evidence. | high | safe |

## Applied Target Inventory

| Target | Preimage SHA-256 | Postimage SHA-256 | Applied class |
| --- | --- | --- | --- |
| review `findings.md` | `d683c43de8c7721a576370c75c73759b00a3afb469db7ca349800e21a7a514f1` | `6b7668fe46e82a742247a5e7a78fff538d7d90c14d76d590e8f015a51d62b2d0` | candidate/order correction |
| BTE `PLAN.md` | `c854b5324a1e2eb327536fcc3667983d1d3e4e91ecb26720a0368bdc5e6d9062` | `2a665756c12f300b3e205ff7b74903bd1f41d7d748ff269a42f125cf435e4fac` | route clarification |
| BTE `WORK-PACK.md` | `d49753f7633decb6bd2d6472126ea92b40ea3424b70c2c84e733f584004576e1` | `08c7495434d2f65b99dd84734bd7f9cca4c5b52e510f74e442dff5379185d75f` | dependency/validation correction |
| `TASK-BTE-INTEGRATION.md` | `6602c16b41a736d7add66c64e86c4baae4928146bd74b18c369334893fb6f182` | `9cb5306a27b7da6c7caeb0cc11e86ca0dbf6362a92a0ca652eec299e40ee979f` | core/consumer split |
| `TASK-BTE-INTEGRATED-CONSUMER-MANIFEST.md` | `f1dd040b6a251c1afcfaf5fed3a008113124712232564d6374710c85e6e2bda2` | `f21cfa9916c62bdf8fac279a2c23861137342931d24ec4d66f2cf2a091d60ab5` | external-receipt sequencing |
| BTE `EXECUTION-PACK.md` | `8e3aad6782ff8bf11a2a7c10ba405ac517dd3e72eca5c7279e998712047b34d0` | `9e764da29529a01f1e4d187dbbc8a2d66d3522f36cd2db6842374d0b80d92717` | W4 order correction |
| `W4-INTEGRATE-VERIFY.md` | `bf5866c63d5d584badd5aa3fe2be8291700939594e6e5d9c1d3698e58eb60c28` | `ee54fafb6514d2c14157bb21ab2e042b8422f7747d1d197d68e90a8a93cabe05` | explicit core/consumer/terminal order |
| BTE `EXECUTION-DISPATCH.json` | `b0cfb66baf9d2137f08c6891b6e5e84dca013b79ac0e923562a5a3351ab417f2` | `ced40ba443c3015434e9a257f4ecc451cb570857656989a5116e1f242aa6bfbe` | machine route guards |

Read-only cross-checks:

- audit `audit.md`: `845002629b16060b2a0458c6b7498164404af8e82840b69038f12065281f5fef`
- edge task: `02938636a16fdebd4d143bda27e350ec1dffbf6e8ec838d4c0e2cbd65bc82354`
- W2: `fb7d38d8e34f4fd3f5c9deb8679c3671622b9267184924be80bc41579989e9a4`
- verify task: `fa5238c364e44d9dabbe796da0a423c27ff754a753f97f183ca988ab03687fcb`
- traceability: `9a9b8cdb0e96d3e828e34261723f96bde9fbe5f6d72f15d29e36ce4b2c45f90f`

## Applied Delta Summary

- `evidence_added`: 1
- `artifact_drift`: 2
- `route_changed`: 1
- `status_changed`: 1
- `no_op`: 2
- authored targets applied: 8
- new apply-time machine artifacts: refreshed re-audit corpus manifest plus apply receipt
- refreshed corpus verification: 61/61 identities and current digests
- protected no-ops: 6/6 byte-identical
- applied changes in this run: 5 proposal groups

The exact file-level proposal is in `REFRESH-PATCH-PROPOSAL.md`.

## Dispatch Spec Technique Trace

| Technique | Applied phase/artifact | Validation expectation | Status |
| --- | --- | --- | --- |
| `sequence` | corrected backend order | 009 precedes core; external consumers precede 010/terminal | pass |
| `concrete_path_evidence` | source/target inventory | exact paths and preimage digests exist | pass |
| `artifact_contract_bridge` | signals to proposed deltas | every target delta cites signal IDs | pass |
| `execution_receipt_handoff` | consumer owners to BTE-010 | fresh receipt identity, digest, posture, and run evidence required | pass |
| `state_namespace_boundary` | audit, plan, BTE, and consumer evidence | historical audit is immutable; owners keep separate write roots | pass |
| `owner_boundary_check` | BTE versus IOLM/Body War | BTE validates but does not execute or author consumer evidence | pass |
| `approval_semantics_map` | mutation gate | explicit `refresh approved` authorizes only the reviewed apply scope | pass |
| `validation_loop` | apply plus re-audit | preimages, route validation, exact assertions, refreshed manifest, audit | pass |
| `residue_ledger` | approval, re-audit, S1 decision | every unresolved gate has an owner and next route | pass |

Full dispatch JSON: not required for this refresh. It performs no delegation,
subagent work, protected-context transfer, or reusable route installation. The
existing BTE `EXECUTION-DISPATCH.json` is an applied target and now carries the
validated ordering guards.

`scu_swu_reduction` was considered and skipped because this refresh creates no SWU;
its purpose is to preserve the already-small 009, 008, and 010 units. Distill is
`not_required`: changing fewer artifacts leaves contradictory executable route
projections, while adding or repartitioning SWUs exceeds the audit repair.

## Boundary And Skipped Changes

- Only the eight approved target artifacts, this report/receipt state, and the new refreshed manifest were edited or created.
- No engine source, test, fixture, schema, definition, profile, or relationship
  authority was edited.
- The original audit and `corpus-manifest.json` remain byte-identical historical
  evidence.
- `SWU-BTE-009` is not renamed, moved, selected, or executed.
- No consumer run or receipt is fabricated.
- `SWU-BTE-010` does not become a consumer executor.
- `DEC-GCP-001` remains unresolved; S1 cannot emit a positive receipt.
- Promotion remains gated until an independent re-audit returns `ACCEPT` against the refreshed manifest.

## Apply Validation And Re-audit Handoff

1. Verify all eight target preimage SHA-256 values before mutation.
2. Parse all JSON artifacts with `jq`.
3. Validate BTE `EXECUTION-DISPATCH.json` with the repository Dispatch Spec validator.
4. Assert exactly one definition of each `SWU-BTE-008`, 009, and 010 and preserve
   their parent tasks and write scopes.
5. Assert 009 still owns independent edge roots and causal 16-signature witnesses.
6. Assert 008 depends on 004-007 plus 009 and owns only `verify:bte:core`.
7. Assert IOLM and Body War runs are external prerequisites after core.
8. Assert 010 consumes fresh external receipts and terminal `verify:bte` composes
   core plus consumer validation.
9. Assert no target says 009 executes IOLM or Body War.
10. Generate `corpus-manifest.refresh-001.json` from the applied target bytes while
    retaining the original manifest unchanged.
11. Run scoped `git diff --check`.
12. Handoff: rerun the final implementation audit against the refreshed manifest and
    require `ACCEPT` before treating corrected findings as an executable handoff.

Apply checks 1–11 pass. Step 12 is intentionally a separate, independently owned
audit handoff and therefore gates promotion without lowering this Refresh phase.
Invoke observability was recorded at
`.arcanum/observability/signals/sigil-invocations.jsonl` line 248 with no reflection
trigger.

## Phase Result And Next Route

`APPROVAL-EVF-BTE009-REFRESH-001` is resolved by the operator's `refresh approved`
authorization. `phaseStatus=pass` because the approved artifact mutation and its
validation are complete. `handoffStatus=ready` means the package is ready to enter
the independently owned re-audit; that audit still gates promotion.

Next, rerun the final audit against `corpus-manifest.refresh-001.json`. Only after
audit `ACCEPT` does the
next route become the existing owner gate for the machine predicate followed by a
Task Session for atomic `SWU-GCP-001`. Backend implementation remains downstream of
a replay-verified S1 receipt.
