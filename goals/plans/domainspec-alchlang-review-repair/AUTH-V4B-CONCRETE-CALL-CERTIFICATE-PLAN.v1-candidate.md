# Auth V4b concrete call-edge certificate — candidate SWU plan

Status: reviewed design candidate, not execution admission or a V4b proof.
Owner-accepted meaning remains
[`BUSINESS-MEANING.v1-clarified-accepted.json`](../../../auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json).
The [call-boundary analysis](AUTH-V4B-CALL-BOUNDARY.v1-candidate.md) owns the
current scope hazards. This plan is one bounded implementation unit toward its
all-path exit condition, not a replacement for that condition.

## Desired result

Produce a replayable, fail-closed certificate for the exact concrete
`SqliteAuthService<SystemDecisionClock>` construction used by the HTTP
database builder. It must identify the selected downstream adapter endpoint
and show, for the selected source/call graph, that a normally evaluated
**kernel DENY** cannot traverse an edge to that adapter. Early service DENY,
kernel DENY, and downstream policy DENY after READY must remain distinct.
This certificate is a bounded sublemma: it cannot by itself choose the full
endpoint interpretation or discharge the owner's unqualified no-call rule.

## Context pack (standard, source-bound)

| Obligation | Selected evidence and selector |
| --- | --- |
| Accepted rule and scope | Accepted BusinessMeaning `rule`, `applies_when`, `boundaries`; no public-DENY substitution. |
| Existing direct sublemma | `AuthWrapperTrace.lean` direct-site trace; `auth-v2-wrapper-extract.mjs` and hostile tests. |
| Concrete entry and clock | `authorization-api/src/lib.rs` `SystemDecisionClock`, `authorization_runtime_from_database`; `authorization-service/src/lib.rs` `authorize`, `authorize_detailed_with_hook`. |
| Preparation and invocation | Service `authorize_in_epoch`, `ResolvedDecisionService::authorize`; `trusted-input-provider::resolve_in_transaction`; `sqlite-provider::resolve_authorization_state_in_transaction`. |
| Composition and guard | `trusted-boundary-pre-resolved-v2-candidate/src/lib.rs` fixed clone resolvers and forwarding adapter; `trusted-boundary-v2/src/lib.rs` kernel match. |
| Existing separators | `no_call_contract_gap.rs`, `pre_resolved.rs`, service `concrete_v2_caller_counts_downstream_invocations`. |
| Current source binding | `current-evidence-successor-v2/binding.json` and validator; generated-v2 projection is separately replayed there. |

The source paths above are under `auth-foundation/implementation/`, except the
accepted meaning and Lean/extractor files under `auth-foundation/formalization/`.
Only exact selected source and test files should be read or changed. Historical
v1 receipts and the owner-accepted meaning remain unchanged.

## First implementation checkpoint (2026-10-04)

`auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-call-certificate.mjs`
now extracts the pinned pre-resolved invocation and BorrowedDecision forwarding
body, then consumes the existing source-extracted wrapper IR. Its output is
**`indeterminate`**, with only the fixed call shape and wrapper direct-site
DENY=0/READY=1 sublemma recorded. The focused six-test suite catches eager
and duplicate wrapper calls, pre-resolved body changes, BorrowedDecision
forwarding changes, outside-body drift, and Cargo drift. These are source-level
fixtures; Rust compilation of harmful mutants and the rest of C1–C5 remain
open. Replay:

```sh
node auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-call-certificate.mjs
node --test auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-concrete-call-certificate.test.mjs
```

This checkpoint does not yet bind the concrete service adapter receiver,
selected clock or provider effect closure. It is not a passing call-edge
certificate and does not close V4b.

## Second implementation checkpoint (2026-10-04)

The same extractor now pins the concrete authorization-service source and
Cargo manifest, checks the selected `authorize_pre_resolved` call occurrence in
`authorize_in_epoch`, and checks that its receiver has the
`ResolvedDecisionService` shape. It also checks the selected adapter body,
including its one port-counter increment at method entry. The focused
nine-test suite adds receiver-swap, counter-change, and unselected-source
drift controls. An adversarial review showed that an unchanged call can be
made unreachable while this slice still extracts it; a fixture records that
limit. The output remains
**`indeterminate`**: this is a fixed source-shape binding, not an all-path
effect or call-edge proof. In particular, selected-call reachability,
helper/callback effects, selected
clock/provider effects, endpoint-set interpretation, and normal-context/list
correspondence remain open. The same replay commands above apply.

## Third implementation checkpoint (2026-10-04)

The extractor now tokenizes the executable top-level `let routes = snapshot`
statement, checks its complete selected shape, and consumes every token from
its terminating semicolon through the service function's return expression.
The closed five-statement tail rejects an early return, a conditionalized or
duplicate call, receiver substitution, and extra statements. Independent
adversarial review found a comment-spoofed raw-text cutpoint in the initial
version; the tokenized cutpoint and a dedicated negative fixture close that
specific bypass. A separate service-tail fixture checks an added second
pre-resolved invocation. All thirteen focused tests pass.

The new `selected_call_reachable_from_tail_entry` field means only that normal
execution **after completing this selected routes statement** proceeds through
the fixed call in the pinned exact-template source. It is not a general Rust
CFG extraction or proof that execution reaches the tail from the public entry.
The certificate remains `indeterminate`; C1–C5 and the full V4b obligation
remain open.

## Fourth implementation checkpoint (2026-10-04)

The extractor now also pins the selected authorization API source and Cargo
manifest. An exact-template check binds the database builder's
`SqliteAuthService<SystemDecisionClock>` construction, the trait forwarding
body, the selected clock body, the service public no-op hook, and one literal
`authorize_in_epoch(&epoch, request, after_trusted_input)` occurrence in the
detailed method. These are source-shape facts, **not** a parsed detailed CFG,
runtime effect classification, or proof that public entry reaches the checked
tail. The focused suite passes 17 tests; the API crate's nine HTTP tests also
pass under the local pinned Rust toolchain.

Independent review found no bypass of the selected exact-template checks but
required the in-epoch field to be named an *occurrence*, not a success-path
edge. The alternate-clock, clock-body and duplicate-call fixtures are
template-drift controls; they do not satisfy C4's compiled harmful-mutant
requirement. The dynamic `from_engines` path, callback/provider effects,
SQLite internals, and API timeout behavior remain outside this selected
certificate. Full V4b remains `indeterminate`.

## Fifth implementation checkpoint (2026-10-04)

The selected `authorize_in_epoch` body now has a lexed, exact-template
prefix binding from function entry up to the executable `let routes =
snapshot` tail entry. The certificate reports six named pre-tail call sites:
trusted-input resolution, authentication metadata, route revision, the
injected hook, authorization-state resolution, and state-join checking. This
is explicitly a non-exhaustive lexical-marker list; local helper calls,
inline closures, and nested effects remain unenumerated. A
pre-tail early return or added effectful call now fails extraction in fixture
mode; the focused suite passes 17/17 tests. This is a source-syntax boundary,
not a complete call graph: unnamed standard-library, SQLite, provider,
snapshot and callback leaves are not yet effect-classified. The manifest says
`closure: open`; full V4b and `runtime_guarantees_observed` remain
`indeterminate` and `false` respectively. The next slice must derive a
complete pre-tail call/leaf inventory, resolve the selected no-op hook through
the detailed method, and treat unknown dispatch/effects as open rather than
no-call evidence. Independent review found no bypass of the bounded prefix
syntax check, but required the six-site output to be labeled non-exhaustive;
the fixture remains a template-rejection control, not C4's required
compiled harmful mutant.

## Sixth implementation checkpoint (2026-10-04)

A standalone, offline `syn` reader now parses the selected service source and
visits the 20 top-level statements before the routes-tail. On the pinned
source it emits 65 explicit function-call/method-call/macro AST nodes with
statement ordinal, syntactic callee and expression, method receiver, closure
depth, and nested-item depth. The certificate pins the reader source,
manifest, lockfile and service source, and includes the emitted inventory.
Hostile fixtures add calls inside a filter closure and branch condition,
exercise a macro boundary, and expose a cfg-gated nested function whose call
is syntactically present but not established reachable. The focused suite
passes 19/19; Rust formatting is applied.

Independent review required receiver and nested-item context and a narrower
exhaustiveness label; those changes are incorporated. `syn` does not expand
macro token trees or attributes, resolve dynamic targets, classify implicit
Rust operations, or close transitive helper/provider/SQLite effects. Thus this
checkpoint closes only the **parsed explicit-call-node inventory of the
selected pre-tail statements**. C1's complete call/leaf graph, C2, C3, C4,
C5, full V4b and `runtime_guarantees_observed` remain open/false. Final bounded
review found no remaining issue in that syntax slice; it independently reran
19/19 focused tests, offline locked Cargo check, and formatting check.

## Seventh implementation checkpoint (2026-10-04)

The pinned `syn` reader now supports unique free-function and exact
trait/self-type selectors. The certificate pins both provider roots and binds
a six-node inventory with six named edge-presence bindings in the
local/generated trusted-input chain, including
the Cargo-selected generated `resolve_trusted_inputs` library. It inventories
calls inside row-decoding closures and preserves all unmatched standard
library, SQLite, macro and implicit operations as open effects. The selected
SQLite authorization-state provider remains a root inventory only; its trait
implementations and helpers are the next construction frontier. The focused
suite passes 21/21. Source-level fixtures detect a broader native decision
call inserted into a provider root, including a fully qualified call, but
these fixtures are not compiled
harmful mutants and do not satisfy C4. The direct-site matching here is
syntactic and does not establish runtime invocation or target resolution.
Independent review found and prompted repair of a qualified-call false
negative. The six bindings are presence checks, not exhaustive argument,
call-count or extra-edge closure; aliases and dynamic dispatch remain open.
Full V4b stays `indeterminate`; `runtime_guarantees_observed` stays `false`.
After the qualified-call repair, independent recheck found no remaining issue
in this bounded syntax claim. The focused suite passes 21/21, offline locked
Cargo check and format check pass, and the current-v2 technical successor
verifier reports `pass` with `authority_effect: none`.

## Eighth implementation checkpoint (2026-10-04)

The selected SQLite authorization-state resolution branch now has a pinned
13-node inventory and 15 named edge-presence bindings: its root, four exact
`&SqliteSnapshot` trait-implementation bodies, relation-revision and row
helpers, and `ResolvedAuthorizationState::new` in the runtime adapter. The
reader reports every other parsed explicit call site as unbound (108 on the
current source), not silently safe. It pins selected source, Cargo manifests,
and available lockfiles. A receiver-change fixture rejects the expected root
edge; a fully qualified native-decision-call fixture is detected. A competing
inherent-method fixture demonstrates that unchanged root call syntax does
**not** prove trait dispatch; the certificate explicitly leaves dispatch
resolution open rather than claiming to detect that competing target.

Independent review confirmed the 13/15 selected syntax map and found no
overclaim under that limit. The focused suite passes 22/22; the full
certificate still says `indeterminate` and
`runtime_guarantees_observed: false`. Remaining C1 work includes service
join/snapshot accessors, exact target/alias resolution, extra-edge and
argument closure, and external/implicit-effect assumptions. C2–C5 and the
owner-accepted no-downstream-call rule remain open.

