# Working CLI completion ledger

Updated: 2026-09-15. User objective: “next, continue until we have a cli working
correctly, just stop if we have some really important decision”.
Status: complete technical candidate construction. Authority effect: none.

This ledger preserves the full [PCR outcome](PLAN.md#1-outcome); it does not
replace that outcome with the already passing subset. Earlier “next” work made
verified implementation progress, but did not complete the CLI.

## Completion requirements and authoritative evidence

| Requirement | Evidence needed | Current state |
| --- | --- | --- |
| All 13 backend metatypes in TypeScript | PCR-06 generated source, independent observation, native compile and positive/hostile behavior for each selected input contract | R06 bounded candidate complete: [selected contracts and native evidence](TYPESCRIPT-INPUT-CLOSURE.md), including standalone exact Calculations, standalone named sums, public Mapping/Interface and actual Operation/Workflow dependencies. Shared public entry points remain R07–R09. |
| Shared planning through every promised entry point | PCR-07 equivalence tests for instantiate, source project, compiled snapshot and supported application build; exact imports/paths/collisions | R08 and [R09](R09-QUALIFICATION.md) qualified: selected CLI/API/source/snapshot/node/project/application integration, finite verification, native import/architecture controls and no-replace publication safety. |
| Python and Rust parity | PCR-08/09 native modules for all types, shared semantic cases with native-specific controls | R10 Python and R11 Rust are complete independently: each has all13 native cells, native controls and a selected verification route. |
| 39 generated realization cells | PCR-10 explicit matrix with no missing or skipped native lane | R12 complete: [fresh 39-cell qualification](R12-QUALIFICATION.md) binds every TypeScript, Python and Rust cell to normalized native evidence with zero missing or skipped lanes. |
| Compound commerce model | PCR-11 all types, nested fields, lawful graph relations and exact computed inputs | R13 complete: [two-feature three-language qualification](R13-QUALIFICATION.md) accounts for 22/22 scenarios with exact explicit Calculation-to-Mapping dataflow, native effects and source negatives. |
| Semantic distinctions and relationships | PCR-12 non-collapse, orthogonality, property and compiling-mutation tests; 17 applicable backend signatures accounted for | R14 complete: [semantic and relationship qualification](R14-QUALIFICATION.md) closes 17/17 relationship rows, 44/44 lawful obligation witnesses, 44/44 frozen-predicate semantic mutants, 12/12 cross-cutting properties and 11/11 mutation specifications. |
| Compatibility and selection | PCR-13 opt-in versioned profile/layout selection, old defaults/archive behavior preserved, usable migration diagnostics | R15 complete: [compatibility and migration qualification](R15-QUALIFICATION.md) preserves legacy omission, qualifies explicit TypeScript/Python/Rust selection and both layouts, and exposes three non-writing migration helpers. |
| Installable product | PCR-14 reproducible archive, clean installed commands and corpus outside workspace, accurate user docs and final review | R16–R18 complete: [reproducible installation qualification](R16-QUALIFICATION.md) provides one exact tarball, two byte-identical pack runs and two passing clean installs; [installed acceptance](R17-QUALIFICATION.md) proves the packaged guide and complete example through all three native targets; [the exact review pack](R18-CANDIDATE-REVIEW.md) closes the technical denominator. |
| Honest diagnostics | Unknown versions, stale bindings, invalid types, unsupported inputs and unsafe outputs reject before writes | Complete for the selected candidate: R08–R18 planner, CLI, compatibility, mutation, clean-install, exact drift and evidence-currentness controls pass. |

All rows are verified against current bytes. This closes technical candidate
construction, not product-owner review or operational authority.
Local tests, provenance hashes, baseline admission, or one working command do not
close the whole matrix. No publication, profile admission, default cutover or
deployment is implied by product completion.

## Product frontier and runnable work

Remaining-work planning: [five layers and 18 bounded tasks](REMAINING-WORK-PLAN.md),
with an [execution checklist](remaining-work-plan.json). The plan preserves the
evidence and full completion denominator below; R01 through R18 have tested evidence.
No task remains in this construction plan.

Current R18 verdict (2026-09-15): [R18 review pack](R18-CANDIDATE-REVIEW.md)
binds one exact archive, all 17 predecessor evidence artifacts, six current
machine-readable qualifications, seven focused regression inputs and every
planned denominator. The focused final campaign passes 20/20; R18 currentness
and authority checks pass 3/3. Technical CLI candidate construction is complete.

Current R17 verdict (2026-09-15): [R17 qualification](R17-QUALIFICATION.md)
proves the installed guide and complete commerce example from the refreshed
archive. TypeScript, Python and Rust each build, verify, compile and execute;
one exact-byte mutation is rejected without repair. The example exposes 21 nodes,
14 relationships, all13 meta types and 22 documented scenarios.

Current R16 verdict (2026-09-15): [R16 qualification](R16-QUALIFICATION.md)
binds `@domainspec-v2/cli@1.0.0` to a 2,574,504-byte archive with SHA-256
`42446f893c8793c33b71a8afafef0b69b9775a341225cf893049da0fda93da49`.
Two package runs were byte-identical and two clean installed-consumer runs
passed. The retained artifact currentness test passes 2/2.

Current R15 verdict (2026-09-15): [R15 qualification](R15-QUALIFICATION.md)
closes 15/15 compatibility cases across three languages, two selection modes,
three output views, seven public entry points and three explicit migrations.
The selected campaign has a transparent composite 66/66 result after correcting
one stale TypeScript-only diagnostic expectation; the focused qualification
passes 4/4. R17–R18 and full CLI completion remain required.

Current R14 verdict (2026-09-15): [R14 qualification](R14-QUALIFICATION.md)
joins the complete relationship predicate surface to the current native matrix
and compound corpus. The focused assurance check passes 4/4 and the selected
cross-cutting campaign passes 57/57 with real Lean. The historical supported-
profile admission digest remains explicitly non-current. R16–R18 and full CLI
completion remain required.

Current R13 verdict (2026-09-15): [R13 qualification](R13-QUALIFICATION.md)
closes the 21-node, two-feature compound corpus. All 22 scenarios are accounted;
the focused current check passes 6/6 with strict TypeScript, isolated Python and
offline locked Rust compilation/execution. R15–R18 and full CLI completion remain
required. Rust warning residue is retained explicitly.

Current R12 verdict (2026-09-15): [R12 qualification](R12-QUALIFICATION.md)
closes the exact 13-by-3 matrix. Fresh lanes pass 276/276 TypeScript, 140/140
Python and 62/62 Rust tests; the matrix/evidence/source validator passes 9/9.
The initial Python 138/140 environment failure remains preserved. R14–R18 and
full CLI completion remain required.

Current R11 verdict (2026-09-15): [R11 qualification](R11-QUALIFICATION.md)
closes all13 Rust realization cells, deterministic whole-crate wiring, offline
locked Cargo verification, exact selected output checks and actual CLI process
coverage. The fresh combined Rust lane passes62/62. R13–R18 and full CLI
completion remain required.
Existing resolved choices stay resolved.

Current R10 verdict (2026-09-15): [R10 qualification](R10-QUALIFICATION.md)
closes all13 Python realization cells. The exact37-file final lane passes140/140
without skips or todos. Native-only receipts remain incomplete by design; the
new complete `verify-project` receipt additionally passes exact output, all
semantic rows, shared-source outcome agreement, source/selection round-trip and
Lean4.33.1 finite structural verification. R13–R18 and full CLI completion
remain required.

Current R09 verdict (2026-09-13): [R09 qualification](R09-QUALIFICATION.md)
closes the original safe coherent TypeScript project requirement with73 unique
composite passing checks, preserved failures and exact recoveries. Strict source
typecheck and all six materializers pass. Normal CLI behavior is preserved;
optional Node permission mode is handled explicitly without a bypass. R10–R18
remain required. The following R08 updates are historical.

Latest R08 update (2026-09-13): [generic direct-provider selection is integrated and tested](evidence/verification-efficiency/SELECTION-INTEGRATION.md). Full semantic cases remain unchanged; selected direct-provider witnesses resolve the required mixed fixture's Operation output overflow without changing capacities. Its actual public run passes the Operation family and correctly leaves the oversized Workflow unavailable. Ten source/snapshot/API/actual CLI build checks and targeted native identity/layout regressions passed. R08 still requires its exact remaining qualification audit; R09–R18 and the full CLI goal are not complete.

Current qualification: [R08 final audit and WPE-T01–T10 evidence map](evidence/verification-efficiency/R08-QUALIFICATION.md). **R08 is completed.** The closing121-test set has composite passing evidence:116 original passes plus all five exact failing tests successfully rechecked. Original failures remain preserved. Recovery corrected one stale partial-audit assertion against the existing complete-source contract and improved subprocess diagnostics; runtime limits, proof semantics and domain code were unchanged. Strict project typecheck and all five materializers pass. Existing build/instantiation/layout adapter evidence is retained after checking unchanged source dependencies. R09–R18 remain required; no full CLI completion or release is claimed. The following implementation chronology, capacity-choice proposals and pending statements are historical and superseded by this current verdict.

R08ae14 implementation has started. The installed contract successor and exact
semantic/aggregate identity access passed **21/21 foundation tests**, including
both complete compound layouts and original receipt currentness controls.
All 517 captured inputs remained unchanged at the terminal audit; typechecking
and all five materializers passed. The installed successor retains the exact
17-contract predecessor projection and the unchanged 70-source compiler capsule.

The separate Workflow evidence-binding module is now connected to public
fulfillment. The combined native binding/public integration suite passed
**17/17 tests**, with all **519 captured inputs unchanged** at termination
(session71852; TAP SHA256
`6595842415782a037b5c9274dac1dc3955037542f7ac43ccaeae0fcc0ba29d05`).
Both compound layouts retain all12,460 cases/20,279 calls, preserve the original
unavailable standalone row, and fulfill Workflow obligations from exact retained
evidence. Independent failures, late artifact/receipt changes, cleanup failure,
zero-Workflow inapplicability and distinct audit origins are covered.

The added scalar and mixed coverage results follow below; remaining hostile
controls and every affected public caller/CLI regression still require
qualification. The153-test public join below is a
preserved predecessor checkpoint, not proof of every caller against this change.

The new coverage suite96659 passed4/5 tests: full scalar source/native semantic
commitments, the lawful19-node mixed graph and actual32MiB unavailable Workflow
are proven. Its independent Operation family exceeds the existing16MiB combined
native output limit (19,834,753 source-predicted bytes across four individually
bounded rows). Diagnostic5530 confirmed `ENOBUFS`; no limit has been changed.
Focused repair84652 passed1/1: Workflow accounting preserves six shared paths,
seven missing effect/module paths and the unavailable root while preserving that
independent failure. It does not fix the capacity issue. The
[Operation capacity decision](evidence/r08ae14-workflow-public/OPERATION-CAPACITY-DECISION.md)
asks whether to support bounded per-Operation transport or retain the combined
ceiling with explicit unavailable preflight.
See [R08ae14 progress](evidence/r08ae14-workflow-public/progress.json).

R08ae13 now qualifies the **public retained cross-generator join** across all
20 direct public callers and four compatibility files. The complete denominator
is **153/153 passing tests**, with no cancellations, skips or TODOs. This is an
explicit per-file qualification, not a claim that the original failed run passed:

- 100 tests from 14 wholly passing, unchanged, process-isolated files are retained
  after source/dependency and nested-test identity checks.
- All eight repaired files were rerun in full: **45/45 pass** (2,286,059.617622 ms).
- Two compatibility files were rerun after an uncaptured materializer dependency
  was found: **8/8 pass**, now with that script explicitly captured.

All **517 current captured inputs** passed the final currentness audit before this
ledger update. Final typecheck and five check-only materializers pass. CLI source
retains 247 files and 54 unique, existing proof-test registrations. The original
145/153 failed run, repair history, exact dependency mapping, separate successful
TAPs and final audit are preserved in the
[public progress record](evidence/r08ae13-public/public-progress.json).

Four outdated positive expectations now require actual retained evidence or
explicit inapplicability. Four native mutation harnesses execute two-mode batches
and retain original subprocess diagnostics. All **78 mutation modes**, their order,
mutation bodies, original assertions and existing product limits are preserved.

The public join observes every applicable retained family, propagates late source,
native, tool and receipt failures, and requires owned cleanup. Reports distinguish
sealed historical evidence from live receipts. The complete compound model retains
all seven families, 14 roots, 50 edges and 12,460 Workflow cases / 20,279 calls in
both layouts. Independent missing or failed obligations remain visible.

**R08 is still incomplete.** The additive
[Workflow public evidence binding](workflow-public-evidence-contract.json)
now supplies compound public semantic/effect/orchestration obligations through
original retained observations. The original standalone envelope, limits and
unavailable readiness remain unchanged. Remaining coverage and caller
qualification are described above; safe output remains R09.

The Operation capacity decision above is pending. R09–R18 and separately deferred AlchLang
reconciliation remain. No default cutover, admission, publication or release is
implied by this qualified component.

Earlier retained aggregation checkpoint:

R08ae13 qualifies **retained native cross-generator aggregation**. The
eight-file qualification passes **62/62**, with no failures, cancellations,
skips or TODOs (926,480.703554 ms). All **511 captured inputs remained unchanged**
at the terminal audit. Final typecheck and all five check-only materializers pass;
247 CLI source files and 53 unique existing proof-test registrations are retained.

All seven families execute over the complete compound model in both layouts:
14 roots, 50 import edges, and the original 12,460-case/20,279-call Workflow.
The aggregate retains independent missing and failed rows, checks original
source and complete tool/declaration selection, and revalidates every successful
private receipt. Overlapping Workflow coverage cannot hide an Operation failure;
source drift at final sealing revokes earlier passes. Empty obligations remain
inapplicable, not an observed native pass.

The initial 31/32 run exposed an output-capacity defect: fixed 4,096-case chunks
could exceed the native observer's 8 MiB output envelope. Workflow transport now
partitions by both input and complete observation size, retaining the same maximum
four batches, 4,096 cases per batch, 8 MiB per envelope and 32 MiB family limits.
The always-passing-Rule variant retains all 12,155 independently generated cases
and its unavailable families; the original model retains all 12,460 cases.
The initial failure and assertion corrections remain in the
[native progress record](evidence/r08ae13-public/native-progress.json), alongside
the [successful terminal TAP](evidence/r08ae13-public/native-qualified.tap).

The public executor, private CommonJS executor, original generated domain code,
70-source compiler capsule and 17-contract capsule are unchanged. This is a
qualified retained-execution component, **not public CLI verification or R08
completion**. Next: connect it to the public executor, recheck prerequisites
before owned cleanup, and qualify the supported entry points. R09-R18 and
separately deferred AlchLang reconciliation remain; no product decision is pending.

Earlier preparation checkpoint:

R08ae13 qualifies **installed cross-generator contracts and complete public
verification preparation**. The four-file compatibility run passes **23/23**
with no failures, cancellations, skips or TODOs (252,836.611085 ms).
All **504 captured inputs remained unchanged** at the terminal audit.
Typecheck and five check-only materializers pass; CLI source has 246 files and
proof registration has 52 unique existing test files.

A separate pinned 17-contract capsule supplies the selected definitions without
runtime development-directory reads. Compiled relocated preparation passes with
repository reads denied. The original 70-source compiler capsule is unchanged.

The registered preparation assembles Policy, State Machine, factory-to-Rule,
owned-value, Enum/sum producer, Operation and Workflow controls over the complete
same graph. One compound model has all seven nonempty families, 14 roots and
50 import edges. Both layouts retain the complete 12,460-case, 20,279-call
Workflow family in four batches. Repeated import occurrences, zero-edge roots,
unavailable families and standalone semantic obligations remain separate.
Original wrapper identity requirements never stand in for transitive call
behavior. Preparation continues to report behavior as not_evaluable.

[Preparation checkpoint](evidence/r08ae13-public/progress.json) and
[context](evidence/r08ae13-public/context.json) retain scope, input identities,
test evidence and initial assertion corrections. No private executor, public
executor, generated domain code, existing definition or compiler capsule changed.
The task-session/context-builder scope kept this prerequisite separate from
native result evidence and unrelated operational work.

**Next: retained native result aggregation/currentness, then its public executor
join and entry-point qualification. R08 and R09–R18 remain incomplete.**
AlchLang remains separately deferred. No new product decision is required.
No admission, default cutover, publication or release is implied.

Earlier retained Workflow checkpoint:

R08ae12 now qualifies **retained original Workflow ESM interoperability**.
The five-file compatibility run passes **48/48**, with no failures, cancellations,
skips or TODOs (527,983.008265 ms). All **493 captured inputs remained unchanged**
at terminal audit. Typecheck and four check-only materializers pass. CLI source
contains 243 files; proof registration contains 51 unique existing test files.

Both layouts retain the complete **12,460-case, 20,279-call compound family** over
four batches, with one original ESM module instance per Workflow. Scalar and
no-compensation cases, multiple lawful Workflows and unavailable whole families
are covered. Source, native module/effect/orchestration audits, each batch input
and output, manifests, original identities and exact semantic results remain bound.

The separate ESM executor captures and rechecks Node, TypeScript/platform, Node
declarations and Undici declaration dependencies. Compilation checks declarations
instead of skipping them. Retained/in-flight mutations, missing observations,
omitted audit modules and newly shadowed dependencies reject. No dependencies
were installed. The first multi-Workflow fixture violated existing `orchestrates`
cardinality; it was corrected to distinct Operations without changing the policy.

[Retained execution checkpoint](evidence/r08ae12-workflow/execution-progress.json)
and [execution context](evidence/r08ae12-workflow/execution-context.json) retain
the exact input hashes, terminal TAP, failure history and claim boundaries.
Generators, the public executor, existing CommonJS execution and the 70-source
capsule are unchanged. This completes the private R08ae12 Workflow family, not
R08 or the full CLI. **Public aggregation/currentness is the next runnable step**;
R09–R18 and separately deferred AlchLang reconciliation remain. No product
decision, admission, default cutover, publication or release is implied.

Earlier original ESM observation checkpoint:

R08ae12 qualifies **original Workflow ESM call observation**. The three-file
compatibility regression passes **31/31** with no failures, cancellations, skips
or TODOs (229,508.892135 ms). All **487 captured inputs remained unchanged** at
terminal audit. Typecheck and four check-only materializers pass.

The original compound generated ESM passes **12,460 cases and 20,279 calls per
layout**, including all four batches. Strict-compiling controls reject copied
arguments, results and dependencies, replaced wrappers, and equal-value object
reuse across batches. Missing, duplicated, reordered and drifted batches reject.
All three independent source/native audit facets remain required.

[Native observer checkpoint](evidence/r08ae12-workflow/native-progress.json)
retains exact inputs and terminal TAP. The next runnable construction step is
retained Workflow ESM execution with tool and Node declaration dependency custody;
public aggregation/currentness and R09–R18 remain. This is not whole-project,
security-sandbox, admission or release evidence. No product decision is required.

Earlier independent reference/control checkpoint:

R08ae12 qualifies **independent Workflow call-protocol references and complete
compact case controls**. The four-file compatibility regression passes **43/43**,
with no failures, cancellations, skips or TODOs; all **480 captured inputs remain
unchanged** at terminal audit. Typecheck and all check-only materializers pass.
The CLI source inventory is 241 files and proof registration is 49 unique files.

The complete nested Entity/Value Object/named-sum/Event example has **12,460 cases
and 20,279 expected direct calls in each layout**. Scalar coverage retains 133
cases and 998 expected calls. Original argument/result identity, repeated and
distinct Operation dependencies, every settlement mode, selected recovery,
generated clocks, reads/writes and no automatic compensation execution are
represented independently. These counts are expected protocol coverage, **not
original native call observations**.

The compound example exposed the older total byte and case ceilings. A separately
pinned private successor preserves the case-construction logic and commits to
the complete canonical semantic observations. It permits four 4,096-case native
batches (8 MiB each), at most 16,384 cases and 32 MiB aggregate. All batches and
cross-batch original-object identities remain required. Existing case APIs,
profile limits, generated code, public executor and 70-source capsule are unchanged.

[Protocol checkpoint](evidence/r08ae12-workflow/protocol-progress.json) retains
exact inputs, TAP and the capacity decisions. **R08ae12 remains incomplete**:
original ESM call observation and retained execution are next, followed by public
aggregation/currentness and all R09–R18 work. AlchLang remains separately deferred.
No product decision is required for the next implementation action.

Earlier Workflow source/audit checkpoint:

R08ae12 qualifies the **Workflow source surface and independent ESM audits**.
The five-file compatibility regression passes **47/47**, with no failures,
cancellations, skips or TODOs. All **471 captured inputs remained unchanged**
through terminal completion. Typecheck and four check-only materializers pass;
the proof suite registers 48 existing files and the CLI source inventory is 238.
Original forward Operation closures retain repeated occurrence identities and
exclude compensation-only providers. Source and native checks separately bind
module incidence, effects and whole-statement orchestration; none substitutes
for another. The generator, public executor and 70-source capsule are unchanged.

[Workflow checkpoint](evidence/r08ae12-workflow/progress.json) records the terminal
TAP and input hashes. **R08ae12 remains incomplete**: original materialization
and forward Operation call observation, retained ESM execution and whole-family
qualification are next, followed by public aggregation/currentness and R09–R18.
No product decision is required. AlchLang reconciliation remains deferred.

Previous whole-family checkpoint:

R08ae11 now qualifies **private Operation/provider interoperability**, including
original direct calls and retained execution. Source-derived expectations cover
guard order, cached factory initialization, owned child-to-parent identity,
Enum singletons, Event clocks and original Operation/Event wrapper identity.
The compound model passes 1,903 cases and 4,045 direct calls (including setup)
in each layout, across 13 original generated modules. The record-free Enum/sum
model passes 409 cases; scalar Operations also remain supported.

The eight-file compatibility regression passes **67/67**, with no failures,
skips, cancellations or TODOs. All **464 captured inputs stayed unchanged**
through the terminal run. Typecheck and all four check-only materializers pass;
proof registration contains 47 unique existing files and CLI source contains
236 files. Earlier factory, owned-value and producer control hashes remain
unchanged. Generators, public executor and the 70-source capsule are unchanged;
the private retained executor gains only a separately selected Operation branch.

Strict-compiling tests reject duplicate/missing calls, a wrong Event clock,
replaced wrappers, reused original owned returns and distinct owned Enum values
masquerading as one singleton. Retained and in-flight artifact/tool drift,
missing observations and unavailable whole families also reject. The uncovered
runtime-edge count now excludes type-only edges; transitive dependencies remain
separate obligations, not silently covered by direct Operation calls.

[Exact Operation qualification](evidence/r08ae11-operation/execution-progress.json)
and [execution context](evidence/r08ae11-operation/execution-context.json) retain
the evidence and next source links. This closes the private R08ae11 family,
**not R08 or the full CLI goal**. Next: Workflow interoperability, then public
aggregation/currentness. No product decision is needed.

Earlier Operation source-surface/native-audit checkpoint:

R08ae11 first established a verified **source-surface and native-audit checkpoint**.
Expected imports, type/value exports and complete provider closures now derive
from checked action bindings. The dedicated audit permits the exact Operation
and Event wrapper type reexports without weakening earlier factory/owned/Enum
audit profiles. Compound fixtures retain real entities, value objects, Enums,
named sums, repeated Event slots and ordered guards; scalar and Enum-only
Operations need no fabricated factory.

The four-file compatibility regression passes **36/36** (11 new tests), with
no failures, skips, cancellations or TODOs. Both layouts compile strictly and
pass source/CommonJS audits; 11 hostile audit variants are rejected. All **454
captured inputs remained unchanged** through the run. Typecheck and all four
check-only materializers pass; the serial proof list has 45 unique existing
files, and CLI source contains 233 files. Old factory, owned-value and producer
control hashes remain unchanged. Generators, public executor and the 70-source
capsule are unchanged.

At that earlier checkpoint, original dependency-call observation and retained
execution were still required; they are now qualified above. A matched module
surface alone is not behavioral proof.
[Checkpoint evidence](evidence/r08ae11-operation/progress.json) and
[definition/scaffold](cross-generator-operation-contract.json) preserve the
remaining requirements. No product decision is needed.

Last completed whole-family checkpoint (R08ae10):

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

**R08 and all R09-R18 remain incomplete.** Next is Workflow producer-consumer
coverage, followed by public aggregation/currentness. No product decision is
needed. No language semantics, defaults, installation, publication, release or
authority change is implied; AlchLang reconciliation stays separately deferred.

Historical R08ae9 checkpoint:

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

Historical R08ae8 checkpoint:

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

Historical R08ae7 checkpoint:

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

Historical R08ae6 checkpoint:

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

Historical R08ae5 checkpoint:

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

Historical R08ae4 checkpoint:

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

Historical R08ae3 checkpoint:

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

Historical R08ae2 checkpoint:

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

Historical R08ae1 checkpoint:

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

Historical R08ad5 checkpoint:

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

Historical R08ac3 checkpoint:

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

Historical R08ac2 typed-reference checkpoint:

R08ac2 completed the independent typed Workflow value reference and native
call fixtures. The complete six-suite Workflow regression passed **65/65**,
exit 0, with no skips or cancellations. The new 12-test suite covers primitive
and nested named/optional/list/set/sum values, Event input shape and signed
integers, exact result/capture custody, 16 actual failure-prefix cases, explicitly
held begin/commit promises, and eight compiling materialization mutations.

The reference preserves the distinction between structural materialization and
Operation-owned business rules. All 198 predecessor CLI source files and the
56-source capsule remained unchanged; one private reference source was added.
The proof command now includes the new suite exactly once (25 files total).
Pinned typecheck and all four check-only materializers passed.
See [typed Workflow evidence](evidence/r08ac2/qualification.json).

**R08 remains incomplete.** Next is R08ac3: exact public Workflow source,
descriptor/import binding, source/native audits, custody/currentness and
whole-node capacity controls. Public Workflow semantic rows remain
not_evaluable. Authored-composition controls and all remaining R08–R18
obligations stay in the full CLI completion denominator.

Historical R08ac1 metadata foundation checkpoint:

R08ac1 completed the independent Workflow settlement/recovery metadata foundation.
The focused reference plus unchanged Workflow generation, outcome and recovery
suites passed **44/44** (no skips), including **63 native settlement cases**,
all **25 three-compensation DAGs** in all six declaration orders, and **seven
compiling generated-provider mutations**. The new suite is registered in
`test:proof`; existing test commands and cases were retained.

The reference derives expectations from checked source and authored bindings,
not the production outcome evaluator or selected recovery planner. All 197
predecessor CLI source files and the 56-source capsule remain unchanged; one
private reference source was added. Pinned typecheck and all four materialization
checks passed. See [Workflow verification](WORKFLOW-VERIFICATION.md) and
[exact evidence](evidence/r08ac1/qualification.json).

**R08 remains incomplete.** Next: R08ac2 typed Workflow argument/result and
deferred-call fixtures, then R08ac3 public source/native binding, audits and
capacity checks. Public Workflow semantic rows remain not_evaluable. No product
semantic decision changed, and R09–R18 remain in the completion denominator.

Historical R08ab2c qualification checkpoint:

R08ab2c completed cross-adapter regression qualification across all **23 proof
files plus 11 generator, binding and entrypoint suites**. The broad run finished
**216/217 passing**, with one stale Policy expectation: it still counted a now-
verified Operation as unmet. The corrected complete Policy suite passed **5/5**,
explicitly checking exact, nonempty Operation coverage while retaining the
genuinely unmet constant Policy. All 217 checks are covered across those runs;
this is not a claim of one all-pass full-suite invocation.

The three failures observed in the earlier interrupted run all passed unchanged
in focused diagnostics and again in the broad run. Their original causes remain
unestablished. Seven test-helper catch blocks now retain subprocess error messages
and causes; 14 controlled error cases passed. No product source, assertions,
test cases or timeout limits were weakened.

All **197 CLI source files** remained unchanged, with no added source files.
Only the corrected Policy test differs from the 231-file broad-run manifest.
Pinned typecheck and all four source-materialization checks passed, including
the unchanged 56-source capsule. Full reports, source hashes and the exact
cross-run coverage boundary are saved in
[qualification evidence](evidence/r08ab2c/qualification.json) and summarized in
[cross-adapter qualification](PUBLIC-COMPILER-INTEGRATION.md#cross-adapter-regression-qualification-r08ab2c).

**R08 and the working CLI remain incomplete.** Next: source-derived Workflow
semantic verification, then authored-composition controls and all remaining
R08–R18 obligations. Existing product choices, legacy defaults, SFOL, AlchLang,
production providers, installation and publication remain unchanged.

Historical verified R08ab2b checkpoint:


R08ab2b connects the independent Operation references and run-local transaction
fixture to public semantic verification. Complete bounded cases now produce ready
Operation rows; readiness alone is not a passing verification result. Exact
source/action/descriptor bindings, declared import closures, source/native effect
audits and evidence currentness are checked separately. No production store,
Event publication or durability claim is introduced.

The public commerce fixture passed all **1,904 Operation cases**. The new negative
controls rejected **18 altered programs/evidence cases** and **three Enum-support
mutations**. Five focused checks passed, including whole-node capacity and shared
import deduplication/conflict rejection. The record-free and effectful reference
regression passed **22/22**, including **41 compiling provider mutations**.
Pinned typecheck and all four materializers passed. The capsule now has **56
sources**, preserving every one of the 55 predecessor source bytes.

All **10 new Operation integration tests** are covered by passing focused runs.
Enum-only public results need no dummy Entity or factory; project-wide capacity
retains every source node and the rejected nodes' audit closures.

The 24-test shared regression initially passed 22 tests and exposed a Lean timeout
plus an obsolete semantic-coverage expectation. After correcting only obsolete
expectations in two test files, serial rechecks passed **2/2**, including real
Lean and the actual CLI in both output layouts. All 24 checks are covered across
those runs, not one all-pass invocation. Real Lean assertions and product
timeouts are unchanged. See
[exact evidence](PUBLIC-COMPILER-INTEGRATION.md#public-operation-semantic-controls-r08ab2b).

**R08ab2b is verified candidate progress; R08 and the working CLI are not complete.**
Next: broader cross-adapter regression qualification before Workflow/composition
controls, then all remaining R08–R18 obligations. Existing product decisions,
source schemas, generators, SFOL, AlchLang and defaults remain unchanged.

Historical R08ab2a checkpoint (public integration is added above):

R08ab2a extends that foundation with the checked effectful Operation reference
and deferred Entity-read/Event-clock fixture. It preserves exact selected action
identity; structural-only reads; recursively owned write/result validation;
separate repeated Event occurrences; required versus explicit generated clocks;
signed Event integers; typed read identities; and exact create/replace/delete
intents. Read normalization does not inherit the Operation input-capture limit.

Final effectful tests passed **9/9**, detecting **17 compiling provider mutants**.
A preceding combined invocation passed **19/19** (six then-current effectful
tests plus all **13 record-free tests**, including their **24 mutants**).
The final nine-test run covers later additions and the read-limit correction.
The focused unchanged regression passed **31/31**. Pinned typecheck and all four
materializers passed; all 55 capsule sources remain unchanged. See
[exact evidence and scope](PUBLIC-COMPILER-INTEGRATION.md#effectful-operation-reference-and-fixture-r08ab2a).

**R08ab, R08 and the working CLI are not complete.** Public Operation rows
remain `not_evaluable`. Next: R08ab2b public Operation integration, exact
descriptor/provider/import bindings, async-compatible audits and currentness,
whole-node capacities and hostile custody checks. The new definition remains
private until that integration is verified. Continue all R08–R18 requirements;
no product decision, production provider, installation or publication is implied.

Historical R08ab1 checkpoint (superseded by the R08ab2a continuation above):

R08ab1 adds the independent Operation reference and deferred fixture-port foundation.
The record-free scalar/Enum/optional/list/set/sum fixtures compile and run without
a dummy Entity, including an exposed Interface. Cases preserve exact value
carriers, source Rule order, pre-await capture, immutable detached outcomes,
one empty state/outbox batch, awaited begin/commit/rollback, and distinct rejection,
cleanup failure and commit uncertainty. All **24 compiling behavioral mutants**
are detected.

The final new-suite invocation passed **13/13** tests; the focused unchanged
Operation/action-binding/minimal-context/source-capsule regression passed **31/31**.
Pinned typecheck and all four materializers passed. These are two test invocations,
not a rerun of the historical 215-test broad regression. The existing 55-source
capsule and public compiler/verifier remain unchanged; the new definition is
a private construction source, not yet registered in that capsule.

**R08ab and the CLI are not complete.** Public Operation rows still report
`not_evaluable`. Next: extend the independent reference and fixture to Entity
reads, owned write/result validation and Event clocks, then integrate exact
descriptor/import/provider bindings, audits and bounded whole-node cases into
public verification. Keep all R08–R18 requirements and the previously resolved
product choices. No production provider, installation, default change or
publication is authorized by these tests.
See [Operation foundation evidence](PUBLIC-COMPILER-INTEGRATION.md#operation-fixture-foundation-r08ab1).

Historical R08aa checkpoint (Operation fixture foundation is added by R08ab1):

R08aa adds independent Interface value and signature controls to public verification.
Every public contract and endpoint side retains exact normalization, qualified
keys, frozen detached values and source-bound descriptors. Version eligibility
keeps exact/backward behavior without implying shape compatibility or member
execution. Independent compiler consumers check readonly structural signatures.

Source/native Interface audits retain exact standalone closures, phases, hashes
and script currentness. Signature source/configuration changes and late drift
cannot authorize or retain native evidence. Capacity preserves the whole source
Interface, including all owned contracts; structural public values do not
require factory witnesses.

The 215-test, 34-file broad regression passed **214 checks** and found one
obsolete Mapping expectation (`not_evaluable` instead of the actual `pass`).
After correcting only that assertion, its fresh native rerun passed **1/1**.
The compiler and every other test byte stayed unchanged. All 215 checks are
covered across those runs; no unresolved failure, cancellation or skip remains.
See the exact run evidence below; this is not a single all-pass invocation.
Seven Interface tests include 36 mutation modes, six audit custody modes,
three capacity/literal modes, 15 shape variants and poisoned-module isolation.
Pinned typecheck and all four materializers pass. The 55-source capsule preserves
all 54 predecessors. The compiler and 15 non-document paths retained their broad-run bytes;
only the corrected Mapping assertion changed afterward and passed its recheck.
All 131 prior checkpointed paths outside this 19-file scope are unchanged.

R08 remains in progress. Next: independent Operation controls under the existing
action and atomic transaction-port contracts, using run-local fixture ports only.
All R08–R18 completion requirements remain active. No new product decision,
generator/schema change, default cutover, installation, production provider
effect or publication is involved.
See [Interface evidence](PUBLIC-COMPILER-INTEGRATION.md#interface-value-and-signature-controls-r08aa).

Historical R08z checkpoint (Interface coverage is added by R08aa):

R08z adds independent Query selection controls to public verification.
Complete explicit parameters and rows validate before filtering, stable ordering,
limits and projection. Exact numeric values, repeated rows, structured equality
and declared field order remain distinct. Read models stay frozen detached
values, not Entity construction or invariant execution.

Source/native Query effect audits bind exact closures, phases, hashes and script
currentness. Finite capacity retains whole unmet Queries, including limits whose
boundary witness exceeds the row budget. No database or application provider
executes. Twelve structured-shape variants and poisoned-module execution confirm
independence from factory witnesses and non-Query modules.

The final focused suite passes **25/25**. Frozen-source regression passes
**192/192 tests across 31 files**, with no failures, cancellations or skips
(session `61789`, `1354980.291514 ms`).
Seven Query tests include 33 compiling mutations, six custody modes, three
capacity/literal modes, structured equality/projections and native isolation.
Pinned typecheck and all four materializers pass. The 54-source capsule preserves
all 53 predecessors. All 16 non-document paths and 124 prior checkpointed paths
outside this 19-path scope retain verified bytes.

R08 remains in progress. Next: Interface public/endpoint value, identity,
descriptor, version-policy and structural-signature controls under the existing
contracts, without member execution, transport or provider effects. All R08–R18
completion requirements remain active; no new product decision, generator change,
default cutover, installation or publication is involved.
See [Query evidence](PUBLIC-COMPILER-INTEGRATION.md#query-selection-semantic-controls-r08z).

Historical R08y checkpoint (Query coverage is added by R08z):


R08y adds independent Mapping projection controls to public verification.
Explicit already-computed inputs, v1 absence-only defaults, v2/v3 lazy nullish
defaults, exact UInt64 carriers and qualified public identities remain distinct.
Native observations check complete ordered frozen projections, caller detachment
and source-bound descriptors without implicit factory, invariant, Calculation
or endpoint execution.

Separate source/native Mapping effect audits preserve whole-node accounting,
exact imports and observation custody. Late drift invalidates dependent evidence.
Fifteen nested shape variants and poisoned-module execution preserve structural
values without requiring a satisfying factory witness.

The focused Mapping/capsule suite passes **11/11**. Frozen-source regression passes
**178/178 tests across 29 files**, without failures, cancellations or skips
(session `2709`, `1076106.762043 ms`).
Seven Mapping tests include 28 compiling mutation modes, six custody modes,
whole-node capacity, nested projections and poisoned-module isolation.
Pinned typecheck and all four materializers pass. The 53-source capsule preserves
all 52 predecessors. All 16 non-document paths and 117 prior checkpointed paths
outside this 19-path allowlist retain verified bytes.

R08 remains in progress. Next: Query semantic controls for explicit supplied rows,
filtering, projection, ordering, limits and multiplicity without database/provider
I/O. All R08–R18 completion requirements remain active. No product decision,
generator change, default cutover, installation or publication is involved.
See [Mapping evidence](PUBLIC-COMPILER-INTEGRATION.md#mapping-projection-semantic-controls-r08y).

Historical R08x checkpoint (Mapping coverage is added by R08y):

R08x adds independent Event construction controls to public verification.
Occurrence identity, payload values, exact signed integers, optional absence,
time policy and immutable copies remain distinct. References are source-bound
data, not module imports or lookup. Frozen constructor descriptors are checked
against source, reference and provider evidence, including explicit effect claims.

Required time never calls an extra clock; generated time calls one deterministic
fixture clock after validation. Source/native effect audits retain whole unmet
Events and exact custody/currentness. The shared parser preserves the existing
State Machine audit bytes and its unexecuted Event-intent boundary.

The final focused suite passes **20/20**. Frozen-source regression passes
**151/151 tests across 26 files**, without failures, cancellations or skips
(session `81057`, `936608.531641 ms`). Seven new Event tests include 32 compiling
mutation modes, six custody modes, whole-node capacity and poisoned-reference
execution. Pinned typecheck and all four materializers pass. The 52-source capsule
preserves all 51 predecessors. All 17 non-document paths and 108 prior checkpointed
paths outside this 20-path allowlist remain unchanged after verification.

R08 remains in progress. Next: Mapping semantic controls with explicit inputs,
source/target identities and declared defaults, without implicit Calculation,
factory, invariant, transport or provider execution. No new product decision,
generator change, default cutover, installation or publication is involved.
See [Event evidence](PUBLIC-COMPILER-INTEGRATION.md#event-construction-semantic-controls-r08x).

Historical R08w checkpoint (Event construction coverage is added by R08x):

R08w integrates the existing State Machine syntactic effect restrictions into
public verification, across exact TypeScript and emitted-JavaScript reducer/Rule
closures. Source auditing retains machines with unmet finite witness budgets.
The native audit runs before semantic execution; changed audit artifacts prevent
execution or invalidate earlier dependent evidence. Strings and comments remain
distinct from forbidden identifiers. This is a bounded syntactic audit, not
universal purity or automatic Event execution.

Two failing tests demonstrated ambient global writes escaping finite outcomes
and changed audit scripts allowing native execution. Both are repaired.
The final expanded audit tests pass **3/3**, including twenty compiling
effect/capacity mutations, six evidence/custody modes and three scope cases.
Frozen-source regression passes **135/135 tests across 24 files**, without
failures, cancellations or skips (session `60417`, `766478.788805 ms`).
Pinned typecheck and all four materializers pass. The 51-source capsule
preserves all 50 predecessors. All eleven non-document files and the 108 prior
checkpointed paths outside this 14-path scope remain unchanged after verification.

R08 remains in progress. Next: Event construction semantic controls under the
existing contract, without clock, identifier-allocation, dispatch or provider
effects. No new product decision, generator change, default cutover, installation
or publication is involved. See
[effect-audit evidence](PUBLIC-COMPILER-INTEGRATION.md#state-machine-effect-audit-integration-r08w).

Historical R08v checkpoint (its source-audit gap is closed by R08w):

R08v adds independent State Machine semantic controls for every declared
state/trigger pair and a bounded structural input corpus. They preserve initial
state, declared Rule guards, guard versus no-transition rejection, exact transition
identity and ordered unexecuted output intents, including repeated Event references.
Native observations require closed deeply frozen outcomes, inert unmodified inputs
and exact reducer/Rule imports. Guardless machines need no fabricated Rule.

A compiling mutation exposed NaN/Infinity collapse in caller fingerprints; the
observer now distinguishes special numeric values. Final frozen-source regression
passes **132/132 tests across 23 files**, without failures, cancellations or skips
(session `66465`, `755609.340542 ms`). The six new tests include 24 mutation/effect/drift
modes, structured guard inputs and native execution with every Event module poisoned.
Pinned source typecheck and all four materializers pass. The 50-source capsule
preserves all 49 predecessors. The 12 non-document paths and 103 earlier checkpointed
paths outside this 15-path scope are unchanged after verification.

R08 remains in progress. Review identified that the standalone State Machine
observer's ambient-effect source audit is not yet integrated into the public
executor; finite outcome/import checks are not a purity proof. R08w will close
that existing-contract gap before Event controls. No new product decision,
generator change, default cutover, installation or production effect is involved.
See [State Machine evidence](PUBLIC-COMPILER-INTEGRATION.md#state-machine-semantic-controls-r08v).

Historical R08u checkpoint (State Machine coverage is added by R08v):

R08u adds independent Policy semantic controls over declared Rules, preserving
ordered first-match/default selection and selector-only targets. Shared structural
facts remain independent of factory ownership. Missing input-sensitivity witnesses
or exceeded finite budgets leave the entire Policy explicitly unmet.

Review exposed an emitted-JavaScript target import that escaped the initial
controls. Native per-module import guards now reject undeclared imports, including
caught dynamic imports. The final frozen-source regression passes **115/115 tests
across 21 files**, with no failures, cancellations or skips (session `11772`,
`655905.620591 ms`). This includes 15 Policy mutation/effect/drift modes and a
native poisoned-strategy test. Pinned typecheck and all materializers pass.
The 49-source capsule preserves all 48 predecessors. All 15 non-document paths
remain unchanged after the run; all 96 earlier checkpointed paths outside the
18-path scope are preserved. No domain-code generator or product default changed.
R08 remains in progress. Next: State Machine semantic controls with declared
triggers/guards and output intents, without event or operation execution. See
[Policy verification evidence](PUBLIC-COMPILER-INTEGRATION.md#declared-rule-policy-semantic-controls-r08u).

Historical R08t checkpoint (Policy coverage is superseded by R08u):

R08t adds independent standalone Rule controls over structural facts, without
factory ownership or implicit invariant execution. Exact UInt64, raw String
ordering, Entity/value equality, optional and sum data, list/set images and
first-representative behavior retain the agreed semantics. False remains a valid
Rule result; invalid input must reject without getters or mutation. Exceeded
finite bounds keep the entire Rule explicitly unmet, with all source nodes retained.

Final frozen-source regression passes **100/100 tests across 19 files**, with
zero failures, cancellations or skips (session `34849`, `605352.904369 ms`).
The Rule suite detects 13 syntax-valid semantic mutants and late workspace drift.
Pinned typecheck and all materializers pass. The 48-source capsule preserves all
47 predecessor pins. All 17 non-document paths remain unchanged after the run,
and all 89 earlier checkpointed paths outside the 20-path scope are preserved.
R08 remains in progress; next are Policy semantic controls over declared Rules,
with ordered selection and no target execution. See
[standalone Rule evidence](PUBLIC-COMPILER-INTEGRATION.md#standalone-rule-semantic-controls-r08t).

Historical R08s checkpoint (standalone Rule coverage is superseded by R08t):

R08s adds separate bounded Entity and Value Object factory lifecycle controls:
create, reconstruct, fresh identity-preserving transitions and every declared
extension order. Source-predicted Rule traces, failure ordering, owned fields,
components, freezing and input preservation are checked against actual native
factories. Missing witnesses or exceeded budgets leave the entire factory unmet;
standalone Rules and other adapters remain explicit. No product semantics changed.

The full frozen-source regression ran **96 tests: 95 passed, one failed**
(session `24738`, `479187.433647 ms`). Its only failure was an existing late-drift
assertion still expecting two tested nodes instead of three after the Entity
adapter became ready. After correcting that count, the entire affected semantic
suite passes **6/6** (session `75638`, `32844.083183 ms`). No skips or cancellations
occurred. All other frozen non-document bytes remain unchanged; the broad run
is not relabeled as a 96/96 rerun. Native factory tests, nine compiling lifecycle
mutants, late drift and mixed inline/named-sum fields pass. Pinned source
typecheck and all materializers pass. The 47-source capsule preserves all 46
predecessor pins. All 82 checkpointed paths outside the 21-path scope remain
unchanged. R08 remains in progress; see
[factory lifecycle evidence](PUBLIC-COMPILER-INTEGRATION.md#explicit-factory-lifecycle-semantic-controls-r08s).

Historical R08r checkpoint (superseded for factory lifecycle coverage by R08s):

R08r adds source-derived Entity/Value Object witnesses for sum payloads.
The actual factories execute their explicit base Rules; source-predicted traces,
owned fields, identity/value keys, recursive freeze and input preservation are
checked independently. Missing satisfying witnesses remain unmet, not an
unsatisfiability claim. Standalone factory lifecycle and Rule nodes remain
explicitly unverified. Initial combined checks pass 13/13, including six compiling
factory mutants and late drift; two strengthened search/accounting tests and
pinned typecheck/materializers pass. Broad regression passes 91/91 across 17
test files; final frozen-source affected checks pass 15/15 across four files.
No failures, cancellations or skips occurred in either run. The evidence report
distinguishes the broad run from the subsequent final-code rerun.
The 46-source capsule preserves all 45 earlier pins. All 80 checkpointed paths
outside the 17-path scope remain unchanged. R08 remains in progress;
see [record payload witnesses](PUBLIC-COMPILER-INTEGRATION.md#owned-record-payload-witnesses-r08r).

R08q adds source-derived recursive sum controls for scalars, exact UInt64,
optional/list/set, inline sums and owned Enum/sum dependencies. Native observations
check complete variants, keys/equality, recursive freeze and deep no-mutation/
getter execution. Sums requiring Entity/Value Object construction retain an
explicit factory-witness dependency; no payload is erased. Focused Enum/sum
tests pass 6/6, including ten syntax-valid behavioral mutants and late drift;
capacity accounting, pinned typecheck and all materializer checks pass. Final
serial regression passes 86/86 across 16 test files, with zero failures,
cancellations or skips (session `84610`, `505928.550508 ms`).
The 45-source capsule preserves all 44 predecessor pins. All 76 checkpointed
paths outside the 16-path scope remain unchanged. R08 remains in progress;
see [recursive sum controls](PUBLIC-COMPILER-INTEGRATION.md#recursive-payload-sum-semantic-controls-r08q).

R08p adds independent plain-Enum semantic controls: exact source members,
owned-case identity, equality, keys, frozen output and invalid/foreign-case
rejection. Payload-bearing sums remain explicitly unverified; no payload or node
is dropped. Three focused native tests pass, including six compiling mutants and
late component drift. Pinned typecheck and all materializer checks pass. Final
serial regression passes 83/83 across fifteen suites, with zero failures or
skips. The 44-source capsule preserves all 43 earlier
pins, and all 73 checkpointed paths outside the 14-path scope remain unchanged.
R08 is still in progress; see [plain Enum controls](PUBLIC-COMPILER-INTEGRATION.md#plain-enum-semantic-controls-r08p).

R08o implements bounded independent Calculation-v1/v2 semantic controls.
Every source node remains accounted for, including early failures; other metatypes
remain explicitly unverified. The permission-restricted native runner has no
inherited credentials or filesystem-write/network/subprocess permissions.
Exact observation and final workspace checks reject compiling arithmetic mutants,
forbidden effects and late drift, including partial evidence. Pinned typecheck
and all materializer checks pass; the capsule contains 43 sources with all 42
earlier pins preserved. Final serial regression passes 80/80 across fourteen
suites, with zero failures, skips or cancellations. All 70 earlier
checkpointed paths outside the 13-path scope remain unchanged.
This is R08 progress, not full semantic coverage or CLI completion.
See [Calculation semantic controls](PUBLIC-COMPILER-INTEGRATION.md#independent-calculation-semantic-controls-r08o).

R08n connects selected `verify-project`, source and checked-snapshot verification,
and the public API overload to the complete executor. Explicit application-layout
targets use the same whole-project view/receipt as publication, without target
writes or layout inference. Fail and incomplete results exit nonzero and retain
every unmet behavior requirement. Final regression passes 74/74 with no failures
or skips; pinned source typecheck, generated-source checks and native declarations
pass. All 62 earlier checkpointed paths outside this scope remain unchanged.
This completes R08n, not R08 or the CLI. Selected-generator, cross-generator and
composition semantic controls remain runnable R08 work; no product decision is
missing. See [stronger verification entry points](PUBLIC-COMPILER-INTEGRATION.md#stronger-verification-entry-points-r08n).

R08m extends stronger verification to the complete composition artifact inventory.
TypeScript compilation, JavaScript syntax and independent module-surface checks,
exact replay, Lean source preservation, and final workspace inventory checks now
cover the complete output. Behavior controls remain explicit and unmet; the
positive composition report is `incomplete`, not a whole-project assurance pass.
Final regression passes 50/50 with no failures/skips; pinned source typecheck and
materializer checks pass. All 58 earlier checkpointed paths outside this scope
remain unchanged. This completes R08m, not R08 or the CLI. R08n above subsequently
implements stronger CLI integration and explicit application-layout target checks;
the semantic controls remain. See [complete artifact coverage](PUBLIC-COMPILER-INTEGRATION.md#complete-verification-artifact-coverage-r08m).

R08l connects the checked composition adapter to public source/snapshot builds,
project/node instantiation views and CLI build/currentness output. The complete
composition inventory and imports are preserved in both plain and application
layouts; domain-only node views remain exact forward native import closures.
The source bundle adds two definitions while retaining all 38 earlier pins.
At that checkpoint stronger verification rejected composition-bearing plans;
R08m above replaces the API guard with complete accounting and explicit unmet
behavior checks. The current single-composition source profile and legacy defaults
are unchanged.
Final regression passes 55/55 with no failures/skips, including native and Lean
checks; source typecheck passes. This completes R08l, not R08 or the full CLI.
See [public composition integration](PUBLIC-COMPILER-INTEGRATION.md#public-composition-integration-r08l).

R08k repairs both input defects recorded by R08j: relationship witnesses now
resolve by owner plus local ID, and composition record binding accepts canonical
`Value Object` while preserving its existing identity/invariant restrictions.
The finite projection and independent Lean interchange decoder use the same
ownership semantics, independently implemented and tested. The explicit v9
source selection pins this repair without refreshing historical selections.
Final focused regression passes 14/14 (including the existing certification
suite), configuration passes 12/12 and pinned source typecheck passes. The broad
run is 183/184: the remaining legacy B15 test hardcodes a missing local compiler;
that harness failure is recorded, not counted as a compiler pass.
See [input-boundary evidence](PUBLIC-COMPILER-INTEGRATION.md#input-boundary-repairs-r08k).
Public composition integration and stronger verification remain R08 work.

R08j adds a checked composition-binding planner over the existing R07 native
plan. Preserved behavior calls exact qualified Calculation-v1 modules through
a generated argument-renaming adapter; record bindings remain structural, with
no factory calls or automatic invariant enforcement. Five new tests and the
six-suite regression pass 39/39 with zero failures/skips; typecheck passes.
Public composition integration and stronger verification remain guarded, not
complete. The fixture also exposed an existing cross-feature local-edge-ID
witness collision; source inspection found a Value Object kind-normalization
mismatch. Both remain explicit bounded repair work in the
[composition binding evidence](PUBLIC-COMPILER-INTEGRATION.md#checked-application-composition-bindings-r08j);
neither is erased by passing adapter tests.

R08 API bridge: [public compiler integration evidence](PUBLIC-COMPILER-INTEGRATION.md).
Explicit authored selection now constructs checked bindings and automatically
joins all thirteen metatypes through the R07 plan. Public source/snapshot APIs
agree; exact node views follow native imports without adding semantic-edge
execution. Native compound code runs in two roots. Final source-worktree checks
pass 45/45 and the unchanged legacy suite passes 8/8 in an isolated locked-deps
harness; no failures/skips in those final runs. Typecheck passes. The source
capsule now contains the prior 37 unchanged pins plus this new definition.
The selected `instantiate`, `instantiate-project`, `build` and `verify` commands
now share this plan through explicit `--compilation-selection`. Local output
receipts bind exact artifact bytes and selection; verification checks currentness,
not native or formal assurance. Seven affected suites pass 44/44, with no failures
or skips; typecheck passes. The existing source/snapshot build APIs, publication
and currentness verification now accept explicit selection through the common
checked plan; old signatures and return types are preserved. Final focused
regression passes 41/41, with no failures/skips; typecheck and native public
declaration/checkout-isolation checks pass. Legacy composition regression passes
11/11 in the prior 42-test run. Node/project instantiation APIs and their selected
CLI commands now share exact whole-project-checked views and scoped publication.
The final combined run passes 46/46, legacy planning passes 8/8 in the verified
locked-dependency harness, and the selected old project-publication/race test
passes 1/1. No failures/skips; typecheck and native scope/relocation checks pass.
The successor verification-input projection now preserves the complete typed
semantic graph, authored compilation selection, native requests/modules and exact
node views. It reconstructs caller JSON against checked source and plan, retains
all required evidence, and reports verification as not executed. The compiled
public API works with checkout access denied; combined regression passes 51/51
with no failures/skips, and source typecheck passes. Legacy formalization guards
remain unchanged. This is a prerequisite, not a stronger verification receipt.
Successor formalization now emits a self-contained, lossless Lean module with
finite graph/reference checks. All thirteen source kinds round-trip through
Lean, wrong typed references reject, Workflow binding order remains independent
of source occurrence order, and standard Lean foundation dependencies are
audited explicitly. Final affected regression passes 59/59 with no failures/skips;
typecheck and compiled API relocation pass. This is not runtime conformance or
a completed stronger verification command.
The successor execution API now runs strict native TypeScript compilation,
independent AST inspection, exact source replay, Lean kernel/axiom/round-trip
checks and read-only output currentness. Late drift invalidates dependent
evidence; missing tools, changed targets and interrupted/unavailable private
workspaces fail closed. Final execution tests pass 7/7 and source typecheck
passes. The broader run reported 62 passes and two Lean timeouts; the unchanged
proof suite passes 8/8 on isolated retry without timeout changes. Runtime-semantic
controls, cross-generator behavior and publication-safety qualification remain
explicitly unavailable, so the positive execution report is `incomplete` and
selected `verify-project` is not yet enabled. No earlier obligation was waived.
Explicit whole-project application layout now wraps the same checked project:
module bytes and relative imports are unchanged, paths are prefixed under
`domain/typescript/src/`, and the receipt uses `evidence/project-build.json`.
Source/snapshot APIs and real CLI build/verify agree; native published modules
execute the same compound behavior in two roots. Final affected regression passes
77/77 with no failures/skips, and typecheck passes. Omitted layout retains exact
prior output. Stronger `verify-project` and authored application composition
integration remain before R08 closure.
Defaults are unchanged; no product decision is needed. Concurrent-writer
qualification remains R09.

R07 complete: [artifact/import and minimal-context evidence](SHARED-ARTIFACT-PLAN.md).
All thirteen metatypes join through existing generators; the resulting native
TypeScript project compiles and runs in two output roots. Independent native AST
observation verifies imports/exports and detects compiling substitutions. Scalar,
inline-value and Enum-only Operation/Workflow/public-boundary paths need no dummy
record. The 37-source bundled loader works after native compilation/relocation
with development-file access denied. Affected regressions pass 113/113, followed
by final minimal/capsule/shared checks at 19/19; configuration passes 12/12.
No failures/skips; source typecheck and unchanged all-13 native bytes pass.
No input waivers, public API or default cutover. No product decision is required.

R06 complete: [all-13 TypeScript input accounting](TYPESCRIPT-INPUT-CLOSURE.md)
records each selected source/version, native form, bounds, dependencies and tests.
It closes the approved [standalone exact Calculation](CALCULATION-V2.md) and
standalone payload-bearing Enum gaps without dummy consumers or old-version changes.
Shared regression passed 201/201 and 63/63; final residual checks passed 27/27,
followed by the final six-test Enum suite. No failures/skips; source typecheck passes.
R08–R18 remain; no public CLI or release completion is claimed.

Current public generation frontier: [R05 native artifacts](PUBLIC-BOUNDARY-GENERATION.md).
The source-bound planner emits Interface-qualified imports, unchanged structural
Interface contracts and pure typed public/domain Mapping projections. Eight shared
suites pass **82/82**, zero failures/skips; the final additional signature observer
control passes separately. Native consumers, exact/nested values, partial results,
qualified identity and compiling semantic mutants are covered; typecheck passes.
Full supported-input accounting, public CLI integration and R07–R18 remain.

Current public Mapping frontier: [R04 typed bindings](PUBLIC-MAPPING-BINDINGS.md).
Versioned Mapping v3 preserves Interface-qualified contract identity and separate
member-use evidence, with exact domain/public field bindings and unchanged maps /
exposes edges. Eleven affected suites pass **212/212**, no failures/skips; legacy
compatibility passes **55**, with one unavailable Lean-provider skip and no failures.
Source typecheck passes. New-format legacy execution/proof paths reject explicitly.
Native public Mapping generation, configured Interface integration and R06–R18 remain.

Current Workflow frontier: [R03 native generation](WORKFLOW-GENERATION.md).
The candidate planner emits exact Operation imports, awaited source-ordered calls,
R01 settlement evaluation and R02 typed recovery bindings without compensation
dispatch. Eight affected suites passed **81/81**; after final profile checks,
the new Workflow suite passed **15/15** and source typecheck passed again.
Repeated and distinct Operation fixtures, every failure prefix, uncertainty,
guard/invariant preservation and independent compiling-mutant controls pass.
Public CLI integration, remaining TypeScript inputs and later PCR stages remain.

Preceding Workflow frontier: [R02 typed materialization](WORKFLOW-MATERIALIZATION.md).
Generated native capture and per-occurrence binding functions retain exact typed
values, Event input rules and same-capture completed-prefix identity. Seven
focused suites pass **66/66**, zero failures/skips, including native compilation,
execution and independent compiling-mutant controls; source typecheck passes.
No clock, provider, Operation or compensation is called by materialization.
R03 is now covered above; public CLI integration remains outstanding.

Preceding Workflow frontier: [R01 outcome/journal bridge](WORKFLOW-OUTCOMES.md).
The source-bound bridge preserves generated Operation outcome, cleanup and commit
distinctions; malformed/thrown calls remain unknown. Forward completion is not
validated Workflow success. Postcommit value errors retain committed evidence and
explicitly remain outside the selected recovery policy. Five focused suites pass
**48/48**, no failures/skips, including real generated Operation/store tests;
source typecheck passes. R02 is now covered above; R03 native orchestration remains.

Preceding Workflow frontier: [selected recovery ordering policy](WORKFLOW-RECOVERY-POLICY.md).
The user selected ordering among needed compensations, with unconstrained actions
using a deterministic reverse-completion tie-break. The new checked planner
preserves active dependencies and records inactive ones without dispatching.
Indeterminate forward commits return reconciliation-required with no frozen
recovery intent. Eleven focused tests pass, including all 64 three-compensation
graphs and 100 valid failure-prefix cases; the final four-file focused run passes
**38/38**, and source typecheck passes. Shared regression: **412 passed, 2 Cargo
timeouts, no skips**; both affected complete suites pass **19/19** on serial retry
without source or timeout changes. See the report for exact run evidence. The prior
meaning gate is resolved. Native Workflow orchestration/generation and public CLI
integration are the next product work; no runtime provider is silently assumed.

Preceding Workflow frontier: [typed occurrence bindings](WORKFLOW-BINDINGS.md)
check exact Operation action hashes, complete ordinary and Event arguments,
forward-result availability and compensation-prefix scope. Final focused suites
pass **27/27**, no failures/skips; source typecheck passes. The 36-file shared
regression passed **402/402** before the final two test-only refinements, both
covered by the final focused run; see the report for exact evidence scope. Native
generation paused at the [inactive recovery dependency decision](WORKFLOW-RECOVERY-DEPENDENCY-DECISION.md),
now resolved above, not at a provider installation or publication gate.
Independent Interface/Mapping construction remains runnable. The full CLI remains incomplete.

Preceding Workflow source frontier: [versioned occurrence identities](WORKFLOW-OCCURRENCES.md).
The user selected separate step IDs, qualified Operation references and explicit
legacy migration. The checked source, occurrence-specific compensation DAG and
pure migration candidate are implemented; focused tests pass **38/38**, without
failures/skips, and source typecheck passes. The final 35-file shared regression
passes **394/394**, zero failures/skips, in **345.65 seconds**. Separate legacy
compatibility passes **22**, with one unavailable Lean-provider skip and no failures.
Typed argument/result bindings are now implemented above; executable Workflow
generation remains next. The source-format decision is resolved. Independent Interface/
Mapping work below and all PCR-07..14 requirements remain incomplete.

Current Interface frontier: [named reusable public contracts](NAMED-INTERFACE.md).
The user selected Interface-owned named contracts. The checked versioned source
and standalone TypeScript structural renderer are implemented, with exact
exposure closure, shared contracts, public/domain non-collapse, exact immutable
values and explicit legacy rejection. The final 34-file shared regression passes
**386/386**, zero failures/skips, in **271.75 seconds**; source typecheck passes.
Separate legacy compatibility passes **22**, with one unavailable Lean-provider
skip and no failures.
Exact public-contract Mapping bindings/generation, configured Interface planning,
public CLI integration, Workflow and later PCR requirements remain outstanding.

Preceding [scope inspection](INTERFACE-MAPPING-SCOPES.md) passes **28/28** focused
tests and confirms the legacy compiler's order-sensitive field flattening.
The source-format choice is now resolved; it is not an outstanding owner blocker.

Preceding Interface prerequisite: [versioned eligibility policy](INTERFACE-VERSION-POLICY.md).
The user selected same major and provider >= consumer, with exact mode and
legacy policies preserved separately. The closed decoder, pure evaluator and
standalone TypeScript emitter are implemented. Focused tests pass **26/26**;
scoped static-backend/runtime compatibility passes **30/30**, no failures/skips.
The 32-file shared regression including this policy passes **371/371**, zero
failures/skips, in **274.07 seconds**; it predates the scope-inspector test file.
Source typecheck and frozen checks pass. This completes the policy prerequisite,
not the full Interface source contract or generator. Typed signatures, canonical
exposure closure and explicit public/domain Mapping bindings are next.
Workflow's separate DEC-08 portion and all later PCR requirements remain incomplete.

Preceding construction: [versioned State Machine source and reducer](STATE-MACHINE-GENERATION.md).
The user selected corrected versioned source and explicit legacy migration.
Canonical incoming Event edges bind triggers, declared typed Rules bind guards,
and ordered output slots remain unexecuted intents. The native TypeScript
reducer preserves exact structured facts and immutable transition/rejection
outcomes. Focused State Machine/configuration tests pass **23/23**, zero
failures/skips. Final 31-file shared regression passes **364/364**, zero
failures/skips, in **379.93 seconds**. Source typecheck and frozen checks pass.
Legacy runtime and formalization paths explicitly reject the new version; their
compatibility tests pass **22**, with **one Lean-provider skip**, zero failures.
This is an opt-in compiler candidate, not public CLI or proof-pipeline support.
Interface is the next independent generation target. Workflow's portion of
DEC-08 remains pending, and later PCR requirements above remain incomplete.

Preceding construction: [executable Operation generation](OPERATION-GENERATION.md).
Registered action bindings now emit native TypeScript async functions with
transactional reads, declared Rule guards, owned write/result validation,
Event construction and one awaited atomic state/outbox port call. Rejection,
precommit failure and commit uncertainty are distinct; no implicit retry or
Event publication is added. Focused tests pass **10/10**, zero failures/skips,
in **30.17 seconds**; source typecheck passes. The final 30-file shared regression
passes **353/353**, zero failures/skips, in **351.27 seconds**.
Production-store durability and public CLI integration are not
established by this compiler candidate. At that checkpoint State Machine,
Workflow and Interface generation remained, followed by later PCR requirements.

Preceding construction: [checked Operation action bindings](OPERATION-ACTION-BINDINGS.md).
The explicit compiler input binds authored slots to typed identity reads,
declared Rule arguments, Entity writes, Event constructor inputs and a typed
result. Exact canonical relationships are checked separately; UI `mutates` is
not reused as an Entity-write edge. The focused action/relationship suites pass
**21/21** in **1.48 seconds**, with no failures/skips; source typecheck passes.
The 29-file shared regression passes **343/343**, zero failures/skips, in
**375.25 seconds**. This is not Operation generation or atomic
execution. The next runnable step is the actual configured action emitter and
tested atomic state/outbox boundary, using these checked bindings.

Preceding construction: the [Event dependency](EVENT-GENERATION.md) discovered
while inspecting Operation generation. Typed Operation v1 cannot consume current
Event nodes in its typed closure, and the old Event renderer has no constructor.
The new configured Event generator preserves occurrence/payload/reference/time
distinctions. Final focused tests pass **9/9** in **27.50 seconds**; the 27-suite
shared regression passes **322/322**, zero failures/skips, in **306.34 seconds**.
Final source typecheck and frozen source checks pass.
Operation remains the next action-generation target, using Event construction
as a prerequisite rather than generating a no-effect substitute.

Preceding completed unit: PCR-06 / bounded DSR-015 declared-Rule Policy generation. The new
[Policy compiler](POLICY-GENERATION.md) selects current Operation/Calculation
identities through explicit typed Rule bindings, without target execution or
inline predicate duplication. It includes named v1 migration and independent
native source/behavior checks. Focused tests pass **10/10** in **30.21 seconds**;
source typecheck passes. Final 26-suite regression passes **313/313**, zero
failures/skips, in **288.97 seconds**. Public CLI integration, other metatypes
and later PCR stages remain incomplete. The next unit is configured Operation
generation over the checked DSR-011 boundary, preserving explicit effects and
Rule guards rather than turning an action into a Workflow.

The preceding PCR-06 / bounded DSR-014 standalone generation,
[descriptor-bound typed Mapping generator](MAPPING-GENERATION.md) accepts
explicit core v2 input slots and checked field expressions, preserving v1's
missing-only defaults and canonical target restrictions. Final focused tests
pass **9/9**, zero failures/skips, in **26.79 seconds**; source typecheck passes.
Independent native observation rejects ten compiling semantic/effect mutations;
fresh execution separately distinguishes three changed meanings. Final
23-suite shared regression passes **282/282**, zero failures/skips, in **296.04
seconds**. This remains an opt-in candidate planner, not public CLI
integration, full DSR-014 or PCR-06 completion.

The preceding PCR-06 / DSR-014 input prerequisite,
[explicit Mapping input successor](MAPPING-INPUTS.md) adds ordered, typed multiple
arguments to declarative-function v2, preserving v1 source/trace/Rust artifact
hashes. Node and native Rust pass the same exact-amount fixture; guarded inputs,
explicit defaults, Calculation evaluation counts and separate composition
references have focused evidence. Final focused suite: **8/8 PASS**, no failures
or skips, **35.62 seconds**. Source typecheck passes. The final 22-suite regression
passes **273/273**, no failures or skips, in **462.16 seconds**. That unit did not include standalone descriptor-bound Mapping generation or
completion of DSR-014/PCR-06. No AlchLang authoring or canonical domain edges changed.

The preceding [descriptor-bound Query generator](QUERY-GENERATION.md)
adds exact/structured read-model generation over the registered field model and
composition boundary. Focused tests pass **7/7**, no failures or skips, in
**24.45 seconds**, with native JavaScript/declaration compilation and independent
observation. Source typecheck passes. Shared Rule generation preserves its
complex baseline fixture byte-for-byte. Final sixteen-suite regression passes
**237/237**, zero failures or skips, in **396.60 seconds**. Mapping/Policy and
orchestration generators and later PCR stages are not complete.

The preceding [descriptor-bound Calculation generator](CALCULATION-GENERATION.md)
now emits exact UInt64 pure arrows with immutable source/provider descriptors
from the registered composition boundary. Five focused tests pass; final
five-suite regression passes **32/32**, zero failures or skips, in **35.00
seconds**. CLI typecheck passes. Native arithmetic, descriptor checks and an
independent closed-source observer preserve semantic distinctions and reject
compiling effect/meaning mutations. No source schema, canonical relationship,
profile admission or public CLI default changed. Full-width authored literals,
standalone source admission and the remaining generator group are still pending.

The preceding [checked composition boundary](COMPOSITION-BOUNDARY.md)
implements the DSR-011 prerequisite as a non-executing, source-bound projection
of domain edges, scoped composition references, value contracts and explicit
core bridges. Focused tests pass 8/8; the five relevant suites pass 42/42,
no failures or skips, in 51.07 seconds. CLI typecheck passes. It is not a new
dataflow type checker or a change to existing Calculation relationship rules.
The next runnable work is the remaining pure-function generator group using
these distinctions and the declared DSR-013..017 contracts.

The preceding [structured Rule values](STRUCTURED-RULE-VALUES.md)
adds explicit Rule v8 and factory v12 composition over the checked scalar,
named, optional, list, set and sum types. Native facts preserve Entity identity,
Value Object equality, exact UInt64 and ownership-before-validator boundaries.
Standalone tests pass 6/6 in 15.51 seconds; focused factory cases pass 5/5 in
6.86 seconds, with no skips. CLI typecheck passes. The final thirteen-suite
regression passes **217/217**, no failures or skips, in **363.53 seconds**.

Preceding [exact generated factories](EXACT-FACTORY-GENERATION.md)
adds explicit v11 realization over exact checked fields, composed with Rule
v6/v7. Native fields store bigint through nested data, sums, Entity identities,
Value Objects and references. Plain Enum v2 preserves exact snapshot provenance
without changing its string-valued artifacts. Focused native tests pass 8/8,
no skips, in 22.83 seconds; CLI typecheck passes. Final twelve-suite regression
passes 206/206, no skips, in 336.97 seconds.
Its wider named/optional/nested Rule successor is implemented above; full CLI
and remaining metatype coverage are still incomplete.

The preceding [exact checked field values](EXACT-FIELD-VALUES.md) adds a
language-neutral exact UInt64 model and checked-project selection without
widening v1. The two field suites pass 28/28; new exact cases pass 12/12 and the
CLI typecheck passes. Final twelve-suite regression passes 198/198, no skips, in
323.62 seconds. Full-width values retain
their distinctions through nested fields, identities and reference projections.
Existing factory/Enum selections reject the new field profile; the explicit
factory v11 and Enum v2 successors above now support it.

The preceding [Exact UInt64 Rule literals](EXACT-RULE-LITERALS.md) adds
explicit typed Rule source v2 and configured selection v7 over the existing exact
value profile. Focused validation passes 8/8 tests; CLI typecheck passes.
Configuration checks pass 12/12 and existing runtime tests pass 6/6. Final
expanded twelve-suite regression passes 186/186, no skips, in 325.45 seconds.
This builds on [exact runtime Rule
inputs](EXACT-NUMERIC-RULES.md), whose previous nine-suite regression passed
159/159. [Explicit factory/Rule
composition](FACTORY-RULE-COMPOSITION.md) still connects factory v10 to the
selected [JSON-safe Rule v5](NUMERIC-RULES.md), not exact v6/v7.
This extends the [scalar collection predicates](RULE-COLLECTION-PREDICATES.md)
and their [independent observer](RULE-COLLECTION-OBSERVATION.md), without closing
PCR-06 or changing earlier factories and numeric contracts. Full-width runtime
Rule inputs, authored literals, checked field values and exact generated factory
fields/composition are implemented. Rule v8 now adds wider checked values and
factory v12 passes explicit typed facts after ownership validation.

Next construction work:

1. Next: reconcile and implement configured Interface generation over
   DSR-009/011, keeping its declared boundary and operation signatures distinct
   from adapters and execution. Workflow (DSR-011/017) now has a selected and
   implemented occurrence source; typed callable bindings and native orchestration
   remain construction work. The State Machine source/reducer candidate
   does not yet have a successor formalization/checked-interchange projection.
   The Operation candidate now supplies executable
   bound actions under an explicit transaction-provider contract; it does not
   supply a production store or durable Workflow engine. Continue DSR-013..017
   reconciliation without turning
   Policy into inline Rule definitions, Mapping into hidden Calculation, or a
   Workflow occurrence into Operation identity just to reuse existing code.
2. Keep the structured Rule/factory selections explicit while composing these
   groups. Existing source-grammar restrictions remain visible; no implicit
   optional or sum-payload traversal has been added.
3. Finish PCR-06, then the shared entry-point planner, native language adapters,
   all-cell/composition tests, compatibility and clean installation in plan order.

A source contradiction needs investigation, not an invented contract. Ask the
owner only when the remaining alternatives materially change meaning, promised
input scope, compatibility, or an external effect. Continue independent ready
construction work while such a decision is unresolved.

### Selected numeric and factory composition prerequisites

Read-only source review on 2026-09-09 confirmed the two numeric realizations:

- `impl/cli/src/input/field-reference-model.ts` selects
  `json-safe-uint64/v1-candidate`; its UInt64 value check requires a nonnegative
  safe integer.
- `impl/cli/src/generation/configured-uint64-source.ts` already normalizes that
  profile for generated factories, canonicalizing negative zero without coercion.
- `impl/cli/src/generation/exact-uint64.ts` exposes the separately versioned
  `domainspec.typescript-exact-uint64/v1` path. Its renderer currently does not
  realize typed Rules. It must not be relabeled as the JSON-safe profile or
  silently displaced by the new Rule work.

Implemented in v5: explicitly selected JSON-safe numeric Rule inputs, comparisons
and collection operations using the existing range and equality contract. Native
tests distinguish numeric from lexical ordering, zero normalization, safe maximum
from overflow, duplicate list occurrences from set uniqueness, and exact declared
Rule argument types. Previous Rule versions and factory defaults are preserved.

Factory v10 now selects the Rule and numeric value contracts explicitly and
permits exactly matching supported scalar and scalar list/set endpoints. Native
tests cover all construction routes, exact argument bindings, extension
orthogonality, invalid values and ownership, both native observations and
earlier-version output preservation. Factory v1–v9 still select Rule v1 and keep
their previous endpoint limits. Required owned Entity/Value Object path traversal
stays distinct from reference lookup or optional/collection traversal.

Rule v6 now reuses the existing exact profile's bigint representation with direct
generated expressions, not the old renderer's runtime expression interpreter.
Native tests verify full maximum and overflow, exact cross-representation
equality, lexical versus numeric ordering, list/set distinctions, independent
observation and prior selection. The old exact renderer remains unchanged.

The checked `typed-rule/v1` source still accepts only safe JSON integer literals;
v6 emits those as bigint constants. Explicit `typed-rule/v2` now accepts canonical
decimal UInt64 literals through the maximum; v7 emits them as bigint constants
and supports checked mixed-version Rule calls. Previous selections and legacy
renderers/runtime reject selected v2 roots/dependencies. The source-loading and
typed-decoder successors are bound by an explicit development configuration
source selection; original configuration JSON and defaults remain unchanged.

The earlier source review found a fixed JSON-safe field model/adapter and the
`configured-uint64-source.ts` helper emitting `ValueProtocol<number>`. That
established the prerequisite: preserve full-width values through nested fields,
Entity identity, Value Object equality and reference projections before exact
factory/Rule composition. Neither the JSON-safe profile nor the old factory
helper may be silently widened.
Named Rule dependencies and ontology property paths have checked closure
support in `typed-operation/closure.ts`; Rule v8 now realizes them without
flattening their semantic roles into generic records.
The [exact field successor](EXACT-FIELD-VALUES.md) now implements the neutral
model/selection and typed equality semantics described above. Read-only generator
review at that stage confirmed the boundaries: `configured-sum-source.ts` rendered
UInt64 as `number`; the factory and sum emitters inject `renderUInt64Support()`;
factory planning constructs a v1 plain-Enum projection and selects Rule v5.
The exact factory successor now selects native bigint shapes/support, binds the
new field contract, preserves plain-Enum meaning with exact snapshot provenance,
selects exact Rules, and extends independent observation. Previous generated
bytes and the numeric helper are preserved. The next source boundary was the Rule
emitter: earlier configured Rule versions normalized only scalar and scalar-list/set
parameters, while `typed-operation/closure.ts` already checked named declarations
and ontology property paths. The structured Rule successor now propagates that
selection through factories without flattening named concepts or inferring
reference lookup.

Full-width language coverage remains required work, not a completed cell or an
unsupported-input waiver. No new numeric representation decision is needed for
the already selected exact profile.

## Operational support and deferred residue

| Item | Owner | Exact affected stage | Construction blocker |
| --- | --- | --- | --- |
| Dirty-byte preservation | Implementing agent | Every touched file | Only unresolved overlapping edits; unrelated dirty work remains untouched. |
| Existing pinned native toolchains | Toolchain owner | Native validation | Only a demonstrated unavailable required lane. No replacement compiler installed. |
| Historical evidence recovery | Evidence owner | Historical audit | Not a blocker to fresh independent construction unless consumed as a prerequisite. |
| Product review | Product owner | After exact candidate tests | Does not block current implementation. |
| Admission/default cutover/publication | Respective owners | Separately authorized operations | Deferred; not part of this implementation authorization. |

## Open questions

No owner decision is required for the selected JSON-safe Rule group or explicit
composition of its already declared arguments.
Remaining meaning dependencies and decisions stay visible in
[PLAN.md](PLAN.md#9-open-questions-and-proposed-decisions) and the parent
[work items](../WORK-ITEMS.json). This is an internal execution ledger, not
user-facing product documentation.
