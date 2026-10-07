# Linux Decisions detail — native renderer follow-up

Status: bounded development test evidence, 2026-10-03. Authority effect:
none. Parent: [whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md).

The [test-only harness](../scripts/test-linux-decisions-detail.mjs) attached an
isolated gateway fixture with one backend-thread evaluation to the extracted,
uninstalled [Linux UI-refresh package](LINUX-UI-REFRESH-2026-10-03.md). It
launched the package's bundled Node and dashboard-only executable as UID 1000
in a network-disabled Ubuntu container on WSLg/X11. The package was neither
installed nor rebuilt; only the test harness and inspector changed.

The [WebKitGTK inspector](../scripts/inspect-linux-ui.mjs) passed the actual
340 × 740 window journey: one source-backed evaluation appeared, the
"Reason and technical evidence" disclosure started closed, its evaluation
versus authorization/execution boundary remained visible, and opening the
disclosure revealed the reason code and opaque evidence identifiers. There was
no horizontal document overflow. The test process made zero external model
calls and removed its disposable fixture directory after success.

The disclosure was opened by a test-only programmatic click after focusing its
native summary. This confirms renderer behavior, **not** physical pointer,
Enter-key delivery, screen-reader traversal, host authorization, or effect
execution. The fixture is not this Codex desktop task, and the result does not
establish that task as ARE-managed. Installed-package lifecycle and normal
Linux desktop validation remain open.

## Open Questions

- Can the same disclosure be traversed and announced correctly with a real
  Linux screen reader and physical keyboard on a supported desktop?
- What independent source, if any, should later report authorization or effect
  outcomes without inferring them from evaluation rows?
