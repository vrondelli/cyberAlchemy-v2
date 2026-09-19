# Bounded tokenizer qualification process

The dedicated worker imports qualifier R3 and disables model dispatch through that helper. It accepts the existing supervisor's config envelope, limits stdin to 1 MiB and stdout to 8 MiB, retains exception results, and returns failure for incomplete qualification.

The wrapper reuses the reviewed Linux process-group supervisor. Its maximum execution deadline is ten minutes, followed by at most 150 seconds cancellation grace and five seconds local process-group settlement checking. It always attempts settlement after generation returns or fails. Success requires exit zero, absent local process group, no forced cleanup or cancellation, and a complete twelve-row tokenizer-only report. Failures preserve the returned measurement report and process settlement in error.result. No remote completion is claimed.

Six tests use real subprocesses to check success after close, retained failure evidence, deadline termination, parent cancellation, malformed input rejection through the actual worker before provider access, and deadline bounds. Together with qualifier R3, fourteen scoped tests pass. These tests make no provider or evaluator calls.

## Construction and operations

Product frontier: independent review of R3 and this process wrapper. The next operational stage needs an exact qualifier source freeze and reviewed invocation with fresh disjoint evidence roots, current D:/WSL capacity admission and credential configuration. Source and evidence quotas remain owned by comparison storage R2. This process API does not itself freeze sources or grant live admission.

A killed child may return no report: that case is explicitly incomplete, never zero-cost success. Persisted per-slot journals remain evidence for recovery. Initial tokenizer qualification is not benchmark quality or savings evidence.

## Open Questions

Coordinator owns exact source freeze, bounded live command, retention and cleanup after evidence verification, and subsequent production review. Independent process review is pending. Full twelve-outcome model generation, scoring and untouched confirmation remain outstanding.
