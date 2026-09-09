# Exact-Binding Synthesis Package

Action: `spawn-0004`  
Role: `synthesizer`  
Dispatch: `2026-07-29-oew-runtime-rebuild-lessons`  
Status: `pass-with-unresolved-browser-witness`

## Diagnosis

The blocker is a mix, but it is not a package-manifest or SHA-runtime problem.
The pinned upstream dependency topology installs, builds core, and runs its
dashboard suite successfully. The first direct product blocker is 48 ordinary
strict-TypeScript defects in three OEW overlay modules. Earlier stops were real
reproducibility invariants exposed through governance-owned lock and write-set
omissions; exact-byte governance amplified those omissions into
stop-refresh-reselect churn.

For a testing prototype, use a thin OEW adapter inside the pinned upstream
pnpm/dashboard workspace. Preserve `007T -> 013B -> 014 -> 014V` as the
eventual independently verified L1 lane, not as the shortest prototype
iteration loop.

## Exact-Binding Causal Matrix

| Claim ID | Diagnosis | Immutable source identity | Exact selector, anchor, or command | Explorer return | Evidence scope | Proof |
|---|---|---|---|---|---|---|
| C-PKG-01 | Frozen upstream owns the dependency topology; overlay adds no manifest. | Archive SHA `1e00e5...`; commit `2cda14e...`; `L1-BUILD.lock.json` SHA `41025f...` | Eight archive `package.json` members before/after; overlay manifests `0` | `spawn-0001`, `research.md#agent-1--hewitt-carl`, PACKAGE TOPOLOGY | Frozen archive and clean workroot | observed and executed |
| C-PKG-02 | Dashboard consumes core through `workspace:*`; explicit core build is required after `--ignore-scripts`. | Same pinned archive/lock | frozen install exit `0`; explicit core build exit `0`; 12 required dist paths | `spawn-0001` commands; `spawn-0002` chronology 5–6 | Isolated locked replay | executed |
| C-SHA-01 | SHA guards establish input identity but do not cause runtime failure. | Lock `41025f...`; archive `1e00e5...`; three inputs `f1f016...`, `8f7a0c...`, `bcd0bc...` | Exact hash comparison; pnpm/tsc/Vitest do not consult repository SHA guards | `spawn-0001`, CLASSIFICATION | Locked inputs and command causality | observed and executed |
| C-ENV-01 | Environment and dependency topology are not current blockers. | Node `22.12.0`; pnpm `10.6.2`; isolated store | Replay exit vector `[0,0,0,1]` | `spawn-0001`, VALIDATION | One clean Linux replay | executed |
| C-TS-01 | Immediate source blocker is 48 strict-TypeScript errors in three overlay files. | Exact file SHAs from C-SHA-01 | dashboard `build`; `tsc -b`: `loadOewBundle.ts` 7, `store.ts` 5, `types.ts` 36; TS7006/7031/18046/2339/7053 | `spawn-0001`, VERDICT; `spawn-0002`, chronology 6 | Pinned dashboard plus current overlay | executed |
| C-TEST-01 | Green dashboard Vitest does not prove focused typed OEW tests ran. | Same pinned archive and overlay | 15 files/102 tests, no `src/oew/*.test.*`; separate Node-focused runners 18/18 | `spawn-0001`, CLASSIFICATION | Upstream suite versus six contract runners | executed; typed discovery unverified |
| C-GOV-01 | 013B-001/-002 protected real invariants but stopped because exact ownership/command contracts were incomplete. | Task Session and Refresh corpus bound by `spawn-0002` | Missing owned build lock; then missing explicit core build | `spawn-0002`, chronology 4–5 | Receipt history | observed |
| C-GOV-02 | Governance amplified the omissions without browser progress. | Current receipt corpus | At least 56 governance path-write events versus 28 implementation writes; 3/4 sessions blocked | `spawn-0002`, Quantification | Main lane; 56 is lower bound | observed and counted |
| C-STATE-01 | 007T is interrupted preflight, not admitted execution. | Current chain state, continuity, and 007T preflight | `selected_swu=null`; expected `007T`; consumed 4/budget 8; `mutation_authorized=false` | `spawn-0002`, chronology 8 | Current governed state | observed |
| C-ARCH-01 | Thin adapter in upstream workspace is the smallest no-new-manifest route. | Commit `2cda14e...`; existing upstream manifests and 008F overlay | Repair three modules; materialize/build; serve token-gated `/oew-data/*`; Playwright | `spawn-0003`, candidate 2 | Proposed architecture | components observed; end-to-end unverified |
| C-STATIC-01 | Node-native route is useful L0 diagnostics, not the OEW browser witness. | Existing viewer and Poker test | Exposes `knowledge-graph.json`, not graph/sidecar/receipt OEW journey | `spawn-0003`, candidate 3 | Existing route | observed; insufficiency inferred |
| C-GEN-01 | No evidenced missing behavior justifies a generalized runtime. | All explorer returns | No unmet prototype behavior requires new package topology | `spawn-0001` and `spawn-0003` | Prototype critical path | observed bounded absence |

