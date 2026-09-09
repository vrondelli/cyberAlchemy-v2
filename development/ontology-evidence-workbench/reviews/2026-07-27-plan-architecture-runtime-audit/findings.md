# OEW plan/architecture/runtime review

Status: **substantively verified candidate — coverage rejected; not accepted**

Final finding count: **4 MAJOR; 0 CRITICAL; 0 MINOR**.

Coverage outcome: `RECOMMEND_REJECT`. The four findings and their evidence
passed substantive checks, but the final deliverable failed complete-return,
per-attacker corpus-ledger, and per-declared-artifact disposition coverage.
See `coverage-audit.md`. No finding in this file is an accepted review result.

This is a read-only change request. It does not amend the plan, resolve the
decision gate, select an SWU, authorize Task Session, implement L1, promote
ontology meaning, or grant release authority. Inventory was discovery-only.

## Findings

### MAJOR — The plan has no governed owner-complete L1 bootstrap/build lifecycle

Current evidence:

- `cyberAlchemy-v2/development/ontology-evidence-workbench/design/ARCHITECTURE.md`:
  “L1 applies a small OEW-owned patch overlay during the build.”
- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/session-evidence/SWU-OEW-007/validation-entrypoint-decision/DECISION.md`:
  “Add the OEW `package.json` and one generic overlay-unit runner to
  SWU-OEW-007's target inventory.”
- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/session-evidence/SWU-OEW-007/CONTEXT-PACK.md`:
  “`package.json` is outside all eight selected L1 target inventories”.
- Fresh execution of the live OEW package reports
  `Missing script: "test:ui-store"`.

The pinned source is not toolchain-empty: its root declares pnpm `10.6.2`, and
the dashboard declares `vitest run` plus `tsc -b && vite build`. But a clean
temporary extraction has no installed tools; direct test/build exited 1 with
`vitest: not found` and `tsc: not found`. Normal Corepack failed, while direct
cached pnpm 10.6.2 ran; that cache is environmental, not an OEW provisioner.

Impact: the current plan has no temporally ordered owner for clean
materialization, effective package/lock and exact tool provisioning, verified
overlay application, typed test/build, immutable build output, cleanup, and
independent acceptance. **Current A** assigns shared files but not this
contract. It is evidence for this finding, not a separate defect.

One-line repair: Invoke-refresh one private OEW bootstrap/build interface with
one temporal owner per mutation and a distinct evidence owner; expanded A is
admissible only if contract-identical to B.

Severity boundary: current preflight caught the defect before mutation, so this
is MAJOR; bypassing the stop and mutating without an admitted lifecycle would
be CRITICAL.

### MAJOR — The blocked 007 selection cannot authorize a repaired graph

Current evidence:

- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/WORK-PACK.md`:
  “SWU-OEW-007 remains selected but is not mutation-runtime-ready.”
- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/swu-manifest.json`:
  `"mutationRuntimeReady": false`.
- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/chain-state.json`:
  `"status": "stopped-blocker"` and `"current_expected_selector": null`.
- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/session-evidence/SWU-OEW-007/validation-entrypoint-decision/DECISION.md`:
  “Selected option: none” and “Consequential implementation: blocked.”

Impact: expanding 007 or inserting B changes plan targets/dependencies; carrying
the frozen selection forward would collapse Plan approval, human SWU selection,
Task Session preflight, and execution into one unauthorized transition.

One-line repair: preserve historical block/selection receipts, refresh the
exact graph, obtain Plan-owner approval, invalidate the old selection, obtain a
new explicit human selection, then rerun Task Session preflight.

Severity boundary: live chain controls are working, so this is MAJOR; executing
after graph change while bypassing those controls would be CRITICAL.

### MAJOR — Current L0 evidence is temporally insufficient for L1 claims

Current evidence:

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/prepare-upstream.mjs`:
  `pnpm install --frozen-lockfile`, `mkdtemp(...)`, and
  `rm(workRoot, { recursive: true, force: true })`.
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/build-receipt.json`:
  `"temporary_clone_install_build_removed": true`.
- Fresh `npm run verify:upstream` passed 6/6 and emitted `"verified":true` over
  retained bytes without rebuilding.

