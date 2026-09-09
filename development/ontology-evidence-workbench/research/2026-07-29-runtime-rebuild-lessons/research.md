# OEW Runtime Rebuild Lessons — Explorer Returns

Dispatch: `2026-07-29-oew-runtime-rebuild-lessons`

This file was assembled mechanically by the parent strategist from the
explorers' verbatim returns. It is research evidence, not implementation,
ontology, promotion, release, or production authority.

## Agent 1 — Hewitt, Carl

Explorer return — action_id=spawn-0001; role_id=explorer-runtime; dispatch_id=2026-07-29-oew-runtime-rebuild-lessons; step_id=s1-explore; capability=research; status=complete.

VERDICT: clean empirical replay reproduced attempt-003 exactly. Frozen install PASS; explicit core build PASS; dashboard Vitest PASS; dashboard build BLOCKED in `tsc -b` by the same 48 strict TypeScript errors in only `src/oew/loadOewBundle.ts` (7), `store.ts` (5), `types.ts` (36). Vite was never reached. This is an ordinary source defect, not an environment, dependency-topology, or SHA/lock failure. SHA guards validated the inputs but were not consulted by pnpm/tsc/Vitest during the replay, hence metadata/preflight for reproducibility rather than runtime causality.

EXACT EMPIRICAL SETUP/COMMANDS: `OEW_TMP=$(mktemp -d /tmp/oew-runtime-explorer-XXXXXX)`; `tar -xzf <source.tar.gz> -C "$OEW_TMP"`; copy declared `upstream/overlay/packages/dashboard/src/oew/` into archive dashboard `src/oew/`; `patch -d <archive-root> -p1 < upstream/patches/0001-oew-entrypoint.patch`; from archive root, using `/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node /home/vrondelli/.cache/node/corepack/v1/pnpm/10.6.2/bin/pnpm.cjs`: (1) `install --frozen-lockfile --ignore-scripts --store-dir <tmp>/pnpm-store` exit 0, 584 packages; (2) `--filter @understand-anything/core build` exit 0, all 12 lock-required dist paths present; (3) `--filter @understand-anything/dashboard test` exit 0, 15 files/102 tests; (4) `--filter @understand-anything/dashboard build` exit 1, error classes TS7006/TS7031/TS18046/TS2339/TS7053, counts 7+5+36=48. Cleanup: `find /tmp/oew-runtime-explorer-LVz0BK -depth -delete`; verified absent.

CLASSIFICATION: environment=PASS (exact Node 22.12.0/pnpm 10.6.2, online isolated store); dependency topology=PASS with one non-blocking warning (nested `understand-anything-plugin/package.json#pnpm.onlyBuiltDependencies` ignored at workspace root); SHA/lock=PASS (`L1-BUILD` 41025f..., archive 1e00e5..., three failing inputs exactly f1f016..., 8f7a0c..., bcd0bc...); ordinary source defect=BLOCK (48 errors). Locked dashboard Vitest did not list/discover any `src/oew/*.test.*`; its green result is upstream-suite evidence, not focused OEW typed-test evidence. Separately, exact Node focused runners passed 18/18: `node --test test/{evidence-inspector,navigation,poker-tour,responsive,trust-rail,view-parity}.test.mjs` (full repo-prefixed paths used).

PACKAGE TOPOLOGY: pinned top root `package.json` + `pnpm-workspace.yaml` owns `understand-anything-plugin/packages/*`, plugin root, homepage; plugin has a nested workspace file too. 8 package manifests exist in the frozen archive before and after commands: top root, homepage, plugin root, core, dashboard, viewer, tree-sitter-dart-wasm, tree-sitter-swift-wasm. Dashboard depends on core via `workspace:*`; core builds with `tsc`; dashboard builds `tsc -b && vite build`. Overlay contains 0 manifests. OEW repository adapter has exactly one `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`; Git shows it was added with the initial OEW commit `29c5dc52...` (2026-07-27) and current recent work modifies that existing registry/scripts, but added no additional package.json. Empirical manifest count stayed 8; no package manifest was created.

