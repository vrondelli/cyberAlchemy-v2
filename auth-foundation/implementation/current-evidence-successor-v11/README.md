# Auth native decision-entrypoint ledger (unselected candidate)

`validate-current-evidence-successor-v11.py --classify` reads the current
native syntax inventory and produces a conservative per-root summary. The
candidate pins its 22 known IDs, treats eight generated Boolean helpers as
role-unresolved, and records whether each function's local package appears in
the inventory's exact normal Cargo closure. Apart from the selected public
entrypoint itself, every owner-scope call/effect path remains unresolved.

The candidate now separately replays `cargo metadata --locked --offline` for
each public root, walks normal dependency edges, compares the resulting local
manifest set with the syntax inventory, and pins the exact endpoint, generated
helper, full regular-Rust-file source-set, existing symlink-path set,
parser/inventory/compiled-operation-graph input, and Cargo
package/feature/target identity digests in the checker. A changed signature,
cfg, source hash, local package, feature, or target fails the frozen check.
`--ledger` emits the full candidate per-ID/per-root classification for review.
`--authority-identity` rechecks the frozen Rust source set, compiles the
current authority crate's normal MIR, and checks a local transfer: inbound
request-ID field clone to command to private READY, with the same epoch ID and
decision-time parameters. Its five transfer sites dominate READY construction
in that body's bounded normal CFG, and the constructed READY local is the
sole callback argument. Six **synthetic MIR text** mutants test
parser rejection; compiled Rust hostile-source variants remain open. This is
a **local-body** witness: it does not prove the caller's values reached these
parameters, cross-crate execution, unwind/implicit effects, or absence of
other native decision calls. Its MIR and two parser/checker instruments are
pinned as candidate identities.
This is a candidate baseline inside the checker, not a selected v11 evidence
binding or an independently closed call graph. The Cargo traversal is a
normal-dependency metadata union: it does not evaluate every target predicate
or establish active `cfg(not(test))` compiler units, nor which indirect or
external effects can call a decision entrypoint. The two existing `.runtime`
symlinks are pinned by path but their targets are not traversed or proven
harmless; their effect remains unresolved.

An additional unselected [V28 capability-cut candidate](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-native-capability-cut-v28.py)
composes the existing V7 package/policy-ingress boundary and V27 pre-READY
effect inventory with a fully qualified compiled-local MIR READY-decision
reference census. A fresh four-root replay passed: each root has exactly one
such typed function-item reference in its selected handoff; known legacy raw-decision packages remain
outside each resolved local closure; the generated policy's only direct
normal Cargo predecessor remains READY decision. Nine focused controls pass,
including three **standalone compiled external-crate Rust variants** for a
direct bypass, cfg-only bypass, and function-pointer bypass. These are not
selected-root source overlays. The V27 open effect-site inventory remains
nonempty (API 113, tenant 125, prototype and HTTPS 228 each); the counts are
inventory rows, not path counts. V28 is not a v11 binding or an all-path
no-call proof. rustc can abbreviate semantic target names; the exact-name
scan is not exhaustive. Opaque and cross-crate effects, broader compiled
selected-root hostile coverage, and runtime observation remain open.

The unselected [V29 isolated root-overlay harness](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-selected-root-overlay-v29.py)
now supplies the first real-root compiled controls. It mirrors only bounded
Cargo inputs, `src` files, and three SQL inputs into a temporary directory;
the original selected paths are re-enumerated and rehashed afterward. Four
clean root mirrors compiled and passed the composed candidate; four hostile
mirrors each emitted **two** fully qualified READY-decision references and
were rejected by V28 for the expected count change. A separate clean API
mirror and callback-replacement mutant compiled; its **zero** references were
rejected by the composed V9 handoff check, not V28's standalone census. Six
fast harness tests pass. Run the compiled control with
`python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-selected-root-overlay-v29.py --root all --variant extra-reference`.
These mutants test detection only: they do not construct a gate-result DENY,
observe a live request, close abbreviated/indirect targets, or justify v11
selection. Active-cfg, raw-package, DENY-arm callback, and identity-swap
selected-root mutants remain to be built.

