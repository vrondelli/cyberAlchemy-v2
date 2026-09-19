---
task: SWU-CDSC3-003
result: PASS
completed_at: 2026-07-12T18:44:59Z
next_swu: SWU-CDSC3-004
---

# SWU-CDSC3-003 Result

The source-derived React/browser baseline passes.

- Four Savvy source/package files are frozen by exact raw hashes and selectors.
- Eight generated harness artifacts have a complete translation map.
- Guard and route commit behavior derive from Savvy selectors.
- Finite next/back movement is explicitly bound to the closed generation-2
  harness rather than represented as newly extracted source.
- Two fresh local-only Chromium processes produced identical semantic outputs
  and screenshot hashes.
- Seven of seven vectors match, covering mount, active child, ports, next/back,
  allowed movement, inactive redirect, premature redirect, guard notice,
  requested/committed step, and route-tree state.
- All protected inputs and the runtime descriptor remain unchanged.
- No permitted or breaking mutation adapter exists.

## Validation

- Focused baseline suite: 6/6 pass.
- Aggregate calibration suite: 120/120 pass.
- JSON, translation digest, source hash, screenshot, and scoped diff checks:
  pass.

## Handoff

Route serially to `SWU-CDSC3-004` with baseline witness handle
`sha256:fd53e72c3832b6634ba1b4830896e8c129738788c8a7e9bdc0d8663428612229`.
