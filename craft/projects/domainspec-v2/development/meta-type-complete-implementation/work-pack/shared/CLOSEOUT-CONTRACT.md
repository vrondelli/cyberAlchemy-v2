# Shared SWU Closeout Contract

Every SWU receipt must contain:

- SWU ID, status, accountable owner, executor, and timestamps;
- immutable input paths and digests;
- exact write scope and observed changed paths;
- exact commands, tool versions, exit codes, and discriminating outputs;
- positive, negative, unsupported, and not-applicable accounting;
- raw native evidence references and redaction posture;
- gate verdict, claim ceiling, blockers, and residue owner;
- dirty-worktree overlap result;
- Invoke Refresh result;
- Task Session closeout result for implementation mutations;
- Continuation Router decision and next eligible SWU;
- evidence synchronization receipt.

A receipt is invalid if it omits a failed command, converts unsupported to skipped/pass, reports an unjoined lane as complete, or claims admission/release/deployment without the corresponding external owner receipt.

## Freshness

Before executing a successor, recompute all predecessor input and output digests. Drift blocks and routes to Invoke Refresh; it is not patched opportunistically.

## Validation ordering

Run focused unit/fixture checks first, then integration/generation checks, then scoped whitespace/link checks, then the declared broader suite. A broad green suite cannot replace an exact-cause negative witness.

