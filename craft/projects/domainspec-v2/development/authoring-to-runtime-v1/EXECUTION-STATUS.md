# Authoring-to-runtime execution

## I07 decision pending — physical messaging destination ownership

Read-only provider review found a consequential unresolved choice. The checked
messaging channel schema permits `provider_name: null`; the commerce fixture
uses null for every channel. Its provider selection declares NATS and environment
references but no channel-to-subject mapping. Nevertheless the TypeScript,
Python and Rust reference publisher templates use `orders.submitted`. This is
reference implementation behavior, not a graph-derived destination.

Decision requested from the product owner: should concrete channel destinations
be authored in the existing channel `provider_name`, or in environment-specific
runtime/provider bindings keyed by logical channel identity? The latter is the
recommendation because one logical domain can retain identity across development
and production destinations; it requires an explicit binding contract. The former
reuses the current field but ties provider naming to the integration composition.
Neither alternative authorizes inferring a physical subject from a logical ID.

Selected option: **pending owner decision** (2026-09-17). No provider code or
default was changed by this review. The scope needing the decision is generic
publication destination generation and its bootstrap configuration; graph-derived
request dispatch and joined artifact compilation remain verified as below.
The active goal remains 15/37 scoped completions, not achieved or globally blocked.
Evidence: `impl/cli/examples/reconciled-commerce/integrations/application.json`,
`impl/cli/examples/reconciled-commerce/providers/typescript.json`,
`impl/system-integration/contracts/messaging-composition-v2.schema.json`, and
`impl/cli/src/generation/provider-application-v1.ts`.

## I07 progress — Alch builds joined whole-application artifacts

Alch's whole-application path now passes its genuine checked executable plan,
integration source and runtime binding to the DomainSpec artifact composer.
The adapter chooses the explicit v1 or composed-v2 entry point from the checked
plan; copied plans reject before generation. Check reports
`whole-application-artifacts`, the actual joined artifact count and plan digest.
Build emits the joined code/project configuration instead of only core code and
binding metadata; verify independently regenerates that same complete output.
The plan digest is retained in report, trace and manifest. A compact artifact
index under `.alch/whole/` records path/hash/size without duplicating code bytes.

Fresh Alch regression passes **40/40**, zero skips. A separate test against the
rebuilt public CLI passes **1/1**, exercising whole-application build and verify
with the same manifest as the API. The new native scenario starts from separate
realization blocks with a Query, explicit `ORDER_NOT_FOUND` policy and Mapping.
It compiles the joined TypeScript project and executes the generated inbound
handler: absent Query values roll back without commit, and an eligible value
commits exactly once. Changed generated handlers fail verification. All owned
temporary projects are cleaned. Alch typecheck/build, awaited backend build and
the 37-node DAG validator pass.

This closes the artifact-consumer gap, not I07. Remaining runnable construction
includes graph-derived provider bodies/bootstrap, remaining manually supplied
integration choices, and the full bounded application loopback proof. Scalar-only
composed contexts and target coverage remain in scope. No provider was started;
`runtime_guarantees_observed` remains false. The full goal stays active at
**15/37 scoped completions**. Publication, release and deployment remain deferred
operational support under separate owner authorization, not construction gates.

## I07 progress — explicit composed whole-application artifact join

The backend now exposes `planComposedWholeApplication` for an explicit v2
TypeScript selection and `composeComposedWholeApplicationPlan` for a genuine
checked composed project. `selectComposedReconciledProjectArtifacts` projects
its generated modules into the coherent application layout, preserving exact
import targets and updating artifact identities. These are separate entry
points: neither the v1 decoder nor its selected-plan dispatcher accepts v2.

The existing checked whole-application merge is shared after profile-specific
plan validation. Integration source identity, Operation request coverage,
Mapping result types, language agreement, import closure and output ownership
remain checked. Whole-plan format and formation-only claim ceiling are unchanged;
selection and application-view digests retain the composed profile identity.
Copied plans/bindings/contributions cannot substitute for current checked objects.

Fresh regression passes **28/28**, zero skips, including native compilation and
execution of a composed Operation that consumes a declared Mapping result through
a generated inbound request handler. It also verifies wrong-profile rejection,
plan custody, deterministic output, v1 CLI compatibility and existing Python
layout/import behavior. Full backend typecheck, packaged source-currentness
checks and the 37-node DAG validator pass. Owned temporary output is cleaned.

Next runnable construction: consume the new checked artifact join from Alch's
whole-application build path. Its current whole path still emits executable core
code plus integration/runtime binding metadata, not these joined application
artifacts. Generic provider bodies/bootstrap, source-authored integration choices,
full loopback proof, scalar-only composed contexts and target coverage remain.
I07 is not complete; the goal remains **15/37 scoped completions**. No runtime
provider guarantee, release, admission or deployment is claimed. Deferred
operational support remains separate and does not block this construction work.

## I07 progress — graph-derived request dispatch and explicit profile boundary

The TypeScript whole-application composer now emits typed request handlers from
checked Mapping bindings, Operation request contracts and generated native module
exports. The reference TypeScript provider delegates inbound HTTP and message
requests to those handlers. Distinct payload paths remain distinct, Mapping
results and source-body inputs are connected explicitly, and the selected
Operation is called once. Missing, inherited and accessor properties reject
before Operation effects. Indeterminate settlement remains indeterminate; no
retry, acknowledgement or transport policy is inferred.

Fresh native regression verifies a renamed domain and Operation with different
nested HTTP/message paths, pre-effect rejection and unchanged uncertain outcomes.
The focused compiler, request-handler, output and CLI suite passes **18/18**,
zero skips; the separate TypeScript provider test passes **1/1**. TypeScript
typecheck and the 37-node DAG validator pass. Test-owned projects are cleaned.
See [GRAPH-DERIVED-HANDLERS.md](GRAPH-DERIVED-HANDLERS.md) for the exact scope.

The next-integration review found that the legacy selected-plan assertion
accepted genuine v2 plans while narrowing them to the v1 type. A regression
reproduced that defect before the fix. Legacy identity/artifact helpers now
reject composed plans explicitly; the dedicated v2 APIs retain their genuine
plan identity and still compile all thirteen metatypes. This does not introduce
a profile upgrade or claim that v2 whole-application composition exists.

Product-construction frontier: the explicit composed-v2 whole-application join,
followed by graph-derived provider bodies/bootstrap and the full application
loopback proof. The layout projection and whole composer currently consume the
legacy selected-plan type; v2 needs a checked explicit entry point, not a cast
or a weakened v1 decoder. Separate source realization blocks remain the agreed
authoring boundary. Remaining source-authored integration choices, scalar-only
composed contexts and target coverage are still pending.

This is scoped progress, not I07 completion. The full goal remains active at
**15/37 scoped completions**. Operational support (publication, release and
deployment) remains deferred under its separate owner authorization and does
not block this runnable construction work. No production guarantee or admission
is claimed.

## I07 progress — public application build and exact verification

`alchlang build <application.alch> --out <new-directory>` and
`alchlang verify <application.alch> --out <directory>` now share the same source
preparation and checked artifact plan as `check`. Both accept the explicit
relative companion option. Generated code keeps the selected compiler layout;
graph sources, formed contracts, traces, input digests and whole-application
binding artifacts are materialized under reserved `.alch/` metadata paths.

Build refuses existing targets and non-real parents before expensive planning,
then rechecks before writing. Portable path and file/directory collisions reject
before destination creation. The manifest is written last, after exact output
and input rechecks, and checked again afterward. Failure cleanup removes only
unchanged owned files/directories, preserving foreign edits, replacements and
additions. Verification regenerates expected bytes and checks exact output
coverage; it never trusts a modified manifest as evidence for modified code.
Missing, extra, changed and symlinked output reject without repairing output.

Fresh broader regression passes **48/48**, zero skips. The freshly rebuilt public
CLI/output suite passes **9/9**, zero skips. Typecheck, complete package build and
the 37-node DAG validator pass. Native TypeScript compilation consumes the actual
file-build output; generated composed Operation execution preserves explicit
absence rollback and returns the stored value on success. All owned test
projects and check scratch directories are cleaned. Initial TypeScript narrowing
errors in the output helper/test matrix were fixed before final verification.

This completes the scoped public build/verify transport, not I07. Generated
whole-application bindings are not an operating provider application. Remaining
work includes eliminating manual integration bindings, graph-derived provider
composition, the full bounded loopback scenario, scalar-only composed contexts
and target coverage. The full goal stays active at **15/37 scoped completions**;
no installed release, operational guarantee, admission or deployment is claimed.

