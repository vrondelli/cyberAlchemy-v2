# TASK-RLH-003 — install the Victor notification and runtime pointers

Status: pass — SWU-RLH-004 and SWU-RLH-005, 2026-07-14  
Layer: L2  
Depends on: SWU-RLH-002 and SWU-RLH-003 pass receipts  
Owner capability: Task Session with repository instruction-owner review

## Objective

Ensure Victor's next repository session surfaces one bounded choice—run the Roadmap Lab
walkthrough now or schedule it—while keeping mutable state outside root instructions.

## Inputs

- `../../../HOW-TO-ROADMAP-LAB.md`.
- root `AGENTS.md` and `CLAUDE.md`.
- `../shared/context.md` and `../shared/gaps.md`.

## Outputs and write scope

- Create `../../../notifications/victor-roadmap-lab-how-to.md`.
- Append one marked block to root `AGENTS.md`.
- Append the identical marked block to root `CLAUDE.md`.
- Add/update a focused contract test under `../../../tests/`.
- Receipts under `../../runs/SWU-RLH-004/` and `../../runs/SWU-RLH-005/`.

No other root instruction prose may change.

## Notification contract

The Markdown notification uses YAML frontmatter:

```yaml
notification_id: victor-roadmap-lab-how-to
recipient: Victor
status: pending
created_on: 2026-07-14
scheduled_for: null
completed_on: null
guide: projects/domainspec-v2/development/first-production-release/visibility/HOW-TO-ROADMAP-LAB.md
```

Allowed states and transitions:

- `pending -> scheduled | in_progress | declined`;
- `scheduled -> in_progress | declined` when due or explicitly reopened;
- `in_progress -> completed | scheduled`;
- `completed` and `declined` are terminal.

The body asks exactly one choice at first surface: run now or schedule. Scheduling asks
one follow-up date and records it in `scheduled_for`; it does not claim external calendar
delivery. The walkthrough completion check comes from the guide.

## Runtime pointer contract

Both root files receive the same markers and body:

```text
<!-- roadmap-lab-how-to-notification:start -->
...bounded session-start pointer to the notification...
<!-- roadmap-lab-how-to-notification:end -->
```

The pointer instructs the runtime to:

1. read the notification at session start;
2. surface it when `pending`, when a `scheduled` date is due, or when `in_progress`;
3. if the operator is not Victor, leave it unchanged and continue;
4. ask only `run now` or `schedule` for pending state;
5. remove the marked block from both root files after `completed` or `declined` is
   recorded through an authorized Task Session;
6. never treat notification display as proposal or execution approval.

## Smallest Working Units

### SWU-RLH-004 — notification state

- Dependencies: SWU-RLH-003.
- Write scope: notification artifact and focused test only.
- Done criteria: frontmatter, transitions, guide path, prompt, and cleanup rule are
  complete and parseable by the focused test.
- Acceptance evidence: pending and terminal fixtures/checks pass.
- Verification: focused unittest plus manual reading of the two-choice prompt.
- Execution owner: local fallback via Task Session.
- Handoff note: do not touch root files until this contract passes.

### SWU-RLH-005 — runtime pointers

- Dependencies: SWU-RLH-004.
- Write scope: only the marked block in root `AGENTS.md`, root `CLAUDE.md`, and the
  focused test.
- Done criteria: blocks are byte-equivalent, reference the exact notification, preserve
  all router text, and define terminal cleanup.
- Acceptance evidence: before/after diff limited to the marker blocks; contract test.
- Verification: focused unittest and `git diff --check` for the two root files.
- Execution owner: local fallback via Task Session with owner review.
- Handoff note: block if either root file has overlapping dirty edits at execution time.

## Edge cases and failure behavior

- Unknown operator: do not ask identity repeatedly; leave the item pending and continue.
- Scheduled in the future: do not surface early.
- Terminal notification with marker still present: validation fails until cleanup.
- Missing guide or mismatched pointer bodies: block.
- A request for calendar delivery routes outside this plan.

## Next handoff

After both receipts pass, route to `TASK-RLH-004-VERIFY`.

Receipts: `../../runs/SWU-RLH-004/RESULT.md` and
`../../runs/SWU-RLH-005/RESULT.md`.
