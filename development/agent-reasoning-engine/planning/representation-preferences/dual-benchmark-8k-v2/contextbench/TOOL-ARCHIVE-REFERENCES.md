# Durable tool archive references

Status: additive candidate; offline integrity and all-arm capacity tests.
Independent review and live experiment admission remain pending.

## Behavior

Tool results already exist in the guarded event journal. The new journal writer
replaces an additional full archive copy with a backward byte reference to that
existing event. It stores byte offset, line length, line digest, output digest,
the archive call and an unconfirmed-delivery label. Normal source-tool events
and current ARE tool-result events are both supported.

The resolver reads exact bytes, checks line boundaries and both digests, and
reconstructs the original archive record. Missing source events, journal drift,
changed bytes, truncation and forward references are errors. Writer failure
poisons the writer. All append effects still use guarded, synchronous durable
persistence. The reference writer starts only on an empty journal; there is no
implicit resume or directory cleanup.

A reference establishes recoverable output bytes, not proof of model delivery,
source relevance or execution authority. Identical output content can be reused
with a separate archive call identity. Request receipts and source validation
remain the evidence for delivery and final selection.

## Integration and evidence

Additive prepared runners use the reference writer; a separate comparison
dispatcher composes all three arms. Frozen experiment sources are unchanged.
The capacity test reconstructs every reference before temporary fixture cleanup,
then requires all twelve oversized assignments to finish and reconcile. It also
compares model/tokenizer call counts and allocated storage with the prior probe.

Four integrity tests exercise exact UTF-8 reconstruction, both journal event
shapes, missing/changed/truncated evidence, journal drift and writer failures.
[The retained observation](ARCHIVE-REFERENCE-OBSERVATION-R1.json) owns measured
storage and test evidence. The local provider and tokenizer are simulated; these
tests do not measure GLM quality or model-token savings.

## Construction and next work

This reduces duplicate disk payloads in the shared delivery task from
[the native research follow-up](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json).
It does not resolve tokenizer headroom or prove full-length storage capacity.
Next: explicit fitting-budget policy, bounded long-trajectory stress test, exact
candidate review and prospective experiment registration. The radical branch
must share these measurement and accounting rules.

Operational owner: benchmark orchestrator. Existing storage limits and final
reserves remain unchanged. D:/WSL admission and exact live freeze precede paid
runs; publication and release remain deferred. The full perfect-quality, 15%
total-model-token savings and untouched-confirmation requirements remain.

## Open Questions

Tokenizer fitting reserve; full-trajectory storage demand; independent review;
reference-aware downstream tooling; large journal-event limits (individual
reference reads are bounded to 16 MiB); prospective source closure and
retrieval-first experiment contract. References must be kept with their journal
and existing run seal; relocating or deleting either invalidates reconstruction.
