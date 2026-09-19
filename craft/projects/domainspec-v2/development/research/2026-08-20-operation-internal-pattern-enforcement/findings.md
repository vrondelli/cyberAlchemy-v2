# Findings: Operation-internal pattern enforcement

## 1. Status, authority ceiling, and reading rule

This is the evidence-closed writer finding for run
dsv2op-20260820T131937Z. It is research and paper-executable design only.
No analyzer, compiler, fixture, mutant, runtime observer, cost experiment,
profile selection, semantic admission, suppression approval, promotion,
release, or production operation was performed.

Only PO-01 and PO-02 below are current portable DomainSpec semantics.
Everything executable described here remains candidate evidence with
authority_effect none. Static diagnostics, exact fixtures, runtime
observations, receipts, and authority decisions are different surfaces and
must not be collapsed.

The correction overlay is authoritative wherever it conflicts with the base
synthesis. In particular:

- PC-01 becomes SD-01 and PC-04 becomes SD-02.
- PC-03 becomes CW-01.
- PC-02, PC-05, and PC-06 become TV-01, TV-02, and TV-03.
- PL-02 is split into PL-02A and PL-02B.
- PL-06 is split into PL-06A, PL-06B, PL-06C, and PL-06D.
- Former KF-13 is SA-01, a superseded authority claim, not folklore.

## 2. Frozen execution and evidence binding

| Artifact role | Exact path or identifier | SHA-256 | Binding |
| --- | --- | --- | --- |
| Frozen strategy sheet | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/dispatch-sheet.json; id 2026-08-20-domainspec-v2-operation-internal-pattern-enforcement | 7eee15878a359afccc99540d3b4f9641a5f23d58703c685067c3a9c20dabacb1 | Frozen research objective, scope, and acceptance sheet |
| Approved executable route | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/DISPATCH-ROUTE.json; id 2026-08-20-domainspec-v2-operation-internal-pattern-enforcement-route | ade03d21d24cd428b77b4215dc19eb8292a35c5aa0f90c623cbde6c66e0efe7a | Validated executable projection of the frozen strategy sheet |
| Explorer returns | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/research.md | 3aaab99ed2e8d3f77abceba6d506b221ed7bf92a27bd97cd80464a8fa0550811 | Verbatim local, semantic, and language-tooling explorer evidence |
| Base synthesis | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/synthesis.json | 9d51bad6508bfc81b0818a4f97dd83fa4993b607b717caed3947581383ae0aed | Base synthesis; read through the correction overlay |
| Authoritative correction overlay | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/synthesis-correction-1.json | d6c90e0da02cf2c50c15d6ca7bc7a256f75b6f3cf15d2e0b954cc5ad72832c06 | Concept-level replacement of conflicting taxonomy and authority fields |
| Precedent review | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/reviews/precedent.json | 5f86ceba09ae0c7bef4d4c74cc91b26155cd7142ca06ddf3197faaddff8f58dd | PASS with writer constraints |
| Non-vacuity review | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/reviews/non-vacuity.json | 870bfa7b06585157e0ac24d0783715259632c3605a7c46bb6cfe0f7be3f18f6b | PASS with mandatory writer repairs and paper fixtures |
| Initial non-collapse review | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/reviews/non-collapse-initial.json | a59bf33c40af5fa0d506eba41a79b748c05cf2cbf8f2e3e41a2a710c536c458a | Initial revision-required taxonomy review |
| Final non-collapse recheck | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/reviews/non-collapse-recheck.json | c89c754e86cfb68acc24bb53d5cb75fc9a22c3218c65f244b2fd51afd30dc074 | Final PASS after overlay |
| Evidence closure | projects/domainspec-v2/development/research/2026-08-20-operation-internal-pattern-enforcement/receipts/evidence-closure.json | 93868f68bda260a85fd7b0c5db38c9847456a875667236fff3fcebbd03445faa | ready_for_writer; closes sources, reviews, ceilings, and unresolved residue |

The sheet id names the frozen research dispatch. The route id appends
-route because it names the validated executable projection of that same
sheet. The suffix does not create a second research objective or supersede the
sheet. The two distinct digests bind two distinct artifacts: strategy intent
and its approved executable route.

## 3. Exact-bound July baseline and this research delta

### 3.1 Accepted July artifact

The accepted baseline is:

- projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/findings.md
- acceptance selector:
  projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/reviews/audit-final.md:1-14
- accepted status: ACCEPT

The baseline is exact-bound through LP-BASE in the source index. This finding
does not restate it as new work.

### 3.2 Conclusions carried forward

The following conclusions are carried forward unchanged:

1. Portable claims bind semantic identity and observable behavior, not one
   file, export, function, import, or analyzer shape.
2. File layout, direct-leaf imports, analyzer mechanics, thresholds, and
   severities belong to a selected implementation profile unless separately
   admitted as semantics.
3. Exact source, callable, provider, observer, fixture, and receipt bindings
   should be reused. This finding creates no parallel binding or waiver
   registry.
4. Candidate executable evidence and receipts retain authority_effect none.

### 3.3 New operation-internal conclusions

This research adds only the following operation-internal result:

- PO-01 and PO-02 are located as the current portable semantic core.
- The internal-layer model below is a non-normative decomposition of
  responsibilities and observable transitions, not a new canonical source
  layout.
- Effect fidelity and semantic call budgets are named as unpromoted
  declarations, not silently treated as current authority.
- Cost claims, transformation verification, profile diagnostics, advisory
  guidance, killed folklore, and deferred experiments are separated by owner
  and proof status.
- TypeScript, Python, and Rust enforcement is projected as bounded,
  profile-local work with explicit unsupported results.

## 4. Executive verdict and authority taxonomy

| ID | Proposition | Class | Verdict and owner | Exact binding |
| --- | --- | --- | --- | --- |
| PO-01 | Operation denotes state-changing behavior; Query denotes read-only behavior. An Operation may read while orchestrating its state change. | Current portable semantic invariant | KEEP; semantic authority owner | LP-01 |
| PO-02 | Where Rule enforces Operation, Rule is a boolean gate checked before guarded mutation. | Current portable semantic invariant | KEEP; semantic authority owner. Cross-language fixtures remain evidence only. | LP-02, LP-04 |
| SD-01 | A Rule or decision explicitly declared pure performs no undeclared effect. | Unpromoted semantic-declaration candidate | DEFER until semantic-authority admission and promotion-authority action | AS-P1, LT-RULES |
| SD-02 | Cardinality-dependent external calls respect an explicit semantic call or roundtrip budget. | Unpromoted semantic-declaration candidate | DEFER; without admission, N+1 is a proposed profile warning | AS-P4, LT-RULES |
| CW-01 | Every cost claim identifies input measures and resource dimensions. | Declaration and claim well-formedness | KEEP as schema validation; not semantics and not implementation-cost proof | AS-P3, LP-06 |
| TV-01 | Fusion, splitting, fold/loop, eager/lazy, and sequential/parallel changes preserve the declared observable contract. | Transformation-conformance verification | KEEP as exact before/after evidence obligation | AS-P2, AS-FIXTURES |
| TV-02 | Streaming and async changes preserve consumption, memory, termination, short-circuit, cleanup, cancellation, and error timing. | Lifecycle and liveness verification | KEEP as exact protocol verification | AS-P5, LP-07 |
| TV-03 | Parallel reduction verifies identity, associativity, value domain, order, effects, numeric behavior, and failure selection. | Parallel-transformation verification | KEEP as bounded witnesses; not a general algebraic proof | AS-P6, AS-FIXTURES |
| SA-01 | Legacy first-match derivation and reversed enforces direction represent current authority. | Superseded authority claim | SUPERSEDED and unsafe as authority | LP-10 |