This is only an executable inventory slice of [PLAN.md](PLAN.md). It
does **not** resolve the admission-to-READY callback, cross-crate effects,
indirect dispatch, Drop/unwind, SQL/FFI, or runtime behavior. There is no v11
binding, aggregate selection, endpoint closure, all-path READY dominance, or
runtime guarantee. Package absence is a scoped static fact, not a machine
`ruled_out` state for owner-scope reachability. The endpoint and closure
fingerprints are frozen as candidate constants, but versioned binding and
selected aggregate replay still await the handoff and effect-path review.

The unselected [V30 gate implication candidate](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-gate-deny-implication-v30.py)
checks a narrower fact: in the frozen selected authority and generated gate,
any normal invocation that reaches the gate has already selected exactly one
qualifying authentication-row occurrence and route-row occurrence; the gate
context maps the same snapshot and request, and the candidate copies values
from those selected rows. Thus the generated gate's uniqueness and provenance
predicates imply READY. This is a source-model implication tied to full source
hashes and local normal MIR hashes, **not** a constructive gate-result DENY
witness or a proof that all four public roots reach this exact body. Three
focused tests pass; isolated compiled authority mutants that weaken
cardinality, row qualification, and same-row provenance each changed MIR and
were rejected by the structural check. Run the hostile replay with
`python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-gate-deny-implication-v30.py --compiled-hostiles`.
Existing duplicate/expired/disabled-row DENYs are pre-gate outcomes and must
not be reported as gate-result DENYs. The candidate retains all three closure
and runtime flags false and does not observe every native decision entrypoint.

The unselected [V31 selected-root identity-swap control](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-ready-identity-overlay-v31.py)
mirrors the selected API Cargo closure, compiles its clean authority MIR, then
changes only the mirror's `AuthorizationCommand.request_id` source from the
inbound request ID to the route ID and compiles the same root again. The clean
MIR passes V11's local transfer witness. The hostile MIR independently shows
the route-ID field projection feeding the command request-ID field, changes
from the clean selected-root MIR, and fails V11 specifically at its
request/epoch READY-transfer check. Two focused tests pass. The selected-root
MIR hash differs from the standalone authority-crate MIR hash, so this control
compares clean and hostile builds in the same root instead of treating those
different compilation contexts as byte-identical. Run the compiled control
with `python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-ready-identity-overlay-v31.py`.
This is detection evidence only, not cross-crate value-flow proof, live DENY or
no-call observation, endpoint closure, or V11 selection.

The unselected [V32 same-build argument join](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-same-request-handoff-v32.py)
compiled all four selected public roots and joined their root-local request
and reified READY callback actuals to the admission service's request and
callback formals. It then checked the service's transaction-bound request,
epoch, time, and callback actuals against the authority's parameter positions;
the existing V11 local witness checked the authority's request-ID transfer
into the constructed READY value consumed by its callback. The checker records
the four same-build MIR identities for each root. API's request is captured
from its worker closure; each bridge constructs its own inbound request.
Four focused argument-parser tests pass. Run the four-root replay with
`python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-same-request-handoff-v32.py`.
This is a normal-MIR actual/formal join, not proof that each cross-crate call
executed, that bridge request fields came from the external caller unchanged,
or that indirect/effect paths cannot reach another native decision entrypoint.
V11 remains unselected and all closure/runtime flags remain false.

The unselected [V33 compiled API request-corruption control](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-api-request-provenance-overlay-v33.py)
uses V29's bounded selected-root mirror. The clean API root compiles and
passes V32. In the hostile mirror, the worker clones the route ID into the
request-ID field before calling `with_ready`. The hostile root also compiles;
an independent MIR check follows the route-ID clone, request-ID field write,
and moved request into that call on the selected normal path. Only then does
the control require V32's exact `api: captured inbound request source changed`
rejection. Three focused tests pass. The source/Cargo/SQL path set and bytes
of the original checkout are rechecked unchanged. An unwind cleanup block
duplicates the field write in MIR, so the independent checker counts parsed
normal blocks rather than all textual occurrences. V32's rejection is
topology-sensitive; it does not prove semantic request equality, cross-crate
execution, or the owner-wide no-call rule. V11 remains unselected.

