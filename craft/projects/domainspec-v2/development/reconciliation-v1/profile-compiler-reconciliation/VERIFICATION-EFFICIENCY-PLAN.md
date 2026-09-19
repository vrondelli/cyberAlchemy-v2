# Verification efficiency and completion plan

Date: 2026-09-13. Status: bounded E1 optimization and generic direct-provider selection integrated; actual mixed public regression and selected caller checks passed. Remaining R08 qualification is next. No capacity behavior change selected.
Scope: DomainSpec CLI verifier, development feedback loop, and existing R08–R18 delivery path.
Authority effect: none. No product scope, limits, cases, release status, or goal state changed.

## Executive decision

Current implementation: [generic selection and public qualification](evidence/verification-efficiency/SELECTION-INTEGRATION.md). Full semantic enumeration remains byte-identical; the explicitly versioned direct-provider policy selects the same 5,010 mixed cases. Actual registered native output fits the unchanged 16 MiB limit. The real public verifier now reports Operation pass and preserves the genuinely unavailable oversized Workflow, without the former ENOBUFS failure. Source/snapshot and actual CLI build checks passed. The capacity choice is not currently required for this fixture. Next is the exact remaining WPE-T01–T10 qualification audit; no new optimization/classification cycle. R08 remains open.

Latest execution: [selection candidate and evidence](evidence/verification-efficiency/SELECTION-CANDIDATE.md). The mixed fixture selected 5,010 of 7,222 cases; all four selected native Operation families matched exact expectations together at 15,763,424 output bytes, under the unchanged 16 MiB limit. Eight strict-compiling mutations were detected by both full and selected sets in their applicable semantic/direct-provider observations. This is not production activation or a speedup claim: the diagnostic still constructs the full cases and depends on fixture-specific tracing. Next is bounded successor-policy integration and affected qualification, not another classification pass. Original production coverage remains unchanged.

Current user-selected order supersedes the original E4 deferral: finish one bounded obligation-plus-boundary selection candidate before deciding whether transport capacity still needs to change. Preserve the full production cases until a successor coverage contract and affected evidence qualify the candidate. If the candidate fails, allow one focused repair pass, then retain full qualification coverage and move to the exact remaining capacity/qualification requirement. No general cache or selector framework, arbitrary count target, or renewed broad investigation. R08 stays in this task while the three preparation lanes in [PARALLEL-EXECUTION.md](PARALLEL-EXECUTION.md) proceed independently.

Use the existing [classification](evidence/verification-efficiency/TEST-CLASSIFICATION.md) and [reachability experiment](evidence/verification-efficiency/REACHABILITY-INVESTIGATION.md). All six owned-result locations already have witnesses; seven location-only cases miss an empty-list mutant. The next deliverable is a tested candidate preserving required boundaries and interactions, not another classification report. DomainSpec remains first; AlchLang is deferred through R18.

The first coherent delivery unit is **a measured, coverage-preserving R08 verification loop**: exact existing inputs enter, unchanged observations and rejection behavior leave, with fewer repeated preparations. It composes back into the existing public verifier; no new product metatype, policy, or runtime is required.

The user's reported 53 hours is elapsed project time, not a measured CPU total. This analysis does not attribute all of it: selected TAP files show slow runs, code shows repeated work, and the ledger shows a long R08 expansion. A complete session timeline was not reconstructed.

## Evidence and diagnosis

Paths below are relative to this work-pack unless stated otherwise. Measurements of case generation are from the preceding read-only analysis; its in-memory instrumentation was checked for exact canonical equality against unmodified generation on all four Operations. No native performance improvement has yet been measured.

