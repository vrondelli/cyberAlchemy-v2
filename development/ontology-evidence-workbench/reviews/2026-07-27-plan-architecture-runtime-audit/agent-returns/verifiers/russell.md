# Russell verifier return

## INITIAL VERDICT

**REVISE.** The candidate correctly rejects current option A and preserves the
authority ceiling, but it double-counts one planning defect, inflates two
fail-closed blockers to CRITICAL, and overstates browser ownership absence.
Current bytes show a stopped chain, not unauthorized L1 mutation:
`swu-manifest.json` has `selected_swu:"SWU-OEW-007"` and
`mutationRuntimeReady:false`; `chain-state.json` has
`status:"stopped-blocker"` and `current_expected_selector:null`; the local
decision has `Selected option: none`. A review recommendation is not approval
of B, expanded A, refresh, reselection, or execution.

All quoted paths in the candidate exist. The selected inventory was checked
literally: none of SWU-OEW-007--014 owns the live OEW `package.json`, an OEW L1
lock, a package-manager/browser provisioner, or an independent L1 receipt
verifier. SWU-007 does own overlay manifest/patch/store/test targets; SWU-014
does own browser specs, runner, screenshots, schema, and browser receipt.

## Finding-by-finding falsification

### F1 — “no governed owner for an executable L1 lifecycle”

**No objection to the underlying defect; objection to CRITICAL severity and
the implied single lifecycle owner. Corrected severity: MAJOR.**

The missing scripts are only the visible preflight witness. The target
inventories leave package/lock provisioning, source materialization for a
mutable overlay tree, patch application, typed build production, cache/network
mode, and shared cleanup without a temporally ordered L1 owner. That makes the
plan non-executable, but the existing gate detected it before mutation, so no
S0 authority or integrity breach is evidenced.

Repair: Invoke Refresh must assign **one temporal owner per mutation**, not one
self-attesting mega-owner:

1. the existing L0 upstream owner produces and verifies the immutable pinned
   source/viewer inputs;
2. one private OEW bootstrap/build owner materializes a fresh tree, applies
   verified patch preimages, provisions the exact effective package/lock and
   toolchain, runs typed unit/build entrypoints, emits an immutable build
   handle, and cleans its own residue;
3. SWU-007--013 own only their declared feature mutations;
4. SWU-014 owns browser process execution against that admitted build handle;
5. a distinct evidence owner recomputes acceptance from bound inputs and
   outputs.

The exact evidence graph must remain the source lane; the presentation graph
and sidecar are outputs, never a replacement proof graph.

### F2 — “blocked 007 selection cannot authorize a repaired graph”

**No objection to the claim; objection to CRITICAL severity. Corrected
severity: MAJOR governance blocker.**

The candidate is right that selection cannot transfer. The earlier series
selection selected the frozen 007--014 graph, while the later seam decision
selected nothing. Expanding 007 targets/dependencies or inserting B changes
the plan bytes and invalidates use of the old selection for mutation. However,
current controls already stop execution, so this is not evidence of a current
critical breach.

Repair: preserve the block and selection receipts as historical evidence;
refresh the exact graph; obtain Plan-owner approval; then obtain a new explicit
human selection and a fresh Task Session preflight. Do not describe this review
as selecting B or expanded A.

### F3 — “Current A assigns shared files, not the required runtime contract”

**Objection: DROP as a separate finding.**

The quotes are accurate: A adds `package.json` and one runner, while
`UPSTREAM.lock.json` pins the upstream pnpm/lockfile but is not an effective OEW
L1 overlay lock. Nevertheless this is the same unowned-lifecycle defect as F1,
not an independent defect. Keeping both inflates count and severity.

Repair is already contained in F1: current A is inadmissible; an “expanded A”
survives only if it owns the same complete temporal contract as B and is
refreshed, approved, and newly selected.

### F4 — “L0 preparation is reusable mechanics but temporally insufficient L1 evidence”

**No objection. Corrected severity: MAJOR claim-boundary risk, not an L0
defect.**

`prepare-upstream.mjs` owns a fresh temporary clone, exact commit/file checks,
pnpm `10.6.2`, frozen upstream lock installation, upstream tests/build,
deterministic archives, and `finally` cleanup. The retained receipt records
those historical producer actions and `authority_effect:"none"`. Current
`verify:upstream` can verify retained bytes; it does not rerun the recorded
network-capable install/build and cannot make that historical execution current
L1 evidence. Workspace caches or installed binaries are environmental facts,
not an OEW pin.

Repair: keep L0 unchanged and name a new L1 receipt schema binding immutable L0
inputs, overlay/package/effective-lock/tool digests, declared cache/network
mode, build outputs, and residue. Its evidence owner must independently
recompute the acceptance predicates it claims.

