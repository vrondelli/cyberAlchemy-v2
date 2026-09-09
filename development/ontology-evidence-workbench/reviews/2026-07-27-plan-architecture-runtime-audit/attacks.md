# OEW plan/architecture/runtime attacks

Status: candidate synthesis for verifier wave

Inventory was discovery-only. Load-bearing claims below were rechecked against
current target bytes and, for the executable contrast, a fresh run on
2026-07-27:

- `npm run verify:upstream` from the OEW implementation passed 6/6 tests and
  emitted `"verified":true` with `"authority_effect":"none"`;
- `npm run test:ui-store` reported `Missing script: "test:ui-store"`.

Neither result proves an L1 overlay runtime, plan approval, selection,
promotion, release, or ontology authority.

## van Lamsweerde, Axel

Source handle:
`agent-returns/attackers/van-lamsweerde.md`

### Initial position

CHANGE REQUEST. The missing scripts are the first symptom of one underlying
defect: no SWU owns the L1 patch-overlay lifecycle from verified source through
materialization, patch/overlay, locked install, typed test/build, browser
startup, cleanup, and independently checked receipt. Option A merely moves
shared `package.json` churn unless expanded to own that lifecycle; B can work
only if it owns the same complete contract.

Initial trace:

| Severity | Attack | Current evidence | Initial repair |
| --- | --- | --- | --- |
| CRITICAL | no L1 patch-overlay lifecycle owner | `ARCHITECTURE.md`: “L1 applies a small OEW-owned patch overlay during the build”; manifest targets contain patch/feature files but no materializer, effective package/lock, build receipt, or complete runner | add a dependency-predecessor bootstrap owner, or exactly expand 007 |
| MAJOR | current A repairs registry, not execution | `DECISION.md`: “Add the OEW package.json and one generic overlay-unit runner”; live package has no L1 scripts or dependencies | define the full runtime contract before choosing A/B |
| MAJOR | L0 pin is temporally wrong as L1 proof | receipt records pristine `pnpm install --frozen-lockfile` and viewer build | bind an L1 receipt to source, upstream lock, overlay, effective package/lock, tools, and output |
| MAJOR | browser start/teardown unowned | 014 names browser artifacts but no admitted L1 build, pin/cache/port/PID/teardown contract | make 014 consume a verified build handle and own bounded browser lifecycle |
| MAJOR | terminal acceptance can self-attest | validation asks for independent verification, but no independent L1 verifier target exists | split receipt producer and deterministic verifier |
| MINOR | two bare “option A” labels collide | work pack says L1 gate selected A; seam decision says selected option none and recommends another A | qualify the decision ID |

Peer challenges: Hewitt was asked to produce one isolated command that performs
the entire pinned overlay lifecycle; Bateson was asked to identify lifecycle
side effects beyond the formal trace. Both challenges reinforced the zero-owner
finding.

### Post-robot-talk final position

The attacker narrowed “new runtime” to a private lifecycle adapter over real
OEW L0 mechanics. It strengthened stale selection to CRITICAL: current
`selected:true` belongs only to the frozen pre-repair graph and cannot authorize
changed targets or a predecessor. It retained independent verification and
browser lifecycle findings, and subsumed the option-label MINOR into stale
selection.

Final route: **Option B made complete**, a new private validation-bootstrap SWU
before 007. Reason for preferring B: 007 currently owns UI-store behavior and
is selected under the frozen graph; expanding it still requires invalidation,
refresh, and reselection while conflating feature and bootstrap ownership.

## Hewitt, Carl

Source handle:
`agent-returns/attackers/hewitt.md`

### Initial position

Both extremes were falsified. OEW does not need a wholly new general runtime:
its upstream preparation/verifier owns pin checks, deterministic retained
archives, disposable work roots, cleanup, and offline retained-byte
verification. But no reusable L1 runner exists: there is no current owner for
overlay materialization, effective lock/install, typed UI test/build, browser
policy, cleanup, or L1 receipt.

Initial trace:

