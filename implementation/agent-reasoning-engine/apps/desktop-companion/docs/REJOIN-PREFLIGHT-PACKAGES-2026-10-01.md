# Rejoin preflight Companion candidates — 2026-10-01

Status: unsigned development packages; neither installed nor released.
TUI is discontinued and outside these candidates. Authority effect: none.

## Change and boundary

The hosted client exposes an authenticated `GET /api/threads/:id/rejoin-check`
that uses the same recovery, hosted-effect binding, and owned-runtime proof as
`POST /api/threads/resume`. The POST rechecks immediately before native resume.
The browser checks on load, displays a refusal or an explicit Rejoin requirement,
and disables Send until a recovered thread is rejoined. A persisted accepted
turn cannot reach a new hosted turn or compaction before verified Rejoin;
same-key accepted-receipt replay still does not redispatch. A mismatched native
resume identity is refused. This controls only client-owned hosted threads,
not an existing Codex desktop task.

## Exact packages

- Linux: [`are-companion_0.1.0_amd64-rejoin-20261001.deb`](../dist/are-companion_0.1.0_amd64-rejoin-20261001.deb),
  45,797,344 bytes; SHA-256
  `ffc2f0f7be7c04123d0d01743c23d6e64a3bad412e863c7944d61ec2b4af4967`.
  The existing Ubuntu 26.04 builder produced an 813-file development ARE
  closure, digest `18c0bd1f909ce1a0249a225eab227cac79f47b456758792ca962da9ff32c745b`,
  with bundled Node 26.8.1 and candidate native orb. Extracted without
  installing to `/var/tmp/are-rejoin-linux-PWOO77`.
- Windows: `D:\are-win-focus-YDTVzk\ARE_Companion_rejoin_preflight_20261001_x64-setup.exe`,
  33,757,269 bytes; SHA-256
  `5728cb595912e17c165c91bfd5d8143f4fcdd3bb7cc9d7391deb80dde889c07c`.
  The native Windows builder retained stage `D:\are-win-focus-YDTVzk\acw-4T7mpV`;
  its 813-file ARE closure digest is
  `ce174d227e98e72d4fadc13f7e2fc1089f281098f080457c2126de25bf055cfa`.
  The installer is an unsigned NSIS self-extracting PE. The staged executable
  SHA-256 is `1437a4db671092fe5a4f86398c369304b6a8ccfe69581af5b3eb562ec4259ae6`.
  Independent 7-Zip archive testing passed for all 824 entries. Extraction,
  not installation, produced `D:\are-win-focus-YDTVzk\extract-rejoin-AwNznB`;
  its NSIS-patched executable SHA-256 is
  `f40e189911148cd4cb782c6eed34e7efa1296c54496c0faf51cffbaa41b9f236`.
- On both platforms, the bundled hosted client host, browser script, and HTML
  match the checkout hashes, respectively
  `cbc66a826538a9c5ad542b79d43492ff54c51b9383e23f5b5d1979c1b5fe576a`,
  `62bf9910ef39d410687143240ca41022107e55b80923360843faf0d17dfd3d12`,
  and `986b03f29cfa2cd418f693f3f5e7c58661da46d34af9408312540a6494231061`.
  These equal file hashes do not imply equal platform closure digests.

## Verification

- Wrapper source suite: 702 tests, 681 passed, 21 platform/fixture skips, zero
  failures. Focused hosted-client host suite: 82 passed. Native Windows Edge
  rendered-browser suite: 14 passed, including failed and passing-on-read
  recovered-thread preflight states.
- From the archive-extracted Windows payload itself, bundled Node ran the
  hosted-client host suite with 81 passes, one platform-specific skip, and no
  failures. The extracted browser assets passed the 14-test native Edge suite.
- Companion dashboard source suite: 50 passed, including Threads Reasoning State,
  Evolution, and source-separated adapter status.