## I07 progress — exact file transport and public application check

`loadApplicationFile` now loads an `application-v1` source and an explicit closed
companion, defaulting to `<source>.application.json`. Existing meaning, formal
interpretation, execution selection, integration and observation contracts are
transported by exact relative file references rather than invented. Source-derived
realizations still reject supplied action/composition overrides. Selected runtime
profiles remain explicit; providers are never executed.

The public `alchlang check <source.alch> [--application-bindings <relative-file>]`
route now uses this loader, compiles the graph and plans artifacts in an owned
temporary directory, then rechecks all selected input bytes and cleans up.
Escaped paths, symlinks, malformed UTF-8/JSON, stale companions, oversized input,
wrong flags, missing partitions and overrides reject. Unselected files are not
loaded. Check results distinguish executable checks from whole-application
binding checks and explicitly deny observed runtime guarantees.

Fresh source/realization/executable/integration/runtime regression passes
**43/43**, zero skips; typecheck and the 37-node DAG validator pass. The package
build initially exposed a non-exported graph-node return type. Exporting the
named type repaired declaration emission; the complete package build now passes.
The newly built CLI/file-input suite passes **4/4**, zero skips, separately from
the source-only run.

This is a public check and file-loading milestone, not I07 completion. Safe
application build/verify output, removal of remaining manual integration
bindings, graph-derived provider composition, loopback whole-application proof,
scalar-only composed contexts and remaining target coverage are still pending.
The full goal remains active at **15/37 scoped completions**. No installed release,
production provider guarantee, admission or deployment is claimed.

## I07 progress — explicit source-authored Query absence failures

Separate realization blocks now accept `on-absence current fail ORDER_NOT_FOUND`.
The clause selects an optional Query value binding and lowers to the existing
`require-present` composition policy plus its explicit failure code. Omitting the
clause retains `preserve`; no default failure, value or unwrapping is introduced.
Policy placement is independent of clause order. Duplicate policies, unknown or
wrong-role bindings, list results and malformed codes reject. Presence changes
the wrapper only: partial projections cannot become complete Entities and only
their selected fields may be traversed. Failure codes participate in graph identity.

The native Alch project-adapter test now exercises both modes from source through
generated TypeScript execution. Empty required results return the authored code
and roll back without commit; one stored result feeds the Mapping/write/result;
multiple results retain `QUERY_CARDINALITY`. The preserve-mode case still accepts
empty results without silently requiring presence. Tests clean their owned
temporary projects. No backend contract or profile meaning changed.

Fresh Alch realization/executable/API/messaging/runtime/whole-application
regression passes **36/36**, zero skips; typecheck and the 37-node DAG validator
pass. This completes the source absence-policy seam, not I07. Public
check/build/verify and safe output integration, generic provider composition,
remaining collection/scalar-only context and target-language work remain.
The full goal stays active at **15/37 scoped completions**, with no publication,
deployment, admission or provider-readiness claim.

## I07 progress — packaged v2 project generation and Alch adapter

The explicit TypeScript v2 project selection now joins authored value
compositions, effect actions and Workflow bindings through one checked graph.
It requires exact Operation composition coverage, retains explicit absence
codes and validators, resolves native imports, rejects artifact collisions and
checks that every declared node has a generated module. Legacy v1 decoding
remains closed and rejects the new selection; no implicit profile switch occurs.
The current composed path requires a genuine domain field closure. Minimal
scalar-only v2 context support is not claimed or replaced with a fabricated
record; the existing scalar-only v1 path remains tested.

The composed Workflow and project definitions are embedded in the 136-source
capsule, SHA-256
`7e4003a6c640bdb3235318f65129cc6dcc5da88f41f8df96a1813db72f3d56cb`.
All 134 preceding sources and their selection order are preserved exactly.
Root APIs now expose composed Workflow checking/planning and composed project
planning from either a source directory or a checked graph. Selected-root views
retain the exact transitive Query/Mapping imports and generated bytes.

Alch executable preparation now derives both action and composition bindings
from realization blocks when the v2 compiler profile is explicitly selected.
Caller overrides, including present-but-undefined overrides, reject. Query
collection sources contribute the declared canonical read edges and are never
lowered as keyed Entity lookups. The native Alch test now uses the real project
adapter rather than private backend imports or hand-built graph edges.

Backend project/capsule/composition/package regression passes **47/47**, zero
skips, including native compilation of all thirteen metatypes and native
composed Workflow execution. Alch realization/executable/API/messaging/runtime/
whole-application regression passes **35/35**, zero skips. Both typechecks,
the awaited backend build and 37-node DAG validator pass. Owned temporary test
directories are cleaned. An initial new test called the wrong test helper;
correcting it to the existing native compiler helper completed verification.

This closes the internal project adapter seam, not I07. Source-authored absence
failure handling, full public check/build/verify and safe output integration,
generic provider composition, remaining collection and target-language cases
remain unfinished. No installed CLI/whole-application readiness or operational
authority is claimed. The full goal stays active at 15/37 scoped completions.

## I07 progress — composed Workflow call closure and native generation

The additive `composed-workflow-contract.json` candidate (SHA-256
`f33b6d4f7dbaf976ed3aa1892f29735ff4ad2fb0a6c77cd2d8c7f7f6bb4d445b`)
now has a checked binding entry point and native planner. Workflow occurrences
pin complete composed Operation action identities; intermediate Query/Mapping
values do not become Workflow inputs. Generation consumes a genuine exact-graph
composed Operation plan, checks every forward/compensation target and preserves
its dependency artifacts. The normalized Workflow selection keeps plan hashes
rather than duplicating the full Operation artifact plan.

The first native join exposed a real settlement mismatch: legacy outcome
inspection classified Query failure stages as indeterminate. The correction
derives a finite stage/code vocabulary from checked named bindings and explicit
absence codes, binds it into each checked call, and compares it with the actual
Operation plan. Backend observation and generated native inspection agree on
allowed failures and reject unknown stage/code/status combinations. Legacy
standalone inspection and emitted settlement support remain unchanged; no
permissive Query-prefix rule was added.

Fresh composed/legacy Workflow binding, recovery, outcome and native generation
regression: **66/66 passed**, zero skips (about 66 seconds). Full backend
typecheck and generated-source/schema checks passed; the awaited backend build
and 37-node DAG validator passed. New native tests cover ordered repeated
composed calls, absence and cardinality failures after a committed prefix,
uncertain commit, exact recovery comparison, no automatic compensation/retry,
cloned evidence, stale action pins, inert arrays and mismatched absence codes.
Owned temporary directories are cleaned.

The new Workflow contract still requires explicit source bytes and is not yet
in the 134-source capsule. Root API packaging, resolved project integration,
Alch project adapter, absence-failure authoring and public build/provider work
remain incomplete. This is not whole-application readiness or I07 completion.
Progress remains 15/37 scoped completions; the full goal stays active. No new
product behavior or operational authority has been selected.

## I07 progress — Alch named composition derivation

Alch now derives named Query/Mapping value compositions alongside effect action
bindings. The source defines each call, argument and qualified collection source;
lowering never substitutes keyed lookup, fabricates caller inputs, unwraps an
optional value or invents an absence failure code. Keyed-read/collection slot
conflicts reject. Existing action-only consumers explicitly reject composed
bindings until the project adapter is integrated, preventing silently omitted
calls.

The frontend type checker uses the formed Query contract's cardinality and
selected fields. Partial projections remain distinct from complete Entities,
and drift from authored cardinality rejects. A new native integration test takes
Alch-derived bindings through the packaged backend composition APIs, compiles
all planned TypeScript artifacts and exercises empty/single/multiple Query
results plus a mapped write/result. The test explicitly assembles compiled graph
evidence; it is not an installed CLI or whole-project build claim. Owned test
directories are cleaned.

Fresh combined realization/executable regression passes **13/13**, zero skips;
Alch typecheck and the 37-node DAG validator pass. Project/Workflow
integration, explicit absence-failure authoring, remaining collection cases and
provider/public build work remain next. I07 is incomplete and the full goal
remains active; no new product behavior decision has been taken.

## I07 progress — packaged composition contracts and public compiler adapters