Authority roles are non-interchangeable:

- The semantic-authority owner may admit or revise semantic declarations.
- The selected-profile owner may select architecture, threshold, severity, and
  exclusion policy.
- The implementation-binding owner maintains exact mappings without gaining
  semantic authority.
- The analyzer-config owner pins tool versions, compatibility, formats, and
  mechanics.
- The suppression approver may change one diagnostic disposition but cannot
  waive canonical semantics.
- The promotion authority promotes accepted candidates.
- The guidance maintainer owns non-binding advice.
- Evidence producers and the run recorder produce evidence and receipts; they
  cannot admit, select, suppress, or promote.

## 5. Evidence surfaces and proof statuses

| Surface or status | Maximum claim | Explicit non-claim |
| --- | --- | --- |
| source-shape | Syntax or formatter observation | No semantic, cost, allocation, or readability proof |
| profile-static | Conformance of one pinned, supported source snapshot to an exact selected-profile mapping | No runtime or portable-semantic proof |
| fixture-exact | Compilation and positive/negative behavior for exact bindings and fixture inputs | No universal behavior |
| runtime-effect-observation | Exact observed effect trace for named inputs and observers | No unobserved or arbitrary effect proof |
| runtime-measured | Operational property within named sizes, environment, and counters | No asymptotic proof outside the measured envelope |
| declaration-validation | The declaration has required names, dimensions, bounds, and policies | No proof that implementation satisfies it |
| unsupported-boundary | Analysis cannot establish the claim | Must never be normalized to pass |
| advisory | Review guidance with rationale and optional measurement | No conformance verdict |
| receipt | Reproducible identity, command, status, inputs, outputs, and digests | No admission, waiver, selection, promotion, or truth beyond recorded evidence |
| authority | Explicit action by the correctly scoped authority | Orthogonal to execution evidence |

Static diagnostics, exact fixtures, measured observations, receipts, and
authority decisions must be stored and reported separately. A later layer may
refer to an earlier artifact by digest, but it may not reinterpret its proof
status.

## 6. Operation internal-layer model

This is a research decomposition. It organizes responsibilities and
transitions; it does not mandate files, functions, classes, modules, or a
second layer registry.

| Layer | Responsibility | Permitted dependency | Effect transition or observation | Rule class |
| --- | --- | --- | --- | --- |
| Semantic declaration | Bind exact Operation, Query, Rule, state subject, and any admitted effect or cost declarations. | Canonical semantic identities and existing exact-binding surface | Declares the dimensions later evidence may observe; performs no implementation effect | PO-01 and PO-02 semantic; SD-01 and SD-02 deferred; CW-01 well-formedness |
| Declared acquisition | Acquire values or declared capabilities needed by the behavior. Operations may read; Queries may read without state change. | Declared Query, repository, provider, or port according to a selected profile | Adds declared read or external-call observations; Query must not add state change under PO-01 | PO-01 semantic; PL-01 profile-local; database-free Operation rule KF-07 killed |
| Decision and guard | Supply values or admitted capabilities to Rule and establish its boolean verdict. | Plain values or explicitly declared capabilities; concrete import shape is profile policy | Rule verdict must occur before guarded mutation; Rule purity is not current authority | PO-02 semantic; SD-01 deferred; PL-02A mapping; PL-02B profile-local |
| Guard branch | Select the false or true continuation from the Rule verdict. | The bound Rule result and Operation continuation | False branch reaches completion with no guarded state change; true branch permits the declared state-change phase | PO-02 semantic; exact ordering fixture verification |
| State change and external effects | Perform the Operation state change and any declared events or external effects. | True guard when PO-02 applies; exact providers and observers | Records effect identity, count, and checkpoint order | Operation state change semantic under PO-01; detailed effect and order declarations DE-01 deferred |
| Completion and lifecycle | Produce result or error and close continuations, iterators, streams, resources, cancellation, and finalization. | Results of earlier phases and declared lifecycle protocol | Observes result, termination, error identity, consumption, cleanup, cancellation, and quiescence | TV-02 verification; arbitrary protocols DE-03 deferred; automatic fusion KF-12 killed |
| Cost and traversal evidence | Bind input measures, resource dimensions, counters, and tested range without changing behavior. | Existing observer, fixture, and receipt surfaces | Records visits, passes, calls, payload, allocation, space, buffering, concurrency, and time where declared | CW-01 well-formedness; SD-02 deferred; PL-03 and PL-04 profile-local; AH-04 through AH-07 advisory |

### 6.1 Dependency and transition rules

| Rule | Class | Disposition |
| --- | --- | --- |
| An Operation may read or query while producing its state change. | semantic, PO-01 | Required; a universal database-free Operation ban is killed. |
| A Query performs no state change. | semantic, PO-01 | Required; exact Query-write mutant must fail. |
| A Rule enforcing an Operation gates guarded mutation. | semantic, PO-02 | Required; false-Rule-with-write, missing-Rule, and write-before-Rule mutants must fail. |
| A Rule may not invoke database, network, clock, randomness, mutation, or external-effect capabilities. | deferred SD-01; profile-local approximation before admission | Becomes semantic only after an owned effect declaration and exact mapping. Otherwise warn or return unsupported. |
| Operation, Query, and Rule use ports and do not import concrete adapters. | profile-local PL-01 | May be selected for a language/project architecture; not portable Operation semantics. |
| Operation calls a direct Rule leaf instead of a public index. | profile-local PL-02B | Deferred until selected-profile owner resolves the existing public-index conflict. |
| One pass, reduce, shallow nesting, no mutation, and no early return are universally better. | killed KF-01 through KF-06, KF-09 through KF-12 | No portable gate or semantic autofix. |
| Two passes, explicit loops, or local mutation may be used when they preserve the declared contract and improve proof or clarity. | advisory AH-03, AH-06 | Review guidance only; deviation is not non-conformance. |

## 7. Typed effect model for database, query, and business-rule separation

The following notation is a paper model, not admitted DomainSpec syntax:

    Effect =
      StateRead(subject)
      | StateChange(subject)
      | DatabaseRead(provider)
      | DatabaseWrite(provider)
      | Network(endpoint)
      | Clock
      | Randomness
      | Emit(event)
      | External(name)

    Callable<Input, Output, DeclaredEffects>
    Rule<Input> = Callable<Input, Boolean, RuleEffects>
    Query<Input, Output> = Callable<Input, Output, QueryEffects>
    Operation<Input, Output> = Callable<Input, Output, OperationEffects>
    CallBudget<EffectKind, InputMeasure, Bound>

Only two projections of this notation are current:

- PO-01 requires StateChange to be absent from Query behavior and present in
  Operation behavior at the semantic level. It does not classify every
  database, network, clock, randomness, or local-mutation event. Present names
  the Operation category's state-change responsibility; it does not claim
  that a false-gated invocation mutates.
- PO-02 requires a bound Rule verdict before the guarded StateChange.