- Extracted Linux package: bundled `are doctor --json` reported product status
  `PASS` and exact Node 26.8.1; its bundled hosted-client host suite passed
  82/82 tests. The three changed hosted-client files matched
  source hashes. In a disposable network-disabled Ubuntu/WSLg X11 container,
  WebKitGTK inspection verified dashboard-only and default second-launch
  dashboard activation: Tauri bridge, all seven panels, product diagnostic,
  and no orb WebView. This inspector run did not verify native-orb pixels or
  physical pointer input. No TUI path was present in its ARE tree.
- Native Windows extracted installer executable: dashboard-only WebView2 smoke showed
  all seven panels and a passing bundled product diagnostic, with no orb WebView.
  The full WebView2 UI smoke rendered the floating orb, opened a nonblank
  dashboard, exercised all seven panels, placement, skin persistence, source
  explanation links, and keyboard/contrast accommodations. The test-owned
  executable was absent from the process list afterward.
- The archive-extracted Windows executable, adjacent Node/ARE resources, and
  pinned `codex-cli 0.155.0-alpha.16.4` passed a disposable fixed-loopback
  interrupted-Plan gateway-crash/relaunch canary: the same hosted thread was
  retained, unsafe Rejoin was refused, no completed frontier was fabricated,
  and there were zero replay and external model requests. A separate completed
  text-turn crash/relaunch canary returned the same thread, one completed
  message, and the same Companion frontier, again without replay or external
  model requests. Both launched the native orb and seven-panel dashboard. A
  final exact-path process query found no package-owned Node or Companion
  process left running.

## Claim ceiling

This is source-matched development packaging and bounded UI/recovery evidence.
The Windows smoke tested the archive-extracted executable, not an installed
NSIS lifecycle; the Linux package was extracted and exercised through a test-only
WebKitGTK inspector, not installed or physically driven. The Linux package was
not put through a joined interrupted-turn crash canary. Neither package had a
normal-provider run. The Windows canaries are fixed-loopback fixture evidence,
not resolution of an unknown effect outcome. A product diagnostic
PASS does not establish service readiness, safe in-flight effect recovery, or
exclusive writer control of this desktop task.

## Post-package source verification

After these package bytes were built, the extracted Linux payload's bundled
Node and ARE wrapper ran two isolated, fixed-loopback managed canaries with the
pinned `codex-cli 0.155.0-alpha.16.4` binary. The hosted crash/restart canary
passed and resumed its owned session. The hosted in-flight effect crash canary
passed by retaining the durable intent and refusing unsafe resume with
`windows-client.hosted-effect-resume-rebind-unverified`; it did not establish
the effect's external outcome. Both reported zero external model calls and no
contact with the current desktop task. The canary labels its runtime origin
`source-checkout` when its Windows-only package-origin flag is absent; the
invoked Node and script paths were inside the extracted Linux package, while
the pinned Codex binary remained an external host prerequisite.

A further source change requires verified Rejoin before a recovered
accepted-turn thread can submit, dismiss, or apply feedback. It is not in the
Linux or Windows package hashes above. The focused host suite passed 83/83;
the full wrapper suite passed 682 tests with 21 skips and no failures.

## Linux feedback-guard successor

The feedback guard above is included in the newer, unsigned
[`are-companion_0.1.0_amd64-rejoin-feedback-20261001.deb`](../dist/are-companion_0.1.0_amd64-rejoin-feedback-20261001.deb)
(45,782,454 bytes; SHA-256
`709a2e283bb7f4994d599a6433a5585fe992e7a8d257ba151c3d0a723424ac2d`).
It was built offline in the existing Ubuntu 26.04 builder, not installed, and
extracted to `/var/tmp/are-rejoin-feedback-linux-wRqDwF`. Its 813-file
development closure digest is
`c0873b7dbfbba1ce5ca1c4dd22959534d72da8398cc6b924d56ef423779e7e6d`.
The bundled host source matches the checkout SHA-256
`92df12c7c298a3eaa4443df65cdfe6558af8c00818f914236b96703b2612edf6`.
Bundled Node 26.8.1 passed the product diagnostic and all 83 focused host
tests. Both extracted-package managed crash/restart canaries passed with the
pinned Codex binary and fixed loopback fixture: ordinary restart resumed;
unsettled in-flight effect recovery refused unsafe resume. Both reported zero
external model calls and no current desktop task contact. The canary's
`source-checkout` origin label is its generic Linux path label, not proof that
the repository copy of the script was invoked. This newer `.deb` has not had a
new Companion-joined GUI or installed-lifecycle check. The independently built
Windows successor is recorded below.

