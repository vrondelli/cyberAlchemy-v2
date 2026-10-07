# Auth V4b capability isolation — candidate implementation DAG

Status: design candidate under the owner-selected broad endpoint scope. No
production API change is admitted by this plan; no V4b or runtime guarantee is
claimed.

## Objective and evidence

Make the accepted command-boundary rule enforceable for the selected public
Auth request: a normally evaluated context that does not yield READY must make
zero calls to **every** reachable downstream authorization-policy decision
entrypoint. The command-boundary admission evaluator is excluded because it
must run to produce READY or DENY. READY may enter a downstream authorization
chain and may receive policy DENY; the accepted BusinessMeaning imposes no
exactly-once count on READY. Preserve same-row candidate provenance and
duplicate-row semantics.

Controlling sources:

- [Owner-selected endpoint scope](../../../auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md)
  and [accepted meaning](../../../auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json).
- `auth-foundation/implementation/authorization-service/src/lib.rs`:
  `authorize_in_epoch` and `ResolvedDecisionService::authorize`.
- `auth-foundation/implementation/authorization-metadata-reader/src/lib.rs`:
  transaction-scoped pre-admission metadata reads.
- `auth-foundation/implementation/authorization-state-model/src/lib.rs`
  and `authorization-state-reader/src/lib.rs`: kernel-free shared state
  and transaction-scoped authorization-state reads.
- `auth-foundation/implementation/trusted-boundary-v2/src/lib.rs`:
  `TrustedAuthorizationBoundary::authorize` and its READY branch.
- `auth-foundation/implementation/sqlite-provider/src/lib.rs`:
  `SqliteAuthorizationService::authorize`, `authorize_in_transaction`,
  `SqliteAuthorizationStateSnapshot::authorize`.
- `auth-foundation/implementation/runtime-adapter/src/lib.rs`:
  `AuthorizationAdapter::authorize` and `authorize_resolved`.
- [V4b certificate plan](AUTH-V4B-CONCRETE-CALL-CERTIFICATE-PLAN.v1-candidate.md),
  whose current source-derived result remains `indeterminate`.

The historical produced-row `query_map` fixture demonstrated the concrete
bypass class: pre-gate code could enter the public SQLite transaction
authorization function without incrementing the selected service-adapter
counter. Current reader-crate compile-fail controls test that particular
import boundary; they are finite sensitivity evidence, not an all-path trace.

## Architecture choice to review

Use **both** an opaque READY-bound command and a dependency boundary. The
READY-bound value owns the exact candidate command and is constructed only by
an acyclic admission/capability component after its kernel returns READY. It is not `Clone`
or `Copy`; consumers cannot substitute a different command. Every native
decision entrypoint in the selected public composition is entered only through
that value (or a borrow tied to it); legacy raw entrypoints must be separated
from the selected call/dependency graph. A pre-gate preparation crate has only
read-only input/state dependencies and no dependency on a decision-capable
entrypoint or capability issuer. The small top-level orchestrator passes the
prepared context to v2 admission and forwards the returned value to one
decision path.

Neither half is sufficient alone. A token only on the selected adapter leaves
public SQLite/runtime bypasses. A helper-crate split alone leaves the
top-level service and any exposed decision APIs callable before READY. Even
both halves require an exact source-derived check of the orchestrator and
invocation identity: a caller must not mint a separate READY value from a
fabricated context during a request whose actual context is DENY. Public
constructors, alternative raw-command overloads, trait forwarding, dynamic
dispatch, FFI, and unsafe code remain explicit fail-closed review surfaces.
The generic `DecisionClock` in the public service and resolver traits in the
v2 wrapper are also pre-gate arbitrary-code surfaces. The selected concrete
composition must seal them or prove their implementations cannot enter any
downstream authorization-policy endpoint; a read-only preparation crate does
not by itself close those callbacks.

## Dependency DAG

1. **A — Inventory the baseline surface.** From the selected public Auth
   builder and `authorize` root, enumerate every reachable native decision
   function/trait target and every call site, including generated
   authorization-policy kernel but excluding the admission evaluator,
   legacy boundary as a call-path/dispatch surface (not itself a counted
   downstream policy endpoint), generic adapter, SQLite service/transaction/snapshot,
   resolved engine, dynamic calls, callbacks, hooks, macros, and external
   effects. Publish an exact source/dependency manifest and classify read-only
   state resolution separately. This baseline may have unknown edges; mark
   them `indeterminate`, then close and freeze the inventory after migration.
   Include the selected clock and resolver trait implementations; no regex
   name search is accepted as closure.
2. **B — Split read-only preparation from decision capability.** Move
   transaction-scoped trusted-input and authorization-state *reads* into a
   preparation component whose complete callable dependency closure exposes no
   decision-producing API. Where the current SQLite/runtime crates mix types,
   readers, and decision functions, split shared data types and read-only
   snapshots from native decision execution. Keep the same epoch and snapshot
   consistency checks. Prove the dependency graph has no pre-gate decision
   edge; do not merely move helper text within the existing service crate.
3. **C — Bind READY to the exact command.** Introduce a private-constructor,
   non-copy READY-bound command created after the v2 kernel returns READY.
   Include or borrow the admitted candidate rather than accepting a separate
   raw command at the endpoint. Bind the value to the selected invocation and
   show how the actual complete resolver lists and candidate, not a fabricated
   alternate context, reach this construction site. The issuer must sit below
   the wrapper/provider/adapter dependency graph to avoid a Cargo cycle, and
   it must not mint a usable token from arbitrary fabricated READY evidence.
   The DENY successor creates no such value.
4. **D — Migrate all decision entries.** Change the v2 boundary trait and
   pre-resolved bridge, the service adapter, SQLite service/transaction/snapshot
   APIs, runtime adapter/resolved engine, generated-kernel-facing adapters,
   and legacy callers as identified by A. Remove or isolate every raw-command
   overload from the selected dependency closure. A READY-to-policy-DENY path
   still enters the authorized decision chain; policy result is not conflated
   with gate DENY. Any retained standalone legacy API must be explicitly
   outside the selected reachable graph, with a verified dependency boundary,
   not silently excluded from the owner-selected endpoint family.
5. **E — Compile and execute hostile controls.** Compile-fail fixtures must
   reject raw-command calls to each decision API, forged/changed READY-bound
   commands, and a produced-row pre-gate callback attempting the SQLite
   transaction endpoint. Runtime controls must cover blank request ID,
   duplicate qualifying rows, missing/nonqualifying rows, exact READY→ALLOW,
   READY→policy-DENY with one authorized chain and explicit per-endpoint
   cardinality, and request/epoch
   correlation. Instrument entry to every endpoint, not just the service
   adapter. Run affected offline locked crate/integration suites.
6. **F — Rebuild the proof and review independently.** The existing V4b source
   pins and 59-test certificate are invalidated by production Rust changes;
   update its extractor/graph, hostile fixtures, digests, and Lean replay
   where applicable instead of refreshing hashes alone. Independent review
   checks inventory completeness, same-invocation dominance, dependency
   exclusion, mutant sensitivity, exact test coverage, and claim ceiling.
   Only a closed all-path result may set `runtime_guarantees_observed: true`.

Edges: A → B and C; B + C → D; D → E; A + B + C + D + E → F. A
must be revisited and closed after D. Work may be
staged, but a partial stage cannot be called the accepted no-call guarantee.

### C–F implementation refinement (independently reviewed 2026-10-04)

The owner selected every native decision-producing endpoint reachable from the
public Auth request, so the remaining work is an all-path migration, not a
selected-adapter counter repair. The independently reviewed architecture is:

1. Freeze a source-derived inventory of the public API constructor and request
   root, concrete/dynamic engines, service clock, v2 resolver/decision traits,
   SQLite service/transaction/snapshot, runtime adapter/resolved engine, and
   generated authorization-policy kernel. Keep unresolved dynamic edges
   `indeterminate`. Exclude only the admission evaluator and genuinely
   read-only resolution from the counted endpoint family.
