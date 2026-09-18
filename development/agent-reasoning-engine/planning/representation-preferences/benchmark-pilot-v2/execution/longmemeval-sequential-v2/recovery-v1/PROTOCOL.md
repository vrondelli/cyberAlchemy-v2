# Explicit tokenizer-boundary recovery

The frozen sequential-v2 run stopped after 28 generations and seven final answers.
Its next request was tokenizer-only and failed before any model request was written
or sent. Model usage is known: 65,762 tokens. This amendment permits one new
tokenizer admission attempt and execution of the untouched suffix only.

Preserve the original stopped result, all receipts and frozen protocol. Do not repeat
completed generations. Before resuming, prove the completed calls are an exact
prefix of the frozen schedule ending at a complete task/arm boundary. Check every
receipt and usage total, verify original source hashes, and exclude any unaccounted
model start. Bind this evidence and the recovery code in a new immutable receipt.

The next generation is repetition 1, abstention task, treatment, ingestion step 0.
The remaining 36 generations produce nine answers. The final report combines the
original prefix and continuation, with full provenance, and discloses this recovery.
Total sequential-v2 usage remains capped at 199,499, including its prefix. Together
with sequential-v1's 5,301 tokens, the branch remains under 204,800.

Inputs, notes instructions, source exposure, arms, ordering, model settings, output
caps and scoring are unchanged. Tokenizer admission still precedes every generation.
No automatic retry is added. A further failure stops and preserves its exact boundary.
Seven completed answers may receive blind review, but their scores do not change the
remaining schedule. This is operational recovery, not a new quality experiment.

## Open questions

Will the provider stay available for the remaining calls? The exact cause of the
transient network request failure is unknown; this recovery does not assert one.
