# van Lamsweerde — formal obligation trace

## INITIAL POSITION

**CHANGE REQUEST.** L1 is not executable as planned. The missing npm scripts are
only the first visible symptom: the architecture requires a pinned,
patch-overlay dashboard build, while SWU-OEW-007–014 assign no temporal owner
for materializing the pinned source, applying the overlay, installing its locked
toolchain, building/starting the patched dashboard, cleaning it, or issuing an
independently checkable L1 build receipt. Inventory was used only to locate the
corpus; findings below come from current bytes. This is an initial robot-talk
position only.

## Severity-ranked findings

### CRITICAL — No SWU owns the architecture's L1 patch-overlay build lifecycle

- `design/ARCHITECTURE.md`: “`viewer-build` | build unmodified L0 or
  patch-overlay L1 viewer from pin | verified upstream source | viewer artifact
  + digest | fail on patch/build/test”.
- `design/ARCHITECTURE.md` ADR-OEW-002: “L1 applies a small OEW-owned patch
  overlay during the build.”
- `planning/work-pack/swu-manifest.json`: SWU-OEW-007 owns an overlay manifest,
  patch, overlay sources, and `test/ui-store.test.mjs`; SWU-OEW-008–014 own
  feature/test/acceptance files. None owns `scripts/prepare-upstream.mjs`,
  `package.json`, a materialize/apply/install/build/start/cleanup runner, or an
  L1 build receipt.
- Live `scripts/prepare-upstream.mjs` builds only the pristine checkout:
  “`pnpm install --frozen-lockfile`”, upstream core/dashboard tests, and
  “`pnpm --filter understand-anything-viewer build`”; it archives the source
  *before* install and never applies `upstream/patches` or `upstream/overlay`.

Thus a Task Session can create patch bytes but cannot lawfully or reproducibly
turn them into the L1 browser target required by OEW-V-06/09/10. There is zero
mutation owner and zero evidence owner for the assembled overlay.

**One-line fix:** introduce one explicitly selected, dependency-predecessor
bootstrap owner (or expand 007 by exact plan refresh) for extract → verify →
overlay/patch → frozen install → typed test/build → isolated start → teardown →
receipt, with every mutated/generated path in its inventory.

### MAJOR — Option A repairs the registry symptom, not the executable model

- `.../validation-entrypoint-decision/DECISION.md`: A adds “`package.json` and
  one generic overlay-unit runner” and claims this “provides typed React/Vitest
  fidelity against the pinned Understand-Anything toolchain.”
- Live `package.json` has no dependencies/devDependencies and only L0 Node
  scripts. A does not name the upstream source extraction directory, lock
  consumer, package install location, overlay application order, TS/Vitest
  configuration, patched dashboard build/start command, cache/network policy,
  cleanup, or build receipt.

Scripts cannot confer fidelity that no owned runner/toolchain lifecycle
materializes. A merely concentrates repeated `package.json` churn in 007. B can
repair the model only if its new SWU owns the full lifecycle above, not merely
the same registry edit. C avoids package churn but explicitly abandons planned
typed React/component evidence and therefore requires architecture,
validation-contract, and acceptance rewrites. D is coherent cessation, not an
L1 repair.

**One-line fix:** replace A/B descriptions with a complete runtime contract and
choose only after dependency graph, target inventory, selection, and receipt
owner are refreshed.

### MAJOR — Pinning is complete for pristine L0 but temporally wrong for L1

- `upstream/UPSTREAM.lock.json` pins pnpm `10.6.2`,
  `pnpm-lock.yaml`, and the pristine viewer build.
- `scripts/prepare-upstream.mjs` verifies that pin, uses a disposable clone,
  checks tracked-source cleanliness, and records
  “`temporary_clone_install_build_removed: true`”.
- Architecture requires the UI build to retain “upstream pnpm/React
  dependencies behind its lock boundary,” yet no L1 owner states whether the
  immutable upstream lock remains authoritative after OEW overlay files alter
  the dashboard, whether an OEW supplemental lock is forbidden/required, or
  which package manifest is installed.

