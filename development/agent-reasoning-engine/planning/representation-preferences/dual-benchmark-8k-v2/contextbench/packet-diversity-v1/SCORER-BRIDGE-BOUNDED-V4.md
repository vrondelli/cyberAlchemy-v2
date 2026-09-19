# Native evaluator startup correction

The original recovered-v3 evaluation failed on its first planning subprocess, before any native scores. Its report remains failed/inconclusive and unchanged. Repeating the exact sandbox launch against the same failed prediction reproduced exit 2, stdout 0 bytes, stderr 102 bytes and SHA256 c2d368c663043c58fbce21bf540f1d37e614c010c778366244808dec6c8ec2bc. Private plan stdout was never printed.

A separate Git-only probe established the cause: native source verification invokes `git rev-parse HEAD`, which opens `/dev/null` for reading and writing. The v3 read-only root mount prevented that open. Git exited 128 with 77 stderr bytes, followed by the Python bridge's 25-byte generic failure marker. This is evaluator infrastructure failure, not benchmark counterevidence.

The additive scorer-bridge-bounded-v4.mjs differs from frozen v3 only in the bubblewrap command and this documentation reference: `--dev-bind /dev/null /dev/null` permits use of the null character device. The root filesystem remains read-only and network remains isolated. No writable directory, host data file, shared Git cache, parser installation, or generic writable /dev mount is introduced. The pinned Python evaluator, native metric semantics, prediction/reference validation, source materializer, output guard and all call/cost criteria remain unchanged.

## Validation

Nine synthetic tests pass, including the inherited metric-equivalence/storage/sandbox/privacy suite and a new actual local Git startup regression. The new test confirms Git HEAD verification succeeds inside the sandbox, `/dev/null` accepts discarded bytes, host file writes still fail, and the synthetic Git cache remains unchanged. An independent Git-only probe against the configured pinned upstream also succeeded with stderr zero after the device correction; no gold access was needed for that proof. No actual scoring rerun was performed during this amendment.

## Open Questions

Independent exact-hash review and an explicitly new evaluator stage are required before retrying native evaluation. The original failed report remains evidence. This correction cannot establish quality or efficiency results and makes no model calls.
