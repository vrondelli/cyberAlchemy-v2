Approved for bounded schema/adapter construction only. No live execution is admitted.

All 14 offline tests passed: 189 field cases, exact 50-call historical replay (30 consistently rejected, 20 accepted), semantic byte/UTF8 limits, bounded diagnostics and source integrity regressions. The same frozen schema object is advertised and compiled by Ajv.

The adapter differs from its reviewed ancestor only in validator import/comment. Ranking, ordered native reads, call identity, source snapshots, handles and full decorated response bounds remain unchanged. Invalid literal calls now receive bounded common structural diagnostics before native dispatch; successful literal behavior is preserved. Structural agreement does not replace semantic byte/source checks.

All 2,306 prior bindings remain unchanged. This does not establish provider schema compatibility, improved quality or token savings.

## Open Questions

- Real provider acceptance of conditional schema remains untested.
- Episode, reconstruction and production wiring must select the shared contract consistently.
- Census must retain malformed calls and separate structural rejection from semantic failures.