| Severity | Attack | Exact empirical/current evidence | Initial repair |
| --- | --- | --- | --- |
| CRITICAL | no executable L1 owner | `verify:upstream` passes; `test:ui-store` is missing; live package has only L0 Node scripts | create one private bootstrap responsibility |
| MAJOR | prepare-upstream is preparation, not L1 runtime | current script uses `mkdtemp`, pristine clone, frozen install, upstream tests/build, and `rm`; it never consumes OEW overlay paths | adapt the existing seam into a fresh private overlay workroot |
| MAJOR | pinned dashboard is external to L1 | retained dashboard provides TS/Vite/Vitest scripts and upstream lock, but receipt covers unmodified upstream | bind a fresh overlay test/build receipt |
| MAJOR | Poker-Team is a consumer | root workspace lock, inherited environment, two servers, `reuseExistingServer`, broad `pgrep` cleanup | reuse test shapes only |
| MINOR | Inventory/Experiment Harness are mechanics | installed-consumer and phase-gate patterns exist, but are non-UI/domain-specific | borrow generic patterns through a private adapter |

Peer challenge: distinguish executable mechanics from governed temporal
ownership. The fresh pass/fail contrast proves both that useful mechanics exist
and that no assembled L1 interface exists.

### Post-robot-talk final position

Hewitt accepted the zero-owner trace, historical-only selection, and need for
an independently recomputable L1 verifier. He rejected calling the L0 receipt
stale: it is current narrow L0 evidence. He dropped any suggestion that offline
L1 replay already works; the recorded build is network-capable.

Final route: **Option B made complete**, because the shared responsibility is
larger than 007’s feature behavior and should be an explicit predecessor with
an immutable build handle.

## Bateson, Gregory

Source handle:
`agent-returns/attackers/bateson.md`

### Initial position

BLOCK current A. Allocating `package.json` and a generic runner does not allocate
source extraction, patching, installation/cache/network policy, browser
processes, cleanup, protected-scope evidence, or independent verification.
Every side effect needs one explicit temporal owner and acceptance boundary;
that does not require one self-attesting mega-owner.

Initial trace:

| Severity | Attack | Current evidence | Initial repair |
| --- | --- | --- | --- |
| CRITICAL (S0) | shared lifecycle has no complete ownership | A allocates two files while 007–014 omit the remaining side effects | name a private OEW runtime interface and complete inventories |
| CRITICAL (S0) | selected 007 is blocked and non-transferable | manifest says `"status":"blocked-preflight-validation-entrypoint"` and `"selected":true`; decision says “Selected option: none” | preserve receipt, invalidate selection on refresh, reselect |
| CRITICAL initially, reduced to MAJOR | upstream archive/lock is not overlay evidence | receipt records pristine install/build and removed clone | bind overlay/tool/cache/network/residue evidence |
| MAJOR (S1) | patch mutation is not bounded/reversible | architecture promises “small, explicit patch overlay” but no applicator/preimage/reapply/rollback contract exists | fresh digest-named materialization and fail-closed cleanup |
| MAJOR (S1) | browser evidence is non-hermetic | no OEW Playwright/browser/process policy; Poker inherits env and has broad cleanup | own pins, ports, PIDs, minimal env, outbound checks, teardown |
| MAJOR (S1) | producer receipts lack L1 acceptance edge | existing verifier is narrow; no equivalent L1 verifier exists | independent recomputation |
| MINOR (S2) | reuse candidates are patterns, not owners | Inventory apply is non-atomic; Experiment Harness can patch; Poker/OCGP are consumer/finite evidence | generic public mechanics only, private OEW adapter |

Peer challenge: every proposed route must close each lifecycle side effect
without importing Poker state, mutable verification, or private OEW bindings
into public Arcanum.

### Post-robot-talk final position

Bateson dropped the claim that a wholly new generalized runtime is required and
reduced archive preparation from S0 to S1 because OEW’s L0 owner and cleanup are
real. The retained CRITICAL is current A’s incomplete lifecycle. The attacker
also refined “one owner for the entire lifecycle” into one unambiguous owner
and acceptance boundary per side effect, with producer/verifier separation.

Final route: **expanded A**, after Invoke Refresh and reselection. It preserves
L0 preparation, expands 007 into the shared L1 bootstrap/build owner, keeps
008–013 as behavior owners, keeps 014 as browser-process owner, and adds a
separate verifier. B is the fallback if Plan considers expanded 007 too broad.

## Deduplicated outcome and robot-talk changes

