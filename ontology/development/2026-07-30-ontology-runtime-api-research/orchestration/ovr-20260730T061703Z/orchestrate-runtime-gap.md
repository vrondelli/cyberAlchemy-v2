# Orchestrate Runtime Gap

After reducing `spawn-0004`, the installed
`native_dispatch_coordinator.py` computed the next action number from only the
current one-action wave. Its raw transition therefore proposed
`spawn-0002`, `spawn-0003`, and `spawn-0004`, which collide with already
attempted actions.

The raw deterministic output is retained under
`reductions/synthesizer-raw/`. The parent driver rejected those replay IDs
before any host call and rematerialized the confirmed `reviewers` wave with
unique monotonic IDs `spawn-0005` through `spawn-0007`. No source capability,
mutation policy, scope, role, wave, dependency, or receipt target changed.

This is runtime evidence about the installed Orchestrate coordinator. It does
not authorize patching the generated or canonical skill during this research
dispatch.
