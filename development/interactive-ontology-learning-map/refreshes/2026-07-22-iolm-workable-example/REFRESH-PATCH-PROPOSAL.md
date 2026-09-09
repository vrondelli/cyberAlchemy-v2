# Refresh Patch Proposal — IOLM Workable Example

- Evidence date: `2026-07-22`
- Mutation mode: `proposal-only`
- Target owner: `private-learning-map-product-owner` with Craft ledger ownership
- Apply status: `NOT AUTHORIZED`
- Implementation status: `NOT STARTED`

## Exact intent

Add one independent, fixture-backed UI walking skeleton that can run before
cross-feature compiler support exists, while leaving the selected upstream route
and literal `SWU-IOLM-00C-B` proof unchanged.

The apply must add exactly:

- child Craft context `CTX-CAV2-IOLM-WORKABLE-EXAMPLE`; and
- implementation SWU `SWU-IOLM-00C-UI-A`.

No additional implementation SWU is authorized by this proposal.

## Proposed target inventory

An apply-approved refresh may change only these planning/Craft surfaces:

1. `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md`
2. `cyberAlchemy-v2/development/interactive-ontology-learning-map/EXECUTION-PACK.md`
3. `cyberAlchemy-v2/development/interactive-ontology-learning-map/IMPLEMENTATION-LAYERING.md`
4. `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json`
5. `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISTILL-VALIDATION.md`
6. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/context.md`
7. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/traceability.md`
8. `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/shared/cross-task-gaps.md`
9. new `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/tasks/TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md`
10. new `cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/waves/W0C-UI.md`
11. `cyberAlchemy-v2/.craft/ledger.yml`
12. derived `cyberAlchemy-v2/.craft/index.json`
13. derived `cyberAlchemy-v2/CRAFT.md`

The apply receipt may live in this dated refresh folder. No implementation file
under `cyberAlchemy-v2/development/iolm-workable-example/` may be created by
Invoke Refresh.

## Work-Pack delta contract

Add delivery slice `S-00C-UI` and task `TASK-IOLM-00C-UI` as an independent
sibling route, not a new step inside the `00C-A -> 00C-B -> 00C-C` chain.

Required rows:

| Surface | Exact addition |
|---|---|
| Delivery slice | `S-00C-UI`: private fixture-backed 4-node/3-edge local UI witness; layer `L0C-demo`; wave `W0C-UI`; dependency `SWU-IOLM-00C-A`; validation is binding/server/pure-model automation plus separately recorded manual browser checks. |
| Task board | `TASK-IOLM-00C-UI`: build the separately governed demo sidecar; gate `00C-A pass + applied refresh`; status `selected` only after apply. |
| SWU handoff | `SWU-IOLM-00C-UI-A`; parent `TASK-IOLM-00C-UI`; sole dependency `SWU-IOLM-00C-A`; execution owner `task-session`; implementation write scope exactly `cyberAlchemy-v2/development/iolm-workable-example/**`. |
| Blocker row | `B-IOLM-UI-MANUAL-RUNNERS`: names the people and browser/assistive-technology pairings required before overall validation may become `PASS`; it does not block implementation or automated checks. |
| Next handoff | After apply, Context Builder prepares only `SWU-IOLM-00C-UI-A`; `00C-B` remains selected and blocked upstream, and `00C-C` remains unselected. |

The Work-Pack control field for `00C-B` remains `block`. Add a separate
`workableExampleGateStatus: ready-after-approved-apply`; do not rewrite the
existing compiler blocker into a global pass.

## New task contract

Create `TASK-IOLM-00C-UI-WORKABLE-EXAMPLE.md` with this contract:

