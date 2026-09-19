# Planning context — Roadmap Lab how-to and Victor notification

Status: approved intent; implementation not started  
Date: 2026-07-14  
Observed capability: Invoke, plan mode  
Target lifecycle owner: DomainSpec-v2 Roadmap Lab

## Intent

Make the existing Roadmap Lab understandable and usable by a first-time collaborator,
then ensure Victor sees a one-time invitation in his next repository session and can
choose either to run the walkthrough immediately or schedule it.

## Approved design references

- `../WHISPER-HUMAN-REVIEW.md` — the page must serve a collaborator who does not know
  the release vocabulary and must preserve the claim boundary.
- `../roadmap.template.html#roadmap-lab` — the current interaction surface, event
  preview, and Canvas acknowledgment behavior.
- `../PLAN-TRANSPORT.md` — generated HTML is never edited directly; template and tests
  own presentation behavior.
- repository-root `AGENTS.md` and `CLAUDE.md` — identical session instruction surfaces.

## Delivery obligations

| ID | Obligation | Acceptance evidence |
|---|---|---|
| O1 | A newcomer can follow a short standalone guide without knowing internal vocabulary. | `HOW-TO-ROADMAP-LAB.md` passes human-language review. |
| O2 | The Roadmap Lab itself exposes the quick guide near the interaction surface. | Browser test reaches and expands the guide. |
| O3 | A standalone HTML user can copy the exact event already shown in the event preview. | Browser test submits a proposal and copies the same validated envelope. |
| O4 | A durable Victor notification offers `run now` or `schedule` and owns its status. | Pending notification artifact validates against the documented lifecycle. |
| O5 | Both Codex and Claude session instructions surface the same one-time pointer. | Marker blocks are byte-equivalent and name the same notification path. |
| O6 | Completion or decline stops future prompting. | Notification lifecycle and cleanup rule remove both root pointers at terminal state. |
| O7 | No guide, notification, or proposal applies roadmap changes or claims approval. | Copy and notification text preserve review-only boundaries. |

## Selected context

Context Builder mode: lean, strict. Six selectors cover all obligations:

1. `../WHISPER-HUMAN-REVIEW.md#objective-and-audience` — O1, O2, O7.
2. `../WHISPER-HUMAN-REVIEW.md#claim-safeguards` — O7.
3. `../roadmap.template.html#roadmap-lab` — O2, O3.
4. `../roadmap.template.html` functions `recordHistory`, `postLabMessage`, and
   `emitLabEvent` — O3, O7.
5. repository-root `AGENTS.md#mandatory-first-step--no-exceptions` — O5, O6.
6. repository-root `CLAUDE.md#mandatory-first-step--no-exceptions` — O5, O6.

Excluded: IDE Canvas source files. This slice must work in the standalone HTML and does
not reopen the blocked IDE integration scope.

## Delivery boundary

Included:

- one generic how-to owned beside the Roadmap Lab;
- one embedded quick-guide section;
- one copy action for the already-rendered event payload;
- one recipient-specific, stateful notification artifact;
- one small, identical, removable notification pointer in each root instruction file;
- focused unit and browser validation.

Explicitly deferred:

- a general notification service, inbox, scheduler daemon, database, or background job;
- standalone persistence or fake Canvas acknowledgment;
- automatic application, acceptance, promotion, or merging of proposals;
- identity inference beyond the explicit recipient named in the notification;
- IDE Canvas mutation.

## Decision trace

- The guide is generic; Victor-specific state belongs only to the notification.
- Root instruction files are routing surfaces, not inboxes. They receive only a bounded
  marker that points to the notification and describes its cleanup condition.
- `schedule` means recording a date in the notification artifact. It does not create an
  external calendar event.
- The existing event preview is the source for standalone copy. No second event payload
  is constructed, and no persistence claim is added.

## Planning readiness

No acceptance-critical ambiguity remains. The first executable unit is
`SWU-RLH-001`; execution still requires an explicit Task Session selection.