The source capsule now embeds `operation_value_composition` and
`composed_operation`: 134 sources, capsule SHA-256
`1bbaa49471b01cbdeee8ca76b4833c6a0a9923adc17d5a06108c7ef91cbce7ab`.
The predecessor reconstruction proves all 132 previous source bytes and their
selection order unchanged; historical capsule assertions remain intact.
The relocated compiled capsule passes with filesystem access restricted to
emitted code, including both new contracts.

Root exports `compileComposedOperation` and `planComposedOperations` now select
these embedded contracts rather than requiring callers to read development
files. They retain genuine same-graph evidence checks and separate composed
action custody. Public API output matches the staged checker/planner exactly;
its complete generated TypeScript artifacts compile and execute the named
Query/Mapping flow. Planning itself performs no publication or execution.

Fresh capsule/composition/package-boundary regression: **35/35 passed**, zero
skips. Full backend typecheck and generated-source/schema checks passed; an
awaited backend build and the 37-node DAG validator also passed. Temporary test
directories are cleaned. This proves the public API seam, not installed CLI or
whole-project composition. Alch Query/Mapping lowering, composed project and
Workflow integration, remaining collection native cases and provider/build
integration remain unfinished. I07 stays incomplete; 15/37 scoped completions.
No product decision, admission, release or deployment is implied.

## I07 progress — graph-derived composed artifact planner

Added an exact candidate generation contract and branded, write-free TypeScript
planner. It derives Query/Mapping/public Interface/Rule/Event roots from genuine
composed actions and selects existing generators from the pinned source capsule.
Factory choices remain explicit under the existing field closure and validators;
the planner supplies no implicit business Rules. Planned imports bind dependency
contracts and artifact hashes. Compact Operation descriptors retain fingerprints
instead of embedding the compiled graph or an expression interpreter.

Fresh focused regression: **33/33 passed**, zero skips; full backend typecheck,
generated-source/schema checks and the 37-node DAG validator passed. Complete
planned artifacts compile and execute both the domain Mapping flow and a public
Mapping round trip with distinct public/Entity field names. Tests cover unsafe
roots, source drift, forged snapshots, missing explicit choices, inert/sparse
inputs, dependency deduplication and byte-identical Operation modules across
batch composition/order. Initial fixtures omitted profile-required factory
validators; explicit fixture Rules/bindings corrected that without changing the
profile. An overly narrow sparse-array error assertion was corrected to match
the earlier bounds rejection. Owned temporary projects are cleaned.

The new contract is supplied explicitly and is not yet selected into the current
132-source capsule. The existing resolved-artifact/project/public CLI routes do
not yet consume this planner. Source selection/packaging, remaining collection
native cases, Alch lowering and public build/provider composition remain next.
No release, publication or provider durability is claimed. I07 is incomplete;
progress remains 15/37 scoped completions, with no new product decision needed.

## I07 progress — native composed-operation source generation

The source renderer now emits named Query/Mapping calls in dependency order
inside the transaction, before guards and write/Event/result preparation. Query
collection sources use an explicit typed transaction port; no keyed-read
substitution or global repository lookup is emitted. Require-present needs an
explicit per-binding failure code. Query cardinality remains distinct, while
precommit failures retain rollback/cleanup and commit uncertainty never retries.

Exact dependency contract hashes, aliases/paths, absence bindings, checked-action
custody and field-model bytes are checked before lowering. Typed preparation now
retains the needed qualified public declarations and field-model digest. Public
value support shares the domain renderer rather than emitting a second support
library; imports used only for public protocols are emitted on demand. A partial
projection is not silently given a set identity.

Fresh focused regression: **29/29 passed**, zero skips. Native tests compile the
generated Operation with generated Query, Mapping, Rule and Entity-factory
modules, then run a bounded transaction port. The success query selects a stored
id different from the request, proving no identity-lookup substitution. Tests
cover explicit absence, multiple matches, invalid rows before filtering, guard
rejection, source failure, cleanup failure, commit rejection and uncertain commit.
Owned temporary projects and emitted artifacts are removed after tests.

This is low-level source-generation evidence, not packaged planner/public build
completion or real provider durability. Fixtures explicitly assemble module
dependencies; selected-contract packaging, artifact-plan/custody integration,
additional public/collection native cases and Alch authoring lowering remain next.
I07 stays incomplete, progress remains 15/37 scoped completions, and no product
decision is currently needed.

Full backend typecheck/source/schema checks and an awaited backend rebuild passed.
After that rebuild, fresh existing Alch executable/Event tests passed **6/6**,
zero skips, verifying the shared source-renderer path still executes legacy and
source-derived direct actions. The complete 37-node DAG still validates.

## I07 progress — complete composed-action static validation

Typed preparation now records the actual downstream expression types. The
composed-action checker uses those types for Rule arguments, Entity writes and
the declared result, while retaining exact guard/read/write/Event coverage,
primary guard, typed contracts, field/boundary/graph custody and source hashes.
Computed roots are never added to caller inputs. The shared legacy validator
remains the source of effect checks rather than a second divergent implementation.

Composed actions have a separate checked schema and custody. Existing operation
generators reject them; they cannot silently omit Query/Mapping preparation.
Their execution obligations retain transaction-scoped Query sources, named calls
before guards, Query cardinality/projection and explicit absence outcome binding.
The checker does not itself execute a provider or establish factory invariants.

Fresh composition/type/reference/decoder/action regression: **25/25 passed**,
zero skips; full backend typecheck and generated-source/schema checks passed.
Cases cover guarding Query output, writing/returning Mapping output, retained
input boundaries, partial and optional misuse, missing effect coverage, Event
coverage, forged evidence and cross-graph drift. Generated Query/Mapping calls
and their native transaction outcomes remain next, followed by public integration.
I07 stays incomplete; full progress remains 15/37 scoped completions. No new
product decision is currently needed.

After rebuilding the backend, the existing Alch executable/Event regression was
rerun in a fresh process: **6/6 passed**, zero skips. It compiles and executes
legacy and source-derived direct-action TypeScript, checks transaction outcomes,
Event intents, repeatability and stale graph rejection. This validates the
shared-checker refactor's existing execution path, not the new composed-action
runtime. The 37-node DAG validator also passes unchanged.

## I07 progress — typed Query/Mapping value preparation

Added the backend typed preparation stage over genuine reference snapshots and
the same compiled graph/field evidence. It checks exact named argument types and
direct-read identity keys, resolves dependency order, and preserves optional,
list, set, domain identity and qualified public-contract identity. Partial Query
and Mapping outputs carry their selected fields; they cannot satisfy a complete
Entity input or expose omitted fields. Full field coverage retains the declared
record type without claiming invariant enforcement or factory admission.

Existing Mapping v2/v3 semantic checkers validate the selected contracts. Query
comparison and ordering types are checked explicitly: graph field-name resolution
alone did not establish operand compatibility. Require-present removes only the
explicitly selected optional wrapper; runtime absence outcome binding remains
part of the pending executable integration.

Fresh type/reference/decoder/legacy-action regression: **22/22 passed**, zero
skips; full backend typecheck and generated source/schema checks passed. Tests
cover partial/full distinctions, omitted fields, no implicit optional traversal,
list/set conversion, wrong nominal types, qualified public Mapping chains,
dependency-order normalization, invalid Query comparisons and forged/stale
evidence. The full 37-node DAG validates unchanged; owned temporary projects are
cleaned. No native Query/Mapping execution is claimed from these static checks.

Next: join typed preparation with complete guard/write/Event/result action
checking and the transaction generator, then public authoring/build integration.
This typed snapshot is intentionally not accepted as a checked executable action.
Progress remains 15/37 scoped completions; I07 is incomplete and no new product
decision is currently needed.

## I07 progress — exact backend value-composition references

The reference stage now binds the separate composition and action to genuine
compiled graph, boundary and exact field snapshots plus the exact candidate
contract bytes. It checks Operation/Query/Mapping roles, argument-name coverage,
external value roots, opaque Event-input exclusion, collection versus keyed-read
slot ownership, Query source relationships and complete Operation read coverage.
Require-present rejects list Queries; named contracts retain their full source
projection/cardinality rather than being relabeled as complete Entities.

Fresh reference/decoder/legacy-action regression: **16/16 passed**, zero skips.
Full backend typecheck and generated catalog/source/schema checks passed. Tests
include forged and cross-graph snapshots, altered contract bytes, source drift,
slot conflicts and declaration-order normalization. An initial collision fixture
also introduced a local cycle; the fixture was corrected to isolate the intended
collision check without weakening the decoder. Owned temporary projects are removed.