CORPUS LEDGER (read/accessed, no repo writes): dispatch: research/.../{dispatch-sheet.json,strategy-inventory-packet.json,orchestration/run-01/actions/spawn-0001.json}; lock/archive/registry: implementation/.../{upstream/L1-BUILD.lock.json,generated/upstream/2cda.../source.tar.gz,package.json}; attempt evidence: planning/.../SWU-OEW-013B/attempt-003/{build-attempt.json,lock-validation.json,TASK-SESSION-RESULT.md}; archive members: `{package.json,pnpm-workspace.yaml,tsconfig.json,understand-anything-plugin/{package.json,pnpm-workspace.yaml,tsconfig.json,packages/core/{package.json,tsconfig.json},packages/dashboard/{package.json,tsconfig.json,tsconfig.app.json}}`; overlay control: `upstream/overlay/{first-working-version-manifest.json,overlay-manifest.json}` and `upstream/patches/0001-oew-entrypoint.patch`; focused runners: `test/{evidence-inspector,navigation,poker-tour,responsive,trust-rail,view-parity}.test.mjs`; overlay source corpus materialized path-by-path: `upstream/overlay/packages/dashboard/src/oew/{types.ts,loadOewBundle.ts,store.ts,CommandPalette.tsx,EvidenceFilters.tsx,EvidenceInspector.test.tsx,EvidenceInspector.tsx,EvidenceOutline.tsx,EvidenceTable.tsx,EvidenceWorkspace.tsx,OewApp.tsx,PokerTour.test.tsx,PokerTour.tsx,TrustRail.test.tsx,TrustRail.tsx,inspector.css,keyboard.ts,navigation.test.tsx,oew.css,responsive.test.tsx,tours/poker-o13.json,trust.css,viewParity.test.ts,viewParity.ts}`. The first-working manifest also binds the six focused runners above; total 27 bound files. No other source was interpreted.

VALIDATION: replay exit vector [0,0,0,1]; focused Node [18 pass,0 fail]; hash comparison exact; archive manifests before=8 after=8; OEW overlay manifests=0; workroot absent after cleanup; repository status check showed only pre-existing user changes, no changes attributable to explorer.

BLOCKERS: strict typing in the three immutable overlay sources; additionally, the locked Vitest command’s lack of OEW typed-test discovery is a coverage gap, not the build cause. RESIDUE: no dashboard artifact/browser witness, no Vite execution, no ontology/release claim. HANDOFF: repair types in the existing three sources inside the owned upstream dashboard package; do not add a package root or weaken strict TS. Then replay this exact four-command sequence and explicitly force/verify focused `src/oew` typed tests before claiming browser readiness.

## Agent 2 — Simon, Herbert

Explorer-history bounded return

identity: action_id=spawn-0002; role_id=explorer-history; dispatch_id=2026-07-29-oew-runtime-rebuild-lessons; step_id=s1-explore; capability=research; status=complete-read-only.

Verdict: from the first-working-version selection, 4 Task Sessions were consumed (008F + three 013B attempts). Only 008F advanced user-visible prototype source (28 admitted implementation paths); none reached a browser. 013B attempts advanced reproducibility diagnosis only. Current 007T attempt is partial preflight, not consumed/mutation-admitted: live chain-state has selected_swu=null, current_expected_selector=007T, consumed=4/budget=8, status=active-preflight-pending; attempt target-baseline says mutation_authorized=false.

Chronology (one row per stop/transition):
1) Historical 008 attempt (lead into first-working refresh): missing registered trust-rail runner outside exact 3-file inventory; underlying defect=registry/write-set mismatch repeated across 009-014; invariant=focused command must bind an owned executable; plan-induced=yes; unblock=first-working refresh collapsed 008-013 into 008F and added owned runners/frontier validator; sessions=1 historical; UI advanced=no.
2) 2026-07-28 first-working refresh + selection A: stop was human selection/mutation admission, not runtime; invariant=finite frontier/one SWU; plan-induced=yes; changes=24 refresh targets + 6 selection projections; sessions consumed=0; UI advanced=no.
3) 008F attempt-001 PASS: 28 implementation paths (22 overlay/UI or co-located sources incl manifest + 6 mjs focused runners) admitted; invariant exact bytes/package root; plan-induced=no; sessions=1; UI source capability=yes, but explicitly no final TS/Vite build/browser proof.
4) 013B attempt-001 BLOCK: registered build/verify commands required absent L1-BUILD.lock.json outside exact seven-path inventory; underlying=final-build lock had no owner; invariant=closed exact lock/write set; plan-induced=yes; unblock=build-lock ownership refresh added one private lock and 8 planning projections (9 live targets), reselected 013B; cumulative sessions=2; UI advanced=no.
5) 013B attempt-002 BLOCK: frozen install used --ignore-scripts, then dashboard Vitest could not resolve @understand-anything/core/search because lock omitted explicit core build; underlying=effective command order incomplete; invariant=no implicit expansion of closed execution contract; mixed: real package topology need, induced stop by exact lock; unblock=effective-build-order refresh changed lock + 7 governance projections (8 live targets), budget 5->6; cumulative sessions=3; UI advanced=no.
6) 013B attempt-003 BLOCK: install, explicit core build (12 outputs; 640 files/2,081,380 bytes, digest b466...), dashboard Vitest all pass; dashboard tsc -b then finds 48 strict TS errors in immutable completed-007 loadOewBundle.ts(7), store.ts(5), types.ts(36): TS7006/7031/18046/2339/7053. Underlying=ordinary source/type defects in overlay, not package SHA; invariant=do not edit completed-007 bytes outside 013B or weaken TS; write-set-induced only in ownership/remediation, not cause; no implementation writes; cumulative sessions=4; UI advanced=no.
7) typed-overlay refresh PASS: created 007T repair ownership and changed 9 governance projections, did not change the 6 future implementation targets; budget 6->8; 013B/014/014V unselected; UI advanced=no.
8) 007T attempt-001 STOP/incomplete: context, protected baseline, target baseline, closeout preflight exist; no material/admission/result/receipt. Immediate cause=interrupted preflight, no technical blocker recorded. Invariant=six-target admission before writes. sessions remains 4; UI advanced=no.

