# ARE Companion UX feature briefs

Status: candidate design guidance, 2026-09-25. Owner: ARE Companion product/design.
These briefs describe a read-only ARE Observatory for Linux and Windows. They
are not an implemented feature claim, usability-test result, product approval,
or permission to expose additional data. Appearance may save local Companion
preferences; it must not mutate ARE state.
The [complete UI implementation plan](../WHOLE-UI-IMPLEMENTATION-PLAN.md) is
the parent roadmap; no single feature brief replaces its seven-feature scope.

| User question | Feature brief |
| --- | --- |
| Is ARE okay? | [Overview](OVERVIEW.md) |
| Which adapters are connected and running? | [Adapters](ADAPTERS.md) |
| What is happening in my task? | [Threads](THREADS.md) |
| Why did ARE choose that? | [Decisions](DECISIONS.md) |
| Is ARE improving? | [Evolution](EVOLUTION.md) |
| What does this warning mean? | [Evidence and diagnostics](EVIDENCE-AND-DIAGNOSTICS.md) |
| Can the companion fit my workspace? | [Appearance](APPEARANCE.md) |

## Experience spine

Floating orb → Overview → one relevant detail → evidence → back to work. The
dashboard stays useful when ARE is unavailable: the shell opens, names what
failed, and never paints a stale observation as current. The orb is a quiet
entry point, not a miniature telemetry dashboard or notification stream.

## Minimalism rules

1. Each page answers one user question. Lead with a plain-language answer,
   then reveal technical details only when the user asks.
2. Show only fields that change a user's understanding or next investigative
   step. Counts and digests belong in detail unless they explain a problem.
3. One clear primary action per page: inspect, refresh, or adjust a local
   preference. No ARE command, approval, activation, or repair control.
4. Use the same scope and time vocabulary everywhere: **observed**, **stale**,
   **no records**, **not configured**, and **unavailable** are different states.
   A candidate or disabled capability is not a failed runtime.
5. Label the source and observation time of every dynamic claim. Distinguish
   installed-product diagnostic, adapter liveness and connection, thread
   activity, decision evidence, and evolution admission;
   never merge them into one green “healthy” state.
6. Preserve a quiet desktop: lazy dashboard, bounded reads, no background
   model work, and no routine notifications. A user must be able to recover a
   hidden or off-screen orb from the operating system's normal app surface.

Navigation proposal: Overview, Adapters, Threads, Decisions, Evolution, Evidence; place
Appearance at the bottom as a local preference. Keep navigation order stable
and move focus to the new page heading after a keyboard selection. The current
[dashboard](../../ui/dashboard.html) implements all seven panels. A current-source
Windows Chromium fixture check verifies keyboard selection, heading focus,
a visible accent outline bounded to the heading rather than the full panel,
and narrow navigation at 340 pixels. A later 340-pixel cross-page-link check
verifies that the selected destination scrolls into the navigation strip while
the page heading retains focus and the document does not overflow. This is
browser-observed interaction evidence. A separate extracted
[Linux WebKitGTK candidate](../NARROW-LINKED-NAVIGATION-2026-10-02.md) passes the
same actual 340-pixel linked-navigation path. A staged native Windows WebView2
executable passes it too; installed lifecycle, screen-reader, and human
usability proof remain open for this later change.

## Evidence and design validation

Source posture comes from the [Companion prototype](../../README.md), the
[implementation inventory](../../../../inventory/SURFACES.md), and the exact
runtime sources linked in each brief. The following external guidance informs
interaction checks, not a claim of current conformance:

- [W3C status messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages): announce meaningful changes without taking focus.
- [W3C dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements): provide a non-drag pointer alternative.
- [W3C consistent navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation): keep repeated navigation predictable.
- [GNOME notification guidance](https://developer.gnome.org/hig/patterns/feedback/notifications.html): avoid unnecessary interruptions.

For every feature, review fixtures for normal, empty, stale, and unavailable
states on Linux and Windows. Use keyboard and screen-reader inspection as well
as visual review. These fixtures and checks must be built and run before any
accessibility or usability claim is made.

## Open Questions

- Is the first Threads scope only activated ARE-managed threads, or all host
  tasks? These briefs assume the former under the
  [session-control contract](../../../../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/SESSION-CONTROL-CONTRACT.md);
  the runtime still needs a verified activation-identity read projection.
- What refresh/currentness budget is appropriate for each read surface while
  preserving low idle resource use?
- Which exact read projections and privacy filters will the product owner
  approve before data-backed page implementation?