## Ninth implementation checkpoint (2026-10-04)

The service's pre-tail state-join call is now linked by source-spelled syntax to
`authorization_state_joins_hold`, four `SqliteAuthorizationStateSnapshot`
accessors, and five `ResolvedAuthorizationState` accessors. The selected graph
has 11 bodies and 10 named edges. Its helper/accessor bodies are checked for
whole lexed equality against pinned current source; the selected service,
SQLite, and adapter sources, Cargo manifests, and available lockfiles are
pinned. Hostile source fixtures change the join argument, insert a decision-
named call, redirect snapshot forwarding, remove the role-completeness guard,
and change an adapter field read; all are rejected. The focused suite passes
23/23. Independent read-only implementation analysis identified the minimal
slice and its remaining claim limits.

This is a syntax map, not dispatch or execution proof. In particular,
short-circuit calls need not execute on every path; the values passed into
`ResolvedAuthorizationState::new`, competing method targets, implicit effects,
and external calls are still open. Full V4b remains `indeterminate` with
`runtime_guarantees_observed: false`. The next C1 frontier is constructor
argument/value mapping and selected target resolution, followed by effect
closure and the compiled harmful-mutant C4 check.

## Tenth implementation checkpoint (2026-10-04)

The SQLite resolver-to-`ResolvedAuthorizationState::new` mapping now binds the
five exact source-spelled constructor arguments and the selected provider
expressions for sessions, roles, revision, and scope evidence. The complete
selected resolver body is byte-equal to pinned source, which also binds the
conditional incomplete-roles fallback, guarded revision-completeness
calculation, and absence of intervening shadowing in this exact template. The
adapter constructor's signature and field assignments are lexically bound to
pinned source. Hostile source fixtures swap the two Boolean arguments, shadow
a local, alter the fallback or relation guard, and swap adapter fields; each is
rejected. The focused suite passes 24/24; the current-v2 technical verifier
reports `pass` with `authority_effect: none`. Independent review found no
code-level defect in this bounded mapping.

This is **not** generic dataflow, trait-dispatch, SQL-behavior, path, or effect
closure. The Ninth checkpoint records the state *before* this mapping; the
remaining C1 frontier is selected target/alias resolution and a finite
effect/leaf manifest. C2-C5, including a compiled harmful C4 mutant, remain
open. Full V4b is still `indeterminate` with
`runtime_guarantees_observed: false`.

## Eleventh implementation checkpoint (2026-10-04)

The four selected SQLite resolver calls now use fully qualified trait-and-
`&SqliteSnapshot` Self-type syntax. This removes the known inherent-method
redirection hole for those four calls: their source spelling names the exact
runtime-adapter trait implementation, and the current SQLite crate passes
offline locked Cargo checking. The certificate binds all four qualified call
sites and their constructor-related arguments. A competing-inherent source
fixture no longer changes the selected edge spelling; mutation fixtures that
revert the sessions call to method syntax, alter the other three trait paths,
or change a selected argument are rejected. The SQLite source
digest in the current-v2 technical binding is synchronized; the current-v2
verifier reports `pass` with `authority_effect: none`, and the focused V4b suite
passes 24/24. Independent review found and prompted removal of an unsupported
claim that the certificate itself compiles its input; compilation remains an
external validation, not a reader output.

This resolves only the selected four source-spelled targets. Other aliases,
callbacks, dynamic targets, SQL and standard-library effects, and complete
pre-boundary reachability remain open. The competing-inherent fixture is not a
compiled C4 harmful mutant. C1-C5 and full V4b remain incomplete;
`runtime_guarantees_observed` stays `false`.

## Twelfth implementation checkpoint (2026-10-04)

A machine-checked selected parsed-site manifest now reconciles duplicate
service pre-tail and provider-root inventories, fixes the selected 30-body
set, and partitions all 248 selected `syn` call/macro sites: 34 are attached
to named source edges and 214 are unresolved call boundaries. Every row keeps
effect status open. It rejects ordinal gaps, invalid or mismatched edge sites,
duplicate site assignments, mismatched duplicate inventories, and changed
edge destinations. A source-level fixture adding a decision-named call in a
trusted-input helper increases the unresolved count instead of silently
omitting that call. Independent review found the edge-destination relabeling
gap; the manifest now checks the expected source-to-destination edge set.
The focused V4b suite passes 26/26.

This is finite **accounting for selected parsed syntax**, not the full C1
reachable-call and leaf/assumption manifest. Unselected reachable helpers,
macro expansion, implicit operations, external internals, dynamic effects,
and all-path control flow remain outside the proof. The manifest and full V4b
stay `indeterminate`; `runtime_guarantees_observed` remains `false`.

## Thirteenth implementation checkpoint (2026-10-04)

The next selected C1 slice binds eight service-local helper bodies and nine
source-site edges behind the READY predicates: command construction and
snapshot matching, authentication metadata, route revision, reference and
permission-component validation, their shared identifier validator, and
`AuthorizationEvaluationEpoch::transaction`. The selected helper bodies are
byte-equal to pinned source; edge argument expressions are compared with the
baseline inventory, so same-typed argument substitutions are rejected in
fixture mode. Their call sites join the same fail-closed parsed
site manifest, now 38 bodies and 281 sites: 62 named-edge sites and 219
unresolved boundaries. Hostile edits to helper bodies, a SQL callback, a
transaction receiver, and a source-edge destination fail closed; an inserted
decision-named call in the authentication filter remains visible and open.
The focused V4b suite passes 27/27.

This is still selected source-edge accounting, not transitive effect closure.
`char::is_control` is passed as a function value, and `?`, SQL callbacks,
iterator closures, trait dispatch, and external implementations retain open
effects. The public-entry spine and no-op-hook effect proof are not yet in this
manifest. The next high-priority C3/C4 step is a structural service-tail IR
that admits at least one compiled, well-typed harmful fixture and detects its
READY/DENY call-count violation; the current exact-template tail checker
rejects every such mutation before the graph property can see it. C1-C5 and
full V4b remain incomplete, with `runtime_guarantees_observed: false`.

## Fourteenth implementation checkpoint (2026-10-04)

The pinned `syn` reader now emits every top-level selected service-tail
statement. A closed two-shape grammar accepts the current inline
`ResolvedDecisionService` construction and one named-adapter variant. The
named variant calls `V2AuthorizationDecisionService::authorize` on that same
instance before passing it to `authorize_pre_resolved`. Its extracted tail IR
reports one pre-kernel adapter call; composition with the wrapper graph yields
DENY=1 and READY=2, so C3's call-count property fails. The exact changed
service source is placed in a temporary sibling Cargo crate, checked with
`cargo check --offline --locked`, and removed; this establishes a well-typed
harmful C4 fixture, not runtime observation. Wrong-instance, conditional,
opaque, and extra top-level call shapes fail extraction. Independent read-only
review found no defect in this bounded two-shape slice. The focused V4b suite
passes 30/30.

The reader is not a generic CFG, alias, or effect analyzer. C1 still needs the
full reachable leaf/assumption manifest; C2 collaborator effects and public
entry remain open; C3 is only demonstrated for the selected two-shape tail
and pinned wrapper path; C4 still needs the broader hostile controls and
observer invariant; C5 final independent review remains. Full V4b remains
`indeterminate` with `runtime_guarantees_observed: false`.

## Fifteenth implementation checkpoint (2026-10-04)

The selected public-entry reader now extracts a partial source-site inventory
of 16 nodes and 14 named call sites: database builder, runtime construction and
engine pool, worker dispatch, trait forwarding, public service entry,
validation, clock, epoch allocation/finalization, and the selected
`authorize_in_epoch` call. It binds the builder's concrete engine expression,
the worker's `engine.authorize(request)` site, and the public no-op hook.
Negative fixtures change the builder, pool, worker receiver, public hook, or
public call count; each fails closed at the existing whole-body template gate.
They do not independently exercise the new AST edge matcher. The three
targeted tests and the full focused suite (32/32) pass.

This establishes selected syntax and whole-body bindings, not a complete
public call graph: these call-site edges do not form a connected execution
path. Construction-to-pool instance transfer, dynamic pool membership/vtable
dispatch, worker behavior
after an API timeout, callback effects, transaction finalization, and all
collaborator effects remain open. In particular, a kernel DENY, a policy DENY
after a kernel READY, a transaction-finish failure after a call, and an API
timeout are different events. The accepted business meaning does not permit
collapsing those events into a single downstream-call claim. C1/C2 and full
V4b remain `indeterminate`; `runtime_guarantees_observed` is still false.

## Sixteenth slice plan and independent review (2026-10-04)

The C1 slice added a separate selected-builder source-template reader, with
11 matched sites covering the database builder's `engines` vector, the boxed
`SqliteAuthService<SystemDecisionClock>` construction, `from_engines`, mutex
storage, worker `take`, trait-object invocation, and `put`. This addresses
only source shape for runtimes returned by the selected database builder;
public `from_engines` remains open to arbitrary engines.

An independent read-only plan review found the missing state-transfer link and
recommended a fixture grammar that reaches the transfer reader. A compiled
mixed-engine builder fixture now reaches it, changes the template origin set,
and makes the selected-origin *template* property false. Exact production
pins remain fail-closed. Post-edit review found that the 11 entries are matched
call sites with string binding labels, not typed def-use edges or a CFG; the
mixed fixture does not test the kernel-DENY/no-call property. Rust ownership,
trait dispatch, Tokio worker continuation, callback behavior, and
collaborator effects remain explicit assumptions or open obligations, not
runtime observations. The next C1 task is actual AST-backed binding and
branch-condition extraction, followed by dynamic target/effect closure.
The full focused V4b suite passes 34/34; the three affected tests pass again
after the claim-boundary correction.

## Seventeenth implementation checkpoint (2026-10-04)

The pinned `syn` reader now reports local declaration/type/initializer syntax,
struct-field initializers, source scope paths, and for-loop/match-arm context.
The selected-builder certificate checks the typed `engines` declaration, its
push inside the configured loop, the `from_engines` parameter and `EnginePool`
field initializer, the worker's pool clone and take, and the `put(engine)` site
in the `Ok(decision)` arm. These are AST-annotated source correspondences under
closed byte templates, not resolved Rust symbols, a general def-use graph, or
an execution CFG. Its binding labels are constructed by the checker.

A changed worker fixture moves `put(engine)` into the `Err(_)` arm. It passes
offline Rust type checking, reaches the reader, changes the extracted arm
context, and falsifies the normal-return repool *template* property. The
earlier compiled mixed-engine fixture still falsifies only the selected-origin
template property. Neither fixture establishes or refutes kernel-DENY/no-call.
The full focused suite passes 35/35. Independent post-edit audit found no
fail-open mutation in this two-template scope and confirmed these claim limits.

C1 still lacks resolved def-use/capture semantics and a full reachable
leaf/assumption manifest; C2 effect closure and timeout/worker behavior remain
open. Full V4b remains `indeterminate` with
`runtime_guarantees_observed: false`.

## Eighteenth implementation checkpoint (2026-10-04)

