# Public candidate validation

The standalone `packages/coding-agent-runtime/public-case-validation.mjs` component executes declared input/output checks in separate, permission-restricted Node 26.8.1 processes and compares results in the parent. It returns a source-bound validation receipt. It does not apply a patch, ask the model for another proposal, activate a completion policy, or change the benchmark oracle.

`public-checks.mjs` provides explicitly authored adapters for the existing fixture tasks. Its inputs are visible `cases.json` bytes. Every check links the source hash, JSON selector and selected-value hash. Retention and scoring use the first eight visible examples; retention also checks empty history. Archive checks end, start and no-progress boundaries. The empty-history, interior-start and no-progress checks are authored interpretations of visible requirements/explanations, not automatically proven translations of prose. Error codes are drawn from the existing visible subject interface. These adapters are task-specific; the execution/checking component accepts declarative cases without selecting a task or reading hidden oracle files.

Validation requires 1–32 checks, 1–16 source records, at most 128 KiB of plan data and 64 KiB of candidate source. Each child has a one-second timeout, 64 MiB V8 heap setting and 64 KiB output bound; the batch stops starting children after twenty seconds. Only the exact candidate file is granted filesystem-read permission; children receive an empty environment, no expected outputs and no secret references. The child detects argument mutation. The parent rejects malformed output, compares exact result envelopes, and verifies candidate/source hashes again afterwards. The V8 heap setting is not an OS process-memory limit. Node permissions are defense in depth for these controlled fixtures, not a general hostile-code sandbox.

A negative check compares the exact expected error message, not merely whether execution threw. Read denial, timeout and malformed output cannot independently establish semantic correctness. Passing these selected checks does not guarantee all repository requirements or hidden tests pass.

Replay the retained submissions into a fresh output file:

```sh
/path/to/node-26.8.1 replay-public-validation.mjs \
  evidence/fixed-repeatability-2026-09-08/run /tmp/new-public-replay.json
```

The replay verifies candidate base/file scope and visible-evidence hashes against recorded task manifests. It preserves the original repair result alongside the new validation result and records non-submitted trials explicitly. The [diagnostic result](evidence/repair-validation-2026-09-08/README.md) keeps a separate oracle recheck; hidden oracle inputs are never passed to the public validator.

## Open Questions

Owned by the [diagnostic report](evidence/repair-validation-2026-09-08/README.md#open-questions): prospective repair feedback, broader coverage, stable child execution and stronger isolation remain future work. No live model improvement is claimed from retrospective checks.
