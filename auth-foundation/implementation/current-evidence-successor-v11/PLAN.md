# Auth native decision-entrypoint ledger (v11 candidate plan)

## Product frontier and claim ceiling

The next testable product is a source-bound, fail-closed ledger of native
decision-producing entrypoints for the four selected public Auth roots: API,
tenant bridge, prototype bridge, and HTTPS bridge. It carries the owner's
rule that a command-boundary gate DENY must cause **no downstream authorization
call at any reachable native decision entrypoint**. Admission and state reads
are not decision entrypoints unless they enter policy logic. HTTP 504 DENY is
not a gate-DENY witness because its worker may continue.

The ledger is an inventory and reachability classification, not an all-path
proof. Its outputs must retain `endpoint_set_closed: false`,
`all_path_ready_dominance: false`, and `runtime_guarantees_observed: false`
while any indirect, external, Drop, unwind, SQL/FFI, request-identity, or
runtime-observation obligation remains open. It must not change v5-v10
bindings, production source, or the API v1 wire contract.

## DAG

1. **Freeze inputs.** Revalidate selected v10 and its predecessor hash; bind
   each public root's normal `cfg(not(test))` Cargo package/feature/source
   closure. Keep test and trace-only routes separate. Version the exact source
   and verifier inputs; reject an added local package, target, feature, or
   source path until reviewed.
2. **Enumerate entrypoints.** Pin the exact 22-ID `known` array in
   `auth-v4b-native-endpoint-inventory-v2.mjs` as a machine-read baseline,
   including API/bridge dispatch, admission and gate as excluded roles,
   READY decision, generated policy, legacy SQLite transaction/snapshot,
   resolved runtime, facade, trait/wrapper, and pre-resolved dispatch.
   Independently record the eight generated Boolean callables as
   `candidate/helper-unresolved`, not as proved independent decision
   entrypoints. Bind stable package identity, visibility, cfg/feature state,
   source signature, and location. New functions, exports, re-exports,
   macros, or source outside the known table fail closed pending review.
3. **Classify root × entrypoint.** Use `reachable`, `ruled_out`, or
   `unresolved`, with a machine-checkable witness/reason. `reachable` needs a
   proved executable call/effect path from the exact normal public entrypoint.
   A missing local package in one exact normal closure is a scoped static
   absence fact, not by itself an owner-level `ruled_out` decision because
   opaque effects remain. Presence alone does not prove a call path.
   `ruled_out` needs a stronger closed-call/effect witness.
   Reconstruct the normal Cargo closure independently of the syntax
   inventory's own membership projection before binding it.
   Dynamic/trait
   dispatch, callbacks, SQL/FFI/external effects, Drop, unwinding, and
   cross-crate returns stay unresolved absent specific evidence.
