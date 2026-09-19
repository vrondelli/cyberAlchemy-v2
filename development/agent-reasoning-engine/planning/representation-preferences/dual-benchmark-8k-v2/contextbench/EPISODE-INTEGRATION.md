# Candidate one-review episode integration

`episode.mjs` is a versioned copy of the frozen v1 episode. Existing behavior stays
behind the disabled-by-default opt-in. No v1 file, provider, benchmark gold or
orchestrator was changed by this implementation. The coordinator independently
reviews and freezes the complete run before any live dispatch.

Enable the candidate explicitly:

```js
{
  terminal_submission: true,
  terminal_content_fallback: true,
  terminal_evidence_review: true,
  terminal_evidence_version: EXPANDED,
  terminal_evidence_max_handles: 32,
  terminal_evidence_max_state_bytes: 8192,
  terminal_evidence_max_state_tokens: 2048,
  maximum_terminal_corrections: 0,
  incomplete_output_corrections: 0,
  terminal_effect_state: false,
  task_state_projection: false
}
```

The path requires a baseline episode with source context. It rejects continuation
and shared-prefix pause mode rather than silently losing review lifecycle state.
The original maximum calls, output cap, cumulative token admission, native context
recycling and exact 8K request boundary remain in force. There is no extra budget,
model retry, terminal correction, effect union or terminal recovery tool.

The first early raw response or terminal tool candidate is held before acceptance.
Every tool in a mixed terminal response receives a zero-effect closure; no proposed
repository action runs. Its visible history remains unless native recycling removes
it. The next admitted model request is one terminal evidence review. A forced
finalization can directly use that review without first consuming a redundant held
candidate call. If the original call or token budget is exhausted, there is no free
review. A packet with no eligible/fitting evidence fails before review dispatch.

Review rendering uses only the public packet text and exact expanded tool schema.
Compaction applies before adding the packet and never alters its schema. The review
system guidance names the actual expanded tool. The full wire request, including
history, state, schema and output reservation, goes through native admission.
A review response either ends with a strict expanded selection or fails with no
correction. No page-request tool or cross-page accumulator is implemented; omitted
candidates remain explicit and prevent claiming complete archive exposure.

## Evidence shapes and failure accounting

`terminal_evidence_presentations` entries have
`{step, generation, request_sha256, packet}`. Only an actual successful generation
whose exact request bytes match the rendered candidate receives this private
packet. Tokenizer alternatives are not presentations. `terminal_evidence_packet`
is the final successful packet or null. The orchestrator must use the expanded
selector/exporter and find the packet by the terminal response's exact request hash.

`terminal_evidence_attempts` is distinct. Actual positive dispatch admission records
`{step, admission_prompt_digest, packet, receipt_start_index,
posture: "admitted-awaiting-receipt", dispatched: null}` through `on_event` before
the transport boundary. It is not proof that a model saw the packet. When an exact
matching model receipt arrives, success or failure, the record gains request and
receipt hashes, status, dispatch flag, finish reason and known input/output cost.
A truncated review therefore retains a receipt-bound attempted packet, zero accepted
presentations and its full failed-call usage. Missing receipt evidence stays
explicitly unresolved. Request-size or token admission rejection produces no attempt
or presentation. The orchestration event journal must durably retain these private
records; none belong in a model prompt.

## Validation and limits

Nine new integration tests use the actual native recycler with a synthetic transport:
raw early hold, mixed-tool zero effects, forced review, four-file native export,
request/packet binding across recycle alternatives, non-ready packets, original
call/token limits, full-request context rejection, invalid selection without
correction, mismatched receipt rejection and known-cost truncated review attempts.
Forty-seven inherited episode/budget/provenance/terminal tests protect the opt-out
path. These are instrument checks, not provider-token or model-quality evidence.

## Open Questions

The runtime still needs coordinator-owned source preflight, live tokenizer admission,
whole-trajectory cost/quality scoring, freeze and independent review. Thirty-two
handles may omit needed evidence, and whole-read granularity can prevent native
perfection. This candidate makes no perfect-score or efficiency claim.
