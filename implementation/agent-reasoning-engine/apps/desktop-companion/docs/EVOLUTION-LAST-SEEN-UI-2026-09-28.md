# Evolution verified-ledger last-seen UI — 2026-09-28

Status: bounded Companion development evidence. This is not an installed-app,
release, active-worker, or desktop-task-control result. TUI is discontinued.

## Change and source boundary

The Evolution page now retains a previously verified, bounded ledger projection
when a later read fails, reports unavailable, or its ten-second freshness window expires. A visible
last-verified time and “not current” warning precede the definitions, counts,
and cycle event types. Refresh shows that warning while the new read is
pending, then removes it only after a fresh verified result. Incompatible and
never-verified data remain hidden. The separate gateway candidate inbox keeps
its own availability and freshness posture.

The observer no longer treats an unreadable existing root or ledger directory
as a verified empty ledger. It distinguishes a genuinely absent root from
permission denial before optional-file checks; denied reads return
`evidence_status: unavailable` without leaking the root path.

This is read-only presentation of the already projected fields. It adds no
filesystem read, cycle activation, model call, or host-task handover.

## Verification

- The dashboard source suite passed 36/36. Focused Linux durable-kernel tests
  passed 20/20 with two Windows skips; native Windows tests passed 21/21 with
  one POSIX permission test skipped. JavaScript syntax checks passed.
- The existing isolated Windows Chrome/Playwright browser journey passed with
  zero uncaught errors. New checks cover verified event history, read failure,
  source-reported unavailability, fresh recovery, incompatible projection,
  independent candidate-inbox failure, and expiry. The unavailable and expired
  cases retain the eight bounded event types under an explicit historical
  warning; incompatible data is hidden.
- A fresh unsigned Ubuntu 26.04 x86-64 development package was built from
  these source bytes without network or host installation:
  [`are-companion_0.1.0_amd64-evolution-source-guard-20260928.deb`](../dist/are-companion_0.1.0_amd64-evolution-source-guard-20260928.deb),
  SHA-256 `9cfd7c04d77d6a5970ce17c363ceabf81ae015f5552ff40fe3e23a529c36e7bd`.
  Its 764-file development ARE closure has digest
  `afad6c076cbf744cedca7cc9579b2518de76b3c164b73d8493da5166bf2a6c88`.
  The extracted bundled Node 26.8.1 returned ARE product-health `PASS` with
  no reason codes; package metadata declares GTK 3 and WebKitGTK 4.1 system
  dependencies. Product health is not gateway, Evolution, or UI readiness.
- In a disposable network-disabled Ubuntu 26.04 container using WSLg/X11,
  the extracted WebKitGTK app passed the default seven-panel/skin smoke and a
  separate test-only ledger journey: one verified fixture cycle appeared;
  denying its root produced `Unavailable` while retaining the dated cycle;
  restoring access and reopening Evolution removed the warning after a fresh
  verified read. The package was not installed and no external model call was
  made.
- A matching unsigned Windows NSIS development installer was built from the
  same current source:
  [`ARE_Companion_0.1.0_x64-setup-evolution-source-guard-20260928.exe`](../dist/ARE_Companion_0.1.0_x64-setup-evolution-source-guard-20260928.exe),
  SHA-256 `16932cdb384cdbe2a2a79d7f5ebe31e46ec5ebf29b86d6589debcb95aacf0366`.
  Its 764-file development closure has digest
  `c1261dec5d931ebcfbfc92d2ebbd8c1de1cf505abc0a1bdb857daf968c487783`.
  The temporary staged executable passed the bundled-feature probe, a native
  WebView2 unconfigured seven-page journey, and a separate native-created
  one-cycle Evolution journey. The setup executable was not installed; the
  WebView2 runs did not induce a native Windows ledger permission failure.
- The broader Evolution runtime suite is **not green**: 185 passed, eight
  failed, two skipped. All eight failures belong to the H-EN benchmark tests;
  their manifest expects the workflow file at 14,171 bytes with SHA-256
  `70969412004d3439ce354b83d5181d7aa2a083c5710a91b4048945cfa6904fe4`,
  while the present file is 16,803 bytes with SHA-256
  `5fd348742da5168a48a8f9bdc7e0c8da0ccbd402d2103f6d63b66776247b2145`.
  This source-drift gate was not modified or bypassed for the UI task.

