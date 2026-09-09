# Validation and checkpoint evidence

This is a procedure for future execution. No Phaser build, sprite import, animation or performance check has run while authoring this plan. Open questions: [register](OPEN-QUESTIONS.md).

## Commands and environment

Use O01's verified Linux Node/npm pair. This environment currently has a Linux Node binary at `/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node`; the prior B1 setup found the default npm command resolved to Windows. Verify before use.

After P01 has created the new package and lockfile:

```bash
cd /home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/robot-world-kep/browser-world/sprite-comparison/app
export PATH="/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH"
node --version
command -v npm
npm ci
npm test
npm run build
npm run preview
```

Run commands separately and record exit results. The final preview command remains running for review. It must bind only loopback, with its resolved port recorded by O02. Do not run the old app's package scripts from this directory or point Vite at parent assets.

Browser QA uses the installed Playwright skill, currently at `/mnt/c/Users/vlad_/.codex/skills/playwright/SKILL.md`, and its CLI wrapper. Read the skill when executing. Use a new named browser session for the comparison. Store captures under the exact new run directory in `output/playwright/robot-world-sprites/`.

On this Windows/WSL bridge, use a consistent verified browser executable and correctly quoted paths. Earlier B1 evidence found multiline CLI run-code arguments could be mangled by Windows shell routing: use single-line browser snippets or the skill's supported script mechanism. A CLI command that returns a process/session ID is still running; join it before dependent calls.

Check video support before recording. If the browser tool requires its own ffmpeg helper, install only that helper within the authorized environment scope and verify the output file. A “video saved” message is insufficient without a nonempty file and actual duration/dimensions.

## Required checks

| ID | Behavior and decisive assertion | First packet |
|---|---|---|
| V01 | Input SHA-256 matches the source register; copied loader/controller/test/fixture/manifest are byte-identical; parent B1 files unchanged | P00/P01 |
| V02 | New private package has exact pins, real lockfile, strict build; no Babylon dependency/GLB import | P01 |
| V03 | Existing five test groups pass against copied source; both tick-80 revisions remain selectable; corrupted/oversized/wrong-owner/wrong-schema inputs rejected | P01 |
| V04 | Atlas metadata matches actual decoded image, unique names, bounds, valid foot anchors, known groups and nonempty visible pixels | P02/P03 |
| V05 | Idle/walk loops have no background box, caption fragments, clipped extremities, stretching or crop-induced jumping on light/dark backgrounds | T01 |
| V06 | 48/64/80 scale samples, realistic building ratio and actual CSS heights are captured, not merely configured | T01 |
| V07 | Source-to-world mapping covers bounds; exact source positions at pause/seek; animation phase/facing reproducible across equal elapsed-time partitions | P03 |
| V08 | There is one update owner and one active Phaser game; async abort/load failure/context retry leaves no duplicate loop or late callback | P03/T02 |
| V09 | Recorded colony has exactly two source actors; synthetic load mode is visibly labeled, bounded and separate from crew/counters | P05/T02 |
| V10 | Clicking each actual sprite selects its source ID; DOM crew selection agrees; drag does not click/select; focus/reset/zoom preserve data | T02 |
| V11 | Timeline native keys access frame indices 80 and 81; speeds 0.5/1/2 work; hidden tab pauses without catch-up; editable controls keep their own keys | T02 |
| V12 | 1280×800, 1440×900 and 1920×1080 fit without horizontal overflow; world resizes correctly; crew and playback remain reachable | T02 |
| V13 | Missing required atlas, mismatched atlas image/hash, invalid session and WebGL context loss produce visible, recoverable failures | T02 |
| V14 | Reduced motion stops decorative cycling/focus animation, while source position and normal controls remain correct | T02 |
| V15 | Fresh production reload has no unexplained console errors or failed requests; intended negative cases are separately recorded | T01/T02 |
| V16 | Current candidate hashes, successful build and actual served index/asset bytes agree; checkpoint files are immutable snapshots | T01/T02 |
| V17 | Frame-time, long-stall, transfer and decoded-memory evidence is collected on a named device under comparable conditions | T02 |
| V18 | 50/200/500 synthetic-sprite samples cannot change session, selected frame or user-facing agent/discovery counts | T02 |

