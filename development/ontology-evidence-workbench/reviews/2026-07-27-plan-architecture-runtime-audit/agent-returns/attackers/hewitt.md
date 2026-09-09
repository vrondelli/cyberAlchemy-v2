# Hewitt, Carl — empirical runtime-reuse attack (initial return)

## INITIAL POSITION

The missing OEW L1 commands are a real owner defect, but neither proposed
extreme survives current-byte inspection: a new general runtime is **not**
shown necessary, and an already reusable OEW L1 runner is **not** shown to
exist.  The smallest evidence-supported candidate is a private OEW bootstrap
which reuses the already project-owned upstream preparation/verification
mechanics, while adding a separately owned overlay workspace, lock/install,
test/build/browser, cache/network, cleanup, and receipt contract.  This is a
review finding, not selection or implementation.

## Commands and defended non-execution

* `cd cyberAlchemy-v2/implementation/ontology-evidence-workbench && npm run verify:upstream`
  passed: 6/6 lock tests and `verified:true`; retained source/viewer archives
  independently verified. This verifier performs no rebuild/network activity.
* `.../ontology-evidence-workbench && npm run test:ui-store` exited 1 with
  `Missing script: "test:ui-store"` (an npm diagnostic log was written outside
  OEW under the user npm cache). This confirms the current blocker.
* `.../ontology-candidate-graph-prototype && npm test` passed 59/59. It is
  Node ESM only; its run-writer tests use temporary paths.
* `find arcanum/arcana/inventory/test -name '*.test.cjs' -print0 | xargs -0
  node --test` passed 47/47. These tests exercise temporary installed consumers;
  they do not establish an OEW UI runtime.
* I did not run `prepare-upstream ... build`: it clones the remote and executes
  `pnpm install --frozen-lockfile`, hence requires network/cache effects despite
  its disposable clone. I did not run Poker E2E: it starts both app/backend and
  uses consumer-owned dependencies/browsers. `corepack pnpm --version` itself
  currently fails with `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`, so the host
  cannot be accepted as OEW's pnpm provisioner.

## Severity-ranked findings

1. **CRITICAL — L1 has no executable owner, not merely absent aliases.**
   The live OEW package has only Node scripts (`test`, source-admission,
   native-viewer, adapter/upstream verification) and no dependencies or package
   manager declaration ([package.json:9-15](../../../implementation/ontology-evidence-workbench/package.json)).
   Meanwhile the decision lists eight L1 commands and says package.json is
   outside every L1 inventory ([DECISION.md:12-26](../../planning/work-pack/session-evidence/SWU-OEW-007/validation-entrypoint-decision/DECISION.md)).
   A script-only repair would still lack a materialized pinned overlay tree,
   lock boundary, dependency installer, browser binary policy, and L1 receipt.
   **Repair:** Invoke-refresh one temporal owner for an OEW-private bootstrap
   target inventory containing these contracts before any L1 mutation.

2. **MAJOR — `prepare-upstream` is reusable preparation, not a reusable L1
   runtime.** It hard-pins UA commit `2cda…630f`, pnpm `10.6.2`, and its
   `pnpm-lock.yaml`; a build clones remotely, installs frozen dependencies,
   runs core/dashboard tests, and builds only `understand-anything-viewer`.
   It stages clone/install/build under `mkdtemp`, deletes both work/output on
   failure, retains exactly source/viewer archives plus receipt, and its
   verification is offline from retained bytes. This is strong project-owned
   pin/archive/receipt/cleanup machinery, but it does not materialize a patch
   overlay nor start/run OEW browser acceptance. **Repair:** keep the lock
   verifier and archive discipline; add an OEW adapter that extracts/copies to
   a unique temp workroot, applies a declared overlay, installs only against
   the admitted lock, records cache/network policy, then removes workroot.

3. **MAJOR — the archived dashboard proves toolchain compatibility only at the
   upstream boundary.** The source archive contains dashboard `dev:vite`,
   `build:tsc -b && vite build`, and `test:vitest run`; its root lock is present.
   The immutable build receipt records `pnpm install --frozen-lockfile`, core
   and dashboard tests, and viewer build as pass (Node v22.12.0/pnpm 10.6.2),
   but the recorded work was unmodified upstream and does not prove OEW patch
   application, OEW test files, browser journeys, or a current rerun.  It is
   therefore **PRESENT_BUT_EXTERNAL** to OEW L1, not a pin-owned overlay.