| Field | Required value |
|---|---|
| Slice/layer/wave | `S-00C-UI / L0C-demo / W0C-UI` |
| Primary behavior | serve one pinned DomainSpec fixture as synchronized graph, outline, table, shared selection, and provenance inspector through one immutable `DemoSnapshotV1` |
| Sole dependency | passed `SWU-IOLM-00C-A` handle `iolm-candidate-contract/v1` |
| Inputs | accepted findings; exact Key-and-Door graph, source manifest, and build receipt; existing candidate posture/provenance contract |
| Implementation write scope | `cyberAlchemy-v2/development/iolm-workable-example/**` |
| Lifecycle evidence | Task Session may append only its own `work-pack/session-evidence/SWU-IOLM-00C-UI-A/**` receipt; this is not implementation scope |
| Runtime floor | Python 3.11+, Node 22+, ES2022-capable browser; no package installation |
| Execution owner | one bounded Task Session |
| Stop condition | stop after this SWU receipt; do not select `00C-C`, resume `00C-B`, rebind authority, publish, or add a dependency package |

The implementation file contract is exactly the tree accepted in
`findings.md#exact-first-build-slice-and-file-boundary`, including:

- `contracts/source-binding.v1.json` and its schema;
- `contracts/demo-snapshot.v1.schema.json`;
- native `index.html`, CSS, ES modules, SVG, and semantic tables;
- `serve_demo.py`;
- pure-model Node tests and Python server/binding tests;
- the sidecar-only synthetic cross-feature contract fixture;
- `manual/MANUAL-CHECKS.md`; and
- durable `generated/runs/<run-id>/{automated-results.json,manual-results.json,validation-summary.json}`.

## Binding and server contract

`contracts/source-binding.v1.json` must contain the three literal
repo-root-relative fixture paths, all nine pinned binding values from the accepted
findings, expected counts `4 nodes / 3 edges`, every four node ID, and every three
edge ID. The current file digests are:

| Artifact | SHA-256 |
|---|---|
| `graph.json` | `66a63b80141274d7c803820c668f521d1676961e7362d8e9af1b03061c4b4a65` |
| `source-manifest.json` | `3d5db5ae885b93b4c490057597624c96ff53d3061d33af7ba289878d1eded831` |
| `build-receipt.json` | `1a5be10941d8342451d71e80dacc3bdd9ecfbe39412b22ffde617cd04370e20d` |

Before reading or serving fixture bytes, strict realpath checks must prove the
explicit path stays under the supplied repository root, equals one of the three
canonical allowlisted paths, and contains no symlinked component. Hash, receipt,
schema, identity, provenance, count, endpoint, or join mismatch blocks before
port bind.

The server is bound to `127.0.0.1`, accepts only GET/HEAD, exposes only application
assets and `/fixtures/{graph.json,source-manifest.json,build-receipt.json}`, returns
404 for unknown/traversal paths and 405 for other methods, and cannot write,
compile, rebuild, or expose arbitrary repository content.

## UI and evidence contract

The data path is fixed:

```text
PinnedMintedFixtureGateway
  -> MintedFixtureBindingGuard
  -> DemoSnapshotV1Adapter
  -> DemoSnapshotV1Guard
  -> QuestionSliceSelector
  -> Graph | Outline | Table
                       -> shared selection -> provenance inspector
```

The default view exposes the exact 4-node/3-edge core. The question “What does
the Player do, and what supports that connection?” exposes only
`key-and-door.Player`, `key-and-door.UnlockDoor`, and
`key-and-door.edge.player-performs-unlock-door`, with 2-node/1-relation counts.

Node automation covers pure snapshot/slice/projection/selection/inspector models.
Python automation covers binding, path, server, method, and result serialization.
Keyboard traversal, focus, reduced motion, rendered-DOM parity, and visual
text/shape sufficiency remain manual checks. Automation cannot mark them passed.

Result aggregation is exact:

- binding/security failure -> `BLOCK`;
- another required failure -> `FAIL`;
- any required manual `NOT_RUN` without a failure -> overall `NOT_RUN`;
- all required automated and manual checks pass -> overall `PASS`.

A Task Session may close the narrow implementation-and-automated-check claim
while the demo validation summary remains `NOT_RUN`; it must not relabel that
state as accessibility, usability, or full browser-validation success.

## Machine eligibility fence

Every result must carry:

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