This is explicitly a references-only snapshot, rejected by executable-action
custody. Named-input Mapping v2/v3 contracts are recognized; legacy Mapping v1
does not receive an invented named-input signature. Argument-type/partial-result
checking, complete action validation, contract packaging and native generators
remain next. No new runtime or public build completeness is claimed. Progress
remains 15/37 scoped completions; no product decision is currently needed.

## I07 progress — backend value-composition contract and decoder

Added a separate candidate Query/Mapping value-composition contract and closed
backend decoder. It preserves named selectors, exact argument expressions,
explicit transaction source slots and an explicit preserve/require-present absence
choice. No absence policy is inferred, and Query source cardinality is not changed.
The decoder rejects local cycles, duplicates, malformed/unknown members, unsafe
data properties and oversized bindings, while leaving existing action v1 closed.

Fresh backend decoder/action tests: **13/13 passed**, zero skips. Full backend
typecheck, catalog/relationship/integration checks, 132-source capsule currentness,
cross-generator sources and packaged schemas passed. Existing source capsules and
action contract bytes were not rewritten. The new contract is a construction
candidate, not yet a packaged or callable generation capability.

Next: graph/type/source-slot checking, exact contract-source binding and native
generator integration. External roots and runtime behavior are not established
by decoder success. Public authoring flow and provider composition remain in I07;
progress stays 15/37 scoped completions and no new product decision is needed.

## I07 progress — explicit realization dependency DAG

Live backend inspection confirms existing action bindings/renderers have no
Query/Mapping evaluation slots. The typed realization now compiles an explicit
dependency graph to support that extension without erasing named calls or relying
on source-line order. Input, Event-input, transaction, read, Query, Mapping, guard,
write-validation, Event-construction, result and commit-intent nodes remain distinct.
Named Query/Mapping/Rule contracts and exact value paths are fingerprinted;
the fingerprint is not a replacement for source/claim currentness or acceptance.

Fresh realization/Event regression: **12/12 passed**, zero skips; Alch typecheck
passed. Graph tests cover dependencies, complete topological layering, cycle and
missing-root rejection, reordered declarations, cardinality non-collapse and
same-name Rule contract drift. Previously supported generated Event scenarios
still pass. No Query/Mapping execution, concurrent schedule or provider effect
is claimed from graph construction alone.

Next is the backend value-composition contract/checker/generator join, then public
application wiring. I07 remains incomplete and the full DAG remains 15/37 scoped
completions. No product decision is currently needed.

## I07 progress — explicit Event inputs lower and execute

Realizations now declare `event-input submitted OrderSubmitted` and connect it
with `event OrderSubmitted <- submitted`. A distinct internal Event-input type
preserves its identity and prevents substitution for an Entity or constructed
Event. Unused/duplicate inputs, wrong declaration roles, mismatched Event identities
and implicit field traversal reject. Lowering derives existing backend Event
slots without supplying manual operation JSON or inventing occurrence/timestamp data.

Fresh realization/Event regression: **12/12 passed**, zero skips; Alch typecheck
passed. Legacy and source-derived paths compile generated TypeScript and execute
six bounded scenarios, including malformed payload and occurrence identity.
Writes and constructed Event intents share one frozen commit batch; invalid
Event data rolls back before commit/clock observation. Rejected and uncertain
commit outcomes remain distinct, with no delivery/publication claims. Tests use
an in-memory transaction port and clean their owned temporary outputs.

Query and Mapping executable composition remain unsupported, not silently
substituted. I07 also retains public loading/build, remaining authored choices
and graph-derived provider composition. Progress remains 15/37 scoped nodes;
no new product decision is currently needed.

## I07 progress — source-derived actions execute natively

Separate realizations now derive the existing backend action contract for the
direct keyed-read/guard/create-or-replace-write/result slice. Authored realizations
require an internal v2 execution envelope that omits operations; even identical
operation overrides reject. Sources without realizations keep v1 behavior.
Query/Mapping/Event execution and read-dependent read keys remain explicit
unsupported boundaries, never silently substituted or dropped.

Fresh focused tests: **11/11 passed**, zero skips; Alch typecheck passed. Both
legacy and source-derived actions compile generated TypeScript and run seven
bounded transaction scenarios. Stored/request values differ deliberately; guard
rejection, read failures, malformed inputs and rejected/uncertain settlement
retain their outcomes. Both paths detect a compilable guard-bypass mutant,
reject stale graph bytes and reproduce exact output in two fresh processes with
different locales. Owned temporary outputs are cleaned. These tests use an
in-memory transaction port, not a real database or broker.

I07 remains incomplete: Query/Mapping/Event lowering, explicit absence handling,
remaining authoring choices, public command wiring and graph-derived provider
composition remain. Full DAG progress stays 15/37 scoped completions. No product
decision is needed for the completed direct-read slice.

## I07 progress — typed realization connections

The typed checker resolves value paths against the current domain/Rule projection
and preserves nominal types, Query cardinality and public contract qualification.
Key, Query/Mapping argument, guard, write and result mismatches reject. Optional
unwrapping, implicit collection traversal and Entity-state lookup through identity
references are not inferred. Preparation runs these checks but still rejects
unlowered realizations, preventing manual action selections from bypassing source.

Fresh realization/domain/formal tests: **19/19 passed**, zero skips; Alch typecheck
passed. Tests distinguish stored/request guard values, exact ontology paths,
optional/list results and public payload/Entity ownership. Initial fixture attempts
using public contracts directly as Operation inputs were rejected by the existing
boundary; the final fixture uses explicit Mappings without changing that boundary.
The checker does not establish construction, execution or transaction behavior.

Next: derive and join executable actions, then native behavior tests and the public
application path. I07 remains incomplete, with 15/37 scoped completions and no new
owner decision needed.

## I07 progress — separate realization source model

Implemented the selected separate realization declaration through the existing
Alch scanner and application model. Explicit input/read/query/map/guard/write/
Event/result connections retain source positions and remain separate from
Operation contracts, FormalClaims and provider profiles. Structural validation
rejects unknown/wrong-role references, missing Operation relationship coverage,
duplicate bindings/arguments, cycles and imperative/inline expressions.

Fresh realization/domain/formal regression: **16/16 passed**, zero skips; Alch
typecheck and tracked diff whitespace checks passed. The executable preparation
boundary rejects unlowered realizations rather than allowing an external backend
selection to ignore or override authored connections. Typed path/cardinality
resolution, complete action derivation and native runtime execution remain next;
parser success is not claimed as executable support. See
[syntax and claim boundaries](REALIZATION-AUTHORING.md).

I07 remains incomplete; progress remains 15/37 scoped nodes. The owner-placement
decision is resolved, and no new product decision is currently needed.

## I07 owner choice resolved — separate realization block

The user selected "Separate realization block". The
[decision record](../../DECISIONS.md) now records PASS for that ownership choice;
the [bounded implementation contract](REALIZATION-AUTHORING.md) keeps domain
Operation contracts, application-owned value wiring, and provider/runtime
selection distinct. No imperative instruction sequence, new backend meta-type,
implicit business behavior or inline replacement proposition is authorized.

The earlier decision-boundary entry below is historical and no longer blocks
this choice. Parser, typed binding resolution, backend-selection derivation and
native evidence remain implementation work; this decision alone completes no DAG
node. Progress remains 15/37 scoped completions, with I07 next.

## I07 decision boundary — authoring executable value bindings

Live parser/fixture review confirms that Operation relationship declarations do
not select read keys, guard values, write modes/values or result values. These
remain explicit backend selection inputs in the fixture. I07 cannot derive them
from the current `.alch` declarations without inventing behavior. The native
fixture specifically distinguishes guarding stored state from guarding the request.

The pending [operation authoring decision](../../DECISIONS.md) records two
declarative Alch placements: a separate realization block (recommended) or
bindings inside the Operation. No new language form has been implemented or
selected. Decision-gate BLOCK applies to that product-language choice, not an
assertion that every remaining DAG node is independently blocked. Progress remains
15/37 scoped completions; the full goal stays active pending owner direction.

## I07 progress — exact evidence file loading

Alch now exports `loadApplicationEvidenceFiles(root, references)`, a read-only
loader for explicitly selected exact formal evidence. It reuses the formal
reference validator, checks the entire selection before reading selected files,
deduplicates identical references and rejects conflicting identities, path
traversal, symlink components, non-files, missing files and stale size/hash.
It snapshots bytes without discovery, output writes, fetching or acceptance.
This is local input validation, not an OS sandbox against hostile concurrent
directory replacement. Existing exact source references and claim meanings are
unchanged.

