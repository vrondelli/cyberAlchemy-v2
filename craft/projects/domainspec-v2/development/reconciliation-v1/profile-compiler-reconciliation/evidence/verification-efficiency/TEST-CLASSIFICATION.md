# Operation test value classification

Date: 2026-09-13. Status: measured classification and proposed generation policy.
Scope: current four-Operation mixed fixture and six Operation verification test files.
No tests removed, no generator/transport contract changed, no native qualification or release claimed.

Follow-up: [reachability and native reduction investigation](REACHABILITY-INVESTIGATION.md) confirms all six result-validation locations have witnesses, resolves the early Event cases, and demonstrates why seven location-only cases miss an empty-list defect. The original classification below remains a historical diagnostic, not a deletion policy.

## Conclusion

The optimization target is **repeated nested-value exploration at the wrong verification layer**, not transaction safety, identity, or evidence-integrity tests. Replace broad sample composition with source-bound obligation witnesses. Keep exhaustive owning-component checks where justified, and focused per-root integration checks. Do not deduplicate by pass/fail or final result.

[Machine-readable classification](TEST-CLASSIFICATION.json) assigns every one of 7,222 current cases exactly once, by Operation selector and inclusive case-number ranges. It includes 106 origin/stage buckets and a title/line inventory of 44 top-level tests in six Operation verification files. It is diagnostic data, NOT a runtime selection manifest. Other metatypes and generated read/write fixtures have not received a per-case census in this pass.

[Reproducible diagnostic](classify-operation-cases.mjs) instruments a pinned generator in memory, asserts complete byte equality against the untouched generator, checks agreement with direct-protocol source observations, and verifies no missing or duplicated case assignments. It never deletes, selects or executes native cases.

## Measured case classification

| Origin | Cases | Value and proposed treatment |
| --- | ---: | --- |
| Nested input vectors | 6,140 | Largest consolidation target. Replace generic sample combinations with reachable boundary, rule, type-path and wiring witnesses. Keep exact numeric carriers, Unicode distinctions, collection semantics and variants where relevant. |
| Nested malformed values | 616 | Keep operation-boundary normalization witnesses. Generic shape rules can be concentrated in their owner only after proving the Operation's separately generated normalizer remains covered. A factory test alone does not prove this boundary. |
| Event variations | 350 | Separate constructor validation from per-slot Operation wiring, clocks and rollback. Consolidate repeated primitive matrices into Event suites only with representative integration witnesses and exact dependency evidence. |
| Additional transaction modes | 60 | Keep: rejection, uncertainty, exceptions and malformed receipts have distinct contracts even when outcomes coincide. There are also committed cases elsewhere; 60 is not the entire transaction coverage. |
| Root object shapes | 28 | Keep: prototype, descriptor, inertness and valid frozen/null-prototype behavior are distinct acceptance and safety boundaries. |
| Input-field descriptors | 12 | Keep by actual input occurrence: getter, hidden field and missing required field. |
| Optional omissions | 12 | Keep omission/null distinction and normalization at the applicable field paths; do not merge into malformed required fields. |
| Capture scenarios | 4 | Keep per Operation root: mutation isolation and deferred capture are not implied by ordinary value cases. |
| **Total** | **7,222** | Every case accounted for; none labeled proven safe to delete yet. |

The four rows contain 1,804 / 1,807 / 1,804 / 1,807 cases. The fixture has **zero read and write slots**, and an always-true Operation guard. It cannot establish read/write behavior, guard rejection or multiple-guard precedence regardless of case count. Those obligations belong to other existing fixtures, not thousands more repetitions here.

### What the repetitions actually mean

Each row has 1,535 input-vector cases:
- 218 commit successfully, producing 217 distinct complete semantic observations.
- 1,317 fail at result validation and share one complete semantic observation.
- Those 1,317 failures still have **575 distinct direct-protocol observations** after renaming only the per-case owned-object token prefix. Provider, method, arguments, call order and within-case identity links remain distinct.

Across four rows, 5,268 cases (72.9% of all cases) fail at result validation. Structural type acceptance is not factory-validator acceptance: the current vector generator deliberately explores structural values, including values that violate positive owned-value rules. Earlier owned-value failures may hide later validation obligations; identifying the exact failing owner/path is still necessary before choosing replacements.

The 575 count is a diagnostic, **not a minimal suite size**. Even identical full observations on the current implementation do not prove that two different inputs detect the same defects. Cross-case return reuse and plain-Enum singleton identity also require sequences, not isolated observation grouping.