The upstream integration owner is historically complete for L0, not a current
owner of a changed L1 dependency graph. Reusing its receipt would be temporal
misbinding.

**One-line fix:** bind the L1 bootstrap receipt to the exact upstream source
archive digest, upstream lock digest, overlay/patch digest, effective package
and lock bytes, tool versions, and resulting build bytes.

### MAJOR — Browser acceptance has an input owner but no start/teardown contract

- SWU-OEW-014 owns `scripts/run-browser-acceptance.mjs` and browser artifacts,
  with execution owner `task-session-local-browser-fallback`.
- `VALIDATION-STRATEGY.md` requires Firefox/Chromium, network/console,
  accessibility, isolation, and independent receipt verification.
- The manifest does not declare the built L1 artifact or bootstrap receipt as a
  dependency/target, nor an owned start command, port/token allocation,
  pre-existing-process rule, browser binary/cache pin, outbound-install rule,
  or teardown proof.
- Poker-Team's `playwright.config.ts` starts its own backend and app, may
  “`reuseExistingServer: !process.env.CI`”, and its cleanup script kills
  workspace-wide matching processes. That is a consumer example, not an OEW
  owner or safe isolation contract.

**One-line fix:** make 014 consume a verified L1 build handle and own
fresh-process startup, unique loopback endpoints, pre-pinned browser
availability, zero-download execution, bounded teardown, residue checks, and
receipt verification.

### MAJOR — Acceptance ownership is split and can self-attest

- `VALIDATION-CONTRACTS.md` assigns OEW-V-06 to “UI owner,” V-09 to “UX
  validator,” and V-10 to “isolation verifier.”
- SWU-OEW-007–013 each execute and receipt their own component validation;
  SWU-OEW-014 is both browser implementation/runner owner and expected receipt
  producer. `WORK-PACK.md` nevertheless requires “independent
  adapter/browser/package receipt verification.”

No manifest target names an independent browser-receipt verifier. Multiple
semantic owners exist, but the terminal evidence owner is absent.

**One-line fix:** separate receipt production from a deterministic verifier and
route G-OEW-L1 only through verified 007–014 owner receipts plus protected-set
equality, while manual UX remains `NOT_RUN`.

### MINOR — Planning state uses two “option A” decisions ambiguously

- `WORK-PACK.md`: “`G-OEW-L1-SELECTION` selected option A.”
- The live validation-seam decision says “Selected option: none” and status
  `BLOCK`, while also recommending its own option A.

The work pack is technically explicit about the distinct gate, but this label
collision invites the false reading that repair A was selected.

**One-line fix:** name the earlier selected alternative, and refer to the
pending repair as `DG-OEW-007.../A`, never bare “option A.”

## Obligation-owner matrix

| L1 obligation | Architecture/contract owner | Plan/live owner | Verdict |
|---|---|---|---|
| verified source materialization | upstream integration / viewer-build | L0 `prepare-upstream` only | temporal owner wrong |
| patch + overlay application | viewer-build / OEW integration | patch bytes in 007; no applicator | zero owner |
| dependency pin/install | upstream lock/integration | pristine L0 pnpm lock only | zero L1 owner |
| typed unit/build | UI owner | per-SWU commands; absent runner/deps/build | zero executable owner |
| local browser start | OEW UI/gateway | 014 fallback label only | zero lifecycle owner |
| cache/network policy | upstream gate; local/no-outbound guarantee | L0 clone network; no L1 browser/cache policy | zero L1 owner |
| isolation | isolation verifier | closeout protected-set + 014 artifacts | multiple, terminal verifier absent |
| cleanup | build/runtime owner | L0 temp cleanup only | zero L1 owner |
| build/browser receipts | build owner / UX validator | expected SWU receipts; no L1 build or independent browser verifier | zero/multiple |
| G-OEW-L1 acceptance | Plan/Task Session/human gates | selected 007 blocked; 014 downstream | dependency-correct stop, incomplete terminal route |

