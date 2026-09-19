# Cross-generator verification

Status: candidate construction, R08ae. Authority effect: none.

## Value-producer interoperability (R08ae10, verified private candidate)

R08ae10 completes **named-sum and plain Enum producer interoperability**.
A separately registered private family derives expected interactions from the
checked source graph, then observes original generated providers. Named sum
payloads retain every import occurrence and owned/raw/cloned/foreign witness;
plain Enums retain runtime construction and component member-read sequences.
Source/native audits and retained artifact/tool checks cover actual Enum roots
without fabricating a record, factory or Rule.

The seventeen-file regression passes **106/106**, with no failures, skips,
cancellations or TODOs. Nine new tests cover 477 cases in each output layout,
323 cases with real record factories, and a 489-case compound project spanning
13 modules. They reject 12 surface mutants, four compiling duplicate-call/read
mutants and a same-wire Enum-definition substitution even when final outcomes
are unchanged. Captured-source, missing-observation, empty-family, retained
artifact and in-flight artifact/tool checks pass.

All **446 captured inputs stayed unchanged through the passing run**.
Of 229 predecessor CLI source files, 226 are unchanged, three private shared
verifier files are extended and two private verifier modules are added
(231 total). Strict typecheck and all four check-only materializers pass;
proof registration contains 44 unique existing test files. Generators, prior
behavioral definitions/observers, the public executor and the 70-source capsule
remain unchanged. An earlier run omitted the test harness's required Lean
environment; the full suite was rerun with the checked toolchain settings.

[Definition and navigation scaffold](cross-generator-value-producer-contract.json)
-> independent controls/observer -> audited retained executor -> current native
evidence. [Exact qualification](evidence/r08ae10-value-producer/qualification.json)
and [task context](evidence/r08ae10-value-producer/context.json).

**R08 and all R09-R18 remain incomplete.** Next is Operation producer-consumer
coverage (actual Rule, Event and owned-value provider interactions), then
Workflow boundaries and public aggregation/currentness. No product decision is
needed. No language semantics, defaults, installation, publication, release or
authority change is implied; AlchLang reconciliation stays separately deferred.

## Owned-value retained execution (R08ae9, verified private candidate)

[Execution definition](cross-generator-owned-values-execution-contract.json)
binds owned-value controls to independently source-derived factory module
surfaces, source/native AST audits and the retained private executor. Reuse the
factory surface rules without requiring a Rule-rejected witness; the two
behavior protocols keep separate registrations and exact identities. The
existing owned-value definition and observer remain unchanged.

Construction order: execution definition -> this navigation scaffold -> shared
surface/auditor and additive executor family -> native and hostile regressions.
No public aggregation, generator semantics, source-capsule registration or
authority changes. The full R08-R18 scope remains open. The fifteen-file
regression passes 94/94, with all 439 captured inputs unchanged through
validation. Source/native audit, original provider-call observations, typed
reference erasure and retained artifact/tool drift checks pass. Exact evidence:
[qualification](evidence/r08ae9-owned-values-execution/qualification.json) and
[context](evidence/r08ae9-owned-values-execution/context.json).

## Definitions and navigation scaffold

[Verification definition](cross-generator-verification-contract.json) owns this
additive verification contract. The existing
[resolved artifact definition](resolved-artifact-plan-contract.json) still owns
generation and joining. No generation semantics change here.

| Concept | Meaning | Construction owner |
| --- | --- | --- |
| Generator request | One exact selected generator invocation and its source bindings | Resolved artifact planner |
| Native module | One joined path with exact bytes, possibly emitted by several requests | Resolved artifact planner |
| Qualified owner | A source node selector, distinct from generator kind | Checked project graph |
| Static boundary | One native import occurrence with its complete importer/target ownership | Private boundary inventory |
| Root closure | All native dependencies needed for one qualified source node | Inventory checked against public node view |
| Behavior witness | An independently expected producer-consumer outcome observed through native modules | Subsequent verification construction |

