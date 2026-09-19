# DeepSeek streaming evidence export

Status: implemented and tested offline; no new live benchmark score.

The exporter binds captured streaming request and response bytes to recorded
tool intents/results and final selection. A read counts only after its matching
tool output appears in a successful subsequent model request. Executed-only and
archived-only reads cannot become final context. Native source projection and
ContextBench export remain unchanged.

The parser handles fragmented tool calls and separate usage chunks. It rejects
truncated streams, unsuccessful termination, changed bytes, fabricated calls,
output mismatches, missing usage, source drift, and inconsistent terminal records.
Input and output tokens are counted for each supplied exchange.

Validation: eleven tests pass in deepseek-wire-export.test.mjs, including replay of
the actual DSH headless fixture messages. Scripted response events are wrapped as
SSE for this offline test; they are not new raw provider captures. The fixture's
480 synthetic tokens cannot support savings claims.

## Native payload and pruning compatibility

Search outputs may use the existing lossless source dictionary. The exporter
compares the exact canonical rendering with executed source evidence. It also
recognizes the default pinned DSH0.1.5-rc.2 pruner:8192code-point threshold,4096
retained head characters,1024tail characters and the exact native marker. Only
whole observations in retained intervals count; encoded observations additionally
require their complete dictionary source. Hidden rows never count as delivery.
Unknown transformations and changed retained text fail validation.

Three retained-message/Unicode tests and five comparisons with the actual native
pruner verify the projection. Two integration tests verify encoded tool execution
through native export and reject altered source metadata. The actual DSH payload
fixture delivered18 encoded tool results and exported48reads after compaction,
with zero real provider calls. These are compatibility results, not quality.

## Boundaries and next work

Caller-supplied hashes bind bytes but do not authenticate the provider or prove
that all requests were supplied. Durable dispatch accounting and a sealed run
manifest must establish completeness. Failed calls remain charged in that ledger;
this success exporter cannot substitute for it. Request admission, compaction
qualification, exact experiment freeze and eight live outcomes remain ahead.

## Open questions

Complete run reconciliation and native compaction coverage are owned by
[the comparison DAG](DEEPSEEK-COMPARISON-DAG.md).
