# Work Pack — Ontology Evidence Workbench

Status: implementation-in-progress
Complexity: medium
Output mode: split
Selected SWU: `none`
Implementation authorized: `false`
Mutation runtime ready: `false`

## Objective

Implement the approved OEW architecture as a private, local, read-only
interface over verified candidate evidence using a pinned Understand-Anything
viewer/dashboard substrate.

## Authority and Delivery

- Invoke owns this Plan only.
- Task Session may later execute exactly one explicitly selected SWU.
- Candidate runtime receipts have `authority_effect: none`.
- Poker Team, IOLM, Craft, ontology/authority, and Arcanum stay read-only.
- Upstream build/analysis requires the exact gates named by its SWU.

## Layer and Wave Map

| Wave | Layer | Decision | Tasks | Gate |
| --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0-L0.md) | L0 | can a verified bundle render safely in unmodified UA? | Admission, Adapter, Upstream, Viewer | G-OEW-L0 |
| [W1](work-pack/waves/W1-L1.md) | L1 | can a reviewer use a trust-aware equivalent-view UI? | Workbench, Validation | G-OEW-L1 |
| [W2](work-pack/waves/W2-L2.md) | L2 | can scoped code context attach without interference? | Code Context | G-OEW-L2 |
| [W3](work-pack/waves/W3-L3.md) | L3 | can it be upgraded, measured, packaged, and reviewed? | Harden, Verify | G-OEW-L3 |

Waves are sequential. Within a wave, dependencies—not component convenience—
control eligibility. No parallel write scopes are assumed by this Plan.

## Task Board

| Task | Purpose | Layer | SWUs | State |
| --- | --- | --- | --- | --- |
| [TASK-OEW-ADMISSION-001](work-pack/tasks/TASK-OEW-ADMISSION-001.md) | verifier-backed source admission | L0 | 001 | completed |
| [TASK-OEW-ADAPTER-001](work-pack/tasks/TASK-OEW-ADAPTER-001.md) | deterministic loss-aware projection | L0 | 002–004 | in progress (002–003 complete) |
| [TASK-OEW-UPSTREAM-001](work-pack/tasks/TASK-OEW-UPSTREAM-001.md) | immutable upstream lock/build | L0 | 005 | planned |
| [TASK-OEW-VIEWER-001](work-pack/tasks/TASK-OEW-VIEWER-001.md) | native viewer and local boundary proof | L0 | 006 | planned |
| [TASK-OEW-WORKBENCH-001](work-pack/tasks/TASK-OEW-WORKBENCH-001.md) | trust-aware interface | L1 | 007–013 | planned |
| [TASK-OEW-VALIDATION-001](work-pack/tasks/TASK-OEW-VALIDATION-001.md) | browser/a11y automation | L1 | 014 | planned |
| [TASK-OEW-CODE-CONTEXT-001](work-pack/tasks/TASK-OEW-CODE-CONTEXT-001.md) | scoped UA code lane | L2 | 015–017 | gated |
| [TASK-OEW-HARDEN-001](work-pack/tasks/TASK-OEW-HARDEN-001.md) | upgrades, scale, packaging | L3 | 018–020 | gated |
| [TASK-OEW-VERIFY](work-pack/tasks/TASK-OEW-VERIFY.md) | terminal audit and manual-result ceiling | L3 | exemption | gated |

## SWU Manifest

Canonical machine view:
[work-pack/swu-manifest.json](work-pack/swu-manifest.json).

There are 20 mutation-capable SWUs. Every SWU has one parent task, one primary
behavior, explicit dependencies, exact target inventory, split analysis,
validation, expected receipt, and Task Session closeout synchronization.

## Recommended First Unit

`SWU-OEW-003` completed with a passing Task Session and owner closeout.
`SWU-OEW-004` is the unique dependency-ready successor in the captured serial
frontier. It remains unselected by this inner closeout.

## Global Gates

| Gate | Condition | Owner | Failure |
| --- | --- | --- | --- |
| G-OEW-DESIGN | Design result digest remains passing/current | Invoke Design validator | block |
| G-OEW-SELECTION | exactly one dependency-ready SWU explicitly selected | human owner | block |
| G-OEW-PREFLIGHT | baseline, targets, write scope, closeout, protected set pass | Task Session | block |
| G-OEW-UPSTREAM | immutable commit/license/digests and network permission | upstream integration owner | block upstream SWUs |
| G-OEW-L2-SCOPE | explicit scoped-analysis permission and source allowlist | human/private-data owner | block L2 |
| G-OEW-MANUAL | named human/device/assistive-tech results | human UX owner | keep manual/overall `NOT_RUN` |
| G-OEW-AUTHORITY | no receipt/view claims admission/promotion/release | ontology/authority owner | block |

## Validation Strategy

See [VALIDATION-STRATEGY.md](VALIDATION-STRATEGY.md). Every implementation
slice includes positive, negative, deterministic, isolation, and exact-state
evidence proportional to its claims.

## Task Session Closeout

Every mutation-capable SWU inherits
[work-pack/shared/CLOSEOUT-CONTRACT.md](work-pack/shared/CLOSEOUT-CONTRACT.md)
and adds its exact target inventory in the manifest/task contract. Closeout
requires:

1. current baseline digest binding before mutation;
2. only declared target paths changed;
3. admitted delta classes only;
4. SWU-specific validation pass;
5. protected-set equality;
6. expected owner receipt;
7. deterministic successor or stop policy.

## Blockers and Residue

- Serial execution is active under `chain-state.json`; the next candidate is
  `SWU-OEW-004`, subject to a fresh Task Session admission.
- Upstream network/build permission is not assumed.
- L2 scoped model analysis requires a fresh human approval.
- Manual accessibility/usability remains unproven until named execution.
- IOLM adoption, release, publication, production, and authority are deferred.

## Next Route

The outer Task-Session-Until-Blocker chain may open a fresh Task Session for
`SWU-OEW-004`. The completed SWU-OEW-003 receipt does not execute or select its
successor by itself.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
