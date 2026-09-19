# Structural investigation-plan validation

The old validator treated any slash, source-like extension or task identifier as
invalid. Two frozen planner responses failed: ordinary slash prose and a filename
already present in the task. Their original errors and costs remain unchanged.

The additive candidate uses the existing bounded JSON parser and Ajv with
all-errors validation. It accepts exactly three distinct questions, each with
question and investigates strings; requires nonblank bounded text; rejects extra
fields, duplicate decoded keys, malformed JSON and normalized duplicate questions.
The 8192-byte input bound remains. String length follows JSON Schema character
semantics. Diagnostics are capped at64issues and8192bytes and retained on failed
episode results. No automatic retry or repaired input is introduced.

Question text is provisional search intent. Punctuation, paths and identifiers
are not a provenance boundary. Accepting such text gives it no source identity,
authority or evidence credit. Read-only investigation tools, repository path
boundaries, successful delivery receipts, source hashes, branch-bound findings
and final selection checks remain unchanged. Structured purported findings and
evidence fields are outside the closed plan schema and rejected.

The candidate episode is independent-repair-compact-plan-v2.mjs. It changes the
validator, planner instruction and explicit question posture, while retaining
phase/call/token allocations and downstream evidence handling. Original frozen
episodes are untouched. Production dispatch still selects the previous episode;
future integration must be explicit in a reviewed successor freeze.

Fourteen offline tests cover schema errors and bounds, duplicate keys/questions,
ordinary paths/punctuation, a complete scripted repair and source export, receipt
accounting on interruption, stale edits, phase reservations, compact payloads,
fabricated evidence rejection and stopping malformed plans before tool use.
[Historical replay](INVESTIGATION-PLAN-V2-REPLAY.json) verifies original receipt
and public response hashes for slots02/06, reproduces their old rejection and
accepts both in the candidate. There were no new model or evaluator calls.

## Research and construction boundary

This is shared implementation repair under the eight-task native follow-up in
[RESEARCH-RESULT-R3.json](compact-comparison-production-live-r1/RESEARCH-RESULT-R3.json),
not evidence for architectural superiority or benchmark success. It is separate
from the radical retrieval-first treatment and should be common to any fresh
comparison requiring a planner. Existing perfect-quality/15%total-token targets
and untouched confirmation remain unchanged.

## Open Questions

Independent candidate review; explicit driver integration after batch-delivery
and canonical-outcome repairs; exact prospective screening/launch protocol.
Broader ownership remains in [the retrieval screening draft](COMPACT-RETRIEVAL-FIRST-SCREEN-DRAFT.md).