The unselected [V34 gate/READY composition](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-gate-ready-join-v34.py)
binds V30's frozen authority/gate source model to V32's same-build normal-MIR
request/callback joins for all four selected public roots. Its three fast
controls pass, and the four-root compiled replay passes. The composition
checks that the source model's gate context uses the authority request whose
formal position is joined back to each selected root's request actual; it
retains the per-root MIR identities and rechecks source hashes after capture.
Run it with `python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-gate-ready-join-v34.py`.
This does not establish cross-crate execution, semantic value equality,
indirect/effect closure, runtime no-call observation, or V11 selection. All
three closure/runtime flags remain false.

The unselected [V35 bridge DENY observation](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-bridge-deny-observation-v35.py)
compiles disposable trace-feature mirrors of all three selected bridges. For
each bridge, the clean request yields READY and one policy-call wrapper trace;
an overlay that inserts a second qualifying authentication row before the
service takes its read-only connection yields an **early pre-gate** DENY with
only `EpochOpened`. A separate generated-gate mutant forces the otherwise
unreachable gate-DENY branch and yields `EpochOpened, GateDenied`, with no
READY-decision or policy-call wrapper event. The frozen V30 gate model rejects
that mutant, and original source/Cargo/SQL path sets and bytes are rechecked.
Three fast parser/mutation tests and the nine compiled bridge observations
pass. A read-only review found a permissive trace parser and weak mirrored
build attestation; the final replay exhaustively parses each event list,
rechecks each mirror's exact source bytes after building, and records distinct
binary hashes for clean and hostile variants. This is finite opt-in wrapper
observation, not normal-build equivalence,
all-native endpoint closure, or selected-source gate-DENY reachability. V11
remains unselected and all three closure/runtime flags remain false.

The unselected [V36 normal-feature bridge reachability witness](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-normal-bridge-reachability-v36.py)
uses a disposable mirror for each bridge. For each root, one Cargo build emits
both the V32-checked normal MIR and the exact executable identified by Cargo's
root artifact row. A fresh valid fixture returns ALLOW. A separately compiled
callback-replacement mutant emits a unique callback-entry marker exactly once,
returns DENY, and is rejected by V32 at the READY callback target. Exact
mirror path/bytes are checked after both builds, the clean/mutant binaries
and root MIR differ, and the original checkout is rechecked unchanged. Seven
focused V36 tests and the compiled three-root replay pass.

V11's optional `--bridge-reachable-candidate` mode recomputes V36 locally,
then promotes only tenant/prototype/HTTPS × `admission-service-with-ready` to
existential `reachable`. Its 12 focused validator tests and the full optional
CLI replay pass. Admission is a **pre-decision** entrypoint, not a downstream
authorization call under the owner scope. The ordinary V11 ledger remains
conservative; no downstream row is promoted, no row is ruled out, V11 remains
unselected, and all three closure/runtime flags remain false.

The unselected [V37 paired downstream witness](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-normal-downstream-reachability-v37.py)
compiles clean, marked, policy-DENY, and duplicate-row pre-gate DENY mirrors
for each of tenant, prototype, and HTTPS without the trace feature. The
marked binary records one request-correlated READY-decision early-body marker
followed by one generated-policy entry marker while preserving the clean
ALLOW result. The policy mutant flips that result to DENY while still
emitting both markers; the duplicate-row variant denies before either marker.
Cargo artifact rows bind each executable to the same build as its selected
MIR, and source/Cargo/SQL bytes are checked unchanged in the original tree.
These are finite observations of instrumented normal-feature binaries paired
with clean ALLOW, **not** direct entry observations in the clean executable.

