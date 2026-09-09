# Luna whole-system build: incomplete experiment

Luna authored all seven files of Memory Observatory: shared core, persistent JSON
store, loopback HTTP service, CLI, direct model-authored tests and usage guide.
Candidate: `attempts/v1-summary-1/candidate/`. No parent-authored implementation
repairs were made. No dependencies need installing. Run the README commands with
Node 26.8.1 from the candidate directory, using an owned local data file.

The plain-summary arm's first candidate passed all **10/10 frozen independent
functional checks**, including API/CLI interoperability, product/participant
isolation, history, compare-and-swap revisions, disable behavior, explain
projections, malformed input, corrupt storage, and restart persistence.

This is not a completed or approved product. Independent review reproduced two
contract defects: a null revision body returns 500 rather than validation 400;
missing scoped history returns 200 rather than missing-lesson 404. Model-authored
tests also require repair; see MODEL-TESTS-post-stop.json. The original test-runner
invocation failed at Node test discovery before executing candidate tests. A
separate direct execution of the identical node:test module under the same
isolation and filesystem permissions provides the actual model-test result.
The original frozen acceptance receipt remains unchanged.

Code review: HTTP and CLI share core/store logic; writes validate candidate state
before a same-directory temporary-file rename; old events are preserved; scope
filtering and loopback binding are explicit; README covers every command. The
store has no fsync, so the exercised process-restart persistence must not become a
power-loss durability claim. Single-writer operation remains an explicit limit.
The failing explain test constructs lessons without required normalized arrays;
it also expects only lesson a in items while its own dispositions mark c applicable.

## Credit stop

The one completed Luna response took **283.1 seconds**, with 11,912 input tokens
and 14,317 output tokens (including 5,305 reasoning output tokens). Its conservative
usage estimate is **0.50396 credits**. The shared account snapshot fell from
**405.85071 to 215.72314 credits**, a **190.12757-credit** difference. The runner
therefore stopped at the configured 40-credit account-drop guard before any
repair, ARE-arm call or v2 call. No paid call was retried.

The shared balance difference is not an attributable Luna charge. It may include
this coordinating session, other activity or delayed accounting; this run does
not isolate those contributions. Consequently the 40-credit client-side guard
was not a server-enforced spending cap, and no claim that total experiment cost
stayed below 40 is justified. Evaluating the already returned candidate made no
additional experimental model calls.

## Remaining work

Product construction: repair the two API cases and model test, then complete the
ARE treatment and reveal the pre-frozen expiry/migration change to both arms.
Operational support: the experiment owner must first establish an accounting
method that includes controller usage and isolates per-run spend. The unexplained
shared-balance movement blocks further paid calls, not local prototype inspection.
Approval, integration and publication remain deferred owner decisions.

No comparison of summary versus ARE can be made: only the summary build ran.
Even a completed pair would be one-system exploratory evidence, not a statistically
replicated result, native context-compaction test or autonomous learning proof.
