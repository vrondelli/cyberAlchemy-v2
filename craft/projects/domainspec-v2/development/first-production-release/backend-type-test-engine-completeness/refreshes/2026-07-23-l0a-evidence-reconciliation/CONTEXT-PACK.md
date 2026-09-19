# Context Pack — BTE L0A Evidence Reconciliation

## Identity

- Capability: `context-builder`
- Mode: `deep`
- Strict: `true`
- Task: `invoke refresh` for BTE L0A receipt, source-byte, and Craft/work-pack reconciliation
- Evidence date: `2026-07-23`
- Repository commit: `8e349484dd9f18ae1464dd91d06801aa831b4ea6`
- Target root: `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/`
- Mutation mode: `proposal-only`

This pack is refresh-authoring evidence. It is not a runtime handoff, a material
package, implementation evidence, admission evidence, or production
authorization.

## Obligations

| ID | Obligation | Coverage |
| --- | --- | --- |
| `O1` | Prove whether `SWU-BTE-L0A-001` was selected and executed. | covered |
| `O2` | Identify stale planning, Craft, and Inventory projections. | covered |
| `O3` | Compare every published L0A contract and diagnostic digest with current repository bytes. | covered |
| `O4` | Re-run the deterministic L0A publication verifier without rewriting historical evidence. | covered |
| `O5` | Preserve historical receipt immutability and separate Invoke, Task Session, validation-owner, Craft, and release authority. | covered |
| `O6` | Define the smallest evidence-repair unit and its acceptance boundary. | covered |
| `O7` | Preserve the independent red-manifest freeze as an L0B entry gate. | covered |
| `O8` | Inventory exact proposal targets, validation, residue, and next route. | covered |

Strict coverage: `8/8 pass`.

## Selected Evidence

| Source | Selectors | Obligations |
| --- | --- | --- |
| `projects/domainspec-v2/.craft/ledger.yml` | BTE contexts, blocker, artifacts, next moves | O2, O5, O8 |
| `.../PLAN.md` | header status, current phase, next route | O2, O8 |
| `.../WORK-PACK.md` | control fields, L0A manifest, L0B entry gate | O2, O6, O7 |
| `.../work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md` | L0A done/stop/handoff and L0B consumes | O5, O6, O7 |
| `.../work-pack/waves/W1-L0-PROOF-PRIMITIVES.md` | failure route and publication exit | O6 |
| `.../work-pack/waves/W1B-L0-VALIDATION-EXECUTION.md` | L0B entry gate | O7 |
| `.../work-pack/session-evidence/SWU-BTE-L0A-001/20260723T020759Z-contract-publication/execution-receipt.json` | result, selection, handles, gates, continuation | O1, O3, O5 |
| `.../work-pack/session-evidence/SWU-BTE-L0A-001/20260723T020759Z-contract-publication/continuation-handoff.json` | next owner and L0B entry rule | O5, O7 |
| `.../runs/20260723T020759Z/l0a/contract-publication-receipt.json` | exact contract and diagnostic handles | O3, O4 |
| `.../runs/20260723T020759Z/l0a/output-write-manifest.json` | immutable output set and receipt digest | O3, O4 |
| `projects/domainspec-v2/impl/test-derivation-engine/src/bte/contract-publication.ts` | byte hashing, stable-write refusal, verifier | O3, O4, O6 |
| nine files under `.../src/bte/contracts/` | exact current bytes | O3, O6 |
| `.../src/bte/validation/diagnostics.ts` | exact current bytes | O3, O6 |
| `.../EXECUTION-DISPATCH.json` | active candidate and gate projection | O2, O8 |
| `.arcanum/inventory/index.json` | machine lookup and target entry binding | O2, O8 |
| `.arcanum/inventory/entries/domainspec-v2-bte-full-work-refresh-applied-result.md` | stale non-authority execution posture | O2, O5 |

Selected file count: `24`; selected excerpt budget remains below the `deep`
limit. Every selected source closes at least one obligation.

## Evidence Findings

1. The L0A execution receipt records `result=pass`,
   `this_swu_selected=true`, and `implementation_changed=true`.
2. Craft, Plan, Work-Pack, the L0 task, dispatch, and Inventory still describe
   L0A as dependency-ready and unselected.
3. Eight of nine contract schema files plus `diagnostics.ts` do not match the
   published receipt byte digests. In every mismatch, the receipt digest equals
   the current file bytes plus one additional LF. The ninth contract,
   `contract-publication-receipt.v1.schema.json`, matches exactly.
4. The current files already end in LF. The discrepancy is one additional
   trailing blank-line LF, not a missing required final newline.
5. `npm --prefix projects/domainspec-v2/impl run
   verify:bte:contract-publication` fails closed with
   `BTE_OUTPUT_OVERWRITE` because the immutable run receipt differs from the
   receipt recomputed from current bytes.
6. `validation-inputs/` is absent. No independent L0 red manifest or freeze
   receipt exists, so L0B remains blocked independently of the L0A drift.

## Authority Precedence

1. Current implementation bytes and immutable owner receipts are evidence that
   must reconcile exactly; neither is silently rewritten by Invoke.
2. Task Session owns implementation repair.
3. Invoke Refresh owns proposal and later approved planning/projection sync.
4. The validation owner alone authors and freezes L0 red inputs.
5. Craft records continuation state after owner receipts exist.
6. Inventory and visibility remain generated non-authority projections.
7. Release owners alone control admission and production authorization.

The repository Inventory index changed concurrently during this proposal
through unrelated Agent Reasoning Engine and CyberAlchemy Orchestrator work.
The final validated index snapshot is captured in `context-pack.json`; this
refresh did not absorb, overwrite, or attribute those changes to BTE.

## Minimal Repair Boundary

Propose `SWU-BTE-L0A-REPAIR-001` with one primary behavior: restore current L0A
published bytes to the immutable receipt byte set by appending one additional
LF to the eight mismatching schemas and `diagnostics.ts`, then prove the
existing publication verifier passes without overwriting run evidence.

The unit does not edit the matching ninth schema, historical receipts,
validation inputs, semantic validators, later BTE layers, consumers, Craft,
Inventory, admission, or production state.

## Excluded Candidates

- Whole-repository validation: excluded; it does not close the exact L0A drift.
- L0B implementation: excluded; predecessor and validation-owner gates are
  unsatisfied.
- Rewriting the historical L0A receipt: excluded; receipt evidence is
  immutable.
- New run-ID architecture: deferred alternative only if the lifecycle owner
  rejects restoring executed bytes.
- Consumer, UI, public Arcanum, and production artifacts: excluded by owner
  boundary.

## Blockers And Residue

- `BLK-DSV2-BTE-L0A-RECEIPT-DRIFT-001`: target-lifecycle; current bytes do not
  reproduce the L0A receipt.
- Apply authorization and a validated material package are absent by design in
  proposal-only mode.
- Independent red-manifest and freeze evidence remain absent.
- After repair, an audit must rerun the exact publication verifier and confirm
  the historical receipt and manifest remain byte-identical.

## Next Route

Create an exact proposal-only Invoke Refresh package. A later
`apply-approved` refresh may update planning/Craft/Inventory/visibility only
after explicit approval and material-package validation. Task Session then owns
the single repair SWU. A subsequent Invoke Refresh may route the validation
owner only after the L0A verifier passes.
