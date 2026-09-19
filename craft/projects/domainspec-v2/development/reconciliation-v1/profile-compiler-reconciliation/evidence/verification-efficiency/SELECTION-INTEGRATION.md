# R08 direct-provider selection integration

Date: 2026-09-13. Product construction; authority effect: none.
Status: generic selector integrated in the working-tree verifier and bounded public qualification passed. R08 and the full CLI goal remain in progress.

## Result

The actual public verifier no longer hits the mixed fixture's independent Operation output overflow. Its Operation family passes. The complete mixed result is correctly **incomplete**, because the separate 64-step Workflow remains unavailable at its unchanged 32 MiB whole-family limit. No failure was relabeled as success.

The direct-provider path now retains 5,010 of the 7,222 original finite cases for the four eligible Operation roots. **Full semantic case generation and verification remain unchanged.** This integration therefore preserves more semantic coverage than applying the diagnostic subset to both lanes.

The registered selected native run returned 15,763,458 bytes, below the unchanged 16,777,216-byte output limit. Input was 3,612,544 bytes. Source family limits, logical full-family call/case/byte accounting, native limits, audit requirements, and supported domain semantics were not widened. Existing non-applicable effectful and multi-input families retain all their direct cases.

## Exact implementation

Project-relative paths:

- `impl/cli/src/verification/reconciled-operation-cases.ts`: records initial-vector provenance in a private WeakMap without adding fields to the complete semantic payload. Cloned/unregistered provenance requests reject.
- `impl/cli/src/verification/reconciled-operation-protocol-selection.ts`: source-driven occurrence, primitive representation, structural boundary, invalid-pair and complete direct-call obligations. No commerce names, fixed counts, census file, in-memory instrumentation or development-directory dependency.
- `impl/cli/src/verification/reconciled-cross-generator-operation.ts`: checks the complete predecessor logical family bounds before selection; registers exact source/selected accounting and unchanged actual selected expectations.
- `cross-generator-operation-protocol-contract.json`: explicit v2 finite-provider policy with definition/scaffold, applicability, invariants, algorithm, limits and acceptance obligations.
- `cross-generator-operation-protocol-v1.predecessor.json`: exact prior bytes, SHA256 001b5a1eb2d0d35c42b50463280eda66e19f3077812079542ebf84250122edb0.
- `impl/cli/contracts/cross-generator-source-selection.json`, `impl/cli/src/verification/cross-generator-sources.ts`, generated capsule: selected packaged v2 bytes. Capsule regenerated using the existing materializer, not hand-edited.
- New selector test plus focused updates to public mixed verification and source-capsule compatibility assertions.

Eligibility is declared structurally: one input, identity result with empty projection and exact matching type, no reads/writes. Other Operations retain their full direct family. This is a finite selection applicability boundary, not removal of support for other Operations.

Only overlapping multi-invalid-owner initial vectors can be removed from direct instrumentation. All valid cases, isolated invalid owners, non-result failures, hostile descriptors/capture, Event cases, optional omissions and transaction modes remain mandatory. The selector preserves original case IDs and order. Grouping normalizes only exact owned-token prefixes in framed protocol observations; execution compares original unnormalized identities.

The optimizer has a depth/work budget. Exhaustion falls back to the complete family, not a passing prefix or reduced coverage. A bounded inverted obligation index avoids repeatedly rescanning every key. No generic cache, repository-wide framework, batching or configurable public resource policy was introduced.

## Executed verification and retained failures

| Evidence | Result and scope |
| --- | --- |
| Original preservation tests plus source direct-protocol control | 3 passed; scalar, mixed, multi-input, guard, read/write and capacity semantic payload digests unchanged |
| `selection-integration.tap` | 3 passed; exact deterministic prototype-selected IDs, complete semantic bytes, mandatory cases, full-family fallback for non-applicable shapes, all-four native protocol match, empty-list/duplicate-call/wrapper-identity mutations rejected |
| `selection-renamed-input.tap` | Initial fixture test failed because it omitted required Workflow bindings; retained as failure evidence |
| `selection-source-compatibility.tap` | Initial run 7/8 passed, including relocated compiled preparation with development access denied; the old immutable-all-contracts assertion correctly failed on the intentionally versioned protocol |
| `selection-source-repair.tap` | 2 passed: complete renamed-input/workflow bindings; exact old protocol and reconstructed unchanged seventeen-contract predecessor, not a replaced expected digest |
| `selection-public-native.tap` | Actual strict-compiled public verifier passed the mixed ready/unavailable scenario in 231.23 seconds; Operation pass, original 12,460-case Workflow observed, oversized Workflow unavailable, complete audit path accounting/currentness/cleanup preserved |
| `selection-public-callers.tap` | 10 passed: source/snapshot APIs and all 13 metatypes; actual CLI whole/node builds; generated compound native execution; invalid inputs, currentness, target preservation and import closures |
| `selection-protocol-regressions.tap` | 5 passed including two layout subtests; unchanged effectful protocol, cross-case owned-return reuse rejection and plain Enum singleton identity |
| Materializer `--check` | 18 selected cross-generator contracts match generated bytes; unchanged 70-source compiler capsule asserted in compatibility tests |

The CLI caller test's `verify` command checks artifact currentness and explicitly reports native/semantic/formal work not performed. Actual semantic/native evidence comes from the separate public-verifier run and generated-code tests, not from reinterpreting that command.