Neither the single-feature fixture nor the synthetic cross-feature sidecar
resolves, bypasses, contradicts, or provides evidence against the live compiler
guard. Option 1 and the literal two-feature `00C-B` done criterion remain
byte-for-byte unchanged during apply.

## Wave and recomposition contract

Create `W0C-UI.md` as an independent one-unit wave:

- entry: applied refresh plus passed `00C-A`;
- selected unit: `SWU-IOLM-00C-UI-A`;
- merge policy: one bounded Task Session;
- exit: runnable local fixture demo plus automated receipts, with manual evidence
  truthfully `NOT_RUN` until performed;
- recomposition: later compiler-backed input may replace the gateway only after
  the unchanged upstream receipts pass and only if the versioned contract holds;
- authority: the wave cannot affect `00C-B`, `00C-C`, `G-DSV2-SG`, promotion, or
  publication.

`IMPLEMENTATION-LAYERING.md`, `EXECUTION-PACK.md`, shared context, and traceability
must add this sibling `L0C-demo` route without making it a predecessor receipt for
the compiler-backed or authoritative paths. `DISTILL-VALIDATION.md` must record
that one SWU is the smallest reversible unit because binding/server/read-model/UI
must compose to produce a runnable witness, while manual validation remains a
separate state rather than a second implementation SWU.

## Main Dispatch delta

Add one Task Session step for `SWU-IOLM-00C-UI-A` that consumes only the `00C-A`
receipt plus the applied refresh handle. It must have:

- exact implementation and lifecycle-evidence scopes above;
- forbidden scopes covering DomainSpec, existing IOLM prototype, `00C-B/C`, CAV2
  authority, and public `arcanum/`;
- a gate requiring the source-binding preflight before serving;
- a stop after its own receipt; and
- receipt fields separating automated result, manual result, overall summary,
  exclusions, residue, and next route.

No subagent strategy is required for the one bounded implementation SWU. Task
Session remains the execution owner.

## Craft delta

Apply must update canonical `cyberAlchemy-v2/.craft/ledger.yml` first, then
regenerate `.craft/index.json` and `CRAFT.md` as derived views.

Add:

- `CTX-CAV2-IOLM-WORKABLE-EXAMPLE` as child of `CTX-CAV2-IOLM`;
- stage `execute`, gate `pass`, and next move `Context Builder then one Task Session for SWU-IOLM-00C-UI-A`;
- owned artifact rows for the new task and wave only;
- links to `CTX-CAV2-IOLM`, `ART-CAV2-IOLM-00C-A-RESULT`, the accepted findings,
  and the three read-only fixture paths; and
- a parent-context link to the child context.

Do not create a Craft artifact row for the implementation package until Task
Session actually creates and returns it. The parent context next move must expose
two independent facts: the fixture-demo SWU is ready after apply, while `00C-B`
remains blocked on upstream cross-feature support.

## Apply validation commands

The apply-approved refresh must run, at minimum:

```bash
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  cyberAlchemy-v2/development/interactive-ontology-learning-map/refreshes/2026-07-22-iolm-workable-example/REFRESH-DISPATCH.json
python3 -c 'import json, pathlib, yaml; json.load(open("cyberAlchemy-v2/.craft/index.json")); yaml.safe_load(open("cyberAlchemy-v2/.craft/ledger.yml"))'
git diff --check -- cyberAlchemy-v2
```

It must additionally verify:

- exact target inventory and no writes outside it;
- new task/SWU/wave/context cardinality is exactly one each;
- `00C-B` task text, Decision Gate, and compiler/fixture bytes are unchanged;
- Craft `by_id`, contexts, artifacts, `artifacts_by_path`, `next_moves`, generated
  index, human view, and ledger SHA are synchronized;
- all new/changed local Markdown links resolve; and
- `cyberAlchemy-v2/development/iolm-workable-example/` is still absent after
  Invoke apply.

## Apply gate

This proposal is complete, but it does not approve itself. Exact approval must
name this artifact. Only then may `invoke refresh apply-approved` mutate the
listed planning and Craft targets. That apply still does not authorize UI
implementation; it makes the single SWU eligible for Context Builder and Task
Session.