## Windows feedback-guard successor

The matching unsigned native Windows installer is
`D:\are-win-focus-YDTVzk\ARE_Companion_rejoin_feedback_20261001_x64-setup.exe`
(33,771,451 bytes; SHA-256
`dfbc19c6b76f8014320294466b13fd01a8a414343c3af2ca6c72bd06d0c12470`).
It was built with Node 26.8.1 and the existing pinned Windows Rust/MSVC
toolchain; the builder reported an 813-file development closure digest
`581e645aea7e7d9217a49e399dc85b79899df0f2a003198ba580995c966add25`.
7-Zip 26.00 verified all 824 archive entries. Extraction, not installation,
produced `D:\are-win-focus-YDTVzk\extract-feedback-nPFPA9`. Its bundled host
source matches the checkout and the Linux successor at SHA-256
`92df12c7c298a3eaa4443df65cdfe6558af8c00818f914236b96703b2612edf6`.
The extracted executable SHA-256 is
`5dfe2ce7f479eb17e9bc498ab253f29ba6ad005b1ece1ff56190974a2ae61399`.
The extracted Node/ARE product diagnostic passed; the focused host suite
passed 82 tests with one platform skip. Native WebView2 dashboard-only and
full floating-orb smoke both passed: nonblank seven-panel dashboard,
skin/placement persistence, source-aware diagnostics, and keyboard/contrast
checks. No exact-path package-owned process remained afterward. The separate
Playwright browser suite was not configured for this extraction and skipped
14/14; the previous package's 14/14 Edge result does not automatically
transfer. No Windows gateway-crash/relaunch canary was run on this successor,
and it remains uninstalled and unreleased.

## Zero-turn recovery source successor

After both feedback-guard packages were built, source now requires verified
Rejoin before a recovered zero-turn thread can start a new turn, compact, or
mutate feedback. A persisted v1 pending turn keeps only its exact thread/key/text
retry before Rejoin; after that retry is accepted, a different turn is blocked
again. Read-only recovery checks and same-key accepted-receipt replay remain
available. A distinct `windows-client.zero-turn-rejoin-unverified` refusal
explains that ARE has no accepted turn receipt but cannot verify first-turn
state. The hosted browser keeps Send disabled and offers the existing New
thread control as a separate path that neither resumes nor deletes the old
thread. Interrupt remains an exact active-turn safety action, and recovery
confirmation remains a reconciliation action, not new model work.

The source host SHA-256 is now
`063f4c320c777d9d8fbbae70d0a9fed9514c4d307fd6b094be892090c19b2ed9`;
the browser script SHA-256 is
`779fdf054ba26ff99bcc15cf59f3aa07e454cb3f2f3e1c6e4b3e4ec69ef7daed`.
The focused host suite passed 84/84, the wrapper suite passed 683 with 21
skips and no failures, and native Windows Edge rendered-browser tests passed
14/14. An isolated pinned-Codex zero-turn history canary failed its empty
history assertion: native `thread/read` did not yield verified empty turns,
while `thread/turns/list` and `thread/items/list` were unsupported. It made
zero provider requests. Source inspection confirms the gateway's
`first-turn-ready` proof is restricted to its fresh process-local creation
record and first connection; it does not survive a gateway reconnect. Thus
these tests prove safe refusal and a separate continuation path, not recovery
of that original zero-turn thread. Neither package above contains this source
successor; the matching successor packages and their separate checks are below.