The certificate now composes the public-entry and selected-helper parsed-site
inventories into a two-root named-edge worklist. Its roots distinguish
successful database-runtime construction from an **assumed caller invocation**
of the returned runtime; construction alone does not call `authorize`. The
catalog contains 186 public and 281 selected projection rows. Sixty-five
pre-tail source sites appear in both projections, so 467 is a projection-row
count, not a count of distinct source sites. The current worklist marks 255
rows possible under listed assumptions, of which 212 have no selected target;
other rows remain unentered or deferred, never classified as safe leaves.

The reader preserves control context and explicitly labels the Tokio worker,
callback, and dynamic-vtable transitions as assumptions. An independent
review found two fail-open composition inputs: a truncated pre-tail segment
and an omitted public edge. Both now reject before worklist projection, with
negative tests. A synthetic added `yield_now` row tests projection
sensitivity only; it is not a compiled source-derived harmful fixture. The
full focused suite passed 36/36 before the final input tightening, and its
affected targeted test passed after it.

This is not a complete reachable call/leaf manifest: wrapper and service
tail, implicit operations, unselected callees, target resolution, worker
behavior, and effect closure remain open. C1–C5 and full V4b therefore remain
`indeterminate`; `runtime_guarantees_observed` remains false. The next C1
slice must join the remaining public/service tail to the selected graph and
resolve or explicitly retain every reachable external, callback, and dynamic
boundary without converting an absent named edge into a no-call claim.

## Nineteenth implementation checkpoint (2026-10-04)

The C1 rooted worklist now joins source-spelled sites from the already
inventoried service tail (`public/service_in_epoch` ordinals 65–83) through
`authorize_pre_resolved`, `TrustedAuthorizationBoundary::authorize` on the
READY branch, `BorrowedDecision::authorize`, and the selected
`ResolvedDecisionService` adapter. The tail's 19 sites are **not duplicated**
again. Four additional pinned `syn` body inventories add 22 projection rows:
the catalog has 489 rows, including the earlier 65-row pre-tail overlap.
Currently 277 rows are possible under stated assumptions and 230 of those
have no selected target. These are worklist counts, not unique reachable calls
or safe leaves.

The bridge validates the full service tail statement segment, exact tail-call
site, selected wrapper kernel and READY call sites, and source identities.
Assumptions explicitly cover successful continuation through the pre-tail,
constructed wrapper target, READY-branch target, and generic borrowed-adapter
binding. A read-only post-edit review found a forged-inventory input that
could move the supplied wrapper call site from READY to DENY while preserving
the edge labels; the frontier now pins the complete selected AST inventory
projection and a negative DENY-context test rejects the tamper. This is a
composition-input check, not a formal branch or runtime proof. The reviewer
replayed the same forged DENY-context input after the fix; it now fails with
`frontier-input-identity`, and the reviewer found no remaining critical defect
in this bounded candidate path. The focused suite passes 37/37 after the
final pin, including the forged-DENY negative test.

The accepted BusinessMeaning remains broader than this selected adapter path.
No all-path no-call property, complete target/effect closure, timeout-worker
semantics, arbitrary endpoint classification, or runtime guarantee has been
established. C1–C5 and full V4b stay `indeterminate` and
`runtime_guarantees_observed: false`. The next C1 work should resolve the
remaining entered-body unmatched sites and hidden operations, or leave each
as an explicit blocking effect assumption rather than promoting this path to
a certificate pass.

## Twentieth implementation checkpoint (2026-10-04)

C1 now has a bounded dependency bridge for the previously unentered selected
trusted-input and SQLite provider roots, plus the public `|_| {}` hook. The
bridge checks pinned source/Cargo, source-spelled imports and signatures,
forwarding parameters, and the corresponding parsed call sites in both the
public and selected pre-tail projections. Each new edge carries its own
assumption; the callback body has zero explicit parsed calls but its effects
remain open. The expanded 489-row catalog currently has 397 rows possible
under named assumptions, of which 327 have no selected target. These are
worklist counts, not a proof of reachability or absence of hidden calls.

Independent review found that the exported frontier composer could accept a
caller-supplied catalog with a selected provider row deleted while preserving
source hashes, or a public catalog with an unbound site deleted. Production
composition now pins both complete extracted projections and rejects either
deletion. Explicit fixture mode still permits worklist variation for hostile
tests, always returns `indeterminate`, and labels itself non-production.
The reviewer replayed the deleted-row controls after the fix and found no
remaining production-frontier bypass for them. The exported dependency bridge
also now requires the selected provider target-body inventories to be present
and internally ordered, so a standalone bridge call cannot name an absent
target body.
The compiled nonempty-hook fixture establishes that a changed hook is
well-typed and is rejected by the earlier whole-body source-template gate;
it does **not** demonstrate bridge-level compiled-mutant sensitivity. The
focused post-fix checks pass 4/4, including both deleted-row controls.

This remains an incomplete C1 traversal: named imports and a syntactically
empty closure do not close generic transfer, provider effects, implicit
operations, dynamic targets, or the 327 possible unmatched sites. No C3 graph
property or full V4b no-call conclusion is claimed. The next step is to
classify these entered-body open sites and effects, using explicit blocking
assumptions for any path that cannot be closed.

## Twenty-first implementation checkpoint (2026-10-04)

The next C1 slice follows the selected pre-resolved wrapper's READY gate.
Source-pinned, parsed inventories add 50 explicit-call sites across the two
concrete resolver bodies, `construct_candidate`, command/permission conversion,
the Cargo-aliased generated kernel entry, and its four local rules. Ten named
edges link wrapper ordinals 1, 3, 4, 11 and 12 into those bodies, and link the
kernel rule calls internally. The existing wrapper ordinal 13 remains the
READY-arm downstream edge. The resulting catalog has 539 rows, 440 possible
under named assumptions, and 360 possible rows without selected targets.
Every newly entered site's effect remains open; `map` function values,
iterator callbacks, cloning, implicit operations and external behavior are
not promoted to safe leaves.

Independent plan analysis selected this gate because candidate construction
and the kernel's same-row/uniqueness checks are directly relevant to accepted
business meaning. The selected resolver implementations return cloned
pre-resolved lists, but generic wrapper resolvers are not thereby constrained:
the existing `no_call_contract_gap` runtime control exhibits a generic
resolver making a downstream call before kernel DENY. Reviewer inspection
found a compiled-target identity gap: the bridge had pinned the kernel source
and wrapper Cargo alias but not the kernel package's `[lib] path`. The kernel
Cargo manifest is now pinned; a redirected-path input fails its identity
check. This is a manifest-identity negative test, not a compiled
alternate-kernel mutant. A second standalone-bridge review found that an unchecked wrapper
READY call site could be altered in the supplied boundary-chain input while
the bridge still returned its edges. The bridge now pins the complete parsed
boundary-node projection; a changed READY call site fails before edge
construction. These source/graph checks still do not prove equivalence of generated
kernel predicates to the accepted meaning or all-path call/effect closure.

The selected wrapper Rust tests pass 10/10, including cross-row provenance
and duplicate-row cases; the generic no-call-gap control passes 1/1. The
full post-review candidate suite passes 41/41, including the focused bridge
and production-input negative tests. C1–C5 and V4b remain
`indeterminate`, with `runtime_guarantees_observed: false`.

## Twenty-second implementation checkpoint (2026-10-04)

The C1 worklist now projects the 27 existing selected pre-tail named targets
onto their exact duplicate `public/service_in_epoch` sites, after checking all
65 prefix sites for ordinal, syntax and control-context agreement. The three
separate provider/hook bridge targets at ordinals 0, 47 and 53 remain intact;
conflicts fail closed. The catalog remains 539 rows with 440 possible sites,
while possible unmatched sites fall from 360 to 342. Only 18 of the 27 added
targets affect that count; nine sit in closure-deferred sites. This is graph
bookkeeping, not a new no-call proof or effect closure. The focused replay
checks all 65 duplicate pairs, representative helper/join targets, source
context mismatch, and production retarget rejection. Fixture-mode projections
remain untrusted, explicitly `indeterminate`, and may not be cited as
source-derived target evidence.

The independent pre-kernel review found no observed violating call in the
selected source, but identified the next proof-critical paths: the selected
no-op `FnOnce` at pre-tail ordinal 47, iterator callbacks in the pre-tail,
worker dispatch and timeout continuation in the public API, SQL/provider
effects, and implicit Rust operations. The generic wrapper has an existing
DENY-after-downstream-call counterexample and is excluded from the selected
pre-resolved claim. A timed-out API response also cannot be treated as a
kernel DENY or no-call outcome while the spawned worker may continue. These
are open proof obligations, not confirmed defects in the selected production
behavior. The bounded next step should derive source- and type-bound callback
effect evidence and a harmful, well-typed fixture that can fail a graph
property, rather than relying only on source-hash rejection.

## Twenty-third implementation checkpoint (2026-10-04)

A fixture-only hook probe now admits an otherwise pinned service source with
one altered public `FnOnce` body. An offline `cargo check` confirms that a
straight-line call to the actual SQLite provider
`authorize_in_transaction` with the captured transaction is well typed.
The parsed call graph flags that narrow fixture's pre-gate direct-call
property as failed; the selected production public-path extractor still
rejects the mutation. A parsed call under `if false` remains
`indeterminate`, not a counterexample. An aliased endpoint spelling also
remains `indeterminate` in a separate fixture test. The probe detects only
the exact function spelling and a single top-level statement, so aliases or
other effects may escape it. This witness concerns the broader SQLite
authorization endpoint set, not the selected `ResolvedDecisionService`
instance, and compilation is not runtime observation. Production C1/C3 and
the owner-accepted no-downstream-call meaning therefore remain open.

## Twenty-fourth implementation checkpoint (2026-10-04)

The pinned Rust AST reader now records closure nodes and their enclosing call
argument positions, explicit body shape, modifiers, attributes and nested
parsed sites. The selected public `authorize` inventory binds exactly one
unmodified `|_| {}` closure to argument 1 of its sole detailed-method call,
with no explicit body statement or nested parsed site. The dependency bridge
also checks the two source-pinned `FnOnce` clauses, exact by-value forwarding,
and one selected pre-kernel invocation site. Reader unit tests cover direct
argument attribution and nested-closure parent isolation; certificate mutants
reject altered parent, argument, body and closure count. The source and
projection pins were recomputed from current bytes, not from a fixture.

This closes only the explicit syntax question for the selected callback body.
It does not establish compiler-level call-target identity, implicit language
effects, external provider behavior, or all-path invocation. The callback
still has `effects_closed: false`; the C1 frontier and full V4b remain
`indeterminate`, with `runtime_guarantees_observed: false`.

## Twenty-fifth implementation checkpoint (2026-10-04)

The C1 rooted frontier now connects four selected `iter().filter/map(...).collect()`
chains to their AST closure nodes and nested parsed sites. Three are in the
pre-tail prefix and therefore appear in both the public and selected service
catalogs; the fourth is in the public tail. The bridge validates collect,
adapter and iterator receiver syntax, closure parent/argument positions,
all 21 unique nested callback-site ordinals, and the exact three-closure
prefix overlap. The worklist now marks 32 catalog rows as **possible under
listed iterator assumptions** instead of deferring them. The catalog stays
539 rows; possible rows rise 440→472, possible unresolved rows 342→356,
and deferred rows fall by 32 to 61. These counts expose additional
unclosed calls, not improved no-call coverage.