For a Rule explicitly declared pure, RuleEffects equals the empty effect set
only if SD-01 is admitted by a semantic authority owner. CallBudget becomes
semantic only if SD-02 is admitted with a named input measure and bound. Until
then, the following separation is a profile and evidence design:

1. The effectful shell acquires data through a selected Query, repository,
   provider, or port binding.
2. It supplies plain values, or explicitly admitted capabilities, to the Rule.
3. The Rule returns a boolean decision.
4. The Operation branches on that decision before state change.
5. The shell performs declared state change and external effects through exact
   providers while observers record the trace.

A direct Rule-to-database call can therefore have three honest outcomes:

- semantic violation only after SD-01 and its exact capability map are
  admitted;
- profile violation or warning under selected PL-01/PL-02B policy, using
  PL-02A exact binding maps;
- unsupported when the call graph or effect target cannot be resolved.

An Operation querying a database is not intrinsically invalid. Active Record,
Data Mapper, Repository, and Service Layer designs allocate responsibilities
differently. The portable candidate is declared-effect fidelity, not one
architecture style or import ban. See AS-DIRECT.

## 8. Complexity, traversal, and cost contract

### 8.1 Required declaration shape

CW-01 requires a cost claim to declare all applicable fields:

| Field | Required content |
| --- | --- |
| Input measures | Named measures such as n = orders, m = line items, q = selected entities, stream length, or maximum inner-bucket size; include domain and relationships between measures |
| Resource dimensions | Work or visits, passes, external calls and roundtrips, transferred payload, total allocation, peak space, buffering, maximum concurrency, and elapsed time when measured |
| Bound | Asymptotic expression or numeric budget tied to named measures and dimensions |
| Protocol dimensions | Eager, lazy, one-shot, streaming, infinite, synchronous, or asynchronous behavior |
| Observable semantics | Result, termination, errors, effect identity/order/count, evaluation order, short-circuit point, input consumption, cleanup, cancellation, and numeric mode |
| Evidence mode | Derivation and assumptions for asymptotic claims; named sizes, environment, counters, and tested range for measured claims |

A declaration saying efficient, linear, or O(n) without defining n and the
resource dimension is malformed. A valid declaration is still not proof that
an implementation satisfies it.

### 8.2 Full traversal contract

| Concern | Required treatment | Proof boundary |
| --- | --- | --- |
| Asymptotic versus measured evidence | Keep symbolic derivation and empirical observations distinct. Bind assumptions for the former and sizes/environment for the latter. | Measurements do not prove asymptotics; a loop count does neither. |
| Nesting | Name the cardinality of every loop domain and whether inner work is disjoint, bounded, indexed, sparse, or repeated. | Nested syntax may total n; one visible loop may hide n squared work. |
| Passes | Record pass count and visits. Two fixed passes are 2n and remain O(n). | Fewer passes is not automatically lower peak space, safer, clearer, or equivalent. |
| N+1 | Record exact provider identity, per-input call count, payload, and any admitted CallBudget. | Without SD-02, query-in-loop is a PL-04 warning; caches, batches, bounds, helpers, and lazy ORM calls create false positives or misses. |
| Allocation and space | Record total allocation, intermediate materialization, peak live space, buffering, and ownership/lifetime where observable. | Matching results or iterator vocabulary does not establish allocation equivalence. |
| Lazy and streaming behavior | Record when input is acquired, items consumed, buffers filled, source closed, and backpressure applied. | Eager collection may change memory, termination, partial consumption, or effects. |
| Async behavior | Record await order, maximum concurrency, cancellation, cleanup, finalization, and first-error policy. | Launch-all and sequential-await forms are not interchangeable from syntax. |
| Ordering | Record input order, callback/effect order, output order, and any permitted nondeterminism. | Fusion, splitting, or parallelism may reorder observations. |
| Exceptions and errors | Record error identity, selection, timing, pre-error effect prefix, remaining-input state, and cleanup. | Equal happy-path output does not prove error equivalence. |
| Effects | Record provider, effect identity, count, checkpoint order, and declared capability. | Static call detection is incomplete for callbacks, dynamic dispatch, reflection, FFI, generated code, and indirect effects. |
| Early exit | Record stopping index, callback count, returned witness, unconsumed suffix, and cleanup. | Ordinary reduce or fold commonly consumes beyond the required match. |
| Parallel reduction | Bind identity, value domain, associativity witnesses, numeric/overflow tolerance, ordering, effects, and failure selection. | Bounded witnesses do not prove laws over an arbitrary domain. |

Cyclomatic complexity, cognitive complexity, nesting depth, literal traversal
count, and iterator-chain length remain source-shape proxies. They may support
PL-03 warnings under a selected profile. They do not prove correctness,
readability, asymptotic work, allocation, roundtrips, or runtime effects.

## 9. Reduce, fold, and loop decision table

There is no universal preference.

| Situation | Fold/reduce | Explicit loop or multiple passes | Required evidence |
| --- | --- | --- | --- |
| Small pure total aggregate | Reasonable with explicit identity; not mandatory | Equally valid when direct | Result, visits, identity, numeric order, allocation, and no hidden effects |
| Fusion of compatible pure traversals | Tuple fold may reduce visits | Separate passes may improve separation and proof | Exact result/order/error/effect equivalence plus measured work, allocation, and readability evidence |
| Hidden state or mutation | Reject as pure when reducer mutates captured/shared state | Exposes mutation more directly | Resolved or observed effect trace; local unaliased mutation is not intrinsically invalid |
| Short-circuit search | Ordinary full fold usually wrong; use a fallible short-circuit fold where semantics match | find, any, or explicit break/return is often direct | Stop index, callback count, poison suffix not consumed, cleanup |
| Order and errors | Accept only when effect and error trace is preserved | Prefer the clearer control flow | Evaluation order, error identity, pre-error effects, remaining input |
| Allocation | Eager array chains may allocate; lazy iterator folds may not | Loops may avoid intermediate collections | Total allocation, peak space, buffering, callback timing |
| Numerical stability | Reassociation may change floating-point results or overflow | Sequential order may be required | Numeric mode, tolerance, overflow policy, exact or bounded result |
| Parallel laws | Valid only with identity and associativity over the actual domain plus explicit policies | Sequential loop remains the reference when order matters | Reordered witnesses, effects, failure selection, identity, associativity, runtime |
| Two-pass global dependency | Fusion may be incorrect or obscure the dependency | Keep two passes when pass two needs a pass-one aggregate | Output/order, work 2n, space, and rationale |
| Readability | No intrinsic advantage; nested accumulator state can obscure intent | Explicit control flow may be clearer | Review evidence or measured comprehension evidence; no linter score is proof |
| Lazy, streaming, or async input | No automatic conversion | Preserve protocol-specific control flow unless exact conformance is shown | Consumption, liveness, backpressure, cancellation, cleanup, concurrency, errors |

## 10. Complete proposed profile-policy register

No profile was selected. Every row below remains proposed or
configuration-owned and has authority_effect none.