Each Event family contributes 19 cases that stop at input capture, totaling 76. These include getter, non-enumerable and missing-field cases. They may be valuable early-rejection checks; they must not be credited with reaching Event-constructor validation. Earlier failure is not automatically a useless test.

The cloned Operation roots share values and Rules but retain different Operation/Event identities. Reuse preparation if justified; preserve execution and wiring evidence for every generated root.

## Test-suite ownership and scheduling

Counts below are static top-level declarations, not generated cases or mutation iterations. Assertion sites were inspected; no native tests were rerun for this classification.

| Suite under impl/cli/test/verification | Top-level tests | Primary responsibility | Routine trigger |
| --- | ---: | --- | --- |
| reconciled-operation-reference.test.ts | 4 | Scalar/Enum semantic oracle, guard order, outcomes, capture and settlement mutants | Semantic execution, normalizer or fixture changes |
| reconciled-operation-effects.test.ts | 9 | Typed reads, writes, identity comparison, guards, Event slots/clocks, owned validation and effects mutants | Any affected Operation action/provider/value behavior |
| reconciled-operation-controls.test.ts | 12 | Source-case generation, capacity, binding and real public verification/audit custody | Generator/binding change: focused source tests first; public/native checks when executable behavior or its acceptance changes |
| reconciled-cross-generator-operation-surface.test.ts | 7 | Exact imports, paths, ownership closure, layouts and source/native AST rejection | Renderer, import, module-layout or audit changes |
| reconciled-cross-generator-operation.test.ts | 7 | Original provider calls, ownership identity, duplicate/missing calls, clocks and cross-case identity | Provider wiring, observer, selector or owned-value behavior changes |
| reconciled-cross-generator-operation-execution.test.ts | 5 | Retained receipts, artifact/tool currentness, execution boundaries and failed/incomplete observations | Executor, batching, tool binding, persistence or cleanup changes |
| **Total** | **44** | Complementary claims, not 44 copies of one test | Full affected qualification at a milestone, not after prose-only edits |

Selection depends on actual dependency impact, not a title or filename alone. Unknown impact requires broader checks. These are scheduling recommendations, not a replacement test runner.

Important owner suites:
- Rule controls: structural facts independent of factory validity; true/false witnesses, identity/value, String ordering, sums and list/set behavior. See reconciled-rule-controls.test.ts:61, :97.
- Factory controls: lifecycle/validator order and field composition. See reconciled-factory-controls.test.ts:35, :110.
- Sum controls: variant/carrier/collection and deep immutability. See reconciled-sum-controls.test.ts:40, :70.
- Owned-value protocol: each owned field occurrence, raw/cloned/foreign ownership, repeated same-typed fields, Enum aliases and nested identities. See reconciled-cross-generator-owned-values.test.ts:42, :94.
- Event controls: time/occurrence, signed carriers, optional absence and source/native audit custody. See reconciled-event-controls.test.ts:37, :228.

These owners have distinct responsibilities. Existing tests are pointers to coverage to map, not evidence that every current Operation case can already be removed.

### Retire temporary optimization locks from the permanent acceptance role

The two newly added exact-output digest tests in reconciled-operation-controls.test.ts:85 and :96 prove the preceding coverage-preserving optimization did not change enumeration. They should not force 7,222 cases forever.

When an intentional selection change is implemented, retain their historical before/after evidence, then replace the relevant whole-enumeration assertions with:
- complete required-obligation accounting;
- deterministic selected cases and reason for each selection;
- reachable positive/negative witnesses;
- genuine capacity rejection behavior;
- full-versus-reduced comparisons on the frozen fixture and targeted mutants.

The capacity behavior embedded in the second test remains required. Do not merely update a digest and call the reduced suite equivalent.

## Proposed generation policy

### The unit of value is an observable obligation

A retained case must name a source-bound obligation or an explicit regression. Suggested minimal classification fields:

```json
{
  "operation": "commerce:perform",
  "obligation": "owned-result-validator",
  "target_path": "result.money.quantity",
  "owner_selector": "commerce:money",
  "phase": "result",
  "variation": "zero-rejected",
  "evidence_lane": "operation-integration",
  "witness": "prior stages pass; earlier sibling owners valid",
  "required_observations": ["factory rejection", "rollback", "no commit"]
}
```

This is illustrative policy metadata, not an already implemented DomainSpec schema.

