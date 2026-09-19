# Ranked-source worker review R2

Approved for bounded worker construction. The external SIGTERM defect is resolved: main-thread scoped signal handlers are installed before spawn; cancellation is observed both during pipe I/O and after EOF while the process remains alive. Cleanup kills and waits the worker, reports group absence and restores prior handlers.

All eight tests independently pass, including real supervisor SIGTERM/SIGINT under open/closed-pipe conditions, retained cancellation evidence and forced group cleanup. Existing memory-limit, source-pinning, input-deadline and output-bound regressions pass. Rejected R1 sources and evidence remain exact.

The retained four-corpus capacity measurements are R1 execution evidence with unchanged indexing logic, not newly measured R2 performance. Exact source/evidence bindings are in the paired JSON. No corpus builds, model calls or evaluator calls were performed.

## Open Questions

Native tool integration, caller-owned durable failure evidence and exact live qualification remain pending. An uncatchable supervisor SIGKILL still requires outer containment/ownership handling; scoped Python handlers do not claim otherwise. Full source-credit exclusion must be tested through saved prediction reconstruction. No live admission, quality or savings claim is supplied.