4. **Resolve the selected handoff.** Bind the normal API worker and bridge
   call sites to `SqliteAdmissionService::with_ready`, its transaction-bound
   `with_ready_in_transaction`, gate result, and the exact continuation that
   consumes READY into `authorization-ready-decision::authorize`. Check
   request/epoch identity across the handoff and treat a timed-out API worker
   as still potentially active. A direct named policy call before READY fails.
   Execute this as a four-root evidence chain:
   - First add an unselected capability-cut candidate over the exact four
     same-build local MIR closures. Reuse V7's Cargo package exclusion,
     sole generated-policy dependency predecessor, and compiled policy-ingress
     checks; do not recast them as reachability proof. Independently enumerate
     fully qualified direct and reified READY-decision references in every
     local MIR artifact (rustc may abbreviate other semantic targets),
     require the selected root handoff to account for each accepted reference,
     and leave indirect/Drop/unwind/SQL/FFI/external effects open. An extra
     direct READY-decision ingress or ambiguous reference fails closed. Review
     hostile variants before any binding; candidate output retains all three
     closure/runtime flags false. A bare callback and private READY fields
     narrow capabilities but do not themselves prove cross-crate execution.
   - Reuse and independently replay V9's existing **four-root same-build
     normal-MIR stitched graphs** for the selected root, service, authority,
     READY decision, and generated kernel. Strengthen the root function-item
     to `with_ready`, service callback-argument to authority continuation,
     and authority callback to READY decision joins beyond V9's candidate
     stitching. V25's API LLVM symbol is a candidate edge, not a substitute
     for cross-body execution certainty; bridge roots need equivalent
     reviewed evidence rather than a duplicate V9 graph.
   - Check the authority's DENY exits, the gate READY arm, unique continuation
     invocation, private READY construction, and the decision's kernel call.
     Carry the same inbound request ID, epoch ID, decision time, and
     transaction across those bodies. Bind qualifying authentication and
     route-row identity within the trusted-input/metadata readers and
     authority, then prove provenance of the derived command/subject/revision
     values into READY and the decision. READY and the kernel do not carry the
     original row identity. A source match or equal-looking value is not an
     execution-edge proof; same-build artifacts and symbol joins remain
     candidate edges until cross-crate execution is established.
   - Reject compiled hostile variants with a callback on a DENY arm, direct
     or indirect pre-READY decision call, swapped request/epoch identity,
     duplicate continuation, and cfg/feature-only alternate path. An
     unmatched indirect, Drop, unwind, SQL/FFI, or external effect is
     `unresolved`, never silently `ruled_out`.
     Begin with isolated copies of each selected public root's actual Cargo
     package closure and required SQL inputs, excluding build outputs and
     live state. Compile a clean mirror before each hostile source variant;
     assert that its intended MIR change is present before accepting a
     verifier rejection. Recheck original checkout bytes afterward. Extra
     READY-decision function-item reification and replacement of the selected
     callback are detection controls, not gate-DENY witnesses. Keep raw
     dependency, active cfg, DENY-arm callback, and identity-swap controls
     separately visible until executed against real root-context builds.
   - Separately run command-boundary DENY cases with observation at **every
     ledger-classified reachable native decision entrypoint**. Keep the API
     worker alive through its terminal result, correlated to that invocation,
     before counting: HTTP 504 DENY is not a no-call witness.
     Classify an early service/authority pre-gate DENY separately from an
     actual `admit_authorization_command` result of DENY. Current row
     cardinality/provenance prefilters may make the latter unreachable for
     ordinary inputs; never relabel an early DENY trace as gate-result DENY.
     Establish either a constructive gate-DENY witness or a bounded proof of
     that branch's unreachability under the selected service invariants.
     Trace events at the READY wrapper and generated kernel alone cannot
     establish the owner-wide no-call guarantee. Bind the observed request
     and epoch to the same invocation, and retain unresolved endpoints as
     unresolved until their observation or closed-effect exclusion is proved.
     Negative traces over a reachable subset never rule out unresolved paths.
5. **Hostile controls and review.** Test a newly added endpoint/import/export,
   re-export or macro, a
   newly reachable local package, cfg/feature drift, duplicate/missing
   identity, and a direct-call-to-indirect-call mutant. Independently review
   the ledger's coverage and claim ceiling. Select a versioned binding only
   after exact replay passes; then rerun the Auth aggregate.

## V38 bounded API execution slice (reviewed 2026-10-07)

The next candidate witness uses an isolated source mirror and a synthetic
integration-test target to send a valid in-process HTTP POST through the
selected API router. A clean normal-feature build must return HTTP 200/ALLOW;
marked builds must show request-correlated handler, concrete worker, READY
early-body, and generated-policy entry in that order. A policy-DENY mutant
must still enter both downstream bodies, while a duplicate qualifying row
must produce a **pre-gate** HTTP DENY after worker entry but before either
downstream marker. Await worker completion before interpreting silence.

Compile each variant with `cargo test --no-run --test <mirror target>` and
`--emit=mir,link`, binding the Cargo-reported test executable and selected
normal API/dependency MIR to the same artifact stream. Verify the API library
contains its `cfg(not(test))` concrete-worker branch; V7's library-only build
cannot attest this executable. The mirror's extra test file is a recorded
synthetic target, not a selected production source or original metadata hash.
V32's complete same-request MIR join is checked on the clean build; source-
constrained marked builds use selected MIR sentinel sites and dynamic markers,
not an independent V32 join. Recheck exact original source/Cargo/SQL paths and
bytes after each replay.

If this candidate passes, V11 may corroborate its existing API HTTP self row
and optionally promote only API runtime-authorize, READY-decision, and
generated-policy as existentially reachable in paired instrumented
normal-feature builds. It must not claim network listener coverage, direct
entry observation in the clean binary, all-path no-call, helper-role closure,
endpoint/effect closure, or `runtime_guarantees_observed`.

## V39 bounded policy-helper execution slice (reviewed 2026-10-07)