Fresh loader/formal/domain regression: **15/15 passed**, zero skips; Alch
typecheck passed. The actual domain fixture forms identically from filesystem
evidence and in-memory evidence. Subsequent file drift rejects a fresh load.
Tests remove their owned temporary directories.

This prerequisite does not yet supply the public application command, derive
internal integration/execution contracts, or run the complete application.
The provider composer still calls reference-specific artifact builders; the
graph-derived composition obligation remains open. I07 is incomplete and the
full DAG remains **15/37** scoped completions. No product decision is needed.

## I07 progress — optional Query verification

The independent Query oracle and TypeScript native observer now preserve v2
optional cardinality: no match returns null, one match returns one projection,
and multiple matches fail with QUERY_CARDINALITY. Source validation and filtering
precede cardinality. Existing list semantics and v1 descriptor shape remain intact.

Focused verification: **3/3 passed**, zero skips, including real Lean-backed
optional and v2-list baselines and seven native semantic mutants (first-match,
list-wrapped result, empty-list absence, undefined absence, wrong error, mutable
result, and premature cardinality checking). Mutation runs isolate the semantic
check; they are not full verification passes. Baseline Query semantic checks pass,
but the isolated fixture's overall verification is correctly incomplete: it has
no cross-generator evidence, output-currentness target, or separate-output proof.
The test asserts those exact three remaining checks. Owned temporary cleanup passes.
Backend typecheck and rebuild also passed.

I07 remains open: public application input loading, contract derivation,
graph-derived provider composition and the bounded runnable scenario remain.
Python/Rust optional native verification parity is not claimed by this change.
Scoped completions remain **15/37**, with 22 nodes remaining. No product behavior
or decision was changed; the full goal remains active.

## I06 scoped closure — one-source application graph and runtime join

I06 is complete for its graph/binding scope; see
[acceptance evidence and the I07 consumer inventory](APPLICATION-JOIN.md).
One Alch source now forms domain, optional Query, persistence, messaging, named
API and runtime partitions and joins all five provider bindings through the
public compiler. Qualified payloads, Event identity references, optional cardinality
and exact Operation requests remain distinct.

The combined fixture exposed and repaired an API lowerer mismatch: an external
contract is not its domain Interface. Alias bindings now explicitly name both
contract_ref and interface_ref. Wrong roles, conflated identities and implicit
scalar aliases reject. No new domain type or inferred Interface was introduced.

Changed/missing/extra results, changed runtime selection, unresolved cross-partition
references, stale partition hashes, normalized declaration collisions, and forged
graphs/preparations reject. A runtime-selection identity change preserves domain
graph bytes but invalidates the previous whole-application result.

Fresh Alch combined/persistence/messaging/API/runtime regression: **26/26**, zero
skips; Alch typecheck and diff whitespace checks pass. Earlier I06 backend runtime
join/provider tests **6/6** and generation/port checks **2/2** remain applicable;
no backend source changed in this closure.

Fifteen scoped completions, 22 nodes remaining. I07 is the runnable construction
frontier: safe public loading/build/verification, optional Query semantic consumer
repair and the runnable application scenario. The synthetic companion fixture
does not satisfy I07's user-facing contract-derivation obligation. O01 remains
separate operational support for P02. The full goal remains active.

## I06 in progress — graph/runtime join and protocol audit

Added the public backend application/runtime binding and Alch whole-application
join boundary; see [current evidence and remaining obligations](APPLICATION-JOIN.md).
Each actual provider realization is checked, preventing a compatible unused
profile from hiding an incompatible bound one. The public adapter also checks
Operation request contracts and runtime/executable target agreement.

The existing backend commerce graph joins all five bindings for all three target
packs. Alch boundary tests reject missing partitions, stale observation source
and forged preparation. The positive all-partitions **same-Alch-source** fixture
is still pending; I06 is not complete. The Query v2 consumer audit confirms the
semantic reference and TypeScript observer still assume list results; I07 retains
their repair and semantic-mutant evidence.

Fresh checks: backend runtime binding/provider selection **6/6**; Alch public
join boundaries/runtime profiles **8/8**; selected three-language provider
generation/port checks **2/2**. Both typechecks, backend build and DAG validation
pass. These 16 focused checks do not substitute for the pending same-source join.

Scoped completions remain 14, with 23 nodes remaining. The goal remains active.

## I05 scoped closure — explicit runtime/provider profiles

I05 is complete for its selection-formation scope; see
[runtime profile lowering](RUNTIME-PROFILE-LOWERING.md). The existing Alch scanner
accepts runtime-profile declarations. All provider roles are explicit; the named
pack owns library versions. Its current TypeScript/Python/Rust selections are
emitted through DomainSpec's public validator, with no ARE configuration coupling.

Formation, Rule projection and executable preparation retain the selected profile
and fail on missing selection, unsupported runtime/provider, target mismatch,
embedded values, stale output or collisions. Runtime choices do not alter domain
nodes, FormalClaims, Rules or condition joins. No provider executes in this step.

Fresh focused evidence: Alch runtime/domain/executable/API **20/20**; backend
provider selection **3/3**; selected three-language provider generation/port checks
**2/2**, zero skips. Both typechecks and backend rebuild pass. Generated runtime
requirements remain Node 26.8.1, Python >=3.11, and Rust edition 2024; an edition
is not a Rust compiler-version guarantee.

Fourteen scoped completions, 23 remaining. I06 is the runnable construction
frontier, joining all partitions. I07 retains safe public input loading and the
whole-application scenario. O01 remains operational support for P02. The full
goal remains active; no new product decision or operational effect was introduced.

## I04 scoped closure — API Value Object Operation path and historical evidence

I04 is complete for its declared construction scope. See
[the acceptance audit](I04-COMPLETION.md). The same-source public API fixture now
executes both Entity and Value Object request/Operation/response paths. Wrong
Operation input ownership rejects; named public contracts remain distinct.

The historical capsule discrepancy is resolved without changing production
configuration or any historical expected digest. The exact earlier layout-source
reference reconstructs the historical configuration and original capsule chain.
Current and historical configurations are checked separately, not called identical.

Fresh verification: Alch API **7/7**, backend Mapping/binding/API **30/30**,
source-capsule **5/5**, native three-language whole-application projection **1/1**,
zero skips. Alch typecheck and the 37-node DAG validator pass. Earlier failed
attempts and incremental evidence remain recorded below.

Thirteen nodes have scoped completion evidence; 24 remain. I05 generic runtime-
profile authoring is runnable next. I06/I07 still own application/provider joins;
O01 is operational support for P02. No product decision or operational authority
was introduced. The full goal remains active.

## I04 public Mapping Value Object successor — native execution verified

The approved pure-projection successor is selected by the three language
generators and reconciled Mapping verifier. Alch permits its declared Value
Object target; the historical public Mapping definition is unchanged and still
rejects that target. Exact successor bytes are required. See `API-LOWERING.md`.

The native whole-application fixture compiles and executes TypeScript, Python
and Rust projections into Money fields, including zero without executing Money's
positive invariant. Existing inbound/outbound public registry projections remain
covered. Repairs include demand-driven TypeScript input aliases and Rust optional
lifting; strict generated-project checks remain enabled.

Fresh focused checks: public Mapping contracts **13/13**, TypeScript public
boundaries **11/11**, Python public Mappings **5/5**, Rust Mappings **5/5**,
three-language native whole-application **1/1**, Alch Interface/API **11/11**,
selected Mapping semantic-case and poisoned-dependency isolation checks **2/2**.
The isolation check uses the explicitly installed Lean path and pinned container;
the first invocation lacked that environment setting and was rerun successfully.
Both typechecks and the final backend rebuild pass. The 37-node DAG remains valid.

Source-capsule checks are **4 pass / 1 fail**, with no skips. The new test proves
all 131 immediate predecessor sources still reconstruct capsule
`60414daef6453b440e89c0bb3575c7b79ca6bf9afea1bcdddd4472a6906b9261`.
The current 132-source capsule is
`3ea19a1e4847b87185c74ea46b3eb9310ba0a65ef2524b7ae41d3aae444d69de`.
The retained historical 130-source assertion expects
`5d5b31d9e62a5bf789272bf6af05045dac915e3d7747484336e513c0ff19f1b1`
but reconstructs `db67f55190877fdd9757723f7cf45091176723f8c626de7bf38e977a0c90360a`.
This predates the additive successor: removing it restores the exact immediate
predecessor but not that older historical capsule. One identified drift is current
configuration bytes `c82035da...` versus historical `77a7ec20...`; attribution of
the complete difference is still required. No historical checksum or receipt was
replaced to conceal the failure.

