# R08 — Public compiler integration

Date: 2026-09-09. Product-construction candidate. Authority effect: none.
Status: public source/snapshot planning and selected CLI/output integration
implemented and verified, including existing public source/snapshot build and
node/project-instantiation APIs and explicitly selected application output layout.
R08 is now qualified; see the [final audit and preserved failure/recheck evidence](evidence/verification-efficiency/R08-QUALIFICATION.md). The supported authored
composition build/output path is integrated below. Later sections preserve historical checkpoints, including superseded remaining-work statements. R09–R18 remain required; no full CLI completion, admission or release is claimed.

## Value-producer native interoperability (R08ae10, verified private candidate)

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

## Owned-value native surface and execution custody (R08ae9)

R08ae9 completes **owned-value native-surface auditing and retained execution**.
The shared factory module builder derives expected imports and type/value
exports from checked source. Owned-value controls have separate registration
and an exact execution definition: qualifying them does not require a
fabricated Rule-rejection witness. Original provider calls execute only after
independent source and CommonJS audits.

The full fifteen-file regression passes **94/94**, with no failures, skips or
cancellations. This includes eight new retained-execution tests: 192 cases per
output layout; a 1,286-case mixed fixture with 11 owned field occurrences;
type-only reference erasure; 12 source/native surface mutations; a compiling
duplicate-call mutation with unchanged factory outcomes; and captured-source,
missing-observation, empty-family, artifact and tool-currentness checks.
The existing Policy, State Machine, factory, owned-value, record, Rule, sum and
composition regressions pass in the same invocation.

All **439 captured inputs stayed unchanged through validation**. Of the 229
predecessor CLI source files, 226 are unchanged and three shared private
verifier files are extended. Generators, prior behavioral definitions and
observers, the public executor and the 70-source capsule remain unchanged.
Strict typecheck and all four check-only materializers pass. Proof registration
contains 43 unique existing test files.
[Exact qualification](evidence/r08ae9-owned-values-execution/qualification.json).

**R08 and all R09-R18 remain incomplete.** Next are named-sum and Enum producer
interactions, remaining Operation/Workflow boundaries and complete public
aggregation/currentness. Accepting an owned sum as a field does not prove its
internal construction calls. No language semantics, defaults, installation,
publication, release or authority changes are implied.

## Factory-to-owned-value interoperability (R08ae8; historical checkpoint)

R08ae8 adds **source-derived factory-to-owned-value interoperability**.
Generated factories now have independent verification of their original provider
ownership and key calls. Each named field import occurrence retains its own
source identity and argument paths; repeated plain Enum singleton cases may
alias without merging distinct record instances. Setup and output inspection
stay outside target-call traces.

The full fourteen-file regression passes **86/86**, with no failures, skips or
cancellations. The new protocol executes 192 cases per output layout and a
1,286-case mixed fixture covering all 11 owned field import occurrences:
Value Objects, embedded Entities, repeated Enum cases, optional/list/set and
inline/named sum fields. Three strict-compiling call/argument mutations and
ten observation mutations reject. Unavailable or capacity-exhausted whole
families cannot yield an empty or partial pass.

All **434 bound inputs stayed unchanged during validation**. All 227 predecessor
CLI sources, generators, private/public executors, prior native observers and
the 70-source capsule are unchanged; two private verification sources are added.
Strict typecheck and all four check-only materializers pass. Proof registration
contains 42 unique existing files.
[Exact qualification](evidence/r08ae8-owned-values/qualification.json).

**R08 and all R09-R18 work remain incomplete.** This is finite native behavioral
evidence, not yet this protocol's independent AST audit and retained execution
custody. Those checks are next, followed by remaining sum/Operation/Workflow
interactions and public integration. An owned-value-ready factory must not
fabricate Rule readiness to reuse the existing factory surface audit. No product
semantic decision, default cutover, installation, publication or admission is implied.

## Factory native surface and execution custody (R08ae7; historical checkpoint)

R08ae7 adds **independent factory native-surface auditing and retained execution custody**.
Expected imports and type/value exports are derived from checked declarations and
selected bindings, independently of generated text. Factory, Rule, owned-value,
plain Enum, payload-sum and shared Enum-runtime modules retain their identities.
Type-only reference closure is compiled and audited, not claimed as executed.

The final thirteen-file regression passes **80/80**, with no failures, skips or
cancellations. Factory execution retains 290 cases and 311 Rule calls per layout;
mixed Enum/sum fixtures cover 344 cases across ten modules. Structured ordered
extensions cover 1,074 cases and 947 target Rule calls. All 13 source/native
surface mutants and three additional strict-compiling call mutants are rejected.
Captured-source, in-flight changes, malformed observations and retained artifact
currentness controls pass alongside the prior Policy/State Machine regressions.

All **427 bound inputs stayed unchanged during the qualifying run**. Of 225
predecessor CLI sources, 224 are unchanged; the private executor gains factory
support and two private sources are added. Generators, original native observers,
public executor and the 70-source capsule are unchanged. Proof registration
contains 41 unique existing files. Strict typecheck and all four check-only
materializers pass. [Exact qualification](evidence/r08ae7-factory-execution/qualification.json).

**R08 and all R09-R18 work remain incomplete.** Remaining producer-consumer
protocols and public integration are next. This is finite instrumented native
evidence, not universal purity, atomic filesystem isolation, uninstrumented
equivalence, release or admission. No product semantic decision is required.

## Exact Policy and State Machine caller-edge coverage (R08ae6; historical checkpoint)

R08ae6 corrects **exact caller-edge coverage in private Policy and State Machine verification**.
A Rule reached through one caller no longer covers an unvisited edge from another.
Both regression counterexamples were reproduced before the fix and now retain
the entire affected family as `not_evaluable`. Positive controls record each
provider-to-Rule and Rule-to-Rule edge, require positive visit counts and reconcile
their total with the full source-predicted call trace. Expected edge counts never
enter the native probe. Wrapper/provider forwarding remains separately audited.

The final twelve-file regression passes **72/72**, with no failures, skips or
cancellations. Policy native execution retains 746 cases and 1,372 Rule calls per
layout; State Machine execution retains 647 cases and 152 calls per layout.
Structured/repeated State Machine fixtures retain 879 cases and 329 calls.
Existing factory, surface/mutation, restricted-execution and retained-custody
regressions also pass. Strict typecheck and all four check-only materializers pass.

All **420 bound inputs stayed unchanged during the qualifying run**. Only two
of the 225 predecessor CLI source files changed; all 223 others, generators,
private/public executors, native observers and the 70-source capsule are unchanged.
The two existing proof files now include the edge regressions; proof registration
remains 40 unique files. The State Machine definition also corrects copied
Policy-closure wording to describe its already-tested State Machine/Rule custody.
Exact evidence: [R08ae6 qualification](evidence/r08ae6-edges/qualification.json).

**R08 and all R09-R18 work remain incomplete.** Next is factory-specific
independent native-surface auditing and retained execution custody, then remaining
producer-consumer families and public integration. No product semantic decision,
installation, default cutover, admission, publication or release is implied.

## Private factory-to-Rule interoperability (R08ae5)

R08ae5 adds **private factory-to-Rule interoperability with exact caller-edge coverage**.
Source-derived lifecycle cases predict actual nested Rule arguments, entry order,
parent indices and Boolean results. Native observation brackets the requested
factory call; nested-input, copy and foreign-value construction stay separate.
Factories retain Entity identity, Value Object equality, extension order and
first-failure behavior. Expected answers never enter the child payload.

The final twelve-file regression passes **70/70**, with no failures, skips or
cancellations. Each output layout executes 290 lifecycle cases and 311 target Rule
calls across six native modules. Structured and extension fixtures execute 1,074
cases and 1,016 calls. Six strict-TypeScript-compiling mutants are rejected,
including four that leave the previous factory-report observations unchanged;
16 malformed observations, active evidence, unavailable families and extension
capacity are also checked. A reproduced caller-edge counterexample now retains
the entire factory as incomplete instead of covering an unvisited edge through
another caller.

All **417 bound inputs stayed unchanged during the final run**. Strict typecheck
and all four check-only materializers pass. Of 223 predecessor CLI sources, 222
are unchanged and the Rule reference gains only a trace-evaluation entry point;
two private verification sources are added. Generators, the public executor and
the 70-source capsule are unchanged. Proof registration contains 40 unique files.
The earlier 69/69 run is retained as preliminary evidence, not substituted for
the final corrected run. Exact evidence:
[R08ae5 qualification](evidence/r08ae5-factory/qualification.json).

**R08 and the full R09-R18 goal remain incomplete.** This family still requires
factory-specific independent native-surface/custody and public integration.
Review reproduced the same caller-edge coverage gap in the earlier Policy and
State Machine families; their existing finite positive results are not universal
edge-coverage evidence. Correct those two profiles next, then continue remaining
producer-consumer and public integration work. No product semantic decision,
installation, default cutover, admission or publication is implied.

## Private Rule-to-State-Machine guard interoperability (R08ae4)

R08ae4 adds **verified private Rule-to-State-Machine guard interoperability**.
Independent source evaluation predicts nested Rule calls, normalized arguments,
Boolean results, state/trigger outcomes and ordered output intents. The native
observer executes original generated reducers and Rules; initial-state, invalid
input and absent-transition cases retain empty Rule traces. Event modules are
not loaded.

The nine-file regression passes **54/54**, with no failures, skips or
cancellations. Each module-root layout covers **647 cases and 152 actual Rule
calls across four native modules**. Structured and repeated-call fixtures cover
879 cases and 329 calls across two State Machines. Controls reject six
TypeScript-compiling semantic mutants, seven source/native surface mutants,
15 observation mutations, active output getters and in-flight native drift.
Unavailable families never yield an empty or partial pass.

All **408 bound inputs stayed unchanged during validation**. Strict typecheck
and all four check-only materializers pass. Of 221 predecessor CLI sources,
218 are unchanged and three private verification sources are extended; two
private sources are added. The public executor and 70-source capsule are
unchanged. Proof registration contains 39 unique files. Exact evidence:
[R08ae4 qualification](evidence/r08ae4-state-machine/qualification.json).

**R08 and the full CLI goal remain incomplete.** This is finite private
instrumented interoperability and bounded source/native/custody evidence, not
universal purity, atomic filesystem isolation, uninstrumented equivalence or
public cross-generator completion. Guardless behavior remains separately
verified; other runtime edges stay uncovered. Next: independently observed
factory-to-Rule calls, remaining producer-consumer families and public integration,
then all R09-R18 obligations. No new product decision or operational authority
is implied.

## Private Rule-to-Policy execution boundary (R08ae3)

R08ae3 adds a **verified private Rule-to-Policy execution boundary**.
Registered controls and captured plan bytes now pass through isolated source
materialization, independent TypeScript/CommonJS module audits, strict native
compilation, actual instrumented Rule calls and final retained custody checks.
Only selected Policy/Rule modules enter the run; target code is not copied.

The eight-file regression passes **46/46**, with no failures, skips or
cancellations. Both layouts retain **746 cases, 1,372 Rule calls and 12 native
modules** each. Tests reject 12 independent surface mutants, nine retained
artifact changes per layout, four retained tool changes, an in-flight compiler
change, three in-flight artifact changes and a truncated native observation.
Captured source remains authoritative after authoring-directory edits; an
all-unavailable family rejects instead of returning an empty pass. Restricted
runner checks deny writes and child spawning.

All **400 bound inputs stayed unchanged during validation**. Strict typecheck and
all four check-only materializers pass. All 219 predecessor CLI sources, the
public executor and 70-source capsule remain unchanged; two private sources are
added. Proof registration has 38 unique files. Exact evidence:
[R08ae3 qualification](evidence/r08ae3-execution/qualification.json).

**R08 and the full CLI goal remain incomplete.** This proves bounded private
instrumented behavior, static module surfaces and before/after artifact/tool
custody, not universal purity, atomic filesystem isolation or uninstrumented
equivalence. Constant/unvisited families and other runtime boundaries remain
explicitly incomplete. Next: Rule-to-State-Machine guard interoperability, then
remaining producer-consumer families and public integration, followed by all
R09-R18 obligations. No product decision, default cutover or operational
authority is implied.

## Rule-to-Policy native interoperability (R08ae2)

R08ae2 adds a **verified private Rule-to-Policy interoperability family**.
Qualified source identity binds Policy wrappers/providers and transitive Rule
modules; an independent source interpreter supplies ordered nested calls,
normalized arguments, Boolean results and target identifiers. The instrumented
native observer calls the original generated functions and receives recipes,
not expected outcomes. Other runtime edges remain explicitly uncovered.

