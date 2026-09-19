# Compact generation evidence recovery

The original generation wrapper failed to persist its final seal. This additive module preserves that failure and never claims to reproduce the exact lost wrapper object or timestamp. It records a distinct compact recovery manifest, binds the sixteen persisted slot results and supporting native artifacts, and hydrates a compatible in-memory seal only after all checks pass. No model, tokenizer, reference, or scorer call is made.

`createRecovery` accepts explicit `freeze_path`, `live_directory`, `cli_exception_log`, `acceptance_review_path`, `output_directory`, and `provenance`. Provenance must declare `observer:"root-coordinator"`, `observed_exit_code:1`, `failure_code:"final-reserve-limit"`, `model_reattempts:0`; the coordinator may additionally retain its observed execution session. It is observation evidence, not parsed JavaScript from a Node exception dump. `recovered_at` is generated during recovery. The hydrated `completed_at` explicitly means recovery-validation time, with the original wrapper timestamp unavailable.

An approved `packet-generation-recovery-bounded-v3` review must bind this module, its tests, SEAL-RECOVERY-AMENDMENT.md and the original freeze. Every review binding is rehashed. Every original stage file is censused and hash-bound; extra native/model artifacts, unassigned JSONL, symlinks and active locks reject. Slot request/result/ledger receipts must agree; ledger and checkpoint digests, scoped identity/counters, terminal checkpoint/admission and prompt/capture/response hashes are checked. Exactly one successful suffix tokenizer and model per fixed slot, known costs, source freeze and original started receipt are required. Frozen `validateSeal` checks the hydrated aggregate, original prefixes, 8K admission, fixed order, logical costs and 128,000 reserved generation tokens.

The new recovery stage uses the shared 32MiB guard and final 8MiB reserve. It retains a bounded exact copy of the original exception log (maximum 8MiB) so recovery does not depend on temporary storage surviving a reset. Original log location/hash remains provenance. RECOVERED-GENERATION.json contains references instead of repeated slot bodies; final RESULTS.json binds it. `hydrateRecoveredSeal(manifest_path, verified)` rehashes and validates everything again and returns `{seal,recovery}`. The recovered scorer must expressly accept this recovery schema; frozen original scoring/registration is not silently redirected.

## Validation

Three synthetic test groups pass, covering compact lossless hydration, accounting, evidence drift, slot reordering, extra JSON/JSONL model evidence, active locks, digest failure, a swapped internally valid checkpoint, request mismatch, nonterminal state, denied review and unknown usage. No actual recovery publication was performed during implementation.

## Open Questions

Independent exact-hash code/acceptance review gates actual recovery. Native scoring and result-integrity review remain separate. This repairs evidence representation only; it does not erase the original persistence failure, rerun a model, change outcomes, or clear component/full-benchmark criteria.
