# Reachability and reduction investigation

Date: 2026-09-13. Status: bounded investigation complete; seven-case reduction rejected as insufficient.
No production source, test definition, resource limit or coverage contract changed.

## What is now established

The existing generated cases are not simply broken. All six owned-result validation locations in the mixed fixture have reachable rejection cases. There is substantial repeated and overlapping exploration, but replacing it with one negative per location loses observable behavior.

A native comparison demonstrated both sides:
- Seven directed cases (one valid result and six single-invalid-owner results) detected three broad defects also detected by the full 1,804-case Operation family.
- The same seven cases missed a fourth defect conditioned on an empty list. The full family detected it in 339 cases.

Therefore neither final-outcome grouping nor one-case-per-validator is an adequate reduction policy. This is a concrete counterexample, not a general argument against reducing coverage.

## Exact first-failure paths

Each of the four Operation rows has the same 1,317 vector-origin result rejections:

| First failing owned value | Cases per Operation |
| --- | ---: |
| result.customer | 669 |
| result.lines[0] | 229 |
| result.lines[1] | 196 |
| result.money | 155 |
| result.choice.payload | 50 |
| result (Order itself) | 18 |
| **Total** | **1,317** |

Each location is already reached somewhere in the existing family. No missing validation location was demonstrated by this investigation.

**921 cases per row contain more than one invalid owned value**: 3,684 across four rows. A diagnostic collect-all traversal found additional invalid owners after the first actual rejection. Examples per row: the root Order is also invalid but masked in 685 cases, and Money is masked in 503. These path counts overlap and must not be summed as distinct cases.

An invalid later field is not exercised simply because it appears in a recipe. The source execution stops at the first rejection. Conversely, a multi-invalid case may still test precedence or an interaction and is not automatically removable.

Method: instrument only the reference's owned-validator checks in memory, preserve every expected observation byte for all 7,222 cases, and compare the first actual failure against a separate collect-all traversal of normalized source values. The collect-all traversal is diagnostic only; it never changes production short-circuit behavior. The fresh fixture/plan and complete per-row source output hashes match the previous census.

## The 76 early Event cases are legitimate boundaries

The detailed check resolves the previous reachability flags:

| Actual obligation | Per row | Four rows |
| --- | ---: | ---: |
| Reject non-inert input during capture | 18 | 72 |
| Reject a missing required root Event parameter | 1 | 4 |

All stop before begin, with no transaction trace and no getter reads in the reference observation. They cannot establish downstream Event-constructor validation. Their current early rejection is not itself a defect or evidence that these tests are useless.

Existing owner Event tests separately cover constructor values, clocks, optional fields and representation boundaries. This investigation does not freshly qualify those suites.

## Directed witnesses and native falsification

The directed baseline uses valid customer, Money, Some payload, two line items and root Order. Each of six negative cases changes only the selected owner's positive-rule argument to zero. Source checks establish exactly one invalid owner and actual arrival at that owner's rejection.

The original commerce:perform generated closure was strict-compiled with the existing pinned TypeScript image. Both the full 1,804-case family and all seven directed cases matched expected native semantic observations. Every mutation below was applied to a temporary generated TypeScript provider, strict-compiled, and run in a fresh native process.

| Injected defect | Full-family mismatching cases | Directed mismatching cases | Conclusion |
| --- | ---: | ---: | --- |
| Ignore root factory rejection | 18 | 1 | Both sets detect |
| Skip all owned-result validation | 1,317 | 6 | Both sets detect |
| Skip rollback | 1,355 | 6 | Both sets detect |
| Skip owned-result validation when lines is empty | 339 | 0 | **Seven-case set is inadequate** |

Mismatch counts are successful defect detections, not failures of the unmodified product. The clean original had zero mismatches.

The fourth mutation changes:

```typescript
own0(result);
```

to:

```typescript
if (result.lines.length !== 0) own0(result);
```

The directed witnesses all contain two line items; none tests the empty-list branch. The first full-family detection is case-218. This demonstrates an actual interaction between collection shape and owned validation that a location-only selector would discard.

Five compile-and-execute rounds in the final experiment took approximately 9.8 seconds combined. This is diagnostic wall time, not a before/after performance benchmark or full verifier timing. The experiment evaluated semantic observations only; it did not qualify direct-provider protocol identity, static/native audits, other fixtures, or all 39 profile cells.

