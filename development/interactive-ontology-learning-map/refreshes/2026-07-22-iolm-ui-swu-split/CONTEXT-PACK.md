# Context Pack — IOLM UI SWU Split Refresh

## Identity

- Task: review and refresh `SWU-IOLM-00C-UI-A` after the execution profile exposed an overbuilt unit.
- Mode: Invoke Refresh, `proposal-only`.
- Evidence date: `2026-07-22`.
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`; target files also contain the approved, uncommitted workable-example Refresh and are bound by the hashes below.
- Target root: `cyberAlchemy-v2/development/interactive-ontology-learning-map/`.
- Implementation state: not started; `cyberAlchemy-v2/development/iolm-workable-example/` remains absent.

## Obligation Coverage

| ID | Obligation | Status | Evidence and resolution |
| --- | --- | --- | --- |
| `RS-01` | Preserve the approved workable-example outcome and authority exclusions. | covered | Accepted findings, task, and main Dispatch retain the pinned fixture, native stack, candidate posture, and six-value exclusion fence. |
| `RS-02` | Review whether UI-A is a smallest working unit using new execution evidence. | covered | The Goal profile is `3,678/4,000` characters and its strict index exposes 14 obligations across Python trust-boundary, Node model, browser UI, and evidence-aggregation surfaces. |
| `RS-03` | Identify artifact drift without overstating the operator signal. | covered | The size signal alone is not proof; it triggers review. Independent inputs, outputs, write subsets, and verification commands prove four separable boundaries, contradicting the current Distill claim that splitting necessarily loses meaning. |
| `RS-04` | Select smallest coherent replacement units. | covered | Distill Standard review selects four sequential SWUs: fixture boundary, snapshot model, interactive UI, and browser acceptance. |
| `RS-05` | Prove recomposition and avoid hidden glue. | covered | Each unit emits a typed receipt consumed by the next; all four recompose to the unchanged runnable sidecar outcome through the existing `DemoSnapshotV1` boundary. |
| `RS-06` | Preserve one-at-a-time execution and current external blockers. | covered | Only A1 becomes selected after apply; A2–A4 remain dependency-gated. `B-IOLM-CROSS-FEATURE` remains scoped to 00C-B and manual checks remain `NOT_RUN`. |
| `RS-07` | Define an exact target inventory and mutation boundary. | covered | Fourteen planning/Craft/supersession surfaces are named. Proposal mode writes only this dated package and one observability run record. |
| `RS-08` | Preserve historical execution evidence. | covered | Existing UI-A Context Pack, index, and Goal profile remain immutable and are marked superseded only by a new apply-time marker. |
| `RS-09` | Make apply authorization and the next route explicit. | covered | Apply requires exact approval of `REFRESH-PATCH-PROPOSAL.md`; after validated apply, route only A1 through Context Builder and Goal profiling. |

Strict coverage: `pass` — 9/9 obligations covered.

## Selected Sources

1. `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md`
   - Selectors: UI task row, UI SWU handoff, blockers, next handoff.
   - Obligations: `RS-01`, `RS-06`, `RS-07`.
   - SHA-256: `d93afd838ce006def08f7d52dd12340a1e155db99a7a7b39c25e233ab1879468`.
2. `cyberAlchemy-v2/development/interactive-ontology-learning-map/EXECUTION-PACK.md`
   - Selectors: execution rule, W0C-UI schedule, stop conditions, recomposition.
   - Obligations: `RS-01`, `RS-05`, `RS-06`, `RS-07`.
   - SHA-256: `244799ec6659af8ceb253866831d93baa798627cbbef78f86c976f4a59d299c0`.
3. `cyberAlchemy-v2/development/interactive-ontology-learning-map/IMPLEMENTATION-LAYERING.md`
   - Selectors: L0C-demo row, active window, guardrails, next move.
   - Obligations: `RS-01`, `RS-05`, `RS-06`, `RS-07`.
   - SHA-256: `07345ebe9e9aa8af29c4c352b5e91cd287c8cf06a56bd844a273cbfccaf8b2f0`.
4. `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json`
   - Selectors: UI step, gate, state namespace, receipt, stop conditions.
   - Obligations: `RS-01`, `RS-05`, `RS-06`, `RS-07`.
   - SHA-256: `5a6afd03a8c3bf3f49316ed215a2dc6ce7c9fc899d5b5fda3e25b514601b114a`.
5. `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISTILL-VALIDATION.md`
   - Selectors: UI-A proposer claim, checks, verdict, navigation.
   - Obligations: `RS-02`, `RS-03`, `RS-04`, `RS-05`.
   - SHA-256: `0fc2a832450669b9c64a5fd1ec231e52d0bc75ad1315473961565bdcd92bdc1a`.
6. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
   - Selectors: SWU contract, exact tree, binding/server acceptance, data path, evidence, recomposition.
   - Obligations: `RS-01` through `RS-09`.
   - SHA-256: `a666e6b632742d3b365339787aa9cac59058a45928bae9b88f2bf27782c5216b`.
7. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/waves/W0C-UI.md`
   - Selectors: selected unit, merge policy, exit, stop.
   - Obligations: `RS-05`, `RS-06`, `RS-07`.
   - SHA-256: `82f214198fc2676f3fb2c306792fb7f4957adf73b45bd8637059c43a48bc140a`.
8. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/context.md`
   - Selectors: runtime handoff rule for UI-A.
   - Obligations: `RS-06`, `RS-08`, `RS-09`.
   - SHA-256: `f841cc45b8fbf99e0b7b6e6363c2a2c1ad60fff7374a45001d0f5ffb96f9bad1`.
9. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/traceability.md`
   - Selectors: demo-only witness row and non-authority note.
   - Obligations: `RS-01`, `RS-05`, `RS-07`.
   - SHA-256: `315b109f8b19c23a799165eb317f245feec63b6cf5165b3991c4cb0b8adb2825`.
10. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/cross-task-gaps.md`
    - Selectors: `B-IOLM-UI-MANUAL-RUNNERS`, `B-IOLM-CROSS-FEATURE`.
    - Obligations: `RS-01`, `RS-06`, `RS-09`.
    - SHA-256: `7eebf50bedad381d7a4f815b2547fe2a320f7e8588d1d29f574b1a0ffef75dc3`.
11. `cyberAlchemy-v2/development/research/2026-07-22-iolm-workable-example/findings.md`
    - Selectors: exact file tree, pinned contract, observable behavior, acceptance checks, authority limits.
    - Obligations: `RS-01`, `RS-04`, `RS-05`.
    - SHA-256: `8acf9ba6341f2d01734f00bcb2d6aef1927cdd6ec1b2ee067321fdb53581d2e0`.
12. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/CODEX-GOAL-PROFILE.md`
    - Selectors: budget result and six-field native goal.
    - Obligations: `RS-02`, `RS-03`, `RS-08`.
    - SHA-256: `4a3979dd7a2e05e8c60ba1cb44e5a8566f4eb8b7116bced6fac511395f1dee25`.
13. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/context-pack.json`
    - Selectors: 14-obligation matrix, validation surface, Playwright matrix, write scopes.
    - Obligations: `RS-02`, `RS-03`, `RS-04`, `RS-08`.
    - SHA-256: `d405cf16fb90779ace275c02d5c5822a55a87120fe17428ff754ce1533502054`.
14. `cyberAlchemy-v2/.craft/ledger.yml`
    - Selectors: `CTX-CAV2-IOLM`, `CTX-CAV2-IOLM-WORKABLE-EXAMPLE`, two owned artifact rows, next moves.
    - Obligations: `RS-06`, `RS-07`, `RS-09`.
    - SHA-256: `16ef8dc4f1770d779f3ec5e277f7142ad57af8461abacbb96e29f36d86e895dd`.

## Inventory Lookup

- Machine index: `.arcanum/inventory/index.json`, parsed successfully.
- Selected handle: `iolm-workable-example-research-strategy-result-synthesis`.
- Use: confirms the accepted 4-node/3-edge sidecar route and non-authority boundary.
- Stale residue: the entry still says the Refresh proposal does not exist. This lookup is non-authority and is not an apply target for the SWU split; Inventory backfill is deferred until the split is applied.

## Review Finding

The current `DISTILL-VALIDATION.md` says binding/server, read model, views, and results must remain one SWU to preserve a runnable witness. That conclusion confuses the final recomposed outcome with the smallest executable receipt boundary. The current Goal and strict Context Pack demonstrate four distinct failure domains with separate files, runtimes, outputs, and acceptance surfaces:

```text
Python trust boundary -> immutable JS model -> browser interaction -> browser/evidence acceptance
```

Each earlier receipt is meaningful without claiming that the whole witness is complete. The runnable witness exists after A3; A4 independently proves it in a real browser. Therefore the current one-SWU Distill conclusion is stale and must be replaced on apply.

## Proposed Units

| Unit | Primary behavior | Input handle | Output handle | Independent acceptance |
| --- | --- | --- | --- | --- |
| `SWU-IOLM-00C-UI-A1` | Validate the three pinned sources and expose only the loopback read boundary. | `iolm-candidate-contract/v1` | `iolm-fixture-boundary/v1` | Python binding, realpath/symlink, GET/HEAD, route allowlist, method, and pre-bind tests. |
| `SWU-IOLM-00C-UI-A2` | Produce one immutable, schema-valid `DemoSnapshotV1` and exact full/question slices. | `iolm-fixture-boundary/v1` | `iolm-demo-snapshot/v1` | Node snapshot, join, identity, question-slice, determinism, and typed-negative tests. |
| `SWU-IOLM-00C-UI-A3` | Render synchronized graph, outline, and table with shared selection and provenance inspection. | `iolm-demo-snapshot/v1` | `iolm-interactive-viewer/v1` | Node projection/selection tests plus loopback HTTP asset smoke; no rendered-browser claim. |
| `SWU-IOLM-00C-UI-A4` | Prove the composed viewer through Firefox black-box scenarios and aggregate honest results. | `iolm-interactive-viewer/v1` | `iolm-browser-acceptance/v1` | `PW-BB-01..10`, deterministic suite rerun, evidence/result validation, manual state remains `NOT_RUN`. |

Only A1 is selected after apply. A failed A4 scenario routes a defect to the owning A1, A2, or A3 unit; A4 does not silently widen its write scope to repair implementation.

## Target Inventory For An Approved Apply

1. `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md`
2. `cyberAlchemy-v2/development/interactive-ontology-learning-map/EXECUTION-PACK.md`
3. `cyberAlchemy-v2/development/interactive-ontology-learning-map/IMPLEMENTATION-LAYERING.md`
4. `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json`
5. `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISTILL-VALIDATION.md`
6. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/context.md`
7. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/traceability.md`
8. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/cross-task-gaps.md`
9. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
10. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/waves/W0C-UI.md`
11. `cyberAlchemy-v2/.craft/ledger.yml`
12. derived `cyberAlchemy-v2/.craft/index.json`
13. derived `cyberAlchemy-v2/CRAFT.md`
14. new `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/SUPERSEDED.md`

The apply receipt may update this dated Refresh package. No implementation file may be created by Invoke Refresh.

## Authority And Mutation Boundary

- Existing Goal/context artifacts remain historical execution-planning evidence and are never rewritten.
- The original UI-A is marked `superseded-before-execution`; it is not a parent or a passing receipt.
- `TASK-IOLM-00C-UI` remains the sole parent task and the existing sidecar tree remains the aggregate implementation root.
- A1–A4 retain the six-value `ineligible_for` fence.
- 00C-B/C, G-DSV2-SG, CROSS_FEATURE_UNSUPPORTED, DomainSpec fixtures/compiler, CAV2 authority, public Arcanum, promotion, and publication remain unchanged.

## Authority Precedence

1. Operator request to review the oversized SWU and current approved task/Work-Pack contracts.
2. Accepted workable-example findings for product behavior, exact tree, binding, and authority limits.
3. Current execution profile/index as evidence of runtime breadth, not implementation success.
4. Distill review for the proposed unit boundaries and recomposition.
5. Inventory only as a non-authority lookup surface.

## Excluded Candidates

- Prior Refresh report/proposal: used only as an output-shape template; it does not decide the new split.
- Playwright skill file: its Firefox preflight result is already captured in the selected execution index; browser mechanics do not decide SWU boundaries.
- Three pinned fixture files: their bytes and hashes are unchanged; the split changes ownership and sequencing, not source binding.
- Main 00C-B/C task and decision artifacts: explicitly outside this sibling route.

## Fallback Rule

Fallback exploration is `none` for proposal authoring. Any ambiguity about file ownership, source binding, or receipt semantics during apply becomes a named Refresh-authoring blocker instead of broad discovery.

## Output Paths

- `CONTEXT-PACK.md`
- `context-pack.json`
- `DISTILL-REVIEW.md`
- `REFRESH-DISPATCH.json`
- `REFRESH-PATCH-PROPOSAL.md`
- `REFRESH-REPORT.md`
- `refresh-report.json`