V11's optional `--downstream-reachable-candidate` mode recomputes V37 and may
promote only the six tenant/prototype/HTTPS × READY-decision/generated-policy
rows as existentially reachable under that paired witness. The ordinary V11
ledger stays unchanged. Four focused V37 tests, all 13 V11 validator tests,
and the final-byte optional CLI replay pass. Neither mode establishes API
coverage, all-path DENY no-call, generated-helper roles, endpoint/effect closure, V11 selection,
or `runtime_guarantees_observed`.

The unselected [V38 API HTTP witness](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-normal-api-reachability-v38.py)
uses an isolated selected-source mirror plus a mirror-only integration-test
target. It sends a valid in-process POST through the API router and checks
the terminal response and worker metrics. A clean no-trace build returns
ALLOW. Marked no-trace builds record one request-correlated handler, runtime,
concrete worker, READY early-body, and generated-policy marker in order. A
duplicate qualifying authentication row returns a **pre-gate** DENY after
worker entry but before READY/policy; a policy mutant reaches those bodies
and returns DENY. Each executed test binary and the selected API/downstream
MIR are bound to one Cargo artifact stream; only the clean build receives
V32's full same-request MIR join. The fixture database lives in an exclusively
created test-owned directory. Original selected source/Cargo/SQL bytes remain
unchanged.

V11's optional `--api-reachable-candidate` mode recomputes V38, corroborates
the existing HTTP self row, and promotes only API runtime-authorize,
READY-decision, and generated-policy as existentially reachable. The final
three-variant V38 replay, seven focused V38 tests, all 14 V11 tests, and the
final-byte optional API replay pass. This does
not observe entry in the unmodified clean binary or a real network listener,
and it does not establish all-path DENY no-call, helper-role closure,
endpoint/effect closure, V11 selection, or `runtime_guarantees_observed`.

The unselected [V39 normal policy-helper witness](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-normal-policy-helper-v39.py)
replays clean and marked no-trace builds for all four selected roots. The
marked ALLOW path records `authorize` and six Boolean helpers in their exact
short-circuit entry order. API-only false-return mutants, one per active
helper, return DENY with the corresponding truncated trace. The two other
public helpers, `authorization_admissible` and `default_deny`, are instrumented
but silent in these selected cases; they are not globally ruled out. API's
duplicate row is an input-level pre-gate DENY; bridge duplicates use isolated
source overlays to insert the extra row. Neither is a gate-result DENY
witness. The clean API and bridge MIR handoffs are checked with V32, and each
executed binary is bound to its selected same-build MIR. The final-byte
four-root compiled replay and seven focused fast tests pass; original selected
source/Cargo/SQL paths and bytes remain unchanged. V11 has no helper-role
promotion mode yet and its default ledger is unchanged. Run the witness with
`python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-normal-policy-helper-v39.py`.

V39 establishes finite selected-flow helper entry and API-root causal
influence, not independent business endpoint roles, a clean-binary entry
observation, all-path no-call, effect closure, V11 selection, or
`runtime_guarantees_observed`.

V11's optional `--helper-observation-candidate` mode recomputes V39 locally
and validates the source, Cargo, selected MIR, executable, decision, and
request-correlated marker relationships. It pins the six-helper trace order
independently of V39's trace generator and reports a separate eight-helper
observation table for each root. The two silent helpers are labeled only
`not_observed_in_finite_case`; all eight retain
`candidate/helper-unresolved` roles. The ordinary V11 ledger and its 22
endpoint rows are unchanged; the optional mode promotes no rows and leaves
all closure/runtime flags false. Its final four-root CLI replay, 15 V11 fast
tests, and seven V39 fast tests pass. Run it with
`python3 auth-foundation/implementation/scripts/validate-current-evidence-successor-v11.py --helper-observation-candidate`.

