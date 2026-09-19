# TASK-UIR-SUCCESSOR-COMPOSITION

## Objective

Compose successor producer handles into formation dossier v2 and orchestration
index v2 without rewriting v1 history or converting non-pass evidence into
authority claims.

## Smallest Working Units

### SWU-UIR-015 - Successor Dossier And Index

**Goal:** append one deterministic successor dossier/index chain that is ready
for the integrated audit.

**Dependencies:** SWU-UIR-009, 012, 013, and 014 accepted receipts.

**Inputs and outputs:** existing mutation/reroute generations, corpus generation
002, dossier-policy generation, relationship packet and owner-decision
generations, dossier/index generation-001 handles, v2 schemas/builders/tests,
and generation-002 composition results.

**Algorithm:**

1. Verify every producer record ID, content digest, generation ID, and expected
   predecessor.
2. Build dossier v2 in the existing eight-conjunct order.
3. Set independent-positive to `missing` from SWU-013; preserve stable contrast
   and erasure states unless new typed evidence exists.
4. Keep changed-consequence and typed-negatives evidence from accepted
   mechanical generations.
5. Set corpus-bound-portability from per-candidate policy evaluation; current
   below-threshold state remains non-pass.
6. Set owner-firewall from both the decision-free packet and separate owner
   decision receipt; Action-source route-open cannot become signature evidence.
7. Derive `DEFER` conjunctively and reject score/weight/threshold shortcuts.
8. Append orchestration index v2 with all producer/dossier handles and v1
   predecessor; replay both generations and refuse in-place mutation.

**Edge cases and failure modes:** stale or swapped handle, missing policy plane,
packet decision embedding, authority digest drift, predecessor fork, disputed to
missing normalization error, false portability pass, timestamp-sensitive
identity, and existing non-identical generation-002 output.

**Write scope:**

- `contracts/formation-dossier-v2.schema.yml`
- `contracts/orchestration-index-entry-v2.schema.yml`
- `evidence/formation-dossier-v2.mjs`
- `evidence/build-dossier-v2-generation.mjs`
- `orchestration/index-entry-v2.mjs`
- `orchestration/build-index-v2-generation.mjs`
- `fixtures/contracts/*dossier-v2*`
- `fixtures/contracts/*index-v2*`
- `evidence/results/dossier/generation-002/`
- `orchestration/results/generation-002/`
- `tests/formation-dossier-v2.test.mjs`
- `tests/orchestration-index-v2.test.mjs`

**Done criteria:** dossier remains `DEFER` for stated evidence reasons;
owner-firewall reflects decisions without authority mutation; predecessor and
all handles validate; generations 001 and 002 replay; v1 bytes are unchanged.

**Acceptance evidence:** dossier/index handles, conjunct matrix, replay report,
v1 before-after digests, overwrite refusal output, and SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/formation-dossier-v2.test.mjs
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/orchestration-index-v2.test.mjs
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/*.test.mjs
```

**Execution owner:** local-fallback through Task Session.

**Context Builder anchors:** this task, accepted receipts for 012-014, dossier
and index generation 001, DEC-UIR-008 through 010, `IMPLEMENTATION-PLAN.md`, and
refresh report section "SWU-UIR-015".

**Expected result:** shared SWU result shape; reroute to SWU-UIR-010 only on
pass.