Use isolated no-trace mirrors of the same four selected roots to pair a clean
ALLOW replay with an instrumented normal-feature ALLOW replay. Correlate
markers to the request and require the exact short-circuit entry sequence:
`authorize`, `allow_iff`, `unique_resolved_session`, `trusted_scope`,
`session_current`, `complete_active_roles`, `exact_active_role_grant`.
`authorization_admissible` and `default_deny` are public helpers but are not
called by this selected ALLOW path; require zero markers for them without
classifying them as owner-wide ruled out. A duplicate qualifying row is a
pre-gate DENY control and must produce no policy-helper markers. Bridge
duplicate controls use isolated source overlays to insert the extra row;
the API duplicate is an input-level fixture. Neither is an unmodified-source
gate-result DENY witness.

On the API root, independently replace the result of each of the six active
Boolean helpers with false, one helper per mutant. Bind each exact source
change and its selected same-build MIR and executable, then require terminal
DENY and the corresponding truncated marker prefix. Positive direct probes
of the two uncalled helpers may validate instrumentation, but do not establish
selected-root reachability. Reject missing, duplicated, reordered, unknown,
or wrong-request markers and source/build drift. Verify original source,
Cargo, and SQL input bytes after the replay.

The V11 ledger may record these as separate per-helper execution observations
after independent review. They are not eight new endpoint-reachable rows and
do not close helper endpoint roles, indirect/effect paths, all-path no-call,
clean-binary direct entry observation, or runtime guarantees.

The optional V11 helper-observation candidate must recompute V39 locally and
pin the six-helper order and two silent-helper identities independently of
V39's trace generator. It binds unchanged root, READY, and policy source
hashes; exact mirror-only mutations; selected same-build MIR and binaries;
clean three-edge MIR handoff joins; and request-correlated decisions and marker
sequences. It returns a separate per-root observation table while preserving
the default ledger, all eight unresolved helper roles, zero endpoint
promotions, and all three false closure/runtime flags. The bridge duplicate
source overlay remains distinct from the API input-level duplicate fixture.

## V40 counterfactual normal-feature gate-DENY slice (reviewed 2026-10-07)

Use four isolated selected-root mirrors to separate three cases: clean ALLOW
with one qualifying authentication and route row; ordinary duplicate-row
pre-gate DENY with two qualifying authentication rows; and a counterfactual
duplicate-row case that relaxes only the authority's exact-one authentication
slice pattern to select the first row while forwarding both rows to the
**unchanged** generated gate. The gate must then return DENY because its
trusted-authentication occurrence count is two. Keep route cardinality exact.

In no-trace normal-feature builds, record request and epoch at the actual
authority gate result, plus qualifying-row counts before cardinality and
READY/generated-policy entry sensors. Require 1/1 and gate READY for clean
ALLOW, 2/1 with no gate-result marker for ordinary pre-gate DENY, and 2/1
with exactly one gate-result DENY and no READY/policy/helper entry for the
counterfactual. Bind each terminal API worker/bridge result to its exact
same-build Cargo executable, selected MIR, and source/Cargo/SQL inputs. The
API duplicate is an input fixture; bridge duplicates use isolated root-source
overlays. Require V30's frozen source check to reject the cardinality mutant
and verify the generated gate source and MIR remain unchanged. A gate-DENY
return-bypass hostile is useful only if a compiled run actually reaches a
downstream sensor; if later state joins prevent that, report the limitation
rather than crediting dynamic sensitivity. Reject wrong-request/epoch,
missing/duplicate/reordered markers and unexpected downstream entry.

This is a counterfactual branch witness, not evidence that an unmodified
selected root can produce gate-result DENY. It does not prove every native
decision entrypoint is silent, close indirect/Drop/unwind/SQL/FFI/external
effects, or set any V11 closure/runtime flag true.

## V41 return-sensitive selected DENY slice (reviewed 2026-10-07)

V41a is a **per-body partial slice** bound to same-build normal MIR and V40's
finite counterfactual gate-DENY control. It checks that the gate-DENY arm
assigns the authority return place once and preserves it through every local
normal return; pre-gate DENY and `ReadyStateFailed` are distinct. In the
service body it checks the authority outcome local, `epoch.finish`'s
`Try::branch`/discriminant/arm mapping, and the unchanged outcome's transfer
into `Ok` on finish success. Finish error remains a different branch. The
selected root's service-call continuation, V32 actual/formal positions, and
normal/local-cleanup effect rows are recorded, but the service outcome is **not
yet mapped to a root decision**. Calls, Drop, assertions, panic/abort/resume,
unwind edges, SQL/FFI, and external effects remain open. V40's compiled
cardinality and gate-return-bypass controls and finite runtime markers do not
prove an unmodified-production gate-DENY path or cross-body execution.