### F5 — “Browser lifecycle and independent L1 acceptance are unowned”

**Partial objection. Corrected severity: MAJOR; narrow the finding.**

SWU-OEW-014 and `TASK-OEW-VALIDATION-001.md` already assign browser specs,
runner, receipt, screenshots, and a browser execution owner. Therefore
“browser lifecycle is unowned” is false as written. What remains unowned is
the exact browser/package pin and provisioning boundary, minimal environment,
cache/network mode, explicit child-process/port teardown evidence, immutable
build-handle input, and a verifier distinct from the producer-authored run.
Poker-Team's `reuseExistingServer`, inherited environment, caret dependencies,
and broad `pgrep -f` cleanup are consumer conventions, not reusable OEW
authority.

Repair: refresh 014 to consume only the verified build handle and own exact
browser binaries, ports/PIDs, environment, outbound assertions, and `finally`
teardown; assign receipt acceptance to a separate fail-closed verifier.

### F6 — “Reuse candidates are not governed OEW runtime owners”

**No objection to the boundary; objection to MINOR as a defect. Reclassify as
an invariant/route constraint, not a finding.**

Inventory runtime receipts are evidence for that public Inventory runtime only;
its work pack even leaves currentness verification unresolved. Experiment
Harness is a different public capability. OCGP receipts prove finite candidate
bundle behavior with `authority_effect:"none"`. Poker-Team is a consumer.
Neither their receipts nor workspace browser caches transfer ownership to OEW.

Repair constraint: public Arcanum may own only generic, domain-free
manifest/digest/phase/receipt mechanics. Every OEW path, upstream binding,
overlay, dependency pin, cache/network rule, fixture, and receipt remains in a
private `cyberAlchemy-v2` adapter. No private OEW binding may be copied into
public Arcanum.

## Route verdicts

- **B:** no scope objection as the clearest dependency shape, but it is only a
  review recommendation. It needs refreshed targets, approval, and selection.
- **Expanded A:** viable in principle, but not smaller in contractual scope;
  it risks mixing bootstrap and UI-store mutation. It has no authority until
  refreshed and selected.
- **Private adapter over generic Arcanum mechanics:** admissible only as an
  implementation technique inside A or B; never OEW authority by inheritance.
- **Existing L0 prepare-upstream:** admitted only as immutable input
  preparation/verification mechanics, not an L1 runner.
- **Node-native C:** admissible only after an explicit contract-wide evidence
  downgrade; it cannot satisfy the current React/component/browser claims.
- **Current A:** reject as incomplete.
- **D / stop at L0:** currently the only route requiring no new mutation
  authority.

## Claim-safe smallest surviving route

The smallest surviving **change request**, not approved plan, is: keep the
current L0 pin/archive/verifier intact; ask Invoke Refresh to add exactly one
private OEW bootstrap/build interface (packaged as B, or expanded A only if the
Plan owner proves identical scope), leave feature mutation with 007--013, make
014 consume the immutable build handle and own browser processes, and assign a
separate verifier as evidence owner. Then require Plan approval, selection
invalidation, new explicit selection, and Task Session preflight. The maximum
claim is automated L1 build/browser evidence with `authority_effect:none`;
manual UX, ontology correctness/admission, promotion, publication, release,
production, and exact-evidence/presentation equivalence beyond the declared
sidecar oracles remain unproved.

## PEER EXCHANGE CAPSULE

I expect Capucci may show that pinned source mechanics or typed commands can
execute in a fresh temporary tree. That can falsify “a wholly new runtime is
technically necessary,” but it cannot falsify the ownership defect: executable
mechanics become admissible only when a refreshed private owner binds exact
inputs, effective lock/tool/browser pins, cache/network mode, isolated outputs,
cleanup, and independently recomputable receipts. Conversely, I withdraw any
text-only claim that B is technically required: expanded A can be equivalent
if its complete contract is literally identical. We should jointly drop F3,
demote F1/F2 to MAJOR because the blocker is working, narrow F5 to provisioning
and independent acceptance, and move F6 from finding to invariant. Neither of
us should call a successful fresh run plan approval, selection, reusable OEW
authority, or evidence above `authority_effect:none`.

## POST-ROBOT-TALK FINAL VERDICT

**REVISE, with no route change.** I agree with Capucci's executable facts:

- the pinned source already declares pnpm `10.6.2`, dashboard `vitest run`, and
  `tsc -b && vite build`; therefore “missing OEW scripts means the runtime or
  toolchain must be invented” is refuted;
- a clean extraction has no installed dependencies and exits 1 for absent
  `vitest`/`tsc`; therefore those entrypoints do not supply an executable L1
  lifecycle without an installation owner;
