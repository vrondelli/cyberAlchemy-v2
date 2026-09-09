# Bateson — ownership, lifecycle, and boundary attack

## INITIAL POSITION

**BLOCK tactical repair A as currently stated; FIX the plan before any L1
selection.** Adding `package.json` and a generic runner to SWU-OEW-007 closes
only script-registry contention. It does not bind the owner or acceptance
boundary for extracting the pinned source, applying the overlay/patch,
installing the pinned toolchain, enforcing offline/cache policy, running and
tearing down browsers and servers, proving protected-scope cleanliness, or
independently verifying receipts. The smallest defensible repair is therefore
an owner-complete validation-bootstrap responsibility (whether represented as
a refreshed 007 or a predecessor SWU is a planning decision, not this attacker's
selection). One execution owner must own the entire prepare → materialize →
test → browser → teardown → independently verify lifecycle, while later SWUs
own only their behavior files and behavior assertions.

Poker-Team is a consumer example only. Its workspace packages, servers,
credentials, browsers, fixtures, and test conventions are not OEW authority.
The candidate-graph receipt is finite prototype evidence with
`"authority_effect":"none"`, not proof of a reusable React/browser runtime.

## Severity-ranked attacks and one-line repairs

### S0 — Shared runtime lifecycle has no single accountable owner

> “Add the OEW `package.json` and one generic overlay-unit runner to
> SWU-OEW-007's target inventory.”

> “later SWUs own their test and component files but do not repeatedly modify
> the shared script registry.”

This allocates two files, not the side effects needed to make them executable.
No target inventory owns package/lock materialization, source extraction,
overlay application, mutable upstream worktree, install/cache/network policy,
browser acquisition, ports/processes, teardown, or the aggregate receipt.

**Repair:** name one private OEW validation-runtime owner and add its complete
inputs, mutable workspace, outputs, teardown manifest, and independently
checked receipt to one refreshed target inventory.

### S0 — The selected unit is stale and blocked; its package is not executable

> `"status": "blocked-preflight-validation-entrypoint"`

> `"selected": true`

> “Selected option: none”

> “Consequential implementation: blocked”

The manifest simultaneously retains a selected bit and a terminal receipt for
a unit whose decision explicitly has no selected repair. That bit cannot
authorize a refreshed 007, and none of the eight declared L1 scripts exists in
the live OEW package.

**Repair:** preserve the old blocked receipt as history, invalidate the stale
selection explicitly, refresh the dependency graph/targets, then require a new
human selection before Task Session.

### S0 — Upstream archive and lock prove L0, not an overlay build seam

> `"build_command": "pnpm --filter understand-anything-viewer build"`

> `"command": "pnpm install --frozen-lockfile"`

> `"temporary_clone_install_build_removed": true`

The current receipt hashes match the current archives, but it records a
network-capable install and viewer build in a removed temporary clone. It does
not prove an OEW overlay was applied, that dashboard tests used OEW files, that
cache misses fail closed, or that the build can be reproduced offline. The
lock pins pnpm `10.6.2`; the live OEW package neither owns that package manager
nor a lockfile.

**Repair:** bind the source-archive digest, upstream lock digest, overlay
manifest/patch digests, package lock, exact package-manager binary, cache mode,
network-denial result, and post-run residue scan into the L1 receipt.

### S1 — Planned overlay mutation is not bounded or reversible

> “L1 will use a small, explicit patch overlay”

> `"cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/patches/0001-oew-entrypoint.patch"`

No current artifact defines where the patch is applied, whether the input tree
must be pristine, whether repeated application is rejected, how patch drift is
detected, or how failure removes the partially patched tree.

**Repair:** materialize into a fresh digest-named temporary tree, verify every
preimage and overlay member before patching, never mutate the archive or public
Arcanum, and delete/quarantine the tree under a single teardown owner.

### S1 — Browser acceptance is non-hermetic and teardown-incomplete

> `"validation": "npm run test:browser"`

> “Firefox/Chromium, Poker/parity/token/network/console/responsive/keyboard/axe/
> reduced-motion/isolation pass; manual stays NOT_RUN.”

No live OEW browser entrypoint, Playwright pin, browser-revision pin, server
ownership, port lease, process ledger, or cleanup receipt exists. Poker-Team's
example uses `reuseExistingServer: !process.env.CI`, inherits
`...process.env`, starts a separate backend, and has cleanup based on broad
`pgrep` patterns. That is consumer-local and can reuse or kill unrelated
processes; it is not hermetic evidence for OEW.

