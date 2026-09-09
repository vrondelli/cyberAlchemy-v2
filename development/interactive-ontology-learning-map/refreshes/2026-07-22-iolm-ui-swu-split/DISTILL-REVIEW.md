---
mode: standard
budget: two-rounds
status: pass
date: 2026-07-22
---

# Distill Review — IOLM UI SWU Split

## Distill Result

- Target context: the private fixture-backed IOLM workable example and its Task Session execution boundary.
- Objective and output artifact: replace one overbuilt executable SWU with the smallest coherent sequential units; proposal-only Refresh package.
- Mode and budget: `standard` — one proposal track, two recursive rounds, one reconciliation pass.
- Proposal tracks: one. Proposer and Balancer roles were simulated locally because repository governance requires user confirmation before true subagent dispatch and no such dispatch was approved for this Refresh.
- Recursive rounds: `2/2`.
- Verdict: `pass` for the four-unit proposal; the current one-SWU Distill conclusion is stale.
- Current smallest coherent unit: `SWU-IOLM-00C-UI-A1`, the pinned fixture and loopback read boundary.
- Optimization point: four sequential SWUs, because each owns one risk domain, one primary behavior, one typed receipt, and one independently reviewable acceptance surface while recomposing without hidden glue.
- Next route: approved `invoke refresh apply`, then Context Builder for A1 only.

## Discovery Baseline

The approved sidecar outcome and exact package tree remain valid. No implementation exists. The new evidence is not a changed product requirement; it is execution-shape evidence:

- the generated native Goal occupies `3,678/4,000` characters;
- its strict pack contains 14 obligations;
- the current SWU spans Python path/HTTP security, JavaScript semantic transformation, browser interaction, Playwright behavior, and result aggregation;
- those domains already have separate file groups, runtime commands, failure meanings, and evidence artifacts.

The text length is a trigger, not the verdict. The split is justified by independent closure and acceptance boundaries.

## Concept Layer Map

```text
L0C-demo runnable fixture witness
  -> trusted fixture read boundary
  -> immutable semantic read model
  -> synchronized learner interface
  -> real-browser acceptance and evidence
```

The upper layer remains one `TASK-IOLM-00C-UI`. The four SWUs are sequential implementation/evidence units, not four products and not four Craft contexts.

## Round 1

### Proposer claim

Split UI-A by its four independent risk domains:

1. A1 owns fixture identity, filesystem containment, pre-bind validation, and loopback HTTP containment.
2. A2 owns exact joins, immutable `DemoSnapshotV1`, full/question slices, and deterministic model output.
3. A3 owns the synchronized rendered interface, stable selection, inspector, posture strip, and forbidden controls.
4. A4 owns real-browser black-box acceptance, durable automated evidence, manual-state truth, and final aggregation.

Evidence: the accepted tree already partitions into contract/server files, snapshot/model files, UI files, and run/manual evidence. Each partition has a distinct acceptance command or reviewable scenario.

### Balancer objections

| Category | Objection | Reconciliation |
| --- | --- | --- |
| Meaning loss | A1 and A2 are not runnable learner witnesses by themselves. | accepted limitation, rejected as a blocker: an SWU needs a meaningful bounded receipt, not the whole parent-task outcome. The task recomposes the witness after A3. |
| Hidden glue | Four units could leave unspecified integration work between them. | revised: every unit emits a versioned handle with an explicit consumer; the existing `DemoSnapshotV1` is the A2/A3 boundary. |
| Validation-only unit | A4 may look like testing rather than implementation behavior. | retained: real-browser evidence has a separate runtime, write namespace, failure route, and claim boundary. It is an independently reviewable evidence SWU and does not mutate implementation on failure. |
| Excess fragmentation | Binding and server could be split again. | rejected: filesystem and HTTP containment form one trust boundary and share `serve_demo.py` plus Python contract tests. Splitting them creates coordination without a new meaningful receipt. |
| Lens fragmentation | Graph, outline, and table could each become a unit. | rejected: synchronized stable-ID parity is the primary A3 behavior; splitting lenses destroys that acceptance boundary. |

