# Owned timing inspection

This successor replays `latency.inspect` using the Workspace-owned runtime.
`sources.json` still binds the exact six inspected product-source files.
`report.json`, `progress.json` and `view.html` are derived outputs checked by
`inspect.mjs --check-saved`, rather than candidate inputs (avoiding a circular
dependency). Source changes fail closed. Nothing updates the historical shared
runtime candidate or its blocked receipt.

Open questions and operational boundaries: see `../README.md`.
