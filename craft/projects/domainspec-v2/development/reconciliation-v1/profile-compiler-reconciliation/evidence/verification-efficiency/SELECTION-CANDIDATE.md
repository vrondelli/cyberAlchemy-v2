# R08 obligation-plus-boundary selection candidate

Date: 2026-09-13. Product-construction experiment; authority effect: none.
Result: PASS for the bounded candidate experiment, FLAG for production activation.
R08 remains in progress. No production source, existing test, capacity limit, supported profile or registered coverage contract changed.

## Outcome

The candidate selects 5,010 of the original 7,222 mixed-fixture Operation cases (2,212 fewer; 30.63%). A fresh strict-compiled native run of all four selected Operation families produced exactly the independently expected direct-provider and semantic observations.

Actual aggregate input: 3,625,924 bytes. Actual aggregate output: 15,763,424 bytes (15.03 MiB), below the unchanged 16,777,216-byte output limit by 1,013,792 bytes. The previous full-family estimate was 19,834,753 bytes; do not describe that earlier estimate as a newly measured native full-aggregate result.

This proves the candidate fits this fixture. It does not resolve arbitrary composed-model capacity, activate reduced production coverage, or complete WPE-T04/T10. The standalone diagnostic is not a registered public-verifier receipt.

## Candidate definition and navigation scaffold

The unit is a retained finite witness, not a business Operation and not a passing outcome.
A source-derived case contributes obligations; a deterministic selected subset covers those obligations.
A boundary is an observable distinction attached to a source occurrence: collection length/order/duplicate content, variant, optional representation, primitive value/representation, or invalid-owner interaction.
A provider signature preserves the ordered direct calls and exact framed arguments/results, normalizing only the current case's owned-token prefix for selection grouping. Original case IDs and unnormalized expectations are retained for actual execution.
These descriptions are candidate implementation navigation, not canonical domain or authority definitions.

Selection policy in the executed prototype:

1. Preserve every non-input-vector case: Event boundaries, descriptors, malformed values, optional omissions, capture, and transaction/receipt modes.
2. Preserve all input-vector cases except multi-invalid-owner result rejections. Thus valid cases and isolated owner rejections remain unchanged.
3. For reducible cases retain coverage of first-rejection occurrence plus complete structural shape; first-rejection occurrence plus every exact primitive atom/path/representation; ordered pairs of invalid owner occurrences; and complete normalized direct-provider call signatures.
4. Begin with mandatory cases, greedily retain the case covering the most remaining obligations, break ties by original source order, and emit retained cases in original order. A repeated selection must return identical IDs.
5. Keep each Operation identity separately. Never merge cloned roots or shorten an individual native execution at the buffer boundary.

All recorded original cases match the previous canonical per-row output hashes. Diagnostic tracing matches every semantic expected value. Independent collect-all enumeration confirms the first rejected owner and distinguishes isolated from multiple-invalid owners. Every extracted obligation remains covered.

| Operation | Original cases | Selected cases |
| --- | ---: | ---: |
| commerce:oversized-perform | 1,804 | 1,251 |
| commerce:oversized-undo | 1,807 | 1,254 |
| commerce:perform | 1,804 | 1,251 |
| commerce:undo | 1,807 | 1,254 |

## Native falsification

The original commerce:perform closure matched both complete and independently executed selected direct-protocol observations. The full semantic run also matched; selected semantic expectations were independently checked through the selected protocol execution. All four selected closures subsequently passed together.

Each injected provider mutation below strict-compiled and ran in fresh processes. Counts are mismatches against the unmodified independent reference, hence defect detections, not failures of the original product.

| Mutation | Full semantic | Selected semantic | Full direct protocol | Selected direct protocol |
| --- | ---: | ---: | ---: | ---: |
| Ignore root factory rejection | 18 | 18 | 18 | 18 |
| Skip all result ownership validation | 1,317 | 764 | 1,584 | 1,031 |
| Skip rollback | 1,355 | 802 | 1,355 | 802 |
| Skip validation for empty lines | 339 | 64 | 341 | 66 |
| Skip validation for singleton lines | 198 | 102 | 460 | 364 |
| Skip validation for None variant | 540 | 85 | 543 | 88 |
| Skip validation for two invalid owners | 533 | 91 | 533 | 91 |
| Duplicate guard call | 0 | 0 | 1,622 | 1,069 |

The final row demonstrates why semantic outcomes alone cannot select or qualify the cases.
The original seven directed witnesses remain in the comparison and still miss the empty-list, singleton, None and two-invalid interactions.

Timing is diagnostic, not a speedup claim. In the final run the original full protocol took 2.48 seconds and the selected protocol 2.94 seconds; the earlier run had the opposite ordering. The all-four selected protocol took 5.44 seconds. There is no stable end-to-end benchmark, and this diagnostic deliberately prepares the full source set, traces it, and then selects. Do not ship that repeated preparation unchanged as a performance fix.

## Context pack and evidence