I04 remains partial for the Value Object-target API/Operation join acceptance
and historical capsule discrepancy. Twelve scoped completions and 25 remaining
nodes are unchanged. I05 remains available under the full active goal. No product
decision, release, publication, deployment or authority effect is selected here.
Earlier sections retain their original evidence as historical snapshots.

## I04 same-source API join and three-language public Mapping consumers

The API lowerer now participates in exact source formation, Rule projection and
executable compilation. Public Mapping v3 types are retained in the shared API/
messaging runtime binder, and API contract references resolve as qualified
Interface-owned public contracts, not domain data. Python and Rust domain-binding
imports preserve those public types too.

A same-source Alch fixture executes generated TypeScript ingress Mapping,
Operation and response Mapping, plus outbound request/response projections.
The separate whole-application fixture executes public API mappings in all
three languages. It exposed a Rust generator defect (public fields emitted as
getter calls); that defect is repaired and the same native test now passes.
No HTTP listener, remote call or provider execution is claimed.

I04 remains partial for the owner-approved public Mapping Value Object target
successor and its acceptance audit. Twelve scoped completions and 25 remaining
nodes are unchanged. See [API lowering](API-LOWERING.md) for the consumer map.
The earlier static-only description below is historical.

Fresh final checks: Alch source/API/Interface/integration/persistence/messaging/
executable selection **28/28**; backend shared/public API joins and three-language
native test **5/5**; backend application binding/API/whole-app regressions
**24/24**. Zero skips. Both typechecks, backend rebuild, source-materializer and
packaged-schema checks, and the 37-node DAG validator pass. The new exact
totality check is covered by the backend join tests. No historical candidate
receipt was refreshed or used as proof of these changed bytes.

## I04 API formation increment

`application-external-api.ts` and the public compiler adapter now preserve
inbound/outbound path roles, named public payload identities, explicit mappers,
provider/failure/authentication consistency and source HTTP routes. Exact
re-formation detects changed artifacts. No HTTP call or listener is inferred.
See [API lowering](API-LOWERING.md) for the closed companion and remaining work.

The backend now accepts inbound-only compositions without fabricated outbound
records and rejects unresolved authentication references in both directions.
Canonical and packaged candidate schemas agree; historical freezes are unchanged.

I04 remains partial: same-source executable wiring and public Mapping consumers
are still required. Domain-only
formation continues to reject API integrations without an integrated lowerer.
Twelve scoped completions and 25 remaining nodes are unchanged.

Fresh verification after the backend rebuild: Alch API/integration/persistence/
messaging **21/21** and backend external API **9/9**, zero skips. Both full
typechecks pass, including backend source-materializer and packaged-schema
checks. The unchanged 37-node DAG validator passes. These results cover the
new static API path, not generated API execution or I04 completion.

## I03 typed same-source closure — Value Object projection selected

The owner answered yes to `Mapping -> Value Object` as pure projection, with
construction and invariant enforcement separate. The canonical `maps` signature,
human view, generated registry and current receipt schema now reflect that choice.
No factory, persistence or invariant-execution effect was added to Mapping.

The previously failing same-source messaging fixture now passes. It compiles
native TypeScript and explicitly hands a generated Event identity through outbound
and inbound Mapping into the generated Operation. It checks maximum UInt64,
invalid identity/object/overflow rejection, exact request binding, trace mutation,
missing/extra artifacts and stale interpretation rejection. This is an explicit
test adapter, not a broker or generated whole-application transport.

Fresh checks: Alch integration/persistence/messaging **16/16**, backend public
Mapping/application-binding/messaging-join **20/20**, focused native Value Object
projection **1/1**, relationship-identity selection **3/3**. Zero skips in those
selected runs. Both full typechecks pass. The deliberately false target invariant
in the native backend fixture does not prevent projection, proving non-enforcement.

I03 is complete for typed static lowering and same-source executable binding.
Twelve nodes now have scoped completion evidence; 25 remain. Next: I04 API/public
Mapping consumer closure and I05 runtime-profile authoring. Public Mapping v3's
pinned historical contract still has the narrower target ceiling; its explicit
successor belongs to I04. No existing frozen contract or product receipt was resealed.
The prior failure/decision entries below are historical and now resolved.

## I03 same-source increment — canonical Mapping decision required

Formation, Rule projection and executable compilation now carry the messaging
composition and trace, and call the shared backend typed runtime join. The new
same-source fixture exposed a cross-layer contract disagreement: Alch and the
typed Mapping v2 field checker can describe a Value Object target, but canonical
`maps` permits only Entity or Interface. Actual compilation rejects
`Mapping->Value Object` with `MTCLI_RELATIONSHIP_ENDPOINT`.

The focused messaging run is **4 passed, 1 failed**, zero skips; the new
same-source acceptance test deliberately remains failing, not skipped or weakened.
The unaffected persistence/integration regression passes **11/11**, zero skips,
and the final Alch typecheck passes.
The additional Operation guard and Value Object invariant are explicit fixture
choices. No canonical relationship has been changed and no Value Object has
been replaced by an Entity to bypass the disagreement. I03 remains partial;
completion count remains eleven. The prior review's green results describe
the pre-increment bytes, not this new acceptance fixture.

Decision needed: allow Mapping to project to a Value Object (recommended,
retaining separate construction/invariant enforcement), or keep the canonical
restriction and explicitly reject that authoring shape. This decision precedes
promoting the typed I03 join; it is not a runtime/provider or D65 approval request.

## Current review — revision 5

[Current implementation review and reviewed DAG](CURRENT-REVIEW-AND-PLAN.md)
supersedes earlier scheduling summaries. Eleven nodes retain scoped completion
evidence; 26 remain, including partial I03. Fresh checks: 15/15 Alch integration,
persistence and messaging tests; 8/8 backend binding tests; both full typechecks
pass. No skips. No node is promoted by this review.

The shared backend messaging runtime join and public Alch adapter are implemented
and tested, but same-source domain/executable formation still rejects messaging.
I03 now explicitly requires that join. I04 explicitly owns the runtime consumer
gap for public Mapping v3. I04/I05 are dependency-ready; O01 affects only P02.
All 37 node IDs and dependency edges are retained. Historical failed-build and
earlier test-count entries below remain dated evidence, not the current state.
This turn changes planning documents only, not compiler implementation.

## I03 identity-projection prerequisite

Mapping lowering now preserves explicit Entity-identity projection instead of
rejecting the backend-supported path. It cannot access other Entity fields or
silently turn a reference into an Entity snapshot. Mapping/Interface regression
passes 9/9, zero skips, and Alch typecheck passes. I03 remains partial; typed
messaging graph/request composition is still the frontier. No product decision
or backend contract was changed.
The final five-test Mapping rerun also passes after adding the generated
Event-to-Mapping identity handoff; zero skips. That handoff is explicit test
composition, not publication or subscription execution.

## I03 messaging increment

[Messaging construction](MESSAGING-LOWERING.md) adds static path and policy
binding through the public existing messaging compiler. Exact Event/Message/
Mapping/Operation identities, channel kinds, acknowledgement, deduplication and
dead-letter paths are checked. Three focused tests pass, zero skips. I03 remains
partial: typed payload/Mapping/Operation-request closure and same-source joining
are still required. No messaging runtime, delivery or full-application result is
claimed. Completion count remains eleven; the full goal remains active.
Final messaging/persistence/integration regression passes 14/14, zero skips;
Alch typecheck and the 37-node DAG validator pass.

## Current frontier — I02 static lowering complete

[Persistence lowering](PERSISTENCE-LOWERING.md) now carries backend-consumable
input, compiled snapshot and trace through same-source domain formation,
Rule/Query projection and executable preparation. Compilation checks actual
Query cardinality/source and selected Operation write slots. Currentness rejects
physical mapping drift; unsupported mixed integrations remain fail-closed.
Four final persistence tests pass; preceding 14-test domain/executable/Rule
and 13-test integration/domain-vertical selections pass, all without skips.
Eleven nodes have scoped completion evidence; 26 remain. Next: I03 messaging
lowering; I04 and I05 are also ready. Earlier partial-I02 entries are historical.
This closes static I02 obligations, not database execution or full application wiring.

## I02 persistence increment

