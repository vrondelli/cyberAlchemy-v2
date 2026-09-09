# Events: OEW Typed-Test Recovery

## TypedGateFailed

Produced when the focused typed command exits nonzero. Carries command id,
exit code, gate, issue, and attempt identity; it is not a retry request.

## FailureEvidencePersisted

Produced after exclusive write, re-read, digest, bounds, redaction, and secret
checks pass. Carries only `FailureEvidenceReference`.

## FailureEvidenceUnavailable

Produced when expected diagnostics are empty, invalid, unsafe, or cannot be
persisted. It forces a stronger blocker and never permits success.

