# TASK-CDSC3-BASELINE

## Objective

Prove a generated React/browser harness reproduces pinned Savvy route behavior
before either generation-3 mutation executes.

## SWU-CDSC3-003 - Source-Derived Browser Baseline

**Goal:** freeze source selectors, generate the isolated harness, and pass every
baseline browser vector.

**Dependencies:** accepted SWU-CDSC3-002.

**Source anchors:** Savvy `app/page.tsx:417-515,571-710`,
`lib/savvy-fsm.ts:126-162`, package manifest/lockfile, generation-2 baseline
harness, `SPEC.md#Browser-Evidence-Contract`, and accepted runtime descriptor.

**Inputs:** exact source bytes, target set, runtime handle, browser schemas, and
finite baseline vectors for permitted and blocked journeys.

**Ordered algorithm:**

1. Freeze a source manifest with paths, ranges, raw digests, dependency versions,
   and generation-2 predecessor handle.
2. Generate package-local route state, guard, step registry, child components,
   and test page from the pinned behavior slices; record every translation.
3. Reject hand-authored behavior not traceable to a source selector or declared
   harness adapter.
4. Launch the accepted browser runtime against a local-only server.
5. Run total vectors covering mount, active child, next/back interaction,
   allowed movement, unauthenticated redirect, premature redirect, guard notice,
   requested/committed step, and route-tree state.
6. Compare structured output with frozen expectations and record screenshots as
   support.
7. Repeat in a fresh process; require identical structured results and handles.
8. Rehash all protected and source inputs.

**Write scope:** `fixtures/generation-003/browser-source-manifest.json`,
`harness/browser-baseline/`, `evidence/generation-003/browser-baseline/`,
`tests/browser-baseline.test.mjs`, and `runs/SWU-CDSC3-003/`.

**Done criteria:** all baseline vectors are total and equivalent; generated
behavior is traceable; fresh replay matches; source and predecessors are
unchanged. Any mismatch blocks mutations.

**Acceptance evidence:** source manifest, translation map, baseline run,
witness receipt, support images, deterministic replay, protection hashes, Task
Session receipt, and observability signal.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-003-discriminating-evidence-repair/tests/browser-baseline.test.mjs
```

**Execution owner:** local fallback.

**Handoff:** route to SWU-CDSC3-004. SWU004 and SWU005 may be authorized in
parallel only with strict disjoint runtime handoff packs; local default is serial.

**Execution status:** complete. `runs/SWU-CDSC3-003/receipt.json` binds the
source manifest, translation map, React bundle, 7/7 baseline witness, two
identical browser processes, and 120/120 aggregate tests.

## Synchronization

W1 is complete and SWU004 is selected. SWU005/006 remain pending until their
selected Task Sessions begin.
