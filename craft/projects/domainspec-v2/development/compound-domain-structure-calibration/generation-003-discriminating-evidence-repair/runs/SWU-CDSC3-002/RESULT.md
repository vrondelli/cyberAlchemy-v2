---
task: SWU-CDSC3-002
result: PASS
completed_at: 2026-07-12T18:35:11Z
next_swu: SWU-CDSC3-003
---

# SWU-CDSC3-002 Result

The browser runtime and observation contract passes.

- `DEC-CDSC3-011` was consumed without reopening a decision.
- Playwright 1.61.1 and Chromium 149.0.7827.55 revision 1228 are installed
  package-locally with `PLAYWRIGHT_BROWSERS_PATH=0`.
- React/ReactDOM 19.2.7 match Savvy's lock; esbuild 0.28.1 is the frozen local
  bundling adapter.
- Runtime install size is 682 MB.
- Two real Chromium runs produced identical structured DOM state and screenshot
  digest `sha256:283c23b55f7c2d54a174259cd27c2d9dbc997315524470ac8d8712777671678a`.
- Five schema/direct-validator boundaries pass.
- Eight invalid vectors reject at their owning boundary.
- All fifteen SWU001 protected files remain byte-identical.
- No source-derived baseline or mutation observation was created.

## Validation

- Focused browser-contract suite: 13/13 pass.
- Aggregate calibration suite: 114/114 pass.
- npm dependency tree, JSON parsing, and scoped diff checks: pass.

## Handoff

Route to `SWU-CDSC3-003` with runtime handle
`sha256:1fb329917fac227cf520d03583799fc04c2adfab40bbe7459099c1e416ec5e2c`,
the SWU001 target-set handle, and the five browser contract schemas.
