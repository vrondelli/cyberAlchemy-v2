# Independent reasoning replay review

Approved as the bounded offline v2 correction. All three integration groups pass independently.

The source diff changes only conversation replay to use the original parsed transport message and finish reason. Receipt-bound public captures and native selection verification are unchanged. The regression checks reasoning_content in each investigator’s next request; phase budgets, isolated histories, tools and evidence semantics retain the previous implementation.

The old native wrapper/prepared runner still select v1. This review does not make those callers corrected: additive v2 integration is required before provider qualification. Frozen v1 remains preserved. No provider calls or source edits occurred during review; exact transitive bindings accompany this artifact.

## Open Questions

INDEPENDENT-REASONING-REPLAY.md owns common wrapper/source integration, bounded histories, actual provider qualification and exact campaign freeze. No live admission or quality/efficiency result is implied.
