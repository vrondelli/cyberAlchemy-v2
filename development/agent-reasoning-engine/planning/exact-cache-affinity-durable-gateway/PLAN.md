# ARE exact cache-affinity and durable gateway vertical

Status: implemented candidate plan
Authority effect: none

## Objective

Turn explicit reusable Reasoning State into a byte-stable prefix for each Codex
request series, then preserve each gateway consumer's checkpointed ledger across
a gateway restart:

```text
stable system, tool, model, and configuration header
  + reusable explicit reasoning-state projection
  + volatile current-turn suffix
  -> exact prefix comparison and diagnostic measurements
  -> Codex additionalContext
  -> per-consumer append-only JSONL ledger
  -> atomic single-writer lock
  -> checkpoint-bounded restart recovery
```

## Cache-affinity contract

- `are.reasoning-cache-affinity-projection/v1` materializes the three segments
  in fixed canonical JSON order and records every segment's byte count and
  digest.
- `are.reasoning-cache-affinity-assessment/v1` compares the complete reusable
  prefix with the preceding projection for the same consumer and reports cold,
  eligible-reuse, or invalidated posture, exact/common reused bytes, estimated
  reusable tokens, projection time, and explicit invalidation reasons.
- Provider cache hits and actual time or token savings remain `unobserved`
  unless the provider exposes trustworthy telemetry. Exact byte reuse never
  proves freshness, provenance, correctness, or authority.

## Durable gateway contract

- The repository gateway profile selects `file-per-consumer` reasoning state.
- A sanitized consumer label plus a SHA-256 identity suffix derives a distinct
  log and ledger identity, preventing filename aliasing.
- Wrapper construction obtains an atomic adjacent writer lock before recovery.
  Concurrent writers fail closed; clean shutdown closes the ledger and releases
  the lock.
- Recovery verifies the complete canonical log and final checkpoint before the
  wrapper accepts work. A stale crash lock is deliberately not stolen or
  repaired automatically.
- The recovered completion frontier already carries semantic materialization,
  Reasoning Receipt result, contradictions, rejected observations, and
  continuation posture. Replaying it makes zero provider, evaluator,
  continuation, effect, or successor calls.

## Verification obligations

- Stable inputs reproduce the exact reusable prefix; model, tool,
  configuration, and reasoning-state changes name deterministic invalidation
  reasons.
- Cache material precedes volatile Context Envelope material in the actual
  forwarded app-server request.
- Distinct consumer identities cannot alias one log.
- One log admits only one live writer; clean shutdown permits exact restart.
- Gateway shutdown closes every wrapper.
- Existing reasoning, context, semantic, wrapper, gateway, protocol, ontology,
  replay, and canary suites remain green.

## Deliberate residue

- The Codex app-server does not report provider cache-hit, saved-token, or
  saved-time telemetry, so those measurements remain explicitly unobserved.
- A crash can leave a stale lock that requires separately bounded operator
  reconciliation; automatic lock stealing is unsafe.
- Successor delivery acknowledgement, log repair, compaction, content-addressed
  branches, portable epochs, and distributed multi-host coordination remain
  separate successors.
- This candidate grants no admission, acceptance, conformance, publication,
  deployment, or effect authority.