| ID | Proposition | Class and verdict | Enforcement mechanism | Owner | Proof status | False-positive or soundness boundary | Exact source binding |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL-01 | ORM, repository, adapter, and module import boundaries | proposed profile policy; DEFER until selected | import-graph rule plus exact module/API map | selected-profile owner; mappings by implementation-binding owner | profile-static | Architecture styles differ; DI, aliases, dynamic imports, generated clients, and runtime calls escape import shape. | LP-03, LT-TOOLS, AS-DIRECT |
| PL-02A | Resolved implementation binding maps | configuration and evidence binding; KEEP through existing surface | exact semantic subject, source, callable, provider, observer, profile, and digests | implementation-binding owner | binding integrity only | Missing, ambiguous, stale, indirect, or dynamic bindings must be unsupported, not semantic pass. | LP-04, LP-08, LT-RULES |
| PL-02B | Direct-Rule-leaf dependency policy | proposed architecture policy; DEFER | resolved import/callee rule under selected profile | selected-profile owner | profile-static | Conflicts with public-index-only convention; higher-order calls, decorators, macros, reflection, and dispatch can evade it. | LP-08, LT-RULES |
| PL-03 | Complexity, nesting, traversal, and iterator-chain thresholds | proposed advisory threshold; KEEP profile-only | pinned linter metrics and source-shape counters | selected-profile owner; analyzer-config owner pins tools | source-shape or profile-static warning | Bounded/disjoint nesting causes false positives; hidden helpers, calls, and data structures cause false negatives; metric proves no cost or readability. | AS-PROFILE, LP-06, LT-RULES |
| PL-04 | Query-in-loop and N+1 warnings without a semantic budget | proposed warning; KEEP profile-only | resolved call-in-traversal check plus optional runtime query counter | selected-profile owner; semantic-authority owner required for SD-02 | profile-static warning; runtime-measured | Cached, batched, conditional, or bounded calls may be valid; helper-mediated and ORM-generated calls may be missed. | AS-P4, LP-06, LT-RULES |
| PL-05 | Mutation, accumulator, reduce/loop, and early-return style | language-profile style only; no portable gate | style lint or review guidance | selected-profile owner or guidance maintainer | source-shape/advisory | Equivalent forms differ in short-circuit, allocation, errors, effects, and clarity; autofix is unsafe. | LP-05, AS-PROFILE, LT-RULES |
| PL-06A | Toolchain pins, compatibility, executable identities, and output formats | configuration-owned after profile selection | compatibility preflight; tool/version/config/executable digests | analyzer-config owner | reproducibility metadata | Supported version ranges drift; compiler-private APIs and format changes can invalidate results. | LT-TOOLS, LT-TS, LT-PY, LT-RS |
| PL-06B | Diagnostic severity | proposed profile policy | selected error/warning/off mapping by diagnostic class | selected-profile owner | profile disposition | Uncertain rules treated as errors inflate false positives; severity never changes semantics. | LT-SUPPRESS |
| PL-06C | Generated, vendor, and fixture exclusion policy | proposed profile policy | exact reason-bearing globs and unsupported/excluded results | selected-profile owner | profile metadata validation | Broad exclusions hide owned code; unanalyzed bytes must not silently pass. | LT-SUPPRESS, LT-FIXTURES |
| PL-06D | Suppression syntax, metadata, expiry, and unused checks | proposed mechanism; DEFER pending selection and approval workflow | exact rule/span suppression with reason, approver, lifecycle, and stale/unused validation | selected-profile owner plus suppression approver | profile metadata validation | Suppression changes disposition only; blanket, stale, expired, malformed, or unused suppressions are invalid. | LP-09, LT-SUPPRESS |

## 11. Complete advisory register

Advisories guide review and experiments. They intentionally create no semantic
pass/fail verdict.

| ID | Proposition | Class and verdict | Enforcement mechanism | Owner | Proof status | False-positive or soundness boundary | Exact source binding |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AH-01 | Prefer a named aggregate or fold for a small, pure, total accumulation with explicit initial value and no early-exit need. | advisory; KEEP | review prompt and optional exact fixture | guidance maintainer | advisory plus fixture-exact if run | Purity, totality, identity, numeric behavior, and no early exit must be shown; fold is not mandatory. | AS-ADVICE, LP-05 |
| AH-02 | Use any, all, find, or a fallible short-circuit fold when stopping semantics match. | advisory; KEEP | review prompt plus poison-suffix fixture | guidance maintainer | advisory/fixture-exact | APIs differ across languages; cleanup and error semantics may still differ. | AS-ADVICE, AS-FIXTURES |
| AH-03 | Prefer an explicit loop when cleanup, multiple state variables, early exit, effects, or error flow is clearer. | advisory; KEEP | human review plus behavior fixture | guidance maintainer | advisory | Readability is contextual; a well-typed fold may be equally clear. | AS-ADVICE, LT-RULES |
| AH-04 | Consider fusion only for compatible pure traversals after measuring work/allocation and preserving order/failure. | advisory; KEEP | exact before/after fixture and measurement | guidance maintainer | fixture-exact/runtime-measured | Source adjacency does not prove compatibility; fusion can change errors, allocation, short-circuit, and effects. | AS-P2, AS-ADVICE |
| AH-05 | Batch or hoist remote access when roundtrips grow with input cardinality. | advisory; KEEP | runtime query/payload observation | guidance maintainer | runtime-measured | Conditional access, consistency, payload size, caching, or join explosion may justify separate calls. | AS-P4, AS-ADVICE |
| AH-06 | Keep two passes when pass two depends on a global first-pass value or when separation improves proof, readability, or memory behavior. | advisory; KEEP | exact two-pass/fused comparison | guidance maintainer | fixture-exact/runtime-measured | Two passes may still be costly for one-shot or remote inputs; 2n being O(n) is not a universal preference. | AS-ADVICE, AS-FIXTURES |
| AH-07 | Measure before parallelizing or changing allocation strategy. | advisory; KEEP | benchmark/observer plan under named environment | guidance maintainer | runtime-measured if executed | Measurements are envelope-specific; algebraic, error, effect, and numeric policies still require declaration. | AS-ADVICE, AS-P6 |

## 12. Complete killed-folklore register

Killed means rejected as a universal portable rule. A selected language/project
profile may independently choose narrower style guidance, but it cannot present
the killed proposition as DomainSpec semantics.