Reuse the current meaningful controller tests. Add only tests that exercise new atlas parsing, projection, phase/facing and lifecycle risks. Do not assert a constant against its own implementation or create tests for static wording merely to increase a count.

Browser selection checks must click the world, not just call a hidden select function. Test the camera inverse at more than one zoom and after a pan. Use visible controls for replay, speed and selection; read-only diagnostics can verify the result.

## Performance protocol

Targets are provisional, not observed results:

- Real recorded world at 1440×900: median frame interval ≤16.7 ms and p95 ≤33.3 ms.
- Local bytes transferred to first interactive scene: ≤5 MiB; all required robot/colony assets on disk: ≤8 MiB.
- 200 synthetic sprites: p95 ≤33.3 ms as an experimental target. 50 is a control; 500 is a stress sample with no pass promise.
- No inference/network-service benchmark is implied.

Use a foreground headed browser with hardware rendering. Record OS/browser/GPU/backend, CSS viewport, canvas buffer size, DPR, selected mode, asset counts and camera zoom. Finish loading, wait five seconds, then capture at least 1,800 frame intervals. Include long intervals in the distribution and report >50 ms, >100 ms and ≥500 ms counts. Do not discard inconvenient stalls. If the page becomes hidden, invalidate and restart that sample; do not silently splice samples.

Measure static colony and moving replay separately. Stop video recording and other owned renderer sessions while measuring. Keep at most one renderer under test active. Test each load count independently and report all three, including failures. A target miss is TARGET_NOT_MET with conditions, not an implied engine failure or a fabricated PASS.

For transfer, use a fresh browser context and local resource timing or the browser's supported network evidence. Count document and resource transfers, avoid double-counting cache hits, and report cross-origin requests separately. Prefer system fonts/local assets so the candidate does not depend on external font delivery. Record required image dimensions, estimated decoded RGBA bytes, texture count and actual accessible allocation counters; do not label disk size as GPU memory.

The old B1 receipt reports median 17.2 ms/p95 25.1 ms with a different sampling/filter policy. It is historical context, not a directly comparable new benchmark. If claiming an improvement, measure both builds now on the same device/DPR/protocol and save fresh old-renderer evidence only in the new comparison run. If the old preview is unavailable, report comparison not_evaluable and continue the new candidate's own measurements.

## G01 evidence

After T01, create an unused `checkpoints/G01/v1/` (or next revision). Required files:

- REVIEW.md with recommendation, actual scale/alpha/loop observations and limits.
- Scale light/dark screenshots and an idle/walk movement video.
- Source reference hash, derivative hash, atlas metadata and provenance.
- Build, unit and browser check receipts.
- A frozen `candidate/` snapshot of the exact new app source/config/lock/public assets and built dist, plus selected design contracts.
- manifest.json binding the snapshot and review/evidence. Its own hash is recorded separately by the coordinator.

No node after G01 proceeds until the explicit user response names or is unambiguously attached to that candidate. Record the original response, date, manifest digest and chosen scale/art direction in a separate decision receipt. Do not edit the manifest to manufacture approval.

## G02 evidence

Create an unused `checkpoints/G02/v1/` or next revision. Include the same complete candidate snapshot and identity rules plus:

- Full scene at all three required viewports.
- Robot and building close-ups.
- 20–45 second actual replay/selection/pan/zoom recording; trim only idle setup if necessary and retain the raw capture.
- Browser interaction, negative-case, disposal and unit/build receipts.
- Named-device static/replay/load-mode performance and transfer accounting.
- Comparison with the old B1 screenshot/preview, clearly identified as a different art direction.
- Known gaps: directional art approximation, shared character design, recorded-only behavior, target misses and unresolved provenance.
- Reproducible launch instructions, current two-lane status and the next explicit user question.

Manifest rows point to files inside the frozen candidate/evidence package. External read-only inputs are identified by path and hash. Exclude node_modules, mutable runtime caches, raw credentials and the manifest's own bytes. Later source edits produce a new candidate rather than invalidating a previous decision's bytes in place.

G02 receipt choices may be “revise this comparison”, “prefer the 2D direction for the next UI checkpoint”, or “retain the 3D direction”. Their exact words come from the user. They do not implicitly authorize deletion, renderer cutover, B2 implementation, deployment or live agent integration beyond the session's selected scope.
