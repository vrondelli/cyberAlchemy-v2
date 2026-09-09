# Invoke Refresh Report — OEW Typed-Overlay Repair Route

Phase status: **PASS**  
Handoff status: **READY**  
Selected SWU: **SWU-OEW-007T**  
Mutation mode: **apply-approved**  
Durable `mutationRuntimeReady`: **false**

## Applied Planning Repair

The ordered series is now:

```text
008F → 007T → 013B → 014 → 014V
```

Only 007T is selected. It owns a future six-path typed-input repair: three
completed-007 source files and their overlay, first-working-version, and build
lock bindings. Completed-007 receipt history is preserved.

The lock role split is explicit: 007T may mutate/rebind it, but 013B remains
the lock owner/consumer and the final build/runtime owner. 013B no longer owns
the lock as a mutation target and depends on 007T.

## Validation

- Strict context: 22 artifacts, 8/8 obligations — pass.
- Serial private Dispatch Spec — pass.
- Distill — skipped with indivisible-repair rationale.
- Planning checks: 13/13 staged and live — pass.
- Frontier checks: 19/19 staged and live — pass.
- Ordered suffix regressions: 5/5 staged and live — pass.
- Negative probes: 5/5 staged and live — pass.
- Canonical material/handoff: pass/ready; 9/9 live bytes equal staging.
- Future 007T targets: 6/6 unchanged by this Refresh.
- Package registry: one root, unchanged SHA-256
  `a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004`.
- Protected set: 12,991 entries, exact digest equality.

## Budget and Ceiling

The session budget is 8 with 4 consumed, reserving one session each for 007T,
a fresh 013B retry, 014, and 014V. Only 007T is selected; 013B, 014, 014V, and
L2 remain unselected.

This Refresh did not change implementation source, manifests, the build lock,
tests, package metadata, or tsconfig; it did not run the focused test, typed
dashboard build, 013B build/verifier, or browser. The terminal next route is a
fresh `task-session:execute` for `SWU-OEW-007T`.
