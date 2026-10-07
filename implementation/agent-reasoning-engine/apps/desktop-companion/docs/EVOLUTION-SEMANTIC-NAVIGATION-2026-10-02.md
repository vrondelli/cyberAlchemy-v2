# Evolution semantic navigation — 2026-10-02

Status: candidate UI construction evidence. Authority effect: none. The
Windows installer is unsigned and uninstalled. Parent:
[whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md), Evolution feature
05; experience contract: [Evolution UX](ux/EVOLUTION.md).

## Change

The Evolution definition, recorded-cycle, coordination and gateway-candidate
cards now expose level-two headings. Each candidate definition exposes its
name as a level-three heading. Because the existing DOM reorder already puts
verified cycle evidence first and leaves registry-only definitions first, the
heading navigation order follows that same source-dependent visual order.
Styling preserves the compact 340 px first view. This changes neither the
read-only data projection nor candidate admission, worker state or authority.

## Verification and limits

- Source UI tests pass 56/56. The rendered seven-panel Edge/Playwright journey
  passes 137 checks with no uncaught page errors. Accessibility-role queries
  find the section and definition headings, and verify evidence-first heading
  order when a ledger cycle exists. At 320 and 340 px, the first useful
  definition or recorded cycle remains in a 740 px-high viewport without
  document overflow.
- A separate unsigned NSIS candidate was built incrementally from three
  source-matching staged UI files. Its retained development stage is
  `D:\acw\acw-QK6Kjd`; the candidate is
  `D:\ARE_Companion_Evolution_a11y_20261002_x64-setup.exe`
  (33,824,466 bytes; SHA-256
  `79bb3bb1bb9029edded80a1a4a516d9ec156b6916147ddc8b92d4e4799fbf0fb`).
  The earlier narrow-layout installer remains distinct and unchanged.
- The staged resources pass the 13-check native Windows feature probe. The
  staged executable passes separate registry-only and disposable one-cycle
  ledger WebView2 journeys: nonblank orb/dashboard, all seven panels,
  semantic-heading source order, 340 × 740 first-view content, no horizontal
  overflow, keyboard heading focus, and independent Evidence links. The
  native captures at
  `D:\acw\are-evolution-registry-a11y-20261002.png` and
  `D:\acw\are-evolution-verified-a11y-20261002.png` were visually inspected.

These checks establish programmatic heading roles in Edge and heading
elements in WebView2. They are not a human NVDA/VoiceOver/Orca traversal,
speech-output or focus-order assessment. The NSIS archive was not extracted or
installed. No live Evolution worker, installed Companion lifecycle or control
of this Codex task was tested.

The later [native narrow Linux follow-up](LINUX-NARROW-EVOLUTION-2026-10-02.md)
built a separate uninstalled package after lowering the real dashboard minimum
width. Its 340 × 740 WebKitGTK registry-only and verified-ledger journeys pass
and have native pixel captures. This does not change the Windows candidate
identified above or close the human screen-reader question.
The [later Windows actual-window check](WINDOWS-ACTUAL-NARROW-EVOLUTION-2026-10-02.md)
rebuilds that narrower source into a distinct unsigned candidate and verifies
the Win32 minimum tracking width as well as the actual WebView2 viewport.
Registry-only and verified-ledger first views and semantic heading order pass
without device-metrics emulation; human assistive-technology validation is
still separate.

## Open Questions

- Can a screen-reader user navigate from the missing-root explanation to the
  first definition, and from verified ledger status to the first cycle,
  without repeated status announcements? Test on actual assistive technology.
- Does the same heading hierarchy remain usable through actual Orca or other
  assistive-technology speech and focus traversal? Native WebKitGTK geometry,
  DOM order and pixels now pass, but no screen reader was exercised.