2. Create a lower admission authority that depends on the shared model,
   read-only readers, SQLite transaction, and v2 admission kernel, but **not**
   the existing v2 wrapper, pre-resolved bridge, runtime adapter, or generated
   policy. It owns the actual request's transaction/epoch, complete ordered row
   lists, exact same-row candidate, and admission result. Its scoped
   `with_ready` continuation receives a private-field, non-`Clone`/non-`Copy`
   READY value only after this invocation is READY; there is no public
   `admit(context)` or token constructor accepting caller-supplied rows. State
   resolution/join after READY produces a separately bound decision value;
   state failure must not redefine the accepted READY predicate.
3. Switch the selected service to this authority and remove or seal
   production pre-READY executable callbacks. The public generic clock is not
   a proof merely because the selected builder passes a system clock: arbitrary
   implementations can execute policy before admission. Similarly, replace
   the public arbitrary `AuthorizationRuntime::from_engines` composition with
   a concrete/sealed production pool; keep test injection internal to tests.
   The current v2 generic resolver/decision wrapper cannot be an alternate
   READY issuer or remain in the selected decision-capable dependency closure.
4. Make every reachable native decision entrypoint consume the bound value or
   isolate the legacy raw endpoint outside the selected public request's
   source and Cargo call graph. The reviewed isolation variant adds a small
   `authorization-ready-decision` crate that accepts only the bound value,
   derives command/time/state from it, and calls the pure generated policy.
   The selected service/API import shared data types directly and have no
   direct dependency on legacy runtime adapter, SQLite decision facade, or v2
   wrapper. The generated policy remains DomainSpec-owned and unmodified;
   its raw entrypoint is a transitive dependency callable only by the gated
   decision bridge in this selected composition. Source and Cargo closure
   must prove that edge, including no dynamic or FFI bypass. The alternative
   of changing the generated policy's owning source/generator remains required
   if isolation cannot close that edge. Legacy standalone APIs may remain
   only with a proved separation; deprecation is not separation. No global
   guarantee for independent legacy callers is implied.
5. Run hostile compile-fail forgery/raw-call controls and transaction-scoped
   runtime traces with per-endpoint entry counts for DENY and READY→policy-DENY.
   Rebuild D65 and V4b semantic source bindings, dependency closure, digests,
   and Lean replay where applicable; independently review invocation dominance
   and inventory completeness. Only then consider changing
   `runtime_guarantees_observed` from `false`.

The refined dependency edges are inventory → authority → selected service/API
and all endpoint migrations → hostile controls → source-bound evidence and
independent closure review. Authority and selected-service handoff alone are
an intermediate implementation slice, not the owner-selected all-path result.
The independent review found three blocking design constraints now reflected
here: no cycle through the current v2 wrapper, no arbitrary production engine
or pre-gate clock execution, and no public token factory over fabricated rows.

The API injection closure is now an implementation checkpoint: the engine
trait and `from_engines` constructor are crate-private, while their synthetic
probes moved inside the crate. Nine Rust tests, two external compile-fail
doctests, formatting, and strict Clippy pass. This is a source-breaking public
API change for external users of the arbitrary-engine constructor; no such
selected production caller was found, but compatibility must be reviewed.
The old V4b/v3 source-bound evidence pins the pre-change API and is therefore
stale until F rebuilds it. This checkpoint does not claim that other native
decision entrypoints are gated or that the broad no-call rule holds.

The lower `authorization-ready-authority` crate is now implemented. It reads
the complete ordered trusted rows and exact same-row candidate from one
caller-owned transaction, invokes the v2 admission kernel, then reads and
joins authorization state only after READY. Its private non-copy READY value
borrows that transaction and exposes only read-only command/state/provenance
accessors; gate DENY, preparation failure, and post-READY state failure are
distinct. Seven behavioral tests, two compile-fail tests, and strict Clippy
pass. Its Cargo dependency closure contains no policy adapter or decision
facade. The selected service now forwards its actual request and transaction
to this authority and calls the raw resolved policy only inside its READY
continuation. Production service construction uses its built-in system clock;
custom clocks are test-only. Three Auth bridge callers use the new constructor.
The service's 24 tests, API's 9 tests, and three bridge locked offline checks
pass. Independent review found two P2 admission-semantics errors in the first
authority implementation: metadata could fail before an otherwise READY gate,
and row qualifiers imposed size/control-character constraints absent from the
accepted typed predicate. Both were repaired: metadata is now post-READY state
failure, and the gate qualifiers use the accepted nonempty predicates. Eight
authority tests plus two compile-fail doctests pass; re-review is pending.
The older V4b/v3 source-bound evidence is stale (current V4b baseline rejects
with `AUTH_V4B_COMPOSITION:shared-request-ownership`); raw runtime/SQLite/
generated-policy entrypoints and all-path closure remain open. This is not a
runtime-guarantee claim.

### B partial implementation checkpoint (2026-10-04)

The two pre-admission SQL metadata readers moved from the decision-capable
`authorization-service` crate into `authorization-metadata-reader`, whose
only direct dependency is `rusqlite`. The service still calls them inside the
same transaction. A focused transaction test covers valid, absent, and
invalid metadata. A dependency-graph test confirms the reader has no
transitive native policy-decision crate, and a hostile produced-row callback
that names the SQLite transaction decision API fails to compile as an
unlinked crate. The service's 24 unit/integration tests pass offline and
locked. This removes the demonstrated service-local callback import path,
not all pre-READY decision paths: the service itself and the state resolver
remain decision-capable, and the generic clock/hook surfaces remain open.
The source-bound V4b certificate and endpoint baseline now map the reader as
a separate graph/source group. Their full 61-test suite passes, including
hostile reader-crate compile-fail controls that replace the obsolete
service-local callback witness. The API's nine tests pass; the three
transitive bridge targets compile offline and locked after dependency-lock
refresh. This is still only a partial B stage. Status remains
`indeterminate` and `runtime_guarantees_observed: false`.

### B state-reader implementation checkpoint (2026-10-04)

A kernel-free shared state model and a read-only SQLite state reader now own
the transaction-scoped state resolution. The reader depends only on the model
and `rusqlite`, exposes no `authorize` method, and retains the same caller
transaction borrow, row-order/cardinality checks, revision joins, and
fail-closed errors. The legacy SQLite provider is now a decision facade over
that reader; the selected service imports the reader directly and transfers
its snapshot to the runtime decision engine only in its post-READY adapter.
Reader tests pass 3/3; dependency/hostile-callback checks pass 2/2; provider,
service, and API suites pass 10/10, 24/24, and 9/9; six affected public/bridge
targets compile offline and locked. Strict Clippy and formatting checks pass
for the five touched Rust crates. The source-bound V4b extractor is remapped
to these new source owners; its full certificate and endpoint suite passes
61/61. An independent read-only review found no state-reader SQL or cardinality
semantic drift, and its one P2 endpoint-inventory omission was corrected with
a focused 3/3 test. The top-level service clock
and hook, READY-bound command, and every native decision entrypoint still need
the remaining B–F work. This checkpoint does not upgrade the guarantee.

### B trusted-input reader implementation checkpoint (2026-10-04)

The caller-transaction trusted-input resolver now lives in
`trusted-input-reader/`, which depends on the shared state model, generated
trusted-input admission runtime, and SQLite, but not a native authorization
decision crate. It retains supplied decision time, row order and duplicate
occurrences, same-transaction visibility, empty-selector denial before SQL,
and fail-closed query/conversion errors. The legacy provider reexports the
transaction API; the selected service imports the reader directly. Reader
tests pass 5/5 and compiled dependency-isolation checks 2/2; legacy provider
and service suites pass 11/11 and 24/24. The V4b source-bound graph now pins
the selected reader and separately pins the legacy provider; the full
certificate and endpoint suite passes 61/61. The local trusted-input successor
passes 72 checks, and the full Auth validator passes read-only with 329 checks.
Historical V2 replay retains its pinned command-boundary ontology bytes; the
current provider-bound ontology is a separate candidate successor. No
admission, deployment, all-path closure, or runtime guarantee is inferred.
Independent checkpoint review identified a separate P1 lineage gap: the older
`current-evidence-successor-v2` verifier classifies mutable D65 outputs as
historical snapshots, and its dependency map omits the new readers while still
requiring removed direct provider dependencies. That verifier does not pass
for the current implementation; its readme is marked stale. The v3 repair
below supplies immutable versioned preimages and a newly verified selected
service-root candidate, not a hash-only refresh of the old binding. The
329-check result above applies
only to the main Auth validator, not this separate v2 successor.