The six-file regression passes **34/34**, with no failures, skips or
cancellations. Native observation covers **746 cases and 1,372 Rule calls per
layout** in two module roots. Five independently installed, TypeScript-compiling
argument/predicate/order/duplicate/omitted-call mutations are rejected, as are
incomplete or foreign observations. Poisoned Policy targets are never loaded.
Constant and unvisited-Rule families remain incomplete rather than passing a
prefix. Existing Rule, Policy, record-value and State Machine regressions pass.
Pinned typecheck and all four materializers pass; the 70-source capsule and
public executor are unchanged. Proof registration grows from 36 to 37 files.
See [protocol scope](CROSS-GENERATOR-VERIFICATION.md#rule-to-policy-protocol-r08ae2)
and [exact qualification](evidence/r08ae2-policy/qualification.json).

**R08 and the full CLI goal remain incomplete.** This is a private instrumented
native comparison, not public cross-generator completion or an uninstrumented
execution claim. Next: independent native-surface and source/artifact/tool
custody/currentness integration, remaining producer-consumer families, then the
remaining R08 and full R09-R18 plan. No product decision or operational authority
is implied.

## Cross-generator boundary foundation (R08ae1)

R08ae1 adds a **verified private cross-generator boundary inventory**. It accounts
for selected generator requests, exact modules, import occurrences, overlapping
request ownership, type-only/runtime/library dependencies and every qualified
root closure. Ownerless Enum support remains distinct from shared domain modules.
The inventory explicitly excludes separately verified authored-composition
artifacts and never claims native interoperability from imports alone.

The focused seven-file run passes **43/43**, with no failures, skips or
cancellations: eight new inventory tests plus 35 existing all-type project,
public entry-point, native execution, independent AST and output-safety tests.
Pinned typecheck and all four materializers pass. All 216 predecessor CLI source
files and the 70-source capsule are unchanged; one private source is added and
the proof registration grows additively from 35 to 36 files.
See [cross-generator definition and scope](CROSS-GENERATOR-VERIFICATION.md) and
[exact qualification](evidence/r08ae-boundary/qualification.json).

**R08 and the full CLI goal remain incomplete.** Public
`cross-generator-behavior` remains `not_evaluable`. Next: source-derived native
producer-consumer bindings and finite interoperability witnesses, mutation and
currentness controls, then the remaining R08 and full R09-R18 plan. No product
decision, installation, publication, default cutover or admission is implied.

## Public authored-composition verification (R08ad5)

R08ad5 public authored-composition verification is now a **verified construction
candidate**. Source and snapshot APIs and the actual CLI execute the same finite
controls in both layouts. Seven composition tests pass, including 696 cases
across six public entry-point reports, native semantic/effect mutations, late
evidence/source drift, cleanup failure, unavailable families and no-Calculation
composition. Endpoints and production providers are not executed.

The eight-file run finished **59/60 passing**. Its sole failure was an obsolete
expectation that composition behavior remained unavailable. The complete
corrected entry-point suite passed **4/4**. All 60 distinct checks have passing
results across those runs; this is **not** one all-pass invocation. Pinned
typecheck and all four materializers pass. The capsule has **70 sources**, with
all 64 predecessor rows preserved; proof registration remains 35 unique files.
See [composition verification](COMPOSITION-VERIFICATION.md) and
[exact qualification](evidence/r08ad5-public/qualification.json).

**R08 and the full CLI goal remain incomplete.** Next: reconcile the exact
remaining R08 entry-point/cross-generator obligations and their dependency order,
then continue the full R09–R18 plan. No new product decision is required by this
checkpoint; no installation, publication, default cutover or admission occurred.

## Public Workflow semantic verification (R08ac3)

This checkpoint is historical; current composition progress is recorded above.

R08ac3 public Workflow verification is now a **verified construction candidate**.
All ten new public tests pass, including actual source/snapshot APIs and CLI
execution in both layouts, 1,396 typed/Event Workflow comparisons across four
real-Lean reports, 134 scalar cases, both source/native audit scopes, exact
imports, whole-node/project capacities and 25 native-code or evidence mutations.

The 35-file broad regression finished **257/261 passing**, with three failures
and one skip: two legacy checks could not find Lean on PATH, one Lean check
skipped for the same reason, and one test still expected Workflow coverage to be
missing. Complete corrected rechecks passed **28/28**, without skips. All 261
tests are covered by passing results across the two runs; this is **not** one
all-pass invocation. Pinned typecheck and all four materializers pass.

The capsule contains **64 sources**, preserving all 56 predecessor definition
entries. Integration also corrects batch-dependent Operation metadata: each
Operation now binds its own declared Rule/Event dependency plans, so separately
owned Workflows compose without conflicting module bytes. Runtime behavior,
collision checks, field/factory selections and product defaults are unchanged.
The proof command includes the new public suite once (31 files).
See [exact qualification and current input hashes](evidence/r08ac3-public/qualification.json).

**R08 and the working CLI remain incomplete.** Next: independent authored-
composition behavior controls and remaining entry-point/cross-generator
qualification, followed by the full R09–R18 plan. No approval, admission,
installation, publication or product decision is inferred from this evidence.


### Verified construction and scope

The source-bound Workflow adapter reuses the independent value, execution and
finite-case references. It observes real generated Operations through run-local
deferred transaction fixtures. Source effects cover every forward dependency;
the separate orchestration audit covers only Workflow providers. Native audits
cover the corresponding ready scopes. Unavailable finite suites still retain
all source audit obligations. Scripts, inputs, phase/schema, observed modules and
final workspace inventory are independently bound and checked for late drift.

Only the exact Workflow provider receives the existing `node:crypto` import
exception, and only its pinned SHA-256 metadata helper passes the effect audit.
Compensation metadata never becomes automatic compensation execution. Deep
owned Order and large occurrence suites that exceed 8 MiB remain explicitly
not_evaluable; no cases or source nodes are silently removed.

The all-thirteen-type fixture now passes selected-generator controls for every
source node, with no remaining node rows and nonempty Workflow coverage. This
does not discharge composition behavior, cross-generator assurance or output
concurrency obligations. The broader report remains incomplete.

### Task Session and Context Builder result

Task: R08ac3 public integration. Result: PASS for this candidate unit; full goal
active. Context: the public definition, Workflow construction scaffold, public
adapter/runner/executor, declared Operation dependency identity, ten public tests,
exact regression reports and full CLI ledger. Strict obligation coverage passes;
no delegated runtime handoff or experiment harness applies. The existing owner-
authorized implementation gate covers these exact changes. Native work and
evidence synchronization remain non-authoritative.

The definition preceded the scaffold, implementation and native qualification.
Bounded recovery corrected the descriptor batching defect, an obsolete coverage
expectation and the test-process Lean PATH. No unresolved product choice or
unrelated cleanup was introduced. Both reports retain their original outcomes.
The qualification records every intentional predecessor change and tested hash.
Operational provider guarantees, installation and publication remain separately
owned residue; they do not block the next composition prototype.

## Typed Workflow value and call reference (R08ac2; historical)

Date: 2026-09-12 UTC. Verified construction candidate; authority effect: none.
The typed-value definition and developer scaffold preceded implementation.
The new private reference requires the exact compiled source certificate and
checked Workflow, snapshots inert data, interprets source expressions and owns
its captured input/result slots. It shares only the existing independent value
interpreter, not generated materializers or Workflow runtime evaluators.

The new 12-test suite plus five unchanged Workflow reference, generation,
materialization, outcome and recovery suites passed **65/65**, exit 0, no skips
or cancellations, in 149133.088307 ms. The new tests include 30 complete native
materialization paths across 11 type-form fixtures and four expression forms,
Event input checks, hostile descriptors and exact numeric boundaries, 16 actual
typed failure-prefix cases, one explicitly deferred four-step success path and
eight compiling materialization mutants. Structural capture accepts a shaped
value that an actual Operation rejects through its selected owned-value Rule;
the two responsibilities remain distinct.

All 198 predecessor CLI source files and the 56-source capsule are unchanged.
One private typed reference source was added; the package change only appends
the new suite to the existing serial proof command, now 25 files. Typecheck and
all four check-only materializers passed. [Saved report and input hashes](evidence/r08ac2/qualification.json)
record currentness, initial fixture corrections and the exact claim boundary.

R08ac3 remains: bind public Workflow descriptors and exact import closure,
source/native effect audits, evidence custody/currentness and whole-node case
capacity. These checks must cover complete supported Workflows before enabling
ready public semantic rows; no partial-prefix certification. Public Workflow
rows remain not_evaluable. This result does not complete R08, the CLI, or R09–R18.

## Workflow metadata reference foundation (R08ac1)

Date: 2026-09-12 UTC. Candidate verification only; authority effect: none.
The definition and developer scaffold preceded the new independent reference.
The reference accepts an exact branded checked policy and reads source occurrence
order, authored argument/event bindings and selected compensation dependencies.
It does not call the production settlement inspector, outcome evaluator,
selected recovery planner or generated templates to obtain expected results.

The focused reference and three unchanged production regression suites passed
**44/44**, exit 0, no skips/cancellations, in 55422.722903 ms. The new suite has
nine top-level checks, including 594 settlement combinations, hostile descriptors
and opaque committed payloads, exact prefixes and local errors, all 25 acyclic
three-compensation graphs in all six declaration orders, 63 compiled native
settlement cases, eight observation mutations and seven compiling provider
mutations. Every native case checks call counts and absence of extra transaction
or compensation calls; unknown commits retain reconciliation-required behavior.

All 197 predecessor CLI source files remain unchanged. One private reference
source, its helper/tests, definition and scaffold were added. The package change
only registers the new suite once in the existing serial proof command, now 24
files. Pinned source typecheck and four check-only materializers passed; the
56-source capsule remains unchanged. [Saved TAP and input hashes](evidence/r08ac1/qualification.json)
bind this bounded result; the older broad regression remains historical evidence.

This is a metadata foundation, **not full Workflow semantic verification**.
R08ac2 must verify typed capture, argument/result values, owned scopes, Events
and deferred calls independently. R08ac3 must bind exact public descriptors and
import closures, source/native audits, currentness, custody and whole-node
capacities before public Workflow rows can become ready. No capsule promotion,
provider implementation, product default change, release or publication occurred.
The [construction scaffold](WORKFLOW-VERIFICATION.md) records this sequence.

## Cross-adapter regression qualification (R08ab2c)

Date: 2026-09-11. Product-construction verification; authority effect: none.
Status: qualified across the broad run and corrected Policy recheck. R08 remains
in progress; this is not a complete CLI or release claim.

### Scope and results

The complete denominator was all 23 files in `test:proof` plus 11 suites covering
resolved composition bindings, application layout, verification projection,
instantiation, build, public commands, project planning, minimal value contexts,
source capsule, resolved artifact planning and authored Operation bindings.
The pinned Node/TypeScript/Lean toolchains ran these 34 files serially.

| Check | Result |
| --- | --- |
| Unchanged diagnostics for three failures from interrupted session 36882 | 3/3 pass, 305335.015275 ms |
| Complete 34-file regression | 216/217 pass, one stale Policy expectation; exit 1, 2116729.032479 ms |
| Complete corrected Policy suite | 5/5 pass; exit 0, 69772.844436 ms |
| Preserved subprocess failure diagnostics | 14/14 controlled cases over seven catch blocks |
| Pinned source typecheck and four materialization checks | Pass; 56 reconciled sources unchanged |
| Broad-run source currentness | All 231 hashes matched at termination |
| Post-recheck currentness | All 197 CLI source files unchanged; no new source files; only the rechecked Policy test changed |

All 217 checks have passing evidence across the broad run and Policy recheck.
This is **not one all-pass full-suite invocation**. No tests were removed,
skipped or cancelled. The broad report retains its failure and exit status.

### Diagnosed correction

The Policy fixture expected `alpha:perform` to remain unverified even though
the public Operation adapter now verifies it. Its actual unmet list was only
`alpha:constant`. The corrected test requires ready, nonempty Operation cases
and exact native tested metadata (selector, kind, definition hash and case count).
It keeps the constant Policy's missing input-sensitivity witness and all isolation
and custody assertions. Policy still selects identifiers without executing its
strategy targets. No compiler or product behavior changed.

Seven catch blocks in the composition, entrypoint and Interface test helpers now
preserve the original subprocess message and error cause alongside captured
streams. Test cases, assertions and timeout budgets are unchanged by this
diagnostic repair. Both with-stream and no-stream error probes passed for every
changed catch block. Typecheck covers product source; native suites and the
controlled probes supply evidence for the test-helper change.

### Interrupted predecessor and durable evidence

The earlier session `36882` became unavailable without a recoverable terminal
report. It reported failures in composition, actual CLI/native/Lean verification,
and the Interface mutation batch. All three passed unchanged in focused
diagnostics and again in the complete-denominator run. The original causes are
not established; passing reruns do not retroactively make that run successful.

The current evidence is stored with the repository, not only in temporary files:

- [Qualification and source-currentness result](evidence/r08ab2c/qualification.json)
- [Complete broad TAP report, including its failure](evidence/r08ab2c/full-suite.tap)
- [Complete corrected Policy TAP report](evidence/r08ab2c/policy-recheck.tap)
- [Immutable pre-run source/test manifest](evidence/r08ab2c/input-manifest.json)

The manifest's historical `running` field describes its capture point, not a
live process. Terminal outcomes and the exact Policy test hash change are in the
qualification result. The preserved TAP and manifest hashes are recorded there.

Recovery used ARE request `ds-cli-continuation-20260911-recovery-111`.
The Policy test effect assessment is
`d235cefdae093c17231a71a1289b58272265ae10acd827d63a2d4e4f8ff74ffd`.
The evidence-preservation assessment is
`74a99eb6d62ebfa4b9b05eb613559f88a4d46b2769de0d4e3cff9f05f234bebc`.
These are non-executing integrity records under existing owner direction, not
new approval, admission or operational authority. No delegation was used.

Task-session/context-builder preserved the full denominator, exact source scope,
honest failure accounting and separate operational lane. There is no missing
product decision. Continue with independent source-derived Workflow semantic
controls, then authored-composition controls and every remaining R08–R18
requirement. No production provider, installation, default cutover, release or
publication is implied.

## Public Operation semantic controls (R08ab2b)

Date: 2026-09-10. Candidate construction; authority effect: none.
Implementation and bounded integration verification are complete.
This section supersedes the earlier statement that all public Operation rows
are unavailable, without claiming complete Operation or CLI verification.

### Meaning and boundaries

- Reconstruct the selected source boundary, fields and authored actions, then
  independently reconstruct descriptor expectations and dependency metadata.
  Generated Operation execution never supplies expected behavior.
- Derive structural and selected owned witnesses from source declarations.
  Preserve ordered lists, canonical sets, exact integer carriers, structural-only
  reads, owned write/result Rules, separate Event slots and explicit clocks.
- Require a complete preparation/commit witness; failed bounded search is not
  proof of unsatisfiability. More than 4,096 cases or 8 MiB retains the whole
  Operation as `not_evaluable`; shared project limits also apply.
- Audit all source Operation closures, even unready nodes, and ready native
  closures. Awaited fixture ports are allowed; application classes, ambient
  effects and dynamic imports are rejected. Only the pinned Enum support
  implementation receives its existing narrow class/materialization exceptions.
- Bind audit phases, module inventories, hashes, inputs and scripts. Late source,
  native, support or evidence drift cannot retain passing evidence.
- Shared native resolution deduplicates repeated type/value imports with the same
  exact target. Conflicting targets still fail, within and between rows.
- Fixtures exercise begin/read/commit/rollback settlement locally. They do not
  persist, publish, retry uncertain commits or establish provider durability.

### Evidence

| Check | Result and exact run |
| --- | --- |
| Public commerce Operation, source/native audits, custody and cleanup | 1/1; 1,904 cases; session `74415`, exit 0, 154575.151416 ms |
| Compiling behavior/binding/effect and audit-evidence mutations | 1/1; clean control plus 18 rejected mutations; `97715`, exit 0, 86691.08315 ms |
| Enum support source pin, extra native class and late support drift | 1/1; three rejected mutations; `81963`, exit 0, 43884.258639 ms |
| Shared imports, capacity, direct native adapter and exact bindings | 5/5; `94621`, exit 0, 21221.409835 ms |
| Project-wide capacity and Enum-only public Operation without records | 2/2; `95818`, exit 0, 10870.861169 ms |
| Record-free and effectful reference regression | 22/22, 41 compiling provider mutants; `43056`, exit 0, 200519.900142 ms |
| Shared verifier/entrypoint/composition/source-capsule regression | 22/24; `5330`, exit 1, 390510.702211 ms; failures described below |
| Corrected shared regression serial rechecks | 2/2; `99636`, exit 0, 207848.453366 ms; real Lean and actual CLI, both output layouts |
| Pinned typecheck and all four materializers | `17384`, exit 0; 56 sources |
| Exact predecessor capsule preservation | 4/4; `7012`, exit 0; all 55 predecessor bytes unchanged |

The direct source-derived adapter uses 2,817 interned recipes and a 3,136,754-byte
serialized commerce row. Those are finite coverage measurements, not exhaustive
proof. Public checks remain separately accounted: this test does not assert all
22 report checks pass. Isolated negative/support checks deliberately substitute a
Lean failure to isolate their own evidence; they are not Lean verification.

The shared run's failures were a real 120-second Lean timeout in composition and
an obsolete entrypoint expectation that selected semantics remain unavailable.
The two affected legacy expectation lists are corrected; no real Lean assertions,
product timeouts or validator outputs were weakened. The serial rerun of both
tests passed, covering all 24 checks across the original run and rechecks, not
one all-pass invocation. Both CLI output layouts and their real Lean assertions
passed. All 10 new Operation integration tests have passing focused-run evidence.
The earlier broad 215-test regression remains historical; a fresh broader
cross-adapter qualification is the next bounded continuation.

The project-capacity fixture initially violated single-creator Entity ownership,
then global ontology-property uniqueness. The fixture was corrected to use three
separate commerce features with distinct ontology identities. Neither production
constraint changed. Its passing test retains all source nodes and audit closures
while whole-node project-capacity rejection stays explicit.

During construction, public execution exposed repeated type/value imports being
compared against a deduplicated map. Canonicalizing exact duplicate resolutions
fixed this, with explicit conflicting-target regression coverage. A test-only
mutation assertion was broadened for missing commit `await`: rejection by the
isolated semantic process on an unhandled fixture commit is also a failing control,
not only a value mismatch. The new public test harness permits 600 seconds for
serial work; the product subprocess limit is unchanged.

### Scope and continuation

The definition and ontology scaffold preceded implementation and materialization.
The 56-source capsule digest is
`cce5312d129d1b5aa7188215f626d7f43202c21faa8ac834d3fc905c0b25dcc2`;
the Operation definition digest is
`154ea235c163bc7d9cf39335904a409147b423be431a0d43b8814f18eb1eae21`.
This appends one definition; the preceding 55-source digest remains
`cfbaca0ef5312e28f7360e37935ec1ebddf630daeff6233d1ac2fed177789ecd`.

Task-session/context-builder retained the exact construction boundary. ARE
request `ds-cli-continuation-20260910-109` used the existing owner authorization,
not a new product decision. Its initial 24-path scope was extended by exactly two
legacy regression-test files after their stale expectations were identified.
The 138 prior checkpoint paths were compared; none changed outside that scope.
The current tracked construction set contains 144 paths. No commit, push,
installation, publication, source-schema or generator change occurred.

R08ab2b is complete as bounded candidate integration, not full CLI qualification.
Next: broader cross-adapter regression qualification before Workflow/composition
controls. The full goal remains active, including all R08–R18 requirements.
Continuation result digest:
`0acc268fb6cfd9d5717745b89c452ef218574d399cc45a1d1ac833e423c20a6a`.
The existing owner gate covers this continuation; it is not new runtime authority.

## Effectful Operation reference and fixture (R08ab2a)

Date: 2026-09-10. Product-construction candidate; authority effect: none.
This completes the effectful reference/fixture portion of R08ab2, not its public
semantic adapter, R08 or the working-CLI goal. Public Operation rows remain
`not_evaluable`; the compiler capsule still contains the same 55 sources.

### Implemented meaning

The separate effectful reference requires a current branded compiled graph,
registered public plan and checked action. The action must match the exact
selected action digest as well as source certificate and authored bindings.
It interprets source declarations and Rule expressions independently of the
generated Operation execution and does not use emitted outcomes as its oracle.

Typed read requests preserve slot, Entity selector and normalized identity.
Read values receive structural and identity checks, not implicit factory
invariant validation. They do not acquire the input-capture array limit:
a native 1,025-item read collection is tested independently. Writes and returned
owned values recursively apply explicitly selected base factory Rules, including
nested Entities, Value Objects, optional/list/set fields and sum payloads.
Create, replace and delete intents remain distinct; no database mapping is added.

Event controls preserve occurrence identity, optional omission, signed integer
carriers, required timestamps and explicit generated clocks. Repeated slots
targeting one Event construct separate occurrences. Clock references are captured
before suspension; invalid payloads do not consume their clock. Owned result
validation occurs after Event preparation and before commit. Deferred reads,
begin, commit and rollback expose early settlement. Exact batches, read requests,
clock calls, detached/frozen outcomes and input/read mutation are observed.
No fixture persists data, publishes Events or proves production durability.

### Verified evidence

- Final effectful suite: **9/9**, session `61622`, exit 0,
  `28666.341406 ms`. This includes repeated exact UInt64 read identities,
  nested owned composition, delete intents, required/generated clocks, signed
  Event limits, adversarial descriptors, guard order and commit receipts.
- **17/17 compiling JavaScript provider mutants detected**: wrong read key/target,
  duplicate or mutating reads, swapped/repeated/uncaptured clocks, omitted or
  repeated Events, missing/wrong-mode writes, unobserved clocks, early commit,
  bypassed owned checks, skipped identity comparison and omitted second guard.
  The original provider is restored and every baseline case rerun afterwards.
- Earlier combined invocation: **19/19**, session `58454`, exit 0,
  `151434.053092 ms`: the then-six effectful tests plus all **13 unchanged
  record-free tests**, including their **24 compiling mutants**. The final
  nine-test invocation above covers later additions and the read-limit correction;
  these are separate invocations, not a claimed single 22-test run.
- Focused unchanged generator/action/minimal-context/source-capsule regression:
  **31/31**, session `49026`, exit 0, `92037.348207 ms`.
- Final pinned typecheck and all four materializers: session `84215`, exit 0;
  39 catalog rows, 31 relationships, five integration definitions in three
  languages, unchanged 55-source capsule.
- Initial implementation type annotations and an overly narrow error-message
  assertion were corrected. During review, the source reference was corrected
  to distinguish read normalization from input capture; its native regression
  is included in the final nine-test pass.
- The historical R08aa broad regression remains historical and was not rerun.

### Exact construction scope

The definition/scaffold preceded construction. Seven construction assets and
these three progress records are the only writes in this slice. The package
proof script only appends the effectful test. All 135 preceding checkpoint paths
matched before construction; the final scoped comparison found no unexpected
changes among those paths. Existing production generators, action definitions,
public verifier, source selection/capsule, schemas, dependency locks, SFOL and
AlchLang were not changed.

| Asset | Verified SHA-256 |
| --- | --- |
| `impl/cli/src/verification/reconciled-operation-values.ts` | `b7303682fde7c1193d6fb9c0d2fa51a504b7224bb53e5b9eb83265e35547a2ed` |
| `impl/cli/src/verification/reconciled-operation-effect-reference.ts` | `1cf3af5d0ca8f0842a2e04433b209610977f289b22c3e8a39ae2a2b439ea3e8f` |
| `impl/cli/src/verification/reconciled-operation-fixture.ts` | `22aa10497c02e68d6863a96de6ffccfcef8005d0b263b280d052a3576101cc7f` |
| `impl/cli/test/verification/reconciled-operation-effects.test.ts` | `ff94068b4173166b1f70211d67c995fa7e84caa082383b7e64986021ec5962d8` |
| `impl/cli/package.json` | `306157a1fe09d51fbdf20c41e1ec0fae3512c4c937bee664a341f699ca735254` |
| `development/reconciliation-v1/profile-compiler-reconciliation/semantic-operation-controls-contract.json` | `5be436dcec2254a3b834f1862bd6f0c10ca0c64b19d25e85877e45fb5fa7131e` |
| `development/reconciliation-v1/ontology/semantic-operation-controls-candidate.json` | `622427c363a012f4cf1db06baaa2e722939726c0606d1f75cce6d895ad2498ea` |

### Continuation boundary

Task-session and context-builder retained definition, selected source evidence,
bounded local implementation, native verification and progress synchronization
as separate obligations. No delegated execution or new product decision.
ARE request `ds-cli-continuation-20260910-108` selected implementation;
route result digest `87789ff1cde119e17f4bc0f99cbed50475474a553218fb338b26d7a12d72eff9`,
context digest `cd5361ab1d135daa1b8f96c53916004e83cbdb35edb40666a28a20700fc316d9`.
The effect assessment retained the existing user owner gate; its decision digest
is `f2d2f5f74c3cd38a15db76247b64d97475dd5fb2258b67d48e815ed85ad121ae`.
The first effect request used an invalid envelope key and was rejected without
effect; the corrected request used the existing route receipt.

Next: **R08ab2b — public Operation verification integration**. Bind source-derived
finite cases to exact descriptors, selected providers and native import closures;
add the async-compatible source/native audit and evidence currentness checks;
enforce whole-node capacities and adversarial custody tests before any public
Operation row can pass. Register the completed private definition only through
the source-capsule materializer, preserving all predecessors. Then continue the
remaining Operation/Workflow/composition and full R08–R18 CLI obligations.
No installation, publication, production provider or product-default change.

Continuation assessment selected R08ab2b under the same existing user owner
gate; result digest
`5ab68e1bc95030f0d423c95c8f0c1bcc26227f2c908430364478d1ad6aa38ca1`.
The persistent working-CLI goal remains active; no new decision is requested.

## Operation fixture foundation (R08ab1)

Date: 2026-09-10. Product-construction candidate; authority effect: none.
This is the first implemented verification slice within R08ab, not completion
of Operation semantic verification or the working-CLI goal.

### Definition, implementation and boundary

The [Operation-control definition](semantic-operation-controls-contract.json)
and [candidate scaffold](../ontology/semantic-operation-controls-candidate.json)
preceded the independent reference and fixture. Existing Operation action and
generation contracts remain unchanged. The definition is intentionally not yet
a member of the 55-source compiler capsule: public integration is still pending.

The reference interprets explicit checked-project input bindings and source
Rules independently of generated execution. It preserves exact primitive
carriers, sum tags/payloads, optional absence, list occurrences and canonical
sets. It rejects references requiring Entity reads/writes, Event occurrences or
owned Entity/Value Object validation; it does not fabricate those providers.
It is an internal oracle called after source/binding checking, not an admission
API or a substitute for the checked action binding.

The run-local fixture supplies deferred transaction promises and a closed
empty state/outbox batch. It observes early settlement, exact phase traces,
batch counts, getter access, input mutation and deep-frozen detached outcomes.
Explicit caller mutations after invocation test capture before the first await.
Commit rejection, malformed/active acknowledgements, thrown commits and
rollback failure stay distinct. No port performs persistence or publication.

Native scalar and Enum/composed fixtures contain no dummy Entity. Each includes
an exposed named Interface; the public scalar check verifies its structural
signature while retaining the Operation as `not_evaluable`. No generated
Interface member implementation or transport is invented.

### Current test evidence

- New Operation suite: **13/13**, session `59749`, exit 0,
  `65873.283754 ms`; four top-level tests including nine shape subtests.
- Mutation test: **24/24 compiling JavaScript mutants detected**, covering
  deferred capture, early begin/commit/rollback, duplicate commit, postcommit
  rollback, skipped cleanup, undeclared reads, mutable/extra batches and
  outcomes, wrong values/carriers, collapsed dispositions, false cleanup claims,
  changed continuation, caller writes/getters, skipped/reordered Rules and
  removed freezing. These are native behavioral mutants, not TypeScript
  declaration or audit-custody mutations.
- Focused regression: **31/31** across `configured-operations.test.ts`,
  `minimal-value-context.test.ts`, `reconciled-sources.test.ts` and
  `action-bindings.test.ts`; session `9720`, exit 0,
  `48929.906231 ms`. This includes actual existing Entity/Event generator
  behavior, composite identities and record-free/plain-Enum construction.
- Pinned typecheck and all four materializers: session `84635`, exit 0;
  39 catalog rows, 31 relationship signatures, five integration definitions
  across three languages and all 55 capsule sources.
- The historical 215-test R08aa regression is preserved below; it was not
  rerun or reclassified as a single all-pass run here.
- Earlier fixture failures were corrected: ontology/Enum authoring, explicit
  TypeScript output root and a fixture-only Docker argument. A process whose
  handle disappeared had no live matching process; its result was not assumed.
  The final 13-test invocation above supplies the current evidence.

### Exact changed construction assets

| Asset | SHA-256 after verification |
| --- | --- |
| `impl/cli/src/verification/reconciled-operation-reference.ts` | `39b8cff1bda6bc8fd345b51999a0299cd1d83edaeb324c5398f7cf13408854c0` |
| `impl/cli/src/verification/reconciled-operation-fixture.ts` | `5187daaa84c199f13f3815ffbae9208ccdb1313a90be8c422625a340b33634cc` |
| `impl/cli/test/verification/reconciled-operation-reference.test.ts` | `b9f6378058a7f5e2011aeb937429df67f500188c164003f4e5924d0f1bf3a0c7` |
| `development/reconciliation-v1/profile-compiler-reconciliation/semantic-operation-controls-contract.json` | `d416bd56a34f8d3438eb33f8d42dc565b6478c4957970c3910108b0d9871cf8f` |
| `development/reconciliation-v1/ontology/semantic-operation-controls-candidate.json` | `d70bdf8ef88324a761ed3197e25038c9ce8ddfd3623c2df63d93523077556b28` |
| `impl/cli/package.json` | `1842184a7ae35b1c6216f3ea75ab51ccd14f6eeba117fa689829dbf0d0338e08` |

Only those six files and these three progress records are in this slice.
All three records still matched their R08aa digests before synchronization.
The original 150-path checkpoint matched before construction began. No
production generator, public verification implementation, source selection,
generated capsule, source schema, dependency lock or resolved product choice
was edited. Proof-script registration only appends the new test.

### Task-session result and continuation

Task-session and context-builder kept the source contracts, independent oracle,
fixture boundary, exact write scope and test evidence separate. Runtime: local;
no delegated handoff; context coverage passed with named test-helper lookups.
No unresolved product decision or causal operational prerequisite was found.
Reusable skill experiments and generic telemetry installation: not applicable.

ARE request `ds-cli-continuation-20260910-106` selected implementation; after
the interrupted observation, fresh request `ds-cli-continuation-20260910-107`
retained the same scope and existing user owner gate. Current route digest:
`e87114f0291fb4524d48b27aec5a7ef7105e988c73af0742412ee49aca18c318`; context digest:
`f5db97603c76f135f3136cc5791234a0dfc422ffd3e9e67755e78d88fdc36010`; effect digest:
`fb1e353ca347572f63f3f2b1891b404bb0d18bba4fe8384d789c9ec5d4a4ebb0`. These non-executing receipts grant no
approval, admission or operational authority.

Runnable construction remains **R08ab2**: Entity identity reads, owned
write/result validation, generated Event occurrences with deterministic explicit
clocks, and public Operation integration with independent exact bindings,
native import/effect checks, audit custody, whole-node capacity and hostile
cases. Preserve the record-free foundation while completing these obligations.
Workflow/composition, hostile output, Python/Rust parity, all 39 cells, commerce
relationships, compatibility, installed-package qualification, docs and review
remain in the full R08–R18 denominator. Operational publication/activation and
production-store qualification remain separately owned; none is a prerequisite
for continuing local construction or an effect granted here.

Continuation assessment selected `R08ab2-operation-effectful-controls-and-public-integration`
under the existing user owner gate, with no new missing decision. Receipt digest:
`d3b228a18f8f534da0aa9f67d76d52331c319db32c415f672dc98f0619472a22`.
The post-test audit found no drift in the six verified construction assets,
no trailing whitespace, and confirmed that removing only the appended proof-test
entry reconstructs the exact prior package digest
`818f0da4b5e400c6cc2776f5c5928371dfd0200dbd80ee329743e9918ab9278e`.
A current 135-path snapshot is retained for continuation; it is not a claim of
a fresh broad regression or a retroactive comparison of every prior path.

## Interface value and signature controls (R08aa)

The [Interface-control definition](semantic-interface-controls-contract.json)
(`e602326219c22b9d6195dd3ef7b3ccf24405e315c9e2a34cbade04bb14895f47`) and
`DSV2-SEMANTIC-INTERFACE-CONTROLS` candidate scaffold precede implementation. The existing
named Interface, version-policy and public-boundary source contracts and
generators remain unchanged.

### Implemented behavior and boundary

Every source Interface receives finite controls for every owned public contract
and each declared endpoint request/result. Expected normalizations and keys use
the existing independent structural/public reference and facts; no emitted
normalizer or descriptor supplies expected behavior, and no factory witness is
required. Interfaces do not become Mapping dependencies in the domain graph
merely because the verifier reuses its private structural reference helpers.

Values retain exact UInt64 bigint/string/safe-number inputs, String and Bool
types, optional absence, local public references, Value Object/Enum structure,
sum variants and payloads, list order and multiplicity, and unique canonical
sets. Required fields and closed inert input boundaries remain enforced.
Normalization yields deeply frozen detached values. Normalized keys and
renormalized values are checked independently. Getters, coercion and caller mutation are observed
without invoking them in the observer.

Keys preserve qualified Interface selector plus contract identity, even when
two public contracts have the same structural shape. Domain value keys retain
their existing metatype identity. These are qualified protocols and descriptors,
not nominal TypeScript brands. Named empty contracts normalize an explicit
empty record; they are not void or missing arguments.

Version eligibility is interpreted independently using integer tuple comparison,
not the existing runtime predicate or generator. Backward mode keeps same major
and provider >= consumer; exact mode requires equality. Cases include adjacent
tuples, zero major, canonical 64-digit components, full-width values, malformed
strings and non-string active input recipes. Version eligibility remains
separate from request/result shape compatibility.

The native compiler checks independently expanded expected Interface and
PublicContracts types through exact type equality, including readonly fields and
members, required normalized optional fields, exact request/result shapes and
Promise results. The consumer is type-only and never executes members. Its
source and configuration are checked against known bytes before execution;
the complete private signature workspace joins semantic currentness accounting.
Changes to signatures, consumer erasure, configuration substitution and late
drift reject or invalidate evidence rather than becoming passing observations.

Runtime surface checks retain exact public/endpoint names and frozen protocols.
Interface and version-policy descriptors are reconstructed from checked
source, graph, field-compilation and contract evidence, inspected as inert
frozen data and compared independently. These Interface controls execute no
declared member, Entity constructor,
invariant, transport, database, application provider or implicit lookup.
Independently selected controls for other source nodes retain their own scopes.

Source and native Interface AST audits use separately bound definitions,
inventories, phases, hashes and script bytes. All source Interfaces are audited
even when finite semantic coverage is unmet. Ready Interface modules remain
standalone leaves: any native import is rejected, including an otherwise
present Query or Calculation. Type-only Promise syntax is allowed; runtime
Promise use, selected ambient names, dynamic import, classes, Object mutation
APIs and direct prototype freezing remain prohibited.

Node budgets remain 4,096 cases/fact expansions, depth 64 and 8 MiB including
serialized cases/signature controls. Shared project bounds remain 65,536 cases
and 8 MiB. Native output/descriptor walks have 65,536 visits/depth 64; AST walks
have 1,000,000 visits/depth 512. Exceeding a bound retains the whole source
Interface as `not_evaluable`, not a passing prefix. These controls are bounded
differential and syntactic evidence, not universal purity, arbitrary Proxy
isolation or safety under modified native intrinsics.

### Verification evidence

Seven Interface tests cover:

- Source-derived, relocated protocols, exact public identities and signatures.
- Actual public native verification, descriptors, version policies and audits.
- 36 compiling/controlled mutation modes covering values, keys, identity,
  defaults, validation, endpoint/surface substitution, version eligibility,
  descriptors, imports/effects, readonly/type signatures and currentness.
- Six audit custody modes: missing source module, wrong native phase/hash,
  modified source/native audit scripts and late script drift.
- Three capacity/literal modes; all 128 owned contracts remain represented by
  the unmet source node and its source audit.
- Fifteen structural shape variants, including nested public values, lists,
  sets, sums, Value Objects and Enums, with exact/backward and 64-digit version
  inputs. A deliberately unsatisfied Value Object invariant remains an unmet
  factory witness, not a barrier to structural public-value verification.
- Fresh-process execution with all non-Interface generated modules poisoned;
  explicit addition of a Calculation import fails.

The first fixture incorrectly exposed one Query from several Interfaces and
was rejected by the canonical one-to-many relationship constraint. Each
Interface now owns a distinct exposed target; the source relationship rule
was not weakened. The initial capsule run passed 4/4 while those two fixtures
failed. Corrected baseline tests passed 2/2 (session `42861`,
`16776.978535` ms). Mutation tests passed 1/1 (session `44464`,
`100922.086454` ms); audit/capacity/shapes passed 3/3 (session `36756`,
`76426.751413` ms); native isolation passed 1/1 (session `87108`,
`4260.007635` ms). Isolated mutation tests inject Lean failure and do not
claim a passing formal proof.

The frozen-source regression exercised **215 tests across 34 files**: **214
passed and one failed** (session `65618`, `1611089.386422 ms`). The sole failure
was an obsolete Mapping-test expectation of `not_evaluable`; the actual result
was `pass` because Interface coverage now closes that fixture. A separate
pre-fix reproduction confirmed exactly this mismatch (session `40751`,
`32109.609491 ms`). No compiler defect was hidden by the correction.

After the broad run terminated, that one assertion was strengthened to require
`pass`, preserving the complete tested-node, remaining-node and effect-audit
assertions. Its fresh native targeted rerun passed **1/1** (session `20247`,
`22279.818482 ms`). Every compiler and other test byte remained unchanged.
All 215 checks are therefore covered by the broad run plus this targeted repair;
this is not represented as a single 215/215 passing invocation. There are no
unresolved test failures, cancellations or skips.

Typecheck and all four materializers pass (session `5305`).
The 55-source capsule preserves all 54 predecessor source bytes and historical
capsule checks, digest `cfbaca0ef5312e28f7360e37935ec1ebddf630daeff6233d1ac2fed177789ecd`.
The Interface test is registered exactly once in the serial proof lane, not
the parallel lane. Existing Mapping tests now correctly report Interface
coverage; their prior Mapping behavior controls remain intact.

### Task Session, Context Builder and scope

Task: R08aa. Result: PASS for this bounded unit, not the CLI goal.
Decisions: zero unresolved product decisions. Gate: existing exact owner
construction authorization. Runtime: local native. Adapter, delegation and
handoff: none. Strict runtime handoff and reusable skill experiments: not
applicable.

Task Session preserved definition → scaffold → implementation → independent
native verification → synchronized evidence. Context Builder selected the
named Interface/version/public-boundary contracts, source renderers/decoders,
shared structural reference/facts, verifier/audit hooks and existing native
tests. Named fallback reads resolved source relationship cardinality,
normalized type expansion and private workspace currentness. Packaging,
installed use and final qualification remain visible later stages, not causal
blockers for this runnable product-construction unit.

The exact allowlist is 19 files, seven new and three evidence ledgers.
One allowed semantic test remains unchanged. All 16 non-document paths were
frozen throughout the broad run. The only subsequent non-document change was
the one Mapping assertion described above; its new bytes passed the targeted
rerun. The other 15 paths and all 131 prior checkpointed files outside this
scope remain unchanged. Scoped whitespace and new-file checks pass. This report,
[STATUS.md](STATUS.md) and [CLI-COMPLETION.md](CLI-COMPLETION.md) are synchronized.
No generator, source schema, default, SFOL, AlchLang, dependency installation,
production provider, admission or publication changed.

Non-executing assessments retain existing owner construction authorization:

- Route receipt: `ca0f51b288b9d8751b1cabf24f78e9d1c7fb390093b617c0f104194fd31b3846`.
- Context result: `6a04e50a964a284f0e6efc40fd7441e620a1a9c34b20179c3fee6b2d345e6060`.
- Effect result: `ed8463711ffb044550f46adfb53136bfb79bf8f2474bfb91684b4dcc4bdb4ffa`.

R08 remains in progress. Next: Operation controls using explicit run-local
fixture transaction ports under the already-selected action contract. Preserve
capture, reads/identity, guards, owned validation, immutable batches, one awaited
commit, cleanup and uncertainty, including record-free Operation/Interface
fixtures. No production provider runs or durability
claim is introduced. The complete remaining selected-generator/composition
verification work and R08–R18 denominator remain active.

Non-executing continuation assessment selects `R08ab-operation-semantic-controls`
as admissible under the existing `user-execute-plan-until-important-decision`
owner gate. Result digest
`7b35802955df0b787f4ca8f2342933ad51e9bebd9ede660d6900716817e2c6e8`.
It grants no new authority and requires no additional product decision.

## Query selection semantic controls (R08z)

The [Query-control definition](semantic-query-controls-contract.json)
(`f21529bc1e75b0c2e0721298c3b3d6edcf30dbd9060ca6ec6ac36fec0deb6105`) and
`DSV2-SEMANTIC-QUERY-CONTROLS` candidate scaffold precede implementation.
The definition was corrected during prototype testing to preserve the actual
source decoder's rejection of empty logical predicates. No source schema or
generated domain code changed.

### Implemented behavior and boundary

Every checked Query receives finite cases derived from its declared input,
source Entity, filter, ordering, limit and projection. The reference interpreter
reads checked source contracts; it does not obtain expected behavior from emitted
code or execute factory validators. Existing shared structural fact generation
supplies domain values without constructing factory-owned witnesses.

Every declared scalar formal and complete source row validates before filtering.
This includes unused parameters, nonprojected fields, filtered-out rows and rows
beyond the eventual limit. Exact `QUERY_INPUT` failures, inert descriptors,
optional missing-field normalization and UInt64 bigint/string/safe-number
carriers remain distinct. Empty results do not waive parameter validation.

The reference evaluates `eq/lt/lte/gt/gte`, nonempty `all/any` and `not`.
Equality preserves Entity identity versus Value Object structure, optional
absence, Enum/sum tags and payloads, list order and duplicate occurrences, and
canonical set semantics. String ordering remains UTF-16 code-unit order;
UInt64 ordering is exact and Bool order is false before true. Empty logical
predicates remain rejected by the existing source decoder.

Queries retain repeated row occurrences and source order when no ordering is
declared. Explicit scalar ordering is ascending/descending with stable ties;
filtering precedes the declared positive limit. Native observations check a
closed deeply frozen result array with exactly the projected fields in authored
order, normalized nested values and detachment from all caller objects.
No Entity construction, invariant execution, reference lookup, database access
or application provider call is introduced.

Frozen callable descriptors are checked against independently reconstructed
Query/source/field evidence: read targets, full source fields, inputs,
projection types, filter, order, limit, provider hashes and effect claims.
Descriptor and output inspection uses own data descriptors, without getters
or serialization hooks. Cycles, mutable results, lossy numeric carriers and
caller aliases reject.

Source and emitted-JavaScript Query audits remain separately bound to their
definition, exact module inventories, hashes, phases and audit-script bytes.
All source Queries remain audited even when finite cases are unmet. Ready native
closures are checked before execution and imports must remain within the same
Query; a different already-present Query is not an authorized dependency.
Selected ambient identifiers, dynamic imports, Object mutation APIs and direct
prototype freezing reject. Late changes invalidate dependent evidence.

Node budgets are 4,096 cases/fact expansion, 4,096 row occurrences per case,
depth 64 and 8 MiB serialized cases. If the declared limit plus one exceeds the
row-witness bound, the whole Query stays `not_evaluable`; it is not partially
certified and the source Query contract is still valid. Shared project budgets
remain 65,536 cases and 8 MiB. Descriptor/output walks use 65,536 visits/depth 64;
AST limits remain 1,000,000 visits/depth 512. These are bounded differential
and syntactic checks, not universal purity, arbitrary Proxy isolation,
modified-intrinsic safety or formal proof of every execution.

### Verification evidence

Seven Query tests cover source-derived/relocated cases, actual public native
verification, 33 compiling mutations, six audit custody modes, three
capacity/literal modes, 12 structured shape variants and poisoned-module
isolation. Mutations alter filters, sorting/ties, limits and limit placement,
row multiplicity, fields and field order, numeric carriers, validation,
immutability, caller data, source/read-target/filter/effect descriptors,
native dependencies and currentness. Descriptor getter installation is rejected
before execution by the Object-mutation audit; it is not represented as a
separate native getter-inspection test.

The fresh-process isolation fixture makes every generated non-Query module
throw on import. Queries still preserve explicit rows, full-width values,
stable ties and duplicates, validate rows beyond the limit and reject missing
parameters even for empty input. Adding a Calculation import fails. Structured
projections remain testable when a referenced Value Object has no satisfying
factory witness; this does not turn a failed invariant into valid construction.

Initial tests corrected fixture mistakes rather than weakening validation:
empty logical terms were rejected by the source decoder, and an adapted mutation
fixture used the wrong generated directory. The corrected five-test run passed
**5/5** (session `47814`, `170567.206938 ms`); the added shape/isolation tests passed
**2/2** (session `27719`, `31159.221271 ms`). Isolated mutation tests inject Lean
failure and do not claim a passing formal proof.

The final focused suite passes **25/25** (session `16160`,
`402346.815826 ms`): seven Query controls, seven Mapping controls, seven configured
Query generator tests and four source-capsule tests. No failures, cancellations
or skips occurred.

Source typecheck and all four materializers pass (session `23106`).
The **54-source** capsule preserves all 53 predecessor source bytes and historical
capsule checks, digest
`22e1d372592c4c303ad962ceadbb860e276fc32dc0b8c247dfe8a5285f8e97d8`.
The Query test is registered once in the serial proof lane, not the parallel lane.
The existing Mapping test now correctly reports Query coverage instead of an
unimplemented Query adapter; its existing Mapping behavior checks remain intact.

Frozen-source regression passes **192/192 tests across 31 files**
(session `61789`, `1354980.291514 ms`), with no failures, cancellations or skips.
It retains the complete prior 29-file regression and adds the Query semantic
and configured-Query generator files.

### Task Session, Context Builder and scope

Task: R08z. Result: PASS for the bounded Query-control unit, not the CLI goal.
Decisions: zero unresolved product decisions. Gate: existing exact owner
construction authorization, with no new authority. Runtime: local native;
adapter, delegation and handoff: none. Strict handoff coverage and reusable
skill experiments: not applicable.

Task Session preserved definition → scaffold → implementation → independent
native verification → synchronized evidence. Context Builder selected the Query
source/decoder/generator contract, shared structural fact/reference APIs,
public verifier and audit integration, native observers and prior Mapping
coverage. Named fallback reads resolved actual predicate admission, parameter
types, descriptor evidence and legal structural fixtures. Operational packaging,
installed use and final review remain later construction/qualification stages,
not current Query blockers.

The exact allowlist is 19 files, seven new and three evidence ledgers. One
allowed existing semantic test does not need changes. All 16 non-document paths
retain frozen verified bytes, and all 124 prior checkpointed paths outside this
scope are unchanged. Scoped whitespace checks pass. This report,
[STATUS.md](STATUS.md) and [CLI-COMPLETION.md](CLI-COMPLETION.md) are synchronized.
No generator, source schema, default, SFOL, AlchLang, dependency installation,
production provider, admission or publication changed.

Non-executing assessments preserve existing owner construction authorization:

- Route receipt: `0867b896cb6faa84c4a369609c83bd77ffb950927f99dd5a710309d2d74d6df7`.
- Context result: `610f81c7899587cd295736d4009415e112e6b225df805a0eb533ec4d8bef3668`.
- Effect result: `a6a08efa8a966fde232a0d49cb64bf2e057d7c1918cd1e9a3ea50c3e4539ac77`.

R08 remains in progress. Next is Interface public/endpoint normalization, qualified identity,
descriptor, version-policy and readonly structural-signature verification under
existing contracts, without executing declared members or introducing transport
or providers.
The complete remaining selected-generator/composition verification work and
R08–R18 denominator remain active.


Non-executing continuation assessment selects `R08aa-interface-semantic-controls`
as admissible under the existing `user-execute-plan-until-important-decision`
owner gate. Result digest
`b4d49feec32f5e5d650ade9471dc8bcbe60c22d92c2dd170e28e4d23a34ff507`.
This preserves exact owner-directed construction; it grants no new authority
and requires no additional product decision.


## Mapping projection semantic controls (R08y)

The [Mapping-control definition](semantic-mapping-controls-contract.json)
(`beedf8c37f43f80cdb5d1f3d90f06ee82bb015734f11ef4641e0617fac1019d0`)
and `DSV2-SEMANTIC-MAPPING-CONTROLS` candidate scaffold precede implementation.
Existing v1/v2/v3 Mapping schemas, generators, domain types and public boundaries
are unchanged.

### Implemented behavior and boundary

Every checked Mapping receives independent source-derived finite projection
controls. All explicit inputs normalize before field evaluation, including unused
inputs and required nullable formals. Already-computed values remain supplied
values: no Calculation, factory, Rule/invariant or endpoint is called.

V1 absence-only defaults remain distinct from explicit null. Partial absent
optional source fields remain omitted; total missing-source fields retain
`MAPPING_REQUIRED_VALUE`. V2/v3 preserve declared lazy nullish defaults and exact
`MAPPING_INPUT`, `RULE_INPUT` and `INTERFACE_VALUE` validation boundaries.
The reference interpreter reads checked declarations, not generated output.

Structural cases cover scalar, named, optional, list, set, sum and qualified
public values, exact UInt64 string/bigint/safe-number carriers, hostile
descriptors, missing optional fields and Unicode-distinct text. Lists preserve
order and multiplicity. Sets preserve canonical identity, including Entity
identity fields and the first source representative of explicit `to_set`.
Public contracts retain their actual Interface-selector/contract-id pair, not
synthetic domain records or runtime nominal brands. Existing restrictions on
embedding domain Entities and public contracts remain enforced.

Native observations preserve authored root field order and complete projections,
actual primitive carriers, nested normalization, deep freezing and detachment
from caller objects. They inspect descriptors without getters or serialization
hooks and detect caller mutation/coercion. Frozen callable descriptors are
compared with reconstructed source contracts, exact targets, fields, source
and provider hashes, public imports/member-use evidence and explicit effect
claims. Public binding compilation supplies checked source evidence, not the
native outcome oracle. Cyclic or mutable descriptors reject.

Separate source and emitted-JavaScript Mapping/Interface-closure audits retain
whole unmet Mapping nodes in the source inventory and audit ready native closures
before execution. Exact native imports cannot introduce a domain factory,
Calculation, Rule, another Mapping or endpoint. Type-only identifiers erase;
strings/comments do not become runtime effects. Selected Object mutation APIs
and direct prototype freezing reject, including the tested bracket-member form.
Observation phase, module inventories, hashes and audit artifacts remain bound
to execution; late drift invalidates dependent evidence.

Whole-node limits remain 4,096 cases/fact expansion, depth 64 and 8 MiB serialized
cases. Shared project bounds remain 65,536 cases and 8 MiB controls. Exhaustion
keeps the entire node `not_evaluable`, without a passing prefix. Native descriptor
and output walks are bounded to 65,536 visits/depth 64; AST bounds remain
1,000,000 visits/depth 512. This is finite differential and syntactic assurance,
not universal purity, alias-analysis completeness, arbitrary Proxy isolation,
modified-intrinsic safety or a formal proof of all executions.

### Verification evidence

Seven Mapping tests cover pure construction of cases and relocation, actual
public native verification, 28 compiling semantic/binding/effect mutations, six
audit-custody modes, three whole-node capacity/literal modes, 15 nested domain
and public projection variants, and poisoned-module isolation. The isolation
fixture makes every generated non-Mapping/non-Interface module throw on load;
ordinary Mappings still execute, while an introduced Calculation import fails.
Thus supplied computed inputs and structural Entity projections do not depend
on factory witnesses or invariant execution.

The mutation corpus rejects substituted inputs/defaults, skipped unused-input
validation, field reordering/omission/addition, lost freezing, numeric precision
collapse, caller aliases, incorrect legacy presence semantics, and self-consistent
rehashes of incorrect source/target/member-use/effect descriptors. Getter
installation via Object.defineProperty is rejected by the pre-execution audit;
that fixture is not presented as native getter-inspection coverage.
Source/native evidence substitution and late drift cannot retain a stale pass.
Isolated semantic tests inject Lean failure and do not claim passing formal
proof evidence.

Initial runs exposed implementation typing errors and test-fixture errors:
a reserved source name, a descriptor-getter fixture that executed at installation,
source mutation misclassified as a harmless emitted literal, a public contract
placed in an Entity field, a missing test brace, JSON key-order comparison,
and a legacy Calculation without its required relationship. The fixtures were
corrected (the isolation Calculation uses the existing standalone exact v2
contract); source schema/relationship validation and whole-node accounting
were not weakened. These failed runs are not represented as initial clean passes.

The final Mapping-plus-capsule suite passes **11/11** (session `62807`,
`164360.229959 ms`). The final source typecheck and all four materializers pass
(session `97592`). The capsule contains **53 sources**, preserving all 52
predecessors and reconstructed historical capsule checks, with digest
`f83335f525409860b654df53455bdf4bf8ef7316b543900635ac4873af5eaca0`.
The new test is registered exactly once in the serial proof lane and is not
added to the parallel lane.

Final serial regression over frozen source passes **178/178 tests across 29 files**
(session `2709`, `1076106.762043 ms`), without failures, cancellations or skips.
It includes all 26 predecessor regression files, the new Mapping controls, and
the existing Mapping and public-boundary generators. This does not close the
complete R01–R18 product matrix.

### Task Session, Context Builder and scope

Task: R08y. Result: PASS for the bounded Mapping-control unit, not the CLI goal.
Decisions: zero unresolved product decisions. Gate: existing exact owner
construction authorization retained; no new authority. Synchronized records:
this report, [STATUS.md](STATUS.md) and [CLI-COMPLETION.md](CLI-COMPLETION.md).

Task Session preserved definition → scaffold → implementation → independent
native verification → synchronized evidence. Context Builder selected the
v1/v2/v3 Mapping, domain/public value and binding contracts, shared public
verification/audit surfaces and existing native observers. Named fallback reads
resolved field normalization, error origins, source binding and legal public
fixture composition. Runtime: local native; no adapter, delegation or handoff.
Strict handoff coverage and reusable skill experiments: not applicable.
No unresolved product decision or new authorization is required.

The exact allowlist contains 19 paths, eight new and three synchronized evidence
ledgers. One allowed existing semantic test requires no change. All 16
non-document paths retain their verified frozen bytes; all 117 prior checkpointed
paths outside the allowlist are preserved. Scoped whitespace checks pass.
No source schema, domain generator, default, SFOL, AlchLang, dependency
installation, production provider, admission or publication changed.

Non-executing assessments retain existing owner construction authorization:

- Route receipt: `55f4ec07c36aa17dbc17d45f9d67a076a800db4b82ab2f4710cb3aff3e0f6085`.
- Context result: `3b34ed45ad247f208fb2c96a4c68ca1f13d25571d320b973ad756fb0ae8bafa8`.
- Effect result: `2c2c2cb63f034e97c949023a37dac441c69289fb7237e2072d1cdd5325154442`.

R08 remains in progress. Next: Query semantic controls under the existing
contract, preserving explicit caller-supplied rows, filtering, projection,
ordering, limits and collection multiplicity without database or provider I/O.
All remaining selected-generator/composition checks and the full R08–R18
completion denominator remain active.

The non-executing continuation result
`6c56109e9ac0ad4b7a5c52163a6fd77fbe9775eac53db54940f838c8315a1329`
selects `R08z-query-semantic-controls`. Its gate references the same existing
owner construction authorization; it grants no new authority.

## Event construction semantic controls (R08x)

The [Event-control definition](semantic-event-controls-contract.json)
(`59e72f308474d6dff92d8cf32a2166dc02ec4a7160c34b9785f575af4fa763a9`)
and `DSV2-SEMANTIC-EVENT-CONTROLS` candidate scaffold precede implementation.
The descriptor-binding clause and scaffold concept were added before implementing
their corresponding controls. Existing Event source schemas and generators are
unchanged.

### Implemented behavior and boundary

Every checked Event now receives independent source-derived construction cases.
Occurrence identity, payload, source type/version, optional absence and time policy
remain distinct. Cases cover all admitted primitive and reference carriers in both
occurrence and payload positions, exact signed Int64 representations and boundaries,
finite binary64 decimals with negative-zero normalization, and hostile descriptors.
Native observations inspect inert closed frozen results without getters or
serialization hooks, require detached copies and fresh repeated constructions,
and detect caller mutation or coercion.

Required time remains explicit caller input; an extra clock must not execute.
Generated time calls a supplied deterministic fixture clock exactly once after
complete input validation. Controls distinguish changed clock values, missing or
invalid clocks, invalid synchronous returns, repeated calls, early calls and exact
propagation of the thrown clock sentinel. No ambient or production clock runs.

References remain selector-bound nonempty text. They do not imply lookup,
embedding, format validity, chronology, uniqueness, registration or deduplication.
Native reference-isolation evidence executes constructors with every referenced
declaration module poisoned, then rejects an introduced dependency.

The frozen constructor and its inert deeply frozen descriptor are checked against
independently reconstructed source identity, occurrence/time/payload fields,
complete referenced-source bindings, original provider bytes and explicit effect
claims. Mutations include self-consistent rehashed but incorrect source/reference
bindings and publication claims. Descriptor getters never execute; a getter-read
sentinel also guards ordinary construction cases. Cyclic descriptors reject.
Descriptor inspection is bounded to 65,536 visits and depth 64.

Separate Event TypeScript and emitted-JavaScript audits use the existing native
AST restrictions, exact module inventories, hashes, phases and currentness.
Source auditing retains whole Events whose finite corpus exceeds its budget;
native auditing covers only ready Event closures before their execution.
The common parser builder preserves the State Machine audit script byte-for-byte
(SHA-256 `3886564a2d7be63ba192845540abd106a5ccf41c67b737dacee1c06f5a9cf0e7`).
Its check identities, definition, Rule closure and Event-intent non-execution stay
unchanged. Each profile retains independent audit custody and invalidation.

Whole-Event bounds are 4,096 cases and 8 MiB serialized cases; shared project bounds
remain 65,536 cases and 8 MiB controls. A bound breach is `not_evaluable` for the
entire node, never a passing prefix. AST bounds remain 1,000,000 visits per module
and depth 512. These are selected finite semantic and syntactic checks, not
universal purity, arbitrary Proxy isolation, modified-intrinsic safety or formal
proof of all executions.

### Verification evidence

The seven Event tests cover the ordinary native path, 32 compiling mutation modes,
six audit-observation/custody modes, three literal/capacity modes, all seven
primitive/reference occurrence carriers with optional payloads, and referenced-
module isolation. Caught dynamic imports and ambient effects fail before semantic
execution; an undeclared static import is rejected even for an already loaded
module. Late changes invalidate dependent evidence rather than retain a stale pass.
Mutant fixtures isolate semantic evidence with an injected Lean failure and do not
claim a passing formal proof.

Early focused runs exposed test-fixture mistakes: canonical Event type/version
and typed Enum declarations, one stale capsule count, merged warning text in a
hash assertion, and an assertion expecting zero instead of an absent case count
for an unmet node. Those fixtures/assertions were corrected; source validation
and whole-node accounting were not weakened. The expanded seven-test run first
passed 6/7 because of the absent-count assertion; it is not recorded as an initial
clean pass.

After the descriptor controls were added, their 32-mode mutation test passed
(session `46129`, **1/1**, `65423.342786 ms`). The final combined Event,
State Machine, effect-audit and capsule suite passed **20/20**
(session `73611`, `273311.65915 ms`).

Final serial regression over frozen source passes **151/151 tests across 26 files**
(session `81057`, `936608.531641 ms`), with no failures, cancellations or skips.
This includes the existing Event generator's nine tests and all 24 predecessor
regression files. It does not close the complete R01–R18 product matrix.

Pinned source typecheck and all four materializers pass (session `50402`).
The capsule contains **52 sources**, digest
`94cff817adcd0f5181cb188232a523ee699addce8ad39cda855107b83808be4b`,
preserving all 51 predecessors and reconstructed historical capsule checks.
The new test is registered once in the serial proof lane, not the parallel lane.

### Task Session, Context Builder and scope

Task Session preserved the authorized definition → scaffold → implementation →
independent native verification → evidence sequence. Context Builder selected
the Event source/value/binding contracts, public executor, shared audit and native
observer, and existing State Machine controls; descriptor and source-manifest
inspection closed a binding obligation without adding product behavior.
Runtime: local native. Adapter/delegation/handoff: none. Strict handoff and
reusable skill experiments: not applicable. No product decision is missing.

The allowlist contains 20 paths, six new and three synchronized evidence ledgers.
One allowed existing semantic test needs no change. All 17 non-document paths
remain unchanged from the final verification freeze; all 108 prior checkpointed
paths outside the allowlist are preserved. Scoped whitespace checks pass.
No generator, source schema, default, SFOL, AlchLang, dependency installation,
production provider, admission or publication changed.

Non-executing assessments retain the existing owner construction authorization:

- Route receipt: `bb2ee0bcf64457547a5639a5243a5c5eff6685dcef0d3c7d6f9d5302248e14bd`.
- Context result: `5157a5f758d84de56110fdeb546f418be61b8d591a5ff562ed86f377586ac274`.
- Effect result: `a4057d4862c3bae04f2874dde19697792df91e346d1cefda3cdca6e355387f6d`.

R08 remains in progress. Next: Mapping semantic controls under the existing
contract, preserving explicit already-computed inputs, source/target identities,
declared lazy defaults and immutable field projections. No implicit Calculation,
factory, invariant, transport or provider execution is introduced. The full
R08–R18 denominator remains active.

The non-executing continuation result
`1c6f6d4970408c1294cb104be614cb2a844843b37c02cc91d5fb652779ee0377`
selects `R08y-mapping-semantic-controls`. Its gate references the same existing
owner construction authorization; it grants no new authority.

## State Machine effect-audit integration (R08w)

The [effect-audit definition](state-machine-effect-audit-contract.json)
(`76dc0df7b5a296b350809a381cb7528a6ccf81722190afc43a716c16b5c4fdac`)
and `DSV2-STATE-MACHINE-EFFECT-AUDIT` candidate scaffold precede implementation.
This closes the public integration gap identified in R08v without changing
generated domain code or the standalone observer.

### Implemented behavior and boundary

The public executor uses the pinned native TypeScript AST to inspect every
checked State Machine wrapper/provider and its transitive Rule closure.
The source audit retains machines whose finite behavioral corpus is
`not_evaluable`. A separate audit inspects the emitted JavaScript closure
for ready machine controls before the private semantic runner imports it.
Event modules are outside both closures; references remain unexecuted intents.

The selected restrictions reject class declarations/expressions, await and
dynamic-import forms, and all thirteen ambient identifiers from the existing
standalone observer. Identifier escapes are decoded. Words in strings and
comments are not identifiers. Each observation must match its exact phase,
definition hash, complete ordered module inventory and current file hashes.
No missing module, wrong phase or substituted hash can supply passing evidence.

Audit scripts, inputs and compiler configurations are checked before and after
inspection and immediately before native execution. Final currentness checks
invalidate dependent observations after late drift. The existing exact import
guards, source/tool/workspace checks, structural input validation, frozen-output
checks and whole-node unmet accounting remain in force.

The AST walk rejects more than 1,000,000 visits per module or depth 512.
Existing bounded file reads and subprocess limits remain. Exceeding a limit
does not certify a passing prefix or change source admission. This is evidence
for selected syntactic effect restrictions, not universal JavaScript purity,
alias analysis, an effect system or a general sandbox.

### Verification evidence

Two failing tests establish the repaired gaps:

- A compiling global-state write initially escaped semantic failure
  (session `98671`, **0/1**, `12546.752474 ms`).
- Changing the audit script after inspection initially allowed native execution
  to start (session `12596`, **0/1**, `17561.051069 ms`).

The custody fix then passed its six-mode test (session `86270`, **1/1**,
`15668.257113 ms`). The combined reducer, audit and capsule suite passed
**13/13** (session `2342`, `120805.105536 ms`).
The final expanded audit file passed **3/3** (session `43663`,
`61972.115239 ms`), covering twenty syntax-valid effect/capacity mutations,
six observation-substitution/artifact-drift modes, and three literal/capacity
scope cases. Forbidden native code must be rejected before the semantic runner
starts. Late audit changes invalidate previously executed dependent evidence.

The twenty mutation modes cover all thirteen identifiers, both class forms,
await, escaped identifiers, transitive Rule mutation, TypeScript-source mutation
and excessive AST depth. Existing R08v behavioral mutants still require an
independent observation mismatch. Caught dynamic imports and writes now fail
the earlier AST gate; static undeclared Event imports retain the exact native
import-boundary diagnostic. The isolated mutation fixtures inject Lean failure
and do not claim formal proof.

Final serial regression over frozen source passes **135/135 tests across 24 files**
(session `60417`, `766478.788805 ms`), with no failures, cancellations or skips.
It includes prior public CLI/API, composition, projection, currentness, generation
and semantic controls. This is not the complete R01–R18 product matrix.

Pinned source typecheck and all four materializer checks pass (session `47570`).
The capsule contains **51 sources**, digest
`d9b28c8899c768d66c6bda1dfde1ef5bbe2ac6a49094d36c2838dbed2c0f3c41`.
All 50 predecessor sources and reconstructed historical capsule checks are
preserved. The new test is registered once in the serial proof lane and not
in the parallel lane.

### Task Session, Context Builder and scope

Task Session kept this unit within the already authorized R08 construction
boundary. Context Builder selected the R08v gap, existing State Machine source
restrictions, public executor, reducer controls and capsule contracts.
Definition → scaffold → implementation → native evidence remains explicit.
Runtime: local native. Adapter/delegation/handoff: none. Strict handoff and
reusable skill experiments: not applicable. No product decision is missing.

The exact scope is 14 paths, including four new paths and three synchronized
evidence ledgers. All eleven non-document paths remain unchanged after the final
run; all 108 earlier checkpointed paths outside this scope are preserved.
Scoped whitespace checks pass. R01–R07 remain complete; R08–R18 and the full CLI
goal remain active. No generator, default, SFOL, AlchLang, dependency installation,
production provider, admission or publication changed.

Non-executing assessments retain the existing owner construction authorization:

- Route receipt: `3ce3ad2e142e64173bc3899be28fac6c4ef65ef485d379ffb79fe2f5551a6dde`.
- Context result: `0d64ef5d1d99fc826c84a613c0cc9e14048942ccfb7ac261a4a0dabbb030c7ad`.
- Effect result: `2fa79678812280d73208d923cd73ffcbf448441c5237661bb6c2609829a6387a`.

These assessments confer no authority. Next: independent Event construction
controls under the existing selected Event contract, preserving explicit input
and occurrence/time metadata, with no automatic clock, identifier allocation,
dispatch or provider effects.

The non-executing continuation result
`ac75a7e8aa891559f838c305c0f54ebaeae13e795d0acdd893ee256880cb032a`
selects `R08x-event-semantic-controls`. Its gate references the same existing
owner construction authorization and grants no new authority.

## State Machine semantic controls (R08v)

Historical checkpoint; the source-audit integration gap below is closed by R08w.

The [State Machine-control definition](semantic-state-machine-controls-contract.json)
(`da9a3a504fded187bdd6b6956b6695736598f48564c6d85aba396fa9b7688ffb`)
and `DSV2-SEMANTIC-STATE-MACHINE-CONTROLS` candidate scaffold precede implementation.
The existing source, Rule and State Machine generator contracts remain unchanged.

### Implemented behavior and boundary

The public verification path now prepares independent finite reducer controls.
Every declared state/trigger pair is combined with the bounded structural input
corpus. The source interpreter selects the unique transition, binds its declared
Rule arguments and evaluates its transitive Rule closure. A missing pair yields
`no-transition`; a false guard yields `guard`. Both retain the original state
and an empty intent list. Successful results retain exact target state, transition
identity and output-slot order, including repeated Event references in distinct slots.
The exported initial state is independently checked.

Facts include transitive Rule and guard-argument literals, exact UInt64
representations, list/set conversion, optional and sum shapes, and malformed
inputs. Inputs validate even when a state/trigger pair has no transition.
Unknown symbols and wrong state/trigger carriers reject without coercion.
Guardless machines remain lawful without a fabricated Rule or Policy-style
input-sensitivity witness. Source-predicted transitions are finite evidence,
not a universal reachability or branch-exhaustiveness claim.

The native observer accepts only closed, inert, deeply frozen reducer results
and ordered intent objects. It inspects output descriptors without invoking
output getters or serialization hooks. Caller fingerprints include nested
descriptors, identity, prototypes, extensibility and distinct numeric values.
Private native import guards bind the reducer/Rule closure to exact planned
specifiers and resolved URLs, rejecting undeclared dependencies before loading
even when a dynamic import failure is caught. Shared Policy diagnostics remain
compatible. Event references do not construct or import Event modules.

Bounds remain 4096 cases per whole node, 65536 project cases and 8 MiB serialized
controls, with independent Rule expression visits capped at 65536/depth 64 per
guard evaluation. Exceeding a bound leaves the entire node `not_evaluable`
without a passing prefix. Other unimplemented kinds and composition/cross-generator
requirements remain in the complete source-node denominator.

### Verification evidence

The initial source-capsule and pure-control checks passed **3/3**
(session `50922`, `3188.975721 ms`). The first public native reducer test passed
(session `13937`, `16666.579425 ms`). A combined State Machine, Policy and
capsule run passed **13/13** (session `97574`, `97109.898492 ms`).
The expanded reducer suite passed **6/6** (session `7114`, `63913.87438 ms`).

Review then demonstrated a missing mutation distinction: changing a malformed
input from NaN to Infinity escaped semantic failure because JSON fingerprints
collapsed both values to null. The new compiling mutant failed its expectation
(session `21480`, `34865.86506 ms`): evaluated nodes still passed instead of
reporting the mutation. Those earlier green results are not evidence against
this previously untested change. Numeric fingerprints now distinguish NaN,
infinities, negative zero and finite values.

The final reducer suite passes **6/6** after the fingerprint fix
(session `39826`, `67095.70193 ms`).

There are now 24 injected modes: initial/target/source state, trigger and output
Event identity, transition identity, guard predicate/binding/Rule changes,
rejection reason, output order/collapse, root/nested freezing, extra fields,
wrong result carrier, early validation bypass, caller extensibility mutation,
invalid-number mutation, wrong error, static and caught dynamic Event imports,
a forbidden filesystem write, and late workspace drift. Every syntax-valid
behavioral mutant must fail semantic comparison; import attempts must carry the
exact boundary diagnostic; late drift must invalidate dependent observations.
The mutation test isolates semantic behavior with an injected Lean failure and
does not claim formal proof.

A separate native test compiles the complete public artifact plan, poisons every
Event module, and checks hand-calculated transition, guard and no-transition
results in a fresh process. Introducing an Event import then fails with the
poisoned-module sentinel. This is concrete non-import evidence, not universal
effect freedom. Structured native cases additionally cover list-to-set guards,
optional values and payload-bearing sums. Capacity, relocation, invalid symbols
and malformed-input cases retain exact node accounting.

Final serial regression over frozen source passes **132/132 tests across 23 files**
(session `66465`, `755609.340542 ms`), with no failures, cancellations or skips.
It includes the new reducer controls, existing State Machine and Policy generation
contracts, earlier semantic adapters, public CLI/API paths, composition, projection,
currentness and verification execution. This is not the complete R01–R18 product
qualification matrix.

The capsule has **50 sources**, digest
`7d6d8f370e5a667eda49b713af92b4943162a0280452a6950b20fa834a9723d3`.
All 49 predecessor sources and historical reconstructed capsule checks are
preserved. The new test is registered once in the serial proof lane.
Pinned source typecheck and all four materializer checks pass (session `86917`).

### Task Session, Context Builder and scope

Task Session selected this bounded product-construction unit within R08.
Context Builder used fourteen controlling sources: the R08 task, State Machine
contract, decoder/checker, renderer and planner; shared structural facts, cases,
Rule reference and native observer; semantic integration; existing State Machine
generation tests; the Policy native test harness; and the standalone State Machine
observer's existing ambient-effect checks and the public executor's AST-surface
walk. Their selected clauses cover input types, guard binding, pair selection,
outcomes, imports, capacity,
compatibility and the concrete validation surface. No product decision is missing.

Runtime: local native. Adapter/delegation/handoff: none; strict handoff coverage:
not applicable. Reusable skill experiment: not applicable. Recovery inspection
was limited to the selected native fingerprint, the demonstrated numeric mutation
gap, and the existing standalone observer's effect-check integration boundary.
Definition → scaffold → implementation → native evidence is retained.
No source generator, SFOL, AlchLang, product default or production provider changed.

The exact write scope is 15 paths: four verification modules, the new test,
capsule/source configuration and test registration, definition/scaffold, and
three synchronized evidence ledgers. All 12 non-document paths remain
byte-identical after the final regression;
all 103 earlier checkpointed paths outside this scope remain unchanged.
Scoped whitespace checks pass; STATUS and CLI-COMPLETION are synchronized.
Operational installation, publication, admission and deployment remain separate
and unperformed. R01–R07 remain complete; R08–R18 and the full CLI goal stay active.

Non-executing assessments reference the existing construction authorization:

- Route receipt: `6eef9bacb737c77cbbf4de1825c83c61053291568e2727d510561019cd182ac4`.
- Context result: `08da05e5607f29b3ae054c7c7db042c8cbd39548eab192ab6cd6cd4ad38b12eb`.
- Effect result: `77b855f0f935224c8c9eeea4b4f9c33434e16e1743f2a80488e82f406f28f4a5`.

These receipts grant no authority. Review of the existing standalone State Machine
observer identified a remaining integration requirement: its native source walk
rejects impure forms and ambient identifiers such as globalThis. The new public
controls compare finite outcomes and enforce exact imports, but do not yet carry
that source-level audit into the public executor. Passing these controls is not
a purity proof. R08w will demonstrate and close that gap under the existing
contract before proceeding to Event construction controls. No product meaning
change is proposed.

The non-executing continuation result
`0f7f2a3b34c38d3aa8835747348ac274da83ce049fea8b0ad90981150461cca4`
selects `R08w-state-machine-effect-audit`. Its gate references the same existing
construction authorization and grants no new authority.

## Declared-Rule Policy semantic controls (R08u)

The [Policy-control definition](semantic-policy-controls-contract.json)
(`4da738c2a406c42aa45cf5a45048bef7d1bf0f968b7e18bc0e26d3159acb53a6`)
and `DSV2-SEMANTIC-POLICY-CONTROLS` candidate scaffold precede implementation.
The existing Policy v2 generation contract, Rule contracts, generated domain code,
source admission and defaults remain unchanged.

### Implemented behavior and coverage

Policy nodes now use independent finite semantic controls over explicit structural
inputs and their declared Rule closure. The reference interpreter binds source
argument expressions, evaluates cases in source order, returns the first matching
target, and otherwise returns the exact default. Repeated Rule/case/target
occurrences remain ordered source occurrences. Policy argument literals and
transitive Rule literals both contribute to the input corpus.

The structural case builder is shared with the existing Rule adapter. It retains
exact UInt64 representations, raw String values, Entity identity versus full value
semantics, optional omission, sums, list occurrences, canonical sets, and list-to-set
conversion. All inputs, including unused ones, must validate. No factory invariant
filters Policy facts: a structurally valid record rejected by its owned factory
can still select a Policy's fallback.

Native observations compare exact selector strings or `TypeError: POLICY_INPUT`,
with zero getter/coercion calls and descriptor-based caller-input preservation.
A Boolean, executable object, unknown selector or calculation result cannot
substitute for the target identity. The checked native dependency closure permits
only the Policy and Rules, excluding strategy targets and factory providers.
The shared data-only observer preserves the previous Rule Boolean result boundary.
A process-local native resolution hook binds each watched Policy/Rule module to its
exact declared specifiers and resolved module URLs. Unknown imports are rejected
before loading, and a violation counter prevents a caught import error from
producing passing observations. This guard runs inside the existing restricted
process and adds no generated product runtime or new permission.

At least two source-predicted valid result targets are required as bounded
input-sensitivity witnesses for the existing configured Policy profile.
A constant/insufficiently witnessed Policy remains **entirely not_evaluable**.
This does not reject previously accepted source or prove a branch unreachable.
The source-predicted branch indexes are evidence metadata, not a native call
trace or exhaustive branch proof.

Bounds remain 4096 expanded facts/cases per node, 65536 project cases and 8 MiB
serialized controls. Policy expression evaluation shares the independent 65536
visits/depth-64 limit across its evaluated Rule cases. Exceeding a bound retains
the entire source node without a partial passing prefix. All other source kinds,
cross-generator and composition obligations remain in the complete denominator.

### Verification status

The initial combined run passed the existing Rule and source-capsule suites
(**8/8**) but failed both new Policy tests before execution because the fixture
omitted required Calculation relationships (session `1784`, ten total tests,
`107784.157272 ms`). Further source admission rejected its empty Operation guard
and empty factory-validator binding. The fixture was corrected with explicit
relationships, guard and factory Rule bindings; no admission rule was weakened.

The initial native Policy suite then passed **3/3** (session `59886`,
`45569.92199 ms`). Strengthened Policy tests passed **5/5** (session `7368`,
`52860.716354 ms`), followed by the expanded mutation test passing separately
(session `13410`, `33314.730391 ms`).

There are 15 injected modes: eleven syntax-valid behavioral mutants (case order,
argument substitution, default/predicate/Rule changes, lost list-to-set conversion,
wrong carrier/selector, getter execution, input mutation and wrong input error),
one forbidden filesystem write, two undeclared-target import modes (static and
caught dynamic), and late workspace drift. Every mutant is detected,
the write is denied, and late drift invalidates dependent evidence. Mutation
isolation injects a Lean failure and does not claim a formal pass.

The native target-isolation test compiles the actual public artifact plan, replaces
all Calculation/Operation modules with throwing modules, and verifies all three
Policy outcomes in a fresh process. Introducing a strategy import then fails with
the sentinel error. This tests non-import/execution for that concrete native
corpus, not universal effect freedom. Other tests cover hand-calculated outcomes,
repeated first-match cases, Policy-only literal seeds, optional/nested/collection
inputs, relocation determinism, and a 128-input capacity case.

The first frozen-source broad run passed **115/115 tests across 21 files**
(session `47388`, `658210.437842 ms`). Review then identified a gap between the
planned import inventory and emitted-JavaScript imports. A new compiling target
import mutant escaped semantic failure (session `77556`, `32606.781378 ms`);
the first broad result is not claimed as proof against that previously untested
mutation. Native dependency guards and both static/caught-dynamic import tests
were added before the final verification below. The post-fix Policy suite passes
**5/5** (session `41900`, `55939.211827 ms`); final metadata and exact guard-diagnostic
assertions are included in the full rerun below.

Final frozen-source serial regression passes **115/115 tests across 21 files**
(session `11772`, `655905.620591 ms`), with no failures, cancellations or skips.
This includes the final native import guards, exact guard-reason assertions,
all existing Rule/factory/record/sum/Enum/Calculation controls, native Policy
compatibility/observation, public commands/APIs, composition, projection and
verification checks. Pinned source typecheck and all four materializer checks
pass (session `89505`). All 15 non-document paths remain byte-identical after
this final run.

The capsule contains **49 sources**, digest
`65224aec6b1876989c8777a1e6156c5844611fbc93f50d45cdcc0c01d27b55fb`.
All 48 predecessor pins and reconstructed historical checks remain intact.
The Policy test is registered once in the serial proof lane.

### Task Session, Context Builder and exact scope

Task Session keeps this unit bounded to Policy controls and the shared structural
case machinery. It does not mark R08 or the working-CLI goal complete.
Context Builder selected ten controlling sources: the R08 task, Policy contract,
typed Policy decoder/checker, Policy renderer/planner, existing Rule facts/control
builder/reference, semantic inventory and native Policy
generation tests. Their selected input, case, binding, normalization, closure,
observation and compatibility clauses cover the bounded task obligations.
The demonstrated import gap added two controlling sources: the pinned Node
module-hook declarations and the executor's subprocess failure contract. The
standard pack therefore ends with twelve sources. No product decision or
authorization is missing.

Runtime: local native. Adapter/delegation/handoff: none; strict handoff coverage:
not applicable. Reusable skill experiment: not applicable. Recovery inspection
was limited to failed fixture admission, directly required source bindings, and
pinned Node loader-hook declarations/capability probes for the demonstrated gap.
The definition → scaffold → implementation → native evidence sequence is retained.

The exact scope has 18 paths: Policy controls, extracted structural cases,
four shared Rule modules, semantic integration, the new test, capsule/configuration
and test registration, definition/scaffold, and three synchronized evidence ledgers.
All 96 earlier checkpointed paths outside this scope remain unchanged.
Scoped whitespace checks pass; STATUS and CLI-COMPLETION are synchronized.
The full R01–R18 denominator is unchanged; R01–R07 are complete, R08 remains active.
No domain-code generator, SFOL, AlchLang, product default, production provider, installation,
publication or admission changed.

Non-executing assessments reference existing construction authorization:

- Route receipt: `8c5e45d3baad6de48b994edc5fd8d7ce440f805c41802ba13f20ac5bcf0ac561`.
- Context result: `63b22adc105a00dd20fa6d10d2998209abdc70b82e3a4ef950bab2c355c4f392`.
- Effect result: `ad36430915b87a3072de82b77e20c45d8f500ec2da1e2a1246906df5151accc2`.

These receipts grant no authority. No new product decision is needed.
Next is independent State Machine verification under the existing contract:
closed state/trigger symbols, declared Rule guards, immutable reducer outcomes
and ordered output intents, without Event construction or Operation execution.
R08–R18 and the complete working-CLI goal remain active.

The non-executing continuation result
`c3e19248ceabaa417e8fb064266dfd2199d9fb648d93a713aa8ffee15bd0fe13`
selects `R08v-state-machine-semantic-controls`. Its gate references the same
existing construction authorization and grants no new authority.

## Standalone Rule semantic controls (R08t)

The [Rule-control definition](semantic-rule-controls-contract.json)
(`5a92d59563038bc72989be9b75bf18b87de51d203f9e75b3efc6cfedc44610e9`)
and `DSV2-SEMANTIC-RULE-CONTROLS` candidate scaffold precede this implementation.
The existing typed Rule and factory contracts and generated domain code remain
unchanged.

### Implemented behavior and coverage

Standalone Rule nodes now have independent finite semantic controls over
**structural facts**. These inputs do not require factory ownership, satisfying
factory invariants, or a production provider. An always-false Rule remains
testable even when no owned factory witness can be constructed. False is a valid
Boolean outcome, not a failed verification.

The source interpreter supplies expectations for exact UInt64 values and
representations, raw String equality/order, Boolean predicates and Rule
references. Cases distinguish Entity identity from full Value Object equality,
sum tags from payloads, optional absence from missing formal parameters, list
occurrences from set images, and first-representative list-to-set conversion.
Every declared formal parameter is validated even if its expression ignores it.
Optional data-field omission is normalized independently; malformed values,
duplicate set entries, invalid tags/payloads, extra/hidden/symbol/accessor fields
and nonplain/sparse arrays must produce the exact `TypeError: RULE_INPUT`.

The observer loads only the checked Rule module and its exact native dependency
closure. It constructs fresh plain data, compares Boolean outcomes or exact errors,
and checks descriptor-based input preservation and zero getter/coercion calls.
Factory-owned snapshots and structural Rule facts retain separate adapters.
Private recipe DAGs deduplicate transport without sharing the constructed objects
or removing cases. Tests verify backward-only recipe links and root-independent
case/pool determinism. This is verifier transport, not a new generated domain
runtime.

The unchanged bounds remain 4096 expanded fact recipes/cases per Rule, 65536
project cases, 8 MiB serialized controls, and the reference interpreter's 65536
visits/depth 64. Exceeding a bound retains the **entire Rule** as
`not_evaluable`; no partial Rule pass or discarded source node is permitted.
The complex sum-equality fixture deliberately remains a bounded-capacity case.
Other unimplemented adapters and cross-generator/composition behavior remain
explicit in the full source-node denominator. The public incomplete diagnostic
now describes evaluated nodes without incorrectly restricting coverage to
Calculations and Enums.

### Verification status

Focused native Rule tests passed **4/4** (session `76073`,
`106963.64534 ms`). These cover a factory-unsatisfying structural corpus,
Entity/value equality, exact named and inline sums, optional inputs, String
ordering, collection images, and 13 syntax-valid semantic mutants plus late drift.
Mutants change predicate results, Rule references, identity/value keys, integer
precision, first/last representative choice, list/set handling, sum payloads,
getter execution, input mutation, error classes/messages or Boolean carriers.
Every compiling semantic mutant is detected; late workspace drift invalidates
dependent evidence. Mutation isolation injects a Lean failure and is not reported
as a formal pass. Positive native tests use the real installed Lean.

Initial attempts exposed a complex corpus exceeding finite expansion and
serialized transport budgets, and an exact-integer mutant escaping the initial
sample ordering. The complex corpus remains explicitly unmet. Deduplicated
transport retains the richer cases within the same payload limit, and numerically
ordered adjacent exact-integer seeds expose precision loss. No product semantics,
case limit or assertion was weakened. One intervening test result was unavailable
after context recovery; it is not claimed as passing evidence. The focused
four-test rerun above supplied a complete observed result.

Final frozen-source serial regression passes **100/100 tests across 19 files**
(session `34849`, `605352.904369 ms`), with zero failures, cancellations or skips.
This includes the final recipe-DAG assertions and the existing factory, record,
sum, Enum, Calculation, CLI/API, composition, projection and execution checks.
Pinned source typecheck and all four materializer checks pass (session `66877`).
All 17 non-document paths remained byte-identical throughout and after the run.

The capsule now contains **48 sources**, digest
`f19735f9b1dede6604bd0e073d8ae0beb9e5d84277cd0e77a6536b5ff7a4892b`.
All 47 predecessor pins and reconstructed historical capsule checks remain.
The Rule test occurs once in the serial proof lane.

### Task Session, Context Builder and exact scope

Task Session bounded this unit to independent Rule controls, preserving the
definition → ontology scaffold → implementation → native evidence sequence.
Context Builder connected the structured Rule contract, source interpreter,
typed normalization and source-node coverage to the implementation obligations.
The standard context pack selected eight controlling sources: the R08 remaining-work
plan, structured Rule contract and explanation, typed normalization support,
value-expression renderer, independent Rule reference, semantic-control inventory
and verification executor. Their selected clauses cover Rule parameters/expressions,
identity/value keys, collection images, optional fields, exact errors, source pins
and native observer custody; every bounded task obligation has evidence.
No blocker-level decision remains. Runtime is local; adapter/handoff and strict
handoff coverage are not applicable. Gate: existing exact-scope authorization;
Decision Gate: not needed. Reusable skill experiment: not applicable. Recovery
inspection was limited to the finished test handle whose output was unavailable.

The 20-path scope includes three Rule implementation modules, their test,
semantic integration/diagnostic, four existing coverage tests, capsule sources,
the serial test registration, definition/scaffold and the three evidence ledgers.
All 89 earlier checkpointed paths outside this scope remain unchanged.
Scoped whitespace checks pass. STATUS and CLI-COMPLETION are synchronized;
the existing execution checklist correctly keeps R08 in progress.
No generator, product default, SFOL, AlchLang source, production provider,
dependency installation, publication or admission was changed.

Non-executing assessments bind existing user-authorized construction:

- Route receipt: `0946e73226ed26295f1f4fbb1ad6a3c11dfd6c2e420f8f58f2a2c2905411f5d1`.
- Context result: `c205f022f8174b87176bca5efebda1fa214522d3630ab7bd3f55977d99493895`.
- Original effect: `97b51f5429eb2daf7c8d6a90f333feb7bb6d88b247adcb56858aeae5a25fc26c`.
- Diagnostic scope amendment: `ee280c82555c45f0dbaa265b2ffd629cf88d5da0022f0a0847fd594f850c6e83`.

These assessments do not grant authority or complete the CLI.
The next bounded step is independent Policy semantic controls over declared Rule
references, preserving ordered first-match/default selection and selector-only
targets. R08–R18 and the working-CLI goal remain active; no new product decision
is missing.
The non-executing continuation result
`313cb82c6c7d0dc27c23baf1f458fdfa2ae65f97d025a26d5d5c1ae579f316ef`
selects `R08u-policy-semantic-controls`. Its gate references the same existing
construction authorization and grants no new authority.

## Explicit factory lifecycle semantic controls (R08s)

The [factory-control definition](semantic-factory-controls-contract.json)
(`d00e4d73c782b1aab880f6c0b14d9cd33828ece9a64cdbf846ace69faa76f8f8`)
and `DSV2-SEMANTIC-FACTORY-CONTROLS` candidate scaffold precede this implementation.
The existing factory v12 contract and generated domain code are unchanged.

### Implemented behavior and coverage

Entity and Value Object source nodes now have independent bounded lifecycle
controls: `create`, `reconstruct`, Entity `transition`, and explicit `extend`.
Shared owned-value recipes and observations serve these controls and the existing
sum adapter. Rule expectations still come from the separate source interpreter,
not native output or a generator used as its own oracle.

Every ordered prefix of distinct declared extension IDs is covered, including
the empty/base chain. Base validators run first; extensions follow application
order. Each chain requires a source-valid witness. Failure prefixes, normalization,
phase order, Rule closure/artifact hashes, frozen traces/results, snapshot fields,
component ownership/keys, identity-versus-value equality, clone/foreign rejection,
and caller-input preservation are observed. Extensions cannot mutate earlier
factory values, even when an invalid request throws.

Transitions reject unowned previous values before inspecting next fields, validate
next fields before identity, preserve the previous snapshot and return a fresh
snapshot on success. Optional omission normalizes to absence; hostile descriptors,
missing required fields, malformed values and nominal foreign components reject.
Inline sums, named sums, exact UInt64 and nested record/collection values retain
their own representation and ownership. Invalid construction of a named sum is
its sum adapter's obligation, not misreported as a factory normalization result.

The existing finite search limits remain: 4096 attempts per record/chain, 16
accepted witnesses and one rejection per observed validator prefix. Exhausted
chain/case/project/payload budgets and missing satisfying witnesses retain the
**entire factory** as `not_evaluable`. This is finite differential evidence, not
universal proof or a declaration that the domain is unsatisfiable. Standalone
Rule nodes, other unimplemented adapters, and cross-generator/composition
behavior remain explicit in the complete source-node denominator.

### Verification status

Initial combined source-capsule/factory/record/sum tests passed **16/16**
(session `65228`, `109757.447798 ms`). The added mixed inline/named-sum field
test passed separately (session `66926`, `14207.135126 ms`).
Pinned source typecheck and all four materializer checks pass on the frozen
source (session `99721`). Full frozen-source serial regression ran **96 tests:
95 passed, one failed**, across 18 files (session `24738`, `479187.433647 ms`).
The only failure was a pre-existing late-drift assertion still expecting two
tested nodes instead of three after the Entity adapter became ready. After that
one count was corrected, the entire affected semantic suite passed **6/6**
(session `75638`, `32844.083183 ms`). No failures remain unresolved; neither run
had skips or cancellations. All other 17 frozen non-document paths remained
byte-identical. This is a broad run plus an affected-suite rerun, not a claimed
96/96 full rerun. No implementation changed during or after the broad run.

Native tests use the existing pinned TypeScript image and real installed Lean,
with private workspaces and unchanged target checks. Nine syntax-valid lifecycle
mutants cover wrong reconstruction route, omitted transition identity check,
unowned previous acceptance, previous-snapshot reuse, reversed/dropped/repeated
extensions, lost trace freeze, and corrupted identity component linkage.
Late workspace drift invalidates dependent evidence. Mutation isolation injects
a Lean failure and does not claim a formal pass.

Initial test fixtures omitted required Value Object invariant references and
inline-sum ontology/cardinality metadata; source admission rejected them. They
were corrected to the installed schemas, without weakening admission. Exact
optional-property typing was fixed before the first native pass. These failed
attempts are not represented as successful product checks.

The capsule contains **47 sources**, digest
`0dbd2e023386c3c6141bb7889a9f4cdf2ed4dc9c0dbced3ab1ac1c39bc854453`.
All 46 predecessor pins remain unchanged, with reconstructed historical capsule
checks retained. The new test occurs once in the serial proof lane.

### Task Session, Context Builder and exact scope

Task Session kept this step bounded to factory lifecycle controls without
closing R08 or the working-CLI goal. Context Builder connected the existing
factory v12 lifecycle, explicit Rule bindings, owned-value algebra and native
observer to the required finite evidence. No handoff, delegation or reusable
skill experiment applies.

The scope is 21 exact paths: the original 20 plus the existing mixed-project
semantic regression whose expected ready count now includes its Entity.
All 82 earlier checkpointed paths outside that scope remain unchanged.
No generator, product default, language contract, AlchLang source, production
provider, dependency installation, publication or admission was changed.

Non-executing assessments bind the existing user-authorized construction:

- Route receipt: `7832f7524e7fd908451c3026ebc3fd671cf0553279a6a698c959f4fd039fcf85`.
- Context result: `bf252a42748dbbc8015baa40760926500d7df4d23031535e564288506d404d78`.
- Original effect: `3ff2326568708e0b152842097e278d07a78c755b464e11958686a6f89501374e`.
- Scope amendment: `ea20778fb54825c516445cb6646be09e76ef39ec5cdc4ffe4f246ad06f6d2c4a`.

Their gates reference existing user authorization; they do not grant it.
There is no missing product decision. R08–R18 remain active.
The non-executing continuation result
`421dc54214174380150d7440f7ec56edea86a76c44b25552ec88bbf2eb2257b1`
selects independent Rule semantic controls over structural facts next. Its gate
references the same existing construction authorization; Rule inputs must not
be confused with factory-owned snapshots or implicitly run factory validators.

## Owned record payload witnesses (R08r)

Historical R08r boundary; R08s above adds the separate factory lifecycle adapter.

The [record-witness definition](semantic-record-witness-contract.json)
(`a7302b5f05ec2d6ac0ee364662b99bc80291242960bb54629f8a319b4fb4c806`)
and `DSV2-SEMANTIC-RECORD-WITNESS` scaffold precede their implementation.
This successor extends the R08q execution boundary to explicit pure record
factories and their authored base Rules; it changes no generated domain code.

### Implemented behavior and boundary

Recursive sum controls now construct Entity and Value Object payloads, including
nested records and their optional/list/set wrappers. A separate source interpreter
evaluates checked Rule expressions and explicit factory field/path arguments
before native code runs. It preserves exact integers, ontology property paths,
Rule references, logical composition, collection predicates/projections, Entity
identity and Value Object equality. Rule facts do not acquire factory ownership.

Deterministic scalar/literal seeds feed complete record vectors, one-field
variations and a bounded Cartesian search. At most 16 satisfying witnesses and
one rejected probe for each observed base-validator failure prefix are retained.
The 4096-attempt ceiling counts duplicates too; Rule evaluation has explicit
visit/depth bounds. List-to-set conversion preserves the existing native first
identity representative; opposite input orders with unequal Entity state stay
observably distinct where the Rule subsequently reads that state.
No satisfying witness found is missing evidence, not proof
of an impossible domain. Capacity exhaustion retains the entire dependent sum
as `not_evaluable`; no variant or source node is erased.

The private observer executes the actual selected factories, compares source-
predicted validator order/outcomes/failure codes and construction phases, then
checks owned payload fields, keys, identity/value distinctions, recursive
freezing, clone/foreign rejection and deep caller-input preservation. Native
success never supplies the reference answer or chooses the source witness.
The existing restricted environment, native/Lean checks, byte inventories,
late-drift invalidation, unchanged-target and scratch-cleanup boundaries remain.

This proves bounded sum-payload construction, **not** complete Entity/Value Object
factory lifecycle or standalone Rule coverage. Create/reconstruct/transition,
extensions and broader behavioral controls remain subsequent adapter work.
No Operation/Workflow, datastore lookup, application service or publication runs.
The full R08–R18 and 39-cell CLI denominator remains open.

### Construction evidence

The initial combined source-capsule/Enum/sum/record run passed **13/13**
(`111850.527057 ms`, session `72353`). It includes real native/Lean execution
and six syntax-valid factory mutants: validator bypass, wrong failure code,
changed Entity identity key, collapsed Value Object key, lost field freezing and
caller-input mutation. Each fails semantic observation; late factory-file drift
invalidates dependent evidence. Mutation isolation injects a Lean failure and
does not claim formal success.

Review tightened duplicate-candidate enumeration and made Rule-evaluation
capacity causal unmet evidence. Both focused search/accounting checks pass
(session `52053`, `2715.672158 ms`). Final pinned typecheck and all four
materializer checks pass again on the final source (session `65943`). Broad serial
regression passes **91/91 across 17 test files**, with zero failures, cancellations,
skips or pending tests (session `98739`, `570877.434859 ms`). The last reference
correction was made during that run, before its record tests loaded. The complete
affected source-capsule/Enum/sum/record test set passed **15/15** after the source
was frozen (session `7404`, `110909.069066 ms`), with zero failures, cancellations,
skips or pending tests. These are the final-code affected checks; the broad run
alone is not claimed as that final-code rerun.

Review exposed a first-versus-last Entity representative discrepancy in the
new Rule reference. The new regression first failed (`false !== true`, session
`56993`), then passed after correction against both independent expectations
and compiled native Rule output (session `1603`, `7559.571652 ms`). Generated
Rules and the selected source contracts were not changed.

The initial typecheck caught exact-optional/narrowing errors and the not-yet-
updated capsule constant; those were repaired before the passing native run.
The definition's factory-contract link was corrected before implementation.
A failed patch-context match made no changes and was reapplied against current
lines. No failed attempt is represented as a successful run.

The capsule contains **46 sources**, digest
`94f256d391480159d30e81030f268d77f36a1e275d9f188b7828bddaa2cd89ae`.
All 45 predecessor pins remain unchanged; the capsule test reconstructs every
previously recorded checkpoint. The record test appears once in the serial
proof lane and not in the parallel lane.

### Task Session and Context Builder

Task Session selected the dependency-ready R08 record-witness step and kept
factory lifecycle, Rule coverage and cross-generator/composition checks explicit.
Context Builder linked the factory v12/fact-view contract, typed record/sum/Rule
algebra, collection and owned-value protocols, source bindings, current sum
observer and public native fixtures to source-derived witnesses, no hidden
effects, whole-node accounting and exact-scope preservation. No external runtime
handoff, delegation or reusable-sigil experiment applies.

The write scope is 17 exact paths; all 80 checkpointed paths outside it are
unchanged, with no scoped whitespace/final-newline defects. This is product
construction. The historical B15 local-compiler harness limitation is separate
operational residue and does not block the pinned candidate tests.

Non-executing assessments bind the existing user-authorized scope:

- Route receipt: `e5932363e703048abd177a204c802aa500147d1db92cfce57955f0a681b933a2`.
- Context result: `b456b2db06345dc178215955da9009dcf838d4a2a7de99b355be16f80bb047a9`.
- Effect result: `20bc73e85a068dab5ee967161f93efe21122b198f8605eb2ca2801f6ae77125f`.

These receipts grant no mutation or product approval. The existing user request
supplies construction authorization; no new product decision is required.
The non-executing continuation result
`2fdfb5ee821c37d9bf260d22c4993e6c35b82fc0d17d99bc5386d11f82902374`
selects the remaining factory and Rule adapters. Its consequence gate references
that existing authorization, with no unknown/protected effects or rejected
options. R08 and the complete working-CLI goal remain active.

## Recursive payload-sum semantic controls (R08q)

Historical R08q boundary; R08r above extends it for record payloads.

The [sum-control definition](semantic-sum-controls-contract.json)
(`41897da228c7d53f2fbb86535328ee6ddfcb381c832060268437f12fc9e697db`)
and `DSV2-SEMANTIC-SUM-CONTROLS` scaffold preceded implementation.

### Implemented behavior and boundary

Payload-bearing Enum controls now derive recipes and expected observations
recursively from checked source types. Implemented leaves are String, Bool,
exact UInt64, plain owned Enum cases and named sums; wrappers are optional,
list, set and inline sums. Every declared variant is represented. The reference
calculates normalized payload views, exact semantic keys, equality distinctions
and negative outcomes without calling the generated renderer or native code.

Cases preserve null-payload versus absent payload, explicit optional absence,
full-width integer representations, list order/duplicates and set canonicalization/
duplicate rejection. Named values require their exact owned component; raw,
cloned and foreign-module cases cannot become named values by matching shape.
Native observations check metadata, fresh-copy equality, baseline equality,
recursive freezing and descriptor-only deep input preservation. Getter and
coercion callbacks must not execute.

The restricted child constructs only sum/Enum recipes through the checked pure
component closure. Existing permission/environment/currentness/cleanup boundaries
remain intact. It does not execute record factories, inferred Rules, Operations,
Workflows, application compositions, servers, integrations or target publication.

A sum with any transitive Entity or Value Object payload remains entirely
`not_evaluable`, naming the required independent factory-witness adapter.
That preserves the existing requirement for explicit factory/Rule bindings;
no record, validator or variant is fabricated or dropped to obtain a pass.
The full source denominator also survives witness/case/payload capacity limits.
This is temporary missing verification coverage, not a reduction of the compiler's
supported payload types or the final CLI goal.

Cross-generator behavior, composition behavior and separate output-safety
qualification remain independent unfinished requirements. Finite test evidence
is not universal equivalence, complete runtime conformance or product approval.

The materialized capsule now contains **45 sources**, digest
`230ee3b8a5e295172216449865a51b2c9e9eba2f64896e5ecdc6373af789bb08`.
All 44 predecessor pins are unchanged; regression reconstructs the exact
44-, 43-, 42-, 41-, 40- and 38-source capsules.

### Construction evidence

The combined Enum/sum focused run passed **6/6**, with no failures or skips
(`77456.131408 ms`, terminal session `79890`). Real native/Lean execution,
unchanged target output, input preservation and owned scratch cleanup pass.
Ten syntax-valid emitted-code mutations change tag, payload, integer precision,
equality, ownership, list behavior, set duplicate rejection, freezing, getter
reads or deep input mutation. All are rejected by independent observations.
A separate late module drift invalidates dependent evidence. These isolated
mutation tests inject a Lean failure and do not claim formal success.

The strengthened capacity/accounting test passes independently (session
`29789`). It exercises recursive branch expansion while retaining every source
node and explicit unmet rows. Previous Enum tests now expect the implemented
scalar-sum adapter to run; record-dependent sums remain explicitly unmet in
the new fixture.

Initial source typecheck exposed a generic array-union inference error; an
explicit recipe type fixed it. The initial record-dependency fixture omitted
the required base validator; it now declares and binds a real Rule without
relaxing product validation. An intermediate unpinned test invocation loaded
the newly added native test without a Lean path and failed at harness setup.
It is not counted as a pass; the subsequent pinned native runs passed.
Final pinned source typecheck and all four materializer checks pass (session
`46376`). Final broad serial regression passes **86/86 across 16 test files**,
with zero failures, cancellations, skips or pending tests (`505928.550508 ms`,
terminal session `84610`). The proof lane registers the new sum test exactly
once; no parallel-lane registration was added. All 16 scoped files pass whitespace
and final-newline checks.

### Task Session and Context Builder

Task Session bounded this dependency-ready R08 adapter installment. Context
Builder linked the standalone-sum and field-sum contracts, typed-value decoder,
collection/exact-integer protocols, sum/Enum components, whole-project plan,
restricted executor and native fixtures to complete-node accounting and
source-derived outcomes. The missing factory-witness adapter remains explicit
construction work, not a product choice to remove record payloads.

Scope is 16 exact paths. All 76 checkpointed paths outside this scope remain
unchanged. Execution is local; no delegation, runtime handoff or reusable-sigil
experiment applies. The non-executing assessments are:

- Route receipt: `79aebc152ad7d83bf1b56eeb8d477b68e8e3913e70e80cfcdeae4af2b7e1304d`.
- Context result: `9449bcee83b64c462199b9a80b74a21e335d30d64c12935c193851611b172732`.
- Effect assessment: `1903b1e5ab8a28e7ceec37c9a9745a6299280329f0e072799e9445f298b40f44`.

Existing user authorization supplies the mutation boundary, not these receipts.
The non-executing continuation result
`802e90b9264ffa9b0c9a75feb02d3c5a860ae94ca229ab05bbab9ac59d3b30da`
selects the remaining semantic adapters. Its persistent-mutation gate references
the existing user authorization; there are no unknown/protected effects or
rejected options. It neither executes the next change nor supplies product approval.
R08 and the full working-CLI goal remain active. No new product decision is needed.
The historical B15 missing-local-compiler harness limitation remains separate,
not a compiler pass.

## Plain Enum semantic controls (R08p)

The [Enum-control definition](semantic-enum-controls-contract.json)
(`b42ff6607f4ddfdff572c226d46ab9210cd50801b56b4525815e8964d645deaf`)
and `DSV2-SEMANTIC-ENUM-CONTROLS` candidate scaffold preceded implementation.

### Implemented behavior and boundary

The existing semantic executor now includes plain Enum nodes whose checked
`domainspec.typed-sum/v1` variants all have null payload. It derives expected
wire entries, owned-case variants, equality truth tables and qualified key
framing from checked source declarations, independently of the renderer.
Component metadata binds the existing factory contract and exact definition
artifact. Provider composition checks definition ownership; component checks
reject raw strings, structural clones, accessor/coercion probes and foreign
module-instance cases. Equal wire strings do not imply equal owned cases.
Definitions, components, case collections and individual cases must remain frozen.

The adapter resolves exact owned exports and the forward native import closure
from the checked whole-project plan. It uses the existing permission-restricted
runner, minimal environment, timeout/output limits and final inventory checks.
This extends the R08o pure-code execution ceiling only to plain Enum controls;
application Operations, Workflows, payload construction, authored compositions,
servers, integrations and target writes remain excluded. No generated Enum
source, source contract, relationship, layout, profile or default was changed.

Every source node remains in the denominator. A payload-bearing Enum receives
an explicit missing-adapter reason; no payload is flattened to obtain a passing
plain-Enum result. Mixed projects retain tested evidence and their unmet rows.
The selected-generator requirement passes only when every source node has
executed passing controls. Cross-generator behavior, composition behavior and
separate safe-output qualification remain independent, unfinished requirements.
Finite observations are not universal proof or complete runtime conformance.

At the R08p checkpoint the source capsule contained **44 sources**, digest
`ba00aa51650f9f61b42ec9583d373660317962ad694fb80caac6f37f6336d8ca`.
The existing materializer generated it. All 43 earlier pins are unchanged;
regression reconstructs the 43-, 42-, 41-, 40- and 38-source capsules.

### Construction evidence

Three focused tests passed (`30964.802828 ms`, terminal session `52120`).
They cover same-named qualified Enums with a shared wire value, different keys,
module-root relocation, exact source membership, forged observation rejection,
payload-sum accounting, real native/Lean execution, unchanged target bytes,
and scratch cleanup. Native mutation tests install six changed compiled modules
(wire, bare definition, ownership, equality, key and freeze), plus a late
component-file drift. The final controls also require each altered JavaScript
module to pass an independent syntax check, then require the specific ownership
or observation failure. Every mutant is rejected; late drift invalidates dependent
semantic evidence. Mutation tests explicitly inject a Lean failure to isolate
their semantic controls and do not count it as formal success.

An earlier five-test preparation run (the initial pure Enum test plus four
source-capsule tests) also passed. Pinned source typecheck and all four
materializer checks passed (terminal sessions `91522` and final `55210`).
Final serial regression passed **83/83** across fifteen suites, with zero
failures, skips or cancellations (`522026.217738 ms`, terminal session `87845`).
It includes the strengthened syntax-valid Enum mutation checks, Calculation
controls, complete composition verification, source/snapshot/API/CLI entry
points, prior executor/projection checks, source-capsule integrity, public
build/instantiation/layout/output and legacy CLI behavior. The new suite is
registered once in the serialized proof lane, not in the parallel lane.
All fourteen scoped files pass whitespace/final-newline checks.

### Task Session and Context Builder

Task Session selected this dependency-ready R08 adapter installment. Context
Builder linked complete-node accounting and restricted execution to the existing
typed-sum decoder, plain/algebraic Enum planner, owned-case component, runtime
provider, source capsule, native fixtures and R08 exit criterion. Payload-aware
adapters remain distinct work, not a changed product choice. Execution is local;
no delegation, runtime handoff or reusable-sigil experiment applies.

Scope is 14 exact paths. All 73 previously checkpointed paths outside this
scope remain unchanged. The non-executing assessments are:

- Route receipt: `2e80543eb7c42ae02089feb6c6096483aead28bdb3f3c26289257a84454ebb87`.
- Context result: `7c6092d576b465e1a9c66b832c2b719a70fcc54656048ab9050d81ae31c7e80f`.
- Effect assessment: `a26c5072c9362246bbdc65689bae55111c49ed90bccf868b9b73c429de95b3a4`.

Existing user authorization supplies the mutation boundary; these assessments
grant no authority. R08 remains in progress, with no new product decision needed.
Continuation assessment `e7257393ed6d642d654a4abe6b1a43c5d567fdd7b1d9f57aab6e4fce4ebb822d`
selects the remaining semantic adapters, with no unknown/protected effects or
rejected option. The existing execute-until-important-decision authorization
remains in force; this checkpoint completes R08p, not R08 or the working CLI.
The historical B15 missing-local-compiler harness limitation remains separate,
not a compiler pass.

## Independent Calculation semantic controls (R08o)

The [semantic-control definition](semantic-controls-contract.json)
(`9b8f46e65427dbc0b94b5ea56606f4a70f9482ef861271696f89a24d25441982`)
and `DSV2-SEMANTIC-CONTROLS` candidate scaffold preceded implementation.

### Implemented behavior and boundary

The selected executor now prepares independent differential cases for every
checked Calculation-v1 or Calculation-v2 node. A recursive source-expression
oracle calculates expected UInt64 results and exact failures without calling
the generator or its arithmetic helpers. Cases cover full-width values,
intermediate overflow/underflow, left-to-right failure precedence, all three
division modes, unused inputs, input representations and malformed properties.

Only the checked Calculation modules and their forward native import closure
are emitted into a private workspace. A pinned Node 26.8.1 child runs the fixed
case runner with filesystem read permission confined to that workspace, no
filesystem-write/network/subprocess permission, and only `LANG`/`TZ` environment
variables. This is a bounded pure-code control, not a general hostile-code
sandbox claim. It never executes application Operations, Workflows, authored
compositions, servers or production integrations. The earlier R08n no-domain-code
execution ceiling is superseded only for these pure Calculation controls.

Exact case/runner/configuration bytes, module inventory and final hashes bind
the observed results. The verifier rejects altered results, omitted/reordered
observations, getter reads, input mutation and late workspace drift. Late drift
invalidates both fully covered and partially covered semantic evidence.
Node, case and payload budgets are explicit; capacity-exceeded nodes remain
unverified rather than disappearing.

Every source node remains in top-level `semantic_coverage`, including early
failure reports. Adapter readiness is separate from executed/passing evidence.
Mixed projects retain explicit `not_evaluable` rows for other metatypes even
when their Calculation controls pass. A fully Calculation-only fixture passes
the selected-generator check but remains `incomplete` because cross-generator
behavior and separate safe-output qualification are still unmet. Composition
behavior remains unmet where applicable. Finite cases are not universal proof
or complete runtime conformance.

At the R08o checkpoint the generated capsule contained **43 sources**. Its digest is
`775c20cdc0b2671213b22bec1251fc90dc19ed18673bd87278183a36d84606e1`.
All 42 earlier source pins are unchanged; regression reconstructs the exact
42-, 41-, 40- and 38-source capsules. The existing materializer produced it.

### Construction evidence

The focused native controls exercise real generated v2 calculations, the v1
calculations in the existing mixed project, a compiling arithmetic mutant,
denied write/read/network/subprocess attempts, altered runner/cases/modules,
extra workspace entries and native-source drift before emission. The positive
native test runs the real Lean validator too; isolated semantic-failure tests
explicitly inject a Lean failure and do not claim a formal pass. No timeout was
increased and no test was skipped. The proof lane registers this suite once.

Final regression passed **80/80** across fourteen suites, with zero failures,
skips or cancellations (`332431.165401 ms`, terminal session `93888`). The six
semantic-control tests pass, including early-failure coverage accounting; the
remaining suites cover stronger source/snapshot/API/CLI entry points, complete
composition verification, prior executor/projection controls, source capsules,
build/instantiation/layout/output integration and legacy CLI behavior.
Pinned TypeScript source typecheck and all four materializer checks pass
(terminal session `67222`). Scope is 13 exact paths; all 70 previously
checkpointed paths outside this scope remain unchanged. The historical B15
missing-local-compiler harness limitation remains separate, not a compiler pass.

### Task Session and Context Builder

Task Session bounded this installment to the next runnable R08 semantic control.
Context Builder linked complete-node accounting, checked source contracts,
resolved module ownership, currentness and existing native execution fixtures.
The tools did not reopen product choices or authorize production effects.
Execution is local, with no delegation or runtime handoff.

- Route receipt: `458855f5f3be51805ba827ec3ad9475792a1989bd0a00284c38b031ffbb93890`.
- Context result: `8593d1b2ec0302dd45f4e5ce43ad8a118fd12a5d76b72e4b7c599195792756e4`.
- Effect assessment: `17d15db88e7309386072a8a23cbabfa3648024162ff5a3dae292c683f4920b30`.

These are non-executing candidate assessments; existing user authorization
supplies the mutation boundary. Remaining semantic adapters, cross-generator
controls, composition behavior and safe-output qualification remain work.
R08 and the working-CLI goal stay in progress; no new product decision is needed.
Continuation assessment `0b7f158e7ff05cb0e9bc095433284ab7388a4a1e2a355e8d9c5410a84c22a63e`
selects the remaining semantic adapters. It records the existing persistent-
mutation boundary, with no unknown/protected effects or rejected options;
the user's execute-until-important-decision authorization remains in force.

## Stronger verification entry points (R08n)

The [entry-point definition](verification-entrypoints-contract.json)
(`dc29a6a22b60a3bce1b9fb3471ff6ee3e1312377d93cac24e12f143ad9b70f40`)
and `DSV2-VERIFICATION-ENTRYPOINTS` navigation scaffold preceded the
implementation. This joins the existing R08m executor to public entry points;
it does not replace missing semantic controls with currentness checks.

### Implemented behavior

Explicit source verification, checked-snapshot verification, the selected
`verifyProject` overload and selected CLI `verify-project` now share the same
complete executor report. Selection and closed tool options are checked before
source access. Snapshot planning uses the registered graph; executor currentness
checks reject stale source rather than silently refreshing it into another plan.
The public package exports both new wrappers and the existing `verifyProject`.

The opt-in command accepts this shape (all paths are normalized absolute paths):

```text
domainspec verify-project /source/project
  --compilation-selection /config/selection.json
  --target-root /existing/output
  --typescript-root /toolchain/node_modules/typescript
  --node-type-root /toolchain/node_modules/@types
  --lean-executable /toolchain/lean/bin/lean
  [--output-layout domainspec.application-layout/v1]
```

The tool paths select the existing pinned local-validator boundary, not
application commands. Unknown, duplicate, missing and relative options reject.
The command emits one complete execution report on stdout: `pass` exits 0;
`fail` or `incomplete` exits 1. Invalid inputs retain the diagnostic envelope.
The plain and explicit application layouts use the existing exact output
views/receipts. The selected layout is bound into the report and currentness
evidence; there is no inferred layout or fallback to a different target view.

At this checkpoint the new selected path did not execute generated code. R08o
above adds bounded pure Calculation controls; target writes and application
behavior remain excluded. The existing two-argument legacy API and command retain
their existing behavior. Reconstructing the legacy file after removing only the
new imports and opt-in branch yields its exact prior hash:
`bf7770f8c2a79a8d162c9b71c69ac8aa39646962a674def08eb5f6ad48aca736`.

At the R08n checkpoint the compiler capsule contained **42 sources**: the new entry-point definition
plus all 41 earlier unchanged pins. Capsule digest:
`507f300f1e00d72a7f60bf16f21910c57a5cff85e0a2fc8b79e80901f499e13d`.
Regression reconstructs the exact earlier 41-, 40- and 38-source capsules.
The existing materializer generated the capsule; no generated mirror was
hand-edited.

### Verification boundary

A positive composition run still reports `incomplete`, with four explicit
unmet requirements: selected-generator semantic controls, cross-generator
behavior, composition behavior controls and separate safe-output qualification.
Without a supplied target, output currentness is also unmet. Native compilation,
JavaScript syntax/surfaces and Lean preservation are not substituted for these
requirements. R08 and the full working-CLI goal remain incomplete.

### Construction evidence

The first tests failed at the absent source/snapshot API exports and selected
command guard. A later check exposed the missing existing public `verifyProject`
export; it was added. An intermediate test supplied an explicit JavaScript
`undefined` property to the closed JSON options contract; that fixture was fixed
to omit the optional layout, without weakening input validation.

Four new tests cover source/snapshot/overload/CLI report equivalence, stale
snapshots, malformed input, wrong layout, native execution and unchanged targets.
The native test compiles the public package and real CLI with pinned TypeScript,
checks emitted declarations (including rejection of a legacy pass-only receipt
assignment), runs the snapshot API against plain output, and launches the actual
CLI against application output. Both exercise real native and Lean validators;
owned scratch directories are empty afterward.

Final regression passed **74/74** across thirteen suites, with zero failures,
skips or cancellations (`280602.989414 ms`, terminal session `72609`).
Coverage includes the new entry-point suite, complete-composition and existing
executor/projection checks, source-capsule integrity, public build/instantiation/
application-layout/output, checked bindings, and both selected and legacy CLI
regressions. Pinned TypeScript source typecheck and all four materializer checks
passed (terminal session `27961`). The new native declaration checks pass.
The new suite is registered once in the serialized proof lane; scoped whitespace
checks pass. The historical B15 missing-local-compiler harness limitation remains
separate, not counted as a compiler pass. This completes R08n, not R08 or the CLI.

### Task Session and Context Builder

Task Session selected one dependency-ready R08 integration unit. Context Builder
linked the R08 exit criterion to the complete executor, selected output views,
legacy API, CLI parsing, public exports, source capsule and their regression
fixtures. These sources cover selection-before-effects, entry-point equivalence,
complete evidence accounting, compatibility and no target mutation.
Runtime is local with no delegation, adapter or runtime handoff; strict handoff
coverage and experiment harness are not applicable. No product choice was reopened.

Scope is 17 exact paths. All 62 previously checkpointed paths outside this scope
remain unchanged. The route, context and effect assessments are non-executing
candidate evidence; existing user authorization supplies the mutation boundary:

- Route receipt: `cb3704bfab084c80c6f6720ef06776721e773057493308e64becb1c9d80e5171`.
- Context result: `fb436bbcec9939c4c863fd5fc889d1988fec77b1e900e1b896708b5bc8a1a045`.
- Effect assessment: `fe540f5014b4b0b89e5ceae42d57b7ca579c145cff7a4c0647d515765d541095`.

Continuation assessment `8539d941e5dc29635c7e2cb8c4276f151b5caeaed0348958939772422fbc8941`
selects the required semantic controls. It records the persistent-mutation
boundary with no unknown/protected effects or rejected option; the user's existing
execute-until-important-decision authorization remains in force. The goal stays
active, with no newly required product decision.

## Complete verification artifact coverage (R08m)

The [coverage definition](verification-artifact-coverage-contract.json)
(`c7215a92397f886934b5a0534dd3fc4a6d5176931ccb5ddd32e2034615328bcc`)
and `DSV2-VERIFICATION-ARTIFACT-COVERAGE` navigation scaffold preceded
implementation. This is candidate product construction, with no authority effect.

### Implemented behavior and claim boundary

The public verification projection now retains the registered composition plan,
exact source and bindings, every emitted artifact, and every required check.
Planner ownership partitions artifacts into TypeScript modules, generated
JavaScript behavior, and preserved data/provenance. Missing, duplicate and
unaccounted files reject. Complete and per-category counts remain explicit.

The executor replays the complete source and compares the complete plan and
artifact inventory. In a private workspace it strictly compiles TypeScript,
syntax-checks every JavaScript behavior module without executing it, and
independently observes both languages' import/export surfaces through the pinned
TypeScript AST. JavaScript type checking is explicitly not claimed. Supporting
files receive byte-preservation and inventory checks, not a compilation claim.

The existing Lean structural predicates retain their meaning and scope. Their
source/selection round trip now preserves the complete composition-bearing
graph; this is not a new composition-execution theorem or SFOL change.
Composition preservation and selected Calculation bindings have explicit checks
and dependencies. Late source, workspace, tool or JavaScript drift invalidates
dependent passes. No generated behavior, provider or target publisher runs.

With a matching existing plain output, the positive composition execution result
is correctly `incomplete`: selected-generator semantic controls, cross-generator
behavior, composition behavior controls, and separate safe-output qualification
remain `not_evaluable`. Without an output target, output currentness is additionally
unmet. Domain-only verification retains its existing unmet semantic obligations.
At the R08m checkpoint the stronger CLI `verify-project` path remained guarded,
and application-layout target selection remained work. R08n above implements
both explicitly while retaining the unmet behavior requirements.

The compiler capsule contains **41 sources**, adding only the coverage definition
to the unchanged prior 40 pins. Capsule digest:
`e78a8327a1dddf79824800e7208b96d31b5d577c72217f901649445d7b6c445c`.
Regression reconstructs the exact previous 40-source and 38-source capsule
digests. The existing materializer produced the generated source capsule.

### Construction evidence

The new projection test first failed at the previous composition guard, then
passed after implementation. Three new tests cover full source/binding/inventory
retention, resealed omission/substitution, native compilation and observation,
real Lean preservation, and four hostile cases: invalid JavaScript, changed
exports, late supporting-file drift, and an unexpected workspace file.
The positive test rejects attempted behavior execution and checks that the
existing target remains unchanged; owned workspaces are cleaned.

The final ten-suite regression passed **50/50**, with zero failures, skips or
cancellations (`148220.276428 ms`, terminal session `62508`). It includes the
new composition suite plus source capsule, checked composition bindings, public
project/build/application-layout/instantiation/output, projection and existing
executor regression. Pinned TypeScript source typecheck and all four materializer
checks passed (terminal session `33256`). The new proof suite is registered
exactly once in the serialized proof lane. The shared composition fixture was
extracted without changing its four original helper bodies.

All **58 previously checkpointed paths outside this 16-file scope** retain their
exact hashes. The historical B15 missing-local-compiler harness limitation is
unchanged and is not counted as a passing compiler check. This completes R08m,
not R08 or the working-CLI goal.

### Task Session and Context Builder

Task Session selected this one dependency-ready unit and preserved definition,
navigation scaffold, implementation, native tests and evidence order. Context
Builder bounded inputs to the complete public plan, composition binding
requirements, projection/executor, source capsule and their test fixtures.
No product decision was reopened. Runtime: local, no delegation or adapter;
handoff and experiment harness: not applicable. Exact mutation scope: 16 paths.
The route, context and effect assessments are non-executing candidate evidence:

- Route receipt: `0896306a060f2cbcfd68b8fa82c38949c42c9dddce86b4c572bcf8edaae9b598`.
- Context result: `3f8b9e386255906ac566f2c7678fab0f797cdffd7a57442b4c8858ba02add606`.
- Effect assessment: `3587d52eb5cfb8afd763f460970abc5118b3fe38ec6deea67436427b298cbf7a`.

Continuation assessment `1a58842c27c78b53584eb3b46dc9f30cd3e34de6c2a7fbcaf378f6dd21221e1f`
selects continued stronger project verification. It identifies the existing
persistent-mutation boundary, with no unknown/protected effects or rejection;
the user's existing execute-until-important-decision authorization still applies.
The goal remains active. Scoped whitespace/diff checks and exact single proof-lane
registration pass; no independent experiment harness applies to this CLI unit.

## Public composition integration (R08l)

The [integration definition](public-composition-integration-contract.json)
(`83a221975d11b41d34b578b5b848ff06e30cbaf0d8f651277f12b5cf55506080`)
and `DSV2-PUBLIC-COMPOSITION-INTEGRATION` navigation scaffold precede
the implementation. This joins the previously isolated R08j adapter to public
reconciled planning and output; it does not introduce a second renderer.

### Implemented behavior

The public project plan retains the unchanged R07 domain artifact plan and
adds the registered composition binding plan, including exact source/provenance,
core bindings, adapter modules and artifacts. All existing whole-project field,
factory, Operation and Workflow requirements still apply. The current project-v2
source profile still requires exactly one function composition. Unsupported
targets reject; this TypeScript lane does not fall back to Rust or legacy code.

The common whole-project artifact view includes the exact domain and composition
files and checked adapter imports in deterministic path order. Node views retain
only their forward native domain import closure; application consumers are not
pulled into a domain node merely because they call it. Source/snapshot build,
project/node instantiation and CLI build/currentness paths consume these views.
Both plain and explicitly selected application layouts carry every composition
artifact; the application envelope applies one common path prefix without
rewriting content or import specifiers.

Composition records remain structural bindings. Independently selected domain
factories are generated normally, but composition planning does not call them or
invent automatic invariant enforcement. No endpoint, provider or authored
behavior is executed by planning/publication.

At the R08l checkpoint the compiler capsule contained **40 sources**: the prior 38 unchanged pins,
the existing checked binding definition and the new public integration
definition. Capsule digest:
`eaf78f2b1b32e1040dfa22946dd97e04c14721696ef733b9208cc3f9dfb2193f`.
A regression reconstructs the exact predecessor capsule digest
`264d06e7b1d54b830b70806f98ff511bf42d1dcade0dbfe0c0d9358b2078acd4`.
Generated capsule bytes come from the existing materializer, not hand edits.
Public binding metadata types are now exported so declaration emission can name
the complete plan shape.

### Verification boundary

Output receipts include every composition artifact. Currentness checks reject
changed, missing and surplus files. That is not composition semantic assurance.
At the R08l checkpoint the stronger projection, formalization and execution path
rejected composition-bearing plans rather than verifying only the domain subset.
R08m above supersedes that API guard with complete artifact accounting and
explicit unmet behavior checks. R08n above subsequently replaces the selected CLI
guard with the complete executor report, including nonzero incomplete results.

### Construction evidence

The new public fixture first reached the old public composition rejection after
correcting its Operation version/guard declarations to the existing input
contract. Native behavior then passed for the complete published TypeScript
output in both layouts, using read-only source mounts and pinned TypeScript
7.0.2. Tests exercise two same-named cross-feature Calculations, canonical Value
Object binding, renamed arguments, exact full-width UInt64, underflow/overflow,
source removal after snapshot, API/CLI receipt equivalence, node/project views,
unsupported targets, fabricated plans and no-write rejection.

A preliminary eight-suite run passed 39/40 in 112.230 seconds. Its sole failure
was an exploratory fixture with two compositions: the unchanged source profile
rejects that input. The fixture now asserts that established rejection instead
of expanding the product. An earlier test also used the wrong Rust runtime
label; it now uses the actual accepted source contract to test the public
unsupported-target boundary. No source schema was relaxed.

Pinned source typecheck and catalog/relationship/integration/source-capsule
currentness checks pass. Final ten-suite regression: **55/55 pass**, zero
failures/skips, **343.030 seconds**, on the final implementation and test bytes.
The suites are `resolved-composition-bindings`, `reconciled-sources`,
`reconciled-project`, `reconciled-build`, `reconciled-application-layout`,
`reconciled-instantiation`, `reconciled-output`, verification
`reconciled-projection`, formalization `reconciled`, and verification
`reconciled-execution`. This includes native declaration/relocation checks,
Lean 4.33.1 structural proof and hostile mutants, and the existing executor's
source/tool/output-currentness controls. The executor correctly retains its
three unimplemented checks as `not_evaluable`; passing its regression does not
mean the project received complete semantic verification. Scoped whitespace
checks pass. R08l is complete; R08 and the full CLI goal remain active.

### Scope and continuation

Task Session selects R08l as one ready construction unit. Context Builder uses
the R08 exit contract, public compiler/view, checked binding adapter, source
capsule/materializer, output/layout/build/instantiation boundaries, verification
projection and their exact tests. These cover integration, provenance,
compatibility, no-write rejection and native-output obligations. No runtime
handoff, delegation or experiment harness applies. No blocker-level product
decision is needed; no admission, release, publication, provider execution or
default cutover is included.

Route receipt:
`aebc38027f00051c942f56c0c5b6d321cefae2d7410c5c5163a37e8a9e2e1456`.
Context result:
`becc88ba0cb453a03aa75f0240f5ff31aaa4d197dd026faddf8bbf7f2ca30435`.
Initial exact effect assessment:
`f574b5631a750b3d14f6aea9556ca8d717d5904dbbf8f8bf7a8253859d6bbffb`.
Public declaration type extension:
`2a9623722e9565488adc865f60343ed639de70c4b4453c263d1d628a77caf379`.
The 13-path scope preserves all 56 prior checkpoint paths outside this unit.

Remaining work is stronger verification, including composition-aware evidence,
then the outstanding R09–R18 matrix. The legacy B15 hardcoded local-TypeScript
harness issue recorded in R08k remains separate and is not reported as fixed.
The full working-CLI goal is not complete.

Continuation result:
`de605fe6ddc4dc9624b1917e9eb74f6f85a77d9ccceca1284284e6aaf2f1bbc9`.
Stronger project verification is admissible under the existing user execution
request, with no unknown/protected effects or rejection reasons. The
consequential gate is not a newly missing user decision.

## Input-boundary repairs (R08k)

The [repair definition](input-boundary-repair-contract.json) and
`DSV2-INPUT-BOUNDARY-REPAIR` candidate scaffold precede the implementation.
This resolves the two input defects recorded below in R08j; it does not
activate the public composition path.

Relationship lookup uses local edge ID plus feature/project ownership and
requires exactly one match before checking endpoints, predicates and obligation
identity. Existing unambiguous evidence keeps its original IDs. Collisions use
`feature:<feature-id>:<edge-id>` or `project:<edge-id>` for finite edge and
witness identity; authored source IDs and graph relationships are unchanged.
The independent Lean interchange decoder derives this mapping itself.
Copied edge objects and reversed relationship arrays preserve identity.

Canonical `Value Object` now passes the existing composition record-kind
boundary alongside the legacy direct-adapter spelling `ValueObject`.
Graph identity and invariant-reference checks remain unchanged. Records remain
structural bindings; this adds no factory call, automatic invariant validation,
new metatype or relationship signature.

The explicit [v9 source selection](configuration-input-boundary-sources.json)
pins the changed parser and five repair support sources. It is bound to
immutable v8 digest
`0f6ecd3f707f218b26482245564337ea9c6c32c222bb7911609180890907a184`.
Earlier selections still reject source drift. Existing generator/profile
defaults, historical evidence and the public composition guard are preserved.

### Repair validation

Before repair, the paired focused suites failed three of nine tests on
duplicate local edge IDs. An isolated canonical Value Object fixture also
failed at the composition record-kind check. After repair, the same nine
tests passed; the subsequently added Lean test passed 4/4 identity-suite
tests, including generated proof compilation and an independently decoded
interchange with a resealed hostile endpoint substitution.

Final-byte source selection tests pass 12/12, including missing/drift controls
for every new support pin. Pinned TypeScript 7.0.2 source typecheck passes,
including all generated catalog and 38-source-capsule currentness checks.
The identity suite is registered once in the serialized proof lane.

The eight-suite broader run passed 183/184 in 477.600 seconds, with no skips.
The remaining `B15 generated corpus has no hidden runtime skips` test
cannot launch its hardcoded checkout-local `impl/node_modules/.bin/tsc`;
its subprocess has no exit status. This is an unresolved legacy harness
failure, not a passing all-language compiler result. No dependency directory
or workaround symlink was added to the checkout. That broad run preceded the
final helper-object-identity control and decoder support-pin addition;
final focused evidence is recorded separately below.

Final-byte three-suite regression: **14/14 pass**, zero failures/skips,
**244.278 seconds**, covering `relationship-identity`,
`resolved-composition-bindings`, and the existing `assurance/certify` suite.
This includes pinned Lean 4.33.1 proof and independent decoder execution,
the existing twelve hostile decoder mutations, the complete legacy
13-type/17-relationship certification corpus, exact unambiguous graph,
certificate and finite-projection baseline hashes, and native composition
behavior in two roots. It does not erase the separate B15 harness failure.
Scoped whitespace checks pass.

### Scope and continuation

Task Session and Context Builder kept this a definition-first prerequisite
repair with exact source boundaries and explicit negative controls.
ARE route digest:
`fcf8739c63b3b774c796cc4b488c42086d6bd2894546d471949bfc80e143ae9f`;
context result:
`86ccab50a177637aa0827cf37441ea2acd65d34828d53f91f5390ffbb02aa863`.
Initial effect assessment:
`bd3b7624c8faa4eb7356b30284d6d29b0a56427a8aa28514c652722ef8e78a24`;
decoder scope extension:
`a807756da0a28f3aeb15cad71851c4bbf0b0684d1a2bc1ab09b0d28fde653f78`.
These are candidate routing/effect evidence under the existing execution
request, not admission or publication authority.

The 19-path scope preserves all 48 previously hashed paths outside this unit.
No blocker-level product decision, delegation or operational handoff is needed.
R08 remains in progress: integrate the checked composition adapter through
public source/snapshot/output paths, then complete stronger verification.
R09–R18 and the full 39-cell/installable-product outcome remain outstanding.

Continuation result:
`da77c0399bc990892eab33193604b0eb753378830d8fee5a6ce1d9fce5bdcf7e`.
The next public composition integration option is admissible under the existing
user execution request, with no unknown/protected effects or rejection reasons.
The consequential gate is not a newly missing user choice. This completes R08k,
not R08 or the working-CLI goal.

## Checked application composition bindings (R08j)

The [binding definition](resolved-composition-bindings-contract.json), digest
`c7c0cf577e372c3036e6ec567fb2e36855f16b723ff1298647739f24c171c388`,
and `DSV2-RESOLVED-COMPOSITION-BINDINGS` scaffold define an additive R07
binding planner. `planResolvedCompositionBindings(graph, resolved, definition)`
requires registered, unchanged inputs with the same full graph certificate and
source manifest. It does not fabricate a smaller graph or remove compositions
to bypass the public compiler guard. A partial R07 native selection is permitted,
but every Calculation used by the checked composition must be selected.

Existing composition source, compiled behavior, ontology, dependency graph,
boundary model and provenance files remain byte-for-byte unchanged. A new
`compositions/<id>/core-api.ts` implements the calculation API already consumed
by `behavior.mjs`. Each authored alias resolves to the exact qualified selector,
selected calculations-v1 generator request, public callable, target path/hash,
and ordered authored-argument-to-core-field correspondence. This is not lookup
by local basename. Record bindings remain structural/provenance bindings:
no factory invocation or implicit invariant enforcement is added.

The generated adapter imports only checked Calculation modules, renames inert
argument data, and preserves native exact UInt64 results and declared arithmetic
failures. Unknown aliases, missing/extra/symbol/accessor/nonenumerable arguments
reject. It does not evaluate authored expressions, integrations, endpoint
launchers, Operations or transactions during planning. The checked source
profile still admits exactly one composition and retains its existing v1
core-binding restrictions; no Calculation-v2 coercion or new relationship is
introduced. Rust-target compositions reject in this TypeScript adapter.

The binding plan freezes and hashes its artifacts, definition bytes, input
identities, ordered bindings and native import/export inventory. Serialized
evidence must reconstruct exactly from checked inputs; recomputing a forged
digest cannot revive it. Unsafe paths and combined exact/case/file-directory
collisions reject. The original resolved native plan and bytes stay unchanged.

### Current evidence and limits

Five new tests cover nonempty core record bindings, two same-named Calculations
in distinct features, renamed ordered arguments, exact numeric boundaries,
native subtraction/addition distinctions, failures, legacy/direct-JSON provenance,
source relocation, stale/foreign/fabricated inputs and hostile evidence. The
native fixture compiles exact generated files from a read-only input mount using
the pinned TypeScript 7.0.2 image and runs unchanged behavior against the compiled
adapter in two module/output roots. It checks source hashes after compilation;
it does not repair generated input. This is isolated candidate evidence, not a
production provider run or a complete semantic-assurance receipt.

Final six-suite regression: **39/39 pass**, zero failures/skips, **66.574 seconds**.
Suites: `resolved-composition-bindings`, `configured-calculations`,
`resolved-artifact-plan`, `reconciled-project`,
`reconciled-application-layout`, and `project-composition`, under
`test/generation/`. This includes all eleven existing composition tests and
native Rust legacy regression. Source typecheck and generated-catalog/source
currentness checks pass. The new suite is registered once in `test:parallel`.
The full repository test command and later parity/install lanes are not claimed
by this focused run.

Two preliminary fixture runs failed before adapter assertions: the first used
an empty composition list with the project-v2 schema; the second exposed the
existing duplicate-local-edge witness issue below. The fixture now declares its
initial domain-only graph as project-v1 and uses distinct edge IDs. This does
not weaken the same-local-name Calculation test or change parser behavior.

Task Session followed definition -> navigation scaffold -> authored fixture ->
implementation -> native controls -> synchronized evidence. Context Builder
selected R08's exit contract, the composition validator/ontology closure,
declarative Calculation call seam, checked composition boundary, R07 resolved
request/module inventory, Calculation-v1 emitter, and the existing public
output/verification guards. These sources cover the bounded binding obligations.
No delegation, new product choice, operational approval, release, source-capsule
change or default cutover occurred. The legacy public composition guard is
explicitly tested and remains in place.

- Route receipt: `a3321abfd6a5efa00b93773d3ed1ede91c226441261654c00f7dc8bcdc420d7d`.
- Context result: `fb5830df37c8757da7c38f17e22f5853c3ba21beac7e3bdbf75c08b86c301212`.
- Exact implementation effect assessment: `ca7b5336697c9caca812dc647fe4f63c298d41c94bce16410149ab8719533d36`.
- Exact test registration assessment: `1c49349e09945619a2bae4f64daca203d7fe5e538de4ee99e0eb83d5c105dc12`.

### Follow-up without changing agreed semantics

The two input-boundary observations in this historical R08j subsection are
resolved by [R08k above](#input-boundary-repairs-r08k). Public adapter integration
remains outstanding.

The fixture reproduced a pre-existing graph defect: equal local edge IDs in
different features resolve through `relationships.find(edge_id)` in
`evaluateCompiledObligationWitness`, so the second witness can bind the first
feature's endpoints and fail. The active parser bytes were not edited in this
unit. Preserve this reproducer and repair qualified edge identity in its own
bounded input-boundary unit; distinct fixture IDs are not a claim that it works.

Source inspection also found that `compileProjectComposition` accepts the
legacy spelling `ValueObject` while checked graph nodes use `Value Object`.
The new positive fixture uses an Entity; it does not establish Value Object
composition coverage. Verify and repair that normalization mismatch with focused
regression before claiming full authored core-record integration.

Next R08 work must consume the binding plan through public source/snapshot/CLI
builds, bind its definition into the compiler source bundle, account for every
composition artifact in plain/application layouts and currentness receipts, and
extend verification/formalization inputs rather than silently omitting the new
artifacts. Selected stronger `verify-project` remains guarded. R08 and the
working-CLI goal are still in progress; R09–R18 remain required.

## Explicit application output layout

The [layout extension definition](reconciled-application-layout-contract.json),
digest `b226e6236b37674bcba3cf7e5481e361f7899ccb7eb95ba31baa1e12f21d138d`,
and `DSV2-RECONCILED-APPLICATION-LAYOUT` ontology scaffold cover the next additive
R08 product-construction unit. The existing `domainspec.application-layout/v1`
output-layout parameter is now supported for whole-project reconciled builds.
It is not a new numeric profile, architectural selection or domain compiler.

`selectReconciledApplicationArtifacts(plan)` takes only a registered checked
project and maps its complete view. Every original artifact path is prefixed
with `domain/typescript/src/`, retaining the authored `module_root` and profile
hierarchy. Module evidence and internal import target paths receive the same
prefix. Native bytes, relative import specifiers, export names, qualified node
identities, selected generators and the original project plan remain unchanged.
The mapped view binds its source-view digest and this extension's definition.

Source and compiled-snapshot build APIs, `publishProjectBuild`, and whole-project
`build`/`verify` commands share this view through explicit `--output-layout` plus
`--compilation-selection`. The receipt is written at the existing application
location, `evidence/project-build.json`. Its opt-in extension fields bind the
layout and original view. No-layout calls retain the original paths, wrapper
bytes, receipt bytes and currentness behavior. Public overloads remain compatible.
The selected compiler source capsule and its definition pins do not change.

The existing publication/currentness machinery consumes the mapped view, not a
second renderer or caller-provided artifact list. Changed source bytes, links,
unexpected directories, a self-consistently rehashed false layout receipt and
wrong-layout verification reject. Existing targets and forged wrappers never
become overwrite permission. The native test helper compiles actual published
files from a read-only mount; it does not recopy planned bytes to repair output.
Both a direct API build and a separate CLI-process build execute the same
compound Calculation/Mapping/Query/Policy/State Machine/Operation/Workflow case
in distinct output roots. The compiled public API is also exercised with access
to checkout definitions denied.

This extension supports whole-project model output only. Node-scoped application
views, unknown layouts, conflicting language/numeric selections, authored graph
compositions and selected stronger `verify-project` remain explicitly rejected.
Authored application adapters and composition semantics are still separate R08
work. Runtime assurance and concurrent-writer/no-replace qualification are not
claimed by receipt comparison or this layout adapter. R08 and the full CLI goal
remain in progress; no default cutover, source-model migration, provider action,
dependency installation, release or admission occurred.

Task Session preserved definition -> scaffold -> fixtures -> implementation ->
native verification -> synchronized evidence. The standard Context Builder pack
selected the R08 exit contract, existing output-layout mapping, selected compiler
views, output/build APIs, CLI parser and matching native/hostile fixtures. It
covers the bounded layout obligations; composition and stronger verification
remain visible, not waived. No handoff or delegation was used. Decision Gate and
the experiment harness are not applicable; no blocker-level product choice was
introduced. Operational publication/release remains deferred under its own owner.

- Route receipt:
  `818c99edee989dfdc88ed1abd2e441bc705feebc7da9444892fc6953a95684d5`.
- Context result:
  `38326a5a8bcaae4cbeea0fee333a18cebd5d632da2bcc89fd863bd0e99ef3417`.
- Exact mutation assessment:
  `a7a458c0df6d03d0220b1100e8462f7285fb12d15266c0da2c169d56ba718369`.

The assessment identifies the existing explicit user execution scope and has no
unknown/protected effects. These receipts are evidence bindings, not permission.

Final validation (2026-09-10): twelve affected suites pass **77/77**, no failures
or skips (122735.365831 ms). This includes four layout tests, the expanded native
public-API relocation test, real selected and legacy CLI commands, minimal
record-free contexts, independent shared-module observation and the complete
seven-test execution-verification suite with real Lean. Source typecheck passes.
The layout suite is registered once in the parallel test command. All 34 prior
checkpointed files outside this unit remain unchanged; parser, source capsule,
legacy formalization guards and the earlier execution implementation retain
their exact bytes. STATUS and CLI-COMPLETION are synchronized; R08 remains active.
Continuation result
`061218ef3ea3f141deff4c2abe1a8bcc0a49dabe5956cc1f4eae07bfb9ef0ef7`
records this layout unit as complete and further R08 work as required, under the
same existing user scope. No new product decision or operational authority is
asserted.

## Reconciled verification execution

The [execution definition](reconciled-verification-execution-contract.json),
digest `fa1a0f5e5706f0406893fcbbef514caec5436e7d8738cb49d353753edc335dba`,
and `DSV2-RECONCILED-VERIFICATION-EXECUTION` ontology scaffold define the next
additive R08 unit. Public `executeReconciledVerification(graph, plan, tools)`
requires the original registered graph and matching plan, explicit trusted local
TypeScript 7.0.2 and Lean 4.33.1 installations, and a Node declaration root.
An existing whole-project output target is optional. Closed inert options reject
caller outcomes, callbacks, relative paths and forged snapshots before execution.

The executor actually runs strict native compilation for every planned module,
independent native AST import/export inspection, exact isolated source replay,
and Lean kernel checking with the standard-foundation axiom audit and lossless
graph/selection round trip. It checks source currentness before and after the
run, exact proof/generated/configuration/observer bytes, and relevant tool
entry-point identities. An explicitly supplied existing output is checked
read-only before tool execution and again afterward; a missing or changed target
rejects before validators start. The executor never creates or repairs that target. Validators run
with bounded output/time and without ambient Node/Lean path overrides. Only a
fresh private run directory is written and removed after an identity check.
Configured tool installations remain trusted; this API is not an OS sandbox or
a complete transitive toolchain attestation.

All eleven inherited requirements remain present exactly once, plus four named
execution/currentness/cleanup checks. Each result identifies execution, evidence,
failure or unavailable prerequisites. Late source, toolchain or native artifact
drift invalidates earlier dependent observations. A failed requirement gives
`fail`; otherwise any unavailable requirement gives `incomplete`. The immutable
registered report can be rendered, but a JSON copy cannot revive execution.

Three requirements deliberately remain `not_evaluable` in this unit:

- `selected-generator-semantic-controls`;
- `cross-generator-behavior`;
- `safe-output-separate-from-planning`.

Without an existing target, `exact-output-currentness` is also unavailable.
Finite structural Lean proof is not generated-code runtime conformance. No
generated Operation, Workflow, provider or external effect is executed here.
Consequently this unit does not enable selected `verify-project`, waive runtime
or publication obligations, complete R08, change defaults or close the CLI goal.

The execution fixtures cover all thirteen metatypes, actual native tools,
poisoned ambient paths, forged/getter inputs, stale source, missing tools,
tampered existing output, an extra export that still compiles, and late artifact,
configuration, observer and source mutations, plus unavailable/interrupted private
workspaces. Source is rechecked even on the error path. Negative TS controls deliberately
fail the Lean subprocess dependency; only the separate real-kernel test supplies
positive Lean evidence. A first mutation-test run exposed an escaped-newline
error in its generated test client; the test was corrected without weakening
the product checks. That failed development run is not completion evidence.

The ten-suite regression run reported **62 passed / 2 Lean subprocess timeouts /
0 skipped** (362687.883118 ms). Both timeouts were in the unchanged earlier
formalization suite. Its full isolated retry passed **8/8** (260638.408837 ms),
with no source or timeout adjustment. The failed concurrent run remains recorded;
it is not relabeled as a passing run. The execution suite is registered exactly
once in the serialized proof-test command, not the parallel command.

After the final target-preflight and unavailable/interrupted-workspace controls,
the complete execution suite passes **7/7**, no failures or skips (61085.153412 ms).
Source typecheck passes. These final tests execute the compiled public API with
the pinned native TypeScript 7.0.2 image and installed Lean 4.33.1, and assert
exactly the three unavailable requirements above in the positive existing-target
case. All 36 earlier checkpointed files outside this unit remain byte-identical;
the parser pin and 38-source generator capsule are unchanged. No dependencies,
source models, default commands or user output targets were changed by validation.

Task Session and Context Builder preserved definition -> scaffold -> fixtures ->
implementation -> verification -> evidence, under the existing execution scope.
No handoff, delegation, experiment harness or blocker-level product decision was
needed. Route receipt:
`297f195ecdd25279ef82352af698e17ff6d02416aa960662adefd4c0930f914f`;
context result:
`1bfc1f6d4845ad8a452ec5ef0275d87efc7b112bd1690bd3617d6d0c4f95db27`;
exact mutation assessment:
`52f12d15d70983de312e52fbfdc5193a3d5be4e85a5f469b464d56e2e75adab3`.
These receipts bind evidence to the existing user scope, not new authority.
Continuation result
`b7f36c02ec4ea038b5840561f10c5b07a815b11913573fbb1b22405176b19164`
records the bounded execution milestone as complete and continuation as required.
The next R08 work remains semantic verification and application integration;
R08–R18 and the overall CLI goal remain open. No new product decision is needed.

## Successor finite structural formalization

The [successor formalization definition](reconciled-formalization-contract.json)
is a candidate with digest
`d4f81940a3562bd57259e31ac963a9b29b064af07e40737418e5db5affc90e29`.
Its ontology scaffold is `DSV2-RECONCILED-FORMALIZATION`. This is additive product
construction, not an update to the SFOL language or the legacy proof shape.

Public `createReconciledFormalization(graph, plan)` constructs a registered,
immutable bundle from the existing checked verification input. The complete
root-independent semantic graph and authored selection become recursive tagged
Lean data. Null, Bool, canonical finite numbers, UTF-16 strings, arrays and objects
stay distinct. ASCII strings use a compact representation; other strings retain
explicit code units, including lone surrogates and control characters. User
strings never become declarations or executable Lean syntax. The self-contained
`Reconciled.lean` artifact binds the definition and verification-input digests.

The concrete theorem checks only these finite structural predicates:

- Unique qualified node identities and matching endpoint identity/kind.
- Source and target kinds permitted by frozen relationship signatures.
- Workflow Operation references, step/compensation identity coverage, and
  compensation references to declared steps and dependencies.
- Named Interface Operation/Query references and public Mapping target contracts.
- Typed State Machine declared states, trigger/output Events and guard Rules.

Authored Workflow bindings are matched by identity, not by list position.
Source occurrence order, dependency edges and authored binding order are all
preserved independently. This does not add an order requirement to the already
resolved ordered/unordered behavior.

`validateReconciledFormalization` reconstructs the complete bundle from checked
inputs; caller-recomputed hashes, altered content/requirements and active getters
do not replace source checking. `renderReconciledFormalization` accepts only a
registered bundle. These APIs perform no filesystem writes or proof execution.
Their status remains `formal_verification: not-performed`.

The proof uses kernel reduction, not `native_decide`, `sorry` or added axiom
declarations. The dependency audit explicitly permits only Lean's standard
`propext`, `Classical.choice` and `Quot.sound` foundations. This is not an
axiom-free claim and does not assert any project-specific axiom. The independent
Lean JSON evaluator is used for round-trip tests; it is not a proof oracle.

Scope remains finite structural references. Arithmetic/Rule semantics,
transaction and compensation execution, generated-code conformance, provider
behavior and all-DS-D8 formal coverage are not proved by this theorem. The full
verification input and every unwaived evidence requirement remain in the bundle.
Legacy formalization guards, selected `verify-project` rejection, parser pins,
generator capsule and default command behavior are unchanged.

Validation development exposed and corrected an inefficient expanded-string
encoding, nested equality that was opaque to kernel reduction, and a test
fixture attempting to mutate a frozen binding. The first axiom audit also
corrected an overstrong test assumption: standard Lean dependencies are
reported explicitly, not mislabeled as absence of all axioms. None of these
intermediate runs is completion evidence.

Final validation (2026-09-10 local time): nine affected suites pass **59/59**
with no failures, skips or inferred checks (158174.103261 ms). This includes
eight new formalization tests, the five verification-input tests, selected
compiler/CLI/build/instantiation paths, capsule relocation, legacy CLI and
legacy node publication. Source typecheck passes with the unchanged 38-source
capsule. The new suite is registered once in the serialized proof test command.

Lean 4.33.1 checks the concrete all-thirteen source, hostile reference mutations,
ordered source occurrences with differently ordered authored bindings, Unicode
and lone-surrogate round trips, and the exact standard-foundation dependency
list. Native TypeScript declarations and the compiled public formalization API
also pass outside the checkout with repository definition access denied.
The API is still construction-only: these test executions are evidence for the
candidate, not fabricated per-user-project proof receipts.

Exact checkpoints confirm 32 earlier files are unchanged outside this unit.
The parser remains at
`192ca4fdfd9a91ac86b25cce5dbd6e3ec5bf122de243f831bf6df213901e6218`.
No dependency installation, legacy guard removal, default change or operational
publication occurred.

Task Session and Context Builder kept the exact R08 boundary: definition and
ontology scaffold first, existing verified fixture next, implementation,
native checks and synchronized records. The selected context covers the old
formalization guards, verification obligations, source/selection projection,
typed Workflow/Interface/Mapping/State Machine contracts, Lean kernel behavior,
public API packaging and existing compilation layouts. No handoff or delegation
was used. The experiment harness is not applicable to this compiler product
work. No blocker-level product choice was introduced.

- Route receipt:
  `9216608a9266e1ade66b4f78c428636063edb9925ce1c668c40c9e255c46574f`.
- Context result:
  `2c07174028727c08b8d8eb49279c7fe7aada30134e46b0575dea6716c47f1da6`.
- Exact mutation assessment:
  `d9351a92e138f718e7ab8485c0e97f3d07140a61136454730bdda076c6d3e53b`.

These non-executing records identify the existing user execution boundary,
not admission, acceptance or operational authority. R08 remains in progress:
the stronger verification executor/aggregation and application integration
are still required. R09 concurrent-writer qualification remains separate.
Continuation result
`a507994f64e2c5d45bed5c240b7ec9c35988cb1aea81c6254c6f33bfde6bc7d8`
identifies the verification executor and application integration under the
existing user scope, with no unknown/protected effect or new product decision.

## Successor verification-input projection

The existing formalizer deliberately rejects typed Calculation v2, public Mapping
v3, Workflow occurrences, named Interface contracts and typed State Machine
bindings. Its old representation cannot preserve those meanings. These guards
and the selected `verify-project` rejection remain intact.

The new [verification projection definition](reconciled-verification-projection-contract.json)
has digest `d3ada0d819c8e1d2fbd0bd3b26dc330c5d756eb3454f098f4b092e3588896ed8`.
Its candidate ontology scaffold precedes implementation. Public API additions:

- `createReconciledVerificationProjection(graph, plan)` requires registered,
  unchanged compiler inputs with identical complete graph certificates.
- `validateReconciledVerificationProjection(value, graph, plan)` reconstructs
  the exact projection; caller-recomputed digests cannot authorize changed data.
- `renderReconciledVerificationProjection(value)` serializes only registered
  immutable projections; successful reconstruction returns a registered value.

The root-independent payload preserves every source node body and relationship,
all typed contract versions, authored bindings, resolved native requests and
source blobs, module imports/exports, artifact inventory, and every qualified
node's exact native-import closure. Finite graph certificate and project
denominators remain distinct: a three-metatype project is not thirteen types
merely because the catalog contains thirteen.

All shared-plan verification obligations remain required, alongside source
currentness, graph obligations, source/selection preservation, isolated source
replay, successor formalization currentness and exact output currentness.
These are requirements, not passing outcomes. The projection explicitly reports
`verification-input-projection-only`, `not-executed` and `not-performed`.
Construction performs no native validation, semantic observation, Lean/kernel
check, publication or provider execution. No SFOL redesign or guard waiver occurs.

Verification against current implementation:

- Five projection tests cover all thirteen kinds, typed body and binding
  preservation, relocation, no filesystem reads from checked snapshots,
  immutability, and minimal projects without invented metatypes.
- Tampered fields, missing contracts/modules/views/artifacts/requests/source
  blobs, waived requirements, forged success, wrong denominators, extra fields,
  active getters and cloned compiler inputs reject.
- Calculation literal and Operation guard changes survive in actual payload
  fields, not just hashes. These are preservation controls, not a claim of
  complete generated-runtime semantic validation.
- Native TypeScript emits declarations and a relocated public API using the
  pinned offline read-only compiler image. Consumer type errors prevent treating
  the projection as a passing receipt. The emitted API reconstructs identical
  bytes with filesystem reads limited to its temporary installation and fixture;
  repository definition access is explicitly denied.
- Eight affected suites pass **51/51**, no failures/skips
  (40050.051619 ms): projection, instantiation API, build API, selected CLI,
  compiler bridge, capsule, legacy node publication and legacy CLI.
- Source typecheck passes, including unchanged 38-source capsule currentness.
  The suite is included once in the normal parallel test command.

Remaining R08 work is explicit: successor formalization compatible with these
preserved contracts, native/observer/replay/output execution and honest evidence
aggregation for stronger verification, then supported application integration.
This prerequisite does not complete R08 or the active CLI goal.

Task Session maintained definition -> ontology scaffold -> fixture ->
implementation -> verification -> evidence. Context Builder isolated the
legacy verification guards and new compiler inputs; no delegation was used.
No new owner decision was required. Route receipt:
`61316ac49cb2a296b5c449b84d3a4577d7f81332801542705cffa7aaf20176a7`;
context result:
`0fb352075fe635413ddabb8298ceccac3a12163004bd565482e949f8594da7e6`;
bounded effect assessment:
`ff6753a1ac8a1488508edf9f9e1e5629b83f264f922f8bf5fae4b35bd9e69931`.
These non-executing records use the existing user execution scope and confer no
operational authority. Continuation result
`95651f2817e4f670e7b08ccc687b93ca8259d2052c204b137a2697516b821320`
identifies remaining R08 work under that scope, without unknown/protected effects
or a new product decision. Exact checkpoints confirm 28 prior files remain
unchanged outside this unit; the normal parallel command now lists 66 suites.

## Implemented public API

`impl/cli/src/index.ts` now exports a versioned authored-selection bridge:

| API | Boundary |
| --- | --- |
| `decodeReconciledCompilationSelection(value)` | Closed inert authored data; graph-dependent meaning is checked during planning. |
| `planReconciledProject(sourceRoot, selection)` | Loads a checked project, compiles through the shared plan, and rejects source drift before returning. Writes nothing. |
| `planCompiledReconciledProject(graph, selection)` | Same construction from a registered immutable snapshot, without reloading project source. |
| `selectReconciledArtifacts(plan, roots)` | Exact selected qualified-owner modules and transitive native imports; null roots retain the whole artifact set. |
| `assertReconciledProjectPlan(value)` | Rejects JSON clones and caller-forged plans; no serialized identity revival. |

The selected definition is
[reconciled-compilation-contract.json](reconciled-compilation-contract.json),
preceded by an agent-facing ontology scaffold. Its digest is
`6cc96755be9bf59c409b0b3a7ae545f58f555997630f94271ad15b4508afbe08`.

The selection explicitly separates:

- Schema: `domainspec.reconciled-compilation/v1-candidate`.
- Architecture/profile: `domainspec.reconciled-typescript/v1-candidate`.
- Language: `typescript`.
- Layout: `domainspec.existing-profile-layout/v1-candidate` and a portable module root.
- Numeric values: `domainspec.typescript-exact-uint64/v1`.
- Authored field-reference bindings, factory validators, Operation actions and
  Workflow argument/result/recovery bindings.

The user supplies authored binding data, not checked objects, source-definition
files or compilation hashes. Workflow step/compensation identities resolve to
their existing source occurrences. The compiler derives and pins the actual
checked Operation identity without inventing calls or changing order. Both
constrained and unconstrained authored recovery graphs retain the existing
selected policy; dependency semantics and tie-break remain explicit.

The whole project is the checking context. Every real record must have its
factory binding and each Operation/Workflow exactly one authored binding.
Actual Entity/Value Object/Enum declarations form the common exact field model;
it is null when absent. The bridge automatically chooses existing generators
from declared metatypes and typed contract versions, then joins them through
R07. It does not create a second parser or synthetic records.

A node view selects already-generated bytes, not a second compiler execution.
It follows native imports, not all semantic graph edges: a Policy target does
not pull in executable Operations/Calculations, and a State Machine's Event
reference does not instantiate that Event. Checking remains whole-project
scoped even when the output view contains one node's closure. Unsupported or
incompletely bound nodes cannot hide behind a narrower output view.

Legacy command behavior and planning defaults are unchanged when no reconciled
selection is supplied. The existing application layout and
application-composition adapter are not accepted by this bridge yet; they reject
explicitly without legacy fallback, and remain part of R08's pending integration
work rather than being waived from the plan.

## Selected commands and local output

The existing `instantiate`, `instantiate-project`, `build` and `verify` commands
now accept one valued `--compilation-selection <absolute-json-file>` option.
The existing argument parsers still check all other options. Selected generation
supports TypeScript only; explicit language/numeric-profile disagreements,
duplicate/unvalued flags, system-integration overlays and application layouts
reject without falling back to the old renderer.

Examples, using the authored selection shape above:

```sh
domainspec-v2 build /absolute/project --language typescript --target-root /absolute/new-output --compilation-selection /absolute/selection.json
domainspec-v2 verify /absolute/project --language typescript --target-root /absolute/new-output --compilation-selection /absolute/selection.json
domainspec-v2 instantiate /absolute/project --node orders:submit --language typescript --target-root /absolute/new-node-output --compilation-selection /absolute/selection.json
domainspec-v2 verify /absolute/project --node orders:submit --language typescript --target-root /absolute/new-node-output --compilation-selection /absolute/selection.json
domainspec-v2 instantiate-project /absolute/project --languages typescript --target-root /absolute/new-project-output --compilation-selection /absolute/selection.json
```

These example paths/selectors are placeholders, not claims about an installed
project. The public help advertises the option and its current evidence ceiling.
`verify-project` deliberately rejects this selection until its stronger
native/formal verification adapter is implemented; byte comparison is not
substituted for that command's evidence obligations.

The additive [local output definition](reconciled-output-contract.json), digest
`0dba8ac41c500eef7ef7742019e35f18b87955006566d639e41480ef7ecf7e93`,
has its own ontology scaffold. `impl/cli/src/generation/reconciled-output.ts`
exports bounded regular selection-file loading, receipt construction,
`publishReconciledProject` and `verifyReconciledProject` through the public index.
The receipt binds its output definition, project/shared-plan/view identities,
source manifest/capsule, qualified roots and exact artifact inventory. It lives
at `.domainspec/reconciled-build.json`, not a legacy receipt path with different
evidence semantics. The output definition is pinned by the implementation and a
source-byte test; it is not a runtime development-file dependency. The existing
38-source compiler capsule is unchanged in this continuation.

Selection reads are bounded to 8 MiB and reject links/nonregular files. Only a
registered project plan can produce a view or local output. Publication rejects
existing targets (including dangling links), stages under a private sibling
directory, writes files exclusively and renames after checking the target again.
Failure removes only this attempt's staging directory. Read-only currentness
verification compares exact receipt/file bytes and the complete expected file/
directory inventory, rejecting links, unexpected entries and wrong root views.
Generated JavaScript or other consumer-added files are outside this source-output
receipt and make exact-inventory verification fail if placed in the same tree.

All output verification explicitly reports `artifact-currentness` and marks
native compilation, semantic observation and formal verification `not-performed`.
The separate native tests below supply test evidence; they do not change the
meaning of a user's file-verification receipt.

### Command/output verification checkpoint

The final seven-suite run passed **44/44**, zero failures/skips, in
37190.864719 ms:

- `test/cli/reconciled-commands.test.ts`: 5.
- `test/cli/main.test.ts`: 15.
- `test/generation/reconciled-project.test.ts`: 5.
- `test/generation/resolved-artifact-plan.test.ts`: 9.
- `test/generation/reconciled-sources.test.ts`: 4.
- `test/generation/publish-instantiation.test.ts`: 5.
- `test/generation/exact-uint64.test.ts`: 1.

Real CLI subprocesses generate an all-13 compound project and a Workflow-only
native import closure. Their actual published source files are compiled in place
without rewriting them from expectations, then the real Workflow/Operation path
executes successfully. The whole project also preserves full-width Calculation
behavior. CLI and API publication receipts agree exactly across output roots;
node-only output fails whole-project verification and passes its own selected view.
Malformed JSON, unknown profiles, incomplete bindings, conflicting flags,
unsupported combinations and linked/oversized selection inputs reject before
target creation. Source bytes remain unchanged.

Currentness tests alter generated bytes and receipt bytes, substitute symbolic
links, add unexpected directories and select the wrong view. Rejection tests
preserve existing owner files and dangling links. Injected write failure cleans
the exact staging directory. A target created during staging is preserved and
rejected before rename. These controls do not prove safety against an adversarial
writer creating/replacing paths after the last existence check; atomic no-replace
and filesystem-race qualification remain explicit R09 obligations, not a claimed
property of this checkpoint. Source typecheck passes after the final edits.

The new suite is registered in the normal test command. The full default suite
and installed-package tests were not run. Nine prior R08 files outside the exact
command/output edit set retain their checkpoint hashes.

## Definition bundle

The compiler bundle now contains 38 sources: the prior 37 unchanged selections
plus the new reconciled-compilation definition. No prior pin was refreshed.

- Canonical selection digest:
  `924c5a63341c570c9c775e2453fdf981bef74571d9b0cd33b3cdbb47ab91dfd7`.
- Selected capsule digest:
  `264d06e7b1d54b830b70806f98ff511bf42d1dcade0dbfe0c0d9358b2078acd4`.

This successor changes the compiler bundle identity, not source grammar or
old native artifact bytes. R07's 37-source report describes its historical
checkpoint; current materialization and loader tests select the 38-source bundle.

## Verification

The final six-suite source-worktree run passed **45/45**, no failures/skips, in
39774.885545 ms:

- `test/generation/reconciled-project.test.ts`: 5.
- `test/generation/reconciled-sources.test.ts`: 4.
- `test/generation/minimal-value-context.test.ts`: 6.
- `test/generation/resolved-artifact-plan.test.ts`: 9.
- `test/generation/profiled-project.test.ts`: 6.
- `test/cli/main.test.ts`: 15.

The new test imports through the real public index. The authored JSON has no
action hashes. Source/snapshot APIs return identical plans; every one of the
13 metatypes has native modules. The compound project compiles and executes in
two output roots using pinned TypeScript 7.0.2: exact cross-feature Calculations,
explicit Mapping inputs, repeated Query rows, Rule-based Policy, State Machine
reduction and an actual awaited Workflow/Operation/Event path run successfully.
An isolated Workflow-root artifact view also compiles and loads.

Every node's artifact view is compared with a separate queue-based traversal of
the whole plan's native import graph, and every selected artifact is the exact
original object/byte sequence. Root-order normalization, qualified identity,
snapshot cloning, source removal, unknown versions/profiles/layouts, hash
injection, missing bindings, unknown occurrences and ordinary getter payloads
have controls. Enum-only and completely domain-field-free source projects
generate no dummy record. The unchanged R07 all-13 native-byte baseline passes.

The first broader run passed 52/53 but failed the legacy all-language test
because its harness hardcodes a missing checkout-local `node_modules/.bin/tsc`;
the subprocess had no exit status. This was not treated as a compiler pass.
An exact copy of `test/generation/plan-instantiation.test.ts` and its canonical
fixture was run in an isolated temporary harness, with the current source tree
and locked dependency cache linked there. It passed **8/8**, no failures/skips,
in 4952.628138 ms, including native TypeScript/Python/Rust checks. No dependency
directory, symlink or test change was made in the source checkout. The temporary
harness is validation support only, not a product installation claim.

Source typecheck passes, including catalog, relationship, integration-profile
and 38-source capsule materialization checks. The new suite is registered in
the existing test command. The full default test command and installed-package
qualification were not run and are not claimed complete.
The 21 prior R07 files outside this exact edit set match their checkpoint hashes;
all 37 prior source manifest rows retain the same IDs, paths and content hashes.

## Existing build API integration

The existing `planProjectBuild` and `planCompiledProjectBuild` functions now
accept an explicit authored compilation selection as their fifth argument.
`verifyProjectBuild` accepts it as the sixth argument. Existing calls keep
their legacy return types and behavior; optional-selection calls have an honest
union return type. Numeric realization and output layout remain separate from
architectural selection. An unsupported explicit combination rejects before
source access, without falling back to a legacy generator.

```typescript
const selection = readReconciledCompilationSelection(selectionFile);
const plan = planProjectBuild(sourceRoot, "typescript", undefined, undefined, selection);
const publication = publishProjectBuild(plan, targetRoot);
const currentness = verifyProjectBuild(
  sourceRoot, "typescript", targetRoot, undefined, undefined, selection,
);
```

The new definition is [reconciled-build-api-contract.json](reconciled-build-api-contract.json),
SHA-256 `b6fde22f9fe06a2492b629a71e44a08682bc489bbd405dfbe04ff3dd2c11628a`;
its navigation-only scaffold is
[`DSV2-RECONCILED-BUILD-API`](../ontology/reconciled-build-api-candidate.json).
The definition preceded the source fixture and adapter implementation.

The adapter returns an immutable, registered
`domainspec.reconciled-build-plan/v1-candidate` wrapper. Its exact artifact
view and output receipt are unchanged from the direct reconciled API; the wrapper
digest also binds its own definition. Publication delegates the registered
checked project to the common publisher. Cloned/spread/tampered wrappers reject,
including wrappers disguised with a legacy receipt schema. Selected verification
keeps the distinct currentness-only result and explicit not-performed assurance
fields. It is not cast to the legacy verification type.

Selected CLI whole-project `build` and `verify` now use these existing public
wrappers. Qualified-node verification continues through the same direct checked
view. Compiled-snapshot builds perform no source reload; source builds check
currentness again. Neither the 38-source compiler capsule nor its generated
artifact bytes changed in this adapter step.

The six-suite regression passed **42/42**, no failures/skips, in **62.00 seconds**,
including CLI, reconciled output/compiler, legacy exact numerics and all eleven
legacy project-composition tests. The expanded build-API suite passed
**6/6** in **10.03 seconds**, including native public declaration and relocation
checks. Final seven-suite regression passed **41/41**, no failures/skips, in
**17.19 seconds**: build API 6, selected CLI 5, compiler 5, source capsule 4,
legacy publication 5, exact numerics 1 and CLI main 15. Typecheck passed.
The initial test run exposed a wrong fixture-relative path in the new legacy
test; that path was corrected, with no product or fixture changes, before the
passing runs. These are bounded checks, not the full default test command.

The native test compiles the actual public entry module and declarations with
the pinned offline TypeScript image. It typechecks a consumer against legacy,
selected and optional-selection overloads, including negative type controls.
The emitted API then builds, publishes and verifies the all-13 source fixture
outside the checkout with Node permission restrictions: only that isolated
temporary root is readable/writable, and repository definition access is
explicitly denied. Resulting artifact bytes and receipts match the source API.
This is relocation evidence, not clean installed-package qualification.

Source/snapshot identity, source-drift rejection, snapshot planning with all
filesystem reads disabled, invalid selection/profile/layout controls, owner-file
preservation, forged-plan rejection, CLI/API currentness equivalence and old
TypeScript/Python/Rust receipt behavior are covered. Concurrent-writer safety,
stronger project verification and application-layout integration are not implied.
Fourteen prior R08 files outside this exact write set retain their checkpoint
hashes. The new suite is registered once among 64 parallel test paths; registration
is not a claim that all 64 suites were run. Scoped diff and whitespace checks pass.

## Existing instantiation API integration

`planInstantiation` now accepts a qualified selector plus an explicit registered
checked project as its fifth argument. That project carries the authored
compilation selection and whole-project checking. A detached decoded node is not
accepted as selected compiler context. Existing decoded-node calls without that
argument retain their old behavior and return type.

```typescript
const project = planReconciledProject(sourceRoot, selection);
const node = planInstantiation("alpha:flow", "typescript", null, undefined, project);
publishInstantiation(node, nodeTarget);

const whole = planProjectInstantiation(sourceRoot, ["typescript"], selection);
publishProjectInstantiation(whole, projectTarget);
```

`planProjectInstantiation` accepts authored selection as its third argument and
validates it and the single distinct TypeScript language before source access.
It generates the shared whole-project artifact set once, preserving deduplication,
then uses the existing exact output receipt. Node planning is a pure qualified
native-import view of the supplied checked plan, with no source reload. Every
node view keeps whole-project semantic checking; graph edges do not acquire
execution meaning from this adapter.

Definition:
[reconciled-instantiation-api-contract.json](reconciled-instantiation-api-contract.json),
SHA-256 `c7101ec286e7b967204cf5f3a83f4801e78c25278007f21aa074611dcc28399f`.
Navigation scaffold:
[`DSV2-RECONCILED-INSTANTIATION-API`](../ontology/reconciled-instantiation-api-candidate.json).
These preceded the source fixture and implementation. Node/project wrappers use
`domainspec.reconciled-instantiation-plan/v1-candidate` with distinct scope
types. They are immutable, registered and definition-bound; each publisher
requires the matching registered scope. Clones, altered wrappers, scope swaps
and legacy-schema disguises reject before output mutation. Legacy conformance
receipts are not substituted for currentness receipts.

Selected CLI `instantiate` and `instantiate-project` now call these existing
public APIs and publishers. Their artifact and receipt bytes match the direct
compiler/view API. No compiler source pin, generated artifact layout, approved
Workflow behavior, numeric meaning or legacy publisher mechanics changed.

Final seven-suite regression passes **46/46**, no failures/skips, in **28.90
seconds**: instantiation API 6, build API 6, selected CLI 5, compiler 5, source
capsule 4, legacy publication 5 and CLI main 15. Typecheck passes, including all
four generated-source checks. The initial typecheck found a TypeScript control-flow
narrowing issue in the new throwing helper; declaring it as a function fixed the
typing without changing its rejection behavior. Final source/API checks pass.

The new suite covers every qualified node across all thirteen metatypes, exact
native-import closures, receipt identity, all-read-disabled node planning,
source-drift rejection, malformed/missing context and selection, language/profile/
overlay errors, wrong publication scopes, owner-file preservation and unchanged
multi-language legacy calls. Its native test compiles the actual public module
and declarations, checks scope/receipt negative type controls, and runs the emitted
APIs with filesystem permission limited to an isolated temporary root. Repository
definition access is denied; node publication still works after moving source.

The unchanged legacy planning suite passes **8/8**, no failures/skips, in **4.59
seconds** in the existing locked-dependency harness. Its copied test matches the
source test byte-for-byte and its source link resolves to this checkout's current
implementation. No new dependency or repository symlink was installed.
The exact existing `whole-project generation publishes` test also passes
**1/1** in **6.12 seconds**, covering 54 old node/language plans, deterministic
CLI/project outputs, owner-target preservation and its hostile race controls.
Only that named test was selected from the static-backend suite; neither that
whole suite nor the full default test command was run. These local checks do not
qualify concurrent-writer safety for the separate reconciled publisher, native
39-cell parity, stronger selected verification or clean installed packages.
Nineteen prior R08 files outside the exact write set retain their checkpoint
hashes. The suite is registered once among 65 parallel test paths; that count
does not claim all registered tests ran. Scoped diff/whitespace checks pass.

## Remaining R08 work

Current qualification closes the composition-behavior item below for the
supported single-composition/node-http source profile, with exact finite cases
and public currentness/cleanup checks. Selected-generator adapters also have
the newer qualifications above. The following original obligation list is
retained for traceability; it must be reconciled against current evidence before
choosing the next entry-point/cross-generator implementation. It is not evidence
that completed work needs to be implemented again.

1. Complete the selected-generator and cross-generator semantic controls required
   by the now-exposed `verify-project` executor. R08n connects the entry points;
   it does not convert unmet assurance requirements into passing currentness checks.
2. Complete composition behavior controls. R08m covers the mixed-artifact inventory,
   native syntax/surfaces and source preservation; R08n adds explicit application-layout
   target checking. Neither supplies composition behavior assurance.
   Keep numeric realization, architectural selection and output layout separate.
3. Carry the implemented exact output/view receipt through the remaining adapters,
   preserving selection rejection before output mutation. Finish the stronger
   verification envelope and entry-point equivalence; full hostile and
   concurrent-writer output qualification remains R09.
4. Test command/API/source/snapshot/node/project equivalence, diagnostics,
   unsupported combinations and no-write failures before marking R08 complete.

R09–R18 remain unchanged. There is no missing product decision now. No runtime
provider effects, admission, default cutover, publication, release, AlchLang
reconciliation or dependency installation was authorized or performed.

## Task Session and Context Builder evidence

Task: R08. Result: verified progress; not complete. Runtime: local native,
no adapter/delegation/handoff. Strict handoff coverage: not applicable.
Context: R08 exit contract and R07 evidence; CLI option parsers and handlers;
legacy instantiation/project/build/verification APIs; R07 generator selection,
source capsule and module ownership/import inventory; action/Workflow/field
binding contracts; public export boundary and relevant native tests. Each
selected source serves an integration, compatibility or verification obligation.
Fallback inspection was limited to the missing legacy TypeScript executable.

Task Session preserved the definition -> ontology scaffold -> direct source
fixture -> implementation -> native tests -> evidence sequence. Context Builder
kept unresolved entry-point integration visible rather than reducing R08 to its
already passing API bridge. Existing exact execution authorization supplies the
mutation scope; ARE receipts are non-executing evidence, not permission.

- Route receipt:
  `f7c767788b82c9cad4ca20f10bcc5f888837a5f6a84d98f0d86c1d26812fa090`.
- Context result:
  `dbaaba73f6eb0effc0f1cdbad7cb4e53cfbff3ef6949cc7da8d5482f20f5ae4c`.
- Exact persistent-mutation assessment:
  `3612216b41dd3fef381a12d715b5b3e42cb166473d975228489ec3f78945f319`.

The first effect label used an unknown spelling; the assessment was repeated
with the runtime's documented `persistent-mutation` class and unchanged file/
effect scope. No unknown/protected effects remain in that assessment. The owner
gate is the existing user instruction to execute this plan until a material
decision is needed. Decision Gate: not applicable; no unresolved blocker.
Experiment harness: not applicable (compiler product work).
Synchronized records: this report, STATUS, CLI-COMPLETION and the remaining-work
checklist. Next action: complete the existing public entry-point wiring above.

Command/output continuation uses the same Task Session definition/scaffold/test
discipline and a bounded Context Builder pack covering the actual CLI parsers,
legacy publishing mechanics, source-file bounds and selected API contract.
Its route receipt is
`35d8bc9114d669e74041776e71b5a36f4059b623f5748849cac57cd36412ce7c`;
context result is
`11b534b7b7a365f35f05112258de9afa6a5dbc5eecdcb0290ec3ba06851e57e6`;
exact persistent-mutation assessment is
`e1431d0cb065eeb94092556b0e93a234fc568e20d3ae95c30410c3768394107b`.
It has no unknown/protected effects and uses the same explicit user execution
scope. This is verified R08 progress, not R08 or goal completion. No new owner
decision is required, and no operational authority is asserted.

The build-API continuation remains R08 product construction. Its bounded Context
Builder pack covers the existing build/planning/publishing signatures, numeric
and layout guards, selected compiler/output definitions and registered objects,
CLI dispatch, public exports, exact source/snapshot tests and legacy composition
compatibility. The in-scope obligations are covered; stronger verification and
application integration are explicitly still open. No delegation or runtime
handoff was used. Fallback search was limited to the new test's fixture location.
Task Session kept the definition/scaffold/fixture/implementation/test order and
left R08 in progress. No blocker-level product choice was found; Decision Gate
and the experiment harness are not applicable. STATUS and CLI-COMPLETION are
synchronized; the execution checklist already identifies R08 as in progress.

- Route receipt:
  `a4affb279387f349d6b1b001c068a29e21e03604030a4a8ec0edb690c8a7a5b6`.
- Context result:
  `184e70307ad706d353b4d10554a578386f69683b5942ed3ca2d241a7a56039b4`.
- Exact persistent-mutation assessment:
  `e9970bbb2f982b0ee810a130e40e1984c7f5309529255825784ed7277d3b4bec`.

The effect is assessed admissible, with no unknown/protected effects, against
the existing explicit user execution instruction. These non-executing receipts
are evidence bindings, not implementation permission or operational authority.
The bounded build-API milestone is complete; R08 and the CLI goal remain active.
The non-executing continuation result
`6a877e712d27d4e8bd82f81ada61efa24e7e904c3e6007010f2b6c8c73f6d985`
identifies remaining R08 entry-point implementation under the existing user
scope, with no unknown/protected effect or new product decision.

The instantiation-API continuation remains R08 product construction under the
same explicit user scope. Task Session preserved definition -> scaffold ->
source fixture -> implementation -> native verification -> synchronized evidence.
Its bounded Context Builder pack covers the selected compiler/views, existing
node/project planning and publishing functions, CLI dispatch, public exports,
legacy publication race controls and current R08 exit requirements. In-scope
obligations are covered; stronger verification and application integration remain
explicit. No blocker-level product decision, delegation or runtime handoff was
needed. The experiment harness and Decision Gate are not applicable. The existing
locked-dependency harness was checked before reuse; no fallback implementation
or dependency installation occurred.

- Route receipt:
  `038c293e30b215d783c416a8be0758b74a670a98e5d0f44cb51771fb0636979d`.
- Context result:
  `80f4624f93a9693ba7bd4ee16e1a499ab24f9c3b9a2481f329248ef2991cd31e`.
- Exact persistent-mutation assessment:
  `974ac817ed96556b8cd6c369d32b9c1b301219f36d7601fba997207a6ef840b6`.

The effect assessment has no unknown/protected effects and identifies the
existing user execution instruction as its owner boundary; it is not permission.
This report, STATUS and CLI-COMPLETION are synchronized. The checklist still
correctly identifies R08 as in progress, so no completion field was changed.
The instantiation milestone is verified progress, not completion of R08 or the
CLI goal. Continuation result
`fe7e37aaa8cc9b3b67526a1129b6d482329c15c91d20b892166688445cb2ed83`
identifies remaining verification/application integration under the existing
user scope, with no unknown/protected effects or new product decision.
