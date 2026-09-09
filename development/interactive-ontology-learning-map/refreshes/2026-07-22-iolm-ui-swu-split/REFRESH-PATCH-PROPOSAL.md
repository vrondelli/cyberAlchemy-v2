# Refresh Patch Proposal — IOLM UI SWU Split

- Evidence date: `2026-07-22`
- Mutation mode: `proposal-only`
- Apply status: `NOT AUTHORIZED`
- Implementation status: `NOT STARTED`
- Current executable unit: `SWU-IOLM-00C-UI-A`, selected but unexecuted
- Proposed first unit: `SWU-IOLM-00C-UI-A1`, selected only after approved apply

## Exact Intent

Preserve the complete fixture-backed workable-example outcome while replacing the single overbuilt UI-A execution boundary with four sequential, receipt-bound SWUs. The split changes planning and execution granularity only. It does not change product behavior, source binding, runtime floor, package tree, authority posture, eligibility, or the independent blocked compiler route.

## Review Verdict

The current Distill claim that UI-A cannot be split without losing the runnable witness is stale. The strict execution pack and Goal expose four independently testable risk domains:

1. pinned fixture and loopback trust boundary;
2. immutable semantic snapshot;
3. synchronized learner interface; and
4. real-browser acceptance and evidence truth.

The parent task owns the complete runnable witness. Each SWU owns one meaningful intermediate receipt. See `DISTILL-REVIEW.md` for the two-round role trace, closure checks, and recomposition proof.

## Exact Apply Inventory

An apply-approved Refresh may change only:

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
11. canonical `cyberAlchemy-v2/.craft/ledger.yml`
12. derived `cyberAlchemy-v2/.craft/index.json`
13. derived `cyberAlchemy-v2/CRAFT.md`
14. new `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-UI-A/SUPERSEDED.md`

The apply receipt and refreshed JSON may be updated in this dated folder. No file under `cyberAlchemy-v2/development/iolm-workable-example/` may be created or modified by Invoke Refresh.

## Apply Preconditions

Before mutation, the apply must verify these exact preimages:

| Target | SHA-256 |
| --- | --- |
| `WORK-PACK.md` | `d93afd838ce006def08f7d52dd12340a1e155db99a7a7b39c25e233ab1879468` |
| `EXECUTION-PACK.md` | `244799ec6659af8ceb253866831d93baa798627cbbef78f86c976f4a59d299c0` |
| `IMPLEMENTATION-LAYERING.md` | `07345ebe9e9aa8af29c4c352b5e91cd287c8cf06a56bd844a273cbfccaf8b2f0` |
| `DISPATCH.json` | `5a6afd03a8c3bf3f49316ed215a2dc6ce7c9fc899d5b5fda3e25b514601b114a` |
| `DISTILL-VALIDATION.md` | `0fc2a832450669b9c64a5fd1ec231e52d0bc75ad1315473961565bdcd92bdc1a` |
| `work-pack/shared/context.md` | `f841cc45b8fbf99e0b7b6e6363c2a2c1ad60fff7374a45001d0f5ffb96f9bad1` |
| `work-pack/shared/traceability.md` | `315b109f8b19c23a799165eb317f245feec63b6cf5165b3991c4cb0b8adb2825` |
| `work-pack/shared/cross-task-gaps.md` | `7eebf50bedad381d7a4f815b2547fe2a320f7e8588d1d29f574b1a0ffef75dc3` |
| UI task | `a666e6b632742d3b365339787aa9cac59058a45928bae9b88f2bf27782c5216b` |
| UI wave | `82f214198fc2676f3fb2c306792fb7f4957adf73b45bd8637059c43a48bc140a` |
| Craft ledger | `16ef8dc4f1770d779f3ec5e277f7142ad57af8461abacbb96e29f36d86e895dd` |
| Craft machine view | `e43da6ae21a382558969bc8bb27452da2e6fd96700cae121ef396bc5178c80e4` |
| Craft human view | `1cafaff5c32a69f74e3d8508d2a3082850c12ba28644c0969db822626bee8d99` |

The old UI-A Context Pack, JSON index, and Goal profile must also match the source hashes in `context-pack.json` and remain byte-identical after apply.

## Proposed SWU Contract

### `SWU-IOLM-00C-UI-A1` — Pinned fixture boundary

- Dependency: passed `SWU-IOLM-00C-A` handle `iolm-candidate-contract/v1`.
- Primary behavior: validate the exact three fixture paths, all nine pinned values, 4/3 counts, IDs, joins, and containment, then expose only the fixed loopback GET/HEAD surface.
- Output handle: `iolm-fixture-boundary/v1`.
- Exact implementation write subset:
  - `contracts/source-binding.v1.json`
  - `contracts/source-binding.v1.schema.json`
  - `serve_demo.py`
  - `assets/gateway.mjs`
  - `assets/binding-guard.mjs`
  - `tests/binding-guard.test.mjs`
  - `tests/test_server_contract.py`