**Repair:** the OEW browser owner must pin package and browser revisions, use
fresh allocated ports and explicit child PIDs, deny unintended outbound
requests, set a minimal environment, always teardown in `finally`, and receipt
zero surviving children/ports plus protected-scope digests.

### S1 — Receipts are producer assertions without an independent acceptance edge

> `"result": "pass"`

> `"tracked_changes_after_build": []`

> `"authority_effect": "none"`

The upstream receipt is internally consistent with current archive hashes, but
its claims about executed commands, network behavior, cleanup, and tracked
changes are self-reported. The planned browser receipt likewise names no
separate verifier or immutable expected manifest.

**Repair:** separate producer and verifier; the verifier recomputes artifact,
input, protected-scope, and residue digests from current bytes and rejects
unknown fields/commands rather than trusting `result`.

### S2 — Runtime-faceted-layout is a pattern, not a drop-in runtime

> “Apply remains sequential and non-atomic; partial mutation is reported.”

> “No live consumer Inventory was synchronized.”

Its manifest allowlist, digest checks, and installed-consumer fixture survive
as design patterns. Its sequential mutation and Inventory-specific contracts
do not own React/pnpm/Playwright, upstream patching, or OEW private receipts.

**Repair:** reuse only the generic manifest/digest idea through a generic
public contract; implement OEW paths, private bindings, atomic materialization,
and rollback in the private OEW adapter.

### S2 — Experiment Harness introduces circular and excessive authority

> “The loop may apply patches”

> `git apply "$patch"`

It is designed for live Codex attempts and improvement/rollback of sigils and
spells. Reusing it for acceptance would let the verifier mutate what it
verifies, couple OEW to robot-talks/observability/Codex, and make clean Git
state an implicit dependency.

**Repair:** KEEP only failure-precedence/phase-gate ideas; prohibit
auto-improvement and Git patch application in OEW validation.

### S2 — Poker-Team and OCGP evidence ceilings are easy to inflate

> `"authority_effect":"none"`

> `"claim_ceiling":"Canonical bundle-body reproducibility only; no ontology correctness, admission, promotion, publication, or deployment."`

Poker-Team's caret dependencies, workspace `node_modules`, backend, mutable
fixtures, environment inheritance, and broad cleanup are examples of a
consumer setup, not reusable OEW pins. OCGP's 59-test history does not establish
React/browser fidelity or authority.

**Repair:** use Poker-Team only to enumerate test concerns and OCGP only for
finite fixture/receipt shapes; require fresh OEW-local evidence for every L1
claim.

## Boundary and failure-mode table

| Side effect / failure mode | Explicit owner required | Acceptance boundary |
| --- | --- | --- |
| Read source archive and lock | OEW upstream-input verifier | exact archive/lock/license/inspected-file digests; no fetch |
| Extract source | OEW materialization owner | fresh private temp root, safe paths, expected content root, no residue on failure |
| Apply overlay and patch | OEW overlay owner | manifest-complete pre/postimage digests; idempotence/reapply rejection; upstream archive unchanged |
| Install dependencies/cache | OEW toolchain owner | exact pnpm + lock; declared cache; offline replay or explicit network receipt; no workspace fallback |
| Register shared scripts | one refreshed bootstrap/007 owner | exact eight commands, no later shared-file mutation, runner digest bound |
| Unit/component tests | each behavior SWU | only its declared files/assertions; aggregate runner remains immutable |
| Start viewer/browser | OEW browser owner | fresh ports, explicit child PIDs, minimal env, pinned Chromium/Firefox |
| Network/token/isolation checks | OEW isolation verifier | default-deny outbound log; protected-scope before/after manifests equal |
| Teardown | same OEW runtime owner | children stopped, ports free, temp/cache policy satisfied, failures cannot skip cleanup |
| Emit receipt | OEW receipt producer | phase-accurate facts and digests; no authority/promotion claim |
| Accept receipt | independent OEW receipt verifier | recomputation from current bytes; fail closed on missing/extra/unreached evidence |
| Public reuse | Arcanum generic-contract owner | no `cyberAlchemy-v2`, Poker, private paths, fixtures, or receipt prose in public bytes |

## Per-artifact disposition