| ID | Proposition | Class and verdict | Enforcement mechanism | Owner | Proof status | False-positive or soundness boundary | Exact source binding |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KF-01 | Prefer reduce or fold over multiple loops. | universal folklore; KILL | no portable gate/autofix; retain counterexample fixtures | no semantic owner | killed by semantic counterexamples | Folds may hide effects, block exit, alter errors, allocate, or reduce readability; loops may be correct. | LP-05, AS-KILLS, LT-RULES |
| KF-02 | One pass is always algorithmically better than two. | universal folklore; KILL | no portable gate; compare exact cost contract | no semantic owner | killed by two-pass witness | Two fixed passes remain O(n); pass two may require a global first-pass value. | AS-KILLS, AS-FIXTURES |
| KF-03 | Nested loops necessarily imply quadratic cost. | universal folklore; KILL | no correctness gate; at most PL-03 warning | no semantic owner | killed by disjoint/bounded counterexample | Disjoint buckets may total n; a single loop may hide repeated linear search or N+1. | AS-KILLS, LT-RULES, AS-FIXTURES |
| KF-04 | Reduce is intrinsically pure or short-circuiting. | universal folklore; KILL | no semantic gate; observe effects and consumption | no semantic owner | killed by mutation and poison-suffix witnesses | Reducer callbacks may mutate; ordinary folds usually consume the traversal. | AS-KILLS, AS-FIXTURES |
| KF-05 | Map/filter/reduce chains have equivalent allocation and evaluation behavior across languages. | universal folklore; KILL | no cross-language source-form verdict | no semantic owner | killed by eager/lazy witnesses | JavaScript arrays, Python generators, and Rust iterators differ in eagerness, allocation, and callback timing. | AS-KILLS, AS-FIXTURES |
| KF-06 | Lower cyclomatic or cognitive complexity proves correctness, runtime cost, or readability. | universal folklore; KILL | metrics may only produce PL-03 profile warnings | no semantic owner | killed by metric claim boundary | Metrics observe control-flow shape; empirical readability evidence is mixed and no runtime proof follows. | AS-PROFILE, AS-KILLS, LT-RULES |
| KF-07 | Database access inside every Operation is invalid. | universal folklore; KILL | no portable import/effect ban | no semantic owner | contradicted by PO-01 and architecture diversity | Operations may read; architecture styles differ; only an admitted effect/dependency declaration could narrow access. | LP-01, LP-03, AS-DIRECT |
| KF-08 | Parallel reduction preserves sequential ordering, failure, effects, and numeric results. | universal folklore; KILL | require TV-03 bounded law evidence instead | no semantic owner | killed by non-associative/order witnesses | Reduction order and failure selection may vary; floating-point and effects are order-sensitive. | AS-P6, AS-KILLS |
| KF-09 | Mutation is intrinsically invalid. | universal folklore; KILL | classify declared observable effects instead | no semantic owner | killed by valid Operation and local-mutation cases | Operation state change is expected; unaliased local mutation can be clear and allocation-efficient. | LP-07, AS-KILLS |
| KF-10 | Fold is intrinsically more readable. | universal folklore; KILL | readability remains contextual advisory evidence | no semantic owner | killed by primary-source counterevidence | Accumulator state and control flow may be less clear than an explicit loop. | AS-P2, AS-KILLS, AS-ADVICE |
| KF-11 | Early returns should be universally forbidden. | universal folklore; KILL | no portable gate/autofix | no semantic owner | killed by short-circuit witness | Early return may be the required stopping, error, or cleanup behavior. | LT-RULES, AS-FIXTURES |
| KF-12 | Async or streaming loops may be fused automatically from syntax. | universal folklore; KILL | require TV-02 protocol verification; no semantic autofix | no semantic owner | killed by lifecycle counterexamples | Fusion may change backpressure, lifetime, cancellation, partial consumption, await order, and errors. | AS-P5, LT-RULES, AS-FIXTURES |

## 13. Complete deferred-decision and experiment register

| ID | Proposition | Class and verdict | Enforcement mechanism | Owner | Proof status | False-positive or soundness boundary | Exact source binding |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DE-01 | Admit Rule purity, Query effect-freedom beyond state_change=no, and detailed Operation effect/order declarations. | authority decision; DEFER | semantic proposal and exact observer/binding review | semantic-authority owner plus promotion authority | authority missing | Existing observers show exact cases only and cannot create effect semantics. | LP-02, LP-04, AS-RESIDUE |
| DE-02 | Measure complexity, nesting, traversal, allocation, and N+1 behavior across three languages. | bounded experiment; DEFER | pinned fixture/mutant/scaling harness | experiment protocol; selected-profile owner decides adoption | experiment not executed | Tool metrics, thresholds, false positives, runtime, CI, and IDE costs remain unknown. | LP-06, LT-RESIDUE |
| DE-03 | Cover arbitrary generators, streams, async iterators, dynamic source, callbacks, cancellation, and runtime ORM behavior. | experiment/support boundary; DEFER | protocol-specific fixtures and runtime observers | experiment protocol and implementation-binding owner | unsupported | Current exact TypeScript fixtures cannot generalize across protocols or dynamic behavior. | LP-07, AS-RESIDUE, LT-RESIDUE |
| DE-04 | Resolve direct-Rule-leaf imports versus public-index-only module boundaries. | profile authority decision; DEFER | compare and select one existing profile routing policy | selected-profile owner plus promotion authority | authority missing | Both conventions have precedent; selecting one by this research would create conflicting ownership. | LP-08 |
| DE-05 | Establish a v2 suppression/waiver owner and reformulated waiver inventory. | governance decision; DEFER | adapt existing diagnostic-bound mechanism, not a second registry | selected-profile owner and suppression approver | authority and inventory missing | Imported v1 entries are residue; code tags are not exact callable bindings and waivers never change semantics. | LP-09, LT-SUPPRESS |
| DE-06 | Pin analyzer versions and hashes and measure false-positive, runtime, CI, IDE, and compatibility costs. | operational experiment; DEFER | three-language compatibility and performance run | analyzer-config owner; selected-profile owner decides adoption | unmeasured | Version/API drift, compiler-private surfaces, framework gaps, and editor cost can invalidate feasibility. | LT-TOOLS, LT-RESIDUE |

## 14. Paper-executable TypeScript, Python, and Rust witnesses

The diagnostic labels below come from the accepted non-vacuity review. They
are receipt-local illustrations, not canonical DomainSpec IDs and not
implemented tooling.

| Meaning | TypeScript | Python | Rust |
| --- | --- | --- | --- |
| Query write | dsv2/query-write | DSV2Q001 | dsv2_query_write |
| Rule effect | dsv2/rule-effect | DSV2E001 | dsv2_rule_effect |
| Call budget | dsv2/call-budget | DSV2C001 | dsv2_call_budget |
| Cost risk | dsv2/cost-risk | DSV2C002 | dsv2_cost_risk |
| Invalid suppression | dsv2/suppression-invalid | DSV2S001 | dsv2_suppression_invalid |
| Unsupported | dsv2/unsupported | DSV2U001 | dsv2_unsupported |
| Exact behavior fixture | TS-BEHAVIOR | PY-BEHAVIOR | RS-BEHAVIOR |

Projected engines are typed typescript-eslint/dependency-cruiser for
TypeScript, Pylint/Astroid plus Import Linter for Python, and Dylint typed HIR
plus module/crate policy for Rust. These are proposals; no tool was run.

