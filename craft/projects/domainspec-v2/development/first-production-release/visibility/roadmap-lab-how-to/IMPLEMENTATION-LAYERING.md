# Implementation layering — Roadmap Lab how-to and notification

Status: planned  
Recommended next layer: L0

## Layer boundary heuristic

Each layer stops when it unlocks one new decision with less coordination than beginning
the next concern. No layer introduces a general notification framework.

## L0 — prove the walkthrough

**After this layer, we know whether a first-time collaborator can complete one Roadmap
Lab review without oral explanation.**

- Minimum working unit: `HOW-TO-ROADMAP-LAB.md` with purpose, prerequisites, exact
  steps, expected results, standalone limitation, and completion check.
- Included: current page behavior and the existing last-event preview.
- Deferred: HTML integration, copy convenience, notification delivery.
- Visible outcome: Victor or another collaborator has one link that explains the whole
  walkthrough in plain language.
- Risk reduced: the guide does not teach internal governance vocabulary or imply that
  submitting means saving, accepting, or applying.
- Exit evidence: editorial review against O1 and O7; every step maps to a live control.
- Promotion: proceed to L1 only if the guide can be followed against the current page.

## L1 — make standalone interaction complete

**After this layer, we know whether the guide can be completed from the served HTML
without Canvas.**

- Minimum working unit: embedded quick guide plus a Copy event button beside the
  existing last-event preview.
- Included: template, generated HTML, focused unit/browser tests.
- Deferred: local persistence, backend storage, acknowledgment emulation.
- Visible outcome: a user submits a review event and copies the exact validated JSON for
  an agent or owner to review.
- Risk reduced: the standalone flow no longer ends in an unexplained storage wait.
- Exit evidence: builder `--check`, unit suite, and browser equality between emitted and
  copied payload.
- Promotion: proceed to L2 only when the guide and live controls agree.

## L2 — surface the one-time invitation

**After this layer, we know whether Victor's next repository session will surface the
walkthrough without turning root instructions into a permanent personal inbox.**

- Minimum working unit: one pending notification artifact plus identical bounded marker
  blocks in root `AGENTS.md` and `CLAUDE.md`.
- Included: `pending`, `scheduled`, `in_progress`, `completed`, and `declined` states;
  run-now/schedule prompt; terminal cleanup rule.
- Deferred: multiple recipients, automatic calendar integration, notification registry.
- Visible outcome: the next repo session surfaces the invitation; Victor chooses now or
  a date.
- Risk reduced: personal content remains removable and state lives in one artifact.
- Exit evidence: notification contract test and byte-equivalent runtime pointers.
- Promotion: proceed to L3 only after both runtime surfaces pass the same check.

## L3 — prove and hand off the lifecycle

**After this layer, we know whether the entire route can be operated and retired without
stale prompts or hidden authority.**

- Minimum working unit: end-to-end verification receipt covering guide, standalone
  event copy, notification state, runtime pointers, and cleanup behavior.
- Included: clean regeneration, unit/browser checks, manual novice walkthrough, and
  result receipt.
- Deferred: generalized onboarding analytics and transport promotion.
- Visible outcome: Victor can run or schedule the walkthrough, and terminal states stop
  prompting.
- Risk reduced: a polished page cannot be mistaken for saved evidence or release proof.
- Exit evidence: `TASK-RLH-004-VERIFY` receipt.
- Promotion: close this feature only; do not advance FPR-01 or production authorization.

## Non-regression guarantees

- Generated `roadmap.html` is still produced from `roadmap.template.html`.
- Roadmap Lab events retain their exact schema and size validation.
- The page still cannot accept, apply, or promote proposals.
- Root `AGENTS.md` and `CLAUDE.md` keep their existing router contract.
- No public Arcanum file receives private DomainSpec-v2 content.

## Major deferred scope

A reusable notification platform is deliberately deferred. A second independent
notification use case is the earliest signal that should reopen that design question.