Impact: L0 is current and passing, not defective or stale. Its receipt records
prior network/cache-capable install, upstream tests/build, deterministic
archives, and cleanup; current verification checks retained bytes. Neither
state proves private overlay application, an effective L1 lock, typed OEW
tests/build, browser execution, L1 residue, or an L1 receipt.

One-line repair: preserve L0 as the immutable input seam and define a distinct
L1 receipt binding source, upstream lock, overlay pre/postimages, effective
package/lock, exact tools, declared network/cache mode, output, and residue,
with independent recomputation.

### MAJOR — Browser provisioning, teardown evidence, and independent L1 acceptance are incomplete

Current evidence:

- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/work-pack/swu-manifest.json`
  assigns SWU-OEW-014 browser specs, runner, screenshots, schema, and receipt.
- `cyberAlchemy-v2/development/ontology-evidence-workbench/planning/VALIDATION-STRATEGY.md`:
  “independent adapter/browser/package receipt verification.”
- `validation/poker-team/apps/web/playwright.config.ts`:
  `reuseExistingServer: !process.env.CI` and `...process.env`.
- `validation/poker-team/apps/web/package.json`:
  `test:e2e:clean` uses broad `pgrep -f` matching.

Impact: 014 does own planned browser execution artifacts; the whole lifecycle
is not ownerless. What remains unowned is exact OEW package/browser
provisioning, an admitted immutable build input, minimal environment,
cache/network mode, explicit child PID/port teardown evidence, and acceptance
by a verifier distinct from the producer. Poker-Team’s Playwright 1.59.1,
installed executable, and browser caches are consumer-local evidence only.

One-line repair: refresh 014 to consume the verified build handle and own exact
browser binaries, minimal environment, ports/PIDs, outbound assertions and
`finally` teardown, while a separate fail-closed verifier accepts its receipt.

## Reuse and public/private invariant

Generic public manifest, digest, phase-gate, isolation, and receipt mechanics
may be adapted. Every OEW path, upstream binding, overlay, package/browser pin,
cache/network rule, fixture, output, policy, and receipt remains in a private
`cyberAlchemy-v2` adapter. No Inventory, Experiment Harness, OCGP, Poker-Team,
workspace dependency, or browser-cache evidence transfers OEW ownership or
authority.

Fresh evidence sharpens this invariant:

- Inventory canonical checks pass 47/47 and its isolated installed-consumer
  test passes 7/7;
- live `.arcanum/inventory` sync-check returns `status:"drift"` with seven
  managed paths missing;
- therefore generic source mechanics are current, but this installed consumer
  projection is not current and neither state proves OEW reuse.

## Route ranking and obligation matrix

| Rank | Route and authorization | Owner/dependencies | Package/lock and network/cache | Isolation, cleanup, receipts | Benefits / failure modes | Claim ceiling |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | **D — stop at L0; only currently authorized route** | existing L0 owners; no L1 dependency or mutation | current upstream pin only | current retained-byte verifier | preserves stopped chain; delivers no L1 | current L0 source/viewer evidence only |
| 1 future | **B — new private validation-bootstrap predecessor; recommended refresh shape, not approved/selected** | bootstrap consumes verified L0; 007–013 consume immutable interface; 014 consumes build handle; separate verifier | exact pnpm bytes and effective lock; declared online or admitted isolated-store mode; no workspace fallback | fresh digest-named tree, patch pre/postimages, cleanup every exit, producer plus verifier | clearest temporal dependency; risks oversized SWU if browser execution is absorbed | automated L1 build/browser evidence only; `authority_effect:none` |
| 2 future dissent | **Expanded A; contract-equivalent alternative, not current A and not approved/selected** | refreshed 007 owns bootstrap/build plus UI-store; 008–013 behavior; 014 browser; separate verifier | identical to B | identical to B | fewer unit labels; conflates bootstrap and feature and is not proven smaller in contractual scope | identical to B only if all contracts are identical |
| component | **Private adapter over generic Arcanum mechanics** | private OEW adapter; public Arcanum owns only domain-free mechanics | private adapter owns all OEW pins/policies | private isolation and receipts | safe reuse component; public/private leakage or over-abstraction are failure modes | mechanics conformance only |
| input seam | **Existing prepare-upstream** | current L0 upstream owner | pinned upstream pnpm/lock; prior build network/cache-capable; verification offline | disposable clone/cleanup; 6/6 retained-byte verification | strong immutable input; no overlay/L1 installed tree | L0 only |
| downgrade | **Node-native C** | requires architecture, validation, plan, and acceptance refresh | current Node package can cover pure adapters | simpler process surface | loses React/Vitest/Vite/browser fidelity; not equivalent evidence | pure adapter/schema behavior |
| rejected | **Current tactical A** | adds registry/runner targets only | no effective L1 provisioner/lock policy | no complete build/cleanup/verifier boundary | cannot execute clean lifecycle | no new L1 claim |

## Minimum future acceptance sequence

1. Verify retained inputs and pin exact Node/pnpm binary bytes.
2. Create a fresh digest-named private workroot and record preimages/residue.
3. Declare online or admitted isolated-store mode; frozen-install without
   workspace fallback.
4. Verify and apply overlay patch pre/postimages; reject drift/reapplication.
5. Run dashboard Vitest and `tsc -b && vite build`; emit immutable build handle.
6. Let 007–013 own feature evidence and 014 run that handle with OEW-pinned
   browsers, minimal environment, owned PIDs/ports, and network observation.
7. In `finally`, terminate only owned children, prove port release, clean the
   workroot, and receipt retained/removed paths.
8. Have a separate verifier recompute inputs, tools, output, browser, protected
   scopes, teardown, and residue with `authority_effect:none`.
9. Execute only after Invoke Refresh, Plan approval, selection invalidation,
   new explicit human selection, and fresh Task Session preflight.

## Per-artifact KEEP/FIX

| Artifact | Verdict | Required disposition |
| --- | --- | --- |
| `design/ARCHITECTURE.md` | FIX | keep exact/presentation separation; name bootstrap/build interface and seams |
| `design/VALIDATION-CONTRACTS.md` | FIX | keep OEW-V-01–11 ceilings; add tool/cache/network/teardown and independent verifier |
| `design/INTERFACE-CONCEPT.md` | KEEP | presentation intent does not claim runtime proof |
| `design/UX-PLAN.md` | FIX | bind automated journeys to admitted build/start/cleanup; keep manual `NOT_RUN` |
| `design/EXAMPLE.md` | KEEP | retain Poker-Team as consumer walkthrough |
| `design/UPSTREAM-BASELINE.md` | FIX | add L1 preimage/drift/replay/rollback/network-mode contract |
| `planning/IMPLEMENTATION-LAYERING.md` | FIX | add bootstrap evidence interface to L1 minimum unit |
| `planning/WORK-PACK.md` | FIX | distinguish current A, expanded A, B and D; refresh dependencies/selection |
| `planning/VALIDATION-STRATEGY.md` | FIX | add reproducible build/start/teardown and adversarial verification |
| `planning/VALIDATION-REPORT.md` | KEEP | historical plan-validation evidence only |
| `planning/OWNER-APPROVAL.md` | FIX | require approval of refreshed owner-complete package |
| `planning/work-pack/swu-manifest.json` | FIX | add exact bootstrap/build/provisioner/verifier targets and dependencies |
| `planning/work-pack/chain-state.json` | FIX | keep blocker history; invalidate old selection on graph refresh |
| seam `DECISION.md` | FIX | current A incomplete; expanded A/B contract-equivalent; D alone authorized |
| live OEW L0 implementation and retained artifacts | KEEP | current passing L0 evidence; do not relabel as L1 |
| Inventory/Experiment Harness/OCGP/Poker-Team | KEEP AS PATTERN/EXAMPLE | no OEW ownership or authority inheritance |

## Final claim ceiling

The candidate recommends no execution. D is the only currently authorized
route. B is the clearest future change request; expanded A remains viable
dissent if contract-identical. Neither is approved or selected.

Even after a future accepted run, the maximum claim is automated L1
build/browser evidence with `authority_effect:none`. Manual UX, ontology
correctness or admission, promotion, publication, release, production
readiness, and equivalence of the exact evidence graph with the generalized
presentation graph remain unproved.
