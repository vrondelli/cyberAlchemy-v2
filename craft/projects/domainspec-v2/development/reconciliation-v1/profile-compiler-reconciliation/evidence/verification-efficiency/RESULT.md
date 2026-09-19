# Verification efficiency execution — E0/E1

Date: 2026-09-13. Status: bounded E1 optimization implemented and locally verified; E2 awaits the existing product capacity decision.
Authority effect: none. R08 and the overall release are not complete.

## Outcome and scope

Removed duplicate pure oracle evaluation and redundant baseline-substitution attempts in Operation case preparation. The latter is skipped only for one input with no read dependencies, where the initial vector pass already emitted the identical candidates. Multiple-input and read-dependent preparations retain their accepted-surroundings pass. An observation is reused only from evaluation of that exact local input, fixture and committed mode.

All four mixed-fixture rows retain their complete ordered recipes, cases and expected observations: 1,804 / 1,807 / 1,804 / 1,807, totaling 7,222. No case selection, native protocol, compiler behavior, resource limit, currentness check, persistent cache or generated capsule was changed. The 8 MiB source-family rejection remains unchanged.

One of the plan's maximum two optimization experiments was used. General caching, harness reuse and audit deduplication are deferred: none is required to select the remaining transport contract. No heavyweight reproduction of the known ENOBUFS was run.

## Compact task context and obligations

Lane: product construction, with development-only timing support. Native local execution; no delegated handoff in this run. Existing independently reviewed plan reused.

| Controlling source / selector | Obligation |
| --- | --- |
| VERIFICATION-EFFICIENCY-PLAN.md, E0–E3 and starting checklist | Preserve WPE-T01–T10; bounded experiments; do not invent new R08 successors. |
| evidence/r08ae14-workflow-public/OPERATION-CAPACITY-DECISION.md, Options | Capacity remains unselected; E1 cannot authorize E2. |
| workflow-public-evidence-contract.json, required tests | Existing acceptance denominator remains fixed. |
| impl/cli/src/verification/reconciled-operation-cases.ts, add/vectors/baseline pass | Preserve ordered complete generation and every logical capacity check. |
| impl/cli/test/verification/reconciled-operation-controls.test.ts, preservation/native/public tests | Byte equality is not a substitute for actual native behavior and audit custody. |
| impl/cli/test/helpers/workflow-public-mixed.ts, mixedWorkflowPublicFixture | Retain distinct Operation/Event roots and complete nested fixture. |
| cross-generator-operation-protocol-contract.json, capacities | Preserve per-family limits. |
| cross-generator-execution-contract.json, input/output bounds | Preserve the separate whole-input and whole-output ceilings. |

Implementation paths are relative to the DomainSpec project; other paths are relative to this work-pack. No new acceptance obligations were added. The starting checklist remains the evidence map, not fresh qualification of all historical tests.

## E0: bounded source-preparation baseline

One inspector-instrumented pass, milliseconds:

| Fixture | Setup | Plan | Standalone preparation | Cross-generator preparation |
| --- | ---: | ---: | ---: | ---: |
| Scalar | 90.52 | 141.53 | 222.58 | 510.85 |
| Compound | 75.85 | 252.32 | 4,831.38 | 27,824.46 |
| Mixed | 78.70 | 515.66 | 9,463.19 | 45,641.78 |

These include profiling overhead and are not native execution timings. Heap snapshots were not peak-memory measurements. This pass identifies material preparation cost; it does not account for the user's reported 53 hours.

Fixture identity (plan SHA256 / source manifest SHA256):
- Scalar: `63528de6d6d678b0ea77a1e42d3b3a38e8ae667f2323034cc6b304f228f375d2` / `1675b5006be717074d37f149dd6a2a26f5eccf78a6d61113f76f0513880f47e4`.
- Compound: `e6af3b96c142474eef911184d15a6ef2e66f7553447abb17dcf60447dc95509b` / `a61b08abcf7c99f8d216a8ae91a158365b6eadfc0dfdb6ebcfbb4062ec4564b2`.
- Mixed: `e88a17b5e8184d2fbef3da784a81fd11c26868d06d025d51c55163fefc7e8154` / `3a91570c69dd6f30bbec6b89587f0a5a34382303fbca30cc4d37ad336b153a31`.

Native compile, audit, serialization and currentness phase counters were not added. E0's full phase-accounting exit is therefore not claimed. A lightweight reusable development profiler was added and scalar-smoke-tested; it groups CPU samples by function and source URL. Its follow-up smoke is not a comparable performance benchmark.

## E1: paired measurement and preservation