| ID and concern | Positive and negative witnesses | TypeScript form | Python form | Rust form | Expected diagnostic and evidence status |
| --- | --- | --- | --- | --- | --- |
| W-01 Query boundary | Positive: read-only Query. Negative: exact Query-write mutant. Operation may read before state change. | async Query and Operation over typed Repository interface | sync/async callables over Repository Protocol | functions over Repository trait | Negative gets language Query-write when statically resolved and fails exact write observation; positive is fixture-exact only. Dynamic cases are unsupported. |
| W-02 Rule/database separation and effectful shell | Positive: shell reads, passes plain values to total boolean Rule, then performs declared effects. Negative: Rule calls repository, network, clock, randomness, or mutation capability. | typed callee rule over effect interfaces | Pylint/Astroid resolution over Protocols | Dylint typed-HIR over traits/functions | Before SD-01 admission, negative is Rule-effect profile warning/violation or unsupported. After admission and exact mapping it may be semantic. Runtime trace remains separate. |
| W-03 Rule gate order | Positive: true Rule before one write; false Rule produces no write. Negative: write-before-Rule, missing Rule, or false-Rule-with-write. | ordered checkpoint fixture | ordered checkpoint fixture | ordered checkpoint fixture | TS-BEHAVIOR, PY-BEHAVIOR, or RS-BEHAVIOR fails each mutant. Proof is fixture-exact, not static call-order proof. |
| W-04 N+1 | Positive: one bounded batch serves n entities. Negative: initial read plus one repository call per entity. | typed resolved repository calls in loop | Astroid-resolved datasource call in loop | HIR-resolved trait call in loop | Call-budget diagnostic is warning without SD-02. With an admitted bound, runtime query count and payload can fail. Static and runtime evidence remain distinct. |
| W-05 Accidental quadratic nesting | Positive: disjoint buckets total n visits or indexed lookup. Negative: all-pairs, or one loop containing linear search, totals n squared. | loops/calls with visit counter | loops/calls with visit counter | iterators/loops with visit counter | Cost-risk warning only from shape. Scaling observations distinguish cases; no correctness or asymptotic verdict from syntax. |
| W-06 Justified two-pass and fused forms | Positive A: first pass computes threshold, second classifies. Positive B: separately valid tuple-accumulator fusion. Negative: universal one-pass rule rejects A. | array passes and tuple reducer | list/generator passes and tuple accumulation | iterator passes and tuple fold | Both positives may be fixture-exact; visits and allocation are runtime-measured. Universal rejection remains KF-02 killed. |
| W-07 Eager/lazy allocation | Positive: equal values/order with separately observed allocation. Negative: infer allocation equivalence from map/filter vocabulary. | eager Array map/filter | generator expression | lazy Iterator map/filter | No source diagnostic proves allocation. Record callback timing, intermediate allocation, and peak space as runtime-measured. |
| W-08 Hidden-mutation fold | Positive: total fold with explicit identity and no external trace. Negative: reducer mutates captured log/shared state/interior-mutable object. | reducer closes over mutable object | reducer mutates closure/global | fold uses interior/shared mutation analogue | Rule-effect when resolved and admitted/profile-selected; otherwise runtime-effect-observation or unsupported. A local unaliased accumulator is not automatically invalid. |
| W-09 Early exit | Positive: stop before poison suffix. Negative: ordinary fold consumes poison suffix. | find or some versus reduce | any over generator versus reduce | find, any, or try_fold versus fold | Exact behavior fixture asserts stop index, callback count, returned witness, no poison effect, and cleanup. No early-return style error. |
| W-10 Streaming and async | Positive: sequential first-match consumption finalizes source with bounded concurrency. Negative: collect/gather/launch-all/fusion changes buffering, backpressure, cancellation, cleanup, or first error. | AsyncIterable and for-await witness | async generator and async-for witness | iterator/stream analogue and concurrent futures | Lifecycle fixture plus runtime measurement; unanalyzable protocol gets language Unsupported, never pass. |
| W-11 Exception and ordering | Positive: ordered callback effects then exact error at k. Negative: rewrite reorders callbacks, changes selected error, or changes pre-failure effect prefix. | throw in callback/async path | raise in generator/fold | Err in iterator/fallible fold | Behavior fixture fails negative despite equal happy output; assert error identity, effect prefix, remaining input, and cleanup. |
| W-12 Suppression | Positive: exact diagnostic/span suppression with reason, approver, and valid lifecycle. Negative: blanket, malformed, stale, expired, or unused suppression. | rule-scoped ESLint-style evidence | diagnostic-scoped Pylint/profile evidence | lint-scoped Rust/profile evidence | Positive changes disposition only. Negative emits language Invalid-suppression. Proof is profile metadata validation, never semantics. |
| W-13 Generated code | Positive: exact exclusion binds generator and source/config digests. Negative: analyzer silently treats uninspected generated bytes as conforming. | generated TypeScript selector | generated Python selector | macro/generated Rust selector | Positive is excluded with typed reason; negative is language Unsupported. Exclusion policy must be selected and exact. |
| W-14 Unsupported dynamic construct | Positive: ordinary resolved call. Negative: dynamic import/DI callback, reflection/monkey patch, or macro/trait-object/FFI path defeats resolution. | dynamic import, alias, callback, DI | dynamic import, decorator, reflection, monkey patch | macro expansion, trait dispatch, FFI | Emit each language's Unsupported result. A missing finding is not conformance. |
| W-15 Cost declaration | Positive: defines n, work, peak space, allocation, buffering, roundtrips, and bounds. Negative: says efficient, linear, or O(n) without an input measure or resource dimension. | profile-neutral declaration consumed by TS fixture | same declaration consumed by Python fixture | same declaration consumed by Rust fixture | Negative fails declaration-validation before implementation evidence. Positive proves shape only. |
| W-16 Parallel and numeric reduction | Positive: bounded integer addition with identity zero, associativity witnesses, and explicit order/overflow/effect/failure policies. Negative: subtraction, uncontrolled floating reassociation, effectful reducer, or missing identity. | sequential and reordered/parallel-style reducer | sum versus math.fsum/order variants | sequential fold versus Rayon reduce | Policy or bounded witnesses reject negatives. Results are fixture-exact/runtime-measured; no arbitrary-domain algebraic proof. |

Every implemented witness must bind source and callable digests, selected
profile, tool/configuration, input fixture, providers, observers, command and
exit status, raw diagnostic artifact, and support status through the existing
evidence path. Mutation tools may add pressure, but killed mutants do not prove
asymptotic cost or readability.

## 15. Staged migration and adoption implications

1. **Preserve the accepted baseline.** Keep the July semantic-versus-profile
   split and current exact-binding/effect/receipt owners. Do not create a new
   registry.
2. **Inventory before enforcement.** Map semantic subjects to source,
   callable, providers, observers, repository/effect APIs, generated/vendor
   boundaries, and current baseline findings. Missing mappings become
   unsupported or unclassified, not pass.
3. **Adopt profiles default-off.** Introduce PL rules as opt-in experimental
   profiles. Begin uncertain complexity, traversal, Rule-effect, and N+1
   checks as warnings. No repository-wide default or error severity is
   selected here.
4. **Capture a baseline.** Record existing diagnostics by exact source digest
   without converting them into accepted suppressions. Separate legacy
   baseline debt, generated/vendor exclusions, and new regressions.
5. **Exercise witnesses.** Run positive, negative, mutant, unsupported,
   scaling, and lifecycle cases across all three pinned languages before
   considering adoption.
6. **Triage false positives and misses.** Classify each result as bad mapping,
   unsupported construct, expected architecture variance, threshold problem,
   framework gap, or product defect. Adjust only the profile/config owner
   surface.
7. **Govern exclusions and suppressions.** Select exact exclusion policy.
   Require proposed rule-specific suppression metadata and retain the
   underlying finding. Reformulate v1 waiver residue before any v2 use.
8. **Measure compatibility and operating cost.** Pin toolchains, executable
   identities, config/source digests, output formats, editor latency, CI time,
   runtime overhead, framework compatibility, and false-positive rates.
9. **Capture evidence by type.** Persist static diagnostics, exact fixtures,
   runtime observations, scaling data, receipts, and owner decisions as
   separately typed artifacts linked by digest.
10. **Decide authority separately.** Semantic admission, profile selection,
    suppression approval, and promotion each require their named authority.
    Experiment success does not perform any of them.