| Finding | Evidence | Interpretation and confidence |
| --- | --- | --- |
| Four Operation rows generate 7,222 cases: 6,140 input variations, 616 malformed nested values, 350 Event cases, 60 additional transaction modes, 56 other boundary/capture cases. | `impl/cli/src/verification/reconciled-operation-cases.ts` under project root; exact analysis probe | Measured: 85% is nested input exploration, not distinct business actions. Fixture has zero reads and writes. |
| Each row has 16 factory-valid samples plus 1,519 structural samples. In `perform`, 218 input-vector cases commit and 1,317 have an identical failed/result semantic observation. | Same generator; `reconciled-rule-facts.ts`; `reconciled-operation-effect-reference.ts` | Measured repetition, NOT proof of redundant provider observations. Keep failures until field/rule/provider obligations are mapped. |
| Two cloned roots repeat exactly the original pair's recipes and case input data. | `impl/cli/test/helpers/workflow-public-mixed.ts:51` | Measured shared preparation opportunity. Distinct module identity and Event targets still require checking. |
| Baseline input substitutions attempt 6,140 additions but retain zero new cases. | `reconciled-operation-cases.ts:120` | Measured wasted attempts; existing dedup works. Removing attempts saves preparation only, not output bytes. |
| Predicted combined output is 19,834,753 bytes (18.92 MiB); about 14.34 MiB is provider-call arrays and 4.29 MiB semantic observations. | Exact source-derived protocol probe; `reconciled-cross-generator-operation.ts`; mixed native failure TAP | Existing combined native output limit is 16 MiB. This is verification JSON, not application code size or resident memory. |
| Foundation 21 tests: 655,483.974 ms; public/binding 17 tests: 1,035,998.604 ms; coverage 5 tests: 290,502.786 ms. | `evidence/r08ae14-workflow-public/{foundation,public-join,coverage-native}.tap` | Recorded 10.9, 17.3, 4.8 minute runs. Do not sum nested TAP durations or present these as a full 53-hour breakdown. |
| A source-only mixed-capacity check takes 46.9 s; focused mixed native repair takes 189.0 s including suite overhead. | `coverage-native.tap`, `coverage-mixed-repair.tap` | Preparation is already material; optimizing subprocesses alone is insufficient. |
| Native helpers compile the CLI again for each fixture. Family executors separately compile selected generated modules; public verification also compiles for typechecking and semantic execution. | `impl/cli/test/verification/reconciled-workflow-public-evidence.test.ts:28`; `test/helpers/workflow-public-mixed.ts:75`; `src/verification/reconciled-execution.ts`; `reconciled-cross-generator-execution.ts` | Confirmed repeated setup. Not all compilation is interchangeable: source sets, compiler options, module modes, and instrumentation differ. Exact savings unmeasured. |
| Aggregate `inspect()` checks every retained family before and after each next family, plus final checks; each family rehashes its workspace and toolchain. | `reconciled-cross-generator-public-execution.ts:165`; `reconciled-cross-generator-execution.ts:100` | For seven successful families: 49 receipt rechecks in the before/after loop, plus seven retain checks and 14 across two final inspections, before later public checks. This counts calls, not runtime percentage. |
| Standalone and protocol controls reuse the same case generator. | `reconciled-operation-controls.ts:20`, `reconciled-cross-generator-operation.ts:33` | Shared source preparation is plausible; independent execution assertions serve different claims and must not simply be deleted. This is outside the 7,222 family count. |
| Current progress carrier is 407,302 bytes/2,865 lines; completion ledger is 107,849 bytes/1,639 lines. | File sizes read during this analysis | Large historical context causes unnecessary rereading. Read current status and exact dependencies, not entire histories. History remains preserved. |
| R01–R07 have tested evidence; R08 remains open after many lettered successors; R09–R18 remain. | `CLI-COMPLETION.md:30`; `REMAINING-WORK-PLAN.md` | Delivery fragmentation is visible. Neither 7/18 nor test counts constitute a reliable percentage-complete or finish estimate. |

## What to preserve, consolidate, and stop

Preserve: independent oracles, actual native execution, exact provider/module identity, non-collapse and orthogonality checks, meaningful hostile cases, failure versus unavailable, source/tool/artifact currentness, owned cleanup, unchanged product semantics and the 39-cell denominator.

Consolidate: identical immutable sample construction; exact CLI test-harness compilation; repeated immutable parsing and digest calculations; adjacent duplicate currentness checks only when no effect boundary is crossed; reporting of already-recorded evidence.

Stop as routine practice: whole slow-suite runs after local expectation edits; repeating failed heavyweight experiments without a new hypothesis; rereading complete progress histories; adding a new verification abstraction without an uncovered existing obligation; repeatedly seeking decisions about ordinary internal test organization. Never stop a required final qualification or conceal the first failed run.

Do not silently remove repository routing or governance requirements. Use compact outputs, exact selectors, already-read instructions within their validity, and one bounded plan/review cycle. Changes to mandatory process rules would require their own explicit scope.

## Ordered implementation plan

Execution update (2026-09-13): [E0/E1 results](evidence/verification-efficiency/RESULT.md). One source-preparation profiling pass and one coverage-preserving optimization experiment completed. Mixed Operation case preparation improved 23.17% in paired median measurements; all 7,222 cases remain byte-identical. Focused and actual public-native checks passed. Full E0 phase accounting and required E3 caller qualification remain open. Current order: bounded E4 candidate, E2 only if still required, then E3 closure. Historical diagnosis and planning-review statements below describe the earlier baseline, not fresh end-to-end proof.

