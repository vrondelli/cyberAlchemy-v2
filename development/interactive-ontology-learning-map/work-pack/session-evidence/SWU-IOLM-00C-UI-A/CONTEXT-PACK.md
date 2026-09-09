# Runtime Handoff Pack — SWU-IOLM-00C-UI-A

## Identity

- Task/SWU: `SWU-IOLM-00C-UI-A`
- Source task/work-pack: `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md` and `work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
- Session/run id: `goal-profile-20260722-iolm-ui-a`
- Session evidence path: `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/`
- Runtime handoff: `runtime`
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`; the worktree also contains the approved, uncommitted IOLM Refresh and this pack, so the source hashes below are the execution preimages.
- Evidence date: `2026-07-22`
- Selected unit state: `selected`, dependency-ready, implementation not started.

## Obligation Coverage

| Obligation | Status | Selected evidence | Resolution |
| --- | --- | --- | --- |
| `UIA-01` dependency and approval | covered | 00C-A `RESULT.md`; applied Refresh report; Work-Pack UI-A row | Require `iolm-candidate-contract/v1` and `iolm-workable-example-refresh-applied/v1`. |
| `UIA-02` exact write and forbidden scopes | covered | task `SWU` table; Dispatch step/boundary/namespace | Implementation stays under `cyberAlchemy-v2/development/iolm-workable-example/**`; lifecycle evidence stays in this directory. |
| `UIA-03` exact native package tree and runtime floor | covered | findings `#exact-first-build-slice-and-file-boundary`; task `#exact-implementation-file-contract` | Python 3.11+, Node 22+, ES2022 browser; no package or browser installation. |
| `UIA-04` pinned source binding | covered | findings `#pinned-input-contract`; three checked-in fixture files | Bind the three canonical paths, all nine values, exact 4/3 counts, four node IDs, and three edge IDs before port bind. |
| `UIA-05` filesystem and HTTP containment | covered | task `#binding-and-server-acceptance`; findings `#data-flow-and-observable-default` | Reject escapes, alternate paths, symlink components, unknown routes, and non-GET/HEAD methods. |
| `UIA-06` immutable snapshot architecture | covered | task `#data-path-and-evidence`; findings `#recommended-architecture` | One `DemoSnapshotV1` supplies all views; renderers cannot own semantics. |
| `UIA-07` complete UI behavior | covered | findings `#data-flow-and-observable-default`; task primary behavior | Default 4/3 graph, exact 2/1 question slice, graph/outline/table, shared selection, and persistent provenance inspector. |
| `UIA-08` posture, exclusions, and forbidden controls | covered | findings `#authority-limits`; task machine fence | Persistent private candidate/none posture; no edit, approve, promote, waive, close, publish, rebuild, or source-write action. |
| `UIA-09` pure-model, server, red-control, and deterministic automation | covered | findings `#acceptance-and-red-checks`; task evidence contract | Node/Python checks cover the exact accepted positive and negative behavior and write durable result files. |
| `UIA-10` black-box Playwright behavior | covered | operator request; local Playwright skill; Firefox preflight | Drive the real rendered UI with Playwright CLI and the scenario matrix below; store evidence only under this lifecycle directory. |
| `UIA-11` manual evidence truth | covered | Work-Pack gate 9; findings manual checks | Playwright may add automated regression evidence but cannot mark manual keyboard, AT, reduced-motion, visual, usability, or full-browser checks passed. |
| `UIA-12` result aggregation and eligibility fence | covered | findings result contract; Dispatch receipt | Binding/security failure=`BLOCK`; other required failure=`FAIL`; outstanding manual checks keep overall=`NOT_RUN`; carry all six exclusions. |
| `UIA-13` iteration and closeout | covered | wave stop; Dispatch stop conditions | Iterate within scope until implementation plus all required automated and Playwright checks pass; then return one Task Session-compatible receipt and stop. |
| `UIA-14` worktree preservation | resolved | current Git state and exact scopes | Preserve every pre-existing/uncommitted change; never normalize or revert files outside the two allowed write roots. |

Strict coverage: `pass` — 14/14 obligations are covered or explicitly resolved.

## Selected Sources

1. `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md`
   - Selectors: `#control-fields`, `#task-status-board`, `#swu-execution-handoff`, `#gate-checks`, `#next-handoff`
   - Obligations: `UIA-01`, `UIA-02`, `UIA-11`, `UIA-13`
   - SHA-256: `d93afd838ce006def08f7d52dd12340a1e155db99a7a7b39c25e233ab1879468`
2. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
   - Selectors: all contract headings; this is the selected-unit authority.
   - Obligations: `UIA-01` through `UIA-13`
   - SHA-256: `a666e6b632742d3b365339787aa9cac59058a45928bae9b88f2bf27782c5216b`
3. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/waves/W0C-UI.md`
   - Selectors: entry, selected unit, merge policy, exit, recomposition, authority, stop.
   - Obligations: `UIA-01`, `UIA-11`, `UIA-13`
   - SHA-256: `82f214198fc2676f3fb2c306792fb7f4957adf73b45bd8637059c43a48bc140a`
4. `cyberAlchemy-v2/development/interactive-ontology-learning-map/refreshes/2026-07-22-iolm-workable-example/REFRESH-REPORT.md`
   - Selectors: `#result`, `#applied-changes`, `#validation`, `#next-route`
   - Obligations: `UIA-01`, `UIA-02`, `UIA-13`
   - SHA-256: `b3d4ceff3818dbad7537b14cc8a8a538692961e2f78c1c20bdbc4f9346a26207`
5. `cyberAlchemy-v2/development/research/2026-07-22-iolm-workable-example/findings.md`
   - Selectors: `#recommended-architecture`, `#exact-first-build-slice-and-file-boundary`, `#pinned-input-contract`, `#data-flow-and-observable-default`, `#exact-commands-and-url`, `#acceptance-and-red-checks`, `#authority-limits`
   - Obligations: `UIA-03` through `UIA-13`
   - SHA-256: `8acf9ba6341f2d01734f00bcb2d6aef1927cdd6ec1b2ee067321fdb53581d2e0`
6. `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json`
   - Selectors: `/steps/s0c-ui-workable-example`, `/gates/g0c-ui-workable-example`, `/boundary_evidence/boundaries/b0c-ui-sidecar-split`, `/boundary_evidence/state_namespaces/fixture-workable-example`, `/boundary_evidence/receipts/r0c-ui-workable-example`
   - Obligations: `UIA-01`, `UIA-02`, `UIA-04`, `UIA-12`, `UIA-13`
   - SHA-256: `5a6afd03a8c3bf3f49316ed215a2dc6ce7c9fc899d5b5fda3e25b514601b114a`
7. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-A/RESULT.md`
   - Selectors: `#candidate-contract-handle`, `#acceptance-verdict`, `#residue-and-stop`
   - Obligations: `UIA-01`, `UIA-08`
   - SHA-256: `89d3d19a9f7069699234b6f9e9575a503114a264461e05cfcecd2a5e13fe5a63`
8. `cyberAlchemy-v2/development/interactive-ontology-learning-map/prototype/contracts/candidate/candidate-input.schema.json`
   - Selectors: `/required`, `/properties/posture`, `/properties/authority`
   - Obligations: `UIA-01`, `UIA-08`
   - SHA-256: `56546ed44cceb98ffa6c056a687567785724a0699531fa91757287cad534a6c9`
9. `cyberAlchemy-v2/development/interactive-ontology-learning-map/prototype/contracts/candidate/candidate-build-receipt.schema.json`
   - Selectors: `/required`, `/properties/evidence_for`, `/properties/authority_limits`
   - Obligations: `UIA-08`, `UIA-12`
   - SHA-256: `e02d261580d5485ef35e36cef854301fa0af08326e192806c5452bdbba9aa7a7`
10. `cyberAlchemy-v2/development/interactive-ontology-learning-map/prototype/contracts/candidate/candidate-view.schema.json`
    - Selectors: `/required`, `/properties/nodes`, `/properties/edges`
    - Obligations: `UIA-06`, `UIA-08`
    - SHA-256: `52810b4f7a3234cf53976375c2aa6103b6ab61a5247e9db71a38c227ab728f5f`
11. `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json`
    - Selectors: `/nodes`, `/edges`, `/source_set_digest`, `/authority`
    - Obligations: `UIA-04`, `UIA-06`, `UIA-07`
    - SHA-256: `66a63b80141274d7c803820c668f521d1676961e7362d8e9af1b03061c4b4a65`
12. `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json`
    - Selectors: `/records`, `/inputs`, `/source_set_digest`
    - Obligations: `UIA-04`, `UIA-05`
    - SHA-256: `3d5db5ae885b93b4c490057597624c96ff53d3061d33af7ba289878d1eded831`
13. `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json`
    - Selectors: `/generator_version`, `/source_set_digest`, `/artifacts`, `/authority`, `/status`
    - Obligations: `UIA-04`, `UIA-12`
    - SHA-256: `1a5be10941d8342451d71e80dacc3bdd9ecfbe39412b22ffde617cd04370e20d`
