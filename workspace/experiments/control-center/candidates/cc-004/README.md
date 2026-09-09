# CC004 — selected-source candidate, native measurement blocked

Candidate SHA-256:
`34a1d1505ddf1f27262d1f29a896e42b3e299c7876414d31a5688b3f15c0e25c`.
Predecessor CC003 is unchanged at
`d6d0cab8e8b6699eafed912a8467a7599ed3d10cf756348765cc6142f361861d`.

CC004 binds the repaired RECENT profile/current registry, retains the predecessor's
selected source inventory and definition/scaffold references, and adds the recent
regression plus measurement/evidence apparatus and explicit test configurations.
Its legacy changed-source ledger contains the routing profile and registry only.
No approval or historical PASS is inherited. This is not complete transitive build
provenance; original Workspace canonical-build blockers remain open.

## Current tests

- Candidate binding and negative tests: 6/6, including post-native recheck.
- Frontend: 78/78; TypeScript typecheck passed.
- Rust: desktop 4/4; runtime integration 14/14.
- WDIO-specific Vite and fresh Tauri WDIO builds passed.
- Native measurement integration: **FAIL**. The WDIO worker emitted an ordinary
  smoke performance report without the required measurement marker and threw its
  unchanged snapshot budget failure (102 ms versus 50 ms).
- Host qualification: **rejected**, CPU pressure avg10 reached 11.06 versus limit 5.
- Normal `cargo build --locked` restoration passed; production frontend assets
  were never replaced. Test app/driver exited and port 4445 is free.

Other raw observations include handshake 1257 ms, ready 1295 ms and delta paint
31 ms. These are retained single-session observations, not campaign p95 or clean
product performance evidence. Missing measurement mode is independently a harness
failure; host rejection does not excuse it or justify retrying away the failure.
The native session exercised actual Tauri IPC with the explicitly fixed mock
provider and preview-only protocol tolerance, not live-provider conformance.

`EVIDENCE.json` binds the candidate, fresh executable, frontend assets and logs.
`NATIVE-PROBE.json` retains the continuous host observations, process outcome and
postflight. Raw files remain under `/tmp/cav2-cc004-native.GQ3Btz/probe-g3byHP/`.
Fresh executable: `/tmp/cav2-cc004-native.GQ3Btz/essays-desktop`, SHA-256
`06178d533b30e2e2b162fe61c93d4c7513b4b60f675c3efdd9ffa8ad1cad23cb`.

## Reproduction and next construction

From Workspace runtime:

```sh
npx vitest run --config ../experiments/control-center/native-test/cc004.vitest.config.mjs
npx tsc --noEmit --pretty false
npx vite build --config wdio/vite.config.mjs --outDir /tmp/cav2-cc004-native.GQ3Btz/frontend
```

The test executable was built with `--locked --features wdio` and TAURI_CONFIG
selecting that frontendDist and identifier `dev.cyberalchemy.cc004test`.
Native WDIO selected `cc004.wdio.conf.mjs`, `CC004_UNIFIED=1`, isolated SQLite/data/
config paths and NODE_OPTIONS importing campaign/measurement-register.mjs.
Do not reuse the already-populated probe storage for another cold attempt.

Next: diagnose WDIO worker loader propagation and test a supported measurement
loading path. The plain Node loader test passed previously but does not prove WDIO
worker integration. Any changed bound harness bytes require a successor test epoch;
do not refresh CC004's digest to keep its old tests. The full campaign collector
still explicitly selects CC003; CC004 native configs support bounded testing only.
Candidate-aware campaign selection, full process/build identity, two qualified
populations, differential evidence and product approval remain pending. No commit,
merge, publication, release, deployment or live-provider effect was performed.