## Candidate Verdict Matrix

| Candidate | Owner | Witnessed? | Sound? | Verdict |
|---|---|---|---|---|
| Current `007T -> 013B -> 014 -> 014V` | Existing governed L1 work pack | Partial build only; no browser | Yes | KEEP for eventual L1; not minimum iteration route |
| Thin upstream adapter | Existing upstream pnpm/core/dashboard plus OEW adapter | Proposed, not executed end to end | Yes | RECOMMEND for prototype |
| Static/Node-native | Existing OEW native viewer | L0 graph/token only | Yes as diagnostic | KEEP as fallback, not FWP |
| Generalized runtime | No missing behavior owner | No | Duplicates owned mechanics | DELETE from prototype critical path; DEFER future reconsideration |

## Measured Simplification

| Measure | Current scoped lane | Thin prototype lane |
|---|---:|---:|
| Runtime roots | 2 | 1 fresh pinned workspace |
| OEW-owned manifests | 1 | 1, new 0 |
| Planning gates | 4 | 2 |
| Commands | 6 | 4, or 5 including adapter verification |

## KEEP / REBUILD / DELETE / DEFER

- KEEP: pinned archive/commit and locks; upstream workspace/manifests; core and
  dashboard scripts; React/Vite graph substrate; existing entry patch;
  deterministic adapter graph/sidecar/receipt; Poker fixture; 008F UI/styles/
  tests/tour except the three defective modules; loopback/token/containment/
  teardown patterns; focused Node runners and upstream test/build.
- REBUILD: `types.ts`, `loadOewBundle.ts`, and `store.ts` with strict types;
  thin `/oew-data/*` gateway mapping; one bounded browser acceptance
  runner/receipt.
- DELETE FROM CRITICAL PATH: treating the OEW command registry as a second
  dependency graph; copied manifests or `node_modules`; generalized runtime
  abstractions; separate static UI reimplementation. This is not deletion
  authorization.
- DEFER: independent immutable build/browser verifier ceremony during fast
  prototype iteration, while retaining it for eventual L1; Firefox/axe/full
  responsive/manual matrices; L2 editing, promotion, multi-user, public, or
  generalized-runtime claims.

## Smallest No-New-Package Browser Witness

1. Verify the pinned archive/overlay; extract, copy overlay, and apply the
   existing entry patch once.
2. Run the observed-good frozen install and explicit core build.
3. Repair the three modules and run dashboard build; any TypeScript failure
   stops before serving.
4. Serve dashboard `dist` plus token-protected immutable graph, sidecar, and
   receipt at `/oew-data/*` on loopback.
5. Open `/?oew=1&token=<runtime-token>` with shared Playwright/Chromium and
   assert trust rail, F1 trace, view parity, inspector identity,
   `authority_effect: none`, receipt commit, no console errors, and no outbound
   requests.
6. Close browser/gateway in `finally`; prove port release and temp-root removal.

This witness is proposed, not executed. Passing proves only one local automated
Poker-Team journey, not ontology correctness, promotion, product acceptance,
release, or production readiness.

## Unresolved Evidence

- The three typed modules remain defective; no dashboard artifact, Vite
  execution, or browser witness exists.
- The locked dashboard Vitest command does not prove focused typed OEW test
  discovery.
- `/oew-data/*` gateway mapping and browser runner do not yet exist.
- Token, port, browser executable hash, and cleanup receipt must be bound at
  execution.
- Simplification counts use an explicitly declared architecture boundary, not
  an executed migration.
- The `>=56` churn count is conservative.
- Evidence supports deferring, not deleting, eventual independent L1
  verification.

No explorer feedback is needed to choose the thin-adapter direction. The
declared feedback edge is needed only to upgrade typed-test and browser rows
from unverified to executed after implementation exists.