V41b remains pending: prove or explicitly bound the outcome-to-root-decision
branch for each selected root, the API `catch_unwind`/outer worker and timeout
continuation, and any downstream effects after root handling. Unknown or
indirect native effects need independent closure evidence. Until then V41 is
indeterminate and cannot set any V11 endpoint, all-path no-call, or runtime
guarantee flag true.

### V41b reviewed dependency DAG (2026-10-07)

1. In each same-build bridge MIR, bind the typed service-result local to the
   nested `Result` → `AdmissionOutcome` → `BinaryAuthorizationDecision`
   discriminants. For V42's implicit-discriminant enums, derive tag numbers from
   the exact bound variant source declaration order and check the selected MIR
   switches/downcasts; independent MIR-constructor proof remains open. Prove
   `Ok(Denied)` reaches only `false` and cannot
   reach the `Ok(Ready(Allow))` true arm; reject aliases, rebinding, merged
   writes, unknown arms, and alternate true paths. Keep cross-body execution
   unproven: V41a's per-body return and V32's argument join do not prove it.
2. Trace prototype and HTTPS separately through `Ok(false)`, `main`'s
   `unwrap_or(false)`, and JSON output. Trace tenant through its map closure,
   per-item boolean, `Vec<bool>` collection, and JSON; a whole-evaluation error
   yields `[]`, not `[false]`. Preserve each distinct Cargo/MIR/binary identity.
3. Use V40's finite gate-DENY and ALLOW controls plus an isolated, exact-anchor
   root-mapping flip mutant that leaves gate and authority unchanged yet changes
   a terminal gate-DENY decision. V42's final parser replay covers the three
   bridge roots; a later four-root replay must include the separately proved
   API branch and the flip control on final bytes.
4. Separately trace the API's non-test worker closure from non-READY service
   outcome to DENY, then `catch_unwind`, pool return, join, timeout, HTTP
   response, and terminal-worker state only where exact source/MIR/binary joins
   exist. Panic, pool error, join error, and timeout are different outcomes;
   timeout does not cancel the worker. Do not use a unit-test `cfg(test)` path
   as production-worker evidence.
5. Extend open local effect rows at each root, then pursue indirect, Drop,
   unwind, SQL/FFI, and external targets separately. No V11 endpoint,
   all-path no-call, or `runtime_guarantees_observed` promotion follows from
   these finite counterfactual slices.

The plan and independent implementation analysis were reviewed before this
candidate work. Bridge return mapping is the first runnable product frontier;
the API chain and effect closure remain dependent work, not waived work.

### V43 prototype-only finite root-oracle control (reviewed 2026-10-07)

Build two isolated normal-feature prototype mirrors from the same V40
cardinality-gate-DENY and duplicate-row overlay. The second replaces only the
unique prototype `matches!` target `Ok(Ready(Allow))` with `Ok(Denied)`.
Require exact equality for all non-root source/MIR hashes, Cargo metadata,
lock/package identity, generated gate, and the valid shared fixture/policy;
require changed root source/MIR/binary and bind each executable to its own
Cargo artifact. Generate the fixture after both builds because its expiry is
short. The expected finite contrast is baseline terminal DENY versus flipped
terminal ALLOW, with identical gate-DENY request/epoch markers and no
READY/policy entry. Use a dedicated runner because V40's bridge runner expects
DENY and would reject the intended mutant. Hostile checks reject ambiguous
anchors, input/identity drift, wrong or extra markers, malformed output, and
an unchanged decision. This is prototype-only terminal-oracle sensitivity;
it does not validate unmodified-root MIR mapping, other roots, production
gate-DENY reachability, cross-body execution, or effect closure.

### V44 API worker return DAG (reviewed 2026-10-07)