### Evidence-lineage repair plan (reviewed; implemented below)

Scope is the current Auth technical-evidence successor, not the runtime
guarantee. The eight v2 historical pins are recoverable exactly: seven
tracked pre-migration files at Git `HEAD` match their pinned SHA-256 values,
and the existing untracked v1 binding matches the eighth. Freeze the current
untracked v2 binding itself as a ninth exact byte preimage, so a later edit
cannot redefine the historical pin set. Preserve the nine bytes in a
versioned, content-addressed preimage set; record their original logical
paths, SHA-256, and available Git provenance. The v1/v2 bindings have no Git
provenance for their earlier chronology, so their freeze proves only exact
bytes observed now. Do not rewrite v1/v2 bindings
or historical files to make current checks pass.

Execution DAG: (A) freeze and verify the nine preimages; (B) add deletion,
mutation, and substitution controls against actual frozen bytes and the v2
binding's pin rows; (C) model both selected
decision paths and the direct metadata, authorization-state, and trusted-input
reader dependencies; (D) derive the selected service's local Cargo closure
from locked offline metadata (currently fourteen crates), pin its generated
runtimes and legacy compatibility edges, and track the legacy trusted-input
provider separately as an unselected facade; reconcile every direct local
dependency edge, rejecting unexpected edges, and inventory build-relevant
sources, `build.rs`, tests, examples/benches, migrations, `include_*` assets,
and generated receipts where present. Do not assume every generated crate has
a standalone lockfile; unclassified edges or inputs remain indeterminate;
(B, C, D) feed a new v3 candidate verifier and binding; (E) rerun clean
DomainSpec projection, local Cargo/Clippy inventories, negative controls, the
main Auth validator, and independent review. Mutable D65 outputs are current
candidate projections, never historical preimages. The result remains
`runtime_guarantees_observed: false` and does not imply all-path closure,
semantic admission, publication, or deployment. This is closure only for the
selected service-root Cargo graph, not an exhaustive inventory of every native
authorization entrypoint.

### Evidence-lineage repair checkpoint (2026-10-04)

The v3 candidate now preserves nine exact-byte preimages, including the v2
binding itself. Seven tracked predecessors are verified against Git `HEAD`
blob bytes; the untracked v1/v2 bindings are explicitly only locally observed.
The v3 binding inventories 104 current inputs, derives the selected service's
fourteen-crate local Cargo closure and all declared local edges, and separately
tracks the legacy trusted-input facade. It runs current CLI replay, two clean
v2 projections, debug Cargo checks/tests, release service checks/tests, and a
source-pinned V4b bridge. Hostile preimage, edge, configuration-bypass, and
verifier-substitution controls pass 13/13. The materialized v3 binding passes
read-only replay; independent rereview found no P1/P2 within this bounded
technical claim. The older v2 successor remains an unchanged, stale
predecessor; mutable D65 outputs are current candidate inputs, not historical
preimages. No all-entrypoint runtime guarantee or semantic admission follows.

### A baseline implementation checkpoint (2026-10-04)

The first A unit is an executable, source-pinned **authorize/admit-spelled**
baseline, not the closed A inventory. It binds thirteen current source files,
manually classifies ten explicit named call sites (including the admission
evaluator as not downstream), and lists seven known policy endpoint
definitions. Its checker rejects source drift, new authorize-spelled sites,
redirected targets, endpoint-definition or category forgery, and forged claim
ceiling. The three focused tests pass. The live result still reports 352
possible unresolved sites, open alias/dynamic target and dependency closure,
`status: indeterminate`, and `runtime_guarantees_observed: false`. Independent
rereview found no remaining P1/P2 within this bounded baseline. A must next
resolve aliases, arbitrary pre-gate callbacks, dependency edges, and remaining
native policy entrypoints before any endpoint-set or all-path claim.

### Next implementation slice: remove transitive legacy decision edges

Read-only implementation analysis found that the selected service still imports
the legacy trusted boundary solely for `InboundAuthorizationRequest`, while the
v2 boundary imports `sqlite-provider` solely for a blanket decision-trait
implementation. Thus the selected Cargo closure still contains raw SQLite
decision entrypoints even though the service directly imports read-only
readers. The public API also accepts arbitrary `Box<dyn AuthorizationEngine>`
through `AuthorizationRuntime::from_engines`; this is an unresolved dispatch
target, not evidence of a closed production composition.

The next bounded B slice has the following dependency order:

1. Define one kernel-free inbound-request owner and make the legacy boundary,
   v2 boundary, service, API, and bridge consumers use the *same type* without
   duplicate conversion or changing request validation. Preserve public
   reexports for source compatibility where possible.
2. Remove the v2 boundary's blanket SQLite decision-service implementation
   and its `sqlite-provider` dependency, and remove the API's direct legacy
   boundary edge after it uses the shared request type. Test the complete
   selected public API-root Cargo closure, as well as v2 wrapper and service,
   for absence of both legacy crates. Enumerate impacted direct callers of
   the blanket implementation before removal; preserve a compatibility
   adapter outside the selected closure if one is needed. Otherwise record
   the source-breaking API migration explicitly. Keep legacy direct callers
   in a separately labeled compatibility closure; do not infer that their raw
   decision APIs satisfy the owner-wide rule.
3. Update only affected Cargo locks, source-bound V4b maps, and current
   technical-evidence bindings after checking semantic/source changes. Run
   offline locked tests and negative dependency controls, then independent
   review. Preserve v1/v2 evidence preimages and the current claim ceiling.

This slice precedes READY-bound command migration; it does not itself prove
zero pre-READY calls. API `from_engines`, generic clocks, v1/v2 resolvers,
hooks, and public raw runtime/SQLite/generated-policy functions remain
explicitly open A/C/D/F obligations. They cannot be silently declared
unreachable just because the selected service's direct imports shrink.

### B dependency-isolation checkpoint (2026-10-04)

The inbound request is now one kernel-free `authorization-state-model` type,
reexported by both boundary versions and the runtime adapter. The selected
service and public API import it without a direct legacy-boundary dependency.
The v2 boundary no longer has the blanket SQLite decision-service
implementation or a SQLite-provider Cargo dependency. Locked offline Cargo
metadata shows eleven local crates under the service root and twelve under
the public API root, with neither legacy trusted boundary nor SQLite provider
in either closure. A v2 wrapper caller that relied on the removed blanket
implementation is source-breaking; no such selected caller was found, but
external compatibility is not asserted.

Focused Rust suites pass (service 24, API 9, v2 boundary 12). The V4b
source-bound certificate was migrated to the changed graph and its existing
58 checks plus new ownership hostile control pass; its status remains
`indeterminate` and `runtime_guarantees_observed: false`. Independent review
found a semantic D65 trace defect: its hash-current service binding still
called the legacy trusted boundary the selected path. The repaired binding
labels legacy provider/boundary references as predecessors and pins the
selected v2/pre-resolved boundary plus state, metadata, and trusted-input
readers. The main Auth D65 validator now passes 336 checks, and the freshness
inspector passes four controls. Seven Git historical preimages and both
observed-local binding preimages remain untouched. The v3 technical successor
was rebound after this D65 repair and passes read-only replay; its 13
negative/structure controls pass. Independent rereview found no remaining
P1/P2 in this bounded B checkpoint. None of this closes arbitrary API engines,
generic pre-gate callbacks, raw native decision APIs, or all-path reachability.

### Selected READY composition and bridge-isolation checkpoint (2026-10-04)

