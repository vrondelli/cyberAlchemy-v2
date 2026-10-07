# Evolution registry-only first view — 2026-10-02

Status: source and staged native UI construction evidence. Authority effect:
none. The installer is unsigned and uninstalled.
Parent outcome: [whole Companion UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md),
Evolution feature 05; the experience contract is in [the UX brief](ux/EVOLUTION.md).

## Change

The registry-only page now replaces two unavailable ledger metric cards with
one compact, source-scoped line: registry-definition count, absence of a
configured runtime root, and unavailable cycle/commit counts. This brings
the useful definition list higher in the first viewport. A verified ledger
still displays its three evidence metrics; neither mode claims a live worker.

## Verification and ceiling

- Source dashboard tests pass 56/56, including the registry-only/verified
  visibility switch.
- The fixture-backed Chromium seven-page journey passes. At 1200 × 850, it
  verifies that hiding unavailable metrics moves the definition card upward
  by more than 100 px and keeps it in the first viewport, while a verified
  ledger restores the metric cards.
- The retained native Windows stage was updated only in its three UI source
  files, which now match the worktree byte-for-byte. An incremental Tauri build
  produced an unsigned NSIS installer at
  `D:\areu-m6z2oO\ARE_Companion_Evolution_compact_20261002_x64-setup.exe`
  (33,818,798 bytes; SHA-256
  `2599fcc067bc424e48a5d4d592eec92a1470309c8c0c076a0a782e5b3c0a81ca`).
  The earlier [definition-clarity installer](EVOLUTION-DEFINITION-CLARITY-2026-10-02.md)
  remains separately retained and unchanged.
- The staged Windows feature probe passed 13 checks, including exact bundled
  Node, product health, routing/context, Reasoning State, thread/decision
  clients, and Evolution SQLite write/read/reopen. Core closure digest:
  `6728c966ed0f5419931ca4b3e693336d929ddafb84c81b542121b04a0cb4c43d`.
- Native WebView2 passed the orb and seven-panel registry-only journey,
  including the compact summary and hidden unavailable metrics. A separate
  journey against an isolated verified one-cycle ledger passed restored
  metrics, cycle-first order, and bounded event progression. A screenshot of
  the new registry-only first view is retained at
  `D:\areu-m6z2oO\evolution-compact.png`; visual inspection shows two full
  definitions and the beginning of a third within the first viewport.
- An offline build in the existing Linux builder produced the unsigned,
  uninstalled [compact Linux package](../dist/are-companion_0.1.0_amd64-evolution-compact-20261002.deb)
  (45,847,572 bytes; SHA-256
  `1b24c1b91c58a830aa0be8314c5165893d61d6aae249f0d1686afb769cbe373b`;
  838-file development closure digest
  `45a0a9e8e17b520741c3856cb1f5a11e574eab30bc02cb0e4bf5a032d424b879`).
  Its uninstalled extraction passed bundled `are doctor --json` with exact
  Node 26.8.1. The native-orb executable is byte-identical to the previously
  tested Linux candidate (`e28316906476fddf5f8d567293fa2596924117dfdf1dc2b61fe8c2f2b9048560`).
- WebKitGTK on WSLg/X11 passed an extracted-package dashboard-only inspection
  in a network-disabled container: Tauri bridge, seven panels, bundled ARE
  diagnostic, independent candidate inbox, registry-first order, hidden
  unavailable metric cards, and the compact five-definition summary. A second
  inspection with an isolated one-cycle fixture passed the verified-ledger
  state: one cycle, one commit, restored metrics, and cycle-first order.
  The Linux inspector now asserts both layouts explicitly. These are renderer
  and DOM-state checks, not a Linux screenshot, physical-pointer test, normal
  installed desktop test, or worker-liveness proof.

The NSIS archive was built and identified as a Windows installer, but was not
extracted or installed in this slice. Native Windows checks used the matching
staged executable and adjacent resources. The Linux package was extracted but
not installed. Neither check proves installed lifecycle, screen-reader
experience, live worker state, or control of this Codex task.

## Narrow-window source follow-up

A later source-only pass inspected the Evolution journey in rendered Chromium
at 320, 340, 500, 740, 900, and 1200 px. At 320–340 px, the title now stays
on two lines and the verified evidence metrics become compact, fully labelled
rows. Registry-only mode hides its redundant durable-evidence line and uses a
shorter admission disclaimer, bringing the first actual definition into a
740 px-high viewport (top: 665 px at 320 px width; 651 px at 340 px). When
verified cycles exist, they now precede metrics and definitions; the first
recorded cycle also enters that first viewport. No horizontal page overflow was
observed at any sampled width. The cycle filter retains a visible keyboard
focus ring, and filtering remains limited to the bounded visible rows.

The [registry-only 340 px capture](../../../../../output/playwright/evolution-registry-340-20261002.png)
and [verified-ledger 340 px capture](../../../../../output/playwright/evolution-verified-340-20261002.png)
are fixture-backed browser pixels, not native WebView2 or WebKitGTK screenshots.
Source UI tests pass 56/56 and the full rendered navigation journey passes
135 checks with no uncaught page errors. This follow-up changed UI source
before packaging; the Windows installer and earlier Linux package named above
predate these narrow-window edits and must not be described as containing them.