[Persistence construction](PERSISTENCE-LOWERING.md) records the new static
source-to-existing-contract bridge. It resolves Entity/Query/write-Operation
roles, checks exact field/identity shape coverage and local transaction scope,
retains Query cardinality and binds the full result to exact inputs. I02 is
partial: complete domain/application binding and final authored provider choices
are not inferred from this companion-driven construction increment. No database
was contacted and the full-application fail-closed guard remains unchanged.
Fresh persistence/integration/Interface regression: 14/14 tests pass, zero
skips. Alch typecheck passes. Completion count remains ten; I02 is not promoted.

## Current frontier — I00 complete

[I00 completion evidence](I00-COMPLETION.md) closes the bounded domain/public
contract prerequisites. Compiler typecheck now passes; 27 predecessor tests,
four Interface/public-Mapping tests and two combined-domain tests pass with
zero skips. The combined fixture maps the actual committed Operation result
into the named public response. No integration/provider execution is inferred.
Ten nodes have scoped completion evidence; 27 remain. I02, I03, I04 and I05
are dependency-ready. Next implementation: I02 persistence lowering.
The review below is the earlier failing-build snapshot, not current build status.

## Latest review — revision 4

[Live implementation review and next DAG](LIVE-REVIEW-AND-NEXT-DAG.md) owns
current scheduling. Fresh tests: 24/24 pass, zero skips. **Current Alch
typecheck fails with five diagnostics** in the unfinished public-contract
change. Interface formation/native values exist; public Mapping v3 lowering
and combined public-boundary proof remain incomplete. I00 is partial; I05
remains dependency-ready. Nine scoped historical completions and 28 remaining
nodes are unchanged. Historical statements below that typecheck passes or no
construction blocker exists do not describe these current working-tree bytes.
Revision 4 also makes optional Query public-verifier compatibility explicit
at I06/I07 rather than deferring a first-vertical prerequisite to later breadth.
No implementation was changed by this review.

Original goal: execute all 36 nodes; stop for a decision only when it changes an agreed
product decision. User authorization: 2026-09-17 goal instruction.
Authority effect: none. Product approval and external effects remain outside
the implementation DAG.

Planning review, 2026-09-17: the revised DAG contains 37 nodes. I00 makes the
previously implicit L1 Event/Mapping prerequisite explicit; no original node
or product obligation was removed. This review does not execute the plan.

Revision-3 review after L0 completion: I00 additionally owns the bounded
FindOrder Query needed by persistence; I02 now depends on I00 and I01.
I07 explicitly closes author-facing internal bindings and safe output behavior;
C05 includes three-target integration scenarios beyond the 39 domain cells.
No node status was promoted by this planning review. Fresh focused checks:
8/8 Alch tests and typecheck pass. Full L0 counts below remain historical.

## Product construction

| Node | Status | Evidence |
| --- | --- | --- |
| B00 | Complete for selected starting inputs | `baseline-inputs.json`; current source inspection confirmed the legacy parser and v4 candidate boundaries described by the review. Earlier test counts remain dated review evidence. |
| S01 | Complete as an implementation contract | `AUTHORING-CONTRACT.md`, `syntax-cases.json`; reconciles FormalClaim, Rule, Policy, guard, Invariant, and Operation semantics with existing schemas. Parser conformance is not claimed. |
| S02 | Complete for the typed endpoint contract | `CONDITION-BINDING.md`; public `compileFormalConditionBindings` API; four focused test groups pass, including hostile identity/endpoint/currentness mutations. Full claim validation and executable preservation remain S03/S04/S06 obligations. |
| S03 | Complete for the L0 authoring slice | Existing scanner and normalized model parse explicit FormalClaim/Rule source, typed data and operations; unchecked raw declarations are removed. Missing or unsupported constructs reject. `FORMAL-LOWERING.md` records the implemented slice and deferred C02/C03 breadth. |
| S04 | Complete for the L0 formation slice | `lowerApplicationDomain` and `assertApplicationDomainCurrent`; all project and companion artifacts are trace-bound, enum variant meaning is preserved, and rehashed/omitted/extra artifacts reject against exact inputs. Actual DomainSpec graph/claim join passes. Operation shapes remain explicitly non-executable, owned by S06. |
| S05 | Complete for the bounded compatibility boundary | `COMPATIBILITY.md`; explicit legacy profile, historical-default classification, non-carrier diagnostics, unchanged compiled output, CLI diagnostics and target rejection tests. Existing defaults are retained, not migrated. |
| S06 | Complete for the bounded TypeScript vertical | `EXECUTABLE-LOWERING.md`; explicit typed Rule and Operation bindings, exact graph/claim join, native success/rejection/uncertainty, semantic mutant and fresh-process repeatability. |
| L0X | Complete as bounded L0 evidence join | `L0-COMPLETION.md`; all L0 nodes accounted for, 18 syntax cases classified, seven C03 breadth cases explicitly deferred rather than counted as implemented. |
| I01 | Complete for closed integration grammar and normalized intent | `INTEGRATION-GRAMMAR.md`; five typed paths through the existing scanner, exact current backend relationship map, seven focused integration test groups. Reference resolution and executable contracts remain I02–I06. |
| I00 | Complete for the bounded domain/public-boundary prerequisites | `I00-COMPLETION.md`; distinct Interface request/result contracts, qualified public Mapping v3 and combined native domain fixture. |
| I02 | Complete for static persistence lowering and domain/executable reference join | `PERSISTENCE-LOWERING.md`; exact contract emission and four focused persistence tests. Provider authoring and runtime wiring remain I05–I07. |
| I03 | Complete for typed messaging lowering and same-source executable binding | `MESSAGING-LOWERING.md`; native explicit fixture, exact payload/request join and currentness checks. Broker/runtime application wiring remains I06/I07. |
| I04–I07, L1X–L4X | Pending | Dependencies and obligations remain in `EXECUTION-DAG.json`; I04/I05 are ready. |

Current frontier: L1 messaging/API and runtime-profile lowering (I03–I05); I00 prerequisites, I01 grammar and I02 static persistence lowering are implemented. All original nodes remain in scope. No product decision
has been changed. There is no current causal construction blocker.

## Operational support

O01, container tool-path repair, remains pending; owner: implementation agent.
Its affected stage is P02 installed qualification. It does not block L0–L3.
Publication, release, deployment, production credentials and remote provider
operation remain deferred residue outside this DAG.

## Evidence policy

The baseline records original source bytes and is never refreshed to conceal
subsequent implementation changes. New layer evidence records changed bytes
separately. A node is complete only when its own deliverables and checks exist;
syntax fixtures are obligations until actually executed by the parser tests.

## Current implementation files and checks

DomainSpec additions: `impl/cli/src/formalization/condition-binding.ts`, its
public export in `impl/cli/src/index.ts`, and
`impl/cli/test/formalization/condition-binding.test.ts`.

Alch additions in the sibling checkout's
`language/capabilities/alchlang/plans/general-compiler-v1/implementation`:
`src/formal-claim.ts`, scanner integration in `src/parser.ts`, public types and
expression parser export in `src/index.ts`, and `test/formal-claim.test.ts`.

Checks run on 2026-09-17:

- DomainSpec: `node --import tsx --test test/formalization/condition-binding.test.ts`
  passes 4/4 test groups; full `npm run typecheck` passes including materializers.
- Alch: `node scripts/run-toolchain.mjs tsx --test test/formal-claim.test.ts
  test/parser.test.ts test/backend-types.test.ts` passes 16/16; `npm run typecheck`
  passes.
- Original DAG validator passes: 36 nodes, five layers, unchanged dependencies.
- Eleven starting-input hashes were checked before parser changes. Those
  changes deliberately make the historical baseline differ; do not refresh it.

The new target carrier cannot be executed by the legacy compiler. This is an
explicit construction boundary until S04/S06 supplies complete lowering and
preservation evidence. Non-formal declaration sections now normalize into typed
roles or reject explicitly. Syntax parsing is not whole-application validity.

Additional implementation on 2026-09-17: `src/application-source.ts`,
`src/formal-claim-lowering.ts`, `test/application-source.test.ts`, and
`test/formal-claim-lowering.test.ts` in the Alch implementation. The application
source suite passes 3/3 groups; formal lowering passes 7/7, including validation
against DomainSpec's actual v4 source, meaning and definition-binding schemas.
The final combined application-source/formal/formal-lowering/parser/backend
selection passes 26/26 after the duplicate-domain/owner checks. Typecheck and
the unchanged 36-node DAG validator pass. See `FORMAL-LOWERING.md` for limits.