The selected service now calls `authorization-ready-authority` with its actual
transaction, request, epoch, and time. That lower crate reads complete ordered
rows, constructs the same-row candidate, executes the v2 gate, and passes a
private, non-copy, transaction-borrowed READY value to its continuation only
on READY. Metadata and authorization-state reads occur after the gate. The
service's continuation calls `authorization-ready-decision`, whose only public
decision function accepts that READY value and invokes the generated policy.
The API's production engine is concrete and its arbitrary-engine constructor
is private. Bounded independent rereview found no remaining P1/P2 in these
source changes; this is not yet an all-path proof.

The three runnable Auth bridges retained direct legacy runtime-adapter and
trusted-boundary dependencies solely for shared request/decision types. They
now import those types from `authorization-state-model`. Each compiles
locked/offline. A dedicated bridge closure check and three hostile controls
confirm that runtime-adapter, SQLite decision facade, and legacy trusted
boundaries are absent from each bridge's current normal Cargo graph.
Standalone legacy crates remain separate compatibility surfaces, not proof
that independent callers obey READY.

The prior V4b certificate pins the pre-change service and is stale. D65 and
the v3 technical successor have now been rebuilt: D65 passes 351 checks and
pins the accepted BusinessMeaning, owner endpoint scope, and selected READY
path separately from historical SFOL evidence; the v3 read-only verifier and
30 focused/bridge controls pass, with 110 current source inputs. A versioned
V4b READY successor pins the selected source/call graph and normal Cargo
edges for the API and three bridges; its eight focused hostile tests pass and
independent review found no P1/P2 within that bounded source check.
`runtime_guarantees_observed` remains `false`: compiler-resolved target and
whole-program callback/alias/SQL/async/effect closure, plus all-path
same-invocation dominance, remain open.

### Broad native-endpoint inventory checkpoint (2026-10-04)

The owner-selected endpoint family is now represented by a versioned,
machine-checked candidate inventory beside the current READY successor.
It enumerates two known selected policy entrypoints (the READY decision
adapter and generated policy), five known legacy SQLite/runtime entrypoints,
and three explicitly non-policy ingress/admission surfaces. Its checker binds
the current READY successor's four selected root closures and pins the legacy
source bytes. Five hostile controls reject omissions, selected-root Cargo
redirection to a legacy decision crate, false closure/observation promotion,
and stale source. This is a finite known-endpoint classification, **not** an
exhaustive endpoint-set or compiler-resolved effect proof. It remains
`indeterminate`, with `endpoint_set_closed`, `all_path_ready_dominance`, and
`runtime_guarantees_observed` all `false`. The older endpoint-baseline suite
is stale against the READY migration (`shared-request-ownership`) and is not
current evidence.

### Independent inventory review and direct-edge repair (2026-10-05)

The read-only independent review found two P2 omissions in that first
inventory. The legacy SQLite service's transaction-begin failure calls its
private `authorize_with_failed_ports` helper, which enters
`AuthorizationAdapter::authorize`; this is now enumerated as a legacy
decision-producing fallback edge. The generated policy is transitively
present in all four selected Cargo closures, but only
`authorization-ready-decision` has a **direct** Cargo dependency on it.
The checker now requires exactly that direct edge and rejects an added direct
policy dependency from the pre-READY service even when the transitive crate
set is unchanged. A compiled Rust control confirms that a crate depending
only on the service cannot import the policy crate; adding an explicit direct
dependency makes that import compile. The focused inventory suite passes
7/7. These repairs make the finite classification more accurate, but do not
resolve dynamic dispatch, implicit effects, all-path dominance, or runtime
observation; the verdict remains `indeterminate` and the three closure flags
remain `false`.

### Concrete API pool and all-native-entrypoint checkpoint (2026-10-05)

The owner confirmed that the no-downstream-call rule covers **every native
decision-producing Auth entrypoint reachable from the selected public Auth
request**, not only the selected service adapter.
The public API's production pool now holds concrete
`SqliteAuthService<SystemDecisionClock>` values. Its private trait-object
engine is compiled only for unit tests, while a normal-library integration
test exercises the production builder with ALLOW and pre-gate DENY. The
versioned V4b concrete-pool successor checks this source/Cargo projection
and remains `indeterminate` with `runtime_guarantees_observed: false`.

The independent read-only entrypoint review found no confirmed pre-READY
decision call in the selected API and three bridge roots. It also confirmed
raw legacy SQLite transaction/snapshot and runtime-adapter decision APIs,
including a transaction-begin failure fallback, that can be called without
READY by independent consumers. They are excluded from the selected roots'
normal Cargo closures; this is not a closed call/effect proof. The generated
policy remains a public raw-context function and is reachable through the
READY bridge. Follow-up work must prove every reachable entrypoint is
same-request READY-dominated, and every retained legacy entrypoint is
unreachable from this selected composition; independently callable legacy
APIs are not silently redefined as part of the selected request. Frozen
node-13/EVF evidence stays historical. The current technical evidence is
versioned separately under `implementation/current-evidence-successor-v4/`.

### Reviewed next closure task (2026-10-05)

The independent plan review selected a versioned V4b call-closure successor
as the next implementation unit, without rewriting the v3 source-bound
candidate. Start from all four selected normal-build roots, use compiler-
resolved calls where available, and enumerate every executable selected-crate
function, closure, trait, Drop, and async edge to the READY issuer, decision
bridge, generated policy, or known legacy endpoint. Carry actual request and
transaction identity through the path. Require hostile compiled controls for
an early direct policy import/call, a second READY issuance for a different
request, a callback decision call, and a new direct legacy dependency. Keep
unknown callback, SQL, macro, FFI, panic, and implicit-effect edges open, and
keep `runtime_guarantees_observed: false` until both all-path closure and
per-endpoint request/epoch-correlated runtime traces are independently
reviewed. The current v3 successor's 13 selected AST bodies, exact source
pins, and four source mutants do not meet that ceiling.

The first v4 typed-call census is now a **partial** implementation checkpoint:
it compiles normal MIR for seven selected roots in a fresh target directory,
checks known sensitive-call counts and the issuer's gate-result/READY-branch
def-use. Its 15 compiled controls reject copied selected-root pre-gate direct
policy, callback policy, and legacy resolved-engine calls, plus a copied
selected-service second READY-issuer invocation for a different request. That
mutant does not show that the second call returned READY. These are
specific hostile sensitivities, not a complete call/effect graph; full
transitive effect closure, same-request identity, and correlated endpoint
traces remain open. Its saved verdict must remain `indeterminate` with all
closure flags `false`; a passing local verifier cannot upgrade the
owner-selected claim.

### Selected-service entry classification and trace order (2026-10-05)

The v1 endpoint inventory labels the selected
`authorization-service::SqliteAuthService::authorize` a non-policy
"service-entry" orchestration surface, while the owner-selected no-call rule
counts every native decision-producing endpoint entered from the public Auth
request. The normal public API calls this binary-decision method before the
command-boundary gate. The inventory's exclusion is therefore not yet a
source-backed proof that gate DENY has zero counted downstream entries. The
legacy `sqlite-provider::SqliteAuthorizationService::authorize` is separately
listed, but that similar name does not settle the selected service's status.
Use the stronger owner-consistent implementation path rather than silently
discarding the selected entry from the count:

1. Make a genuinely admission-only selected service component own the real
   SQLite read-only transaction and epoch, invoke the lower READY authority,
   and expose a scoped READY continuation without evaluating authorization
   policy or returning a binary policy decision before the continuation.
   Its complete callable dependency closure must exclude native decision
   endpoints. Preserve the current transaction lifetime, same-row command,
   clock, rollback, and post-READY state-failure semantics.
2. Move the decision call to the post-READY continuation in the public API and
   all three selected bridges. Do not keep the current selected
   `SqliteAuthService::authorize` as an alternate pre-gate path. If retained
   for independent legacy consumers, place its decision-capable crate outside
   the selected roots' dependency and call closures. Refresh the endpoint
   inventory as a versioned successor; do not rewrite the v1 candidate.
