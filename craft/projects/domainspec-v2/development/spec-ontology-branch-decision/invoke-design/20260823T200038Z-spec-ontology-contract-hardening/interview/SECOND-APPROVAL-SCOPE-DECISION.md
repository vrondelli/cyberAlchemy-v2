# Second-Approval Scope Decision

Status: verifier-only topology selected; exact contract and direct acceptance pending.

Decision ID: `DEC-DSV2-SPEC-ONTOLOGY-SECOND-APPROVAL-SCOPE-001`

Selected option: `C-independent-structural-verifier-no-semantic-veto`

## Decision

Rondelli owns semantic and governance decisions through separately scoped owner
roles. Victor Boscaro is the independent structural verifier.

Victor checks identity evidence, current role assignments, exact hashes, scope,
non-scope, timestamps, supersession, currentness, and claim ceilings. Missing,
stale, mismatched, or scope-expanding evidence blocks admission.

Victor does not accept or reject claim meaning, rewrite ontology semantics,
decide obligation discharge, or authorize promotion or publication. A verifier
block means the evidence package is structurally inadmissible; it does not mean
Rondelli's semantic decision is wrong.

The next decision selects whether Victor performs every verification manually,
governs an automated checker, or uses a hybrid mode.