- Acceptance: Python/Node boundary tests prove hashes, realpaths, symlink rejection, pre-bind failure, fixed fixture routes, application-route containment, GET/HEAD only, 404/405, and no mutation.
- Lifecycle write scope: `work-pack/session-evidence/SWU-IOLM-00C-UI-A1/**`.
- Status after apply: `selected`.

### `SWU-IOLM-00C-UI-A2` — Immutable snapshot model

- Dependency: passing `iolm-fixture-boundary/v1`.
- Primary behavior: transform the guarded fixture bundle into one schema-valid immutable `DemoSnapshotV1`, including exact default and Player question slices.
- Output handle: `iolm-demo-snapshot/v1`.
- Exact implementation write subset:
  - `contracts/demo-snapshot.v1.schema.json`
  - `assets/demo-snapshot-v1.mjs`
  - `assets/question-slice.mjs`
  - `generated/read-models/demo-snapshot.v1.json`
  - `tests/demo-snapshot-v1.test.mjs`
  - `tests/question-slice.test.mjs`
  - `tests/fixtures/demo-snapshot-v1-cross-feature.synthetic.json`
- Acceptance: Node tests prove schema, 4/3 and 2/1 sets, exact IDs, source joins, provenance, immutability, deterministic serialization, and typed negatives.
- Lifecycle write scope: `work-pack/session-evidence/SWU-IOLM-00C-UI-A2/**`.
- Status after apply: `unselected; pending A1 receipt`.

### `SWU-IOLM-00C-UI-A3` — Interactive synchronized viewer

- Dependency: passing `iolm-demo-snapshot/v1`.
- Primary behavior: render the same active stable-ID set as graph, outline, and table with shared selection, persistent provenance inspector, posture strip, and no forbidden controls.
- Output handle: `iolm-interactive-viewer/v1`.
- Exact implementation write subset:
  - `README.md`
  - `index.html`
  - `assets/demo.css`
  - `assets/app.mjs`
  - `assets/selection.mjs`
  - `assets/graph-view.mjs`
  - `assets/outline-view.mjs`
  - `assets/table-view.mjs`
  - `assets/provenance-inspector.mjs`
  - `tests/projections.test.mjs`
  - `tests/selection-inspector.test.mjs`
- Acceptance: pure projection/selection tests plus loopback HTTP asset smoke. It proves the interface source contract, but it cannot claim rendered-browser behavior, the Playwright matrix, accessibility, usability, or manual browser success.
- Lifecycle write scope: `work-pack/session-evidence/SWU-IOLM-00C-UI-A3/**`.
- Status after apply: `unselected; pending A2 receipt`.

### `SWU-IOLM-00C-UI-A4` — Browser acceptance and evidence

- Dependency: passing `iolm-interactive-viewer/v1`; A1 and A2 receipt chain remains bound.
- Primary behavior: exercise the complete sidecar through the real Firefox browser and aggregate honest automated/manual/overall evidence.
- Output handle: `iolm-browser-acceptance/v1`.
- Exact write subset:
  - `manual/MANUAL-CHECKS.md`
  - `generated/runs/<run-id>/{automated-results.json,manual-results.json,validation-summary.json}`
  - `work-pack/session-evidence/SWU-IOLM-00C-UI-A4/**`, including `output/playwright/<run-id>/**`
- Acceptance: run `PW-BB-01` through `PW-BB-10` with the local Playwright wrapper and `--browser firefox`, rerun all deterministic suites, verify network/console/scope/exclusion evidence, and keep every unperformed human check at `NOT_RUN`.
- Repair rule: if browser evidence finds an implementation defect, A4 stops and routes a defect receipt to A1, A2, or A3. A4 cannot modify their implementation files.
- Status after apply: `unselected; pending A3 receipt`.

## Recomposition And Status Delta

```text
SWU-IOLM-00C-A: iolm-candidate-contract/v1
  -> UI-A1: iolm-fixture-boundary/v1
  -> UI-A2: iolm-demo-snapshot/v1
  -> UI-A3: iolm-interactive-viewer/v1
  -> UI-A4: iolm-browser-acceptance/v1
  -> TASK-IOLM-00C-UI narrow implementation-and-automation completion
```

Apply must make these status changes:

- `SWU-IOLM-00C-UI-A`: `selected` -> `superseded-before-execution`.
- `SWU-IOLM-00C-UI-A1`: new, `selected`.
- `SWU-IOLM-00C-UI-A2`: new, `unselected; pending A1`.
- `SWU-IOLM-00C-UI-A3`: new, `unselected; pending A2`.
- `SWU-IOLM-00C-UI-A4`: new, `unselected; pending A3`.
- `TASK-IOLM-00C-UI`: remains `selected/active` until A4's narrow receipt.
- `W0C-UI`: remains active and becomes a four-unit sequential wave.

