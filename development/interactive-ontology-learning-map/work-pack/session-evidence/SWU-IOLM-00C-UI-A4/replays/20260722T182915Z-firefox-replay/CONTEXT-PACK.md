# Runtime Handoff Pack — A4 Firefox replay

## Identity

- Task/SWU: `SWU-IOLM-00C-UI-A4` replay
- Run: `20260722T182915Z-firefox-replay`
- Runtime: local Task Session using the bundled Playwright CLI and Firefox
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`
- Selection authority: `iolm-ui-a3-repair-a4-replay-refresh-applied/v1`
- Source handle: fresh repaired `iolm-interactive-viewer/v1`
- Builder mode: `standard --strict`; 14 sources

## Obligation Coverage

| ID | Obligation | Resolution |
| --- | --- | --- |
| `A4-R01` | fresh dependency and sole selection | A1/A2 pass, A3 repair passes, and the refresh selects exactly one A4 replay |
| `A4-R02` | immutable write scope | only the new generated run, Playwright output, and replay lifecycle directories are writable |
| `A4-R03` | real Firefox | bundled CLI must open with `--browser firefox`; no Chromium substitution |
| `A4-R04` | ten ordered scenarios | execute exact `PW-BB-01` through `PW-BB-10` and fail fast on implementation defects |
| `A4-R05` | snapshot discipline | snapshot before ref use and after every material UI change; retain screenshots |
| `A4-R06` | network and console | bind request inventory plus empty error-console evidence |
| `A4-R07` | deterministic replay | rerun Node, Python, and pre-bind checks only after all browser scenarios pass |
| `A4-R08` | truthful manual state | named-human checks remain `NOT_RUN`; automation cannot change them |
| `A4-R09` | exact aggregation | automated pass plus manual `NOT_RUN` produces overall `NOT_RUN` |
| `A4-R10` | repair ownership | any new implementation defect returns to A1/A2/A3; A4 cannot repair code |
| `A4-R11` | six-value fence | every durable result retains all six exclusions and `authority_effect: none` |
| `A4-R12` | historical immutability | do not overwrite the failed `20260722T160251Z-firefox` run or root A4 receipt |
| `A4-R13` | watcher fallback | use `CHOKIDAR_USEPOLLING=1` only for CLI processes; do not alter sysctl or unrelated VS Code processes |
| `A4-R14` | terminal evidence | emit the narrow browser handle only if automated scope passes; preserve manual/overall truth |

Strict coverage: `pass` (`14/14`).

## Black-Box Matrix

| ID | Assertion |
| --- | --- |
| `PW-BB-01` | Deep URL shows permanent posture, 4 nodes / 3 relations, and selected UnlockDoor. |
| `PW-BB-02` | Player question shows exactly 2 nodes / 1 relation and the three expected stable IDs. |
| `PW-BB-03` | Graph, outline, and table expose the same active stable-ID set. |
| `PW-BB-04` | Node/relation selection and inspector identity persist across lenses. |
| `PW-BB-05` | Inspector exposes role, posture, authority, route, binding, validation, class, and provenance. |
| `PW-BB-06` | Unknown selected ID renders a typed blocked state with no fallback selection. |
| `PW-BB-07` | Requests stay inside application assets and three fixture routes; console has no errors. |
| `PW-BB-08` | Forbidden authority-bearing and source-writing controls are absent. |
| `PW-BB-09` | Reduced-motion emulation disables motion while counts, coordinates, focus, and selection remain stable. |
| `PW-BB-10` | Keyboard reaches questions, lenses, records, and inspector behavior without a focus trap. |

## Selected Sources

- UI task contract — `2afe9f1309bbe7f32849650e90fb7b533942e7dc416a09c1b5ed2a3d0e97aaa5`
- Work-Pack — `9d0f28614bdd7921d79162bc697df18f2b422e575efe05cddee9453890502b63`
- W0C-UI wave — `545d0b2401ea7dab02a73ac311ff7eeb91d80d55744fd3f573c5252ce5cf03f1`
- Dispatch — `6d010c786168559e7e310baba54877d88bdac6c676783cb0921cd7ffab45e355`
- fresh A3 repair receipt — `4db0c420404db640ac4bd6f332e90dc402ced4873e0ed18e42f252a86222ea33`
- A2 receipt — `0423a0d0b9b56e86ef4adfceac382f39d054a9da22a3e1d3d69b27d991f0c674`
- A1 receipt — `a7730f7128b35def8a8a5929770caf1504b3f41a3d1b6adddd16ed68b7768c44`
- A3-repair-to-A4 refresh receipt — `2cca13239b902c3930f34b789d5ded1037a252db7a669eeb2c91b42478256e7e`
- original A4 defect receipt — `4c1a0df1331973b9565929f936583a11ef88b49752b01ee5573f2937856ec1a9`
- manual protocol — `955c01f069e3d359fffcc11ef54941401686c1b05a9d999738c1b78f48f0edaa`
- approved browser matrix source — `7602815f9dc96a9660fd00e8d709f40a8386aa0e825c4ae2c956c8f3358165ff`
- Playwright skill — `f430b5cc1880097ef2b7358cc1fd6015f25dce722b810c0952ced52c93cd9bca`
- bundled CLI wrapper — `d919410a103b575361e6bcea39bdcd684dfb9d0f5ecec9c44b0d4264047cc139`
- reduced-motion CSS contract — `d934667148f13b6b2fc55a809d7a4d421f113abc5fb5276c494e88198d965c5d`

## Write Scope

- `cyberAlchemy-v2/development/iolm-workable-example/generated/runs/20260722T182915Z-firefox-replay/**`
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/output/playwright/20260722T182915Z-firefox-replay/**`
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/replays/20260722T182915Z-firefox-replay/**`

All implementation, the original generated run, the root A4 lifecycle files,
and the manual protocol are read-only.

## Validation and Runtime Fallback

- Browser: named session `iolm-a4-replay`, `--browser firefox`, server `127.0.0.1:4173`.
- Playwright CLI uses `CHOKIDAR_USEPOLLING=1` because the VS Code extension host currently consumes approximately 508,866 of 524,288 available inotify watches. This is process-local and does not alter the host.
- After all browser scenarios pass: rerun all Node tests, Python server tests, `serve_demo.py --check`, JSON/result validation, exact fence checks, and scoped diff hygiene.

## Gaps, Constraints, and Stop Boundary

- `B-IOLM-UI-MANUAL-RUNNERS` remains deferred; it forces manual and overall states to `NOT_RUN`, not automated failure.
- The manual protocol's opening sentence describes the immutable failed run. Per-run `manual-results.json` is authoritative for this replay; the protocol rows and required observations remain unchanged.
- `B-IOLM-CROSS-FEATURE`, 00C-B/C, G-DSV2-SG, DomainSpec, authority, promotion, publication, and public Arcanum are outside this task.
- No package/browser installation, system-limit mutation, implementation repair, or reuse of old output paths is allowed.
