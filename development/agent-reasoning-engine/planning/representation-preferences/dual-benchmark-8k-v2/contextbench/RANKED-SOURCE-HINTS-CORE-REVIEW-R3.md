# Ranked-source-hints core review R3

Approved for deterministic core construction under R4. All 16 tests independently pass, including actual native reads of fitted UTF-8/BOM/context windows. Earlier sources and reviews remain exact.

Files above 2,000,000 bytes are excluded before loading. Window fitting retains a readable anchor, removes leading context first and then trailing context until the joined byte count fits 32,768. Unreadable matched lines and path-only fallbacks have explicit separate counts; response omission counts refer to eligible windows. LF extents remain correct and conservative BOM counting is prospectively disclosed.

This resolves the previously identified source-size/span accessibility policy at the core level. It does not prove native no-credit integration, worker isolation or resource admission. Exact bindings are in the paired JSON; no models or evaluator calls were made.

## Open Questions

Actual corpus build capacity, bounded process/output behavior, pinned Git loading and native schema/admission remain pending. Test hint-only zero credit and subsequent native-read credit through complete saved prediction reconstruction. Useful acquisition, perfect quality, matched 15% savings and untouched confirmation remain unproven.