The registered all-four native output differs slightly from the earlier diagnostic because its real controls digest is used. Neither byte count is a speedup benchmark. The public run took about 3.85 minutes; source preparation and independent semantic checks remain substantive work.

No selector repair was needed after its initial integration checks. Two test-harness/expectation repairs were explicit: retaining required Workflow bindings in the renamed-input fixture, and reconstructing the preserved old protocol for the historical capsule assertion. The first predecessor-copy attempt omitted an extra trailing newline; this was corrected and its exact historical digest verified before successful compatibility qualification.

## Current source and test identities

Final integration source identities (not a claim that every transitive historical receipt was freshly qualified):

| Project-relative path | SHA256 |
| --- | --- |
| impl/cli/src/verification/reconciled-operation-cases.ts | 32439c9ec524b627d8527145d5618e62fd81b96d9d6b141148a9a021f2615372 |
| impl/cli/src/verification/reconciled-operation-protocol-selection.ts | 9ad1a384bb7d537558c1e39a7fc23b9738f3e8c78b5ad29f7ba1ef97f408ef71 |
| impl/cli/src/verification/reconciled-cross-generator-operation.ts | 6aefbb8012792f15a0cc75779669e61eaa64b7c5bfe38f06126985cc30d60a05 |
| impl/cli/src/verification/cross-generator-sources.ts | f17d7f16e347c001fb30b6d8fac1bce18e4831ffa5e2613f7074855cda8b8963 |
| impl/cli/src/verification/cross-generator-sources.generated.ts | a71487852f27faf613dfc6897ebbbd2fb8715f53698726e14188b5a14f450c68 |
| impl/cli/contracts/cross-generator-source-selection.json | bd437ef95876a24cb1a0c1558cae5f6983663d7b36dee215a2b5794ba5b79da3 |

Protocol v2 digest: d40ea336a6af8673e69a4a958ee7f9885fdef26f890a50dd863e0d294fbaa56d.
Current 18-source capsule digest: 78165252aaa9d48c288c920ae580bf2c03e955c2f50a698d32e2c412a93ff4a2.

Key TAP identities:
- selection-integration.tap: 1f71ed8587c8a290804c6e6a70e7e545023760e309815c618d588ebc7eeb103d.
- selection-public-native.tap: 4060cc44ba25abe68c47d3eb57cf5cb4b48a4961a12062be823a8a8fdd49bb5f.
- selection-public-callers.tap: f78b199550c8024bc56c52c5c59e948b676059b072ecc3fb65cb929a6641a75d.
- initial selection-source-compatibility.tap: 98c6585383f6c959a5cdcf2a11d969b196065d03975ea0c373bc974f5b9737b9.
- selection-source-repair.tap: 093b2547483c63104e491349b03551162a31ccb50c5ef21999984131aff1d10d.

## Reproduction

From `impl/cli`, use the existing Node launcher and TSX loader with these test surfaces:

```bash
NODE_NO_WARNINGS=1 TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
  --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  --test --test-concurrency=1 test/verification/reconciled-operation-protocol-selection.test.ts
```

For the actual mixed public regression, additionally set `DOMAINSPEC_LEAN=/home/vrondelli/.elan/toolchains/leanprover--lean4---v4.33.1/bin/lean` and select `--test-name-pattern='native mixed public evidence'` in `test/verification/reconciled-workflow-public-coverage.test.ts`.
The retained TAP files identify exact executed test names. Tests own their temporary fixture effects and cleanup.

## R08 remaining work, not a new investigation

WPE-T04's observed Operation transport failure is resolved for the required mixed fixture without selecting a new capacity behavior. WPE-T09 has current packaged-source/relocation evidence and explicit predecessor preservation. WPE-T10 has fresh public API, source/snapshot and actual CLI build checks, but this slice is not the whole R08 completion audit.

Next: reconcile the finite WPE-T01–T10 checklist against exact current dependencies and assertions, run remaining affected regression controls (including any still-needed scalar/full-compound public or hostile identity/currentness variants), then close R08 only when every existing obligation is covered. No new test-classification or optimization cycle. Full R09–R18, including the reproduced R09 publication race, remain separate required work.

The capacity-options document remains historical and unselected; its change-of-capacity choice is no longer a prerequisite for this fixture. Existing ceilings remain effective for other models. No batch support or arbitrary larger-model support is implied.

## Task Session Result

- Task: R08 generic direct-provider selection integration.
- Result: PASS implementation slice / FLAG whole-R08 completion.
- Context: existing selection experiment; case provenance/generator; independent effect/protocol references; packaged protocol and materializer; focused public/CLI/identity tests. Each source serves the selection, preservation, packaging or current-caller obligation; unrelated domain redesign excluded.
- Runtime: local, no adapter or new delegation. Context-builder standard mode; handoff and strict handoff coverage not applicable.
- Gate: exact user-authorized candidate implementation; no unresolved product choice needed for this slice.
- Decisions: retain full semantic cases; restrict direct selection to proven structural applicability; preserve full-family fallback and all existing capacities.
- Experiment harness: not applicable to spell/sigil development.
- Synchronized records: this report, efficiency-plan frontier, current CLI ledger note and historical capacity-decision status.
- Remaining: exact R08 qualification audit and affected checks, then R09 integration. No release, publication, default profile cutover, authority or full-goal completion.

