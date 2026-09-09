# Runtime Handoff Pack — SWU-IOLM-00C-UI-A4

## Identity

- Task/SWU: `SWU-IOLM-00C-UI-A4`
- Session/run id: `20260722T160251Z-firefox`
- Runtime: local Task Session using the bundled Playwright CLI wrapper and real Firefox
- Evidence date: `2026-07-22`
- Builder mode: `standard --strict`; 13 sources selected
- Selection authority: A3 passed; `iolm-ui-a3-a4-refresh-applied/v1` selected A4 alone under the operator's non-blocking sidecar authorization

## Obligation Coverage

| Obligation | Status | Resolution |
| --- | --- | --- |
| `A4-O01` receipt chain/selection | covered | A1–A3 pass; A4 alone selected |
| `A4-O02` exact write scope | covered | manual contract, one generated run, A4 lifecycle/playwright output only |
| `A4-O03` real Firefox | covered | local wrapper with named session and `--browser firefox` |
| `A4-O04` ten scenarios | covered | exact `PW-BB-01`–`PW-BB-10` matrix inherited from the approved split |
| `A4-O05` snapshot discipline | covered | snapshot before refs; resnapshot after material changes; screenshots retained |
| `A4-O06` network/console | covered | request/console evidence is required before passing browser acceptance |
| `A4-O07` deterministic replay | covered | all Node/Python/pre-bind checks must rerun after a complete browser pass |
| `A4-O08` truthful manual state | covered | all unperformed human checks remain `NOT_RUN` |
| `A4-O09` aggregation precedence | covered | binding/security `BLOCK`; other failure `FAIL`; otherwise manual `NOT_RUN`; all pass only => `PASS` |
| `A4-O10` repair ownership | covered | any implementation defect stops A4 and routes to A1, A2, or A3 without repair |
| `A4-O11` claim fence | covered | browser evidence is private demo evidence and retains all six exclusions |
| `A4-O12` terminal outcome | covered | emit `iolm-browser-acceptance/v1` only on passing automated scope; otherwise typed defect receipt |

Strict coverage: `pass` (`12/12`).

## Black-Box Matrix

| ID | Assertion |
| --- | --- |
| `PW-BB-01` | Deep URL shows posture, 4 nodes / 3 relations, and selected UnlockDoor |
| `PW-BB-02` | Player question shows exact 2 nodes / 1 relation and expected IDs |
| `PW-BB-03` | Graph, outline, and table expose the same active stable-ID set |
| `PW-BB-04` | Node/relation selection and inspector identity persist across lenses |
| `PW-BB-05` | Inspector exposes required role, posture, authority, route, binding, validation, class, and provenance |
| `PW-BB-06` | Unknown selected ID renders typed blocked state without fallback |
| `PW-BB-07` | Network stays within application assets and three fixture routes; console has no error |
| `PW-BB-08` | Forbidden authority/source-writing controls are absent |
| `PW-BB-09` | Reduced-motion emulation preserves content, layout, focus and selection while motion is disabled |
| `PW-BB-10` | Keyboard reaches questions, lenses, records and inspector without focus trap |

## Selected Sources

- task contract — `d54f19c633bd6209aa6a3bd4896ddb3d9b0c5eba31f204ec841d11934ba67d3a`
- Work-Pack — `c4ab3a1d834c591f20565c5dc207c8e8bbcb801e4cd78104af21e0dfa5171ea2`
- W0C-UI wave — `70c7e4fba008d821aa1b0c0721fcfe9149a4f6dab5eafb2341cf50a39db6e6a1`
- Execution Pack — `30dffee9edeb60f25d1885ba16ce4a453e9a7b9888f772541efac988773d801a`
- Dispatch A4 step/gate — `abda2d393c1958169a20cbc548f52bedab2cdd2e5233024d54e8e7420cbac087`
- accepted findings — `8acf9ba6341f2d01734f00bcb2d6aef1927cdd6ec1b2ee067321fdb53581d2e0`
- A3 execution receipt — `a5552f75dfb52d4c25417539b148af236f81ece43f57b490187855ab119c6035`
- A2 execution receipt — `0423a0d0b9b56e86ef4adfceac382f39d054a9da22a3e1d3d69b27d991f0c674`
- A1 execution receipt — `a7730f7128b35def8a8a5929770caf1504b3f41a3d1b6adddd16ed68b7768c44`
- approved split's exact Playwright matrix — `7602815f9dc96a9660fd00e8d709f40a8386aa0e825c4ae2c956c8f3358165ff`
- Playwright skill — `f430b5cc1880097ef2b7358cc1fd6015f25dce722b810c0952ced52c93cd9bca`
- bundled wrapper — `d919410a103b575361e6bcea39bdcd684dfb9d0f5ecec9c44b0d4264047cc139`
- A3→A4 Refresh owner receipt — `8560a56eb856017f20c74f3cdc7ba10d98ee438b774be9a7407eeac755179f16`

## Write Scope

- `cyberAlchemy-v2/development/iolm-workable-example/manual/MANUAL-CHECKS.md`
- `cyberAlchemy-v2/development/iolm-workable-example/generated/runs/20260722T160251Z-firefox/{automated-results.json,manual-results.json,validation-summary.json}`
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A4/**`

Every A1–A3 implementation file is read-only. A4 cannot repair a browser defect.

## Runtime Record And Stop

- `npx`, wrapper and Firefox launch passed.
- Browser session: `iolm-a4`; deep URL `http://127.0.0.1:4173/?lens=graph&selected=key-and-door.UnlockDoor`.
- The current run passed `PW-BB-01`–`03` and failed `PW-BB-04` in Firefox: a relation-table click sent a text-node event target to `selectFromElement`, which called unavailable `closest()` and left selection unchanged.
- Repair owner: `SWU-IOLM-00C-UI-A3`. Stop A4, preserve evidence, and do not execute `PW-BB-05`–`10` or deterministic replay as if acceptance had completed.