| Artifact / corpus member | KEEP / FIX | Reason |
| --- | --- | --- |
| `design/ARCHITECTURE.md` | FIX | Name the L1 runtime lifecycle owner and immutable/mutable boundaries. |
| `design/VALIDATION-CONTRACTS.md` | FIX | Add toolchain, teardown, network/cache, and independent receipt-verifier contracts. |
| `design/INTERFACE-CONCEPT.md` | KEEP | UI concept preserves visible authority ceiling; it is not runtime proof. |
| `design/UX-PLAN.md` | FIX | Bind browser journeys to hermetic startup/cleanup and automated-only ceiling. |
| `design/EXAMPLE.md` | KEEP | Poker walkthrough correctly denies Poker ownership; retain consumer-only status. |
| `design/UPSTREAM-BASELINE.md` | FIX | Define overlay application, drift, replay, rollback, and no-network rules. |
| `planning/IMPLEMENTATION-LAYERING.md` | FIX | Add a validation-runtime/materialization layer with one owner. |
| `planning/WORK-PACK.md` | FIX | Refresh dependency order, selection, side-effect scope, and receipt acceptance. |
| `planning/VALIDATION-STRATEGY.md` | FIX | Add clean-room/offline/browser teardown and adversarial receipt verification. |
| `planning/VALIDATION-REPORT.md` | KEEP | Preserve as historical plan-validation evidence, not runtime readiness. |
| `planning/OWNER-APPROVAL.md` | FIX | Approval must cover the refreshed owner-complete package, not Option A prose. |
| `planning/work-pack/swu-manifest.json` | FIX | Inventories 007–014 omit shared runtime/toolchain/package/lock lifecycle. |
| `planning/work-pack/chain-state.json` | FIX | Current blocked/stale selection cannot survive a plan refresh silently. |
| `DECISION.md` | FIX | A is under-scoped; B is cleaner but still needs complete lifecycle targets. |
| live OEW `package.json` | FIX | L1 commands, pins, and verifier entrypoints are absent. |
| `UPSTREAM.lock.json` | KEEP+FIX | Keep current pin; extend L1 binding to overlay/toolchain inputs. |
| `prepare-upstream.mjs` | KEEP+FIX | Keep L0 seam; add/own separate fail-closed L1 materializer, not hidden mutation. |
| `serve-native-viewer.mjs` | KEEP | L0 serving seam is useful but does not own browser orchestration. |
| `verify-adapter-receipt.mjs` | KEEP | Existing narrow verifier pattern; do not overclaim L1 coverage. |
| OEW `src/` and `test/` | KEEP | Current L0 evidence only. |
| upstream `build-receipt.json` and archives | KEEP | Current hashes agree; historical L0 build evidence only. |
| Inventory runtime-faceted-layout | KEEP AS PATTERN | Manifest/digest/consumer-isolation pattern; non-atomic and domain-specific. |
| Experiment Harness architecture/scripts | REJECT AS RUNTIME | Phase-gate ideas only; live Codex and mutating patches violate acceptance separation. |
| OCGP package/fixture/terminal receipt | KEEP AS EXAMPLE | Finite deterministic evidence, explicitly no authority effect. |
| Poker-Team package/Vite/Playwright/e2e | KEEP AS CONSUMER EXAMPLE | Useful concern inventory; workspace/server/cache/environment bindings are not portable. |

## Survived attacks

- The current upstream lock and the two retained archives agree with the
  current build receipt's SHA-256 values.
- The upstream source commit, license, inspected files, package-manager
  version, and viewer artifact are explicitly recorded.
- The L0 package has real Node ESM test/verification/serving seams.
- Validation contracts consistently state that receipts do not grant ontology
  admission, product acceptance, production readiness, promotion, or release.
- Poker-Team is described as a walkthrough/consumer example, and OCGP's
  terminal receipt explicitly preserves `authority_effect: none`.
- Runtime-faceted-layout's manifest allowlist, installed-consumer fixture, and
  public/private scan are reusable design patterns if kept generic.
- The decision gate correctly stopped mutation when the first missing script
  was discovered and correctly requires Invoke Refresh before resumption.

## PEER EXCHANGE CAPSULE

**Position:** BLOCK Option A as written. It owns two shared files but not the
runtime lifecycle. Require one private OEW validation-runtime owner for pinned
source/lock/overlay/toolchain materialization, unit and browser execution,
network/cache policy, teardown, protected-scope proof, receipt production, and
an independent verifier. Refresh targets/dependencies and reselect; do not
carry the stale `"selected": true` across the repair.

**Strongest attacks:** (1) no lock/package-manager/browser ownership in
SWU-007–014; (2) L0 archives/receipt prove no OEW overlay or offline replay;
(3) patch location, preimages, idempotence, rollback, and residue are unbound;
(4) Poker-Team reuses environment/workspace/server state and broad PID cleanup;
(5) Experiment Harness may mutate its subject; (6) Inventory runtime apply is
explicitly non-atomic; (7) receipts self-report command/cleanup facts.

