# TASK-RLH-004-VERIFY — verify recomposition and handoff

Layer: L3  
Depends on: SWU-RLH-001 through SWU-RLH-005 pass receipts  
Owner capability: Task Session validation

## Objective

Prove the guide, standalone copy path, notification state, and both runtime pointers form
one usable and retireable onboarding flow without changing roadmap or release authority.

## Write scope

- Verification receipt under `../../runs/TASK-RLH-004-VERIFY/RESULT.md`.
- Work-pack state synchronization only after every check passes.
- No product/source mutation during verification.

## Verification contract

1. Run the deterministic builder `--check`.
2. Run the complete visibility unit suite.
3. Run the Roadmap Lab Playwright suite from `projects/ide-extension/`.
4. Confirm the full and embedded guides use live labels and state that standalone submit
   is not saved/applied.
5. Confirm the copied JSON equals the emitted proposal message.
6. Confirm notification frontmatter and allowed transitions.
7. Confirm root marker bodies are identical and all non-marker router bytes are
   unchanged from the execution-start snapshot.
8. Exercise a manual novice walkthrough: explain FPR-01, locate one source, submit and
   copy one proposal, and state what happens next.
9. Simulate terminal state and prove the focused contract requires both markers absent.
10. Confirm FPR-01 state and `production_authorized=false` did not change.

## Smallest Working Unit exemption

Allowed: the task ID contains `VERIFY`, the task is closure-only, and it performs no
implementation mutation.

## Done criteria

One receipt records each command/review result, files inspected, blockers, residue, and
handoff note. Any failure returns `block`; browser polish cannot waive a failed claim,
notification, or authority check.

## Handoff

On pass, the package is ready for Victor's next session. The notification itself remains
pending until Victor chooses; this verification task does not choose for him.