Compatibility must be tested against the pinned TypeScript/ESLint ecosystem,
Pylint/Astroid and Ruff separately, and the complete Rust/Dylint toolchain.
Compiler-private, plugin, and output-format drift can block adoption even when
a rule design is sound.

## 16. Consolidated blind-spot register

| Blind spot | Consequence | Required handling |
| --- | --- | --- |
| No analyzer, compiler, fixture, mutant, or runtime observer executed | Feasibility and verdict rates are unknown | Keep all implementation claims proposed |
| No admitted effect schema | Rule/database purity cannot be a portable error | SD-01 remains deferred; profile warning or unsupported |
| No admitted call/cost budget | N+1 cannot be a semantic failure | SD-02 remains deferred; measure and warn only |
| Aliases, callbacks, DI, lazy ORM behavior, reflection, monkey-patching, decorators, macros, trait objects, FFI, generated clients | Static effect/call detection has false negatives | Emit unsupported and add exact runtime witnesses |
| Bounded, disjoint, indexed, sparse, or helper-hidden work | Nesting/traversal diagnostics have false positives and false negatives | Treat metrics as source-shape proxies and measure |
| Generators, one-shot inputs, streams, async iterators, infinite inputs | Consumption and liveness may change | TV-02 protocol fixtures; DE-03 remains open |
| Cancellation, backpressure, concurrency, finalization, partial consumption | Equal outputs can hide lifecycle regressions | Observe exact protocol and environment |
| Floating-point order, overflow, nondeterministic parallel order, failure selection | Parallel/fused forms may differ | TV-03 declarations and bounded witnesses |
| Tool versions, compiler-private APIs, output formats, editor/CI costs | Results may drift or be operationally unusable | PL-06A pins and DE-06 experiment |
| Framework-specific ORM/query behavior | Generic rules miss actual roundtrips | Bind exact providers and runtime counters |
| Direct-Rule-leaf/public-index conflict | Two profile precedents disagree | DE-04 selected-profile owner decision |
| Imported v1 waivers and coarse code tags | Suppression evidence may be stale or inexact | DE-05 reformulation; no second waiver registry |
| Baseline and exclusion breadth | Existing debt or generated code may be silently hidden | Exact digest-bound baseline, narrow exclusions, unsupported rather than pass |
| Static clean result | May be mistaken for semantic/runtime proof | Preserve proof status and claim ceiling in every receipt |
| Architecture diversity | Active Record and Repository styles can both be legitimate | Do not turn PL-01 into portable Operation semantics |
| Binding ownership split among code tags, architecture-conformance, and legacy sidecars | Duplicate or stale mappings can conflict | Reuse current architecture-conformance owner and resolve, do not duplicate |

## 17. Exact source-binding index

The ID references used in every load-bearing row resolve as follows. Local
selectors are current-byte selectors captured by the accepted evidence.
External links are the primary sources admitted by the explorers and
reviewers; they were not refreshed by this writer.

### 17.1 Baseline and current local selectors

- **LP-BASE** —
  projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/findings.md;
  acceptance at
  projects/domainspec-v2/development/research/2026-07-30-implementation-structure-enforcement/reviews/audit-final.md:1-14;
  captured in research.md:15-22.
- **LP-01** — research.md:33-47;
  projects/domainspec-v2/definitions/meta-types/meta-types.yml:99-134;
  projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml:11-30;
  projects/domainspec-v2/impl/spec/meta-types/behavioral/query.schema.yml:10-22;
  projects/domainspec-v2/definitions/relationships/relationships.yml:228-242.
  External citation: none admitted; this is current repository authority.
- **LP-02** — research.md:48-63;
  projects/domainspec-v2/definitions/meta-types/meta-types.yml:153-170;
  projects/domainspec-v2/definitions/relationships/relationships.yml:100-114;
  projects/domainspec-v2/impl/architecture-conformance/families/outcome-function/fixtures/can-settle-payout/obligations.json:1-19;
  projects/domainspec-v2/impl/architecture-conformance/families/enforces-relation/fixtures/settlement-rule-operation/obligations.json:1-14;
  projects/domainspec-v2/impl/architecture-conformance/realizations/relation/typescript/direct-rule-operation-v1/fixtures/settle-payout.ts:1-23.
  External citation: none admitted; semantics are current repository authority
  and fixture bytes retain authority_effect none.
- **LP-03** — research.md:64-82;
  implementation/domainspec/architecture/pattern-library/concepts/backend/operation.md:3-41;
  implementation/domainspec/architecture/pattern-library/concepts/backend/query.md:3-30;
  implementation/domainspec/architecture/pattern-library/concepts/backend/rule.md:3-27;
  implementation/domainspec/architecture/pattern-library/LAYERING-REFERENCE.md:5-37;
  implementation/domainspec/architecture/pattern-library/DEPENDENCY-RULES.md:5-22;
  implementation/domainspec/backend/src/modules/knowledge-graph/application/rebuild-mirror-projection.ts:41-69,89-165;
  implementation/domainspec/backend/src/modules/knowledge-graph/application/get-latest-mirror-projection.ts:73-138.
  External architecture comparison: AS-DIRECT.
- **LP-04** — research.md:83-99;
  projects/domainspec-v2/impl/architecture-conformance/families/read-model/README.md:1-24;
  projects/domainspec-v2/impl/architecture-conformance/targets/typescript/query-v1.ts:1-36;
  projects/domainspec-v2/impl/architecture-conformance/realizations/query/typescript/read-model-v1/typescript-binding.json:1-52;
  projects/domainspec-v2/impl/architecture-conformance/kernel/evidence/effect-observation/contracts.ts:1-16,93-132;
  projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json:85-114.
  External citation: none required for the current exact-binding surface.
- **LP-05** — research.md:100-115;
  implementation/domainspec/backend/src/modules/knowledge-graph/application/get-latest-mirror-projection.ts:141-155,364-409;
  implementation/domainspec/backend/src/modules/knowledge-graph/application/rebuild-mirror-projection.ts:294-323,344-395;
  projects/domainspec-v2/impl/test-derivation-engine/src/bindings/financial-settlement.json:45-70.
  External counterevidence: AS-P2, AS-ADVICE, AS-KILLS.
- **LP-06** — research.md:116-127. The accepted evidence binds a scoped
  zero-match search across projects/domainspec-v2/definitions,
  projects/domainspec-v2/impl/architecture-conformance,
  projects/domainspec-v2/impl/spec,
  implementation/domainspec/architecture/pattern-library, and
  implementation/domainspec/templates. No active complexity, nesting,
  traversal, allocation, or N+1 budget was located. External sources:
  AS-P3, AS-P4, AS-PROFILE.
- **LP-07** — research.md:128-143;
  projects/domainspec-v2/impl/architecture-conformance/families/state-change/fixtures/complete-settlement/operation-definition.json:1-10;
  projects/domainspec-v2/impl/architecture-conformance/realizations/operation/typescript/state-event-arrow-v1/fixtures/complete-settlement.ts:1-18;
  projects/domainspec-v2/impl/architecture-conformance/families/read-model/README.md:8-19;
  projects/domainspec-v2/impl/architecture-conformance/kernel/evidence/effect-observation/contracts.ts:97-132;
  projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/fixtures/financial-settlement/descriptors.json:98-111.
  External protocol sources: AS-P5.