### Round 1 decision

Revise to four receipt-bound units and require a no-silent-repair rule for A4. Continue to round 2 to prove file ownership and recomposition.

## Round 2 Closure

| Unit | Responsibility | Inputs | Outputs | Write subset | Acceptance boundary |
| --- | --- | --- | --- | --- | --- |
| `A1` | Fail closed unless the exact three pinned files and loopback read surface are safe. | 00C-A handle, pinned fixture bytes, nine binding values. | `iolm-fixture-boundary/v1`. | `contracts/source-binding.v1.*`, `serve_demo.py`, `assets/gateway.mjs`, `assets/binding-guard.mjs`, `tests/binding-guard.test.mjs`, `tests/test_server_contract.py`. | Python and Node boundary tests prove hashes, realpaths, symlinks, pre-bind behavior, GET/HEAD, fixed routes, 404/405, and no writes. |
| `A2` | Produce one immutable semantic read model with exact joins and slices. | `iolm-fixture-boundary/v1`. | `iolm-demo-snapshot/v1` plus generated snapshot. | `contracts/demo-snapshot.v1.schema.json`, `assets/demo-snapshot-v1.mjs`, `assets/question-slice.mjs`, `generated/read-models/`, snapshot/slice tests and synthetic fixture. | Node tests prove 4/3, 2/1, IDs, joins, provenance, immutability, determinism, and typed negatives. |
| `A3` | Make the same active stable-ID set inspectable through three synchronized lenses. | `iolm-demo-snapshot/v1`. | `iolm-interactive-viewer/v1`. | `README.md`, `index.html`, `assets/demo.css`, `assets/app.mjs`, `assets/selection.mjs`, graph/outline/table/inspector modules, projection/selection tests. | Pure projection/selection tests and loopback HTTP asset smoke prove the interface source contract without claiming rendered-browser or accessibility success. |
| `A4` | Exercise the composed viewer as a black box and aggregate honest evidence. | `iolm-interactive-viewer/v1` plus A1/A2 receipts. | `iolm-browser-acceptance/v1` and Task Session receipt. | `manual/MANUAL-CHECKS.md`, `generated/runs/<run-id>/**`, and `work-pack/session-evidence/SWU-IOLM-00C-UI-A4/**`. | Firefox `PW-BB-01..10`, deterministic rerun, result-schema checks, exclusion fence; manual checks remain `NOT_RUN`. |

If A4 finds an implementation defect, it stops with an owner-routed defect for A1, A2, or A3. It cannot use its evidence scope as ambient permission to edit implementation.

## Recomposition Proof

```text
00C-A: iolm-candidate-contract/v1
  -> A1: iolm-fixture-boundary/v1
  -> A2: iolm-demo-snapshot/v1
  -> A3: iolm-interactive-viewer/v1
  -> A4: iolm-browser-acceptance/v1
  -> TASK-IOLM-00C-UI narrow automated completion receipt
```

- A1 proves the only gateway may read and serve the pinned bytes.
- A2 proves those bytes become the only semantic snapshot used downstream.
- A3 proves all views and inspector state are projections of that snapshot.
- A4 proves the composed system behaves in Firefox and records evidence without upgrading human-only checks.

There is no new adapter between units. The existing gateway and `DemoSnapshotV1` contracts are the handoff boundaries already present in the accepted architecture.

## Technique Pack Trace

