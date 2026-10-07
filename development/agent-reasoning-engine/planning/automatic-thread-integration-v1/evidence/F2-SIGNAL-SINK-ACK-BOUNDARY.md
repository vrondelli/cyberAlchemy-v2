# F2 Evolution signal sink acknowledgement

Status: bounded candidate construction evidence, 2026-09-28. TUI is
discontinued and is not a product path.

## Boundary

The wrapper previously classified a candidate Improvement Signal as
`emitted` whenever the opt-in sink returned anything except `{ok:false}`.
An absent or malformed sink result could therefore be reported as emission
without a checkpoint receipt. The wrapper now requires the sink to return
`ok:true`; otherwise it records `sink-failed`. The configured gateway inbox
already returns `ok:true` only after a duplicate is recognized or a new
candidate has been appended, sealed and checkpointed. No signal log format,
cycle admission, or default configuration changed.

## Validation

- The gateway signal-intake test file passed 5/5. New cases cover absent,
  malformed, and explicit-negative sink results; none is reported as
  `emitted` or creates an inbox record. A subsequent real sink call still
  checkpoints one candidate.
- Two focused wrapper cases passed, including a completion whose sink returns
  no acknowledgement: its durable assessment says `sink-failed`, not
  `emitted`. The full Codex wrapper package suite exited 0; its optional
  rendered-browser tests were not enabled by that Linux run.
- The 29 Evolution-runtime test files outside the H-EN benchmark file passed.
  The full 30-file package
  command failed in `benchmark-research-v1.test.mjs` because its separate
  H-EN import manifest reports source-byte drift for
  `BENCHMARK-EVOLUTION-WORKFLOW.md`. That untracked benchmark source and its
  manifest were not changed or rehashed for this F2 task.
- Syntax and scoped whitespace checks passed.

## Claim ceiling and open questions

This prevents a false emission claim on a missing sink acknowledgement. It
does not retry an indeterminate write, prove physical durability under power
loss, admit an Evolution cycle, or bind the current Codex desktop task to
ARE. A failed assessment remains visible as failure for that completion;
safe retry/reconciliation would need an exact idempotency and recovery
contract. G1 handover and O1 activation remain open.
