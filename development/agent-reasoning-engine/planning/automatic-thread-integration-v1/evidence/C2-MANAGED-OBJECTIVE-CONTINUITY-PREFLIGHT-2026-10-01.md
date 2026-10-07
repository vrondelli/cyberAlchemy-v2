# C2 managed objective-continuity preflight

Status: bounded development candidate, 2026-10-01. No current desktop-task
handover, product approval, activation, release, or deployment. TUI remains
discontinued.

## Change

The managed-session launcher now accepts `--require-objective-continuity`. The
gateway startup record derives `objective_continuity_status` and
`objective_requirement_tracking` from its *effective* loaded profile, after
the optional continuity-state/activation resolver. The launcher checks the
gateway's status before starting its hosted client. A disabled, missing, or
older unreported status fails this opt-in launch closed; ordinary launches
retain their existing behavior. The managed ready record distinguishes
`configured`, `disabled`, and `not-reported` instead of treating an absent
field as a disabled feature.

This closes one configuration-observation gap. `configured` means the wrapper's
objective-resolution path is selected by the profile; it is not a turn-level
continuation result, a C1 requirement snapshot, or proof of G1 desktop ingress.
Requirement tracking is reported separately, not silently inferred from
objective resolution.

## Validation

- `node --test .../test/managed-session-cli.test.mjs`: 8 passed, including a
  native pinned-host startup that blocks a disabled profile before hosted-client
  readiness and starts an enabled profile with requirement tracking while
  retaining `current_desktop_task_control:false`. Unit coverage preserves a
  distinct `not-reported` posture for older or malformed gateway readiness.
- `node --test .../test/gateway-evolution-startup.test.mjs`: 4 passed.
- `node --test .../test/objective-lifecycle.test.mjs .../test/objective-requirements.test.mjs`:
  28 passed, including file-backed objective restart and requirement continuity.
- `git diff --check`: passed for tracked changes.

All native startup tests are disposable; their private state is removed. These
tests do not prove a live provider, an installed Companion, Windows behavior,
same-task handover, or the full C2 two-turn/restart gateway chain.

## Next required proof

Run one managed, owned-thread two-turn/restart fixture with this switch using
the gateway and hosted client, and bind the exact objective transition and C1
requirement snapshot to the backend thread and model request. Preserve the
default Windows turn pause unless its independent model-entry boundary is
verified. Continue G1 host handover separately; do not reclassify this CLI
preflight as activation.

## Open Questions

- Should a final managed candidate require requirement tracking as well as
  objective resolution, and what tested profile binds both to each client?
- How will the Companion observe a verified turn-level objective frontier
  without exposing private objective text or mistaking config for activity?
