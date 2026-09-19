# Native 8K catalog qualification

The first fixed task was retried only as a separately versioned configuration
qualification, not as a replacement for any paired-pilot outcome. The catalog
was 8,000, compaction threshold 0.6, max_tokens output field and low reasoning.
Six model calls used 22,117 known tokens. There were no unknown-cost calls.
The run ended on a length-terminated response: native output capacity was only
190 tokens, while actual input was 5,034. No valid final context was selected.
This does not validate a control for relative quality/token-savings claims.

## Open questions

Smaller shared source pages may prevent tool payload bursts and allow useful
compaction output under both harnesses. This needs a prospective matched
experiment; do not change or replay the finished qualifications.