## Per-artifact KEEP/FIX candidates

- `design/ARCHITECTURE.md` — **KEEP** exact/presentation graph separation,
  ADR-OEW-002, local/read-only and `authority_effect:none`; **FIX** name the L1
  bootstrap/runtime interface and receipt contract.
- `design/VALIDATION-CONTRACTS.md` — **KEEP** OEW-V-01–11 and receipt ceiling;
  **FIX** split browser producer from independent receipt verifier.
- `design/INTERFACE-CONCEPT.md`, `UX-PLAN.md`, `EXAMPLE.md`,
  `UPSTREAM-BASELINE.md` — **KEEP** presentation intent, Poker walkthrough,
  immutable baseline, and evidence ceilings; **FIX** only references that imply
  browser availability without the new verified build handle.
- `planning/IMPLEMENTATION-LAYERING.md` — **KEEP** L1 outcome/non-regressions;
  **FIX** include bootstrap evidence in the L1 minimum working unit.
- `planning/WORK-PACK.md`, `swu-manifest.json`, `chain-state.json` — **KEEP**
  blocked state and selection discipline; **FIX** dependencies, targets,
  lifecycle owners, verifier, and unambiguous gate names after decision.
- `planning/VALIDATION-STRATEGY.md` — **KEEP** evidence ladder and browser
  ceiling; **FIX** exact reproducible build/start/teardown sequence.
- `planning/VALIDATION-REPORT.md`, `OWNER-APPROVAL.md` — **KEEP** honest
  unexecuted/unauthorized boundaries.
- `.../DECISION.md` — **KEEP** BLOCK and D; **FIX** A/B completeness and C's
  contract-wide downgrade cost.
- live OEW L0 package/scripts/src/test/archives — **KEEP** current L0 proof;
  **FIX** none under this review; do not relabel L0 receipts as L1.
- Inventory runtime, Experiment Harness, OCGP, Poker-Team candidates — **KEEP**
  as adaptable mechanics/examples only; **FIX** no OEW ownership claim and no
  public Arcanum binding to private OEW paths.

## Survived attacks

- Exact evidence graph remains authoritative for recoverability; the UA-shaped
  presentation graph remains generalized and sidecar-bound.
- Every inspected L0 verifier/runtime receipt preserves
  `authority_effect: none`; no review finding promotes evidence.
- L0 `prepare-upstream` genuinely pins source/toolchain, double-archives
  deterministically, rejects dirty tracked source, and cleans temporary work.
- The current chain correctly stops before any L1 mutation; option D is a
  valid bounded stop.
- Poker-Team is useful mechanical precedent but cannot supply OEW dependency,
  cache, process, or receipt authority.

## PEER EXCHANGE CAPSULE

Challenge Hewitt to demonstrate one current, isolated command that consumes the
pinned OEW source archive, applies the OEW overlay, performs a frozen typed
install/test/build, starts the L1 dashboard, cleans all residue, and emits a
verifiable receipt; a successful unrelated runner is insufficient. Challenge
Bateson to identify any hidden side effect beyond the unowned network/cache,
process, and cleanup boundaries above. My falsifiable claim: **A as written
only moves `package.json` churn; B is the smallest potentially complete repair,
unless A is expanded into the same full bootstrap responsibility and explicitly
re-approved.**

## POST-ROBOT-TALK FINAL POSITION

**FINAL: CHANGE REQUEST; choose an owner-complete private OEW bootstrap
predecessor that reuses existing OEW preparation mechanics.**

### Agreements and disagreements

- **Agree with Hewitt:** “a wholly new runtime is required” is false. Current
  OEW `prepare-upstream` and its lock/verifier already provide project-owned
  pin checks, deterministic archives, disposable work roots, failure cleanup,
  and offline retained-byte verification. The pinned dashboard supplies the
  intended TypeScript/Vite/Vitest vocabulary. These mechanics should be reused.