**Survivors:** exact current archive hashes match the receipt; L0 seams are
real; authority ceilings are explicit; manifest/digest and phase-gate patterns
are reusable only as generic mechanics.

**Peer challenge:** Can any proposed route name one owner and a finite,
independently recomputable acceptance boundary for every row in the side-effect
table without importing Poker-Team state, mutable verification, or private OEW
bindings into public Arcanum? If not, it is not a reusable runtime.

## POST-ROBOT-TALK FINAL POSITION

### Agreements

- Hewitt's current-byte results falsify any broad claim that OEW must invent a
  runtime from nothing: `verify:upstream` passes from retained bytes, and the
  existing preparation seam already owns the source pin, deterministic
  archives, temporary clone cleanup, receipt shape, and offline retained-byte
  verification.
- Hewitt also confirms the temporal boundary: those mechanics prepare and
  verify pristine L0 upstream; they do not apply the OEW overlay, execute L1
  tests, start browsers, or prove an L1 receipt.
- Van Lamsweerde is correct that either a predecessor bootstrap SWU or a
  refreshed 007 can be complete. The artifact boundary matters more than the
  unit number; Option A is viable only after its meaning expands from “two
  files” to the full shared bootstrap responsibility and is explicitly
  re-approved.
- All three attacks agree Poker-Team, OCGP, Inventory runtime, and Experiment
  Harness are examples/mechanics, never OEW execution or authority owners.

### Disagreements and changed severity

- **Dropped:** the implication that a wholly new generalized validation runtime
  is required. Existing OEW preparation/verification mechanics are reusable
  inside a private L1 adapter.
- **Reduced S0 → S1:** archive/lock preparation itself is not ownerless.
  Its current owner and cleanup are real; the defect is temporal extension from
  pristine L0 to patched L1.
- **Retained S0:** the current Option A text is still non-executable because it
  omits overlay materialization, effective package/lock ownership, L1
  test/build receipt, and lifecycle boundaries.
- **Refined:** “one execution owner for the entire lifecycle” was too coarse.
  The invariant is one unambiguous owner and acceptance boundary **per side
  effect**, not one mega-owner. Shared bootstrap/build and browser execution
  should not self-attest through the same acceptance edge.
- I do not accept Hewitt's successful `verify:upstream` as proof of an offline
  L1 build: it proves retained-byte verification only. A network/cache policy
  remains required for any dependency installation and browser provisioning.

### Final smallest repair route

Choose neither current A nor B as written. The smallest dependency-safe refresh
is **expanded A**:

1. Preserve the existing L0 preparation/verifier unchanged as the immutable
   input seam.
2. Expand SWU-OEW-007, through bounded Invoke Refresh, into the sole shared L1
   bootstrap owner. Its exact target inventory must add the OEW package script
   registry, private overlay materializer, effective package/lock contract,
   generic typed runner, build runner, overlay/build receipt, and cleanup
   evidence. It consumes the verified retained source archive; it works only
   in a fresh private temporary tree; it binds source, lock, overlay/patch,
   toolchain, cache/network mode, build output, and residue digests.
3. Keep SWU-OEW-008–013 as behavior owners that add only their declared
   component/test bytes and consume the immutable bootstrap interface; they do
   not mutate the shared registry or runner.
4. Keep SWU-OEW-014 as the explicit browser-process owner. It consumes the
   verified L1 build handle and owns pinned browser availability, fresh ports,
   explicit child PIDs, minimal environment, outbound-denial observation,
   teardown, and residue evidence.
5. Add a deterministic acceptance verifier, separate from receipt producers,
   that recomputes the L1 build/browser/protected-scope manifests from current
   bytes. Manual UX remains `NOT_RUN`; all receipts retain
   `authority_effect: none`.
6. Preserve the blocked 007 receipt as history, invalidate the old selection,
   refresh dependencies/targets/chain state, obtain owner approval, and require
   a new explicit selection before Task Session.

This route is smaller than inserting B because it preserves the 007–014 unit
identities, but it is not a clerical amendment: its expanded target inventory
and temporal responsibility invalidate the prior selection. If Plan judges the
expanded 007 responsibility too broad, B is the cleaner fallback with the same
contracts and a newly selected dependency graph. No public Arcanum mutation is
needed; generic manifest/receipt ideas may be reused, while all OEW paths,
pins, fixtures, and evidence remain private.
