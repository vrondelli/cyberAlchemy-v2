# Non-Vacuity Skeptic Return

Verdict: **BOUNDED REPAIR** to the proposal, admissible for research findings only if the writer states that behavior is not yet demonstrated. Current builder tests are static and do not drive the actual nonzero `typed-tests` branch; `command()` directly calls `execFile`, so no deterministic injected seam exists.

Smallest future executable contract, owned by the private OEW builder and tests:

- Add a narrow injected command-runner seam; production defaults to current `command()`.
- Inject exactly one `typed-tests` result with exit 1, deterministic failing file/test identity, `ReferenceError: document is not defined`, a deliberate secret marker, and streams larger than the ceiling.
- Require one invocation, zero following commands, typed BLOCK, no success outputs, a digest-bound artifact outside workroot, allowlisted command identity, bounded head-and-tail text with original sizes/digests, secret/environment exclusion, truncation, attempts used one, retry false, and absent workroot/store.

Required passing control and isolated negatives:

1. pass emits the normal handle, no failure artifact, one invocation, cleanup;
2. empty diagnostics emits a stronger missing-evidence blocker;
3. oversized output truncates while cleanup remains mandatory;
4. injected tokens/environment never persist; leakage blocks;
5. relative, absolute, normalized, or symlink escape rejects before invocation;
6. cleanup failure emits a distinct blocker and never treats retained source as evidence;
7. evidence-writer failure emits `FAILURE_EVIDENCE_PERSIST_FAILED`, no success, one attempt.

KILL renaming the generic error, retaining only hashes, retaining the failed workspace, weakening cleanup, using another build/network attempt, or allowing evidence/cleanup failure to become success.

The prevention candidate is not implemented or passing. Findings may preserve this as mandatory later acceptance evidence; they must not claim non-vacuity is already demonstrated.
