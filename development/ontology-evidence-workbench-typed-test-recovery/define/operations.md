# Operations: OEW Typed-Test Recovery

## RunTypedGate

**Actor:** private OEW builder

Input: admitted binding, exact file list/count, injected command runner, admitted
failure-evidence destination.

Rules:

1. Invoke the focused typed command exactly once.
2. On exit zero, perform exact discovery and continue without failure evidence.
3. On nonzero, stop later commands, preserve the transient result, and invoke
   `WriteFailureEvidence` before cleanup.
4. Never turn diagnostic success into build success.

Errors: `TYPED_TESTS_FAILED`, `FAILURE_EVIDENCE_PERSIST_FAILED`, and the
existing cleanup blocker remain distinct.

## WriteFailureEvidence

**Actor:** private OEW builder

Algorithm:

1. Validate the normalized, contained, collision-reject destination.
2. Allowlist command identity and candidate inputs.
3. Hash original streams; redact and bound text with deterministic head/tail
   truncation; omit environment and absolute temporary paths.
4. Create exactly one schema-valid artifact exclusively.
5. Re-read, digest, secret-scan, and return one reference.
6. If any step fails, emit `FAILURE_EVIDENCE_PERSIST_FAILED`; cleanup still runs.

## PrepareCompatibilityDecision

**Actor:** Invoke decision-handoff author

Record two owner-selectable branches without choosing one:

1. Test-side repair: retain Node and replace direct DOM construction with an
   appropriately bounded test fixture; browser evidence remains separate.
2. Config-side repair: supply an admitted DOM-capable environment with exact
   lockfile/dependency/runtime boundaries and no hidden network authority.

The packet includes frozen-lockfile evidence, write-scope consequences,
validation obligations, rejection conditions, and the requirement for a later
Decision Gate plus Invoke Refresh admission.