- **Reject any claim that an L1 runtime already exists:** Hewitt's live
  contrast—`verify:upstream` passes while `test:ui-store` fails—supports the
  trace. No current owner consumes the archive into an overlay workspace,
  applies/verifies the patch, performs the effective frozen install/test/build,
  starts the patched target, tears it down, or emits/verifies an L1 receipt.
- **Agree with Bateson:** producer receipts cannot close acceptance by
  self-report. A verifier must independently recompute archive, lock,
  overlay/preimage/postimage, effective package/lock, output, protected-scope,
  child-process/port, and residue facts. Network/cache mode and phase completion
  must be explicit rather than inferred from `"result":"pass"`.
- **Agree on stale selection:** selected 007 is valid only for the frozen
  pre-repair plan and remains historically blocked. Any owner-complete repair
  changes targets/dependencies and must invalidate—not silently inherit—that
  selection, preserve its blocker receipt, refresh the plan, and require a new
  human selection.
- **Agree on public/private isolation:** generic mechanics may remain public in
  Arcanum, but the executable adapter, OEW paths, Poker binding, source pin,
  overlay, and receipts belong in private `cyberAlchemy-v2`. Inventory,
  Experiment Harness, and Poker-Team are patterns/consumers, not authority.

### Finding changes

- **NARROWED, CRITICAL retained:** no SWU owns the L1 patch-overlay lifecycle;
  the missing object is a private L1 lifecycle adapter over reusable L0
  mechanics, not a wholly new general runtime.
- **RETAINED MAJOR:** Option A as written repairs script-registry contention
  but omits the complete source/lock/overlay/install/build/browser/cache/
  network/cleanup/receipt contract.
- **RETAINED MAJOR:** L0 pin/build evidence is temporally wrong if presented as
  L1 overlay evidence. Reuse the mechanics and pin, never the claim.
- **STRENGTHENED to CRITICAL:** stale `selected:true` cannot authorize a
  refreshed 007 or predecessor. Graph/target changes require invalidation,
  refresh, and reselection.
- **RETAINED MAJOR:** browser start, pinned browser/cache, unique ports/PIDs,
  minimal environment, outbound denial, unconditional teardown, and
  zero-residue evidence remain unowned.
- **RETAINED MAJOR, stronger acceptance:** build/browser receipts require a
  separate fail-closed verifier that recomputes current evidence.
- **DROPPED standalone:** the two bare “option A” labels are subsumed by the
  stale-selection defect.

### Final smallest repair route

Choose **replanned Option B**, narrowly: one private
`validation-bootstrap` SWU before 007, not a new public/general runtime. It
adapts the existing OEW archive/lock/verifier/temp-cleanup mechanics and owns:

1. safe extraction of verified pinned source into a fresh digest-named private
   workspace;
2. overlay completeness, patch preimage verification, single application,
   reapply rejection, and postimage digests;
3. effective package/lock bytes, exact pnpm binary, declared cache and explicit
   network/offline modes, with no workspace fallback;
4. typed dashboard tests/build and an immutable L1 build handle for 007–014;
5. shared command registration while later SWUs own only behavior files/tests;
6. pinned browsers, minimal environment, fresh loopback ports, explicit child
   PIDs, unintended-outbound denial, and unconditional bounded teardown;
7. a producer receipt plus separate verifier recomputing inputs, outputs,
   protected scopes, processes/ports, and residue; and
8. unchanged `authority_effect: none`, exact-evidence/sidecar versus generalized
   presentation graph, and automated/manual claim ceilings.

Why B rather than expanded A: both could contain identical mechanics, but 007
is already selected under a frozen graph and owns UI-store behavior. Expansion
would still require invalidation, refresh, and reselection while conflating
bootstrap and feature responsibility. A predecessor makes the temporal owner
and build handle explicit. This is a review recommendation only: it does not
resolve the Decision Gate, authorize refresh, select a new SWU, or execute L1.
Option D remains the smallest valid no-L1 stop; C remains a contract-wide
evidence downgrade, not an equivalent repair.
