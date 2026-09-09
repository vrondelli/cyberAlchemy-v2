# Pre-browser binding block

- Result: `BLOCK`
- Code: `BIND_GRAPH_HASH_MISMATCH`
- Expected graph SHA-256: `66a63b80141274d7c803820c668f521d1676961e7362d8e9af1b03061c4b4a65`
- Actual graph SHA-256: `a9993e081d33790eb2d9f8277d2d087a2231e6c067a471f2372cffe9cc7fa290`
- Server listener: not opened
- Firefox session: not opened
- `PW-BB-01`–`PW-BB-10`: all `NOT_RUN`

The current graph, source manifest, and build receipt are all modified together.
Their new digests are internally referenced by current DomainSpec profile and
project inputs, so Task Session cannot classify this as corruption or discard it.
The UI's A1 boundary correctly failed closed before serving bytes.