14. `/home/vrondelli/.codex/skills/playwright/SKILL.md`
    - Selectors: `#prerequisite-check`, `#core-workflow`
    - Obligations: `UIA-10`, `UIA-11`, `UIA-13`
    - SHA-256: `f430b5cc1880097ef2b7358cc1fd6015f25dce722b810c0952ced52c93cd9bca`

## Architecture Guidance

```text
PinnedMintedFixtureGateway
  -> MintedFixtureBindingGuard
  -> DemoSnapshotV1Adapter
  -> DemoSnapshotV1Guard
  -> QuestionSliceSelector
  -> Graph | Outline | Table
                       -> shared selection -> provenance inspector
```

- The gateway is the only later replacement seam. `DemoSnapshotV1` is immutable and candidate-only.
- Graph, outline, and table are co-primary pure projections over the same active stable-ID set.
- Selection is stable-ID state shared across lenses; the inspector reads the snapshot, never renderer markup.
- The default screen exposes exactly 4 nodes/3 relations. The Player question exposes exactly 2 nodes/1 relation.
- Use native HTML, CSS, ES modules, SVG, and semantic tables. Do not add React, ELK, `@playwright/test`, or another package.

## Pinned Binding Summary

- Paths: the exact three fixture paths in selected sources 11–13.
- Source-set digest: `6316759c5fc26835c1dcdd951d4fdc9e9def708bdbf38941cfe62512b4987b95`.
- Profile: `feature-with-independent-node-files@1`.
- Profile digest: `0cbc0b58f35b39bd45698d4f19ce4d853e4ae26c6242633df8952e20f81423e5`.
- Generator: `fixture-generator/v1`.
- Kinds digest: `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede`.
- Relationships digest: `567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`.
- Nodes: `key-and-door.DoorUnlocked`, `key-and-door.HasKeyRule`, `key-and-door.Player`, `key-and-door.UnlockDoor`.
- Edges: `key-and-door.edge.has-key-rule-enforces-unlock-door`, `key-and-door.edge.player-performs-unlock-door`, `key-and-door.edge.unlock-door-produces-door-unlocked`.

## Black-Box Playwright Matrix

Use `/home/vrondelli/.codex/skills/playwright/scripts/playwright_cli.sh` with a named session and `--browser firefox`. Preflight on 2026-07-22 proved `npx`, the wrapper, Firefox launch, snapshot, and close. Chrome is absent; do not install it. Start the validated loopback server in a managed terminal session, then run from this lifecycle directory so `.playwright-cli/`, screenshots, and traces remain under `output/playwright/<run-id>/`.

| ID | Real-browser assertion | Required evidence |
| --- | --- | --- |
| `PW-BB-01` | Load the deep URL; posture banner and `4 nodes / 3 relations` are visible; `UnlockDoor` is selected. | snapshot, URL, screenshot, assertion result |
| `PW-BB-02` | Activate the Player question; exact 2-node/1-relation counts and IDs appear. | before/after snapshots and assertion result |
| `PW-BB-03` | Switch graph -> outline -> table; each rendered lens exposes the same active stable-ID set. | per-lens DOM ID capture and screenshots |
| `PW-BB-04` | Select a node and relation, switch lenses, and prove selection plus provenance inspector identity persist. | inspector field capture and transition trace |
| `PW-BB-05` | Inspector exposes artifact role, posture, authority effect, owner route, source reference, binding, validation state, relation class where applicable, and provenance. | rendered text/attribute assertions |
| `PW-BB-06` | Unknown `selected` ID produces a typed blocked selection state and never silently selects another record. | deep-link snapshot and assertion result |
| `PW-BB-07` | Network log contains application assets and only the three allowed `/fixtures/*` routes; console has no error. | request inventory and console capture |
| `PW-BB-08` | No edit/approve/promote/waive/close/publish/rebuild/source-write control is rendered. | role/text absence assertions |
| `PW-BB-09` | Firefox reduced-motion emulation disables optional motion while counts, coordinates, focus target, and selection remain stable. | `run-code` result and snapshots; automated regression only |
| `PW-BB-10` | Keyboard smoke can reach question, lenses, records, and inspector with no trapped focus. | focus-sequence capture; automated regression only |

Always snapshot before using element refs and re-snapshot after every material UI change. `run-code` may use semantic roles, text, stable `data-*` IDs, and `page.emulateMedia`. Record every scenario in `automated-results.json` with browser, command, artifact paths, and verdict. Playwright failures are required automated failures. Playwright success does not update any manual check in `manual-results.json`.

