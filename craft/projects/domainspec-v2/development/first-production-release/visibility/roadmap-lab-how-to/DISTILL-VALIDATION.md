# Distill validation — Roadmap Lab how-to and Victor notification

Status: pass  
Mode: validate  
Role path: labeled Proposer and Balancer passes; no subagents

## Objective and output

Validate whether the plan is the smallest coherent route that lets a first-time
collaborator learn the standalone Roadmap Lab and ensures Victor sees a one-time choice
to run or schedule that walkthrough.

## Proposer claim

Use one generic guide, embed a short version in the HTML, expose copy for the already
validated event preview, store Victor's invitation state in one notification artifact,
and add only a removable pointer to each root runtime instruction file.

Evidence: the current page already renders the exact event JSON but waits for Canvas
storage acknowledgment; both root runtime files currently contain the same router.

## Balancer objections and reconciliation

| Category | Objection | Decision |
|---|---|---|
| owner boundary | Root instructions could become a personal inbox. | revise: root files contain only an identical marked pointer; personal state stays in the notification. |
| usability | The standalone walkthrough ends at an unavailable Canvas acknowledgment. | revise: add copy for the exact existing preview; do not emulate storage. |
| lifecycle | A one-time message can become a permanent stale prompt. | revise: terminal states require pointer cleanup in both root files. |
| scope | A scheduler or notification service would exceed the request. | accept: `schedule` records a date in the artifact only; generalized infrastructure is deferred. |
| authority | A copied proposal may look accepted. | revise: guide, page, and notification repeat the review-only boundary. |

## Smallest coherent unit

> A plain-language walkthrough that is executable in standalone HTML, plus one
> state-owned invitation that both repository runtimes can surface and retire.

Splitting further loses closure:

- a guide without event copy teaches a dead end in standalone mode;
- event copy without a guide does not teach the review contract;
- a notification without a working guide invites Victor into an incomplete flow;
- root prose without a separate notification duplicates mutable state;
- a notification without root pointers is not guaranteed to appear next session.

## Recomposition proof

`SWU-RLH-001` defines the walkthrough. `SWU-RLH-002` and `003` make every promised step
available in the standalone page. `SWU-RLH-004` records the invitation and its state.
`SWU-RLH-005` makes the same invitation discoverable by both runtimes. The verification
task proves the combined route and terminal cleanup. Together they satisfy O1–O7 without
changing the roadmap event schema or release state.

## Technique trace

- abstraction-level guard: kept the target at onboarding and notification, not roadmap
  lifecycle redesign;
- recomposition proof: pass, as shown above;
- evolution profile: a second independent notification use case may justify a generic
  mechanism; one use case does not;
- cognitive-load check: guide uses one path and one proposal, with exact next result;
- boundary-object check: the notification is shared between human choice and runtime
  routing, while remaining non-authoritative;
- premortem: likely failure is Victor clicks Submit, sees “waiting,” and assumes the work
  was saved; guardrail is exact payload copy plus explicit “not saved/applied” text;
- frame-expiry: revisit if the IDE host becomes the required transport or if a real
  notification registry already exists;
- navigable-result check: start at `WORK-PACK.md`, then select `SWU-RLH-001`.

## Deferred complexity

- notification registry, daemon, calendar integration, analytics, multiple recipients;
- automatic identity detection;
- standalone persistence;
- proposal application or promotion;
- IDE Canvas integration.

## Verdict

Pass. The plan is small enough for one-SWU Task Sessions, large enough to deliver the
complete user outcome, and preserves a visible cleanup path. No blocker decision remains.