Three alternating-order A/B rounds in one process against the original source and an in-memory candidate; no profiling overhead:

| Fixture | Original ms, three rounds | Candidate ms, three rounds |
| --- | --- | --- |
| Scalar | 21.140, 14.065, 13.768 | 12.855, 12.705, 11.266 |
| Mixed | 4,019.104, 3,957.374, 3,976.370 | 3,055.080, 3,190.515, 2,878.669 |

Mixed median: **3,976.37 → 3,055.08 ms**, a **23.17% reduction** in four-Operation case preparation (about 0.92 seconds). This is not an end-to-end verifier speedup, cold-start guarantee or statistical confidence interval. Separate cold-process benchmarks were not performed.

Every A/B round compared complete canonical output, not counts alone. Golden preservation controls captured before the edit now cover scalar, nested, multi-input, guard rejection and read/write fixtures. Native controls remain independent.

Source hashes:
- Original generator: `c350b4a61b09beb789cf708607b38ababd287b3ef6cdbab495ef2d7380864ffa`.
- In-memory measured candidate: `f4b7d375e41ecf951f79b94562dc12bfc436d307220d9f23b7b56936739e37ec`.
- Installed generator, with explanatory comments: `95bf28a1677709c346be8d5749f8bc0b9d526fada01afa83c69af854211e5949`.
- Updated test file: `f791889f696d1d6c5cadc8342ff1fc8c332a5c7cf23c02457d1774c2195d8c68`.
- Development profiler: `bb1be2a8cd1349f3ba4f88ed0fdb3809419125ff38f27c0069c9e8f3d67b5d08`.

## Validation

| Check | Result |
| --- | --- |
| Seven focused preparation, capacity, imports, binding and native-adapter tests | 7 pass, 0 fail; 16.67 seconds. |
| Final-source preservation rerun after the witness-search reuse edit | 2 pass, 0 fail; 7.54 seconds. |
| Actual public effectful Operation verifier with source/native audit custody | 1 pass, 0 fail; 83.75 seconds overall; 23 checks and 1,904 cases including the descriptor. |
| Reconciled source materializer check | Pass: 70 sources. |
| Cross-generator source materializer check | Pass: 18 sources. |
| Profiler syntax check and scalar execution smoke | Pass. |

The seven-test run preceded the final witness-search call-site reuse; the two-test preservation rerun and public verifier used the final source. The first and final preservation runs overlap: do not count them as extra distinct coverage. Node emitted its existing module.register deprecation warning, not a test failure.

Reproduction from impl/cli, using the existing Node/tsx toolchain:

```bash
TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
  --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  --test --test-reporter=tap --test-name-pattern='Operation preparation' \
  test/verification/reconciled-operation-controls.test.ts
```

For the actual public test, use the same runner with DOMAINSPEC_LEAN=/home/vrondelli/.elan/toolchains/leanprover--lean4---v4.33.1/bin/lean and pattern `public verification runs effectful Operation controls with source and native audit custody`. Native compilation uses the existing pinned domainspec-node-toolchain:26.8.1-ts7.0.2 image, not a substituted compiler.

The profiler runs with the same loader and `tools/profile-verification-preparation.mjs scalar` (or compound/mixed). It prints JSONL and owns fixture cleanup. No full mutation suite, 56-file proof registration, full caller qualification or R08 closure was claimed.

## Remaining decision and exact frontier

The pre-existing capacity decision remains **unselected**. Decision-gate result: **BLOCK for E2 capacity changes**, not failure of E1. Recommendation: complete bounded per-Operation native batches with explicit aggregate case/call/byte/time and currentness contracts. This preserves complete case families and allows individually supported rows to compose; it requires transport, receipt-join and affected-caller tests.

Alternative: preserve the combined 16 MiB ceiling and deterministically report known over-capacity verification as unavailable. This is simpler but does not add four-row verification support. Unexpected execution failures must still fail.

The unchanged mixed prediction is 19,834,753 observation bytes, exceeding the combined 16,777,216-byte output limit. Preparation optimization does not reduce it. Input bounds are independent and must remain explicit in either branch. The existing decision record, historical failed run and selected:null state are preserved.

After owner selection: define the chosen contract, implement E2, then perform the affected required WPE/caller qualification under E3. Audit caching is deferred unless measurements justify it. E4 case reduction remains off the critical path. R09–R18 and all 39 profile cells retain their original scope; AlchLang remains deferred. No commit, publication, deployment, goal completion or release claim.

Execution effect: a5a8c1b537579c01a070ec5a0960bb783a06a1a58f2919eeeec5cc6383c355a3.