3. Only after that split, add explicit invocation/request/epoch-correlated
   traces at the selected admission, READY-decision, and generated-policy
   *outer-wrapper* call boundaries. The generated DomainSpec operation states
   that its core is instrumentation-free and the outer wrapper owns
   instrumentation. A wrapper event is not itself a kernel-entry observation;
   prove exclusive selected ingress to the kernel separately. For API
   timeout cases, drain the blocking worker before interpreting an empty
   trace.
4. Test gate DENY variants for zero counted downstream entries and
   READY→ALLOW/READY→policy-DENY for one ordered bound chain with matching
   invocation, request, and epoch. Rebuild V4b/D65 source bindings after the
   production split. Static effect closure and independent review remain
   prerequisites for any `runtime_guarantees_observed: true` claim.

The reviewed dependency order is selected-service boundary classification →
admission/decision crate separation → API and bridge migration → correlated
trace tests → source-bound rebuild and independent closure review. This is a
construction frontier; a clean trace over the current pre-gate service call
would be a misleading substitute.

The first structural split is now a candidate implementation checkpoint.
`authorization-admission-service` owns the selected transaction/epoch and
calls the lower READY authority but has no ready-decision, generated-policy,
legacy-service, runtime-adapter, or SQLite decision-facade Cargo dependency.
The public API and three bridges now import that admission crate and call the
READY decision only as its continuation; their active Cargo trees exclude the
legacy decision-capable service. The old `authorization-service` remains an
independent legacy path, not a selected-root dependency. The new crate shares
the exact SQL migration files but currently duplicates the old crate's schema
and epoch plumbing; consolidation through a lower common component and a thin
legacy facade remain open. Four admission tests, ten API tests plus one
compile-fail doctest, all three bridge Cargo test builds, and strict Clippy
for the five affected crates pass. `cargo tree --offline --locked` confirms
the five active closures described above. The old v3 source-bound verifier
now fails on expected API source drift; v3/v4 are historical and must not be
called current evidence. Rebuild them as a versioned successor before any
claim upgrade. Runtime traces, hostile bypass controls, full call/effect
closure, and independent review remain open; all guarantee flags stay false.

The follow-up architecture review found that a generic `FnOnce` continuation
could carry a captured value whose `Drop` executes during DENY. The selected
admission boundary now accepts only a higher-ranked bare function pointer:
all four selected normal-build call sites pass the named READY decision item.
A compile-fail doctest rejects a captured continuation. This closes that
specific destructor escape at the admission boundary, but the indirect call
requires a fresh exact-target binding and hostile callback-swap control in
the V4b successor. Eight admission unit tests plus one compile-fail doctest
now pass, including clock failure, transaction-begin failure, post-READY
state failure, repeated epoch, and historical SQL-byte parity. The API's
normal-build integration test separately confirms READY→ALLOW, gate DENY, and
READY→policy-DENY. The three bridges still lack focused behavior/trace tests.

Current active Rust sources now `include_str!` three migration SQL files from
the neutral `authorization-schema/migrations` directory, not from a legacy
decision-capable crate. Historical copies are retained unchanged for prior
source-bound evidence; a test checks exact byte parity. Twelve affected
crates pass locked offline tests and strict Clippy after the move. This does
not fix the reviewer P1: the legacy `authorization-service` still duplicates
admission epoch/schema/gate plumbing, so a thin facade consolidation remains
the next structural task. Nor does it refresh the stale v3/V4b certificate,
establish per-endpoint traces, or upgrade `runtime_guarantees_observed`.

The next local implementation slice replaced the legacy production
`authorization-service` clock/epoch/schema/admission implementation with a
thin `SqliteAuthService` compatibility facade over
`authorization-admission-service`. It retains the public binary `authorize`
surface and constructors, delegates migration/epoch handling, and passes the
named READY-decision function pointer only through `with_ready`. The legacy
crate depends on admission in one direction; the selected API and three
bridges still have no normal Cargo dependency on the legacy crate. The former
fixed-clock integration regressions were ported into the admission crate's
internal test module, where test-only clock construction is possible without
a production callback constructor. READY→ALLOW, gate DENY, READY→policy-DENY,
and preparation-failure mapping have focused facade tests. Additional
admission tests preserve allocator concurrency, read-only writes, explicit
rollback failure, and a WAL snapshot surviving a concurrent writer with a
fresh retry seeing changed state. The admission crate's READY-decision edge
is dev-only for these regressions; its normal dependency closure remains
decision-free. This consolidation repairs production duplication but is not
yet a source-bound all-entry proof: current v3/v4 validators pin the old
service internals and must be superseded, not silently refreshed. Correlated
per-endpoint traces and callback-swap mutants remain open.

The independently reviewed next tracing candidate uses a sealed, typed,
per-invocation recorder scoped to the API blocking worker or each synchronous
bridge call. A thread-local guard avoids process-global cross-request bleed
and introduces no pre-gate user callback or `Drop`-bearing continuation.
Feature-gated events would identify root, invocation, request, and epoch at
admission; gate outcome at the READY authority; READY-decision entry; and the
generated-policy **outer-wrapper call site** immediately around its one
`kernel::authorize` call. The generated core stays instrumentation-free. A
wrapper call-site event is not independently observed kernel entry; the
versioned successor must bind the unique selected call edge by current
source/Cargo/MIR evidence and hostile callback-swap/direct-call mutants.
Timeout traces require draining the worker before interpreting missing events.
Such feature-gated traces are finite instrumented-path evidence, not proof of
all normal paths or a reason to set `runtime_guarantees_observed: true`.

The trace candidate is now implemented as the opt-in
`authorization-trace` crate. The API installs its scope inside the concrete
blocking worker, and each bridge scopes its actual `with_ready` call. The
admission service records the allocated request/epoch; the READY authority
records the gate result; and the READY decision wrapper records entry plus
before/after events around its sole policy call. The generated policy core
was not edited. The trace feature is absent from all four selected normal
Cargo closures. The API exposes completed-worker trace draining only in a
trace build; a timeout cannot be interpreted as zero calls until the worker
finishes. Collection also requires explicit API opt-in, retains at most 64
completed traces, and reports dropped traces so loss cannot support a
no-call inference. Bridge debug output additionally requires an explicit
environment switch and is not a normal-build behavior.

Focused trace regressions now exercise READY→ALLOW, pre-READY/no downstream
entry, post-READY state failure/no downstream entry, and READY→policy-DENY.
The API integration test uses the concrete production pool, not its unit-only
dynamic engine. Actual trace-built bridge binaries cover the two
authentication bridges and two separately correlated tenant requests. A new
`auth-v4b-native-trace-successor.mjs` checks current selected Rust call shapes
and all four normal Cargo closures; mutants reject a reversed READY guard,
unbound wrapper event, duplicate policy call, and direct bridge bypass. It
excludes enumerated legacy SQLite/runtime-adapter crates and restricts the
generated policy's direct importer to READY decision. This is a versioned
candidate: parser limits, implicit effects, complete endpoint-set closure,
normal-build all-path dominance, independent kernel-entry observation, and
TDE/EVF runtime evidence remain open. All guarantee flags remain false.
An independent review found and reproduced a shadowed-`gate_decision`
bypass that the first source checker accepted. The successor now requires
the gate binding, trace, and READY guard to be consecutive selected
statements, and a regression mutant rejects that exact rebinding. The review
also led to per-invocation bridge trace assertions and a pre-admission bridge
DENY/no-trace case. These repairs narrow known gaps, not the claim ceiling.

