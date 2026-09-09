# VPS integration evidence

These receipts are candidate observations, not governance admission. The
[host plan](../HOST-PLAN.md) owns the earlier installation and launcher evidence.

## RWO / ARE / Workspace continuation

- [Source build](rwo-build.json) and [deployment manifest](rwo-deployment-candidate.json).
- [Adapter failure/replay tests](rwo-adapter-test.json) and [native fixture test](rwo-native-test.json).
- [Targeted Workspace compilation](rwo-workspace-check.json).
- [Live RWO command and completion history](rwo-live-result.json).
- [Replay and existing-service checks](rwo-post-live-check.json).
- [SSH-forwarded Workspace projection](rwo-workspace-live.json).
- [Completion record](rwo-ready.json).

The live result contains one fresh provider call. Fixture tests contain no
external calls. Replay returns the original completion and makes no new call.
The full Workspace build and browser rendering were not exercised in this
checkout; its dependencies are absent. Compiler and actual projection checks
have that explicit ceiling.

## Open Questions

Owned by the [bounded adapter plan](../runtime/rwo/README.md#open-questions) and
the [host plan](../HOST-PLAN.md#open-questions).

The next [bounded text-task continuation](../runtime/TASKS.md) owns the
`text-task-*.json` receipts: contract/native/adapter tests, smoke regressions,
the exact deployment manifest, one live task, and post-live service checks.

[Workspace launch controls](../runtime/WORKSPACE-LAUNCH.md) own the
`workspace-launch-*`, `workspace-objective-*` and `workspace-controls-*` receipts.
The [ready record](workspace-launch-ready.json) links bridge, browser, native
objective, live VPS, compiler and service checks. The first blocked attempt used
zero provider calls; the fresh browser acceptance used one and replayed offline.