4. **MAJOR — Poker-Team is an environmental consumer, not a transplantable
   runner.** `apps/web` has React Router/Vite and Playwright configuration, but
   no local lock; its root `validation/poker-team/package-lock.json` owns the
   workspace dependency graph. Its Playwright config starts Poker backend and
   web servers, has environment credentials, and may reuse a local server
   outside CI. Its `test:e2e:clean` kills processes by pattern.  Browser cache
   or installed `node_modules` therefore cannot be attributed to OEW.
   **Repair:** retain only the test-shape examples; OEW must own pins/browsers,
   loopback lifecycle, and non-destructive cleanup.

5. **MINOR — Inventory and Experiment Harness supply mechanics, not UI
   ownership.** Inventory is current and its closure receipt says 47 tests and
   installed-consumer conformance passed, but its explicit exclusions include
   “UI, or remote storage” ([WORK-PACK.md:31-38](../../../../../arcanum/arcana/inventory/development/runtime-faceted-layout/WORK-PACK.md)).
   Its manifest-bound sync protects consumer paths, yet apply is sequential and
   non-atomic. Experiment Harness has useful phase reporting, temp cleanup and
   receipt/observation patterns, but is a bash/Codex experiment loop that can
   apply/rollback patches; it is a domain mismatch for a deterministic UI
   installer/runner. **Repair:** borrow only generic receipt, manifest, and
   temporary-workspace patterns via a private OEW adapter; do not import private
   OEW bindings into public Arcanum.

## Runtime-reuse matrix

| Candidate / primitive | Classification | What current bytes prove | KEEP / FIX |
| --- | --- | --- | --- |
| OEW `prepare-upstream` + lock + retained receipt | PRESENT_AND_PROJECT_OWNED | immutable source/viewer pin, frozen install during build, deterministic archives, temp cleanup, offline retained-byte verifier | **KEEP** verifier/archive/receipt; **FIX** overlay extraction, L1 install/test/build/browser/cache/receipt owner |
| UA dashboard package + root pnpm lock | PRESENT_BUT_EXTERNAL | React/TS/Vite/Vitest scripts and root lock exist in archived pin; no OEW overlay run | **KEEP** pinned source contract; **FIX** OEW-private materialization and patch test |
| OEW native Node verifier/server | PRESENT_AND_PROJECT_OWNED | local token-gated serving and artifact verification; Node-only package | **KEEP** L0 boundary; **FIX** do not claim it runs L1 components |
| Inventory runtime-faceted-layout | ADAPTABLE_MECHANIC | current canonical manifest sync/installed-consumer proof; 47/47 live test | **KEEP** isolation/manifest/receipt ideas; **FIX** no UI/runtime reuse claim |
| Experiment Harness phase gates | DOMAIN_MISMATCH | phase reporting/temp fixtures and loop receipts; Codex/patch loop | **KEEP** evidence vocabulary only; **FIX** do not couple OEW build to it |
| OCGP prototype | DOMAIN_MISMATCH | 59/59 deterministic finite evidence tests, four-file receipts, `authority_effect:none` | **KEEP** input admission/receipt boundary; **FIX** no React/browser ownership inference |
| Poker-Team web/E2E | PRESENT_BUT_EXTERNAL | consumer Vite/Playwright conventions and root npm lock | **KEEP** example fixture/test-shape; **FIX** prohibit OEW dependence on its lock, processes, node_modules, or browser cache |
| Existing OEW L1 overlay runner/package lock/browser receipt | ABSENT | scripts and target inventories do not currently own it | **FIX** make one bootstrap owner explicit |

## Attacks that survived

* “A new runtime is required” is falsified as a blanket claim: OEW already has
  a strong project-owned pin/build-verification/cleanup seam, and the pinned
  dashboard supplies the intended typed test/build toolchain.
* “Existing runtime is already reusable” is falsified: no current OEW artifact
  owns overlay materialization, a UI-specific lock/install, L1 scripts,
  browser binary/cache policy, browser process cleanup, or L1 receipt.
* Node-native downgrade remains mechanically feasible for pure adapters but
  does not preserve the planned TypeScript/React component evidence; it cannot
  close the L1 fidelity claim by itself.

## PEER EXCHANGE CAPSULE

Initial position for van Lamsweerde/Bateson: distinguish **existing mechanics**
from **temporal OEW ownership**. The empirical counterexample is that
`verify:upstream` passes from retained bytes while `test:ui-store` fails
immediately; therefore neither “nothing exists” nor “the runner exists” is
accurate. Ask whether a bootstrap must be a new SWU (clean ownership) or a
bounded expansion of 007 (minimal frontier churn), but reject either unless it
owns package/lock, network+cache, temp isolation, cleanup, and independently
verified browser receipt. No post-robot position yet.

