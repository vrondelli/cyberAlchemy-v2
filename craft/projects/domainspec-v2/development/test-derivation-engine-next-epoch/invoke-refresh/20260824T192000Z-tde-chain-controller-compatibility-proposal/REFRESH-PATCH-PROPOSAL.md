# TDE chain-controller compatibility patch proposal

## Outcome

This proposal repairs the exact structural mismatch that stopped `task-session-until-blocker` on `dsv2-tde-multiformalism-profile-epoch@2`. The isolated proposed successor `dsv2-tde-multiformalism-profile-epoch@3` passes WPRA and implementation-readiness validation, and the installed chain controller now clears `MANIFEST_SHAPE_INVALID`. It stops at `EPOCH_APPROVAL_INVALID`, which is the correct later lifecycle gate because no @3 chain-selection approval was invented.

Nothing was applied. The canonical target `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3` does not exist, `appliedChanges` is empty, and no Task Session or product mutation occurred.

## Exact change

- Replace all ten opaque `DS-TDE-.../unit` route targets with safe selectors such as `plan/work-pack/tasks/TASK-TDE-EPOCH-001.md#TDE-EPOCH-001`.
- Add one complete nested `execution_contracts` projection covering all ten units.
- Bind each unit's task/SWU IDs, dependencies, successor, command, validation contracts, material/execution/allowed writes, gates, terminal policy, receipts, five exact schemas, target inventories, deltas, closeout validation, Invoke Refresh route, and owner/router/continuity paths.
- Align the audit config, execution bindings, closeout bindings, route digest, and future WPRA inputs.
- Preserve all TDE behavior, dependency, write, validation, implementation-profile, and claim-ceiling semantics.

The exact material set contains 84 proposed targets. Inventory digest: `2c5ff4649c862c7381b2c615582bd4c9faa92eb8925974b259b2fcdee28cace6`. Proposal material digest: `20af93c91d53e9f9c2985b01cf09ba75c628aaa13fdaa27f03fcb5807142f8bf`. Canonical semantic digest: `f7c734669d7ff7d6d877d1bbeeced64c24cfb7757e540fc5fc5264e38a0d8750`.

## Regression gate

Before @3 owner acceptance can be answered, an authorized apply must create exactly these bytes, live validation must prove byte equality, and the installed controller probe must again clear `MANIFEST_SHAPE_INVALID`. Any changed byte creates a new candidate and requires regenerated inventories, digests, review bindings, and acceptance request.

## Lawful continuation

1. Rondelli explicitly authorizes applying this exact proposal target inventory.
2. Invoke Refresh materializes the exact canonical @3 postimages and reruns path, JSON/schema, whitespace/EOF, WPRA, readiness, hash, and controller checks.
3. Rondelli answers the renewed exact acceptance request only after live-byte equality is proven.
4. WPRA creates a real initial selection request and receipt for `TDE-EPOCH-001`.
5. `task-session-until-blocker` receives a distinct chain-selection approval and may then admit the finite frontier.
6. Victor remains a later pre-merge structural approval, not an authoring, apply, readiness, or Task Session prerequisite.
