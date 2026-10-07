# Windows Companion bounded Threads paging — 2026-09-28

Status: bounded development evidence; authority effect: none. The TUI is
discontinued and outside this path. The unsigned installer was built but not
installed, and this Codex desktop task was not handed over to ARE.

## Exact artifact

- Unsigned NSIS candidate:
  `/mnt/d/are-companion-paging-T3f5tB/ARE_Companion_paging_bridge_retry_20260928.exe`
  (SHA-256 `505380fa2cc99d6160971d42a2df1203b66b97abb08f5b9e48c773c0c313a9f4`).
- Retained, tested executable:
  `/mnt/d/are-companion-paging-T3f5tB/acw-0it1kN/src-tauri/target/release/are-companion.exe`
  (SHA-256 `767e32cf324f34cc7afa3f193417c3d235220c01347a110ea38ad2d87cde6a85`).
- Native Windows Node 26.8.1 built the pinned Tauri/WebView2 development
  package on D:. The builder reported 764 standalone-closure files,
  development closure digest
  `e8c7905dda95e833e3e08aaaae9aeafe425e0475721e1b13e4704c95051cce6d`,
  and Core closure digest
  `5c617f995a229064cf38a2d06f6c661a56319d60a45733cf9f20e9f5bc143cb2`.
  The test ran the retained executable with an isolated WebView2 profile, not
  the setup program.

## Implementation and validation

- The gateway projects ongoing and recovery-paused backend Reasoning State
  before completed history, in stable 32-row pages. A content-free snapshot
  digest binds subsequent page reads to the same source facts. The CLI and
  native bridge preserve a specific `thread.observation-source-changed` error;
  other native read failures remain generic. The dashboard puts Previous, Next,
  and Start fresh above the card list and does not infer host-task coverage.
- Gateway observation/client tests passed 11/11; dashboard tests passed 40/40;
  the native harness passed `node --check`; the Rust bridge passed offline
  `cargo check`. The staged feature probe passed all 11 checks, including
  product health, route/context, bounded thread/decision imports, and native
  Evolution SQLite write/observe/replay.
- The isolated native WebView2 fixture reported 40 backend threads. It showed
  32 cards at `1–32 / 40`, eight at `33–40 / 40`, then restored page one. The
  test changed the gateway snapshot, verified the native bridge's exact
  changed-source rejection, verified the dashboard's `Source changed`/Start
  fresh posture, and returned to the new first page. The same journey kept all
  seven dashboard destinations, evidence links, keyboard focus, independent
  source-loss states, appearance persistence, and a nonblank reopen working.
  No external model call or live desktop-task mutation was made.
- The [captured Threads screenshot](</mnt/d/are-companion-paging-T3f5tB/threads-pager-final.png>)
  was visually inspected. It shows the pager above the two-column card list,
  with the first-page range and eight omitted ongoing threads disclosed. This
  is a visual check of that fixture, not a screen-reader or physical-pointer
  assessment.

An earlier staged build surfaced the concrete integration gap: the CLI emitted
the changed-source reason, but the Rust bridge discarded stderr and converted
it to generic `thread.unavailable`. The bridge now captures only the bounded
`thread-status` diagnostic, drains its pipe, and forwards only that exact
reason. The passing native run above is from the rebuilt package containing
this correction.

## Native keyboard and status follow-up

The later source change gives the visible range a polite, atomic status role
and words it as “Showing 1–32 of 40 backend threads.” Routine same-page
refreshes leave that status text unchanged. When Enter-key paging disables the
focused boundary button, focus moves to the enabled reciprocal button; after
a changed-source rejection, it moves to Start fresh. This is keyboard and DOM
evidence, not proof of a particular screen reader's spoken output.

- Fresh unsigned NSIS candidate:
  `/mnt/d/are-companion-paging-T3f5tB/ARE_Companion_pager_a11y_20260928.exe`
  (SHA-256 `744a66cff109d85faee44b8fe91955adf56cf2c1a905797b51942d2172ecf6df`).
  Retained tested executable:
  `/mnt/d/are-companion-paging-T3f5tB/acw-IXTglk/src-tauri/target/release/are-companion.exe`
  (SHA-256 `c6fecd117aeb19178dd55c0c80a261a62f6e2d55faa00f8c8316990cb38d428c`).
  The native Windows Node 26.8.1 builder reported 764 files, development
  closure digest
  `045a593712a4df66ec006ae14035630d4788af72d1be2fc198d2440c663c6237`,
  and Core closure digest
  `53504173a0642ef9efbbc63280c9a7a4341f78e79446f10d07e96256104925f1`.
- Dashboard source tests passed 40/40, including unchanged-status and focus
  assertions; the native test harness passed `node --check`. The staged
  feature probe again passed all 11 checks. In isolated WebView2, the full
  seven-panel live-gateway fixture passed twice with 40 backend threads. It checked
  the status role/live/atomic attributes, used actual Enter key events for
  Next and Previous, verified reciprocal focus at both page boundaries,
  verified changed-source focus on Start fresh, and retained the source-loss,
  evidence-link, appearance, and nonblank-reopen checks.
- The [follow-up screenshot](</mnt/d/are-companion-paging-T3f5tB/threads-pager-a11y.png>)
  was visually inspected: the longer range remains legible above the cards at
  the tested 1105-by-904 dashboard viewport. No installer was run and no
  current desktop task was mutated or activated.

## Claim ceiling and open questions

This proves staged native read-only paging and source-change handling for an
isolated gateway fixture. It does not prove installed-package lifecycle,
long-duration resource use, screen-reader accessibility, release signing, live current-task
Reasoning State, or exclusive desktop-task handover. The gateway observes its
own backend threads; the current Codex desktop chat remains unverified as an
ARE-managed session.

- Can the selected desktop host expose a supported, exclusive writer handover
  with complete ingress, approval, and rollback coverage?
- Does the installed package retain these UI results under normal desktop
  pointer, accessibility, and resource-budget checks?