## POST-ROBOT-TALK FINAL POSITION

### Agreements after direct comparison

I agree with van Lamsweerde's zero-owner trace. Current `SWU-OEW-007` is
selected-but-`blocked-preflight-validation-entrypoint`; its inventory contains
the overlay manifest/patch and feature bytes, but no package/lock,
materializer, installer, dashboard build/start, cleanup runner, or L1 build
receipt. The live `prepare-upstream` code confirms the temporal mismatch: it
clones pristine upstream, archives it before install, runs frozen upstream
tests and the *viewer* build, and has no reference to OEW overlay/patch paths.

I also agree with Bateson that the current selected bit is historical rather
than a transferable authorization: `chain-state.json` records the 007 receipt
as `block`, while the seam decision says `Selected option: none`. A refresh
must not silently carry it forward. His independent-verifier objection also
survives: the present upstream verifier independently recomputes retained
archive/file inventory facts, but no equivalent L1 overlay/browser verifier is
named. A producer's `pass` receipt cannot establish the missing lifecycle.

### Disagreements resolved

There is no empirical basis to call the L0 receipt stale: `npm run
verify:upstream` freshly passed against current retained bytes. It is **current
L0 evidence with a narrow claim**, not L1 evidence. The stale item is the L1
selection/owner model after any repair, not the verified L0 archive receipt.

I retain one qualification to “new runtime”: OEW should not create a new
general/public runtime. Existing OEW preparation, receipt-shape verification,
and temporary-workspace cleanup are real project-owned mechanics. What is
required is one new **private validation-bootstrap responsibility** that binds
them to an overlay lifecycle; no inspected candidate supplies that ownership.

### Findings changed or added

* **CRITICAL, strengthened:** Finding 1 now includes a zero owner for the
  complete materialize → patch/overlay → frozen install → typed test/build →
  isolated browser → teardown → receipt-verification sequence, not just the
  script registry.
* **CRITICAL, added:** Treat `SWU-OEW-007` selection as stale after refresh;
  preserve its block receipt, refresh targets/dependencies, and require a new
  human selection. Do not reinterpret `selected:true` as authority for the
  bootstrap.
* **MAJOR, strengthened:** Add an independently recomputable L1 receipt
  verifier and explicit input/output/protected-scope/residue manifests. The
  existing upstream verifier is a pattern only; it does not verify a patched
  dashboard or browser run.
* **Dropped:** no finding claims an offline replay already works. Current L0
  verification is offline from retained artifacts, while the recorded build
  uses network-capable clone/install and does not attest cache-miss denial.

### Final smallest repair route

Recommend, subject to a future owner decision: **Option B made complete** — a
new private OEW validation-bootstrap SWU immediately before 007. This is the
smallest dependency-safe route because the actual shared responsibility is
larger than 007's UI-store behavior and cannot be smuggled through a two-file
inventory amendment. It must own:

1. verified retained source/lock input (no workspace cache as proof), fresh
   digest-named temporary materialization, overlay/patch preimage and
   postimage checks, reapply rejection, and cleanup on every exit;
2. exact tool/package-manager and effective lock bytes, explicit install
   network/cache policy, typed dashboard unit/build commands, and an immutable
   build handle consumed by 007–014;
3. fresh loopback ports, explicit child PIDs, pinned browser availability,
   default-deny outbound assertions, `finally` teardown, and protected-scope
   plus residue evidence; and
4. separate receipt producer and verifier; the verifier recomputes source,
   overlay, effective-lock, artifact, protected-scope, and teardown facts and
   retains `authority_effect:none`.

Later SWUs may own only their feature/test bytes; 014 may consume the verified
build handle but must not inherit Poker-Team processes, locks, browsers, or
cache. Inventory's manifest/isolation and Experiment Harness's phase-gate
ideas remain adaptable only through generic public mechanics and a private
OEW adapter. This review neither selects B nor resumes a Task Session.

### Final peer capsule

Both peer attacks survive the empirical check. The live command counterexample
is precise: retained L0 pin verification passes, but no L1 script or assembled
overlay lifecycle exists. Preserve L0 evidence; invalidate the blocked
selection on refresh. The smallest complete route is a new, private,
independently-verifiable validation-bootstrap predecessor — not a general new
runtime and not Option A's script-only amendment.
