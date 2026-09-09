# Task Session Result — A4 Firefox replay

## Result

- Task: `SWU-IOLM-00C-UI-A4` replay
- Run: `20260722T182915Z-firefox-replay`
- Result: `BLOCK`
- Gate: `B-IOLM-A1-PINNED-FIXTURE-DRIFT`
- Server: rejected before bind with `BIND_GRAPH_HASH_MISMATCH`
- Browser: not opened
- Automated scenarios: `PW-BB-01`–`PW-BB-10` all `NOT_RUN`
- Manual checks: all `NOT_RUN`
- Browser acceptance handle: not emitted

## Cause

The A1 binding expects graph SHA-256 `66a63b…`; the live DomainSpec fixture is
now `a9993e…`. Source manifest and build receipt bytes also changed together.
Current DomainSpec inputs reference the new profile and relationship digests,
and the generator changed to `minted-project-tools/v1`, so the replay cannot
safely restore or silently adopt either source state.

## Honest stop

- No server listener or Firefox session was opened.
- No A1–A3 implementation or DomainSpec file was modified.
- The watcher-quota fallback was validated but never needed for an opened browser.
- All three per-run result files preserve the six-value exclusion fence.
- The original failed A4 run remains immutable.
- Continue only after the fixture-policy Decision Gate is resolved through its owning route.
