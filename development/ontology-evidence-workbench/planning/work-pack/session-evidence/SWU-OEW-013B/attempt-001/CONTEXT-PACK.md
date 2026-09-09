# Context Pack — SWU-OEW-013B Attempt 001

Mode: standard strict context  
Selector: `SWU-OEW-013B`

## Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| B13-01 | Bind the unique selected cursor and captured-series authority | covered |
| B13-02 | Bind passing 006P toolchain plus 008F Task Session and owner closeout | covered |
| B13-03 | Bind all seven declared target baselines | covered |
| B13-04 | Bind the complete first-working-version manifest and package registry | covered |
| B13-05 | Bind the exact build command inputs before mutation | blocked |
| B13-06 | Require a fresh digest-named workroot and forbid ambient fallback | covered |
| B13-07 | Require patch-once, typed test/build, immutable output, cleanup, and residue evidence | covered |
| B13-08 | Require a distinct verifier before browser handoff | covered |
| B13-09 | Bind a fresh protected-set baseline | covered |
| B13-10 | Preserve private scope and `authority_effect:none` | covered |

## Blocking Tension

The registered `build:l1` and `verify:l1-build` commands both require
`upstream/L1-BUILD.lock.json`. That file is absent and is not one of the seven
paths owned by `SWU-OEW-013B`. The predecessor owns
`upstream/L1-TOOLCHAIN.lock.json`, but silently substituting it would make the
registered command and exact-lock drift contract false.

No implementation target may be written in this attempt. The minimum repair is
an Invoke Refresh that explicitly adds one private, build-specific
`upstream/L1-BUILD.lock.json` target binding the verified 006P toolchain
receipt, the 007 overlay, the 008F first-working-version manifest, exact
package/lock bytes, and declared mode. The current selector must remain
stopped until that target is approved and the frontier is revalidated.