## Consequences for a useful smaller generator

The next candidate must preserve source-bound obligations **and their relevant dimensions**:

1. Keep a valid surrounding witness and an isolated negative for each actual validation occurrence.
2. Retain required collection contexts: empty, singleton and multiple elements, order/duplicate distinctions, and the interaction of those contexts with validation. Do not blindly Cartesian-product all combinations.
3. Retain applicable sum variants, optional absence/presence, numeric representation boundaries and Unicode distinctions. The current experiment does not establish a sufficient minimal set for these.
4. Keep ordering, repeated slots, same-typed swaps and cross-case identity tests separately. These are not captured by semantic outcome equality.
5. Preserve at least the demonstrated empty-list validation counterexample in reduction comparisons. A selector that detects only the first three mutations must fail its acceptance check.
6. Compare full and candidate sets against existing applicable semantic and protocol mutants. New boundary probes can reveal gaps in either set; the full set is a finite baseline, not universal truth.

A reasonable next unit is a **diagnostic obligation-plus-boundary selector**, not batching or deleting thousands of cases at once. First add the empty-list interaction witness and the other declared value dimensions; then test the candidate. The eventual selected count remains unproven. No production default should change based on the seven-case experiment.

Product-construction frontier: sufficient witness selection and its validation evidence.
Runnable now: construct a bounded selector candidate and run affected source/native comparisons.
Operational support: diagnostic reports and focused feedback scheduling, owned by the implementing agent; no required infrastructure change.
Deferred: transport capacity selection, general caching, full R08 caller qualification, R09–R18 and AlchLang. The transport decision is not a blocker to this investigation.

## Evidence and reproduction

- [Structured measurements](REACHABILITY-RESULT.json)
- [Diagnostic program](investigate-case-reachability.mjs)
- [Prior classification](TEST-CLASSIFICATION.md)

From the DomainSpec project root:

```bash
NODE_NO_WARNINGS=1 TMPDIR=/home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/test-tmp \
  /home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run node \
  --import /home/vrondelli/.cache/domainspec-locked-deps-rIAeDq/projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs \
  development/reconciliation-v1/profile-compiler-reconciliation/evidence/verification-efficiency/investigate-case-reachability.mjs --native
```

Omit --native for source-only tracing. Temporary fixture cleanup runs in finally. No generated mutant is retained in the repository.

Selected evidence identities:
- Generator: 95bf28a1677709c346be8d5749f8bc0b9d526fada01afa83c69af854211e5949.
- Effect reference: eb776f5b1798169c25fad19bf901b6486a02d6ea16c11202e3c30e9506132c66.
- Value/capture reference: b7303682fde7c1193d6fb9c0d2fa51a504b7224bb53e5b9eb83265e35547a2ed.
- Semantic runner: 6b49a9167aa622ddc3d40bea3521ee70278d0db56d7d6c56cbdc728391fdb4ec.
- Mixed fixture helper: 89429ed1da1f16e4e76854e3b54389f69e634fcb0e880d297673fc49cf3fb334.
- Executed diagnostic: 2353ac18ecd8d5490285c004e76ad5b7e787298c0e0ec862bd894a5979a1684a.
- Plan: e88a17b5e8184d2fbef3da784a81fd11c26868d06d025d51c55163fefc7e8154.
- Native image: domainspec-node-toolchain:26.8.1-ts7.0.2, ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef.

Run history: initial instrumentation refused an ambiguous marker before fixture/native work; the marker was narrowed to the write-validation call. The first three-mutant experiment completed, but verbose tool output was truncated. A final bounded run added the empty-list counterexample and captured complete structured results. No failed product test was hidden or relabeled. Only the final exact experiment supports the table above.

Source pointers (project-relative): impl/cli/src/verification/reconciled-operation-effect-reference.ts:28 and :93; impl/cli/src/verification/reconciled-operation-values.ts:14; impl/cli/src/generation/configured-operation-owned.ts; impl/cli/test/verification/reconciled-cross-generator-operation.test.ts:72 and :113.

Scope ceiling: observed reachability and four named compiling mutations on one native Operation, plus source tracing on four rows. No claim of universal equivalence, whole-suite redundancy, release readiness, or safe wholesale deletion.