- **LP-08** — research.md:144-159;
  implementation/domainspec/architecture/pattern-library/LAYERING-REFERENCE.md:49-55;
  projects/domainspec-v2/development/architecture-pattern-enforcement/SPEC.md:118-145;
  projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json:1114-1129;
  projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json:1094-1109;
  projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json:1107-1122.
  External tooling sources: LT-TS, LT-PY, LT-RS.
- **LP-09** — research.md:160-175;
  projects/domainspec-v2/impl/governance/tags/CODE-TAG-WAIVERS.md:1-41;
  projects/domainspec-v2/impl/governance/tags/tools/validate-code-tags.ts:119-160,654-660;
  projects/domainspec-v2/impl/governance/tags/code-tag-waivers.yaml:1-29;
  projects/domainspec-v2/IMPORT-MANIFEST.md:34-46.
  External suppression sources: LT-SUPPRESS.
- **LP-10** — research.md:176-192;
  projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts:1-40;
  projects/domainspec-v2/impl/test-derivation-engine/src/bindings/index.ts:62-81;
  projects/domainspec-v2/impl/test-derivation-engine/src/rules/index.ts:229-245,540-555.
  External citation: none admitted; this is a repository authority-conflict
  finding.

### 17.2 Primary semantic and algorithmic sources

- **AS-DIRECT / AS-P1** — research.md:224-238;
  [Fowler, enterprise architecture pattern catalog](https://martinfowler.com/eaaCatalog/);
  [Leijen, Koka row-polymorphic effect types, abstract and sections 1-2](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/koka-effects-2013.pdf).
- **AS-P2** — research.md:240;
  [Hutton, A Tutorial on the Universality and Expressiveness of Fold, sections 2-3.2](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/CDBAA53C7120E23CBBBE206FD47FDBAA/S0956796899003500a.pdf/tutorial_on_the_universality_and_expressiveness_of_fold.pdf).
- **AS-P3** — research.md:242. Primary external citation: none admitted for
  the declaration-shape proposition; the exact accepted text defines the
  required input measures and resource dimensions.
- **AS-P4** — research.md:244;
  [EF Core efficient querying, beware of lazy loading](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying#beware-of-lazy-loading);
  [EF Core single versus split-query trade-offs](https://learn.microsoft.com/en-us/ef/core/querying/single-split-queries).
- **AS-P5** — research.md:246;
  [Python 3.14 expressions, generator expressions and asynchronous generators](https://docs.python.org/3.14/reference/expressions.html#generator-expressions).
- **AS-P6** — research.md:248;
  [Rayon 1.12 ParallelIterator reduce](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelIterator.html#method.reduce).
- **AS-PROFILE** — research.md:250-263;
  [McCabe, A Complexity Measure](https://doi.org/10.1109/TSE.1976.233837);
  [Barón, Wyrich, and Wagner, cognitive-complexity evaluation](https://arxiv.org/abs/2007.12520).
- **AS-ADVICE** — research.md:265-275;
  [Python 3.14 Functional Programming HOWTO](https://docs.python.org/3.14/howto/functional.html);
  [Rust Iterator map, fold, and try_fold](https://doc.rust-lang.org/std/iter/trait.Iterator.html).
- **AS-KILLS** — research.md:277-289;
  [ECMAScript 2023 indexed collections](https://tc39.es/ecma262/2023/multipage/indexed-collections.html);
  plus AS-P2, AS-P4, AS-P5, AS-P6, AS-PROFILE, and AS-ADVICE as cited per
  verdict row.
- **AS-FIXTURES** — research.md:291-308;
  [Python math.fsum](https://docs.python.org/3.14/library/math.html#math.fsum);
  [Rayon reduction semantics](https://docs.rs/rayon/1.12.0/rayon/iter/trait.ParallelIterator.html#method.reduce).
- **AS-RESIDUE** — research.md:310-315. Primary external citations are the
  relevant AS sources above; this entry records unresolved evidence, not a new
  proposition.

### 17.3 Primary language-tooling sources

- **LT-TOOLS / LT-TS** — research.md:341-349;
  [ESLint version support](https://eslint.org/version-support/);
  [typescript-eslint dependency versions](https://typescript-eslint.io/users/dependency-versions/);
  [typescript-eslint typed custom rules](https://typescript-eslint.io/developers/custom-rules/#typed-rules);
  [typed-lint performance](https://typescript-eslint.io/getting-started/typed-linting/#performance);
  [dependency-cruiser validation rules](https://github.com/sverweij/dependency-cruiser#validate-things).
- **LT-PY** — research.md:346;
  [Import Linter contract types](https://import-linter.readthedocs.io/en/stable/contract_types/);
  [Pylint custom checkers](https://pylint.readthedocs.io/en/stable/development_guide/how_tos/custom_checkers.html);
  [Ruff custom-rule limitation](https://docs.astral.sh/ruff/faq/#can-i-write-my-own-linter-plugins-for-ruff);
  [Ruff C901](https://docs.astral.sh/ruff/rules/complex-structure/);
  [mypy plugin stability boundary](https://mypy.readthedocs.io/en/stable/extending_mypy.html#extending-mypy-using-plugins).
- **LT-RS** — research.md:347;
  [Clippy disallowed_methods](https://rust-lang.github.io/rust-clippy/master/index.html#disallowed_methods);
  [Clippy lint passes and UI tests](https://doc.rust-lang.org/stable/clippy/development/adding_lints.html#lint-passes);
  [Dylint custom libraries](https://github.com/trailofbits/dylint#writing-lints);
  [Cargo JSON messages](https://doc.rust-lang.org/cargo/reference/external-tools.html#json-messages).
- **LT-RULES** — research.md:351-366;
  the LT-TS, LT-PY, and LT-RS primary tool sources above;
  [Clippy cognitive-complexity limitation](https://rust-lang.github.io/rust-clippy/master/index.html#cognitive_complexity).
- **LT-SUPPRESS** — research.md:368-379;
  [ESLint rule severity and suppressions](https://eslint.org/docs/latest/use/configure/rules);
  tool-native language sources in LT-PY and LT-RS.
- **LT-FIXTURES** — research.md:381-397;
  [StrykerJS TypeScript checker](https://stryker-mutator.io/docs/stryker-js/typescript-checker/);
  [mutmut](https://mutmut.readthedocs.io/en/latest/);
  [cargo-mutants](https://mutants.rs/getting-started.html).
- **LT-RESIDUE** — research.md:399-406. The exact accepted residue binds no
  tool execution or performance evidence; relevant primary tool sources are
  LT-TS, LT-PY, and LT-RS.

## 18. Final bounded conclusion

Operation-internal enforcement is defensible only as a declaration-first,
evidence-layered system:

- enforce PO-01 and PO-02 from current authority;
- keep SD-01 and SD-02 deferred until semantic admission;
- validate CW-01 declaration shape without claiming cost proof;
- verify TV-01 through TV-03 through exact witnesses;
- select PL policy explicitly and default it off until evidence supports
  adoption;
- keep AH guidance non-binding, KF folklore killed, SA-01 superseded, and
  DE-01 through DE-06 open.

This conclusion reuses current exact-binding, provider, observer, fixture, and
receipt surfaces. It creates no analyzer, registry, profile selection,
suppression approval, semantic admission, promotion, release, or production
claim.
