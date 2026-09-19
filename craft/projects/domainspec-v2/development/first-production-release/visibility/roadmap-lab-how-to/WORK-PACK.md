# Work pack — Roadmap Lab how-to and Victor notification

Status: execution in progress; SWU-RLH-001 through SWU-RLH-005 passed 2026-07-14  
Complexity: medium  
Output mode: split  
Active layer window: L3 verification  
Selected SWU: none

## Outcome

A first-time collaborator can learn the Roadmap Lab from the standalone HTML, copy a
review event for owner/agent handling, and receive a one-time session invitation that
offers `run now` or `schedule` without granting proposal or release authority.

## Definition of done

- The generic guide matches live controls and avoids unexplained internal vocabulary.
- The HTML embeds the quick guide and copies the exact event shown in its preview.
- Standalone mode is described honestly: copy is available; storage acknowledgment is
  still absent unless a host provides it.
- One Victor notification owns pending/scheduled/in-progress/completed/declined state.
- Root `AGENTS.md` and `CLAUDE.md` contain identical, bounded, removable pointers.
- Terminal notification state has an explicit cleanup path.
- Build synchronization, unit tests, browser tests, and a human walkthrough pass.
- FPR-01 and `production_authorized=false` remain unchanged.

## Task board

| Task | Layer | Purpose | State |
|---|---|---|---|
| [TASK-RLH-001-GUIDE](work-pack/tasks/TASK-RLH-001-GUIDE.md) | L0 | Author the generic walkthrough | SWU-RLH-001 pass |
| [TASK-RLH-002-INTEGRATE](work-pack/tasks/TASK-RLH-002-INTEGRATE.md) | L1 | Embed guide and complete standalone copy flow | SWU-RLH-002 and 003 pass |
| [TASK-RLH-003-NOTIFY](work-pack/tasks/TASK-RLH-003-NOTIFY.md) | L2 | Install notification state and runtime pointers | SWU-RLH-004 and 005 pass |
| [TASK-RLH-004-VERIFY](work-pack/tasks/TASK-RLH-004-VERIFY.md) | L3 | Verify recomposition and handoff | ready |

## SWU manifest

| SWU | Parent | Goal | Depends on | Write scope | Acceptance evidence | Verification | Owner |
|---|---|---|---|---|---|---|---|
| SWU-RLH-001 | TASK-RLH-001 | Write the complete plain-language walkthrough. | none | `../HOW-TO-ROADMAP-LAB.md` | every live step and boundary covered | focused editorial/control review | local fallback with Whisper |
| SWU-RLH-002 | TASK-RLH-002 | Copy the already validated event preview in standalone HTML. | SWU-RLH-001 | template HTML and focused tests | copied JSON equals emitted message | unit and Playwright tests | local fallback via Task Session |
| SWU-RLH-003 | TASK-RLH-002 | Embed a compact guide that links to the full walkthrough. | SWU-RLH-002 | template HTML/CSS and focused tests | guide reachable by keyboard and mobile | builder check and Playwright | local fallback with Whisper |
| SWU-RLH-004 | TASK-RLH-003 | Create the stateful Victor notification. | SWU-RLH-003 | `../notifications/victor-roadmap-lab-how-to.md` and notification test | valid lifecycle and exact guide target | focused contract test | local fallback via Task Session |
| SWU-RLH-005 | TASK-RLH-003 | Add identical removable pointers to both root runtime files. | SWU-RLH-004 | root `AGENTS.md`, root `CLAUDE.md`, notification test | markers and bodies match; terminal cleanup is testable | focused contract test | local fallback via Task Session |

Each SWU's exact done criteria, source anchors, failure behavior, and handoff note live in
its parent task contract. Runtime execution must select exactly one SWU.

## Waves

| Wave | Layer question | Tasks/SWUs | Promotion evidence |
|---|---|---|---|
| [W0](work-pack/waves/W0-WALKTHROUGH.md) | Can a novice complete one review from written guidance? | TASK-RLH-001 / SWU-RLH-001 | guide-to-control trace |
| [W1](work-pack/waves/W1-STANDALONE.md) | Can the walkthrough finish in plain HTML? | TASK-RLH-002 / SWU-RLH-002, 003 | emitted/copied equality and browser proof |
| [W2](work-pack/waves/W2-NOTIFICATION.md) | Will the next session surface and govern one invitation? | TASK-RLH-003 / SWU-RLH-004, 005 | notification and pointer contract proof |
| [W3](work-pack/waves/W3-VERIFY.md) | Does the route recompose and retire cleanly? | TASK-RLH-004 / verification exemption | final receipt and manual walkthrough |

## Shared gates

1. Review-only gate: copied or submitted events are not saved, applied, or accepted.
2. Root-instruction gate: only the marked pointer block may be changed in `AGENTS.md`
   and `CLAUDE.md`; their router content remains untouched.
3. Recipient gate: the notification is addressed to Victor; other operators leave it
   pending and continue.
4. Scheduling gate: scheduling records a date in the artifact; no external calendar
   claim is made.
5. Cleanup gate: completed or declined state requires removing both root markers.
6. Release gate: this feature cannot change FPR state or production authorization.

## Validation strategy

| Slice | Evidence |
|---|---|
| Guide | control-to-step trace plus human-language checklist |
| Standalone interaction | deterministic build, unit suite, Playwright keyboard/copy test |
| Notification | frontmatter/status contract and identical marker-body test |
| Recomposition | clean `--check`, all tests, manual Victor walkthrough, result receipt |

## Current state and navigation

- Start here: `PLANNING-CONTEXT.md`.
- Layer decisions: `IMPLEMENTATION-LAYERING.md`.
- Execution choreography: `EXECUTION-PACK.md`.
- Machine route: `DISPATCH.json`.
- Distill verdict: `DISTILL-VALIDATION.md`.
- First executable candidate: closure-only `TASK-RLH-004-VERIFY`.
- Next owner after explicit selection: `task-session`.

## Gaps and stop conditions

No blocker remains in the plan. Stop execution if:

- the guide requires IDE Canvas mutation;
- copied JSON differs from the validated event envelope;
- root router prose must be rewritten rather than appending/removing the bounded marker;
- notification delivery is claimed when neither runtime file contains the pointer;
- a proposal is stored, applied, or promoted by this feature;
- implementation tries to generalize into a notification platform.
