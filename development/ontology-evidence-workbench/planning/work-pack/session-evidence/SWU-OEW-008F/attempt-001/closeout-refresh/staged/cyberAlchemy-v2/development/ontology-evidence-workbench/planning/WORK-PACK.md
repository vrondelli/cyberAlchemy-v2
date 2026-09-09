# Work Pack — Ontology Evidence Workbench

Status: first-working-version source complete; 013B preflight pending
Complexity: medium
Output mode: split
Selected SWU: `SWU-OEW-013B`
Implementation authorized: `true`
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
| [TASK-OEW-WORKBENCH-001](work-pack/tasks/TASK-OEW-WORKBENCH-001.md) | trust-aware Poker review UI | L1 | 007 and 008F | completed |
| [TASK-OEW-VALIDATION-001](work-pack/tasks/TASK-OEW-VALIDATION-001.md) | final build, browser/a11y production, independent acceptance | L1 | 013B selected; 014, 014V pending | preflight pending |
| [TASK-OEW-CODE-CONTEXT-001](work-pack/tasks/TASK-OEW-CODE-CONTEXT-001.md) | scoped UA code lane | L2 | 015–017 | gated |
| [TASK-OEW-HARDEN-001](work-pack/tasks/TASK-OEW-HARDEN-001.md) | upgrades, scale, packaging | L3 | 018–020 | gated |
| [TASK-OEW-VERIFY](work-pack/tasks/TASK-OEW-VERIFY.md) | terminal audit and manual-result ceiling | L3 | exemption | gated |

## SWU Manifest

Canonical machine view:
[work-pack/swu-manifest.json](work-pack/swu-manifest.json).

The manifest preserves every completed, blocked, and superseded record while
exposing only four active remaining L1 candidates: 008F, 013B, 014, and 014V.
Every active candidate has one parent task, one primary behavior, explicit
dependencies, exact target inventory, split analysis, validation, expected
receipt, and Task Session closeout synchronization.

## Recommended First Unit

All six L0 SWUs are complete and G-OEW-L0 is closed. `SWU-OEW-006P`
passed exact isolated toolchain/materializer verification. `SWU-OEW-007`
passed exact-source loading and store verification. Those implementation bytes
and receipts are retained.

`SWU-OEW-008` then stopped before implementation because its registered runner
was absent and outside its exact inventory. The same predictable ownership gap
existed across the remaining component commands. The 2026-07-28 direct-user
Invoke Refresh therefore supersedes unimplemented 008–013 component selectors
with one user-visible source unit:

- `SWU-OEW-008F` assembles the complete Poker evidence-review UI and owns all
  six registered focused runner paths plus a new final overlay manifest;
- `SWU-OEW-013B` consumes completed 007 + 008F source and emits an
  independently verified immutable build handle;
- `SWU-OEW-014` produces browser evidence and owns its registered browser
  runner;
- `SWU-OEW-014V` independently accepts or rejects the retained build/browser
  evidence.

The existing implementation `package.json` remains the only package root and
is unchanged. A planning-owned frontier validator proves dependency and
command-entrypoint closure before any new selection.

`SWU-OEW-008F` now passes: 28/28 admitted source targets equal staging, all
18 focused tests pass, the package registry remains unchanged, and protected
equality holds. The captured series advances once to `SWU-OEW-013B`, which
must still complete a fresh Task Session preflight before final-build mutation.

## Global Gates

| Gate | Condition | Owner | Failure |
| --- | --- | --- | --- |
| G-OEW-DESIGN | Design result digest remains passing/current | Invoke Design validator | block |
| G-OEW-SELECTION | exactly one dependency-ready SWU explicitly selected | human owner | block |
| G-OEW-PREFLIGHT | baseline, targets, write scope, closeout, protected set pass | Task Session | block |
| G-OEW-FRONTIER-READY | one package root; every active command resolves to an existing or same-SWU-owned entrypoint; dependency order closes | Invoke frontier validator | block selection |
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
- `SWU-OEW-007` is complete. Its exact-source store, entrypoint patch, and
  receipt remain current inputs to the first-working-version source unit.
- `SWU-OEW-008` attempt 001 remains immutable blocked evidence with zero
  implementation mutation. Planned 009–013 selectors are superseded,
  unexecuted, and ineligible.
- The old cumulative overlay manifest remains retained 007 evidence.
  `SWU-OEW-008F` created a separate first-working-version overlay manifest
  that binds all 27 additional source/test files without rewriting the
  completed 007 target.
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

Decision Gate `G-OEW-L1-FIRST-WORKING-VERSION-SELECTION` resolved option A on
2026-07-28. The exact four-unit frontier is selected and stops on the first
blocker or after 014V. `SWU-OEW-008F` passed its separate Task Session and
owner closeout; `SWU-OEW-013B` is now the unique selector and requires a fresh
Task Session preflight.

Do not resume historical 006B/008 attempts or superseded 009–013 selectors.
L2 source access, authority, publication, deployment, release, and production
remain unauthorized.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