## New uninstalled Linux candidate

The current narrow-window source was then built offline in the existing
Ubuntu 26.04 builder image, with Node 26.8.1 and the repository-locked Rust
toolchain. The unsigned, uninstalled
[Linux package](../dist/are-companion_0.1.0_amd64-evolution-narrow-20261002.deb)
is 45,840,304 bytes (SHA-256
`95ad035cd563156af67c3239740ded3af3a2d3a8b257a76e478c4186b25ec2b1`).
The builder reported an 839-file development distribution digest of
`925cd2fe2c6fe681de67757d62331e9fe14f77e454b3a6bd475e126189e27b7e`.
Its uninstalled extraction passed bundled `are doctor --json`: product
`PASS`, version `0.10.0-rc.1`, exact Node 26.8.1, and no TUI path in the
distribution. A network-disabled WebKitGTK container loaded this exact
extracted dashboard with a Tauri bridge, all seven panels, passing bundled
diagnostic, and registry-only Evolution layout. That is a native renderer
check at the package's normal window size, not a 320–340 px native visual
review, installed lifecycle test, or desktop-task handover proof. The
temporary extraction and test container were removed after verification;
the package and browser captures remain. No Windows package was rebuilt for
this follow-up.

## Bounded task-session handoff

- Task: validate the compact registry-only Evolution state in a native Windows
  development package, without changing ARE runtime or host integration.
- Context: this document's prior source-only gap, the whole-UI parent plan,
  the Evolution UX brief, the three UI files, the retained stage, and the
  native test helper covered the write and validation obligations. No runtime
  delegation or fallback route was used.
- Decision: reuse the isolated retained stage and rebuild Tauri/NSIS
  incrementally; preserve the earlier external installer. The only staged UI
  differences were the three compact-layout edits.
- Gate: candidate construction only. No installation, admission, release,
  deployment, or host-task takeover was attempted.
- Validation: source UI 56/56, Core product 11/11, Chromium journey PASS,
  staged native feature probe PASS, and both staged WebView2 Evolution
  journeys PASS. The separate Linux parity slice passed its offline package
  build, bundled doctor, and both WSLg/WebKitGTK Evolution layouts. A full
  `/tmp` filesystem interrupted its first extraction; only that incomplete
  task-created extraction was removed, and the exact package was re-extracted
  under a new user cache directory. Reusable-sigil experiment harness: not
  applicable.

## Narrow-window native Windows follow-up

The current 340 px Evolution source was packaged in a fresh, unsigned and
uninstalled Windows development build, not copied into an earlier installer.
The build used stage `D:\acw\acw-QK6Kjd`; that stage was later updated for
the [semantic-navigation candidate](EVOLUTION-SEMANTIC-NAVIGATION-2026-10-02.md),
but this NSIS output remains separate and unchanged. The narrow candidate is
`D:\ARE_Companion_Evolution_narrow_20261002_x64-setup.exe` (33,827,930 bytes;
SHA-256 `d5ef65076b160995a9d12cf3e5ad9340bd01f0dd2ab61dd0bc432e87f48ad43b`).
The builder reported an 839-file closure digest of
`c289d7a419f51f6f8ef9fecc3148c6ec521d5ecd550c5dbcd8374579833bdd5b`
and Core digest
`2d7ff4ed56d5ff108276fecedbfa1db364b78f29e02755c91b3bce25ffdb6f63`.
The staged CSS, JavaScript and HTML hashes match the current worktree.

The staged resource feature probe passed all 13 checks, including exact Node
26.8.1, product health, route/context, Reasoning State imports and native
Evolution SQLite write/read/reopen. Two independent staged-executable WebView2
journeys passed the orb, nonblank dashboard, all seven panels, source-aware
evidence links, keyboard heading focus, preferences and Evolution:

- Registry-only mode hid unavailable metrics and its redundant evidence line,
  exposed the first candidate definition in the 340 × 740 first view, kept the
  two-line title, and did not overflow the document horizontally.
- An isolated native-created one-cycle ledger restored verified metrics and
  showed its recorded cycle before metrics and definitions in the same narrow
  first view, without presenting the record as worker liveness.

The native WebView2 captures are retained at
`D:\acw\are-evolution-registry-narrow-20261002.png` and
`D:\acw\are-evolution-verified-narrow-20261002.png`. Both were visually
inspected. The test harness now exposes `--evolution-narrow` so the geometry
checks can be repeated against the staged executable. This validates a
development executable and matching staged resources, not installer
extraction/installation, normal pointer input, screen-reader traversal, or
control of the current Codex task.

## Open Questions

- Does the updated narrow-window source remain legible in a 340 px native
  WebKitGTK window? Narrow WebView2 pixels now pass, but WebKitGTK was checked
  only at its normal window size.
- Can a screen-reader user reach the definition list with fewer unhelpful
  unavailable values while still finding the missing-root explanation?