Quantification: at least 56 applied governance path-writes in the main lane before counting task receipt/closeout evidence (24 first-working refresh + 6 selection + 9 lock ownership + 8 effective order + 9 typed-overlay). Runtime implementation writes=28 in 008F; 013B live runtime writes=0 across 3 attempts; 007T=0. Thus applied governance path-write events are >=2x runtime writes, while 3/4 consumed execution sessions were blocked reproducibility/build sessions. Exact-byte checks protected real reproducibility/non-expansion invariants but repeatedly converted missing ownership/granularity into stop-refresh-reselect loops.

Exact load-bearing evidence:
- planning/work-pack/decisions/G-OEW-L1-FIRST-WORKING-VERSION-SELECTION/{DECISION.md,decision-receipt.json,refresh-A/REFRESH-REPORT.md,refresh-A/refresh-receipt.json}
- refresh/2026-07-28-first-working-version/{REFRESH-REPORT.md,material-package.json,refresh-receipt.json}
- session-evidence/SWU-OEW-008F/attempt-001/{TASK-SESSION-RESULT.md,material-package.json,receipt.json}
- session-evidence/SWU-OEW-013B/attempt-{001,002,003}/{TASK-SESSION-RESULT.md,receipt.json}; attempt-003/build-attempt.json
- refresh/2026-07-28-l1-build-lock-ownership/{REFRESH-REPORT.md,material-package.json,refresh-receipt.json}
- refresh/2026-07-29-l1-effective-build-order/{REFRESH-REPORT.md,material-package.json,refresh-receipt.json}
- refresh/2026-07-29-l1-typed-overlay-repair/{REFRESH-REPORT.md,material-package.json,refresh-receipt.json}
- planning/work-pack/{chain-state.json,swu-manifest.json}; .arcanum/task-session/continuity/oew-work-pack-20260727.json
- session-evidence/SWU-OEW-007T/attempt-001/{CONTEXT-PACK.md,context-pack.json,closeout-preflight.json,target-baseline.json,protected-before.json}
Lead rechecked: session-evidence/SWU-OEW-008/attempt-001/TASK-SESSION-RESULT.md.

Validation: current JSON parsed with jq; material-package path inventories enumerated and unique-counted; current chain/continuity counters cross-checked; no writes performed.
Blockers: no browser evidence; 007T has no terminal receipt and current chain has no selected_swu despite current_expected_selector=007T.
Residue: exact full corpus ledger is the above file set plus each listed refresh directory's REFRESH-REPORT/material-package/refresh-receipt and each attempt's TASK-SESSION-RESULT/receipt; supporting staged duplicates were treated as byte mirrors, not independent events.
Handoff: synthesizer should classify attempt-003 as the first actual product/source defect; attempts 001/002 as real invariants exposed by governance-owned lock omissions; package SHA as guard metadata, not runtime cause.

## Agent 3 — van Lamsweerde, Axel

BOUNDED RESULT
{
 action_id: "spawn-0003",
 role_id: "explorer-architecture",
 dispatch_id: "2026-07-29-oew-runtime-rebuild-lessons",
 step_id: "s1-explore",
 capability: "research",
 status: "pass-with-unexecuted-witness",
 verdict: "Use a thin OEW feature adapter inside the pinned Understand-Anything pnpm/dashboard workspace. Do not build a generalized runtime. The real immediate blocker is an ordinary strict-TypeScript defect (48 errors in types.ts, loadOewBundle.ts, store.ts), not missing package topology. SHA/lock machinery is reproducibility metadata and a gate, not the browser product behavior. A Node-native/static lane already proves L0 graph serving but cannot satisfy the OEW trust rail/sidecar/receipt/inspector journey without rebuilding UI behavior already present in the overlay."
}

