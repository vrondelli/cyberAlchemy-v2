# Windows active-slice observation — 2026-09-28

Status: bounded development evidence; authority effect: none. TUI is
discontinued and outside this implementation. The unsigned installer was built
but not installed, and this Codex desktop task was not activated under ARE.

## Change and boundary

The Threads card now shows the one-based ordinal and status (`open`, `active`,
or `deferred`) of the active slice from a digest-verified Reasoning State
plan-context record. The gateway projects only these two content-free fields;
it still excludes raw slice IDs, obligation summaries, decision questions,
source paths, and hidden model reasoning. The view covers only backend threads
owned by the observed gateway process, not host tasks generally.

Adding the fields made a full 32-row observation about 34 KiB. The previous
32 KiB limits in the observation client and Rust bridge caused the native
40-thread journey to show `Unavailable`. Both limits are now 64 KiB, within
the client's existing bounded maximum. The paging test now constructs a
response above 32 KiB and proves the default client reads it. The native UI
harness now includes the current Threads posture in failure reports.

## Exact tested build

- Unsigned NSIS installer:
  `D:\are-companion-active-slice-x5Mifo\ARE_Companion_active_slice_paging_20260928.exe`
  (SHA-256 `a1ce83dc13756217d09cc1ae82459fde80c5f7ce687c842ff97010b3e213df33`).
- Retained, tested executable:
  `D:\are-companion-active-slice-x5Mifo\acw-sbpfn1\src-tauri\target\release\are-companion.exe`.
- Native Windows Node 26.8.1 built the pinned Tauri/WebView2 candidate on D:.
  The earlier build stopped on a full C: temporary volume; its failed stage
  was moved intact to
  `D:\are-companion-active-slice-x5Mifo\failed-c-stage-acw-iKDGlM`.
  The first completed candidate in this directory passed the single-thread
  journey but failed paging at the 32 KiB read ceiling. It is not the tested
  candidate above.

## Checks

- Focused gateway and dashboard tests: 53/53 passed; wrapper and gateway tests:
  213/213 passed. Offline Linux Rust `cargo check` passed.
- The second build's staged resources passed 11/11 native Windows feature
  checks, including product health, route/context, plan-context recording,
  and native Evolution SQLite replay.
- Native WebView2 connected-gateway journey passed with one backend thread,
  including `current slice 3/7 (active)`, the nonblank dashboard, seven panels,
  evidence links, single-card layout, keyboard checks, and reopen.
- The same staged executable passed the 40-thread journey: 32-row first page,
  eight-row second page, return to first page, changed-source rejection, and
  fresh-snapshot recovery.

## Open Questions

- Installer extraction, install/upgrade/uninstall, signing, and deployment
  remain unverified for this candidate. The staged executable was tested; the
  NSIS setup program was not run.
- The Windows installed host hook still supplies no contract-compliant JSON
  stdin in the observed environment. Managed model-turn ingress remains
  paused; this task has no verified ARE handover or universal effect boundary.
- An exact host-task list and user-recognizable task identity require a
  separately verified activation source. No gateway backend row may be
  relabelled as an ARE-controlled Codex/ChatGPT task on title alone.
