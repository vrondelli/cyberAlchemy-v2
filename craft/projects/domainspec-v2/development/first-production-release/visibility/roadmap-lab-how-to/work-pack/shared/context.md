# Shared execution context

## Invariants

- `roadmap.template.html` owns HTML behavior; `roadmap.html` is generated.
- The existing event preview already contains the exact validated event message.
- Existing `[data-copy]` behavior copies a target element's `textContent`; reuse it.
- Roadmap Lab emits review evidence but cannot save, accept, apply, or promote it.
- The notification artifact owns recipient and lifecycle state.
- Root `AGENTS.md` and `CLAUDE.md` remain identical routers outside one marked block.

## Naming

- Feature code: `RLH` (Roadmap Lab How-to).
- Guide: `projects/domainspec-v2/development/first-production-release/visibility/HOW-TO-ROADMAP-LAB.md`.
- Notification: `projects/domainspec-v2/development/first-production-release/visibility/notifications/victor-roadmap-lab-how-to.md`.
- Runtime marker: `roadmap-lab-how-to-notification`.

## Non-goals

No scheduler service, background process, localStorage, Canvas mutation, automatic
proposal application, or generalized notification registry.