The next versioned `auth-v4b-typed-target-census-v5.py` compiles fresh
**normal-build** MIR for the selected API, admission service, READY authority,
READY decision, and all three bridges. It requires each public root's one
`with_ready` call to receive the same MIR local that reifies the fully
qualified `authorization-ready-decision::authorize` function item. It also
checks the admission service's actual transaction/request/epoch/callback
handoff, the authority's gate-result-to-READY branch and callback dominance,
and the READY wrapper's single generated-policy call. The prior current
source/Cargo successor remains a required predecessor and is rerun after MIR
capture to detect source/Cargo drift during the check. The v5 controls include
**compiled** bridge mutants for a same-signature callback swap and a direct
raw-policy call before READY, plus in-crate generated-policy alias and
function-pointer double-call mutants. MIR mutations additionally reject
callback rebinding, duplicate policy/issuer calls, gate-result rebinding,
READY-branch redirection, switching on another value, changing the compared
READY constant to DENY, and a READY-token-to-callback argument swap. The independently reproduced
function-pointer bypass required checking generated-policy function-item
reification in MIR; the source predecessor now rejects the same alias shape.
The standalone v5 census and all eight controls passed locally on 2026-10-05;
the READY-branch mutant control derives its MIR local from the current
compiler output rather than an earlier rustc-local number.
the census remains `indeterminate` with endpoint, all-path, and runtime
guarantee flags false. These local checks do not independently establish the
remaining effects or an ORODI verdict.
This is a compiler-typed census of named native edges, not a full effect
closure: iterator callbacks, `Drop`, macros, SQL, FFI, panic/unwind, complete
endpoint enumeration, and runtime guarantee observation remain open. Its
status and all closure/guarantee flags remain false pending independent
post-implementation review and broader verification.
An independent read-only v5 review found no normal-build public API engine
injection: the production pool is concrete, test trait-object dispatch is
`cfg(test)`, and `from_engines` is private. It confirmed the owner-wide
closure gap remains: public raw-command SQLite transaction/snapshot and
runtime-adapter entrypoints still exist outside the selected Cargo roots.
The next proof must source-derive their reachability or isolation from every
selected public request; the current four-root exclusion is not by itself an
endpoint-set closure claim.

The historical v1 native endpoint inventory's current-source test now fails
closed at `source-drift:api` after the migration. It remains pinned evidence;
do not refresh its source hashes to make a current claim. The new
`auth-v4b-native-endpoint-inventory-v2.mjs` scans 52 current Rust files with
the separately versioned `v4b-surface-inventory` `syn` parser and joins
packages to four normal Cargo closures by
exact manifest identity. On the 2026-10-05 local snapshot (aggregate source
SHA-256 `373177d4da89042bdb83968b89c8580d27893b571e0fa184764cf53b55bc75bc`),
it found 506 function surfaces, 50 decision-shaped suspects, 50 effect-hook
suspects, 23 anchored entrypoints, 27 unclassified decision-shaped suspects,
and 20 opaque edges, including two unresolved runtime symlinks alongside
re-export/module/foreign surfaces. Twenty-five suspects are production-source
candidates. The source-role classifier distinguishes exact `cfg(test)` from
`cfg(not(test))` and leaves mixed conditions uncertain; every selected Cargo
target root must occur in the scanned source set or the run fails closed. The
earlier scan detected the public lower-authority capturing `FnOnce` as an
explicit DENY-drop effect, even though the selected service passed a bare
function pointer. The public lower authority now also requires a bare function
pointer, and its API-level compile-fail doctest rejects a captured callback;
the current inventory reports that specific captured-drop effect closed.
The broader callback target and transitive-effect closure remain open.
The anchors now include the two trusted-boundary trait/wrapper dispatches,
their SQLite trait implementation, and the pre-resolved candidate's wrapper
and borrowed dispatch. All seven selected-root production decision-shaped
functions found by the current syntax scan are anchored; a new unclassified
selected production suspect fails the inventory. This does not make the
heuristic suspect predicate, cfg/macro expansion, dynamic dispatch, or
transitive effects exhaustive. Seven v2 inventory tests pass. This is
discovery and candidate isolation evidence, not complete cfg/macro/dynamic,
effect, or runtime closure.
The current v5 normal-build MIR census was updated for the lower boundary's
function-pointer call and passes its seven-root read-only run. It binds that
call to the constructed READY value after the gate's READY arm, but keeps
`endpoint_set_closed`, `all_path_ready_dominance`, and
`runtime_guarantees_observed` false. The older v4 typed census still expects
`FnOnce::call_once` and is historical, not current proof.
Eight current v5 hostile-control tests pass, including signature reversion,
READY-token substitution, callback swap, premature policy call, and indirect
policy-call controls. The lower authority's eight integration tests and three
doctests, READY-decision's three integration tests and one doctest, strict
Clippy, and formatting checks pass for both touched crates.

The next API migration cannot be a cosmetic READY guard on the five public
raw-command SQLite/runtime entrypoints. `authorization-schema` v1 has no
authentication-evidence or route-binding rows; those first appear in v2.
`trusted-boundary-v2/tests/no_call_contract_gap.rs` also preserves a concrete
generic-resolver counterexample: its resolver enters the same downstream
decision service before the wrapper returns gate DENY. The current selected
API and bridges exclude those legacy crates by normal Cargo dependency, but
that is a conditional selected-composition isolation result, not a global
every-entrypoint guarantee. Current product work is to migrate any live
independent consumers to inbound-request → transaction-bound READY → policy
decision, then retire or explicitly isolate raw public exports and recheck
all native origins; independent consumer enumeration and runtime observation
remain open. Historical v1 behavior and evidence are not silently rewritten.

The historical `v4b-call-inventory` source and manifest remain byte-for-byte
at their pinned digests (`58c5f742...` and `bae9cb5e...`). Its v1 tests now
separate the expected current `source-drift:api` rejection from synthetic
historical shape-mutant controls; eight v1 tests pass without treating the
synthetic fixture as current certification.

### Legacy trusted-input provider dependency checkpoint (2026-10-05)

The legacy trusted-input provider imported the raw runtime adapter and v1
trusted boundary only for a clock, data types, and read-only resolver traits.
Those contracts now have one kernel-free owner in `authorization-state-model`;
the old crates reexport them so existing Rust import paths and trait impls
continue to compile. The provider's normal Cargo closure no longer contains
the raw runtime adapter, SQLite decision facade, trusted boundary, or generated
authorization policy. A locked offline metadata test checks that exclusion.
The provider's 11 tests, runtime adapter's 8 tests, v1 boundary's 6 tests, and
strict Clippy checks pass. This is dependency isolation for one unselected
legacy provider, not an all-entrypoint READY guarantee: the provider still
accepts an arbitrary clock, the v1 boundary still dispatches raw commands,
and the public raw SQLite/runtime endpoints remain. Current source-bound
bindings need a versioned successor after this source change; frozen historical
preimages and their original hashes must not be rewritten.

Independent review found that the new closure check was not in the normal
trusted-input validator; it is now required there. That validator also pinned
the pre-split service's 24 tests and old API-to-service graph. Its current
inventory now separately tests the 29-test admission service and four-test
compatibility decision facade, and its source-edge hostile controls pass 3/3
against the API-to-admission graph. The read-only full validator now reaches
`trusted-input-provider-binding-current` and fails because the existing
candidate binding hashes pre-migration provider bytes. Regenerate a current
successor and cascade its affected current bindings under a separate bounded
evidence step; do not rewrite historical source preimages. No D65 or V4b
freshness is claimed from this partial checkpoint.

### Current trusted-input/D65 evidence repair checkpoint (2026-10-05)

The current candidate generator now describes the actual selected API →
`SqliteAdmissionService::with_ready` → transaction-bound READY authority →
READY-only policy adapter path. It labels `SqliteAuthService::authorize` as a
separate compatibility facade rather than a selected API engine and records
the 29 admission-service tests separately from the facade's four tests. The
provider binding is v2-candidate and the service binding is v3-candidate;
both are regenerated current artifacts, not historical preimages. The exact
owner-acceptance test is required in the trusted-input validator, so a changed
rule retaining its key phrases cannot be rebound without the accepted subject
digest. The selected normal-edge local dependency closure is derived from
locked offline Cargo metadata, not the hand-written manifest traversal; it
excludes the raw SQLite/runtime facades. The validator now uses the pinned
toolchain, offline locked Cargo checks, and doctests. The final hardened
write/materialization run and a fresh read-only replay each passed 96 checks.
Frozen v3
content-addressed preimages were independently checked unchanged. The wider
Auth validator remains stale at `runtime-adapter-binding-current`, and v3/v4
technical-evidence successor bindings still pin earlier selected-path bytes.
The current V5 MIR census and seven syntax-inventory tests pass but continue
to report `endpoint_set_closed: false`, `all_path_ready_dominance: false`, and
`runtime_guarantees_observed: false`. Next work is to retire/quarantine raw
legacy decision ingress or prove exact isolation, close dynamic/effect edges,
and produce a new current technical-evidence successor; no historical pin is
silently refreshed.