Generation rules:
1. Derive required obligations from actual inputs, field occurrences, guards, result/write paths, read identities, Event slots and declared execution semantics.
2. Build valid surrounding witnesses first. For a guard-negative witness, earlier guards pass; for a later owned field failure, earlier owners pass. If a required witness cannot be established within the declared bound, report that obligation unavailable—not covered and not logically impossible.
3. Generate the smallest directed positive/negative/boundary set for each obligation. Numeric literal boundaries, accepted carriers, Unicode forms, optional presence, every sum variant, list ordering/duplicates and set uniqueness are different obligations where the source consumes them.
4. Keep per-root and per-slot integration witnesses: exact target, call order/multiplicity, write mode, ownership links, clock identity and same-typed field swaps. An owning-component pass cannot replace a distinct generated call site.
5. Add deliberate interaction cases where one-at-a-time mutation cannot prove composition: guard precedence, repeated slots, cross-field constraints, transaction/event atomicity, list/set ordering and cross-case identity. Do not indiscriminately Cartesian-product all boundary values.
6. Consolidate candidates only when they cover the same proven obligation set with equivalent reachability and relevant observations. Preserve sequence obligations. Unknown or unmapped cases remain review items, not automatic deletions.
7. Keep exhaustive/generated component campaigns at their owner as appropriate, while the composed model runs its selected integration set. Full historical cases remain a bounded comparison campaign during the transition, not an eternal per-edit requirement.
8. Report required, selected, witnessed, not-evaluable and missing obligations independently. Empty, partial or stale evidence cannot become success. Track selected cases/calls/bytes separately from obligation coverage.

### Required reduction evidence

Before making a reduced set the default:
- Assert every mandatory source obligation and field/slot occurrence has a reachable witness or explicit unmet status.
- Compare full and selected sets on the frozen mixed fixture and independent effectful, multi-input, scalar and Enum fixtures.
- Run the existing applicable compiling mutants against both, including duplicate/missing/wrong-provider calls, same-typed swaps, guard ordering, skipped awaits, ownership reuse, Event clocks, changed outcomes and late evidence drift.
- Reject reduction if the full set detects a mutant the selected set misses; investigate equivalent/unreachable mutants explicitly.
- Add targeted assertions for known untested paths rather than using mutant count as universal correctness proof.
- Measure source preparation, native time and observation bytes. Do not promise a specific reduced count in advance or require a number merely to fit the existing buffer.

The existing direct protocol contract currently says to reuse all complete source-derived Operation cases. Separating owner/integration generation needs an explicit successor coverage policy and affected bindings, not silently taking a prefix of current cases. This classification does not change that contract.

## Exact next construction step

Product construction: build obligation provenance and reachable witness assertions at the generator's source branches, then a deterministic candidate selector with reasons for retained and superseded cases. Start with the 6,140 vector-origin cases; treat the 616 normalizer negatives separately. Prove equivalence against relevant regressions before activating reduced generation.

Operational support, owner: implementing agent; affected stage: validation feedback. Use focused dependency-based checks and retain this compact report. No CI replacement, cache framework or repository cleanup is required.

Transport batching remains deferred until selected-case bytes are measured. The prior capacity decision is still unselected, but it does not block classification or constructing the reduction candidate. If meaningful selected cases still exceed a limit, revisit that precise capacity boundary.

## Reproduce and evidence boundaries

From the DomainSpec project root:

```bash
NODE_NO_WARNINGS=1 TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
  --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  development/reconciliation-v1/profile-compiler-reconciliation/evidence/verification-efficiency/classify-operation-cases.mjs
```

The source probe completed successfully. A first verbose diagnostic exceeded the tool-output limit; grouping was reduced to origin/stage buckets and the capture was repeated successfully. Node warnings were excluded from the machine-readable JSON, not from any test result. The second run preserves exact 7,222-case accounting. No performance comparison is claimed for this diagnostic.

Generator SHA256: 95bf28a1677709c346be8d5749f8bc0b9d526fada01afa83c69af854211e5949.
Plan SHA256: e88a17b5e8184d2fbef3da784a81fd11c26868d06d025d51c55163fefc7e8154.
Source manifest SHA256: 3a91570c69dd6f30bbec6b89587f0a5a34382303fbca30cc4d37ad336b153a31.

Native semantics, compilation mutants and public qualification were inspected as existing obligations, not rerun or newly certified. This is the Operation classification needed for the immediate bottleneck, not a claim that every test in DomainSpec or all 39 profile cells has been classified.