Task-session / Context Builder, standard bounded mode; local execution, no adapter or new delegation. Strict handoff coverage: not applicable. No new blocker decision was needed for this non-activating candidate.

| Obligation | Controlling source and selector |
| --- | --- |
| Finite candidate cycle, preserved production coverage, conditional capacity decision | VERIFICATION-EFFICIENCY-PLAN.md: Executive decision; E4; starting R08 checklist |
| Prior counterexample and six reachable owner occurrences | REACHABILITY-INVESTIGATION.md: Directed witnesses and native falsification |
| Original case provenance and exact identity | TEST-CLASSIFICATION.json: generator_sha256; rows[].buckets; complete_source_output_sha256 |
| Current enumeration and case identity | impl/cli/src/verification/reconciled-operation-cases.ts: createOperationCases |
| Validation ownership and short-circuit order | impl/cli/src/verification/reconciled-operation-effect-reference.ts: ensure; expected |
| Type and multi-root fixture | impl/cli/test/helpers/workflow-values.ts: workflowValuesFixture; order; workflow-public-mixed.ts: mixedWorkflowPublicFixture |
| Direct-provider identity and fresh native execution | reconciled-cross-generator-operation-reference.ts: expected; reconciled-cross-generator-operation-runner.ts: CROSS_GENERATOR_OPERATION_RUNNER |
| Actual compiled semantic observation | reconciled-operation-runner.ts: OPERATION_SEMANTIC_RUNNER |

Exact selected source digests are in SELECTION-RESULT.json and were checked again before the final report was emitted. Broader source/native audit qualification is not claimed from these selected digests. Routing files and skills control process, not expected domain answers. Missing schema/reference lookup paths were corrected to their linked files before mutation; no source or product defect was inferred from those lookup mistakes.

Executed program SHA256: 8bd76d083a4608ea7b3f5991ae11bf379cd65acfb727a61b8d0e66eb7b510f0a.
Structured result SHA256: 1e455cef39f750a61ea699e4123ef66160654830e0c3b11c7e1c9839ccc9bab2.
Pinned native image: domainspec-node-toolchain:26.8.1-ts7.0.2, SHA256 ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef.

Run history: the initial eight-mutant run passed. Its verbose final tool capture did not retain all four row summaries, so it was not persisted as complete evidence. A compact source-only report confirmed all four rows. The final bounded qualification added explicit observed-count checks and the actual all-four aggregate execution; it passed and is the sole persisted result. Removing a no-op clone and an unused variable did not change selection policy. No candidate repair or failed product run was hidden.

Reproduce from the DomainSpec project root:

```bash
NODE_NO_WARNINGS=1 TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
  --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  development/reconciliation-v1/profile-compiler-reconciliation/evidence/verification-efficiency/select-operation-boundaries.mjs --native
```

Omit --native for source-only selection checks. Temporary generated modules and mutations are owned by the fixture and cleaned in finally.

## Remaining activation obligations — existing R08 scope

This prototype depends on the exact census, an identity-result commerce fixture, and in-memory validation tracing. It is not a generic compiler implementation. The next implementation must remove those fixture-specific dependencies and explicitly bind the successor finite-coverage policy before activation; keep the current full generator as fallback outside proven applicability.

Required affected checks remain: scalar and Enum-only non-regression; effectful multi-input/read/write fixtures; repeated slots and cross-case identity reuse; source/native audits and retained currentness; deterministic coverage/capacity accounting; source/snapshot and actual public CLI qualification under WPE-T01–T10. The existing current protocol contract says all complete generated cases, so no consumer may silently substitute this diagnostic subset under that unchanged contract.

Do not launch another classification/research cycle. Carry this tested selection into the bounded successor implementation, measure actual preparation plus execution, and qualify affected callers. If that implementation cannot meet the required coverage contract within the finite cycle, retain full production coverage and return to the explicit capacity decision. No capacity decision is being silently selected here.

Product frontier: tested selection candidate ready for bounded generalization/integration.
Operational support: this script and result are run evidence; parent owns their synchronization and heavy-native scheduling.
Separate preparation tasks retain their disjoint scopes. R09–R18 and AlchLang are not completed by this result.

## Task Session Result

- Result: PASS bounded experiment / FLAG activation.
- Decisions: selection tie-breaking and conservative retention chosen within authorized test work; capacity behavior remains unselected.
- Runtime: local, adapter none; no fallback routing or delegated experiment.
- Gate verdict: authorized candidate-only mutations; production activation not established.
- Files: select-operation-boundaries.mjs, SELECTION-RESULT.json, this report; parent efficiency-plan progress link.
- Validation: source identity/expectation/obligation/determinism checks; nine strict-compiled original/mutant variants; full and selected native protocol comparisons; exact all-four aggregate under unchanged input/output limits.
- Experiment harness: not applicable to spell/sigil development.
- Follow-up: successor coverage binding, bounded generic implementation, affected public qualification; R08 remains open.