### E0 — Freeze the finish checklist and measure once

Owner: implementing agent. Lane: product construction; test scheduling/reporting is operational support for R08.

- Map remaining WPE-T01–T10 items and affected public callers to existing evidence, missing evidence, defects, or real product choices. Do not reset already-covered items. R08 exit is the original public-command/API equivalence contract plus its now-required verification integration, not arbitrary additional verifier perfection.
- Add lightweight run-local counters/timers for preparation, case generation, CLI compilation, generated compilation, audits, behavior, serialization, currentness, cleanup; record cases/calls/bytes, subprocess count and bytes hashed. No telemetry platform.
- Use one existing scalar fixture, one nested compound fixture, and the four-Operation capacity fixture. Reuse recorded baselines where their exact input/dependency identity is sufficient for the comparison. First use source-only probes, then at most one instrumented expensive run per genuinely missing necessary baseline. Do not reproduce the already-understood ENOBUFS merely to confirm it again. Preserve actual toolchain, process isolation and first-run failures. Bound profiling to one pass; investigate only the dominant measured costs.
- Exit: exact candidate/input identity, phase-cost table, finite R08 checklist, and identified first optimization. Do not launch the full 56-file proof registration as a profiling experiment.

### E1 — Remove exact repeated preparation and test setup

Owner: implementing agent. Lane: verifier changes are product construction; test harness reuse is operational support for R08 native tests.

This is a menu, not four mandatory projects. Select the smallest change with measured payoff; allow at most two optimization experiments across E1/E3 before returning to required R08 closure. A new general cache service, key registry or invalidation framework is explicitly deferred. Optimization is not a gate when required qualification can already run safely.

- Avoid baseline-substitution attempts only where their complete candidate identity is already present; no assumption that multiple-input/read fixtures behave like this single-input fixture. Compare ordered cases, recipes, expected observations, coverage and capacity outcomes before/after, not just counts.
- If justified by measurements, reuse immutable sample preparation within one run. Key by exact type, relevant rule literals, selected factory validators, source/profile versions and normalization semantics. Never cache expected results solely by input shape, because Operation/Event identities and bindings differ. Preserve each invocation's logical expansion, depth, recipe interning and serialized-size accounting even on a cache hit: skipping CPU work must not widen accepted inputs or change a capacity rejection.
- Compile the unchanged CLI harness once per exact source/dependency/compiler-option/toolchain identity per test run. Give each behavioral/mutation test its own workspace and processes; isolate the immutable compiled harness from mutation targets. Do not introduce persistent cross-run caches initially.
- Count repeated oracle evaluation and canonical serialization; reuse only pure identical computations where profiling shows material cost. Preserve source-case ordering and interning, including any capacity semantics affected by otherwise discarded attempts.
- Exit: complete equality evidence and hostile invalidation tests; unchanged failure/skip accounting; measured warm-run and cold-run timings. If an optimization does not measurably help, omit it rather than adding infrastructure.

### E2 — Repair bounded Operation transport without deleting cases

Owner: verifier implementer; product owner resolves any changed supported-capacity contract. Lane: product construction.

- Recommend complete per-Operation batches with explicit aggregate case/call/byte/time bounds, rather than one combined stdout blob or an unbounded buffer increase. Existing capacity decision remains unselected; this plan is not consent to change its semantics.
- Reuse the existing Workflow batching approach only where Operation receipt identity, compiler mode and currentness requirements match. Keep the entire currently qualified case family: the original 7,222 until a successor selection is qualified. Transport must never truncate a family to meet a buffer. Compile a matching module/configuration set once, not once per case/batch.
- Require exact row and case accounting, deterministic ordering, missing/duplicate/reordered/cross-root batch rejection, process errors, truncation, stale inputs, and cleanup tests. A failed batch cannot become unavailable or a partial pass.
- Lossless dictionary encoding/streaming is an alternative only if it preserves every observable distinction and the declared resource contract. It is not a second mandatory workstream.
- Preserve the independent whole-input bound as well as output bounds; output batching alone does not remove the existing 16 MiB input limit. If input transport also changes, declare and test its exact per-batch and aggregate contract.
- Exit depends on the selected contract. If per-Operation transport is selected: all four individually supported rows complete without ENOBUFS and exact assembled observations equal the original reference. If retaining the combined cap is selected: deterministic preflight reports the precise resource-unavailable condition, without claiming that this model was executed or that four-row support was added. Unexpected process errors remain failures. In both branches, actual oversize/timeout limits behave as specified. A reviewer preference does not select either branch for the owner.

### E3 — Target measured repeated audits, then close R08