## Linux zero-turn successor

The unsigned, uninstalled
[`are-companion_0.1.0_amd64-zero-turn-20261001.deb`](../dist/are-companion_0.1.0_amd64-zero-turn-20261001.deb)
is 45,785,432 bytes (SHA-256
`082b56a66cad536e0c222637fb25c2e8b4679a1657be51c717210ce5d4139d1f`).
Its build reported 813 development files and closure digest
`a230cdc0be0cc8ecd8a8065f94d1ef7a47ee8d2dbf5fea8860c71da334d38ffb`.
It was extracted, not installed, at `/var/tmp/are-zero-turn-linux-YACUWH`.
The extracted host and browser scripts match the source hashes above. Bundled
Node 26.8.1 passed `are doctor --json` and all 84 focused host tests. Both
fixed-loopback managed crash/restart canaries passed: a completed owned turn
resumed, while an unsettled in-flight effect refused unsafe resume. They made
zero external model calls and did not contact the current desktop task.

Two package-adjacent Companion-joined WebKitGTK checks also passed in a
network-disabled Ubuntu container on the WSLg X11 display. Ordinary and
opt-in guarded-Plan modes each rendered the native orb and seven-panel
dashboard, showed one running gateway, ready backend, and connected hosted
client, passed the bundled product diagnostic, and supervised unexpected
Companion exit. Both made zero model calls and reported
`current_desktop_task_control: false`. These are extracted-package UI checks,
not a Linux installed-lifecycle or physical-pointer acceptance test.

## Windows zero-turn successor

The matching unsigned, uninstalled NSIS installer is
`D:\are-win-focus-YDTVzk\ARE_Companion_zero_turn_20261001_x64-setup.exe`
(33,767,120 bytes; SHA-256
`5a1a70cd679bef519152c45cc38fcbafbbfcce2f26aef7d3a8694e6d19fb9055`).
The native Windows build used Node 26.8.1, bundled the native Win32 orb, and
reported 813 development files with closure digest
`2965b1c8f54fd8c1f68f8f800f3b1825e3715c89984976a79088cee214a30ade`.
7-Zip 26.00 verified all 824 archive entries. It was extracted, not installed,
to `D:\are-win-focus-YDTVzk\extract-zero-turn-rxBgTc`. The extracted host and
browser scripts match the source hashes above; the extracted executable hash
is `8bf8568443e2806c3158035ef584e85a0e62df9c1596f8d17f42b28bdb93411c`.
Bundled Node passed `are doctor --json` and the focused host suite (83 passed,
one platform skip). Native WebView2 dashboard-only and full floating-orb
checks passed, including nonblank seven-panel navigation, source-aware
diagnostics, skin/placement persistence, and keyboard/contrast checks.
The extracted payload's hosted-browser suite passed 14/14 in native Windows
Edge, including the distinct zero-turn Rejoin refusal and separate New thread
path.

