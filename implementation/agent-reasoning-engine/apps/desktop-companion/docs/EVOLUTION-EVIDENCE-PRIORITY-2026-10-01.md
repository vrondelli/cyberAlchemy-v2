# Evolution evidence-priority UI check

Status: bounded product-construction evidence, 2026-10-01. Authority effect:
none. TUI is discontinued and outside this check.

## Change

The read-only Evolution screen now places observed cycles before candidate
definitions when a verified ledger contains at least one cycle. Without a
verified cycle, bundled candidate definitions remain first. A cycle's
`active` value is labeled **Recorded disposition**, and the source line says
that no worker liveness was observed. No cycle execution, admission, or
activation control was added. The observer schema and privacy projection did
not change.

## Verification

- `node --test implementation/agent-reasoning-engine/apps/desktop-companion/ui/dashboard.test.mjs`
  from the checkout root: 53/53 passed,
  including both display orders and the qualified disposition label.
- Fresh unsigned Windows NSIS candidate:
  `D:\are-win-focus-YDTVzk\ARE_Companion_evolution_priority_20261001_x64-setup.exe`,
  SHA-256 `6f800244846b15d1cd78cfaac6aa5098c04690974e1fb21b58a9f34d0e73331c`.
  The native Windows builder retained its stage at
  `D:\are-win-focus-YDTVzk\acw-6MpHVX`, reporting development closure
  digest `3b3e3494fd530d4cd368f00caad9a9b2ec4bc3b143d4723f9bcf326427cd13b7`
  and core closure digest
  `94123c39581dd853faf94ca19540ecf6a4287fa4fd2ec2fcc42156111bac6976`.
- 7-Zip recognized and extracted the NSIS archive without executing it:
  831 files, archive integrity `Everything is Ok`. The extracted executable
  passed 13/13 native bundled-feature checks.
- A disposable Windows-created ledger with one candidate cycle and one commit
  drove the extracted WebView2 journey. It passed verified cycle, coordination,
  event progression, the new cycle-before-registry assertion, and a
  pre-scroll first-viewport bound for the cycle summary. The captured
  view at `D:\are-win-focus-YDTVzk\evo-current-q4B7s2\evolution-priority.png`
  was visually inspected: the recorded cycle is above the registry and visible
  in the first viewport.
- The same extracted executable passed the registry-only journey, including
  definitions-first order, and the live-adapter hosted-steer journey, including
  pending-cue withdrawal on stale observation and after acknowledgement.

## Claim boundary

The checked ledger is a disposable fixture. It proves the packaged read-only
screen renders bounded verified evidence, not that an Evolution worker is
currently running or that an improvement was deployed. The installer was not
installed or signed; installed lifecycle, update/rollback, and this desktop
task's ARE control remain unverified.

## Open Questions

- Objective drill-down and richer evidence links still need an exact
  source/privacy binding; the current observer intentionally omits objective
  text, payloads, paths, and worker identity.
- Installed-package lifecycle and an actual configured Evolution runtime
  remain separate from this fixture-backed extracted-payload check.
