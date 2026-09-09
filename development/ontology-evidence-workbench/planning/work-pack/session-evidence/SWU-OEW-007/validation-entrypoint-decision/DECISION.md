# Decision Gate — DG-OEW-007-L1-VALIDATION-SEAM

Status: **RESOLVED FOR PLAN; IMPLEMENTATION BLOCKED**

## Question

How should the work-pack owner repair the missing validation entrypoints before
L1 implementation begins?

## Why this blocks

The selected L1 frontier declares these acceptance commands:

- `npm run test:ui-store`
- `npm run test:trust-rail`
- `npm run test:evidence-inspector`
- `npm run test:view-parity`
- `npm run test:navigation`
- `npm run test:poker-tour`
- `npm run test:responsive`
- `npm run test:browser`

None exists in the live OEW `package.json`. The exact first command exits 1
with `Missing script: "test:ui-store"`. `package.json` is outside every
SWU-OEW-007 through SWU-OEW-014 target inventory, so Task Session cannot repair
the omission without an owner-approved plan refresh.

No L1 implementation target was mutated before discovering this defect.

## Options

### A — Amend SWU-OEW-007 to own the shared validation seam

Add the OEW `package.json` and one generic overlay-unit runner to SWU-OEW-007's
target inventory. SWU-OEW-007 registers the exact L1 scripts once; later SWUs
own their test and component files but do not repeatedly modify the shared
script registry.

This preserves the selected 007–014 frontier and provides typed React/Vitest
fidelity against the pinned Understand-Anything toolchain. The trade-off is
that SWU-OEW-007 gains a small wave-level validation responsibility in addition
to its UI store behavior.

### B — Insert an owner-complete validation-bootstrap SWU (selected for refresh)

Create `SWU-OEW-006B` before SWU-OEW-007. It owns the exact private
toolchain/effective lock, declared network/cache mode, disposable workroot,
patch pre/postimages, typed tests/build, immutable build handle, cleanup, and a
distinct verifier. Units 007–013 consume that handle, 014 owns browser
production, and 014V independently accepts or rejects it.

This invalidates the captured eight-unit frontier and requires the refreshed
plan, a new human selection, and fresh Task Session preflight.

### C — Replan as Node-native tests

Replace the planned TypeScript/React test targets and commands with direct
`.mjs` tests executed by `node --test`. This avoids the shared runner and
package-script seam, but gives weaker component-level evidence and pushes more
confidence onto the final browser acceptance unit.

### D — Stop at L0

Keep the already verified native-viewer prototype and do not implement L1.

Standing non-answer: Explain / more context.

## Resolution

- Selected planning option: **B**
- Source: direct user instruction, `invoke refresh with the repairs`,
  2026-07-27
- Refresh scope: private OEW design/Plan artifacts only
- Consequential implementation: blocked
- Current SWU selection: none

The prior multi-agent audit was rejected for coverage defects. Its substantive
candidate findings informed the repair inventory, but this direct-user refresh
is the independent activation source and does not retroactively accept the
audit.

## Boundaries

- This bounded Invoke Refresh must pass before any new selection.
- The repaired L1 graph is SWU-OEW-006B, 007–014, and 014V.
- The historical 007 series selection cannot transfer to the repaired graph.
- A new explicit human selection may choose 006B only; it does not select the
  rest of the frontier.
- L2 source access, authority, promotion, publication, deployment, release, and
  production remain unauthorized.