## Limits and open questions

- The exact Linux package was rendered under WSLg/WebKitGTK, and the Windows
  build was rendered from its temporary stage. Neither package was installed.
  The Chrome fixture, WSLg inspector, and staged WebView2 journeys do not prove
  physical pointer behavior, normal Linux compositor, installed-app access
  control, screen-reader, or package-lifecycle behavior.
- Historical counts remain visible by design but supply no current cycle or
  worker state. Real worker liveness, objective-level detail, evidence links,
  and privacy review remain separate tasks.
- The selected Linux/Windows release matrix and numerical idle-resource budget
  remain unset. None of this activates the current Codex desktop task.

## Browser projection-contract follow-up — 2026-09-28

The Companion browser now checks the native Evolution bridge's root/evidence
status vocabulary, bounded definition and cycle fields, safe counts, and cycle
truncation relation before displaying a reading. A non-verified ledger reading
does not display cycle rows or commit/cycle counts, even if contradictory rows
are supplied. This is a presentation guard, not a second ledger verifier;
durable verification still belongs to the source observer and native bridge.

The source dashboard suite passed 37/37 tests. The isolated Chromium
seven-page journey passed with no uncaught errors, including newly added
negative cases for a cycle count below its rows and a corrupt status carrying
cycle rows. No installer was rebuilt or installed for this follow-up. The TUI
remains discontinued, and this change supplies no desktop-task handover.

## Native Windows denied-record follow-up — 2026-09-28

The first staged WebView2 denial journey exposed a source bug: denying read
access to one durable commit record caused the Evolution observer to report
`corrupt`, even though the record had not changed. Verification had converted
the filesystem `EACCES`/`EPERM` failure into an integrity reason before the
read-only observation boundary could distinguish source unavailability.
The observer now keeps permission and resource-read failures separate from
integrity failures. A denied record yields `root_status: unknown` and
`evidence_status: unavailable`; genuinely corrupt evidence still fails closed
as `corrupt`. No path or record content is included in the public result.

The Windows UI harness copies a verified one-cycle fixture into its own
temporary profile before changing any ACL. It denies read access to the
copied commit record, verifies the bundled native Node observer returns
`unavailable`, refreshes the staged WebView2 Evolution page, and checks that
the prior cycle and counts remain visible only under a dated historical
warning. After restoring that exact ACL, the same window returns to
`Verified ledger` and removes the warning. The source fixture is never
changed. The first run failed on the misclassification; the rebuilt run
passed all three new native checks plus the existing seven-panel journey.

The source-focused Evolution suite passed 20/20 on Linux with two
Windows-specific skips, including the new denied-commit regression and the
existing corrupt-evidence test. The dashboard suite passed 38/38. The rebuilt
stage's bundled-feature probe passed all 11 checks, including native Windows
SQLite write/reopen. The unsigned NSIS candidate at
`D:\are-evolution-denial-644j8I\ARE_Companion_denied_20260928.exe` has
SHA-256 `88d0fa3184872613e7d5ba116f9dff8f23b7c8aee977f960758b9092e60d6dd6`;
its development closure contains 764 files with digest
`f84ebdd3025f5d14cc8cafdea56f570b49ee4b8120632b13ee34778125be5a88`.
The retained stage was moved to D: after testing, with executable SHA-256
`ef959185fb544a35753deb310adae61c100cbf13fe8227bced431a020f3c153e`.
The relocated stage passed the same native WebView2 journey again. A broader
shared Evolution verifier/protocol/coordination/SQLite regression pass then
passed 41/43 with only two Linux-inapplicable Windows tests skipped.

This validates a staged read-only Windows denial/recovery path, not installer
installation, archive integrity, a live Evolution worker, physical power-loss,
or control of this desktop task. The installer was not run. An installed-app
permission and package-lifecycle test remains open.