Review rerun on 2026-09-17: the six-suite Alch selection including
`test/application-domain-lowering.test.ts` passes 29/29 with no skips; Alch
typecheck passes. DomainSpec condition-binding tests pass 4/4. These verify
formation and endpoint binding, not generated application behavior. Earlier
whole-application, host/container, and installed-candidate results were not
rerun for this review and remain historical evidence.

Implementation continuation, 2026-09-17: S04/S05 closure adds total companion
inventory, exact re-formation currentness validation, enum variant metadata
preservation and explicit legacy compatibility diagnostics. Seven focused
Alch suites pass 37/37 before the final CLI compatibility case; the updated
source-file suite then passes 5/5, including that new case. Alch typecheck
passes. These are bounded formation/compatibility checks, not S06 execution
evidence. New and exercised source-file temporary directories register cleanup.

Final combined rerun after all S04/S05 edits: **38/38 pass, zero skips**;
typecheck and the 37-node DAG validator pass. Current frontier remains S06.

S06 increment: `src/application-rule-projection.ts` adds explicit ground
Bool-property interpretation with total symbol binding, unchanged claim
identity, bounded expression expansion and exact projection currentness.
The projection/domain/formal-lowering selection passes **15/15, zero skips**;
Alch typecheck passes. Native generated TypeScript matches 16 Boolean oracle
cases and rejects malformed values. No operation execution or L0 completion
is claimed; the full 37-node goal remains active.

S06/L0X closure: `src/application-executable.ts` joins frozen exact source and
action selections through public DomainSpec compile/plan APIs. The fixture
explicitly authors both eligibility and identity Rules; no factory validator
is inferred. The final ten-suite Alch run passes **46/46, zero skips** after
all source/trace changes; typecheck passes. The DomainSpec binding suite passes
**4/4** and the DAG validator passes. Two child-process runs agree on actual
candidate/join/trace/artifact digests. A compilable guard-bypass mutant fails
the rejection oracle. The L0 record does not claim CLI integration, installed
packages, provider durability, formal proof or full goal completion.

I01 implementation increment, 2026-09-17: the existing scanner now recognizes
subscription, publication, inbound-endpoint, outbound-call and persistence.
`src/application-integration.ts` supplies typed normalization and source-linked
diagnostics. Queue/topic/stream, acknowledgement conditions, Event/Message and
read/write references remain distinct. Legacy profiles reject integration
sections; domain-only lowering rejects rather than silently discards them.
The contract and exact backend ownership map are in `INTEGRATION-GRAMMAR.md`.

After these changes, the full selected L0 regression plus integration suite
passes **53/53, zero skips**, including native operation, mutation and fresh
process repeatability checks; Alch typecheck passes. The original L0 checkpoint
hashes remain historical; changed parser/model/lowerer bytes are this successor
increment, not a refreshed old candidate. No integration execution or L1 exit
is claimed. Nine nodes now have scoped completion evidence, 28 remain.

I00 Event increment, 2026-09-17: distinct Event occurrence metadata now parses
and lowers through the existing backend Event contract. Public compiler/plan
output compiles and executes for required and generated timestamp policies.
The first native run exposed negative UInt64 reference acceptance in the
backend Event generator; the lower-bound check is repaired and directly tested.
Focused Alch Event/domain/source checks pass **11/11, zero skips**, and the
backend boundary regression passes **1/1**. No Event effect, publication,
Mapping/Query closure or full I00 completion is claimed.

Final Event-increment regression: **20/20** Alch Event/integration/executable/
source/domain test groups pass with zero skips. Both Alch and DomainSpec full
typechecks pass (including DomainSpec materializer/schema currentness checks),
the backend direct regression remains **1/1**, and DAG validation passes.

I00 Mapping increment: named typed inputs and field arrows now lower to the
current `domainspec.typed-mapping/v2` contract plus one canonical `maps` edge.
No calculation, factory or input default is inferred. Three focused test groups
pass, including public backend generation and native execution with exact
UInt64 values, independent explicit inputs and malformed-input rejection.
I00 remains partial; Query and operation effects are not implemented by this
increment. Historical receipts and node completion counts are unchanged.

Final Mapping-increment regression: **23/23** selected Alch test groups pass,
zero skips, including native Mapping/Event/Operation execution. Alch typecheck
and the 37-node DAG validator pass.

I00 Operation-effect increment: authored `produces` clauses now form exact
effect slots and canonical edges; executable preparation checks exact Event
coverage and prevents hidden slots. The focused effects plus predecessor
executable selection passes **4/4**, zero skips, including native combined
write/Event commit, guard/payload rejection, commit rejection and uncertainty.
No publication/delivery or durable provider guarantee is inferred. Query and
the combined I00 join remain pending.

I00 Query formation increment: the shared parser now retains a declared Rule,
explicit Query input/source bindings and optional-versus-list output. Formation
emits a canonical Query/read edge and trace-bound `query-shapes.json` without
inventing an executable filter. The existing list-returning backend does not
yet realize this full contract; Query-bearing execution fails explicitly until
the Rule argument and result-cardinality projection is implemented. Focused
Query/source/domain/effects tests pass **13/13**, zero skips; Alch typecheck
passes. I00 and the full goal remain incomplete.

I00 Query Rule-projection increment: `application-query-projection.ts` now
checks exact Rule argument coverage/types, substitutes explicit ontology-bound
paths into the existing backend predicate contract and emits trace-bound list
Queries. Public compilation and native execution pass zero/one/multiple-match,
UInt64, immutability and malformed-input cases. Rehashed filter removal rejects
against exact re-formation. The focused Query selection passes **6/6**; the
Query/Rule/effects/executable/integration regression passes **20/20**, zero
skips. Alch typecheck passes. Optional output still rejects explicitly with
`APPLICATION_QUERY_CARDINALITY_REQUIRED`; no first-row fallback is introduced.
Nested paths that the backend cannot represent also reject. This is an
increment toward full I00, not a replacement for optional FindOrder, integration
lowering, broader C02/C03 support or the combined vertical.

I00 optional-cardinality increment: backend `domainspec.typed-query/v2` now
represents explicit list/optional results. Optional queries reject limits,
return native absence for zero matches, a projection for one, and
`QUERY_CARDINALITY` for multiple matches. The configured TypeScript/Python/Rust
generators expose an exact candidate extension rather than changing pinned v1
profile meaning. Legacy generation rejects v2 explicitly. Alch optional output
uses v2; existing list output retains v1. Alch Query tests pass **7/7**;
backend Python/Rust/contract selection passes **11/11** before the added legacy
rejection test. Both full typechecks pass, including DomainSpec materializers.
No skip, profile admission, whole-application parity or I00 completion is claimed.

TypeScript Query regression plus the then-two cardinality/legacy checks pass
**10/10**, zero skips, including independent native mutation observers. The
original list profile bytes remain unchanged. Optional protocol observation
outside these focused native tests remains part of later verification work.

Final focused contract rerun passes **3/3**, adding exact v2 `reads`-edge
coverage: missing, duplicate and retargeted relationships reject. DAG validation
also passes. Full I00 closure still requires the combined keyed-query fixture.

After the final backend rebuild, Alch Query plus Operation-effect regression
passes **9/9**, zero skips, against the refreshed public compiler output.

I00 combined-domain increment: `test/application-domain-vertical.test.ts` now
compiles one source through public APIs and executes a keyed optional FindOrder,
explicit multi-input Mapping and write/Event Operation together. Two test groups
pass, including max UInt64 keys, exact predicates/edges/traces, deterministic
projection, missing and duplicate reads, guard and malformed-Event rejection,
commit rejection and uncertainty. The test adapter explicitly supplies the
Operation's Entity read via FindOrder; this is not generated workflow or provider
lowering. Alch typecheck passes.

Completion audit found the remaining I00 request/response prerequisite: the
backend already owns named public contracts in `typed-backend/interface.ts`
and public mappings in `typed-backend/mapping-public.ts`; the application-v1
Alch declaration union cannot yet author them. I00 remains partial until the
bounded public contract/mapping slice is lowered and natively checked. This
retains the original I00 obligation; no Entity or Value Object is fabricated
to make an API DTO appear supported. I02–I04 dependency status is unchanged.

Combined-domain/Query/Operation-effect regression passes **11/11**, zero skips;
the 37-node DAG validator also passes. No I00 status promotion was made.