### Legacy v2 boundary dependency-isolation checkpoint (2026-10-05)

The unselected `trusted-boundary-v2` wrapper now imports shared command,
request, decision, resolver, and row types from the kernel-free
`authorization-state-model` instead of the raw `runtime-adapter`. Its locked
offline Cargo closure contains neither the raw runtime adapter nor the raw
SQLite decision facade; a new dependency-isolation test checks this edge.
The wrapper's 12 Rust tests, the new dependency test, and the four
pre-resolved bridge tests pass after both lockfiles were updated offline.
Its generic resolver remains effectful: the preserved counterexample enters
the downstream service before the wrapper returns DENY. The wrapper is labeled
a legacy fixture, not a selected public Auth path or an all-path no-call proof.
Existing source-bound v2 and technical-evidence bindings predate these bytes;
they remain historical and need a current successor rather than an in-place
hash refresh. The selected-path and runtime-observation claim ceilings remain
unchanged. A fresh seven-root normal-build MIR census passed its structural
checks and still reports `status: indeterminate`, `endpoint_set_closed: false`,
`all_path_ready_dominance: false`, and `runtime_guarantees_observed: false`.
The syntax-wide endpoint-inventory controls passed 7/7. The historical v2
evidence validator currently stops at its already-stale v1 boundary source
predecessor, before it can assess this wrapper's newly changed bytes.

### Explicit legacy raw-decision quarantine checkpoint (2026-10-05)

An independent read-only caller inventory found the five raw decision APIs in
`runtime-adapter` and `sqlite-provider` to be outside the normal Cargo closures
of the selected public Auth API and all three bridges. The only other
in-repository production caller was the v1 trusted boundary's concrete SQLite
trait implementation. That implementation and the v1 boundary's direct
dependencies on both raw crates are removed. The v1 boundary still has a
generic callback and remains a legacy fixture, not an all-path guarantee.

The raw adapter and SQLite facade are now explicit opt-in compatibility
capabilities: their `legacy-raw-decision` features are disabled by default and
the policy-kernel/runtime dependencies are optional. The raw methods are absent
from default compiled exports and present only under the opt-in feature. A
compiler-backed hostile import test checks both postures, and locked offline
Cargo metadata confirms that the selected API and three bridges contain none
of the legacy decision crates. Historical opt-in suites still pass (adapter
8/8, SQLite 10/10), the v1 wrapper passes 6/6, and default/opt-in strict
Clippy passes. This is an explicit selected-composition quarantine, not a
global prohibition on independently opting into the legacy APIs. The current
technical/D65 successor still needs to bind these source changes; older
source-bound artifacts remain historical and are not silently rehashed.

Independent post-change review found that a grouped negative compile probe
could miss one accidentally exposed item; the control now rejects each named
raw export separately and typechecks the opt-in SQLite decision methods. The
control is wired into the current trusted-input/D65 candidate validator and
its source digest is bound by the service candidate. Materialization passed
97 checks, and a separate read-only replay passed the same 97 checks. The nine
frozen v3 historical preimages independently retained their recorded hashes.
The wider technical successor, exhaustive dynamic and effect closure, and
observed-runtime evidence remain open. A fresh read-only run of the older
whole-Auth validator still stops at `runtime-adapter-binding-current`; its
v1-style current binding has not been promoted to a successor that describes
the opt-in compatibility facade. It must not be repaired by silently
rehashing that historical claim.

### Current technical-evidence v5 checkpoint (2026-10-05)

The new `current-evidence-successor-v5` candidate binds 77 exact current
inputs, the normal Cargo closures of the public API and all three bridges,
the concrete production `SqliteAdmissionService::with_ready` path, and the
compiler-backed default-off raw API controls. Four focused regression tests
and its read-only binding verification pass. The nine v3 preimages remain
unchanged; v3/v4 bindings are not reissued. This successor is deliberately
source/dependency/compile evidence only: the old runtime-evidence adapter hash
is stale, even though the current D65 owner-scope links are fresh. The wider
Auth validator still stops at `runtime-adapter-binding-current`, and the V5
MIR endpoint/all-path and observed-runtime obligations remain open. No
`runtime_guarantees_observed` claim is promoted.

### Current compatibility-adapter successor checkpoint (2026-10-05)

The original runtime adapter's working v1 evidence receipt is distinct from
the earlier frozen v3 preimage, and its adapter-source hash is stale after the
default-off feature quarantine. Both records remain untouched. A versioned
`runtime-adapter-successor-v1` candidate now binds the current compatibility
adapter source and feature boundary, checks both default and opt-in Cargo
builds with strict checks and Clippy, runs each test posture twice, and replays
the compiler-backed selected-root exclusion control. The eight opt-in behavior
tests and three successor hostile-control tests pass. The read-only freshness
suite now expects exactly the historical adapter-source stale link while
requiring current selected/D65 links; it no longer misreports whole-chain
freshness. The successor and the current technical v5 binding both verify, but
neither asserts a selected-path runtime guarantee. The older whole-Auth
validator still requires separate versioned replacement of its v1-style
adapter assumptions.

### Current selected-Auth aggregate validation checkpoint (2026-10-05)

An independent read-only plan review confirmed that the older whole-Auth and
public-API validators still encode retired v1 wiring and must not be relabeled
as current. The new `validate-current-auth.py` command composes the current
three-target AlchLang replay, 97-plus trusted-input/D65 checks, v5 technical
binding, and feature-aware adapter successor. It independently runs locked
offline format, strict check, Clippy, and all-target tests for the selected
API, admission service, READY authority/decision, and three bridges; explicit
doctests cover the four libraries' compile-fail fences. It also runs seven
syntax-inventory controls and the seven-root normal-build MIR census while
checking historical receipt/preimage bytes for mutation during the run.

The first full run exposed one stale inventory expectation: the retired v1
concrete SQLite dispatch had been removed from `trusted-boundary`. Its known
entrypoint row was removed and a guard now rejects silent reintroduction.
The syntax suite then passed 7/7, the MIR census passed its named chain checks
with `status: indeterminate`, and a fresh end-to-end aggregate run passed.
That pass establishes only the stated local candidate validation surface.
`endpoint_set_closed`, `all_path_ready_dominance`, and
`runtime_guarantees_observed` remain false. The old whole-Auth validator still
fails on its historical adapter binding and remains available only as a
predecessor; no historical record was reissued.

### Current selected-closure compiled ingress checkpoint (2026-10-05)

An independent effect-closure review identified a coverage gap between the
seven named MIR roots and all local packages in the selected Cargo graph. The
candidate `auth-v4b-selected-closure-census-v6.py` derives the four normal
Cargo closures from the syntax inventory and compiles all 14 distinct local
manifests as standalone default packages to MIR. It binds MIR and source-set
hashes, compiler version, and per-root local Cargo feature maps (all empty in
the current roots). The sampled generated policy has one direct ingress in
the READY decision crate, with no extra function-pointer or unclassified
policy reference in these MIR files. Seven hostile unit controls pass,
including a policy call hidden under a non-suspect reader function name, an
indirect target, a raw decision candidate, a callback carrier, a destructor,
and unwind effects. The complete current run inventoried 3,734 effect
terminators: 2,489 direct-static calls, 850 drops, 141 SQL boundaries, 83
dynamic targets, 34 callback carriers, 14 assertions, 122 unwind resumes,
and one generated-policy call. It labels 1,244 terminators unresolved; 3,612
call/drop/assert terminators have a possible unwind edge. The two generated
packages without checkout lockfiles were compiled from isolated temporary
copies; no checkout lockfiles were created.