The inventory preserves shared support and type-only imports. It does not turn
Policy target identifiers into Operation calls or State Machine Event references
into Event execution. Different generator kinds can share a file; common request
ownership must not suppress their boundaries.

## R08ae1 implementation boundary

`impl/cli/src/verification/reconciled-cross-generator-boundary.ts` constructs a
private immutable, process-registered inventory from the captured graph and plan.
Its digest binds all rows and counts. It rechecks static surfaces, source bindings
and leaf resolution, then compares each independently traversed root closure with
the public artifact view. This is not an independent native AST observer.

No source capsule entry or public verification pass is added. Authored composition
artifacts remain explicitly outside this resolved-generator inventory and retain
their existing separate verification.

Validation combines focused boundary tests with the existing all-type project,
instantiation, source/snapshot build, application-layout and actual CLI suites.
Those existing tests are reused rather than duplicated. Exact results belong in
[qualification evidence](evidence/r08ae-boundary/qualification.json); until that
record is written they are planned checks, not completed evidence.

## Remaining behavior construction

### Rule-to-Policy protocol (R08ae2)

[Policy interoperability definition](cross-generator-policy-contract.json) owns
the next private family. Qualified source identity supplies native bindings;
the independent Rule reference supplies expected nested calls and arguments.
The instrumented native observer retains and calls the original generated Rule
functions through original Policy code. It receives recipes, not expected
answers. Every other runtime edge stays visible as uncovered.

The trace is a behavioral witness, distinct from the R08ae1 static inventory.
Its finite comparison is still separate from public executor integration,
independent native surface auditing and final source/artifact/tool currentness.
CommonJS is only this private test lane, not a new product output default.

Implementation and native evidence are recorded in
[R08ae2 qualification](evidence/r08ae2-policy/qualification.json). A missing
qualification is unfinished construction, not an implicit passing result.

Use this complete dependency denominator to bind source-derived producer-consumer
protocols and independently expected cases. Compile and run actual generated
modules, detect native-compiling mutations and incomplete observations, and retain
exact source/artifact/tool custody through public verification. An import's
presence is not evidence of invocation or correct behavior.

### Private native custody executor (R08ae3)

[Execution definition](cross-generator-execution-contract.json) binds the next
construction step. Registered controls own expected behavior and selected module
identities; the registered plan owns captured source bytes. The private executor
owns fresh source/native artifacts, tool fingerprints and retained run custody.
The independent native parser owns observed import/export surfaces, not source
meaning. The existing instrumented observer owns actual finite native traces.

Source and CommonJS audits precede behavior. Final and retained checks reject
artifact or tool drift, unexpected files and symbolic paths. These checks do not
prove universal purity, atomic filesystem isolation or uninstrumented equivalence.
No public executor or source-capsule registration is changed. The eight-file
46/46 regression and exact source custody evidence are recorded in
[R08ae3 qualification](evidence/r08ae3-execution/qualification.json).

### Rule-to-State-Machine guard protocol (R08ae4)

[Guard interoperability definition](cross-generator-state-machine-contract.json)
owns the next private family. The checked reducer contract owns state/trigger
pairs and ordered output-intent occurrences; the source Rule interpreter owns
expected nested guard calls. The native observer retains original generated
Rule/reducer code. Event references remain symbols, not Event-module execution.

The existing private custody executor is shared through separately registered
Policy and State Machine entry points and separately pinned audit profiles.
Type-only exports, initial-state forwarding and runtime Rule bindings remain
distinct. No public capsule or generator changes are part of this step.
The nine-file 54/54 regression, both-layout native traces, independent audit,
compiling mutations and exact currentness evidence are recorded in
[R08ae4 qualification](evidence/r08ae4-state-machine/qualification.json).

### Factory-to-Rule protocol (R08ae5)