The unselected [V40 normal-feature gate-DENY witness](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-normal-gate-deny-v40.py)
compiles isolated copies of all four selected roots. A marked ALLOW case
reaches the gate with one qualifying authentication row and one route row;
an ordinary duplicate authentication row returns pre-gate DENY. An exact
authority-only cardinality mutant lets that duplicate reach the **unchanged**
generated gate, which returns DENY with two qualifying authentication rows.
The counterfactual DENY emits no READY or generated-policy entry markers.
All nine public policy bodies have compiled marker sites, but the ALLOW trace
enters `authorize` and only the six active Boolean helpers. The API's
in-process HTTP test reaches a terminal response with no worker in flight;
it does not add an independently marked HTTP-to-worker chain. A separate API
return-bypass mutant observes gate DENY followed by READY and policy entry,
showing sensitivity of those downstream sensors. V30 rejects the exact
cardinality mutant by name on uninstrumented source. The generated gate
source and selected MIR remain identical across each root's variants, and
original selected source/Cargo/SQL paths and bytes are unchanged. The final
four-root compiled replay and eight fast tests pass.

V40 is a finite **counterfactual** branch test. It is not a selected-source
gate-result DENY witness and does not prove branch unreachability, every
native decision entrypoint's silence, all-path no-call, effect closure,
V11 selection, or `runtime_guarantees_observed`.

The unselected [V41a DENY return/effect slice](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-deny-return-effect-slice-v41.py)
uses V40's same-build clean, marked, cardinality-gate-DENY, and intentional
gate-bypass variants for API, tenant, prototype, and HTTPS. On the generated
gate-DENY arm it checks that the authority's `Denied` return place remains
unchanged through every normal return. In the separate admission-service MIR,
it checks that the authority outcome is moved into `Ok(outcome)` only through
the `epoch.finish()` success arm; finish-error and local cleanup/effect edges
remain explicit and open. The intentional bypass control has no applicable
gate-DENY slice. Its final 22 hostile tests and four-root compiled replay pass;
independent review accepted this bounded per-body candidate. Run it with
`python3 auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-deny-return-effect-slice-v41.py`.

V41a does not join the returned value through each root's final decision,
prove cross-body execution, cover API's outer worker/timeout path, or close
Drop, unwind, SQL, FFI, indirect, and external effects. Those are V41b/open
obligations. The ordinary V11 ledger and all closure/runtime flags remain
unchanged and false.

The unselected [V42 bridge DENY mapping](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-bridge-deny-mapping-v42.py)
extends this candidate to prototype, HTTPS, and tenant. It binds each
variant's source snapshot and compiled MIR, then checks the local nested
`Result`/`AdmissionOutcome`/decision branches that map a service `Ok(Denied)`
to `false`. Prototype and HTTPS have separate main/JSON compatibility checks;
tenant has a separate map/collect/vector check, with whole-evaluation error
falling back to an empty vector. Sixteen hostile tests and the final
three-root, four-variant compiled replay pass; independent review accepted
this narrow candidate. Terminal print-value def-use, cross-body execution,
all-root mapping sensitivity, API worker/timeout mapping, and transitive
effects remain open. V11 closure/runtime flags stay false.

The unselected [V43 prototype root-flip control](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-root-flip-control-v43.py)
builds two exact mirrors of the counterfactual gate-DENY case. Only the
prototype bridge match target changes. Both binaries emit the same correlated
gate-DENY trace with no READY/policy entry; the baseline returns DENY and the
root-flipped binary returns ALLOW on the same expiry-checked input. Non-root
source/MIR and Cargo identities match, while root MIR and binary identities
differ. Six hostile tests and the final two-build replay pass; independent
review accepted only prototype terminal-oracle sensitivity. This does not
complete V41b for HTTPS, tenant, or API, prove production gate-DENY
reachability, or change any V11 closure/runtime flag.

The unselected [V44 API inner-worker DENY mapping](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-api-inner-deny-mapping-v44.py)
checks the normal `cfg(not(test))` API library MIR emitted by the V38/V40
integration build. It binds the concrete `with_ready` result to the inner
worker closure's branches: `Err` and non-READY, including `Ok(Denied)`,
return local DENY; only `Ok(Ready(decision))` copies the decision. The selected
library artifact, source/features/package/MIR, integration-test binary, and
variant snapshots are bound. Eight hostile tests and a final four-variant
API compiled replay pass; independent review accepted only this conditional
local mapping. The enclosing `catch_unwind`/pool worker, async timeout,
HTTP result chain, API mapping-flip control, and transitive effects remain
open, and all V11 closure/runtime flags stay false.

