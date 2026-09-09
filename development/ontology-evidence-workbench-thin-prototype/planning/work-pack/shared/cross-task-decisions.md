# Cross-Task Decisions

| ID | Decision | Rationale | Revisit |
| --- | --- | --- | --- |
| D-01 | new development namespace, not npm package | prevents repeated dependency-root pollution | only if a missing behavior cannot be owned by current workspace |
| D-02 | direct script invocation, no package script edit | current command registry already declares browser targets and is not needed for admission | future packaging owner |
| D-03 | predecessor receipts carry current digests | avoids preauthoring stale repair SHAs and refresh loops | if receipt integrity proves insufficient |
| D-04 | old immutable L1 lane remains later and may become byte-stale | preserves its architecture/authority without importing its lock ceremony; shared repair staleness is explicit | rebind after L1 prototype receipt |
| D-05 | browser producer plus read-only Task Session closure audit is sufficient for the fixed prototype ceiling; independent immutable verification is L2 | honors the approved thin-lane research and avoids rebuilding the old ceremony | L2 owner decision |
| D-06 | the absolute API adjacent to the active Playwright CLI resolves/hash-binds `chromium.executablePath()` at runtime | exact evidence without repository package pin or ambiguous dry-run parsing | if reproducibility later requires a separately owned browser lock |
| D-07 | browser test imports the verified global Playwright API by absolute file URL derived from the CLI realpath | global CLI availability does not imply local bare-module resolution; avoids another manifest | if Codex runtime provides a governed browser API owner |
| D-08 | every SWU receives one concrete attempt ID and pre-bound generated/session/closeout paths before mutation | prevents output overwrite, retry collisions, and orphaned evidence | only if Task Session defines a stronger equivalent binding |
| D-09 | SWU-001 owns same-origin resolution of OewApp's relative `/oew-data/` base inside the already-owned loader | current composition throws before fetch; this is a bounded runtime repair in an existing write target, not a dependency or topology change | if the dashboard changes its loader interface |