1. In the integration build's selected normal `cfg(not(test))` API **library**
   MIR, identify the unique concrete `SqliteAdmissionService::with_ready` call
   in the innermost worker mapping closure. Bind its typed result local through
   `Result`/`AdmissionOutcome` discriminants: `Ok(Denied)`, other non-READY,
   and `Err` must return `BinaryAuthorizationDecision::Deny`; only
   `Ok(Ready(decision))` may copy its decision payload. Derive tags from bound
   source declarations and check selected MIR switches/downcasts. Reject
   alias/rebind, swapped arm, unknown arm, alternate ALLOW, and return-place
   overwrite mutants. Bind source/features/package/MIR/binary/metadata/lock;
   the unit-test trait-object path is not this worker.
2. Then, in the enclosing blocking worker, separately join the inner decision
   through `catch_unwind` success and `EnginePool::put` success to `Ok(decision)`.
   Panic and pool failure are `WorkerUnavailable`/error paths, not successful
   DENY returns. Keep their effects open.
3. Separately analyze async join/timeout and HTTP response. Timeout can return
   while the worker continues; a finite response is terminal only when its
   worker-completion evidence is observed. Add a mirror-only API mapping-flip
   control later to test the output oracle's sensitivity without changing the
   gate or authority.

V44's first runnable slice is item 1, with one final API-only V40 compiled
replay after fast hostile tests. V40's finite gate-DENY/HTTP-DENY observation
corroborates but does not prove the inner closure received that exact value.
The other items remain required dependencies; no endpoint, no-call, effect,
or runtime-guarantee flag may be promoted from the first slice.

### V45 normal API blocking-worker slice (reviewed 2026-10-07)

In the same V38/V40 normal API library artifact, bind the engine returned by
`pool.take()?` and the exact request captured by V44's inner closure, through
`AssertUnwindSafe` into the unique `catch_unwind` call. Classify `pool.take`
failure as an early error, not a DENY result. On `catch_unwind` success, bind
the exact decision payload and require `EnginePool::put` of that same engine
into the same pool. Only its `Try::branch` Continue path may construct and
return `Ok(the same decision)`; Break follows a residual/error return. The
catch Err/panic branch constructs `WorkerUnavailable` and cannot reach put or
success. Derive arm identities from typed MIR downcasts/constructors, check
unique definitions and every normal return, and reject altered capture,
swapped arms, bypassed put, substituted decision, error-to-success, and
return-place mutations. Inventory local calls, Drop, cleanup, abort/terminate,
and unwind edges as open, including `unwind terminate(cleanup)`.

Fast hostile MIR fixtures precede one final API-only V40 four-variant replay
through the inspector. The claim is conditional local worker compatibility:
an inner DENY becomes worker `Ok(DENY)` only if catch and pool return succeed.
Cross-body execution, async join/timeout/HTTP, API flip, transitive effects,
production gate-DENY reachability, and all-path no-call remain unproved.

### V46 normal API async/HTTP composition DAG (reviewed 2026-10-07)

1. In each V40 API variant's same-build normal `cfg(not(test))` library MIR,
   reuse V45's inner/parent-worker receipt and bind its exact worker function
   to V11c's worker projection. Re-run V11c's selected async constructor,
   runtime Poll, handler constructor/Poll, router, `respond`, and `deny`
   projections on that artifact; never import a separately built V11c result.
   Fail closed if its layout-specific block, local, or source-marker selectors
   no longer match. Bind source/MIR/features/package/metadata/lock/test binary.
2. Require the selected `spawn_blocking` worker handle to feed the evaluation
   timeout and Poll. Only completed `Ok(Ok(Ok(decision)))` may yield runtime
   `Ok(the same decision)`; elapsed timeout yields `TimedOut`, and join/worker
   failures yield `WorkerUnavailable`. Pending remains pending. This is a
   conditional selected-MIR chain, not Tokio execution or cancellation proof.
3. For a valid parsed request, bind runtime success to HTTP 200 through
   `respond(same decision)`; `TimedOut` maps to 504/DENY and saturation or
   worker unavailability to 503/DENY. Pre-handler 415/413/400 paths remain
   separate. Run fast hostile identity, arm, alias, status, and stale-layout
   mutants before one final V40 four-variant API replay. A finite 200/DENY
   observation corroborates the chain but does not prove every execution.
4. Keep a deterministic mirror-only timeout-race/barrier control as a later
   separate slice. Timeout can precede completion of a still-running blocking
   worker; it cannot establish cancellation or downstream no-call. Cross-body
   execution semantics, effects/Drop/unwind, actual HTTP bytes, all native
   endpoints, and all closure/runtime flags remain open.

### V47 API-only finite mapping-flip control (reviewed 2026-10-07)