### Survived

1. **One underlying MAJOR owner defect:** no governed L1 lifecycle connects the
   verified L0 archive to a patched, locked, tested, built, browser-exercised,
   cleaned, independently verified result. The live preflight and stopped chain
   caught this before mutation; bypassing those controls would raise it to
   CRITICAL.
2. **Current A is under-scoped:** two shared-file targets do not close that
   lifecycle.
3. **Selection cannot transfer:** any owner-complete A or B changes the frozen
   plan graph/targets and requires refresh, owner approval, and new explicit
   selection.
4. **L0 evidence is current but narrow:** current verification passes; it is
   not L1 evidence.
5. **Browser and receipt boundaries are incomplete:** the build handle,
   browser pin/cache/network/process lifecycle, cleanup, and independent
   verifier remain unowned.
6. **Reuse is mechanics-only until adapted:** Inventory, Experiment Harness,
   OCGP, and Poker-Team provide patterns/examples, not OEW authority.
7. **Claim ceilings survive:** exact evidence graph remains distinct from the
   generalized presentation graph; receipts retain `authority_effect:none`;
   manual UX remains `NOT_RUN`.

### Refuted or subsumed candidates retained for verifier review

| Candidate attack | Outcome | Reason |
| --- | --- | --- |
| OEW must invent a wholly new public/general runtime | REFUTED | existing OEW pin/archive/temp-cleanup/verifier mechanics are current and reusable |
| L0 receipt is stale | REFUTED | fresh 6/6 verification passed; only an L1 interpretation would be stale |
| current successful verification proves offline L1 replay | REFUTED | it verifies retained bytes without rebuilding; recorded install/build is network-capable |
| one mega-owner must execute and accept everything | REFINED | require one owner per side effect and a separate acceptance verifier |
| option-label collision is a standalone finding | SUBSUMED | stale selection/graph repair is the load-bearing defect |
| Node-native validation preserves planned React fidelity | REFUTED | it is feasible only as a contract-wide evidence downgrade |

### Preserved disagreement

All attackers agree on the required contract and reject **current A**. They do
not agree on packaging:

- van Lamsweerde and Hewitt prefer **B**, a new predecessor bootstrap SWU,
  because ownership and dependency ordering are explicit;
- Bateson prefers **expanded A**, because it preserves unit identities and is
  smaller in graph churn, while acknowledging that expansion invalidates the
  old selection and is not clerical.

This disagreement is unresolved and must remain visible to the verifier and
future Plan owner.

## Capucci, Matteo — executable verifier

Source handle:
`agent-returns/verifiers/capucci.md`

### Initial position

CONDITIONAL ACCEPT WITH CORRECTIONS. Capucci accepted the ownership defect and
selection non-transferability, initially rating both CRITICAL, but falsified
any implication that the upstream typed toolchain must be invented.

Exact fresh checks:

- retained source root declares pinned pnpm `10.6.2`; dashboard declares
  `test: vitest run` and `build: tsc -b && vite build`;
- a clean temporary extraction contained no `node_modules`; direct dashboard
  test/build exited 1 with `vitest: not found` and `tsc: not found`;
- ordinary pnpm/Corepack resolution failed with
  `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`, while directly addressing cached
  pnpm `10.6.2` succeeded; that cache is environmental, not an OEW pin;
- fresh `npm run verify:upstream` passed 6/6 and verified retained L0 bytes
  without rebuilding;
- Inventory canonical tests passed 47/47 and its isolated installed-consumer
  test passed 7/7, while
  `sync-runtime.sh --check --target .arcanum/inventory --json` returned
  `status:"drift"` with seven managed paths missing;
- Poker-Team resolves Playwright 1.59.1 and browsers through its own workspace;
  E2E was not run because it would not discriminate OEW ownership and could
  start or kill consumer processes;
- the prefix-checked temporary extraction was removed and repository targets
  were not edited.

Initial objections:

| Candidate | Initial verifier position |
| --- | --- |
| lifecycle owner | no objection; initially CRITICAL, narrowed to governed lifecycle rather than absent toolchain |
| stale/non-transferable selection | no objection; initially CRITICAL |
| current A | no objection; MAJOR, but clean extraction strengthens the lifecycle defect |
| L0 temporal distinction | no objection; MAJOR |
| browser boundary | no objection; MAJOR; Poker is consumer-local |
| reuse boundary | correct conclusion, but canonical Inventory mechanics are current even though installed sync is drifted |