Owner: implementing agent. Lane: product construction.

- Only if E0 shows material cost, collapse nested duplicate currentness work within a single no-effect boundary. Keep fresh checks across subprocess execution, writes, binding/exposure and cleanup. A cached digest is not a fresh filesystem observation; mtime/size is not byte identity. Do not assert a new immutability guarantee without proving it.
- Reuse compiler/audit preparation only for exactly matching inputs and options. Preserve separate ESM/CommonJS, instrumented/original, and source/native obligations. Defer a general shared compiler service or cross-run artifact cache.
- Run focused tests after each change, the affected family once per coherent change set, and the complete required public/caller qualification once at R08 closure. Rerun only affected files during repairs when dependency/currentness evidence justifies reuse; unknown dependency impact means rerun, not guessed reuse.
- Exit: fixed R08 checklist is fulfilled; all affected public commands/APIs qualify against the selected behavior; no live test handles or unresolved required failures. Then advance to R09 instead of creating another optimization successor.

### E4 — One bounded obligation-plus-boundary candidate before E2

Current implementation priority, not an open-ended research phase. Reuse completed classification and native falsification. At most one candidate and one focused repair pass before returning to required R08 closure. Do not remove full qualification coverage solely to meet a buffer or stopwatch. The source/direct protocol coverage contract and required observations must remain explicit when generation changes.

- Map cases to explicit field/representation/invariant/provider/transaction/Event obligations. Use a valid surrounding witness for each negative so the intended failure is reachable; inspect early-failure masking.
- Explore selecting representative integration cases while retaining exhaustive owning-type/factory suites. Preserve per-generated-root wiring checks, same-typed swaps, representation boundaries, list/set differences, Unicode, failures and uncertainty.
- Compare with the full suite and relevant compiling mutants. Matching mutant detection is supporting finite evidence, not proof of universal equivalence. Any changed finite coverage claim must be explicit. No numeric reduction target is justified yet.
- Do not block R09–R18 on this optimization if E1–E3 yield a usable loop. Do not delete existing cases merely because outcomes match.

## Feedback and process budgets

Proposed engineering targets, not achieved performance or contractual timeouts: ordinary focused feedback under 60 seconds; a targeted native smoke under 3 minutes. Record the unchanged fixture's before/after phase times and environment. If targets are missed, report the dominant phase; do not weaken checks to meet a stopwatch.

One expensive run at a time initially; choose bounded parallelism only after measuring CPU/memory contention. Batch independent assertions within isolated fixtures where safe, never share mutated generated modules or live evidence between tests. Poll only live handles; do not rerun a completed suite because a status question arrived.

Every substantive work update should name the user-visible capability advanced, closed checklist item, elapsed test cost, and next bounded step. Keep one compact current frontier with links to immutable historical evidence; do not rewrite historical receipts or duplicate hundreds of hashes into prose. This plan does not authorize changing existing evidence schemas.

## Remaining product path: no scope reduction

| Milestone | Existing tasks | Concrete exit |
| --- | --- | --- |
| Usable verified TypeScript CLI candidate | Finish R08, then R09 | Public entry points agree; all 13 metatypes compose; safe output, imports, tamper rejection and hostile cases pass. |
| Full native profile coverage | R10 Python and R11 Rust, then R12 | 13 metatypes per language, 39 supported cells with native behavior and language-specific negatives. R10/R11 are independent after R09; delegation requires a separately bounded approved fan-out. |
| Complete domain assurance | R13–R14 | Three-language commerce corpus, 17 applicable backend relationship signatures, non-collapse, orthogonality and semantic mutants. Reuse exact existing evidence rather than rebuilding a parallel assurance framework. |
| Installable end product | R15–R18 | Compatibility, reproducible package, clean outside-checkout installation, tested documentation and installed corpus, exact candidate review pack. |

The first milestone is not the full release. Python/Rust, packaging and installed acceptance remain promised work. No honest final ETA follows from the existing logs: re-estimate after R08 timing and the exact remaining profile gaps are known. Packaging/corpus design can prepare independently where the existing plan permits; final gates retain their dependencies. AlchLang, new SFOL/EVF design, deployment, publication and default cutover remain outside this continuation.

## Starting R08 acceptance checklist

These are existing requirements from `workflow-public-evidence-contract.json:173`, not new scope. The table locates recorded evidence; it does not requalify historical runs against changed inputs or certify every hostile subcase from a test title.

