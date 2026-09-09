# Refresh Report — OEW L1 Split-Build Repair

## Identity

- Date: 2026-07-27
- Activation: direct user selection `A`
- Decision: `DG-OEW-006B-BUILD-ORDER`
- Mode: Invoke Refresh / apply-approved
- Scope: private OEW Design and Plan only

## Outcome

Option A is applied. The consumed 006B selector and blocked chain are preserved
as historical evidence. The refreshed L1 candidate graph is:

```text
006P → 007–013 → 013B → 014 → 014V
```

- `006P` owns isolated Node/pnpm/effective-lock/workroot/fixture-patch
  materialization and a distinct toolchain verifier.
- 007–013 own the feature overlay.
- `013B` owns the final post-feature clean build and distinct build verifier.
- 014 consumes the verified 013B handle; 014V remains the independent browser
  acceptance verifier.
- Only 006P owns `package.json` within the new L1 frontier.

## Applied Package

- Package ID: `oew-l1-split-build-repair-20260727`
- Canonical package digest:
  `6a4e0da0020437b60d3390d775d7a5707e4e43c6622d9b47d56ed9c67b968d29`
- Target count: 18
- Applied byte equality: 18 of 18
- Owner boundary: pass
- Publication boundary: pass
- Mutation handoff: ready

The package changed three Design files, six top-level Plan files, three L1 task
contracts, W1, the SWU manifest, chain state, continuity, and created one chain
archive plus one fresh selection gate.

## Validation

- Dispatch Spec: pass.
- Context Builder: strict 14-file, 7-obligation pre-refresh context passed
  during staging.
- Distill: Standard, two rounds, pass for graph coherence.
- Manifest: 24 unique SWU records, 23 candidate/completed records, 115 unique
  active targets, 118 including historical 006B targets.
- L1 frontier: exactly 11 candidate units.
- Dependencies: closed; 007 depends on 006P, 013B on 013, 014 on 013B.
- Selection: null; authorization false; runtime readiness false.
- Chain: empty visited set, zero consumed sessions, manifest/archive bindings
  pass.
- Live target equality: 18 of 18.
- Existing implementation `package.json`:
  `2e2d593ede66572ab0fd2760b27aa53a19f60aa01e40f8c231be01b34b7b2c70`,
  unchanged.

The context index intentionally binds pre-refresh bytes. After apply, ten of
its fourteen live planning sources have the admitted new digests; that is the
expected mutation, not source drift.

## Authority and Evidence Ceiling

This refresh proves Plan coherence and exact application only. It does not
prove 006P runtime materialization, final build success, browser behavior,
manual UX/accessibility, L2 scope, ontology admission, publication, release,
or production readiness. `authority_effect` remains `none`.

## Next Route

Decision Gate `G-OEW-L1-SPLIT-BUILD-SELECTION` is pending:

- A selects the bounded eleven-unit L1 frontier, beginning at 006P and stopping
  at the first blocker or after 014V.
- D remains at the verified L0 prototype.

The build-order `A` selected this graph architecture. It did not select its new
implementation frontier.
