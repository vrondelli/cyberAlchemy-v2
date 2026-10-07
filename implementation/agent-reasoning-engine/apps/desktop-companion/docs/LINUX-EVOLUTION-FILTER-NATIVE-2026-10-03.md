# Native Linux Evolution filter continuity — 2026-10-03

Status: extracted-package development-renderer evidence. No package was installed, activated, signed, released, or deployed; this is not an executing Evolution worker or control of the current Codex task.

## Tested source and fixture

The exact extracted unsigned [Linux package](../dist/are-companion_0.1.0_amd64-navclean-20261003.deb) has SHA-256 `6f75b43d0cb75c61c7a6eb50d7619b378dffab79c09821906ac3d2ea5ea39d17`. Its packaged Tauri executable and ARE/Node resources were mounted read-only in the existing `are-companion-builder:native-managed-20260930` image. The test container had no network. A test-only local WebKit inspector observed the rendered dashboard over loopback; the app used an isolated temporary home and WSLg/X11 display. No installed app, host preferences, or live ARE root was modified.

The opt-in fixture at `/home/vlad_/.cache/are-linux-navclean-build-gLkh96/evolution-filter-fixture` contains two verified commits and cycles, one each for candidate `benchmark-research/v1` and `engine-improvement/v1`. It was mounted read-only as the explicit Evolution root. Neither definition was admitted or enabled, and no worker ran.

## Native journey

The package opened a nonblank dashboard with its Tauri bridge, product diagnostic, and seven sections. The native X11 client resized from 1120 × 760 to 340 × 740. In WebKitGTK, verified cycle evidence led the candidate registry, the first cycle appeared in the viewport, the selected Evolution label was visible, and the document did not overflow horizontally. The filter exposed both recorded definitions; choosing `benchmark-research/v1` reduced the visible cycles from two to one without showing the other cycle. After an explicit refresh passed through `Reading…` to `Verified ledger`, the selected definition, expanded event detail, and keyboard focus on its summary remained.

The same extracted package's registry-only and original one-cycle verified 340 × 740 journeys also passed. The latter used a separate disposable `evolution-single-regression` root and still showed one recorded cycle in its first viewport. These checks extend the Linux inspector and disposable fixture harness; they did not change production UI code or rebuild the package. Native DOM/keyboard evidence is not a human screen-reader traversal or normal-desktop physical pointer test.

## Current-source first-view follow-up — 2026-10-04

The later `evolution-binding-20261004` package reproduced a first-view
regression with two verified definitions at 340 × 740: the first collapsed
cycle summary ended at viewport pixel 804, below the 740-pixel window. Source
tests alone had not caught the extra height. The UI now places the separate
gateway-candidate teaser after the verified ledger projection when cycles are
present; the registry-only view keeps the teaser before definitions. It does
not hide either source or change the ledger, filter, or candidate claims.

The rebuilt unsigned [Linux candidate](../dist/are-companion_0.1.0_amd64-evolution-first-view-20261004.deb)
has SHA-256 `defacdb528049bc2ca6e661f2137f4764cbb1fd44753acf3403e2dd6760636fc`,
846 closure files, and closure digest
`972f1233ddb8ef6713719ede82ddaea6308e6cd1bf75c2fc4ded799d861e4db3`.
In network-disabled package-only WebKitGTK checks, its real 340 × 740 window
passed both the two-definition verified and registry-only first views. The
verified journey also passed recorded-definition selection, latest-event
summary matching, retained expanded detail and focus, and no horizontal
overflow. All 67 dashboard source tests pass.

The same package passed a joined managed-session UI smoke with the live
Evolution root mounted read-only: seven panels, gateway running, backend
ready, hosted client connected, five verified cycles, 33 commits, supervised
Companion exit, and zero model calls. The matched no-root managed smoke stayed
registry-only despite a false ambient root. These are isolated development
checks, not installed-host behavior, active-worker proof, Windows parity, or
control of the current Codex task.

An additional qualification installed this exact `.deb` with `dpkg -i` only
inside a disposable, network-disabled container, then launched the bundled
Node, ARE resources, native orb, and Companion from `/opt/are-companion`.
The installed-path joined smoke passed against the live Evolution root mounted
read-only: seven panels, gateway running, backend ready, hosted client
connected, five verified cycles and 33 commits, supervised exit, and zero
model calls. A separate installed-path no-root run stayed registry-only despite
the harness's false ambient root. This closes the installed-path check for this
isolated container, not WSL/Windows host installation, physical desktop use,
or current-task activation.

## Open Questions

- What installed-package and physical accessibility matrix will qualify the Linux UI beyond this isolated renderer check?
- Will the same source reordering pass the current Windows WebView2 narrow
  fixture once WSL-to-Windows process launch is available again?
- What privacy-reviewed source binding should expose objective-level Evolution summaries without implying worker liveness or candidate admission?