### Post-robot-talk final verdict

REVISE, THEN ACCEPT AS A READ-ONLY CHANGE REQUEST. Capucci accepted Russell’s
severity and deduplication objections:

- lifecycle ownership is **MAJOR**, because preflight stops mutation; one
  temporal owner per mutation plus a separate evidence owner is required;
- selection non-transferability is **MAJOR**, because stopped chain,
  `mutationRuntimeReady:false`, and “Selected option: none” are working;
- current A is **dropped as a standalone finding** and merged into lifecycle
  ownership;
- L0 temporal distinction remains **MAJOR**;
- browser finding remains **MAJOR but narrowed**: 014 owns browser execution
  artifacts; exact provisioning, admitted build, PID/port/environment/network
  isolation, teardown evidence, and independent acceptance remain gaps;
- reuse/public-private treatment becomes an **invariant**, not a MINOR defect.

Final route position: D is the only currently authorized operational route.
B ranks first only among future refresh candidates; expanded A remains
mechanically viable with an identical contract. Neither is approved or
selected.

## Russell, Bertrand — scope and authority verifier

Source handle:
`agent-returns/verifiers/russell.md`

### Initial position

REVISE. Russell found accurate paths and a real stopped-plan defect, but
objected to double counting, severity inflation, and the claim that browser
ownership is wholly absent. Current bytes show
`selected_swu:"SWU-OEW-007"`, `mutationRuntimeReady:false`,
`status:"stopped-blocker"`, `current_expected_selector:null`, and “Selected
option: none”: controls stopped before L1 mutation.

Initial objections:

| Candidate | Initial verifier position |
| --- | --- |
| lifecycle owner | retain as MAJOR; assign one owner per mutation, not a self-attesting mega-owner |
| non-transferable selection | retain as MAJOR governance blocker |
| current A | drop as duplicate of lifecycle ownership |
| L0 temporal distinction | retain MAJOR; current retained-byte verification is not L1 evidence |
| browser lifecycle | narrow MAJOR; 014 owns specs, runner, screenshots, receipt, and execution |
| reuse candidates | move to invariant; no external receipt/cache transfers OEW authority |

Russell’s strongest authority objection was that a review recommendation cannot
approve B, expanded A, refresh, reselection, or execution. Any execution after
graph repair without the required gates would be CRITICAL; no such bypass is
evidenced.

### Post-robot-talk final verdict

REVISE, with no route change. Russell accepted all of Capucci’s executable
facts: pinned typed entrypoints exist; clean extraction lacks installed tools;
direct cached pnpm is environmental; L0 retained-byte verification is fresh
6/6; Inventory canonical mechanics pass 47/47 plus 7/7 while installed sync is
drifted; Poker browsers are consumer-local.

Final dispositions converge exactly with Capucci: four MAJOR findings,
current-A merged, browser gap narrowed, and reuse boundary moved to an
invariant. D remains the only authorized route. B is the clearest future
dependency shape, expanded A is contract-equivalent dissent, and both remain
unapproved/unselected.

## Verifier-wave refutation ledger

| Refuted or corrected candidate | Final disposition |
| --- | --- |
| F1/F2 are CRITICAL now | refuted: MAJOR while stopped-chain/preflight controls work; CRITICAL only upon bypass |
| current A is a separate finding | refuted: evidence merged into the lifecycle-owner finding |
| entire browser lifecycle is unowned | refuted: 014 owns execution artifacts; provisioning/build input/isolation/teardown acceptance remain incomplete |
| reuse boundary is an OEW MINOR defect | refuted: it is a mandatory route invariant |
| pinned upstream lacks typed entrypoints | refuted: pnpm/Vitest/Vite/TypeScript entrypoints exist |
| direct cached pnpm proves OEW provisioning | refuted: environmental feasibility only |
| Inventory mechanics are historical or installed-current | both refuted: canonical checks pass, installed projection is drifted |
| B or expanded A is authorized | refuted: D alone is currently authorized; A/B require refresh, approval, new selection, and preflight |