The unselected [V45 API blocking-worker slice](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-api-parent-worker-v45.py)
checks the same normal API library MIR around `pool.take`, inner-closure
capture, `catch_unwind`, and `EnginePool::put`. A catch-success decision reaches
worker `Ok(the same decision)` only when pool return succeeds; take failure,
catch panic, and put failure take distinct error paths. Local cleanup and
unwind effects remain open. Twenty-seven hostile tests and a final four-variant
API replay pass, and independent review accepted this conditional per-body
candidate. It does not prove that V44's value crossed the catch boundary at
runtime, that an async caller received the worker result, or that timeout,
HTTP, all-path no-call, or transitive effects are closed. All V11
closure/runtime flags remain false.

The unselected [V46 API async/HTTP composition](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-api-async-http-v46.py)
reuses V45 and V11c selectors on each V40 API variant's same-build normal
library MIR. It binds the blocking worker to the selected async constructor,
JoinHandle/timeout Poll, runtime result, handler constructor/Poll, public route,
and response helpers. Fourteen hostile tests and a final four-variant API
compiled replay pass; an independent review accepted the repaired bounded
candidate. Only a worker that completes successfully before timeout can carry
its decision through the selected runtime and valid-request HTTP 200 response
path. Timeout maps to 504/DENY; saturation or worker unavailability maps to
503/DENY. The finite gate-DENY/HTTP-DENY observation corroborates but does not
prove this inter-body execution for every request. Tokio cancellation,
Axum/serde execution and actual bytes, transitive effects, all-path no-call,
and endpoint closure remain open; all V11 closure/runtime flags stay false.

The unselected [V47 API mapping-flip control](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-api-flip-control-v47.py)
builds two isolated normal-feature API mirrors for the same counterfactual
cardinality-gate-DENY duplicate case. Only the normal API worker's non-READY
fallback changes from DENY to ALLOW. Non-API source/MIR, generated gate,
harness, Cargo metadata/lock/package/features, and logical fixture/expiry
match; the API source/MIR and executable differ. Both runs retain the same
gate-DENY/no-READY marker prefix, while actual in-process HTTP assertions pass
for 200/DENY versus 200/ALLOW, including JSON, cache header, and terminal
worker metrics. V44 accepts the baseline, rejects the flip at its DENY
constructor, and accepts a diagnostic MIR copy with only that constructor
restored. Nine hostile tests and the final two-build replay pass; independent
review accepted only finite API output-oracle sensitivity. The END marker
repeats the expected value and is not independent output evidence. Production
gate-DENY reachability, cross-body execution, effects, all-path no-call, and
all V11 closure/runtime flags remain open.

The unselected [V48 API timeout/continuing-worker control](../../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/auth-v4b-api-timeout-race-v48.py)
uses one isolated normal-feature API mirror with a request-keyed hold after
the worker enters and before `pool.take`. In a compiled replay, the hold is
acknowledged before the HTTP response; while it remains held, the response is
504/DENY with no-store, `timed_out=1`, `in_flight=1`, no gate marker, and zero
caller decision counters. After test-side release, the same request emits
the counterfactual PRE count=2 and gate-DENY markers, then the worker becomes
terminal without changing those caller counters. Eight hostile tests and the
final compiled replay pass; independent review accepted this finite schedule.
On failure, a release-on-drop guard unblocks the worker and the owned SQLite
stage is retained rather than deleted without terminal evidence. This does
not prove production gate-DENY reachability, cancellation behavior for every
schedule, effects, all-path no-call, or any V11 closure/runtime flag.

## Open Questions

- How can the eight generated-helper business endpoint roles be classified
  beyond V39's finite selected-flow entry observations, without assuming that
  normal-package membership or silence proves execution or exclusion?
- Which hostile source mutants can be rejected before a v11 binding is
  selected, including an indirect replacement of a direct call?
- Can selected-root compiled overlays and linked-artifact evidence rule out
  bypasses that a local MIR symbol census or Cargo capability cut cannot see?