## Constraints And Non-Goals

- Exact implementation scope: `cyberAlchemy-v2/development/iolm-workable-example/**`.
- Lifecycle append scope: this directory, limited to Context Builder/Goal artifacts, `output/playwright/**`, and the Task Session result/receipt.
- Read-only inputs: the 14 selected sources and three pinned fixture files.
- Forbidden: `projects/domainspec-v2/**` mutation, existing IOLM `prototype/**`, 00C-B/C, CAV2 authority, public `arcanum/**`, promotion, publication, production integration, dependency/browser installation.
- Do not expose arbitrary repository paths, bind a non-loopback host, add mutation routes, rebuild fixtures, or emit a candidate/DomainSpec consumer receipt.
- Preserve current unrelated and uncommitted worktree changes.

## Write Scope

- `cyberAlchemy-v2/development/iolm-workable-example/**`
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/**` for lifecycle evidence only; do not rewrite this pack, its index, or the goal profile during execution.

## Validation Surface

1. `python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py --repo-root "$PWD" --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json --check`
2. `node --test cyberAlchemy-v2/development/iolm-workable-example/tests/*.test.mjs`
3. `python3 -m unittest cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py`
4. Start `serve_demo.py` on `127.0.0.1:4173` in a managed session, run `PW-BB-01` through `PW-BB-10` with the Playwright wrapper and `--browser firefox`, then close the browser and server.
5. Re-run steps 1–3 after browser-driven work and verify `generated/runs/<run-id>/{automated-results.json,manual-results.json,validation-summary.json}`.
6. `git diff --check -- cyberAlchemy-v2/development/iolm-workable-example cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A`
7. Verify no write escaped the two allowed roots and the six-value `ineligible_for` fence is present in every durable result.

## Gaps And Blockers

- `B-IOLM-UI-MANUAL-RUNNERS` — deferred validation-state blocker. It does not block implementation or automated/Playwright checks; it blocks overall `PASS`, which must remain `NOT_RUN` until named humans perform the manual protocol.
- `B-IOLM-CROSS-FEATURE` — independent upstream blocker for 00C-B only. UI-A cannot affect it.
- `G-PWCLI-RUNTIME-DRIFT` — fallback-only. If the local wrapper or Firefox behavior differs from this pack, inspect only local `--help`/skill-script surfaces, report the extra source, and stop if resolution requires installation or scope expansion.

## Authority Precedence

1. The selected UI-A task, applied Refresh, and main Dispatch scope/gates.
2. Accepted 2026-07-22 findings for architecture, bindings, exact tree, validation, and claim limits.
3. Passed 00C-A contract handle and candidate schemas for posture/authority separation.
4. Pinned fixture bytes for read-only runtime data.
5. This handoff pack for execution selection and the operator-added black-box Playwright verification.

## Fallback Exploration Rule

Fallback exploration is `named-gaps-only`. It is limited to `G-PWCLI-RUNTIME-DRIFT` or a new gap explicitly named before exploration. Every extra source must be listed in the runtime result with the gap it addressed and whether it changed the implementation or verdict. Do not use fallback exploration to widen scope, install dependencies, or revisit settled architecture.

## Stop And Receipt Contract

- Iterate until the complete sidecar and all required pure-model, server, security, red-control, deterministic, and `PW-BB-*` automated checks pass.
- Stop blocked before mutation or further iteration if a pinned binding fails, a required runtime is unavailable, a dependency/browser install is needed, scope must widen, an authority decision is required, or an exact contract cannot be met.
- Successful automated completion may return a passing narrow implementation-and-automation receipt while `validation-summary.json` remains overall `NOT_RUN` because manual checks are outstanding.
- The final receipt names exact changed files, commands, automated result, manual result, overall summary, Playwright artifacts, exclusions, blockers, residue, extra sources, and next route; then stop without selecting any further SWU.

## Provenance

- Source refs: the 14 selected sources and selectors above.
- Source preimages: SHA-256 values above; repository HEAD `6b691fe11d35403a92f52eb8a138e524ca67a265`.
- Builder mode: `standard`, 14 files, strict runtime handoff, 14/14 obligations.
- Playwright readiness: `npx=PASS`, wrapper executable=`PASS`, Firefox open/snapshot/close=`PASS`, Chrome unavailable and intentionally not installed.

## Output Paths

- Markdown: `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/CONTEXT-PACK.md`
- JSON/index: `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/context-pack.json`
- Goal profile: `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/CODEX-GOAL-PROFILE.md`