[Factory interoperability definition](cross-generator-factory-contract.json)
binds source-owned factory lifecycle inputs and selected validator occurrences
to independently predicted nested Rule calls. Actual original Rule exports are
instrumented only during the requested factory route. Input construction and
copy/foreign witness calls remain separate helper activity, not target traces.
The child receives recipes, never expected answers or helper witness expectations.

This family retains the complete static dependency denominator but selects only
factory-to-Rule and reached Rule-to-Rule edges as protocol obligations. Owned
field and Enum imports are not silently counted as behavior coverage. Independent
factory-specific native surface/custody and public integration remain follow-on
work. The final twelve-file 70/70 regression and exact factory evidence are in
[R08ae5 qualification](evidence/r08ae5-factory/qualification.json). This family
now requires every selected caller-to-Rule edge to be reached; observing its
callee through another parent does not cover it. Equivalent gaps reproduced in
the earlier Policy and State Machine profiles remain the immediate correction
before further custody/public integration work.

### Exact caller-edge coverage correction (R08ae6)

The Policy and State Machine definitions now require a witnessed call for each
provider-to-Rule and Rule-to-Rule edge, not merely a visit to each Rule selector.
Parent indices identify the exact importer. An unvisited edge retains its whole
family as incomplete even if another caller reaches the same callee. Wrapper
forwarding stays a separate source/native binding obligation. Generated domain
behavior, the private native observer and the public source capsule are unchanged.
The full twelve-file regression passes **72/72**; all **420 bound inputs** are
unchanged through validation. Strict typecheck and all four check-only
materializers pass. Both newly reproduced counterexamples reject their whole
families, positive edge counts reconcile with complete traces, and original
native behavior, surface audits, mutation rejection and retained custody pass
in both module roots. [Exact qualification](evidence/r08ae6-edges/qualification.json).

Next: independently derived factory native surfaces and retained execution
custody before public integration. No new product semantic decision is required.

Public `cross-generator-behavior` remains `not_evaluable`. R08 and the entire
R09-R18 plan remain open; inventory completion cannot close them.

### Factory native surface and execution custody (R08ae7)

The [factory execution definition](cross-generator-factory-execution-contract.json)
separates source-derived expected modules from generated surface observations.
Factory, Rule, owned Entity/Value Object, plain Enum and payload-sum dependencies
retain their own paths, exports and runtime/type-only import occurrences.
Native AST audits precede original target-call observation in the existing
retained-custody executor. Named setup and type-only closure are not claimed as
factory-to-Rule invocation coverage.

The thirteen-file regression passes **80/80**, including all eight new factory
execution tests. It rejects 13 source/native surface mutants and three additional
strict-compiling call mutants, preserves ordered extensions and structured fields,
and distinguishes reference type imports from runtime imports in emitted code.
All **427 bound inputs** stayed unchanged during validation. Strict typecheck and
all four check-only materializers pass. The source capsule and public executor
remain unchanged; public integration and remaining producer-consumer protocols
are still incomplete. [Exact qualification](evidence/r08ae7-factory-execution/qualification.json).

### Factory-to-owned-value calls (R08ae8)

The [owned-value protocol definition](cross-generator-owned-values-contract.json)
binds declared named field occurrences to original provider ownership and key
calls. Raw, cloned and foreign-provider values must not cross an owned boundary.
Argument identity, repeated fields, collection order and cached keys remain
distinct from factory-to-Rule traces. Original native provider calls now pass
independent finite source comparison: 192 cases per layout and a 1,286-case mixed
fixture with all 11 owned field occurrences. Three strict-compiling mutations,
ten observation mutations and whole-family capacity/unavailability reject.

The full fourteen-file regression passes **86/86**; all **434 captured inputs**
are unchanged through validation. Strict typecheck and all four check-only
materializers pass. [Exact qualification](evidence/r08ae8-owned-values/qualification.json).
This protocol still needs independent native-surface and retained-custody
integration; other runtime protocols and public integration remain incomplete.
No new public passing status, generator behavior or authority effect is implied.
