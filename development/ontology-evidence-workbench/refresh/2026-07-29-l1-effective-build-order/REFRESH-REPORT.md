# Invoke Refresh Report — OEW 013B Effective Build Order

Phase status: **PASS**  
Handoff status: **READY**  
Mutation mode: **apply-approved**  
Activation source: **continuation**  
Run mutation ready: **true**  
Durable `mutationRuntimeReady`: **false**

## Applied Repair

The pinned root lifecycle command was made explicit without removing
`--ignore-scripts`:

```text
pnpm install --frozen-lockfile --ignore-scripts --store-dir <workroot>/pnpm-store
pnpm --filter @understand-anything/core build
pnpm --filter @understand-anything/dashboard test
pnpm --filter @understand-anything/dashboard build
```

The lock binds the root, core, and dashboard package bytes; core name and exact
`build: tsc`; the full core `dist` export contract; expected exit 0; and
producer evidence for the exact command, exit code, output-tree digest, and 12
required output paths.

## Validation

- Strict context: 12 artifacts and 8/8 obligations — pass.
- Serial private Dispatch Spec — pass.
- Distill — skipped with bounded indivisible-repair rationale.
- Staged and live lock: 70 checks — pass.
- Negative probes: 7/7 missing/drifted/skipped/failed/out-of-order/evidence
  variants block.
- Shared frontier validator: unchanged; all four remaining suffixes pass.
- Canonical material package:
  `oew-l1-effective-build-order-refresh-20260729`,
  digest
  `29930501b7bf1baf1cc3b7fa89f363246a48540337c920e4e2fa7081f8237a78`.
- Canonical material receipt and handoff: pass/ready; 8/8 applied live bytes
  equal staging.
- Package registry: one root, hash unchanged
  `a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004`.
- Protected set: 12,991 entries, digest unchanged
  `100134c4cb2f8ef71bcb0b4f9463c2bfc683a3ad4d844dd811979fb681ac97fa`.

## Selection and Ceiling

Only `SWU-OEW-013B` is selected. Session budget is 6 and consumed sessions
remain 3. The remaining frontier is still 013B → 014 → 014V; 014, 014V, and L2
are unselected.

This Refresh did not execute the core build, dashboard tests, final producer,
independent verifier, browser, or any authority/release lifecycle. The next
route is one fresh `task-session:execute` run for `SWU-OEW-013B`.
