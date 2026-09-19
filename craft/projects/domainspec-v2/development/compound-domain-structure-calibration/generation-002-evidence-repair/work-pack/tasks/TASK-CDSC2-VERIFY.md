# TASK-CDSC2-VERIFY

Status: superseded by refreshed SWU-CDSC2-007R under
`../../refreshes/2026-07-12-three-layer-adjudication/REFRESHED-WORK-PACK.md`.

## SWU-CDSC2-007 - Independent Replay And Closeout

**Goal:** independently reproduce generation 2, audit harness/source/generation
boundaries, and route the bounded verdict.

**Dependencies:** SWU-CDSC2-006 accepted.

**Inputs:** both generation records, generation-2 contracts/manifest/baseline,
M1/M2/F3 receipts, fixture and suite results, index, spec, and architecture.

**Audit rules:**

1. Replay in a fresh process from frozen handles.
2. Compare F3 and suite semantic bytes, record IDs, generation ID, and
   predecessor chain.
3. Recompute generation-1 protected file digests.
4. Verify Savvy and GoldenQuill have no task-caused diff.
5. Verify mutant diffs touch only declared edit surfaces.
6. Verify all uncertainty and refuted/indeterminate states remain present.
7. Scan machine statuses and human claims for prohibited identity, type,
   irreducibility, portability, pattern, replication, authority, activation,
   and promotion inferences.
8. Route the suite verdict only through the parent bounded routes.

**Outputs:**

- `runs/SWU-CDSC2-007/INDEPENDENT-REPLAY.md`
- `runs/SWU-CDSC2-007/AUDIT.md`
- `runs/SWU-CDSC2-007/TASK-SESSION-RESULT.md`
- final status synchronization and Inventory read-model update

**Write scope:** this package's `runs/SWU-CDSC2-007/`, status-only planning
artifacts, Inventory/observability synchronization, and no evidence/result
mutation.

**Done criteria:** replay agrees, predecessor chain is valid, protected bytes
and fixture sources are clean, all SWU receipts are complete, and the next route
does not promote anything.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/*.test.mjs
git diff --check -- projects/domainspec-v2/development/compound-domain-structure-calibration
```

**Execution owner:** `manual` independent auditor through Task Session.

**Handoff context:** all accepted generation-2 handles and generation-1
protected manifest, excluding unfrozen alternate evidence.
