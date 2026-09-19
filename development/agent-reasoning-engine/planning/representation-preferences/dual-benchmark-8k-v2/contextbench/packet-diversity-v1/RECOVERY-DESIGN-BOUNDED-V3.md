# Bounded-v3 final-seal recovery design

The original run finished its16 model continuations but did not persist its final generation seal. Treat that run as a final-persistence infrastructure failure, not a normally sealed success. Do not rerun models, modify frozen files, parse the truncated console exception as authoritative JSON, or overwrite original stage artifacts.

## Independent retained-evidence audit

`RECOVERY-READINESS-BOUNDED-V3.json` binds64 original result/request-result/ledger/checkpoint files. All16 result statuses are completed, unknown usage is false and suffix receipts total55,487 model tokens. Every slot has exactly one newly dispatched successful model receipt. Native ledger digests and receipt lists match result and request-result; checkpoints have valid digests and terminal phase; ledgers are idle and writer locks absent. All1,132 source-freeze bindings still verify. Native admissions retain8K/2,048-output limits. No reference values or selection hints were inspected.

The16 full result files total12,192,810 serialized bytes. Duplicating them in a final artifact cannot fit the8MiB final-reserve contract even before aggregate metadata. The failure is structural, not a reason to retry generation or silently enlarge the frozen stage allowance.

## Minimal additive recovery

Create a new single-use bounded recovery stage after explicit recovery amendment/review. Preserve the original stage read-only. Write a compact reference manifest containing exact original freeze/start identities, each donor/variant's original result/request-result/ledger/checkpoint/timing/admission/prompt file hashes, terminal lifecycle proofs, compact usage/status, fixed denominators and the original final-write failure. Its schema and name must explicitly say recovered evidence; it is not the missing original `GENERATION-SEAL.json`.

Independently census all original stage slot directories and receipt suffixes to reject extra or unassigned dispatches, missing slots, duplicate calls, digest drift and unresolved locks. Sum known/unknown spend and logical prefix totals using unchanged accounting. Reconstruct packet exports from the original results only inside the evaluator after recovery evidence validates. Source-only original preparation and freeze identities must match throughout.

For scoreability, an additive evaluator loader can verify the compact manifest and hydrate the immutable original slot records in memory, then reuse the reviewed validation/native metrics. Never materialize the12MiB duplicated aggregate in an8MiB final reserve. Bind the compact manifest hash plus referenced raw files in the new evaluation report. Its sibling evaluator stage retains the same32MiB cap and8MiB final reserve.

The original run remains an infrastructure failure. Diagnostic native scoring may proceed after exact recovery review without another model call, but do not silently turn it into original-protocol support. Any decision to accept a recovered comparison requires an explicit separate recovery acceptance amendment and independent evidence-integrity verdict, retaining the original failure and costs. Otherwise classify the original protocol inconclusive and report recovered metrics as diagnostic evidence.

## Open Questions

Exact recovery loader/schema, exhaustive dispatch census, original process settlement proof and amended scoring/registration semantics remain coordinator-owned implementation/review prerequisites. No recovery or scoring is approved by this design alone.
