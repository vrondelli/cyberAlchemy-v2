---
notification_id: victor-roadmap-lab-how-to
recipient: Victor
status: declined
created_on: 2026-07-14
scheduled_for: null
completed_on: null
guide: projects/domainspec-v2/development/first-production-release/visibility/HOW-TO-ROADMAP-LAB.md
allowed_transitions:
  pending: [scheduled, in_progress, declined]
  scheduled: [in_progress, declined]
  in_progress: [completed, scheduled]
  completed: []
  declined: []
---

# Victor: Roadmap Lab walkthrough

The standalone Roadmap Lab walkthrough is ready. It teaches you how to understand
FPR-01, inspect a source, propose one improvement, and copy the proposal for owner
review.

## First prompt

When this notification is pending, ask exactly one choice:

> Victor, the Roadmap Lab walkthrough is ready. Do you want to run it now or schedule it?

Do not start the walkthrough or choose a date without Victor's answer.

## If Victor chooses run now

1. Change `status` to `in_progress`.
2. Open the file named by `guide` and the standalone Roadmap Lab page.
3. Follow the guide through its three completion checks.
4. When Victor completes them, change `status` to `completed` and set `completed_on` to
   the current date.

Running the walkthrough is training and review. It does not authorize implementation,
save or apply a Roadmap Lab proposal, or advance the DomainSpec v2 release.

## If Victor chooses schedule

Ask one follow-up question for a date. Record the answer as `YYYY-MM-DD` in
`scheduled_for`, then change `status` to `scheduled`.

Scheduling exists only in this repository notification. It does not create a calendar
event, background reminder, external message, or delivery guarantee.

While `scheduled`, do not surface the walkthrough before `scheduled_for`. When the date
is due, offer to start it. If Victor chooses a later date, update `scheduled_for` and
keep the status `scheduled`.

## If a session ends during the walkthrough

Keep `status: in_progress`. The next Victor session should offer to resume from the
guide's first unfinished completion check. Victor may instead choose a new date; record
it and transition back to `scheduled`.

## Terminal states and cleanup

`completed` and `declined` are terminal. After either is recorded, an authorized Task
Session must remove the complete
`roadmap-lab-how-to-notification` marker block from both root `AGENTS.md` and
`CLAUDE.md`.

Displaying this notification is not approval to mutate those files, execute unrelated
work, accept a proposal, or change release state.