| Requirement | Recorded starting evidence | Remaining action |
| --- | --- | --- |
| WPE-T01: scalar source and full semantic commitments | `coverage-native.tap`, scalar source and dual-native tests pass | Reuse if exact relevant inputs remain current; rerun only affected behavior. |
| WPE-T02: complete compound, both layouts | `public-join.tap`, both layouts pass with 12,460 cases | Keep as baseline; qualify affected paths after the change set. |
| WPE-T03: changed Rule does not hide other unmet obligations | `public-join.tap`, independent-obligation cases pass | Preserve exact changed-source expectations. |
| WPE-T04: mixed ready/unavailable roots and audit paths | `coverage-native.tap` source checks and `coverage-mixed-repair.tap` | Accounting is demonstrated; repair still retains the independent Operation failure. Qualify against the selected capacity behavior. |
| WPE-T05: cloned/serialized/foreign/omitted/mismatched identities | Binding rejection cases in `public-join.tap` | Map every specified hostile variant to its exact assertion; test only actual gaps. |
| WPE-T06: native mismatch, batch omission/order, audit/observation substitution | Native-mismatch case in `public-join.tap`; predecessor retained-execution evidence | Confirm exact dependency and batch/audit coverage; do not infer complete coverage from one mismatch case. |
| WPE-T07: late source/native/retained/tool/declaration/cleanup drift | Several late-change and cleanup cases in `public-join.tap` | Audit the remaining tool/declaration and cross-boundary variants against exact assertions. |
| WPE-T08: no Workflow and zero edges | Two zero/no-Workflow cases in `public-join.tap` | Preserve explicit inapplicability and complete denominators. |
| WPE-T09: predecessor limits/source and installed contract access | `foundation.tap` and recorded materializer/capsule checks in `CLI-COMPLETION.md` | Map all required assertions and requalify only affected contract/materializer paths. |
| WPE-T10: affected public APIs, source/snapshot and actual CLI | Predecessor 153-test qualification, explicitly not current-lane completion | Identify the current affected set and finish fresh required caller qualification; do not reset unchanged qualified work without cause. |

A new task must name the existing acceptance obligation and the observed gap it closes. Improvements without a required uncovered obligation are deferred, not automatically another R08 successor. This rule never suppresses a discovered correctness or safety defect.

## Review and optimizer trace

Budget: one proposal track, at most two reduction rounds (initial three-layer split; review-driven simplification), one independent Balancer review. No tournament or further discovery loop.

Layer split: delivery capability -> coverage-preserving verification loop -> preparation, execution/transport, evidence aggregation. Closure: exact bound source and cases become checked observations consumed by the existing public verifier. No hidden coverage waiver. Evolution pressure is concrete growth in model roots and nested types; the extension boundary is bounded per-family execution, not a new distributed verifier.

Techniques: abstraction-level guard and recomposition pass at draft; evolution profile preserves bounded growth; cognitive-load check limits this to one plan; requisite-variety check retains required hostile/identity coverage; concept-versus-knowledge check labels measured versus inferred costs; premortem identifies stale cache/coverage loss and endless optimization as primary risks, guarded by invalidation tests and E4 deferral; frame expires if selected input/authority/resource contracts change or profiling identifies another dominant cost; navigation starts at E0. Boundary-object technique skipped: no new stakeholder interface; tournament skipped: one bounded track.

Independent review completed by `/root/efficiency_plan_review`, one read-only native helper. Verdict: PASS WITH FLAGS; no safety blocker after the following reconciliations. Reviewer verified the 70-call derivation, cited TAP durations and retained failure, repeated harness compilation, distinct cloned-root identities, and unchanged R08–R18 denominator. Reviewer did not rerun the previous numerical case/byte probes or any tests.

| Balancer objection | Category | Parent reconciliation |
| --- | --- | --- |
| Unconditional four-row-success exit contradicted the unselected capacity choice; input capacity was separate. | Contract/authority mismatch | Accepted: E2 now has explicit conditional exits, preserves the input bound and leaves the choice unselected. |
| E1 could become several caching and benchmarking projects before finishing the known blocker. | Overbuilding/critical-path cost | Accepted: E1 is an optional menu, capped at two experiments with E3; generalized caching deferred. |
| Cache reuse could bypass per-invocation expansion and interning limits. | Hidden semantic coupling | Accepted: logical capacity accounting remains per invocation and must match original outcomes even when computation is shared. |

Two finite proposal rounds completed: initial split, then review-driven simplification. Final planning verdict: PASS WITH FLAGS (phase savings remain unmeasured; capacity behavior awaits selection). No stable reviewer disagreement remains. Next implementation starts with the compact E0 checklist/timing pass, then the smallest justified change; E4 is deferred. This artifact is a reviewed plan, not implemented optimization, fresh native proof, goal completion or product approval.