1. Build two isolated normal-feature API mirrors over the V40
   cardinality-gate-DENY duplicate-row case. Keep generated gate, authority,
   READY, policy, harness, Cargo metadata/lock, and logical request/seed rows
   identical. In the second mirror change only the unique `cfg(not(test))`
   inner worker's non-READY fallback from `Deny` to `Allow`; leave the
   `cfg(test)` branch and all production checkout bytes untouched.
2. Bind each Cargo-reported integration executable to its own selected normal
   API library MIR. Require exactly API source/MIR and binary hashes to differ;
   all selected non-root source/MIR, package/features, metadata/lock, and
   harness identities must match. The baseline must pass V44's DENY mapping;
   the flipped inner MIR must show the exact alternate constructor and be
   rejected by V44, without weakening V44's proof.
3. Use a dedicated runner because V40 fixes duplicate-row expectation to
   DENY. Both runs must have the same request/seed/expiry bytes and gate-DENY
   marker prefix with no READY/policy entry. Require actual HTTP 200 JSON,
   no-store header, terminal-worker metrics, and baseline DENY versus flipped
   ALLOW. The harness END marker repeats the expected value and is not an
   independent output oracle. Reject wrong/ambiguous mutation, input drift,
   marker drift, output equality, and artifact drift with fast hostile tests.
4. This proves only finite API output-oracle sensitivity to an intentionally
   invalid mirror mutation. Production gate-DENY reachability, cross-body
   execution semantics, timeout/cancellation, transitive effects, all-path
   no-call, and every V11 closure/runtime flag remain open.

### V48 finite API timeout/continuing-worker control (reviewed 2026-10-07)

1. Build one isolated normal-feature API mirror with V40's
   cardinality-relaxed authority, duplicate-row fixture, unchanged generated
   gate, and marked READY/policy. Inject a unique request-keyed worker hold
   immediately after `InFlightGuard` creation and before `pool.take`; bind
   the mirror-only API source, selected normal library MIR, Cargo-reported
   integration executable, package/features/metadata/lock, and untouched
   original checkout bytes. Do not reuse V45/V46's unmodified-source proof.
2. The test must acknowledge worker entry and held state before the HTTP
   future completes; an early response fails. Use bounded async waits and a
   generous evaluation timeout so thread startup is not mistaken for the
   intended race. While the worker is still held, require actual HTTP
   504/DENY JSON and no-store header, `timed_out=1`, `in_flight=1`, and no
   PRE/GATE/READY/policy marker. A keyed held acknowledgment, not metrics
   alone, establishes the worker's location.
3. A test-side release-on-drop guard must unblock the worker even on failure.
   After explicit release, require the request-matched PRE count=2 and gate
   DENY markers with no READY/policy entry, then worker-terminal evidence and
   `in_flight=0`. Caller allow/deny counters stay zero after timeout. Remove
   only the exact exclusively owned SQLite stage after worker termination;
   preserve it on bounded cleanup failure instead of deleting active storage.
4. Fast hostiles reject source-anchor, fixture, temporal-order, marker,
   status/body/cache/metrics, artifact-identity, and cleanup-ownership drift.
   This is one finite schedule showing a 504 response does not cancel an
   already-started blocking worker. Production gate-DENY reachability,
   all-schedule cancellation semantics, effects, all-path no-call, and every
   V11 closure/runtime flag remain open.

## Construction and operational separation


- Runnable product work: ledger parser/identity tests, selected normal-closure
  replay, handoff witnesses, hostile mutants, independent review, and binding.
- Operational tasks: none authorized in this slice. Owners for live Auth,
  deployment, publication, keys, and databases remain outside it.
- Affected stages: this candidate ledger and, only after review, the selected
  Auth technical evidence stage. The current trusted-input/D65 sidecar and
  D65 admission stay separate and unchanged. Historical bindings remain
  protected.
- Causal blockers: unknown native call/effect edges block endpoint closure
  and no-call proof, but do not block construction of a conservative ledger.
- Deferred residue: immutable/external compiler inputs, runtime all-path
  observation, TDE/F5/EVF claim satisfaction, live deployment, and publication.

## Open Questions

- Which legacy SQLite/resolved-runtime functions can be ruled out for each
  selected normal closure, and which remain unresolved through opaque effects?
- What compiled source mutants and runtime witnesses will discharge the
  remaining indirect, Drop, unwind, SQL/FFI, and request-identity obligations?