| Technique | Trigger | Inspected state | Output and decision | Readiness effect |
| --- | --- | --- | --- | --- |
| abstraction-level guard | SWU mixed parent outcome and receipt boundary | task outcome versus per-domain acceptance | kept one parent task and four SWUs | prevents SWUs becoming products or file fragments |
| recomposition proof | requested reduction | data path, handles, output claim | explicit A1 -> A4 handle chain | pass |
| evolution profile | later compiler gateway is expected | replacement seam and snapshot version | preserve A1 gateway seam and A2 contract | pass |
| frame-expiry note | optimization depends on current native stack | runtime, fixture, schema, evidence policy | expiry conditions below | pass |
| navigable result check | proposal must lead to execution | selection state and approval gate | apply, then Context Builder for A1 only | pass |
| cognitive-load check | Goal uses 91.9% of budget | 3,678/4,000 characters and 14 obligations | split by four risk domains | triggered and resolved |
| requisite-variety check | Python, Node, browser, and evidence failures differ | commands and failure semantics | four units retain distinct control responses | triggered and resolved |
| boundary-object check | model must join gateway and UI | `DemoSnapshotV1` | A2 owns it; A3 consumes it unchanged | triggered and resolved |
| concept-vs-knowledge status | no implementation has run | planning evidence only | split is an evidence-backed planning conclusion, not runtime proof | triggered and bounded |
| premortem | multi-unit route can drift | handoffs, status, repair ownership | typed receipts and one-at-a-time selection | triggered and resolved |
| set-based tournament | only one credible risk-domain decomposition emerged | alternative five-unit and per-lens splits | skipped: extra tracks would rename the same boundaries without improving closure | no downgrade |

## Evolution Profile

Expected evolution is a later compiler-backed gateway. A1 is the only replaceable input seam; A2's versioned snapshot contract and A3's viewer remain stable if the replacement preserves the contract. A4 remains the behavioral regression surface. No generalized plugin, package, or renderer abstraction is justified now.

## Deferred Complexity

- A separate server-only SWU: deferred because server and fixture containment share one trust boundary.
- Per-lens SWUs: rejected because parity and shared selection require co-review.
- Checked-in `@playwright/test`: deferred because the approved first slice forbids package installation and the CLI provides the required black-box evidence.
- Manual accessibility/usability execution: remains a named human protocol, not automated A4 proof.
- Inventory backfill: deferred until the split is applied, because proposal state should not be inventoried as executed state.

## Tension Ledger

| Tension | Resolution |
| --- | --- |
| Runnable whole versus small receipts | The parent task owns the whole; SWUs own independently meaningful risk boundaries. |
| Integration repair versus exact scopes | A4 reports defects to the owning unit and does not silently repair outside evidence scope. |
| Historical pack versus new route | Preserve the old pack/profile unchanged and add a supersession marker only on apply. |
| Browser automation versus manual truth | A4 may pass its automated claim while overall remains `NOT_RUN`. |

No unresolved Distill blocker remains. Apply authorization remains a separate Invoke Refresh gate.

## Premortem

| Likely failure | Earliest signal | Guardrail |
| --- | --- | --- |
| All four goals repeat the whole parent contract and become large again. | A generated goal exceeds a compact risk-domain statement or imports unrelated obligations. | Build a fresh strict Context Pack per selected SWU and include only predecessor receipt plus owned sources. |
| A3 invents semantics absent from A2. | Projection/inspector stable-ID or provenance mismatch. | A3 consumes immutable `iolm-demo-snapshot/v1`; renderer modules own no semantic data. |
| A4 repairs implementation without ownership. | Diff includes A1-A3 files during the A4 session. | Stop and route a defect receipt to the owning SWU. |
| Earlier receipts are treated as full demo completion. | Work-Pack or Craft marks the task complete before A4. | Task remains active through A4; every intermediate receipt names its narrow claim. |
| Manual checks become automated PASS by proxy. | `manual-results.json` changes without named human execution. | Result schema and acceptance gate retain `NOT_RUN`; invalidate the receipt on violation. |

## Frame Expiry

Re-run Distill if the pinned fixture set, no-install policy, loopback server boundary, `DemoSnapshotV1` schema, exact package tree, manual-evidence policy, or future gateway replacement contract changes. New implementation defects alone route to the owning SWU and do not invalidate the split.

## Navigation Guide

1. Review `REFRESH-PATCH-PROPOSAL.md` for the exact apply delta.
2. If approved, run `invoke refresh` in `apply-approved` mode against the fourteen named targets.
3. Preserve the historical UI-A Context Pack and Goal profile; add only the supersession marker.
4. Select A1 only and build a fresh strict Context Pack plus compact Goal for it.
5. Advance A2, A3, and A4 only on typed predecessor receipts.