This is an inventory of standalone package MIR, not a root-context
whole-program build, resolved transitive effect graph, or proof of the entire
native decision endpoint set. An independent review corrected the earlier
overbroad claim: default standalone package builds can differ from their
effective root-context cfg even with empty local Cargo feature maps.
Indirect/trait dispatch, callbacks, Drop, SQL/FFI, panic/unwind, external
crates, same-invocation all-path dominance, and independent runtime
observation remain open. Therefore `endpoint_set_closed`,
`all_path_ready_dominance`, and `runtime_guarantees_observed` remain false.
Next derive root-context effective build evidence and a resolved call/effect
graph from the compiled local MIR, then add compiled hostile mutants for
dynamic and DENY-drop bypasses. Retain unresolved executable edges as explicit
`indeterminate` obligations.

The current selected-Auth aggregate now includes this v6 candidate census as
an additional fail-closed stage. Its focused validator controls and v6 hostile
controls passed 12/12. A complete aggregate run passed the four current
source/evidence stages, all seven selected Rust crate checks and tests, the
seven syntax controls, the v5 named MIR chain, and v6's 14-package standalone
effect inventory while preserving the historical receipt and frozen preimage
bytes. Aggregate `status: pass` is only a check-run result; both MIR stages
remain `indeterminate`, with 1,244 v6 effect terminators unresolved and all
three closure/observation flags false.

### Current four-root Cargo-context checkpoint (2026-10-05)

A read-only feature-graph comparison found a concrete standalone-build gap:
the API root enables external `smallvec` features `const_generics` and
`const_new` while standalone builds of six local dependency packages do not.
An independent review verified that an isolated root build can emit local MIR
under the root's actual Cargo dependency resolution. Candidate
`auth-v4b-root-context-census-v7.py` now builds all four selected public roots
separately with `RUSTFLAGS=--emit=mir,link`; it joins every local MIR artifact
to Cargo package ID, target source, local feature set, compiler version,
source-set hash, root metadata, and lockfile hash. Five artifact-hostility
controls pass, including missing/duplicate/wrong-feature MIR and an extra
generated-policy ingress. The complete four-root candidate run passes its
bounded checks: each root has 11 local packages; the sampled generated-policy
direct ingress is unique to the READY decision crate; API has 695 unresolved
effect terminators, tenant has 860, and the authentication bridge roots have
731 each.
These instrumented compiler builds are not unmodified runtime artifacts.
Indirect/external effect targets, all-path READY dominance, and runtime
observation remain open, so all closure flags remain false. The current
selected-Auth aggregate now includes v7 as an additional fail-closed stage;
its full integrated rerun passed the four current source/evidence stages, all
seven selected Rust crate checks and tests, syntax controls, and v5/v6/v7 MIR
checks. It matched source-set and compiler hashes across v6 and v7 and
preserved historical protected bytes. Each MIR check remains `indeterminate`;
`endpoint_set_closed`, `all_path_ready_dominance`, and
`runtime_guarantees_observed` remain false.

### Current local effect-cut checkpoint (2026-10-06)

V26 now takes V7's actual four root-context MIR builds and V9's selected
handoff identities. It inventories normal and compiler-emitted local unwind
paths through each selected root worker/evaluate body, admission `with_ready`,
and lower READY authority. The root/admission return paths remain in scope;
only the authority's *normal* READY edge is excluded. An unwind into that
same block is still traversed. Known native policy/decision calls on the cut
fail, and every other effect site remains classified as open or as a selected
cross-body handoff. Seven focused hostile controls pass; the final four-root
replay returns `indeterminate` with 103/115/218/218 unresolved local sites
and 33/36/47/47 cleanup-only blocks for API/tenant/prototype/HTTPS.

This is a reviewed **three-function-per-root local effect inventory**, not a
resolved transitive graph, complete request/epoch def-use proof, all-native
endpoint closure, or runtime observation. The synthetic hostile controls do
not substitute for compiled source mutants. Next resolve the handoff return
and transitive target graph, then compile indirect-call and DENY-drop mutants
against the actual selected composition. Keep all guarantee flags false.

### Bounded same-artifact direct-call checkpoint (2026-10-06)

V27 adds a conservative first transitive step: it expands only a uniquely
matched direct MIR target in the caller's own compiled artifact. The current
source-bound CLI replays all four selected root contexts. Each resolves two
such edges and expands two callee bodies. V26 unresolved local baselines and
V27 open inventory rows are API 103 → 113, tenant 115 → 125, and prototype
and HTTPS 218 → 228 each after callee effects and caller-unwind obligations
are included. This is **not** a reduction-to-zero metric or transitive closure.
Fifteen focused V26/V27 synthetic tests pass, but compiled indirect-call and DENY-destructor
mutants are still needed. Cross-crate call/return, repeated targets, dynamic
dispatch, Drop, SQL/FFI, unwind continuation, exact request/epoch flow, and
observed runtime behavior remain unresolved. All closure and guarantee flags
remain false. The next proof unit must resolve or explicitly bound these
existing frontier edges across every selected public root and every reachable
native decision entrypoint.

The API v1 wire contract deliberately projects timeout and other non-200
failures as HTTP `DENY`; a timed-out blocking worker may continue after that
response. Therefore HTTP `DENY` is not evidence of command-boundary DENY or
zero downstream authorization calls. Tests and certificates must use actual
gate/policy-entry and request/epoch evidence. Preserve the current wire shape
unless the owner separately changes that product contract.

The separate trace-feature integration witness now observes this ordering in
the concrete normal-library SQLite pool: HTTP 504 `DENY` arrives under an
exclusive database lock; after its release, the same request/epoch records
READY and policy entry. The source-bound V27 four-root replay remains
`indeterminate` after this test addition. The prior current-technical v6
binding is source-stale: besides the new test path, 11 already-present inputs
including production code and the v5 verifier differ from its reconstructed
current object. Do not force a single-addition successor through that drift.
First review/bind those 11 paths as a separate multi-source current baseline,
then bind the timeout witness and explicitly run its `trace` feature in the
aggregate. Neither step substitutes for transitive endpoint closure.

## Decision and risk register


| Item | Classification | Handling |
| --- | --- | --- |
| Endpoint family | Resolved owner decision | Every native decision-producing Auth entrypoint reachable from the selected public request, including SQLite transaction/snapshot and resolved runtime paths when reachable; admission itself is excluded. Counting only the selected service adapter is insufficient. |
| Opaque token vs dependency split | Design conclusion, review pending | Both required for meaningful structural enforcement. |
| Cross-crate API migration and legacy direct callers | Implementation risk | Inventory before mutation; preserve compatibility only if it cannot bypass the selected composition. |
| Same-invocation READY, complete server-owned lists, dynamic/foreign effects | Proof obligations | Fail closed when unbound; no result upgrade from sampled tests. |
| Deployment, publication, production security claim | Out of scope | Separate routes and evidence. |

## Completion and validation ceiling

The task is not done when APIs merely compile. Completion needs an exhaustive
selected endpoint inventory, dependency exclusion for pre-gate preparation,
an unforgeable exact-command READY handoff, zero calls on every normally
evaluated non-READY path, any post-READY decision chain classified separately
with per-endpoint cardinality and order checked for the concrete composition,
hostile compile-fail and runtime controls, rebuilt source-bound proof, and
independent review. Even a closed static all-path proof would not alone be
an observed runtime guarantee; the relevant TDE/EVF execution and evidence
freshness must also pass. Until then the certificate is `indeterminate` with
`runtime_guarantees_observed: false`.

## Open Questions

- Can all native decision entrypoints be made to require one READY-bound value
  without retaining a raw-command compatibility bypass in the selected graph?
- Which exact Rust crate split yields a truly read-only preparation dependency
  closure while preserving transaction-scoped state consistency?
- What source-derived mechanism closes dynamic dispatch, callbacks, macros,
  external code, and the selected public builder-to-service identity?
