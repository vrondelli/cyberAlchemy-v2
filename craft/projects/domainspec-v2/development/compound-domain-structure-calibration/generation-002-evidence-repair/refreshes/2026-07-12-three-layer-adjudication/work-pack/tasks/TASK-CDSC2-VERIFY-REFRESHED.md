# TASK-CDSC2-VERIFY-REFRESHED

## SWU-CDSC2-007R - Independent Three-Layer Replay And Closeout

**Goal:** independently replay every layer, compatibility projection,
evaluation, and successor append while auditing temporal and authority
boundaries.

**Dependencies:** accepted SWU-CDSC2-006R.

**Inputs:** generation-1 protected manifest, parent/M1/M2/overlay/projection
handles, F1/F2/F3 and suite results, generation index, protocol, refreshed
dispatch, and all Task Session receipts.

**Audit algorithm:**

1. In a fresh process, validate each layer independently.
2. Verify parent and M1/M2 bytes match their pre-refresh digests.
3. Rebuild the compatibility projection and compare semantic bytes, content,
   record, and generation handles.
4. Re-evaluate F3 and suite results and compare exact semantic outputs.
5. Verify the predecessor chain and one-time append.
6. Prove compatibility target statements derive from parent `S`, not observed
   consequences.
7. Verify all twelve overlay cells and every uncertainty resolution/carry row.
8. Scan artifacts and statuses for prohibited authority inferences.
9. Synchronize final work-pack, Inventory read model, and observability only
   after every audit gate passes.

**Failure modes:** any byte/handle/replay drift, target-provenance failure,
missing coordinate, dropped uncertainty, source mutation, open Task Session
receipt, or authority leakage.

**Write scope:** generation-2 package `runs/SWU-CDSC2-007R/`, status-only target
planning updates, Inventory/observability synchronization, and no evidence,
result, generation-index, or source mutation.

**Done criteria:** exact fresh-process equality, protected bytes, complete
receipts, valid chain, provenance proof, authority audit, and one bounded next
route.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/*.test.mjs
git diff --check -- projects/domainspec-v2/development/compound-domain-structure-calibration
```

**Execution owner:** manual independent auditor through Task Session.

## State

Complete through independent local Task Session on 2026-07-12.

## Evidence

See `../../../../runs/SWU-CDSC2-007R/AUDIT.md` and
`../../../../runs/SWU-CDSC2-007R/INDEPENDENT-REPLAY.md`. Fresh-process replay
passed 13/13 checks twice, generation-2 tests passed 54/54, Inventory updater
tests passed 13/13 groups, and target bytes remained unchanged.
