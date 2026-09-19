# Execution pack — Roadmap Lab how-to and Victor notification

Status: handoff-ready after explicit SWU selection

## Execution rule

Run exactly one SWU through `task-session`. Do not execute a whole task or wave in one
unbounded session. Every result is written to `runs/<SWU-ID>/RESULT.md` inside this
package and synchronized into `WORK-PACK.md` only after validation.

## Ordered route

1. W0: `SWU-RLH-001` authors and reviews the full guide.
2. W1: `SWU-RLH-002` adds exact event copy; then `SWU-RLH-003` embeds the quick guide.
3. W2: `SWU-RLH-004` creates notification state; then `SWU-RLH-005` installs both
   runtime pointers.
4. W3: `TASK-RLH-004-VERIFY` runs the closure-only verification contract.

No pair is parallel. Copy behavior must exist before the embedded guide promises it;
the guide must work before the notification invites Victor to use it.

## Runtime Context Builder handoff

At execution time, build a strict Markdown plus JSON/index pack from the selected task
contract and its named source anchors. Do not pre-generate context packs during plan
authoring. Uncovered write scope, validation, or owner-boundary obligations block the
SWU.

## Expected SWU result

```yaml
swu_id: SWU-RLH-000
result: pass | flag | block | interrupted
capability_ref: task-session | whisper
receipt_kind: native-stage | local-fallback | blocked
receipt_artifact: projects/domainspec-v2/development/first-production-release/visibility/roadmap-lab-how-to/runs/<SWU-ID>/RESULT.md
files_touched: []
validation: []
blockers: []
residue: []
reroute: none
handoff_note: next permitted SWU or repair route
```

## Cross-task synchronization

- Generated `roadmap.html` is refreshed only through `tools/build-roadmap.py`.
- Changes to the event envelope require schema-owner review and are outside this plan.
- The notification artifact is the only owner of pending/scheduled/completed state.
- Root runtime pointers must remain equivalent and contain no independent status.
- The verification task may close this package but cannot close or advance FPR-01.

## Verification surface

```bash
python3 projects/domainspec-v2/development/first-production-release/visibility/tools/build-roadmap.py --check
python3 -m unittest discover -s projects/domainspec-v2/development/first-production-release/visibility/tests
```

Run the existing Roadmap Lab Playwright configuration from `projects/ide-extension/`.
The focused notification test must also prove root marker equivalence and terminal
cleanup rules.

## Stop conditions

- missing predecessor receipt;
- dirty overlapping edits in either root runtime file;
- inability to represent schedule state without an external service;
- any change that makes the standalone page claim storage acknowledgment;
- any automatic proposal application or release-state transition;
- any need for subagents or IDE Canvas changes not separately approved.
