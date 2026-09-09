# Work Pack — Ontology Evidence Workbench

Status: split-build L1 frontier stopped at SWU-OEW-008 preflight; runtime-registry decision pending
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
| [TASK-OEW-ADAPTER-001](work-pack/tasks/TASK-OEW-ADAPTER-001.md) | deterministic loss-aware projection | L0 | 002–004 | completed |
| [TASK-OEW-UPSTREAM-001](work-pack/tasks/TASK-OEW-UPSTREAM-001.md) | immutable upstream lock/build | L0 | 005 | completed |
| [TASK-OEW-VIEWER-001](work-pack/tasks/TASK-OEW-VIEWER-001.md) | native viewer and local boundary proof | L0 | 006 | completed |
| [TASK-OEW-BOOTSTRAP-001](work-pack/tasks/TASK-OEW-BOOTSTRAP-001.md) | isolated toolchain/materializer proof | L1 | 006P; historical 006B | completed |
| [TASK-OEW-WORKBENCH-001](work-pack/tasks/TASK-OEW-WORKBENCH-001.md) | trust-aware feature source | L1 | 007–013 | 007 completed; 008 blocked before mutation; decision pending |
| [TASK-OEW-VALIDATION-001](work-pack/tasks/TASK-OEW-VALIDATION-001.md) | final build, browser/a11y production, independent acceptance | L1 | 013B, 014, 014V | blocked upstream |
| [TASK-OEW-CODE-CONTEXT-001](work-pack/tasks/TASK-OEW-CODE-CONTEXT-001.md) | scoped UA code lane | L2 | 015–017 | gated |
| [TASK-OEW-HARDEN-001](work-pack/tasks/TASK-OEW-HARDEN-001.md) | upgrades, scale, packaging | L3 | 018–020 | gated |
| [TASK-OEW-VERIFY](work-pack/tasks/TASK-OEW-VERIFY.md) | terminal audit and manual-result ceiling | L3 | exemption | gated |

## SWU Manifest

Canonical machine view:
[work-pack/swu-manifest.json](work-pack/swu-manifest.json).

There are 24 SWU records: six completed L0 units, one historical blocked 006B
record, eleven refreshed L1 candidates, three L2 candidates, and three L3
candidates. Every candidate SWU has one parent task, one primary behavior,
explicit dependencies, exact target inventory, split analysis, validation,
expected receipt, and Task Session closeout synchronization.

## Recommended First Unit

All six L0 SWUs are complete and G-OEW-L0 is closed. Historical selections
stopped at 007 and then 006B before implementation; neither selector transfers.
Build-order option A splits the lifecycle:

- `SWU-OEW-006P` proves the exact isolated toolchain/materializer with a
  self-owned fixture patch and owns the only planned `package.json` script
  registry mutation for this split;
- 007–013 author the complete feature overlay;
- `SWU-OEW-013B` consumes the final overlay and verified 006P handle, then
  emits an independently verified immutable build handle;
- 014 produces browser evidence from that handle; 014V independently accepts
  or rejects the retained browser evidence.

The Plan owner selected option A for the finite refreshed L1 frontier.
`SWU-OEW-006P` passed its Task Session and joined owner closeout: exact Node
and pnpm bytes, an online frozen-lock install in a fresh isolated workroot, the
self-owned patch probe, cleanup, independent verification, 47/47 OEW tests,
11/11 staged/live target parity, and 12,989-entry protected equality all pass.
`SWU-OEW-007` now passes exact-source loading: 3/3 focused tests, 6/6 target parity, and protected equality. `SWU-OEW-008` then stopped before implementation because its registered focused runner is absent and outside its exact target inventory; the same ownership mismatch affects 009–013 and 014. Protected equality still passed across 12,989 entries. No successor is selected pending Decision Gate `DG-OEW-008-RUNTIME-REGISTRY`.

## Global Gates

| Gate | Condition | Owner | Failure |
| --- | --- | --- | --- |
| G-OEW-DESIGN | Design result digest remains passing/current | Invoke Design validator | block |
| G-OEW-SELECTION | exactly one dependency-ready SWU explicitly selected | human owner | block |
| G-OEW-PREFLIGHT | baseline, targets, write scope, closeout, protected set pass | Task Session | block |
| G-OEW-UPSTREAM | immutable commit/license/digests and network permission | upstream integration owner | block upstream SWUs |
| G-OEW-L1-TOOLCHAIN | exact tools/effective lock, declared network/cache mode, fixture patch-once, cleanup, independent verifier | private OEW provisioner + distinct verifier | block 007–014V |
| G-OEW-L1-BUILD | verified toolchain handle, complete final overlay, patch-once, typed build, cleanup, independent verifier | private OEW final-build producer + distinct verifier | block 014–014V |
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
5. deterministic source-only protected-set equality under
   `work-pack/shared/PROTECTED-SET-CONTRACT.json`;
6. expected owner receipt;
7. deterministic successor or stop policy.

## Blockers and Residue

- The historical serial L1 chain stopped at 007 before implementation. Its
  exact state is archived under `work-pack/chain-history/`; the active repaired
  chain has a new identifier, no visited selectors, and no reused cursor.
- The fresh repaired chain stopped at 006B before implementation. Its required
  overlay manifest and patch are absent and owned by dependent successor 007.
  More importantly, 007–013 would mutate feature source after the immutable
  006B build handle, and no final rebuild/verifier exists before 014.
- The consumed 006B definition and receipts remain immutable historical
  evidence. New selectors 006P and 013B close the split-build graph without
  reusing the failed cursor.
- `SWU-OEW-006P` is complete. Its immutable handle proves only the isolated
  toolchain/materializer seam; final feature-byte binding remains owned by
  `SWU-OEW-013B`.
- `DG-OEW-007-L1-VALIDATION-SEAM` is resolved for planning as repair B by this
  direct-user Invoke Refresh. The old 007 selection is invalid for the changed
  graph and is not carried forward.
- The preceding multi-agent audit was rejected for coverage defects. Its four
  findings remain substantive candidates below acceptance; this direct refresh
  is an independent activation source and does not relabel that audit.
- Native serving, token/local boundary negatives, Poker rendering, immutable
  implementation bytes, and source-only isolation are proved for the L0
  integration prototype.
- L2 scoped model analysis requires a fresh human approval.
- Manual accessibility/usability remains unproven until named execution.
- IOLM adoption, release, publication, production, and authority are deferred.

## Next Route

Decision Gate `DG-OEW-008-RUNTIME-REGISTRY` must resolve the undeclared
focused-runner ownership defect. Option A is recommended: add each already
registered runner to its owning remaining SWU inventory, refresh the remaining
frontier, and make a fresh selection. Do not resume this blocked attempt or
the historical 007/006B sessions.
L2 source access, authority, publication, deployment, release, and production
remain unauthorized.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