With pinned Windows Codex `0.155.0-alpha.16.4` (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`),
two extracted-package Companion-joined fixed-loopback crash/relaunch checks
passed. A completed guarded text turn reopened the same owned thread and
frontier without replaying the model request. An interrupted guarded Plan
question retained its unsettled state and refused resume without fabricating
a completed frontier. Each made one local fixture-provider request, zero
external model calls, and reported `current_desktop_task_control: false`.
No process owned by the extraction path remained afterward. Neither check
tests an installed NSIS lifecycle or live provider.

## Existing desktop task boundary

Official [Codex App Server documentation](https://learn.chatgpt.com/docs/app-server)
documents `thread/resume` for appending turns to a stored thread and
`thread/read` for read-only history. It does not establish an exclusive writer
release/lease from an already-running desktop host to another app-server
process. The available desktop task-handoff operation moves a task between
execution environments; it is not evidence of writer transfer to ARE. This
last sentence is an inference from the documented API and currently exposed
host operations, not proof that no future host integration can provide it.
Therefore neither successor package is activated as controller of this chat.

## Threads UI-scope successor

After the zero-turn package checks, the Companion Threads panel gained a
visible source boundary: gateway backend Reasoning State does not establish
the hosted client's restart/Rejoin eligibility, authorize Send, or prove
control of this desktop chat. This is a read-only clarification, not a new
Rejoin endpoint or host-task binding. The Threads UX brief records the same
claim ceiling. Source dashboard tests passed 51/51; the native Windows Edge
navigation journey passed with the new wording visible and no uncaught errors.

The latest unsigned, uninstalled Linux package is
[`are-companion_0.1.0_amd64-ui-scope-20261001.deb`](../dist/are-companion_0.1.0_amd64-ui-scope-20261001.deb)
(45,793,616 bytes; SHA-256
`2eb94de5a03ea9e0f46c2fef1b8ad966206abf33d8f54c431712068a6bf84093`).
Its 813-file development closure digest remains
`a230cdc0be0cc8ecd8a8065f94d1ef7a47ee8d2dbf5fea8860c71da334d38ffb`.
It was extracted at `/var/tmp/are-ui-scope-linux-WOjie6`; bundled Node
26.8.1 passed the product diagnostic and all 84 focused host tests.
Package-adjacent WebKitGTK managed checks passed in ordinary and guarded-Plan
modes. The inspector verified the new Threads wording in the rendered
packaged dashboard, along with native orb, seven panels, connected gateway
path, product diagnostic, and supervised Companion exit. Both made zero model
calls and reported no control of this desktop task.

The matching unsigned, uninstalled Windows NSIS installer is
`D:\are-win-focus-YDTVzk\ARE_Companion_ui_scope_20261001_x64-setup.exe`
(33,764,539 bytes; SHA-256
`8e85fb75166590e93066e57d6894f6a7a055a5d19881a7a67a5de1797705eef6`).
Its 813-file development closure digest remains
`2965b1c8f54fd8c1f68f8f800f3b1825e3715c89984976a79088cee214a30ade`.
7-Zip verified all 824 archive entries. It was extracted at
`D:\are-win-focus-YDTVzk\extract-ui-scope-pFEYx1`; the extracted executable
SHA-256 is
`82701efd2c992554d34eb0bb1be14ce7609b36f97c2b2adf712578fcf31db3d9`.
The extracted host and browser scripts match the zero-turn source hashes above.
Bundled Node passed the product diagnostic, 83 focused host tests with one
platform skip, and the hosted browser suite 14/14 in native Edge. Native
WebView2 full UI smoke passed with the new Threads wording visible, nonblank
seven-panel dashboard, orb, appearance persistence, and keyboard/contrast
checks. Two extracted-package fixed-loopback Companion-joined crash/relaunch
checks passed: a completed turn resumed without replay, and an in-flight
guarded Plan question refused unsafe resume without inventing a completed
frontier. Each made one local fixture-provider request, zero external model
calls, and reported `current_desktop_task_control: false`. No process owned by
the extraction path remained. The package has not been installed or released.

## Open Questions

- Run native Linux physical-pointer and visible-pixel acceptance checks and
  verify Linux and Windows installed lifecycle separately on the UI-scope
  successors. The extracted-package UI checks do not prove these boundaries.
- Decide whether a durable, independently verifiable zero-turn proof can be
  constructed for a restarted gateway and installed Codex host. Until then,
  preserve fail-closed refusal and the explicit separate-new-thread path.
- Reconcile unknown in-flight effect outcomes and prove the remaining
  recovered-thread mutation routes and zero-turn retry rules without breaking
  existing same-key recovery.
- Extend zero-turn recovery verification to a real restarted gateway only if
  independently verifiable first-turn evidence becomes available; the current
  safe refusal is not original-thread restoration.
- Obtain a supported exclusive desktop writer handover and current-task ingress
  proof before any claim that ARE controls this Codex conversation.