- normal Corepack failed while direct use of cached pnpm `10.6.2` succeeded;
  this is environmental feasibility evidence, never an OEW binary pin,
  provisioner, or reproducibility claim;
- current L0 verification passes 6/6 over retained bytes, but does not rerun
  the historical network/cache-capable install and build or test an overlay;
- Inventory canonical mechanics pass 47/47 and its isolated-consumer test
  passes 7/7, while live `.arcanum/inventory` sync is drifted with seven managed
  paths missing; this proves current generic source behavior, not installed
  consumer currentness or OEW ownership;
- Poker-Team's Playwright package, installed executable, and browser caches are
  consumer-local and cannot be inherited by OEW.

### Final finding dispositions

1. **F1 — NO OBJECTION to the defect; retain MAJOR.** Capucci falsifies only
   the broad runtime-absence interpretation. The surviving defect is the
   missing governed materialize/install/overlay/test/build/cleanup/verify
   lifecycle. I disagree with Capucci's CRITICAL rating: the current plan is
   non-executable, but its preflight and chain controls stopped before mutation,
   so the evidence supports a major plan-execution blocker, not a realized S0
   integrity or authority failure.
2. **F2 — NO OBJECTION to non-transferability; retain MAJOR.** I agree that no
   executable counterexample can transfer selection across changed targets or
   dependencies. I disagree with CRITICAL for the same reason: the live chain
   has already invalidated mutation admission and routes to a decision gate.
   Any attempt to execute after graph repair without refresh, approval, new
   selection, and preflight would be critical; that attempt is not evidenced.
3. **F3 — OBJECTION; DROP as duplicate.** Capucci's clean-extraction evidence
   strengthens F1 but does not create a second underlying defect. Fold the
   accurate current-A counterexample into F1.
4. **F4 — NO OBJECTION; retain MAJOR claim-boundary risk.** Revise wording to
   distinguish fresh 6/6 retained-byte verification from the historical
   producer actions recorded in the L0 receipt. Neither state is L1 evidence.
5. **F5 — PARTIAL OBJECTION; retain MAJOR after narrowing.** SWU-014 already
   owns the planned browser runner/specs/receipt. The surviving gap is exact
   OEW package/browser provisioning, immutable build-handle consumption,
   minimal environment, owned PID/port teardown evidence, cache/network policy,
   and independent receipt acceptance. Poker-Team is evidence for none of
   those ownership claims.
6. **F6 — OBJECTION as a defect; move to invariant/route constraint.** Amend
   its evidence: Inventory canonical mechanics are current, but this installed
   consumer projection is drifted. The conclusion remains that Inventory,
   Experiment Harness, OCGP, Poker-Team, workspace dependencies, and caches
   confer no OEW authority. This is a reuse boundary, not a separate OEW
   failure.

### Exact synthesis revisions

- Replace F1's implication that the typed runtime is absent with: “Pinned
  upstream Vitest/Vite/TypeScript entrypoints exist, but the current OEW plan
  has no owner-complete lifecycle that installs and runs them against the
  private overlay from clean inputs.”
- Change F1 and F2 severities from CRITICAL to MAJOR.
- Delete standalone F3 and incorporate its `package.json`/effective-lock/clean
  extraction evidence into F1.
- In F4, state that `verify:upstream` is a fresh 6/6 verification of retained
  L0 bytes, while install/test/build are historical receipt claims; do not call
  either stale and do not promote either to L1.
- Rename F5 to “OEW browser provisioning, teardown evidence, and independent
  L1 acceptance are unowned”; preserve SWU-014 as browser execution owner.
- Remove F6 from severity-ranked findings and preserve it as a mandatory reuse
  constraint. Record Inventory's passing canonical tests and drifted installed
  sync explicitly.
- In the route matrix, keep B rank 1 only as the clearest review
  recommendation, not as technically required or approved. Keep expanded A
  viable only with an identical complete contract. Treat the private Arcanum
  adapter as a component, L0 preparation as an input seam, current A as
  rejected, C as an explicit evidence downgrade, and D as the only
  no-new-mutation route.
- Add the minimum acceptance sequence from Capucci: exact tool bytes; fresh
  digest-named workroot; declared online or admitted isolated-store mode;
  frozen install; patch pre/postimages; typed tests/build; immutable build
  handle; OEW-pinned browser with owned PID/port/environment; `finally`
  teardown; independent recomputation; then refresh approval, new selection,
  and Task Session preflight.

Final claim-safe route remains a **change request** for one private OEW
bootstrap/build interface, not a new public runtime and not a plan decision.
It preserves the exact evidence graph as authoritative input, keeps the
generalized presentation graph and sidecar as bounded projections, and caps
all automated receipts at `authority_effect:none`.