A source-level fixture inserts a direct SQLite authorization call into the
first filter callback; it passes offline Rust type checking, appears in the
parsed closure, and fails the selected callback bridge. Metadata mutants
also reject broken collect receivers, closure parent/nested-site relations,
the tail closure and prefix overlap. None of this proves any callback runs
on every input, resolves Rust method targets, classifies `clone` or helper
effects, or establishes a production downstream-call property. C1 and full
V4b remain `indeterminate`, `runtime_guarantees_observed: false`.

The next candidate call-tree slice may follow `service/adapter#1` into
`SqliteAuthorizationStateSnapshot::authorize` and then
`runtime-adapter::authorize_resolved`, distinguishing a counted downstream
**port invocation** from the conditional native policy-kernel call. This is
not the highest remaining blocker for the accepted DENY/no-downstream rule:
unclosed **pre-kernel** helper and effect paths could still call an endpoint
before the READY gate. The downstream slice cannot move V4b to pass by itself.

## Twenty-sixth implementation checkpoint (2026-10-04)

The selected tail route-map callback now source-binds its five validity-helper
calls (#73–77) to the already cataloged `service/valid_reference` and
`service/valid_permission_component` bodies. The bridge checks each exact AST
call expression, receiver, depth, control context and closure membership; the
rooted frontier rejects missing helper targets and conflicts. Under pinned production
inputs, possible unresolved rows fall 356→351 without changing the 539-site
catalog, 472 possible rows, 61 deferred rows, or 67 entered bodies. Fixture
mutants reject altered expression/depth/context, missing helper body and extra public
edge; they are adversarial checks, not independent production source proof.

The map callback and `&&` validity chain may short-circuit, so each helper
edge is only possible under listed assumptions. The helper bodies' transitive
`valid_identifier` call, its `chars().any(char::is_control)` callback, clone
sites, implicit Rust operations and all callee effects remain open. C1 and
full V4b stay `indeterminate`, `runtime_guarantees_observed: false`. The next
bounded step is to inspect and bind the `valid_identifier` function-value
callback without upgrading a source edge into an all-path or runtime claim.

## Twenty-seventh implementation checkpoint (2026-10-04)

The C1 certificate now separately records the source-spelled
`char::is_control` function value passed as argument 0 to
`service/valid_identifier#2` (`value.chars().any(...)`). It binds the exact
four-site helper AST, parameters, one `&&` expression with its short-circuit
guard, the manifest rows and a pinned production rooted-worklist projection.
The worklist driver must remain one possible, open, unresolved `any` row with
nonempty assumption paths; forged posture and path metadata are rejected.
A source mutation
to `char::is_whitespace` fails the helper-body pin; fixture metadata mutations
of the argument, receiver, guard, `chars` site and control context fail the
new bridge. The latent callback is **not** a parsed explicit call, a named
target edge, or a compiler-resolved `char` method body. Its possible
invocation requires the third conjunct and `Iterator::any` to visit a
character and call the passed function value; effects stay open. The
explicit-site counts therefore remain 539 catalog, 472 possible and 351
possible unresolved, with 61 deferred and 67 entered bodies.

This records a previously implicit C1 boundary, not a runtime proof. Method
resolution, standard-library iterator semantics, other implicit operations,
clone and SQL/provider effects, and all-path pre-kernel no-call remain open.
V4b remains `indeterminate`, `runtime_guarantees_observed: false`. The next
work should enumerate remaining reachable pre-kernel effect boundaries and
separate source-spelled sites from external/implicit obligations before any
endpoint-set or all-path conclusion.

## Twenty-eighth implementation checkpoint (2026-10-04)

The C1 certificate now emits a conservative invocation-root **parsed-site and
three-selected-function-value** effect inventory, not an exhaustive callback
or reachable-effect manifest.
It walks named edges from the selected runtime invocation while withholding
only the source-pinned wrapper READY downstream edge (#13). Crucially, the
kernel call (#12) and all five selected kernel bodies stay in the inventory:
the relevant event is the **result** of that call, not its invocation. A
body-level walk cannot prove temporal order, so non-kernel rows are labeled
`temporal-order-unproven`; the kernel rows are candidates during evaluation,
not certified executions before the result. The DENY arm's lack of a named
downstream edge is recorded separately from its unclosed Drop/unwind effects.

The current projection reaches 62 candidate bodies and partitions 503 parsed
catalog rows, representing 438 physical source sites after coalescing the 65
known public/pre-tail duplicates. It retains 381 unmatched parsed rows (346
physical sites) and open effects on every included row. Three selected latent
function values are listed separately: `char::is_control`,
`to_kernel_authentication_evidence`, and `to_kernel_route_binding`. This is
not an exhaustive closure, implicit-operation, or function-value inventory.
Closure bodies across the wrapper, generated kernel, public worker and SQL
providers—including zero-call predicates—still need their own source-bound
catalog. Rust
`Drop`/`Try`/iterator/comparison behavior, macro expansion, standard-library
and SQLite/provider effects, dynamic dispatch, worker continuation, and
caller continuation remain explicit blocking classes.

An adversarial fixture that points a tail pre-result site at the selected
adapter is flagged as a failed **named-edge** property. Changed kernel target,
READY-arm context, missing kernel site, function-value anchor, fabricated
no-op-hook site, physical-overlap context and effect closure fail the inventory
checks. A forged DENY-arm named downstream edge is surfaced, not silently
reported absent. The production named projection
does not show the selected adapter before the READY edge, but 381 unmatched
sites can hide endpoints or effects; therefore that absence is not a no-call
proof. C1 and V4b remain `indeterminate`, `runtime_guarantees_observed: false`.
The next product-construction work is to catalog reached closure bodies,
including zero-call predicates and SQL/worker callbacks, then resolve the
wrapper's two mapped function-value bodies and remaining external/implicit
boundaries with an explicit endpoint set. Publication, deployment, and
governance admission are deferred operational work, not granted by this slice.

## Twenty-ninth implementation checkpoint (2026-10-04)

The C1 output now includes a separate, source-bound catalog of **71 closure
nodes** within the 62 selected reached bodies. Forty have no nested parsed
call site, so they were invisible to a call-site-only count. Three are the
same physical closures seen through the public `service_in_epoch` and
`service_pre_tail` projections; the catalog records 68 physical closure
nodes. The selected no-op hook is an alias of the public service closure,
not another closure. The reader's exact parent call/argument pairs are pinned
for this selected source, while nested parsed-site containment, source overlap,
and the selected manifest projection are checked; hostile parent, overlap,
missing-body, and production-forgery tests reject
changed inputs. Worker, SQLite, wrapper, and generated-kernel closures,
including zero-call predicates, are represented.

This is a **syntax catalog**, not proof that a closure is invoked or that its
body is effect-free. Every closure remains `invocation_posture: unresolved`
and `effect_status: open`; nested-site ordinals describe containment, not
direct-call or temporal order. The certificate is still `indeterminate` with
`runtime_guarantees_observed: false`. Next C1 work must establish invocation
postures for selected callbacks and mapped function values, then address
implicit, dynamic, SQL, and external effects and the endpoint set. No
publication, deployment, or governance admission follows from this checkpoint.

## Thirtieth implementation checkpoint (2026-10-04)

The next C1 slice source-pins the wrapper's two `.into_iter().map(function
value).collect()` handoffs and matches their spellings to local authentication
and route conversion definitions. The selected wrapper AST is checked against
local-name shadowing, but compiler target resolution remains unproved. Both
bodies are reached **candidates** before the kernel-result event:
the authentication conversion has zero parsed explicit calls, while the route
conversion's `to_kernel_permission` call is now in the rooted graph and
pre-result inventory. The latter cannot be omitted merely because the mapper
was passed as a function value. The new projection has 64 candidate reached
bodies, 504 parsed pre-result rows (439 physical sites), and 381 unresolved
parsed rows (346 physical). The rooted catalog has 540 rows and 51 gate rows.

The 71 closure nodes are partitioned by their source-pinned parent call shape
as 34 error mappers, 9 iterator filters, 8 `query_row`, 8 `query_map`, 7
iterator maps, 2 `any`, and one each worker-scheduling argument,
`AssertUnwindSafe` wrapper argument, and selected service hook. Only the
selected no-op hook and four previously bound service iterator chains (eight
logical rows including source duplicates) receive a **possible under listed
assumptions** posture. All other closure invocation postures remain
unresolved; this does not mean they are unreachable or not invoked. The
frontier's broader overapproximation of nested parsed sites is not proof that
any callback ran. Every mapper and closure effect remains open.

This is still `indeterminate` with `runtime_guarantees_observed: false`.
Unresolved Rust trait/iterator method resolution, dynamic worker scheduling,
SQL callback consumption, implicit operations, external effects, and the full
downstream endpoint set prevent an all-path no-call conclusion. The next C1
frontier is a sound treatment of those remaining invocation/effect classes,
not publication or governance admission.

Independent implementation review found no blocker-level gap in this bounded
slice after adding local-shadow, exact map/collect/iterator-handoff, and
gate-node/site checks. The full certificate suite passed 52/52; the latest
post-review focused mutation suite passed 3/3. A direct certificate replay
still emits `status: indeterminate` and `runtime_guarantees_observed: false`.

## Thirty-first implementation checkpoint (2026-10-04)

The selected rooted call frontier now has a separate bridge for its eight
`query_row` row callbacks. It checks each exact reached closure identity,
parent call and argument 2, and the nested `row.get` site against the parsed
closure body. The catalog reports callback invocation only as possible if
`query_row` executes and produces a row; every callback effect remains open.
Fixture-tagged inputs remain fixture-tagged in the output and cannot be mixed
with pinned-production projections.

A changed `route_revision` callback is parsed through a fixture-only AST path
from the same modified service source. The fixture links the unchanged
pre-gate `route_revision` call to the `query_row` callback and detects a
straight-line native `authorize_in_transaction` call before `row.get`. That
harmful fixture passes offline Rust type checking and fails the bounded
broader-endpoint graph property; it is not a same-adapter counterexample or a
runtime observation. The full certificate suite passed **54/54** before the
review's input-mode hardening; both changed tests passed **2/2** after it.
Independent re-review found no remaining P1/P2 in this bounded bridge. A
direct certificate still reports `indeterminate` and
`runtime_guarantees_observed: false`. The next C1 work is the other callback
classes, compiler target/effect closure, and an explicit downstream endpoint
set. This checkpoint does not close C1–C5 or full V4b.

## Thirty-second implementation checkpoint (2026-10-04)

The next C1 bridge source-binds the eight selected `query_map` row callbacks.
It checks the exact closure IDs, parent method and callback argument 1, and
complete nested parsed-site membership: `Ok(...)` wrapper sites are retained
separately from the 2/6/8/6/1/1/1/3 `row.get` sites. The production bridge
pins the full selected catalog, rooted frontier and pre-result projection;
fixture-tagged projections cannot be mixed into a production result. The
catalog now classifies these callbacks as **possible only under listed
assumptions**: a successful `query_map`, a produced row, iterator advancement,
and no earlier short-circuit. It does not prove those conditions occurred.
Consumer binding is explicitly `unproved` and every callback effect is open.

A fixture changes only the pre-gate `authentication_metadata` helper body and
adds a straight-line native authorization call before its original row decode.
The fixture AST ties the unchanged pre-gate helper call to that callback and
reports a conditional broader-endpoint graph failure. The changed service
passes offline Rust type checking. This is neither a selected-adapter
counterexample nor a production runtime observation. Independent code review
found no P1/P2 in the bounded bridge. The full certificate suite passes
**56/56**. The certificate remains `indeterminate` with
`runtime_guarantees_observed: false`; C1–C5 and full V4b remain open. The next
construction frontier is consumer/iterator-target binding and effect closure,
not treating another syntax count as a no-call proof.

## Thirty-third implementation checkpoint (2026-10-04)

A dedicated `syn` consumer-chain mode now follows actual AST receiver ancestry
from each selected `query_map` to `collect`, retaining every intervening
method and `?` step. It leaves the existing pinned call-inventory projection
unchanged. The production bridge binds all eight exact query-map expressions
to their reached callback parents and unique collect sites: one `ok()?`
chain, two `map_err()?.map(...)` chains, and five `map_err()?` chains. It
reports only a **source-spelled collect receiver** property. In particular,
this does not prove that the query succeeds, a row is produced, the iterator
advances, a callback executes, or any callback/adapter effect is closed.

A fixture inserts `.take(0)` before the service helper's `collect`. The
changed crate passes offline Rust type checking, and the consumer property
fails because the AST chain exposes `take` as an extra adapter. Production
source, reader and complete upstream projections remain pinned; the fixture
has a separate input mode. Independent read-only code review found no P1/P2.
Reader tests pass **6/6** and the full certificate suite passes **57/57**.
The certificate remains `indeterminate` with
`runtime_guarantees_observed: false`. C1–C5 and full V4b remain open. The
next frontier is target/iterator semantics and collaborator/effect closure,
not promotion of this source-shape link to a runtime no-call claim.

## Thirty-fourth implementation checkpoint (2026-10-04)

The selected iterator-consumer bridge now feeds a bounded dependency-semantics
sidecar. It verifies all three relevant Cargo lockfiles, the resolved offline
`rusqlite` 0.40.2 package archive checksum, the exact cached `statement.rs`
and `row.rs` hashes, and the selected Rust compiler version. The pinned
library source defines `Statement::query_map` as returning
`Result<MappedRows<...>>` and `MappedRows::next` as invoking its row mapper
only after a successful produced row. The eight production method targets
are explicitly **inferred, not compiler-resolved**; `target_resolution`,
effect closure, and all-path reachability remain open.

One offline, locked, typed Rust probe exercises empty and multiple rows,
row-mapper error, outer-map error, parameter-binding failure, and `.take(0)`.
These are finite dependency-behavior controls, not production authorization
traces or an all-context proof. Independent review found and reproduced a P2
forged-input gap in the exported sidecar; a complete production consumer-bridge
projection pin and hostile forged-chain test now reject it. Rereview found no
remaining P1/P2 in this slice. The focused probe passes; all three production
crates pass `cargo check --offline --locked`; the full certificate suite on the
repaired files passes **58/58**. The certificate remains `indeterminate` with
`runtime_guarantees_observed: false`; C1–C5 and full V4b remain open.

Read-only next-frontier analysis recommends a request-correlated execution
trace as the next meaningful C1/C3 evidence unit: distinguish kernel DENY,
READY followed by downstream policy DENY, and a produced-row pre-gate
`query_map` callback mutant, while recording calls to both the selected
adapter and broader native authorization endpoints. A finite trace can test
detector sensitivity but cannot prove the accepted all-context no-call rule.
Universal effect closure still requires compiler-resolved CFG/effect analysis
with conservative external/implicit summaries or an authorization-capability
isolation refactor. Endpoint-set interpretation and SQLite/clock trust
boundaries remain open, not silently resolved by this checkpoint.

## Thirty-fifth bounded runtime-control checkpoint (2026-10-04)

The reviewed next step was narrowed from a full copied-crate execution trace to
one executable, offline Rust fixture for the already type-checked pre-gate
`query_map` mutant. A direct call to the private
`authentication_metadata` helper observes that an absent SQL row runs no row
callback, while a produced row completes a call to the broader
`sqlite_provider::authorize_in_transaction` endpoint and records its synthetic
row-derived trace label. The fixture does **not** enter the public service,
observe a v2 kernel result or selected adapter call, or establish a real
request/invocation-correlated trace. Its minimal database makes the native
endpoint return DENY on missing authorization-state tables; the observation is
endpoint invocation and return, not a policy-engine decision. The source
checker reports this instrumented fixture `indeterminate` because its extra
marker lies outside the checker's narrow harmful-pattern grammar. The
unmodified harmful fixture separately remains graph-failing.
The focused runtime control passes, and the full V4b certificate suite passes
**59/59** under the offline toolchain.

The current certificate pins production source/dependency bytes before this
fixture runs, but its temporary Cargo manifest uses live sibling path
dependencies rather than an immutable copied closure. This is finite
detector-sensitivity evidence only. C1–C5 and full V4b remain open, with
`status: indeterminate` and `runtime_guarantees_observed: false`. The next
architecture step is to define the accepted endpoint set and evaluate
capability isolation so pre-gate collaborators cannot hold a decision-capable
authorization entrypoint; a sampled trace alone cannot establish the
all-context no-call policy.

## Current public-root capability checkpoint (2026-10-05)

The owner subsequently selected every native decision-producing Auth entrypoint
reachable from the public request. The current four public roots now use the
READY authority/decision chain rather than this plan's earlier raw service
composition. The root-context MIR census joins the known source-derived
endpoint family to each resolved Cargo graph. All four roots compile 11 local
packages; six known raw SQLite/runtime/legacy decision packages are absent,
and the known downstream decision packages retained are the READY decision
and generated policy. A synthetic added-raw-dependency control fails even if
the source inventory's membership row is stale. This is a checked package
cut, not an exhaustive endpoint discovery, cross-package source-inclusion
check, or proof of callback/Drop behavior.
The follow-on root-context compiler dep-info check now rejects out-of-package
dependencies except three exact SQL migration data files; a synthetic dep-info
control covers an extensionless external source. Macro-use semantics and all selected-package
decision bodies remain unclosed; the SQL allowlist is data classification, not
a proof that no changed source could attempt to use a listed file as code. The
approved SQL files must be regular non-symlinks, and their byte hashes are
checked before and after the root-context builds. This is boundary freshness,
not an immutable-source execution guarantee.
The same-invocation READY path and transitive effects remain open, so V4b and
runtime observation stay `indeterminate` and `false`. The next construction
slice must resolve the remaining selected decision path and its dynamic edges,
not merely count more unresolved MIR terminators.

## Current four-root implementation DAG (2026-10-05 amendment)

The DAG below this amendment describes the superseded public
`SqliteAuthService<SystemDecisionClock>` / `ResolvedDecisionService` composition.
It must not be used as a certificate for the current production roots. Current
API production code and the tenant, prototype, and HTTPS bridges call
`SqliteAdmissionService::with_ready(request, authorize_ready_decision)`;
`with_ready` passes that function pointer to `with_ready_in_transaction`.
The API's `#[cfg(test)]` mock branch is not its production branch.

1. **R1 — Bind each current production root.** Extract the four selected root
   bodies under their actual normal-build cfgs, the concrete service and
   callback argument, and the same request/epoch/transaction identity. Pair
   source with compiler dep-info and selected MIR. Treat an unresolved
   `spawn_blocking` worker, indirect target, macro, Drop, or trait edge as
   `indeterminate`, not as no call. An API timeout does not terminate its worker.
2. **R2 — Close the native endpoint set.** Enumerate every decision-producing
   Auth function body and indirect entry reachable in each selected root,
   including SQLite transaction/snapshot paths and generated policy. The
   existing normal Cargo package cut and compiler-source cut are necessary
   but do not by themselves close this executable call/effect graph.
3. **R3 — Prove same-event dominance.** For each selected invocation, identify
   the result of its own `gate::admit_authorization_command(&context)` call.
   Every native decision entry must be dominated by that result's READY
   successor. DENY must have zero entries. READY can still return
   `ReadyStateFailed` during post-gate state work, so exactly one downstream
   entry is required only on the successful continuation path, regardless of
   whether policy later ALLOWs or DENYs. Preserve worker/epoch identity, not
   merely HTTP response lifetime.
4. **R4 — Hostile controls.** Compile valid pre-gate, DENY-branch, duplicate
   READY, switched-callback, API-worker, cfg, destructor/iterator/macro, and
   alternate-native-body mutants where possible. At least one well-typed
   mutant must pass extraction and fail the graph property; a source-shape or
   hash rejection alone is insufficient. Preserve a READY then policy-DENY
   one-call control.
5. **R5 — Review and claim ceiling.** Independently review selectors, graph
   extraction, endpoint classification, and mutants. Even a passing bounded
   certificate covers only the pinned four-root composition. Do not set
   `runtime_guarantees_observed` from source/MIR checks alone.

The current `auth-v4b-native-trace-successor.mjs` checks source shape and
normal package closure. Its READY-token adjacency check now binds the private
token's exact initializer to the sole immediate `continuation(&ready)` source
site. It also rejects selected signature/attribute-count drift and binds the
actual feature-gated gate and three decision trace calls, rather than
event-name substrings alone. Attribute counts do not establish the meaning of
every attribute, and trace sites are not an effect-closure proof. This is
progress on R3's source boundary, **not** an extracted all-path
graph or a passing R1–R4 certificate. The aggregate V4b result stays
`indeterminate`, with `runtime_guarantees_observed: false`.

The `auth-v4b-ready-cfg-v8.py` successor now compiles the current authority
crate and extracts normal control-flow edges from MIR **terminators**, rather
than treating every basic-block reference as an edge. It binds the gate-result
local to the READY comparison and its two arms, enumerates callback callsites,
and checks that gate DENY cannot reach a callback and that every normal path
to a successful READY outcome has exactly one callback. Its compiled,
well-typed duplicate-callback mutant passes extraction and fails this graph
property, and the current CLI now fails closed if that bounded verdict fails.
The gate enum's derived equality source and manifest are bound to the compile
snapshot, and a separate normal gate-crate MIR build checks that its active
`PartialEq::eq` compares discriminants with no `ne` override. The DENY-bypass
control changes an extracted graph only; it is not a
compiled-source control. This closes a local normal-path authority sublemma only. Unwinding,
implicit effects, SQL and Drop behavior, intercrate target resolution, and
the full native endpoint family remain R1–R4 work; the emitted status remains
`indeterminate` and `runtime_guarantees_observed: false`.
Replay from the checkout root with
`python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-ready-cfg-v8.py`
and
`python3 -m unittest auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/test_auth_v4b_ready_cfg_v8.py`.
An independent read-only review of this v8 slice found and prompted repairs for
the CLI's initially non-failing property verdict and two gate-equality spoof
cases (comment/string and cfg-disabled source). The final bounded re-review
found no remaining P1/P2 in these fixes. That review does not discharge R5's
full four-root endpoint/effect-closure review.

The `auth-v4b-intercrate-graph-v9.py` successor joins the four selected
root-context MIR captures from v7 to the compiled admission issuer, authority
READY callback, selected decision function, and generated-policy callsite. Its
normal-CFG property passes for the current API, tenant, prototype, and HTTPS
roots. A well-typed prototype bridge with a direct generated-policy call before
`with_ready` still has the selected typed handoff; when its standalone compiled
MIR is spliced into the captured component graph, v9 extraction succeeds and
the dominance property fails. This is **graph-unit mutant sensitivity**, not a
replay of v7's full Cargo provenance pipeline under changed source; v6's
predecessor ingress check would also reject that mutant.

Independent review found that policy-call dominance does not prove ALLOW-output
provenance. An early ALLOW in a root or the selected decision function may leave
the checked policy path intact. The v9 output now says
`allow_output_provenance_closed: false`; it does not claim the full owner-accepted
READY/DENY behavior. The compiled graph also has no intercrate call-return
semantics or closed implicit/dynamic/SQL/FFI/unwind effect graph, and the native
endpoint family is open. R1 and R3 have a stronger selected-policy normal-path
sublemma, but R2, full R3, R4, and R5 remain open. The machine result is still
`indeterminate` with `runtime_guarantees_observed: false`. Replay:

```sh
python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-intercrate-graph-v9.py
python3 -m unittest auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/test_auth_v4b_intercrate_graph_v9.py
```

### Next construction DAG: ALLOW-result provenance (analysis candidate)

The owner-accepted command-boundary rule distinguishes READY/DENY from later
policy ALLOW/DENY. The following check is an additional integration safety
obligation, not a replacement for R2's all-native-entrypoint no-call proof.
The context pack for this slice is the accepted BusinessMeaning and owner
endpoint-scope decision; R1–R5 above; v7 root-context MIR binding, v8 authority
CFG, v9 stitched graph; and the selected ready-decision, admission-service,
API, tenant, prototype, and HTTPS source bodies. No historical v1 receipt or
live service state is in the write scope.

1. **V10a — Decision result provenance.** From the *same root-context MIR*
   captured for v9, bind the single generated-policy call's destination and
   the discriminant branch that maps its ALLOW variant to
   `BinaryAuthorizationDecision::Allow`. Enumerate every reachable ALLOW
   constructor/return in the selected ready-decision function. Each must be
   dominated by that policy call and its ALLOW successor, with no intervening
   rebinding that can fabricate the value. Require a reachable DENY mapping too.
2. **V10b — Admission and selected-root projection.** Bind the authority READY
   callback result through `AdmissionOutcome::Ready` and the selected root's
   `with_ready` result. Emit an explicit typed call-return summary at each
   boundary: decision `authorize` result, authority callback destination,
   `Ready` payload, admission `with_ready` return, root `Result::Ok`/`Ready`
   payload, and selected root output. Check every reachable return-place write
   and path-sensitive last definition; reject any unknown transform. Enumerate
   every positive-result constructor/return in the selected API worker, the
   tenant `evaluate::{closure#12}` per-item body, and prototype/HTTPS
   `evaluate` bodies. Require a reachable legitimate positive path to avoid
   vacuity. A positive result must consume the `Ready(Allow)` value of this
   same invocation; DENY and errors cannot become positive. Prototype/HTTPS
   `FromResidual` exits need an explicit error-only classification, not silent
   omission. A mere reachable selected callsite or source-template match is
   insufficient.
3. **V10c — Hostile controls and claim ceiling.** Compile at least one early
   root ALLOW and one early ready-decision ALLOW mutant that retain the normal
   policy path. They must pass typed-handoff extraction but fail the *output
   provenance property*, not merely a source hash. Also test a switched
   policy arm, copied/rebound result, and legitimate READY followed by policy
   DENY. The isolated compiled mutant can be fed directly to the graph
   property only if reported as graph-unit sensitivity; call it full
   root-context replay only if it passes v7's actual capture/provenance path.
   Source/AST templates may bind selectors and fixture anchors, but cannot
   substitute for compiled def-use/branch semantics. If provenance cannot be
   resolved, report `indeterminate` or fail
   closed; never set `runtime_guarantees_observed` from this graph.
4. **V11 — Public response and effect closure.** Separately follow the API
   worker through `spawn_blocking`, timeout/error handling, runtime result,
   HTTP `respond`, the tenant `Iterator::map/collect` and vector/JSON
   projection, and prototype/HTTPS boolean/JSON projections. The per-item
   tenant closure alone does not prove `evaluate` or `main`. Close native endpoint
   and implicit/dynamic/SQL/FFI/Drop/unwind effects under R2–R3 before making
   the full no-call or public-output claim. API timeout does not cancel the
   worker. This is not silently discharged by V10a–V10c.

V10a–V10c are the next bounded implementation unit. Their maximum result is
normal-path provenance for the exact selected compiled result flow; all-path
public-output and all-native-entrypoint claims remain open until V11 and R2–R5.
Independent read-only plan review checked the current compiled API, tenant,
prototype, HTTPS, and decision MIR shapes. It found the missing typed
call-return summaries and the tenant/error-exit distinctions above; these are
incorporated before implementation. No V10 proof or runtime guarantee is
claimed by this reviewed plan.

### V10 implementation checkpoint (2026-10-05)

`auth-v4b-output-provenance-v10.py` now consumes v7's same-root-context MIR
and v9's selected callsite graph. It binds the generated policy result to the
ready-decision ALLOW/DENY return, the authority callback result to
`AdmissionOutcome::Ready`, the admission issuer result to `Result::Ok`, and
each selected root's positive result. The API check ends at its production
worker closure; the tenant check ends at its per-item `evaluate` closure;
prototype and HTTPS end at `evaluate`'s `Result<bool, _>`. Every selected
return-place write is classified, the legitimate positive path is reachable,
the checked selected-root error/non-Ready and policy-DENY arms cannot reach
their positive site, and tracked result locals reject address
escapes and nested-place/discriminant writes. The checked source enum
declarations/layouts and their hashes are recorded. All four current
root-context checks pass, but
the machine status stays `indeterminate`, with
`allow_output_provenance_closed: false`, `endpoint_set_closed: false`, and
`runtime_guarantees_observed: false`.

The eight-test suite passes. Compiled, well-typed early decision ALLOW, early
prototype ALLOW, switched policy arms, and policy-result pointer overwrite
mutants retain the selected typed call/policy site but fail the V10 property.
A compiled prototype bool-pointer mutant also fails closed because rustc
changes the positive-source MIR shape; a separately labeled MIR-parser control
checks the address-escape diagnostic directly. The existing native
READY-then-policy-DENY one-call test passes. Independent code review found and
prompted the alias/nested-place repair, then found no remaining obvious P1/P2
for this bounded normal-MIR result-flow claim. Replay:

```sh
python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-output-provenance-v10.py
python3 -m unittest auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/test_auth_v4b_output_provenance_v10.py
tools/toolchain/run cargo test --offline --locked --manifest-path auth-foundation/implementation/authorization-ready-decision/Cargo.toml --test decision admitted_command_with_no_active_grant_is_policy_deny_once
```

V10 proves neither that the policy input context was sourced from the same
READY command/state nor that API/bridge public output preserves the selected
root result. It does not resolve runtime callback/trait/SQL/FFI/Drop/unwind
effects, the open native endpoint family, or the full no-call rule. Those
remain the V11/R2–R5 frontier rather than implied consequences of this pass.

### V11a construction DAG: two bridge output-literal projections

This is the first bounded V11 unit, not all of V11. Its context pack is the
accepted BusinessMeaning and owner all-native-entrypoint decision, V10's
selected `evaluate` result provenance, v7's same-root-context MIR and
compiler-source binding, and the current prototype/HTTPS `main` bodies. The
write scope is one V11a checker, its hostile controls, and this plan record.
No live Auth data or service, historical record, publication, or deployment is
in scope. The gate is the existing owner authorization for local Auth repairs.

1. Select each bridge's `main() -> ()` from its own v7 root-context MIR, after
   the V10 checks pass. Derive, rather than hard-code, the `evaluate()` result,
   `Result<bool>::unwrap_or(..., false)` result, boolean switch, and selected
   string local. Require one reachable `evaluate` call dominating the normal
   projection and classify every selected string assignment and `_print` site
   in `main`. Other stdout/FFI/effect mechanisms remain open.
2. Require the zero bool arm to select exactly the DENY JSON literal and the
   positive arm to select exactly the ALLOW literal. Verify the only allowed
   selected-string reference flows through the checked formatter chain to the
   sole `_print` site; unknown or additional selected-string writes, address
   uses, format paths, or `_print` sites fail closed. Treat `Result::unwrap_or`, Rust
   formatting, and `_print` as explicit standard-library summaries, not as
   proven byte-level stdout semantics.
3. Compile well-typed `unwrap_or(true)`, inverted-literal, and early-ALLOW
   mutants outside the implementation tree. Keep the legitimate `evaluate`
   call, then require a *property* failure on their emitted MIR. Label direct
   compiled-MIR tests separately from full v7 root-context replay.
4. Emit a bounded pass only for normal-MIR provenance to the selected print
   argument/literal in those two bridges. Retain aggregate `indeterminate`,
   `endpoint_set_closed: false`, and `runtime_guarantees_observed: false`.
   API worker/timeout/HTTP, tenant collect/JSON, intercrate call-return,
   native endpoint/effect closure, alternate stdout mechanisms, and runtime
   behavior remain V11/R2–R5 work.

An independent read-only review checked the current compiled prototype and
both bridge source shapes and required derived MIR locals, the legitimate
shared string reference, explicit formatter tracing or a lower claim ceiling,
single-site output classification, and isolated mutant fixtures. The reviewed
unit is implementable with those corrections; no V11a result is claimed by
this plan alone.

### V11a implementation checkpoint (2026-10-05)

`auth-v4b-bridge-projection-v11a.py` composes V10 with each bridge's own v7
root-context MIR. It derives the `main` evaluate result, default-false
projection, bool branch, exact ALLOW/DENY literals, checked shared-reference
formatter chain, pinned format template, and sole selected `_print` site.
The prototype and HTTPS checks pass; the other two roots still run V10 only.
The four-test suite passes, including compiled default-true, inverted-literal,
and early-ALLOW-print mutants that retain the original `evaluate` body and
fail the V11a property. The early-ALLOW test asserts the specific alternate
print-path diagnostic. The suite's current-root capture checks `main`; the
separate full V11a CLI replay verifies predecessor composition and the
machine envelope. An independent code review found no clear P1 false pass
for this narrow property and prompted the exact-diagnostic test and narrower
output-site wording above. Replay:

```sh
python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-bridge-projection-v11a.py
python3 -m unittest auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/test_auth_v4b_bridge_projection_v11a.py
```

This is selected print-argument/literal provenance under explicit standard
library summaries, not byte-level stdout behavior or proof that no other
output mechanism exists. The aggregate remains `indeterminate`, with
`allow_output_provenance_closed: false`, `endpoint_set_closed: false`, and
`runtime_guarantees_observed: false`. V11b should trace the tenant
map/collect/index-order/JSON projection; V11c should separately analyze API
worker lifetime, timeout/error, HTTP response, and output projection. R2–R5
still own the all-native-entrypoint and all-path effect/dominance proof.

### V11b construction DAG: tenant vector and selected JSON print projection

The bounded context pack is the owner-accepted Auth meaning and all-native
entrypoint scope, v7 same-root-context MIR, V10's per-item closure result,
V11a's selected print-chain pattern, the currently modified tenant bridge
source, and the existing tenant runtime witness. The tenant source is existing
dirty work and is not in this unit's write scope. Only a new checker, hostile
controls, and this plan record may change. No live state, publication, or
deployment is authorized. Existing owner authorization covers this local Auth
repair; it grants no full claim from a passing bounded check.

1. In tenant `evaluate`, bind the normal MIR `r.permissions` slice iterator,
   `enumerate`, `map` with the exact V10-checked per-item closure, `collect`
   into `Vec<bool>`, and its `Result::Ok` return. Derive locals from typed
   call sites, not MIR numbers. Verify no alternate collection or collected
   result write and classify every `evaluate` return-place write. Bind every
   early `Ok(Vec<bool>)` to the local deny helper, whose checked vector is
   `vec![false; r.permissions.len()]`; classify error residuals separately.
2. In tenant `main`, bind one `evaluate` result through
   `unwrap_or_default`, `to_value<&Vec<bool>>`, `Value::unwrap`, insertion
   under exactly `"decisions"`, `Object`, and the selected formatter argument
   to the sole `_print` call. Reject alternate selected-path values, keys,
   `_print` sites, and normal returns. Treat standard Iterator, Result,
   serde_json, formatting, and print semantics as explicit assumptions. MIR
   alone does not prove per-item invocation/order or JSON/stdout bytes.
3. Compile well-typed hostile controls outside the implementation tree:
   reverse the iterator sequence, make the early-deny vector true, make
   error-default true, change the JSON key, and add an early print path.
   Retain the selected V10 per-item call and require intended property
   diagnostics. Pair the source/MIR result with the existing runtime
   `[true,false]` ordered tenant witness, without treating one witness as
   an all-context proof.
4. Emit only bounded normal-MIR selected-vector/print-argument provenance.
   Keep aggregate `indeterminate`, public-byte semantics and endpoint set
   open, and `runtime_guarantees_observed: false`. V11c API projection,
   R2–R5 native endpoint/effect/dominance closure, and broader Auth repairs
   remain live product-construction work.

Independent read-only analysis reviewed the current tenant MIR and plan. It
identified seven early `Ok(Vec<bool>)` returns in addition to the collected
one, the deny helper's false-vector construction, and the opaque standard
Iterator/serde calls. These became explicit checks and claim limits before
implementation; this plan alone claims no V11b result.

V11b implementation checkpoint (2026-10-06): the separate tenant checker
`auth-v4b-tenant-projection-v11b.py` binds the selected map/collect path to
the exact V10-checked per-item closure, classifies the seven early false-vector
returns, and follows the selected result into the `decisions` JSON print
argument. It rejects deny-length rebinding and normal completion before the
selected print. The compiled hostile-control suite passes 14/14; the existing
native bridge trace suite passes 3/3. A fresh four-root CLI replay reports
`bounded_tenant_selected_projection: pass`, aggregate `indeterminate`, and
`runtime_guarantees_observed: false`. Independent read-only re-review found no
remaining P1/P2 gap within that bounded normal-MIR claim. This does not close
standard Iterator/serde/formatting/stdout semantics, public output bytes, the
all-native-entrypoint endpoint set, or all-path downstream-call dominance.
V11c and R2–R5 remain required before any full Auth runtime claim.

### V11c construction DAG: production API worker to HTTP projection

Task scope: the non-test `authorization-api` root built with V7's resolved
Cargo graph, plus a separate V11c checker, compiled hostile controls, this
checkpoint, and one narrow test-only timeout-lifetime witness in
`authorization-api/src/http_api_tests.rs`. The production API source is
currently dirty user work and remains read-only for this unit; preserve
existing HTTP tests when adding the witness. The context pack binds the accepted
command-boundary meaning and all-native-entrypoint scope, V7/V10's exact
root-context worker return, the API runtime/handler/response source, and the
current HTTP test evidence. It does not import a separate `domainspec-core`
runtime. Owner authorization covers local construction, not deployment or a
full security claim.

1. Derive the production worker from V10's exact `with_ready` function identity
   and follow its `Ready(decision)` value through `catch_unwind`, pool return,
   and worker `Result`. Reject any independent `Allow` result or alternate
   direct syntactic decision-producing call in those selected production API
   bodies. This does not close the owner-scoped native endpoint family,
   dynamic dispatch, callback, SQL, Drop, or unwind effects. Classify
   panic/pool failures separately; do not interpret an error as a policy DENY.
2. Bind the worker result to the `spawn_blocking` handle and evaluation
   `timeout` state machine. On a normal successful await, prove that the
   returned decision is the V10-checked worker value. Classify acquisition
   saturation, timeout, worker failure, and panic so none can yield an
   `Ok(Allow)` through this projection. Treat Tokio scheduling, join,
   cancellation, and Rust unwind behavior as explicit external assumptions.
   Critically, the timeout projects `Err(TimedOut)` to HTTP 504 while the
   blocking worker may keep running; neither timeout nor response completion
   proves no downstream call, worker cancellation, or a completed decision.
3. Bind the HTTP handler's exact successful runtime result to `respond(200,
   decision)`. Bind each malformed-body/content-type/runtime-error branch to
   its declared `deny(status)` path, and bind `not_found` and
   `method_not_allowed` separately. In `respond`, prove the binary decision's
   `Allow`/`Deny` mapping to the exact `ALLOW`/`DENY` strings and the selected
   JSON response argument, status, and `no-store` header. Reject normal
   alternate response construction or an early `ALLOW` path. Serde, Axum,
   body encoding, and actual network bytes remain trusted summaries unless
   separately observed. The async handler is a `Poll<Response>` state
   machine: classify only `Poll::Ready(Response)` as a completed HTTP result,
   not an intermediate `Poll::Pending` suspension.
   Bind the public `authorization_router` registration to the exact
   `AUTHORIZE_PATH`/`post(authorize)` handler, declared fallbacks and
   `with_state`; reject an alternate handler or response-transforming layer.
   Without this, the claim must be limited to the private handler.
4. Compile well-typed source mutants in temporary, non-test API-root builds:
   independent worker `Allow`; timeout/error mapped to `Allow`; handler
   malformed input mapped to `Allow`; swapped response literals; changed
   status or missing cache header; and a reachable alternate response path.
   Require V10 to keep passing where the mutant targets only the later
   projection, and require V11c's precise property diagnostic. Pair this with
   existing finite HTTP witnesses, explicitly labeled `#[cfg(test)]` dynamic
   engine shape rather than production proof, and add any missing
   timeout/worker-lifetime observation without changing the live service.
   The existing timeout test's later readiness check does not prove the
   worker was still active after the 504. A deterministic test-only gated
   engine should signal entry, block past the 504, and finish only after
   release; label it a lifetime witness, not normal-MIR or production proof.
5. Independently re-review the plan and implementation for same-worker
   identity, exhaustive worker and final `Poll::Ready` return classification,
   alias/mutation paths, async state-machine
   coverage, and actual compiled mutant sensitivity. Emit only the bounded
   API projection established by those checks. Keep overall `indeterminate`,
   the full endpoint set and all-path READY dominance open, and
   `runtime_guarantees_observed: false`. R2–R5 remain required.

Plan-review corrections: the checker must use exact normal-use guards for the
captured request, worker handle/result, HTTP result/response, and response
object/header borrow; a unique happy path is insufficient. Optional `trace`
feature builds are outside the default-feature V7 claim. Hostile controls
must include an alternate public route handler and post-response mutation.

The current product frontier is V11c's selected API projection. Runnable
product work is the checker and isolated controls above. Operational tasks
(deployment, live traffic, monitoring, retention, rollback, publication) have
separate owners and no causal role in compiling this local candidate; they
remain deferred operational residue, not silently satisfied prerequisites.

V11c partial implementation checkpoint (2026-10-06):
`auth-v4b-api-projection-v11c.py` now binds the default-feature production
root's public `authorization_router` to `/v1/authorize`, `post(authorize)`,
the declared fallbacks and supplied runtime state; checks the `deny` helper's
selected binary DENY; and traces `respond`'s binary variant through the exact
ALLOW/DENY literal, selected status/JSON argument, `no-store` insertion, and
normal response return. Exclusive-use checks cover the router base and state,
response discriminant, status, selected payload, header borrow, and response
object. Seven current/compiled hostile controls plus two MIR-parser controls
pass (9/9); the existing test-only API HTTP suite passes 9/9. A fresh
four-root replay reports `bounded_api_router_response_subprojection: pass`,
aggregate `indeterminate`, `api_worker_http_composition_closed: false`, and
`runtime_guarantees_observed: false`. Independent read-only code review found
and prompted the router-base and response-discriminant guards. This is not
V11c completion: the exact worker return, Tokio timeout/join, runtime poll,
handler poll, fallbacks' outputs, and deterministic post-504 worker-lifetime
witness remain to be implemented and independently reviewed. R2–R5 remain
open beyond V11c.

V11c worker and timeout-lifetime checkpoint (2026-10-06): the selected
production worker is now linked to V10's exact checked inner closure, the
engine taken from the same pool, `catch_unwind`'s success decision, successful
pool return, and the worker's `Ok(decision)` result. Its take/put `Try`
discriminants and success/failure arms, intermediate values, and normal result
uses are guarded against rebinds or alternate uses. An independent review
found two real checker false passes (rebound take and put results), which are
now rejected by parser controls. The expanded V11c checker suite passes
16/16, including three compiled worker mutants and four pool-branch parser
controls. The API HTTP suite passes 10/10; its new test-only gated-engine
witness observes HTTP 504 while the blocking worker remains in flight, then
releases it and verifies the pool becomes ready. These are bounded normal-MIR
and `#[cfg(test)]` findings. They do not prove worker cancellation, every
native entrypoint's no-call property, or a production HTTP result. Runtime
`spawn_blocking`/timeout/join and handler `Poll::Ready` composition, all-path
effects, and R2–R5 remain open.

V11c runtime-poll checkpoint (2026-10-06): a separate normal-MIR sublemma now
binds the selected production worker closure to `spawn_blocking`, its join
handle to the evaluation timeout future and polled coroutine state, and only
the triple-success timeout/join/worker result to the completed
`Poll::Ready(Ok(decision))`. Acquisition saturation, timeout, and worker/join
failure remain separate error results; `Poll::Pending` is not a completed
decision. The checker also binds the worker's pool capture and timeout
duration to the selected runtime state. Independent read-only review found
false passes for coroutine-state dispatch, stored future replacement, nested
discriminants, error aliasing, coroutine pointer/input-state rebinding, and
pool capture; added guards and parser controls reject those cases. The final
V11c suite passes 29/29, the test-only HTTP suite passes 10/10, and a fresh
four-root replay reports all three bounded router/response, worker, and
runtime-poll subprojections `pass` while aggregate status remains
`indeterminate`, `api_worker_http_composition_closed: false`, and
`runtime_guarantees_observed: false`. One compiled decision-replacement mutant
is rejected at the fixed-MIR-layout identity check after compiler local
renumbering; a separate parser control tests the result-specific guard. No
claim is made about Tokio execution/cancellation, unwind effects, public HTTP
bytes, all native decision entrypoints, or all-path READY/no-call dominance.
The next V11c unit is handler `Poll::Ready` and fallback composition; R2–R5
remain beyond V11c.

V11c handler and fallback checkpoint (2026-10-06): the default-feature
production normal-MIR checker now binds the selected handler's content-type
and 1024-byte body guards, body/JSON failure branches, parsed-request field
conversion, single selected runtime call, runtime success/error mapping, and
every completed `Poll::Ready(Response)` source. It separately binds both
fallback responses and the compiled content-type helper chain. Exact normal
use guards cover the handler's poll inputs, extracted runtime state, request
slot, intermediate body/header/results, and final response; request-conversion
input/fields and content-type closure inputs are guarded too. Independent
read-only review found false passes for several aliases, switched branches,
and the extracted-state, request-input, and handler-poll-input rebinding;
each reported counterexample now rejects. The compiled/parser V11c suite
passed 50/50, followed by 2/2 additional poll-input controls, and a fresh
four-root replay reports all seven bounded API subprojections `pass`. The
aggregate remains `indeterminate`, `api_worker_http_composition_closed:
false`, `endpoint_set_closed: false`, and `runtime_guarantees_observed: false`.
Standard-library, Tokio, Axum, serde, network-byte, unwind, and all-native-
entrypoint effects are not discharged by this normal-MIR evidence. The next
V11c step is end-to-end composition review of the selected worker/runtime/
handler/router chain and its trusted summaries; R2–R5 and the accepted
all-entrypoint no-call guarantee remain open.

V11c syntactic-composition checkpoint (2026-10-06): the checker now binds the
second public builder's `Result::map(authorization_router)` target, the
handler and runtime async constructors' exact input captures, the selected
worker's request field, and the normal return places across the router,
worker, handler, response, conversion, and fallback chain. A machine-readable
join confirms those checked function identities in the same API-root MIR.
One well-typed compiled wrapper-bypass mutant and parser controls for the
reviewer's constructor, router-intermediate, worker-request, return-place,
and fallback-constructor counterexamples reject. The 63-test V11c suite
passed, followed by a separate passing parser control for both fallback
constructors added after that suite began. Independent read-only re-review
confirmed all reported counterexamples reject. A fresh four-root replay
reports `bounded_api_constructor_wrapper_subprojection: pass` and
`bounded_api_syntactic_composition_subprojection: pass` while aggregate status
remains `indeterminate`, `api_worker_http_composition_closed: false`,
`api_database_runtime_builder_closed: false`, `endpoint_set_closed: false`,
and `runtime_guarantees_observed: false`. The join is syntactic normal-MIR
evidence under explicit Rust call/async lowering, standard-library
`Into`/`From`/`Result::map`, and Axum dispatch assumptions. It does not prove
Tokio scheduling or cancellation, unwind/Drop behavior, database runtime
builder semantics, actual HTTP bytes, or the accepted all-native-entrypoint
no-call property. The next product-construction frontier is R2 executable
endpoint/effect closure, then R3 same-event READY dominance and R4/R5 hostile
controls/review; no deployment or publication is implied.

R2 compiled-effect-frontier checkpoint (2026-10-06):
`auth-v4b-compiled-effect-frontier-v12.py` consumes the same four isolated
v7 root-context MIR maps and artifact identities, inventories every effect
site recognized by the v6 MIR grammar with exact-capture
manifest/function/block/line coordinates, and reports unique textual
local-name candidates without claiming compiler target resolution. It
cross-checks the site count and digest against v6, leaves duplicate/ambiguous
names unresolved, and retains unwind, callback,
dynamic dispatch, Drop, panic, SQL, FFI, unparsed-call, and external targets
as explicit frontier entries. Eight focused parser controls passed, including
same-displayed-signature ambiguity, a reified function pointer, cross-package
bare-name mismatch, and a divergent-call form. Independent review exposed the
invalid cross-package name resolution, which was downgraded to an unverified
textual candidate; it also found a compiler-real divergent `-> unwind` call
form, which now fails closed rather than disappearing from the inventory.
Fresh four-root replay of the corrected checker succeeded:
API 449 functions/1,914 sites/59 unique textual candidates; tenant
478/2,464/54; prototype 422/1,967/50; HTTPS 422/1,967/50. Every compiled
site retains a blocking
effect/target frontier entry in this conservative analysis. This is an
inspectable compiled-effect inventory, not the R2 reachable endpoint closure:
it does not yet derive a whole-program call graph, resolve external or
indirect behavior, or prove absence of unrecognized MIR effect forms. The
candidate output explicitly leaves `endpoint_set_closed: false`,
`all_path_ready_dominance: false`, and `runtime_guarantees_observed: false`.
It also records unresolved endpoint roles for the pre-READY API runtime
`authorize` method and the public HTTP `authorize` ingress (and the two
admission carriers). The owner-approved every-native-decision-entrypoint
meaning forbids silently treating these as non-downstream. Next R2 work must
resolve their roles, traverse the compiled graph from exact public entries,
and close or explicitly fail on every reachable decision/effect path; more
counts alone cannot discharge R2.
Independent read-only re-review found no further concrete false pass within
this narrow v12 claim after the two corrections. The v6 digest comparison is
a same-grammar consistency check, not independent completeness evidence.

## Historical implementation DAG (superseded for current production roots)

1. **C1 — Extract the selected call edges.** Build a separate closed reader
   for the exact public database builder/clock, service entry and preparation,
   fixed pre-resolved composition, wrapper branch, and downstream adapter.
   The database builder binds the concrete engine/clock type; the execution
   root is that instance's public
   `SqliteAuthService<SystemDecisionClock>::authorize`; its selected
   endpoint is the `ResolvedDecisionService` trait implementation reached
   through the *same borrowed receiver* in `BorrowedDecision`. Enumerate
   service helper callees (`valid_inbound_request`, epoch/transaction methods,
   `command_matches_snapshot`, `authorization_state_joins_hold`, and the
   snapshot/command helpers), provider calls, and the selected clock body.
   Bind complete module and Cargo bytes, but do not mistake hashes for
   extraction. Reject extra executable statements, unknown calls, changed
   argument/receiver flow, aliases, callbacks, and missing files rather than
   treating them as absent edges. State explicit trust assumptions for Rust
   standard-library/SQLite internals and any dynamic dispatch; an unclosed
   reachable call yields `indeterminate`, not a passing graph. The
   implementation must publish a finite, machine-checked leaf/assumption
   manifest; “all collaborators” is not itself a check. Do not infer
   effects from function names alone.
2. **C2 — Verify collaborator closure.** Enumerate all pre-boundary reachable
   collaborators and classify state reads separately from authorization
   decision calls. Verify the selected no-op public hook and concrete clock;
   retain the generic resolver and arbitrary-clock counterexamples as explicit
   exclusions from this certificate, not from the accepted meaning. If a
   collaborator is opaque, record `indeterminate` and stop the certificate.
3. **C3 — Check graph property.** Define the kernel event as the exact result
   of `admit_authorization_command(&context)` in this invocation. Require
   every path to the identified adapter endpoint to be dominated by the
   **READY successor of that same event**; its DENY successor has zero
   endpoint invocations, and normal READY has exactly one (even when the
   downstream policy result is DENY). Preserve source/graph fingerprints,
   receiver identity, and an explicit endpoint-set field. A Lean replay may prove this small
   graph property, but must consume the extracted graph rather than a manually
   asserted path.
4. **C4 — Hostile controls and replay.** Mutate source fixtures to insert a
   same-instance call after adapter construction but before kernel dispatch,
   within `authorize_pre_resolved`; move forwarding
   into the DENY branch or duplicate it in READY; change the public no-op
   hook or concrete clock. Include a separate pre-construction call to another
   authorization endpoint as a **broader-endpoint-set** control, not as a
   same-instance counterexample. Fixture mode must permit changed selected
   bodies while keeping fixed signatures/module skeleton, so production SHA
   rejection alone cannot pass the controls. Each mutant needs a compiled
   valid harmful case or an explicit syntax-closure rejection, a changed
   extracted IR/graph or expected failure reason, and a failing property
   where applicable. At least one well-typed changed fixture must be admitted
   by extraction and **fail the C3 graph property**, proving sensitivity
   beyond syntax and SHA rejection. A resolver body mutation that cannot
   access the same adapter under its fixed signature is a syntax/structure
   control, not a manufactured alias counterexample. Check adapter-counter semantics separately as a
   source-to-observer invariant; treat Cargo mutation as provenance only.
   Retain READY→policy-DENY one-call and generic resolver counterexample
   tests. Run the exact current v2 technical verifier after changes to its
   bound sources.
5. **C5 — Independent review and evidence sync.** Review source-extraction
   completeness, semantic endpoint classification, mutant quality, and the
   claim ceiling. Record reviewer, checked selectors, findings, and disposition
   in a separate review artifact; do not treat reviewer sign-off itself as
   proof. Update the V4b DAG only with the proved bounded result.

## Historical gate and done criteria (not a current-root acceptance gate)

- C1–C4 are native candidate construction under the previously confirmed Auth
  repair scope; no admission, publication, deployment, or historical rewrite.
- If exact collaborator or alias closure cannot be determined, emit an
  explicit failed/indeterminate certificate; do not replace it with a regex
  count, source hash alone, or sampled test result.
- A passing certificate requires an exact source-derived graph, all listed
  hostile controls, a kernel-DENY/READY distinction, and independent review.
  Its machine output must include `status` (`pass`, `fail`, or `indeterminate`),
  root/endpoint/receiver identities, kernel-event identity, selected source
  digests, extracted graph digest, assumptions, per-mutant results, and an
  explicit claim ceiling. Publish one exact replay command in its README.
- The maximum candidate conclusion is: “For this pinned concrete composition,
  in normal executions that reach the v2 kernel, a DENY result entails zero
  invocations of the identified `ResolvedDecisionService` adapter instance
  during that invocation.” No result about arbitrary clocks, generic
  resolvers, other authorization endpoints, or API DENY follows.
- **V4b still remains open** until the accepted downstream endpoint set and
  full normal-context/list interpretation are fixed and every relevant path
  is covered. The selected adapter's zero-call property is not synonymous
  with the full owner-accepted no-call policy.

## Open Questions

- The owner has selected **every native decision-producing Auth entrypoint**
  reachable from the selected public request, not just this plan's adapter.
  The source-derived known raw SQLite/runtime/legacy decision packages are
  currently outside the four selected public Cargo roots; the root-context
  MIR census now rejects their entry into those resolved local graphs. The
  exact endpoint family and dynamic/effect reachability are still open, so
  this package exclusion cannot establish the full no-call rule.
- Can the current Rust source be checked with a sufficiently closed extractor
  without building a broader effect/call-graph checker? If not, R1 stops and
  the implementation route returns a precise capability gap.
- What artifact will carry the eventual full V4b proof into the current v4
  FormalClaim review without transferring historical proof identities?