COMPONENT DIAGRAM
Poker fixture source paths (read-only)
  -> retained deterministic OEW adapter
  -> {presentation-graph,evidence-sidecar,adapter-receipt}
  -> token-gated loopback /oew-data/*
  -> pinned UA dashboard package (React/Vite + graph substrate)
       + thin OEW route (?oew=1)
       + repaired typed loader/store/types
       + existing 008F trust/inspector/outline/table/tour UI
  -> shared global Playwright CLI Chromium
  -> bounded browser witness (no ontology/promotion claim)

CANDIDATE COMPARISON
1 current 007T->013B->014->014V: technically sound but governance-heavy; KEEP as eventual independently verified L1 route, not smallest prototype route. It serializes source repair, immutable build, browser producer, independent verifier.
2 thin adapter in upstream pnpm: RECOMMEND. Reuses root/core/dashboard manifests, frozen lock, Vite, React, graph packages, test/build scripts; adds zero manifests/copies. Repair 3 typed files, copy existing overlay into fresh pinned workroot, build/serve there.
3 static/Node-native: KEEP only as diagnostic/fallback. Existing serve-native-viewer and native-viewer-poker test prove verified Poker graph + token boundary, but viewer exposes knowledge-graph.json and not /oew-data/{graph,sidecar,receipt}; it lacks exact OEW journey.
4 generalized runtime: DELETE from prototype critical path / DEFER indefinitely. No missing behavior justifies a new runtime/package topology.

KEEP/REBUILD/DELETE/DEFER (disposition means prototype architecture, not authorized file deletion)
KEEP:
- upstream source archive + UPSTREAM.lock.json and pinned commit 2cda14e...
- upstream root package.json, pnpm-lock.yaml, pnpm-workspace.yaml; core/dashboard package.json and existing scripts
- upstream dashboard React/Vite/graph components and ?oew=1 entrypoint patch
- OEW adapter sources/contracts; generated SWU-OEW-004 graph/sidecar/receipt; fixture/poker-source-subset.json
- 008F overlay UI sources/styles/tests/tour, except the 3 typed modules below need rebuild
- serve-native-viewer network/token/path-containment/lifecycle patterns (reuse behavior; adapt data mounts)
- focused Node tests and UA dashboard Vitest/build
REBUILD:
- upstream/overlay/.../oew/types.ts: add explicit TS types/generics/error fields
- loadOewBundle.ts: type parameters, role/document/hash types, fetch/crypto return types
- store.ts: typed bundle/state/listeners/source refs
- loopback gateway mapping so immutable adapter trio is served under /oew-data/ while dashboard dist is root; retain GET/HEAD/token/containment/finally teardown
- one thin browser acceptance script/receipt only after typed build passes
DELETE FROM CRITICAL PATH:
- treating OEW package.json as a second dependency graph (it is a Node command registry only)
- staged generalized build/runtime abstractions beyond fresh-workroot copy/build/serve
- duplicated package manifests or copied node_modules (none allowed)
- separate static UI reimplementation
DEFER:
- independent immutable build/browser verifier ceremony for prototype iteration (retain for later L1 closure)
- Firefox matrix, axe, all responsive variants, manual UX/a11y, L2 code context, editing, promotion, public/multi-user/runtime generalization

MIGRATION BOUNDARY
Repository-owned inputs stop at verified adapter outputs + overlay files + patch + pin. A fresh temp workroot owns install/build/runtime residue. Copy overlay to upstream dashboard src/oew, apply App patch exactly once, build using upstream manifests, place the immutable adapter trio in a token-gated /oew-data mount, serve only loopback, destroy temp root/owned child on exit. No Poker source mutation; no OEW package manifest mutation; no ontology admission.

EXACT COUNTING BOUNDARY AND COUNTS
Count only selected browser-prototype path from current selected 007T through browser evidence.
BEFORE: runtime roots=2 (OEW Node adapter/gateway root + fresh materialized UA workspace); OEW-owned package manifests=1 (current @cyberalchemy/.../package.json; it owns 19 scripts but no deps); planning gates=4 (007T,013B,014,014V); declared validation command invocations=6 (007T Node focused test + UA build; 013B build+l1 verify; 014 browser; 014V verify).
AFTER thin prototype: runtime roots=1 (fresh pinned UA workspace; adapter trio is data mounted into it); OEW-owned package manifests=1, new=0; planning gates=2 (typed overlay/build, bounded browser witness); commands=4: `pnpm install --frozen-lockfile --ignore-scripts --store-dir <tmp>/pnpm-store`; `pnpm --filter @understand-anything/core build`; `pnpm --filter @understand-anything/dashboard build`; shared Playwright CLI journey. Adapter verification is a precondition, not counted as a runtime/build command; if counted end-to-end, after=5 (`npm run verify:adapter`).

EXECUTABLE ACCEPTANCE SEQUENCE (proposed, not run)
Precondition: `npm run verify:adapter` passes. In mktemp workroot extract pinned source.tar.gz; verify hashes; copy overlay and apply 0001 patch once; run the 3 upstream commands above; launch one owned loopback gateway serving dashboard dist and token-protected `/oew-data/presentation-graph.json`, `evidence-sidecar.json`, `adapter-receipt.json`; verify `command -v npx`, global `playwright --version` = 1.59.1 and Chromium 1217; use `/home/vrondelli/.codex/skills/playwright/scripts/playwright_cli.sh open 'http://127.0.0.1:<port>/?oew=1&token=<token>'`; snapshot; assert visible `SOURCE`, `ADAPTER`, `CANDIDATE ONLY`, `AUTHORITY: NONE`; select F1, invoke Trace grounding, assert F1/R1/D1 and visible D2; switch Outline then Table preserving F1; open inspector and assert `authority_effect: none`, exact source path/digest; open receipt drawer and assert commit 2cda14e...; assert no console errors/outbound requests; close browser/gateway in finally and prove port released/temp root absent.
FAILURE BOUNDARY: strict dashboard build failure stops before server/browser (current observed boundary); adapter digest/receipt mismatch or any /oew-data failure renders a full-page block and forbids graph; token/path/network violation stops request; browser assertion failure proves only journey failure; cleanup/orphan/port residue fails witness. Passing proves only this local automated Poker journey, not ontology correctness, promotion, product acceptance, release, or production.

EVIDENCE
- design/ARCHITECTURE.md: First Working Version, High-Level Structure, low-level components, receipt ceilings
- design/INTERFACE-CONCEPT.md: First Working Version Target, interactions, responsive/failure states
- design/VALIDATION-CONTRACTS.md: OEW-V-05..V-15 and Receipt Ceiling
- implementation/.../package.json scripts (19; no dependencies)
- upstream/L1-BUILD.lock.json execution_contract.commands and effective_workspace manifests
- upstream/overlay/{overlay-manifest.json,first-working-version-manifest.json}; first manifest target_count 28/bound_file_count 27
- upstream overlay files types.ts, loadOewBundle.ts, store.ts; OewApp.tsx lines 89-96 (/oew-data + expected receipt); patch 0001 (?oew=1)
- SWU-OEW-013B/TASK-SESSION-RESULT.md + receipt.json validation.staged_build.dashboard_build: install/core/Vitest pass; 48 TS errors, 3 files
- swu-manifest.json selectors SWU-OEW-007T/013B/014/014V: status, dependencies, validations, inventories
- fixtures/poker-source-subset.json + generated/runs/SWU-OEW-004/{presentation-graph,evidence-sidecar,adapter-receipt}.json
- exact Poker source fixtures: validation/poker-team/docs/features/financial-settlement/{observability.md,PIPELINE-REPORT.md,OBSERVABILITY-REPORT.md}; validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts
- test/native-viewer-poker.test.mjs + scripts/serve-native-viewer.mjs
- AGENTS.md Shared Browser Runtime; installed playwright SKILL.md; live check global playwright 1.59.1, Chromium 1217 installed (other cached versions exist, so pin exact binary in witness)

validation: read-only source inspection; jq counts; tar-only manifest/source inspection in mktemp; live non-mutating Playwright discovery. No browser witness executed because source repair/gateway do not exist and mutation forbidden.
blockers: 3 untyped overlay modules; /oew-data mount absent in current native gateway; browser acceptance scripts/SWUs planned, not implemented; exact acceptance token/port must be runtime-generated.
residue: temp extraction under /tmp only; no repository writes; recommendation does not authorize deleting/defer-marking artifacts.
handoff: synthesizer should preserve count boundary and distinguish prototype simplification (2 gates) from eventual L1 independent verification (may still require 4); do not call existing L0 native viewer the OEW first working version.