The original UI-A is not a parent, a passed unit, or a reusable receipt. `SUPERSEDED.md` records that its Context Pack and Goal profile are historical, non-runnable evidence after apply.

## Artifact Deltas

### Work-Pack and Execution Pack

- Replace the single UI-A handoff row with A1–A4 rows and typed dependencies/receipts.
- Select A1 only.
- Change W0C-UI scheduling from one Task Session to four sequential Task Sessions, one selected at a time.
- Retain the parent delivery slice, exact sidecar outcome, exit, and exclusion fence.

### Task and Wave

- Keep one `TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md` parent file.
- Replace its executable UI-A section with the four exact SWU contracts above.
- Keep the aggregate exact package tree; assign each path to one owning SWU.
- Update `W0C-UI.md` to the A1 -> A2 -> A3 -> A4 receipt sequence and stop after A4.

### Implementation Layering and Distill

- Replace “one composed SWU” with “one parent layer outcome delivered through four sequential risk-domain SWUs.”
- Replace the stale Distill argument and verdict with the two-round result in `DISTILL-REVIEW.md`.
- Record why A1 cannot split further, why the three UI lenses must remain together, and why A4 cannot repair implementation silently.

### Main Dispatch

- Replace the one UI step, gate, state namespace, and receipt with four sequential steps/gates/receipts.
- Require typed handle handoffs and block later steps without predecessor receipts.
- Keep the existing sidecar state boundary and six-value promotion guardrail.
- Add a defect-reroute stop from A4 to the owning unit; do not authorize ambient repair.

### Shared Context, Traceability, And Gaps

- Route Context Builder to A1 only after apply.
- Map the demo criterion across A1–A4 rather than one SWU.
- Scope `B-IOLM-UI-MANUAL-RUNNERS` to A4/overall task `PASS`; it remains non-blocking for A1–A3 and automated A4 completion.
- Preserve `B-IOLM-CROSS-FEATURE` unchanged for 00C-B only.

### Craft

- Keep `CTX-CAV2-IOLM-WORKABLE-EXAMPLE`; do not add four child contexts.
- Change its next move to “Context Builder and compact Goal for A1 only.”
- Update task/wave artifact notes from one-unit to four-unit sequential route.
- Update the parent IOLM next move consistently.
- Mutate the canonical ledger first, then regenerate `.craft/index.json` and `CRAFT.md` as derived views.

## Preserved Contract

Every A1–A4 receipt retains:

```json
{
  "ineligible_for": [
    "SWU-IOLM-00C-B",
    "SWU-IOLM-00C-C",
    "G-DSV2-SG",
    "CROSS_FEATURE_UNSUPPORTED",
    "promotion",
    "publication"
  ]
}
```

The split does not alter fixture paths/hashes, nine binding values, 4/3 and 2/1 sets, runtime floor, no-package policy, loopback restriction, GET/HEAD surface, candidate posture, manual truth, gateway replacement seam, or public/private boundary.

## Apply Validation

An apply-approved Refresh must run:

```bash
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  cyberAlchemy-v2/development/interactive-ontology-learning-map/refreshes/2026-07-22-iolm-ui-swu-split/REFRESH-DISPATCH.json
python3 -m json.tool \
  cyberAlchemy-v2/development/interactive-ontology-learning-map/refreshes/2026-07-22-iolm-ui-swu-split/refresh-report.json
python3 -c 'import json, yaml; json.load(open("cyberAlchemy-v2/.craft/index.json")); yaml.safe_load(open("cyberAlchemy-v2/.craft/ledger.yml"))'
git diff --check -- cyberAlchemy-v2
```

It must additionally prove:

- exactly A1 is selected and A2–A4 are dependency-gated;
- the original UI-A is superseded before execution and not marked passed;
- all four typed handles have exactly one producer and one declared consumer except terminal A4;
- every aggregate package path has one owning SWU;
- the historical Context Pack, JSON index, and Goal profile are byte-identical;
- 00C-B/C task and decision semantics are unchanged;
- all three pinned fixtures are byte-identical;
- the main Dispatch validator has no new UI-route block or flag;
- Craft ledger, machine index, and human view agree;
- `cyberAlchemy-v2/development/iolm-workable-example/` remains absent;
- no mutation escaped the fourteen targets plus this Refresh receipt and observability surface.

## Approval Contract

Approval phrase:

```text
apply approved: REFRESH-PATCH-PROPOSAL.md
```

Approval authorizes only the fourteen target deltas above. It does not authorize implementation. A successful apply returns `iolm-ui-swu-split-refresh-applied/v1`, then routes to Context Builder and a compact Goal profile for A1 only.
